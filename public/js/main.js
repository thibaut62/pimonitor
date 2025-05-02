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

function init() {
    logDebug('Initialisation du tableau de bord');
    
    // Charger les informations de date et saint du jour
    if (window.DateInfoModule && typeof window.DateInfoModule.loadDateInfo === 'function') {
        window.DateInfoModule.loadDateInfo();
        setInterval(window.DateInfoModule.loadDateInfo, config.UPDATE_INTERVAL.DATEINFO);
    } else {
        logError('Module DateInfoModule manquant ou incomplet');
    }
    
    // Charger les prévisions météo
    if (window.WeatherModule && typeof window.WeatherModule.loadWeather === 'function') {
        window.WeatherModule.loadWeather();
        setInterval(window.WeatherModule.loadWeather, config.UPDATE_INTERVAL.WEATHER);
    } else {
        logError('Module WeatherModule manquant ou incomplet');
    }
    
    // Charger les informations système
    if (window.CPUModule && typeof window.CPUModule.loadCPUInfo === 'function') {
        window.CPUModule.loadCPUInfo();
    } else {
        logError('Module CPUModule manquant ou incomplet');
    }

    if (window.MemoryModule && typeof window.MemoryModule.loadMemoryInfo === 'function') {
        window.MemoryModule.loadMemoryInfo();
    } else {
        logError('Module MemoryModule manquant ou incomplet');
    }

    if (window.StorageModule && typeof window.StorageModule.loadStorageInfo === 'function') {
        window.StorageModule.loadStorageInfo();
    } else {
        logError('Module StorageModule manquant ou incomplet');
    }
    
    // Charger les conteneurs Docker
    if (window.DockerModule && typeof window.DockerModule.loadDockerContainers === 'function') {
        window.DockerModule.loadDockerContainers();
        setInterval(window.DockerModule.loadDockerContainers, config.UPDATE_INTERVAL.DOCKER);
    } else {
        logError('Module DockerModule manquant ou incomplet');
    }
    
    // Charger les informations EarnApp
    if (window.EarnAppModule && typeof window.EarnAppModule.loadEarnAppStatus === 'function') {
        window.EarnAppModule.loadEarnAppStatus();
        setInterval(window.EarnAppModule.loadEarnAppStatus, config.UPDATE_INTERVAL.EARNAPP);
    } else {
        logError('Module EarnAppModule manquant ou incomplet');
    }
    
    // Charger les clients VPN
    if (window.VPNModule && typeof window.VPNModule.loadVPNClients === 'function') {
        window.VPNModule.loadVPNClients();
        setInterval(window.VPNModule.loadVPNClients, config.UPDATE_INTERVAL.VPN);
    } else {
        logError('Module VPNModule manquant ou incomplet');
    }
    
    // Initialiser les WebSockets
    initWebSocket();
    
    // Gestionnaires d'événements pour les boutons de rafraîchissement
    const refreshDocker = document.getElementById('refresh-docker');
    if (refreshDocker && window.DockerModule) {
        refreshDocker.addEventListener('click', window.DockerModule.loadDockerContainers);
    }
    
    const refreshEarnapp = document.getElementById('refresh-earnapp');
    if (refreshEarnapp && window.EarnAppModule) {
        refreshEarnapp.addEventListener('click', window.EarnAppModule.loadEarnAppStatus);
    }
    
    const refreshVpn = document.getElementById('refresh-vpn');
    if (refreshVpn && window.VPNModule) {
        refreshVpn.addEventListener('click', window.VPNModule.loadVPNClients);
    }
    
    const refreshWeather = document.getElementById('refresh-weather');
    if (refreshWeather && window.WeatherModule) {
        refreshWeather.addEventListener('click', window.WeatherModule.refresh);
    }
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
