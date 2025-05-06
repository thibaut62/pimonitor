// memory.js - Module pour la gestion des statistiques de mémoire

window.MemoryModule = (function() {
    // Variables privées
    let initialized = false;
    
    // Vérifier si les éléments DOM requis sont présents
    function checkRequiredElements() {
        return document.getElementById('memory-used') && 
               document.getElementById('memory-free') && 
               document.getElementById('memory-percentage') && 
               document.getElementById('memory-progress');
    }
    
    // Chargement des informations de mémoire
    async function loadMemoryInfo() {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            window.DashboardUtils.logDebug('Composant mémoire non chargé, nouvelle tentative dans 500ms');
            setTimeout(loadMemoryInfo, 500);
            return;
        }
        
        initialized = true;
        
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/system`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données mémoire reçues:', data);
            
            // Mise à jour mémoire
            if (data.memory) {
                document.getElementById('memory-used').textContent = `${data.memory.used} / ${data.memory.total}`;
                document.getElementById('memory-free').textContent = `Libre: ${data.memory.free}`;
                document.getElementById('memory-percentage').textContent = `Utilisée: ${data.memory.usedPercentage}%`;
                document.getElementById('memory-progress').style.width = `${data.memory.usedPercentage}%`;
                document.getElementById('memory-progress').setAttribute('aria-valuenow', data.memory.usedPercentage);
            }
            
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des informations mémoire:', error);
        }
    }
    
    // Mise à jour en temps réel des informations de mémoire
    function updateRealtime(data) {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            return;
        }
        
        // Mise à jour mémoire
        if (data.memory) {
            if (data.memory.used && data.memory.total) {
                document.getElementById('memory-used').textContent = `${data.memory.used} / ${data.memory.total} GB`;
            }
            
            if (data.memory.usedPercentage) {
                document.getElementById('memory-percentage').textContent = `Utilisée: ${data.memory.usedPercentage}%`;
                document.getElementById('memory-progress').style.width = `${data.memory.usedPercentage}%`;
                document.getElementById('memory-progress').setAttribute('aria-valuenow', data.memory.usedPercentage);
            }
            
            if (data.memory.free) {
                document.getElementById('memory-free').textContent = `Libre: ${data.memory.free}`;
            }
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module Mémoire');
        
        // Écouter l'événement de chargement des composants si disponible
        if (window.ComponentsManager) {
            window.DashboardUtils.logDebug('ComponentsManager détecté, écoute des événements de chargement');
            document.addEventListener('dashboardComponentLoaded', function(event) {
                if (event.detail && event.detail.id === 'memory-component') {
                    window.DashboardUtils.logDebug('Composant mémoire chargé, initialisation du module mémoire');
                    setTimeout(loadMemoryInfo, 200);
                }
            });
        } else {
            // Initialisation classique
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(loadMemoryInfo, 500);
                });
            } else {
                setTimeout(loadMemoryInfo, 500);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadMemoryInfo,
        updateRealtime
    };
})();