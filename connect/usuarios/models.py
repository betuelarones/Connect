from django.db import models

# Create your models here.
class Usuario(models.Model):
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    correo = models.EmailField(max_length=100)
    password = models.CharField(max_length=100)
    direccion = models.CharField(max_length=100)