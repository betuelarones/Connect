from django.urls import path
from . import views
from usuarios import views as usuarios_views
app_name = 'amistades'

urlpatterns = [
    path('enviar/<int:usuario_id>/', views.enviar_solicitud, name='enviar_solicitud'),
    path('cancelar/<int:usuario_id>/', views.cancelar_solicitud, name='cancelar_solicitud'),
    path('aceptar/<int:amistad_id>/', views.aceptar_solicitud, name='aceptar_solicitud'),
    path('rechazar/<int:amistad_id>/', views.rechazar_solicitud, name='rechazar_solicitud'),
    path('solicitudes/', views.solicitudes_pendientes, name='solicitudes_pendientes'),
    path('buscar/', views.buscar_usuarios, name='buscar_usuarios'),
    path('lista/', usuarios_views.lista_amigos, name='amigos'),
    path('sugerencias/', views.sugerencias_amigos_en_comun, name='sugerencias_amigos_en_comun'),

]
