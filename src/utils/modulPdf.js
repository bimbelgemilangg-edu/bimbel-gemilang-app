// src/utils/modulPdf.js
// ============================================================
// TOOLKIT MODUL PDF -- mesin di balik "Impor Modul" & reader siswa.
//
// LATAR BELAKANG (kenapa file ini ada):
//   Hampir semua modul bimbel yang dipakai admin adalah PDF HASIL
//   SCAN/PAGE-IMAGE (1 halaman = 1 gambar raster 1720x2437, TANPA
//   lapisan teks). Mesin konversi teks (konversiPdfBuku.js) tidak
//   bisa membaca yang seperti itu -> selama ini admin dipaksa upload
//   gambar satu-satu dan paste JSON manual. Tidak efisien.
//
//   Strategi baru: modul scan TIDAK dipaksa jadi teks. Modulnya
//   disimpan apa adanya (fidelity 100%: rumus, gambar, tabel, warna
//   semua utuh & HD), lalu siswa membacanya di dalam app dan
//   mengerjakan Uji Pemahaman interaktif di atasnya. Gambar untuk
//   soal tidak di-upload manual lagi: DIPOTONG langsung dari halaman
//   modul (lihat komponen PemotongGambar).
//
// File ini berisi semua kemampuan PDF yang dibutuhkan:
//   bukaPdf            -> buka dari File / Blob / ArrayBuffer / URL
//   infoModul          -> jumlah halaman, ada lapisan teks?, scan?
//   renderHalaman      -> halaman -> canvas (utk reader & pratinjau)
//   potongRegionKeBlob -> potong sebagian halaman jadi gambar (JPEG/PNG)
//   thumbnailHalaman   -> pratinjau kecil (data URL)
//   deteksiRegionGambar-> usulan kotak gambar/diagram otomatis
//   teksHalaman        -> teks + posisi (hanya PDF berlapis teks)
//   deteksiBabDalamPdf -> pecah 1 PDF jadi banyak bab (penanda "BAB n")
//   judulDariNamaFile  -> "13 Teorema Phytagoras @my99dreams.pdf"
//                         => { nomor: 13, judul: "Teorema Phytagoras" }
//   hashFile           -> sidik jari file (anti upload ganda)
//
// Semua fungsi bersifat DEFENSIF: gagal di satu bagian tidak
// menjatuhkan keseluruhan alur (penting karena jalan di HP admin).
// ============================================================

let _lib = null;

// Untuk pengujian di Node (atau kalau app sudah memuat pdf.js lebih dulu):
// suntikkan instance-nya agar tidak perlu dynamic import.
export function suntikPdfjs(lib) { if (lib) _lib = lib; return _lib; }

// ------------------------------------------------------------
// MUAT pdf.js (lazy, sekali saja; pola sama seperti konversiPdfBuku.js)
// ------------------------------------------------------------
export async function muatPdfjs() {
  if (_lib) return _lib;
  const lib = await import('pdfjs-dist/build/pdf');
  try {
    const worker = await import('pdfjs-dist/build/pdf.worker.min.js?url');
    lib.GlobalWorkerOptions.workerSrc = worker.default;
  } catch {
    // Fallback: biarkan pdf.js memakai fake worker (lebih lambat, tetap jalan)
    try { lib.GlobalWorkerOptions.workerSrc = ''; } catch { /* abaikan */ }
  }
  _lib = lib;
  return lib;
}

const bisaCanvas = () => typeof document !== 'undefined' && !!document.createElement;
const buatCanvas = () => (bisaCanvas() ? document.createElement('canvas') : null);

// ------------------------------------------------------------
// BUKA PDF dari berbagai sumber
//   File / Blob / ArrayBuffer / Uint8Array / string URL
// CATATAN: pdf.js mengambil alih (transfer) buffer-nya, jadi kalau
// kamu butuh byte-nya lagi nanti, simpan sendiri salinannya.
// ------------------------------------------------------------
export async function ambilByte(sumber) {
  if (typeof sumber === 'string') {
    const res = await fetch(sumber);
    if (!res.ok) throw new Error(`Gagal mengunduh PDF (HTTP ${res.status}).`);
    return new Uint8Array(await res.arrayBuffer());
  }
  if (sumber instanceof Uint8Array) return sumber;
  if (sumber instanceof ArrayBuffer) return new Uint8Array(sumber);
  if (sumber && typeof sumber.arrayBuffer === 'function') return new Uint8Array(await sumber.arrayBuffer());
  throw new Error('Sumber PDF tidak dikenal.');
}

export async function bukaPdf(sumber, onProgresUnduh) {
  const lib = await muatPdfjs();
  const data = await ambilByte(sumber);
  const task = lib.getDocument({ data, isEvalSupported: false, disableAutoFetch: false });
  if (onProgresUnduh && task && 'onProgress' in task) {
    task.onProgress = (p) => { try { onProgresUnduh(p.loaded, p.total || 0); } catch { /* abaikan */ } };
  }
  return await task.promise;
}

// ------------------------------------------------------------
// INFO MODUL -- dipakai wizard impor untuk memutuskan mode:
//   ada lapisan teks  -> boleh "Konversi jadi bab terstruktur"
//   hasil scan        -> wajib "Modul Asli (PDF)"
// ------------------------------------------------------------
export async function infoModul(pdf, opsi = {}) {
  const jumlahHalaman = pdf.numPages;
  const sampel = Math.max(1, Math.min(jumlahHalaman, opsi.halamanSampel || 3));
  const page1 = await pdf.getPage(1);
  const vp = page1.getViewport({ scale: 1 });

  let karakter = 0;
  let gambarTotal = 0;
  let gambarPenuhHalaman = 0;

  for (let i = 1; i <= sampel; i++) {
    const p = await pdf.getPage(i);
    try {
      const tc = await p.getTextContent();
      karakter += (tc.items || []).reduce((a, it) => a + String(it.str || '').trim().length, 0);
    } catch { /* halaman rusak dilewati */ }
    try {
      const lib = await muatPdfjs();
      const ops = await p.getOperatorList();
      for (let k = 0; k < ops.fnArray.length; k++) {
        if (ops.fnArray[k] !== lib.OPS.paintImageXObject) continue;
        gambarTotal++;
        const o = await ambilObjGambar(p, ops.argsArray[k][0], 2500);
        const w = o?.width || 0;
        const h = o?.height || 0;
        // Halaman modul scan sering berukuran sama persis dengan gambarnya
        // (mis. 1720x2437 pt), jadi ambangnya 0.9 -- bukan 1.1.
        if (w >= vp.width * 0.9 && h >= vp.height * 0.9) gambarPenuhHalaman++;
      }
    } catch { /* tanpa gambar bukan masalah */ }
    try { await p.cleanup(); } catch { /* abaikan */ }
  }

  const karakterPerHalaman = Math.round(karakter / sampel);
  const adaLapisanTeks = karakterPerHalaman >= (opsi.ambangTeks || 120);
  const hasilPindai = !adaLapisanTeks && gambarPenuhHalaman > 0;

  return {
    jumlahHalaman,
    lebar: Math.round(vp.width),
    tinggi: Math.round(vp.height),
    karakterPerHalaman,
    gambarPerHalaman: +(gambarTotal / sampel).toFixed(1),
    adaLapisanTeks,
    hasilPindai,
    // Saran default: scan -> tampilkan apa adanya; ada teks -> boleh dikonversi
    modeDisarankan: adaLapisanTeks ? 'konversi' : 'pdf',
  };
}

// Ambil objek gambar dari pdf.js (bisa async lewat callback) -- aman timeout.
async function ambilObjGambar(page, name, timeoutMs = 4000) {
  if (!name) return null;
  try { if (page.objs && page.objs.has(name)) return page.objs.get(name); } catch { /* lanjut */ }
  try { if (page.commonObjs && page.commonObjs.has(name)) return page.commonObjs.get(name); } catch { /* lanjut */ }
  return await new Promise((resolve) => {
    let selesai = false;
    const beres = (v) => { if (!selesai) { selesai = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => beres(null), timeoutMs);
    try { page.objs.get(name, (o) => beres(o)); } catch { beres(null); }
  });
}

// ------------------------------------------------------------
// RENDER HALAMAN -> CANVAS
// rect/komponen lain memakai satuan PDF dengan y DARI ATAS.
// ------------------------------------------------------------
export async function renderHalamanKeCanvas(pdf, nomor, opsi = {}) {
  if (!bisaCanvas()) throw new Error('Canvas tidak tersedia di lingkungan ini.');
  const page = await pdf.getPage(nomor);
  const vp1 = page.getViewport({ scale: 1 });
  const maxLebar = opsi.maxLebar || 1400;
  const maxSkala = opsi.maxSkala || 3;
  let skala = opsi.scale || Math.min(maxLebar / Math.max(1, vp1.width), maxSkala);
  if (!isFinite(skala) || skala <= 0) skala = 1;
  const viewport = page.getViewport({ scale: skala });

  const canvas = opsi.canvas || buatCanvas();
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext('2d', { alpha: false });
  if (opsi.latar !== null) {
    ctx.fillStyle = opsi.latar || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { canvas, skala, lebar: canvas.width, tinggi: canvas.height, viewport };
}

export function canvasKeBlob(canvas, format = 'image/jpeg', kualitas = 0.88) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => {
        if (b && b.size > 0) { resolve(b); return; }
        // Fallback: dataURL -> Blob manual
        try {
          const url = canvas.toDataURL(format, kualitas);
          const bin = atob(url.split(',')[1]);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: format }));
        } catch (e2) { reject(e2); }
      }, format, kualitas);
    } catch (e) { reject(e); }
  });
}

// ------------------------------------------------------------
// POTONG SEBAGIAN HALAMAN -> GAMBAR
// rect: { x, y, w, h } dalam SATUAN PDF, y dihitung dari ATAS halaman.
// Inilah pengganti "upload gambar manual": gambar diambil dari modulnya.
// ------------------------------------------------------------
export async function potongRegionKeBlob(pdf, nomor, rect, opsi = {}) {
  const r = normRect(rect);
  if (r.w <= 2 || r.h <= 2) throw new Error('Area potongan terlalu kecil.');
  const maxLebar = opsi.maxLebar || 1400;
  // Render dulu cukup besar supaya hasil potongan tajam (HD), tapi tetap
  // dibatasi agar tidak menghabiskan memori HP (modul scan bisa 1720x2437 pt).
  const page = await pdf.getPage(nomor);
  const lebarPt = page.getViewport({ scale: 1 }).width || 595;
  const batasPiksel = opsi.batasPiksel || 2600;             // lebar kanvas maksimum
  const skalaIngin = Math.max(1.2, (maxLebar * 1.15) / Math.max(1, r.w));
  const targetSkala = Math.min(opsi.maxSkala || 3.2, skalaIngin, batasPiksel / lebarPt);
  const { canvas: src, skala } = await renderHalamanKeCanvas(pdf, nomor, { scale: targetSkala });

  const px = (v) => Math.max(0, Math.round(v * skala));
  const lebarHal = src.width / skala;
  const tinggiHal = src.height / skala;
  const x = Math.min(r.x, Math.max(0, lebarHal - 1));
  const y = Math.min(r.y, Math.max(0, tinggiHal - 1));
  const w = Math.max(1, Math.min(r.w, lebarHal - x));
  const h = Math.max(1, Math.min(r.h, tinggiHal - y));

  let lebarKeluar = px(w);
  let tinggiKeluar = px(h);
  if (lebarKeluar > maxLebar) {
    const rasio = maxLebar / lebarKeluar;
    lebarKeluar = Math.round(lebarKeluar * rasio);
    tinggiKeluar = Math.round(tinggiKeluar * rasio);
  }

  const keluar = buatCanvas();
  keluar.width = Math.max(1, lebarKeluar);
  keluar.height = Math.max(1, tinggiKeluar);
  const ctx = keluar.getContext('2d');
  ctx.fillStyle = opsi.latar || '#ffffff';
  ctx.fillRect(0, 0, keluar.width, keluar.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, px(x), px(y), px(w), px(h), 0, 0, keluar.width, keluar.height);

  const format = opsi.format || 'image/jpeg';
  const blob = await canvasKeBlob(keluar, format, opsi.kualitas ?? 0.88);
  return { blob, lebar: keluar.width, tinggi: keluar.height, format, rect: { x, y, w, h } };
}

function normRect(rect) {
  const r = rect || {};
  let x = Number(r.x) || 0;
  let y = Number(r.y) || 0;
  let w = Number(r.w ?? r.width) || 0;
  let h = Number(r.h ?? r.height) || 0;
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  return { x, y, w, h };
}
export { normRect as rapikanRect };

// ------------------------------------------------------------
// THUMBNAIL HALAMAN -> data URL (pratinjau di wizard & manajer)
// ------------------------------------------------------------
export async function thumbnailHalaman(pdf, nomor, lebar = 200, kualitas = 0.7) {
  const { canvas } = await renderHalamanKeCanvas(pdf, nomor, { maxLebar: lebar, maxSkala: 1.2 });
  try { return canvas.toDataURL('image/jpeg', kualitas); } catch { return ''; }
}

// ------------------------------------------------------------
// TEKS + POSISI (hanya berguna untuk PDF yang punya lapisan teks)
// Mengembalikan baris terurut baca (sadar kolom) + kotak tiap baris.
// ------------------------------------------------------------
export async function teksHalaman(pdf, nomor) {
  const lib = await muatPdfjs();
  const page = await pdf.getPage(nomor);
  const vp1 = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const styles = tc.styles || {};

  const butir = [];
  for (const it of tc.items || []) {
    const s = String(it.str || '');
    if (!s.trim()) continue;
    const m = lib.Util.transform(viewport.transform, it.transform);
    const ukuran = Math.hypot(it.transform[2], it.transform[3]) || Math.abs(it.height) || 10;
    const gaya = styles[it.fontName] || {};
    const keluarga = String(gaya.fontFamily || '');
    butir.push({
      teks: s,
      x: m[4],
      y: m[5] - ukuran * 0.82,           // y atas (viewport: y turun ke bawah)
      w: Math.max(1, (it.width || s.length * ukuran * 0.5)),
      h: ukuran,
      ukuran,
      tebal: /bold|black|heavy/i.test(keluarga),
      miring: /italic|oblique/i.test(keluarga),
    });
  }

  // Deteksi kolom: cari "selokan" vertikal lebar yang bebas teks.
  const kolom = deteksiKolom(butir, vp1.width);
  const baris = [];
  for (const idxKolom of kolom) {
    const isi = idxKolom.map((i) => butir[i]);
    isi.sort((a, b) => a.y - b.y || a.x - b.x);
    let cur = null;
    for (const b of isi) {
      if (!cur || Math.abs(b.y - cur.y) > Math.max(2.2, b.h * 0.55)) {
        if (cur) baris.push(cur);
        cur = { y: b.y, x: b.x, h: b.h, bagian: [{ ...b }], kolom: idxKolom[0] };
      } else {
        cur.bagian.push({ ...b });
        cur.h = Math.max(cur.h, b.h);
      }
    }
    if (cur) baris.push(cur);
  }
  baris.sort((a, b) => (a.kolom - b.kolom) || (a.y - b.y));

  return baris.map((b) => {
    b.bagian.sort((p, q) => p.x - q.x);
    let teks = '';
    let xAkhir = null;
    for (const p of b.bagian) {
      if (xAkhir !== null && p.x - xAkhir > p.ukuran * 0.35) teks += ' ';
      teks += p.teks;
      xAkhir = p.x + p.w;
    }
    const x0 = b.bagian[0]?.x ?? 0;
    const x1 = Math.max(...b.bagian.map((p) => p.x + p.w), x0 + 1);
    return {
      teks: teks.replace(/\s+/g, ' ').trim(),
      x: x0,
      y: b.y,
      w: x1 - x0,
      h: b.h,
      ukuran: +(b.bagian.reduce((a, p) => a + p.ukuran, 0) / Math.max(1, b.bagian.length)).toFixed(2),
      tebal: b.bagian.filter((p) => p.tebal).length >= Math.ceil(b.bagian.length / 2),
      butir: b.bagian.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
    };
  }).filter((b) => b.teks);
}

function deteksiKolom(butir, lebarHalaman) {
  if (!butir.length) return [];
  const indeks = butir.map((_, i) => i);
  if (lebarHalaman < 300) return [indeks];
  // histogram sumbu-x tengah
  const petak = 40;
  const lebarPetak = lebarHalaman / petak;
  const isi = new Array(petak).fill(0);
  for (const b of butir) {
    const t = Math.min(petak - 1, Math.max(0, Math.floor((b.x + b.w / 2) / lebarPetak)));
    isi[t]++;
  }
  // cari selokan kosong yang lebar di tengah halaman
  let terbaik = null;
  let kosong = 0;
  let mulai = -1;
  for (let i = 1; i < petak - 1; i++) {
    if (isi[i] === 0) { if (kosong === 0) mulai = i; kosong++; }
    else {
      if (kosong >= 3) {
        const tengah = (mulai + kosong / 2) * lebarPetak;
        const skor = kosong * Math.min(tengah, lebarHalaman - tengah);
        if (!terbaik || skor > terbaik.skor) terbaik = { skor, x: tengah };
      }
      kosong = 0;
    }
  }
  if (!terbaik) return [indeks];
  const kiri = indeks.filter((i) => butir[i].x + butir[i].w / 2 < terbaik.x);
  const kanan = indeks.filter((i) => butir[i].x + butir[i].w / 2 >= terbaik.x);
  if (!kiri.length || !kanan.length) return [indeks];
  return [kiri, kanan];
}

// ------------------------------------------------------------
// DETEKSI REGION GAMBAR TERSEMAT (usulan otomatis)
// Hanya untuk PDF yang menyimpan gambar sebagai objek raster
// (photo/scan/screenshot). Kotak posisi dihitung dari CTM saat
// gambar dilukis, lalu disaring: terlalu kecil = abaikan,
// menutupi hampir seluruh halaman = itu latar/hasil scan.
// Untuk diagram VEKTOR pakai deteksiBagianHalaman() di bawah.
// ------------------------------------------------------------
export async function deteksiRegionGambar(pdf, nomor, opsi = {}) {
  const lib = await muatPdfjs();
  const OPS = lib.OPS;
  const page = await pdf.getPage(nomor);
  const vp = page.getViewport({ scale: 1 });
  const ops = await page.getOperatorList();

  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const kotak = [];

  for (let k = 0; k < ops.fnArray.length; k++) {
    const fn = ops.fnArray[k];
    const args = ops.argsArray[k] || [];
    if (fn === OPS.save) { stack.push(ctm.slice()); continue; }
    if (fn === OPS.restore) { ctm = stack.pop() || [1, 0, 0, 1, 0, 0]; continue; }
    if (fn === OPS.transform) { try { ctm = lib.Util.transform(ctm, args); } catch { /* abaikan */ } continue; }
    if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const r = unitSquareKeKotak(ctm, vp.height);
      if (r.w > 12 && r.h > 12) kotak.push(r);
    }
  }

  const luasHalaman = vp.width * vp.height;
  const pad = opsi.pad ?? 3;
  const minLuas = opsi.minLuas ?? 1200;
  const out = [];
  for (const r of kotak) {
    const x = clamp(r.x, 0, vp.width);
    const y = clamp(r.y, 0, vp.height);
    const w = clamp(r.x + r.w, 0, vp.width) - x;
    const h = clamp(r.y + r.h, 0, vp.height) - y;
    if (w * h < minLuas) continue;
    if (w * h > luasHalaman * (opsi.maxRasioHalaman ?? 0.9)) continue; // gambar full-page = latar
    out.push({ x: Math.max(0, x - pad), y: Math.max(0, y - pad), w: w + pad * 2, h: h + pad * 2, jenis: 'gambar' });
  }
  return gabungKotak(out, opsi.jarakGabung ?? 8)
    .filter((r) => r.w * r.h >= minLuas && r.w * r.h <= luasHalaman * (opsi.maxRasioHalaman ?? 0.9))
    .map((r, i) => ({ ...r, id: `rg${nomor}-${i + 1}`, halaman: nomor }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Gambar di PDF dilukis ke "unit square" (0,0)-(1,1) lalu diubah CTM.
function unitSquareKeKotak(m, tinggiHalaman) {
  const titik = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [
    m[0] * x + m[2] * y + m[4],
    m[1] * x + m[3] * y + m[5],
  ]);
  const xs = titik.map((t) => t[0]);
  const ys = titik.map((t) => t[1]);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  // PDF: y naik ke atas -> ubah ke y dari atas
  return {
    x: Math.min(...xs),
    y: tinggiHalaman - maxY,
    w: Math.max(...xs) - Math.min(...xs),
    h: maxY - minY,
  };
}

// ------------------------------------------------------------
// DETEKSI BAGIAN HALAMAN (murni piksel -- bisa diuji tanpa browser)
// ------------------------------------------------------------
// Inilah otak "tidak perlu upload gambar manual": halaman modul
// (scan maupun vektor) dirender jadi piksel, lalu sistem mencari
// BLOK-BLOK VISUAL yang dipisahkan ruang putih: gambar, diagram,
// tabel, rumus besar, contoh soal berbingkai. Admin tinggal ketuk
// salah satu usulan -> terpotong -> terupload -> terpasang.
//
// Masukan : { data, width, height }  (RGBA, apa adanya dari canvas)
// Keluaran: [{ x, y, w, h, kerapatan, jenis }] dalam SATUAN PIKSEL
//           masukan (kalikan `rasio` untuk dapat satuan PDF).
// ------------------------------------------------------------
export function deteksiBagianHalaman(piksel, opsi = {}) {
  const W = piksel?.width || 0;
  const H = piksel?.height || 0;
  if (!W || !H || !piksel.data) return [];

  const sel = Math.max(2, Math.round(opsi.sel || Math.max(3, Math.round(Math.min(W, H) / 220))));
  const ambang = opsi.ambang ?? 214;         // lebih gelap dari ini = tinta
  const minTintaSel = opsi.minTintaSel ?? 0.045; // 4,5% piksel sel = sel bertinta
  const gw = Math.floor(W / sel);
  const gh = Math.floor(H / sel);
  if (gw < 4 || gh < 4) return [];

  // 1) masker tinta per sel
  const data = piksel.data;
  const mask = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      let gelap = 0, total = 0;
      for (let y = gy * sel; y < Math.min(H, (gy + 1) * sel); y += 1) {
        const row = y * W * 4;
        for (let x = gx * sel; x < Math.min(W, (gx + 1) * sel); x += 1) {
          const i = row + x * 4;
          const a = data[i + 3];
          if (a < 40) continue;
          const abu = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          total++;
          if (abu < ambang) gelap++;
        }
      }
      if (total > 0 && gelap / total >= minTintaSel) mask[gy * gw + gx] = 1;
    }
  }

  // 2) buang sel di dalam kotak teks (kalau PDF punya lapisan teks)
  const rasio = opsi.rasio || 1;             // satuan PDF -> piksel
  const kotakTeks = (opsi.kotakTeks || []).map((t) => ({
    x0: Math.floor((t.x * rasio) / sel) - 1,
    y0: Math.floor((t.y * rasio) / sel) - 1,
    x1: Math.ceil(((t.x + t.w) * rasio) / sel) + 1,
    y1: Math.ceil(((t.y + t.h) * rasio) / sel) + 1,
  }));
  if (kotakTeks.length) {
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        if (!mask[gy * gw + gx]) continue;
        for (const t of kotakTeks) {
          if (gx >= t.x0 && gx <= t.x1 && gy >= t.y0 && gy <= t.y1) { mask[gy * gw + gx] = 0; break; }
        }
      }
    }
  }

  // 3) Segmentasi ala manusia: potong dulu halaman jadi PITA BARIS
  //    (dipisahkan ruang putih horizontal), lalu tiap pita dipotong
  //    jadi KOLOM kalau ada selokan vertikal. Baru di dalam tiap
  //    petak itu dicari komponen terhubung. Tanpa ini, halaman scan
  //    (paragraf rapat) menyatu jadi satu gumpalan raksasa.
  const pita = cariPita(mask, gw, gh, opsi.gapBarisSel ?? Math.max(1, Math.round(gh * 0.011)));
  const petakList = [];
  for (const p of pita) {
    const kolom = cariKolomPita(mask, gw, p.y0, p.y1, opsi);
    for (const k of kolom) petakList.push({ x0: k.x0, x1: k.x1, y0: p.y0, y1: p.y1 });
  }
  if (!petakList.length) petakList.push({ x0: 0, x1: gw - 1, y0: 0, y1: gh - 1 });
  if (opsi.debug && typeof globalThis !== 'undefined') globalThis.__segmen = { sel, gw, gh, pita, petakList };

  // 4) komponen terhubung (8-arah) DI DALAM tiap petak
  const komponen = [];
  for (const petak of petakList) komponen.push(...komponenDi(mask, gw, gh, petak));
  if (!komponen.length) return [];

  // 5) gabung komponen yang berdekatan (satu ilustrasi sering terpecah)
  const jarakSel = Math.max(1, Math.round((opsi.jarakGabung ?? Math.max(8, Math.min(W, H) * 0.014)) / sel));
  let kotak = komponen.map((k) => ({
    x: k.minX * sel, y: k.minY * sel,
    w: (k.maxX - k.minX + 1) * sel, h: (k.maxY - k.minY + 1) * sel,
    n: k.n, baris: k.baris,
  }));
  kotak = gabungKotakPiksel(kotak, jarakSel * sel);

  // 5b) blok TINGGI (paragraf + gambar campur) dipecah sekali lagi per
  //     baris, supaya diagram/tabel di dalamnya muncul sebagai usulan
  //     tersendiri dan tidak ikut tersaring sebagai "teks".
  const finalKotak = [];
  for (const k of kotak) {
    if ((k.baris || 0) >= (opsi.minBarisPecah ?? 5) && k.h > H * (opsi.minTinggiPecah ?? 0.09)) {
      const anak = pecahDalam(mask, gw, gh, k, sel, jarakSel, opsi);
      if (anak.length > 1) { finalKotak.push(...anak); continue; }
    }
    finalKotak.push(k);
  }

  // 6) saring + beri label
  const luasHal = W * H;
  const minTinggi = opsi.minTinggi ?? Math.max(24, Math.round(H * 0.03));
  const minLebar = opsi.minLebar ?? Math.max(24, Math.round(W * 0.05));
  const pad = Math.round(opsi.pad ?? Math.max(3, Math.min(W, H) * 0.006));

  const hasil = [];
  for (const k of finalKotak) {
    const luas = k.w * k.h;
    if (k.h < minTinggi || k.w < minLebar) continue;
    if (luas < luasHal * (opsi.minLuasRasio ?? 0.0025)) continue;
    if (luas > luasHal * (opsi.maxLuasRasio ?? 0.9)) continue;
    const kerapatan = +(k.n * sel * sel / Math.max(1, luas)).toFixed(3);
    const jenis = tebakJenisBagian({ ...k, kerapatan }, W, H);
    hasil.push({
      x: clamp(k.x - pad, 0, W),
      y: clamp(k.y - pad, 0, H),
      w: clamp(k.w + pad * 2, 1, W),
      h: clamp(k.h + pad * 2, 1, H),
      kerapatan,
      jenis,
    });
  }
  return hasil.sort((a, b) => a.y - b.y || a.x - b.x);
}

// Komponen terhubung (8-arah) terbatas pada satu petak grid.
function komponenDi(mask, gw, gh, petak) {
  const label = new Int32Array(gw * gh).fill(-1);
  const out = [];
  for (let gy = petak.y0; gy <= petak.y1; gy++) {
    for (let gx = petak.x0; gx <= petak.x1; gx++) {
      const i = gy * gw + gx;
      if (!mask[i] || label[i] !== -1) continue;
      let n = 0, minX = gw, minY = gh, maxX = 0, maxY = 0, baris = 0;
      const punyaBaris = new Set();
      label[i] = 0;
      const stack = [i];
      while (stack.length) {
        const cur = stack.pop();
        const cx = cur % gw, cy = (cur - cx) / gw;
        n++;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        if (!punyaBaris.has(cy)) { punyaBaris.add(cy); baris++; }
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < petak.x0 || ny < petak.y0 || nx > petak.x1 || ny > petak.y1) continue;
            const ni = ny * gw + nx;
            if (mask[ni] && label[ni] === -1) { label[ni] = 0; stack.push(ni); }
          }
        }
      }
      out.push({ n, minX, minY, maxX, maxY, baris });
    }
  }
  return out;
}

// Pecah satu blok tinggi jadi baris-barisnya, lalu ambil komponennya.
function pecahDalam(mask, gw, gh, k, sel, jarakSel, opsi) {
  const x0 = Math.max(0, Math.floor(k.x / sel));
  const x1 = Math.min(gw - 1, Math.ceil((k.x + k.w) / sel));
  const y0 = Math.max(0, Math.floor(k.y / sel));
  const y1 = Math.min(gh - 1, Math.ceil((k.y + k.h) / sel));
  const gapSel = Math.max(1, Math.round((y1 - y0 + 1) * (opsi.gapPecahDalam ?? 0.03)));
  const pita = cariPita(mask, gw, gh, gapSel, y0, y1, x0, x1);
  const petakList = [];
  for (const p of pita) {
    for (const klm of cariKolomPita(mask, gw, p.y0, p.y1, opsi)) petakList.push({ x0: Math.max(x0, klm.x0), x1: Math.min(x1, klm.x1), y0: p.y0, y1: p.y1 });
  }
  if (!petakList.length) return [];
  const anak = [];
  for (const petak of petakList) anak.push(...komponenDi(mask, gw, gh, petak));
  let kotak = anak.map((c) => ({
    x: c.minX * sel, y: c.minY * sel,
    w: (c.maxX - c.minX + 1) * sel, h: (c.maxY - c.minY + 1) * sel,
    n: c.n, baris: c.baris,
  }));
  return gabungKotakPiksel(kotak, jarakSel * sel);
}

// Pita baris: rentang baris bertinta yang dipisahkan ruang kosong.
function cariPita(mask, gw, gh, gapMinSel, dariY = 0, sampaiY = gh - 1, dariX = 0, sampaiX = gw - 1) {
  const pita = [];
  let y0 = -1;
  let kosong = 0;
  for (let gy = dariY; gy <= sampaiY + 1; gy++) {
    let tinta = 0;
    if (gy <= sampaiY) {
      for (let gx = dariX; gx <= sampaiX; gx++) if (mask[gy * gw + gx]) tinta++;
    }
    if (tinta > 0) {
      if (y0 === -1) y0 = gy;
      kosong = 0;
    } else if (y0 !== -1) {
      kosong++;
      if (kosong >= gapMinSel || gy > sampaiY) {
        pita.push({ y0, y1: gy - kosong });
        y0 = -1; kosong = 0;
      }
    }
  }
  if (y0 !== -1) pita.push({ y0, y1: sampaiY });
  return pita;
}

// Kolom dalam satu pita: cari selokan vertikal yang kosong hampir
// sepanjang pita (mis. halaman dua kolom soal).
function cariKolomPita(mask, gw, y0, y1, opsi) {
  const tinggi = y1 - y0 + 1;
  if (tinggi < 6) return [{ x0: 0, x1: gw - 1 }];
  const isi = new Array(gw).fill(0);
  for (let gy = y0; gy <= y1; gy++) {
    for (let gx = 0; gx < gw; gx++) if (mask[gy * gw + gx]) isi[gx]++;
  }
  const butuh = Math.round(tinggi * (opsi.minCakupanSelokan ?? 0.16));
  const gutMin = Math.max(1, Math.round(gw * (opsi.lebarSelokan ?? 0.012)));
  const kosongRun = [];
  let mulai = -1;
  for (let gx = 0; gx <= gw; gx++) {
    const kos = gx < gw && isi[gx] <= butuh;
    if (kos) { if (mulai === -1) mulai = gx; }
    else if (mulai !== -1) { if (gx - mulai >= gutMin) kosongRun.push([mulai, gx - 1]); mulai = -1; }
  }
  const tengah = kosongRun.filter(([a, b]) => {
    const c = (a + b) / 2;
    if (c <= gw * 0.08 || c >= gw * 0.92) return false;
    return true;
  });
  if (!tengah.length) return [{ x0: 0, x1: gw - 1 }];
  // potong pita pada tiap selokan
  const batas = [];
  for (const [a, b] of tengah) batas.push([a, b]);
  batas.sort((p, q) => p[0] - q[0]);
  const kolom = [];
  let x = 0;
  for (const [a, b] of batas) {
    if (a - x >= Math.max(3, Math.round(gw * 0.05))) kolom.push({ x0: x, x1: a - 1 });
    x = b + 1;
  }
  if (gw - x >= Math.max(3, Math.round(gw * 0.05))) kolom.push({ x0: x, x1: gw - 1 });
  return kolom.length ? kolom : [{ x0: 0, x1: gw - 1 }];
}

function tebakJenisBagian(k, W, H) {
  const rasioWH = k.w / Math.max(1, k.h);
  // Blok tinggi, jarang tintanya, dan terdiri dari banyak baris terpisah
  // = hampir pasti paragraf (penting untuk halaman scan tanpa lapisan teks).
  if (k.h > H * 0.13 && k.kerapatan < 0.42 && (k.baris || 0) >= 6) return 'mirip-teks';
  if (k.kerapatan > 0.55 && rasioWH > 1.4) return 'tabel';
  // Baris tipis & lebar = hampir pasti baris teks (penting untuk PDF scan
  // yang tidak punya lapisan teks, supaya usulan tidak penuh paragraf).
  if (rasioWH > 3.2 && k.h < H * 0.09) return 'mirip-teks';
  if (rasioWH > 3.2) return 'baris';
  if (k.h > H * 0.42 && k.w > W * 0.42) return 'ilustrasi-besar';
  if (rasioWH >= 0.6 && rasioWH <= 1.8) return 'gambar';
  return 'blok';
}

// Gabung kotak-kotak (satuan PDF) yang saling dekat/bersinggungan.
function gabungKotak(list, jarak) {
  const sisa = list.slice();
  const out = [];
  while (sisa.length) {
    let cur = sisa.shift();
    let berubah = true;
    while (berubah) {
      berubah = false;
      for (let i = 0; i < sisa.length; i++) {
        if (dekat(cur, sisa[i], jarak)) { cur = gabungDua(cur, sisa[i]); sisa.splice(i, 1); berubah = true; break; }
      }
    }
    out.push(cur);
  }
  return out;
}

function dekat(a, b, jarak) {
  const ax1 = a.x + a.w, ay1 = a.y + a.h, bx1 = b.x + b.w, by1 = b.y + b.h;
  const gx = Math.max(0, Math.max(a.x, b.x) - Math.min(ax1, bx1));
  const gy = Math.max(0, Math.max(a.y, b.y) - Math.min(ay1, by1));
  return gx <= jarak && gy <= jarak;
}

function gabungDua(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const x1 = Math.max(a.x + a.w, b.x + b.w), y1 = Math.max(a.y + a.h, b.y + b.h);
  return { ...a, x, y, w: x1 - x, h: y1 - y, jenis: a.jenis === b.jenis ? a.jenis : 'campuran' };
}

function gabungKotakPiksel(list, jarak) {
  const sisa = list.slice();
  const out = [];
  while (sisa.length) {
    let cur = sisa.shift();
    let berubah = true;
    while (berubah) {
      berubah = false;
      for (let i = 0; i < sisa.length; i++) {
        if (dekat(cur, sisa[i], jarak)) {
          const g = gabungDua(cur, sisa[i]);
          g.n = (cur.n || 0) + (sisa[i].n || 0);
          cur = g; sisa.splice(i, 1); berubah = true; break;
        }
      }
    }
    out.push(cur);
  }
  return out;
}

// Pembungkus praktis di browser: canvas halaman -> daftar usulan potongan.
// `rasio` = satuan PDF per piksel canvas (1 / skala render).
export function deteksiBagianDariCanvas(canvas, opsi = {}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return deteksiBagianHalaman({ data: img.data, width: img.width, height: img.height }, opsi);
}

// ------------------------------------------------------------
// DETEKSI BAB DI DALAM SATU PDF (untuk PDF gabungan banyak bab)
// Hanya jalan kalau ada lapisan teks. Kalau kosong, wizard impor
// menyediakan pemecahan manual per rentang halaman.
// ------------------------------------------------------------
export async function deteksiBabDalamPdf(pdf, opsi = {}) {
  const hasil = [];
  const maks = Math.min(pdf.numPages, opsi.maxHalaman || 200);
  for (let i = 1; i <= maks; i++) {
    let baris = [];
    try { baris = await teksHalaman(pdf, i); } catch { baris = []; }
    for (const b of baris.slice(0, 8)) {
      const t = b.teks.replace(/\s+/g, ' ').trim();
      const m = t.match(/^B\s?A\s?B\s*\.?\s*(\d{1,2})?\b[\s\-–—:.]*(.*)$/i) ||
        t.match(/^Modul\s*(\d{1,2})\b[\s\-–—:.]*(.*)$/i) ||
        t.match(/^Materi\s*(\d{1,2})\b[\s\-–—:.]*(.*)$/i);
      if (!m) continue;
      if (b.ukuran < (opsi.minUkuranJudul || 11) && !/^\d+$/.test(t)) continue;
      hasil.push({ halaman: i, nomor: m[1] ? Number(m[1]) : null, judul: rapikanJudul(m[2] || ''), teksAsli: t });
      break;
    }
  }
  return hasil;
}

// ------------------------------------------------------------
// NAMA FILE -> METADATA BAB
//   "13 Teorema Phytagoras @my99dreams.pdf"  -> { nomor:13, judul:"Teorema Phytagoras" }
//   "Bab 1 - Bilangan Bulat dan Pecahan.pdf" -> { nomor:1,  judul:"Bilangan Bulat dan Pecahan" }
//   "04  Aritmetika Sosial @my99dreams.pdf"  -> { nomor:4,  judul:"Aritmetika Sosial" }
//   "02 Bilangan Berpangkat - siap print.pdf"-> { nomor:2,  judul:"Bilangan Berpangkat" }
// ------------------------------------------------------------
const KOTORAN_NAMA = [
  /\bhttps?:\/\/\S+/gi,                                  // tautan
  /@[\w.-]+/g,                                          // @my99dreams
  /[[(]\s*(copy|salinan|final|rev|revisi|new|baru|print|siap print|siap cetak|\d+)\s*[)\]]/gi,
  /\b(siap\s+(print|cetak))\b/gi,
  /\b(print|cetak)\s*$/gi,
  /\b(my\d*dreams|my99dreams|telegram|t\.me\/\S+)\b/gi, // kredit sumber modul
  /\s{2,}/g,
];

export function judulDariNamaFile(nama) {
  let s = String(nama || '').replace(/\.(pdf|PDF)$/g, '').trim();
  s = s.replace(/[_]+/g, ' ');                       // 09_himpunan -> 09 himpunan
  for (const p of KOTORAN_NAMA) s = s.replace(p, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  // "13 -Judul" / "13.Judul" tanpa spasi
  s = s.replace(/^(\d{1,3})\s*[-–—:.]\s*(?=\S)/, '$1 $2');

  let nomor = null;
  // "Bab 13 - Judul" / "BAB 13 Judul" / "Modul 13: Judul"
  let m = s.match(/^(?:bab|bab\s*ke|modul|materi|chapter|pertemuan)\s*\.?\s*(\d{1,3})\s*[-–—:.]?\s*(.*)$/i);
  if (m) { nomor = Number(m[1]); s = m[2]; }
  else {
    // "13 Judul" / "04  Judul"
    m = s.match(/^(\d{1,3})\s*[-–—:.]?\s+(.*)$/);
    if (m) { nomor = Number(m[1]); s = m[2]; }
    else {
      // nomor di tengah: "Judul (Bab 13)"
      m = s.match(/\(\s*(?:bab|modul)?\s*(\d{1,3})\s*\)\s*$/i);
      if (m) { nomor = Number(m[1]); s = s.replace(m[0], ''); }
    }
  }

  const judul = rapikanJudul(s);
  return {
    nomor: nomor && nomor > 0 && nomor <= 999 ? nomor : null,
    judul: judul || 'Tanpa Judul',
    urutan: nomor && nomor > 0 ? nomor : null,
    namaAsli: String(nama || ''),
  };
}

export function rapikanJudul(s) {
  return String(s || '')
    .replace(/^[\s\-–—:.]+/, '')
    .replace(/[\s\-–—:.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}

// id bab yang aman & konsisten: bab-13 (pakai nomor kalau ada)
export function babIdDari(nomor, judul) {
  if (nomor) return `bab-${nomor}`;
  const sl = slugify(judul);
  return sl ? `bab-${sl}` : `bab-${Date.now().toString(36)}`;
}

// Nama file aman untuk path Storage (buang karakter bermasalah).
export function namaFileAman(nama) {
  return String(nama || 'modul.pdf')
    .replace(/[^\w.\-() ]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 90) || 'modul.pdf';
}

export function ukuranTerbaca(byte) {
  const n = Number(byte) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ------------------------------------------------------------
// SIDIK JARI FILE -- anti upload ganda (modul sama tidak diunggah 2x)
// ------------------------------------------------------------
export async function hashFile(file) {
  try {
    const buf = await file.arrayBuffer();
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const h = await crypto.subtle.digest('SHA-256', buf);
      return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    }
  } catch { /* jatuh ke hash sederhana */ }
  return hashSederhana(`${file.name}|${file.size}|${file.lastModified || 0}`);
}

export function hashSederhana(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ------------------------------------------------------------
// BANTUAN WIZARD: urutkan & beri nomor bab otomatis
// ------------------------------------------------------------
export function susunUrutan(item) {
  const list = item.slice();
  list.sort((a, b) => {
    if (a.nomor && b.nomor && a.nomor !== b.nomor) return a.nomor - b.nomor;
    if (a.nomor && !b.nomor) return -1;
    if (!a.nomor && b.nomor) return 1;
    return String(a.nama).localeCompare(String(b.nama), 'id', { numeric: true });
  });
  return list.map((x, i) => ({ ...x, urutan: x.nomor || i + 1 }));
}

// Deteksi bentrok id bab (dua file -> bab yang sama)
export function cariBentrokId(item) {
  const peta = new Map();
  const bentrok = new Set();
  for (const x of item) {
    if (!x.babId) continue;
    if (peta.has(x.babId)) { bentrok.add(x.babId); }
    peta.set(x.babId, (peta.get(x.babId) || 0) + 1);
  }
  return bentrok;
}