// src/utils/skorSoalTryOut.js
// ============================================================
// Hitung skor 1 soal Try Out (0..1) -- SATU-SATUNYA sumber logika ini,
// dipakai BARENG oleh:
//   1. TryOutView.jsx        -- pas siswa submit try out pertama kali
//   2. HasilTryOutAdminPage.jsx -- pas admin "Hitung Ulang" nilai lama
//      (mis. abis ketemu bug skoring, biar siswa yang kena imbas bisa
//      dikoreksi nilainya tanpa perlu ngerjain ulang dari awal)
//
// KENAPA DIPISAH KE SINI (bukan didefinisikan sendiri-sendiri di 2
// tempat): kalau logikanya beda tipis antara "pas ngerjain" dan "pas
// dihitung ulang admin", hasil "Hitung Ulang" bisa BEDA dari yang
// SEHARUSNYA didapat siswa -- padahal tujuannya justru mengoreksi jadi
// BENAR. Dengan 1 file bersama ini, itu tidak mungkin terjadi.
// ============================================================

import { hitungSkorPgKompleks, hitungSkorBenarSalah, cariIndexBenar } from './skoringSoalKompleks';

// 🔥 BARU: 1 fungsi bersama buat "apa soal ini beneran tidak dijawab
// sama sekali" -- dipakai BARENG oleh RendererPgSederhana/PgKompleks/
// BenarSalah.jsx (buat nampilin tanda "⚠️ Tidak dijawab") DAN oleh
// TryOutView.jsx & HasilTryOutAdminPage.jsx (buat ringkasan di header
// tiap soal). Sebelumnya logika ini KETULIS ULANG beda-beda tipis di
// 4 tempat -- SEKARANG cuma 1 sumber, biar siswa & admin selalu lihat
// kesimpulan yang PERSIS sama soal mana yang beneran di-skip.
export function soalBelumDijawab(soal, jawaban) {
  const tipe = soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return safeArrayLokal(jawaban).length === 0;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return safeArrayLokal(jawaban).filter(Boolean).length === 0;
  // pg_sederhana: jawabannya berupa INDEX ANGKA (termasuk 0 buat opsi
  // A) -- jangan sampai index 0 dianggap "kosong" cuma karena falsy.
  return jawaban === undefined || jawaban === null;
}

function safeArrayLokal(v) {
  return Array.isArray(v) ? v : [];
}

export function skorSatuSoal(soal, jawaban) {
  const tipe = soal.tipe || 'pg_sederhana';
  if (jawaban === undefined || jawaban === null) return 0;
  try {
    if (tipe === 'pg_kompleks') return hitungSkorPgKompleks(soal.kunciJawaban, jawaban);
    if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
      const baris = soal.tabel_benar_salah?.length ? soal.tabel_benar_salah : soal.pernyataan || [];
      return hitungSkorBenarSalah(baris, jawaban);
    }
    const indexBenar = cariIndexBenar(soal);
    return jawaban === indexBenar ? 1 : 0;
  } catch (e) {
    // Soal ini datanya rusak -- jangan sampai proses submit/hitung
    // ulang SELURUH try out ikut gagal cuma gara-gara 1 soal.
    console.error('[TryOut] Gagal hitung skor soal:', soal.id, e);
    return 0;
  }
}

/**
 * Hitung total skor (0..100%) buat SEMUA soal dalam 1 paket, dari
 * jawaban yang sudah tersimpan (baik pas submit pertama kali maupun
 * pas mau dihitung ulang belakangan).
 */
export function hitungTotalSkor(daftarSoal, jawaban) {
  let totalSkor = 0;
  daftarSoal.forEach((s) => { totalSkor += skorSatuSoal(s, jawaban[s.id]); });
  const totalSkorPersen = daftarSoal.length > 0 ? Math.round((totalSkor / daftarSoal.length) * 100) : 0;
  return { totalSkor, totalSkorPersen };
}