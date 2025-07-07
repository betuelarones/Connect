# publicaciones/structures.py
# (Reemplaza el contenido de tu archivo publicaciones.py que me pasaste)

# Importa los modelos de Django que representarán los datos persistentes
from publicaciones.models import Publicacion as PublicacionDB, Reaccion as ReaccionDB, Comentario as ComentarioDB
# Importamos settings para MEDIA_URL al construir la URL del archivo
from django.conf import settings
import os
from django.utils import timezone  # Para usar zona horaria en fechas


# --- Pila Genérica para Reacciones y Comentarios ---
class NodoPila:
    def __init__(self, dato_db_obj):  # dato_db_obj será un objeto ReaccionDB o ComentarioDB
        self.dato = dato_db_obj
        self.siguiente = None


class Pila:
    def __init__(self):
        self.top = None
        self.size = 0

    def push(self, dato_db_obj):
        nuevo_nodo = NodoPila(dato_db_obj)
        nuevo_nodo.siguiente = self.top
        self.top = nuevo_nodo
        self.size += 1

    def pop(self):
        if self.is_empty():
            return None
        dato = self.top.dato
        self.top = self.top.siguiente
        self.size -= 1
        return dato

    def peek(self):
        return self.top.dato if not self.is_empty() else None

    def is_empty(self):
        return self.top is None

    def to_list(self):
        """Convierte la pila a una lista de objetos del modelo (del tope hacia abajo)."""
        items = []
        actual = self.top
        while actual:
            items.append(actual.dato)
            actual = actual.siguiente
        return items


# --- Nodos y Lista Enlazada para Publicaciones ---
class Nodo:
    def __init__(self, publicacion_db_obj):
        # El 'dato' de tu nodo ahora es una instancia del modelo Publicacion de Django
        self.dato = publicacion_db_obj
        self.siguiente = None

        # Cada nodo de Publicacion tendrá sus propias pilas de comentarios y reacciones
        self.pila_comentarios = Pila()
        self.pila_reacciones = Pila()

        # Al inicializar el nodo, cargamos los comentarios y reacciones desde la BD
        self._cargar_comentarios_y_reacciones_desde_db()

    def _cargar_comentarios_y_reacciones_desde_db(self):
        # Los comentarios suelen mostrarse cronológicamente ascendente.
        # Si los pones en una pila y luego los recuperas, el último en entrar es el primero en salir.
        # Para mantener el orden cronológico al mostrarlos desde la pila, podemos
        # hacer un push en el orden inverso al que los queremos sacar.
        # O, para simplificar, cargamos los comentarios/reacciones más recientes primero en la pila.

        # Cargar comentarios (más recientes primero para LIFO)
        comentarios_db = self.dato.comentarios_db.all().order_by('-fecha_creacion')
        for comentario_obj in comentarios_db:
            self.pila_comentarios.push(comentario_obj)

        # Cargar reacciones (más recientes primero para LIFO)
        reacciones_db = self.dato.reacciones_db.all().order_by('-fecha_creacion')
        for reaccion_obj in reacciones_db:
            self.pila_reacciones.push(reaccion_obj)


class ListaEnlazada:
    def __init__(self):
        self.cabeza = None
        self.total = 0  # Mantener un conteo de publicaciones

    def agregar(self, publicacion_db_obj):
        """
        Agrega un nuevo objeto Publicacion de Django (publicacion_db_obj)
        a la lista enlazada en memoria. Se agrega al principio (como tu lógica original).
        """
        nuevo_nodo = Nodo(publicacion_db_obj)
        nuevo_nodo.siguiente = self.cabeza
        self.cabeza = nuevo_nodo
        self.total += 1

    def listar(self):  # Este método no es estrictamente necesario para la vista, to_list_for_json es el que se usará.
        actual = self.cabeza
        datos = []
        while actual is not None:
            datos.append(actual.dato)  # Devuelve objetos PublicacionDB
            actual = actual.siguiente
        return datos

    def to_list_for_json(self):
        """
        Convierte la lista enlazada (y sus pilas internas) a una lista de diccionarios
        para ser enviados como JSON al frontend.
        """
        # Importamos aquí para evitar un posible problema de importación circular
        from django.contrib.humanize.templatetags import humanize

        publicaciones_data = []
        actual = self.cabeza
        while actual is not None:
            pub_db = actual.dato  # Esto es tu objeto Publicacion de Django

            # Obtén el nombre completo del autor (mejorado)
            autor_nombre = f"{pub_db.autor.nombres or ''} {pub_db.autor.apellidos or ''}".strip()
            if not autor_nombre:
                autor_nombre = pub_db.autor.username

            archivo_url = None
            if pub_db.archivo and hasattr(pub_db.archivo, 'url'):
                archivo_url = pub_db.archivo.url

            # Preparar comentarios para el JSON (del tope de la pila hacia abajo)
            comentarios_json = []
            for c_db_obj in actual.pila_comentarios.to_list():
                comentarios_json.append({
                    'id': c_db_obj.id,
                    'autor': f"{c_db_obj.autor.nombres or ''} {c_db_obj.autor.apellidos or ''}".strip() or c_db_obj.autor.username,
                    'contenido': c_db_obj.contenido,
                    'fecha': humanize.naturaltime(c_db_obj.fecha_creacion),
                })

            # Preparar reacciones para el JSON (del tope de la pila hacia abajo)
            reacciones_json = []
            for r_db_obj in actual.pila_reacciones.to_list():
                reacciones_json.append({
                    'id': r_db_obj.id,
                    'autor': f"{r_db_obj.autor.nombres or ''} {r_db_obj.autor.apellidos or ''}".strip() or r_db_obj.autor.username,
                    'tipo': r_db_obj.tipo,
                    'fecha': humanize.naturaltime(r_db_obj.fecha_creacion),
                })

            publicaciones_data.append({
                "id": pub_db.id,  # Añade el ID de la BD para referencia
                "autor_id": pub_db.autor.id,
                "autor": autor_nombre,
                "contenido": pub_db.contenido,
                "tipo": pub_db.tipo,
                "archivo_url": archivo_url,  # Usar 'archivo_url' en lugar de 'archivo'
                "fecha": humanize.naturaltime(pub_db.fecha_publicacion),  # Usar humanize.naturaltime para fechas
                "comentarios": comentarios_json,
                "reacciones": reacciones_json,
                "num_comentarios": actual.pila_comentarios.size,
                "num_reacciones": actual.pila_reacciones.size,
            })
            actual = actual.siguiente

        # No revertimos la lista aquí porque el 'agregar' inserta al principio.
        # Si se quiere las más recientes al final, se podría usar un append en 'agregar'
        # o un reversed() aquí, pero tu lógica actual es que la cabeza es lo más nuevo.
        return publicaciones_data

    @classmethod
    def cargar_desde_db(cls):
        """
        Crea una nueva instancia de ListaEnlazada y la popula
        con publicaciones, comentarios y reacciones desde la base de datos.
        """
        # Recupera todas las publicaciones del ORM, ordenadas por fecha de publicación descendente.
        # select_related('autor') minimiza las consultas para el autor.
        # prefetch_related('comentarios_db', 'reacciones_db') minimiza las consultas para comentarios/reacciones
        # al cargar todas las publicaciones.
        publicaciones_db_queryset = PublicacionDB.objects.all().order_by('-fecha_publicacion').select_related(
            'autor').prefetch_related('comentarios_db', 'reacciones_db')

        lista = cls()  # Crea una nueva lista enlazada vacía
        for pub_db_obj in publicaciones_db_queryset:
            lista.agregar(pub_db_obj)  # El constructor de Nodo ya se encarga de las pilas internas
        return lista

    def eliminar(self, id_publicacion):
        actual = self.cabeza
        anterior = None
        while actual:
            if actual.dato.id == id_publicacion:
                if anterior:
                    anterior.siguiente = actual.siguiente
                else:
                    self.cabeza = actual.siguiente
                self.total -= 1
                return True
            anterior = actual
            actual = actual.siguiente
        return False  # No se encontró
