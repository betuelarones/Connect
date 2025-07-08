document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ sugerencias.js cargado");
    initSugerenciasButtons();
});

function enviarSolicitudHandler(e) {
    const button = e.currentTarget;
    const card = button.closest('.sug-card-sugerencia');
    const userId = card.dataset.usuarioId;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    fetch(`/amistades/enviar/${userId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            button.classList.remove('sug-enviar-solicitud-btn');
            button.classList.add('sug-cancelar-solicitud-btn');
            button.textContent = 'Cancelar solicitud';

            button.removeEventListener('click', enviarSolicitudHandler);
            button.addEventListener('click', cancelarSolicitudHandler);
        } else {
            console.warn(data.error || "Error al enviar solicitud");
        }
    })
    .catch(error => console.error("Error al enviar:", error));
}

function cancelarSolicitudHandler(e) {
    const button = e.currentTarget;
    const card = button.closest('.sug-card-sugerencia');
    const userId = card.dataset.usuarioId;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

    fetch(`/amistades/cancelar/${userId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            button.classList.remove('sug-cancelar-solicitud-btn');
            button.classList.add('sug-enviar-solicitud-btn');
            button.textContent = 'Añadir amigo';

            button.removeEventListener('click', cancelarSolicitudHandler);
            button.addEventListener('click', enviarSolicitudHandler);
        } else {
            console.warn(data.error || "Error al cancelar solicitud");
        }
    })
    .catch(error => console.error("Error al cancelar:", error));
}

function initSugerenciasButtons() {
    document.querySelectorAll('.sug-enviar-solicitud-btn').forEach(button => {
        button.removeEventListener('click', enviarSolicitudHandler);
        button.addEventListener('click', enviarSolicitudHandler);
    });

    document.querySelectorAll('.sug-cancelar-solicitud-btn').forEach(button => {
        button.removeEventListener('click', cancelarSolicitudHandler);
        button.addEventListener('click', cancelarSolicitudHandler);
    });
}
