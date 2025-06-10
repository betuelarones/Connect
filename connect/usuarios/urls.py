from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('perfil/<int:usuario_id>/', views.ver_perfil, name='ver_perfil'),
    path('perfil/amigos/', views.lista_amigos, name='lista_amigos'),

]
