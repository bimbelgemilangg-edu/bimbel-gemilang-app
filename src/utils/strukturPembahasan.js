// src/utils/strukturPembahasan.js
// ============================================================
// Pembaca struktur pembahasan & kode sumber soal, supaya tampilan siswa,
// kartu tentor, dan naskah cetak bisa menyerupai BUKU sumber:
//   - kode sumber ("SNMPTN 2010/TPA/942/17") jadi kepala, bukan baris biasa
//   - baris premis & logika ("Semua A, B", "p>q", "Premis 1 : p>q") jadi blok
//   - "Kesimpulan : ..." mendapat garis seperti di buku
//   - "Jawaban E" jadi penutup tebal
//
// 🔥 TIDAK MENGARANG. Parser hanya MENGELUMPOKKAN baris yang polanya pasti.
// Baris yang tidak dikenali tetap jadi paragraf biasa -- tidak dipaksa masuk
// kategori. Highlight kuning/biru seperti di buku TIDAK dipulihkan dari OCR
// (informasinya hilang di sumber); sebaliknya didukung markup eksplisit
// ==teks== atau <mark> bila tentor menandainya sendiri lewat editor.
// ============================================================

export const RE_KODE_SUMBER = /\[?\s*(SNMPTN|SBMPTN|UTBK|SIMAK|UMBN)\s*\d{4}(?:\s*\/\s*[\w.-]+(?:\s+[A-Z0-9]{1,3}(?![A-Za-z0-9]))?)*\s*\]?/i;

/**
 * Pisahkan kode sumber di AWAL teks soal/pembahasan.
 * @returns {{kode: string|null, teks: string}}
 */
export function pisahKodeSumber(teks) {
  const t = String(teks ?? '');
  const m = t.match(RE_KODE_SUMBER);
  // Kode hanya diakui sebagai KEPALA bila muncul di awal teks; kode yang
  // muncul di tengah kalimat hampir pasti bagian dari kalimat, bukan label.
  if (!m || m.index > 40) return { kode: null, teks: t };
  const kode = m[0].replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
  const sisa = (t.slice(0, m.index) + t.slice(m.index + m[0].length))
    .replace(/^[\s:>,.-]+/, '')
    .trim();
  return { kode, teks: sisa };
}

// Pemisah WAJIB antara kata "jawaban" dan hurufnya (titik/koma/spasi).
// Tanpa ini, baris rusak OCR "Jawaba" (huruf terakhir hilang) akan terbaca
// sebagai jawaban A -- mengklaim huruf yang tidak ada di sumber.
const RE_JAWABAN = /^\s*(?:\d+\s*)?(?:jawaban|jawab)(?:\s*[:.]\s*|\s+)([A-E])\s*$/i;
const RE_KESIMPULAN = /^\s*kesimpulan\s*:/i;
const RE_PREMIS = /^\s*premis\s*(?:\d+|i+v?|i+)\s*:/i;
const RE_LOGIKA_SIMBOL = /^\s*~?\s*[pqrs]\s*[>→7\-o]+\s*~?\s*[\w,()]+/i;
const RE_LOGIKA_KUANTOR = /^\s*(semua|sebagian|beberapa)\s+[A-Z]\s*(,\s*(~?\s*[A-Z]|bukan\s+[A-Z])[.,]?)?\s*$/i;
const RE_LOGIKA_PENDEK = /^\s*(p|q|r|s|pq|qr|pr|por|pqr)\s*$/i;

/**
 * @param {string} teks pembahasan mentah
 * @returns {Array<{jenis: string, baris?: string[], teks?: string, huruf?: string, highlight?: boolean}>}
 */
export function strukturPembahasan(teks) {
  const blok = [];
  const baris = String(teks ?? '').split(/\n/);
  let logikaBuffer = [];

  const flushLogika = () => {
    if (logikaBuffer.length) {
      blok.push({ jenis: 'logika', baris: [...logikaBuffer] });
      logikaBuffer = [];
    }
  };

  for (const mentah of baris) {
    const b = mentah.trim();
    if (!b) { flushLogika(); continue; }

    if (RE_KODE_SUMBER.test(b) && b.length < 60) { flushLogika(); blok.push({ jenis: 'kode', teks: b.replace(/[[\]]/g, '') }); continue; }
    const j = b.match(RE_JAWABAN);
    if (j) { flushLogika(); blok.push({ jenis: 'jawaban', huruf: j[1].toUpperCase() }); continue; }
    if (RE_KESIMPULAN.test(b)) { flushLogika(); blok.push({ jenis: 'kesimpulan', teks: b }); continue; }
    if (RE_PREMIS.test(b) || RE_LOGIKA_SIMBOL.test(b) || RE_LOGIKA_KUANTOR.test(b) || RE_LOGIKA_PENDEK.test(b)) {
      logikaBuffer.push(b);
      continue;
    }
    flushLogika();
    blok.push({ jenis: 'teks', teks: b });
  }
  flushLogika();
  return blok;
}

/**
 * Terapkan highlight eksplisit: ==teks== atau <mark>teks</mark> jadi penanda
 * yang renderer bisa warnai. Dipisah supaya renderer React dan renderer
 * cetak memakai aturan yang sama.
 * @returns {Array<{teks: string, highlight: boolean}>}
 */
export function pecahHighlight(teks) {
  const bagian = [];
  const re = /==([^=]+)==|<mark>(.*?)<\/mark>/gi;
  let terakhir = 0;
  let m;
  while ((m = re.exec(String(teks ?? '')))) {
    if (m.index > terakhir) bagian.push({ teks: String(teks).slice(terakhir, m.index), highlight: false });
    bagian.push({ teks: m[1] ?? m[2], highlight: true });
    terakhir = m.index + m[0].length;
  }
  if (terakhir < String(teks ?? '').length) bagian.push({ teks: String(teks).slice(terakhir), highlight: false });
  return bagian.length ? bagian : [{ teks: String(teks ?? ''), highlight: false }];
}

export default { RE_KODE_SUMBER, pisahKodeSumber, strukturPembahasan, pecahHighlight };
