const CACHE_NAME = "recipe-cache-v3";

const urlsToCache = [
  "/",
  "./index.html",
  "./styles.css",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",

  "./src/main.js",
  "./src/data/api.js",
  "./src/data/userStore.js",
  "./src/controllers/userController.js",
  "./src/ui/userManager.js",
  "./src/modules/i18n.js",

  "./localization/en.json",
  "./localization/no.json",

  "./tos.html",
  "./privacy.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

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
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request);
    })
  );
});