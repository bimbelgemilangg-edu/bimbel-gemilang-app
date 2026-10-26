// src/utils/ringkasReviewHasil.js
// ============================================================
// RINGKASAN REVIEW HASIL TRY OUT — jembatan siswa -> tentor.
//
// KENAPA ADA (arahan owner 2026-10-12): tujuan try out adalah MENGUKUR
// dan menjadi bahan evaluasi, tetapi siswa jarang membuka pembahasan yang
// terlipat. Layar tinjau kini membuka otomatis pembahasan untuk soal yang
// SALAH; sisanya (membawa daftar soal salah ke tentor) dulu dikerjakan
// manual dengan menyebut nomor dari ingatan. Util ini menyusun daftar itu
// secara mekanis: nomor + sidik jari kode sumber, jadi pesan ke tentor
// menyebut soal secara unik ("nomor 3 [UTBK 2020/TPS/PU/43]"), bukan
// "nomor 3" yang ambigu antar paket.
//
// MURNI & TERUJI (tests/ringkasReviewHasil.test.mjs).
// ============================================================

/** Butir salah = skor 0 (termasuk tidak dijawab). */
export function daftarSalahUntukTentor(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((it) => Number(it?.skor) <= 0)
    .map((it) => ({ nomor: it.nomor, kode: it.kode || '' }))
    .sort((a, b) => a.nomor - b.nomor);
}

/** Kunci dalam bentuk huruf untuk chip pembanding ("B" / "A, D"). */
export function kunciTampil(kunci) {
  if (Array.isArray(kunci)) return kunci.map((k) => (typeof k === 'number' ? String.fromCharCode(65 + k) : String(k))).join(', ');
  return String(kunci ?? '');
}

export default { daftarSalahUntukTentor, kunciTampil };
