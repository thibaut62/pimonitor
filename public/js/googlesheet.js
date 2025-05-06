// googlesheet.js - Module pour l'affichage d'un Google Sheet
window.GoogleSheetModule = (function() {
  // Configuration
  const config = {
      storageKey: 'google_sheet_url',
      defaultSheetUrl: 'https://docs.google.com/spreadsheets/d/1BUFBflVSR9kIC9vDtbHRbYvij0Xn8XouiAXfBroBZ4s/edit?usp=sharing', // Votre lien
      autoRefreshInterval: 5 * 60 * 1000 // 5 minutes
  };
  
  // Variables
  let sheetUrl = '';
  let refreshTimer = null;
  
  // Éléments DOM
  let sheetIframe;
  let sheetContainer;
  let sheetConfig;
  let sheetUrlInput;
  let sheetLastUpdate;
  let configureSheetBtn;
  let saveSheetConfigBtn;
  let cancelSheetConfigBtn;
  let refreshSheetBtn;
  let sheetToggleBtn;
  let sheetContent;
  
  // Vérifier si les éléments DOM requis sont présents
  function checkRequiredElements() {
      return document.getElementById('sheet-iframe') && 
             document.getElementById('sheet-container');
  }
  
  // Initialiser le module
  function init() {
      console.log('Initialisation du module Google Sheet');
      
      // Écouter l'événement de chargement des composants si disponible
      if (window.ComponentsManager) {
          console.log('ComponentsManager détecté, écoute des événements de chargement');
          document.addEventListener('dashboardComponentLoaded', function(event) {
              if (event.detail && event.detail.id === 'google-sheet-component') {
                  console.log('Composant Google Sheet chargé, initialisation du module');
                  initSheetComponent();
              }
          });
      } else {
          // Initialisation classique
          if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                  if (checkRequiredElements()) {
                      initSheetComponent();
                  } else {
                      console.error('Éléments Google Sheet non trouvés');
                  }
              });
          } else {
              if (checkRequiredElements()) {
                  initSheetComponent();
              } else {
                  console.error('Éléments Google Sheet non trouvés');
              }
          }
      }
  }
  
  // Initialisation du composant
  function initSheetComponent() {
      // Récupérer les éléments DOM
      sheetIframe = document.getElementById('sheet-iframe');
      sheetContainer = document.getElementById('sheet-container');
      sheetConfig = document.getElementById('sheet-config');
      sheetUrlInput = document.getElementById('sheet-url');
      sheetLastUpdate = document.getElementById('sheet-last-update');
      configureSheetBtn = document.getElementById('configure-sheet');
      saveSheetConfigBtn = document.getElementById('save-sheet-config');
      cancelSheetConfigBtn = document.getElementById('cancel-sheet-config');
      refreshSheetBtn = document.getElementById('refresh-sheet');
      sheetToggleBtn = document.getElementById('sheet-toggle-btn');
      sheetContent = document.getElementById('sheet-content');
      
      // Vérifier que tous les éléments existent
      if (!sheetIframe || !sheetContainer) {
          console.error('Éléments Google Sheet non trouvés lors de l\'initialisation');
          return;
      }
      
      // Charger l'URL sauvegardée
      loadSavedUrl();
      
      // Configurer les boutons
      if (configureSheetBtn) {
          configureSheetBtn.addEventListener('click', showConfig);
      }
      
      if (saveSheetConfigBtn) {
          saveSheetConfigBtn.addEventListener('click', saveConfig);
      }
      
      if (cancelSheetConfigBtn) {
          cancelSheetConfigBtn.addEventListener('click', hideConfig);
      }
      
      if (refreshSheetBtn) {
          refreshSheetBtn.addEventListener('click', refreshSheet);
      }
      
      // Configurer le bouton de toggling
      if (sheetToggleBtn && sheetContent) {
          sheetToggleBtn.addEventListener('click', function() {
              if (sheetContent.style.display === 'none') {
                  sheetContent.style.display = 'block';
                  sheetToggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
              } else {
                  sheetContent.style.display = 'none';
                  sheetToggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
              }
          });
      }
      
      // Configurer l'actualisation automatique
      startAutoRefresh();
  }
  
  // Charger l'URL sauvegardée
  function loadSavedUrl() {
      try {
          sheetUrl = localStorage.getItem(config.storageKey) || config.defaultSheetUrl;
          
          if (sheetUrlInput) {
              sheetUrlInput.value = sheetUrl;
          }
          
          loadSheet();
      } catch (error) {
          console.error('Erreur lors du chargement de l\'URL:', error);
          sheetUrl = config.defaultSheetUrl;
      }
  }
  
  // Charger le Google Sheet
  function loadSheet() {
      if (!sheetUrl || !sheetIframe) return;
      
      // Formater l'URL pour l'incorporation
      let embedUrl = sheetUrl;
      
      // Si l'URL est au format normal, la convertir au format d'incorporation
      if (sheetUrl.includes('/edit')) {
          embedUrl = sheetUrl.replace('/edit', '/preview');
      } else if (!sheetUrl.includes('/preview')) {
          // Ajouter /preview si nécessaire
          if (sheetUrl.endsWith('/')) {
              embedUrl = sheetUrl + 'preview';
          } else {
              embedUrl = sheetUrl + '/preview';
          }
      }
      
      // Charger le sheet dans l'iframe
      console.log('Chargement du Google Sheet:', embedUrl);
      sheetIframe.src = embedUrl;
      
      // Mettre à jour l'horodatage
      updateTimestamp();
  }
  
  // Afficher la configuration
  function showConfig() {
      if (sheetConfig) {
          sheetConfig.style.display = 'block';
      }
      
      if (sheetUrlInput && sheetUrl) {
          sheetUrlInput.value = sheetUrl;
      }
  }
  
  // Masquer la configuration
  function hideConfig() {
      if (sheetConfig) {
          sheetConfig.style.display = 'none';
      }
  }
  
  // Sauvegarder la configuration
  function saveConfig() {
      if (!sheetUrlInput) return;
      
      const newUrl = sheetUrlInput.value.trim();
      if (newUrl) {
          sheetUrl = newUrl;
          
          try {
              localStorage.setItem(config.storageKey, sheetUrl);
          } catch (error) {
              console.error('Erreur lors de la sauvegarde de l\'URL:', error);
          }
          
          loadSheet();
      }
      
      hideConfig();
  }
  
  // Actualiser le Google Sheet
  function refreshSheet() {
      // Ajouter une animation au bouton de rafraîchissement
      if (refreshSheetBtn) {
          refreshSheetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          refreshSheetBtn.disabled = true;
      }
      
      // Recharger l'iframe
      if (sheetIframe && sheetIframe.src) {
          // Ajouter un paramètre timestamp pour éviter la mise en cache
          const timestamp = Date.now();
          let currentSrc = sheetIframe.src;
          
          // Supprimer l'ancien timestamp s'il existe
          if (currentSrc.includes('&_t=')) {
              currentSrc = currentSrc.replace(/&_t=\d+/, '');
          }
          
          // Ajouter le nouveau timestamp
          sheetIframe.src = `${currentSrc}&_t=${timestamp}`;
          
          // Mettre à jour l'horodatage
          updateTimestamp();
      }
      
      // Restaurer le bouton après un délai
      setTimeout(function() {
          if (refreshSheetBtn) {
              refreshSheetBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
              refreshSheetBtn.disabled = false;
          }
      }, 1000);
  }
  
  // Mettre à jour l'horodatage
  function updateTimestamp() {
      if (sheetLastUpdate) {
          const now = new Date();
          sheetLastUpdate.textContent = now.toLocaleTimeString();
      }
  }
  
  // Démarrer l'actualisation automatique
  function startAutoRefresh() {
      if (refreshTimer) {
          clearInterval(refreshTimer);
      }
      
      refreshTimer = setInterval(refreshSheet, config.autoRefreshInterval);
  }
  
  // Arrêter l'actualisation automatique
  function stopAutoRefresh() {
      if (refreshTimer) {
          clearInterval(refreshTimer);
          refreshTimer = null;
      }
  }
  
  // Appel de l'initialisation lorsque le script est chargé
  init();
  
  // API publique
  return {
      refresh: refreshSheet,
      configure: showConfig,
      setUrl: function(url) {
          sheetUrl = url;
          if (sheetUrlInput) {
              sheetUrlInput.value = url;
          }
          saveConfig();
      },
      stop: stopAutoRefresh,
      start: startAutoRefresh
  };
})();