from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('perfil/amigos/', views.lista_amigos, name='lista_amigos'),
    path('perfil/<int:id>/', views.ver_perfil, name='ver_perfil'),
    path('get_amigos_count_ajax/', views.get_amigos_count_ajax, name='get_amigos_count_ajax'),
    path('editar_perfil_ajax/', views.editar_perfil, name='editar_perfil_ajax'),
]
