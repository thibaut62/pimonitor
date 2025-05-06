// storage.js - Module pour la gestion des statistiques de stockage

window.StorageModule = (function() {
    // Vérifier si les éléments DOM requis sont présents
    function checkRequiredElements() {
        return document.getElementById('disk-info');
    }
    
    // Chargement des informations de stockage
    async function loadStorageInfo() {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            window.DashboardUtils.logDebug('Composant stockage non chargé, nouvelle tentative dans 500ms');
            setTimeout(loadStorageInfo, 500);
            return;
        }
        
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
            
            // Afficher un message d'erreur
            const diskContainer = document.getElementById('disk-info');
            if (diskContainer) {
                diskContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des informations de stockage
                    </div>
                `;
            }
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module Stockage');
        
        // Écouter l'événement de chargement des composants si disponible
        if (window.ComponentsManager) {
            window.DashboardUtils.logDebug('ComponentsManager détecté, écoute des événements de chargement');
            document.addEventListener('dashboardComponentLoaded', function(event) {
                if (event.detail && event.detail.id === 'storage-component') {
                    window.DashboardUtils.logDebug('Composant stockage chargé, initialisation du module stockage');
                    setTimeout(loadStorageInfo, 200);
                }
            });
        } else {
            // Initialisation classique
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(loadStorageInfo, 500);
                });
            } else {
                setTimeout(loadStorageInfo, 500);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadStorageInfo,
        refresh: loadStorageInfo
    };
})();