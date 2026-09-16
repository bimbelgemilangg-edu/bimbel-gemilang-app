// src/utils/matika.js
// Mesin tipografi matematika: percantik notasi teks menjadi markup HTML
// yang dibaca sebagai "matematika asli" (pecahan bertingkat, akar bergaris
// atas). Dipakai di reader (RendererHtmlBab), layar guru & layar siswa live.
export const CSS_MATIKA = `
.mk-pec{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 3px;text-align:center}
.mk-pec-pemb{padding:0 4px 1px;border-bottom:1.5px solid currentColor;font-size:.82em}
.mk-pec-peny{padding:1px 4px 0;font-size:.82em}
.mk-akar{white-space:nowrap}
.mk-vinc{border-top:1.5px solid currentColor;padding:0 2px;margin-left:1px}
`;

const PECAHAN_UNICODE = {
  '½': ['1', '2'], '⅓': ['1', '3'], '⅔': ['2', '3'], '¼': ['1', '4'], '¾': ['3', '4'],
  '⅕': ['1', '5'], '⅖': ['2', '5'], '⅗': ['3', '5'], '⅘': ['4', '5'],
  '⅙': ['1', '6'], '⅚': ['5', '6'], '⅛': ['1', '8'], '⅜': ['3', '8'],
  '⅝': ['5', '8'], '⅞': ['7', '8'], '⅒': ['1', '10'],
};

const pec = (a, b) =>
  `<span class="mk-pec"><span class="mk-pec-pemb">${a}</span><span class="mk-pec-peny">${b}</span></span>`;

const TOK = '[A-Za-z0-9⁰¹²³⁴⁵⁶⁷⁸⁹²³⁻⁺][A-Za-z0-9⁰¹²³⁴⁵⁶⁷⁸⁹²³⁻⁺.,]*';
const RE_FRAC = new RegExp(`(\\([^()]{1,24}\\)|${TOK})\\s*\\/\\s*(\\([^()]{1,24}\\)|${TOK})`, 'g');
const RE_AKAR = /([0-9]{0,2})√\s*(\([^()]{1,24}\)|[0-9A-Za-z⁰¹²³⁴⁵⁶⁷⁸⁹]{1,6}(?:[.,][0-9]{1,4})?)/g;
const RE_VULGAR = /[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅒]/g;

function percantikTeks(t) {
  let s = t;
  s = s.replace(RE_VULGAR, (m) => {
    const p = PECAHAN_UNICODE[m];
    return p ? pec(p[0], p[1]) : m;
  });
  s = s.replace(RE_FRAC, (m, a, b) => {
    const aa = a.replace(/[()]/g, '');
    const bb = b.replace(/[()]/g, '');
    // hanya ubah bila kedua sisi memuat angka/variabel aljabar (hindari tanggal/kode)
    if (!/[0-9A-Za-z]/.test(aa) || !/[0-9A-Za-z]/.test(bb)) return m;
    return pec(aa, bb);
  });
  s = s.replace(RE_AKAR, (m, koef, rad) =>
    `${koef}<span class="mk-akar">√<span class="mk-vinc">${rad}</span></span>`);
  return s;
}

// Terapkan ke STRING HTML: hanya text node yang disentuh, tag/SVG/tabel aman.
export function percantikMatika(html) {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(`<div id="mk">${html}</div>`, 'text/html');
  const root = doc.getElementById('mk');
  if (!root) return html;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const t = n.nodeValue;
    if (!t || !/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅒√/]/.test(t)) return;
    const baru = percantikTeks(t);
    if (baru === t) return;
    const span = doc.createElement('span');
    span.innerHTML = baru;
    n.parentNode.replaceChild(span, n);
  });
  return root.innerHTML;
}

export default { percantikMatika, CSS_MATIKA };