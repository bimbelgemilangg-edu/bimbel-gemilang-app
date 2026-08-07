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
        // baru. Sekarang dipecah per grup library -- selain fix error ini,
        // efek sampingnya juga bagus: siswa yang buka /siswa/* gak perlu
        // download pdfjs/exceljs/jspdf/mammoth/xlsx yang cuma dipakai di
        // halaman guru (/guru/alat-bantu, export raport, dll), karena
        // chunk-chunk itu cuma ke-load kalau halamannya beneran butuh.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Library berat yang cuma dipakai fitur tertentu -> chunk sendiri
          if (id.includes('pdfjs-dist')) return 'vendor-pdf';
          if (id.includes('katex')) return 'vendor-katex';
          if (id.includes('mammoth')) return 'vendor-mammoth';
          if (id.includes('xlsx') || id.includes('exceljs')) return 'vendor-excel';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdfmaker';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
            return 'vendor-react';
          }

          // Sisanya (lucide-react, swiper, jszip, qrcode.react, dll) -> satu
          // chunk umum yang lebih kecil daripada gabungan semuanya dulu.
          return 'vendor';
        },
      },
    },
  },
});