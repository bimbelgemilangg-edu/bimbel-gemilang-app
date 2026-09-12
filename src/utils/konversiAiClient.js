// src/utils/konversiAiClient.js
// ============================================================
// MESIN KLIEN: SCAN -> BAB INTERAKTIF (pasangan api/konversiModulScan)
//
// Alur satu panggilan per bab:
//   1. Buka PDF modul (File baru atau pdfUrl yang sudah tersimpan).
//   2. Tiap halaman: render -> gambar JPEG untuk AI, sekaligus
//      deteksi region figur (diagram/tabel/foto) -> potong HD ->
//      upload ke Supabase -> jadi placeholder {{GAMBAR_n}}.
//   3. Kirim gambar halaman + daftar placeholder ke API Vercel
//      (Groq -> OpenRouter -> Mistral, otomatis).
//   4. Rapikan hasil: substitusi placeholder dengan URL asli,
//      buang blok/soal cacat, beri id, sanitasi Firestore.
//   5. Kembalikan bab siap simpan (tipe 'terstruktur').
//
// Semua gagal-di-satu-tempat tidak menjatuhkan alur: figur yang
// gagal potong cukup tidak jadi placeholder; halaman tetap dikirim.
// ============================================================
import {
    bukaPdf,
    renderHalamanKeCanvas,
    deteksiBagianDariCanvas,
  } from './modulPdf';
  import { sanitasiFirestore } from './konversiPdfBuku';
  import { uploadElearningFile } from '../services/uploadService';
  
  const MAKS_HAL_PER_PANGGILAN = 10;   // batas aman memori tab + body request
  const LEBAR_RENDER_AI = 900;         // px: cukup tajam untuk AI, hemat memori
  const KUALITAS_JPEG = 0.72;
  const MAKS_FIGUR_PER_HALAMAN = 4;    // biar upload tidak bengkak
  
  const buatCanvas = () => document.createElement('canvas');
  
  function canvasKeBase64Jpeg(canvas, kualitas = KUALITAS_JPEG) {
    const url = canvas.toDataURL('image/jpeg', kualitas);
    return url.slice(url.indexOf(',') + 1);
  }
  
  // ------------------------------------------------------------
  // Substitusi placeholder {{GAMBAR_n}} dengan URL Supabase asli.
  // Blok/field yang placeholder-nya tidak tersedia -> dibuang.
  // ------------------------------------------------------------
  export function substitusiPlaceholder(bab, petaUrl) {
    const ambil = (src) => {
      const m = String(src || '').match(/\{\{GAMBAR_(\d+)\}\}/);
      if (!m) return src;               // bukan placeholder: biarkan
      return petaUrl[Number(m[1])] || null;
    };
  
    const bersihBlocks = (blocks) => {
      const out = [];
      for (const b of blocks || []) {
        if (!b || typeof b !== 'object') continue;
        const nb = { ...b };
        if (nb.tipe === 'gambar') {
          const url = ambil(nb.src);
          if (!url) continue;          // figur tidak tersedia -> buang blok
          nb.src = url;
        }
        if (nb.visual && nb.visual.tipe === 'gambar') {
          const url = ambil(nb.visual.src);
          if (!url) delete nb.visual;
          else nb.visual = { ...nb.visual, src: url };
        }
        if (typeof nb.teks === 'string') {
          // token placeholder nyasar di dalam teks -> hapus tokennya
          nb.teks = nb.teks.replace(/\{\{GAMBAR_\d+\}\}/g, '').replace(/\s{2,}/g, ' ').trim();
        }
        out.push(nb);
      }
      return out;
    };
  
    const sections = (bab.sections || [])
      .map((s, i) => ({
        ...s,
        id: s.id || `sek-${i + 1}`,
        judul: s.judul || `Bagian ${i + 1}`,
        blocks: bersihBlocks(s.blocks),
      }))
      .filter((s) => (s.blocks || []).length > 0);
  
    const uji = [];
    (bab.ujiPemahaman || []).forEach((q) => {
      if (!q || typeof q !== 'object' || !q.soal) return;
      const nq = { ...q };
      if (nq.gambar) {
        const url = ambil(nq.gambar.src);
        if (url) nq.gambar = { ...nq.gambar, src: url };
        else delete nq.gambar;
      }
      if (nq.visual && nq.visual.tipe === 'gambar') {
        const url = ambil(nq.visual.src);
        if (url) nq.visual = { ...nq.visual, src: url };
        else delete nq.visual;
      }
      if (typeof nq.soal === 'string') {
        nq.soal = nq.soal.replace(/\{\{GAMBAR_\d+\}\}/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }
      if (!nq.pembahasan) nq.pembahasan = 'Pembahasan belum tersedia.';
      // buang soal tanpa struktur jawaban yang valid
      if (nq.tipe === 'pg' && (!Array.isArray(nq.pilihan) || nq.pilihan.length < 2 || typeof nq.benar !== 'number')) return;
      if (nq.tipe === 'multi' && (!Array.isArray(nq.pilihan) || nq.pilihan.length < 2 || !Array.isArray(nq.benar))) return;
      if (nq.tipe === 'bs' && (!Array.isArray(nq.pernyataan) || !Array.isArray(nq.benar))) return;
      if (!['pg', 'multi', 'bs'].includes(nq.tipe)) return;
      uji.push(nq);
    });
    uji.forEach((q, i) => { q.id = q.id || `u${i + 1}`; });
  
    return { ...bab, sections, ujiPemahaman: uji };
  }
  
  // Crop region (piksel canvas) -> Blob JPEG, tanpa render ulang PDF
  function cropCanvasKeBlob(canvas, r) {
    return new Promise((resolve) => {
      try {
        const out = buatCanvas();
        out.width = Math.max(1, Math.round(r.w));
        out.height = Math.max(1, Math.round(r.h));
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(canvas, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
        out.toBlob((b) => resolve(b && b.size > 500 ? b : null), 'image/jpeg', 0.85);
      } catch { resolve(null); }
    });
  }
  
  // ------------------------------------------------------------
  // Satu putaran: render + potong figur + upload untuk rentang halaman
  // ------------------------------------------------------------
  async function siapkanHalaman(pdf, daftarHal, onProgres) {
    const images = [];
    const placeholders = [];
    let n = 1;
  
    for (let i = 0; i < daftarHal.length; i++) {
      const hal = daftarHal[i];
      if (onProgres) onProgres('render', `Merender halaman ${hal} (${i + 1}/${daftarHal.length})...`);
      const { canvas } = await renderHalamanKeCanvas(pdf, hal, {
        maxLebar: LEBAR_RENDER_AI,
        maxSkala: 2.5,
      });
      images.push({ data: canvasKeBase64Jpeg(canvas), mime: 'image/jpeg' });
  
      // deteksi figur -> potong HD -> upload Supabase -> placeholder
      try {
        const region = deteksiBagianDariCanvas(canvas, {})
          .filter((r) => r.jenis !== 'mirip-teks')
          .slice(0, MAKS_FIGUR_PER_HALAMAN);
        for (const r of region) {
          try {
            if (onProgres) onProgres('figur', `Memotong figur halaman ${hal}...`);
            const blob = await cropCanvasKeBlob(canvas, r);
            if (!blob) continue;
            const filePot = new File([blob], `hal${hal}_fig${n}.jpg`, { type: 'image/jpeg' });
            const up = await uploadElearningFile(filePot, 'materi', {
              kompres: false,
              contentType: 'image/jpeg',
            });
            if (!up.success) continue;
            placeholders.push({ n, halaman: hal, ket: r.jenis, url: up.downloadURL });
            n += 1;
          } catch { /* satu figur gagal bukan bencana */ }
        }
      } catch { /* deteksi gagal -> halaman tetap dikirim tanpa placeholder */ }
  
      // bebaskan memori canvas sebelum halaman berikutnya (anti tab crash)
      canvas.width = 0;
      canvas.height = 0;
    }
  
    return { images, placeholders };
  }
  
  // ------------------------------------------------------------
  // PINTU UTAMA: konversi satu bab (rentang halaman) jadi bab JSON
  // siap simpan. Bab > 10 halaman dipecah otomatis & digabung.
  // ------------------------------------------------------------
  export async function konversiModulKeBab(opts) {
    const {
      sumber,              // File | url pdf
      halamanMulai = 1,
      halamanSampai = null,
      meta = {},           // { judul, nomor, urutan }
      onProgres,
    } = opts;
  
    if (onProgres) onProgres('buka', 'Membuka modul...');
    const pdf = await bukaPdf(sumber);
    try {
      const total = pdf.numPages;
      const mulai = Math.max(1, halamanMulai);
      const sampai = Math.min(total, halamanSampai || total);
      const semuaHal = [];
      for (let h = mulai; h <= sampai; h++) semuaHal.push(h);
      if (!semuaHal.length) throw new Error('Rentang halaman kosong.');
  
      // pecah jadi chunk <= 10 halaman
      const chunks = [];
      for (let i = 0; i < semuaHal.length; i += MAKS_HAL_PER_PANGGILAN) {
        chunks.push(semuaHal.slice(i, i + MAKS_HAL_PER_PANGGILAN));
      }
  
      const gabungSections = [];
      const gabungUji = [];
      let infoModel = '';
  
      for (let c = 0; c < chunks.length; c++) {
        const halChunk = chunks[c];
        if (onProgres) onProgres('siapkan', `Menyiapkan halaman ${halChunk[0]}–${halChunk[halChunk.length - 1]} (render + potong figur)...`);
        const { images, placeholders } = await siapkanHalaman(pdf, halChunk, onProgres);
  
        if (onProgres) onProgres('ai', `AI menulis ulang bagian ${c + 1}/${chunks.length}... (bisa 20-60 detik)`);
        const resp = await fetch('/api/konversiModulScan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images, placeholders, meta }),
        });
        const hasil = await resp.json().catch(() => ({}));
        if (!resp.ok || !hasil.success) {
          throw new Error(hasil.error || `API gagal (HTTP ${resp.status}).`);
        }
        infoModel = `${hasil.provider}/${hasil.model}`;
  
        const petaUrl = {};
        for (const p of placeholders) petaUrl[p.n] = p.url;
        const babChunk = substitusiPlaceholder(hasil.bab, petaUrl);
        gabungSections.push(...babChunk.sections);
        gabungUji.push(...babChunk.ujiPemahaman);
      }
  
      if (!Array.isArray(gabungSections) || !gabungSections.some((s) => Array.isArray(s.blocks) && s.blocks.length > 0)) {
        throw new Error('Hasil AI tidak menghasilkan seksi materi yang valid.');
      }
  
      // rapikan id akhir
      const babFinal = {
        judul: meta.judul || gabungSections[0]?.judul || 'Bab',
        sections: gabungSections.map((s, i) => ({ ...s, id: s.id || `sek-${i + 1}` })),
        ujiPemahaman: gabungUji.map((q, i) => ({ ...q, id: `u${i + 1}` })),
      };
  
      return {
        bab: {
          ...babFinal,
          sections: sanitasiFirestore(babFinal.sections),
          ujiPemahaman: sanitasiFirestore(babFinal.ujiPemahaman),
        },
        model: infoModel,
        jumlahHalaman: semuaHal.length,
      };
    } finally {
      try { await pdf.destroy(); } catch { /* abaikan */ }
    }
  }