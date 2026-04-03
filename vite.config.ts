import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/Smart_mini_pos/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icons/*.png'],
        manifest: {
          name: 'AL-MADINA SHINWARI POS',
          short_name: 'POS',
          description: 'Restaurant Point of Sale System',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          background_color: '#E0E5EC',
          theme_color: '#6750A4',
          icons: [
            {
              src: 'icons/48.png',
              sizes: '48x48',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'icons/1024.png',
              sizes: '1024x1024',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts',
                expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdnjs-cache',
                expiration: {
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            store: ['zustand'],
            icons: ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
