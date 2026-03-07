const CACHE_NAME = 'signature-app-v3-stale';

// 최소한의 껍데기만 캐싱 (오프라인 지원용)
const urlsToCache = [
  './',
  './Signature App.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // 즉시 새 워커 활성화
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName); // 이전 버전 찌꺼기 삭제
        })
      );
    })
  );
  self.clients.claim();
});

// 전략: Stale-while-revalidate (일단 캐시를 보여주고, 뒤에서 몰래 네트워크로 갱신함)
self.addEventListener('fetch', event => {
  // 구글 스크립트 API 요청은 절대 캐시하지 않고 무조건 네트워크 통과
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // 네트워크에서 성공적으로 가져오면 캐시 업데이트
        if(networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
          // 오프라인일 때 처리 로직 (생략 가능)
      });

      // 캐시가 있으면 즉시 반환(빠른 로딩), 없으면 네트워크 응답 대기
      return cachedResponse || fetchPromise;
    })
  );
});
