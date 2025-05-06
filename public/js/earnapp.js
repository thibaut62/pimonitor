// earnapp.js - Module pour la gestion d'EarnApp

window.EarnAppModule = (function() {
    // Vérifier si les éléments DOM requis sont présents
    function checkRequiredElements() {
        return document.getElementById('earnapp-status');
    }
    
    // Chargement des statistiques EarnApp
    async function loadEarnAppStatus() {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            window.DashboardUtils.logDebug('Composant EarnApp non chargé, nouvelle tentative dans 500ms');
            setTimeout(loadEarnAppStatus, 500);
            return;
        }
        
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/earnapp`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données EarnApp reçues:', data);
            
            const statusContainer = document.getElementById('earnapp-status');
            if (!statusContainer) {
                window.DashboardUtils.logError('Élément earnapp-status introuvable');
                return;
            }
            
            if (data.status === 'running') {
                let logHtml = '<div class="alert alert-success">EarnApp est en cours d\'exécution</div>';
                
                if (data.logs && data.logs.length > 0) {
                    logHtml += '<div class="mt-3"><strong>Derniers logs:</strong></div>';
                    logHtml += '<div class="small" style="max-height: 150px; overflow-y: auto;">';
                    data.logs.forEach(log => {
                        logHtml += `<div class="text-muted">${log}</div>`;
                    });
                    logHtml += '</div>';
                }
                
                statusContainer.innerHTML = logHtml;
                
                // Charger et afficher les statistiques réseau
                loadEarnAppNetworkStats();
            } else {
                statusContainer.innerHTML = '<div class="alert alert-warning">EarnApp n\'est pas en cours d\'exécution</div>';
                // Effacer les statistiques réseau
                const networkContainer = document.getElementById('earnapp-network');
                if (networkContainer) {
                    networkContainer.innerHTML = '';
                }
            }
            
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement du statut EarnApp:', error);
            const statusContainer = document.getElementById('earnapp-status');
            if (statusContainer) {
                statusContainer.innerHTML = '<div class="alert alert-danger">Erreur de chargement du statut EarnApp</div>';
            }
        }
    }
    
    // Chargement des statistiques réseau d'EarnApp
    async function loadEarnAppNetworkStats() {
        const networkContainer = document.getElementById('earnapp-network');
        if (!networkContainer) {
            window.DashboardUtils.logError('Élément earnapp-network introuvable');
            return;
        }
        
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/earnapp/network`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données réseau EarnApp reçues:', data);
            
            // Si nous avons déjà reçu des données auparavant, calculer le taux
            let rxRate = 0;
            let txRate = 0;
            
            if (data.type === 'docker_container' || data.type === 'system_process') {
                // Ces types de données fournissent déjà des taux
                if (data.rx_bytes_per_sec !== undefined) {
                    rxRate = data.rx_bytes_per_sec;
                }
                if (data.tx_bytes_per_sec !== undefined) {
                    txRate = data.tx_bytes_per_sec;
                }
            } else if (data.type === 'estimate') {
                // Ces types de données fournissent déjà des estimations de taux
                rxRate = data.estimated_rx_bytes_per_sec;
                txRate = data.estimated_tx_bytes_per_sec;
            } else {
                // Pour les autres types, calculer le taux à partir des totaux
                const prevStats = window.DashboardUtils.state.earnappNetworkStats;
                const currentTime = Date.now();
                
                if (prevStats && prevStats.timestamp && data.rx_bytes !== undefined) {
                    const timeDiff = currentTime - prevStats.timestamp;
                    rxRate = window.DashboardUtils.calculateRate(data.rx_bytes, prevStats.rx_bytes, timeDiff);
                    txRate = window.DashboardUtils.calculateRate(data.tx_bytes, prevStats.tx_bytes, timeDiff);
                }
                
                // Mettre à jour les statistiques stockées
                if (data.rx_bytes !== undefined) {
                    window.DashboardUtils.state.earnappNetworkStats.rx_bytes = data.rx_bytes;
                    window.DashboardUtils.state.earnappNetworkStats.tx_bytes = data.tx_bytes;
                    window.DashboardUtils.state.earnappNetworkStats.timestamp = currentTime;
                }
            }
            
            // Mettre à jour l'interface utilisateur
            networkContainer.innerHTML = `
                <div class="card mb-3">
                    <div class="card-header bg-info text-white">
                        <i class="fas fa-network-wired me-2"></i> Trafic réseau
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <div>
                                <i class="fas fa-arrow-down text-success"></i> Téléchargement:
                            </div>
                            <div>
                                <strong>${window.DashboardUtils.formatBytesPerSecond(rxRate)}</strong>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between">
                            <div>
                                <i class="fas fa-arrow-up text-danger"></i> Envoi:
                            </div>
                            <div>
                                <strong>${window.DashboardUtils.formatBytesPerSecond(txRate)}</strong>
                            </div>
                        </div>
                        <div class="text-muted small mt-2">
                            <em>Type de mesure: ${data.type || 'standard'}</em>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des stats réseau EarnApp:', error);
            networkContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Impossible de charger les statistiques réseau
                </div>
            `;
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module EarnApp');
        
        // Écouter l'événement de chargement des composants si disponible
        if (window.ComponentsManager) {
            window.DashboardUtils.logDebug('ComponentsManager détecté, écoute des événements de chargement');
            document.addEventListener('dashboardComponentLoaded', function(event) {
                if (event.detail && event.detail.id === 'earnapp-component') {
                    window.DashboardUtils.logDebug('Composant EarnApp chargé, initialisation du module EarnApp');
                    
                    // Configurer le bouton de rafraîchissement
                    const refreshButton = document.getElementById('refresh-earnapp');
                    if (refreshButton) {
                        refreshButton.addEventListener('click', loadEarnAppStatus);
                    }
                    
                    setTimeout(loadEarnAppStatus, 200);
                }
            });
        } else {
            // Initialisation classique
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    // Configurer le bouton de rafraîchissement
                    const refreshButton = document.getElementById('refresh-earnapp');
                    if (refreshButton) {
                        refreshButton.addEventListener('click', loadEarnAppStatus);
                    }
                    
                    setTimeout(loadEarnAppStatus, 500);
                });
            } else {
                // Configurer le bouton de rafraîchissement
                const refreshButton = document.getElementById('refresh-earnapp');
                if (refreshButton) {
                    refreshButton.addEventListener('click', loadEarnAppStatus);
                }
                
                setTimeout(loadEarnAppStatus, 500);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadEarnAppStatus,
        refresh: loadEarnAppStatus
    };
})();