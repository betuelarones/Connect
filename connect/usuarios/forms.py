
import re
from django import forms
from .models import Usuario, SEDE_CHOICES


CARRERA_CHOICES_BY_DEPARTMENT = {
    'Tecnología Digital': [
        ('Ingeniería de Software', 'Ingeniería de Software'),
        ('Administración de Redes y Comunicaciones', 'Administración de Redes y Comunicaciones'),
        ('Diseño y Desarrollo de Simuladores y Videojuegos', 'Diseño y Desarrollo de Simuladores y Videojuegos'),
        ('Big Data y Ciencia de Datos', 'Big Data y Ciencia de Datos'),
    ],
    'Gestión y Producción': [
        ('Producción y Gestión Industrial', 'Producción y Gestión Industrial'),
    ],
    'Minería y Procesos Químicos': [
        ('Operaciones Mineras y Metalúrgica', 'Operaciones Mineras y Metalúrgica'),
        ('Química Industrial', 'Química Industrial'),
    ],
    'Electricidad y Electrónica': [
        ('Electricidad y Electrónica Industrial', 'Electricidad y Electrónica Industrial'),
        ('Automatización Industrial', 'Automatización Industrial'),
        ('Mecatrónica Industrial', 'Mecatrónica Industrial'),
    ],
    'Mecánica': [
        ('Mantenimiento y Gestión de Plantas Industriales', 'Mantenimiento y Gestión de Plantas Industriales'),
        ('Gestión y Mantenimiento de Maquinaria Industrial', 'Gestión y Mantenimiento de Maquinaria Industrial'),
    ],
}

ALL_CARRERA_CHOICES = [('', 'Selecciona tu carrera')]
for department_careers in CARRERA_CHOICES_BY_DEPARTMENT.values():
    ALL_CARRERA_CHOICES.extend(department_careers)
ALL_CARRERA_CHOICES = list(set(ALL_CARRERA_CHOICES))
ALL_CARRERA_CHOICES.sort(key=lambda x: x[1] if x[0] != '' else '')


CICLO_CHOICES = [
    ('', 'Selecciona tu ciclo'),
    ('I', 'I'),
    ('II', 'II'),
    ('III', 'III'),
    ('IV', 'IV'),
    ('V', 'V'),
    ('VI', 'VI'),
]

class RegistroUsuarioForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label="Contraseña", required=True)
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirmar contraseña", required=True)

    sede = forms.ChoiceField(
        choices=SEDE_CHOICES,
        widget=forms.Select(attrs={'class': 'input-style'}),
        label="Seleccione su sede"
    )

    carrera = forms.ChoiceField(
        choices=ALL_CARRERA_CHOICES,
        required=False, # Si tu modelo permite que sea nulo, pon False. Si es obligatorio, True.
        label="Carrera",
        widget=forms.Select(attrs={'class': 'input-style'}) # Para que aplique tu estilo
    )

    ciclo = forms.ChoiceField(
        choices=CICLO_CHOICES,
        required=False, # Si tu modelo permite que sea nulo, pon False. Si es obligatorio, True.
        label="Ciclo",
        widget=forms.Select(attrs={'class': 'input-style'}) # Para que aplique tu estilo
    )

    cumpleaños = forms.DateField(
        required=False, # Si tu modelo permite que sea nulo, pon False. Si es obligatorio, True.
        label="Cumpleaños",
    )


    class Meta:
        model = Usuario
        fields = [
            'nombres',
            'apellidos',
            'correo',
            'sede',
            'carrera',      # Ahora incluido
            'ciclo',        # Ahora incluido
            'cumpleaños',   # Ahora incluido
        ]
        widgets = {
            'nombres': forms.TextInput(attrs={'class': 'input-style', 'placeholder': 'Nombre'}),
            'apellidos': forms.TextInput(attrs={'class': 'input-style', 'placeholder': 'Apellidos'}),
            'correo': forms.EmailInput(attrs={'class': 'input-style', 'placeholder': 'Correo electrónico'}),
        }


    def clean_correo(self):
        correo = self.cleaned_data['correo']
        if Usuario.objects.filter(correo=correo).exists():
            raise forms.ValidationError("Este correo ya está registrado.")
        return correo

    def clean_password(self):
        password = self.cleaned_data['password']
        if len(password) < 8 or not re.search(r"[A-Z]", password) or not re.search(r"\d", password):
            raise forms.ValidationError("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.")
        return password

    def clean_password2(self):
        password = self.cleaned_data.get('password')
        password2 = self.cleaned_data.get('password2')
        if password and password2 and password != password2:
            raise forms.ValidationError("Las contraseñas no coinciden")
        return password2

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class EditarPerfilForm(forms.ModelForm):

    carrera = forms.ChoiceField(
        choices=ALL_CARRERA_CHOICES,
        required=False,
        label="Carrera",
        # El widget será el <select> generado por Django
    )
    ciclo = forms.ChoiceField(
        choices=CICLO_CHOICES,
        required=False,
        label="Ciclo",
        # El widget será el <select> generado por Django
    )

    class Meta:
        model = Usuario
        fields = ['nombres', 'apellidos', 'carrera', 'sede', 'ciclo', 'cumpleaños', 'descripcion']
        widgets = {
            'nombres': forms.TextInput(attrs={'class': 'form-input'}),
            'apellidos': forms.TextInput(attrs={'class': 'form-input'}),
            'sede': forms.Select(attrs={'class': 'form-input'}),
            'cumpleaños': forms.DateInput(attrs={'type': 'date', 'class': 'form-input'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-input form-textarea', 'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if hasattr(field.widget, 'attrs'):
                current_classes = field.widget.attrs.get('class', '').split()
                if 'form-input' not in current_classes:
                    field.widget.attrs['class'] = (field.widget.attrs.get('class', '') + ' form-input').strip()
                if isinstance(field.widget, forms.Textarea) and 'form-textarea' not in current_classes:
                    field.widget.attrs['class'] = (field.widget.attrs.get('class', '') + ' form-textarea').strip()