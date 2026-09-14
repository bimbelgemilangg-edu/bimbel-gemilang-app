// src/utils/htmlBersih.js (v5)
// Sanitizer whitelist + normalisasi tabel markdown + normalisasi pecahan
// + PENGHAPUSAN REFERENSI SUMBER (URL eksternal, Scribd, SlideShare, dll).
// v5: teks/node yang memuat URL eksternal atau domain terlarang dibuang,
//     sehingga siswa tidak pernah melihat link sumber di modul.
const TAG_AMAN = new Set(['HTML','HEAD','BODY','DIV','SPAN','P','H1','H2','H3','H4','H5','H6','B','I','U','EM','STRONG','SMALL','BR','HR','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','STYLE','SVG','G','PATH','LINE','POLYLINE','POLYGON','CIRCLE','RECT','ELLIPSE','TEXT','TSPAN','DEFS','TITLE','DETAILS','SUMMARY','A','CODE','PRE','BLOCKQUOTE','FIGURE','FIGCAPTION','SECTION','HEADER','FOOTER','MAIN','ARTICLE','SUP','SUB','DL','DT','DD','MARK','LABEL']);
const TAG_BUANG_ISI = new Set(['SCRIPT','IFRAME','OBJECT','EMBED','LINK','META','FORM','BASE','TEMPLATE','NOSCRIPT']);
const ATTR_AMAN = new Set(['class','id','style','width','height','viewbox','preserveaspectratio','xmlns','fill','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-opacity','points','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','opacity','font-size','font-weight','text-anchor','transform','title','aria-label','role','open','colspan','rowspan','start']);
// atribut yang membawa URL dilarang total: href, src, cite, action

const DOMAIN_TERLARANG = /scribd|slideshare|slideguru|slideplayer|pdfcoffee|idoc|pdfdrive|academia|researchgate|docplayer|docshare|my99dreams|drive\.google|dropbox|mega\.nz/i;
const URL_RE = /https?:\/\/[^\s<>"']+/i;

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

function teksBermasalah(teks) {
  const t = String(teks || '');
  if (URL_RE.test(t)) return true;
  if (DOMAIN_TERLARANG.test(t)) return true;
  return false;
}

function bersihkanNode(el) {
  // buang <a> pembawa URL eksternal (sisakan teksnya saja)
  if (tagNama(el) === 'A') {
    const frag = document.createDocumentFragment();
    while (el.firstChild) frag.appendChild(el.firstChild);
    el.replaceWith(frag);
    return;
  }
  // buang <footer> atau <div>/<p> yang isinya cuma referensi sumber
  if (tagNama(el) === 'FOOTER' ||
      (tagNama(el) === 'P' && /sumber|source|diunduh|retrieved/i.test(el.textContent || ''))) {
    if (teksBermasalah(el.textContent)) { el.remove(); return; }
  }
  // buang text node yang memuat URL atau domain terlarang
  const anak = [...el.childNodes];
  for (const n of anak) {
    if (n.nodeType === 3) { // TEXT_NODE
      const isi = n.nodeValue || '';
      if (URL_RE.test(isi) || DOMAIN_TERLARANG.test(isi)) {
        // hapus bagian URL/domain-nya saja, pertahankan teks lain
        const bersih = isi
          .replace(URL_RE, '')
          .replace(/\b(?:scribd|slideshare|slideguru|slideplayer|pdfcoffee|idoc|pdfdrive|academia|researchgate|docplayer|docshare|my99dreams)\b[^\s<>"']*/gi, '')
          .replace(/\s{2,}/g, ' ').trim();
        n.nodeValue = bersih;
      }
    } else if (n.nodeType === 1) {
      bersihkanNode(n);
    }
  }
  // buang elemen yang kini kosong karena teksnya dihapus
  if (el.childElementCount === 0 && !el.textContent.trim() && tagNama(el) !== 'BR' && tagNama(el) !== 'HR') {
    el.remove();
  }
}

export function bersihkanHtml(html) {
  const sumber = normalkanPecahan(normalkanTabelMarkdown(html));
  const doc = new DOMParser().parseFromString(sumber, 'text/html');

  // 1) buang tag berbahaya beserta isinya
  doc.querySelectorAll([...TAG_BUANG_ISI].join(',')).forEach((n) => n.remove());

  // 2) buang komentar HTML (termasuk AUDIT) — tidak perlu tampil
  const iter = document.createTreeWalker(doc, 128 /* NodeFilter.SHOW_COMMENT */);
  const kom = [];
  while (iter.nextNode()) kom.push(iter.currentNode);
  kom.forEach((c) => c.parentNode && c.parentNode.removeChild(c));

  // 3) sanitasi tag & atribut (tanpa whitelist URL)
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
        ['href','src','cite','action','data-src'].includes(nama) ||
        (nilai.startsWith('javascript:') || nilai.startsWith('data:text/html'))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // 4) bersihkan node yang memuat URL/domain terlarang
  bersihkanNode(doc.body);

  // 5) kumpulkan <style> + body (tanpa komentar)
  const styles = [...doc.querySelectorAll('style')].map((s) => s.outerHTML).join('\n');
  return styles + doc.body.innerHTML;
}