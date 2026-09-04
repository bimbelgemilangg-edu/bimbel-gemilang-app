// src/pages/admin/bank-soal/sisipkanGambarPdf24.js
// ============================================================
// Gabungkan gambar hasil ekstrak dari HTML pdf24 (lihat
// ekstrakGambarPdf24.js) ke dalam daftar soal yang SUDAH melalui
// normalizeSoal() di ImportHasilScanPage.jsx.
//
// ATURAN PALING PENTING: JANGAN PERNAH MENIMPA gambar yang sudah
// ada (mis. hasil AI berhasil embed gambar asli sendiri). Fungsi
// ini HANYA mengisi soal yang gambarnya masih KOSONG.
//
// PENCOCOKAN GAMBAR SOAL: berdasarkan `soal.nomor` -- ini paling
// aman SELAMA nomor soal yang di-generate AI SAMA PERSIS dengan
// nomor soal asli di PDF (mis. AI tidak menomori ulang per-bab).
// Kalau AI menomori ulang, pencocokan ini TIDAK akan jalan dengan
// benar -- cek dulu manual sebelum dipakai untuk dokumen semacam itu.
//
// PENCOCOKAN GAMBAR BACAAN: berdasarkan ANGKA yang ada di
// `bacaan.grup` (mis. "bacaan_1" -> 1), dicocokkan ke angka
// "Bacaan N" yang terdeteksi di teks PDF asli. Ini ASUMSI bahwa AI
// menomori grup bacaan sesuai urutan kemunculan di dokumen (sama
// seperti instruksi di prompt sistem) -- kalau ternyata angkanya
// tidak sinkron, gambar bacaan tidak akan cocok (tapi gambar per
// SOAL tetap aman, karena jalur itu terpisah).
// ============================================================

import { ekstrakGambarPerSoal } from './ekstrakGambarPdf24';

function buatDeskripsiOtomatis(gambar) {
  return `[Otomatis dari pdf24] Ditemukan di halaman ${gambar.halaman + 1} PDF asli, ukuran ${Math.round(gambar.lebar)}x${Math.round(gambar.tinggi)}px. Mohon cek kesesuaiannya dengan soal ini sebelum publikasi.`;
}

function gambarPdf24KeFormatSistem(list) {
  return list.map((g, i) => ({
    id: `gambar-pdf24-${i + 1}`,
    url: '',
    dataUrl: g.src,
    uploadedUrl: '',
    deskripsi: buatDeskripsiOtomatis(g),
    nomor: i + 1,
  }));
}

/**
 * @param {Array} daftarSoal - array hasil normalizeSoal() (sudah punya .nomor, .gambar, .bacaan)
 * @param {string} htmlPdf24 - isi file HTML hasil convert pdf24
 * @param {object} opsi - diteruskan ke ekstrakGambarPerSoal (mis. lebarMinGambar)
 * @returns {{ soal: Array, ringkasan: object, catatan: string[] }}
 */
export function sisipkanGambarOtomatis(daftarSoal, htmlPdf24, opsi = {}) {
  const hasilEkstrak = ekstrakGambarPerSoal(htmlPdf24, opsi);
  const catatan = [];
  let jumlahSoalTerisi = 0;
  let jumlahBacaanTerisi = 0;

  const soalHasilGabung = daftarSoal.map((soal) => {
    let soalBaru = soal;

    // --- isi gambar soal utama, HANYA kalau kosong ---
    const gambarSoalKosong = !soal.gambar || soal.gambar.length === 0;
    const gambarDariPdf24 = hasilEkstrak.perSoal[soal.nomor];
    if (gambarSoalKosong && gambarDariPdf24 && gambarDariPdf24.length > 0) {
      soalBaru = { ...soalBaru, gambar: gambarPdf24KeFormatSistem(gambarDariPdf24) };
      jumlahSoalTerisi += 1;
      catatan.push(`Soal No ${soal.nomor}: ${gambarDariPdf24.length} gambar diisi otomatis dari pdf24.`);
    }

    // --- isi gambar bacaan, HANYA kalau bacaan ada & gambarnya kosong ---
    if (soalBaru.bacaan) {
      const gambarBacaanKosong = !soalBaru.bacaan.gambar || soalBaru.bacaan.gambar.length === 0;
      const angkaGrup = /(\d+)/.exec(soalBaru.bacaan.grup || '')?.[1];
      const gambarBacaanDariPdf24 = angkaGrup ? hasilEkstrak.bacaanImages[angkaGrup] : null;

      if (gambarBacaanKosong && gambarBacaanDariPdf24 && gambarBacaanDariPdf24.length > 0) {
        soalBaru = {
          ...soalBaru,
          bacaan: { ...soalBaru.bacaan, gambar: gambarPdf24KeFormatSistem(gambarBacaanDariPdf24) },
        };
        jumlahBacaanTerisi += 1;
      }
    }

    return soalBaru;
  });

  return {
    soal: soalHasilGabung,
    ringkasan: {
      ...hasilEkstrak.ringkasan,
      jumlahSoalTerisiOtomatis: jumlahSoalTerisi,
      jumlahBacaanTerisiOtomatis: jumlahBacaanTerisi,
    },
    catatan,
  };
}