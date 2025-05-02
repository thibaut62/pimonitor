// dateinfo.js - Module pour les informations de date et saint du jour

window.DateInfoModule = (function() {
    // Chargement des informations de date
    async function loadDateInfo() {
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/dateinfo`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données de date reçues:', data);
            
            const dateInfoContainer = document.getElementById('date-info');
            if (!dateInfoContainer) {
                window.DashboardUtils.logError('Élément date-info introuvable');
                return;
            }
            
            dateInfoContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="me-auto">
                        <h4 class="mb-0">${data.date}</h4>
                        <div class="text-muted">Aujourd'hui nous fêtons: ${data.saint}</div>
                    </div>
                    <div class="info-badge">
                        <i class="fas fa-calendar-day me-2"></i>
                        <span id="time-now">${getCurrentTime()}</span>
                    </div>
                </div>
            `;
            
            // Mise à jour de l'heure toutes les secondes
            startClock();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des informations de date:', error);
            const dateInfoContainer = document.getElementById('date-info');
            if (dateInfoContainer) {
                dateInfoContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Impossible de charger les informations de date
                    </div>
                `;
            }
        }
    }
    
    // Obtenir l'heure actuelle formatée
    function getCurrentTime() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
    
    // Démarrer l'horloge en temps réel
    function startClock() {
        // Éviter les multiples intervalles
        if (window.clockInterval) {
            clearInterval(window.clockInterval);
        }
        
        window.clockInterval = setInterval(() => {
            const timeElement = document.getElementById('time-now');
            if (timeElement) {
                timeElement.textContent = getCurrentTime();
            } else {
                // Si l'élément n'existe plus, arrêter l'intervalle
                clearInterval(window.clockInterval);
            }
        }, 1000);
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module DateInfo');
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadDateInfo
    };
})();