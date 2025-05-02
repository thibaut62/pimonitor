// Fonction pour mettre à jour les styles des graphiques en fonction du thème
window.updateChartStyles = function() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Couleurs pour les graphiques
    const textColor = isDark ? '#e0e0e0' : '#666';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Mise à jour des options globales de Chart.js
    if (window.Chart) {
        Chart.defaults.color = textColor;
        Chart.defaults.scale.grid.color = gridColor;
        
        // Mettre à jour tous les graphiques existants
        Chart.instances.forEach(chart => {
            // Mise à jour des couleurs d'axes
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
            }
            
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            
            // Actualiser le graphique
            chart.update();
        });
    }
};
