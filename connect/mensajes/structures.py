# mensajes/structures.py

class MensajeNodo:
    def __init__(self, mensaje):
        self.mensaje = mensaje        # Objeto mensaje (puede ser instancia de modelo Django)
        self.anterior = None          # Nodo anterior
        self.siguiente = None         # Nodo siguiente


class ListaMensajes:
    def __init__(self):
        self.ultimo = None  # Nodo más reciente (parte inferior del scroll)
        self.primero = None  # Nodo más antiguo (parte superior del scroll)
        self.total = 0

    def insertar_mensaje(self, mensaje):
        """
        Inserta un nuevo mensaje al final de la lista (como un mensaje recibido o enviado).
        Ideal para manejar scroll que crece de abajo hacia arriba.
        """
        nuevo_nodo = MensajeNodo(mensaje)

        if self.ultimo is None:
            self.primero = self.ultimo = nuevo_nodo
        else:
            self.ultimo.siguiente = nuevo_nodo
            nuevo_nodo.anterior = self.ultimo
            self.ultimo = nuevo_nodo

        self.total += 1

    def recorrer_hacia_arriba(self, desde=None, cantidad=10):
        mensajes = []
        actual = self.ultimo if desde is None else desde.anterior

        while actual and len(mensajes) < cantidad:
            mensajes.append(actual.mensaje)
            actual = actual.anterior

        return mensajes

    def obtener_ultimo_nodo(self):
        return self.ultimo

    def obtener_primero(self):
        return self.primero

    def esta_vacia(self):
        return self.total == 0

    def __len__(self):
        return self.total
