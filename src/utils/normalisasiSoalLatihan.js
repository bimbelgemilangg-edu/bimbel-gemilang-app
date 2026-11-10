// src/utils/normalisasiSoalLatihan.js
// ============================================================
// Normalisasi Butir Soal untuk Latihan Pemahaman Sesi Tatap Muka
// Menjembatani berbagai dialek bank_soal di Firestore:
//   - Teks Soal: sadar alias (teksSoal, soal, teks_soal, pertanyaan)
//   - Gambar: sadar alias (gambarUrls, gambar, gambarUrl, mediaUrl, stimulus, markdown ![alt](url))
//   - Opsi Jawaban: normalisasi ke [{ label: 'A', teks: '...', gambar: [] }]
//   - Kunci Jawaban: normalisasi ke huruf 'A', 'B', 'C', dst.
// ============================================================

import { teksSoalDari } from './fieldButirSoal.js';
import { bersihkanTeksOpsi } from './bersihkanGlifKunci.js';
import { lepasBungkusanSrcGambar } from './normalisasiSrcGambar.js';

const HURUF_OPSI = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Ekstraksi SEMUA URL gambar milik butir dari berbagai kemungkinan field
 * @param {object} soal Dokumen soal mentah
 * @returns {string[]} Array URL gambar bersih
 */
export function ekstrakSemuaGambar(soal) {
  if (!soal || typeof soal !== 'object') return [];
  const urls = [];

  // 1. Array gambarUrls (format baku ekspor/impor)
  if (Array.isArray(soal.gambarUrls)) {
    for (const g of soal.gambarUrls) {
      if (typeof g === 'string' && g.trim()) urls.push(g.trim());
      else if (g?.url || g?.uploadedUrl) urls.push(String(g.url || g.uploadedUrl).trim());
    }
  }

  // 2. Array gambar (format mesin cetak/extractor)
  if (Array.isArray(soal.gambar)) {
    for (const g of soal.gambar) {
      if (typeof g === 'string' && g.trim()) urls.push(g.trim());
      else if (g?.url || g?.uploadedUrl) urls.push(String(g.url || g.uploadedUrl).trim());
    }
  }

  // 3. String tunggal (gambarUrl, mediaUrl, image, foto, imgUrl, urlGambar, qImage)
  const kunciString = ['gambarUrl', 'mediaUrl', 'image', 'foto', 'imgUrl', 'urlGambar', 'gambar', 'qImage', 'questionImage'];
  for (const k of kunciString) {
    if (typeof soal[k] === 'string' && soal[k].trim()) {
      urls.push(soal[k].trim());
    }
  }

  // 4. Gambar dalam wacana/bacaan/stimulus bersama
  const b = soal.bacaan || soal.stimulus || soal.wacana;
  if (b && typeof b === 'object') {
    if (Array.isArray(b.gambar)) {
      for (const g of b.gambar) {
        if (typeof g === 'string' && g.trim()) urls.push(g.trim());
        else if (g?.url || g?.uploadedUrl) urls.push(String(g.url || g.uploadedUrl).trim());
      }
    }
    if (typeof b.gambarUrl === 'string' && b.gambarUrl.trim()) {
      urls.push(b.gambarUrl.trim());
    }
  }

  // 5. Ekstraksi Markdown image: ![alt](url) dari teks soal
  const rawTeks = String(soal.teksSoal || soal.soal || soal.teks_soal || soal.pertanyaan || '');
  const mdMatches = rawTeks.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
  for (const m of mdMatches) {
    if (m[1]) urls.push(m[1].trim());
  }

  // Bersihkan bungkus markdown dan filter unik
  const hasilBersih = [];
  const seen = new Set();
  for (const u of urls) {
    const clean = lepasBungkusanSrcGambar(u);
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      hasilBersih.push(clean);
    }
  }

  return hasilBersih;
}

/**
 * Normalisasi opsi jawaban agar selalu memiliki label (A, B, C, D, E)
 * dan teks yang bersih tanpa penanda kunci warisan (☑/☐).
 * @param {Array} opsiRaw Array opsi dari Firestore
 * @returns {Array<{ label: string, teks: string, gambar: Array }>}
 */
export function normalisasiDaftarOpsi(opsiRaw, optionImagesRaw = []) {
  if (!Array.isArray(opsiRaw)) return [];

  return opsiRaw.map((item, idx) => {
    const labelBaku = HURUF_OPSI[idx] || String.fromCharCode(65 + idx);
    let label = labelBaku;
    let teks = '';
    const gambar = [];

    if (typeof item === 'string') {
      teks = item;
    } else if (item && typeof item === 'object') {
      label = item.label || item.key || item.huruf || labelBaku;
      teks = item.teks || item.text || item.opsi || item.value || '';
      if (Array.isArray(item.gambar)) {
        item.gambar.forEach((g) => {
          const u = typeof g === 'string' ? g : g?.url || g?.uploadedUrl;
          if (u) gambar.push(u);
        });
      } else if (item.gambarUrl) {
        gambar.push(item.gambarUrl);
      }
    } else {
      teks = String(item ?? '');
    }

    if (Array.isArray(optionImagesRaw) && optionImagesRaw[idx]) {
      const optImg = optionImagesRaw[idx];
      const u = typeof optImg === 'string' ? optImg : optImg?.url || optImg?.uploadedUrl;
      if (u && !gambar.includes(u)) gambar.push(u);
    }

    // Lepas penanda glif kunci warisan (☑/☐/✓)
    teks = bersihkanTeksOpsi(teks);

    // Lepas prefix redundan jika teks diawali "A. ", "A) ", "(A) "
    teks = teks.replace(/^\(?[A-Fa-f]\)?[\s.:\-–)]+/, '').trim();

    return {
      label: String(label).toUpperCase().trim() || labelBaku,
      teks,
      gambar,
    };
  });
}

/**
 * Normalisasi satu butir soal utuh
 * @param {object} rawSoal Dokumen soal dari Firestore
 * @param {number} idx Urutan nomor jika nomor kosong
 */
export function normalisasiButirSoal(rawSoal, idx = 0) {
  if (!rawSoal) return null;
  const teks = teksSoalDari(rawSoal);
  const gambarUrls = ekstrakSemuaGambar(rawSoal);
  const opsiJawaban = normalisasiDaftarOpsi(
    rawSoal.opsiJawaban || rawSoal.opsi || rawSoal.pilihan || rawSoal.pernyataan || rawSoal.options,
    rawSoal.optionImages || []
  );

  const rawKunci = rawSoal.kunciJawaban ?? rawSoal.kunci ?? rawSoal.jawaban ?? rawSoal.jawabanBenar ?? rawSoal.correctAnswer ?? rawSoal.correct ?? 'A';
  let kunci;
  if (Array.isArray(rawKunci)) {
    kunci = rawKunci;
  } else if (typeof rawKunci === 'boolean') {
    kunci = rawKunci;
  } else {
    kunci = String(rawKunci ?? '').toUpperCase().trim();
    // Jika kunci adalah index angka (misal 0 -> 'A', 1 -> 'B')
    if (/^[0-4]$/.test(kunci)) {
      kunci = HURUF_OPSI[parseInt(kunci, 10)] || 'A';
    }
  }

  const pernyataan = Array.isArray(rawSoal.pernyataan)
    ? rawSoal.pernyataan
    : (Array.isArray(rawSoal.baris)
      ? rawSoal.baris
      : (Array.isArray(rawSoal.tabel_benar_salah) ? rawSoal.tabel_benar_salah : []));

  const tabelSoal = rawSoal.tabelSoal || rawSoal.tabel_soal || rawSoal.tabel || rawSoal.bacaan?.tabelSoal || null;

  return {
    id: rawSoal.id || `soal-${idx + 1}`,
    nomor: rawSoal.nomor || idx + 1,
    teksSoal: teks,
    tipe: rawSoal.tipe || rawSoal.jenis || (pernyataan.length > 0 ? 'benar_salah' : 'pg'),
    tabelSoal,
    pernyataan,
    kolom: Array.isArray(rawSoal.kolom) && rawSoal.kolom.length > 0 ? rawSoal.kolom : ['Benar', 'Salah'],
    opsiJawaban,
    kunciJawaban: kunci,
    pembahasan: String(rawSoal.pembahasan || rawSoal.explanation || '').trim(),
    gambarUrls,
    materi: String(rawSoal.materi || rawSoal.bab || rawSoal.topik || rawSoal.subject || rawSoal.paket || '').trim(),
    mapel: String(rawSoal.mataPelajaran || rawSoal.mapel || rawSoal.kodeMapel || '').trim(),
    tingkatKelas: String(rawSoal.tingkatKelas || rawSoal.kelas || '').trim(),
    jenjang: String(rawSoal.jenjang || rawSoal.level || rawSoal.kategori || '').trim(),
    fase: String(rawSoal.fase || '').trim(),
    tags: Array.isArray(rawSoal.tags) ? rawSoal.tags : (typeof rawSoal.tags === 'string' ? [rawSoal.tags] : []),
  };
}
