from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Amistad

User = get_user_model()

@login_required
@require_POST
def enviar_solicitud(request, usuario_id):
    receptor = get_object_or_404(User, id=usuario_id)
    solicitante = request.user

    if solicitante == receptor:
        messages.error(request, "No puedes enviarte solicitud a ti mismo.")
        return redirect('amistades:buscar_usuarios')

    amistad_existente = Amistad.objects.filter(
        solicitante=solicitante,
        receptor=receptor
    ).exists()

    if amistad_existente:
        messages.info(request, "Ya has enviado solicitud a este usuario.")
    else:
        Amistad.objects.create(solicitante=solicitante, receptor=receptor)
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
def rechazar_solicitud(request, amistad_id):
    amistad = get_object_or_404(Amistad, id=amistad_id, receptor=request.user, aceptada=False)
    amistad.delete()
    return redirect('amistades:solicitudes_pendientes')
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
def cancelar_solicitud(request, usuario_id):
    amistad = Amistad.objects.filter(
        solicitante=request.user,
        receptor_id=usuario_id,
        aceptada=False
    ).first()

    if amistad:
        amistad.delete()
        messages.success(request, "Solicitud cancelada correctamente.")
    else:
        messages.error(request, "No se encontró una solicitud pendiente para cancelar.")

    return redirect('amistades:buscar_usuarios')

