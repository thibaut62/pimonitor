// memory.js - Module pour la gestion des statistiques de mémoire

window.MemoryModule = (function() {
    // Chargement des informations de mémoire
    async function loadMemoryInfo() {
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
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadMemoryInfo,
        updateRealtime
    };
})();