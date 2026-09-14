// src/utils/htmlBersih.js (v3)
// Sanitizer whitelist + normalisasi tabel markdown + util pemeriksaan.
// v3: tabel markdown "| ... |" dikonversi otomatis menjadi <table class="ring">
//     (Qwen kadang lolos menulis markdown di dalam HTML).
const TAG_AMAN = new Set(['HTML','HEAD','BODY','DIV','SPAN','P','H1','H2','H3','H4','H5','H6','B','I','U','EM','STRONG','SMALL','BR','HR','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','STYLE','SVG','G','PATH','LINE','POLYLINE','POLYGON','CIRCLE','RECT','ELLIPSE','TEXT','TSPAN','DEFS','TITLE','DETAILS','SUMMARY','IMG','A','CODE','PRE','BLOCKQUOTE','FIGURE','FIGCAPTION','SECTION','HEADER','FOOTER','MAIN','ARTICLE','SUP','SUB','DL','DT','DD','MARK','LABEL']);
const TAG_BUANG_ISI = new Set(['SCRIPT','IFRAME','OBJECT','EMBED','LINK','META','FORM','BASE','TEMPLATE','NOSCRIPT']);
const ATTR_AMAN = new Set(['class','id','style','width','height','viewbox','preserveaspectratio','xmlns','fill','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-opacity','points','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','opacity','font-size','font-weight','text-anchor','transform','href','target','rel','alt','src','title','aria-label','role','open','colspan','rowspan','start']);

const tagNama = (el) => String(el.tagName || '').toUpperCase();

export function hitungPattern(html, re) {
  return (String(html).match(re) || []).length;
}

export function daftarPlaceholder(html) {
  const set = new Set();
  const re = /\{\{GAMBAR[^}]*\}\}/g;
  let m;
  while ((m = re.exec(String(html)))) set.add(m[0]);
  return [...set];
}

function keTabel(t) {
  const th = (t.head || []).map((c) => `<th>${c}</th>`).join('');
  const tr = t.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<table class="ring">${th ? `<thead><tr>${th}</tr></thead>` : ''}<tbody>${tr}</tbody></table>`;
}

export function normalkanTabelMarkdown(html) {
  const baris = String(html).split('\n');
  const out = [];
  let tabel = null;
  const isPipe = (s) => /^\s*\|.*\|\s*$/.test(s);
  const isSep = (s) => /^\s*\|[\s:\-|]+\|\s*$/.test(s);
  const sel = (s) => s.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((x) => x.trim());
  for (const line of baris) {
    if (isPipe(line)) {
      if (isSep(line)) continue;
      if (!tabel) tabel = { head: null, rows: [] };
      const cells = sel(line);
      if (!tabel.head) tabel.head = cells;
      else tabel.rows.push(cells);
    } else {
      if (tabel) { out.push(keTabel(tabel)); tabel = null; }
      out.push(line);
    }
  }
  if (tabel) out.push(keTabel(tabel));
  return out.join('\n');
}

export function bersihkanHtml(html) {
  const sumber = normalkanTabelMarkdown(html);
  const doc = new DOMParser().parseFromString(sumber, 'text/html');
  doc.querySelectorAll([...TAG_BUANG_ISI].join(',')).forEach((n) => n.remove());
  const semua = [...doc.body.querySelectorAll('*'), ...doc.head.querySelectorAll('style')];
  for (const el of semua) {
    if (el.closest('body') && !TAG_AMAN.has(tagNama(el))) {
      const frag = doc.createDocumentFragment();
      while (el.firstChild) frag.appendChild(el.firstChild);
      el.replaceWith(frag);
      continue;
    }
    for (const attr of [...el.attributes]) {
      const nama = attr.name.toLowerCase();
      const nilai = String(attr.value || '').trim().toLowerCase();
      if (
        nama.startsWith('on') ||
        !ATTR_AMAN.has(nama) ||
        ((nama === 'href' || nama === 'src') && (nilai.startsWith('javascript:') || nilai.startsWith('data:text/html')))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }
  const styles = [...doc.querySelectorAll('style')].map((s) => s.outerHTML).join('\n');
  return styles + doc.body.innerHTML;
}