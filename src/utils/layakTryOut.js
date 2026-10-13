// src/utils/layakTryOut.js
// ============================================================
// GERBANG KELAYAKAN BUTIR UNTUK TRY OUT OTOMATIS.
//
// KENAPA DIPISAH dari mesinTryOutOtomatis.js: berkas mesin itu mengimpor
// Firebase di tingkat modul, sehingga tidak bisa diimpor oleh test node
// polos. Predikat ini murni dan dipakai mesin di KEDUA jalur pengambilan
// soal (pool utama & jalur extra).
//
// KENAPA ADA (bug nyata 2026-10-12): jalur `extra` -- dipakai tiap kali
// pool utama kurang, persis kasus mapel miskin seperti TKA SMP Fisika yang
// stoknya 1 butir -- TIDAK menyaring status, sehingga butir terhapus/
// nonaktif bisa tercebur ke draf try out. Selain status, dua hal lain
// yang membuat soal TIDAK bisa dijawab siswa juga ditahan: tanpa kunci,
// dan gambar yang masih menunggu potongan.
//
// KENAPA PAGAR TIPE IKUT DI SINI (insiden draf Sabtu 17 Okt 2026): draf mesin
// lolos audit berisi 6 butir "menjodohkan" -- tipe yang MEMANG belum punya
// renderer di layar siswa (TryOutView.jsx) sehingga jatuh ke renderer PG
// dengan opsi kosong: siswa tak bisa menjawab & skor tak berarti. Pagar tipe
// sebelumnya hanya menjaga keranjang tentor (keranjangTryOut.js), sedangkan
// mesin try out otomatis TIDAK berkonsultasi kepadanya. Kini kedua jalur
// memakai satu pagar yang sama: tipe tanpa renderer = tidak layak try out.
//
// MURNI & TERUJI (tests/layakTryOut.test.mjs).
// ============================================================

import { tipeDidukung } from './keranjangTryOut.js';
import { soalBisaDinilai } from './skorSoalTryOut.js';

/**
 * @param {object} s butir bank_soal
 * @returns {boolean}
 */
export function layakUntukTryOut(s = {}) {
  const status = String(s.status ?? 'aktif').toLowerCase();
  if (status !== 'aktif') return false;
  const tipe = String(s.tipe || 'pg_sederhana');
  // 🔒 PAGAR TIPE: butir yang tipenya tak bisa dirender layar siswa DITOLAK
  // (menjodohkan dst) -- sama persis dengan pagar keranjang tentor.
  if (!tipeDidukung(s)) return false;
  const k = s.kunciJawaban;
  // esai sah tanpa kunci huruf: rubrik penilaiannya hidup di pembahasan.
  const berkunci = tipe === 'esai'
    ? true
    : (Array.isArray(k) ? k.length > 0 : String(k ?? '').trim().length > 0);
  if (!berkunci) return false;
  // 🛡️ AUDIT 2026-10-13 (paket Sabtu): kunci "ADA" belum cukup -- kunci
  // harus BISA DINILAI. 4 butir pg_sederhana ber-kunci ganda ("A,D",
  // sisa impor yang seharusnya pg_kompleks) lolos pagar lama, masuk paket
  // terbit, dan membuat skor maksimal siswa terpangkas (jawaban apa pun =
  // 0). Satu sumber kebenaran dengan skoring: soalBisaDinilai().
  if (tipe !== 'esai' && tipe !== 'uraian' && !soalBisaDinilai(s)) return false;
  if ((s.potonganTertunda || []).length > 0) return false;
  return true;
}

/**
 * Saringan KELAS untuk pengambilan soal mesin try out.
 * 🔥 BARU (2026-10-13): sebelumnya filter kelas hanya dipakai di pool utama;
 * jalur cadangan (saat pool kurang) TIDAK menyaring kelas maupun kelayakan,
 * sehingga butir kelas 7/8 bocor ke paket kelas 9 (terbukti pada audit draf
 * "UJI TKA SMP": 7:7, 8:10, 9:43). Kini satu fungsi dipakai kedua jalur.
 * Butir TANPA field kelas tetap lolos bila jenjangnya cocok (stok lama
 * banyak yang tidak berkkelas) -- tetapi dilaporkan dasbor sebagai '?'.
 */
export function cocokKelasBank(s = {}, kelas = null) {
  const k = String(kelas ?? '').trim();
  if (!k) return true;
  const sk = String(s.kelas ?? s.tingkatKelas ?? '').trim();
  if (!sk) return true;
  return sk === k || sk.includes(k) || k.includes(sk);
}

export default { layakUntukTryOut, cocokKelasBank };
