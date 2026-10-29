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
//   GRUP-BACAAN: bacaan_1              (opsional; sama untuk semua soal segolongan)
//   BACAAN:                            (opsional; baris-baris berikutnya = teks wacana)
//   teks wacana bersama, boleh multiline, LaTeX apa adanya
//   TEKS:
//   baris bebas, LaTeX apa adanya, boleh multiline
//   OPSI:
//   - opsi satu baris (boleh LaTeX)
//   - opsi berikutnya
//   PERNYATAAN:                          (opsional; wajib makna utk benar_salah/pg_kategori)
//   - pernyataan satu baris (boleh multiline lewat baris menjorok)
//   PEMBAHASAN:
//   baris bebas
//
// 🔥 2026-10-29 (insiden Kimia TKA 30 soal owner): field PERNYATAAN ditambah
// karena kontrak lama mengakui tipe benar_salah/pg_kategori tapi tidak punya
// cara menuliskan pernyataannya -- penolakan jadi jalan buntu. Berkas lama yang
// menulis pernyataan di OPSI tetap diterima: baris OPSI dipindah jadi
// pernyataan + peringatan lunak (lihat blok fallback di bawah). Parser TIDAK
// pernah membuang/menambal isi field lain (mis. baris sitiran "[x.pdf — ...]"):
// penambalan siluman pihak ketiga dilarang; penolakan tetap wewenang gerbang
// hilir supaya yang memperbaiki adalah SUMBERNYA.
//
// 🔥 2026-10-29 (audit owner: PDF TO B.Inggris — satu wacana tercetak 5×):
// field BACAAN/GRUP-BACAAN membuat kontrak resmi bisa mengungkapkan
// "satu bacaan dipakai beberapa soal". Aturannya sama dengan kontrak HTML:
// salin wacana UTUH ke BACAAN: di SETIAP soal segolongan dengan
// GRUP-BACAAN: yang identik, dan TEKS: cukup pertanyaannya saja. Bila
// pihak ketiga menulis wacana lengkap hanya di soal pertama, soal berikutnya
// boleh menulis GRUP-BACAAN: saja (tanpa BACAAN:) — importer otomatis
// mengisi ulang dari master grup (isiUlangBacaanSegrup).
//
// Keluaran parser = bentuk mentah yang SUDAH diterima normalizeSoal, jadi
// seluruh gerbang hilir (kelayakan, LaTeX, skala) berlaku tanpa duplikasi.
// Error membawa NOMOR BARIS supaya prompt koreksi ke pihak ketiga bisa
// menunjuk alamat, bukan mengeluh umum.
// ============================================================

export const SKEMA_TEMPLAT_BARIS = 'gemilang-baris@1';

const RE_SOAL = /^##\s*SOAL\s+(\d+)\s*$/i;
const RE_KUNCI_BARIS = /^(SKEMA|JUDUL PAKET|TIPE|MATERI|CAPAIAN|KESULITAN|KELAS|KUNCI|GAMBAR|TAGS|TEKS|OPSI|PEMBAHASAN|CATATAN_ADMIN|GRUP-BACAAN|BACAAN|PERNYATAAN)\s*:\s?(.*)$/i;
const FIELD_PETAK = {
  'TIPE': 'tipe', 'MATERI': 'materi', 'CAPAIAN': 'capaian_pembelajaran', 'KESULITAN': 'kesulitan',
  'KELAS': 'kelas', 'KUNCI': 'kunci_jawaban', 'GAMBAR': '__gambar', 'TAGS': 'tags',
  'TEKS': 'teks_soal', 'OPSI': '__opsi', 'PEMBAHASAN': 'pembahasan', 'CATATAN_ADMIN': 'catatan_admin',
  'GRUP-BACAAN': '__grupBacaan', 'BACAAN': '__bacaan', 'PERNYATAAN': '__pernyataan',
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
    if (key === '__pernyataan') { s.__pernyataanBuf = s.__pernyataanBuf || []; s.__pernyataanBuf.push(val); return; }
    if (key === '__gambar') { s.butuhGambar = /^ya$/i.test(val.trim()); return; }
    if (key === '__bacaan') { s.__bacaanBuf = s.__bacaanBuf ? s.__bacaanBuf + '\n' + val : val; return; }
    if (key === '__grupBacaan') { s.__grupBacaan = val.trim(); return; }
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
    if (fieldKini === '__opsi' || fieldKini === '__pernyataan' || (soalKini.__opsiBuf && fieldKini === null)) {
      if (/^[-*]\s+/.test(t)) {
        const bufKey = fieldKini === '__pernyataan' ? '__pernyataan' : '__opsi';
        nilaiField(soalKini, bufKey, t.replace(/^[-*]\s+/, ''));
        fieldKini = bufKey;
        continue;
      }
      if (fieldKini === '__opsi') { // lanjutan opsi multiline: tempel ke opsi terakhir
        const buf = soalKini.__opsiBuf;
        buf[buf.length - 1] += '\n' + t;
        continue;
      }
      if (fieldKini === '__pernyataan') { // lanjutan pernyataan multiline: tempel ke pernyataan terakhir
        const buf = soalKini.__pernyataanBuf;
        buf[buf.length - 1] += '\n' + t;
        continue;
      }
    }
    if (fieldKini && fieldKini !== '__opsi') { nilaiField(soalKini, fieldKini, t); continue; }
    errors.push({ baris: no, pesan: 'baris isi tanpa field tujuan (field terakhir tidak dikenal)' });
  }

  const warnings = [];
  const keluar = soal.map((s) => {
    const { __opsiBuf, __bacaanBuf, __grupBacaan, __pernyataanBuf, ...rest } = s;
    let opsi = (__opsiBuf || []).map((t) => ({ teks: t }));
    let pernyataan = (__pernyataanBuf || []).map((t) => ({ teks: t, jawaban: '' }));
    const tipe = String(s.tipe || 'pg_sederhana');
    // 🔥 2026-10-29 (insiden Kimia TKA 30 soal owner, keputusan owner:
    // "kalau sistem Gemilang yang salah, perbaiki"): kontrak lama MENGAKUI
    // tipe benar_salah/pg_kategori tapi TIDAK menyediakan field PERNYATAAN --
    // pihak ketiga yang tunduk pun tidak punya cara mengungkapkan pernyataannya
    // dan semua butir tipe itu tertolak "Pernyataan belum ditemukan" (jalan
    // buntu: yang diminta tidak bisa ditulis). Sekarang field PERNYATAAN ada;
    // berkas LAMA yang telanjur menulis pernyataan di OPSI (pilihan paling
    // wajar) tidak dibuang: baris OPSI DIPINDAH jadi pernyataan (opsi
    // dikosongkan) dan jawaban per baris dipulihkan hilir oleh
    // pulihkanJawabanDariKunciGabungan dari KUNCI gabungan (mis. "S,B,S").
    // Transparan: diperingatkan lunak, tidak senyap.
    if (!pernyataan.length && ['benar_salah', 'pg_kategori'].includes(tipe) && opsi.length >= 2) {
      pernyataan = opsi.map((o) => ({ teks: o.teks, jawaban: '' }));
      const jumlah = opsi.length;
      opsi = [];
      warnings.push({
        nomor: s.nomor,
        pesan: `tipe ${tipe} tanpa field PERNYATAAN: ${jumlah} baris OPSI dipakai sebagai pernyataan `
          + '(jawaban per baris dipulihkan dari urutan KUNCI gabungan). Kontrak sekarang punya field '
          + 'PERNYATAAN: -- pakai itu pada kiriman berikutnya.',
      });
    }
    const teksBacaan = String(__bacaanBuf || '').trim();
    const grup = String(__grupBacaan || '').trim();
    // Bentuk objek bacaan yang SUDAH dimengerti normalizeSoal (teks/gambar/
    // grup). GRUP-BACAAN tanpa BACAAN tetap dibawa (teks kosong) supaya
    // isiUlangBacaanSegrup di halaman impor bisa mengisi dari master grup.
    const bacaan = (teksBacaan || grup) ? { teks: teksBacaan, gambar: [], grup } : null;
    return {
      ...rest,
      opsi_jawaban: opsi,
      ...(pernyataan.length ? { pernyataan } : {}),
      gambar: [],
      bacaan,
    };
  });

  keluar.forEach((q, idx) => {
    if (!String(q.teks_soal || '').trim()) errors.push({ baris: 0, pesan: `soal #${q.nomor ?? idx + 1}: field TEKS kosong` });
    if ((q.opsi_jawaban || []).length < 2 && ['pg_sederhana', 'pg_kompleks'].includes(q.tipe || 'pg_sederhana')) {
      errors.push({ baris: 0, pesan: `soal #${q.nomor ?? idx + 1}: OPSI kurang dari 2` });
    }
    if (!String(q.kunci_jawaban || '').trim()) errors.push({ baris: 0, pesan: `soal #${q.nomor ?? idx + 1}: KUNCI belum diisi` });
  });
  if (!keluar.length) errors.push({ baris: 1, pesan: 'tidak ada blok ##SOAL ditemukan' });

  return { skema, judul, soal: keluar, errors, warnings };
}

export default { SKEMA_TEMPLAT_BARIS, looksLikeTemplatBaris, parseTemplatBaris };
