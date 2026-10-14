// src/utils/templateUnduhMateri.js
// ============================================================
// TEMPLATE UNDUH/CETAK MATERI BERLOGO GEMILANG (owner 14 Okt 2026:
// "guru mau mengunduh materi dengan template layout ada logo Gemilang").
// Murni: bab skema buku digital -> HTML A4 siap print/PDF lewat
// cetakLewatIframe (util kwitansi). Gambar figur dicetak sebagai catatan
// placeholder (gambar asli hidup di sistem), supaya dokumen tetap rapi
// dan ringan; guru yang butuh gambar penuh membuka bab di aplikasi.
// ============================================================

export const LOGO_GEMILANG = '/pwa-192x192.png';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function blokKeHtml(b = {}) {
  const jenis = b.jenis || b.tipe || 'paragraf';
  switch (jenis) {
    case 'judul': return `<h3>${esc(b.teks)}</h3>`;
    case 'kilat': return `<p class="kilat">⚡ ${esc(b.teks)}</p>`;
    case 'list': {
      const item = Array.isArray(b.item) ? b.item : Array.isArray(b.items) ? b.items : [];
      return `<ul>${item.map((i) => `<li>${esc(typeof i === 'string' ? i : i?.teks)}</li>`).join('')}</ul>`;
    }
    case 'rumus': return `<pre class="rumus">${esc(b.teks || b.latex || '')}</pre>`;
    case 'contoh': return `<div class="contoh"><b>Contoh:</b> ${esc(b.teks)}</div>`;
    case 'tips': return `<div class="tips">💡 ${esc(b.teks)}</div>`;
    case 'gambar': return `<p class="gambarnote">[Gambar: ${esc(b.alt || b.caption || 'tersedia di versi digital bab ini')}]</p>`;
    default: return `<p>${esc(b.teks)}</p>`;
  }
}

/**
 * @param {{judulBuku?:string, mapel?:string, jenjang?:string, kelas?:string|number, bab?:object, diunduhOleh?:string}} p
 * @returns {string} HTML A4 siap cetak/save-PDF
 */
export function htmlUnduhMateriGemilang({ judulBuku = '', mapel = '', jenjang = '', kelas = '', bab = {}, diunduhOleh = '' } = {}) {
  const sections = Array.isArray(bab.sections) ? bab.sections : [];
  const isi = sections
    .map((s) => `<h3>${esc(s?.judul || '')}</h3>${Array.isArray(s?.blocks) ? s.blocks.map(blokKeHtml).join('') : ''}`)
    .join('');
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${esc(bab.judul || judulBuku || 'Materi Gemilang')}</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; font-size: 12px; line-height: 1.55; }
  .kop { display: flex; gap: 10px; align-items: center; border-bottom: 3px solid #5B2ECC; padding-bottom: 8px; margin-bottom: 12px; }
  .kop img { width: 44px; height: 44px; border-radius: 50%; }
  .kop .t { font-size: 15px; font-weight: 800; letter-spacing: .4px; }
  .kop .s { font-size: 10px; color: #475569; }
  .ident { font-size: 10.5px; color: #475569; margin-bottom: 12px; }
  h2 { font-size: 16px; margin: 0 0 4px; }
  h3 { font-size: 13px; margin: 12px 0 4px; color: #4c1d95; }
  .kilat { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 8px 10px; }
  .rumus { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; white-space: pre-wrap; }
  .contoh { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px; }
  .tips { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; }
  .gambarnote { color: #6b7280; font-style: italic; }
  .footer { margin-top: 16px; font-size: 9.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px; }
</style>
</head>
<body>
  <div class="kop">
    <img src="${LOGO_GEMILANG}" alt="Logo Bimbel Gemilang" />
    <div>
      <div class="t">BIMBEL GEMILANG</div>
      <div class="s">Bimbingan Belajar &amp; Platform Edukasi Digital — Lembar Materi Resmi</div>
    </div>
  </div>
  <h2>${esc(bab.judul || '')}</h2>
  <div class="ident">
    Buku: ${esc(judulBuku) || '—'} · Mapel: ${esc(mapel) || '—'} · Jenjang: ${esc(jenjang) || '—'}${kelas ? ` · Kelas ${esc(kelas)}` : ''}
    ${diunduhOleh ? ` · Diunduh oleh: ${esc(diunduhOleh)}` : ''}
  </div>
  ${isi}
  <div class="footer">
    Diunduh dari sistem Bimbel Gemilang · materi versi cetak ini ringkas; gambar &amp; widget interaktif lengkap ada di bab digital aplikasi.
  </div>
</body>
</html>`;
}

export default { htmlUnduhMateriGemilang, LOGO_GEMILANG };
