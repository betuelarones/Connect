from django.http import HttpResponse
from django.shortcuts import render, redirect

from .forms import UsuarioForm
from .models import Usuario



# Create your views here.
def principal(request):
    nombre = request.session.get('usuario_nombre', 'Invitado')
    return render(request, 'index.html', {'nombre': nombre})

def login(request):
    if request.method == 'POST':
        correo = request.POST['correo']
        password = request.POST['password']
        try:
            usuario = Usuario.objects.get(correo=correo, password=password)
            request.session['usuario_nombre'] = usuario.nombres  # <- Aquí lo guardas
            return redirect('index')
        except Usuario.DoesNotExist:
            return render(request, 'login.html', {'error': 'Correo o contraseña incorrectos.'})
    return render(request, 'login.html')

def registrar_usuario(request):
    if request.method == 'POST':
        form = UsuarioForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')  # o la ruta que definas
    else:
        form = UsuarioForm()
    return render(request, 'register.html', {'form': form})

def buscar_usuarios(request):
    query = request.GET.get('q', '')
    resultados = Usuario.objects.filter(nombres__icontains=query)
    return render(request, 'resultados_busqueda.html', {'resultados': resultados, 'query': query})