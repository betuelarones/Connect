from django.contrib import messages
from django.http import JsonResponse

from .algoritmos.grafo_amistades import GrafoAmistades
from .algoritmos.lista_circular import ListaCircularHistorias
from usuarios.models import Usuario
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import render, redirect
from .models import Historia
from django.contrib.auth.decorators import login_required

@login_required
def ver_historias(request):
    usuario_id = request.GET.get('usuario_id')
    ahora = timezone.now()
    hace_24_horas = ahora - timedelta(hours=24)

    # Si se pasa un usuario_id, intenta obtener ese usuario
    user = None
    if usuario_id:
        try:
            user = Usuario.objects.get(id=int(usuario_id))
        except (ValueError, Usuario.DoesNotExist):
            return JsonResponse({'historias': []})

    if user:
        # Solo mostrar historias de ese usuario
        historias = Historia.objects.filter(
            autor=user,
            fecha_creacion__gte=hace_24_horas,
            activa=True
        )
    else:
        # Mostrar mis historias + las de mis amigos (caso general)
        grafo = GrafoAmistades(request.user)
        amigos = grafo.amigos

        historias_amigos = Historia.objects.filter(
            autor__in=amigos,
            fecha_creacion__gte=hace_24_horas,
            activa=True
        )
        mi_historia = Historia.objects.filter(
            autor=request.user,
            fecha_creacion__gte=hace_24_horas,
            activa=True
        )
        historias = list(mi_historia) + list(historias_amigos)

    # Si es una petición AJAX
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = [{
            'autor': h.autor.nombres,
            'autor_id': h.autor.id,
            'contenido': h.contenido,
            'imagen': h.imagen.url if h.imagen else '',
            'fecha': h.fecha_creacion.strftime('%Y-%m-%d %H:%M')
        } for h in historias]
        return JsonResponse({'historias': data})

    lista = ListaCircularHistorias()
    for h in historias:
        lista.agregar_historia(h)

    grafo = GrafoAmistades(request.user)
    return render(request, 'principal.html', {
        'historias': lista.recorrer(),
        'amigos': grafo.amigos  # 👈 Necesario para el HTML que mostraste
    })


@login_required
def publicar_historia(request):
    if request.method == 'POST':
        contenido = request.POST.get('contenido', '').strip()
        imagen = request.FILES.get('imagen')

        if not contenido and not imagen:
            messages.error(request, "La historia no puede estar vacía.")
            return redirect('principal')

        Historia.objects.create(
            autor=request.user,
            contenido=contenido,
            imagen=imagen
        )
        return redirect('principal')

    return redirect('principal')


