from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from principal.forms import UsuarioForm
from usuarios.models import Usuario
from amistades.models import Amistad
from django.contrib.auth import authenticate, login as auth_login
from usuarios.forms import RegistroUsuarioForm
from datetime import date




def principal(request):
    return render(request, 'principal.html')

def login(request):
    if request.method == 'POST':
        correo = request.POST['correo']
        password = request.POST['password']
        user = authenticate(request, username=correo, password=password)
        if user is not None:
            auth_login(request, user)
            return redirect('principal')
        else:
            return render(request, 'login.html', {'error': 'Correo o contraseña incorrectos.'})
    return render(request, 'login.html')


def registro_usuario(request):
    days = list(range(1, 32))
    current_year = date.today().year
    years = list(range(current_year, current_year - 101, -1))

    if request.method == 'POST':
        form = RegistroUsuarioForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            return redirect('login')
        else:
            pass
    else:
        form = RegistroUsuarioForm()

    return render(request, 'register.html', {'form': form, 'days': days, 'years': years})

