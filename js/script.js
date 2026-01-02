// Configuração global do Supabase
let supabaseClient = null;
let supabaseInitialized = false;

// Função para validar URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

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

// Função para inicializar o Supabase com validação robusta
async function initializeSupabase() {
    try {
        // Verifica se o Supabase foi carregado
        if (typeof window.supabase === 'undefined') {
            throw new Error('Biblioteca Supabase não carregada');
        }

        const supabaseConfig = {
            url: 'https://ozijuhsgcujnqhhpfise.supabase.co', // URL do seu projeto Supabase
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96aWp1aHNnY3VqbnFoaHBmaXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTMwNjgsImV4cCI6MjA2OTAyOTA2OH0.b9IKmeWAZnuHbVhEqL5BEw2d1n2EYxC9nnhzYwmWm9I' // Chave 'anon' do seu projeto
        };

        if (!supabaseConfig.url || !supabaseConfig.key) {
            throw new Error('Credenciais do Supabase não fornecidas');
        }

        if (!isValidUrl(supabaseConfig.url)) {
            throw new Error('URL do Supabase inválida');
        }

        const cleanUrl = supabaseConfig.url.endsWith('/') 
            ? supabaseConfig.url.slice(0, -1) 
            : supabaseConfig.url;

        supabaseClient = window.supabase.createClient(cleanUrl, supabaseConfig.key, {
            db: { schema: 'public' },
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const { error: testError } = await supabaseClient
            .from('password_stats')
            .select('id')
            .limit(1);

        if (testError && testError.code !== 'PGRST116') { // PGRST116 = tabela vazia, o que é aceitável
            throw testError;
        }

        supabaseInitialized = true;
        console.log('Supabase inicializado com sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao inicializar Supabase:', error);
        supabaseInitialized = false;
        // Não mostra toast de erro aqui - apenas log silencioso
        return false;
    }
}


// --- Funções de Geração de Senha ---
function generatePassword(elements, charSets) {
    try {
        let charSet = '';
        if (elements.optionsCheckboxes.includeUppercase.checked) charSet += charSets.uppercase;
        if (elements.optionsCheckboxes.includeLowercase.checked) charSet += charSets.lowercase;
        if (elements.optionsCheckboxes.includeNumbers.checked) charSet += charSets.numbers;
        if (elements.optionsCheckboxes.includeSymbols.checked) charSet += charSets.symbols;

        if (elements.optionsCheckboxes.excludeAmbiguous.checked) {
            charSet = charSet.split('').filter(char => !charSets.ambiguous.includes(char)).join('');
        }
        
        if (charSet === '') {
            elements.passwordDisplay.value = 'Selecione uma opção!';
            updateStrengthIndicator('', elements);
            return;
        }

        let password = '';
        const length = parseInt(elements.lengthSlider.value);
        
        if (window.crypto && window.crypto.getRandomValues) {
            const randomValues = new Uint32Array(length);
            window.crypto.getRandomValues(randomValues);
            for (let i = 0; i < length; i++) {
                password += charSet[randomValues[i] % charSet.length];
            }
        } else { // Fallback para navegadores antigos
            for (let i = 0; i < length; i++) {
                password += charSet[Math.floor(Math.random() * charSet.length)];
            }
        }

        elements.passwordDisplay.value = password;
        updateStrengthIndicator(password, elements);
    } catch (error) {
        console.error('Erro ao gerar senha:', error);
        elements.passwordDisplay.value = 'Erro ao gerar senha';
        updateStrengthIndicator('', elements);
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

// Garante que o registro de estatísticas exista no Supabase
async function ensureStatsRecord() {
    if (!supabaseInitialized) return null;
    
    try {
        let { data, error } = await supabaseClient
            .from('password_stats')
            .select('id')
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error; // Ignora erro de "nenhuma linha", que é esperado
        
        if (!data) { // Se não há registro, cria um
            console.log("Nenhum registro encontrado. Criando um novo...");
            const { data: newData, error: createError } = await supabaseClient
                .from('password_stats')
                .insert([{ total_count: 0, today_count: 0, last_updated: new Date().toISOString() }])
                .select('id')
                .single();
            
            if (createError) throw createError;
            return newData;
        }
        
        return data;
    } catch (error) {
        console.error('Erro ao garantir registro de estatísticas:', error);
        return null;
    }
}

// Obtém e sincroniza as estatísticas
async function getPasswordStats(elements) {
    const today = new Date().toDateString();
    let stats = { total: 0, today: 0, lastDate: today };

    try {
        const localStats = JSON.parse(localStorage.getItem('passwordStats')) || stats;
        
        if (localStats.lastDate !== today) {
            localStats.today = 0;
            localStats.lastDate = today;
        }
        stats = localStats;

        if (supabaseInitialized) {
            const record = await ensureStatsRecord();
            if (record && record.id) {
                const { data: serverStats, error } = await supabaseClient
                    .from('password_stats')
                    .select('*')
                    .eq('id', record.id)
                    .single();

                if (error) throw error;
                
                const serverDate = new Date(serverStats.last_updated).toDateString();
                
                if (serverDate !== today) {
                    const { error: updateError } = await supabaseClient
                        .from('password_stats')
                        .update({ today_count: 0, last_updated: new Date().toISOString() })
                        .eq('id', record.id);
                    
                    if (updateError) throw updateError;
                    stats.today = 0;
                } else {
                    stats.today = serverStats.today_count;
                }
                stats.total = serverStats.total_count;
            }
        }
    } catch (error) {
        console.error('Erro ao obter estatísticas do Supabase:', error);
    }
    
    localStorage.setItem('passwordStats', JSON.stringify(stats));
    updateCounterDisplays(stats, elements);
}

// LÓGICA CORRIGIDA para incrementar os contadores
async function incrementCounters(elements) {
    const today = new Date().toDateString();
    
    let localStats = JSON.parse(localStorage.getItem('passwordStats')) || {
        total: 0, today: 0, lastDate: today
    };

    if (localStats.lastDate !== today) {
        localStats.today = 0;
        localStats.lastDate = today;
    }

    localStats.today++;
    localStats.total++;
    localStorage.setItem('passwordStats', JSON.stringify(localStats));
    updateCounterDisplays(localStats, elements);

    if (!supabaseInitialized) return;

    try {
        const record = await ensureStatsRecord();
        if (record && record.id) {
            const { data: currentStats, error: fetchError } = await supabaseClient
                .from('password_stats')
                .select('total_count, today_count, last_updated')
                .eq('id', record.id)
                .single();

            if (fetchError) throw fetchError;

            const currentServerDate = new Date(currentStats.last_updated).toDateString();
            const newTodayCount = (currentServerDate === today) ? currentStats.today_count + 1 : 1;
            
            const { error: updateError } = await supabaseClient
                .from('password_stats')
                .update({
                    total_count: currentStats.total_count + 1,
                    today_count: newTodayCount,
                    last_updated: new Date().toISOString()
                })
                .eq('id', record.id);
            
            if (updateError) throw updateError;
        }
    } catch (error) {
        console.error('Erro ao incrementar contadores no Supabase:', error);
    }
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
            generatePassword(elements, charSets);
            incrementCounters(elements);
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
async function initializeApp() {
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
        setupFAQ();
        setupModals(); // CHAMADA DA NOVA FUNÇÃO
        setupSocialSharing();
        updateCopyrightYear();
        
        await getPasswordStats(elements);
        
        elements.passwordDisplay.value = 'Selecione as opções e clique em "Gerar Nova Senha"';
        updateStrengthIndicator('', elements);

    } catch (error) {
        console.error('Erro na inicialização do app:', error);
        showToast('Erro ao inicializar o aplicativo', true);
    }
}

// --- Ponto de Entrada ---
// Garante que todos os recursos estejam carregados antes de inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM já está pronto
    initApp();
}

async function initApp() {
    try {
        // Aguarda um pouco para garantir que scripts externos estejam prontos
        if (typeof window.supabase === 'undefined') {
            console.warn('Supabase ainda não carregado, tentando novamente...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await initializeSupabase();
        await initializeApp();
    } catch (error) {
        console.error('Erro crítico na inicialização:', error);
        showToast('Ocorreu um erro ao carregar. Recarregue a página.', true);
    }
}