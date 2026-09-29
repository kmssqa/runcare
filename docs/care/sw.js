// 최소 서비스워커: 정적 파일 캐시(네트워크 우선). 데이터 JSON 은 항상 네트워크 우선.
const C = 'nearby-care-v3';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon.svg']))); self.skipWaiting(); });
self.addEventListener('fetch', (e) => { if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
