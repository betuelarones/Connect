from amistades.models import Amistad
from django.db import models


class GrafoAmistades:
    def __init__(self, usuario):
        self.usuario = usuario
        self.amigos = self.obtener_amigos()

    def obtener_amigos(self):
        # Retorna usuarios con amistad aceptada
        amistades = Amistad.objects.filter(
            aceptada=True
        ).filter(
            models.Q(solicitante=self.usuario) | models.Q(receptor=self.usuario)
        )

        amigos = []
        for amistad in amistades:
            if amistad.solicitante == self.usuario:
                amigos.append(amistad.receptor)
            else:
                amigos.append(amistad.solicitante)
        return amigos
