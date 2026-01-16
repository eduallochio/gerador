# 🖼️ Guia de Otimização de Imagens

## Imagens Atuais do Projeto

1. `guardiao-icon.svg` - Ícone do site (SVG, já otimizado ✅)
2. `imagem-senha.png` - Imagem Open Graph/Social

## 🎯 Tarefas de Otimização Recomendadas

### 1. Converter PNG para WebP

#### Opção A: Usando ferramentas online
- [Squoosh](https://squoosh.app/) - Google
- [TinyPNG](https://tinypng.com/)
- [Optimizilla](https://imagecompressor.com/)

#### Opção B: Linha de comando (melhor para automação)

**Instalar cwebp:**
```bash
# Windows (via Chocolatey)
choco install webp

# macOS
brew install webp

# Linux (Ubuntu/Debian)
sudo apt-get install webp
```

**Converter imagem:**
```bash
# Qualidade 80 (bom equilíbrio)
cwebp -q 80 img/imagem-senha.png -o img/imagem-senha.webp

# Qualidade 90 (melhor qualidade)
cwebp -q 90 img/imagem-senha.png -o img/imagem-senha.webp
```

### 2. Adicionar Dimensões às Imagens

No HTML, sempre especifique width e height para evitar CLS (Cumulative Layout Shift):

```html
<!-- ANTES ❌ -->
<img src="img/imagem-senha.png" alt="Senha Segura">

<!-- DEPOIS ✅ -->
<img src="img/imagem-senha.png" 
     alt="Senha Segura" 
     width="1200" 
     height="630"
     loading="lazy">
```

### 3. Usar Picture Element com Fallback

Melhor suporte para navegadores modernos e antigos:

```html
<picture>
  <!-- WebP para navegadores modernos -->
  <source srcset="img/imagem-senha.webp" type="image/webp">
  
  <!-- PNG como fallback -->
  <img src="img/imagem-senha.png" 
       alt="Senha Segura"
       width="1200"
       height="630"
       loading="lazy">
</picture>
```

### 4. Responsive Images (srcset)

Para diferentes tamanhos de tela:

```html
<picture>
  <!-- WebP responsivo -->
  <source 
    type="image/webp"
    srcset="img/imagem-senha-sm.webp 400w,
            img/imagem-senha-md.webp 800w,
            img/imagem-senha-lg.webp 1200w"
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px">
  
  <!-- PNG responsivo como fallback -->
  <img 
    src="img/imagem-senha.png"
    srcset="img/imagem-senha-sm.png 400w,
            img/imagem-senha-md.png 800w,
            img/imagem-senha-lg.png 1200w"
    sizes="(max-width: 600px) 400px,
           (max-width: 1200px) 800px,
           1200px"
    alt="Senha Segura"
    width="1200"
    height="630"
    loading="lazy">
</picture>
```

## 📊 Tamanhos Recomendados

### Open Graph / Social Media
- **Facebook/LinkedIn**: 1200x630px
- **Twitter**: 1200x675px
- **Instagram**: 1080x1080px

### Performance
- **Hero Images**: max 200KB
- **Ícones**: usar SVG quando possível
- **Fotos**: WebP com qualidade 80-85

## 🔧 Script de Automação

Crie um arquivo `optimize-images.sh`:

```bash
#!/bin/bash

# Diretório das imagens
IMG_DIR="img"

# Criar versões WebP de todos os PNG e JPG
for img in $IMG_DIR/*.{png,jpg,jpeg}; do
    if [ -f "$img" ]; then
        filename="${img%.*}"
        echo "Convertendo $img..."
        cwebp -q 85 "$img" -o "${filename}.webp"
    fi
done

echo "✅ Conversão concluída!"
```

**Tornar executável e rodar:**
```bash
chmod +x optimize-images.sh
./optimize-images.sh
```

## ✅ Checklist de Otimização

- [ ] Converter PNG/JPG para WebP
- [ ] Comprimir imagens originais (TinyPNG)
- [ ] Adicionar width/height em todas as tags img
- [ ] Implementar lazy loading (loading="lazy")
- [ ] Usar picture element com fallback
- [ ] Criar versões responsivas (srcset)
- [ ] Otimizar SVGs (SVGO)
- [ ] Atualizar meta tags Open Graph com imagens otimizadas
- [ ] Testar em diferentes dispositivos
- [ ] Validar com Lighthouse

## 🎨 Otimizando SVGs

Para o `guardiao-icon.svg`:

```bash
# Instalar SVGO
npm install -g svgo

# Otimizar
svgo guardiao-icon.svg -o guardiao-icon-optimized.svg
```

## 📈 Resultados Esperados

Após otimização:
- **Redução de 60-80%** no tamanho dos arquivos
- **LCP melhorado** em 1-2 segundos
- **Score Lighthouse**: +10-20 pontos em Performance
- **Economia de banda**: significativa para usuários móveis

## 🔗 Recursos Úteis

- [Web.dev - Image Optimization](https://web.dev/fast/#optimize-your-images)
- [ImageOptim](https://imageoptim.com/) - App para Mac
- [Squoosh](https://squoosh.app/) - Online
- [cwebp Documentation](https://developers.google.com/speed/webp/docs/cwebp)

---

**Última atualização**: 16/01/2026
