// src/utils/parseSoal.js
// Parser modul HTML -> soal terstruktur + slide PPT.
// FIX: (a) opsi/pernyataan TIDAK diambil dari dalam <details> (blok kunci),
// (b) akhiran verdict "(Benar)/(Salah)" dibuang dari teks tampilan,
// (c) fallback pencarian opsi lebih lengkap supaya tidak ada soal kosong,
// (d) 🔥 BARU: elemen gambar (svg/img/figslot/caption) di dalam .soal
//     ikut diekstrak sebagai `gambarHtml` supaya figur tampil di sesi live.
const bersihTeks = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Buang akhiran kunci yang bocor di teks pernyataan/pilihan.
export const bersihVerdikt = (s) => String(s || '')
  .replace(/\s*\((Benar|Salah)\)\s*\.?\s*$/i, '')
  .replace(/\s*\[(Benar|Salah)\]\s*\.?\s*$/i, '')
  .replace(/\s*→\s*(Benar|Salah)\s*\.?\s*$/i, '')
  .replace(/\s*:\s*(Benar|Salah)\s*\.?\s*$/i, '')
  .trim();

const bersihItem = (s) => bersihVerdikt(bersihTeks(s)
  .replace(/^[\u2610\u2611\u2612\u25A1\u25EB\u25FC]\s*/, '')
  .replace(/^[A-D][.).]\s*/, ''));

export function parseDaftarSoal(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const soalEls = [...doc.querySelectorAll('.soal')];
  return soalEls.map((el, idx) => {
    const nomor = bersihTeks(el.querySelector('.no')?.textContent) || String(idx + 1);
    const sumber = bersihTeks(el.querySelector('.tipe')?.textContent) || '';
    const level = bersihTeks(el.querySelector('.lvl')?.textContent) || 'sedang';
    const teks = bersihTeks(el.querySelector('p')?.textContent) || '';

    // ---- kumpulkan opsi HANYA dari luar <details> ----
    const diLuar = (node) => !node.closest('details');
    let items = [...el.querySelectorAll('ul.pil li')].filter(diLuar).map((li) => bersihTeks(li.textContent));
    let dariTabel = false;
    if (!items.length) {
      const tabel = [...el.querySelectorAll('table')].find(diLuar);
      if (tabel) {
        items = [...tabel.querySelectorAll('tbody tr')]
          .map((tr) => bersihTeks(tr.querySelector('td')?.textContent))
          .filter(Boolean);
        dariTabel = true;
      }
    }
    if (!items.length) {
      items = [...el.querySelectorAll('ul li, ol li')].filter(diLuar).map((li) => bersihTeks(li.textContent)).filter(Boolean);
    }

    // ---- 🔥 BARU: ambil figur (svg/img/figslot/caption) di luar details,
    //      di luar daftar pilihan & tabel pernyataan ----
    const figEls = [...el.querySelectorAll('svg, img, .figslot, .caption')]
      .filter((n) => !n.closest('details') && !n.closest('ul.pil') && !n.closest('table'));
    const gambarHtml = figEls.map((n) => n.outerHTML).join('');

    const berHuruf = items.filter((t) => /^[A-D][.).]/.test(t)).length;
    const details = el.querySelector('details');
    const jawabEl = details ? details.querySelector('.jawab') : null;
    let jawabTeks = bersihTeks(jawabEl?.textContent);
    if (!jawabTeks && details) {
      const m = (details.textContent || '').match(/Jawaban:[\s\S]{0,120}/i);
      if (m) jawabTeks = bersihTeks(m[0]);
    }

    let tipe;
    if (berHuruf >= Math.max(1, items.length - 1) && items.length >= 2) tipe = 'pg';
    else if (/^Jawaban:\s*(Benar|Salah)/i.test(jawabTeks)) tipe = 'bs';
    else if (/Jawaban:\s*Pernyataan/i.test(jawabTeks) || /pernyataan\s*\d/i.test(jawabTeks)) tipe = 'multi';
    else if (dariTabel) tipe = 'bs';
    else tipe = 'multi';

    const pilihan = tipe === 'pg'
      ? items.map((t) => bersihItem(t.replace(/^[A-D][.).]\s*/, '')))
      : (tipe === 'multi' ? items.map(bersihItem) : []);
    const pernyataan = tipe === 'bs' ? items.map(bersihItem) : [];

    let kunci = null;
    if (tipe === 'pg') {
      const m = jawabTeks.match(/([A-D])\b/i);
      if (m) kunci = { tipe: 'pg', pg: m[1].toUpperCase().charCodeAt(0) - 65 };
    } else if (tipe === 'multi') {
      const m = jawabTeks.match(/(\d+(?:\s*,\s*\d+)*(?:\s*,?\s*dan\s*\d+)?)/);
      if (m) {
        const arr = m[1].replace(/dan/gi, ',').split(',').map((x) => parseInt(x.trim(), 10) - 1).filter((x) => !isNaN(x) && x >= 0);
        if (arr.length) kunci = { tipe: 'multi', multi: arr };
      }
    } else {
      const m = jawabTeks.match(/((?:Benar|Salah)(?:\s*,\s*(?:Benar|Salah))+)/i);
      if (m) kunci = { tipe: 'bs', bs: m[1].split(',').map((x) => x.trim().toLowerCase() === 'benar') };
    }

    const langkah = details ? [...details.querySelectorAll('.langkah li, ol li')].map((li) => bersihTeks(li.textContent)) : [];
    const pembahasan = bersihTeks(details ? (details.textContent || '').replace(/Lihat Kunci & Pembahasan/i, '').replace(jawabTeks, '') : '');
    return { idx, nomor, tipe, level, sumber, teks, pilihan, pernyataan, kunci, langkah, pembahasan, gambarHtml };
  }).filter((s) => s.teks || s.pilihan.length || s.pernyataan.length);
}

export function cekBenar(kunci, jawaban) {
  if (!kunci) return false;
  if (kunci.tipe === 'pg') return jawaban === kunci.pg;
  if (kunci.tipe === 'multi') return Array.isArray(jawaban) && jawaban.length === (kunci.multi || []).length && (kunci.multi || []).every((i) => jawaban.includes(i));
  if (kunci.tipe === 'bs') return Array.isArray(jawaban) && jawaban.length === (kunci.bs || []).length && jawaban.every((v, i) => v === kunci.bs[i]);
  return false;
}

export const CSS_MODUL = `
.modmod{font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1e293b}
.modmod .kartu{background:#fff;border-radius:14px;border-left:6px solid #4C6EF5;padding:16px;margin:10px 0}
.modmod h2.sec{margin:0 0 10px;font-size:18px}
.modmod h3.sub{margin:14px 0 6px;font-size:15px;color:#5b4b8a}
.modmod .rumus{background:#eef2ff;border:1px dashed #4C6EF5;border-radius:12px;padding:10px;text-align:center;font-size:17px;font-weight:800;margin:8px 0}
.modmod .rumus small{display:block;font-size:12px;font-weight:600;color:#64748b;margin-top:3px}
.modmod ul.sifat{margin:6px 0;padding-left:20px;font-size:13.5px}
.modmod ul.sifat li{margin:3px 0}
.modmod table.ring{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
.modmod table.ring th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
.modmod table.ring td{border:1px solid #e3e6ef;padding:5px 8px}
.modmod svg,.modmod img{max-width:100%;height:auto;display:block;margin:8px auto}
.modmod .figslot{border:2px dashed #cbd5e1;border-radius:10px;padding:14px;text-align:center;color:#64748b;font-size:12px;font-weight:700;margin:8px 0}
.modmod .caption{text-align:center;font-size:11.5px;color:#64748b}
.modmod .tips{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:10px 12px;font-size:13.5px;margin:10px 0}
`;

export function parseSlides(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const slides = [];
  const hero = doc.querySelector('.hero');
  if (hero) {
    slides.push({
      tipe: 'cover',
      judul: bersihTeks(hero.querySelector('h1')?.textContent) || 'Materi',
      chips: [...hero.querySelectorAll('.chips span')].map((s) => bersihTeks(s.textContent)),
    });
  }
  doc.querySelectorAll('.kartu').forEach((k) => {
    slides.push({ tipe: 'materi', judul: bersihTeks(k.querySelector('h2.sec')?.textContent) || 'Materi', html: k.outerHTML });
  });
  parseDaftarSoal(html).forEach((s, i) => slides.push({ tipe: 'soal', soalIdx: i, nomor: s.nomor, tipeSoal: s.tipe }));
  const tips = doc.querySelector('.tips');
  if (tips) slides.push({ tipe: 'refleksi', judul: 'Refleksi', html: tips.outerHTML });
  return slides;
}

export default { parseDaftarSoal, parseSlides, cekBenar, bersihVerdikt, CSS_MODUL };