// weather.js - Module pour la gestion des données météo

window.WeatherModule = (function() {
  // Vérifier si les éléments DOM requis sont présents
  function checkRequiredElements() {
      return document.getElementById('weather-temp') || 
             document.getElementById('weather-temp-collapsed');
  }
  
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
      // Vérifier si les éléments requis sont présents
      if (!checkRequiredElements()) {
          window.DashboardUtils.logDebug('Composant météo non chargé, nouvelle tentative dans 500ms');
          setTimeout(fetchWeatherData, 500);
          return;
      }
      
      try {
          // Utiliser un timestamp pour éviter la mise en cache
          const timestamp = Date.now();
          const url = `${window.DashboardUtils.config.API_BASE_URL}/weather?_t=${timestamp}`;
          
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
          const elementMappings = {
              'weather-desc': data.description,
              'weather-feels': data.feels_like ? `${parseFloat(data.feels_like).toFixed(1)}°C` : 'N/A',
              'weather-humidity': data.humidity ? `${data.humidity}%` : 'N/A',
              'weather-wind': data.wind_speed ? `${data.wind_speed} m/s` : 'N/A',
              'weather-pressure': data.pressure ? `${data.pressure} hPa` : 'N/A',
              'weather-temp-max': data.temp_max ? `${parseFloat(data.temp_max).toFixed(1)}°C` : 'N/A',
              'weather-temp-min': data.temp_min ? `${parseFloat(data.temp_min).toFixed(1)}°C` : 'N/A'
          };
          
          // Mettre à jour chaque élément s'il existe
          for (const [elementId, value] of Object.entries(elementMappings)) {
              const element = document.getElementById(elementId);
              if (element) element.textContent = value;
          }
          
          // Mettre à jour l'horodatage
          const lastUpdate = document.getElementById('weather-last-update');
          if (lastUpdate) {
              const now = new Date();
              lastUpdate.textContent = now.toLocaleTimeString();
          }
          
          // Mettre à jour l'icône météo
          const weatherIconElement = document.getElementById('weather-icon');
          if (weatherIconElement && data.icon) {
              // Mapping d'icônes à des classes Font Awesome
              const iconMapping = {
                  '01d': 'fa-sun',           // clear sky day
                  '01n': 'fa-moon',          // clear sky night
                  '02d': 'fa-cloud-sun',     // few clouds day
                  '02n': 'fa-cloud-moon',    // few clouds night
                  '03d': 'fa-cloud',         // scattered clouds
                  '03n': 'fa-cloud',
                  '04d': 'fa-cloud',         // broken clouds
                  '04n': 'fa-cloud',
                  '09d': 'fa-cloud-showers-heavy', // shower rain
                  '09n': 'fa-cloud-showers-heavy',
                  '10d': 'fa-cloud-sun-rain', // rain day
                  '10n': 'fa-cloud-moon-rain', // rain night
                  '11d': 'fa-bolt',          // thunderstorm
                  '11n': 'fa-bolt',
                  '13d': 'fa-snowflake',     // snow
                  '13n': 'fa-snowflake',
                  '50d': 'fa-smog',          // mist
                  '50n': 'fa-smog'
              };
              
              // Remplacer toutes les classes fa-* existantes
              weatherIconElement.className = '';
              weatherIconElement.classList.add('fas');
              
              // Ajouter la classe d'icône appropriée
              const iconClass = iconMapping[data.icon] || 'fa-cloud';
              weatherIconElement.classList.add(iconClass);
              weatherIconElement.classList.add('display-5'); // Maintenir la taille
          }
          
          return data;
      } catch (error) {
          console.error('Erreur météo:', error);
          
          // Afficher l'erreur dans l'UI si l'élément existe
          const errorElement = document.getElementById('weather-error');
          if (errorElement) {
              errorElement.style.display = 'block';
              errorElement.textContent = `Erreur de chargement des données météo: ${error.message}`;
          }
          
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
              await fetch(`${window.DashboardUtils.config.API_BASE_URL}/weather/refresh`, {
                  headers: {
                      'Cache-Control': 'no-cache'
                  }
              });
              
              // Récupérer les nouvelles données
              await fetchWeatherData();
          } catch (error) {
              console.error('Erreur lors du rafraîchissement:', error);
              
              // Afficher l'erreur dans l'UI si l'élément existe
              const errorElement = document.getElementById('weather-error');
              if (errorElement) {
                  errorElement.style.display = 'block';
                  errorElement.textContent = `Erreur de rafraîchissement: ${error.message}`;
              }
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
  
  // Initialisation du module
  function init() {
      console.log('Initialisation du module météo');
      
      // Écouter l'événement de chargement des composants si disponible
      if (window.ComponentsManager) {
          console.log('ComponentsManager détecté, écoute des événements de chargement');
          document.addEventListener('dashboardComponentLoaded', function(event) {
              if (event.detail && event.detail.id === 'weather-component') {
                  console.log('Composant météo chargé, initialisation du module météo');
                  
                  // Configurer le bouton de rafraîchissement
                  const refreshButton = document.getElementById('refresh-weather');
                  if (refreshButton) {
                      refreshButton.addEventListener('click', refreshWeather);
                  }
                  
                  // Configurer le bouton de toggling
                  const toggleBtn = document.getElementById('weather-toggle-btn');
                  const weatherContent = document.getElementById('weather-content');
                  const weatherTempCollapsed = document.getElementById('weather-temp-collapsed');
                  
                  if (toggleBtn && weatherContent) {
                      toggleBtn.addEventListener('click', function() {
                          const isCollapsed = weatherContent.style.display === 'none';
                          
                          if (isCollapsed) {
                              // Dépli
                              weatherContent.style.display = 'block';
                              toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
                              if (weatherTempCollapsed) weatherTempCollapsed.style.display = 'none';
                          } else {
                              // Repli
                              weatherContent.style.display = 'none';
                              toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
                              if (weatherTempCollapsed) weatherTempCollapsed.style.display = 'inline';
                          }
                          
                          // Après le toggling, s'assurer que les températures sont synchronisées
                          setTimeout(function() {
                              const tempEl = document.getElementById('weather-temp');
                              if (tempEl && tempEl.textContent) {
                                  updateAllTemperatureDisplays(tempEl.textContent);
                              }
                          }, 100);
                      });
                  }
                  
                  setTimeout(fetchWeatherData, 200);
              }
          });
      } else {
          // Initialisation classique
          if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                  // Configurer le bouton de rafraîchissement
                  const refreshButton = document.getElementById('refresh-weather');
                  if (refreshButton) {
                      refreshButton.addEventListener('click', refreshWeather);
                  }
                  
                  // Configurer le bouton de toggling
                  const toggleBtn = document.getElementById('weather-toggle-btn');
                  const weatherContent = document.getElementById('weather-content');
                  const weatherTempCollapsed = document.getElementById('weather-temp-collapsed');
                  
                  if (toggleBtn && weatherContent) {
                      toggleBtn.addEventListener('click', function() {
                          const isCollapsed = weatherContent.style.display === 'none';
                          
                          if (isCollapsed) {
                              // Dépli
                              weatherContent.style.display = 'block';
                              toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
                              if (weatherTempCollapsed) weatherTempCollapsed.style.display = 'none';
                          } else {
                              // Repli
                              weatherContent.style.display = 'none';
                              toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
                              if (weatherTempCollapsed) weatherTempCollapsed.style.display = 'inline';
                          }
                          
                          // Après le toggling, s'assurer que les températures sont synchronisées
                          setTimeout(function() {
                              const tempEl = document.getElementById('weather-temp');
                              if (tempEl && tempEl.textContent) {
                                  updateAllTemperatureDisplays(tempEl.textContent);
                              }
                          }, 100);
                      });
                  }
                  
                  // Charger les données initiales
                  fetchWeatherData();
                  
                  // Rafraîchir automatiquement toutes les 15 minutes
                  setInterval(fetchWeatherData, 15 * 60 * 1000);
              });
          } else {
              // Configurer le bouton de rafraîchissement
              const refreshButton = document.getElementById('refresh-weather');
              if (refreshButton) {
                  refreshButton.addEventListener('click', refreshWeather);
              }
              
              // Configurer le bouton de toggling
              const toggleBtn = document.getElementById('weather-toggle-btn');
              const weatherContent = document.getElementById('weather-content');
              const weatherTempCollapsed = document.getElementById('weather-temp-collapsed');
              
              if (toggleBtn && weatherContent) {
                  toggleBtn.addEventListener('click', function() {
                      const isCollapsed = weatherContent.style.display === 'none';
                      
                      if (isCollapsed) {
                          // Dépli
                          weatherContent.style.display = 'block';
                          toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
                          if (weatherTempCollapsed) weatherTempCollapsed.style.display = 'none';
                      } else {
                          // Repli
                          weatherContent.style.display = 'none';
                          toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
                          if (weatherTempCollapsed) weatherTempCollapsed.style.display = 'inline';
                      }
                      
                      // Après le toggling, s'assurer que les températures sont synchronisées
                      setTimeout(function() {
                          const tempEl = document.getElementById('weather-temp');
                          if (tempEl && tempEl.textContent) {
                              updateAllTemperatureDisplays(tempEl.textContent);
                          }
                      }, 100);
                  });
              }
              
              // Charger les données initiales
              fetchWeatherData();
              
              // Rafraîchir automatiquement toutes les 15 minutes
              setInterval(fetchWeatherData, 15 * 60 * 1000);
          }
      }
  }
  
  // Appel de l'initialisation
  init();
  
  // Interface publique du module
  return {
      refresh: refreshWeather,
      fetchData: fetchWeatherData,
      updateTemp: updateAllTemperatureDisplays,
      loadWeather: fetchWeatherData // Alias pour compatibilité
  };
})();