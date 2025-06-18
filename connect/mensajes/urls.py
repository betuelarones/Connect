# mensajes/urls.py

from django.urls import path
from . import views

app_name = 'mensajes'

urlpatterns = [
    path('', views.seccion_mensajes, name='mensajes'),
    path('conversacion/<int:usuario_id>/', views.ver_conversacion, name='ver_conversacion'),
    path('amigos-json/', views.lista_amigos_json, name='amigos_json'),
    path('obtener/<int:usuario_id>/', views.obtener_mensajes, name='obtener_mensajes'),

]
