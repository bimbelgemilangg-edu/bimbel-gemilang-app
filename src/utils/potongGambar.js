// src/utils/potongGambar.js
// Util potong region (koordinat ternormalisasi 0..1) dari canvas halaman PDF.
// Dipakai oleh EditorBab setelah admin memilih region dari PemotongGambar.

function rectPiksel(canvas, rect) {
    const x = Math.max(0, Math.round(rect.x * canvas.width));
    const y = Math.max(0, Math.round(rect.y * canvas.height));
    const w = Math.max(1, Math.min(canvas.width - x, Math.round(rect.w * canvas.width)));
    const h = Math.max(1, Math.min(canvas.height - y, Math.round(rect.h * canvas.height)));
    return { x, y, w, h };
  }
  
  // Preview cepat (data URL) untuk popover konfirmasi
  export function regionCanvasKeDataUrl(canvas, rect, kualitas = 0.9) {
    const p = rectPiksel(canvas, rect);
    const out = document.createElement('canvas');
    out.width = p.w;
    out.height = p.h;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.drawImage(canvas, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
    return out.toDataURL('image/jpeg', kualitas);
  }
  
  // File JPEG siap upload ke Supabase lewat uploadElearningFile
  export async function regionCanvasKeFile(canvas, rect, namaFile, kualitas = 0.9) {
    const url = regionCanvasKeDataUrl(canvas, rect, kualitas);
    const blob = await (await fetch(url)).blob();
    return new File([blob], namaFile, { type: 'image/jpeg' });
  }