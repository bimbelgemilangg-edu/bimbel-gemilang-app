// src/utils/imporBabMesin.js
// Mesin penyimpan bab HTML hasil scan:
// 1) extract data:image base64 → upload Supabase → ganti URL
// 2) SVG inline besar (>40KB) → upload Supabase sebagai .svg → ganti <img>
// 3) cek batas ~1 MB Firestore → siap setDoc
// Mengganti Firebase Storage (butuh Blaze) dengan Supabase (sudah dipakai proyek).
import { uploadElearningFile } from '../services/uploadService';

const SVG_BESAR = 40000; // svg inline > 40KB dipindah ke Storage
export const BYTE_MAX = 1000000; // batas aman dokumen Firestore (~1 MB)

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export function hitungStatistik(html) {
  const d = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return {
    soal: d.querySelectorAll('.soal').length,
    svg: d.querySelectorAll('svg').length,
    kunci: [...d.querySelectorAll('details')].filter((x) => /Jawaban:|Kunci/i.test(x.textContent)).length,
    img: d.querySelectorAll('img').length,
  };
}

/** dataURL / base64 string → File */
function dataUrlKeFile(dataUrl, namaDasar) {
  const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/i);
  if (!m) return null;
  const mime = (m[1] || 'image/jpeg').toLowerCase().trim();
  const b64 = m[2];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const ext = MIME_EXT[mime] || 'bin';
  return new File([arr], `${namaDasar}.${ext}`, { type: mime });
}

/**
 * Cari semua data:image...;base64,... di atribut src (dan CSS url()),
 * upload ke Supabase, ganti jadi URL publik.
 * onProgress(done, total) opsional.
 */
export async function pindahBase64KeSupabase(html, slugPrefix = 'bab', onProgress) {
  const re = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi;
  const unik = [];
  const seen = new Set();
  let m;
  const src = String(html || '');
  while ((m = re.exec(src)) !== null) {
    if (!seen.has(m[0])) {
      seen.add(m[0]);
      unik.push(m[0]);
    }
  }
  if (!unik.length) return { html: src, dipindah: 0, gagal: 0 };

  let out = src;
  let dipindah = 0;
  let gagal = 0;
  const total = unik.length;

  for (let i = 0; i < unik.length; i++) {
    const dataUrl = unik[i];
    if (onProgress) onProgress(i, total);
    try {
      const file = dataUrlKeFile(dataUrl, `${slugPrefix}-img-${i + 1}`);
      if (!file) {
        gagal++;
        continue;
      }
      // kompres true untuk foto hasil scan agar hemat kuota; SVG tidak lewat sini
      const up = await uploadElearningFile(file, 'materi', {
        kompres: file.type !== 'image/png', // png (diagram) jangan di-JPEG-kan
        contentType: file.type,
      });
      if (!up.success || !up.downloadURL) {
        gagal++;
        console.warn('Gagal upload base64', up.error);
        continue;
      }
      // ganti SEMUA kemunculan dataUrl yang sama
      out = out.split(dataUrl).join(up.downloadURL);
      dipindah++;
    } catch (e) {
      gagal++;
      console.warn('Error upload base64', e);
    }
  }
  if (onProgress) onProgress(total, total);
  return { html: out, dipindah, gagal };
}

/**
 * SVG inline besar → file .svg di Supabase → <img src=url>.
 */
export async function pindahSvgBesarKeSupabase(html, slugPrefix = 'bab', onProgress) {
  const re = /<svg[\s\S]*?<\/svg>/gi;
  const daftar = [];
  let m;
  let i = 0;
  const src = String(html || '');
  while ((m = re.exec(src)) !== null) {
    if (m[0].length > SVG_BESAR) daftar.push({ idx: i, svg: m[0] });
    i++;
  }
  if (!daftar.length) return { html: src, dipindah: 0, gagal: 0 };

  let out = src;
  let dipindah = 0;
  let gagal = 0;
  const total = daftar.length;

  for (let k = 0; k < daftar.length; k++) {
    const d = daftar[k];
    if (onProgress) onProgress(k, total);
    try {
      const blob = new Blob([d.svg], { type: 'image/svg+xml' });
      const file = new File([blob], `${slugPrefix}-svg-${d.idx + 1}.svg`, { type: 'image/svg+xml' });
      const up = await uploadElearningFile(file, 'materi', {
        kompres: false,
        contentType: 'image/svg+xml',
      });
      if (!up.success || !up.downloadURL) {
        gagal++;
        continue;
      }
      out = out.split(d.svg).join(
        `<img class="fig" src="${up.downloadURL}" alt="Figur ${d.idx + 1}" style="max-width:100%;height:auto;display:block;margin:8px auto"/>`
      );
      dipindah++;
    } catch (e) {
      gagal++;
      console.warn('Error upload SVG', e);
    }
  }
  if (onProgress) onProgress(total, total);
  return { html: out, dipindah, gagal };
}

/**
 * Pipeline penuh: base64 → Supabase, SVG besar → Supabase, cek ukuran.
 * Mengembalikan { ok, html, bytes, imgDipindah, svgDipindah, error }.
 */
export async function siapkanHtmlUntukFirestore(html, slugPrefix = 'bab', onProgress) {
  let tahap = 'base64';
  const report = (done, total) => {
    if (onProgress) onProgress({ tahap, done, total });
  };

  const b64 = await pindahBase64KeSupabase(html, slugPrefix, (done, total) => {
    tahap = 'base64';
    report(done, total);
  });

  tahap = 'svg';
  const svg = await pindahSvgBesarKeSupabase(b64.html, slugPrefix, (done, total) => {
    tahap = 'svg';
    report(done, total);
  });

  const final = svg.html;
  const bytes = new TextEncoder().encode(final).length;

  if (bytes > BYTE_MAX) {
    return {
      ok: false,
      html: final,
      bytes,
      imgDipindah: b64.dipindah,
      svgDipindah: svg.dipindah,
      error: `HTML masih ${bytes.toLocaleString('id-ID')} byte setelah gambar & SVG besar dipindah ke Supabase (batas ~${BYTE_MAX.toLocaleString('id-ID')}). Pecah bab jadi dua file atau kurangi konten.`,
    };
  }

  return {
    ok: true,
    html: final,
    bytes,
    imgDipindah: b64.dipindah,
    svgDipindah: svg.dipindah,
    gagalImg: b64.gagal,
    gagalSvg: svg.gagal,
  };
}

export default {
  hitungStatistik,
  pindahBase64KeSupabase,
  pindahSvgBesarKeSupabase,
  siapkanHtmlUntukFirestore,
  BYTE_MAX,
};