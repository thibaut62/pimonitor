// sidebar.js - Module pour gérer la barre latérale
(function() {
    document.addEventListener('DOMContentLoaded', function() {
      const sidebar = document.getElementById('sidebar');
      const sidebarToggle = document.getElementById('sidebar-toggle');
      const rebootBtn = document.getElementById('reboot-btn');
      const currentDateTimeElement = document.getElementById('current-date-time');
      
      // Gestion du toggle de la barre latérale
      if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
          sidebar.classList.toggle('active');
          
          // Sauvegarder l'état dans le localStorage
          const isActive = sidebar.classList.contains('active');
          localStorage.setItem('sidebar_collapsed', isActive ? 'true' : 'false');
        });
      }
      
      // Restaurer l'état sauvegardé de la barre latérale
      const savedState = localStorage.getItem('sidebar_collapsed');
      if (savedState === 'true' && sidebar) {
        sidebar.classList.add('active');
      } else if (savedState === 'false' && sidebar) {
        sidebar.classList.remove('active');
      }
      
      // Gestion du bouton de redémarrage
      if (rebootBtn) {
        rebootBtn.addEventListener('click', function() {
          const rebootModal = new bootstrap.Modal(document.getElementById('reboot-modal'));
          rebootModal.show();
        });
        
        const confirmRebootBtn = document.getElementById('confirm-reboot');
        if (confirmRebootBtn) {
          confirmRebootBtn.addEventListener('click', function() {
            // Envoyer la commande de redémarrage au serveur
            fetch('/api/system/reboot', {
              method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                alert('Le système va redémarrer dans quelques instants.');
              } else {
                alert('Erreur lors du redémarrage: ' + data.error);
              }
            })
            .catch(error => {
              console.error('Erreur:', error);
              alert('Erreur de communication avec le serveur.');
            })
            .finally(() => {
              const modal = bootstrap.Modal.getInstance(document.getElementById('reboot-modal'));
              modal.hide();
            });
          });
        }
      }
      
      // Mettre à jour la date et l'heure actuelles
      if (currentDateTimeElement) {
        function updateDateTime() {
          const now = new Date();
          currentDateTimeElement.textContent = now.toLocaleString();
        }
        
        updateDateTime();
        setInterval(updateDateTime, 1000); // Mise à jour toutes les secondes
      }
      
      // Mettre en surbrillance l'élément actif du menu
      const currentPage = window.location.pathname;
      const menuItems = document.querySelectorAll('#sidebar ul li');
      
      menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && (currentPage === link.getAttribute('href') || 
           (currentPage === '/' && link.getAttribute('href') === '/index.html'))) {
          menuItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        }
      });
    });
  })();