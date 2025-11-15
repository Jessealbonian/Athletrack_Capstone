const CACHE_NAME = 'athletrack-v1.0.0';
const STATIC_CACHE = 'athletrack-static-v1.0.0';
const DYNAMIC_CACHE = 'athletrack-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/Logo.png',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE = [
  '/api/routes.php',
  '/api/modules/',
  '/api/config/'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(handleDefaultRequest(request));
});

// Handle API requests with network-first strategy and aggressive caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = request.url;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone the response for caching
    const responseClone = networkResponse.clone();
    
    // Cache ALL successful responses (including errors that might be useful offline)
    if (networkResponse.status < 500) {
      const cache = await caches.open(DYNAMIC_CACHE);
      // Store with timestamp for freshness checking
      const cachedRequest = new Request(cacheKey, {
        method: request.method,
        headers: request.headers
      });
      await cache.put(cachedRequest, responseClone);
      
      // Also store in IndexedDB for more persistent storage
      try {
        const data = await networkResponse.clone().json();
        await storeInIndexedDB(cacheKey, data, Date.now());
      } catch (e) {
        // If not JSON, store as text
        const text = await networkResponse.clone().text();
        await storeInIndexedDB(cacheKey, text, Date.now());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Try IndexedDB as fallback
    try {
      const storedData = await getFromIndexedDB(cacheKey);
      if (storedData) {
        console.log('Serving from IndexedDB:', request.url);
        return new Response(JSON.stringify(storedData.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      console.log('IndexedDB fallback failed:', e);
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: 'You are offline. Showing cached data.',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// IndexedDB helper functions
async function storeInIndexedDB(key, data, timestamp) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AthleTrackDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('apiCache')) {
        // Create if doesn't exist
        const versionChange = db.version + 1;
        db.close();
        const upgradeRequest = indexedDB.open('AthleTrackDB', versionChange);
        upgradeRequest.onupgradeneeded = () => {
          const upgradeDb = upgradeRequest.result;
          upgradeDb.createObjectStore('apiCache', { keyPath: 'key' });
        };
        upgradeRequest.onsuccess = () => {
          const upgradeDb = upgradeRequest.result;
          const transaction = upgradeDb.transaction(['apiCache'], 'readwrite');
          const store = transaction.objectStore('apiCache');
          store.put({ key, data, timestamp });
          resolve();
        };
      } else {
        const transaction = db.transaction(['apiCache'], 'readwrite');
        const store = transaction.objectStore('apiCache');
        store.put({ key, data, timestamp });
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function getFromIndexedDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AthleTrackDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('apiCache')) {
        resolve(null);
        return;
      }
      const transaction = db.transaction(['apiCache'], 'readonly');
      const store = transaction.objectStore('apiCache');
      const getRequest = store.get(key);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const responseClone = networkResponse.clone();
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url);
    // Return a default response for images
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    throw error;
  }
}

// Handle navigation requests with network-first strategy
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const responseClone = networkResponse.clone();
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Navigation failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/index.html');
  }
}

// Handle default requests with network-first strategy
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const responseClone = networkResponse.clone();
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync' || event.tag === 'sync-pending-requests') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync - automatically sync when online
async function doBackgroundSync() {
  try {
    // Check if we're online
    if (!navigator.onLine) {
      console.log('Still offline, cannot sync');
      return;
    }

    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify clients to sync their pending requests
    clients.forEach(client => {
      client.postMessage({
        type: 'AUTO_SYNC',
        message: 'Automatic sync triggered'
      });
    });

    console.log('Background sync completed automatically');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Listen for online event to trigger automatic sync
self.addEventListener('online', () => {
  console.log('Service Worker detected online status - triggering sync');
  // Register a background sync
  if ('sync' in self.registration) {
    self.registration.sync.register('sync-pending-requests').catch(err => {
      console.log('Background sync registration failed:', err);
    });
  }
  
  // Also notify all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ONLINE',
        message: 'Connection restored - syncing data automatically'
      });
    });
  });
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from AthleTrack',
    icon: '/assets/Logo.png',
    badge: '/assets/Logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/assets/Logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/Logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AthleTrack', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle message events from main thread
self.addEventListener('message', event => {
  console.log('Message received in service worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
  