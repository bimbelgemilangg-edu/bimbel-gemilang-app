// src/components/buku/RendererHtmlBab.jsx (v3)
// Render bab tipe 'html' di Shadow DOM + TIGA perbaikan:
//  1) CSS :root/&body; modul dialihkan ke .gb-wrap (variabel warna hidup lagi).
//  2) Pecahan bertumpuk (.pec) dari htmlBersih v4 diberi gaya garis pecahan.
//  3) INTERAKTIF di semua perangkat: pilihan soal bisa diketuk,
//     umpan balik hijau/merah, pembahasan terbuka otomatis setelah menjawab,
//     tombol Periksa untuk soal multi & benar-salah.
import { useEffect, useRef } from 'react';
import { bersihkanHtml } from '../../utils/htmlBersih';

const BASE_STYLE = `
  :host{display:block}
  .gb-wrap{font:15px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1e293b;background:#f6f7fb;border-radius:12px;padding:6px;overflow:hidden}
  .gb-wrap img,.gb-wrap svg{max-width:100%;height:auto}
  .gb-wrap table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
  .gb-wrap th{background:#4C6EF5;color:#fff;padding:6px 8px;text-align:left}
  .gb-wrap td{border:1px solid #e3e6ef;padding:5px 8px}
  .gb-wrap tr:nth-child(even) td{background:#f8fafc}
  .gb-wrap details{margin:6px 0}
  .gb-wrap details summary{cursor:pointer}
  .gb-wrap img{max-width:100%;display:block;margin:10px auto;border-radius:10px}
  .gb-wrap .pec{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 3px}
  .gb-wrap .pec-pemb{padding:0 4px 1px;border-bottom:1.5px solid currentColor;font-size:.82em}
  .gb-wrap .pec-peny{padding:1px 4px 0;font-size:.82em}
  .gb-wrap .pil li{transition:background .15s,border-color .15s}
`;

function siapkanCss(html) {
  return String(html)
    .replace(/:root\s*\{/g, '.gb-wrap{')
    .replace(/(^|})\s*body\s*\{/g, '$1.gb-wrap{');
}

function parseKunci(teks) {
  const t = String(teks || '').replace(/\s+/g, ' ').trim();
  let m = t.match(/Jawaban:\s*([A-D])\b/i);
  if (m) return { tipe: 'pg', pg: m[1].toUpperCase().charCodeAt(0) - 65 };
  m = t.match(/Jawaban:\s*(?:Pernyataan\s*)?(\d+(?:\s*,\s*\d+)*(?:\s*,?\s*dan\s*\d+)?)\s*$/i);
  if (m) {
    const arr = m[1].replace(/dan/gi, ',').split(',').map((x) => parseInt(x.trim(), 10) - 1).filter((x) => !isNaN(x) && x >= 0);
    if (arr.length) return { tipe: 'multi', multi: arr };
  }
  m = t.match(/Jawaban:\s*((?:Benar|Salah)(?:\s*,\s*(?:Benar|Salah))+)\s*$/i);
  if (m) return { tipe: 'bs', bs: m[1].split(',').map((x) => x.trim().toLowerCase() === 'benar') };
  return null;
}

const buatBtn = (teks, onClick, utama) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = teks;
  b.style.cssText = utama
    ? 'margin:8px 0 0;padding:9px 14px;border:none;border-radius:10px;background:#7C3AED;color:#fff;font-weight:700;font-size:12px;cursor:pointer'
    : 'padding:6px 12px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#64748b;font-weight:700;font-size:11px;cursor:pointer';
  b.addEventListener('click', onClick);
  return b;
};

const banner = (soalEl, tepat) => {
  const d = document.createElement('div');
  d.textContent = tepat ? '✅ Tepat! Lanjut ke soal berikutnya.' : '❌ Belum tepat — simak pembahasan di bawah.';
  d.style.cssText = tepat
    ? 'margin-top:8px;padding:8px 10px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#166534;font-weight:700;font-size:12.5px'
    : 'margin-top:8px;padding:8px 10px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-weight:700;font-size:12.5px';
  soalEl.appendChild(d);
};

const hint = (soalEl, teks) => {
  const d = document.createElement('div');
  d.textContent = '✋ ' + teks;
  d.style.cssText = 'margin:6px 0 2px;font-size:11px;color:#7C3AED;font-weight:700';
  const pil = soalEl.querySelector('.pil');
  if (pil) pil.before(d);
  else soalEl.appendChild(d);
};

function enhance(root) {
  const soals = root.querySelectorAll('.soal');
  soals.forEach((soalEl) => {
    const kunciEl = soalEl.querySelector('.jawab');
    const details = soalEl.querySelector('details.kunci');
    const pil = soalEl.querySelectorAll('.pil li');
    if (!kunciEl || !pil.length) return;
    const kunci = parseKunci(kunciEl.textContent);
    if (!kunci) return;

    if (kunci.tipe === 'pg') {
      hint(soalEl, 'Ketuk jawabanmu untuk memeriksa.');
      pil.forEach((li, idx) => {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          if (soalEl.dataset.done) return;
          soalEl.dataset.done = '1';
          pil.forEach((x, j) => {
            if (j === kunci.pg) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
            else if (j === idx) { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
          });
          if (details) details.open = true;
          banner(soalEl, idx === kunci.pg);
        });
      });
      return;
    }

    if (kunci.tipe === 'multi') {
      hint(soalEl, 'Ketuk satu atau lebih pernyataan, lalu tekan Periksa.');
      const pilih = new Set();
      pil.forEach((li, idx) => {
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          if (soalEl.dataset.done) return;
          if (pilih.has(idx)) { pilih.delete(idx); li.style.borderColor = '#eef1f6'; li.style.background = '#f8fafc'; }
          else { pilih.add(idx); li.style.borderColor = '#7C3AED'; li.style.background = '#f5f3ff'; }
        });
      });
      const pilWrap = soalEl.querySelector('.pil');
      if (pilWrap) {
        pilWrap.after(buatBtn('Periksa Jawaban', () => {
          if (soalEl.dataset.done || !pilih.size) return;
          soalEl.dataset.done = '1';
          const benarSet = new Set(kunci.multi);
          pil.forEach((x, j) => {
            if (benarSet.has(j)) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
            else if (pilih.has(j)) { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
          });
          const tepat = pilih.size === benarSet.size && [...pilih].every((j) => benarSet.has(j));
          if (details) details.open = true;
          banner(soalEl, tepat);
        }, true));
      }
      return;
    }

    if (kunci.tipe === 'bs' && pil.length === kunci.bs.length) {
      hint(soalEl, 'Pilih Benar/Salah untuk tiap pernyataan, lalu Periksa.');
      const pilih = [];
      pil.forEach((li, idx) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:6px;margin-top:6px';
        const bB = buatBtn('Benar', () => {
          if (soalEl.dataset.done) return;
          pilih[idx] = true;
          bB.style.background = '#7C3AED'; bB.style.color = '#fff'; bB.style.borderColor = '#7C3AED';
          bS.style.background = '#fff'; bS.style.color = '#64748b'; bS.style.borderColor = '#e2e8f0';
        });
        const bS = buatBtn('Salah', () => {
          if (soalEl.dataset.done) return;
          pilih[idx] = false;
          bS.style.background = '#7C3AED'; bS.style.color = '#fff'; bS.style.borderColor = '#7C3AED';
          bB.style.background = '#fff'; bB.style.color = '#64748b'; bB.style.borderColor = '#e2e8f0';
        });
        wrap.appendChild(bB);
        wrap.appendChild(bS);
        li.appendChild(wrap);
      });
      const pilWrap = soalEl.querySelector('.pil');
      if (pilWrap) {
        pilWrap.after(buatBtn('Periksa Jawaban', () => {
          if (soalEl.dataset.done || pilih.length !== kunci.bs.length || pilih.some((x) => typeof x !== 'boolean')) return;
          soalEl.dataset.done = '1';
          pil.forEach((x, j) => {
            if (pilih[j] === kunci.bs[j]) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
            else { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
          });
          const tepat = pilih.every((v, j) => v === kunci.bs[j]);
          if (details) details.open = true;
          banner(soalEl, tepat);
        }, true));
      }
    }
  });
}

export default function RendererHtmlBab({ html }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!host.shadowRoot) host.attachShadow({ mode: 'open' });
    host.shadowRoot.innerHTML = `<style>${BASE_STYLE}</style><div class="gb-wrap">${bersihkanHtml(siapkanCss(html))}</div>`;
    enhance(host.shadowRoot);
  }, [html]);
  return <div ref={hostRef} />;
}