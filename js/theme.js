// /js/theme.js
// Theme switching logic for Marmoush Store

(function() {
    const savedTheme = localStorage.getItem('marmoush_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    document.addEventListener('DOMContentLoaded', () => {
        initThemeToggle();
    });

    function initThemeToggle() {
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            updateToggleUI(toggle, savedTheme);
            
            toggle.onclick = (e) => {
                e.preventDefault();
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('marmoush_theme', newTheme);
                
                toggles.forEach(t => updateToggleUI(t, newTheme));
            };
        });
    }

    function updateToggleUI(toggle, theme) {
        const icon = toggle.querySelector('i');
        if (!icon) return;
        
        if (theme === 'light') {
            icon.className = 'bx bx-moon';
            toggle.title = 'الوضع الليلي';
        } else {
            icon.className = 'bx bx-sun';
            toggle.title = 'الوضع المضيء';
        }
    }
})();
