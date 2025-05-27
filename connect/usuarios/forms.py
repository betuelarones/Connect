# usuarios/forms.py
from django import forms
from .models import Usuario
import re

class UsuarioForm(forms.ModelForm):
    class Meta:
        model = Usuario
        fields = ['nombres', 'apellidos', 'correo', 'password', 'direccion']
        widgets = {
            'password': forms.PasswordInput(),
        }

    def clean_correo(self):
        correo = self.cleaned_data['correo']
        if Usuario.objects.filter(correo=correo).exists():
            raise forms.ValidationError("Este correo ya está registrado.")
        return correo

    def clean_password(self):
        password = self.cleaned_data['password']
        # Validación simple de contraseña segura
        if len(password) < 8 or not re.search(r"[A-Z]", password) or not re.search(r"\d", password):
            raise forms.ValidationError("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.")
        return password
