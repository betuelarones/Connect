from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

SEDE_CHOICES = [
    ('Arequipa', ' Arequipa'),
    ('Trujillo', ' Trujillo'),
    ('Lima', ' Lima'),
]
class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo debe ser obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)  # Hashea la contraseña
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    correo = models.EmailField(max_length=100, unique=True)
    carrera = models.CharField(max_length=100, blank=True, null=True)
    sede = models.CharField(max_length=100, choices=SEDE_CHOICES)
    ciclo = models.CharField(max_length=10, blank=True, null=True)
    cumpleaños = models.DateField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)


    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombres', 'apellidos']

    def __str__(self):
        return self.correo
