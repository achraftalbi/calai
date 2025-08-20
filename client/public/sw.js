const CACHE_NAME = 'calai-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap'
];

const DYNAMIC_CACHE_URLS = [
  '/api/',
  '/objects/'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle image requests with cache-first strategy
  if (url.pathname.startsWith('/objects/') || request.destination === 'image') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle navigation requests with network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(navigateHandler(request));
    return;
  }

  // Handle static resources with cache-first strategy
  event.respondWith(cacheFirst(request));
});

// Network-first strategy for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature requires an internet connection' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache-first strategy for static resources and images
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background for non-critical resources
    if (!request.url.includes('/objects/')) {
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, response));
          }
        })
        .catch(() => {}); // Ignore background update failures
    }
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline fallback for images
    if (request.destination === 'image') {
      return new Response(
        `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f1f5f9"/>
          <text x="100" y="100" text-anchor="middle" dy="0.35em" font-family="system-ui" font-size="14" fill="#64748b">
            Image unavailable offline
          </text>
        </svg>`,
        { 
          headers: { 'Content-Type': 'image/svg+xml' }
        }
      );
    }
    
    throw error;
  }
}

// Navigation handler with offline fallback
async function navigateHandler(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Return cached app shell for offline navigation
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CalAI - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: system-ui; 
              text-align: center; 
              padding: 2rem; 
              background: #f8fafc;
              color: #1e293b;
            }
            .offline-container {
              max-width: 400px;
              margin: 2rem auto;
              padding: 2rem;
              background: white;
              border-radius: 1rem;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            h1 { color: #6366f1; margin-bottom: 1rem; }
            p { margin-bottom: 1.5rem; color: #64748b; }
            button {
              background: linear-gradient(45deg, #6366f1, #10b981);
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="icon">📱</div>
            <h1>CalAI</h1>
            <p>You're currently offline. Some features may not be available.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for failed uploads (when online)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-food-scan') {
    event.waitUntil(syncFailedUploads());
  }
});

// Handle failed uploads when back online
async function syncFailedUploads() {
  // This would typically sync with IndexedDB stored failed uploads
  console.log('[SW] Syncing failed uploads...');
  
  // Implementation would retrieve failed uploads from IndexedDB
  // and attempt to upload them when connectivity is restored
}

// Push notification handler (for future pro features)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CalAI', {
      body: data.body || 'You have a new notification',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'calai-notification',
      requireInteraction: false,
      actions: data.actions || []
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service worker loaded successfully');
