import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

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
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: ['.ts', '.tsx']
    },
    server: {
      proxy
    },
  };
});