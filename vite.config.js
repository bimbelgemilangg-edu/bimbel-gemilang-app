import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Otomatis update di HP siswa/guru saat Anda push kode baru
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // Menaikkan batas kapasitas cache PWA menjadi 5 MB agar file vendor besar Anda lolos build
        maximumFileSizeToCacheInBytes: 5000000 
      },
      manifest: {
        name: 'Gemilang Super App',
        short_name: 'Gemilang App',
        description: 'Aplikasi Pembelajaran Bimbel Gemilang',
        start_url: '/login-siswa', // Memastikan PWA selalu langsung terbuka di halaman login siswa
        theme_color: '#2563eb', // Warna tema bar aplikasi (Biru)
        background_color: '#ffffff',
        display: 'standalone', // Menghilangkan kotak URL browser agar full screen seperti APK asli
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
