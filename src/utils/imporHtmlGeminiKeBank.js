// src/utils/imporHtmlGeminiKeBank.js
// ============================================================
// Jembatan antara keluaran ekstraktor HTML Gemini
// (src/utils/ekstrakHtmlGemini.js) dan bentuk dokumen koleksi
// `bank_soal` yang sudah dikenali seluruh sistem (mesin skoring, mesin
// cetak, Perpustakaan, Lemari Soal).
//
// KENAPA DIPISAH DARI HALAMAN: pemetaan field adalah logika yang bisa
// salah tanpa kelihatan (salah satu field = soal tak terbaca di satu
// halaman), jadi ia wajib murni & teruji. Halaman hanya urusan klik.
//
// Menumpang mesin taksonomi yang SAMA dengan jalur impor JSON lama
// (deteksiTaksonomiSoal + terapkanTaksonomi), sehingga soal dari HTML
// Gemini dan soal dari JSON admin mendapat perlakuan pengelompokan yang
// identik -- tidak ada dua kasta warga di bank soal.
// ============================================================

import { deteksiTaksonomiSoal, terapkanTaksonomi } from './mesinTaksonomiSoal.js';

/**
 * @param {object} butir   keluaran ekstrakHtmlGemini (kontrak 12 field + materi/pembahasan)
 * @param {object} konteks { fileName, mapel, jenjang, kelas, sumber }
 * @returns {object} dokumen siap writeBatch ke koleksi bank_soal
 */
export function dokumenDariButir(butir = {}, konteks = {}) {
  // 🔥 2026-10-07 (kajian PDF Kinematika): opsi kaya hasil ikatan
  // ekstraktor ({teks, gambarRefs:[n]}) diselesaikan DI SINI menjadi
  // {teks, gambar:[{url,sumber,asal,caption}]} sejajar gambarUrls, supaya
  // renderer siswa (RendererPgSederhana/PgKompleks) yang sudah memahami
  // opsi bergambar sejak jalur impor JSON lama langsung menampilkan
  // grafik pada pilihannya. Referensi tanpa url (gambar masih menunggu
  // potongan) dibuang agar opsi tidak memuat gambar rusak.
  const urlsButir = butir.gambarUrls || [];
  const metaButir = butir.gambarMeta || [];
  const opsiJawabanSiap = (butir.opsiJawaban || []).map((o) => {
    if (!o || typeof o !== 'object' || !Array.isArray(o.gambarRefs)) return o;
    const gambar = o.gambarRefs
      .map((n) => {
        const url = urlsButir[Number(n) - 1] || '';
        if (!url) return null;
        const mt = metaButir[Number(n) - 1] || {};
        return {
          url,
          sumber: mt.sumber || '',
          asal: mt.asal || '',
          caption: mt.caption || '',
        };
      })
      .filter(Boolean);
    const { gambarRefs: _gambarRefs, ...sisanya } = o;
    return { ...sisanya, gambar: [...(Array.isArray(o.gambar) ? o.gambar : []), ...gambar] };
  });

  const norm = {
    nomor: butir.nomor ?? null,
    tipe: butir.tipe || 'pg_sederhana',
    teksSoal: butir.soal || '',
    soal: butir.soal || '',
    opsiJawaban: opsiJawabanSiap,
    pernyataan: butir.pernyataan || [],
    tabelBenarSalah: butir.tabel_benar_salah || [],
    pasangan: butir.pasangan || [],
    kunciJawaban: butir.kunciJawaban ?? '',
    gambar: [],
    gambarUrls: butir.gambarUrls || [],
    // 🔥 2026-10-07 — asal-usul gambar (tangga gambar asli prompt paten):
    // gambarMeta sejajar indeks dengan gambarUrls ({sumber, asal, caption}),
    // potonganTertunda = daftar figur yang masih menunggu dipotong presisi
    // dari berkas asli (soal sengaja boleh tersimpan lebih dulu).
    gambarMeta: butir.gambarMeta || [],
    potonganTertunda: butir.potonganTertunda || [],
    bacaan: butir.bacaan || null,
    pembahasan: butir.pembahasan || '',
    pembahasanAsal: butir.pembahasanAsal || 'tercetak',
    kurikulum: butir.kurikulum || '',
    fase: butir.fase || '',
    kelas: butir.kelas || '',
    elemen: butir.elemen || '',
    capaian: butir.capaian || '',
    sumber: butir.sumber || '',
    status: 'aktif',
    sumberFile: konteks.fileName || 'impor-html-gemini',
    asalImpor: 'html-gemini',
  };

  const tak = deteksiTaksonomiSoal(norm, {
    ...konteks,
    bab: butir.materi || konteks.bab || '',
  });
  const dok = terapkanTaksonomi(norm, tak, { force: true });
  // Taksonomi Kurikulum Merdeka yang DIAKU Gemini dipertahankan apa adanya
  // (deteksi otomatis hanya mengisi yang Gemini tinggalkan kosong).
  dok.kurikulum = butir.kurikulum || dok.kurikulum || '';
  dok.fase = butir.fase || dok.fase || '';
  dok.elemen = butir.elemen || dok.elemen || '';
  dok.capaian = butir.capaian || dok.capaian || '';
  if (butir.kelas && !dok.kelas) dok.kelas = String(butir.kelas);

  // Lemari Soal & Perpustakaan & Cetak Latihan membaca `materi`;
  // taksonomi menulis `bab`. Samakan keduanya supaya tidak ada halaman
  // yang melihat bab kosong.
  dok.materi = dok.bab || butir.materi || '';
  return dok;
}

/** Ringkasan prakirim untuk layar pratinjau: jumlah per bab + bendera. */
export function ringkasanImpor(soal = [], gambar = [], potongan = []) {
  const perBab = new Map();
  let penalaran = 0;
  let tanpaKunci = 0;
  for (const s of soal) {
    const bab = s.materi || '(tanpa bab)';
    perBab.set(bab, (perBab.get(bab) || 0) + 1);
    if (s.pembahasanAsal === 'penalaran') penalaran += 1;
    const k = s.kunciJawaban;
    const kosong = k === '' || k === null || undefined === k
      || (Array.isArray(k) && k.length === 0);
    if (kosong && s.tipe !== 'esai') tanpaKunci += 1;
  }
  // tangga gambar asli: berapa yang URL asli, berapa base64 tanpa pengakuan
  // asal (terindikasi buatan model), berapa figur yang menunggu potongan.
  const daftarGambar = Array.isArray(gambar) ? gambar : [];
  const urlAsli = daftarGambar.filter((g) => /^https?:\/\//i.test(g?.src || '')).length;
  const terindikasiBuatan = daftarGambar.filter((g) => g?.gambarSumber === 'base64-tanpa-asal').length;
  const menungguPotongan = Array.isArray(potongan) ? potongan.length : 0;
  return {
    jumlah: soal.length,
    perBab: [...perBab.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id')),
    penalaran,
    tanpaKunci,
    urlAsli,
    terindikasiBuatan,
    menungguPotongan,
  };
}

export default { dokumenDariButir, ringkasanImpor };
