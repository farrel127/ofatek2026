const CACHE_NAME = "ofatek-2026-v5";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/responsive.css",
  "./js/config.js",
  "./js/app.js",
  "./js/form.js",
  "./manifest.json",
  "./assets/logo-ofatek.png",
  "./assets/logo-univ.png",
  "./assets/logo-sema-ft.png"
];


// ============================================
// INSTALL
// ============================================

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});


// ============================================
// ACTIVATE
// ============================================

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});


// ============================================
// FETCH
// ============================================

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const request = event.request;

  // HTML:
  // Selalu coba mengambil versi terbaru dari server.
  // Kalau offline, baru gunakan cache.
  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone);
            });

          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => cached || caches.match("./index.html"));
        })
    );

    return;
  }


  // JavaScript dan CSS:
  // Network first agar perubahan Vercel cepat diterima.
  if (
    request.destination === "script" ||
    request.destination === "style"
  ) {

    event.respondWith(
      fetch(request)
        .then(response => {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone);
            });

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }


  // Asset lainnya:
  // Cache first untuk performa.
  event.respondWith(
    caches.match(request)
      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {

            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
              });

            return response;
          });

      })
  );

});
