/**
 * Inicializa la vista de mensajes: carga lista de amigos y prepara el panel.
 */
function initMensajes() {
  console.log("Inicializando vista de mensajes...");

  const lista = document.getElementById('msConvoList');
  if (!lista) return;

  fetch('/mensajes/amigos-json/')
    .then(response => response.json())
    .then(data => {
      lista.innerHTML = '';

      data.amigos.forEach(amigo => {
        const item = document.createElement('div');
        item.className = 'ms-convo-item';
        item.setAttribute('data-user-id', amigo.id);
        item.onclick = () => abrirChat(amigo.id, amigo.nombre, amigo.avatar);

        item.innerHTML = `
          <div class="ms-avatar">${amigo.avatar}</div>
          <div class="ms-info">
            <div class="ms-name">${amigo.nombre}</div>
            <div class="ms-preview">Haz clic para chatear</div>
          </div>
        `;

        lista.appendChild(item);
      });
    });
}


/**
 * Abre un chat con un amigo y carga sus mensajes desde el backend.
 */
function abrirChat(userId, nombre, avatar) {
  const chatArea = document.getElementById('msChatArea');
  const emptyState = document.getElementById('msEmpty');
  if (emptyState) emptyState.style.display = 'none';

  chatArea.innerHTML = `
    <div class="ms-chat-header">
      <div class="ms-chat-avatar">${avatar}</div>
      <div class="ms-chat-nombre">${nombre}</div>
    </div>
    <div class="ms-messages" id="msMessages">
      <p class="loading-message">Cargando mensajes...</p>
    </div>
    <div class="ms-input-box">
      <textarea id="msInput" placeholder="Escribe un mensaje..."></textarea>
      <button onclick="enviarMensaje(${userId})">Enviar</button>
    </div>
  `;

  fetch(`/mensajes/obtener/${userId}/`)
    .then(response => response.json())
    .then(data => {
      const mensajesDiv = document.getElementById('msMessages');
      mensajesDiv.innerHTML = '';

      if (data.mensajes.length === 0) {
        mensajesDiv.innerHTML = '<p class="no-messages">No hay mensajes aún.</p>';
        return;
      }

      data.mensajes.forEach(msg => {
        const esPropio = msg.emisor_id === window.currentUserId;
        const msgElem = document.createElement('div');
        msgElem.className = esPropio ? 'ms-mensaje propio' : 'ms-mensaje ajeno';
        msgElem.innerHTML = `
          <div class="ms-texto">${msg.contenido}</div>
          <div class="ms-fecha">${msg.fecha}</div>
        `;
        mensajesDiv.appendChild(msgElem);
      });

      mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
    })
    .catch(error => {
      const mensajesDiv = document.getElementById('msMessages');
      mensajesDiv.innerHTML = '<p class="error-message">Error al cargar los mensajes.</p>';
      console.error('Error:', error);
    });
}


/**
 * Envía un nuevo mensaje al usuario indicado (estructura inicial).
 */
function enviarMensaje(userId) {
  const textarea = document.getElementById('msInput');
  const contenido = textarea.value.trim();
  if (!contenido) return;

  // Aquí deberías implementar la lógica POST a una vista de Django (por ahora simulado)
  console.log(`Mensaje para ${userId}:`, contenido);

  // Opción: enviar a un endpoint tipo /mensajes/enviar/ con emisor -> request.user
  // fetch('/mensajes/enviar/', { method: 'POST', body: JSON.stringify({ receptor_id: userId, contenido }) })

  // Limpia campo
  textarea.value = '';

  // Simulación instantánea de mensaje enviado (hasta que conectes backend)
  const mensajesDiv = document.getElementById('msMessages');
  const msgElem = document.createElement('div');
  msgElem.className = 'ms-mensaje propio';
  msgElem.innerHTML = `
    <div class="ms-texto">${contenido}</div>
    <div class="ms-fecha">Ahora</div>
  `;
  mensajesDiv.appendChild(msgElem);
  mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
}
