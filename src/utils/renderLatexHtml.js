import katex from 'katex';
import { pecahSegmenMatematika, sumberKaTeX } from './segmenMatematika.js';

const SKIP = new Set(['STYLE', 'SCRIPT', 'CODE', 'PRE', 'TEXT', 'TSPAN']);
// Pemecahan segmen & kebijakan ukuran kini SATU SUMBER di
// utils/segmenMatematika.js (audit 2026-10-23): keempat permukaan render
// (buku/live, try out, belajar, cetak) wajib berperilaku identik.
function buatMath(doc, segmen) {
  const raw = sumberKaTeX(segmen);
  const display = segmen.jenis === 'blok';
  const wadah = doc.createElement(display ? 'div' : 'span');
  wadah.className = display ? 'gb-katex gb-katex-block' : 'gb-katex gb-katex-inline';
  try {
    wadah.innerHTML = katex.renderToString(raw.trim(), {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'htmlAndMathml',
    });
  } catch {
    wadah.classList.add('gb-katex-error');
    wadah.textContent = raw;
  }
  return wadah;
}

/**
 * Merender LaTeX di dalam HTML terkontrol. Fungsi ini hanya menyentuh text node,
 * tidak mengeksekusi script, dan tidak memproses ulang isi KaTeX yang dihasilkan.
 */
export function renderLatexHtml(html) {
  if (!html || !/[\\$]/.test(html)) return html;
  const doc = new DOMParser().parseFromString(`<div id="gb-latex-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('gb-latex-root');
  if (!root) return html;

  const nodes = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || SKIP.has(parent.tagName) || parent.closest('.katex')) continue;
    if (pecahSegmenMatematika(node.nodeValue || '').some((s) => s.jenis !== 'teks')) nodes.push(node);
  }

  nodes.forEach((node) => {
    const text = node.nodeValue || '';
    const frag = doc.createDocumentFragment();
    for (const seg of pecahSegmenMatematika(text)) {
      if (seg.jenis === 'teks') frag.appendChild(doc.createTextNode(seg.isi));
      else frag.appendChild(buatMath(doc, seg));
    }
    node.replaceWith(frag);
  });

  return root.innerHTML;
}

export default renderLatexHtml;
