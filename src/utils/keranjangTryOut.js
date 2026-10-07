// src/utils/keranjangTryOut.js
// ============================================================
// PAGAR TIPE SOAL + RINCIAN KERANJANG buat halaman Terbitkan Try Out.
//
// KENAPA file ini ada (2026-10, permintaan owner: "mau terbitkan
// try out langsung satu folder"): dulu TIPE_TERDUKUNG & tipeDidukung()
// hidup DIDALAM TerbitkanTryOutPage.jsx saja. Pas tombol BARU
// "＋ 1 Folder" (masukin SEMUA soal folder sekali klik) dibikin,
// logika "soal mana yang boleh masuk keranjang + berapa yang benar-
// benar baru" dipakai di DUA tempat (tombol per-bab lama & tombol
// per-folder baru) dan butuh DIUJI otomatis biar pagar tipen gak
// bocor diam-diam. Maka dipindah ke util murni yang bisa di-test
// node (tests/keranjangTryOut.test.mjs) tanpa butuh browser.
//
// KONTRAK (aditif -- tidak mengubah arti lama):
//   - tipeDidukung(soal)         : true kalau renderer try out punya
//                                  cara menampilkan tipe soal itu.
//   - hitungRincianMasukKeranjang(idsSudahAda, daftarSoal)
//                                : { baru, sudahAda, dilewati } --
//                                  dipakai buat pesan konfirmasi
//                                  tombol "＋ 1 Folder" biar admin
//                                  gak bingung kok jumlahnya beda.
// ============================================================

// 🔥 Daftar tipe soal yang Try Out BENERAN bisa render dengan benar.
// Kalau ada tipe di luar ini (menjodohkan dst), soal itu TIDAK BOLEH
// masuk keranjang sama sekali -- lebih aman "gak bisa dipilih" (jelas
// kelihatan kenapa) daripada "kepilih tapi tampil rusak diam-diam" pas
// siswa asli ngerjain. Kalau nanti tipe baru mau didukung, tinggal
// bikin Renderer-nya + tambahin nama tipe-nya ke daftar ini.
//
// 🔥 isian_singkat & numerik BARU DITAMBAHKAN ke daftar ini -- udah
// punya RendererIsianSingkat.jsx + logika penilaian di
// skorSoalTryOut.js. menjodohkan MASIH belum, sengaja tetap diblokir
// (butuh UI pasangan yang beda total).
// 🔥 BARU (esai 2026-10-04): 'esai' masuk daftar didukung -- siswa
// mengetik atau memotret jawaban, admin menilai manual di Hasil Try Out.
export const TIPE_TERDUKUNG = ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori', 'isian_singkat', 'numerik', 'esai', 'uraian'];

export function tipeDidukung(soal) {
  return TIPE_TERDUKUNG.includes(soal?.tipe || 'pg_sederhana');
}

// 🔥 BARU: hitung NASIB tiap soal folder SEBELUM benar-benar dimasukan
// ke keranjang, biar tombol "＋ 1 Folder" bisa bilang jujur:
// "25 soal baru, 3 sudah ada di keranjang, 2 dilewati (tipe belum
// didukung)". idsSudahAda boleh Set ATAU Map (keranjang halaman ini
// memang Map soalId -> soal); apa pun yang punya .has() dipakai.
export function hitungRincianMasukKeranjang(idsSudahAda, daftarSoal) {
  const punya = typeof idsSudahAda?.has === 'function' ? idsSudahAda : new Set(idsSudahAda || []);
  const rincian = { baru: 0, sudahAda: 0, dilewati: 0 };
  (daftarSoal || []).forEach((s) => {
    if (!tipeDidukung(s)) { rincian.dilewati += 1; return; }
    if (punya.has(s.id)) rincian.sudahAda += 1; else rincian.baru += 1;
  });
  return rincian;
}

// 🔥 BARU: susun kalimat konfirmasi dari rincian -- dipisah biar
// gampang di-test dan biar halaman gak penuh logika string.
export function teksRincianKeranjang(rincian) {
  const bagian = [];
  if (rincian.baru > 0) bagian.push(`${rincian.baru} soal masuk keranjang`);
  if (rincian.sudahAda > 0) bagian.push(`${rincian.sudahAda} sudah ada sebelumnya`);
  if (rincian.dilewati > 0) bagian.push(`${rincian.dilewati} dilewati karena tipe belum didukung`);
  if (bagian.length === 0) return 'Folder ini belum punya soal aktif bertipe didukung.';
  return `✓ ${bagian.join(', ')}.`;
}
