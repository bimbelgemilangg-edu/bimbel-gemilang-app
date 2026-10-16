// src/utils/adaptorProyekScan.js
// ============================================================
// ADAPTOR PROYEK SCAN (17 Okt 2026): owner juga punya hasil scan berupa
// PROYEK FOLDER: document.json (manifes halaman->gambar: bbox, ukuran,
// path images/...), images/ (ratusan berkas: scan halaman utuh + crop
// figur), dan main.tex (konten latex). Permintaan owner: "support upload
// folder dan langsung menggabungkan semua folder menjadi satu kesatuan
// yang canggih dan rapi".
//
// Strategi deterministik:
//   • document.json memisahkan HALAMAN UTUH (bbox menutup >=90% luas
//     halaman) vs FIGUR (sisanya) — menggantikan heuristik dimensi;
//   • main.tex diparse subset aman (\chapter/\section/\subsection,
//     \includegraphics, itemize, lingkungan math) -> bab reader;
//     referensi \includegraphics{images/x} dipetakan ke berkas manifes;
//   • bila tex tidak mengenali satu bab pun -> FALLBACK buku halaman
//     gambar (blok gambar per 8 halaman) siap ditempeli ekstraksi AI;
//   • beberapa folder digabung: bab dikonkat & diurut, gambar dinikmati
//     lintas root tanpa tabrakan nama (path relatif per root).
// ============================================================

const RE_CMD = /\\(chapter|section|subsection)\*?\s*\{([^}]*)\}/g;

/** Subset latex -> bab kontrak reader. Gambar jadi placeholder `tex:<path>`. */
export function parseMainTex(teks = '') {
  const babList = [];
  let bab = null;
  let seksi = null;
  let buffer = [];
  let dalamItemize = false;
  let items = [];
  let dalamMath = false;
  let mathBuf = [];

  const flushP = () => {
    const t = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (!t || !seksi) return;
    seksi.blocks.push({ tipe: 'p', teks: t });
  };
  const baris = String(teks).split(/\r?\n/);
  for (const mentah of baris) {
    const l = mentah.trim();
    if (!l || l.startsWith('%')) continue;
    if (/\\begin\{(align\*?|equation\*?|gather\*?)\}/.test(l)) { flushP(); dalamMath = true; mathBuf = []; continue; }
    if (/\\end\{(align\*?|equation\*?|gather\*?)\}/.test(l)) {
      dalamMath = false;
      if (seksi) seksi.blocks.push({ tipe: 'math', teks: mathBuf.join(' ').trim() });
      continue;
    }
    if (dalamMath) { mathBuf.push(l); continue; }
    if (/\\begin\{itemize\}/.test(l)) { flushP(); dalamItemize = true; items = []; continue; }
    if (/\\end\{itemize\}/.test(l)) { dalamItemize = false; if (seksi && items.length) seksi.blocks.push({ tipe: 'list', items }); continue; }
    if (dalamItemize) {
      const it = l.replace(/^\\item\s*/, '').trim();
      if (it) items.push(it);
      continue;
    }
    let m;
    // NON-global: regex /g menyimpan lastIndex antar-panggilan dan
    // pernah membuat matchAll mulai dari tengah baris (bab kedua
    // hilang, regresi tertangkap uji 17 Okt).
    if ((m = l.match(/\\(chapter|section|subsection)\*?\s*\{([^}]*)\}/))) {
      const [cmd, arg] = [m[1], m[2]];
      flushP();
      if (cmd === 'chapter') {
        bab = { judul: arg, nomorBab: babList.length + 1, sections: [], ujiPemahaman: [], soalUraian: [] };
        babList.push(bab);
        seksi = { id: `s1`, judul: '', blocks: [] };
        bab.sections.push(seksi);
      } else if (bab) {
        seksi = { id: `s${bab.sections.length + 1}`, judul: arg, blocks: [] };
        bab.sections.push(seksi);
      }
      continue;
    }
    if ((m = l.match(/\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}/))) {
      flushP();
      if (seksi) seksi.blocks.push({ tipe: 'gambar', src: `tex:${m[1]}`, alt: m[1], caption: m[1] });
      continue;
    }
    buffer.push(l.replace(/\\(?:textbf|emph|textit)\{([^}]*)\}/g, '$1'));
  }
  flushP();
  return { bab: babList };
}

/**
 * Klasifikasi blok gambar manifes: halaman utuh vs figur.
 * @param {object} doc document.json
 */
export function petaManifes(doc = {}) {
  const halaman = new Map(); // path -> nomor halaman
  const figur = new Map(); // path -> {halaman, bbox}
  for (const pg of Array.isArray(doc.pages) ? doc.pages : []) {
    const luas = (pg.width || 0) * (pg.height || 0);
    for (const bl of Array.isArray(pg.blocks) ? pg.blocks : []) {
      if (!bl.image) continue;
      const [x1, y1, x2, y2] = bl.bbox || [0, 0, 0, 0];
      const rasio = luas ? ((x2 - x1) * (y2 - y1)) / luas : 0;
      if (rasio >= 0.9) halaman.set(bl.image, pg.number);
      else figur.set(bl.image, { halaman: pg.number, bbox: bl.bbox });
    }
  }
  return { halaman, figur };
}

/**
 * Satu root folder -> bab + daftar gambar yang perlu diunggah.
 * @param {{dokumen?: object, tex?: string}} proyek
 */
export function proyekScanKeBab(proyek = {}) {
  const { halaman, figur } = petaManifes(proyek.dokumen || {});
  const gambarDiperlukan = new Set();
  let bab = [];
  let viaTex = false;
  if (proyek.tex) {
    bab = parseMainTex(proyek.tex).bab;
    viaTex = bab.length > 0;
    if (viaTex) {
      for (const b of bab) {
        for (const s of b.sections) {
          s.blocks = s.blocks.map((bl) => {
            if (bl.tipe !== 'gambar' || !String(bl.src).startsWith('tex:')) return bl;
            const path = String(bl.src).slice(4);
            gambarDiperlukan.add(path);
            return { ...bl, src: `rel:${path}` };
          });
        }
      }
    }
  }
  if (!viaTex) {
    // FALLBACK: buku halaman gambar urut manifes (siap ekstraksi AI)
    const paths = [...halaman.entries()].sort((a, b) => a[1] - b[1]);
    const perGrup = 8;
    for (let i = 0; i < paths.length; i += perGrup) {
      const grup = paths.slice(i, i + perGrup);
      const b = {
        judul: `Halaman ${grup[0][1]}–${grup[grup.length - 1][1]}`,
        nomorBab: Math.floor(i / perGrup) + 1,
        sections: [{
          id: 's1',
          judul: '',
          blocks: grup.map(([path, no]) => {
            gambarDiperlukan.add(path);
            return { tipe: 'gambar', src: `rel:${path}`, alt: `halaman ${no}`, caption: `halaman ${no}` };
          }),
        }],
        ujiPemahaman: [],
        soalUraian: [],
      };
      bab.push(b);
    }
  }
  // Figur hanya diunggah bila benar-benar dirujuk main.tex (hemat
  // kuota penyimpanan: proyek scan punya ratusan crop); di mode
  // fallback hanya halaman utuh yang dipakai.
  return { bab, gambarDiperlukan: [...gambarDiperlukan], statistik: { halaman: halaman.size, figur: figur.size, babTex: viaTex ? bab.length : 0, fallback: !viaTex } };
}

/**
 * GABUNG beberapa root folder jadi satu kesatuan: bab dikonkat lalu
 * diurut (nomorBab), gambar dipetakan per root agar nama berkas yang
 * sama di folder beda tidak tabrakan.
 */
export function gabungProyekScan(listProyek = []) {
  const bab = [];
  const gambarPerRoot = new Map();
  const statistik = { root: 0, halaman: 0, figur: 0, fallback: 0 };
  for (const pr of listProyek) {
    const satu = proyekScanKeBab(pr);
    statistik.root += 1;
    statistik.halaman += satu.statistik.halaman;
    statistik.figur += satu.statistik.figur;
    if (satu.statistik.fallback) statistik.fallback += 1;
    gambarPerRoot.set(pr.root, satu.gambarDiperlukan);
    for (const b of satu.bab) bab.push({ ...b, rootAsal: pr.root });
  }
  bab.sort((a, b) => (a.nomorBab || 999) - (b.nomorBab || 999));
  return { bab, gambarPerRoot, statistik };
}

export default { parseMainTex, petaManifes, proyekScanKeBab, gabungProyekScan };
