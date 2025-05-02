// cpu.js - Module pour la gestion des statistiques CPU

window.CPUModule = (function() {
    // Variables privées du module
    let cpuChart = null;
    
    // Initialisation du graphique CPU
    function initCPUChart() {
        const cpuChartElement = document.getElementById('cpuChart');
        if (!cpuChartElement) {
            window.DashboardUtils.logError('Élément cpuChart introuvable');
            return;
        }
        
        try {
            cpuChart = new Chart(cpuChartElement.getContext('2d'), {
                type: 'line',
                data: {
                    labels: Array(30).fill(''),
                    datasets: [{
                        label: 'Utilisation CPU (%)',
                        data: Array(30).fill(0),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Utilisation (%)'
                            }
                        },
                        x: {
                            display: false
                        }
                    },
                    animation: {
                        duration: 0
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            window.DashboardUtils.logDebug('Graphique CPU initialisé');
        } catch (error) {
            window.DashboardUtils.logError('Erreur lors de l\'initialisation du graphique CPU:', error);
        }
    }
    
    // Mise à jour du graphique CPU
    function updateCPUChart(value) {
        try {
            if (cpuChart && cpuChart.data && cpuChart.data.datasets) {
                cpuChart.data.datasets[0].data.push(value);
                cpuChart.data.datasets[0].data.shift();
                cpuChart.update();
            }
        } catch (error) {
            window.DashboardUtils.logError('Erreur de mise à jour du graphique CPU:', error);
        }
    }
    
    // Chargement des informations CPU
    async function loadCPUInfo() {
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/system`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données système reçues:', data);
            
            // Mise à jour CPU
            if (data.cpu) {
                document.getElementById('cpu-load').textContent = `${data.cpu.load}%`;
                document.getElementById('cpu-progress').style.width = `${data.cpu.load}%`;
                document.getElementById('cpu-progress').setAttribute('aria-valuenow', data.cpu.load);
                
                if (data.cpu.model) {
                    document.getElementById('cpu-model').textContent = `Modèle: ${data.cpu.model}`;
                }
                
                if (data.cpu.cores) {
                    document.getElementById('cpu-cores').textContent = `Cœurs: ${data.cpu.cores}`;
                }
            }
            
            // Mise à jour température
            if (data.temperature && data.temperature.main) {
                document.getElementById('cpu-temp').textContent = `Température: ${data.temperature.main}°C`;
            }
            
            // Initialiser le graphique si ce n'est pas déjà fait
            if (!cpuChart) {
                initCPUChart();
            }
            
            document.getElementById('connection-status').className = 'badge bg-success';
            document.getElementById('connection-status').textContent = 'Connecté';
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des informations CPU:', error);
        }
    }
    
    // Mise à jour en temps réel des informations CPU
    function updateRealtime(data) {
        // Mise à jour CPU
        if (data.cpu && data.cpu.load) {
            document.getElementById('cpu-load').textContent = `${data.cpu.load}%`;
            document.getElementById('cpu-progress').style.width = `${data.cpu.load}%`;
            document.getElementById('cpu-progress').setAttribute('aria-valuenow', data.cpu.load);
            
            // Mise à jour graphique CPU
            updateCPUChart(parseFloat(data.cpu.load));
        }
        
        // Mise à jour température
        if (data.temperature && data.temperature.main) {
            document.getElementById('cpu-temp').textContent = `Température: ${data.temperature.main}°C`;
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module CPU');
        document.addEventListener('DOMContentLoaded', initCPUChart);
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadCPUInfo,
        updateRealtime
    };
})();