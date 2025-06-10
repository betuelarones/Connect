from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.contrib.auth import get_user_model
from amistades.models import Amistad

User = get_user_model()

@login_required
def ver_perfil(request, usuario_id):
    usuario = get_object_or_404(User, id=usuario_id)
    return render(request, 'perfil.html', {
        'usuario': usuario
    })

@login_required
@login_required
def lista_amigos(request):
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

    # Eliminar duplicados manteniendo el orden
    vistos = set()
    amigos_unicos = []
    for amigo in amigos:
        if amigo.id not in vistos:
            amigos_unicos.append(amigo)
            vistos.add(amigo.id)

    return render(request, 'amigos.html', {'amigos': amigos_unicos})
