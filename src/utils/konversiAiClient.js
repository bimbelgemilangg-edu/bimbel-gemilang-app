// src/utils/konversiAiClient.js
// ============================================================
// KABEL DARI UI KE MESIN AI KONVERSI MODUL SCAN.
//
// SEBELUMNYA (2026-10-06 pagi) berkas ini STUB yang melempar "Mesin AI
// sudah dipensiunkan" -- padahal mesinnya di server
// (api/konversiModulScan.js) lengkap dan sehat, termasuk fallback ke
// model-model GRATIS (OpenRouter :free, Groq free tier). Akibat stub ini,
// tombol konversi AI di ImporModul selalu gagal dan modul scan hanya
// bisa masuk sebagai "Modul Asli" = PDF mentah yang berat di HP siswa
// (keluhan owner: "loading terus ... jangan kelihatan pdf mentah").
//
// SEKARANG berkas ini melakukan pekerjaan yang seharusnya:
//   1. render halaman PDF scan menjadi JPEG secukupnya (lebar 1100px,
//      kualitas 0.72) -- cukup tajam untuk dibaca model vision, cukup
//      kecil untuk tidak meledakkan body request;
//   2. mengirimnya ke /api/konversiModulScan DALAM POTONGAN <= 10 halaman
//      (server menolak > 14; desain aslinya 10 demi kuota gratis);
//   3. menggabungkan bab-bab hasil tiap potongan menjadi satu bab;
//   4. membersihkan placeholder {{GAMBAR_n}} yang tidak punya pasangan
//      URL, supaya reader TIDAK menampilkan token mentah (penyakit yang
//      sama dengan yang diperbaiki di penempatanGambar.js).
//
// Gambar figur v1: SENGAJA belum dipotong-&-unggah otomatis. Placeholder
// dibuang bersih sehingga bab terbaca rapi sebagai HTML; figur dapat
// disisipkan kemudian lewat EditorBab (perkakas yang sudah ada). Memaksa
// pipeline potongan figur malam ini berisiko menghasilkan bab yang
// setengah jadi -- lebih buruk daripada bab teks yang bersih.
// ============================================================

import { bukaPdf, renderHalamanKeCanvas, canvasKeBlob } from './modulPdf.js';

const MAKS_PER_PANGGILAN = 10;   // server menolak > 14; 10 = batas hemat kuota
const LEBAR_RENDER = 1100;       // px; di atas ini tidak menambah akurasi model
const KUALITAS_JPEG = 0.72;

// Dipertahankan agar impor lama tidak error; kunci AI hidup di sisi
// server (env Vercel), bukan di browser -- jadi keduanya sengaja kosong.
export function setKeyAi() {}
export function ambilKeyAi() { return null; }

const RE_TOKEN_GAMBAR = /\{\{GAMBAR(?:_\d+)?\}\}/g;

/**
 * Ganti placeholder {{GAMBAR_n}} dengan URL bila peta disediakan;
 * buang token (rapikan spasi) bila tidak -- reader tidak boleh
 * memperlihatkan token mentah kepada siswa.
 * @returns bab baru (tidak memutasi masukan) + jumlah token yang dibuang
 */
export function substitusiPlaceholder(bab, petaUrl = {}) {
  let dibuang = 0;
  const proses = (v) => {
    if (typeof v === 'string') {
      return v.replace(RE_TOKEN_GAMBAR, (tok) => {
        const n = /GAMBAR_(\d+)/.exec(tok)?.[1] || '1';
        const url = petaUrl[n] || petaUrl[tok];
        if (url) return url;
        dibuang += 1;
        return ' ';
      }).replace(/[ \t]{2,}/g, ' ').trim();
    }
    if (Array.isArray(v)) return v.map(proses);
    if (v && typeof v === 'object') {
      const o = {};
      for (const [k, val] of Object.entries(v)) o[k] = proses(val);
      return o;
    }
    return v;
  };
  const hasil = proses(bab || {});
  return { bab: hasil, tokenDibuang: dibuang };
}

/** Rentang halaman dipotong-potong <= MAKS_PER_PANGGILAN. Murni, teruji. */
export function potonganRentang(dari, sampai, ukuran = MAKS_PER_PANGGILAN) {
  const hasil = [];
  for (let a = Math.max(1, dari); a <= sampai; a += ukuran) {
    hasil.push([a, Math.min(sampai, a + ukuran - 1)]);
  }
  return hasil;
}

function blobKeBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('Gagal membaca blob gambar'));
    r.readAsDataURL(blob);
  });
}

/**
 * Konversi modul (File/Blob PDF) menjadi satu bab terstruktur lewat AI
 * vision di server. Dipanggil ImporModul.jsx; bentuk kembalian wajib
 * { model, bab: { sections, ujiPemahaman } }.
 */
export async function konversiModulKeBab({
  sumber, bukuId, halamanMulai, halamanSampai, meta, onProgres,
} = {}) {
  const pdf = await bukaPdf(sumber);
  const total = pdf.numPages || 1;
  const dari = Math.max(1, Math.min(halamanMulai || 1, total));
  const sampai = Math.max(dari, Math.min(halamanSampai || total, total));
  const potongan = potonganRentang(dari, sampai);

  const semuaSeksi = [];
  const semuaUji = [];
  let modelTerpakai = '';

  for (let i = 0; i < potongan.length; i += 1) {
    const [a, b] = potongan[i];
    const images = [];
    for (let n = a; n <= b; n += 1) {
      onProgres?.('render', `Merender halaman ${n}/${sampai} …`);
      const { canvas } = await renderHalamanKeCanvas(pdf, n, { maxLebar: LEBAR_RENDER });
      const blob = await canvasKeBlob(canvas, 'image/jpeg', KUALITAS_JPEG);
      images.push({ mime: 'image/jpeg', data: await blobKeBase64(blob) });
    }

    onProgres?.('ai', `AI menulis ulang halaman ${a}–${b} (${i + 1}/${potongan.length}) …`);
    const res = await fetch('/api/konversiModulScan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images,
        placeholders: [],
        meta: { ...meta, bukuId, rentang: potongan.length > 1 ? `${a}-${b}` : undefined },
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.success) {
      throw new Error(j.error || `Server menolak konversi (HTTP ${res.status})`);
    }
    modelTerpakai = `${j.provider}/${j.model}`;
    semuaSeksi.push(...(j.bab.sections || []));
    semuaUji.push(...(j.bab.ujiPemahaman || []));
  }

  const babMenyatuh = {
    judul: meta?.judul || `Bab ${meta?.nomor || ''}`.trim() || 'Bab',
    sections: semuaSeksi,
    ujiPemahaman: semuaUji,
  };
  const { bab, tokenDibuang } = substitusiPlaceholder(babMenyatuh);
  if (tokenDibuang > 0) {
    console.warn(`[konversiAi] ${tokenDibuang} placeholder gambar dibuang (figur disisipkan manual lewat EditorBab).`);
  }
  return { model: modelTerpakai, bab };
}

export default { konversiModulKeBab, substitusiPlaceholder, potonganRentang };
