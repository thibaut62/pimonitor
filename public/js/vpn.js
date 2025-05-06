// vpn.js - Module pour la gestion des clients VPN

window.VPNModule = (function() {
    // Vérifier si les éléments DOM requis sont présents
    function checkRequiredElements() {
        return document.getElementById('vpn-clients') && 
               document.getElementById('vpn-counter');
    }
    
    // Chargement des clients VPN
    async function loadVPNClients() {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            window.DashboardUtils.logDebug('Composant VPN non chargé, nouvelle tentative dans 500ms');
            setTimeout(loadVPNClients, 500);
            return;
        }
        
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
                        <td>${client.bytesReceived || '-'}</td>
                        <td>${client.bytesSent || '-'}</td>
                        <td>${client.lastSeen || '-'}</td>
                    `;
                    
                    clientsContainer.appendChild(row);
                });
            } else {
                const noClients = document.createElement('tr');
                noClients.innerHTML = '<td colspan="5" class="text-center">Aucun client VPN connecté actuellement</td>';
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
            
            // Mettre à jour l'horodatage
            window.DashboardUtils.updateTime();
            
            // Mettre à jour une éventuelle indication de dernière mise à jour propre au composant VPN
            const vpnLastUpdate = document.getElementById('vpn-last-update');
            if (vpnLastUpdate) {
                const now = new Date();
                vpnLastUpdate.textContent = now.toLocaleTimeString();
            }
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des clients VPN:', error);
            const clientsContainer = document.getElementById('vpn-clients');
            if (clientsContainer) {
                clientsContainer.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erreur de chargement des clients VPN</td></tr>';
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
        
        // Écouter l'événement de chargement des composants si disponible
        if (window.ComponentsManager) {
            window.DashboardUtils.logDebug('ComponentsManager détecté, écoute des événements de chargement');
            document.addEventListener('dashboardComponentLoaded', function(event) {
                if (event.detail && event.detail.id === 'vpn-component') {
                    window.DashboardUtils.logDebug('Composant VPN chargé, initialisation du module VPN');
                    
                    // Ajouter un gestionnaire d'événements pour le bouton de rafraîchissement
                    const refreshButton = document.getElementById('refresh-vpn');
                    if (refreshButton) {
                        refreshButton.addEventListener('click', loadVPNClients);
                    }
                    
                    // Configurer le bouton de toggling si présent
                    const toggleButton = document.getElementById('vpn-toggle-btn');
                    const vpnContent = document.getElementById('vpn-content');
                    if (toggleButton && vpnContent) {
                        toggleButton.addEventListener('click', function() {
                            if (vpnContent.style.display === 'none') {
                                vpnContent.style.display = 'block';
                                toggleButton.innerHTML = '<i class="fas fa-minus"></i>';
                            } else {
                                vpnContent.style.display = 'none';
                                toggleButton.innerHTML = '<i class="fas fa-plus"></i>';
                            }
                        });
                    }
                    
                    setTimeout(loadVPNClients, 200);
                }
            });
        } else {
            // Initialisation classique
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    // Configuration des boutons
                    const refreshButton = document.getElementById('refresh-vpn');
                    if (refreshButton) {
                        refreshButton.addEventListener('click', loadVPNClients);
                    }
                    
                    // Configurer le bouton de toggling si présent
                    const toggleButton = document.getElementById('vpn-toggle-btn');
                    const vpnContent = document.getElementById('vpn-content');
                    if (toggleButton && vpnContent) {
                        toggleButton.addEventListener('click', function() {
                            if (vpnContent.style.display === 'none') {
                                vpnContent.style.display = 'block';
                                toggleButton.innerHTML = '<i class="fas fa-minus"></i>';
                            } else {
                                vpnContent.style.display = 'none';
                                toggleButton.innerHTML = '<i class="fas fa-plus"></i>';
                            }
                        });
                    }
                    
                    setTimeout(loadVPNClients, 500);
                });
            } else {
                // Configuration des boutons
                const refreshButton = document.getElementById('refresh-vpn');
                if (refreshButton) {
                    refreshButton.addEventListener('click', loadVPNClients);
                }
                
                // Configurer le bouton de toggling si présent
                const toggleButton = document.getElementById('vpn-toggle-btn');
                const vpnContent = document.getElementById('vpn-content');
                if (toggleButton && vpnContent) {
                    toggleButton.addEventListener('click', function() {
                        if (vpnContent.style.display === 'none') {
                            vpnContent.style.display = 'block';
                            toggleButton.innerHTML = '<i class="fas fa-minus"></i>';
                        } else {
                            vpnContent.style.display = 'none';
                            toggleButton.innerHTML = '<i class="fas fa-plus"></i>';
                        }
                    });
                }
                
                setTimeout(loadVPNClients, 500);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadVPNClients,
        refresh: loadVPNClients
    };
})();