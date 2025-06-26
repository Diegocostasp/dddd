const CACHE_NAME = "cinestream-cache-v1";
const urlsToCache = [
  "https://testegeral12.blogspot.com/",
  "https://raw.githubusercontent.com/Diegocostasp/dddd/refs/heads/main/manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
  // adicione aqui JS/CSS externos se quiser cache offline real
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
