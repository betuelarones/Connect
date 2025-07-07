from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import models

from .models import Amistad
from .utils.grafo import GrafoUsuarios

User = get_user_model()

@login_required
@require_POST
def enviar_solicitud(request, usuario_id):
    receptor = get_object_or_404(User, id=usuario_id)
    solicitante = request.user

    if solicitante == receptor:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': "No puedes enviarte solicitud a ti mismo."}, status=400)
        messages.error(request, "No puedes enviarte solicitud a ti mismo.")
        return redirect('amistades:buscar_usuarios')

    amistad_existente = Amistad.objects.filter(
        solicitante=solicitante,
        receptor=receptor
    ).exists()

    if amistad_existente:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': "Ya enviaste una solicitud a este usuario."})
        messages.info(request, "Ya has enviado solicitud a este usuario.")
    else:
        Amistad.objects.create(solicitante=solicitante, receptor=receptor)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        messages.success(request, "Solicitud enviada correctamente.")
    return redirect('amistades:buscar_usuarios')

@login_required
def aceptar_solicitud(request, amistad_id):
    amistad = get_object_or_404(Amistad, id=amistad_id)

    if amistad.receptor != request.user:
        messages.error(request, "No tienes permiso para aceptar esta solicitud.")
        return redirect('amistades:buscar_usuarios')
    amistad.aceptada = True
    amistad.fecha_aceptacion = timezone.now()
    amistad.save()
    messages.success(request, "Solicitud aceptada correctamente.")
    return redirect('amistades:amigos')

@login_required
def solicitudes_pendientes(request):
    pendientes = Amistad.objects.filter(receptor=request.user, aceptada=False)
    return render(request, 'solicitudes_pendientes.html', {
        'solicitudes': pendientes
    })

@login_required
@require_POST
def cancelar_solicitud(request, usuario_id):
    amistad = Amistad.objects.filter(
        solicitante=request.user,
        receptor_id=usuario_id,
        aceptada=False
    ).first()

    if amistad:
        amistad.delete()
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        messages.success(request, "Solicitud cancelada correctamente.")
    else:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'No se encontró solicitud.'}, status=404)
        messages.error(request, "No se encontró una solicitud pendiente para cancelar.")

    return redirect('amistades:buscar_usuarios')

@login_required
def buscar_usuarios(request):
    query = request.GET.get('q', '')
    resultados = User.objects.filter(is_staff=False, is_superuser=False).exclude(id=request.user.id)
    if query:
        resultados = resultados.filter(nombres__icontains=query)

    solicitudes = Amistad.objects.filter(solicitante=request.user)
    enviados = {amistad.receptor.id: True for amistad in solicitudes}

    return render(request, 'buscar_usuarios.html', {
        'resultados': resultados,
        'query': query,
        'solicitudes_enviadas': enviados
    })


User = get_user_model()
@login_required
@require_POST
def rechazar_solicitud(request, amistad_id):
    amistad = get_object_or_404(Amistad, id=amistad_id)

    if amistad.receptor != request.user:
        return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)

    amistad.delete()
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'success': True})

    messages.success(request, "Solicitud rechazada correctamente.")
    return redirect('amistades:solicitudes_pendientes')




@login_required
def sugerencias_amigos_en_comun(request):
    grafo = GrafoUsuarios()
    grafo.construir_desde_db()

    nodo_usuario = grafo.obtener_nodo(request.user)
    if not nodo_usuario:
        return render(request, 'sugerencias.html', {
            'sugerencias': [],
        })
    sugerencias = []
    amistades_aceptadas = Amistad.objects.filter(
        (models.Q(solicitante=request.user) | models.Q(receptor=request.user)),
        aceptada=True
    )
    amigos = set()
    for amistad in amistades_aceptadas:
        if amistad.solicitante == request.user:
            amigos.add(amistad.receptor.id)
        else:
            amigos.add(amistad.solicitante.id)

    # Solicitudes enviadas por el usuario actual
    solicitudes_enviadas_qs = Amistad.objects.filter(
        solicitante=request.user,
        aceptada=False
    )
    solicitudes_enviadas = {a.receptor.id for a in solicitudes_enviadas_qs}

    for amigo in nodo_usuario.amigos:
        for amigo_de_amigo in amigo.amigos:
            if amigo_de_amigo == nodo_usuario or amigo_de_amigo in nodo_usuario.amigos:
                continue

            usuario_obj = amigo_de_amigo.usuario
            usuario_id = usuario_obj.id

            # Verifica si ya está en la lista de sugerencias
            existente = next((s for s in sugerencias if s['usuario'].id == usuario_id), None)
            if existente:
                existente['en_comun'] += 1
                continue

            # Determinar el estado
            if usuario_id in amigos:
                estado = 'amigos'
            elif usuario_id in solicitudes_enviadas:
                estado = 'cancelar'
            else:
                estado = 'agregar'

            # Agregar a la lista
            sugerencias.append({
                'usuario': usuario_obj,
                'en_comun': 1,
                'estado': estado
            })

    return render(request, 'sugerencias.html', {
        'sugerencias': sugerencias
    })
