// src/utils/adaptorBukuLatex.js
// ============================================================
// ADAPTOR DIALEK "HTML LaTeX + CROP PRESISI" (16 Okt 2026): owner
// mengekstrak sendiri buku PDF-nya menjadi HTML bermutu (latex asli
// $...$, gambar crop data-URI, soal beropsi A-E, dan KUNCI RESMI buku
// "1:C | 2:D | ..."). Jalur OCR-teks tidak layak untuk sumber semutu
// ini, maka adaptor deterministik ini memetakan dialect tersebut ke
// KONTRAK BAB READER (sections[].blocks tipe p/list/contoh/gambar +
// ujiPemahaman pg) — tanpa AI, tanpa kuota, dapat diuji.
// ============================================================

const entitas = (s) => String(s)
  .replace(/&#92;/g, '\\')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, ' ');

/** Buang tag tapi amankan latex & ambil semua <img> sebagai daftar src. */
function stripTagAmbilGambar(inner = '') {
  const gambar = [];
  const tanpaImg = String(inner).replace(/<img[^>]*src="([^"]+)"[^>]*>/g, (_m, src) => {
    gambar.push(src);
    return ' ';
  });
  const teks = entitas(tanpaImg
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return { teks, gambar };
}

const RE_ELEMEN = /<(h1|h2|h3|p|ul|blockquote|table)\b[^>]*>([\s\S]*?)<\/\1>/g;
// img BERDIRI SENDIRI di luar <p> (crop presisi materi): 44 buah di
// berkas owner lolos parse pertama (16 Okt) => alt-nya jadi caption.
const RE_IMG_SENDIRI = /^<img\b[^>]*>$/;
const RE_SOAL = /^(\d{1,3})\.\s*([\s\S]*)$/;
const RE_OPSI_BULET = /^\*\s*([A-E])\.\s*([\s\S]*)$/;
const RE_KUNCI_JUDUL = /^kunci jawaban/i;
const RE_PASANGAN_KUNCI = /(\d{1,3})\s*:\s*([A-E])/g;

/**
 * @param {string} html berkas HTML dialect latex-crop
 * @returns {{bab: Array, statistik: object, judulBuku: string}}
 */
export function adaptorBukuLatex(html = '') {
  const body = String(html)
    .replace(/<head[\s\S]*?<\/head>/i, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const babList = [];
  let judulBuku = '';
  let bab = null;
  let seksi = null;
  const statistik = { bab: 0, seksi: 0, blok: 0, soal: 0, soalBerkunci: 0, gambar: 0, tabel: 0 };

  const bukaSeksi = (judul) => {
    seksi = { id: `s${(bab?.sections?.length || 0) + 1}`, judul, blocks: [] };
    bab.sections.push(seksi);
    statistik.seksi += 1;
  };
  const pushBlok = (blok) => {
    if (!seksi) bukaSeksi('');
    seksi.blocks.push(blok);
    statistik.blok += 1;
  };

  let m;
  let lastSoal = null;
  const RE_TOKEN = /<(h1|h2|h3|p|ul|blockquote|table)\b[^>]*>[\s\S]*?<\/\1>|<img\b[^>]*>/g;
  while ((m = RE_TOKEN.exec(body))) {
    const token = m[0];
    if (RE_IMG_SENDIRI.test(token.trim())) {
      if (!bab) continue;
      const src = (token.match(/src="([^"]+)"/) || [])[1];
      const alt = entitas((token.match(/alt="([^"]*)"/) || [])[1] || '');
      if (src) {
        pushBlok({ tipe: 'gambar', src, alt, caption: alt });
        statistik.gambar += 1;
      }
      continue;
    }
    const tag = m[1];
    const inner = token.slice(token.indexOf('>') + 1, token.lastIndexOf('</'));
    if (tag === 'h1') {
      const judul = entitas(inner.replace(/<[^>]+>/g, '')).trim();
      if (/^bab\b/i.test(judul)) {
        bab = { judul, sections: [], ujiPemahaman: [], kunciMap: null };
        babList.push(bab);
        statistik.bab += 1;
        seksi = null;
      } else if (!judulBuku) judulBuku = judul;
      continue;
    }
    if (!bab) continue;
    if (tag === 'h2' || tag === 'h3') { bukaSeksi(entitas(inner.replace(/<[^>]+>/g, '')).trim()); continue; }
    if (tag === 'ul') {
      const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
        .map((li) => stripTagAmbilGambar(li[1]).teks).filter(Boolean);
      if (items.length) pushBlok({ tipe: 'list', items });
      continue;
    }
    if (tag === 'blockquote') {
      const { teks } = stripTagAmbilGambar(inner);
      if (!teks) continue;
      if (lastSoal && /solusi|pembahasan/i.test(teks)) lastSoal.pembahasan = teks;
      else pushBlok({ tipe: 'contoh', teks });
      continue;
    }
    if (tag === 'table') {
      const rows = [...inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
        .map((tr) => [...tr[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)]
          .map((td) => stripTagAmbilGambar(td[1]).teks).join(' | ')).filter(Boolean);
      if (rows.length) { pushBlok({ tipe: 'list', items: rows }); statistik.tabel += 1; }
      continue;
    }
    // tag === 'p'
    const { teks, gambar } = stripTagAmbilGambar(inner);
    statistik.gambar += gambar.length;
    if (RE_KUNCI_JUDUL.test(teks)) {
      // kunci RESMI buku datang di AKHIR bab: simpan peta, pasang setelah parse
      const map = {};
      for (const p of teks.matchAll(RE_PASANGAN_KUNCI)) map[Number(p[1])] = p[2];
      bab.kunciMap = map;
      continue;
    }
    const baris = teks.split('\n');
    const head = (baris[0] || '').trim();
    const soalMatch = head.match(RE_SOAL);
    const adaOpsi = baris.some((b) => RE_OPSI_BULET.test(b.trim()));
    if (soalMatch && adaOpsi) {
      const pilihan = [];
      const stem = [];
      baris.forEach((b, i) => {
        const opt = b.trim().match(RE_OPSI_BULET);
        if (opt) pilihan.push(opt[2].trim());
        else if (i === 0) stem.push(head.replace(RE_SOAL, '$2').trim());
        else stem.push(b.trim());
      });
      const q = {
        tipe: 'pg',
        nomor: Number(soalMatch[1]),
        soal: stem.join('\n').trim(),
        pilihan,
        benar: null,
        pembahasan: '',
        gambarUrls: gambar,
      };
      bab.ujiPemahaman.push(q);
      lastSoal = q;
      statistik.soal += 1;
      continue;
    }
    const jw = teks.match(/^jawaban\s*:\s*([A-E])\b/i);
    if (jw && lastSoal && lastSoal.benar === null) {
      lastSoal.benar = jw[1].toUpperCase().charCodeAt(0) - 65;
      lastSoal.kunciResmiBuku = true;
      statistik.soalBerkunci += 1;
      continue;
    }
    if (teks) pushBlok({ tipe: 'p', teks: teks.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim() });
  }

  // pasang kunci resmi buku ke nomor soal per bab (jujur: tanpa kunci = null)
  for (const b of babList) {
    const map = b.kunciMap || {};
    for (const q of b.ujiPemahaman) {
      const huruf = map[q.nomor];
      if (huruf && q.benar === null) {
        q.benar = huruf.charCodeAt(0) - 65;
        q.kunciResmiBuku = true;
        statistik.soalBerkunci += 1;
      }
    }
    delete b.kunciMap;
  }

  return { bab: babList, statistik, judulBuku };
}

export default { adaptorBukuLatex };
