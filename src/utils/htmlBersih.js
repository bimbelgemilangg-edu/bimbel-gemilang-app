// src/utils/htmlBersih.js (v6)
// FIX v6: pembersih referensi sumber TIDAK lagi memakan figur:
//  - bentuk SVG (line/circle/path/polygon/rect/ellipse/dll) tidak pernah dianggap "kosong"
//  - <img> diizinkan kembali, src hanya boleh https:// aman atau data:image/
//    (hasil potong ✂️ Gambar dari Modul), selain itu src dicabut
//  - yang dibuang hanya: URL, nama situs terlarang, kurungan referensi
//    [..SUMBER..], <footer> sumber, dan atribut pembawa link.
const TAG_AMAN = new Set(['HTML','HEAD','BODY','DIV','SPAN','P','H1','H2','H3','H4','H5','H6','B','I','U','EM','STRONG','SMALL','BR','HR','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','STYLE','SVG','G','PATH','LINE','POLYLINE','POLYGON','CIRCLE','RECT','ELLIPSE','TEXT','TSPAN','DEFS','TITLE','DETAILS','SUMMARY','IMG','A','CODE','PRE','BLOCKQUOTE','FIGURE','FIGCAPTION','SECTION','HEADER','FOOTER','MAIN','ARTICLE','SUP','SUB','DL','DT','DD','MARK','LABEL','INPUT','BUTTON']);
const TAG_BUANG_ISI = new Set(['SCRIPT','IFRAME','OBJECT','EMBED','LINK','META','FORM','BASE','TEMPLATE','NOSCRIPT']);
const ATTR_AMAN = new Set(['class','id','style','width','height','viewbox','preserveaspectratio','xmlns','fill','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-opacity','points','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','opacity','font-size','font-weight','text-anchor','transform','title','aria-label','role','open','colspan','rowspan','start','alt','src','srcset','loading','type','name','value','checked','disabled','for','decoding','data-question-mode']);
const SVG_TAGS = new Set(['SVG','G','PATH','LINE','POLYLINE','POLYGON','CIRCLE','RECT','ELLIPSE','TEXT','TSPAN','DEFS','TITLE','IMAGE','USE','MARKER','LINEARGRADIENT','RADIALGRADIENT','STOP','SYMBOL','CLIPPATH']);
const TEXT_WADAH = new Set(['P','DIV','SPAN','LI','TD','TH','H1','H2','H3','H4','H5','H6','FIGCAPTION','BLOCKQUOTE','SMALL','EM','STRONG','B','I','U','CODE','PRE','LABEL','DD','DT','SUMMARY']);
const DOMAIN_TERLARANG = /scribd|slideshare|slideguru|slideplayer|pdfcoffee|idoc|pdfdrive|academia|researchgate|docplayer|docshare|my99dreams|drive\.google|dropbox|mega\.nz/i;
const URL_RE = /https?:\/\/[^\s<>"']+/i;
const RUJUK_SUMBER = /\[[^\]]*(?:SUMBER|sumber)[^\]]*\]/g;
const KATA_DOMAIN = /\b(?:scribd|slideshare|slideguru|slideplayer|pdfcoffee|idoc|pdfdrive|academia|researchgate|docplayer|docshare|my99dreams)\b[^\s<>"']*/gi;

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

export function normalkanPecahan(html) {
  const pec = '<span class="pec"><span class="pec-pemb">$1</span><span class="pec-peny">$2</span></span>';
  return String(html)
    .replace(/<sup>([^<]{1,6})<\/sup>\s*(?:⁄|\/)\s*<sub>([^<]{1,6})<\/sub>/g, pec)
    .replace(/<sup>([^<]{1,6})<\/sup>(?:⁄|\/)<sub>([^<]{1,6})<\/sub>/g, pec);
}

function srcAman(nilai) {
  const v = String(nilai || '').trim();
  const low = v.toLowerCase();
  if (low.startsWith('javascript:') || low.startsWith('data:text/html')) return false;
  // Jangan uji payload base64 dengan regex domain: rangkaian karakter acak
  // dapat kebetulan membentuk "idoc", "mega", dll. Prefix MIME gambar sudah
  // menjadi pagar yang tepat dan importer akan memindahkannya ke Supabase.
  if (low.startsWith('data:image/')) return true;
  if (DOMAIN_TERLARANG.test(v)) return false;
  if (/^https:\/\//i.test(v)) return true;
  return false;
}

function bersihkanNode(el) {
  const tag = tagNama(el);
  if (tag === 'A') {
    const frag = document.createDocumentFragment();
    while (el.firstChild) frag.appendChild(el.firstChild);
    el.replaceWith(frag);
    return;
  }
  for (const attr of [...el.attributes]) {
    const nama = attr.name.toLowerCase();
    const nilai = attr.value || '';
    const hapus =
      nama.startsWith('on') ||
      !ATTR_AMAN.has(nama) ||
      ['href', 'cite', 'action', 'data-src'].includes(nama) ||
      (nama === 'src' && !srcAman(nilai));
    if (hapus) el.removeAttribute(attr.name);
  }
  if (tag === 'FOOTER') { el.remove(); return; }
  if (tag === 'P' && /sumber|source|diunduh|retrieved/i.test(el.textContent || '') &&
      (URL_RE.test(el.textContent || '') || DOMAIN_TERLARANG.test(el.textContent || ''))) {
    el.remove();
    return;
  }
  for (const n of [...el.childNodes]) {
    if (n.nodeType === 3) {
      const isi = n.nodeValue || '';
      if (URL_RE.test(isi) || DOMAIN_TERLARANG.test(isi) || RUJUK_SUMBER.test(isi)) {
        n.nodeValue = isi
          .replace(RUJUK_SUMBER, '')
          .replace(URL_RE, '')
          .replace(KATA_DOMAIN, '')
          .replace(/\s{2,}/g, ' ');
      }
    } else if (n.nodeType === 1) {
      bersihkanNode(n);
    }
  }
  // HANYA wadah teks kosong yang dibuang; bentuk SVG & img TIDAK pernah di sini.
  if (TEXT_WADAH.has(tag) && el.childElementCount === 0 && !el.textContent.trim() && !el.hasAttribute('src')) {
    el.remove();
  }
}

export function bersihkanHtml(html) {
  const sumber = normalkanPecahan(normalkanTabelMarkdown(html));
  const doc = new DOMParser().parseFromString(sumber, 'text/html');
  doc.querySelectorAll([...TAG_BUANG_ISI].join(',')).forEach((n) => n.remove());
  const iter = document.createTreeWalker(doc, 128);
  const kom = [];
  while (iter.nextNode()) kom.push(iter.currentNode);
  kom.forEach((c) => c.parentNode && c.parentNode.removeChild(c));
  const semua = [...doc.body.querySelectorAll('*'), ...doc.head.querySelectorAll('style')];
  for (const el of semua) {
    if (el.closest('body') && !TAG_AMAN.has(tagNama(el)) && !SVG_TAGS.has(tagNama(el))) {
      const frag = doc.createDocumentFragment();
      while (el.firstChild) frag.appendChild(el.firstChild);
      el.replaceWith(frag);
    }
  }
  bersihkanNode(doc.body);
  const styles = [...doc.querySelectorAll('style')].map((s) => s.outerHTML).join('\n');
  return styles + doc.body.innerHTML;
}
