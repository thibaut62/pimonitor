// main.js - Fichier principal pour le tableau de bord Raspberry Pi

// Configuration globale
const config = {
    API_BASE_URL: 'http://192.168.0.2:3000/api',
    WS_URL: 'ws://192.168.0.2:3000',
    DEBUG: true, // Activer le mode de débogage
    UPDATE_INTERVAL: {
        DOCKER: 30000,  // 30 secondes
        EARNAPP: 60000, // 60 secondes
        VPN: 60000,     // 60 secondes
        WEATHER: 600000, // 30 minutes
        DATEINFO: 3600000 // 1 heure
    }
};

// Variables globales
const state = {
    lastUpdate: null,
    websocket: null,
    containerNetworkStats: {},
    earnappNetworkStats: { timestamp: 0, rx_bytes: 0, tx_bytes: 0 }
};

// Fonctions utilitaires
function logDebug(message, data) {
    if (config.DEBUG) {
        console.log(message, data);
    }
}

function logError(message, error) {
    console.error(message, error);
    document.getElementById('connection-status').className = 'badge bg-danger';
    document.getElementById('connection-status').textContent = 'Erreur';
}

function updateTime() {
    const now = new Date();
    document.getElementById('update-time').textContent = 
        `Dernière mise à jour: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    state.lastUpdate = now;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatBytesPerSecond(bytesPerSecond, decimals = 2) {
    return formatBytes(bytesPerSecond, decimals) + '/s';
}

function calculateRate(currentBytes, previousBytes, timeDiffMs) {
    if (!previousBytes || !timeDiffMs || timeDiffMs === 0) {
        return 0;
    }
    
    const byteDiff = currentBytes - previousBytes;
    // Convertir de ms à secondes
    const timeDiffSec = timeDiffMs / 1000;
    
    return byteDiff / timeDiffSec;
}

// Initialisation des WebSockets
function initWebSocket() {
    const ws = new WebSocket(config.WS_URL);
    
    ws.onopen = function() {
        logDebug('WebSocket connecté');
        document.getElementById('connection-status').className = 'badge bg-success';
        document.getElementById('connection-status').textContent = 'Connecté';
    };
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            logDebug('Données WebSocket reçues:', data);
            
            // Appeler les fonctions de mise à jour des différents modules
            if (window.CPUModule) {
                window.CPUModule.updateRealtime(data);
            }
            
            if (window.MemoryModule) {
                window.MemoryModule.updateRealtime(data);
            }
            
            if (window.NetworkModule) {
                window.NetworkModule.updateRealtime(data);
            }
            
            updateTime();
        } catch (error) {
            logError('Erreur de traitement des données WebSocket:', error);
        }
    };
    
    ws.onclose = function() {
        logDebug('WebSocket déconnecté');
        document.getElementById('connection-status').className = 'badge bg-danger';
        document.getElementById('connection-status').textContent = 'Déconnecté';
        
        // Tentative de reconnexion après 5 secondes
        setTimeout(initWebSocket, 5000);
    };
    
    ws.onerror = function(error) {
        logError('Erreur WebSocket:', error);
        document.getElementById('connection-status').className = 'badge bg-danger';
        document.getElementById('connection-status').textContent = 'Erreur';
    };
    
    state.websocket = ws;
}

// Fonction d'initialisation principale
function init() {
    logDebug('Initialisation du tableau de bord');
    
    // Charger les informations de date et saint du jour
    if (window.DateInfoModule) {
        window.DateInfoModule.loadDateInfo();
        setInterval(window.DateInfoModule.loadDateInfo, config.UPDATE_INTERVAL.DATEINFO);
    }
    
    // Charger les prévisions météo
    if (window.WeatherModule) {
        window.WeatherModule.loadWeather();
        setInterval(window.WeatherModule.loadWeather, config.UPDATE_INTERVAL.WEATHER);
    }
    
    // Charger les informations système
    if (window.CPUModule && window.MemoryModule && window.StorageModule) {
        window.CPUModule.loadCPUInfo();
        window.MemoryModule.loadMemoryInfo();
        window.StorageModule.loadStorageInfo();
    }
    
    // Charger les conteneurs Docker
    if (window.DockerModule) {
        window.DockerModule.loadDockerContainers();
        setInterval(window.DockerModule.loadDockerContainers, config.UPDATE_INTERVAL.DOCKER);
    }
    
    // Charger les informations EarnApp
    if (window.EarnAppModule) {
        window.EarnAppModule.loadEarnAppStatus();
        setInterval(window.EarnAppModule.loadEarnAppStatus, config.UPDATE_INTERVAL.EARNAPP);
    }
    
    // Charger les clients VPN
    if (window.VPNModule) {
        window.VPNModule.loadVPNClients();
        setInterval(window.VPNModule.loadVPNClients, config.UPDATE_INTERVAL.VPN);
    }
    
    // Initialiser les WebSockets
    initWebSocket();
    
    // Gestionnaires d'événements pour les boutons de rafraîchissement
    document.getElementById('refresh-docker')?.addEventListener('click', window.DockerModule?.loadDockerContainers);
    document.getElementById('refresh-earnapp')?.addEventListener('click', window.EarnAppModule?.loadEarnAppStatus);
    document.getElementById('refresh-vpn')?.addEventListener('click', window.VPNModule?.loadVPNClients);
    document.getElementById('refresh-weather')?.addEventListener('click', window.WeatherModule?.loadWeather);
}

// Initialiser lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', init);

// Exposer des fonctions et variables utiles globalement
window.DashboardUtils = {
    formatBytes,
    formatBytesPerSecond,
    calculateRate,
    logDebug,
    logError,
    updateTime,
    config,
    state
};
