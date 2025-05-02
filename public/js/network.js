// network.js - Module pour la gestion des statistiques réseau

window.NetworkModule = (function() {
    // Variables privées du module
    let networkChart = null;
    
    // Initialisation du graphique réseau
    function initNetworkChart() {
        const networkChartElement = document.getElementById('networkChart');
        if (!networkChartElement) {
            window.DashboardUtils.logError('Élément networkChart introuvable');
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
    
    // Mise à jour en temps réel des informations réseau
    function updateRealtime(data) {
        // Mise à jour graphique réseau
        if (data.network && data.network.length > 0) {
            // Prendre la première interface réseau
            const netInterface = data.network[0];
            if (netInterface.rx_sec && netInterface.tx_sec) {
                updateNetworkChart(parseFloat(netInterface.rx_sec), parseFloat(netInterface.tx_sec));
            }
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module Réseau');
        document.addEventListener('DOMContentLoaded', initNetworkChart);
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        updateRealtime
    };
})();