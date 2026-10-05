// src/utils/kurungLatex.js
// ============================================================
// 🔥 PERBAIKAN OTOMATIS KURUNG HIMPUNAN LATEX (modul murni, teruji).
//
// LATAR: insiden Matematika Bab 7 (kurung himpunan hilang saat tayang)
// dan file HTML Master owner (2026-10-05) yang opsi jawabannya tertulis
// `{(3, 2)}` polos. Di KaTeX, `{...}` adalah GROUPING: kurungnya tidak
// dirender. Notasi himpunan WAJIB `\{ ... \}`.
//
// Fungsi ini memperbaiki teks soal/opsi/pembahasan SECARA OTOMATIS saat
// impor: '{' polos di dalam span matematika yang polanya jelas kurung
// himpunan (bukan argumen perintah seperti \text{...} / \frac{...},
// bukan argumen kedua '}{' , bukan pangkat '^{' / '_{' ) diberi
// backslash, beserta pasangannya.
//
// Idempoten: teks yang sudah benar tidak berubah. Dipakai di jalur
// JSON (bankSoalSanitizer.validateQuestion) DAN jalur HTML Master
// (ImportHasilScanPage), supaya tidak peduli AI penulisnya lupa,
// siswa tetap melihat kurung yang benar.
// ============================================================

const PERINTAH_ARG = new Set(['text', 'frac', 'dfrac', 'tfrac', 'sqrt', 'mathrm', 'mathbf',
  'mathit', 'operatorname', 'overline', 'underline', 'hat', 'bar', 'vec', 'tilde', 'widehat',
  'binom', 'cases', 'matrix', 'pmatrix', 'bmatrix', 'array', 'substack', 'boxed', 'color',
  'textcolor', 'phantom', 'big', 'Big']);

function curiga(isi, i) {
  if (isi[i] !== '{') return false;
  const prev = i > 0 ? isi[i - 1] : '';
  if (prev === '\\' || prev === '}' || prev === '^' || prev === '_') return false;
  let j = i - 1;
  while (j >= 0 && /[a-zA-Z]/.test(isi[j])) j -= 1;
  const nama = isi.slice(j + 1, i);
  if (nama && isi[j] === '\\' && PERINTAH_ARG.has(nama)) return false;
  if (nama) return false;
  return prev === '' || /[ =,(:<>+\-*/]/.test(prev);
}

function pasangan(isi, i) {
  let dalam = 0;
  for (let k = i; k < isi.length; k += 1) {
    if (isi[k] === '\\' && k + 1 < isi.length) { k += 1; continue; }
    if (isi[k] === '{') dalam += 1;
    else if (isi[k] === '}') { dalam -= 1; if (dalam === 0) return k; }
  }
  return -1;
}

function perbaikiSpan(isi) {
  const buka = [];
  for (let i = 0; i < isi.length; i += 1) if (curiga(isi, i)) buka.push(i);
  if (buka.length === 0) return isi;
  let out = '';
  let last = 0;
  for (const i of buka) {
    const t = pasangan(isi, i);
    if (t < 0) continue;
    out += isi.slice(last, i) + '\\{' + isi.slice(i + 1, t) + '\\}';
    last = t + 1;
  }
  return out + isi.slice(last);
}

/** Perbaiki semua span matematika ($...$ dan $$...$$) dalam satu teks. */
export function perbaikiKurungHimpunanLatex(teks) {
  if (typeof teks !== 'string' || !teks) return teks;
  return String(teks).replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (m, g1, g2) => {
    const isi = g1 !== undefined ? g1 : g2;
    const delim = g1 !== undefined ? '$$' : '$';
    return delim + perbaikiSpan(isi) + delim;
  });
}

export default { perbaikiKurungHimpunanLatex };
