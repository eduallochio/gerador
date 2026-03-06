// Configura o toggle quando o DOM estiver pronto.
// A aplicação inicial do tema é feita por um script inline no <head> de cada página,
// garantindo que não haja FOUC (flash of unstyled content).
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
} else {
    setupThemeToggle();
}

function setupThemeToggle() {
    try {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) {
            console.warn('Toggle de modo escuro não encontrado');
            return;
        }

        // Sincroniza o estado do checkbox com o tema atual
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        darkModeToggle.checked = isDarkMode;

        // Aplica a classe no body caso o script inline só tenha aplicado no <html>
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }

        // Adiciona o listener para a mudança de tema
        darkModeToggle.addEventListener('change', () => {
            const enabled = darkModeToggle.checked;
            document.body.classList.toggle('dark-mode', enabled);
            document.documentElement.classList.toggle('dark-mode', enabled);
            localStorage.setItem('darkMode', enabled);
        });
    } catch (error) {
        console.error('Erro ao configurar o modo escuro:', error);
    }
}