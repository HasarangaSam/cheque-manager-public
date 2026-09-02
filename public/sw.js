// ChequeManager PWA Service Worker
// Lightweight pass-through service worker to enable standalone PWA installability

const CACHE_NAME = "chequemanager-v1";

self.addEventListener("install", (event) => {
  // Activate immediately without waiting for old workers
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all pages under this scope immediately
  event.waitUntil(self.clients.claim());
});

// Network-first / pass-through fetch handler (no caching needed per specification)
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
