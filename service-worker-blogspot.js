// CineStream Service Worker - Versão Blogspot Otimizada
const CACHE_NAME = 'cinestream-blogspot-v1.1.0';
const OFFLINE_CACHE = 'cinestream-offline-v1.0.0';

// URLs do seu Blogspot para cache (substituir por seu domínio real)
const BLOGSPOT_URLS = [
  'https://testegeral12.blogspot.com/',
  'https://testegeral12.blogspot.com/?tab=movies', 
  'https://testegeral12.blogspot.com/?tab=series',
  'https://testegeral12.blogspot.com/?tab=channels'
];

// Detectar automaticamente o domínio do Blogspot
const BLOGSPOT_DOMAIN = self.location.origin.includes('github.io') ? 
  'https://testegeral12.blogspot.com' : self.location.origin;

// Recursos estáticos para cache
const STATIC_RESOURCES = [
  // CSS e JS do Video.js
  'https://vjs.zencdn.net/8.7.0/video-js.css',
  'https://vjs.zencdn.net/8.7.0/video.min.js',
  // Ícones PWA
  'https://seuusuario.github.io/cinestream-pwa/icons/icon-192x192.png',
  'https://seuusuario.github.io/cinestream-pwa/icons/icon-512x512.png',
  // Recursos adicionais do CineStream
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// APIs externas dos seus dados
const EXTERNAL_APIS = [
  'https://raw.githubusercontent.com/Diegocostasp/dddd/refs/heads/main/movies.json',
  'https://raw.githubusercontent.com/Diegocostasp/dddd/refs/heads/main/series.json', 
  'https://raw.githubusercontent.com/Diegocostasp/dddd/refs/heads/main/channels.json'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🚀 CineStream Service Worker (Blogspot): Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Fazendo cache dos recursos estáticos...');
      // Cache apenas recursos estáticos, não o Blogspot (ele tem suas próprias regras)
      return cache.addAll(STATIC_RESOURCES);
    }).then(() => {
      console.log('✅ Service Worker instalado com sucesso!');
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Erro ao instalar Service Worker:', error);
    })
  );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
  console.log('🔄 CineStream Service Worker (Blogspot): Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ativado!');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições de extensões
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  // Estratégia especializada para Blogspot
  if (url.hostname.includes('blogspot.com') || 
      url.hostname.includes('blogger.com') ||
      url.hostname.includes('googleusercontent.com') ||
      url.hostname.includes('bp.blogspot.com')) {
    
    // Para o Blogspot, estratégia híbrida
    if (BLOGSPOT_URLS.some(blogUrl => request.url.includes(blogUrl.split('?')[0])) ||
        request.url === BLOGSPOT_DOMAIN || 
        request.url === BLOGSPOT_DOMAIN + '/') {
      
      event.respondWith(
        // Tentar buscar online primeiro
        fetch(request, { 
          cache: 'reload',
          mode: 'cors',
          credentials: 'include'
        }).then(response => {
          // Cache apenas se for sucesso
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Se offline, tentar usar cache
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Página offline melhorada
            return new Response(`
              <!DOCTYPE html>
              <html lang="pt-BR">
              <head>
                <title>CineStream - Offline</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="icon" href="https://seuusuario.github.io/cinestream-pwa/icons/icon-32x32.png">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { 
                    font-family: 'Poppins', Arial, sans-serif; 
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                  }
                  .offline-container {
                    text-align: center;
                    max-width: 500px;
                    padding: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    animation: fadeIn 0.5s ease-in;
                  }
                  .logo { font-size: 4em; margin-bottom: 20px; }
                  .title { font-size: 2.5em; margin-bottom: 10px; font-weight: 600; }
                  .subtitle { font-size: 1.5em; color: #ff6b6b; margin-bottom: 20px; }
                  .message { font-size: 1.1em; margin-bottom: 30px; opacity: 0.9; }
                  .retry-btn {
                    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 50px;
                    font-size: 1.1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                  }
                  .retry-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
                  }
                  .status { margin-top: 20px; font-size: 0.9em; opacity: 0.7; }
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  @media (max-width: 480px) {
                    .offline-container { padding: 20px; margin: 20px; }
                    .title { font-size: 2em; }
                    .subtitle { font-size: 1.2em; }
                  }
                </style>
              </head>
              <body>
                <div class="offline-container">
                  <div class="logo">🎬</div>
                  <h1 class="title">CineStream</h1>
                  <h2 class="subtitle">📡 Você está offline</h2>
                  <p class="message">
                    Conecte-se à internet para acessar filmes, séries e TV online.
                  </p>
                  <button class="retry-btn" onclick="window.location.reload()">
                    🔄 Tentar Novamente
                  </button>
                  <div class="status">
                    <small>Cache offline ativo • Service Worker funcionando</small>
                  </div>
                </div>
                <script>
                  // Auto-reload quando voltar online
                  window.addEventListener('online', () => {
                    setTimeout(() => window.location.reload(), 1000);
                  });
                  
                  // Verificar conexão periodicamente
                  setInterval(() => {
                    if (navigator.onLine) {
                      fetch('${BLOGSPOT_DOMAIN}', { mode: 'no-cors' })
                        .then(() => window.location.reload())
                        .catch(() => {});
                    }
                  }, 5000);
                </script>
              </body>
              </html>
            `, {
              headers: { 
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              }
            });
          });
        })
      );
    }
    return;
  }
  
  // Cache First para recursos estáticos (Video.js, ícones, etc)
  if (STATIC_RESOURCES.some(resource => request.url.includes(resource))) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          console.log('📦 Servindo do cache:', request.url);
          return response;
        }
        
        console.log('🌐 Buscando online:', request.url);
        return fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      }).catch(() => {
        console.log('❌ Falha ao carregar:', request.url);
        return new Response('Recurso não disponível offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }
  
  // Network First para APIs externas (seus JSONs do GitHub)
  if (EXTERNAL_APIS.some(api => request.url.includes(api))) {
    event.respondWith(
      fetch(request, {
        cache: 'no-cache'
      }).then(response => {
        console.log('🌐 Dados atualizados da API:', request.url);
        
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      }).catch(() => {
        console.log('📦 Usando cache offline para API:', request.url);
        
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Dados padrão se não há cache
          if (request.url.includes('movies.json')) {
            return new Response(JSON.stringify({
              movies: [{
                id: 1,
                title: "Conteúdo offline",
                description: "Conecte-se à internet para ver mais filmes",
                type: "movie",
                featured: true
              }]
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          return new Response('{}', {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }
  
  // Para todas as outras requisições, estratégia padrão
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Sincronização em background melhorada
self.addEventListener('sync', event => {
  console.log('🔄 Sincronização em background:', event.tag);
  
  if (event.tag === 'background-sync' || event.tag === 'cinestream-sync') {
    event.waitUntil(
      Promise.all([
        // Sincronizar APIs externas
        ...EXTERNAL_APIS.map(url => 
          fetch(url, { 
            cache: 'no-cache',
            mode: 'cors'
          }).then(response => {
            if (response.ok) {
              return caches.open(CACHE_NAME).then(cache => {
                return cache.put(url, response);
              });
            }
          }).catch(err => {
            console.log('⚠️ Erro na sincronização da API:', err);
          })
        ),
        // Sincronizar página principal do Blogspot
        fetch(BLOGSPOT_DOMAIN, {
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include'
        }).then(response => {
          if (response.ok) {
            return caches.open(CACHE_NAME).then(cache => {
              return cache.put(BLOGSPOT_DOMAIN, response);
            });
          }
        }).catch(err => {
          console.log('⚠️ Erro na sincronização do Blogspot:', err);
        })
      ])
    );
  }
});

// Notificações push
self.addEventListener('push', event => {
  console.log('🔔 Notificação push recebida:', event.data);
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Novos conteúdos disponíveis no CineStream!',
      icon: 'https://seuusuario.github.io/cinestream-pwa/icons/icon-192x192.png',
      badge: 'https://seuusuario.github.io/cinestream-pwa/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: 'cinestream-update',
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'Abrir CineStream',
          icon: 'https://seuusuario.github.io/cinestream-pwa/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ],
      data: {
        url: 'https://testegeral12.blogspot.com'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'CineStream', options)
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
  console.log('🔔 Clique na notificação:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clients => {
        // Se já há uma aba do Blogspot aberta, focar nela
        for (let client of clients) {
          if (client.url.includes('blogspot.com') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Senão, abrir nova aba no Blogspot
        if (clients.openWindow) {
          return clients.openWindow('https://testegeral12.blogspot.com');
        }
      })
    );
  }
});

console.log('🎬 CineStream Service Worker (Blogspot) carregado e pronto!');
