// Service Worker RW 018 Iringmulyo - Offline Caching Engine & PWA
const CACHE_NAME = 'rw018-offline-v6';

// Derive scope base URL to support GitHub Pages subpaths (e.g. /repo-name/) and root domains
const scopeUrl = new URL(self.registration ? self.registration.scope : self.location.href);
const resolvePath = (relative) => new URL(relative, scopeUrl).pathname;

// Precache list injected by Workbox during build
const wbManifest = (self.__WB_MANIFEST || []).map((entry) => {
  const assetUrl = typeof entry === 'string' ? entry : entry.url;
  return resolvePath(assetUrl);
});

const STATIC_ASSETS = [
  resolvePath('./'),
  resolvePath('./index.html'),
  resolvePath('./manifest.json'),
  resolvePath('./logo-rw-018.jpg'),
  resolvePath('./logo-rw-018.png'),
  resolvePath('./pwa-192x192.png'),
  resolvePath('./pwa-512x512.png'),
  resolvePath('./pwa-maskable-512x512.png'),
  resolvePath('./apple-touch-icon.png'),
  resolvePath('./favicon.ico'),
  resolvePath('./peta-satelit-rw018.jpg')
];

const ALL_ASSETS_TO_CACHE = Array.from(new Set([...STATIC_ASSETS, ...wbManifest]));

// Install: Pre-cache static core assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ALL_ASSETS_TO_CACHE.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Pre-cache warning for ${asset}:`, err);
          })
        )
      );
    })
  );
});

// Activate: Clean up older caches & take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Menghapus cache versi lama:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Smart offline caching strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya tangani metode GET
  if (req.method !== 'GET') {
    return;
  }

  // Bypass Google APIs, Firebase Auth & Firestore live streams
  if (
    url.pathname.startsWith('/__') ||
    url.pathname.includes('auth') ||
    url.pathname.includes('cookie') ||
    url.pathname.includes('_gcp') ||
    url.search.includes('authuser') ||
    url.search.includes('code') ||
    url.search.includes('state') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  // 1. Navigation requests (membuka halaman / reload tab)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(resolvePath('./index.html'), clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback offline jika tidak ada koneksi internet
          const cachedIndex =
            (await caches.match(resolvePath('./index.html'))) ||
            (await caches.match('./index.html')) ||
            (await caches.match('/index.html'));
          if (cachedIndex) return cachedIndex;
          const cachedRoot =
            (await caches.match(resolvePath('./'))) ||
            (await caches.match('/'));
          if (cachedRoot) return cachedRoot;
          return new Response(
            `<!DOCTYPE html>
            <html lang="id">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Mode Offline - RW 018 Iringmulyo</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; color: #1e293b; }
                .card { max-width: 400px; margin: 0 auto; background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                h1 { color: #065f46; font-size: 20px; }
                p { font-size: 14px; line-height: 1.5; color: #64748b; }
                button { background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Mode Offline RW 018</h1>
                <p>Perangkat Anda sedang tidak terhubung ke internet. Data yang tersimpan di memori lokal tetap dapat diakses saat membuka kembali aplikasi.</p>
                <button onclick="window.location.reload()">Coba Muat Ulang</button>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html' }
            }
          );
        })
    );
    return;
  }

  // 2. Static Assets (Scripts JS, Styles CSS, Gambar, Fonts, JSON)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|json)$/) ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/@');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        // Ambil update dari network di latar belakang (Stale While Revalidate)
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, clone);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            // Jaringan gagal / offline - tidak masalah jika sudah ada di cache
            return null;
          });

        // Kembalikan versi cache jika sudah ada, atau tunggu network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Permintaan GET lainnya: Coba jaringan terlebih dahulu dengan cadangan cache
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});

// Support update channel & skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
