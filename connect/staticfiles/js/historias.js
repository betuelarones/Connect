let historiasUsuario = [];
let indiceActual = 0;
let autoPlayTimer = null;

// Abrir el modal para agregar historia
function addStory() {
    document.getElementById('storyModal').style.display = 'block';
}

// Cerrar el modal
function closeStoryModal() {
    document.getElementById('storyModal').style.display = 'none';
}

// Previsualización de imagen o video
document.getElementById('mediaInput').addEventListener('change', function () {
    const file = this.files[0];
    const preview = document.getElementById('previewHistoria');
    preview.innerHTML = '';

    if (file) {
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.controls = true;
            video.src = URL.createObjectURL(file);
            preview.appendChild(video);

            video.onloadedmetadata = function () {
                if (video.duration > 30) {
                    alert("El video no puede durar más de 30 segundos.");
                    document.getElementById('mediaInput').value = '';
                    preview.innerHTML = '';
                }
            };
        } else if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '100%';
            img.style.borderRadius = '10px';
            preview.appendChild(img);
        }
    }
});

function cargarHistoriasPropias() {
    fetch(`/historias/ver/?usuario_id=${USER_ID}`, {
        headers: {
            'x-requested-with': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.historias.length > 0) {
            const contenedor = document.querySelector('.stories-scroll');
            const historia = data.historias[0];

            // Evita duplicar
            const yaExiste = Array.from(contenedor.children).some(child => {
                return child.querySelector('.story-name')?.textContent === 'Mi Historia';
            });

            if (!yaExiste) {
                const miHistoria = document.createElement('div');
                miHistoria.classList.add('story-item');
                miHistoria.setAttribute('onclick', `viewStory('${USER_ID}')`);
                miHistoria.innerHTML = `
                    <div class="story-avatar">
                        <div class="story-avatar-placeholder">M</div>
                    </div>
                    <div class="story-name">Mi Historia</div>
                `;
                contenedor.insertBefore(miHistoria, contenedor.children[1]);
            }
        }
    })
    .catch(err => console.error("Error al cargar historias propias:", err));
}
function cargarHistoriasDeAmigos() {
    fetch('/historias/ver/', {
        headers: {
            'x-requested-with': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        const contenedor = document.querySelector('.stories-scroll');

        const autoresVistos = new Set();

        data.historias.forEach(historia => {
            if (historia.autor_id === USER_ID) return; // Ya está en 'Mi Historia'
            if (autoresVistos.has(historia.autor_id)) return;

            autoresVistos.add(historia.autor_id);

            const storyItem = document.createElement('div');
            storyItem.className = 'story-item';
            storyItem.setAttribute('onclick', `viewStory('${historia.autor_id}')`);
            storyItem.innerHTML = `
                <div class="story-avatar">
                    <div class="story-avatar-placeholder">${historia.autor.charAt(0).toUpperCase()}</div>
                </div>
                <div class="story-name">${historia.autor}</div>
            `;
            contenedor.appendChild(storyItem);
        });
    })
    .catch(err => console.error("Error al cargar historias de amigos:", err));
}

function viewStory(usuarioID) {
    fetch(`/historias/ver/?usuario_id=${usuarioID}`, {
        headers: {
            'x-requested-with': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        historiasUsuario = data.historias;
        console.log("📸 Historias cargadas:", historiasUsuario);
        indiceActual = 0;
        mostrarHistoriaLateral();
        actualizarIndicadores();
        document.getElementById("storyViewer").style.display = "block";
        startAutoPlay();
    })
    .catch(error => {
        console.error("Error al cargar historias del usuario:", error);
    });
}

// Crear indicadores de progreso
function actualizarIndicadores() {
    const indicadores = document.getElementById('storyIndicators');
    indicadores.innerHTML = '';

    historiasUsuario.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'story-indicator';
        if (index < indiceActual) {
            indicator.classList.add('completed');
        } else if (index === indiceActual) {
            indicator.classList.add('active');
        }
        indicadores.appendChild(indicator);
    });
}

// Función para formatear tiempo
function formatearTiempo(fechaCreacion) {
    if (!fechaCreacion) return 'hace un momento';

    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora - fecha;

    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (dias > 0) return `hace ${dias}d`;
    if (horas > 0) return `hace ${horas}h`;
    if (minutos > 0) return `hace ${minutos}m`;
    return 'hace un momento';
}

// Mostrar la historia actual en el visor
function mostrarHistoriaLateral() {
    const contenedor = document.getElementById("viewerBody");
    const historia = historiasUsuario[indiceActual];

    // Actualizar información del usuario
    const username = document.getElementById('storyUsername');
    const timestamp = document.getElementById('storyTimestamp');
    const avatar = document.getElementById('storyAvatar');

    username.textContent = historia.autor || 'Usuario';
    timestamp.textContent = formatearTiempo(historia.fecha_creacion);
    avatar.textContent = (historia.autor || 'U').charAt(0).toUpperCase();

    // Contenido principal
    contenedor.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
            ${historia.imagen ? `<img src="${historia.imagen}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
            ${historia.video ? `<video src="${historia.video}" style="width: 100%; height: 100%; object-fit: cover;" autoplay muted loop></video>` : ''}

            ${historia.contenido ? `
                <div class="story-text-overlay">
                    <p>${historia.contenido}</p>
                </div>
            ` : ''}
        </div>
    `;

    // Actualizar botones de navegación
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = indiceActual === 0;
    nextBtn.disabled = indiceActual === historiasUsuario.length - 1;

    actualizarIndicadores();
}

// Auto-play de historias
function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setTimeout(() => {
        if (indiceActual < historiasUsuario.length - 1) {
            nextStory();
        } else {
            closeStoryViewer();
        }
    }, 5000); // 5 segundos por historia
}

function stopAutoPlay() {
    if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
    }
}

// Navegar entre historias
function prevStory() {
    if (indiceActual > 0) {
        indiceActual--;
        mostrarHistoriaLateral();
        startAutoPlay();
    }
}

function nextStory() {
    if (indiceActual < historiasUsuario.length - 1) {
        indiceActual++;
        mostrarHistoriaLateral();
        startAutoPlay();
    } else {
        closeStoryViewer();
    }
}

// Cerrar visor de historia
function closeStoryViewer() {
    document.getElementById("storyViewer").style.display = "none";
    stopAutoPlay();
}

// Pausar auto-play cuando el usuario interactúa
document.addEventListener('DOMContentLoaded', function() {
    const storyViewer = document.getElementById('storyViewer');

    if (storyViewer) {
        storyViewer.addEventListener('mouseenter', stopAutoPlay);
        storyViewer.addEventListener('mouseleave', startAutoPlay);

        // Navegación con teclado
        document.addEventListener('keydown', function(e) {
            if (storyViewer.style.display === 'block') {
                if (e.key === 'ArrowLeft') prevStory();
                if (e.key === 'ArrowRight') nextStory();
                if (e.key === 'Escape') closeStoryViewer();
            }
        });
    }
});

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
    cargarHistoriasPropias();
    cargarHistoriasDeAmigos();
});