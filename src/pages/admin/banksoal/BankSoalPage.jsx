// src/pages/admin/banksoal/BankSoalPage.jsx
// ============================================================
// HALAMAN PEMBUNGKUS -- Bank Soal (Admin)
// ============================================================
// 🔥 KENAPA FILE INI ADA: AdvancedQuestionExtractor.jsx (komponen
// buatan admin sendiri) memakai layout "min-h-screen" PENUH LAYAR
// SENDIRI, tanpa render SidebarAdmin sama sekali -- kalau dipasang
// LANGSUNG ke route /admin/bank-soal tanpa dibungkus, admin akan
// KEHILANGAN NAVIGASI (gak ada jalan ke Dashboard/Kelola Siswa/dll,
// cuma bisa pakai tombol back browser).
//
// File ini murni PEMBUNGKUS TIPIS -- render <SidebarAdmin/> +
// <AdvancedQuestionExtractor/> berdampingan dengan margin yang
// benar, PERSIS pola yang sudah dipakai BankSoalImportPage.jsx
// (versi lama) dan semua halaman admin lain di project ini. TIDAK
// mengubah isi AdvancedQuestionExtractor.jsx sama sekali -- supaya
// perubahan sekecil mungkin ke file yang sudah kamu buat sendiri.
// ============================================================

import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import AdvancedQuestionExtractor from './AdvancedQuestionExtractor';

export default function BankSoalPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 260,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
        }}
      >
        <AdvancedQuestionExtractor />
      </main>
    </div>
  );
}