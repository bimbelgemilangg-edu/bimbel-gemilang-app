// src/utils/parseSoal.js
// Parser modul HTML -> soal terstruktur + slide PPT + CSS matematika.
// Membaca struktur modul internal: blok .soal dengan badge .no/.tipe/.lvl,
// tabel pernyataan Benar/Salah (header "Pernyataan|Benar|Salah"), daftar
// ul.pil untuk PG/multi, tabel stimulus (Nomor|Persamaan dll), dan
// <details> kunci+pembahasan. Figur & tabel stimulus ikut ditampilkan
// urut sesuai aslinya (gambarHtml), dan CSS_MODUL memuat gaya akar/
// pecahan supaya bentuk matematika tidak membingungkan siswa.
const bersihTeks = (s) => String(s || '').replace(/\s+/g, ' ').trim();

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
    const diLuar = (n) => !n.closest('details');

    const tabels = [...el.querySelectorAll('table')].filter(diLuar);
    const headText = (t) => ((t.querySelector('thead') || t.querySelector('tr'))?.textContent || '').toLowerCase();
    const tabelBS = tabels.find((t) => {
      const h = headText(t);
      return h.includes('pernyataan') && (h.includes('benar') || h.includes('salah'));
    });
    const tabelPernyataan = tabelBS || tabels.find((t) => {
      const rows = [...t.querySelectorAll('tbody tr')];
      if (!rows.length) return false;
      const avg = rows.reduce((a, tr) => a + bersihTeks(tr.querySelector('td')?.textContent).length, 0) / rows.length;
      return avg > 24;
    });

    // Tubuh soal = semua anak langsung kecuali daftar pilihan, details,
    // badge, dan tabel pernyataan (dirender terpisah sebagai grid CBT).
    const skipNode = (n) => {
      const tag = (n.tagName || '').toUpperCase();
      if (tag === 'UL' || tag === 'DETAILS' || tag === 'OL') return true;
      if (n.classList && (n.classList.contains('nbadges') || n.classList.contains('pil'))) return true;
      if (n === tabelPernyataan) return true;
      return false;
    };
    const bodyEls = [...el.children].filter((n) => !skipNode(n));
    const gambarHtml = bodyEls.map((n) => n.outerHTML).join('');
    const teks = bodyEls.map((n) => bersihTeks(n.textContent)).filter(Boolean).join(' ')
      || bersihTeks(el.querySelector('p')?.textContent) || '';

    const pilItems = [...el.querySelectorAll('ul.pil li')].filter(diLuar).map((li) => bersihTeks(li.textContent));
    let items = pilItems.length
      ? pilItems
      : tabelPernyataan
        ? [...tabelPernyataan.querySelectorAll('tbody tr')].map((tr) => bersihTeks(tr.querySelector('td')?.textContent)).filter(Boolean)
        : [...el.querySelectorAll('ul li, ol li')].filter(diLuar).map((li) => bersihTeks(li.textContent)).filter(Boolean);

    const berHuruf = items.filter((t) => /^[A-D][.).]/.test(t)).length;
    const details = el.querySelector('details');
    const jawabEl = details ? details.querySelector('.jawab') : null;
    let jawabTeks = bersihTeks(jawabEl?.textContent);
    if (!jawabTeks && details) {
      const m = (details.textContent || '').match(/Jawaban:[\s\S]{0,120}/i);
      if (m) jawabTeks = bersihTeks(m[0]);
    }

    let tipe;
    if (pilItems.length && berHuruf >= Math.max(1, pilItems.length - 1) && pilItems.length >= 2) tipe = 'pg';
    else if (/^Jawaban:\s*(Benar|Salah)/i.test(jawabTeks) || tabelBS) tipe = 'bs';
    else if (/Jawaban:\s*Pernyataan/i.test(jawabTeks) || /pernyataan\s*\d/i.test(jawabTeks)) tipe = 'multi';
    else if (pilItems.length && !berHuruf) tipe = 'multi';
    else if (!pilItems.length && tabelPernyataan) tipe = 'bs';
    else if (berHuruf) tipe = 'pg';
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

    let pembahasanHtml = '';
    if (details) {
      const clone = details.cloneNode(true);
      clone.querySelector('summary')?.remove();
      clone.querySelector('.jawab')?.remove();
      pembahasanHtml = clone.innerHTML;
    }

    return { idx, nomor, tipe, level, sumber, teks, pilihan, pernyataan, kunci, langkah, pembahasan, pembahasanHtml, gambarHtml };
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
.modmod table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
.modmod table th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
.modmod table td{border:1px solid #e3e6ef;padding:5px 8px}
.modmod table.ring{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
.modmod table.ring th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
.modmod table.ring td{border:1px solid #e3e6ef;padding:5px 8px}
.modmod svg,.modmod img{max-width:100%;height:auto;display:block;margin:8px auto}
.modmod .figslot{border:2px dashed #cbd5e1;border-radius:10px;padding:14px;text-align:center;color:#64748b;font-size:12px;font-weight:700;margin:8px 0}
.modmod .caption{text-align:center;font-size:11.5px;color:#64748b}
.modmod .tips{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:10px 12px;font-size:13.5px;margin:10px 0}
.modmod ol,.modmod ul{padding-left:22px;margin:6px 0}
.modmod ol li,.modmod ul li{margin:4px 0;line-height:1.6}
.modmod p{margin:6px 0;line-height:1.7}
.modmod .vinc{border-top:1.5px solid currentColor;padding:0 2px;margin-left:1px}
.modmod .akar{white-space:nowrap}
.modmod sup,.modmod sub{font-size:.7em;line-height:0}
.modmod .pec{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 3px}
.modmod .pec-pemb{padding:0 4px 1px;border-bottom:1.5px solid currentColor;font-size:.82em}
.modmod .pec-peny{padding:1px 4px 0;font-size:.82em}
.modmod .m{background:#eef2ff;border:1px solid #dbe3ff;color:#1e293b;padding:2px 7px;border-radius:7px}
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

export default { parseDaftarSoal, parseSlides, cekBenar, bersihVerdikt, CSS_MODUL };// src/utils/parseSoal.js
// Parser modul HTML -> soal terstruktur + slide PPT + CSS matematika.
// MENDUKUNG semua pola hasil scan PDF, termasuk modul NON-matematika:
//  - PG (pilihan A-D), multi-select (checkbox / "jawaban lebih dari satu"),
//  - Benar/Salah DAN Setuju/Tidak Setuju (tabel Pernyataan|Benar|Salah
//    maupun Pernyataan|S|TS), kunci "Jawaban: B", "Jawaban: Pernyataan
//    1, 2, dan 4", "Jawaban: Benar, Salah, ...", "Jawaban: Setuju,
//    Tidak Setuju, ...".
//  - Figur SVG inline + tabel stimulus ikut ditampilkan (gambarHtml).
//  - Tipografi matematika dipercantik lewat percantikMatika (matika.js)
//    di lapisan render, bukan di parser ini.
const bersihTeks = (s) => String(s || '').replace(/\s+/g, ' ').trim();

export const bersihVerdikt = (s) => String(s || '')
  .replace(/\s*\((Benar|Salah)\)\s*\.?\s*$/i, '')
  .replace(/\s*\[(Benar|Salah)\]\s*\.?\s*$/i, '')
  .replace(/\s*→\s*(Benar|Salah)\s*\.?\s*$/i, '')
  .replace(/\s*:\s*(Benar|Salah)\s*\.?\s*$/i, '')
  .trim();

const bersihItem = (s) => bersihVerdikt(bersihTeks(s)
  .replace(/^[\u2610\u2611\u2612\u25A1\u25EB\u25FC]\s*/, '')
  .replace(/^[A-D][.).]\s*/, ''));

// 🔥 BARU: header tabel pernyataan dikenali untuk DUA varian kolom:
// "Pernyataan|Benar|Salah" MAUPUN "Pernyataan|S|TS" (Setuju/Tidak Setuju).
const isBsHeader = (h) =>
  h.includes('pernyataan') &&
  (h.includes('benar') || h.includes('salah') || h.includes('setuju') || /\bts\b/.test(h));

// 🔥 BARU: satu token kunci bs -> boolean (Setuju/Benar = true).
const tokenBs = (t) => {
  const x = t.trim().toLowerCase();
  return (x === 'benar' || x === 'setuju');
};

export function parseDaftarSoal(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const soalEls = [...doc.querySelectorAll('.soal')];
  return soalEls.map((el, idx) => {
    const nomor = bersihTeks(el.querySelector('.no')?.textContent) || String(idx + 1);
    const sumber = bersihTeks(el.querySelector('.tipe')?.textContent) || '';
    const level = bersihTeks(el.querySelector('.lvl')?.textContent) || 'sedang';
    const diLuar = (n) => !n.closest('details');

    const tabels = [...el.querySelectorAll('table')].filter(diLuar);
    const headText = (t) => ((t.querySelector('thead') || t.querySelector('tr'))?.textContent || '').toLowerCase();
    const tabelBS = tabels.find((t) => isBsHeader(headText(t)));
    const tabelPernyataan = tabelBS || tabels.find((t) => {
      const rows = [...t.querySelectorAll('tbody tr')];
      if (!rows.length) return false;
      const avg = rows.reduce((a, tr) => a + bersihTeks(tr.querySelector('td')?.textContent).length, 0) / rows.length;
      return avg > 24;
    });

    const skipNode = (n) => {
      const tag = (n.tagName || '').toUpperCase();
      if (tag === 'UL' || tag === 'DETAILS' || tag === 'OL') return true;
      if (n.classList && (n.classList.contains('nbadges') || n.classList.contains('pil'))) return true;
      if (n === tabelPernyataan) return true;
      return false;
    };
    const bodyEls = [...el.children].filter((n) => !skipNode(n));
    const gambarHtml = bodyEls.map((n) => n.outerHTML).join('');
    const teks = bodyEls.map((n) => bersihTeks(n.textContent)).filter(Boolean).join(' ')
      || bersihTeks(el.querySelector('p')?.textContent) || '';

    const pilItems = [...el.querySelectorAll('ul.pil li')].filter(diLuar).map((li) => bersihTeks(li.textContent));
    let items = pilItems.length
      ? pilItems
      : tabelPernyataan
        ? [...tabelPernyataan.querySelectorAll('tbody tr')].map((tr) => bersihTeks(tr.querySelector('td')?.textContent)).filter(Boolean)
        : [...el.querySelectorAll('ul li, ol li')].filter(diLuar).map((li) => bersihTeks(li.textContent)).filter(Boolean);

    const berHuruf = items.filter((t) => /^[A-D][.).]/.test(t)).length;
    const details = el.querySelector('details');
    const jawabEl = details ? details.querySelector('.jawab') : null;
    let jawabTeks = bersihTeks(jawabEl?.textContent);
    if (!jawabTeks && details) {
      const m = (details.textContent || '').match(/Jawaban:[\s\S]{0,160}/i);
      if (m) jawabTeks = bersihTeks(m[0]);
    }

    let tipe;
    if (pilItems.length && berHuruf >= Math.max(1, pilItems.length - 1) && pilItems.length >= 2) tipe = 'pg';
    else if (/^Jawaban:\s*(Benar|Salah|Setuju|Tidak\s+Setuju)/i.test(jawabTeks) || tabelBS) tipe = 'bs';
    else if (/Jawaban:\s*Pernyataan/i.test(jawabTeks) || /pernyataan\s*\d/i.test(jawabTeks)) tipe = 'multi';
    else if (pilItems.length && !berHuruf) tipe = 'multi';
    else if (!pilItems.length && tabelPernyataan) tipe = 'bs';
    else if (berHuruf) tipe = 'pg';
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
      // 🔥 BARU: terima Benar/Salah DAN Setuju/Tidak Setuju (urutan penting:
      // "Tidak Setuju" dicek lebih dulu supaya tidak tertelan "Setuju").
      const m = jawabTeks.match(/((?:Tidak\s+Setuju|Setuju|Benar|Salah)(?:\s*,\s*(?:Tidak\s+Setuju|Setuju|Benar|Salah))+)/i);
      if (m) kunci = { tipe: 'bs', bs: m[1].split(',').map(tokenBs) };
      if (!kunci) {
        const s = jawabTeks.match(/^Jawaban:\s*(Tidak\s+Setuju|Setuju|Benar|Salah)\s*$/i);
        if (s) kunci = { tipe: 'bs', bs: [tokenBs(s[1])] };
      }
    }

    const langkah = details ? [...details.querySelectorAll('.langkah li, ol li')].map((li) => bersihTeks(li.textContent)) : [];
    const pembahasan = bersihTeks(details ? (details.textContent || '').replace(/Lihat Kunci & Pembahasan/i, '').replace(jawabTeks, '') : '');

    let pembahasanHtml = '';
    if (details) {
      const clone = details.cloneNode(true);
      clone.querySelector('summary')?.remove();
      clone.querySelector('.jawab')?.remove();
      pembahasanHtml = clone.innerHTML;
    }

    return { idx, nomor, tipe, level, sumber, teks, pilihan, pernyataan, kunci, langkah, pembahasan, pembahasanHtml, gambarHtml };
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
.modmod table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
.modmod table th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
.modmod table td{border:1px solid #e3e6ef;padding:5px 8px}
.modmod table.ring{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
.modmod table.ring th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
.modmod table.ring td{border:1px solid #e3e6ef;padding:5px 8px}
.modmod svg,.modmod img{max-width:100%;height:auto;display:block;margin:8px auto}
.modmod img{display:block;margin:10px auto;border-radius:10px}
.modmod .figslot{border:2px dashed #cbd5e1;border-radius:10px;padding:14px;text-align:center;color:#64748b;font-size:12px;font-weight:700;margin:8px 0}
.modmod .caption{text-align:center;font-size:11.5px;color:#64748b}
.modmod .vinc{border-top:1.5px solid currentColor;padding:0 2px;margin-left:1px}
.modmod .akar{white-space:nowrap}
.modmod .pec{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 3px}
.modmod .pec-pemb{padding:0 4px 1px;border-bottom:1.5px solid currentColor;font-size:.82em}
.modmod .pec-peny{padding:1px 4px 0;font-size:.82em}
.modmod ol,.modmod ul{padding-left:22px;margin:6px 0}
.modmod ol li,.modmod ul li{margin:4px 0;line-height:1.6}
.modmod p{margin:6px 0;line-height:1.7}
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