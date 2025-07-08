document.addEventListener('DOMContentLoaded', function () {
    console.log("✅ solicitudes.js cargado");
    initSolicitudesHandlers();
});

function initSolicitudesHandlers() {
    document.querySelectorAll('.form-aceptar').forEach(form => {
        form.addEventListener('submit', aceptarSolicitudAjax);
    });

    document.querySelectorAll('.form-rechazar').forEach(form => {
        form.addEventListener('submit', rechazarSolicitudAjax);
    });
}

function aceptarSolicitudAjax(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const amistadId = form.dataset.id;
    const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/amistades/aceptar/${amistadId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const card = form.closest('.solicitud-request-card');
            card.querySelector('.solicitud-card-right').innerHTML =
                '<button class="solicitud-btn solicitud-btn-friends" disabled>✓ Amigos</button>';
        } else {
            alert(data.error || "Error al aceptar.");
        }
    });
}

function rechazarSolicitudAjax(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const amistadId = form.dataset.id;
    const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/amistades/rechazar/${amistadId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const card = form.closest('.solicitud-request-card');
            card.remove();
        } else {
            alert(data.error || "Error al rechazar.");
        }
    });
}
