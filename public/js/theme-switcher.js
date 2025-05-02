// Theme switcher
window.ThemeSwitcher = (function() {
    
    // Vérification si le navigateur supporte le stockage local
    const supportsLocalStorage = (function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    })();
    
    // Récupération du thème préféré de l'utilisateur (via localStorage ou préférence système)
    const getPreferredTheme = function() {
        if (supportsLocalStorage) {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme) {
                return storedTheme;
            }
        }
        
        // Si aucune préférence enregistrée, utiliser la préférence du système
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    
    // Application du thème
    const applyTheme = function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Mettre à jour l'état du commutateur
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.checked = (theme === 'dark');
        }
        
        // Mettre à jour les icônes
        const sunIcon = document.querySelector('.theme-icon:first-child');
        const moonIcon = document.querySelector('.theme-icon:last-child');
        
        if (theme === 'dark') {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'inline-block';
        } else {
            if (sunIcon) sunIcon.style.display = 'inline-block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
        
        // Enregistrer la préférence
        if (supportsLocalStorage) {
            localStorage.setItem('theme', theme);
        }
        
        // Mise à jour des graphiques si Chart.js est utilisé
        if (window.updateChartStyles) {
            window.updateChartStyles();
        }
    };
    
    // Initialisation du commutateur de thème
    const init = function() {
        const themeToggle = document.getElementById('theme-toggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('change', function() {
                const theme = this.checked ? 'dark' : 'light';
                applyTheme(theme);
            });
        }
        
        // Appliquer le thème préféré au chargement
        applyTheme(getPreferredTheme());
        
        // Écouteur pour les changements de préférence système
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const theme = e.matches ? 'dark' : 'light';
                applyTheme(theme);
            });
        }
    };
    
    // Appeler init au chargement du document
    document.addEventListener('DOMContentLoaded', init);
    
    // API publique
    return {
        applyTheme,
        getPreferredTheme
    };
})();
