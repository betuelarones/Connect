from django.db import models
from django.conf import settings

class Historia(models.Model):
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenido = models.TextField(blank=True, null=True)
    imagen = models.ImageField(upload_to='historias/', blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"Historia de {self.autor}"
