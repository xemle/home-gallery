import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      extensions: ['.ts', '.tsx']
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});