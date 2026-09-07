// src/components/RenderTable.jsx
// ============================================================
// Render tabel yang nempel di soal (mis. kunci determinasi biologi,
// tabel data fisika/matematika, dll).
//
// 🔥 KENAPA INI PENTING: komponen ini ("QuestionTable") sebenarnya
// SUDAH ADA dari lama, tapi cuma didefinisikan LOKAL di dalam
// ImportHasilScanPage.jsx dan cuma dipakai buat PREVIEW ADMIN --
// TIDAK PERNAH disambungkan ke tampilan siswa (Latihan Harian & Try
// Out) sama sekali. Soal yang punya tabel (kayak kunci determinasi)
// bakal tampil TANPA TABELNYA ke siswa -- padahal tabelnya itu justru
// isi utama soalnya, siswa gak akan bisa jawab tanpa itu. Sekarang
// dipindah jadi komponen bersama, dipakai admin & siswa sekaligus.
// ============================================================

import React from 'react';
import RenderMath from './RenderMath';

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}
function safeString(v) {
  return String(v ?? '');
}

export default function RenderTable({ table }) {
  const header = safeArray(table?.header || table?.headers || table?.kolom);
  const rows = safeArray(table?.baris || table?.rows || table?.data);
  if (!header.length && !rows.length) return null;

  return (
    <div style={{ marginTop: 10, marginBottom: 10, overflowX: 'auto', border: '1px solid #d1d5db', borderRadius: 10, background: '#fff' }}>
      <table style={{ width: '100%', minWidth: 360, borderCollapse: 'collapse', fontSize: 13 }}>
        {header.length > 0 && (
          <thead>
            <tr>
              {header.map((cell, index) => (
                <th key={index} style={{ padding: '9px 10px', textAlign: 'left', background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                  <RenderMath text={safeString(cell)} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => {
            // Baris bisa berbentuk array MENTAH ["a","b"] ATAU objek
            // {0:"a", 1:"b"} (bentuk yang dipakai buat hindarin bug
            // "nested array" pas simpan ke Firestore) -- dua-duanya
            // harus kebaca sama persis di sini.
            const cells = Array.isArray(row) ? row : Object.values(row || {});
            return (
              <tr key={rowIndex}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ padding: '8px 10px', verticalAlign: 'top', borderTop: rowIndex > 0 ? '1px solid #e5e7eb' : 'none' }}>
                    <RenderMath text={safeString(cell)} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}