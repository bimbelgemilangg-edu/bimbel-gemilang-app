// src/utils/konversiAiClient.js
// ============================================================
// MESIN KLIEN v3: SCAN -> BAB INTERAKTIF, DIPANGGIL LANGSUNG
// DARI BROWSER ADMIN (bukan lewat fungsi Vercel).
//
// Kenapa pindah ke client:
//  - Fungsi Vercel Hobby dipenggal di 60 detik (504). Panggilan
//    vision model gratis untuk 8+ halaman hampir pasti lewat
//    dari 60 detik. Dari browser tidak ada batas itu.
//  - Kunci API disimpan HANYA di browser admin (localStorage),
//    tidak dibundle dan tidak dikirim ke server kita.
//  - Daftar model diambil LIVE dari endpoint /models provider,
//    jadi slug yang sudah mati/tidak gratis tidak akan dipilih.
//
// Provider didukung (gratis):
//  - Groq      : kunci diawali "gsk_"   (cepat, kuota besar)
//  - OpenRouter: kunci diawai "sk-or-"  (model vision :free)
//
// Alur per bab:
//  1. Render halaman PDF -> JPEG 900px + potong figur -> Supabase.
//  2. Chunk <= 4 halaman -> panggil vision model langsung.
//  3. Gabungkan chunk, substitusi placeholder gambar, sanitasi.
// ============================================================
import {
    bukaPdf,
    renderHalamanKeCanvas,
    deteksiBagianDariCanvas,
  } from './modulPdf';
  import { sanitasiFirestore } from './konversiPdfBuku';
  import { uploadElearningFile } from '../services/uploadService';
  
  const MAKS_HAL_PER_PANGGILAN = 4;    // kecil = cepat = tidak kena limit waktu
  const LEBAR_RENDER_AI = 900;         // px: cukup untuk AI, hemat kuota
  const KUALITAS_JPEG = 0.7;
  const MAKS_FIGUR_PER_HALAMAN = 3;
  const TIMEOUT_PANGGILAN_MS = 300000; // 5 menit per panggilan (browser aman)
  const KEY_STORAGE = 'aiGemilangKey';
  
  const BASE_GROQ = 'https://api.groq.com/openai/v1';
  const BASE_OPENROUTER = 'https://openrouter.ai/api/v1';
  
  const buatCanvas = () => document.createElement('canvas');
  
  function canvasKeBase64Jpeg(canvas, kualitas = KUALITAS_JPEG) {
    const url = canvas.toDataURL('image/jpeg', kualitas);
    return url.slice(url.indexOf(',') + 1);
  }
  
  // ------------------------------------------------------------
  // KUNCI AI: simpan di localStorage browser admin saja.
  // Ditanya sekali lewat prompt, autodeteksi provider dari prefix.
  // ------------------------------------------------------------
  export function setKeyAi(v) {
    try { localStorage.setItem(KEY_STORAGE, String(v || '').trim()); } catch { /* abaikan */ }
  }
  
  export function ambilKeyAi() {
    let key = '';
    try { key = (localStorage.getItem(KEY_STORAGE) || '').trim(); } catch { /* abaikan */ }
    if (!key) {
      key = String(
        window.prompt(
          'Tempel kunci AI gratis sekali saja (disimpan hanya di browser ini):\n' +
          '• Groq       : diawali gsk_  (console.groq.com/keys)\n' +
          '• OpenRouter : diawali sk-or- (openrouter.ai/keys)\n\n' +
          'Kosongkan untuk membatalkan.'
        ) || ''
      ).trim();
      if (key) setKeyAi(key);
    }
    if (!key) return null;
    if (key.startsWith('gsk_')) return { provider: 'groq', key };
    if (key.startsWith('sk-or-')) return { provider: 'openrouter', key };
    // kunci tanpa prefix dikenal -> coba OpenRouter dulu (paling toleran)
    return { provider: 'openrouter', key };
  }
  
  // ------------------------------------------------------------
  // DAFTAR MODEL VISION HIDUP (diambil live, tanpa hardcode slug mati)
  // ------------------------------------------------------------
  async function daftarModelGroq(key) {
    const resp = await fetch(`${BASE_GROQ}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) throw new Error(`Groq /models HTTP ${resp.status}`);
    const data = await resp.json();
    const ids = (data.data || []).map((m) => m.id);
    const prioritas = [
      /llama-4-scout/, /llama-4-maverick/, /vision/, /llama-3\.2-90b/, /llama-3\.3/, /llama-3\.1-8b/,
    ];
    const keluar = [];
    for (const re of prioritas) {
      for (const id of ids) if (re.test(id) && !keluar.includes(id)) keluar.push(id);
    }
    // model bervision dulu kalau ada kata vision, sisanya menyusul
    return keluar.length ? keluar : ids;
  }
  
  async function daftarModelOpenRouter() {
    const resp = await fetch(`${BASE_OPENROUTER}/models`);
    if (!resp.ok) throw new Error(`OpenRouter /models HTTP ${resp.status}`);
    const data = await resp.json();
    const gratis = (data.data || []).filter((m) => {
      const pr = m.pricing || {};
      const prompt = parseFloat(pr.prompt || '1');
      const completion = parseFloat(pr.completion || '1');
      if (!(prompt === 0 && completion === 0)) return false;
      const mod = (m.architecture || {}).modality || '';
      return mod.includes('image');
    });
    gratis.sort((a, b) => (b.context_length || 0) - (a.context_length || 0));
    return gratis.map((m) => m.id);
  }
  
  async function siapkanRantaiModel(keyInfo) {
    if (keyInfo.provider === 'groq') {
      try {
        const daftar = await daftarModelGroq(keyInfo.key);
        if (daftar.length) return { ...keyInfo, daftar };
      } catch { /* jatuh ke openrouter kalau ada kunci cadangan */ }
    }
    if (keyInfo.provider === 'openrouter' || true) {
      // coba OpenRouter (daftar model gratis bervision, live)
      let key = keyInfo.key;
      if (keyInfo.provider !== 'openrouter') {
        const cadangan = ambilKeyCadangan();
        if (cadangan) key = cadangan;
      }
      try {
        const daftar = await daftarModelOpenRouter();
        if (daftar.length) return { provider: 'openrouter', key, daftar };
      } catch { /* lanjut */ }
    }
    throw new Error('Tidak bisa mengambil daftar model vision gratis. Cek kunci AI / koneksi.');
  }
  
  function ambilKeyCadangan() {
    try {
      const v = (localStorage.getItem(KEY_STORAGE + 'OpenRouter') || '').trim();
      return v || null;
    } catch { return null; }
  }
  
  // ------------------------------------------------------------
  // PANGGIL VISION LANGSUNG DARI BROWSER
  // ------------------------------------------------------------
  async function panggilVision(keyInfo, model, systemPrompt, teksUser, dataUrls) {
    const base = keyInfo.provider === 'groq' ? BASE_GROQ : BASE_OPENROUTER;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_PANGGILAN_MS);
    try {
      const resp = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keyInfo.key}`,
          ...(keyInfo.provider === 'openrouter'
            ? { 'HTTP-Referer': 'https://bimbel-gemilang-app.vercel.app', 'X-Title': 'Gemilang Buku Digital' }
            : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                ...dataUrls.map((du) => ({ type: 'image_url', image_url: { url: du } })),
                { type: 'text', text: teksUser },
              ],
            },
          ],
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(`${keyInfo.provider}/${model} HTTP ${resp.status}: ${t.slice(0, 200)}`);
      }
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timer);
    }
  }
  
  const SYSTEM_PROMPT = `Kamu adalah mesin penulis ulang modul pelajaran Indonesia (matematika TKA/TKD, IPA, dll) yang sangat teliti.
  Kamu menerima GAMBAR halaman-halaman modul hasil SCAN (berurutan) dan harus MENULIS ULANG isinya menjadi SATU bab buku digital interaktif dalam format JSON.
  
  ATURAN ISI:
  1. Tulis ulang dengan bahasa Indonesia yang rapi dan bersih. BUANG artefak scan: nomor halaman, header/footer berulang, watermark/akun sosial media, iklan, ornamen.
  2. JANGAN meringkas materi: semua definisi, sifat, rumus, contoh, dan langkah harus ikut. Angka dan simbol TIDAK BOLEH berubah.
  3. Rumus ditulis dengan LaTeX bersih:
     - Inline: $...$  contoh $x^2$, $\\frac{a}{b}$, $\\sqrt{2}$
     - Display (blok math): teks LaTeX tanpa dolar.
     - Pecahan \\frac{p}{q}; akar \\sqrt{n} atau \\sqrt[n]{x}; pangkat x^{n}; indeks x_{i}; derajat 45^\\circ; kali \\times; bagi \\div; kurang-lebih \\pm; sudut \\angle.
  4. Struktur keluaran:
     {
       "judul": "judul bab rapi seperti tercetak",
       "sections": [ { "judul": "A. Nama Subbab", "blocks": [ ... ] } ],
       "ujiPemahaman": [ ... ]
     }
  5. Tipe block yang DIIZINKAN di dalam blocks:
     - {"tipe":"p","teks":"paragraf materi..."}
     - {"tipe":"list","items":["poin 1","poin 2"]}
     - {"tipe":"math","teks":"rumus LaTeX display tanpa dolar"}
     - {"tipe":"contoh","teks":"contoh soal + langkah penyelesaian LaTeX"}
     - {"tipe":"tips","teks":"tips/catat cepat"}
     - {"tipe":"gambar","src":"{{GAMBAR_n}}","alt":"deskripsi singkat","caption":"Gambar n. keterangan"}  <-- HANYA boleh memakai placeholder dari daftar GAMBAR TERSEDIA; jika tidak ada yang cocok, JANGAN pakai blok gambar.
  6. Block apa pun BOLEH punya field "visual" interaktif (pilih yang paling cocok, jangan memaksakan):
     - Tabel:  {"tipe":"tabel","caption":"...","kepala":["Kol1","Kol2"],"baris":[["a","b"],["c","d"]]}
     - Bangun datar/ruang: {"tipe":"bangun","keterangan":"...","titik":[{"id":"A","x":0,"y":0,"label":"A"}],"sisi":[{"dari":"A","ke":"B","label":"5 cm"}],"isi":[["A","B","C","D"]]}  (koordinat 0..100, y naik ke atas)
     - Garis/grafik: {"tipe":"garis","keterangan":"...","titik":[{"x":0,"y":0,"label":"O"}]}
     - Termometer/skala: {"tipe":"termometer","satuan":"°C","data":[{"nama":"Kota A","nilai":32}]}
  7. ujiPemahaman: ekstrak SEMUA soal pemantapan yang benar-benar ada di halaman (biasanya bagian "SOAL PEMANTAPAN"), tulis ulang rapi. Tipe yang diizinkan:
     - pg:    {"tipe":"pg","level":"mudah|sedang|sulit","soal":"...","pilihan":["..."],"benar":INDEX_ANGKA,"pembahasan":"..."}
     - multi: {"tipe":"multi","level":"...","soal":"...","pilihan":["..."],"benar":[INDEX,...],"pembahasan":"..."}
     - bs:    {"tipe":"bs","level":"...","soal":"...","pernyataan":["..."],"benar":[true,false,...],"pembahasan":"..."}
     Soal bergambar wajib memakai {"gambar":{"src":"{{GAMBAR_n}}","alt":"...","caption":"..."}} dari daftar yang diberikan.
  8. KUNCI JAWABAN: ambil dari kunci/pembahasan TERCETAK. Jika kunci cetak bertentangan dengan matematika yang benar, pakai yang BENAR secara matematika dan tulis di awal pembahasan: "CATATAN: kunci cetak menulis X, namun secara matematika ...". JANGAN pernah mengarang kunci.
  9. "pembahasan" WAJIB ada untuk setiap soal, berisi langkah penyelesaian dengan LaTeX.
  10. Tabel/diagram penting tanpa placeholder gambar -> bangun sebagai "visual" sedapat mungkin; kalau tidak bisa, jelaskan dengan kata-kata di blok "p".
  11. Balas HANYA satu object JSON valid, tanpa code fence, tanpa teks pembuka/penutup.`;
  
  // Ekstrak object JSON pertama yang seimbang (tahan fence/sisa teks)
  function extractJson(text) {
    if (!text) return null;
    let t = String(text).trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = t.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < t.length; i++) {
      const c = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(t.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
  
  // ------------------------------------------------------------
  // Substitusi placeholder {{GAMBAR_n}} dengan URL Supabase asli.
  // ------------------------------------------------------------
  export function substitusiPlaceholder(bab, petaUrl) {
    const ambil = (src) => {
      const m = String(src || '').match(/\{\{GAMBAR_(\d+)\}\}/);
      if (!m) return src;
      return petaUrl[Number(m[1])] || null;
    };
  
    const bersihBlocks = (blocks) => {
      const out = [];
      for (const b of blocks || []) {
        if (!b || typeof b !== 'object') continue;
        const nb = { ...b };
        if (nb.tipe === 'gambar') {
          const url = ambil(nb.src);
          if (!url) continue;
          nb.src = url;
        }
        if (nb.visual && nb.visual.tipe === 'gambar') {
          const url = ambil(nb.visual.src);
          if (!url) delete nb.visual;
          else nb.visual = { ...nb.visual, src: url };
        }
        if (typeof nb.teks === 'string') {
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
      if (nq.tipe === 'pg' && (!Array.isArray(nq.pilihan) || nq.pilihan.length < 2 || typeof nq.benar !== 'number')) return;
      if (nq.tipe === 'multi' && (!Array.isArray(nq.pilihan) || nq.pilihan.length < 2 || !Array.isArray(nq.benar))) return;
      if (nq.tipe === 'bs' && (!Array.isArray(nq.pernyataan) || !Array.isArray(nq.benar))) return;
      if (!['pg', 'multi', 'bs'].includes(nq.tipe)) return;
      uji.push(nq);
    });
    uji.forEach((q, i) => { q.id = q.id || `u${i + 1}`; });
  
    return { ...bab, sections, ujiPemahaman: uji };
  }
  
  // Crop region (piksel canvas) -> Blob JPEG
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
  
  // Satu putaran: render + potong figur + upload untuk rentang halaman
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
  
      canvas.width = 0;
      canvas.height = 0;
    }
  
    return { images, placeholders };
  }
  
  // ------------------------------------------------------------
  // PINTU UTAMA (signatur SAMA dengan versi lama, UI tak berubah)
  // ------------------------------------------------------------
  export async function konversiModulKeBab(opts) {
    const {
      sumber,
      halamanMulai = 1,
      halamanSampai = null,
      meta = {},
      onProgres,
    } = opts;
  
    const keyInfo = ambilKeyAi();
    if (!keyInfo) throw new Error('Kunci AI tidak diisi. Klik lagi lalu tempel kunci Groq (gsk_...) atau OpenRouter (sk-or-...).');
  
    if (onProgres) onProgres('model', 'Mengambil daftar model vision gratis yang hidup...');
    const rantai = await siapkanRantaiModel(keyInfo);
    if (onProgres) onProgres('model', `Model terpilih: ${rantai.provider}/${rantai.daftar[0]}`);
  
    if (onProgres) onProgres('buka', 'Membuka modul...');
    const pdf = await bukaPdf(sumber);
    try {
      const total = pdf.numPages;
      const mulai = Math.max(1, halamanMulai);
      const sampai = Math.min(total, halamanSampai || total);
      const semuaHal = [];
      for (let h = mulai; h <= sampai; h++) semuaHal.push(h);
      if (!semuaHal.length) throw new Error('Rentang halaman kosong.');
  
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
  
        const daftarPlaceholder = placeholders.length
          ? placeholders.map((p) => `- {{GAMBAR_${p.n}}} = potongan gambar halaman ${p.halaman}${p.ket ? ` (${p.ket})` : ''}`).join('\n')
          : '- (tidak ada potongan gambar tersedia; jangan memakai blok gambar)';
  
        const infoMeta = meta && meta.judul
          ? `Judul bab target: "${meta.judul}"${meta.nomor ? ` (bab nomor ${meta.nomor})` : ''}.`
          : 'Tentukan judul bab dari isi halaman.';
  
        const teksUser = `${infoMeta}
  Ini bagian ${c + 1} dari ${chunks.length} (halaman ${halChunk[0]}-${halChunk[halChunk.length - 1]}).
  GAMBAR TERSEDIA (placeholder yang BOLEH dipakai):
  ${daftarPlaceholder}
  
  Tulis ulang SELURUH isi halaman-halaman ini menjadi satu object JSON bab sesuai aturan. Kalau ini bagian lanjutan, tetap keluarkan object dengan judul bab yang sama.`;
  
        const dataUrls = images.map((im) => `data:${im.mime || 'image/jpeg'};base64,${im.data}`);
  
        let babChunk = null;
        let lastErr = null;
        for (const model of rantai.daftar.slice(0, 4)) {
          try {
            if (onProgres) onProgres('ai', `AI menulis ulang bagian ${c + 1}/${chunks.length} (${rantai.provider}/${model})...`);
            const teks = await panggilVision(rantai, model, SYSTEM_PROMPT, teksUser, dataUrls);
            const bab = extractJson(teks);
            if (!bab || !Array.isArray(bab.sections) || bab.sections.length === 0) {
              throw new Error('Hasil bukan JSON bab valid.');
            }
            babChunk = substitusiPlaceholder(bab, Object.fromEntries(placeholders.map((p) => [p.n, p.url])));
            infoModel = `${rantai.provider}/${model}`;
            break;
          } catch (e) {
            lastErr = e;
            // model mati/limit -> coba model berikutnya dalam rantai
          }
        }
        if (!babChunk) throw new Error(lastErr ? lastErr.message : 'AI tidak menghasilkan keluaran.');
  
        gabungSections.push(...babChunk.sections);
        gabungUji.push(...babChunk.ujiPemahaman);
      }
  
      if (!gabungSections.some((s) => Array.isArray(s.blocks) && s.blocks.length > 0)) {
        throw new Error('Hasil AI tidak menghasilkan seksi materi yang valid.');
      }
  
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