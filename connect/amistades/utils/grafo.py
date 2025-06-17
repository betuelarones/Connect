from django.contrib.auth import get_user_model
from amistades.models import Amistad

class NodoUsuario:
    def __init__(self, usuario):
        self.usuario = usuario
        self.amigos = []

    def agregar_amigo(self, nodo_amigo):
        if nodo_amigo not in self.amigos:
            self.amigos.append(nodo_amigo)

class GrafoUsuarios:
    def __init__(self):
        self.nodos = []

    def agregar_nodo(self, usuario):
        nodo = NodoUsuario(usuario)
        self.nodos.append(nodo)
        return nodo

    def obtener_nodo(self, usuario):
        for nodo in self.nodos:
            if nodo.usuario.id == usuario.id:
                return nodo
        return None

    def construir_desde_db(self):
        User = get_user_model()
        usuarios = User.objects.all()
        for usuario in usuarios:
            self.agregar_nodo(usuario)

        amistades = Amistad.objects.filter(aceptada=True)
        for amistad in amistades:
            nodo_a = self.obtener_nodo(amistad.solicitante)
            nodo_b = self.obtener_nodo(amistad.receptor)
            if nodo_a and nodo_b:
                nodo_a.agregar_amigo(nodo_b)
                nodo_b.agregar_amigo(nodo_a)


def sugerir_por_amigos_en_comun(self, usuario):
    nodo_usuario = self.obtener_nodo(usuario)
    if not nodo_usuario:
        return []

    sugerencias = []

    for amigo in nodo_usuario.amigos:
        for amigo_de_amigo in amigo.amigos:
            if (
                    amigo_de_amigo != nodo_usuario
                    and amigo_de_amigo not in nodo_usuario.amigos
            ):
                ya_encontrado = False
                for sugerencia in sugerencias:
                    if sugerencia["nodo"].usuario.id == amigo_de_amigo.usuario.id:
                        sugerencia["peso"] += 1
                        sugerencia["amigos_comun"] += 1  # ➕ Suma nativa
                        if amigo_de_amigo.usuario.direccion == usuario.direccion:
                            sugerencia["peso"] += 2
                        ya_encontrado = True
                        break
                if not ya_encontrado:
                    peso_inicial = 1
                    if amigo_de_amigo.usuario.direccion == usuario.direccion:
                        peso_inicial += 2
                    sugerencias.append({
                        "nodo": amigo_de_amigo,
                        "peso": peso_inicial,
                        "amigos_comun": 1  # 👈 Contador inicial
                    })

    # Ordenamos por peso (como ya hacías)
    for i in range(len(sugerencias)):
        for j in range(i + 1, len(sugerencias)):
            if sugerencias[j]["peso"] > sugerencias[i]["peso"]:
                sugerencias[i], sugerencias[j] = sugerencias[j], sugerencias[i]

    # Retornar usuarios con atributo extra
    usuarios_finales = []
    for s in sugerencias:
        usuario_con_atributo = s["nodo"].usuario
        usuario_con_atributo.amigos_en_comun = s["amigos_comun"]  # 👈 Aquí el atributo dinámico
        usuarios_finales.append(usuario_con_atributo)

    return usuarios_finales

