// src/utils/kunciDuplikatSoal.js
// ============================================================
// SIDIK JARI DUPILIKAT YANG SADAR GAMBAR.
// ============================================================
//
// KENAPA BERKAS INI ADA
// Owner 2026-10-08, menunjukkan halaman Bersihkan Soal: "kadang sama itu
// pada perintah banyak soal sama pada perintah — pastikan dia gak deteksi
// hanya pada kata kunci perintah. Contoh soal infografis yang berbeda-beda
// gambarnya tapi kan pertanyaan sama."
//
// Tangkapan layarnya memperlihatkan akibatnya: grup "2 soal identik" berisi
// dua butir dengan perintah YANG MEMANG SAMA PERSIS —
//   "Berdasarkan gambar poster di atas, tentukan apakah setiap pernyataan
//    berikut Benar atau Salah!"
// — tetapi POSTER-nya berbeda. Keduanya bukan duplikat: gambar itulah
// soalnya. Detektor lama membangun kunci dari TEKS SAJA (`normalisasiTeks`
// membuang tag HTML dan semua karakter non-kata, gambar tidak ikut), jadi
// pasangan seperti ini otomatis tercentang untuk di-soft-delete. Halaman
// itu bahkan menulis "37 soal ditandai dihapus" sebelum bug ini dipahami.
//
// Prinsip berkas ini: DUA BUTIR HANYA DUPILIKAT BILA ISI YANG DILIHAT SISWA
// SAMA — perintah, gambar, pilihan/pernyataan/pasangan. Bukan karena
// kalimat perintahnya kebetulan kalimat yang populer.
//
// Arah perubahan sengaja dibuat LEBIH KETAT (lebih sedikit yang dituduh
// duplikat). Untuk operasi yang menghapus data, luput mendeteksi beberapa
// duplikat jauh lebih murah daripada menghapus soal yang sebenarnya beda.
// ============================================================

import { teksSoalDari } from './fieldButirSoal.js';

/** Panjang minimum teks sebelum sebuah butir ikut diperiksa duplikat. */
export const MIN_TEKS_DUPLIKAT = 15;

function normTeks(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kumpulkan SEMUA url gambar yang dilihat siswa dari sebuah butir:
 * gambar di badan soal (`gambarUrls`, `gambar[].url`) DAN gambar di dalam
 * pilihan jawaban (`opsiJawaban[].gambar[].url`). Diurutkan supaya dua
 * dokumen dengan urutan penyimpanan berbeda tetap menghasilkan sidik jari
 * yang sama.
 * @returns {string} sidik jari gabungan, '' bila tidak ada gambar
 */
export function sidikJariGambar(soal) {
  const url = [];
  const dorong = (v) => {
    const s = String(v || '').trim();
    if (s) url.push(s);
  };
  (Array.isArray(soal?.gambarUrls) ? soal.gambarUrls : []).forEach(dorong);
  (Array.isArray(soal?.gambar) ? soal.gambar : []).forEach((g) => {
    if (typeof g === 'string') dorong(g);
    else dorong(g?.url || g?.uploadedUrl);
  });
  (Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : []).forEach((o) => {
    if (o && typeof o === 'object' && Array.isArray(o.gambar)) {
      o.gambar.forEach((g) => dorong(typeof g === 'string' ? g : g?.url || g?.uploadedUrl));
    }
  });
  return [...new Set(url)].sort().join(' ');
}

/**
 * Isi butir per tipe, dinormalkan — supaya dua butir yang perintahnya sama
// tetapi pernyataan/pilihan/pasangannya beda TIDAK dianggap kembar.
 */
function sidikJariIsi(soal) {
  const bagian = [];
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  if (opsi.length) bagian.push(opsi.map((o) => normTeks(typeof o === 'string' ? o : o?.teks)).join(' | '));
  const pernyataan = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
  if (pernyataan.length) bagian.push(pernyataan.map((p) => normTeks(typeof p === 'string' ? p : p?.teks)).join(' | '));
  const tabel = Array.isArray(soal?.tabelBenarSalah) ? soal.tabelBenarSalah : [];
  if (tabel.length) bagian.push(tabel.map((b) => `${normTeks(b?.pernyataan)}=${normTeks(b?.kunci)}`).join(' | '));
  const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
  if (pasangan.length) bagian.push(pasangan.map((p) => `${normTeks(p?.kiri)}>${normTeks(p?.kanan)}`).join(' | '));
  return bagian.join(' # ');
}

/**
 * Kunci pengelompokan duplikat.
 * @returns {string|null} null berarti butir ini TIDAK ikut diperiksa
 *   (teks terlalu pendek — menuduh berdasarkan 14 karakter terlalu berisiko)
 */
/**
 * Untuk PENGELOMPOKAN di halaman pembersih kunci jawaban TIDAK ikut: dua butir
 * kembar yang salah satunya salah ketik kunci tetap duplikat yang harus
 * disatukan (yang salah dibuang). Untuk PERINGATAN DI HULU dipakai
 * kunciDuplikatKetat + kunciKembarTanpaKunci, supaya perbedaan jawaban justru
 * terlihat, bukan ditelan.
 */
export function kunciDuplikat(soal) {
  return kunciKembarTanpaKunci(soal);
}

/**
 * Sidik jari kunci jawaban, dinormalkan.
 * Huruf besar/kecil dan spasi disamakan; array diurutkan supaya ["A","C"]
 * dan ["C","A"] dianggap sama.
 */
export function sidikJariKunci(soal) {
  const k = soal?.kunciJawaban;
  if (Array.isArray(k)) return [...k].map((x) => normTeks(x)).sort().join(',');
  return normTeks(k);
}

/**
 * TIGA TINGKAT KEMIRIPAN.
 * Owner 2026-10-08: "detektor duplikat harusnya ada di awal saat scan soal,
 * pastikan dilihat dari jawaban kan juga kadang jawaban beda". Maka keputusan
 * duplikat dibuat BERJENJANG, bukan biner:
 *
 *   kunciDuplikatKetat()     teks + gambar + isi + KUNCI
 *                            sama semua  -> DUPLIKAT PERSIS
 *   kunciKembarTanpaKunci()  teks + gambar + isi, kunci TIDAK ikut
 *                            sama di sini tapi beda di tingkat atas
 *                            -> KEMBAR BEDA KUNCI: JANGAN dihapus; salah satu
 *                               hampir pasti salah kunci. Periksa manusia.
 *   kunciTeksSaja()          teks perintah saja
 *                            sama di sini tapi beda di tingkat tengah
 *                            -> BEDA GAMBAR/ISI: BUKAN duplikat dan TIDAK BOLEH
 *                               diperingatkan (inilah kasus poster-kembar).
 */
export function kunciKembarTanpaKunci(soal) {
  const teks = normTeks(teksSoalDari(soal));
  if (teks.length < MIN_TEKS_DUPLIKAT) return null;
  return [
    String(soal?.mataPelajaran || soal?.mapel || '').trim(),
    String(soal?.jenjang || '').trim(),
    String(soal?.tingkatKelas || soal?.kelas || '').trim(),
    teks,
    sidikJariGambar(soal),
    sidikJariIsi(soal),
  ].join('|||');
}

export function kunciTeksSaja(soal) {
  const teks = normTeks(teksSoalDari(soal));
  if (teks.length < MIN_TEKS_DUPLIKAT) return null;
  return [
    String(soal?.mataPelajaran || soal?.mapel || '').trim(),
    String(soal?.jenjang || '').trim(),
    String(soal?.tingkatKelas || soal?.kelas || '').trim(),
    teks,
  ].join('|||');
}

/** Kunci duplikat ketat: ikut menghitung kunci jawaban. */
export function kunciDuplikatKetat(soal) {
  const tengah = kunciKembarTanpaKunci(soal);
  if (!tengah) return null;
  return `${tengah}|||k=${sidikJariKunci(soal)}`;
}

/**
 * Bandingkan daftar baru terhadap bank yang sudah ada DAN sesama batch.
 * Dipakai di HULU (saat scan/impor) supaya soal beranak dicegah sebelum
 * masuk, bukan dibersihkan sesudah masuk.
 *
 * @param {Array} daftarBaru butir yang akan disimpan
 * @param {Array} [bank] butir yang sudah ada di bank_soal
 * @returns {{duplikatPersis:Array, kembarBedaKunci:Array, teksSamaGambarBeda:number}}
 */
export function bandingkanDuplikat(daftarBaru, bank = []) {
  const bankKetat = new Map();
  const bankTengah = new Map();
  const bankTeks = new Set();
  for (const b of Array.isArray(bank) ? bank : []) {
    const k1 = kunciDuplikatKetat(b);
    if (k1 && !bankKetat.has(k1)) bankKetat.set(k1, b);
    const k2 = kunciKembarTanpaKunci(b);
    if (k2 && !bankTengah.has(k2)) bankTengah.set(k2, b);
    const k3 = kunciTeksSaja(b);
    if (k3) bankTeks.add(k3);
  }

  const duplikatPersis = [];
  const kembarBedaKunci = [];
  let teksSamaGambarBeda = 0;
  const batchKetat = new Map();
  const batchTengah = new Map();
  const batchTeks = new Set();

  const potong = (s) => normTeks(teksSoalDari(s)).slice(0, 70);

  for (const q of Array.isArray(daftarBaru) ? daftarBaru : []) {
    const k1 = kunciDuplikatKetat(q);
    const k2 = kunciKembarTanpaKunci(q);
    const k3 = kunciTeksSaja(q);
    if (!k1 || !k2 || !k3) continue;

    const lawanBank = bankKetat.get(k1);
    const lawanBatch = batchKetat.get(k1);
    if (lawanBank || lawanBatch) {
      duplikatPersis.push({ baru: q, lawan: lawanBank || lawanBatch, sumber: lawanBank ? 'bank' : 'batch', pratinjau: potong(q) });
    } else if (bankTengah.has(k2) || batchTengah.has(k2)) {
      kembarBedaKunci.push({ baru: q, lawan: bankTengah.get(k2) || batchTengah.get(k2), sumber: bankTengah.has(k2) ? 'bank' : 'batch', pratinjau: potong(q) });
    } else if (bankTeks.has(k3) || batchTeks.has(k3)) {
      // Perintah sama tetapi gambar/isi beda: BUKAN duplikat. Dihitung supaya
      // halaman bisa mengaku jujur "ini sengaja tidak diperingatkan".
      teksSamaGambarBeda += 1;
    }

    if (!batchKetat.has(k1)) batchKetat.set(k1, q);
    if (!batchTengah.has(k2)) batchTengah.set(k2, q);
    batchTeks.add(k3);
  }

  return { duplikatPersis, kembarBedaKunci, teksSamaGambarBeda };
}

/**
 * Bandingkan dua butir: apa yang SAMA dan apa yang BEDA, dalam frasa pendek
 * yang bisa langsung dibaca admin.
 *
 * Owner 2026-10-08: "bisa gak itu aku baca soal full biar tahu". Membaca
 * penuh saja belum cukup cepat bila perbedaannya harus dicari mata sendiri
 * di dua kartu; maka perbedaan utamanya disebut lebih dulu.
 *
 * @returns {{sama:string[], beda:string[]}}
 */
export function bandingkanDuaButir(a, b) {
  const sama = [];
  const beda = [];
  const cek = (label, va, vb) => {
    if (va === vb) { if (va) sama.push(label); }
    else beda.push(label);
  };
  cek('teks perintah', normTeks(teksSoalDari(a)), normTeks(teksSoalDari(b)));
  const ga = sidikJariGambar(a);
  const gb = sidikJariGambar(b);
  if (ga === gb) { if (ga) sama.push(`gambar (${ga.split(' ').length})`); }
  else if (!ga && !gb) { /* keduanya tanpa gambar: bukan pembeda */ }
  else if (!ga || !gb) beda.push('hanya satu yang punya gambar');
  else beda.push(`gambar berbeda (${ga.split(' ').length} vs ${gb.split(' ').length})`);
  cek('pilihan/pernyataan', sidikJariIsi(a), sidikJariIsi(b));
  cek('kunci jawaban', sidikJariKunci(a), sidikJariKunci(b));
  cek('mapel', String(a?.mataPelajaran || a?.mapel || ''), String(b?.mataPelajaran || b?.mapel || ''));
  cek('materi', String(a?.materi || a?.bab || ''), String(b?.materi || b?.bab || ''));
  return { sama, beda };
}

/**
 * Penjelasan manusiawi kenapa dua butir masuk grup yang sama — ditampilkan
 * di halaman supaya admin tidak diminta mempercayai mesin begitu saja.
 */
export function alasanDuplikat(soal) {
  const gambar = sidikJariGambar(soal);
  return gambar
    ? `teks sama DAN ${gambar.split(' ').length} gambar sama`
    : 'teks sama dan tidak ada gambar di keduanya';
}

export default {
  MIN_TEKS_DUPLIKAT, sidikJariGambar, sidikJariIsi, sidikJariKunci,
  kunciDuplikat, kunciDuplikatKetat, kunciKembarTanpaKunci, kunciTeksSaja,
  bandingkanDuplikat, bandingkanDuaButir, alasanDuplikat,
};
