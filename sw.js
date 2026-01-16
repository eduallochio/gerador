// Service Worker para PWA - Gerador Guardião
const CACHE_NAME = 'gerador-guardiao-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/blog.css',
  '/css/ferramentas.css',
  '/js/script.js',
  '/js/theme-switcher.js',
  '/js/ferramentas.js',
  '/img/guardiao-icon.svg',
  '/manifest.json'
];

// Instala o Service Worker e faz cache dos arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignora requisições externas (CDN, Analytics, etc)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta é válida, clona e guarda no cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, busca do cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Se não encontrar no cache e for uma navegação, retorna a index
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
