// PWA 앱 설치 조건을 만족시키기 위한 필수 서비스 워커 파일입니다.
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // 오프라인 상태 처리 등을 할 수 있지만, 
  // 여기서는 단순히 설치(Install) 허들을 넘기기 위해 비워둡니다.
});

// ★ 원시그널 푸시 알림 수신기 통합 (가장 하단에 추가)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
