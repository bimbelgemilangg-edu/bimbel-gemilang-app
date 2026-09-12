// src/utils/konversiPdfBuku.js
// ============================================================
// MESIN KONVERSI OTOMATIS PDF/TEKS -> DRAF BAB BUKU INTERAKTIF
// Dipakai Manajer Buku: admin unggah PDF -> sistem mengekstrak
// teks (+ gambar tersemat, best-effort) -> menyusun draf JSON bab
// (seksi materi + soal pg/multi/bs + pembahasan) yang SIAP DITINJAU
// lalu disimpan. Buku apa pun (matematika, IPA, bacaan panjang):
// struktur yang dikenali dipetakan, sisanya jadi paragraf materi.
//
// Juga berisi sanitasiFirestore(): Firestore MENOLAK array di dalam
// array (mis. tabel baris: [[...],[...]]). Fungsi ini otomatis
// membungkus array-bersarang menjadi [{ s: [...] }] sebelum setDoc;
// VisualBuku.jsx mengerti KEDUA bentuk saat merender.
// ============================================================

// ------------------------------------------------------------
// SANITASI FIRESTORE -- array bersarang -> array of object {s}
// ------------------------------------------------------------
export function sanitasiFirestore(v) {
    if (Array.isArray(v)) {
      const punyaSarang = v.some((x) => Array.isArray(x));
      const isi = v.map((x) => (Array.isArray(x) ? { s: x.map((y) => (Array.isArray(y) ? { s: y } : sanitasiObj(y))) } : sanitasiObj(x)));
      return punyaSarang ? isi : v.map(sanitasiObj);
    }
    return sanitasiObj(v);
  }
  function sanitasiObj(v) {
    if (Array.isArray(v)) return sanitasiFirestore(v);
    if (v && typeof v === 'object') {
      const o = {};
      for (const k of Object.keys(v)) o[k] = sanitasiFirestore(v[k]);
      return o;
    }
    return v;
  }
  // Kebalikan ringan untuk reader: terima [[..]] ATAU [{s:[..]}]
  export const deretBaris = (rows) => (rows || []).map((r) => (Array.isArray(r) ? r : Array.isArray(r?.s) ? r.s : []));
  
  // ------------------------------------------------------------
  // EKSTRAK PDF (teks per halaman + gambar tersemat, best-effort)
  // ------------------------------------------------------------
  let _pdfjs = null;
  async function muatPdfjs() {
    if (_pdfjs) return _pdfjs;
    const lib = await import('pdfjs-dist/build/pdf');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.js?url');
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    _pdfjs = lib;
    return lib;
  }
  
  export async function ekstrakPdf(file, onProgres) {
    const lib = await muatPdfjs();
    const buf = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
    const halaman = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      // gabung item teks per baris (pakai transform.y sebagai patokan baris)
      const barisMap = new Map();
      for (const it of tc.items) {
        if (!it.str && !it.hasEOL) continue;
        const y = Math.round(it.transform?.[5] ?? 0);
        const key = y;
        barisMap.set(key, (barisMap.get(key) || '') + (it.str || ''));
      }
      const baris = [...barisMap.entries()].sort((a, b) => b[0] - a[0]).map(([, t]) => t.trim()).filter(Boolean);
      const gambar = await ekstrakGambarHalaman(page);
      halaman.push({ nomor: i, baris, gambar });
      if (onProgres) onProgres(i, pdf.numPages);
    }
    return halaman;
  }
  
  // Gambar tersemat di halaman -> Blob (browser only, best-effort).
  async function ekstrakGambarHalaman(page) {
    const out = [];
    try {
      const ops = await page.getOperatorList();
      const lib = await muatPdfjs();
      let hit = 0;
      for (let i = 0; i < ops.fnArray.length && hit < 6; i++) {
        if (ops.fnArray[i] !== lib.OPS.paintImageXObject) continue;
        const name = ops.argsArray[i][0];
        let img = null;
        try { img = page.objs.get(name); } catch { img = null; }
        if (!img || !img.width || !img.height) continue;
        if (img.width < 150 || img.height < 150 || img.width > 4000 || img.height > 4000) continue;
        const blob = await imageDataKeBlob(img);
        if (blob) { out.push(blob); hit++; }
      }
    } catch { /* gambar dilewati -- bukan bencana */ }
    return out;
  }
  async function imageDataKeBlob(img) {
    try {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      if (img.data && img.kind !== undefined) ctx.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
      else if (img.bitmap) ctx.drawImage(img.bitmap, 0, 0);
      else if (img.tagName === 'CANVAS' || img.tagName === 'IMG') ctx.drawImage(img, 0, 0);
      else return null;
      const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
      return blob && blob.size > 200 ? blob : null;
    } catch { return null; }
  }
  
  // ------------------------------------------------------------
  // KONVERSI TEKS -> DRAF BAB (heuristik, defensif)
  // ------------------------------------------------------------
  const rata = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const tanpaSpasi = (s) => (s || '').replace(/\s+/g, '').toUpperCase();
  
  export function konversiTeksKeBab(halaman, meta = {}) {
    // Pecah baris: tab hanya dipisah kalau memang pola pilihan ganda
    // dua kolom ("A. ... \t C. ..."); selain itu tab jadi spasi biasa.
    const L = [];
    const potongTab = (line) => {
      const parts = /\t/.test(line) ? line.split(/\t+/).map(rata).filter(Boolean) : [rata(line)].filter(Boolean);
      const out = [];
      for (const p of parts) {
        // pilihan ganda 2 kolom yang tergabung tanpa tab: "A. 2 °C C. −2 °C"
        if (/^[A-D]\.\s/.test(p) && /\s[A-D]\.\s/.test(p.slice(3))) {
          const re = /([A-D])\.\s/g;
          const idxs = [];
          let m;
          while ((m = re.exec(p))) idxs.push(m.index);
          for (let k = 0; k < idxs.length; k++) out.push(rata(p.slice(idxs[k], idxs[k + 1] ?? p.length)));
        } else out.push(p);
      }
      return out;
    };
    for (const h of halaman) {
      for (const b of h.baris) for (const seg of potongTab(b)) L.push({ h: h.nomor, t: seg });
    }
    // Nomor margin sering jadi baris terpisah di atas header SOAL/PEMBAHASAN -> gabung
    for (let i = L.length - 2; i >= 0; i--) {
      if (/^\d{1,2}$/.test(L[i].t) && /^(SOAL|PEMBAHASAN)/i.test(L[i + 1].t)) {
        L[i].t = L[i].t + ' ' + L[i + 1].t;
        L.splice(i + 1, 1);
      }
    }
    // Sampah visual: angka termometer/tabel yang terekstrak ("10101010", "-12°C"),
    // gabungan kolom tanpa spasi ("Cairan ACairan B..."), & ornamen cover ("B A B 1")
    const sampahVisual = (t) =>
      /^[\d\s.,%°+\-−C]+$/.test(t) ||
      (t.split(/\s+/).length >= 4 && t.split(/\s+/).every((w) => /^[A-Z]/.test(w)) && !/[.,:;]/.test(t)) ||
      /(?:\b[A-Z]\s){3,}/.test(t);
    const idxMulaiSoal = L.findIndex((l) => tanpaSpasi(l.t).includes('SOALPEMANTAPAN') || /^SOAL\s+PEMANTAPAN/i.test(l.t));
    const idxMulaiBahasan = L.findIndex((l) => tanpaSpasi(l.t) === 'PEMBAHASAN');
    const akhirMateri = idxMulaiSoal >= 0 ? idxMulaiSoal : idxMulaiBahasan >= 0 ? idxMulaiBahasan : L.length;
  
    // ---------- MATERI -> sections ----------
    const sections = [];
    let cur = null;
    const tambahBlok = (blok) => {
      if (!cur) { cur = { id: 'bab-x-1', judul: meta.judulSeksiDefault || 'Materi', blocks: [], _hal: 1 }; sections.push(cur); }
      cur.blocks.push(blok);
    };
    let listBuffer = null;
    const tutupList = () => { if (listBuffer && listBuffer.items.length) tambahBlok({ tipe: 'list', items: listBuffer.items }); listBuffer = null; };
    let paraBuffer = [];
    const rapihkan = (teks) => teks
      .replace(/([a-z);,])\s?\d{1,2}\.\s*/g, '$1 ')   // buang nomor margin yang menempel
      .replace(/\s{2,}/g, ' ')
      .trim();
    const tutupPara = () => { if (paraBuffer.length) { const t = rapihkan(paraBuffer.join(' ')); if (t) tambahBlok({ tipe: 'p', teks: t }); } paraBuffer = []; };
  
    for (let i = 0; i < akhirMateri; i++) {
      const t = L[i].t;
      if (/^(B\s*A\s*B|\d+)$/.test(t) || tanpaSpasi(t).length <= 3) continue;              // sampah halaman
      if (/^\d{1,2}[.)]?$/.test(t)) continue;                                              // nomor margin sendirian
      if (sampahVisual(t)) continue;                                                       // artefak visual/cover
      const mSeksi = t.match(/^([A-Z])\.\s+([A-Z][a-z].{2,80})$/) || t.match(/^([A-Z])\s+([A-Z][a-z].{2,80})$/);
      if (mSeksi && !/^(Contoh|Tips|Catatan)$/.test(mSeksi[2])) {
        tutupList(); tutupPara();
        cur = { id: `bab-x-${mSeksi[1].toLowerCase()}`, judul: `${mSeksi[1]}. ${mSeksi[2]}`, blocks: [], _hal: L[i].h };
        sections.push(cur);
        continue;
      }
      const mNum = t.match(/^(\d{1,2})[.)]\s+(.{3,})$/);
      const mBul = t.match(/^[•\-\u2022]\s*(.{3,})$/);
      if (mNum || mBul) {
        tutupPara();
        if (!listBuffer) listBuffer = { items: [] };
        listBuffer.items.push(rata(mNum ? mNum[2] : mBul[1]));
        continue;
      }
      tutupList();
      // heuristik rumus: ada '=' dengan ruas kiri berisi alfanumerik,
      // pendek, bukan kalimat -- pecahan PDF yang hancur jadi paragraf saja.
      const kiri = t.split('=')[0];
      if (t.includes('=') && t.length <= 70 && t.length >= 6 && /[A-Za-z0-9]\s*$/.test(kiri) && !/[.!?]$/.test(t) && !/\s(yaitu|adalah|maka|sehingga|jika)\s/i.test(t)) {
        tutupPara();
        tambahBlok({ tipe: 'math', teks: t });
        continue;
      }
      paraBuffer.push(t);
    }
    tutupList(); tutupPara();
    // buang blok kosong & seksi kosong
    for (const s of sections) s.blocks = s.blocks.filter((b) => (b.tipe === 'list' ? (b.items || []).length : !!b.teks));
    const sectionsBersih = sections.filter((s) => s.blocks.length);
  
    // ---------- PEMBAHASAN -> peta nomor ----------
    const bahasan = {};
    if (idxMulaiBahasan >= 0) {
      let nomor = null;
      for (let i = idxMulaiBahasan + 1; i < L.length; i++) {
        const t = L[i].t;
        const mH = t.match(/^(\d{1,2})\s+PEMBAHASAN$/i);
        if (mH) { nomor = mH[1]; bahasan[nomor] = { teks: [], jawaban: '' }; continue; }
        if (!nomor) continue;
        const mJ = t.match(/^Jawaban:\s*(.+)$/i);
        if (mJ) { bahasan[nomor].jawaban = rata(mJ[1]); continue; }
        bahasan[nomor].teks.push(t);
      }
    }
  
    // ---------- SOAL ----------
    const ujiPemahaman = [];
    if (idxMulaiSoal >= 0) {
      const mulai = idxMulaiSoal + 1;
      const akhir = idxMulaiBahasan >= 0 && idxMulaiBahasan > mulai ? idxMulaiBahasan : L.length;
      let q = null;
      const tutupQ = () => { if (q) ujiPemahaman.push(q); q = null; };
      let modePernyataan = false;
      for (let i = mulai; i < akhir; i++) {
        const t = L[i].t;
        const mH = t.match(/^(\d{1,2})\s+SOAL\b(.*)$/i);
        if (mH) {
          tutupQ();
          const level = (/SULIT/i.test(mH[2]) ? 'sulit' : /SEDANG/i.test(mH[2]) ? 'sedang' : /MUDAH/i.test(mH[2]) ? 'mudah' : 'sedang');
          q = { id: `u${mH[1]}`, tipe: 'pg', level, soal: '', pilihan: [], pernyataan: [], _acc: [], _nomor: mH[1] };
          modePernyataan = false;
          continue;
        }
        if (!q) continue;
        if (/^Pernyataan/i.test(t) && /Benar/i.test(t) && /Salah/i.test(t)) { modePernyataan = true; continue; }
        const mPil = t.match(/^([A-D])\.\s*(.{1,})$/);
        if (mPil && !modePernyataan) { q.pilihan.push(rata(mPil[2])); continue; }
        if (sampahVisual(t)) continue;
        if (!q.soal) { q.soal = t; q._acc.push(t); continue; }
        if (modePernyataan) {
          const last = q.pernyataan[q.pernyataan.length - 1];
          if (last && /^[a-z]/.test(t)) q.pernyataan[q.pernyataan.length - 1] = rata(last + ' ' + t);
          else q.pernyataan.push(t);
        }
        else { q.soal += ' ' + t; q._acc.push(t); }
      }
      tutupQ();
  
      // Rekonstruksi soal multi-pilihan: butir pernyataan tanpa huruf A-D
      // (contoh: "Pilihlah jawaban yang benar!" lalu 4 baris pernyataan)
      for (const q of ujiPemahaman) {
        if ((q.pilihan || []).length >= 2 || !(q._acc || []).length) continue;
        const idxMark = [];
        q._acc.forEach((x, i) => { if (/pilih( lah)?\s|lebih dari satu|pernyataan berikut/i.test(x) || /!$/.test(x)) idxMark.push(i); });
        const split = idxMark.length ? idxMark[idxMark.length - 1] : -1;
        if (split < 0) continue;
        const opsi = q._acc.slice(split + 1).map(rata).filter((x) => x.length >= 15);
        if (opsi.length >= 2) {
          q.soal = rata(q._acc.slice(0, split + 1).join(' '));
          q.pilihan = opsi;
        }
      }
    }
  
    // tentukan tipe & kunci dari baris "Jawaban:" di pembahasan
    for (const q of ujiPemahaman) {
      const b = bahasan[q._nomor];
      const jw = b ? b.jawaban : '';
      const huruf = jw.match(/^([A-D])$/);
      const bsList = jw.match(/^(Benar|Salah)(\s*,\s*(Benar|Salah))+$/i);
      const multiList = jw.match(/Pernyataan\s*([0-9,\s]+(dan\s*[0-9]+)?)/i);
      if (bsList && q.pernyataan.length) {
        q.tipe = 'bs';
        q.benar = jw.split(/,/).map((x) => /benar/i.test(x));
        delete q.pilihan;
      } else if (multiList && q.pilihan.length) {
        const angka = (multiList[1].match(/\d{1,2}/g) || []).map(Number).filter((n) => n >= 1 && n <= q.pilihan.length);
        if (angka.length) { q.tipe = 'multi'; q.benar = angka.map((n) => n - 1); }
        else { q.tipe = 'pg'; q.benar = 0; }
      } else if (huruf && q.pilihan.length) {
        q.tipe = 'pg';
        q.benar = huruf[1].charCodeAt(0) - 65;
      } else if (q.pernyataan.length) {
        q.tipe = 'bs';
        q.benar = q.pernyataan.map(() => true);
      } else {
        q.tipe = 'pg';
        q.benar = q.pilihan.length ? 0 : 0;
      }
      q.pembahasan = b ? rata(b.teks.join(' ')) + (jw ? ` Jawaban: ${jw}` : '') : 'Pembahasan menyusul.';
      if (q.tipe !== 'bs') delete q.pernyataan;
      if (q.tipe === 'bs') delete q.pilihan;
      if (!q.pilihan || q.pilihan.length < 2) { if (q.tipe !== 'bs') { q.pilihan = q.pilihan && q.pilihan.length ? q.pilihan : ['—']; } }
      delete q._nomor;
    }
  
    const bab = {
      id: meta.id || 'bab-x',
      judul: meta.judul || 'Draf Bab (hasil konversi otomatis)',
      urutan: meta.urutan || 1,
      sections: sectionsBersih.length ? sectionsBersih : [{ id: `${meta.id || 'bab-x'}-1`, judul: 'Materi', blocks: [{ tipe: 'p', teks: 'Tidak ada teks yang bisa diekstrak dari PDF ini.' }] }],
      ujiPemahaman,
    };
    return bab;
  }