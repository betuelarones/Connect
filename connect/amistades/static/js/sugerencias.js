function initSugerenciasButtons() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    document.querySelectorAll('.sug-enviar-solicitud-btn').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.sug-card-sugerencia');
            const userId = card.dataset.usuarioId;

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
                    // Reemplazar botón por "Cancelar solicitud"
                    button.className = 'sug-cancelar-solicitud-btn';
                    button.textContent = 'Cancelar solicitud';
                    button.removeEventListener('click', null);
                    initSugerenciasButtons(); // volver a inicializar para el nuevo botón
                }
            });
        });
    });

    document.querySelectorAll('.sug-cancelar-solicitud-btn').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.sug-card-sugerencia');
            const userId = card.dataset.usuarioId;

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
                    // Reemplazar botón por "Añadir amigo"
                    button.className = 'sug-enviar-solicitud-btn';
                    button.textContent = 'Añadir amigo';
                    button.removeEventListener('click', null);
                    initSugerenciasButtons();
                }
            });
        });
    });
}
