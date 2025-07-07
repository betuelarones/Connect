
from django.urls import path
from . import views

app_name = 'publicaciones'

urlpatterns = [
    path("publicar/", views.publicar_ajax, name="publicar_ajax"),
    path("obtener-publicaciones/", views.obtener_publicaciones, name="obtener_publicaciones"),
    path('mis-publicaciones/ajax/', views.listar_mis_publicaciones_ajax, name='listar_mis_publicaciones_ajax'),
    path("<int:publicacion_id>/comentar/", views.agregar_comentario, name="agregar_comentario"),
    path("<int:publicacion_id>/reaccionar/", views.agregar_reaccion, name="agregar_reaccion"),
    path("<int:publicacion_id>/eliminar/", views.eliminar_publicacion, name="eliminar_publicacion"),
]
