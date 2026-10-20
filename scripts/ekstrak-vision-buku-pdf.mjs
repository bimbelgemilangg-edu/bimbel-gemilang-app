// scripts/ekstrak-vision-buku-pdf.mjs
// ============================================================
// EKSTRAKSI VISION BUKU PDF -> JSON DIALECT OWNER (21 Okt 2026).
// Menjalankan MESIN YANG SAMA dengan mode vision Impor Buku HTML
// (api/konversiModulScan) dari sisi asisten: halaman PDF dirender ke
// PNG via pdfjs+node-canvas, dikirim per kelompok kecil, keluaran AI
// (sections/blocks/ujiPemahaman ber-LaTeX rapi) dikonversi ke dialect
// JSON owner (daftar_bab/materi/latihan_soal) sehingga bisa diimpor
// satu klik lewat mode 📦 dan masuk bank soal + buku dengan rapi.
//
//   node scripts/ekstrak-vision-buku-pdf.mjs <file.pdf> [dari] [sampai] [ukuranKelompok]
//
// Resume-safe: tiap kelompok tersimpan di /tmp/viskel-<dari>.json;
// kelompok yang sudah ada dilewati. Berhenti hormat pada error kuota.
// ============================================================
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
const require = createRequire(import.meta.url);
globalThis.pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');

const [,, file, dariArg = '1', sampaiArg = '0', perKelompokArg = '4'] = process.argv;
const ENDPOINT = process.env.ENDPOINT_KONVERSI || 'https://bimbel-gemilang-app.vercel.app/api/konversiModulScan';
const perKelompok = Number(perKelompokArg) || 4;

const data = new Uint8Array(await fs.readFile(file));
const doc = await pdfjsLib.getDocument({ data, isEvalSupported: false, disableFontFace: true }).promise;
const sampai = Number(sampaiArg) || doc.numPages;
console.log(`halaman PDF: ${doc.numPages} | rentang: ${dariArg}-${sampai} | kelompok: ${perKelompok}`);

const renderPng = async (nomor) => {
  const page = await doc.getPage(nomor);
  const viewport = page.getViewport({ scale: Number(process.env.SKALA || 1.8) });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const buf = canvas.toBuffer('image/png');
  page.cleanup();
  return buf.toString('base64');
};

for (let awal = Number(dariArg); awal <= sampai; awal += perKelompok) {
  const akhir = Math.min(awal + perKelompok - 1, sampai);
  const berkas = `/tmp/viskel-${awal}.json`;
  try {
    await fs.access(berkas);
    console.log(`kelompok ${awal}-${akhir}: sudah ada, dilewati`);
    continue;
  } catch { /* belum ada */ }
  const images = [];
  for (let h = awal; h <= akhir; h += 1) images.push({ mime: 'image/png', data: await renderPng(h) });
  let jawaban = null;
  for (let coba = 0; coba < 3 && !jawaban; coba += 1) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images,
        placeholders: [],
        meta: { judul: `Gemilang Book SMP 9 Sem1 — halaman ${awal}-${akhir}`, mapel: 'Matematika', jenjang: 'SMP/MTs' },
      }),
    });
    const j = await res.json().catch(() => null);
    if (j && j.success && j.bab) { jawaban = j; break; }
    const pesan = j?.error || `HTTP ${res.status}`;
    if (/kuota|429|503|RESOURCE/i.test(pesan)) {
      console.error(`KUOTA tercapai pada kelompok ${awal}-${akhir}: ${pesan}. Berhenti hormat — ulangi perintah yang sama untuk melanjutkan.`);
      process.exit(2);
    }
    console.log(`  percobaan ${coba + 1} gagal: ${String(pesan).slice(0, 140)}`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  if (!jawaban) {
    console.error(`kelompok ${awal}-${akhir} gagal setelah 3 percobaan — dilewati (resume akan mencoba ulang).`);
    continue;
  }
  await fs.writeFile(berkas, JSON.stringify({ awal, akhir, provider: jawaban.provider, bab: jawaban.bab }));
  console.log(`kelompok ${awal}-${akhir}: OK via ${jawaban.provider} (${(jawaban.bab?.sections || []).length} seksi, ${(jawaban.bab?.ujiPemahaman || []).length} soal)`);
  await new Promise((r) => setTimeout(r, 1500));
}
await doc.destroy();
console.log('selesai. Gabungkan dengan scripts/gabung-vision-ke-json-owner.mjs');
