// src/utils/templatBaris.js
// ============================================================
// PARSER TEMPLATE BARIS "gemilang-baris@1" -- KONTRAK RESMI pihak ketiga
// pengganti dialek HTML bebas (keputusan owner 2026-10-28).
//
// KENAPA BUKAN HTML/JSON: HTML memberi AI terlalu banyak cara melenceng
// (bullet inline, LaTeX lengket, gambar dilewati); JSON memaksa escaping
// backslash ganda pada LaTeX yang justru kelas kesalahan tersering di bank
// matematika. Templat baris memakai LaTeX APA ADANYA, struktur lewat awalan
// kata kunci, dan nilai field = baris-baris berikutnya sehingga baris bullet
// & langkah pembahasan TIDAK BISA terlem.
//
// BENTUK:
//   SKEMA: gemilang-baris@1            (baris pertama; versi tak dikenal = tolak)
//   JUDUL PAKET: ...                   (opsional, tingkat paket)
//   ##SOAL 1
//   TIPE: pg_sederhana
//   MATERI: ... / KESULITAN: ... / KELAS: ... / KUNCI: A / GAMBAR: ya|tidak
//   TEKS:
//   baris bebas, LaTeX apa adanya, boleh multiline
//   OPSI:
//   - opsi satu baris (boleh LaTeX)
//   - opsi berikutnya
//   PEMBAHASAN:
//   baris bebas
//
// Keluaran parser = bentuk mentah yang SUDAH diterima normalizeSoal, jadi
// seluruh gerbang hilir (kelayakan, LaTeX, skala) berlaku tanpa duplikasi.
// Error membawa NOMOR BARIS supaya prompt koreksi ke pihak ketiga bisa
// menunjuk alamat, bukan mengeluh umum.
// ============================================================

export const SKEMA_TEMPLAT_BARIS = 'gemilang-baris@1';

const RE_SOAL = /^##\s*SOAL\s+(\d+)\s*$/i;
const RE_KUNCI_BARIS = /^(SKEMA|JUDUL PAKET|TIPE|MATERI|CAPAIAN|KESULITAN|KELAS|KUNCI|GAMBAR|TAGS|TEKS|OPSI|PEMBAHASAN|CATATAN_ADMIN)\s*:\s?(.*)$/i;
const FIELD_PETAK = {
  'TIPE': 'tipe', 'MATERI': 'materi', 'CAPAIAN': 'capaian_pembelajaran', 'KESULITAN': 'kesulitan',
  'KELAS': 'kelas', 'KUNCI': 'kunci_jawaban', 'GAMBAR': '__gambar', 'TAGS': 'tags',
  'TEKS': 'teks_soal', 'OPSI': '__opsi', 'PEMBAHASAN': 'pembahasan', 'CATATAN_ADMIN': 'catatan_admin',
};

export function looksLikeTemplatBaris(teks) {
  const t = String(teks ?? '');
  return /SKEMA\s*:\s*gemilang-baris@/i.test(t) || /^##\s*SOAL\s+\d+/im.test(t);
}

/**
 * @param {string} teks isi berkas templat
 * @returns {{skema: string|null, judul: string, soal: Array, errors: Array<{baris: number, pesan: string}>}}
 */
export function parseTemplatBaris(teks) {
  const errors = [];
  const baris = String(teks ?? '').replace(/\r\n?/g, '\n').split('\n');
  let skema = null;
  let judul = '';
  let soalKini = null;
  let fieldKini = null; // nama field internal yang sedang menampung baris nilai
  const soal = [];

  const nilaiField = (s, key, val) => {
    if (key === '__opsi') { s.__opsiBuf = s.__opsiBuf || []; s.__opsiBuf.push(val); return; }
    if (key === '__gambar') { s.butuhGambar = /^ya$/i.test(val.trim()); return; }
    if (key === 'teks_soal' || key === 'pembahasan' || key === 'catatan_admin') { s[key] = s[key] ? s[key] + '\n' + val : val; return; }
    s[key] = val;
  };

  for (let i = 0; i < baris.length; i++) {
    const no = i + 1;
    const l = baris[i];
    const t = l.trim();
    if (!t) continue;
    const mSkema = /^SKEMA\s*:\s*(\S+)\s*$/i.exec(t);
    if (mSkema) {
      skema = mSkema[1];
      if (skema !== SKEMA_TEMPLAT_BARIS) errors.push({ baris: no, pesan: `versi skema "${skema}" tidak dikenal; yang didukung ${SKEMA_TEMPLAT_BARIS}` });
      continue;
    }
    const mJudul = /^JUDUL PAKET\s*:\s?(.*)$/i.exec(t);
    if (mJudul) { judul = mJudul[1].trim(); continue; }
    const mSoal = RE_SOAL.exec(t);
    if (mSoal) {
      soalKini = { nomor: Number(mSoal[1]), __opsiBuf: [] };
      soal.push(soalKini);
      fieldKini = null;
      continue;
    }
    const mKey = RE_KUNCI_BARIS.exec(t);
    if (mKey) {
      if (!soalKini) { errors.push({ baris: no, pesan: 'baris field berada di luar blok ##SOAL' }); continue; }
      const key = FIELD_PETAK[mKey[1].toUpperCase()];
      const sisa = mKey[2].trim();
      fieldKini = key;
      if (sisa) nilaiField(soalKini, key, sisa);
      continue;
    }
    if (!soalKini) { errors.push({ baris: no, pesan: 'baris tidak dikenali sebelum ##SOAL pertama' }); continue; }
    if (fieldKini === '__opsi' || (soalKini.__opsiBuf && fieldKini === null)) {
      if (/^[-*]\s+/.test(t)) { nilaiField(soalKini, '__opsi', t.replace(/^[-*]\s+/, '')); fieldKini = '__opsi'; continue; }
      if (fieldKini === '__opsi') { // lanjutan opsi multiline: tempel ke opsi terakhir
        const buf = soalKini.__opsiBuf;
        buf[buf.length - 1] += '\n' + t;
        continue;
      }
    }
    if (fieldKini && fieldKini !== '__opsi') { nilaiField(soalKini, fieldKini, t); continue; }
    errors.push({ baris: no, pesan: 'baris isi tanpa field tujuan (field terakhir tidak dikenal)' });
  }

  const keluar = soal.map((s) => {
    const { __opsiBuf, ...rest } = s;
    const opsi = (__opsiBuf || []).map((t) => ({ teks: t }));
    return { ...rest, opsi_jawaban: opsi, gambar: [] };
  });

  keluar.forEach((q, idx) => {
    if (!String(q.teks_soal || '').trim()) errors.push({ baris: 0, pesan: `soal #${q.nomor ?? idx + 1}: field TEKS kosong` });
    if ((q.opsi_jawaban || []).length < 2 && ['pg_sederhana', 'pg_kompleks'].includes(q.tipe || 'pg_sederhana')) {
      errors.push({ baris: 0, pesan: `soal #${q.nomor ?? idx + 1}: OPSI kurang dari 2` });
    }
    if (!String(q.kunci_jawaban || '').trim()) errors.push({ baris: 0, pesan: `soal #${q.nomor ?? idx + 1}: KUNCI belum diisi` });
  });
  if (!keluar.length) errors.push({ baris: 1, pesan: 'tidak ada blok ##SOAL ditemukan' });

  return { skema, judul, soal: keluar, errors };
}

export default { SKEMA_TEMPLAT_BARIS, looksLikeTemplatBaris, parseTemplatBaris };
