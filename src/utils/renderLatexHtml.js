import katex from 'katex';

const SKIP = new Set(['STYLE', 'SCRIPT', 'CODE', 'PRE', 'TEXT', 'TSPAN']);
const RE_MATH = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?!\s)[^$\n]+?\$)/g;

function pecahToken(token) {
  if (token.startsWith('\\[') && token.endsWith('\\]')) {
    return { raw: token.slice(2, -2), display: true };
  }
  if (token.startsWith('\\(') && token.endsWith('\\)')) {
    return { raw: token.slice(2, -2), display: false };
  }
  if (token.startsWith('$$') && token.endsWith('$$')) {
    return { raw: token.slice(2, -2), display: true };
  }
  return { raw: token.slice(1, -1), display: false };
}

function buatMath(doc, token) {
  const { raw, display } = pecahToken(token);
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
    if (RE_MATH.test(node.nodeValue || '')) nodes.push(node);
    RE_MATH.lastIndex = 0;
  }

  nodes.forEach((node) => {
    const text = node.nodeValue || '';
    const frag = doc.createDocumentFragment();
    let cursor = 0;
    let match;
    RE_MATH.lastIndex = 0;
    while ((match = RE_MATH.exec(text))) {
      if (match.index > cursor) frag.appendChild(doc.createTextNode(text.slice(cursor, match.index)));
      frag.appendChild(buatMath(doc, match[0]));
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) frag.appendChild(doc.createTextNode(text.slice(cursor)));
    node.replaceWith(frag);
  });

  return root.innerHTML;
}

export default renderLatexHtml;
