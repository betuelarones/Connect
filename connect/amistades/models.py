from django.conf import settings
from django.db import models
from django.utils import timezone

class Amistad(models.Model):
    solicitante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='amistades_solicitadas')
    receptor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='amistades_recibidas')
    aceptada = models.BooleanField(default=False)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_aceptacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('solicitante', 'receptor')

    def __str__(self):
        return f"{self.solicitante} -> {self.receptor} ({'Aceptada' if self.aceptada else 'Pendiente'})"
