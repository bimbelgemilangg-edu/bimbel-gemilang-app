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
const RE_PREMIS = /^\s*premis\s*(?:\d+|i+v?|i+)?\s*:/i;
const RE_LOGIKA_SIMBOL = /^\s*~?\s*[pqrs]\s*[>→7\-o]+\s*~?\s*[\w,()]+/i;
// 🔥 2026-10-10: aturan lama hanya menerima SATU huruf di tiap sisi
// ("Semua A, B"), padahal buku sumber owner menulis bentuk nyata seperti
//   "Kesimpulan : Sebagian A, B dan Bukan C"   (bab 1 soal 1 & 6)
//   "Kesimpulan : Semua A yang C, B"           (bab 1 soal 10 & 19)
//   "Kesimpulan : Sebagian yang C, bukan A"    (bab 1 soal 22)
//   "Premis 1: Semua A,B" / "beberapa B,C"     (bab 1 soal 46, tanpa spasi)
// Baris yang tidak dikenali jatuh jadi paragraf biasa, jadi blok logika di
// preview/cetak tidak pernah mirip buku -- keluhan owner "tampilan gak sama
// dengan pdf pembahasan".
const RE_TOKEN_SIMBOL = String.raw`(?:yang\s+)?(?:bukan\s+)?[A-Z](?:\s*(?:,|\bdan\b)\s*(?:yang\s+)?(?:bukan\s+)?[A-Z])*`;
const RE_LOGIKA_KUANTOR = new RegExp(String.raw`^\s*(?:semua|sebagian|beberapa|seluruh)\s+` + RE_TOKEN_SIMBOL + String.raw`\s*[.,:]?\s*$`, 'i');
const RE_LOGIKA_PENDEK = /^\s*(p|q|r|s|pq|qr|pr|por|pqr)\s*$/i;

// 🔥 BARU (2026-10-11, sampel owner "02 Silogisme" vs PDF halaman 9):
// buku mencetak tumpukan silogisme dengan panah asli:
//     p → q
//     q → r
//     —————
//     p → r
// tetapi OCR/AI pihak ketiga merusaknya jadi "p-q", "q7rT", "por", "pq"
// (panah terbaca sebagai -, 7, o, atau hilang). Klasifikasi blok logika
// sudah benar sejak lama; yang tampil membingungkan guru adalah ISI
// barisnya. Karena itu baris logika DIPULIHKAN ke bentuk kanonik
// "X → Y" sebelum dirender — hanya baris yang SELURUH isinya cocok pola
// implikasi satu huruf, tidak pernah baris berprefiks "Premis 1 :" atau
// kuantor ("Semua A, B") yang memang sudah terbaca.
const RE_IMPLIKASI_RUSAK = /^\s*(~?)\s*([pqrs])\s*(?:->|[-–>7o])\s*(~?)\s*([pqrs])\s*[A-Z]?\s*$/i;
const RE_IMPLIKASI_TIGA_HURUF = /^\s*(~?)\s*([pqrs])\s*[o7]\s*(~?)\s*([pqrs])\s*$/i;
const RE_IMPLIKASI_TEMPEL = /^\s*(~?)\s*([pqrs])\s*(~?)\s*([pqrs])\s*$/i;
const RE_IMPLIKASI_BERSIH = /^~?[pqrs]\s*→\s*~?[pqrs]$/;
const GARIS_INFERENSI = '—————';

/**
 * Pulihkan baris blok logika ke bentuk kanonik buku.
 * @param {string[]} baris baris mentah satu blok logika
 * @returns {string[]} baris siap render (panah utuh + garis inferensi)
 */
export function rapikanBarisLogika(baris) {
  const rapikan = (b) => {
    let m = RE_IMPLIKASI_RUSAK.exec(b) || RE_IMPLIKASI_TIGA_HURUF.exec(b);
    if (!m && RE_IMPLIKASI_TEMPEL.test(b)) m = RE_IMPLIKASI_TEMPEL.exec(b);
    if (!m) return b;
    const [, n1, a, n2, c] = m;
    return `${n1}${a} → ${n2}${c}`;
  };
  const keluar = (Array.isArray(baris) ? baris : []).map(rapikan);
  // Tumpukan implikasi murni (premis-premis-kesimpulan) mendapat garis
  // inferensi sebelum baris terakhir, persis seperti buku mencetaknya.
  if (keluar.length >= 3 && keluar.every((b) => RE_IMPLIKASI_BERSIH.test(b))) {
    keluar.splice(keluar.length - 1, 0, GARIS_INFERENSI);
  }
  return keluar;
}
// Penanda ala buku di margin ("PU: ...", "PK: ...", "K: ...", "Rumus :").
// Hanya diakui bila PENDEK; bila diikuti prosa panjang ia kalimat biasa.
const RE_PENANDA_BUKU = /^\s*(?:PU|PK|K|Rumus)\s*:/i;
const BATAS_PENANDA_BUKU = 40;

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
      // baris dipulihkan dulu (panah OCR rusak -> bentuk kanonik buku)
      blok.push({ jenis: 'logika', baris: rapikanBarisLogika(logikaBuffer) });
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
    if (
      RE_PREMIS.test(b)
      || RE_LOGIKA_SIMBOL.test(b)
      || RE_LOGIKA_KUANTOR.test(b)
      || RE_LOGIKA_PENDEK.test(b)
      || (RE_PENANDA_BUKU.test(b) && b.length <= BATAS_PENANDA_BUKU)
    ) {
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

export default { RE_KODE_SUMBER, pisahKodeSumber, strukturPembahasan, pecahHighlight, rapikanBarisLogika, GARIS_INFERENSI };
