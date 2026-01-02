// Inicialização do tema - executa imediatamente para evitar flash
(function() {
    try {
        // Aplica o tema salvo ANTES do DOM carregar para evitar flash
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            if (document.body) {
                document.body.classList.add('dark-mode');
            }
        }
    } catch (error) {
        console.error('Erro ao aplicar tema inicial:', error);
    }
})();

// Configura o toggle quando o DOM estiver pronto
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

        // Adiciona o listener para a mudança de tema
        darkModeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            document.documentElement.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', darkModeToggle.checked);
        });
    } catch (error) {
        console.error('Erro ao configurar o modo escuro:', error);
    }
}