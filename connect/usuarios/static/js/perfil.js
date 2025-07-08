// static/js/perfil.js
document.addEventListener('DOMContentLoaded', function() {
    const navPublicaciones = document.getElementById('navPublicaciones');
    const navAmigos = document.getElementById('navAmigos');
    const dynamicContentArea = document.getElementById('dynamic-content-area');

    // Elementos del Modal (ACTUALIZADO PARA CLASES ÚNICAS DEL MODAL)
    const btnEditarPerfil = document.getElementById('btnEditarPerfil');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeButton = editProfileModal.querySelector('.profile-edit-modal-close-button'); // Usar la nueva clase única
    const editProfileFormContainer = document.getElementById('editProfileFormContainer');
    const modalMessages = document.getElementById('profileEditModalMessages'); // Usar la nueva clase única


    // Esta es la estructura base que se carga al hacer clic en "Publicaciones"
    // El contenido REAL de las publicaciones se carga por AJAX dentro de #profilePostsFeed
    const publicationsSectionHtmlStructure = `
        <div class="publications-section">
            <div class="posts-list">
                <div class="posts-grid" id="profilePostsFeed">
                    <p>Cargando tus publicaciones...</p>
                </div>
            </div>
        </div>
    `;

    function setActiveTab(activeLink) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeLink.classList.add('active');
    }

    // Esta función es la que hace la llamada AJAX para obtener las publicaciones del usuario
    function loadMyProfilePosts() {
        const profilePostsFeed = document.getElementById('profilePostsFeed');
        if (!profilePostsFeed) {
            console.error("El elemento profilePostsFeed no se encontró al intentar cargar mis publicaciones.");
            return;
        }

        profilePostsFeed.innerHTML = '<p>Cargando tus publicaciones...</p>';

        // Verifica si djangoUrls y la URL específica están definidas
        if (typeof djangoUrls === 'undefined' || !djangoUrls.listar_mis_publicaciones_ajax) {
            console.error("URL para listar mis publicaciones no definida en djangoUrls.");
            profilePostsFeed.innerHTML = '<p>Error de configuración: URL de publicaciones no encontrada.</p>';
            return;
        }

        fetch(djangoUrls.listar_mis_publicaciones_ajax)
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es 200 OK, intenta leer el error
                    return response.text().then(text => {
                        try {
                            const errorData = JSON.parse(text);
                            throw new Error(errorData.error || `Error al cargar tus publicaciones. Estado: ${response.status}`);
                        } catch (e) {
                            throw new Error(`Error al cargar tus publicaciones. Estado: ${response.status}. Respuesta: ${text.substring(0, 100)}...`);
                        }
                    });
                }
                // Espera un JSON de la vista de Django que contiene el HTML en la clave 'html'
                return response.json();
            })
            .then(data => {
                if (data.error) { // Si el JSON tiene una propiedad 'error'
                    profilePostsFeed.innerHTML = `<p>Error al cargar: ${data.error}</p>`;
                    return;
                }
                const html = data.html; // Obtenemos el HTML de la clave 'html'
                if (html.trim() === '') {
                    profilePostsFeed.innerHTML = '<p>Aún no tienes publicaciones.</p>';
                } else {
                    profilePostsFeed.innerHTML = html;
                }

                // Actualiza el contador de publicaciones en el perfil
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const postCount = tempDiv.querySelectorAll('.post-card').length;
                const publicacionCountSpan = document.querySelector('.profile-stats .stat:nth-child(1) .stat-number');
                if (publicacionCountSpan) {
                    publicacionCountSpan.textContent = postCount;
                }

                // === MUY IMPORTANTE: Re-inicializar los listeners para elementos cargados dinámicamente ===
                // Esta función DEBE existir y ser accesible globalmente (o importada).
                // Si la tienes en main.js, asegúrate de que main.js la exponga (ej: window.initPostActionListeners = initPostActionListeners;)
                if (typeof window.initPostActionListeners === 'function') {
                    window.initPostActionListeners();
                } else {
                    console.warn("Advertencia: initPostActionListeners no está definida o accesible. Los botones de publicaciones podrían no funcionar.");
                }
            })
            .catch(error => {
                console.error('Error en la solicitud Fetch para publicaciones del perfil:', error);
                profilePostsFeed.innerHTML = `<p>Error al cargar tus publicaciones: ${error.message}. Por favor, inténtalo de nuevo.</p>`;
            });
    }

    // Hacemos esta función global para que pueda ser llamada desde main.js
    // cuando se publica o elimina algo.
    window.renderPublicationsSection = function() {
        dynamicContentArea.innerHTML = publicationsSectionHtmlStructure;
        loadMyProfilePosts();
    };

    // Event listener para la pestaña "Publicaciones"
    if (navPublicaciones) {
        navPublicaciones.addEventListener('click', function(event) {
            event.preventDefault();
            setActiveTab(navPublicaciones);
            window.renderPublicationsSection(); // Usa la función global para recargar las publicaciones
            console.log('Contenido de publicaciones del perfil cargado.');
        });
    }

    // Event listener para la pestaña "Amigos" (código de tu perfil.js original)
    if (navAmigos) {
        navAmigos.addEventListener('click', function(event) {
            event.preventDefault();
            const url = this.href;
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error(`HTTP error! Status: ${response.status}. Response: ${text.substring(0, 100)}...`);
                        });
                    }
                    return response.text();
                })
                .then(html => {
                    dynamicContentArea.innerHTML = html;
                    setActiveTab(navAmigos);
                    console.log('Contenido de amigos cargado exitosamente.');
                })
                .catch(error => {
                    console.error('Error al cargar contenido de amigos:', error);
                    dynamicContentArea.innerHTML = `<p>Error al cargar los amigos: ${error.message}. Por favor, inténtalo de nuevo.</p>`;
                });
        });
    }

    // Lógica de carga inicial para la pestaña "Publicaciones"
    // Esto asegura que las publicaciones se carguen al abrir el perfil si es la pestaña activa por defecto
    if (navPublicaciones && navPublicaciones.classList.contains('active')) {
        window.renderPublicationsSection(); // Carga las publicaciones al inicio
    }

    // --- NUEVA FUNCIÓN: Cargar y actualizar el contador de amigos ---
    function loadAmigosCount() {
        const amigosCountSpan = document.querySelector('.profile-stats .stat:nth-child(2) .stat-number'); // El 2do .stat
        const amigosLabelSpan = document.querySelector('.profile-stats .stat:nth-child(2) .stat-label');

        if (!amigosCountSpan || !amigosLabelSpan) {
            console.warn("Elementos de contador de amigos no encontrados.");
            return;
        }

        // Verifica si djangoUrls y la URL específica están definidas
        if (typeof djangoUrls === 'undefined' || !djangoUrls.get_amigos_count_ajax) {
            console.error("URL para obtener el conteo de amigos no definida en djangoUrls.");
            return;
        }

        fetch(djangoUrls.get_amigos_count_ajax)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const count = data.amigos_count;
                amigosCountSpan.textContent = count;
                // Opcional: ajustar "Amigo" o "Amigos" según el conteo
                amigosLabelSpan.textContent = count === 1 ? 'Amigo' : 'Amigos';
                console.log(`Contador de amigos actualizado: ${count}`);
            })
            .catch(error => {
                console.error('Error al cargar el contador de amigos:', error);
                amigosCountSpan.textContent = '-'; // Muestra un guion en caso de error
                amigosLabelSpan.textContent = 'Error';
            });
    }

    // --- ¡CLAVE! Llamar a la función para cargar el contador de amigos al inicio ---
    loadAmigosCount();

    // --- Lógica del Modal de Edición (ACTUALIZADA CON CLASES ÚNICAS) ---

    // Función para mostrar mensajes en el modal
    function showModalMessage(message, type) {
        modalMessages.innerHTML = ''; // Limpiar mensajes anteriores
        const msgDiv = document.createElement('div');
        msgDiv.className = `profile-edit-modal-messages ${type}`; // Usar la clase única
        if (typeof message === 'object') { // Si es un objeto de errores de formulario de Django
            const ul = document.createElement('ul');
            for (const field in message) {
                // Capitaliza el nombre del campo para una mejor presentación
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                message[field].forEach(error => {
                    const li = document.createElement('li');
                    li.textContent = `${fieldName}: ${error}`;
                    ul.appendChild(li);
                });
            }
            msgDiv.appendChild(ul);
        } else {
            msgDiv.textContent = message;
        }
        modalMessages.appendChild(msgDiv);
        // Ocultar mensaje después de un tiempo
        setTimeout(() => {
            modalMessages.innerHTML = '';
        }, 5000); // El mensaje desaparece después de 5 segundos
    }

    // Función para abrir el modal
    function openEditProfileModal() {
        editProfileModal.style.display = 'flex'; // HACER VISIBLE EL MODAL
        editProfileFormContainer.innerHTML = '<p>Cargando formulario de edición...</p>';
        modalMessages.innerHTML = ''; // Limpiar mensajes al abrir el modal

        // ******* Asumo que djangoUrls.editar_perfil_ajax YA ESTÁ DEFINIDO y es la URL correcta. *******
        if (typeof djangoUrls === 'undefined' || !djangoUrls.editar_perfil_ajax) {
            console.error("URL para editar perfil (djangoUrls.editar_perfil_ajax) no definida. Asegúrate de que djangoUrls esté cargado antes de perfil.js.");
            editProfileFormContainer.innerHTML = '<p>Error: URL de edición no configurada correctamente. Contacta al administrador.</p>';
            return;
        }

        fetch(djangoUrls.editar_perfil_ajax, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest' // Importante para que Django sepa que es una solicitud AJAX
            }
        })
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es 200 OK, intentamos leer el error del cuerpo
                return response.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.error || `Error HTTP al cargar el formulario. Estado: ${response.status}`);
                    } catch (e) {
                        throw new Error(`Error HTTP al cargar el formulario. Estado: ${response.status}. Respuesta: ${text.substring(0, 100)}...`);
                    }
                });
            }
            return response.json(); // Esperamos un JSON que contenga el HTML del formulario
        })
        .then(data => {
            if (data.html_form) {
                editProfileFormContainer.innerHTML = data.html_form;
                // Adjuntar el listener para el envío del formulario una vez cargado
                const form = editProfileFormContainer.querySelector('form');
                if (form) {
                    form.addEventListener('submit', handleEditProfileSubmit);
                } else {
                    console.error("Formulario no encontrado dentro del contenedor de edición después de la carga.");
                    editProfileFormContainer.innerHTML = '<p>Error: No se pudo renderizar el formulario.</p>';
                }
            } else {
                console.error("La respuesta AJAX para el formulario de edición no contiene 'html_form'.", data);
                editProfileFormContainer.innerHTML = '<p>Error: Formato de respuesta inesperado al cargar el formulario.</p>';
            }
        })
        .catch(error => {
            console.error('Error al cargar el formulario de edición:', error);
            editProfileFormContainer.innerHTML = `<p>Error al cargar el formulario: ${error.message}. Por favor, inténtalo de nuevo.</p>`;
            showModalMessage(`Error al cargar el formulario: ${error.message}`, 'error');
        });
    }

    // Función para cerrar el modal
    function closeEditProfileModal() {
        editProfileModal.style.display = 'none'; // OCULTAR EL MODAL
        editProfileFormContainer.innerHTML = '<p>Cargando formulario...</p>'; // Limpiar contenido al cerrar
        modalMessages.innerHTML = ''; // Limpiar mensajes
    }

    // Función para manejar el envío del formulario del modal
    function handleEditProfileSubmit(event) {
        event.preventDefault(); // Evita el envío normal del formulario

        const form = event.target;
        const formData = new FormData(form);

        // Validar que la URL de acción del formulario sea la esperada
        if (typeof djangoUrls === 'undefined' || !djangoUrls.editar_perfil_ajax) {
            console.error("URL para enviar el perfil (djangoUrls.editar_perfil_ajax) no definida.");
            showModalMessage("Error de configuración: La URL para guardar el perfil no está definida.", 'error');
            return;
        }

        fetch(djangoUrls.editar_perfil_ajax, { // Usar la URL definida en djangoUrls para el POST
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken') // Asegúrate de enviar el token CSRF
            }
        })
        .then(response => {
            if (!response.ok) {
                // Si la respuesta no es 200 OK, asumimos que hay errores del formulario o un error del servidor
                return response.json().then(errorData => {
                    throw new Error(JSON.stringify(errorData)); // Lanza el objeto de error como un string
                });
            }
            return response.json(); // Si es 200 OK, esperamos un JSON de éxito
        })
        .then(data => {
            if (data.success) {
                showModalMessage(data.message, 'success');
                // Actualizar la información del perfil en la página principal (NO TOCADO, usa tus clases existentes)
                document.querySelector('.profile-username').textContent = `${data.user_data.nombres} ${data.user_data.apellidos}`;

                // Actualizar campos individuales (NO TOCADO, usa tus clases existentes)
                const updateDetail = (selector, value) => {
                    const element = document.querySelector(selector);
                    if (element) element.textContent = value || ''; // Usa valor por defecto si es nulo/vacío
                };

                updateDetail('.detail-item[data-type="career"] .detail-value', data.user_data.carrera);
                updateDetail('.detail-item[data-type="location"] .detail-value', data.user_data.sede);
                updateDetail('.detail-item[data-type="cycle"] .detail-value', data.user_data.ciclo);
                document.querySelector('.profile-description').textContent = data.user_data.descripcion; // Original profile-description

                // Formatear cumpleaños de nuevo si es necesario (NO TOCADO, usa tus clases existentes)
                const birthdayElement = document.querySelector('.detail-item[data-type="birthday"] .detail-value');
                if (birthdayElement) {
                    if (data.user_data.cumpleaños) {
                        const date = new Date(data.user_data.cumpleaños + 'T00:00:00'); // Añadir T00:00:00 para evitar problemas de zona horaria
                        birthdayElement.textContent = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                    } else {
                        birthdayElement.textContent = '';
                    }
                }

                // Cerrar modal después de un breve retraso para que el usuario vea el mensaje de éxito
                setTimeout(() => {
                    closeEditProfileModal();
                }, 1500); // Cierra el modal después de 1.5 segundos
            } else {
                // Esto no debería ejecutarse si el servidor devuelve 400 y el catch lo maneja.
                // Pero si Django devuelve 200 con success: false, se manejaría aquí.
                showModalMessage(data.errors || 'Error desconocido al guardar el perfil.', 'error');
            }
        })
        .catch(error => {
            console.error('Error al guardar el perfil:', error);
            try {
                const errorObj = JSON.parse(error.message); // Intenta parsear el mensaje de error
                if (errorObj.errors) {
                    showModalMessage(errorObj.errors, 'error'); // Muestra los errores del formulario
                } else if (errorObj.message) {
                    showModalMessage(errorObj.message, 'error'); // Mensaje de error general del servidor
                } else {
                    showModalMessage('Error desconocido del servidor al guardar el perfil.', 'error');
                }
            } catch (e) {
                showModalMessage('Error de red o del servidor. Por favor, inténtalo de nuevo.', 'error');
            }
        });
    }

    // Listener para abrir el modal
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', openEditProfileModal);
    }

    // Listener para cerrar el modal con el botón X
    if (closeButton) {
        closeButton.addEventListener('click', closeEditProfileModal);
    }

    // Listener para cerrar el modal al hacer clic fuera del contenido del modal
    window.addEventListener('click', function(event) {
        if (event.target === editProfileModal) {
            closeEditProfileModal();
        }
    });

    // Función de ayuda para obtener el token CSRF de las cookies (necesaria para solicitudes POST en Django)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});

