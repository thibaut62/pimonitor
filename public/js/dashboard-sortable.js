// dashboard-sortable.js - Module pour gérer le réarrangement des blocs du tableau de bord

window.DashboardSortable = (function() {
    // Configuration
    const config = {
        storageKey: 'dashboard_blocks_order',
        animationSpeed: 150
    };
    
    // Variables
    let sortableInstance = null;
    let blocksOrder = [];
    
    // Initialiser le Sortable
    function initSortable() {
        const sortableContainer = document.getElementById('sortable-dashboard');
        if (!sortableContainer) {
            console.error('Container sortable-dashboard non trouvé');
            return;
        }
        
        // Ajouter des poignées de glisser-déposer sur chaque bloc
        const blocks = sortableContainer.querySelectorAll('.dashboard-block');
        blocks.forEach(block => {
            // Trouver l'en-tête du bloc (généralement la première card-header)
            const header = block.querySelector('.card-header');
            if (header) {
                header.classList.add('sortable-handle');
                header.style.cursor = 'move';
                
                // Ajouter un indicateur visuel de glisser-déposer
                const dragIcon = document.createElement('i');
                dragIcon.className = 'fas fa-grip-lines float-end ms-2';
                dragIcon.style.opacity = '0.5';
                header.appendChild(dragIcon);
            }
        });
        
        // Charger l'ordre sauvegardé
        loadSavedOrder();
        
        // Appliquer l'ordre sauvegardé
        if (blocksOrder.length > 0) {
            applyBlocksOrder();
        }
        
        // Initialiser Sortable.js
        sortableInstance = new Sortable(sortableContainer, {
            animation: config.animationSpeed,
            handle: '.sortable-handle',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            // Nouvelles options pour permettre la disposition en grille
            forceFallback: true,  // Utiliser le fallback pour un meilleur contrôle
            fallbackClass: 'sortable-fallback',
            fallbackOnBody: true,
            swapThreshold: 0.65,  // Seuil pour échanger les éléments
            direction: 'both',    // Permettre le déplacement dans les deux directions
            onEnd: function(evt) {
            // Sauvegarder le nouvel ordre
            saveBlocksOrder();
            }
        });
        
        console.log('Sortable initialisé sur le tableau de bord');
    }
    
    // Sauvegarder l'ordre des blocs
    function saveBlocksOrder() {
        try {
            const blocks = document.querySelectorAll('.dashboard-block');
            blocksOrder = Array.from(blocks).map(block => block.getAttribute('data-block-id'));
            
            localStorage.setItem(config.storageKey, JSON.stringify(blocksOrder));
            console.log('Ordre des blocs sauvegardé:', blocksOrder);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'ordre des blocs:', error);
        }
    }
    
    // Charger l'ordre sauvegardé
    function loadSavedOrder() {
        try {
            const savedOrder = localStorage.getItem(config.storageKey);
            if (savedOrder) {
                blocksOrder = JSON.parse(savedOrder);
                console.log('Ordre des blocs chargé:', blocksOrder);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'ordre des blocs:', error);
            blocksOrder = [];
        }
    }
    
    // Appliquer l'ordre des blocs au DOM
    function applyBlocksOrder() {
        const sortableContainer = document.getElementById('sortable-dashboard');
        if (!sortableContainer) return;
        
        const blocks = Array.from(sortableContainer.querySelectorAll('.dashboard-block'));
        
        // Vérifier que tous les blocs dans l'ordre sauvegardé existent toujours
        const validOrder = blocksOrder.filter(id => 
            blocks.some(block => block.getAttribute('data-block-id') === id)
        );
        
        // Ajouter les blocs qui n'étaient pas dans l'ordre sauvegardé
        const missingBlocks = blocks.filter(block => 
            !validOrder.includes(block.getAttribute('data-block-id'))
        ).map(block => block.getAttribute('data-block-id'));
        
        // Ordre final
        const finalOrder = [...validOrder, ...missingBlocks];
        
        // Réordonner les blocs
        finalOrder.forEach(id => {
            const block = blocks.find(b => b.getAttribute('data-block-id') === id);
            if (block) {
                sortableContainer.appendChild(block);
            }
        });
    }
    
    // Réinitialiser l'ordre par défaut
    function resetToDefaultOrder() {
        localStorage.removeItem(config.storageKey);
        blocksOrder = [];
        
        // Recharger la page pour rétablir l'ordre d'origine
        window.location.reload();
    }
    
    // Initialisation du module
    function init() {
        console.log('Initialisation du module de réorganisation du tableau de bord');
        
        // Attendre que les composants soient chargés
        if (window.ComponentsManager) {
            window.ComponentsManager.onReady(initSortable);
        } else {
            // Sinon, attendre que le DOM soit chargé
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    // Attendre un peu que les composants se chargent
                    setTimeout(initSortable, 1000);
                });
            } else {
                setTimeout(initSortable, 1000);
            }
        }
    }
    
    // Appel de l'initialisation
    init();
    
    // API publique
    return {
        resetToDefaultOrder
    };
})();