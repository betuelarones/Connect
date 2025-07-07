# publicaciones/models.py
from django.db import models
from django.conf import settings

class Publicacion(models.Model):
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='publicaciones')
    contenido = models.TextField(blank=True)
    tipo = models.CharField(max_length=10, default='texto', choices=[
        ('texto', 'Texto'),
        ('imagen', 'Imagen'),
        ('video', 'Video'),
    ])
    archivo = models.FileField(upload_to='publicaciones/', blank=True, null=True)
    fecha_publicacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_publicacion']

    def __str__(self):
        return f'Publicación {self.id} de {self.autor.nombres}'

class Reaccion(models.Model):
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='reacciones_db')
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mis_reacciones')
    tipo = models.CharField(max_length=20) # Ej: 'like', 'heart', 'laugh', 'sad'
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Esto asegura que un usuario solo pueda dar 1 reacción de un tipo por publicación
        unique_together = ('publicacion', 'autor', 'tipo') 
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f'{self.autor.nombres} reaccionó con {self.tipo} a Publicación {self.publicacion.id}'

class Comentario(models.Model):
    publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, related_name='comentarios_db')
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mis_comentarios')
    contenido = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha_creacion']

    def __str__(self):
        return f'Comentario de {self.autor.nombres} en Publicación {self.publicacion.id}'