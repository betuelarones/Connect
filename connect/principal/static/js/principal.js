document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded cargado. Script principal.js iniciado.");

    const sidebar = document.getElementById('sidebar');
    const mainContentArea = document.getElementById('mainContent');
    const header = document.getElementById('header');
    const appWrapper = document.querySelector('.app-wrapper');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link, #headerProfileLink');
    const views = document.querySelectorAll('.view');

    let isSidebarCollapsed = localStorage.getItem('isSidebarCollapsed') === 'true';
    console.log("Estado inicial del sidebar (desde localStorage):", isSidebarCollapsed);

    const updateSidebarState = () => {
        if (isSidebarCollapsed) {
            sidebar.classList.add('collapsed');
            appWrapper.classList.add('sidebar-collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            appWrapper.classList.remove('sidebar-collapsed');
        }
        console.log("Sidebar state updated. Collapsed:", isSidebarCollapsed);
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
        console.log(`Intentando mostrar la vista: ${viewId}`);

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

        // ---------------------
        // Carga AJAX de SUGERENCIAS
        // ---------------------
        if (viewId === 'sugerencias') {
            const sugerenciasView = document.getElementById('sugerenciasView');
            if (sugerenciasView && !sugerenciasView.dataset.loaded) {
                console.log("Iniciando carga AJAX para Sugerencias...");
                fetch(urls.sugerencias)
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(text => {
                                throw new Error(`Server Error: ${text}`);
                            });
                        }
                        return response.text();
                    })
                    .then(html => {
                        sugerenciasView.innerHTML = html;
                        sugerenciasView.dataset.loaded = 'true';

                        if (typeof initSugerenciasButtons === 'function') {
                            initSugerenciasButtons();
                        }

                        sugerenciasView.querySelectorAll('.card-acciones form').forEach(form => {
                            form.addEventListener('submit', function (e) {
                                e.preventDefault();
                                const formData = new FormData(this);
                                const url = this.action;

                                fetch(url, {
                                    method: 'POST',
                                    body: formData,
                                    headers: {'X-CSRFToken': formData.get('csrfmiddlewaretoken')}
                                })
                                    .then(response => {
                                        if (!response.ok) {
                                            return response.json().then(errorData => {
                                                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                                            });
                                        }
                                        return response.json();
                                    })
                                    .then(data => {
                                        if (data.success) {
                                            alert(data.message || 'Acción completada.');
                                            delete sugerenciasView.dataset.loaded;
                                            showView('sugerencias');
                                        } else {
                                            alert(data.message || 'Hubo un problema.');
                                        }
                                    })
                                    .catch(error => {
                                        alert('Hubo un error: ' + error.message);
                                    });
                            });
                        });
                    })
                    .catch(error => {
                        sugerenciasView.innerHTML = '<p class="error-message">Error al cargar las sugerencias.</p>';
                    });
            }
        }

        // ---------------------
        // Carga AJAX de SOLICITUDES
        // ---------------------
        if (viewId === 'solicitudes') {
            const solicitudesView = document.getElementById('solicitudesView');
            if (solicitudesView && !solicitudesView.dataset.loaded) {
                console.log("Iniciando carga AJAX para Solicitudes...");
                fetch(urls.solicitudes)
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(text => {
                                throw new Error(`Error del servidor: ${text}`);
                            });
                        }
                        return response.text();
                    })
                    .then(html => {
                        solicitudesView.innerHTML = html;
                        solicitudesView.dataset.loaded = 'true';
                    })
                    .catch(error => {
                        solicitudesView.innerHTML = '<p class="error-message">Error al cargar las solicitudes.</p>';
                        console.error(error);
                    });
            }
        }
        // ---------------------
// Carga AJAX de MENSAJES
// ---------------------
        if (viewId === 'messages') {
            const messagesView = document.getElementById('messagesView');
            if (messagesView && !messagesView.dataset.loaded) {
                console.log("Iniciando carga AJAX para Mensajes...");
                fetch(urls.verMensajes)
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(text => {
                                throw new Error(`Error del servidor: ${text}`);
                            });
                        }
                        return response.text();
                    })
                    .then(html => {
                        messagesView.innerHTML = html;
                        messagesView.dataset.loaded = 'true';

                        // Si tu módulo de mensajes usa funciones JS propias, inicialízalas aquí.
                        if (typeof initMensajes === 'function') {
                            initMensajes();  // puedes definir esto dentro de mensaje.js
                        }
                    })
                    .catch(error => {
                        messagesView.innerHTML = '<p class="error-message">Error al cargar los mensajes.</p>';
                        console.error(error);
                    });
            }
        }

    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const page = link.dataset.page;
            if (page) {
                e.preventDefault();
                showView(page);
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

    window.addStory = function () {
        alert('Funcionalidad de añadir historia');
    };

    window.viewStory = function (user) {
        alert('Viendo historia de ' + user);
    };

    const mediaQuery = window.matchMedia('(max-width: 768px)');

    function handleMediaQuery(e) {
        const overlay = document.querySelector('.overlay');
        sidebar.classList.remove('show');
        overlay?.classList.remove('show');

        if (!e.matches) updateSidebarState();
        else {
            appWrapper.classList.remove('sidebar-collapsed');
            sidebar.classList.remove('collapsed');
        }
    }

    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            document.querySelector('.overlay')?.classList.toggle('show');
        });
    }

    document.querySelector('.overlay')?.addEventListener('click', () => {
        sidebar.classList.remove('show');
        document.querySelector('.overlay')?.classList.remove('show');
    });

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
        observer.observe(profileView, {attributes: true});
    }

    showView('home');
});

// Agregado: botón hamburguesa y overlay para móviles
document.addEventListener('DOMContentLoaded', function () {
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

    const sidebar = document.querySelector('.sidebar');

    hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
        hamburger.classList.toggle('active');
    });

    overlay.addEventListener('click', function () {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        hamburger.classList.remove('active');
    });
});
