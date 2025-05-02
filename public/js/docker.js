// docker.js - Module pour la gestion des conteneurs Docker

window.DockerModule = (function() {
    // Chargement des conteneurs Docker
    async function loadDockerContainers() {
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/docker`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données Docker reçues:', data);
            
            const containersList = document.getElementById('docker-containers');
            if (!containersList) {
                window.DashboardUtils.logError('Élément docker-containers introuvable');
                return;
            }
            
            containersList.innerHTML = '';
            
            if (data.containers && data.containers.length > 0) {
                data.containers.forEach(container => {
                    const statusClass = container.status.includes('Up') ? 'success' : 'warning';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${container.name}</td>
                        <td><small>${container.image}</small></td>
                        <td><span class="badge bg-${statusClass}">${container.status}</span></td>
                        <td id="cpu-${container.id}">-</td>
                        <td id="mem-${container.id}">-</td>
                        <td id="net-${container.id}">-</td>
                        <td>
                            <button class="btn btn-sm btn-outline-info docker-stats" data-id="${container.id}">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                        </td>
                    `;
                    containersList.appendChild(row);
                    
                    // Chargement des stats pour ce conteneur
                    loadContainerStats(container.id);
                });
                
                // Ajouter les événements aux boutons
                document.querySelectorAll('.docker-stats').forEach(button => {
                    button.addEventListener('click', function() {
                        const containerId = this.getAttribute('data-id');
                        loadContainerStats(containerId);
                    });
                });
            } else {
                containersList.innerHTML = '<tr><td colspan="7" class="text-center">Aucun conteneur Docker en cours d\'exécution</td></tr>';
            }
            
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des conteneurs Docker:', error);
            const containersList = document.getElementById('docker-containers');
            if (containersList) {
                containersList.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erreur de chargement des conteneurs</td></tr>';
            }
        }
    }
    
    // Chargement des statistiques Docker
    async function loadContainerStats(containerId) {
        try {
            // Charger les stats CPU/mémoire
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/docker/${containerId}/stats`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug(`Stats pour conteneur ${containerId}:`, data);
            
            const cpuElement = document.getElementById(`cpu-${containerId}`);
            if (cpuElement) {
                cpuElement.textContent = data.cpuPerc || '-';
            }
            
            const memElement = document.getElementById(`mem-${containerId}`);
            if (memElement) {
                memElement.textContent = data.memPerc ? `${data.memPerc} (${data.memUsage})` : '-';
            }
            
            // Charger les stats réseau
            try {
                const netResponse = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/docker/${containerId}/network`);
                if (netResponse.ok) {
                    const netData = await netResponse.json();
                    window.DashboardUtils.logDebug(`Stats réseau pour conteneur ${containerId}:`, netData);
                    
                    const prevStats = window.DashboardUtils.state.containerNetworkStats[containerId];
                    const currentTime = Date.now();
                    
                    // Calculer les taux s'il y a des données précédentes
                    let rxRate = 0;
                    let txRate = 0;
                    
                    if (prevStats && prevStats.timestamp) {
                        const timeDiff = currentTime - prevStats.timestamp;
                        rxRate = window.DashboardUtils.calculateRate(netData.rx_bytes, prevStats.rx_bytes, timeDiff);
                        txRate = window.DashboardUtils.calculateRate(netData.tx_bytes, prevStats.tx_bytes, timeDiff);
                    }
                    
                    // Mettre à jour les statistiques stockées
                    window.DashboardUtils.state.containerNetworkStats[containerId] = {
                        rx_bytes: netData.rx_bytes,
                        tx_bytes: netData.tx_bytes,
                        timestamp: currentTime
                    };
                    
                    // Mettre à jour l'interface utilisateur
                    const netElement = document.getElementById(`net-${containerId}`);
                    if (netElement) {
                        netElement.innerHTML = `
                            <div>
                                <span class="badge bg-success">↓ ${window.DashboardUtils.formatBytesPerSecond(rxRate)}</span>
                                <span class="badge bg-danger">↑ ${window.DashboardUtils.formatBytesPerSecond(txRate)}</span>
                            </div>
                        `;
                    }
                }
            } catch (netError) {
                console.warn(`Impossible de charger les stats réseau pour ${containerId}:`, netError);
                const netElement = document.getElementById(`net-${containerId}`);
                if (netElement) {
                    netElement.textContent = '- / -';
                }
            }
        } catch (error) {
            window.DashboardUtils.logError(`Erreur de chargement des stats pour ${containerId}:`, error);
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module Docker');
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadDockerContainers
    };
})();