const CACHE_NAME = 'abukhader-cache-v6';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './images/logooo.jpg'
];

// 1. التثبيت والتفعيل الفوري بدون انتظار إغلاق التطبيق
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. إزالة الكاش القديم واستلام التحكم فوراً
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. استراتيجية Network-First للمستندات والصفحة الرئيسية لضمان جلب التعديلات الجديدة دائماً
self.addEventListener('fetch', e => {
  const req = e.request;
  
  // التحقق مما إذا كان الطلب للصفحة الرئيسية أو لملف الكود
  if (req.mode === 'navigate' || req.url.includes('index.html') || req.url.includes('docs.google.com')) {
    e.respondWith(
      fetch(req)
        .then(networkRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => caches.match(req))
    );
  } else {
    // باقي الأصول (الصور والملفات الثابتة)
    e.respondWith(
      caches.match(req).then(cachedRes => {
        return cachedRes || fetch(req).then(networkRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, networkRes.clone());
            return networkRes;
          });
        });
      })
    );
  }
});
