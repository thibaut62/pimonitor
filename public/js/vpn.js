// vpn.js - Module pour la gestion des clients VPN (version corrigée)

window.VPNModule = (function() {
    // Chargement des clients VPN
    async function loadVPNClients() {
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/vpn`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données VPN reçues:', data);
            
            const clientsContainer = document.getElementById('vpn-clients');
            if (!clientsContainer) {
                window.DashboardUtils.logError('Élément vpn-clients introuvable');
                return;
            }
            
            if (data.clients && data.clients.length > 0) {
                let html = '';
                
                // En-tête
                html += `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>IP Distante</th>
                                    <th>IP Virtuelle</th>
                                    <th>Trafic reçu</th>
                                    <th>Trafic envoyé</th>
                                    <th>Dernière activité</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                // Clients
                data.clients.forEach(client => {
                    html += `
                        <tr>
                            <td><strong>${client.name}</strong></td>
                            <td>${client.remoteIP.split(':')[0]}<br><small class="text-muted">Port: ${client.remoteIP.split(':')[1] || 'N/A'}</small></td>
                            <td><span class="text-monospace small">${client.virtualIP}</span></td>
                            <td>${client.bytesReceived}</td>
                            <td>${client.bytesSent}</td>
                            <td>${client.lastSeen}</td>
                        </tr>
                    `;
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                clientsContainer.innerHTML = html;
            } else {
                clientsContainer.innerHTML = '<div class="alert alert-info">Aucun client VPN connecté actuellement</div>';
            }
            
            // Mise à jour du compteur
            const vpnCounter = document.getElementById('vpn-counter');
            if (vpnCounter) {
                const count = data.clients ? data.clients.length : 0;
                vpnCounter.textContent = count;
                vpnCounter.className = count > 0 ? 'badge bg-success' : 'badge bg-secondary';
            }
            
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des clients VPN:', error);
            const clientsContainer = document.getElementById('vpn-clients');
            if (clientsContainer) {
                clientsContainer.innerHTML = '<div class="alert alert-danger">Erreur de chargement des clients VPN</div>';
            }
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module VPN');
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadVPNClients
    };
})();