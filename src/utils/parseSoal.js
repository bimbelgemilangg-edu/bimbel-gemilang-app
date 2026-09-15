// src/utils/parseSoal.js
// ============================================================
// PARSER MODUL HTML -> DAFTAR SOAL TERSTRUKTUR
// Dipakai oleh:
//  - LiveSessionTeacher.jsx  (sesi live dari bab buku digital)
//  - LiveSessionStudent.jsx  (render soal + cek jawaban siswa)
//  - KelasLivePanel.jsx      (Step 2 ClassSession, via soalKeFormatSesi)
// Sumber: field `html` di buku_digital/{bukuId}/bab/{babId}.
// Struktur HTML yang dibaca mengikuti template modul internal:
//   <div class="soal">
//     <div class="nbadges"><span class="no">N</span>
//       <span class="tipe">...</span><span class="lvl">...</span></div>
//     <p>teks soal</p>
//     <ul class="pil"><li>...</li></ul>  ATAU  <table class="ring"> (pernyataan)
//     <details class="kunci">
//       <div class="jawab">Jawaban: ...</div>
//       <ol class="langkah"><li>...</li></ol>
//     </details>
//   </div>
// ============================================================

const bersihTeks = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Buang simbol kotak centang (☐ □) dan huruf pilihan (A. B. C. D.) di awal item
const bersihItem = (s) => bersihTeks(s)
  .replace(/^[\u2610\u2611\u2612\u25A1\u25EB\u25FC]\s*/, '')
  .replace(/^[A-D][.).]\s*/, '');

/**
 * Parse seluruh blok .soal dari HTML modul.
 * @param {string} html - isi field `html` bab buku digital
 * @returns {Array} daftar soal: {idx, nomor, tipe, level, sumber, teks,
 *          pilihan[], pernyataan[], kunci{tipe,pg|multi|bs}, langkah[], pembahasan}
 */
export function parseDaftarSoal(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const soalEls = [...doc.querySelectorAll('.soal')];

  return soalEls.map((el, idx) => {
    const nomor = bersihTeks(el.querySelector('.no')?.textContent) || String(idx + 1);
    const sumber = bersihTeks(el.querySelector('.tipe')?.textContent) || '';
    const level = bersihTeks(el.querySelector('.lvl')?.textContent) || 'sedang';
    const teks = bersihTeks(el.querySelector('p')?.textContent) || '';

    // ---- kumpulkan pilihan / pernyataan ----
    const ul = el.querySelector('ul.pil') || el.querySelector('ul');
    let items = ul ? [...ul.querySelectorAll('li')].map((li) => bersihTeks(li.textContent)) : [];
    let dariTabel = false;
    if (items.length === 0) {
      const tabel = el.querySelector('table');
      if (tabel) {
        items = [...tabel.querySelectorAll('tbody tr')]
          .map((tr) => bersihTeks(tr.querySelector('td')?.textContent))
          .filter(Boolean);
        dariTabel = true;
      }
    }

    const berHuruf = items.filter((t) => /^[A-D][.).]/.test(t)).length;
    const details = el.querySelector('details');
    const jawabEl = details ? details.querySelector('.jawab') : null;

    // FALLBACK 1: kalau tidak ada elemen .jawab, cari teks "Jawaban: ..."
    // langsung di dalam details (maks 120 karakter supaya tidak makan pembahasan).
    let jawabTeks = bersihTeks(jawabEl?.textContent);
    if (!jawabTeks && details) {
      const m = (details.textContent || '').match(/Jawaban:[\s\S]{0,120}/i);
      if (m) jawabTeks = bersihTeks(m[0]);
    }

    // ---- tentukan tipe soal ----
    let tipe;
    if (berHuruf >= Math.max(1, items.length - 1) && items.length >= 2) {
      tipe = 'pg';
    } else if (/^Jawaban:\s*(Benar|Salah)/i.test(jawabTeks)) {
      tipe = 'bs';
    } else if (/Jawaban:\s*Pernyataan/i.test(jawabTeks) || /pernyataan\s*\d/i.test(jawabTeks)) {
      tipe = 'multi';
    } else if (dariTabel) {
      tipe = 'bs'; // tabel Pernyataan/Benar/Salah
    } else {
      tipe = 'multi';
    }

    const pilihan = tipe === 'pg'
      ? items.map((t) => t.replace(/^[A-D][.).]\s*/, ''))
      : (tipe === 'multi' ? items.map(bersihItem) : []);
    const pernyataan = tipe === 'bs' ? items.map(bersihItem) : [];

    // ---- parse kunci jawaban ----
    let kunci = null;
    if (tipe === 'pg') {
      const m = jawabTeks.match(/([A-D])\b/i);
      if (m) kunci = { tipe: 'pg', pg: m[1].toUpperCase().charCodeAt(0) - 65 };
    } else if (tipe === 'multi') {
      const m = jawabTeks.match(/(\d+(?:\s*,\s*\d+)*(?:\s*,?\s*dan\s*\d+)?)/);
      if (m) {
        const arr = m[1].replace(/dan/gi, ',').split(',')
          .map((x) => parseInt(x.trim(), 10) - 1)
          .filter((x) => !isNaN(x) && x >= 0);
        if (arr.length) kunci = { tipe: 'multi', multi: arr };
      }
    } else {
      const m = jawabTeks.match(/((?:Benar|Salah)(?:\s*,\s*(?:Benar|Salah))+)/i);
      if (m) kunci = { tipe: 'bs', bs: m[1].split(',').map((x) => x.trim().toLowerCase() === 'benar') };
    }

    // ---- langkah pembahasan ----
    const langkah = details
      ? [...details.querySelectorAll('.langkah li, ol li')].map((li) => bersihTeks(li.textContent))
      : [];

    // FALLBACK 2: pembahasan = isi details dikurangi teks summary & teks kunci,
    // supaya tidak dobel dengan `langkah` saat ditampilkan guru/siswa.
    const pembahasan = bersihTeks(
      details
        ? (details.textContent || '')
            .replace(/Lihat Kunci & Pembahasan/i, '')
            .replace(jawabTeks, '')
        : ''
    );

    return { idx, nomor, tipe, level, sumber, teks, pilihan, pernyataan, kunci, langkah, pembahasan };
  }).filter((s) => s.teks || s.pilihan.length || s.pernyataan.length);
}

/**
 * Konversi soal hasil parse ke bentuk yang dipakai sesi_live / KelasLivePanel.
 * Bentuk keluaran: { tipe:'pg'|'multi'|'bs', soal, opsiJawaban[], pernyataan[],
 *                    kunciJawaban (number|number[]|boolean[]), pembahasan }
 */
export function soalKeFormatSesi(s) {
  if (s.tipe === 'bs') {
    return {
      tipe: 'bs',
      soal: s.teks,
      opsiJawaban: [],
      pernyataan: s.pernyataan,
      kunciJawaban: s.kunci && Array.isArray(s.kunci.bs) ? s.kunci.bs : [],
      pembahasan: s.pembahasan || (s.langkah || []).join(' '),
    };
  }
  if (s.tipe === 'multi') {
    return {
      tipe: 'multi',
      soal: s.teks,
      opsiJawaban: s.pilihan,
      pernyataan: [],
      kunciJawaban: s.kunci && Array.isArray(s.kunci.multi) ? s.kunci.multi : [],
      pembahasan: s.pembahasan || (s.langkah || []).join(' '),
    };
  }
  return {
    tipe: 'pg',
    soal: s.teks,
    opsiJawaban: s.pilihan,
    pernyataan: [],
    kunciJawaban: s.kunci && typeof s.kunci.pg === 'number' ? s.kunci.pg : 0,
    pembahasan: s.pembahasan || (s.langkah || []).join(' '),
  };
}

/**
 * Cek kebenaran jawaban siswa terhadap kunci hasil parse.
 * @param {object} kunci - {tipe:'pg'|'multi'|'bs', pg?, multi?, bs?}
 * @param {*} jawaban - number (pg) | number[] (multi) | boolean[] (bs)
 */
export function cekBenar(kunci, jawaban) {
  if (!kunci) return false;
  if (kunci.tipe === 'pg') return jawaban === kunci.pg;
  if (kunci.tipe === 'multi') {
    return Array.isArray(jawaban) && jawaban.length === (kunci.multi || []).length &&
      (kunci.multi || []).every((i) => jawaban.includes(i));
  }
  if (kunci.tipe === 'bs') {
    return Array.isArray(jawaban) && jawaban.length === (kunci.bs || []).length &&
      jawaban.every((v, i) => v === kunci.bs[i]);
  }
  return false;
}

export default { parseDaftarSoal, soalKeFormatSesi, cekBenar };