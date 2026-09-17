// src/utils/imporBabMesin.js
// Mesin penyimpan bab HTML interaktif (scan / AI / modul):
// 1) extract data:image base64 → Supabase → ganti URL publik (CDN)
// 2) SVG inline besar (>40KB) → Supabase .svg → <img>
// 3) jika HTML masih besar → upload seluruh file HTML ke Supabase, simpan htmlUrl
//    (Firestore cuma metadata) → siswa unduh cepat lewat CDN, tidak lemot
// 4) cek batas Firestore hanya untuk field html inline
import { uploadElearningFile } from '../services/uploadService';

const SVG_BESAR = 40000;
/** Batas aman field html di Firestore (~1 MB, sisakan margin) */
export const BYTE_MAX = 900000;
/** Di atas ini → HTML penuh disimpan di Supabase (htmlUrl), bukan di Firestore */
export const BYTE_PREFER_URL = 350000;

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

/** Tambah loading="lazy" decoding="async" ke semua <img> tanpa atribut itu */
export function tandaiLazyImg(html) {
  return String(html || '').replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    let a = attrs;
    if (!/\bloading\s*=/i.test(a)) a += ' loading="lazy"';
    if (!/\bdecoding\s*=/i.test(a)) a += ' decoding="async"';
    return `<img${a}>`;
  });
}

/**
 * Cari semua data:image...;base64,... upload ke Supabase, ganti URL.
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
      const up = await uploadElearningFile(file, 'materi', {
        kompres: false, // jaga kualitas diagram/logo modul
      });
      const url = up?.downloadURL || up?.url;
      if (url) {
        out = out.split(dataUrl).join(url);
        dipindah++;
      } else {
        gagal++;
        console.warn('Gagal upload base64', up?.error);
      }
    } catch (e) {
      gagal++;
      console.warn('Error upload base64', e);
    }
  }
  if (onProgress) onProgress(total, total);
  return { html: out, dipindah, gagal };
}

/** SVG inline besar → file .svg di Supabase */
export async function pindahSvgBesarKeSupabase(html, slugPrefix = 'bab', onProgress) {
  const re = /<svg\b[\s\S]*?<\/svg>/gi;
  const src = String(html || '');
  const daftar = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[0].length >= SVG_BESAR) daftar.push(m[0]);
  }
  if (!daftar.length) return { html: src, dipindah: 0, gagal: 0 };

  let out = src;
  let dipindah = 0;
  let gagal = 0;
  const total = daftar.length;

  for (let i = 0; i < daftar.length; i++) {
    const svg = daftar[i];
    if (onProgress) onProgress(i, total);
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const file = new File([blob], `${slugPrefix}-svg-${i + 1}.svg`, { type: 'image/svg+xml' });
      const up = await uploadElearningFile(file, 'materi', {
        kompres: false,
      });
      const url = up?.downloadURL || up?.url;
      if (url) {
        out = out.split(svg).join(
          `<img src="${url}" alt="figur" loading="lazy" decoding="async" style="max-width:100%;height:auto;display:block;margin:10px auto">`
        );
        dipindah++;
      } else gagal++;
    } catch (e) {
      gagal++;
      console.warn('Error upload SVG', e);
    }
  }
  if (onProgress) onProgress(total, total);
  return { html: out, dipindah, gagal };
}

/** Upload HTML penuh sebagai file .html ke Supabase — return public URL */
export async function uploadHtmlKeSupabase(html, slugPrefix = 'bab') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const file = new File([blob], `${slugPrefix}.html`, { type: 'text/html' });
  const up = await uploadElearningFile(file, 'materi', {});
  const url = up?.downloadURL || up?.url;
  if (!url) throw new Error(up?.error || 'Gagal upload HTML ke Supabase');
  return url;
}

/**
 * Pipeline penuh.
 * Return:
 *   ok, html (inline, boleh kosong jika mode url), htmlUrl, mode ('inline'|'url'),
 *   bytes, imgDipindah, svgDipindah, error
 */
export async function siapkanHtmlUntukFirestore(html, slugPrefix = 'bab', onProgress) {
  let tahap = 'base64';
  const report = (done, total) => {
    if (typeof onProgress === 'function') onProgress({ tahap, done, total });
  };

  const b64 = await pindahBase64KeSupabase(html, slugPrefix, (done, total) => {
    tahap = 'base64';
    report(done, total);
  });

  tahap = 'svg';
  const svg = await pindahSvgBesarKeSupabase(b64.html, slugPrefix, (done, total) => {
    report(done, total);
  });

  let final = tandaiLazyImg(svg.html);
  let bytes = new TextEncoder().encode(final).length;
  let htmlUrl = null;
  let mode = 'inline';

  // File besar: simpan di Supabase Storage (CDN), Firestore hanya metadata + url
  if (bytes > BYTE_PREFER_URL || bytes > BYTE_MAX) {
    tahap = 'html-file';
    report(0, 1);
    try {
      htmlUrl = await uploadHtmlKeSupabase(final, slugPrefix);
      mode = 'url';
      // Firestore tetap dapat cuplikan kecil untuk preview/search (opsional)
      // Kosongkan html penuh agar setDoc aman
      if (bytes > BYTE_MAX) {
        final = ''; // wajib kosong — terlalu besar
      }
      // jika masih di bawah BYTE_MAX tapi prefer URL: simpan juga inline sebagai cache
      // (siswa bisa baca tanpa fetch kedua). Di atas BYTE_MAX: hanya url.
      report(1, 1);
    } catch (e) {
      if (bytes > BYTE_MAX) {
        return {
          ok: false,
          html: final,
          htmlUrl: null,
          mode: 'inline',
          bytes,
          imgDipindah: b64.dipindah,
          svgDipindah: svg.dipindah,
          error: `HTML ${bytes.toLocaleString('id-ID')} byte gagal di-upload ke Supabase: ${e.message}. Coba lagi atau pecah bab.`,
        };
      }
      // di bawah BYTE_MAX: fallback simpan inline
      mode = 'inline';
      htmlUrl = null;
    }
  }

  if (mode === 'inline' && bytes > BYTE_MAX) {
    return {
      ok: false,
      html: final,
      htmlUrl: null,
      mode: 'inline',
      bytes,
      imgDipindah: b64.dipindah,
      svgDipindah: svg.dipindah,
      error: `HTML masih ${bytes.toLocaleString('id-ID')} byte (batas ~${BYTE_MAX.toLocaleString('id-ID')}). Pecah bab atau kurangi konten.`,
    };
  }

  return {
    ok: true,
    html: mode === 'url' && bytes > BYTE_MAX ? '' : final,
    htmlUrl,
    mode,
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
  uploadHtmlKeSupabase,
  siapkanHtmlUntukFirestore,
  tandaiLazyImg,
  BYTE_MAX,
  BYTE_PREFER_URL,
};