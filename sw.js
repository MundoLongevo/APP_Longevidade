const CACHE_NAME = "fq5c-cache-v8";
const CACHE = "fq5c-cache-v1";
const ASSETS = [
  "lib/jspdf.umd.min.js","./","./index.html","./styles.css","./app.js","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e)=>{
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE).then(cache=>cache.put(e.request, copy));
      return resp;
    }).catch(()=>cached))
  );
});
