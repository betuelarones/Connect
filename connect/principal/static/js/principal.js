/* ========================================
   JAVASCRIPT PARA INTERACTIVIDAD
   - Manejo de enlaces activos
   - Toggle del sidebar en móvil
   - Funcionalidades adicionales
======================================== */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {

    // ========================================
    // ELEMENTOS DEL DOM
    // ========================================

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const searchInput = document.querySelector('.search-input');

    // ========================================
    // MANEJO DE ENLACES ACTIVOS
    // ========================================

    /**
     * Función para activar un enlace y desactivar los demás
     * @param {Element} activeLink - El enlace que se debe activar
     */
    function setActiveLink(activeLink) {
        // Remover clase 'active' de todos los enlaces
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Agregar clase 'active' al enlace seleccionado
        activeLink.classList.add('active');

        // Guardar el enlace activo en localStorage para persistencia
        const pageId = activeLink.getAttribute('data-page');
        if (pageId) {
            localStorage.setItem('activeNavLink', pageId);
        }
    }

    /**
     * Función para restaurar el enlace activo desde localStorage
     */
    function restoreActiveLink() {
        const activePageId = localStorage.getItem('activeNavLink');
        if (activePageId) {
            const activeLink = document.querySelector(`[data-page="${activePageId}"]`);
            if (activeLink) {
                setActiveLink(activeLink);
            }
        }
    }

    // Agregar event listeners a todos los enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevenir la navegación por defecto para la demo
            // En producción, quitar esta línea para permitir navegación real
            e.preventDefault();

            // Activar el enlace clickeado
            setActiveLink(this);

            // Cerrar sidebar en móvil después de hacer clic
            if (window.innerWidth <= 768) {
                closeSidebar();
            }

            // Opcional: Mostrar qué página se "navegó"
            const pageName = this.querySelector('.nav-text').textContent;
            showPageNavigation(pageName);
        });
    });

    // ========================================
    // TOGGLE DEL SIDEBAR EN MÓVIL
    // ========================================

    /**
     * Función para abrir el sidebar
     */
    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    /**
     * Función para cerrar el sidebar
     */
    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll del body
    }

    /**
     * Función para alternar el estado del sidebar
     */
    function toggleSidebar() {
        if (sidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Event listener para el botón hamburguesa
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }

    // Event listener para el overlay (cerrar al hacer clic fuera)
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // ========================================
    // MANEJO DE REDIMENSIONAMIENTO DE VENTANA
    // ========================================

    /**
     * Función para manejar cambios en el tamaño de la ventana
     */
    function handleResize() {
        // Si la ventana se hace más grande que 768px, cerrar el sidebar móvil
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    }

    // Event listener para redimensionamiento de ventana
    window.addEventListener('resize', handleResize);

    // ========================================
    // FUNCIONALIDAD DE BÚSQUEDA
    // ========================================

    /**
     * Función para manejar la búsqueda
     * @param {string} query - Término de búsqueda
     */
    function handleSearch(query) {
        if (query.trim()) {
            console.log('Buscando:', query);
            // Aquí podrías implementar la lógica de búsqueda real
            showSearchResults(query);
        }
    }

    /**
     * Función para mostrar resultados de búsqueda (demo)
     * @param {string} query - Término de búsqueda
     */
    function showSearchResults(query) {
        // Crear elemento temporal para mostrar resultado
        const searchResult = document.createElement('div');
        searchResult.style.cssText = `
            position: fixed;
            top: 90px;
            left: 50%;
            transform: translateX(-50%);
            background: #0095f6;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        searchResult.textContent = `Buscando: "${query}"`;
        document.body.appendChild(searchResult);

        // Remover después de 3 segundos
        setTimeout(() => {
            if (searchResult.parentNode) {
                searchResult.parentNode.removeChild(searchResult);
            }
        }, 3000);
    }

    // Event listeners para el campo de búsqueda
    if (searchInput) {
        // Búsqueda al presionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch(this.value);
            }
        });

        // Búsqueda en tiempo real (opcional)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length > 2) {
                    // Búsqueda automática después de 3 caracteres
                    console.log('Búsqueda automática:', this.value);
                }
            }, 500);
        });
    }

    // ========================================
    // NAVEGACIÓN DE PÁGINAS (DEMO)
    // ========================================

    /**
     * Función para mostrar qué página se está "navegando"
     * @param {string} pageName - Nombre de la página navegada
     */
    function showPageNavigation(pageName) {
        // Actualizar el título de la página
        document.title = `${pageName} - Instagram`;

        // Actualizar el contenido principal (demo)
        const contentContainer = document.querySelector('.content-container');
        if (contentContainer) {
            const currentContent = contentContainer.innerHTML;

            // Crear contenido dinámico basado en la página
            const pageContent = generatePageContent(pageName);

            // Mostrar notificación de navegación
            showNavigationNotification(pageName);

            // Opcional: Cambiar contenido (comentado para mantener el contenido original)
            // contentContainer.innerHTML = pageContent;
        }
    }

    /**
     * Función para generar contenido específico de cada página
     * @param {string} pageName - Nombre de la página
     * @returns {string} - HTML del contenido de la página
     */
    function generatePageContent(pageName) {
        const pageContents = {
            'Inicio': `
                <h1>🏠 Inicio</h1>
                <p>Bienvenido a tu feed principal de Instagram.</p>
                <div class="demo-content">
                    <h2>Feed de publicaciones</h2>
                    <p>Aquí aparecerían las publicaciones de las personas que sigues.</p>
                </div>
            `,
            'Búsqueda': `
                <h1>🔍 Búsqueda</h1>
                <p>Descubre nuevas cuentas y contenido.</p>
                <div class="demo-content">
                    <h2>Búsqueda avanzada</h2>
                    <p>Utiliza el campo de búsqueda en la parte superior para encontrar contenido.</p>
                </div>
            `,
            'Explorar': `
                <h1>⚡ Explorar</h1>
                <p>Explora contenido trending y recomendaciones personalizadas.</p>
                <div class="demo-content">
                    <h2>Contenido recomendado</h2>
                    <p>Aquí se mostrarían publicaciones populares y sugerencias.</p>
                </div>
            `,
            'Reels': `
                <h1>🎬 Reels</h1>
                <p>Videos cortos y entretenidos.</p>
                <div class="demo-content">
                    <h2>Videos populares</h2>
                    <p>Disfruta de los Reels más populares y creativos.</p>
                </div>
            `,
            'Mensajes': `
                <h1>💬 Mensajes</h1>
                <p>Tus conversaciones privadas.</p>
                <div class="demo-content">
                    <h2>Bandeja de entrada</h2>
                    <p>Aquí aparecerían tus mensajes directos y conversaciones.</p>
                </div>
            `,
            'Notificaciones': `
                <h1>🔔 Notificaciones</h1>
                <p>Mantente al día con tu actividad.</p>
                <div class="demo-content">
                    <h2>Actividad reciente</h2>
                    <p>Likes, comentarios, nuevos seguidores y más.</p>
                </div>
            `,
            'Crear': `
                <h1>➕ Crear</h1>
                <p>Comparte tu contenido con el mundo.</p>
                <div class="demo-content">
                    <h2>Nueva publicación</h2>
                    <p>Sube fotos, videos o crea un Reel.</p>
                </div>
            `,
            'Threads': `
                <h1>🧵 Threads</h1>
                <p>Conversaciones y debates.</p>
                <div class="demo-content">
                    <h2>Hilos de conversación</h2>
                    <p>Participa en conversaciones más profundas.</p>
                </div>
            `,
            'Más': `
                <h1>⚙️ Más</h1>
                <p>Configuración y opciones adicionales.</p>
                <div class="demo-content">
                    <h2>Opciones</h2>
                    <p>Configuración, ayuda, términos y más.</p>
                </div>
            `
        };

        return pageContents[pageName] || `
            <h1>${pageName}</h1>
            <p>Contenido de la página ${pageName}.</p>
        `;
    }

    /**
     * Función para mostrar notificación de navegación
     * @param {string} pageName - Nombre de la página
     */
    function showNavigationNotification(pageName) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #262626;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = `Navegando a: ${pageName}`;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animar salida y remover
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // ========================================
    // ATAJOS DE TECLADO
    // ========================================

    /**
     * Función para manejar atajos de teclado
     * @param {KeyboardEvent} e - Evento de teclado
     */
    function handleKeyboardShortcuts(e) {
        // Evitar interferir si se está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch(e.key) {
            case 'Escape':
                // Cerrar sidebar con Escape
                closeSidebar();
                break;

            case '/':
                // Enfocar búsqueda con '/'
                e.preventDefault();
                if (searchInput) {
                    searchInput.focus();
                }
                break;

            case 'h':
                // Ir a Inicio con 'h'
                e.preventDefault();
                const homeLink = document.querySelector('[data-page="inicio"]');
                if (homeLink) {
                    homeLink.click();
                }
                break;
        }
    }

    // Event listener para atajos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    /**
     * Función de inicialización que se ejecuta al cargar la página
     */
    function initializeApp() {
        console.log('Instagram Layout inicializado');

        // Restaurar enlace activo desde localStorage
        restoreActiveLink();

        // Configurar estado inicial basado en el tamaño de pantalla
        if (window.innerWidth <= 768) {
            closeSidebar();
        }

        // Añadir clase para indicar que JS está cargado
        document.body.classList.add('js-loaded');

        // Mensaje de bienvenida en consola
        console.log('🎉 Layout de Instagram cargado exitosamente!');
        console.log('💡 Atajos disponibles:');
        console.log('   - Escape: Cerrar sidebar');
        console.log('   - /: Enfocar búsqueda');
        console.log('   - h: Ir a Inicio');
    }

    // ========================================
    // FUNCIONES DE UTILIDAD
    // ========================================

    /**
     * Función para detectar dispositivos móviles
     * @returns {boolean} - True si es móvil
     */
    function isMobileDevice() {
        return window.innerWidth <= 768;
    }

    /**
     * Función para obtener el estado del sidebar
     * @returns {boolean} - True si está abierto
     */
    function isSidebarOpen() {
        return sidebar.classList.contains('active');
    }

    /**
     * Función de debounce para optimizar eventos
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} - Función con debounce
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Optimizar el evento resize con debounce
    const debouncedResize = debounce(handleResize, 250);
    window.removeEventListener('resize', handleResize);
    window.addEventListener('resize', debouncedResize);

    // ========================================
    // EJECUTAR INICIALIZACIÓN
    // ========================================

    // Inicializar la aplicación
    initializeApp();

    // ========================================
    // EXPORTAR FUNCIONES PARA USO GLOBAL (OPCIONAL)
    // ========================================

    // Hacer algunas funciones disponibles globalmente si es necesario
    window.instagramLayout = {
        toggleSidebar,
        setActiveLink,
        showPageNavigation,
        isMobileDevice,
        isSidebarOpen
    };

});

// ========================================
// FUNCIONES FUERA DEL DOMContentLoaded
// ========================================

/**
 * Función para manejar errores JavaScript
 * @param {Event} e - Evento de error
 */
window.addEventListener('error', function(e) {
    console.error('Error en Instagram Layout:', e.error);
});

/**
 * Función para manejar promesas rechazadas
 * @param {Event} e - Evento de promesa rechazada
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada en Instagram Layout:', e.reason);
});

// Mensaje de carga inicial
console.log('📱 Instagram Layout - JavaScript cargando...');