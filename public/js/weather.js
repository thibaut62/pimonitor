// weather.js - Module météo avec rafraîchissement
window.WeatherModule = (function() {
    // Configuration
    const config = {
        refreshInterval: 900000, // 15 minutes en ms
        apiEndpoint: '/api/weather',
        refreshEndpoint: '/api/weather/refresh'
    };
    
    let refreshTimer = null;
    
    // Formater l'heure
    const formatTime = function(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };
    
    // Mettre à jour l'interface avec les données météo
    const updateUI = function(data) {
        if (!data) return;
        
        // Sélecteurs principaux
        const cityEl = document.getElementById('weather-city') || document.querySelector('.weather-city');
        const tempEl = document.getElementById('weather-temp') || document.querySelector('.weather-temp');
        const descEl = document.getElementById('weather-desc') || document.querySelector('.weather-desc');
        const feelsEl = document.getElementById('weather-feels') || document.querySelector('.weather-feels');
        const humidityEl = document.getElementById('weather-humidity') || document.querySelector('.weather-humidity');
        const windEl = document.getElementById('weather-wind') || document.querySelector('.weather-wind');
        const pressureEl = document.getElementById('weather-pressure') || document.querySelector('.weather-pressure');
        const updateEl = document.getElementById('weather-last-update') || document.querySelector('.weather-last-update');
        const iconEl = document.getElementById('weather-icon') || document.querySelector('.weather-icon');
        const tempMaxEl = document.getElementById('weather-temp-max') || document.querySelector('.weather-temp-max');
        const tempMinEl = document.getElementById('weather-temp-min') || document.querySelector('.weather-temp-min');
        
        // Mise à jour des éléments s'ils existent
        if (cityEl) cityEl.textContent = data.city;
        if (tempEl) tempEl.textContent = `${data.temperature}°C`;
        if (descEl) descEl.textContent = data.description;
        if (feelsEl) feelsEl.textContent = `${data.feels_like}°C`;
        if (humidityEl) humidityEl.textContent = `${data.humidity}%`;
        if (windEl) windEl.textContent = `${data.wind_speed} m/s`;
        if (pressureEl) pressureEl.textContent = `${data.pressure} hPa`;
        if (tempMaxEl) tempMaxEl.textContent = `${data.temp_max}°C`;
        if (tempMinEl) tempMinEl.textContent = `${data.temp_min}°C`;
        
        // Mise à jour de l'heure
        if (updateEl) updateEl.textContent = formatTime(data.timestamp);
        
        // Mise à jour de l'icône
        if (iconEl) {
            // Si vous utilisez des classes d'icônes météo
            const iconClass = `wi-owm-${data.icon}`;
            iconEl.className = 'wi ' + iconClass;
            
            // Alternative: si vous utilisez des images
            // iconEl.src = `http://openweathermap.org/img/wn/${data.icon}@2x.png`;
        }
        
        console.log('Interface météo mise à jour avec les nouvelles données');
    };
    
    // Récupérer les données météo depuis l'API
    const fetchWeather = async function(forceRefresh = false) {
        try {
            // Déterminer l'endpoint à utiliser
            const endpoint = forceRefresh ? config.refreshEndpoint : config.apiEndpoint;
            
            // Ajouter un paramètre timestamp pour éviter la mise en cache
            const url = `${endpoint}?_t=${Date.now()}`;
            
            // Effectuer la requête
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Vérifier si les données contiennent une erreur
            if (data.error) {
                throw new Error(data.message || 'Erreur inconnue');
            }
            
            // Mettre à jour l'interface
            updateUI(data);
            
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            
            // Afficher un message d'erreur dans l'interface
            const errorContainer = document.getElementById('weather-error') || document.querySelector('.weather-error');
            if (errorContainer) {
                errorContainer.textContent = `Erreur: ${error.message}`;
                errorContainer.style.display = 'block';
            }
            
            return null;
        }
    };
    
    // Gérer le clic sur le bouton de rafraîchissement
    const handleRefreshClick = async function() {
        const button = document.getElementById('refresh-weather');
        if (button) {
            // Sauvegarder le contenu original
            const originalContent = button.innerHTML;
            
            // Afficher l'état de chargement
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.disabled = true;
            
            // Forcer le rafraîchissement
            await fetchWeather(true);
            
            // Restaurer l'apparence du bouton
            button.innerHTML = originalContent;
            button.disabled = false;
        } else {
            // Si le bouton n'existe pas, juste faire le rafraîchissement
            await fetchWeather(true);
        }
        
        // Réinitialiser le minuteur
        resetRefreshTimer();
    };
    
    // Réinitialiser le minuteur de rafraîchissement
    const resetRefreshTimer = function() {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }
        
        refreshTimer = setTimeout(() => fetchWeather(), config.refreshInterval);
    };
    
    // Initialiser le module météo
    const init = function() {
        console.log('Initialisation du module météo');
        
        // Récupérer les données initiales
        fetchWeather();
        
        // Configurer le rafraîchissement périodique
        resetRefreshTimer();
        
        // Ajouter un gestionnaire d'événements pour le bouton de rafraîchissement
        const refreshButton = document.getElementById('refresh-weather');
        if (refreshButton) {
            refreshButton.addEventListener('click', handleRefreshClick);
        }
        
        // Exposer l'API pour le débogage
        window.refreshWeather = handleRefreshClick;
    };
    
    // Appeler init au chargement du DOM
    document.addEventListener('DOMContentLoaded', init);
    
    // API publique
    return {
        refresh: handleRefreshClick,
        fetchWeather: fetchWeather,
        updateUI: updateUI
    };
})();