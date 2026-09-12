/* RW 018 production service worker. VitePWA injects the precache manifest at build time. */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache only same-origin static GET assets. Never cache Firebase/API responses.
registerRoute(
  ({ request, url }) => request.method === 'GET' && url.origin === self.location.origin &&
    ['style', 'script', 'image', 'font'].includes(request.destination),
  new CacheFirst({
    cacheName: 'rw018-static-v2',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 })]
  })
);
