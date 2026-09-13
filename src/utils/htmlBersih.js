// src/utils/htmlBersih.js
// Sanitizer whitelist untuk bab bertipe HTML.
// - script/iframe/object/embed/link/meta/form dibuang BESERTA isinya
// - atribut on* dan url javascript: dibuang
// - <style> dan <svg> diizinkan (render di Shadow DOM, tidak bocor)
const TAG_AMAN = new Set(['HTML','HEAD','BODY','DIV','SPAN','P','H1','H2','H3','H4','H5','H6','B','I','U','EM','STRONG','SMALL','BR','HR','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','STYLE','SVG','G','PATH','LINE','POLYLINE','POLYGON','CIRCLE','RECT','ELLIPSE','TEXT','TSPAN','DEFS','TITLE','DETAILS','SUMMARY','IMG','A','CODE','PRE','BLOCKQUOTE','FIGURE','FIGCAPTION','SECTION','HEADER','FOOTER','MAIN','ARTICLE','SUP','SUB','DL','DT','DD','MARK','LABEL']);
const TAG_BUANG_ISI = new Set(['SCRIPT','IFRAME','OBJECT','EMBED','LINK','META','FORM','BASE','TEMPLATE','NOSCRIPT']);
const ATTR_AMAN = new Set(['class','id','style','width','height','viewbox','preserveaspectratio','xmlns','fill','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-opacity','points','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','d','transform','text-anchor','dominant-baseline','font-size','font-weight','font-family','letter-spacing','opacity','href','target','rel','alt','src','title','aria-label','role','open','colspan','rowspan','start']);

export function bersihkanHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  doc.querySelectorAll([...TAG_BUANG_ISI].join(',')).forEach((n) => n.remove());
  const semua = [...doc.body.querySelectorAll('*'), ...doc.head.querySelectorAll('style')];
  for (const el of semua) {
    if (el.closest('body') && !TAG_AMAN.has(el.tagName)) {
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