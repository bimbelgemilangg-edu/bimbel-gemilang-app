// src/utils/parseSoal.js (v4)
// Parser modul HTML -> soal terstruktur + slide PPT. Terverifikasi untuk
// Matematika (Bab 6-7) DAN Bahasa Indonesia (Bab 1-5):
//  - kunci: "Jawaban: B", "Pernyataan 1,3,dan 4", "Benar,Benar,Salah",
//    "A Salah · B Benar · C Benar", "A Setuju · D Tidak Setuju",
//    maupun daftar-teks ("Kilo, rebung, dan tunas globa") dicocokkan ke opsi.
//  - tabel BS dengan header Benar/Salah MAUPUN S/TS.
//  - v4: langkah <ol> dan list infografik <ul> biasa IKUT jadi konteks soal
//    (hanya ul.pil, details, tabel pernyataan, dan tabel opsi yang dilewati).
const bersihTeks = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const bersihVerdikt = (s) => String(s || '')
  .replace(/\s*\((Benar|Salah)\)\s*\.?\s*$/i, '')
  .replace(/\s*\[(Benar|Salah)\]\s*\.?\s*$/i, '')
  .replace(/\s*→\s*(Benar|Salah)\s*\.?\s*$/i, '')
  .replace(/\s*:\s*(Benar|Salah)\s*\.?\s*$/i, '')
  .trim();

const bersihItem = (s) => bersihVerdikt(bersihTeks(s)
  .replace(/^[\u2610\u2611\u2612\u25A1\u25EB\u25FC]\s*/, '')
  .replace(/^[A-D][.).]\s*/, ''));

const stripPrefix = (t) => String(t || '')
  .replace(/\s+/g, ' ').trim()
  .replace(/^kunci\s*&\s*pembahasan\s*/i, '')
  .replace(/^jawaban\s*:\s*/i, '')
  .trim();

const tokenBs = (x) => /^(benar|setuju)$/i.test(x.trim());

export function parseKunci(teks) {
  const body = stripPrefix(teks);
  if (!body) return null;
  let m = body.match(/pernyataan\s*((?:\d+(?:\s*,\s*\d+)*)(?:\s*,?\s*dan\s*\d+)?)/i);
  if (m) {
    const arr = m[1].replace(/dan/gi, ',').split(',')
      .map((x) => parseInt(x.trim(), 10) - 1).filter((x) => !isNaN(x) && x >= 0);
    if (arr.length) return { tipe: 'multi', multi: arr };
  }
  const pairs = [...body.matchAll(/([A-D])\s*[:.]?\s*(tidak\s+setuju|setuju|benar|salah)/gi)];
  if (pairs.length >= 2) return { tipe: 'bs', bs: pairs.map((p) => tokenBs(p[2])) };
  m = body.match(/^((?:tidak\s+setuju|setuju|benar|salah)(?:\s*,\s*(?:tidak\s+setuju|setuju|benar|salah))+)$/i);
  if (m) return { tipe: 'bs', bs: m[1].split(',').map(tokenBs) };
  m = body.match(/^([A-D])$/i);
  if (m) return { tipe: 'pg', pg: m[1].toUpperCase().charCodeAt(0) - 65 };
  return null;
}

const isBsHeader = (h) =>
  h.includes('pernyataan') &&
  (h.includes('benar') || h.includes('salah') || h.includes('setuju') || /\bts\b/.test(h));

const isOptionTable = (t) => {
  const rows = [...t.querySelectorAll('tbody tr')];
  if (!rows.length || rows.length < 2) return false;
  const hit = rows.filter((tr) => /^[A-D][.).]?$/.test((tr.querySelector('td')?.textContent || '').trim())).length;
  return hit >= Math.max(1, rows.length - 1);
};

const statementFromRow = (tr) => {
  const tds = [...tr.children].filter((c) => c.tagName === 'TD');
  if (!tds.length) return '';
  if (tds.length >= 3 && tds[0].textContent.trim().length <= 3) return tds[1]?.textContent || '';
  return tds[0]?.textContent || '';
};

function parseOneSoal(el, idx) {
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
    const avg = rows.reduce((a, tr) => a + bersihTeks(statementFromRow(tr)).length, 0) / rows.length;
    return avg > 24;
  });

  // v4: yang dilewati HANYA: details, ul.pil, tabel pernyataan, tabel opsi.
  // <ol> langkah prosedur & <ul> infografik biasa IKUT masuk konteks.
  const skipNode = (n) => {
    const tag = (n.tagName || '').toUpperCase();
    if (tag === 'DETAILS') return true;
    if (tag === 'UL' && n.classList && n.classList.contains('pil')) return true;
    if (n === tabelPernyataan) return true;
    if (tag === 'TABLE' && isOptionTable(n)) return true;
    return false;
  };
  const bodyEls = [...el.children].filter((n) => !skipNode(n));
  const gambarHtml = bodyEls.map((n) => n.outerHTML).join('');
  const teks = bodyEls.map((n) => bersihTeks(n.textContent)).filter(Boolean).join(' ')
    || bersihTeks(el.querySelector('p')?.textContent) || '';

  const pilLis = [...el.querySelectorAll('ul.pil li')].filter(diLuar);
  const pilItems = pilLis.map((li) => bersihTeks(li.textContent));
  const pilHtml = pilLis.map((li) => li.innerHTML);

  let items = pilItems;
  let itemsHtml = pilHtml;
  if (!items.length && tabelPernyataan) {
    const trs = [...tabelPernyataan.querySelectorAll('tbody tr')];
    items = trs.map((tr) => bersihTeks(statementFromRow(tr))).filter(Boolean);
    itemsHtml = trs.map((tr) => {
      const tds = [...tr.children].filter((c) => c.tagName === 'TD');
      if (tds.length >= 3 && tds[0].textContent.trim().length <= 3) return tds[1]?.innerHTML || '';
      return tds[0]?.innerHTML || '';
    });
  }
  if (!items.length) {
    const lis = [...el.querySelectorAll('ul li, ol li')].filter(diLuar);
    items = lis.map((li) => bersihTeks(li.textContent)).filter(Boolean);
    itemsHtml = lis.map((li) => li.innerHTML);
  }

  const berHuruf = items.filter((t) => /^[A-D][.).]/.test(t)).length;
  const details = el.querySelector('details');
  const jawabEl = details ? details.querySelector('.jawab') : null;
  let jawabTeks = bersihTeks(jawabEl?.textContent);
  if (!jawabTeks && details) {
    const m2 = (details.textContent || '').match(/(Kunci|Jawaban)[\s\S]{0,160}/i);
    if (m2) jawabTeks = bersihTeks(m2[0]);
  }

  let tipe;
  if (pilItems.length && berHuruf >= Math.max(1, pilItems.length - 1) && pilItems.length >= 2) tipe = 'pg';
  else if (tabelBS) tipe = 'bs';
  else if (/pernyataan\s*\d/i.test(jawabTeks)) tipe = 'multi';
  else if (pilItems.length && !berHuruf) tipe = 'multi';
  else if (!pilItems.length && tabelPernyataan) tipe = 'bs';
  else if (berHuruf) tipe = 'pg';
  else tipe = 'multi';

  const pilihan = tipe === 'pg'
    ? items.map((t) => bersihItem(t.replace(/^[A-D][.).]\s*/, '')))
    : (tipe === 'multi' ? items.map(bersihItem) : []);
  const pilihanHtml = (tipe === 'pg' || tipe === 'multi') ? itemsHtml : [];
  const pernyataan = tipe === 'bs' ? items.map(bersihItem) : [];
  const pernyataanHtml = tipe === 'bs' ? itemsHtml : [];

  let kunci = parseKunci(jawabTeks);
  if (!kunci && tipe === 'multi' && pilihan.length) {
    const body = stripPrefix(jawabTeks);
    const frag = body.split(/\s*,\s*|\s+dan\s+/i).map(bersihTeks).filter(Boolean);
    const idxs = frag
      .map((f) => pilihan.findIndex((p) => {
        const a = norm(p); const b = norm(f);
        return a && b && (a === b || a.startsWith(b) || b.startsWith(a));
      }))
      .filter((i) => i >= 0);
    if (idxs.length) kunci = { tipe: 'multi', multi: [...new Set(idxs)] };
  }

  const langkah = details ? [...details.querySelectorAll('.langkah li, ol li')].map((li) => bersihTeks(li.textContent)) : [];
  const pembahasan = bersihTeks(details ? (details.textContent || '').replace(/Kunci & Pembahasan/i, '').replace(jawabTeks, '') : '');

  let pembahasanHtml = '';
  if (details) {
    const clone = details.cloneNode(true);
    clone.querySelector('summary')?.remove();
    clone.querySelector('.jawab')?.remove();
    pembahasanHtml = clone.innerHTML;
  }

  return {
    idx, nomor, tipe, level, sumber, teks,
    pilihan, pilihanHtml, pernyataan, pernyataanHtml,
    kunci, langkah, pembahasan, pembahasanHtml, gambarHtml,
    konteksHtml: '',
  };
}

function rangeFromText(txt) {
  let m = txt.match(/nomor\s*(\d+)\s*(?:–|—|-|sampai|s\/d|hingga)\s*(\d+)/i);
  if (m) return { a: +m[1], b: +m[2] };
  m = txt.match(/nomor\s*(\d+)\s+dan\s+(\d+)/i);
  if (m) return { a: +m[1], b: +m[2] };
  if (/untuk menjawab|cermatilah|bacalah|perhatikan/i.test(txt)) {
    m = txt.match(/nomor\s*(\d+)/i);
    if (m) return { a: +m[1], b: +m[1] };
  }
  return null;
}

export function parseDaftarSoal(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const soalEls = [...doc.querySelectorAll('.soal')];
  if (!soalEls.length) return [];
  const container = soalEls[0].parentElement;
  const children = container ? [...container.children] : soalEls;

  let buffer = [];
  let pending = null;
  const out = [];

  for (const node of children) {
    const isSoal = node.classList && node.classList.contains('soal');
    if (!isSoal) {
      buffer.push(node);
      const txt = buffer.map((n) => n.textContent || '').join(' ');
      const r = rangeFromText(txt);
      if (r) pending = { a: r.a, b: r.b, html: buffer.map((n) => n.outerHTML).join('') };
      continue;
    }
    const nomor = parseInt((node.querySelector('.no')?.textContent || '').trim(), 10);
    let konteksHtml = '';
    if (pending) {
      if (!isNaN(nomor) && nomor >= pending.a && nomor <= pending.b) konteksHtml = pending.html;
      else if (!isNaN(nomor) && nomor > pending.b) pending = null;
    }
    const obj = parseOneSoal(node, out.length);
    obj.konteksHtml = konteksHtml;
    out.push(obj);
    buffer = [];
  }

  return out.filter((s) => s.teks || s.pilihan.length || s.pernyataan.length);
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
.modmod table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
.modmod table th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
.modmod table td{border:1px solid #e3e6ef;padding:5px 8px}
.modmod svg,.modmod img{max-width:100%;height:auto;display:block;margin:8px auto}
.modmod img{border-radius:10px;max-height:min(70vh,560px);object-fit:contain}
.modmod svg{max-height:min(70vh,480px)}
.modmod .rujukan img,.modmod .rujukan svg,.modmod .soal img,.modmod .soal svg{max-height:min(75vh,640px)}
.modmod .rujukan{background:#f8fafc;border:1px solid #e2e8f0;border-left:5px solid #4C6EF5;border-radius:12px;padding:12px 14px;margin:8px 0;overflow:auto}
.modmod .rujukan-lab{font-size:11.5px;font-weight:800;text-transform:uppercase;color:#4C6EF5;margin:0 0 8px}
.modmod .tanya{font-weight:700;margin:10px 0 8px;font-size:15px;line-height:1.55}
.modmod .naskah{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;margin:8px 0;line-height:1.7}
.modmod .fig{max-width:100%;height:auto}
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

export default { parseDaftarSoal, parseSlides, parseKunci, cekBenar, bersihVerdikt, CSS_MODUL };