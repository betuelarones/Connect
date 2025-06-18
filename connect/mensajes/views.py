from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from .models import Mensaje
from usuarios.models import Usuario
from .structures import ListaMensajes
from amistades.models import Amistad

@login_required
def seccion_mensajes(request):
    return render(request, 'mensajes.html')

@login_required
def ver_conversacion(request, usuario_id):
    usuario_actual = request.user
    otro_usuario = get_object_or_404(Usuario, id=usuario_id)

    # Obtener todos los mensajes entre los dos usuarios
    mensajes_qs = Mensaje.objects.filter(
        Q(emisor=usuario_actual, receptor=otro_usuario) |
        Q(emisor=otro_usuario, receptor=usuario_actual)
    ).order_by('fecha_envio')

    # Usar la estructura de lista doblemente enlazada
    lista_mensajes = ListaMensajes()
    for mensaje in mensajes_qs:
        lista_mensajes.insertar_mensaje(mensaje)

    # No se define un límite: se cargan todos
    todos_los_mensajes = []
    nodo = lista_mensajes.obtener_primero()

    while nodo:
        todos_los_mensajes.append(nodo.mensaje)
        nodo = nodo.siguiente

    return render(request, 'mensajes/conversacion.html', {
        'mensajes': todos_los_mensajes,
        'otro_usuario': otro_usuario,
    })


@login_required
def lista_amigos_json(request):
    usuario = request.user

    amistades = Amistad.objects.filter(
        aceptada=True
    ).filter(
        Q(solicitante=usuario) | Q(receptor=usuario)
    )

    amigos = [
        amistad.receptor if amistad.solicitante == usuario else amistad.solicitante
        for amistad in amistades
    ]

    # Quitar duplicados por ID
    amigos_unicos = []
    vistos = set()
    for amigo in amigos:
        if amigo.id not in vistos:
            amigos_unicos.append(amigo)
            vistos.add(amigo.id)

    # Serialización básica
    data = [
        {
            'id': amigo.id,
            'nombre': f"{amigo.nombres} {amigo.apellidos}",
            'avatar': f"{amigo.nombres[0]}{amigo.apellidos[0]}" if amigo.nombres and amigo.apellidos else "U"
        }
        for amigo in amigos_unicos
    ]

    return JsonResponse({'amigos': data})

@login_required
def obtener_mensajes(request, usuario_id):
    usuario_actual = request.user
    otro_usuario = get_object_or_404(Usuario, id=usuario_id)

    mensajes = Mensaje.objects.filter(
        Q(emisor=usuario_actual, receptor=otro_usuario) |
        Q(emisor=otro_usuario, receptor=usuario_actual)
    ).order_by('fecha_envio')

    mensajes_json = [
        {
            'emisor_id': m.emisor.id,
            'contenido': m.contenido,
            'fecha': m.fecha_envio.strftime('%Y-%m-%d %H:%M'),
        }
        for m in mensajes
    ]
    return JsonResponse({'mensajes': mensajes_json})