// cpu.js - Module pour la gestion des statistiques CPU

window.CPUModule = (function() {
    // Variables privées du module
    let cpuChart = null;
    let initialized = false;
    
    // Initialisation du graphique CPU
    function initCPUChart() {
        const cpuChartElement = document.getElementById('cpuChart');
        if (!cpuChartElement) {
            window.DashboardUtils.logDebug('Élément cpuChart introuvable - attente du chargement du composant');
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
            initialized = true;
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
    
    // Vérifier si les éléments DOM requis sont présents
    function checkRequiredElements() {
        return document.getElementById('cpu-load') && 
               document.getElementById('cpu-progress') && 
               document.getElementById('cpu-model') && 
               document.getElementById('cpu-cores') && 
               document.getElementById('cpu-temp');
    }
    
    // Chargement des informations CPU
    async function loadCPUInfo() {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            window.DashboardUtils.logDebug('Composant CPU non chargé, nouvelle tentative dans 500ms');
            setTimeout(loadCPUInfo, 500);
            return;
        }
        
        if (!initialized && document.getElementById('cpuChart')) {
            initCPUChart();
        }
        
        try {
            const response = await fetch(`${window.DashboardUtils.config.API_BASE_URL}/system`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            window.DashboardUtils.logDebug('Données système reçues:', data);
            
            // Mise à jour CPU
            if (data.cpu) {
                const cpuLoad = document.getElementById('cpu-load');
                const cpuProgress = document.getElementById('cpu-progress');
                const cpuModel = document.getElementById('cpu-model');
                const cpuCores = document.getElementById('cpu-cores');
                
                if (cpuLoad) cpuLoad.textContent = `${data.cpu.load}%`;
                if (cpuProgress) {
                    cpuProgress.style.width = `${data.cpu.load}%`;
                    cpuProgress.setAttribute('aria-valuenow', data.cpu.load);
                }
                
                if (data.cpu.model && cpuModel) {
                    cpuModel.textContent = `Modèle: ${data.cpu.model}`;
                }
                
                if (data.cpu.cores && cpuCores) {
                    cpuCores.textContent = `Cœurs: ${data.cpu.cores}`;
                }
            }
            
            // Mise à jour température
            if (data.temperature && data.temperature.main) {
                const cpuTemp = document.getElementById('cpu-temp');
                if (cpuTemp) {
                    cpuTemp.textContent = `Température: ${data.temperature.main}°C`;
                }
            }
            
            // Initialiser le graphique si ce n'est pas déjà fait
            if (!cpuChart && document.getElementById('cpuChart')) {
                initCPUChart();
            }
            
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.className = 'badge bg-success';
                connectionStatus.textContent = 'Connecté';
            }
            
            window.DashboardUtils.updateTime();
        } catch (error) {
            window.DashboardUtils.logError('Erreur de chargement des informations CPU:', error);
        }
    }
    
    // Mise à jour en temps réel des informations CPU
    function updateRealtime(data) {
        // Vérifier si les éléments requis sont présents
        if (!checkRequiredElements()) {
            return;
        }
        
        // Mise à jour CPU
        if (data.cpu && data.cpu.load) {
            const cpuLoad = document.getElementById('cpu-load');
            const cpuProgress = document.getElementById('cpu-progress');
            
            if (cpuLoad) cpuLoad.textContent = `${data.cpu.load}%`;
            if (cpuProgress) {
                cpuProgress.style.width = `${data.cpu.load}%`;
                cpuProgress.setAttribute('aria-valuenow', data.cpu.load);
            }
            
            // Mise à jour graphique CPU
            if (initialized) {
                updateCPUChart(parseFloat(data.cpu.load));
            } else if (document.getElementById('cpuChart')) {
                initCPUChart();
                updateCPUChart(parseFloat(data.cpu.load));
            }
        }
        
        // Mise à jour température
        if (data.temperature && data.temperature.main) {
            const cpuTemp = document.getElementById('cpu-temp');
            if (cpuTemp) {
                cpuTemp.textContent = `Température: ${data.temperature.main}°C`;
            }
        }
    }
    
    // Initialisation du module
    function init() {
        window.DashboardUtils.logDebug('Initialisation du module CPU');
        
        // Écouter l'événement de chargement des composants si disponible
        if (window.ComponentsManager) {
            window.DashboardUtils.logDebug('ComponentsManager détecté, écoute des événements de chargement');
            document.addEventListener('dashboardComponentLoaded', function(event) {
                if (event.detail && (event.detail.id === 'cpu-component' || event.detail.id === 'cpu-chart-component')) {
                    window.DashboardUtils.logDebug(`Composant ${event.detail.id} chargé, initialisation du module CPU`);
                    setTimeout(loadCPUInfo, 200); // Laisser un petit délai pour que le DOM se stabilise
                }
            });
        } else {
            // Initialisation classique
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(function() {
                        if (document.getElementById('cpuChart')) {
                            initCPUChart();
                        }
                        loadCPUInfo();
                    }, 500);
                });
            } else {
                setTimeout(function() {
                    if (document.getElementById('cpuChart')) {
                        initCPUChart();
                    }
                    loadCPUInfo();
                }, 500);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // Interface publique du module
    return {
        loadCPUInfo,
        updateRealtime
    };
})();