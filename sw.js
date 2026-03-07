// 캐시 버전 (업데이트 시 숫자를 올리면 기기의 이전 캐시가 강제 초기화됩니다)
const CACHE_NAME = 'signature-app-v4';

// 오프라인에서도 앱이 열리도록 돕는 최소한의 핵심 파일들
const urlsToCache = [
  './',
  './Signature App.html',
  './Install.html', // 앱 설치 안내 페이지 추가
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// 1. 설치 (Install) - 새로운 서비스워커 대기 없이 즉시 적용
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching App Shell');
      return cache.addAll(urlsToCache).catch(err => console.warn('Cache error:', err));
    })
  );
});

// 2. 활성화 (Activate) - 이전 버전의 캐시 쓰레기 청소
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 네트워크 가로채기 (Fetch) - 스마트 하이브리드 캐시 전략
self.addEventListener('fetch', event => {
  const reqUrl = event.request.url;

  // [전략 A] 외부 API 통신: 캐시 절대 금지 (무조건 네트워크 직행)
  if (reqUrl.includes('script.google.com') || 
      reqUrl.includes('googleusercontent.com') || 
      reqUrl.includes('api.telegram.org') || 
      reqUrl.includes('kakaoapi')) {
    return event.respondWith(fetch(event.request));
  }

  // [전략 B] 메인 HTML 파일: Network-First (항상 최신 코드 유지)
  // 인터넷이 연결되어 있으면 새 코드를 받고, 오프라인일 때만 폰에 저장된 화면을 보여줍니다.
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // 인터넷이 끊겼을 때 캐시된 HTML 반환
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || caches.match('./Signature App.html'); 
          });
        })
    );
    return;
  }

  // [전략 C] 이미지, 아이콘 등 정적 리소스: Stale-while-revalidate
  // 일단 빠른 로딩을 위해 폰에 저장된 캐시를 먼저 보여주고, 백그라운드에서 몰래 새 파일로 교체해 둡니다.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(err => {
        console.warn('[ServiceWorker] Fetch failed, keeping offline mode', err);
      });

      return cachedResponse || fetchPromise;
    })
  );
});
