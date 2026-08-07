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
        // Dinaikkan sedikit dari 5MB -> 6MB sebagai jaga-jaga tambahan,
        // TAPI perbaikan utamanya ada di manualChunks di bawah: vendor
        // dipecah jadi beberapa file supaya tidak ada satu chunk pun yang
        // mendekati limit ini lagi ke depannya.
        maximumFileSizeToCacheInBytes: 6000000
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
        // 🔥 FIX BUILD ERROR (workbox maximumFileSizeToCacheInBytes):
        // sebelumnya SEMUA node_modules digabung jadi SATU file 'vendor'
        // (5.16 MB), jadi gampang lewat limit workbox tiap nambah library
        // baru.
        //
        // 🔥 FIX SUSULAN (Uncaught TypeError: Cannot read properties of
        // undefined, reading 'forwardRef'): percobaan pertama sempat
        // memisahkan react/react-dom ke chunk sendiri ('vendor-react'),
        // padahal banyak library lain (lucide-react, recharts, swiper, dll)
        // MEMANGGIL React.forwardRef DARI DALAM MODUL MEREKA SENDIRI saat
        // pertama kali di-load. Kalau chunk itu kebetulan dieksekusi
        // sebelum chunk React siap, hasilnya persis error di atas -- dan
        // ini rawan beda-beda hasilnya antar browser (Chrome vs Safari).
        // Aturan amannya: JANGAN pisahkan react/react-dom dari library apa
        // pun yang notabene "React library" (pakai hooks/forwardRef).
        // Yang boleh dipisah HANYA library besar & berdiri sendiri yang
        // TIDAK bergantung ke React sama sekali secara langsung.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Library besar & berdiri sendiri (tidak bergantung ke React) ->
          // aman dipisah ke chunk sendiri, ini yang jadi biang bengkaknya
          // ukuran vendor kemarin.
          if (id.includes('pdfjs-dist')) return 'vendor-pdf';
          if (id.includes('mammoth')) return 'vendor-mammoth';
          if (id.includes('xlsx') || id.includes('exceljs')) return 'vendor-excel';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdfmaker';
          if (id.includes('firebase')) return 'vendor-firebase';

          // Sisanya -- termasuk react, react-dom, react-router, lucide-react,
          // katex, recharts, swiper, jszip, dll -- SENGAJA digabung jadi
          // satu chunk supaya urutan load-nya selalu benar, gak ada lagi
          // risiko forwardRef undefined.
          return 'vendor';
        },
      },
    },
  },
});