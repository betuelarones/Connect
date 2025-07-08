let chatAbiertoId = null;

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

      // ✅ Mostrar lista de conversaciones en móviles si no hay chat activo
      if (window.innerWidth <= 768 && !chatAbiertoId) {
        document.getElementById('msSidebar')?.classList.add('show');
        document.querySelector('.ms-container')?.classList.remove('show-chat');
      }
    });
}

/**
 * Abre un chat con un amigo, actualiza la UI y carga mensajes.
 */
function abrirChat(userId, nombre, avatar) {
  if (chatAbiertoId === userId) return;
  chatAbiertoId = userId;

  const mainHeader = document.getElementById('msMainHeader');
  const chatHeader = document.getElementById('msChatHeader');
  if (mainHeader) mainHeader.style.display = 'none';
  if (chatHeader) {
    chatHeader.style.display = 'flex';
    document.getElementById('msActiveChatName').textContent = nombre;
    document.getElementById('msActiveChatAvatar').textContent = avatar;
  }

  const emptyState = document.getElementById('msEmpty');
  if (emptyState) emptyState.style.display = 'none';

  const chatArea = document.getElementById('msChatArea');

  document.getElementById('msMessages')?.remove();
  document.querySelector('.ms-input-box')?.remove();

  const messagesDiv = document.createElement('div');
  messagesDiv.className = 'ms-messages';
  messagesDiv.id = 'msMessages';
  messagesDiv.innerHTML = '<p class="loading-message">Cargando mensajes...</p>';

  const inputBox = document.createElement('div');
  inputBox.className = 'ms-input-box';
  inputBox.innerHTML = `
    <textarea id="msInput" placeholder="Escribe un mensaje..."></textarea>
    <button onclick="enviarMensaje(${userId})">Enviar</button>
  `;

  chatArea.appendChild(messagesDiv);
  chatArea.appendChild(inputBox);

  if (window.innerWidth <= 768) {
    document.getElementById('msSidebar')?.classList.remove('show');
    document.querySelector('.ms-container')?.classList.add('show-chat'); // <-- NUEVO
  }

  fetch(`/mensajes/obtener/${userId}/`)
    .then(response => response.json())
    .then(data => {
      const currentUserId = data.usuario_actual_id;
      messagesDiv.innerHTML = '';

      if (data.mensajes.length === 0) {
        messagesDiv.innerHTML = '<p class="no-messages">No hay mensajes aún.</p>';
        return;
      }

      data.mensajes.forEach(msg => {
        const esPropio = msg.emisor_id === currentUserId;
        const msgElem = document.createElement('div');
        msgElem.className = esPropio ? 'message sent' : 'message received';
        msgElem.innerHTML = `
          <div class="message-bubble">${msg.contenido}</div>
          <div class="message-time">${msg.fecha}</div>
        `;
        messagesDiv.appendChild(msgElem);
      });

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(error => {
      messagesDiv.innerHTML = '<p class="error-message">Error al cargar los mensajes.</p>';
      console.error('Error:', error);
    });
}

/**
 * Permite volver desde el chat al listado de conversaciones (mobile).
 */
function volverALista() {
  const mainHeader = document.getElementById('msMainHeader');
  const chatHeader = document.getElementById('msChatHeader');
  if (mainHeader) mainHeader.style.display = 'flex';
  if (chatHeader) chatHeader.style.display = 'none';

  const emptyState = document.getElementById('msEmpty');
  if (emptyState) emptyState.style.display = 'block';

  document.getElementById('msMessages')?.remove();
  document.querySelector('.ms-input-box')?.remove();

  if (window.innerWidth <= 768) {
    document.getElementById('msSidebar')?.classList.add('show');
    document.querySelector('.ms-container')?.classList.remove('show-chat'); // <-- NUEVO
  }

  chatAbiertoId = null;
}

/**
 * Obtiene el token CSRF de la cookie.
 */
function getCSRFToken() {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
}

/**
 * Envía un nuevo mensaje al usuario indicado al backend de Django.
 */
function enviarMensaje(userId) {
  const textarea = document.getElementById('msInput');
  const contenido = textarea.value.trim();
  if (!contenido) return;

  fetch('/mensajes/enviar/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRFToken': getCSRFToken()
    },
    body: new URLSearchParams({
      receptor_id: userId,
      contenido: contenido
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      const mensajesDiv = document.getElementById('msMessages');
      const msgElem = document.createElement('div');
      msgElem.className = 'message sent';
      msgElem.innerHTML = `
        <div class="message-bubble">${data.mensaje}</div>
        <div class="message-time">${data.fecha}</div>
      `;
      mensajesDiv.appendChild(msgElem);
      mensajesDiv.scrollTop = mensajesDiv.scrollHeight;

      textarea.value = '';
    })
    .catch(error => {
      alert("No se pudo enviar el mensaje");
      console.error('Error al enviar mensaje:', error);
    });

}
// ... (todo tu código JavaScript actual) ...

// Llama a la función de inicialización cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initMensajes);