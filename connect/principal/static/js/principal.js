document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded cargado. Script principal.js iniciado.");

    // 1. Verificación de djangoUrls al inicio para evitar errores si no se carga
    if (typeof djangoUrls === 'undefined') {
        console.error("Error: 'djangoUrls' no está definido. Asegúrate de definirlo en tu plantilla HTML antes de cargar main.js.");
        // Opcional: podrías detener la ejecución aquí si las URLs son críticas.
        // return;
    }

    // Función para obtener el token CSRF desde las cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const sidebar = document.getElementById('sidebar');
    const mainContentArea = document.getElementById('mainContent');
    const header = document.getElementById('header');
    const appWrapper = document.querySelector('.app-wrapper');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link, #headerProfileLink');
    const views = document.querySelectorAll('.view');

    let isSidebarCollapsed = localStorage.getItem('isSidebarCollapsed') === 'true';

    const updateSidebarState = () => {
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            appWrapper.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            appWrapper.classList.remove('sidebar-collapsed');
        }
    };

    function toggleHeaderForProfile() {
        const profileView = document.getElementById('profileView');
        if (profileView && profileView.classList.contains('active')) {
            appWrapper.classList.add('profile-active');
        } else {
            appWrapper.classList.remove('profile-active');
        }
    }

    function showView(viewId) {
        views.forEach(view => {
            view.classList.toggle('active', view.id === viewId + 'View');
        });

        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const currentNavLink = document.querySelector(`.sidebar-nav .nav-link[data-page="${viewId}"]`);
        if (currentNavLink) currentNavLink.classList.add('active');

        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (!isMobile) {
            if (viewId === 'messages') {
                isSidebarCollapsed = true;
                localStorage.setItem('isSidebarCollapsed', 'true');
            } else if (viewId === 'profile') {
                isSidebarCollapsed = false;
                localStorage.setItem('isSidebarCollapsed', 'false');
            } else {
                isSidebarCollapsed = localStorage.getItem('isSidebarCollapsed') === 'true';
            }
            updateSidebarState();
        } else {
            sidebar.classList.remove('show');
            document.querySelector('.overlay')?.classList.remove('show');
        }

        toggleHeaderForProfile();
    }

    function loadViewContent(viewName) {
        if (viewName === "sugerencias") {
            if (typeof urls !== 'undefined' && urls.sugerencias) {
                fetch(urls.sugerencias)
                    .then(r => r.text())
                    .then(html => {
                        document.getElementById("sugerenciasView").innerHTML = html;
                        if (typeof initSugerenciasButtons === 'function') {
                        initSugerenciasButtons();
                    } else {
                        console.error("initSugerenciasButtons() no está definida. ¿Cargaste sugerencias.js?");
                    }
                    })
                    .catch(err => console.error("Error cargando sugerencias:", err));
            } else {
                console.warn("URL para 'sugerencias' no definida en la variable 'urls'.");
            }
        } else if (viewName === "solicitudes") {
            if (typeof urls !== 'undefined' && urls.solicitudes) {
                fetch(urls.solicitudes)
                    .then(r => r.text())
                    .then(html => {
                        document.getElementById("solicitudesView").innerHTML = html;
                    })
                    .catch(err => console.error("Error cargando solicitudes:", err));
            } else {
                console.warn("URL para 'solicitudes' no definida en la variable 'urls'.");
            }
        } else if (viewName === "messages") {
            if (typeof urls !== 'undefined' && urls.verMensajes) {
                fetch(urls.verMensajes)
                    .then(r => r.text())
                    .then(html => {
                        document.getElementById("messagesView").innerHTML = html;
                        if (typeof initMensajes === 'function') {
                            initMensajes();
                            console.log("initMensajes() llamado después de cargar la vista de mensajes.");
                        } else {
                            console.error("Error: initMensajes() no está definido. Asegúrate de que mensajes.js se carga correctamente.");
                        }
                    })
                    .catch(err => console.error("Error cargando mensajes:", err));
            } else {
                console.warn("URL para 'messages' no definida en la variable 'urls'.");
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.dataset.page;
            if (page) {
                e.preventDefault();
                showView(page);
                loadViewContent(page);
            }
        });
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            isSidebarCollapsed = !isSidebarCollapsed;
            localStorage.setItem('isSidebarCollapsed', isSidebarCollapsed);
            updateSidebarState();
        });
    }

    const storiesContainer = document.getElementById('storiesContainer');
    const statusContainer = document.getElementById('statusContainer');

    if (mainContentArea && storiesContainer && statusContainer) {
        mainContentArea.addEventListener('scroll', () => {
            const scrollTop = mainContentArea.scrollTop;
            const threshold = 100;

            storiesContainer.classList.toggle('hidden', scrollTop > threshold);
            statusContainer.classList.toggle('hidden', scrollTop > threshold);
        });
    }

    const statusInput = document.querySelector('.status-input');
    const postBtn = document.querySelector('.post-btn');

    if (statusInput && postBtn) {
        statusInput.addEventListener('input', () => {
            postBtn.disabled = statusInput.value.trim().length === 0;
        });
    }

    const form = document.getElementById('formPublicar');
    const postsFeed = document.getElementById('postsFeed');

    function obtenerPublicaciones() {
        fetch(djangoUrls.obtener_publicaciones, {
            credentials: 'include'
        })
            .then(r => {
                if (!r.ok) throw new Error("HTTP Error: " + r.status);
                return r.json();
            })
            .then(data => {
                postsFeed.innerHTML = '';
                data.posts.forEach(post => {
                    const div = document.createElement('div');
                    div.className = 'post';
                    div.innerHTML = `
                        <div class="post-header">
                            <div class="post-avatar">${post.autor[0]}</div>
                            <div class="post-info">
                                <h3>${post.autor}</h3>
                                <span>${post.fecha}</span>
                            </div>
                            ${post.es_autor ? `
                            <div class="dropdown-container">
                                <button class="menu-btn" onclick="toggleDropdown(this)">⋮</button>
                                <div class="dropdown-options" style="display: none;">
                                    <button onclick="eliminarPublicacion(${post.id})">🗑️ Eliminar</button>
                                </div>
                            </div>` : ''}
                        </div>
                        <div class="post-content">${post.contenido}</div>
                        ${post.archivo_url ? `<div class="post-media">${ // Usar archivo_url para mostrar la media
                            post.tipo === 'imagen' ? `<img src="${post.archivo_url}" alt="Publicación">` :
                            post.tipo === 'video' ? `<video controls src="${post.archivo_url}"></video>` : ''
                        }</div>` : ''}

                        <div class="post-actions">
                            <button class="action-btn react-btn" data-publicacion-id="${post.id}" data-tipo-reaccion="like">
                                👍 <span class="reaction-count">${post.reacciones ? post.reacciones.length : 0}</span>
                            </button>
                            <button class="action-btn comment-btn" data-publicacion-id="${post.id}">
                                💬 <span class="comment-count">${post.comentarios ? post.comentarios.length : 0}</span>
                            </button>
                        </div>
                        <div class="comments-section" data-publicacion-id="${post.id}" style="display: none;">
                            ${post.comentarios.map(c => `
                                <div class="comment-item">
                                    <strong>${c.autor}</strong> (${c.fecha}): ${c.contenido}
                                </div>
                            `).join('')}
                            <form class="comment-form" data-publicacion-id="${post.id}">
                                <textarea placeholder="Escribe un comentario..." class="comment-input"></textarea>
                                <button type="submit">Comentar</button>
                            </form>
                        </div>
                        `;
                    postsFeed.appendChild(div);
                });
                initPostActionListeners(); // Llama esto después de que los posts se hayan añadido al DOM
            })
            .catch(err => {
                alert("Error inesperado al obtener publicaciones: " + err.message);
                console.error(err);
            });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(this);

            fetch(djangoUrls.publicar_ajax, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                credentials: 'include'
            })
                .then(async r => {
                    const contentType = r.headers.get("content-type");
                    if (!r.ok) {
                        const text = await r.text();
                        throw new Error("HTTP Error: " + r.status + " - " + text);
                    }
                    if (!contentType || !contentType.includes("application/json")) {
                        const text = await r.text();
                        throw new Error("Respuesta no válida o no JSON: " + text);
                    }
                    return await r.json();
                })
                .then(data => {
                    if (data.ok) {
                        alert(data.mensaje || "Publicado correctamente.");
                        form.reset();
                        obtenerPublicaciones(); // Refresca las publicaciones
                    } else {
                        alert(data.error || "Error al publicar");
                    }
                })
                .catch(err => {
                    alert("Error inesperado: " + err.message);
                    console.error(err);
                });
        });

        obtenerPublicaciones(); // Carga las publicaciones cuando la página se inicializa
    }

    // === INICIO DE LAS FUNCIONES QUE NECESITAN SER GLOBALES ===

    // Función para (re)inicializar los event listeners de los botones de reacción y comentario
    function initPostActionListeners() {
        document.querySelectorAll('.react-btn').forEach(button => {
            // Importante: Remover listener para evitar duplicados si se llama varias veces
            button.removeEventListener('click', handleReaccion);
            button.addEventListener('click', handleReaccion);
        });

        document.querySelectorAll('.comment-btn').forEach(button => {
            button.removeEventListener('click', toggleCommentsSection);
            button.addEventListener('click', toggleCommentsSection);
        });

        document.querySelectorAll('.comment-form').forEach(form => {
            form.removeEventListener('submit', handleComentario);
            form.addEventListener('submit', handleComentario);
        });
    }
    window.initPostActionListeners = initPostActionListeners; // Hacer global

    function handleReaccion(e) {
        e.preventDefault(); // Evita el comportamiento por defecto del botón
        const publicacionId = this.dataset.publicacionId;
        const tipoReaccion = this.dataset.tipoReaccion;

        const urlReaccion = djangoUrls.agregar_reaccion.replace('/0/', `/${publicacionId}/`);

        fetch(urlReaccion, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tipo: tipoReaccion }),
            credentials: 'include'
        })
        .then(r => {
            if (!r.ok) throw new Error("HTTP Error: " + r.status + " - " + (r.statusText || ""));
            return r.json();
        })
        .then(data => {
            if (data.ok) {
                console.log(data.mensaje);
                const reactionCountSpan = this.querySelector('.reaction-count');
                if (reactionCountSpan) {
                    reactionCountSpan.textContent = data.total_reacciones;
                }
                // Si la acción fue exitosa, y esto se llamó desde el feed principal
                // no es necesario un reload completo de la página, solo actualizar el contador.
                // Si se llama desde el perfil, es porque ya se recargó via initPostActionListeners.
            } else {
                alert(data.error || "Error al reaccionar.");
            }
        })
        .catch(err => {
            alert("Error al reaccionar: " + err.message);
            console.error(err);
        });
    }
    window.handleReaccion = handleReaccion; // Hacer global

    function toggleCommentsSection(e) {
        const publicacionId = this.dataset.publicacionId;
        const commentsSection = document.querySelector(`.comments-section[data-publicacion-id="${publicacionId}"]`);
        if (commentsSection) {
            commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
        }
    }
    window.toggleCommentsSection = toggleCommentsSection; // Hacer global

    function handleComentario(e) {
        e.preventDefault();
        const publicacionId = this.dataset.publicacionId;
        const commentInput = this.querySelector('.comment-input');
        const contenido = commentInput.value.trim();

        if (!contenido) {
            alert("El comentario no puede estar vacío.");
            return;
        }

        const urlComentario = djangoUrls.agregar_comentario.replace('/0/', `/${publicacionId}/`);

        fetch(urlComentario, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contenido: contenido }),
            credentials: 'include'
        })
        .then(r => {
            if (!r.ok) throw new Error("HTTP Error: " + r.status + " - " + (r.statusText || ""));
            return r.json();
        })
        .then(data => {
            if (data.ok) {
                alert(data.mensaje);
                commentInput.value = '';

                const commentsSection = document.querySelector(`.comments-section[data-publicacion-id="${publicacionId}"]`);
                if (commentsSection) {
                    const newCommentDiv = document.createElement('div');
                    newCommentDiv.className = 'comment-item';
                    newCommentDiv.innerHTML = `<strong>${data.comentario.autor}</strong> (${data.comentario.fecha}): ${data.comentario.contenido}`;
                    commentsSection.insertBefore(newCommentDiv, commentsSection.querySelector('.comment-form'));

                    const commentCountSpan = commentsSection.previousElementSibling.querySelector('.comment-count');
                    if(commentCountSpan) {
                        commentCountSpan.textContent = parseInt(commentCountSpan.textContent) + 1;
                    }
                }
                // Si la acción fue exitosa, no es necesario un reload completo de la página,
                // solo se añade el comentario y se actualiza el contador.
            } else {
                alert(data.error || "Error al comentar.");
            }
        })
        .catch(err => {
            alert("Error al comentar: " + err.message);
            console.error(err);
        });
    }
    window.handleComentario = handleComentario; // Hacer global


    // === FIN DE LAS FUNCIONES QUE NECESITAN SER GLOBALES ===

    // Hamburguesa móvil (TU CÓDIGO ORIGINAL)
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger-menu';
    hamburger.innerHTML = `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    document.body.appendChild(hamburger);
    document.body.appendChild(overlay);

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
        hamburger.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        hamburger.classList.remove('active');
    });

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    function handleMediaQuery(e) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        if (!e.matches) updateSidebarState();
        else {
            appWrapper.classList.remove('sidebar-collapsed');
            sidebar.classList.remove('collapsed');
        }
    }
    handleMediaQuery(mediaQuery);
    mediaQuery.addEventListener('change', handleMediaQuery);

    const profileView = document.getElementById('profileView');
    if (profileView) {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    toggleHeaderForProfile();
                }
            });
        });
        observer.observe(profileView, { attributes: true });
    }

    showView('home');
    obtenerPublicaciones(); // Asegura que las publicaciones se carguen al inicio
    initPostActionListeners(); // Asegura que los listeners se configuren para posts iniciales

    function eliminarPublicacion(publicacionId) {
        if (!confirm("¿Estás seguro de que quieres eliminar esta publicación?")) return;

        const urlEliminar = djangoUrls.eliminar_publicacion.replace('/0/', `/${publicacionId}/`);

        fetch(urlEliminar, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        .then(r => {
            if (!r.ok) throw new Error("Error al eliminar publicación: " + r.status);
            return r.json();
        })
        .then(data => {
            if (data.ok) {
                alert(data.mensaje || "Publicación eliminada.");
                const postDiv = document.querySelector(`.post-actions button[data-publicacion-id="${publicacionId}"]`)?.closest('.post');
                if (postDiv) {
                    postDiv.style.transition = 'opacity 0.3s ease';
                    postDiv.style.opacity = '0';
                    setTimeout(() => postDiv.remove(), 300);
                }
                // Si la publicación se elimina desde el perfil, es buena idea recargar las publicaciones del perfil
                // para que el contador y la lista se actualicen.
                if (typeof window.renderPublicationsSection === 'function') {
                    window.renderPublicationsSection();
                } else {
                    console.warn("renderPublicationsSection no está definida. La lista de publicaciones del perfil no se actualizará.");
                }

            } else {
                alert(data.error || "No se pudo eliminar.");
            }
        })
        .catch(err => {
            alert("Error inesperado: " + err.message);
            console.error(err);
        });
    }
    window.eliminarPublicacion = eliminarPublicacion; // Ya estaba aquí, pero lo incluyo para que sea obvio.

    window.toggleDropdown = function(button) {
        const dropdown = button.nextElementSibling;
        if (dropdown && dropdown.classList.contains('dropdown-options')) {
            const visible = dropdown.style.display === 'block';
            // Ocultar todos los dropdowns primero
            document.querySelectorAll('.dropdown-options').forEach(el => el.style.display = 'none');
            // Mostrar solo este si estaba oculto
            dropdown.style.display = visible ? 'none' : 'block';
        }
    };
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            document.querySelectorAll('.dropdown-options').forEach(el => el.style.display = 'none');
        }
    });

});