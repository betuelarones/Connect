from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import get_user_model
from amistades.models import Amistad
from .forms import EditarPerfilForm
from .models import Usuario

User = get_user_model()




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
    vistos = set()
    amigos_unicos = []
    for amigo in amigos:
        if amigo.id not in vistos:
            amigos_unicos.append(amigo)
            vistos.add(amigo.id)

    return render(request, 'amigos.html', {'amigos': amigos_unicos})

@login_required
def get_amigos_count_ajax(request):
    user = request.user
    amistades = Amistad.objects.filter(
        aceptada=True
    ).filter(
        Q(solicitante=user) | Q(receptor=user)
    )
    amigos = [
        amistad.receptor if amistad.solicitante == user else amistad.solicitante
        for amistad in amistades
    ]
    vistos = set()
    amigos_unicos = []
    for amigo in amigos:
        if amigo.id not in vistos:
            amigos_unicos.append(amigo)
            vistos.add(amigo.id)

    amigos_count = len(amigos_unicos)

    return JsonResponse({'amigos_count': amigos_count})




@login_required
def editar_perfil(request):
    user = request.user

    if request.method == 'POST':
        form = EditarPerfilForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': 'Perfil actualizado correctamente.',
                'user_data': {
                    'nombres': user.nombres,
                    'apellidos': user.apellidos,
                    'carrera': user.carrera,
                    'sede': user.sede,
                    'ciclo': user.ciclo,
                    'cumpleaños': user.cumpleaños.strftime('%Y-%m-%d') if user.cumpleaños else None,
                    'descripcion': user.descripcion,
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors,
                'message': 'Hay errores en el formulario.',
                'html_form': render(request, 'form_editar_perfil.html', {'form_editar': form}).content.decode('utf-8')
            }, status=400)

    else:
        form = EditarPerfilForm(instance=user)
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'html_form': render(request, 'form_editar_perfil.html', {'form_editar': form}).content.decode('utf-8')
            })
        else:
            return render(request, 'usuarios/perfil.html', {'form_editar': form, 'usuario': user})


def ver_perfil(request, id):
    usuario = get_object_or_404(Usuario, id=id)
    return render(request, 'usuarios/perfil.html', {'usuario': usuario})