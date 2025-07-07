from django.urls import path
from . import views

urlpatterns = [
    path('ver/', views.ver_historias, name='ver_historias'),
    path('publicar/', views.publicar_historia, name='publicar_historia'),
]
