class NodoHistoria:
    def __init__(self, historia):
        self.historia = historia
        self.siguiente = None

class ListaCircularHistorias:
    def __init__(self):
        self.primero = None

    def agregar_historia(self, historia):
        nuevo = NodoHistoria(historia)
        if not self.primero:
            self.primero = nuevo
            nuevo.siguiente = self.primero
        else:
            temp = self.primero
            while temp.siguiente != self.primero:
                temp = temp.siguiente
            temp.siguiente = nuevo
            nuevo.siguiente = self.primero

    def recorrer(self):
        historias = []
        if not self.primero:
            return historias

        actual = self.primero
        while True:
            historias.append(actual.historia)
            actual = actual.siguiente
            if actual == self.primero:
                break
        return historias
