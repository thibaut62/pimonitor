// weather.js - Version simplifiée avec focus sur la synchronisation des deux affichages
window.WeatherModule = (function() {
    // Point central pour mettre à jour la température dans TOUS les affichages
    function updateAllTemperatureDisplays(temp) {
      console.log(`Mise à jour de tous les affichages de température: ${temp}`);
      
      // 1. Mise à jour directe des éléments DOM
      const tempDisplay = document.getElementById('weather-temp');
      const tempCollapsedDisplay = document.getElementById('weather-temp-collapsed');
      
      if (tempDisplay) tempDisplay.textContent = temp;
      if (tempCollapsedDisplay) tempCollapsedDisplay.textContent = temp;
      
      // 2. Utilisation de la fonction globale si elle existe
      if (typeof window.updateWeatherTemp === 'function') {
        console.log('Appel de la fonction globale updateWeatherTemp');
        window.updateWeatherTemp(temp);
      }
    }
    
    // Récupérer les données météo
    async function fetchWeatherData() {
      try {
        // Utiliser un timestamp pour éviter la mise en cache
        const timestamp = Date.now();
        const url = `http://192.168.0.2:3000/api/weather?_t=${timestamp}`;
        
        console.log(`Récupération des données météo depuis: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données météo reçues:', data);
        
        // Mettre à jour toutes les températures immédiatement
        if (data.temperature !== undefined) {
          const tempString = `${parseFloat(data.temperature).toFixed(1)}°C`;
          updateAllTemperatureDisplays(tempString);
        }
        
        // Mettre à jour les autres champs...
        const desc = document.getElementById('weather-desc');
        const feels = document.getElementById('weather-feels');
        const humidity = document.getElementById('weather-humidity');
        const wind = document.getElementById('weather-wind');
        const pressure = document.getElementById('weather-pressure');
        const tempMax = document.getElementById('weather-temp-max');
        const tempMin = document.getElementById('weather-temp-min');
        const lastUpdate = document.getElementById('weather-last-update');
        
        if (desc) desc.textContent = data.description || 'N/A';
        if (feels) feels.textContent = data.feels_like ? `${parseFloat(data.feels_like).toFixed(1)}°C` : 'N/A';
        if (humidity) humidity.textContent = data.humidity ? `${data.humidity}%` : 'N/A';
        if (wind) wind.textContent = data.wind_speed ? `${data.wind_speed} m/s` : 'N/A';
        if (pressure) pressure.textContent = data.pressure ? `${data.pressure} hPa` : 'N/A';
        if (tempMax) tempMax.textContent = data.temp_max ? `${parseFloat(data.temp_max).toFixed(1)}°C` : 'N/A';
        if (tempMin) tempMin.textContent = data.temp_min ? `${parseFloat(data.temp_min).toFixed(1)}°C` : 'N/A';
        
        // Mettre à jour l'horodatage avec l'heure actuelle
        if (lastUpdate) {
          const now = new Date();
          lastUpdate.textContent = now.toLocaleTimeString();
        }
        
        // Mettre à jour l'icône...
        
        return data;
      } catch (error) {
        console.error('Erreur météo:', error);
        // Afficher l'erreur...
        return null;
      }
    }
    
    // Rafraîchir manuellement les données météo
    async function refreshWeather() {
      console.log('Rafraîchissement manuel des données météo');
      
      const button = document.getElementById('refresh-weather');
      if (button) {
        // Sauvegarder le contenu original
        const originalContent = button.innerHTML;
        
        // Afficher l'état de chargement
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        try {
          // Forcer le rafraîchissement du cache serveur
          await fetch('http://192.168.0.2:3000/api/weather/refresh', {
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          // Récupérer les nouvelles données
          await fetchWeatherData();
        } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
        } finally {
          // Restaurer le bouton
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      } else {
        // Si le bouton n'existe pas, juste faire le rafraîchissement
        await fetchWeatherData();
      }
    }
    
    // Initialiser le module
    function init() {
      console.log('Initialisation du module météo');
      
      // Charger les données initiales
      fetchWeatherData();
      
      // Configurer le bouton de rafraîchissement
      const refreshButton = document.getElementById('refresh-weather');
      if (refreshButton) {
        refreshButton.addEventListener('click', refreshWeather);
      }
      
      // Rafraîchir automatiquement toutes les 15 minutes (15 * 60 * 1000 ms)
      setInterval(fetchWeatherData, 15 * 60 * 1000);
      
      // IMPORTANT: Surveillance des changements d'affichage pour assurer la synchronisation
      const toggleBtn = document.getElementById('weather-toggle-btn');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
          // Après le toggling, s'assurer que les températures sont synchronisées
          setTimeout(function() {
            const tempEl = document.getElementById('weather-temp');
            if (tempEl && tempEl.textContent) {
              updateAllTemperatureDisplays(tempEl.textContent);
            }
          }, 100); // Petit délai pour s'assurer que le toggling est terminé
        });
      }
    }
    
    // S'assurer que le DOM est chargé avant d'initialiser
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    
    // API publique
    return {
      refresh: refreshWeather,
      fetchData: fetchWeatherData,
      updateTemp: updateAllTemperatureDisplays
    };
  })();