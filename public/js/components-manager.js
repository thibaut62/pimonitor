// components-manager.js - Module pour gérer le chargement des composants

window.ComponentsManager = (function() {
    // Liste des composants chargés
    const loadedComponents = [];
    
    // État de chargement
    const loadingState = {
        componentsTotal: 0,
        componentsLoaded: 0,
        ready: false
    };
    
    // Configuration
    const config = {
        componentsPath: 'components/',
        retryLimit: 3,
        loadTimeout: 5000, // 5 secondes
        componentsList: [
            { id: 'cpu-component', file: 'cpu.html', required: true },
            { id: 'memory-component', file: 'memory.html', required: true },
            { id: 'storage-component', file: 'storage.html', required: true },
            { id: 'cpu-chart-component', file: 'cpu-chart.html', required: true },
            { id: 'network-chart-component', file: 'network-chart.html', required: true },
            { id: 'network-component', file: 'network.html', required: false },
            { id: 'vpn-component', file: 'vpn.html', required: false },
            { id: 'docker-component', file: 'docker.html', required: false },
            { id: 'earnapp-component', file: 'earnapp.html', required: false },
            { id: 'dateinfo-component', file: 'dateinfo.html', required: false },
            { id: 'weather-component', file: 'weather.html', required: false },
            { id: 'google-sheet-component', file: 'google-sheet.html', required: false }
        ]
    };
    
    // Événements
    const events = {
        allComponentsLoaded: new Event('dashboardComponentsLoaded'),
        componentLoaded: function(id) {
            const event = new CustomEvent('dashboardComponentLoaded', { 
                detail: { id: id }
            });
            document.dispatchEvent(event);
        },
        componentUnloaded: function(id) {
            const event = new CustomEvent('dashboardComponentUnloaded', {
                detail: { id: id }
            });
            document.dispatchEvent(event);
        }
    };
    
    // Charger un composant individuel
    function loadComponent(component, retryCount = 0) {
        const containerId = component.id;
        const componentPath = config.componentsPath + component.file;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`Conteneur ${containerId} introuvable`);
            // Marquer comme chargé même s'il est introuvable
            markComponentLoaded(component.id);
            return;
        }
        
        // Afficher un indicateur de chargement
        container.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-2">Chargement du composant...</p>
            </div>
        `;
        
        // Timeout pour détecter les échecs de chargement
        const timeoutId = setTimeout(() => {
            if (retryCount < config.retryLimit) {
                console.warn(`Timeout lors du chargement de ${componentPath}, nouvelle tentative ${retryCount + 1}/${config.retryLimit}`);
                loadComponent(component, retryCount + 1);
            } else {
                console.error(`Échec du chargement de ${componentPath} après ${config.retryLimit} tentatives`);
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Impossible de charger le composant
                    </div>
                `;
                markComponentLoaded(component.id);
            }
        }, config.loadTimeout);
        
        fetch(componentPath)
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                container.innerHTML = html;
                console.log(`Composant ${component.id} chargé avec succès`);
                markComponentLoaded(component.id);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error(`Erreur lors du chargement du composant ${componentPath}:`, error);
                
                if (retryCount < config.retryLimit) {
                    console.warn(`Nouvelle tentative ${retryCount + 1}/${config.retryLimit}`);
                    loadComponent(component, retryCount + 1);
                } else {
                    container.innerHTML = `
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Erreur lors du chargement du composant
                        </div>
                    `;
                    markComponentLoaded(component.id);
                }
            });
    }
    
    // Marquer un composant comme chargé
    function markComponentLoaded(id) {
        if (!loadedComponents.includes(id)) {
            loadedComponents.push(id);
            loadingState.componentsLoaded++;
            
            // Déclencher l'événement de chargement pour ce composant
            events.componentLoaded(id);
            
            // Vérifier si tous les composants sont chargés
            if (loadingState.componentsLoaded >= loadingState.componentsTotal) {
                loadingState.ready = true;
                console.log('Tous les composants sont chargés');
                document.dispatchEvent(events.allComponentsLoaded);
            }
        }
    }
    
    // Décharger un composant
    function unloadComponent(id) {
        const index = loadedComponents.indexOf(id);
        if (index !== -1) {
            loadedComponents.splice(index, 1);
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
            }
            events.componentUnloaded(id);
        }
    }
    
    // Charger tous les composants
    function loadAllComponents() {
        // Définir le total de composants à charger
        loadingState.componentsTotal = config.componentsList.length;
        
        // Charger chaque composant
        config.componentsList.forEach(component => {
            loadComponent(component);
        });
    }
    
    // Initialiser le gestionnaire
    function init() {
        console.log('Initialisation du gestionnaire de composants');
        
        // Charger les composants au chargement du DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadAllComponents);
        } else {
            loadAllComponents();
        }
    }
    
    // Appeler l'initialisation
    init();
    
    // API publique
    return {
        getLoadingState: () => ({ ...loadingState }),
        isReady: () => loadingState.ready,
        getLoadedComponents: () => [...loadedComponents],
        onReady: (callback) => {
            if (loadingState.ready) {
                callback();
            } else {
                document.addEventListener('dashboardComponentsLoaded', callback);
            }
        },
        reloadComponent: (id) => {
            const component = config.componentsList.find(c => c.id === id);
            if (component) {
                unloadComponent(id);
                loadComponent(component);
            } else {
                console.error(`Composant ${id} non trouvé dans la liste de configuration`);
            }
        },
        unloadComponent: unloadComponent,
        loadComponent: (id) => {
            const component = config.componentsList.find(c => c.id === id);
            if (component) {
                loadComponent(component);
            } else {
                console.error(`Composant ${id} non trouvé dans la liste de configuration`);
            }
        }
    };
})();