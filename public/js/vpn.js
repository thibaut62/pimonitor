// vpn.js - Module pour la gestion des clients VPN (version finale)

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
            
            // Effacer complètement le contenu actuel
            clientsContainer.innerHTML = '';
            
            if (data.clients && data.clients.length > 0) {
                // Créer un tableau et l'ajouter directement au container
                const table = document.createElement('table');
                table.className = 'table table-hover';
                
                // Ajouter l'en-tête
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Nom</th>
                        <th>Statut</th>
                        <th>Trafic reçu</th>
                        <th>Trafic envoyé</th>
                        <th>Dernière activité</th>
                    </tr>
                `;
                table.appendChild(thead);
                
                // Créer le corps du tableau
                const tbody = document.createElement('tbody');
                
                // Traitement des clients
                data.clients.forEach(client => {
                    // Déterminer le statut en fonction de la dernière activité
                    let statusBadge;
                    
                    // Si la dernière activité est "Now" ou "Maintenant", considérer comme connecté
                    if (client.lastSeen && (
                        client.lastSeen.includes("Now") || 
                        client.lastSeen.toLowerCase().includes("maintenant") ||
                        // Si la dernière activité est dans les 5 dernières minutes, considérer comme connecté
                        isWithinLastFiveMinutes(client.lastSeen)
                    )) {
                        statusBadge = '<span class="badge bg-success">Connecté</span>';
                    } else {
                        statusBadge = '<span class="badge bg-secondary">Inactif</span>';
                    }
                    
                    // Créer une ligne pour ce client
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${client.name}</strong></td>
                        <td>${statusBadge}</td>
                        <td>${client.bytesReceived}</td>
                        <td>${client.bytesSent}</td>
                        <td>${client.lastSeen}</td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                clientsContainer.appendChild(table);
            } else {
                const noClients = document.createElement('div');
                noClients.className = 'alert alert-info';
                noClients.textContent = 'Aucun client VPN connecté actuellement';
                clientsContainer.appendChild(noClients);
            }
            
            // Mise à jour du compteur
            const vpnCounter = document.getElementById('vpn-counter');
            if (vpnCounter) {
                const connectedClients = data.clients ? 
                    data.clients.filter(client => 
                        client.lastSeen && (
                            client.lastSeen.includes("Now") || 
                            client.lastSeen.toLowerCase().includes("maintenant") ||
                            isWithinLastFiveMinutes(client.lastSeen)
                        )
                    ).length : 0;
                
                vpnCounter.textContent = connectedClients;
                vpnCounter.className = connectedClients > 0 ? 'badge bg-success ms-2' : 'badge bg-secondary ms-2';
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
    
    // Vérifier si la dernière activité est dans les 5 dernières minutes
    function isWithinLastFiveMinutes(lastSeenStr) {
        if (!lastSeenStr) return false;
        
        // Si le format est "May 02 2025 - 16:44:00"
        const match = lastSeenStr.match(/(\w+)\s+(\d+)\s+(\d+)\s+-\s+(\d+):(\d+):(\d+)/);
        if (match) {
            const [_, month, day, year, hours, minutes, seconds] = match;
            
            // Convertir en objet Date
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthIndex = monthNames.findIndex(m => m === month);
            
            if (monthIndex !== -1) {
                const lastSeenDate = new Date(parseInt(year), monthIndex, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
                const now = new Date();
                
                // Différence en millisecondes
                const diffMs = now - lastSeenDate;
                // Convertir en minutes
                const diffMinutes = diffMs / (1000 * 60);
                
                return diffMinutes <= 5;
            }
        }
        
        return false;
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