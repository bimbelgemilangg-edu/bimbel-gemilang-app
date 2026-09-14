// src/components/buku/RendererHtmlBab.jsx (v4)
// UX belajar terbimbing untuk modul HTML:
//  - Desktop (>=900px): 2 kolom — materi kiri, latihan kanan sticky.
//    Mobile: satu kolom mengalir.
//  - Pembahasan tampil LANGKAH DEMI LANGKAH (tombol "Langkah berikutnya").
//  - Langkah bernomor, kartu rumus menonjol, chip matematika jelas.
//  - Pilihan soal = target ketuk besar + umpan balik hijau/merah (v3).
//  - Tombol "✓ Tandai paham" per seksi materi + chip progres sticky
//    (tersimpan per perangkat).
import { useEffect, useRef } from 'react';
import { bersihkanHtml } from '../../utils/htmlBersih';

const BASE_STYLE = `
  :host{display:block}
  .gb-wrap{font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1e293b;background:#f6f7fb;border-radius:16px;padding:10px;overflow:hidden}
  .gb-wrap *{-webkit-tap-highlight-color:transparent}
  .gb-sticky{position:sticky;top:0;z-index:5;background:rgba(246,247,251,.94);backdrop-filter:blur(6px);border-radius:12px;padding:8px 10px;margin-bottom:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px;font-weight:700;color:#4338ca}
  .gb-chip{background:#eef2ff;border:1px solid #dbe3ff;border-radius:999px;padding:3px 10px;white-space:nowrap}
  .gb-layout{display:block}
  .gb-kolom-soal{margin-top:4px}
  @media (min-width:900px){
    .gb-layout{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:22px;align-items:start}
    .gb-kolom-soal{position:sticky;top:52px;max-height:calc(100vh - 64px);overflow:auto;padding:4px 6px 40px 4px;border-left:1px dashed #d8dcf0}
  }
  .gb-wrap .kartu{box-shadow:0 2px 10px rgba(30,27,75,.06)}
  .gb-wrap h2.sec{display:flex;align-items:center;gap:8px}
  .gb-wrap h3.sub{color:#5b4b8a}
  .gb-wrap p{font-size:15.5px;line-height:1.8;margin:8px 0}
  .gb-wrap ul.sifat{padding-left:20px}
  .gb-wrap ul.sifat li{margin:6px 0;line-height:1.7}
  .gb-wrap .rumus{font-size:20px;padding:14px;border-radius:14px;background:linear-gradient(180deg,#f5f7ff,#eef2ff);border:1px solid #dbe3ff}
  .gb-wrap .m{background:#eef2ff;border:1px solid #dbe3ff;color:#1e293b;padding:2px 7px;border-radius:7px}
  .gb-wrap .soal{border:1px solid #e3e6ef;box-shadow:0 2px 10px rgba(30,27,75,.05)}
  .gb-wrap .soal>p{font-size:15.5px}
  .gb-wrap .pil li{padding:12px 14px;font-size:15px;border-radius:12px;margin:7px 0;border:1.5px solid #e6e9f4;background:#fbfcff;transition:background .15s,border-color .15s}
  .gb-wrap .pil li:active{transform:scale(.995)}
  .gb-wrap details.kunci summary{display:inline-flex;align-items:center;gap:6px;background:#eef2ff;color:#4338ca;border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:800;list-style:none;cursor:pointer}
  .gb-wrap details.kunci summary::before{content:"▸";font-size:11px}
  .gb-wrap details.kunci[open] summary::before{content:"▾"}
  .gb-wrap details.kunci summary::-webkit-details-marker{display:none}
  .gb-wrap .langkah{counter-reset:lk;list-style:none;padding-left:0;margin:10px 0}
  .gb-wrap .langkah li{counter-increment:lk;position:relative;padding:9px 12px 9px 42px;margin:7px 0;background:#fbfcff;border:1px solid #eef1f6;border-radius:10px;line-height:1.75}
  .gb-wrap .langkah li::before{content:counter(lk);position:absolute;left:10px;top:10px;width:22px;height:22px;border-radius:50%;background:#5b4b8a;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .gb-wrap .langkah li.blm{display:none}
  .gb-btn{margin:8px 0 0;padding:10px 14px;border:none;border-radius:10px;background:#7C3AED;color:#fff;font-weight:700;font-size:12px;cursor:pointer}
  .gb-btn.mini{padding:7px 12px;border-radius:999px;font-size:11px;background:#fff;color:#64748b;border:1px solid #e2e8f0;font-weight:700}
  .gb-paham{margin-top:10px;width:100%;background:#f1f5f9;color:#334155}
  .gb-paham.oke{background:#dcfce7;color:#166534;border:1px solid #a7f3d0}
  .gb-wrap table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13.5px}
  .gb-wrap th{background:#4C6EF5;color:#fff;padding:7px 9px;text-align:left}
  .gb-wrap td{border:1px solid #e3e6ef;padding:6px 9px}
  .gb-wrap tr:nth-child(even) td{background:#f8fafc}
  .gb-wrap details{margin:6px 0}
  .gb-wrap img,.gb-wrap svg{max-width:100%;height:auto}
  .gb-wrap img{display:block;margin:10px auto;border-radius:10px}
  .gb-wrap .figslot{border:2px dashed #cbd5e1;border-radius:10px;padding:18px;text-align:center;color:#64748b;font-size:12px;font-weight:700;margin:10px 0}
  .gb-wrap .pec{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 3px}
  .gb-wrap .pec-pemb{padding:0 4px 1px;border-bottom:1.5px solid currentColor;font-size:.82em}
  .gb-wrap .pec-peny{padding:1px 4px 0;font-size:.82em}
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

const buatBtn = (teks, cls) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'gb-btn' + (cls ? ' ' + cls : '');
  b.textContent = teks;
  return b;
};

const banner = (soalEl, tepat) => {
  const d = document.createElement('div');
  d.textContent = tepat ? '✅ Tepat! Lanjut ke soal berikutnya.' : '❌ Belum tepat — simak pembahasan bertahap di bawah.';
  d.style.cssText = tepat
    ? 'margin-top:8px;padding:9px 12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#166534;font-weight:700;font-size:12.5px'
    : 'margin-top:8px;padding:9px 12px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-weight:700;font-size:12.5px';
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

function langkahBertahap(details) {
  const list = details.querySelector('.langkah');
  if (!list) return;
  const items = [...list.querySelectorAll('li')];
  if (items.length < 2) return;
  items.forEach((li, i) => { if (i > 0) li.classList.add('blm'); });
  const btn = buatBtn('Langkah berikutnya ▸', 'mini');
  let idx = 1;
  btn.addEventListener('click', () => {
    if (idx < items.length) {
      items[idx].classList.remove('blm');
      idx += 1;
      if (idx >= items.length) btn.textContent = 'Semua langkah terbuka ✓';
    } else {
      items.forEach((li, i) => li.classList.toggle('blm', i > 0));
      idx = 1;
      btn.textContent = 'Langkah berikutnya ▸';
    }
  });
  list.after(btn);
}

function interaktif(soalEl) {
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
        if (details) { details.open = true; langkahBertahap(details); }
        banner(soalEl, idx === kunci.pg);
      });
    });
    return;
  }

  if (kunci.tipe === 'multi') {
    hint(soalEl, 'Ketuk satu atau lebih pernyataan, lalu Periksa.');
    const pilih = new Set();
    pil.forEach((li, idx) => {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        if (pilih.has(idx)) { pilih.delete(idx); li.style.borderColor = '#e6e9f4'; li.style.background = '#fbfcff'; }
        else { pilih.add(idx); li.style.borderColor = '#7C3AED'; li.style.background = '#f5f3ff'; }
      });
    });
    const pilWrap = soalEl.querySelector('.pil');
    if (pilWrap) {
      const btn = buatBtn('Periksa Jawaban');
      btn.addEventListener('click', () => {
        if (soalEl.dataset.done || !pilih.size) return;
        soalEl.dataset.done = '1';
        const benarSet = new Set(kunci.multi);
        pil.forEach((x, j) => {
          if (benarSet.has(j)) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
          else if (pilih.has(j)) { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
        });
        const tepat = pilih.size === benarSet.size && [...pilih].every((j) => benarSet.has(j));
        if (details) { details.open = true; langkahBertahap(details); }
        banner(soalEl, tepat);
      });
      pilWrap.after(btn);
    }
    return;
  }

  if (kunci.tipe === 'bs' && pil.length === kunci.bs.length) {
    hint(soalEl, 'Pilih Benar/Salah tiap pernyataan, lalu Periksa.');
    const pilih = [];
    pil.forEach((li, idx) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;gap:6px;margin-top:8px';
      const bB = buatBtn('Benar', 'mini');
      const bS = buatBtn('Salah', 'mini');
      bB.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        pilih[idx] = true;
        bB.style.cssText += ';background:#7C3AED;color:#fff;border-color:#7C3AED';
        bS.style.cssText += ';background:#fff;color:#64748b;border-color:#e2e8f0';
      });
      bS.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        pilih[idx] = false;
        bS.style.cssText += ';background:#7C3AED;color:#fff;border-color:#7C3AED';
        bB.style.cssText += ';background:#fff;color:#64748b;border-color:#e2e8f0';
      });
      wrap.appendChild(bB);
      wrap.appendChild(bS);
      li.appendChild(wrap);
    });
    const pilWrap = soalEl.querySelector('.pil');
    if (pilWrap) {
      const btn = buatBtn('Periksa Jawaban');
      btn.addEventListener('click', () => {
        if (soalEl.dataset.done || pilih.length !== kunci.bs.length || pilih.some((x) => typeof x !== 'boolean')) return;
        soalEl.dataset.done = '1';
        pil.forEach((x, j) => {
          if (pilih[j] === kunci.bs[j]) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
          else { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
        });
        const tepat = pilih.every((v, j) => v === kunci.bs[j]);
        if (details) { details.open = true; langkahBertahap(details); }
        banner(soalEl, tepat);
      });
      pilWrap.after(btn);
    }
  }
}

function enhance(root, babId) {
  const wrap = root.querySelector('.gb-wrap');
  if (!wrap) return;

  // ----- pisah materi vs latihan -----
  const anak = [...wrap.children];
  let splitIdx = anak.findIndex((el) => el.tagName === 'H2' && /Soal Pemantapan/i.test(el.textContent || ''));
  if (splitIdx < 0) splitIdx = anak.findIndex((el) => el.classList && el.classList.contains('soal'));
  if (splitIdx < 0) splitIdx = anak.length;
  const kiri = document.createElement('div');
  kiri.className = 'gb-kolom-materi';
  const kanan = document.createElement('div');
  kanan.className = 'gb-kolom-soal';
  const layout = document.createElement('div');
  layout.className = 'gb-layout';
  anak.forEach((el, i) => (i < splitIdx ? kiri : kanan).appendChild(el));
  layout.appendChild(kiri);
  layout.appendChild(kanan);

  // ----- header sticky + progres paham -----
  const kartuMateri = [...kiri.querySelectorAll('.kartu')];
  const kunciKey = `gbPaham:${babId || '-'}`;
  let paham = new Set();
  try { paham = new Set(JSON.parse(localStorage.getItem(kunciKey) || '[]')); } catch { paham = new Set(); }
  const sticky = document.createElement('div');
  sticky.className = 'gb-sticky';
  const chipSoal = document.createElement('span');
  chipSoal.className = 'gb-chip';
  chipSoal.textContent = `🎯 ${kanan.querySelectorAll('.soal').length} soal latihan`;
  const chipPaham = document.createElement('span');
  chipPaham.className = 'gb-chip';
  const segarkanChip = () => { chipPaham.textContent = `💡 ${paham.size}/${kartuMateri.length} bagian dipahami`; };
  segarkanChip();
  sticky.appendChild(chipSoal);
  sticky.appendChild(chipPaham);
  wrap.appendChild(sticky);
  wrap.appendChild(layout);

  kartuMateri.forEach((kartu, i) => {
    const btn = buatBtn(paham.has(i) ? '✓ Sudah paham' : '✓ Tandai paham bagian ini', 'gb-paham' + (paham.has(i) ? ' oke' : ''));
    btn.addEventListener('click', () => {
      if (paham.has(i)) paham.delete(i);
      else paham.add(i);
      try { localStorage.setItem(kunciKey, JSON.stringify([...paham])); } catch { /* abaikan */ }
      btn.textContent = paham.has(i) ? '✓ Sudah paham' : '✓ Tandai paham bagian ini';
      btn.classList.toggle('oke', paham.has(i));
      segarkanChip();
    });
    kartu.appendChild(btn);
  });

  // ----- interaktivitas soal -----
  kanan.querySelectorAll('.soal').forEach(interaktif);
}

export default function RendererHtmlBab({ html, babId }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!host.shadowRoot) host.attachShadow({ mode: 'open' });
    host.shadowRoot.innerHTML = `<style>${BASE_STYLE}</style><div class="gb-wrap">${bersihkanHtml(siapkanCss(html))}</div>`;
    enhance(host.shadowRoot, babId);
  }, [html, babId]);
  return <div ref={hostRef} />;
}