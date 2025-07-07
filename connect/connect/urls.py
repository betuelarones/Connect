"""
URL configuration for connect project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
import principal.views
from principal import views
from principal import views as principal_views
#from usuarios import views as usuario_views
from django.contrib.auth.views import LogoutView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.login, name='login'),
    path('principal/', views.principal, name='principal'),
    path('login/', views.login, name='login'),
    path('register/', views.registro_usuario, name='register'),
    path('amistades/', include('amistades.urls')),
    path('usuarios/', include('usuarios.urls')),
    path('publicaciones/', include('publicaciones.urls', namespace='publicaciones')),
    path('logout/', LogoutView.as_view(next_page='login'), name='logout'),
    path('mensajes/', include('mensajes.urls', namespace='mensajes')),
    path('historias/', include('historias.urls')),
]
if settings.DEBUG: # This ensures it only runs when DEBUG is True
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)