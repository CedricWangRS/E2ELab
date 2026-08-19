// E2ELab Service Worker
var CACHE_NAME = 'e2elab-v1-0-0';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/variables.css',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/js/crc.js',
  './assets/js/e2e-engine.js',
  './assets/js/pdu-designer.js',
  './assets/js/presets.js',
  './assets/js/store.js',
  './assets/js/app.js',
  './assets/js/main.js',
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(ASSETS); }));
});

self.addEventListener('fetch', function (e) {
  e.respondWith(caches.match(e.request).then(function (resp) {
    return resp || fetch(e.request);
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
  }));
});
