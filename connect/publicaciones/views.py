# usuarios/views.py
import json  # <--- ¡NUEVA IMPORTACIÓN!
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.contrib.humanize.templatetags import humanize
from django.views.decorators.http import require_POST  # <--- ¡NUEVA IMPORTACIÓN!
from django.views.decorators.csrf import csrf_exempt  # <--- ¡NUEVA IMPORTACIÓN! (TEMPORAL: QUITAR EN PRODUCCIÓN)


# Importamos los modelos de Django para interactuar con la BD
from publicaciones.models import Publicacion as PublicacionDB, Reaccion as ReaccionDB, Comentario as ComentarioDB
# Importamos la utilidad que maneja la lista enlazada en memoria
from .utils import obtener_lista_publicaciones


@login_required
@require_POST  # Asegura que esta vista solo acepta solicitudes POST
def publicar_ajax(request):
    # Esta vista ya usa request.POST porque el JS la llama con FormData
    contenido = request.POST.get("contenido", "").strip()
    archivo_subido = request.FILES.get("archivo")  # Nombre de tu input file es 'archivo'
    tipo = "texto"

    if archivo_subido:  # Si hay un archivo subido
        nombre_archivo = archivo_subido.name.lower()
        if nombre_archivo.endswith((".jpg", ".jpeg", ".png", ".gif")):
            tipo = "imagen"
        elif nombre_archivo.endswith((".mp4", ".webm", ".avi", ".mov")):
            tipo = "video"

    if not contenido and not archivo_subido:  # Ambos vacíos
        return JsonResponse({"ok": False, "error": "Debes añadir contenido o un archivo."}, status=400)

    try:
        # 1. Guarda la publicación en la base de datos (¡persistente!)
        publicacion_db_obj = PublicacionDB.objects.create(
            autor=request.user,  # Asigna el objeto User autenticado
            contenido=contenido,
            tipo=tipo,
            archivo=archivo_subido  # Django FileField se encarga de guardar el archivo físico
        )

        # 2. Agrega la nueva publicación a la lista enlazada en memoria
        lista_publicaciones = obtener_lista_publicaciones()
        lista_publicaciones.agregar(publicacion_db_obj)  # Le pasas el objeto del modelo de Django

        return JsonResponse(
            {"ok": True, "mensaje": "Publicado correctamente.", "publicacion_id": publicacion_db_obj.id})
    except Exception as e:
        print(f"Error al guardar la publicación: {e}")
        return JsonResponse({"ok": False, "error": f"Error al guardar la publicación: {str(e)}"}, status=500)

    # El return al final para "Método no permitido" ya no es necesario si usas @require_POST


@login_required
def obtener_publicaciones(request):

    # Esta vista no es POST, no necesita @require_POST
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'No autorizado'}, status=401)

    lista_publicaciones = obtener_lista_publicaciones()  # Obtiene la lista enlazada (cargada de BD)
    publicaciones_para_json = lista_publicaciones.to_list_for_json()  # Prepara los datos con sus pilas

    for post in publicaciones_para_json:
        post['es_autor'] = post.get('autor_id') == request.user.id

    return JsonResponse({'posts': publicaciones_para_json})


@login_required
@require_POST  # Asegura que esta vista solo acepta solicitudes POST
@csrf_exempt  # <--- ¡ADVERTENCIA: QUITAR EN PRODUCCIÓN! Solo para pruebas de API
def agregar_comentario(request, publicacion_id):
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'error': 'Debes iniciar sesión para comentar.'}, status=401)

    try:
        # === CAMBIO CLAVE: Decodificar el JSON del cuerpo de la solicitud ===
        data = json.loads(request.body)
        contenido = data.get("contenido", "").strip()
        # ========================================================================
    except json.JSONDecodeError:
        return JsonResponse({"ok": False, "error": "Formato JSON inválido."}, status=400)

    if not contenido:
        return JsonResponse({"ok": False, "error": "El comentario no puede estar vacío."}, status=400)

    try:
        # 1. Busca la publicación en la base de datos
        publicacion_db = PublicacionDB.objects.get(id=publicacion_id)

        # 2. Guarda el comentario en la base de datos
        comentario_db_obj = ComentarioDB.objects.create(
            publicacion=publicacion_db,
            autor=request.user,
            contenido=contenido
        )

        # 3. Actualiza la pila de comentarios en memoria de la publicación
        # Nota: La lógica de la lista enlazada en memoria con pilas es una implementación
        # específica que podría requerir recargar la publicación o la lista completa
        # si la memoria no está sincronizada con la base de datos.
        # Por ahora, se mantiene tu lógica original aquí.
        lista_publicaciones = obtener_lista_publicaciones()
        nodo_publicacion = None
        actual = lista_publicaciones.cabeza
        while actual:
            if str(actual.dato.id) == str(publicacion_id):
                nodo_publicacion = actual
                break
            actual = actual.siguiente

        if nodo_publicacion:
            nodo_publicacion.pila_comentarios.push(comentario_db_obj)
        else:
            print(
                f"Advertencia: Publicación {publicacion_id} no encontrada en la lista enlazada en memoria para añadir comentario.")

        return JsonResponse({"ok": True, "mensaje": "Comentario agregado.", "comentario": {
            'id': comentario_db_obj.id,
            'autor': f"{request.user.nombres or ''} {request.user.apellidos or ''}".strip() or request.user.username,
            'contenido': comentario_db_obj.contenido,
            'fecha': humanize.naturaltime(comentario_db_obj.fecha_creacion),
        }})

    except PublicacionDB.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Publicación no encontrada."}, status=404)
    except Exception as e:
        print(f"Error al agregar comentario: {e}")
        return JsonResponse({"ok": False, "error": f"Error al agregar comentario: {str(e)}"}, status=500)


@login_required
@require_POST  # Asegura que esta vista solo acepta solicitudes POST
@csrf_exempt  # <--- ¡ADVERTENCIA: QUITAR EN PRODUCCIÓN! Solo para pruebas de API
def agregar_reaccion(request, publicacion_id):
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'error': 'Debes iniciar sesión para reaccionar.'}, status=401)

    try:
        # === CAMBIO CLAVE: Decodificar el JSON del cuerpo de la solicitud ===
        data = json.loads(request.body)
        tipo_reaccion = data.get("tipo", "").strip()
        # ========================================================================
    except json.JSONDecodeError:
        return JsonResponse({"ok": False, "error": "Formato JSON inválido."}, status=400)

    if not tipo_reaccion:
        return JsonResponse({"ok": False, "error": "Tipo de reacción inválido."}, status=400)

    try:
        # 1. Busca la publicación en la base de datos
        publicacion_db = PublicacionDB.objects.get(id=publicacion_id)

        # 2. Lógica para agregar/quitar/actualizar reacción en la base de datos
        reaccion, created = ReaccionDB.objects.get_or_create(
            publicacion=publicacion_db,
            autor=request.user,
            defaults={'tipo': tipo_reaccion}  # Si se crea, usa este tipo
        )

        mensaje = ""
        if not created:
            # Si no se creó (ya existía una reacción de este autor a esta publicación)
            if reaccion.tipo == tipo_reaccion:
                # Si el tipo de reacción es el mismo, el usuario está quitando la reacción
                reaccion.delete()
                mensaje = f'Reacción "{tipo_reaccion}" eliminada.'
            else:
                # Si el tipo de reacción es diferente, el usuario está cambiando su reacción
                reaccion.tipo = tipo_reaccion
                reaccion.save()
                mensaje = f'Reacción actualizada a "{tipo_reaccion}".'
        else:
            mensaje = f'Reacción "{tipo_reaccion}" agregada.'
        # Recalcula el total de reacciones para la publicación después de la operación
        total_reacciones = ReaccionDB.objects.filter(publicacion=publicacion_db).count()

        # 3. Lógica para actualizar la pila de reacciones en memoria (si es necesario)
        # Nota: La actualización de estructuras de datos en memoria para reflejar la DB
        # es compleja y puede llevar a inconsistencias si no se maneja cuidadosamente
        # (ej. si la lista se carga una vez y la DB cambia por fuera).
        # Para esta implementación, se asume que 'obtener_lista_publicaciones()' siempre
        # reflejará el estado de la DB o que la consistencia se maneja en otro lugar.
        # Por ahora, simplemente se mantiene tu estructura, sin cambios específicos aquí.
        lista_publicaciones = obtener_lista_publicaciones()
        nodo_publicacion = None
        actual = lista_publicaciones.cabeza
        while actual:
            if str(actual.dato.id) == str(publicacion_id):
                nodo_publicacion = actual
                break
            actual = actual.siguiente

        if nodo_publicacion:
            # Si la reacción fue agregada, la podrías añadir a la pila
            # Si fue eliminada, la podrías quitar de la pila
            # Si fue actualizada, buscarla y actualizarla
            # Esto no se implementa aquí para evitar sobrecomplicar por ahora.
            pass
        else:
            print(f"Advertencia: Publicación {publicacion_id} no encontrada en la lista enlazada en memoria para añadir reacción.")

        return JsonResponse({
            "ok": True,
            "mensaje": mensaje,
            "reaccion": {
                'id': reaccion.id if not created or (created and reaccion.id) else None, # ID solo si la reaccion existe/fue creada
                'autor': f"{request.user.nombres or ''} {request.user.apellidos or ''}".strip() or request.user.username,
                'tipo': reaccion.tipo if not created or (created and reaccion.id) else None, # Tipo solo si la reaccion existe/fue creada
                'fecha': humanize.naturaltime(reaccion.fecha_creacion) if not created or (created and reaccion.id) else None, # Fecha solo si la reaccion existe/fue creada
            },
            'total_reacciones': total_reacciones # Devuelve el total de reacciones actualizado
        })

    except PublicacionDB.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Publicación no encontrada."}, status=404)
    except IntegrityError as e:
        # Esto atraparía errores de unique_together que get_or_create podría no manejar
        # si la lógica de "defaults" no es suficiente o si hay una restricción más compleja.
        print(f"Error de integridad al agregar reacción: {e}")
        return JsonResponse({"ok": False, "error": f"Error de datos: {str(e)}"}, status=409)
    except Exception as e:
        print(f"Error general al agregar reacción: {e}")
        return JsonResponse({"ok": False, "error": f"Error al agregar reacción: {str(e)}"}, status=500)


@login_required
@require_POST
def eliminar_publicacion(request, publicacion_id):
    try:
        publicacion = PublicacionDB.objects.get(id=publicacion_id, autor=request.user)
        publicacion.delete()

        try:
            lista_publicaciones = obtener_lista_publicaciones()
            if lista_publicaciones:
                lista_publicaciones.eliminar(publicacion.id)
        except Exception as e:
            print(f"[WARNING] Error al eliminar de lista enlazada en memoria: {e}")

        return JsonResponse({"ok": True, "mensaje": "Publicación eliminada."})
    except PublicacionDB.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Publicación no encontrada o no tienes permisos."}, status=404)
    except Exception as e:
        print(f"[ERROR] Error al eliminar publicación: {e}")
        return JsonResponse({"ok": False, "error": f"Error al eliminar publicación: {str(e)}"}, status=500)


@login_required
def listar_mis_publicaciones_ajax(request):
    """
    Vista AJAX para obtener las publicaciones del usuario autenticado.
    Retorna HTML renderizado de las publicaciones.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'No autorizado'}, status=401)

    mis_publicaciones_db = PublicacionDB.objects.filter(autor=request.user).order_by('-fecha_publicacion') # Ya corregimos '-fecha_creacion' a '-fecha_publicacion'

    from django.template.loader import render_to_string

    # === CAMBIO CRÍTICO AQUÍ: AJUSTAR LA RUTA DEL TEMPLATE ===
    html_publicaciones = render_to_string(
        'mis_publicaciones_list.html', # <--- ¡CAMBIADO A ESTO!
        {'publicaciones': mis_publicaciones_db, 'request': request}
    )
    return JsonResponse({'html': html_publicaciones})