// network.js - Module pour la gestion des statistiques réseau

window.NetworkModule = (function() {
    // Variables privées du module
    let networkChart = null;
    let initialized = false;
    let toggleState = {
        isCollapsed: false
    };
    
    // Initialisation du graphique réseau
    function initNetworkChart() {
        const networkChartElement = document.getElementById('networkChart');
        if (!networkChartElement) {
            window.DashboardUtils.logDebug('Élément networkChart introuvable - attente du chargement du composant');
            return;
        }
        
        try {
            networkChart = new Chart(networkChartElement.getContext('2d'), {
                type: 'line',
                data: {
                    labels: Array(30).fill(''),
                    datasets: [
                        {
                            label: 'Téléchargement (KiB/s)',
                            data: Array(30).fill(0),
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Envoi (KiB/s)',
                            data: Array(30).fill(0),
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'KiB/s'
                            }
                        },
                        x: {
                            display: false
                        }
                    },
                    animation: {
                        duration: 0
                    }
                }
            });
            initialized = true;
            window.DashboardUtils.logDebug('Graphique réseau initialisé');
        } catch (error) {
            window.DashboardUtils.logError('Erreur lors de l\'initialisation du graphique réseau:', error);
        }
    }
    
    // Mise à jour du graphique réseau
    function updateNetworkChart(downloadValue, uploadValue) {
        try {
            if (networkChart && networkChart.data && networkChart.data.datasets) {
                networkChart.data.datasets[0].data.push(downloadValue);
                networkChart.data.datasets[0].data.shift();
                
                networkChart.data.datasets[1].data.push(uploadValue);
                networkChart.data.datasets[1].data.shift();
                
                networkChart.update();
            }
        } catch (error) {
            window.DashboardUtils.logError('Erreur de mise à jour du graphique réseau:', error);
        }
    }
    
    // Configuration du bouton de toggle
    function setupToggleButton() {
        const toggleBtn = document.getElementById('network-toggle-btn');
        const contentElement = document.getElementById('network-content');
        
        if (toggleBtn && contentElement) {
            toggleBtn.addEventListener('click', function() {
                toggleState.isCollapsed = !toggleState.isCollapsed;
                
                if (toggleState.isCollapsed) {
                    // Réduire
                    contentElement.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
                } else {
                    // Développer
                    contentElement.style.display = 'block';
                    toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
                }
                
                // Sauvegarder l'état dans localStorage
                try {
                    localStorage.setItem('network_collapsed', toggleState.isCollapsed ? 'true' : 'false');
                } catch (error) {
                    console.warn('Impossible de sauvegarder l\'état du toggle réseau:', error);
                }
            });
            
            // Restaurer l'état précédent
            try {
                const savedState = localStorage.getItem('network_collapsed');
                if (savedState === 'true') {
                    toggleState.isCollapsed = true;
                    contentElement.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
                }
            } catch (error) {
                console.warn('Impossible de restaurer l\'état du toggle réseau:', error);
            }
        }
    }
    
    // Vérifier si les éléments DOM requis sont présents pour le composant réseau
    function checkNetworkComponentLoaded() {
        // Vérifier les éléments essentiels du composant réseau
        return document.getElementById('network-content') && 
               document.getElementById('network-toggle-btn');
    }
    
    // Chargement des informations réseau
    async function loadNetworkInfo() {
        if (!checkNetworkComponentLoaded()) {
            window.DashboardUtils.logDebug('Composant réseau non chargé, nouvelle tentative dans 500ms');
            setTimeout(loadNetworkInfo, 500);
            return;
        }
        
        // Configurer le bouton de toggle dès que possible
        setupToggleButton();
        
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/network`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données réseau reçues:', data);
            
            // Mise à jour des statistiques réseau
            updateNetworkStatistics(data);
            
            // Mettre à jour la dernière mise à jour
            const networkLastUpdate = document.getElementById('network-last-update');
            if (networkLastUpdate) {
                const now = new Date();
                networkLastUpdate.textContent = now.toLocaleTimeString();
            }
            
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des informations réseau:', error);
        }
    }
    
    // Mise à jour des statistiques réseau
    function updateNetworkStatistics(data) {
        // Vérifier que les éléments DOM sont présents
        if (!checkNetworkComponentLoaded()) return;
        
        try {
            // Mise à jour des statistiques de téléchargement
            const currentDown = document.getElementById('network-current-down');
            const todayDown = document.getElementById('network-today-down');
            const monthDown = document.getElementById('network-month-down');
            const totalDown = document.getElementById('network-total-down');
            
            // Mise à jour des statistiques d'envoi
            const currentUp = document.getElementById('network-current-up');
            const todayUp = document.getElementById('network-today-up');
            const monthUp = document.getElementById('network-month-up');
            const totalUp = document.getElementById('network-total-up');
            
            // Mise à jour des interfaces réseau
            const networkInterfaces = document.getElementById('network-interfaces');
            
            // Remplir avec les données réelles (à adapter selon votre format de données)
            if (data.interfaces && networkInterfaces) {
                networkInterfaces.innerHTML = '';
                
                data.interfaces.forEach(netInterface => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${netInterface.name}</td>
                        <td><span class="badge bg-${netInterface.status === 'UP' ? 'success' : 'secondary'}">${netInterface.status}</span></td>
                        <td>${netInterface.ip || '-'}</td>
                        <td>${netInterface.mac || '-'}</td>
                        <td>${netInterface.speed || '-'}</td>
                    `;
                    networkInterfaces.appendChild(row);
                });
            }
            
            // Mise à jour des statistiques actuelles
            if (data.current) {
                if (currentDown) currentDown.textContent = window.DashboardUtils.formatBytesPerSecond(data.current.down);
                if (currentUp) currentUp.textContent = window.DashboardUtils.formatBytesPerSecond(data.current.up);
            }
            
            // Mise à jour des statistiques quotidiennes
            if (data.today) {
                if (todayDown) todayDown.textContent = window.DashboardUtils.formatBytes(data.today.down);
                if (todayUp) todayUp.textContent = window.DashboardUtils.formatBytes(data.today.up);
            }
            
            // Mise à jour des statistiques mensuelles
            if (data.month) {
                if (monthDown) monthDown.textContent = window.DashboardUtils.formatBytes(data.month.down);
                if (monthUp) monthUp.textContent = window.DashboardUtils.formatBytes(data.month.up);
            }
            
            // Mise à jour des statistiques totales
            if (data.total) {
                if (totalDown) totalDown.textContent = window.DashboardUtils.formatBytes(data.total.down);
                if (totalUp) totalUp.textContent = window.DashboardUtils.formatBytes(data.total.up);
            }
            
        } catch (error) {
            window.DashboardUtils.logError('Erreur lors de la mise à jour des statistiques réseau:', error);
        }
    }
    
    // Mise à jour en temps réel des informations réseau
    function updateRealtime(data) {
        // Mise à jour graphique réseau
        if (!initialized && document.getElementById('networkChart')) {
            initNetworkChart();
        }
        
        if (data.network && data.network.length > 0 && initialized) {
            // Prendre la première interface réseau
            const netInterface = data.network[0];
            if (netInterface.rx_sec && netInterface.tx_sec) {
                updateNetworkChart(parseFloat(netInterface.rx_sec), parseFloat(netInterface.tx_sec));
                
                // Mise à jour des statistiques actuelles si les éléments sont disponibles
                const currentDown = document.getElementById('network-current-down');
                const currentUp = document.getElementById('network-current-up');
                
                if (currentDown) currentDown.textContent = window.DashboardUtils.formatBytesPerSecond(netInterface.rx_sec * 1024); // conversion KiB/s -> B/s
                if (currentUp) currentUp.textContent = window.DashboardUtils.formatBytesPerSecond(netInterface.tx_sec * 1024); // conversion KiB/s -> B/s
            }
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module Réseau');
        
        // Écouter l'événement de chargement des composants si disponible
        if (window.ComponentsManager) {
            window.DashboardUtils.logDebug('ComponentsManager détecté, écoute des événements de chargement');
            document.addEventListener('dashboardComponentLoaded', function(event) {
                if (event.detail && (event.detail.id === 'network-chart-component' || event.detail.id === 'network-component')) {
                    window.DashboardUtils.logDebug(`Composant ${event.detail.id} chargé, initialisation du module réseau`);
                    if (event.detail.id === 'network-chart-component') {
                        setTimeout(initNetworkChart, 200);
                    } else if (event.detail.id === 'network-component') {
                        setTimeout(() => {
                            setupToggleButton();
                            loadNetworkInfo();
                        }, 200);
                    }
                }
            });
        } else {
            // Initialisation classique
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(function() {
                        if (document.getElementById('networkChart')) {
                            initNetworkChart();
                        }
                        setupToggleButton();
                        loadNetworkInfo();
                    }, 500);
                });
            } else {
                setTimeout(function() {
                    if (document.getElementById('networkChart')) {
                        initNetworkChart();
                    }
                    setupToggleButton();
                    loadNetworkInfo();
                }, 500);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        updateRealtime,
        loadNetworkInfo,
        refresh: loadNetworkInfo
    };
})();