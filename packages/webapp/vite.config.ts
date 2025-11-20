import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pwaConditionalPlugin from './vite/pwa-conditional-plugin'
import injectAppState from './vite/inject-app-state'

const proxyTarget = 'http://localhost:3000';
const serverUrls = [
  '/api',
  '/files'
]

const proxy = Object.fromEntries(serverUrls.map(prefix => [prefix, {
  target: proxyTarget,
  changeOrigin: true,
  secure: false,
}]))

export default defineConfig(() => {
  return {
    base: '',
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'logo.svg'],
        manifest: {
          id: '/',
          name: 'HomeGallery App',
          short_name: 'HomeGallery',
          description: 'All personal photos in your pocket',
          start_url: '.',
          scope: '/',
          display: 'fullscreen',
          orientation: 'any',
          theme_color: '#000000',
          background_color: '#eee',
          icons: [
            {
              src: '/favicon.ico',
              type: 'image/x-icon',
              sizes: '64x64 32x32 24x24 16x16'
            },
            {
              src: '/logo192.png',
              type: 'image/png',
              sizes: '192x192'
            },
            {
              src: '/logo512.png',
              type: 'image/png',
              sizes: '512x512'
            },
            {
              src: '/logo.svg',
              type: 'image/svg+xml',
              sizes: '512x512'
            }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [/\/api\//, /\/files\//],
        }
      }),
      pwaConditionalPlugin({ disabled: false }),
      injectAppState({
        // See gallery.config-example.yml for all available options
        disabled: false,
        state: {
          sources: [
            // enable downloadable sources
            //{ indexName: "Camera roll", downloadable: true }
          ]
        }
      })
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.json']
    },
    server: {
      proxy
    },
  };
});
