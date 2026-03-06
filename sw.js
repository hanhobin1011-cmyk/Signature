// 1. 좀비 서비스워커 강제 교체 로직
self.addEventListener('install', (e) => {
  self.skipWaiting(); // 대기 중인 예전 워커를 즉시 죽이고 새 워커로 교체
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim()); // 교체 즉시 모든 페이지에 통제권 확보
});

// 2. PWA 설치 조건을 만족시키기 위한 더미 fetch
self.addEventListener('fetch', (e) => {
  // 비워둡니다.
});

// 3. 원시그널 웹푸시 수신기
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
