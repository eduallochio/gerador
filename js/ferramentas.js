document.addEventListener('DOMContentLoaded', () => {
    const isValidUrl = (url) => {
        try { new URL(url); return true; } catch { return false; }
    };

    // Atualiza o ano no rodapé
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Exibe toast de feedback (usa o div #toastNotification da página)
    function showToast(message, isError = false) {
        const toast = document.getElementById('toastNotification');
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'toast' + (isError ? ' error' : '');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // Renderiza resultado de URL de forma segura (sem innerHTML com dados externos)
    function renderUrlResult(container, label, url, displayText) {
        container.textContent = '';
        const strong = document.createElement('strong');
        strong.textContent = label + ' ';
        const link = document.createElement('a');
        link.href = url;
        link.textContent = displayText;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        container.appendChild(strong);
        container.appendChild(link);
        container.style.display = 'block';
    }

    // --- Encurtador de URL ---
    const shortenUrlBtn = document.getElementById('shortenUrlBtn');
    const longUrlInput = document.getElementById('longUrl');
    const customAliasInput = document.getElementById('customAlias');
    const shortUrlResult = document.getElementById('shortUrlResult');

    if (shortenUrlBtn && longUrlInput && customAliasInput && shortUrlResult) {
        shortenUrlBtn.addEventListener('click', async () => {
            const longUrl = longUrlInput.value.trim();
            const customAlias = customAliasInput.value.trim();
            if (!longUrl || !isValidUrl(longUrl)) {
                showToast('Por favor, insira uma URL válida.', true);
                return;
            }
            try {
                let apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`;
                if (customAlias) {
                    apiUrl += `&shorturl=${encodeURIComponent(customAlias)}`;
                }
                let response = await fetch(apiUrl);
                let data = await response.json();
                if (data.shorturl) {
                    const shortUrl = data.shorturl;
                    const shortCode = shortUrl.split('/').pop();
                    renderUrlResult(shortUrlResult, 'URL Personalizada:', shortUrl, `gg/${shortCode}`);
                } else if (data.errorcode) {
                    // Tenta fallback no TinyURL
                    const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
                    const tinyText = await tinyRes.text();
                    if (tinyRes.ok && tinyText.startsWith('http')) {
                        renderUrlResult(shortUrlResult, 'URL Curta:', tinyText, tinyText);
                    } else {
                        throw new Error(data.errormessage || 'Não foi possível encurtar a URL.');
                    }
                } else {
                    // Tenta fallback no TinyURL
                    const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
                    const tinyText = await tinyRes.text();
                    if (tinyRes.ok && tinyText.startsWith('http')) {
                        renderUrlResult(shortUrlResult, 'URL Curta:', tinyText, tinyText);
                    } else {
                        throw new Error('Ocorreu um erro desconhecido.');
                    }
                }
            } catch (error) {
                console.error('Erro ao encurtar URL:', error);
                let userErrorMessage = 'Erro ao encurtar a URL. Tente novamente.';
                if (error.message && error.message.includes('already exists')) {
                    userErrorMessage = 'Este alias personalizado já está em uso. Escolha outro.';
                } else if (error.message) {
                    userErrorMessage = error.message;
                }
                shortUrlResult.textContent = userErrorMessage;
                shortUrlResult.style.display = 'block';
            }
        });
    }

    // --- Gerador de Link para WhatsApp ---
    const generateWaLinkBtn = document.getElementById('generateWaLinkBtn');
    const whatsappNumberInput = document.getElementById('whatsappNumber');
    const whatsappMessageInput = document.getElementById('whatsappMessage');
    const waLinkResult = document.getElementById('waLinkResult');

    if (generateWaLinkBtn && whatsappNumberInput && whatsappMessageInput && waLinkResult) {
        generateWaLinkBtn.addEventListener('click', () => {
            const number = whatsappNumberInput.value.replace(/\D/g, '');
            const message = encodeURIComponent(whatsappMessageInput.value);
            if (!number) {
                showToast('Por favor, insira um número de WhatsApp.', true);
                return;
            }
            const waLink = `https://wa.me/${number}?text=${message}`;
            renderUrlResult(waLinkResult, 'Link Gerado:', waLink, waLink);
        });
    }

    // --- Gerador de QR Code ---
    const generateQrBtn = document.getElementById('generateQrBtn');
    const downloadQrBtn = document.getElementById('downloadQrBtn');
    const qrTextInput = document.getElementById('qrText');
    const qrColorInput = document.getElementById('qrColor');
    const qrBgColorInput = document.getElementById('qrBgColor');
    const qrDotStyleInput = document.getElementById('qrDotStyle');
    const qrLogoInput = document.getElementById('qrLogo');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    const qrFileNameInput = document.getElementById('qrFileName');
    const qrcodeContainer = document.getElementById('qrcode');
    const qrDownloadSection = document.getElementById('qrDownloadSection');

    let qrCodeInstance = null;
    let logoUrl = null;

    const renderQRCode = () => {
        if (!qrTextInput || !qrcodeContainer || !qrDownloadSection) return;
        const text = qrTextInput.value;
        if (!text) {
            if (qrCodeInstance) {
                qrcodeContainer.innerHTML = '';
                qrcodeContainer.style.display = 'none';
                qrDownloadSection.style.display = 'none';
                qrCodeInstance = null;
            }
            return;
        }

        const options = {
            width: 256,
            height: 256,
            data: text,
            margin: 10,
            dotsOptions: { color: qrColorInput.value, type: qrDotStyleInput.value },
            backgroundOptions: { color: qrBgColorInput.value },
            image: logoUrl,
            imageOptions: { crossOrigin: 'anonymous', margin: 5, imageSize: 0.3 }
        };

        if (qrCodeInstance) {
            qrCodeInstance.update(options);
        } else if (typeof QRCodeStyling !== 'undefined') {
            qrCodeInstance = new QRCodeStyling(options);
            qrcodeContainer.innerHTML = '';
            qrCodeInstance.append(qrcodeContainer);
        }

        qrcodeContainer.style.display = 'flex';
        qrDownloadSection.style.display = 'block';
    };

    if (generateQrBtn) {
        generateQrBtn.addEventListener('click', () => {
            if (!qrTextInput.value) {
                alert('Por favor, digite um texto ou URL para gerar o QR Code.');
                return;
            }
            renderQRCode();
        });
    }

    if (qrColorInput) qrColorInput.addEventListener('input', renderQRCode);
    if (qrBgColorInput) qrBgColorInput.addEventListener('input', renderQRCode);
    if (qrDotStyleInput) qrDotStyleInput.addEventListener('change', renderQRCode);

    if (qrLogoInput && removeLogoBtn) {
        qrLogoInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                logoUrl = URL.createObjectURL(file);
                removeLogoBtn.style.display = 'flex';
                renderQRCode();
            }
        });

        removeLogoBtn.addEventListener('click', () => {
            logoUrl = null;
            qrLogoInput.value = '';
            removeLogoBtn.style.display = 'none';
            renderQRCode();
        });
    }

    if (downloadQrBtn) {
        downloadQrBtn.addEventListener('click', () => {
            if (qrCodeInstance) {
                const fileName = (qrFileNameInput && qrFileNameInput.value) || 'qrcode';
                qrCodeInstance.download({ name: fileName, extension: 'png' });
            }
        });
    }
});