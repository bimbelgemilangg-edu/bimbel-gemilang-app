// src/utils/parseTeksBuku.js
// ============================================================
// MODE TEKS (owner 15 Okt: "sistem tinggal menerima secara bersih"):
// parse teks hasil OCR (PDF24 OCR / Google Docs / Word save-as text)
// menjadi struktur bab buku digital + soal pg, TANPA panggilan AI
// vision — bebas kuota & deterministik.
//
// Kontrak masukan: teks polos per baris (dari .txt, atau .html yang
// sudah dilucuti tag). Aturan yang dikenali (toleran noise OCR):
//   • Judul bab   : "BAB 2 PERSAMAAN KUADRAT" / "Bab 2. Persamaan ..."
//   • Judul subbab: "A. Definisi" / "2.1 Sifat-sifat"
//   • Blok contoh : baris dimulai "Contoh" / "Contoh Soal"
//   • Soal pg     : "1." / "12)" diikuti baris pilihan a./b./... atau (A)/(B)
//   • Kunci       : "Kunci: B" / "Jawaban: B" / "Kunci Jawaban: B"
//   • Pembahasan  : "Pembahasan:" s.d. soal berikutnya / subbab berikutnya
// Selain itu dianggap paragraf materi (baris lanjutan digabung).
// ============================================================

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const RE_BAB = /^bab\s+\d+[.:)-]?\s*.+$/i;
const RE_SUBBAB = /^([A-Z]\.\s+.+|\d+\.\d+\s+.+)$/;
const RE_CONTOH = /^contoh(\s+soal)?\s*[:.-]?\s*/i;
const RE_SOAL = /^(\d{1,3})[.)]\s+(.+)$/;
const RE_OPSI = /^(?:\(?([a-eA-E])[.)]?\s+)(.+)$/;
const RE_KUNCI = /^(?:kunci(?:\s+jawaban)?|jawaban)\s*[:=]?\s*\(?([a-eA-E])\)?.*$/i;
const RE_BAHAS = /^pembahasan\s*[:.-]?\s*(.*)$/i;

/**
 * @param {string} teks
 * @returns {{bab: Array<object>}} bab: [{judul, sections:[{judul,blocks}], ujiPemahaman:[{tipe,soal,pilihan,benar,pembahasan}]}]
 */
export function parseTeksBuku(teks = '') {
  const baris = String(teks || '').split(/\r?\n/).map((l) => l.replace(/\s+$/g, ''));
  const RE_PENANDA_HAL = /^---\s*HALAMAN\s+(\d+)\s*---$/i;
  const babList = [];
  let halamanKini = null;
  let bab = null;
  let seksi = null;
  let mode = 'materi'; // materi | contoh | soal | bahas
  let soalAktif = null;
  let buffer = [];

  const flushParagraf = () => {
    const t = norm(buffer.join(' '));
    buffer = [];
    if (!t || !seksi) return;
    seksi.blocks.push({ jenis: mode === 'contoh' ? 'contoh' : 'p', teks: t, halaman: halamanKini });
  };

  const tutupSoal = () => {
    if (soalAktif && soalAktif.pilihan.length >= 2 && bab) {
      bab.ujiPemahaman.push(soalAktif);
    }
    soalAktif = null;
  };

  const antrian = baris.slice();
  const multiOpsi = (t) => ((t.match(/\([A-E]\)/g) || []).length >= 2)
    || ((t.match(/(^|\s)[a-e]\./g) || []).length >= 2);
  while (antrian.length) {
    const mentah = antrian.shift();
    const l = norm(mentah);
    if (!l) { flushParagraf(); continue; }

    let m;
    if ((m = l.match(RE_PENANDA_HAL))) { halamanKini = Number(m[1]); continue; }
    if ((m = l.match(RE_BAB))) {
      flushParagraf(); tutupSoal();
      bab = { judul: m[0], sections: [], ujiPemahaman: [] };
      babList.push(bab);
      seksi = { judul: '', blocks: [] };
      bab.sections.push(seksi);
      mode = 'materi';
      continue;
    }
    if (!bab) continue; // teks sebelum bab pertama dibuang (sampul dll)
    if (mode === 'bahas' && RE_SOAL.test(l)) mode = 'materi'; // pembahasan selesai, soal baru mulai
    if ((m = l.match(RE_SUBBAB)) && mode !== 'soal') {
      flushParagraf();
      seksi = { judul: l, blocks: [] };
      bab.sections.push(seksi);
      mode = 'materi';
      continue;
    }
    if ((m = l.match(RE_KUNCI)) && soalAktif) {
      flushParagraf();
      soalAktif.benar = m[1].toUpperCase().charCodeAt(0) - 65;
      continue;
    }
    if ((m = l.match(RE_BAHAS))) {
      flushParagraf();
      mode = 'bahas';
      if (soalAktif) { if (m[1]) soalAktif.pembahasan = m[1]; }
      else if (bab.ujiPemahaman.length && m[1]) {
        const terakhir = bab.ujiPemahaman[bab.ujiPemahaman.length - 1];
        terakhir.pembahasan = m[1];
      }
      continue;
    }
    if ((m = l.match(RE_CONTOH))) {
      flushParagraf(); tutupSoal();
      mode = 'contoh';
      const sisa = norm(l.slice(m[0].length));
      if (sisa) buffer.push(sisa);
      continue;
    }
    if (mode === 'bahas') {
      if (soalAktif) soalAktif.pembahasan += (soalAktif.pembahasan ? ' ' : '') + l;
      else if (bab.ujiPemahaman.length) {
        const terakhir = bab.ujiPemahaman[bab.ujiPemahaman.length - 1];
        terakhir.pembahasan += (terakhir.pembahasan ? ' ' : '') + l;
      }
      continue;
    }
    if ((m = l.match(RE_SOAL))) {
      flushParagraf(); tutupSoal();
      soalAktif = { tipe: 'pg', soal: m[2], pilihan: [], benar: null, pembahasan: '', halaman: halamanKini };
      mode = 'soal';
      continue;
    }
    if (mode === 'soal' && soalAktif && multiOpsi(l)) {
      const bagian = l.split(/(?=\([A-E]\))|(?=(?:^|\s)[a-e]\.)/).map(norm).filter(Boolean);
      antrian.unshift(...bagian);
      continue;
    }
    if (mode === 'soal' && soalAktif && (m = l.match(RE_OPSI))) {
      soalAktif.pilihan.push(m[2]);
      continue;
    }
    if (mode === 'soal' && soalAktif && soalAktif.pilihan.length >= 2) {
      // baris bukan opsi lagi setelah pilihan lengkap: soal selesai tanpa kunci
      tutupSoal();
      mode = 'materi';
    }
    buffer.push(l);
  }
  flushParagraf(); tutupSoal();

  // bersihkan bab kosong & soal tanpa kunci (jujur: tanpa kunci tidak masuk bank)
  const hasil = babList
    .map((b) => ({
      ...b,
      sections: b.sections.filter((s) => s.blocks.length || s.judul),
      ujiPemahaman: b.ujiPemahaman.filter((s) => s.benar !== null),
    }))
    .filter((b) => b.sections.length || b.ujiPemahaman.length);
  return { bab: hasil };
}

/** HTML -> teks polos sederhana (untuk mode teks dari berkas .html ber-OCR). */
export function htmlKeTeks(html = '') {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export default { parseTeksBuku, htmlKeTeks };

/**
 * Susun teks baca dari item textContent pdfjs (PDF berlapis teks/OCR).
 * Item OCR sering berupa potongan kata/huruf berposisi; baris disusun
 * dari koordinat y, spasi disisipkan bila celah x antar-item nyata.
 * MURNI & TERUJI — dipakai wizard mode PDF & tool ekstraksi lokal.
 * @param {Array<{str:string, transform:number[], width:number, hasEOL?:boolean}>} items
 */
export function susunTeksDariItem(items = []) {
  const baris = new Map();
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || typeof it.str !== 'string') continue;
    const x = Number(it.transform?.[4]) || 0;
    const y = Math.round(Number(it.transform?.[5]) || 0);
    if (!baris.has(y)) baris.set(y, []);
    baris.get(y).push({ x, s: it.str, w: Number(it.width) || 0 });
  }
  const keluar = [];
  for (const y of [...baris.keys()].sort((a, b) => b - a)) {
    const arr = baris.get(y).sort((a, b) => a.x - b.x);
    let line = '';
    arr.forEach((t, i) => {
      if (i > 0) {
        const gap = t.x - (arr[i - 1].x + arr[i - 1].w);
        if (gap > 1.5) line += ' ';
      }
      line += t.s;
    });
    if (line.trim()) keluar.push(line.trimEnd());
  }
  return keluar.join('\n');
}

/**
 * Pembersihan noise OCR deterministik (tanpa AI): rapikan spasi ganda,
 * buang baris yang hanya nomor halaman / simbol berulang, satukan kata
 * yang terputus akhir baris dengan tanda hubung. Aman & teruji.
 */
export function bersihkanTeksOcr(teks = '') {
  return String(teks || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s{2,}/g, ' ').trim())
    .filter((l) => !(l && /^\d{1,4}$/.test(l) === false && /^[\W\d]{1,6}$/.test(l) && /\d/.test(l) && l.length <= 6))
    .filter((l) => !/^\d{1,4}$/.test(l)) // nomor halaman sendirian
    .join('\n')
    .replace(/-\n([a-zA-Z0-9])/g, '$1') // kata terputus hyphen
    .replace(/\n{3,}/g, '\n\n');
}
