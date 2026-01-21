// Minimal Service Worker to satisfy PWA installability criteria
const CACHE_NAME = 'beingreal-offline-v1';

self.addEventListener('install', (event) => {
    // Force this service worker to become the active service worker
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim any clients immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through fetch
    // We are NOT doing aggressive caching to avoid cache invalidation issues
    // This is primarily to satisfy the "Service Worker must be registered" requirement
    if (event.request.method !== 'GET') return;
});
