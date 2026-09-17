
// src/components/buku/RendererHtmlBab.jsx (v14 — gabungan final)
// Menggabungkan SEMUA fitur terbaik v11 (Grid CBT Benar/Salah rapi dengan
// tombol radio bulat per baris + kelas gb-tepat/gb-meleset/gb-kunci) +
// parser kunci Bahasa Indonesia (dari parseSoal.js) + tipografi matematika
// asli (dari matika.js) + fallback baca pilihan dari tabel untuk soal
// multi Bahasa Indonesia tanpa <ul class="pil">.
import { useEffect, useRef } from 'react';
import { bersihkanHtml } from '../../utils/htmlBersih';
import { catatJawaban } from '../../services/kelasService';
import { parseKunci } from '../../utils/parseSoal';
import { percantikMatika, CSS_MATIKA } from '../../utils/matika';

const VERSI = 'v14';

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
  .gb-wrap .kartu{box-shadow:0 2px 10px rgba(30,27,75,.06);background:#fff;border-radius:14px;border-left:6px solid #4C6EF5;padding:16px;margin:10px 0}
  .gb-wrap h2.sec{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:18px}
  .gb-wrap h3.sub{color:#5b4b8a;margin:14px 0 6px;font-size:15px}
  .gb-wrap p{font-size:15.5px;line-height:1.8;margin:8px 0}
  .gb-wrap ul.sifat{padding-left:20px;margin:6px 0}
  .gb-wrap ul.sifat li{margin:6px 0;line-height:1.7}
  .gb-wrap .rumus{font-size:20px;padding:14px;border-radius:14px;background:linear-gradient(180deg,#f5f7ff,#eef2ff);border:1px solid #dbe3ff;text-align:center;font-weight:800;margin:8px 0}
  .gb-wrap .m{background:#eef2ff;border:1px solid #dbe3ff;color:#1e293b;padding:2px 7px;border-radius:7px}
  .gb-wrap .soal{border:1px solid #e3e6ef;box-shadow:0 2px 10px rgba(30,27,75,.05);background:#fff;border-radius:14px;padding:14px;margin:12px 0}
  .gb-wrap .soal>p{font-size:15.5px}
  .gb-wrap .pil{list-style:none;margin:8px 0;padding:0}
  .gb-wrap .pil li{padding:12px 14px;font-size:15px;border-radius:12px;margin:7px 0;border:1.5px solid #e6e9f4;background:#fbfcff;transition:background .15s,border-color .15s;cursor:pointer}
  .gb-wrap .pil li:active{transform:scale(.995)}
  .gb-wrap .pil li svg,.gb-wrap .pil li img{max-height:min(50vh,360px);width:auto;margin:6px auto;display:block}
  .gb-wrap ul.pil.gb-multi li{display:flex;align-items:flex-start}
  .gb-wrap ul.pil.gb-multi li::before{content:"";width:20px;height:20px;border:2px solid #94a3b8;border-radius:6px;flex:0 0 auto;margin:2px 10px 0 0;background:#fff}
  .gb-wrap ul.pil.gb-multi li.gb-dipilih{border-color:#7C3AED;background:#f5f3ff}
  .gb-wrap ul.pil.gb-multi li.gb-dipilih::before{content:"✓";background:#7C3AED;border-color:#7C3AED;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center}
  /* ===== GRID CBT BENAR/SALAH (standar ujian) ===== */
  .gb-cbt{border:1px solid #e3e6ef;border-radius:12px;overflow:hidden;margin:10px 0;background:#fff}
  .gb-cbt-head{display:grid;grid-template-columns:1fr 88px 88px;background:#4C6EF5;color:#fff;font-size:12px;font-weight:800}
  .gb-cbt-head .gb-cbt-text{padding:9px 12px}
  .gb-cbt-head .gb-cbt-opt{padding:9px 4px;text-align:center;border-left:1px solid rgba(255,255,255,.25)}
  .gb-cbt-row{display:grid;grid-template-columns:1fr 88px 88px;border-top:1px solid #eef1f6;align-items:stretch}
  .gb-cbt-row .gb-cbt-text{padding:11px 12px;font-size:14px;line-height:1.6}
  .gb-cbt-row.gb-tepat .gb-cbt-text{background:#f0fdf4}
  .gb-cbt-row.gb-meleset .gb-cbt-text{background:#fef2f2}
  .gb-cbt-opt{display:flex;align-items:center;justify-content:center;border-left:1px solid #eef1f6;padding:6px 0}
  .gb-cbt-btn{width:46px;height:46px;border-radius:50%;border:2px solid #cbd5e1;background:#fff;cursor:pointer;font-weight:800;font-size:12px;color:#64748b;transition:all .12s}
  .gb-cbt-btn:active{transform:scale(.94)}
  .gb-cbt-btn.gb-aktif{border-color:#7C3AED;background:#7C3AED;color:#fff}
  .gb-cbt-btn.gb-kunci{border-color:#16a34a;color:#16a34a;background:#f0fdf4}
  .gb-cbt-btn.gb-kunci.gb-aktif{background:#16a34a;color:#fff}
  .gb-cbt-btn:disabled{cursor:default}
  @media (max-width:640px){
    .gb-cbt-head,.gb-cbt-row{grid-template-columns:1fr 64px 64px}
    .gb-cbt-btn{width:40px;height:40px;font-size:11px}
  }
  .gb-bsbtns{display:flex;gap:6px;margin-top:8px}
  .gb-guru{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
  .gb-wrap details.kunci{margin:6px 0}
  .gb-wrap details.kunci summary{display:inline-flex;align-items:center;gap:6px;background:#eef2ff;color:#4338ca;border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:800;list-style:none;cursor:pointer}
  .gb-wrap details.kunci summary::before{content:"▸";font-size:11px}
  .gb-wrap details.kunci[open] summary::before{content:"▾"}
  .gb-wrap details.kunci summary::-webkit-details-marker{display:none}
  .gb-wrap details.kunci.gb-terkunci summary{opacity:.55;cursor:not-allowed}
  .gb-wrap .langkah{counter-reset:lk;list-style:none;padding-left:0;margin:10px 0}
  .gb-wrap .langkah li{counter-increment:lk;position:relative;padding:9px 12px 9px 42px;margin:7px 0;background:#fbfcff;border:1px solid #eef1f6;border-radius:10px;line-height:1.75}
  .gb-wrap .langkah li::before{content:counter(lk);position:absolute;left:10px;top:10px;width:22px;height:22px;border-radius:50%;background:#5b4b8a;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}
  .gb-wrap .langkah li.blm{display:none}
  .gb-btn{margin:8px 0 0;padding:10px 14px;border:none;border-radius:10px;background:#7C3AED;color:#fff;font-weight:700;font-size:12px;cursor:pointer}
  .gb-btn.mini{padding:7px 12px;border-radius:999px;font-size:11px;background:#fff;color:#64748b;border:1px solid #e2e8f0;font-weight:700}
  .gb-btn.mini.gb-aktif{background:#7C3AED;color:#fff;border-color:#7C3AED}
  .gb-paham{margin-top:10px;width:100%;background:#f1f5f9;color:#334155}
  .gb-paham.oke{background:#dcfce7;color:#166534;border:1px solid #a7f3d0}
  .gb-toast{position:sticky;bottom:8px;z-index:9;margin:8px auto 0;max-width:420px;background:#4338ca;color:#fff;border-radius:999px;padding:9px 16px;font-size:12px;font-weight:700;text-align:center;box-shadow:0 6px 16px rgba(67,56,202,.35)}
  .gb-wrap table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13.5px}
  .gb-wrap th{background:#4C6EF5;color:#fff;padding:7px 9px;text-align:left}
  .gb-wrap td{border:1px solid #e3e6ef;padding:6px 9px}
  .gb-wrap tr:nth-child(even) td{background:#f8fafc}
  .gb-wrap table.bs-hide{display:none}
  .gb-wrap img,.gb-wrap svg{max-width:100%;height:auto}
  .gb-wrap img{display:block;margin:12px auto;border-radius:10px;max-height:min(70vh,560px);object-fit:contain}
  .gb-wrap svg{max-height:min(70vh,480px);display:block;margin:10px auto}
  .gb-wrap .rujukan img,.gb-wrap .rujukan svg,.gb-wrap .soal img,.gb-wrap .soal svg{max-height:min(75vh,640px)}
  .gb-wrap .rujukan{overflow:auto;-webkit-overflow-scrolling:touch}
  .gb-wrap .fig{max-width:100%;height:auto}
  .gb-wrap .tanya{font-weight:700;margin:12px 0 8px;font-size:15.5px;line-height:1.55;color:#0f172a}
  .gb-wrap .nbadges{display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
  .gb-wrap .no{min-width:26px;height:26px;padding:0 6px;border-radius:8px;background:#5b4b8a;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
  .gb-wrap .lvl,.gb-wrap .tipe{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;border-radius:999px;padding:2px 9px}
  .gb-wrap .lvl.mudah{background:#dcfce7;color:#166534}.gb-wrap .lvl.sedang{background:#fef3c7;color:#92400e}.gb-wrap .lvl.sulit{background:#fee2e2;color:#991b1b}
  .gb-wrap .tipe{background:#eef2ff;color:#4338ca}
  .gb-wrap .rujukan{background:#f8fafc;border:1px solid #e2e8f0;border-left:5px solid #4C6EF5;border-radius:12px;padding:12px 14px;margin:8px 0 12px}
  .gb-wrap .rujukan-lab{font-size:11.5px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;color:#4C6EF5;margin:0 0 8px}
  .gb-wrap .naskah{background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:14.2px;margin:10px 0;line-height:1.75}
  .gb-wrap .hero{background:linear-gradient(135deg,#5b4b8a,#4C6EF5);color:#fff;border-radius:18px;padding:22px 20px;margin-bottom:12px}
  .gb-wrap .hero h1{margin:4px 0 8px;font-size:24px;line-height:1.2}
  .gb-wrap .chips{display:flex;gap:6px;flex-wrap:wrap}
  .gb-wrap .chips span{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700}
  .gb-wrap .figslot{border:2px dashed #cbd5e1;border-radius:10px;padding:18px;text-align:center;color:#64748b;font-size:12px;font-weight:700;margin:10px 0}
  .gb-wrap .caption{text-align:center;font-size:11.5px;color:#64748b}
  .gb-wrap .vinc{border-top:1.5px solid currentColor;padding:0 2px;margin-left:1px}
  .gb-wrap .akar{white-space:nowrap}
  .gb-wrap .pec{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 3px}
  .gb-wrap .pec-pemb{padding:0 4px 1px;border-bottom:1.5px solid currentColor;font-size:.82em}
  .gb-wrap .pec-peny{padding:1px 4px 0;font-size:.82em}
`;

function siapkanCss(html) {
  return String(html)
    .replace(/:root\s*\{/g, '.gb-wrap{')
    .replace(/(^|})\s*body\s*\{/g, '$1.gb-wrap{');
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
  d.textContent = tepat ? '✅ Tepat! Kunci & pembahasan terbuka di bawah.' : '❌ Belum tepat — simak pembahasan bertahap di bawah.';
  d.style.cssText = tepat
    ? 'margin-top:8px;padding:9px 12px;border-radius:10px;background:#ecfdf5;border:1px solid #a7f3d0;color:#166534;font-weight:700;font-size:12.5px'
    : 'margin-top:8px;padding:9px 12px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;font-weight:700;font-size:12.5px';
  soalEl.appendChild(d);
};

const hint = (soalEl, teks) => {
  const d = document.createElement('div');
  d.textContent = '✋ ' + teks;
  d.style.cssText = 'margin:6px 0 2px;font-size:11px;color:#7C3AED;font-weight:700';
  const pil = soalEl.querySelector('.pil') || soalEl.querySelector('ul') || soalEl.querySelector('table') || soalEl.querySelector('.gb-cbt');
  if (pil) pil.before(d);
  else soalEl.appendChild(d);
};

function setupLangkah(details) {
  if (details._maju) return details._maju;
  const list = details.querySelector('.langkah') || details.querySelector('ol');
  if (!list) return null;
  const items = [...list.querySelectorAll('li')];
  if (items.length < 2) return null;
  details.dataset.bertahap = '1';
  items.forEach((li, i) => { if (i > 0) li.classList.add('blm'); });
  let idx = 1;
  const maju = () => {
    if (idx < items.length) {
      items[idx].classList.remove('blm');
      idx += 1;
      if (idx >= items.length && btn) btn.textContent = 'Semua langkah terbuka ✓';
      return true;
    }
    return false;
  };
  const btn = buatBtn('Langkah berikutnya ▸', 'mini');
  btn.addEventListener('click', () => { maju(); });
  list.after(btn);
  details._maju = maju;
  return maju;
}

function bukaKunci(details, semuaLangkah) {
  if (!details) return;
  details.classList.remove('gb-terkunci');
  details.open = true;
  if (semuaLangkah) {
    details.querySelectorAll('.langkah li.blm').forEach((li) => li.classList.remove('blm'));
  } else if (!details.dataset.bertahap) {
    setupLangkah(details);
  }
}

function toastShadow(root, teks) {
  const lama = root.querySelector('.gb-toast');
  if (lama) lama.remove();
  const d = document.createElement('div');
  d.className = 'gb-toast';
  d.textContent = teks;
  const wrap = root.querySelector('.gb-wrap');
  if (wrap) wrap.appendChild(d);
  setTimeout(() => d.remove(), 2200);
}

function bersihGlyph(el) {
  el.innerHTML = el.innerHTML.replace(/^\s*[\u2610\u2611\u2612\u25A1\u25EB\u25FC\u2B1C\u2B1D]\s*/, '');
}
const bersihTeksStmt = (s) => String(s || '')
  .replace(/^\s*[\u2610\u2611\u2612\u25A1\u25EB\u25FC\u2B1C\u2B1D]\s*/, '')
  .replace(/\s+/g, ' ').trim();

// cariKunci memakai parseKunci dari parseSoal.js yang sudah mendukung
// kunci Bahasa Indonesia (tanpa prefix "Jawaban:", format "C", "Pernyataan
// 1, 3, dan 4", "A Salah · B Benar · C Benar", "A Setuju · ...", dll).
function cariKunci(soalEl) {
  const j = soalEl.querySelector('.jawab');
  if (j) { const k = parseKunci(j.textContent); if (k) return k; }
  const d = soalEl.querySelector('details');
  if (d) { const k = parseKunci(d.textContent); if (k) return k; }
  return parseKunci(soalEl.textContent);
}

function cariPilihan(soalEl) {
  const ul = soalEl.querySelector('ul.pil') || soalEl.querySelector('ul');
  let lis = ul ? [...ul.querySelectorAll('li')] : [];
  if (!lis.length) lis = [...soalEl.querySelectorAll('.pil > *')];
  if (!lis.length) lis = [...soalEl.querySelectorAll('li')];
  lis.forEach(bersihGlyph);
  return { ul, lis };
}

// ===== BANGUN GRID CBT BENAR/SALAH (dari v11 — tidak dipotong) =====
function bangunCbt(soalEl, pernyataan) {
  const wrapCbt = document.createElement('div');
  wrapCbt.className = 'gb-cbt';
  const head = document.createElement('div');
  head.className = 'gb-cbt-head';
  head.innerHTML = '<span class="gb-cbt-text">Pernyataan</span><span class="gb-cbt-opt">Benar</span><span class="gb-cbt-opt">Salah</span>';
  wrapCbt.appendChild(head);
  const rows = pernyataan.map((teks, i) => {
    const row = document.createElement('div');
    row.className = 'gb-cbt-row';
    const txt = document.createElement('div');
    txt.className = 'gb-cbt-text';
    txt.textContent = (i + 1) + '. ' + teks;
    const optB = document.createElement('button');
    optB.type = 'button'; optB.className = 'gb-cbt-btn'; optB.textContent = 'B';
    const optS = document.createElement('button');
    optS.type = 'button'; optS.className = 'gb-cbt-btn'; optS.textContent = 'S';
    const cellB = document.createElement('div'); cellB.className = 'gb-cbt-opt'; cellB.appendChild(optB);
    const cellS = document.createElement('div'); cellS.className = 'gb-cbt-opt'; cellS.appendChild(optS);
    row.appendChild(txt); row.appendChild(cellB); row.appendChild(cellS);
    wrapCbt.appendChild(row);
    return { row, optB, optS };
  });
  // sembunyikan wadah asli (tabel markdown / ul) supaya tidak dobel & rapi
  const asli = soalEl.querySelector('table') || soalEl.querySelector('ul.pil') || soalEl.querySelector('ul');
  if (asli) {
    asli.style.display = 'none';
    asli.classList.add('bs-hide');
  }
  const jangkar = asli || soalEl.querySelector('p');
  if (jangkar) jangkar.after(wrapCbt);
  else soalEl.appendChild(wrapCbt);
  return rows;
}

function interaktif(soalEl, root, soalNo, opts) {
  const details = soalEl.querySelector('details');
  const kunci = cariKunci(soalEl);
  const { ul, lis } = cariPilihan(soalEl);
  if (!kunci) return false;

  const catat = (tepat, ringkas) => {
    if (opts.presentasi || !opts.siswaId) return;
    catatJawaban({
      bukuId: opts.bukuId, babId: opts.babId, soalNo,
      tipe: kunci.tipe, benar: tepat, jawaban: ringkas,
      siswaId: opts.siswaId, nama: opts.nama,
    });
  };

  if (opts.presentasi) {
    const ctrl = document.createElement('div');
    ctrl.className = 'gb-guru';
    const bReveal = buatBtn('🔓 Buka kunci & pembahasan', 'mini');
    bReveal.addEventListener('click', () => bukaKunci(details, true));
    const bStep = buatBtn('▸ Jelaskan bertahap', 'mini');
    bStep.addEventListener('click', () => {
      if (!details) return;
      details.classList.remove('gb-terkunci');
      details.open = true;
      const maju = setupLangkah(details);
      if (maju) maju();
    });
    ctrl.appendChild(bReveal);
    ctrl.appendChild(bStep);
    soalEl.appendChild(ctrl);
    return true;
  }

  // ---------- PG ----------
  if (kunci.tipe === 'pg' && lis.length >= 2) {
    hint(soalEl, 'Ketuk jawabanmu untuk memeriksa.');
    lis.forEach((li, idx) => {
      li.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        soalEl.dataset.done = '1';
        lis.forEach((x, j) => {
          if (j === kunci.pg) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
          else if (j === idx) { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
        });
        bukaKunci(details, false);
        banner(soalEl, idx === kunci.pg);
        catat(idx === kunci.pg, String.fromCharCode(65 + idx));
      });
    });
    return true;
  }

  // ---------- MULTI (PG Kompleks) ----------
  // Fallback: untuk soal Bahasa Indonesia tanpa <ul class="pil">,
  // baca pilihan dari tabel pernyataan (kolom pertama setiap baris).
  let lisMulti = lis;
  let ulMulti = ul;
  if (!lisMulti.length) {
    const tds = [...soalEl.querySelectorAll('table tbody tr')].map((tr) => tr.querySelector('td'));
    if (tds.length) {
      lisMulti = tds;
      ulMulti = null;
    }
  }
  if (kunci.tipe === 'multi' && lisMulti.length >= 2) {
    if (ulMulti) ulMulti.classList.add('gb-multi');
    hint(soalEl, 'Ketuk satu atau lebih pernyataan, lalu tekan Periksa.');
    const pilih = new Set();
    lisMulti.forEach((li, idx) => {
      li.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        if (pilih.has(idx)) { pilih.delete(idx); li.classList.remove('gb-dipilih'); }
        else { pilih.add(idx); li.classList.add('gb-dipilih'); }
      });
    });
    const btn = buatBtn('Periksa Jawaban');
    btn.addEventListener('click', () => {
      if (soalEl.dataset.done || !pilih.size) return;
      soalEl.dataset.done = '1';
      const benarSet = new Set(kunci.multi);
      lisMulti.forEach((x, j) => {
        if (benarSet.has(j)) { x.style.background = '#dcfce7'; x.style.borderColor = '#22c55e'; }
        else if (pilih.has(j)) { x.style.background = '#fef2f2'; x.style.borderColor = '#ef4444'; }
      });
      const tepat = pilih.size === benarSet.size && [...pilih].every((j) => benarSet.has(j));
      bukaKunci(details, false);
      banner(soalEl, tepat);
      catat(tepat, [...pilih].sort((a, b) => a - b).map((i) => i + 1).join(','));
    });
    const anchor = ulMulti || soalEl.querySelector('table') || soalEl.querySelector('p');
    if (anchor) anchor.after(btn);
    else soalEl.appendChild(btn);
    return true;
  }

  // ---------- BENAR/SALAH (GRID CBT) ----------
  if (kunci.tipe === 'bs') {
    let pernyataan = lis.length === kunci.bs.length
      ? lis.map((li) => bersihTeksStmt(li.textContent))
      : null;
    if (!pernyataan) {
      const tds = [...soalEl.querySelectorAll('table tbody tr')].map((tr) => bersihTeksStmt(tr.querySelector('td')?.textContent)).filter(Boolean);
      if (tds.length === kunci.bs.length) pernyataan = tds;
    }
    if (!pernyataan) return false;
    hint(soalEl, 'Pilih Benar (B) atau Salah (S) untuk tiap pernyataan, lalu Periksa.');
    const rows = bangunCbt(soalEl, pernyataan);
    const pilih = [];
    rows.forEach((r, idx) => {
      r.optB.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        pilih[idx] = true;
        r.optB.classList.add('gb-aktif');
        r.optS.classList.remove('gb-aktif');
      });
      r.optS.addEventListener('click', () => {
        if (soalEl.dataset.done) return;
        pilih[idx] = false;
        r.optS.classList.add('gb-aktif');
        r.optB.classList.remove('gb-aktif');
      });
    });
    const btn = buatBtn('Periksa Jawaban');
    btn.addEventListener('click', () => {
      if (soalEl.dataset.done || pilih.length !== kunci.bs.length || pilih.some((x) => typeof x !== 'boolean')) {
        toastShadow(root, 'Lengkapi pilihan Benar/Salah semua pernyataan dulu ya.');
        return;
      }
      soalEl.dataset.done = '1';
      rows.forEach((r, j) => {
        const tepat = pilih[j] === kunci.bs[j];
        r.row.classList.add(tepat ? 'gb-tepat' : 'gb-meleset');
        const btnKunci = kunci.bs[j] ? r.optB : r.optS;
        btnKunci.classList.add('gb-kunci');
        r.optB.disabled = true;
        r.optS.disabled = true;
      });
      btn.disabled = true;
      btn.style.opacity = '.5';
      const tepatAll = pilih.every((v, j) => v === kunci.bs[j]);
      bukaKunci(details, false);
      banner(soalEl, tepatAll);
      catat(tepatAll, pilih.map((v) => (v ? 'B' : 'S')).join(''));
    });
    const anchor = soalEl.querySelector('.gb-cbt');
    if (anchor) anchor.after(btn);
    else soalEl.appendChild(btn);
    return true;
  }

  return false;
}

function enhance(root, opts) {
  const wrap = root.querySelector('.gb-wrap') || root;
  wrap.querySelectorAll('li').forEach(bersihGlyph);

  try {
    const anak = [...wrap.children];
    let splitIdx = anak.findIndex((el) => /^H[12]$/.test(el.tagName) && /Soal Pemantapan/i.test(el.textContent || ''));
    if (splitIdx < 0) splitIdx = anak.findIndex((el) => el.classList && el.classList.contains('soal'));
    if (splitIdx > 0 && splitIdx < anak.length) {
      const kiri = document.createElement('div'); kiri.className = 'gb-kolom-materi';
      const kanan = document.createElement('div'); kanan.className = 'gb-kolom-soal';
      const layout = document.createElement('div'); layout.className = 'gb-layout';
      anak.forEach((el, i) => (i < splitIdx ? kiri : kanan).appendChild(el));
      layout.appendChild(kiri); layout.appendChild(kanan);
      wrap.appendChild(layout);
    }
  } catch { /* satu kolom */ }

  const semuaSoal = [...wrap.querySelectorAll('.soal')];
  const sticky = document.createElement('div');
  sticky.className = 'gb-sticky';
  const chipSoal = document.createElement('span'); chipSoal.className = 'gb-chip';
  chipSoal.textContent = opts.presentasi ? `🎓 Mode Bahas · ${semuaSoal.length} soal` : `🎯 ${semuaSoal.length} soal`;
  const chipSiap = document.createElement('span'); chipSiap.className = 'gb-chip';
  const chipPaham = document.createElement('span'); chipPaham.className = 'gb-chip';
  const chipVer = document.createElement('span'); chipVer.className = 'gb-chip';
  chipVer.textContent = `⚙️ ${VERSI}`;
  sticky.appendChild(chipSoal); sticky.appendChild(chipSiap); sticky.appendChild(chipPaham); sticky.appendChild(chipVer);
  if (opts.presentasi) {
    const bAll = buatBtn('🔓 Buka semua kunci', 'mini');
    bAll.addEventListener('click', () => root.querySelectorAll('details').forEach((d) => bukaKunci(d, true)));
    const bNone = buatBtn('🙈 Tutup semua', 'mini');
    bNone.addEventListener('click', () => root.querySelectorAll('details').forEach((d) => {
      d.open = false; d.classList.add('gb-terkunci');
      d.querySelectorAll('.langkah li').forEach((li, i) => { if (i > 0) li.classList.add('blm'); });
    }));
    const bExit = buatBtn('⬅ Keluar mode bahas', 'mini');
    bExit.addEventListener('click', () => { if (opts.onKeluar) opts.onKeluar(); });
    sticky.appendChild(bAll); sticky.appendChild(bNone); sticky.appendChild(bExit);
  }
  wrap.insertBefore(sticky, wrap.firstChild);

  if (!opts.presentasi) {
    const kartuMateri = [...wrap.querySelectorAll('.kartu')];
    const kunciKey = `gbPaham:${opts.babId || '-'}`;
    let paham = new Set();
    try { paham = new Set(JSON.parse(localStorage.getItem(kunciKey) || '[]')); } catch { paham = new Set(); }
    const segarkanChip = () => { chipPaham.textContent = `💡 ${paham.size}/${kartuMateri.length} paham`; };
    segarkanChip();
    kartuMateri.forEach((kartu, i) => {
      const btn = buatBtn(paham.has(i) ? '✓ Sudah paham' : '✓ Tandai paham bagian ini', 'gb-paham' + (paham.has(i) ? ' oke' : ''));
      btn.addEventListener('click', () => {
        if (paham.has(i)) paham.delete(i); else paham.add(i);
        try { localStorage.setItem(kunciKey, JSON.stringify([...paham])); } catch { /* abaikan */ }
        btn.textContent = paham.has(i) ? '✓ Sudah paham' : '✓ Tandai paham bagian ini';
        btn.classList.toggle('oke', paham.has(i));
        segarkanChip();
      });
      kartu.appendChild(btn);
    });
  }

  root.querySelectorAll('details').forEach((d) => {
    if (/Jawaban:/i.test(d.textContent || '')) { d.open = false; d.classList.add('gb-terkunci'); }
  });
  root.querySelectorAll('details summary').forEach((s) => {
    s.addEventListener('click', (e) => {
      const d = s.closest('details');
      if (d && d.classList.contains('gb-terkunci')) {
        e.preventDefault();
        toastShadow(root, opts.presentasi
          ? 'Gunakan tombol guru di bawah soal untuk membuka kunci.'
          : 'Kerjakan soal ini dulu ya — kunci & pembahasan terbuka setelah kamu menjawab 🙂');
      }
    });
  });

  let siap = 0;
  semuaSoal.forEach((soalEl, i) => {
    let ok = false;
    try { ok = interaktif(soalEl, root, i + 1, opts); } catch { ok = false; }
    if (ok) siap += 1;
    else { const d = soalEl.querySelector('details'); if (d) d.classList.remove('gb-terkunci'); }
  });

  chipSiap.textContent = opts.presentasi ? '🔓 kontrol guru aktif' : `🔓 ${siap}/${semuaSoal.length} siap dicoba`;
}

export default function RendererHtmlBab({ html, babId, bukuId, modePresentasi = false, onKeluar }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!host.shadowRoot) host.attachShadow({ mode: 'open' });
    // v14: terapkan percantikMatika() SEBELUM injeksi ke shadow DOM
    const isi = percantikMatika(bersihkanHtml(siapkanCss(html)));
    host.shadowRoot.innerHTML = `<style>${BASE_STYLE}${CSS_MATIKA}</style><div class="gb-wrap">${isi}</div>`;
    const siswaId = localStorage.getItem('studentId') || '';
    const nama = localStorage.getItem('studentName') || localStorage.getItem('studentNama') || '';
    try {
      enhance(host.shadowRoot, { babId, bukuId, presentasi: modePresentasi, siswaId, nama, onKeluar });
    } catch {
      host.shadowRoot.querySelectorAll('details').forEach((d) => d.classList.remove('gb-terkunci'));
    }
    return undefined;
  }, [html, babId, bukuId, modePresentasi]);
  return <div ref={hostRef} />;
}