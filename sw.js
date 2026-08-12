/* 2026 소리축제 모니터링 — 오프라인 캐시
   앱 껍데기만 캐시한다. 기록과 녹음은 IndexedDB에 있으므로 여기서 다루지 않는다. */

const CACHE = 'sori-monitor-v5';   // 올릴 때마다 숫자를 올려야 폰에 새 파일이 내려간다
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // 업로드(POST)와 외부 요청은 절대 가로채지 않는다.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // 앱 파일: 캐시 우선 — 지하 공연장에서도 켜져야 한다.
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) {
        // 조용히 뒤에서 갱신
        fetch(req).then(r => {
          if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then(r => {
        if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
