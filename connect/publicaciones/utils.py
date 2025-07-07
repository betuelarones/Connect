# usuarios/utils.py
import threading

from .structures import ListaEnlazada


_global_publicacion_list = None
_global_list_lock = threading.Lock() # Para asegurar el acceso concurrente

def obtener_lista_publicaciones():
    return ListaEnlazada.cargar_desde_db()

