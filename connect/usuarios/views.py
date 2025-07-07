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
    """
    Vista AJAX para obtener el número de amigos del usuario logueado.
    Reutiliza la lógica de conteo de amigos de `lista_amigos`.
    """
    user = request.user
    # Reutiliza exactamente la misma lógica de `lista_amigos` para obtener los amigos únicos
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

    amigos_count = len(amigos_unicos) # Obtenemos el total de amigos únicos

    return JsonResponse({'amigos_count': amigos_count})




@login_required
def editar_perfil(request):
    user = request.user # Obtiene la instancia del usuario logueado

    if request.method == 'POST':
        # Instanciar el formulario con los datos recibidos y la instancia del usuario
        form = EditarPerfilForm(request.POST, instance=user)
        if form.is_valid():
            form.save() # Guarda los cambios en la instancia del usuario
            # Construye la respuesta JSON para el frontend si la actualización fue exitosa
            return JsonResponse({
                'success': True,
                'message': 'Perfil actualizado correctamente.',
                'user_data': {
                    'nombres': user.nombres, # Vuelve a cargar los datos del usuario DESPUÉS de guardar
                    'apellidos': user.apellidos,
                    'carrera': user.carrera,
                    'sede': user.sede,
                    'ciclo': user.ciclo,
                    'cumpleaños': user.cumpleaños.strftime('%Y-%m-%d') if user.cumpleaños else None, # Formatear la fecha
                    'descripcion': user.descripcion,
                }
            })
        else:
            # Si el formulario no es válido, devuelve los errores y el formulario HTML con errores
            return JsonResponse({
                'success': False,
                'errors': form.errors, # Los errores de validación del formulario
                'message': 'Hay errores en el formulario.',
                # Vuelve a renderizar el formulario con los errores para que el JS lo reemplace
                'html_form': render(request, 'form_editar_perfil.html', {'form_editar': form}).content.decode('utf-8')
            }, status=400) # Importante: devolver un status 400 para que el frontend maneje el error

    else: # GET request (para cargar el formulario la primera vez en el modal)
        form = EditarPerfilForm(instance=user) # Pre-rellena el formulario con los datos del usuario
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            # Si es una petición AJAX, devuelve solo el HTML del formulario en un JSON
            return JsonResponse({
                'html_form': render(request, 'form_editar_perfil.html', {'form_editar': form}).content.decode('utf-8')
            })
        else:
            # Si no es AJAX (acceso directo a la URL de edición), renderiza la página completa
            return render(request, 'usuarios/perfil.html', {'form_editar': form, 'usuario': user})


def ver_perfil(request, id):
    usuario = get_object_or_404(Usuario, id=id)
    return render(request, 'usuarios/perfil.html', {'usuario': usuario})