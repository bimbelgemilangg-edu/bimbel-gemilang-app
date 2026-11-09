// src/pages/student/tryout/PilihTampilanTryOut.jsx
// ============================================================
// PINTU MASUK MENU TRY OUT TERJADWAL & UJIAN BESAR RESMI (MANUAL)
// Menggunakan tampilan kalender & tanggal sesuai arahan user.
// Paket try out otomatis AI dipisahkan ke menu "Jalur Ujian AI" (/siswa/jalur-ai).
// ============================================================
import React from 'react';
import PapanJelajahPage from './PapanJelajahPage';

export default function PilihTampilanTryOut() {
  const studentId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') || ''
    : '';

  return <PapanJelajahPage studentId={studentId} />;
}
