// src/utils/seksiNaskahTryOut.js
// ============================================================
// SEKSI NASKAH CETAK buat halaman Terbitkan Try Out.
//
// KENAPA file ini ada (2026-10-08, permintaan owner sambil mengirim
// tangkapan layar halaman Terbitkan Try Out: "selain terbit ke siswa
// aku mau kasih tombol print soal yang udah di tata sesuai kanan kiri
// seperti sebelumnya kita diskusikan tinggal print"): mesin naskah dua
// kolom (src/utils/naskahSoal.js) dulu hanya dipanggil dari halaman
// guru CetakPaketLatihan, dan ia menganggap satu daftar soal = satu
// dokumen. Paket try out punya struktur SUBTES (mis. subtes Matematika
// lalu subtes IPA) yang di naskah ujian asli tampil sebagai kepala
// seksi ("SUBTES 1: ..."), jadi perlu penerjemah kecil:
//   paket try out -> rencana seksi -> blok HTML bernomor urut lanjut.
//
// Semua fungsi di sini MURNI (tanpa Firestore/DOM) dan diuji Node di
// tests/seksiNaskahTryOut.test.mjs, supaya janji-janjinya gak bocor
// diam-diam:
//   1. nomor butir HARUS urut lanjut lintas seksi (1..N, bukan mulai
//      lagi dari 1 tiap seksi) -- persis naskah UTBK/TKA asli;
//   2. mode "per soal individual" (1 subtes = 1 soal) TIDAK boleh
//      mencetak 23 kepala seksi -- kepala seksi hanya untuk grup
//      berbentuk mata pelajaran;
//   3. soal yang gak disebut subtes mana pun (data lama/rusan edit)
//      TIDAK boleh hilang dari cetak -- masuk seksi "Soal Lainnya";
//   4. susunan subtes keranjang HARUS identik dengan yang disimpan
//      tombol Terbitkan (bangunSubtesKeranjang = satu-satunya sumber).
// ============================================================

import {
  butirNaskahHtml,
  kunciButirNaskahHtml,
  kopNaskahHtml,
  escapeHtml,
  estimasiTinggiBlokMm,
} from './naskahSoal.js';

/** Kepala seksi naskah (pita berbingkai tipis, tidak boleh terbelah kolom). */
export function judulSeksiHtml(judul) {
  return `<div class="nsk-seksi">${escapeHtml(judul)}</div>`;
}

/**
 * Susun struktur subtes persis seperti yang disimpan tombol Terbitkan.
 * KENAPA dipindah ke util murni: tombol cetak di panel keranjang butuh
 * susunan yang SAMA dengan payload terbit supaya pratinjau cetak = yang
 * diterima siswa; dulu rumus ini inline di halaman dan gak bisa diuji.
 *
 * @param {Array} soalDipilih daftar soal (urutan keranjang)
 * @param {object} opsi { modeTimer, granularitasSubtes, durasiPerSoal, durasiSubtes }
 * @returns {Array} struktur `subtes` payload tryout_paket
 */
export function bangunSubtesKeranjang(soalDipilih, opsi = {}) {
  const daftar = Array.isArray(soalDipilih) ? soalDipilih : [];
  if (opsi.modeTimer !== 'per-subtes') return [];
  if (opsi.granularitasSubtes === 'soal') {
    return daftar.map((s, i) => ({
      nama: `Soal ${i + 1}`,
      durasiMenit: Number(opsi.durasiPerSoal) || 3,
      soalIds: [s.id],
    }));
  }
  const mapelUnik = [...new Set(daftar.map((s) => s.mataPelajaran || 'Umum'))];
  return mapelUnik.map((mapel) => ({
    nama: mapel,
    durasiMenit: Number(opsi.durasiSubtes?.[mapel]) || 30,
    soalIds: daftar.filter((s) => (s.mataPelajaran || 'Umum') === mapel).map((s) => s.id),
  }));
}

/**
 * Rencana seksi cetak dari sebuah paket try out (terbit maupun keranjang
 * yang sudah diberi struktur subtes).
 *
 * Aturan jujur:
 *   - modeTimer 'total' atau tanpa subtes      -> satu seksi tanpa kepala;
 *   - granularitas 'soal' (tiap subtes 1 soal) -> satu seksi tanpa kepala
 *     (kepala "Soal 1..N" di kertas hanya jadi sampah tinta);
 *   - subtes grup (mapel)                      -> kepala seksi per subtes,
 *     urutan mengikuti urutan subtes payload;
 *   - sisa soal yang tak disebut subtes mana pun -> seksi "Soal Lainnya"
 *     supaya TIDAK ADA soal yang diam-diam gak tercetak.
 *
 * @returns {{seksi: Array<{judul: string, soalList: Array}>, granularitas: string}}
 */
export function rencanaSeksiNaskah(paket) {
  const daftar = Array.isArray(paket?.daftarSoal) ? paket.daftarSoal : [];
  const subtes = Array.isArray(paket?.subtes) ? paket.subtes : [];
  const perSoal = subtes.length > 0 && subtes.every((s) => (s.soalIds || []).length === 1);
  if (paket?.modeTimer !== 'per-subtes' || subtes.length < 2 || perSoal) {
    return { seksi: [{ judul: '', soalList: daftar }], granularitas: perSoal ? 'soal' : 'tanpa' };
  }
  const petaId = new Map(daftar.map((s) => [s.id, s]));
  const seksi = [];
  const terpakai = new Set();
  subtes.forEach((sub, i) => {
    const list = (sub.soalIds || []).map((id) => petaId.get(id)).filter(Boolean);
    if (!list.length) return;
    list.forEach((s) => terpakai.add(s.id));
    seksi.push({ judul: sub.nama || `Subtes ${i + 1}`, soalList: list });
  });
  const sisa = daftar.filter((s) => !terpakai.has(s.id));
  if (sisa.length) seksi.push({ judul: 'Soal Lainnya', soalList: sisa });
  return { seksi, granularitas: 'mapel' };
}

/**
 * Blok HTML naskah untuk satu dokumen (mode 'siswa' | 'kunci').
 * Blok 0 selalu kepala dokumen; sesudahnya kepala seksi (bila ada)
 * dan butir dengan NOMOR URUT LANJUT lintas seksi.
 * Panjang array inilah yang diukur lapisan ukur halaman -- jadi
 * pasangan perkiraannya lihat `perkiraanTinggiBlokSeksi`.
 */
export function blokNaskahDariSeksi(mode, meta, seksi, lebarKolom, rasioGambar = {}) {
  const kop = mode === 'kunci'
    ? `<div class="nsk-peringatan">PEGANGAN GURU — JANGAN DICETAK UNTUK SISWA</div>${kopNaskahHtml(meta, 'KUNCI & PEMBAHASAN', false)}`
    : kopNaskahHtml(meta, 'NASKAH SOAL', true);
  const blok = [kop];
  let nomor = 1;
  (Array.isArray(seksi) ? seksi : []).forEach((sec) => {
    if (sec.judul) blok.push(judulSeksiHtml(sec.judul));
    (sec.soalList || []).forEach((s) => {
      blok.push(mode === 'kunci'
        ? kunciButirNaskahHtml(s, nomor)
        : butirNaskahHtml(s, nomor, lebarKolom, rasioGambar));
      nomor += 1;
    });
  });
  return blok;
}

/**
 * Taksiran tinggi (mm) SELARAS INDEKS dengan keluaran blokNaskahDariSeksi
 * (kepala=26mm, kepala seksi=9mm, butir=estimasi mesin naskah). Dipakai
 * sebagai cadangan susunNaskahDariBlok sebelum pengukuran layar tiba;
 * kalau panjangnya tidak sama dengan jumlah blok, susunan awal melenceng.
 */
export function perkiraanTinggiBlokSeksi(mode, seksi, lebarKolom, rasioGambar = {}) {
  const tinggi = [26];
  (Array.isArray(seksi) ? seksi : []).forEach((sec) => {
    if (sec.judul) tinggi.push(9);
    (sec.soalList || []).forEach((s) => tinggi.push(estimasiTinggiBlokMm(mode, s, lebarKolom, rasioGambar)));
  });
  return tinggi;
}

export default {
  judulSeksiHtml,
  bangunSubtesKeranjang,
  rencanaSeksiNaskah,
  blokNaskahDariSeksi,
  perkiraanTinggiBlokSeksi,
};
