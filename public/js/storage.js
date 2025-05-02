// storage.js - Module pour la gestion des statistiques de stockage

window.StorageModule = (function() {
    // Chargement des informations de stockage
    async function loadStorageInfo() {
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/system`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données stockage reçues:', data);
            
            // Mise à jour disque
            if (data.disk && Array.isArray(data.disk)) {
                const diskContainer = document.getElementById('disk-info');
                if (!diskContainer) {
                    window.DashboardUtils.logError('Élément disk-info introuvable');
                    return;
                }
                
                diskContainer.innerHTML = '';
                
                data.disk.forEach(disk => {
                    const diskElement = document.createElement('div');
                    diskElement.className = 'mb-3';
                    diskElement.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span>${disk.fs}</span>
                            <span>${disk.used} / ${disk.size}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-info" role="progressbar" 
                                style="width: ${disk.usedPercentage}%" 
                                aria-valuenow="${disk.usedPercentage}" 
                                aria-valuemin="0" 
                                aria-valuemax="100">
                                ${disk.usedPercentage}%
                            </div>
                        </div>
                    `;
                    diskContainer.appendChild(diskElement);
                });
            }
            
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des informations de stockage:', error);
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module Stockage');
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadStorageInfo
    };
})();