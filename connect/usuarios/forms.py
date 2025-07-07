# En tu archivo forms.py

import re
from django import forms
from .models import Usuario, SEDE_CHOICES # Asegúrate de que SEDE_CHOICES se importe desde models.py

# --- Definición de Choices para los desplegables de Carrera y Ciclo ---
# Estas opciones son CLAVE para que Django valide los datos que vienen del HTML.

# Opciones de carrera organizadas por área (igual que en tu JS del HTML)
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

# Creamos una lista combinada de TODAS las carreras posibles para la validación de Django.
# Django necesita saber todas las opciones válidas para el campo 'carrera'.
ALL_CARRERA_CHOICES = [('', 'Selecciona tu carrera')] # Opción por defecto
for department_careers in CARRERA_CHOICES_BY_DEPARTMENT.values():
    ALL_CARRERA_CHOICES.extend(department_careers)
ALL_CARRERA_CHOICES = list(set(ALL_CARRERA_CHOICES)) # Eliminar duplicados si los hubiera
ALL_CARRERA_CHOICES.sort(key=lambda x: x[1] if x[0] != '' else '') # Opcional: ordenar alfabéticamente


# Opciones para el Ciclo (solo hasta VI)
CICLO_CHOICES = [
    ('', 'Selecciona tu ciclo'),
    ('I', 'I'),
    ('II', 'II'),
    ('III', 'III'),
    ('IV', 'IV'),
    ('V', 'V'),
    ('VI', 'VI'),
]

# --- Formulario de Registro de Usuario ---
class RegistroUsuarioForm(forms.ModelForm):
    # Campos de contraseña (no están directamente en el modelo Usuario, se manejan aparte)
    password = forms.CharField(widget=forms.PasswordInput, label="Contraseña", required=True)
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirmar contraseña", required=True)

    # Campo 'sede' (ya lo tenías, pero aseguro que use el widget y las choices correctas)
    sede = forms.ChoiceField(
        choices=SEDE_CHOICES,
        widget=forms.Select(attrs={'class': 'input-style'}),
        label="Seleccione su sede"
    )

    # --- NUEVOS CAMPOS AÑADIDOS ---
    # Campo 'carrera': Usamos ChoiceField con todas las opciones posibles para validación.
    # La lógica de filtrado por "área" la hace el JavaScript en el HTML.
    carrera = forms.ChoiceField(
        choices=ALL_CARRERA_CHOICES,
        required=False, # Si tu modelo permite que sea nulo, pon False. Si es obligatorio, True.
        label="Carrera",
        widget=forms.Select(attrs={'class': 'input-style'}) # Para que aplique tu estilo
    )

    # Campo 'ciclo': Usamos ChoiceField con las opciones I-VI.
    ciclo = forms.ChoiceField(
        choices=CICLO_CHOICES,
        required=False, # Si tu modelo permite que sea nulo, pon False. Si es obligatorio, True.
        label="Ciclo",
        widget=forms.Select(attrs={'class': 'input-style'}) # Para que aplique tu estilo
    )

    # Campo 'cumpleaños': Es un DateField. El JavaScript en el HTML se encarga de
    # juntar día, mes y año en un formato 'YYYY-MM-DD' que Django entenderá.
    cumpleaños = forms.DateField(
        required=False, # Si tu modelo permite que sea nulo, pon False. Si es obligatorio, True.
        label="Cumpleaños",
        # No necesitamos un widget específico aquí si el HTML ya maneja los 3 desplegables
        # y el input oculto. Django leerá el valor del input oculto.
    )
    # --- FIN NUEVOS CAMPOS ---


    class Meta:
        model = Usuario
        # Aquí listamos TODOS los campos del modelo que queremos en el formulario de registro.
        # 'password' y 'password2' se manejan como campos propios del formulario, no del modelo.
        # 'descripcion' se excluye como pediste.
        fields = [
            'nombres',
            'apellidos',
            'correo',
            'sede',
            'carrera',      # Ahora incluido
            'ciclo',        # Ahora incluido
            'cumpleaños',   # Ahora incluido
            # 'password' no va aquí porque lo definimos arriba explícitamente
        ]
        # Widgets para aplicar placeholders y clases a los campos de texto
        widgets = {
            'nombres': forms.TextInput(attrs={'class': 'input-style', 'placeholder': 'Nombre'}),
            'apellidos': forms.TextInput(attrs={'class': 'input-style', 'placeholder': 'Apellidos'}),
            'correo': forms.EmailInput(attrs={'class': 'input-style', 'placeholder': 'Correo electrónico'}),
            # 'sede' ya tiene su widget ChoiceField arriba
            # 'carrera' ya tiene su widget ChoiceField arriba
            # 'ciclo' ya tiene su widget ChoiceField arriba
        }

    # --- Métodos de validación personalizados ---

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

    # Método clean general para validaciones que involucren múltiples campos
    def clean(self):
        cleaned_data = super().clean()
        # Las validaciones de password ya se hacen en clean_password y clean_password2
        # Aquí podrías añadir validaciones adicionales si fuera necesario,
        # por ejemplo, que la fecha de cumpleaños no sea en el futuro, etc.
        return cleaned_data

    # Método save para guardar el usuario y hashear la contraseña
    def save(self, commit=True):
        user = super().save(commit=False) # Crea el objeto Usuario pero no lo guarda aún
        user.set_password(self.cleaned_data["password"]) # Hashea la contraseña antes de guardar
        if commit:
            user.save() # Guarda el usuario en la base de datos
        return user


# --- Formulario de Edición de Perfil (ya lo tenías, lo incluyo completo para referencia) ---
class EditarPerfilForm(forms.ModelForm):
    # La descripción ahora se maneja directamente con un widget en Meta
    # o si requiere lógica especial, se define aquí como un campo explícito.
    # Si solo quieres un textarea con clases, el widget en Meta es suficiente.

    # Si quieres que carrera y ciclo sean desplegables en la edición:
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
            # 'carrera' y 'ciclo' ya tienen sus ChoiceField definidos arriba, no necesitan widget aquí
            'sede': forms.Select(attrs={'class': 'form-input'}),
            'cumpleaños': forms.DateInput(attrs={'type': 'date', 'class': 'form-input'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-input form-textarea', 'rows': 4}), # Definido aquí
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Este bucle es excelente para asegurar que todos los campos tengan 'form-input'
        # y 'form-textarea' si son textareas.
        for field_name, field in self.fields.items():
            if hasattr(field.widget, 'attrs'):
                current_classes = field.widget.attrs.get('class', '').split()
                # Asegura que 'form-input' esté presente
                if 'form-input' not in current_classes:
                    field.widget.attrs['class'] = (field.widget.attrs.get('class', '') + ' form-input').strip()
                # Asegura 'form-textarea' para Textareas
                if isinstance(field.widget, forms.Textarea) and 'form-textarea' not in current_classes:
                    field.widget.attrs['class'] = (field.widget.attrs.get('class', '') + ' form-textarea').strip()