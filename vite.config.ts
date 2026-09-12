import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // GitHub Pages project site: https://<owner>.github.io/rw018app/
  const base = process.env.VITE_BASE_PATH || '/rw018app/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        injectManifest: { maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 },
        includeAssets: [
          'favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png',
          'pwa-maskable-512x512.png', 'logo-rw-018.jpg', 'logo-rw-018.png',
          'peta-satelit-rw018.jpg', '404.html', '.nojekyll'
        ],
        manifest: {
          id: '/rw018app/',
          name: 'Aplikasi Ketua RW 018',
          short_name: 'RW 018',
          description: 'Aplikasi Administrasi RW 018 Kampung Banten, Kelurahan Iringmulyo, Kota Metro.',
          theme_color: '#065f46',
          background_color: '#065f46',
          display: 'standalone',
          display_override: ['standalone', 'fullscreen', 'minimal-ui'],
          orientation: 'portrait-primary',
          lang: 'id',
          dir: 'ltr',
          prefer_related_applications: false,
          categories: ['government', 'productivity', 'utilities'],
          start_url: '/rw018app/',
          scope: '/rw018app/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        devOptions: { enabled: false }
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: { '@': path.resolve(__dirname, '.') }
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1500,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    },
    preview: { port: 3000, host: '0.0.0.0' }
  };
});
