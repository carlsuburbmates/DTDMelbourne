/**
 * Service Worker for offline support
 * Caches API responses, provides background sync when online
 */

const CACHE_NAME = 'dogtrainers-cache-v1';
const API_CACHE_NAME = 'api-cache-v1';
const IMAGE_CACHE_NAME = 'image-cache-v1';

const CACHE_URLS = [
  '/',
  '/about',
  '/contact',
  '/faq',
  '/login',
  '/register',
  '/search',
];

const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
} as const;

type CacheStrategy = typeof CACHE_STRATEGIES[keyof typeof CACHE_STRATEGIES];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS);
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => 
            name !== CACHE_NAME && 
            name !== API_CACHE_NAME && 
            name !== IMAGE_CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );
    })
  );
});

/**
 * Fetch event - handle requests with caching strategies
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request, url);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      event.respondWith(cacheFirst(request));
      break;
    case CACHE_STRATEGIES.NETWORK_FIRST:
      event.respondWith(networkFirst(request));
      break;
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      event.respondWith(staleWhileRevalidate(request));
      break;
    case CACHE_STRATEGIES.NETWORK_ONLY:
      event.respondWith(networkOnly(request));
      break;
    case CACHE_STRATEGIES.CACHE_ONLY:
      event.respondWith(cacheOnly(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

/**
 * Determine cache strategy based on request type
 */
function getCacheStrategy(request: Request, url: URL): CacheStrategy {
  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Images - cache first
  if (request.destination === 'image') {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // Static assets - cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2)$/)) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // HTML pages - stale while revalidate
  if (request.destination === 'document') {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  // Default - network first
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

/**
 * Cache first strategy
 */
async function cacheFirst(request: Request): Promise<Response> {
  const cacheName = request.destination === 'image' ? IMAGE_CACHE_NAME : CACHE_NAME;
  
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Cache first error:', error);
    throw error;
  }
}

/**
 * Network first strategy
 */
async function networkFirst(request: Request): Promise<Response> {
  const cacheName = request.destination === 'image' ? IMAGE_CACHE_NAME : 
                   url.pathname.startsWith('/api/') ? API_CACHE_NAME : CACHE_NAME;
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Network first error, falling back to cache:', error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

/**
 * Network only strategy
 */
async function networkOnly(request: Request): Promise<Response> {
  return fetch(request);
}

/**
 * Cache only strategy
 */
async function cacheOnly(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  throw new Error('No match in cache');
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event: ExtendableEvent) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

/**
 * Sync analytics events when online
 */
async function syncAnalytics(): Promise<void> {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const analyticsRequests = await cache.matchAll('/api/v1/analytics/events');
    
    for (const request of analyticsRequests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync analytics event:', error);
      }
    }
  } catch (error) {
    console.error('Analytics sync error:', error);
  }
}

/**
 * Sync bookings when online
 */
async function syncBookings(): Promise<void> {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const bookingRequests = await cache.matchAll('/api/v1/bookings');
    
    for (const request of bookingRequests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.error('Failed to sync booking:', error);
      }
    }
  } catch (error) {
    console.error('Bookings sync error:', error);
  }
}

/**
 * Message event - handle messages from client
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

/**
 * Push notification event
 */
self.addEventListener('push', (event: PushEvent) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration?.showNotification('Dog Trainers Directory', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

/**
 * Cache management - cleanup old entries
 */
async function cleanupCache(): Promise<void> {
  try {
    const cacheNames = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Remove entries older than 7 days
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const cacheDate = new Date(dateHeader).getTime();
            if (now - cacheDate > maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

// Run cache cleanup periodically
setInterval(cleanupCache, 24 * 60 * 60 * 1000); // Every 24 hours

// Export types for TypeScript
declare global {
  interface ServiceWorkerGlobalScope {
    skipWaiting(): void;
  }
  
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }
  
  interface FetchEvent extends Event {
    request: Request;
    respondWith(response: Response | Promise<Response>): void;
  }
  
  interface PushEvent extends ExtendableEvent {
    data?: PushMessageData;
    waitUntil(promise: Promise<any>): void;
  }
  
  interface NotificationEvent extends Event {
    notification: Notification;
    waitUntil(promise: Promise<any>): void;
  }
  
  interface ExtendableMessageEvent extends ExtendableEvent {
    data: any;
    waitUntil(promise: Promise<any>): void;
  }
}
