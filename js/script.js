// --- Contador via PHP local (zero senhas armazenadas — apenas números) ---
const _CONTADOR_URL = '/contador.php';

// Função para mostrar notificações
function showToast(message, isError = false) {
    try {
        const toast = document.getElementById('toastNotification');
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast' + (isError ? ' error' : '');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    } catch (error) {
        console.error('Erro ao mostrar toast:', error);
    }
}


// --- Funções de Geração de Senha ---
function generatePassword(elements, charSets) {
    try {
        const useUppercase = elements.optionsCheckboxes.includeUppercase.checked;
        const useLowercase = elements.optionsCheckboxes.includeLowercase.checked;
        const useNumbers   = elements.optionsCheckboxes.includeNumbers.checked;
        const useSymbols   = elements.optionsCheckboxes.includeSymbols.checked;
        const excludeAmbiguous = elements.optionsCheckboxes.excludeAmbiguous.checked;

        const filterAmbiguous = (str) =>
            excludeAmbiguous ? str.split('').filter(c => !charSets.ambiguous.includes(c)).join('') : str;

        let charSet = '';
        const guaranteedChars = [];

        if (useUppercase) {
            const set = filterAmbiguous(charSets.uppercase);
            charSet += set;
            if (set.length) guaranteedChars.push(set);
        }
        if (useLowercase) {
            const set = filterAmbiguous(charSets.lowercase);
            charSet += set;
            if (set.length) guaranteedChars.push(set);
        }
        if (useNumbers) {
            const set = filterAmbiguous(charSets.numbers);
            charSet += set;
            if (set.length) guaranteedChars.push(set);
        }
        if (useSymbols) {
            const set = filterAmbiguous(charSets.symbols);
            charSet += set;
            if (set.length) guaranteedChars.push(set);
        }

        if (charSet === '') {
            elements.passwordDisplay.value = 'Selecione uma opção!';
            updateStrengthIndicator('', elements);
            return false;
        }

        const length = parseInt(elements.lengthSlider.value);
        const getRandomChar = (set) => {
            if (window.crypto && window.crypto.getRandomValues) {
                const arr = new Uint32Array(1);
                window.crypto.getRandomValues(arr);
                return set[arr[0] % set.length];
            }
            return set[Math.floor(Math.random() * set.length)];
        };

        // Garante ao menos um caractere de cada tipo selecionado
        let passwordChars = guaranteedChars.map(set => getRandomChar(set));

        // Preenche o restante aleatoriamente
        while (passwordChars.length < length) {
            passwordChars.push(getRandomChar(charSet));
        }

        // Embaralha para que os chars garantidos não fiquem sempre no início
        if (window.crypto && window.crypto.getRandomValues) {
            const swapArr = new Uint32Array(passwordChars.length);
            window.crypto.getRandomValues(swapArr);
            for (let i = passwordChars.length - 1; i > 0; i--) {
                const j = swapArr[i] % (i + 1);
                [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
            }
        } else {
            passwordChars.sort(() => Math.random() - 0.5);
        }

        const password = passwordChars.join('');
        elements.passwordDisplay.value = password;
        updateStrengthIndicator(password, elements);
        return true;
    } catch (error) {
        console.error('Erro ao gerar senha:', error);
        elements.passwordDisplay.value = 'Erro ao gerar senha';
        updateStrengthIndicator('', elements);
        return false;
    }
}

function updateStrengthIndicator(password, elements) {
    try {
        let score = 0;
        if (!password) {
            elements.strengthBar.style.width = '0%';
            elements.strengthText.textContent = 'Força';
            elements.strengthBar.className = 'strength-bar';
            return;
        }
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        elements.strengthBar.className = 'strength-bar';
        
        if (score <= 3) {
            elements.strengthBar.style.width = '25%';
            elements.strengthBar.classList.add('strength-weak');
            elements.strengthText.textContent = 'Força: Fraca';
        } else if (score <= 5) {
            elements.strengthBar.style.width = '50%';
            elements.strengthBar.classList.add('strength-medium');
            elements.strengthText.textContent = 'Força: Média';
        } else if (score <= 6) {
            elements.strengthBar.style.width = '75%';
            elements.strengthBar.classList.add('strength-strong');
            elements.strengthText.textContent = 'Força: Forte';
        } else {
            elements.strengthBar.style.width = '100%';
            elements.strengthBar.classList.add('strength-very-strong');
            elements.strengthText.textContent = 'Força: Muito Forte';
        }
    } catch (error) {
        console.error('Erro ao atualizar indicador de força:', error);
    }
}

// --- Funções de Contador ---
// Leitura/escrita local para exibição imediata (sem latência)
function _getLocalStats() {
    const today = new Date().toDateString();
    const s = JSON.parse(localStorage.getItem('passwordStats')) || { total: 0, today: 0, lastDate: today };
    if (s.lastDate !== today) { s.today = 0; s.lastDate = today; }
    return s;
}

// Carrega contagens: exibe local imediatamente, depois sincroniza com o servidor PHP
function getPasswordStats(elements) {
    const local = _getLocalStats();
    updateCounterDisplays(local, elements);

    fetch(_CONTADOR_URL + '?acao=ler')
        .then(r => r.json())
        .then(data => {
            updateCounterDisplays({ total: data.total, today: data.hoje }, elements);
        })
        .catch(() => { /* sem internet — continua com local */ });
}

// Incrementa local imediatamente (UI responsiva) e servidor em background
function incrementCounters(elements) {
    const local = _getLocalStats();
    local.today++;
    local.total++;
    localStorage.setItem('passwordStats', JSON.stringify(local));
    updateCounterDisplays(local, elements);

    fetch(_CONTADOR_URL + '?acao=incrementar')
        .catch(() => { /* silent — local já foi atualizado */ });
}

function updateCounterDisplays(stats, elements) {
    if (elements.todayCounter && elements.totalCounter) {
        elements.todayCounter.textContent = stats.today.toLocaleString();
        elements.totalCounter.textContent = stats.total.toLocaleString();
    }
}

// --- Configuração de Event Listeners ---
function setupEventListeners(elements, charSets) {
    try {
        elements.lengthSlider.addEventListener('input', () => {
            elements.lengthValue.textContent = elements.lengthSlider.value;
            generatePassword(elements, charSets);
        });

        document.querySelectorAll('.length-btn').forEach(button => {
            button.addEventListener('click', () => {
                const change = parseInt(button.dataset.change);
                let newValue = parseInt(elements.lengthSlider.value) + change;
                newValue = Math.max(8, Math.min(32, newValue));
                elements.lengthSlider.value = newValue;
                elements.lengthValue.textContent = newValue;
                generatePassword(elements, charSets);
            });
        });

        elements.generateButton.addEventListener('click', () => {
            const generated = generatePassword(elements, charSets);
            if (generated) incrementCounters(elements);
        });

        elements.copyButton.addEventListener('click', async () => {
            try {
                const password = elements.passwordDisplay.value;
                if (!password || password === 'Selecione uma opção!' || password === 'Selecione as opções e clique em "Gerar Nova Senha"') return;
                await navigator.clipboard.writeText(password);
                showToast('Senha copiada com sucesso!');
            } catch (err) {
                console.error('Erro ao copiar senha:', err);
                showToast('Falha ao copiar a senha', true);
            }
        });

        Object.values(elements.optionsCheckboxes).forEach(checkbox => {
            checkbox.addEventListener('change', () => generatePassword(elements, charSets));
        });

    } catch (error) {
        console.error('Erro ao configurar event listeners:', error);
    }
}

function setupHamburger() {
    try {
        const btn = document.getElementById('hamburgerBtn');
        const nav = document.getElementById('navControls');
        if (!btn || !nav) return;

        btn.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            btn.classList.toggle('open', isOpen);
            btn.setAttribute('aria-expanded', isOpen);
        });

        // Fecha o menu ao clicar em um link de navegação
        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                btn.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            });
        });
    } catch (error) {
        console.error('Erro ao configurar hamburger:', error);
    }
}

function setupFAQ() {
    try {
        const faqCards = document.querySelectorAll('.faq-card');
        faqCards.forEach(card => {
            const question = card.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => {
                    faqCards.forEach(otherCard => {
                        if (otherCard !== card && otherCard.classList.contains('active')) {
                            otherCard.classList.remove('active');
                        }
                    });
                    card.classList.toggle('active');
                });
            }
        });
    } catch (error) {
        console.error('Erro ao configurar FAQ:', error);
    }
}

// **NOVA FUNÇÃO** para ativar os links de partilha
function setupSocialSharing() {
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);
    
    const twitterLink = document.getElementById('shareTwitter');
    const facebookLink = document.getElementById('shareFacebook');
    const whatsappLink = document.getElementById('shareWhatsapp');

    if(twitterLink) {
        twitterLink.href = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
    }
    if(facebookLink) {
        facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
    }
    if(whatsappLink) {
        whatsappLink.href = `https://api.whatsapp.com/send?text=${pageTitle} ${pageUrl}`;
    }
}

// **CORREÇÃO** na função para atualizar o ano
function updateCopyrightYear() {
    try {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    } catch (error) {
        console.error('Erro ao atualizar copyright:', error);
    }
}

// **NOVA FUNÇÃO** para controlar os modais de privacidade e termos
function setupModals() {
    try {
        // Seleciona todos os elementos necessários
        const privacyModal = document.getElementById('privacyModal');
        const termsModal = document.getElementById('termsModal');
        
        const openPrivacyBtn = document.getElementById('openPrivacyModal');
        const openTermsBtn = document.getElementById('openTermsModal');

        // Seleciona todos os botões de fechar (pode haver mais de um)
        const closeButtons = document.querySelectorAll('.close-modal-btn');

        // Função para abrir um modal
        const openModal = (modalElement) => {
            if (modalElement) {
                modalElement.classList.add('show');
            }
        };

        // Função para fechar qualquer modal que esteja aberto
        const closeModal = () => {
            if (privacyModal && privacyModal.classList.contains('show')) {
                privacyModal.classList.remove('show');
            }
            if (termsModal && termsModal.classList.contains('show')) {
                termsModal.classList.remove('show');
            }
        };

        // Se os botões não existirem (ex.: movidos para páginas dedicadas), apenas não faz nada
        if (openPrivacyBtn && privacyModal) {
            openPrivacyBtn.addEventListener('click', (event) => {
                event.preventDefault();
                openModal(privacyModal);
            });
        }

        if (openTermsBtn && termsModal) {
            openTermsBtn.addEventListener('click', (event) => {
                event.preventDefault();
                openModal(termsModal);
            });
        }

        // Adiciona o evento de clique para todos os botões de fechar
        if (closeButtons && (privacyModal || termsModal)) {
            closeButtons.forEach(button => {
                button.addEventListener('click', closeModal);
            });
        }

        // Fecha o modal se o utilizador clicar fora da caixa de conteúdo
        if (privacyModal || termsModal) {
            window.addEventListener('click', (event) => {
                if (event.target === privacyModal || event.target === termsModal) {
                    closeModal();
                }
            });
        }

    } catch (error) {
        console.error('Erro ao configurar os modais:', error);
    }
}

// --- Inicialização da Aplicação ---
function initializeApp() {
    try {
        const elements = {
            todayCounter: document.getElementById('todayCounter'),
            totalCounter: document.getElementById('totalCounter'),
            passwordDisplay: document.getElementById('passwordDisplay'),
            lengthSlider: document.getElementById('lengthSlider'),
            lengthValue: document.getElementById('lengthValue'),
            optionsCheckboxes: {
                includeUppercase: document.getElementById('includeUppercase'),
                includeLowercase: document.getElementById('includeLowercase'),
                includeNumbers: document.getElementById('includeNumbers'),
                includeSymbols: document.getElementById('includeSymbols'),
                excludeAmbiguous: document.getElementById('excludeAmbiguous'),
            },
            generateButton: document.getElementById('generateButton'),
            copyButton: document.getElementById('copyButton'),
            strengthBar: document.getElementById('strengthBar'),
            strengthText: document.getElementById('strengthText'),
        };

        const charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            ambiguous: 'Il1O0'
        };

        // Verifica se todos os elementos essenciais existem
        const essentialElements = [
            'passwordDisplay', 'lengthSlider', 'lengthValue', 'generateButton', 
            'copyButton', 'strengthBar', 'strengthText'
        ];
        
        for (const elementName of essentialElements) {
            if (!elements[elementName]) {
                throw new Error(`Elemento essencial não encontrado: ${elementName}`);
            }
        }

        setupEventListeners(elements, charSets);
        setupHamburger();
        setupFAQ();
        setupModals();
        setupSocialSharing();
        updateCopyrightYear();
        getPasswordStats(elements);

        elements.passwordDisplay.value = 'Selecione as opções e clique em "Gerar Nova Senha"';
        updateStrengthIndicator('', elements);

    } catch (error) {
        console.error('Erro na inicialização do app:', error);
        showToast('Erro ao inicializar o aplicativo', true);
    }
}

// --- Ponto de Entrada ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    try {
        initializeApp();
    } catch (error) {
        console.error('Erro crítico na inicialização:', error);
        showToast('Ocorreu um erro ao carregar. Recarregue a página.', true);
    }
}