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
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sidik jari wacana / stimulus / bacaan
 */
export function sidikJariBacaan(soal) {
  const b = soal?.bacaan || soal?.stimulus || soal?.wacana;
  if (!b) return '';
  if (typeof b === 'string') return normTeks(b);
  const teks = normTeks(b.teks || b.text || b.content || '');
  const gbr = Array.isArray(b.gambar)
    ? b.gambar.map(g => (typeof g === 'string' ? g : g?.url || g?.uploadedUrl || g?.dataUrl?.slice(0, 80) || '')).filter(Boolean).sort().join(',')
    : '';
  return `${teks}#gbr:${gbr}`;
}

/**
 * Kumpulkan SEMUA url & data gambar yang dilihat siswa dari sebuah butir:
 * gambar di badan soal (`gambarUrls`, `gambar`), gambar wacana/bacaan,
 * DAN gambar di dalam pilihan jawaban (`opsiJawaban[].gambar`).
 * Mendukung string URL, objek `{url, uploadedUrl}`, maupun `dataUrl` base64.
 * @returns {string} sidik jari gabungan, '' bila tidak ada gambar
 */
export function sidikJariGambar(soal) {
  const url = [];
  const dorong = (v) => {
    if (!v) return;
    if (typeof v === 'string') {
      const s = v.trim();
      if (s.startsWith('data:image')) {
        url.push(`b64:${s.length}:${s.slice(0, 45)}:${s.slice(-30)}`);
      } else if (s) {
        url.push(s);
      }
    } else if (typeof v === 'object') {
      if (v.uploadedUrl) url.push(v.uploadedUrl);
      else if (v.url) url.push(v.url);
      else if (v.dataUrl) {
        const s = String(v.dataUrl).trim();
        url.push(`b64:${s.length}:${s.slice(0, 45)}:${s.slice(-30)}`);
      }
    }
  };

  (Array.isArray(soal?.gambarUrls) ? soal.gambarUrls : []).forEach(dorong);
  (Array.isArray(soal?.gambar) ? soal.gambar : []).forEach(dorong);

  // Gambar di wacana / bacaan
  const b = soal?.bacaan || soal?.stimulus || soal?.wacana;
  if (b && typeof b === 'object' && Array.isArray(b.gambar)) {
    b.gambar.forEach(dorong);
  }

  // Gambar di pilihan jawaban
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban
    : Array.isArray(soal?.opsi_jawaban) ? soal.opsi_jawaban
    : Array.isArray(soal?.options) ? soal.options : [];
  opsi.forEach((o) => {
    if (o && typeof o === 'object') {
      if (Array.isArray(o.gambar)) o.gambar.forEach(dorong);
      if (o.url || o.dataUrl) dorong(o);
    }
  });

  return [...new Set(url)].sort().join(' ');
}

/**
 * Isi butir per tipe, dinormalkan 1:1 — mendukung semua alias format impor
 * (opsi_jawaban, tabel_benar_salah, pasangan, pernyataan).
 */
export function sidikJariIsi(soal) {
  const bagian = [];

  // 1. Opsi Jawaban (mendukung opsiJawaban, opsi_jawaban, options, pilihan)
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban
    : Array.isArray(soal?.opsi_jawaban) ? soal.opsi_jawaban
    : Array.isArray(soal?.options) ? soal.options
    : Array.isArray(soal?.pilihan) ? soal.pilihan : [];

  if (opsi.length) {
    bagian.push('opsi:' + opsi.map((o) => {
      if (typeof o === 'string') return normTeks(o);
      const teksO = normTeks(o?.teks || o?.text || '');
      const gbrO = Array.isArray(o?.gambar) && o.gambar.length ? `[gbr:${o.gambar.length}]` : '';
      return `${teksO}${gbrO}`;
    }).join(' | '));
  }

  // 2. Pernyataan (Benar/Salah atau Kategori)
  const pernyataan = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
  if (pernyataan.length) {
    bagian.push('pernyataan:' + pernyataan.map((p) => {
      if (typeof p === 'string') return normTeks(p);
      return `${normTeks(p?.teks || p?.pernyataan || '')}=${normTeks(p?.jawaban || p?.kunci || '')}`;
    }).join(' | '));
  }

  // 3. Tabel Benar/Salah & Tabel Soal
  const tabel = Array.isArray(soal?.tabelBenarSalah) ? soal.tabelBenarSalah
    : Array.isArray(soal?.tabel_benar_salah) ? soal.tabel_benar_salah : [];
  if (tabel.length) {
    bagian.push('tabel:' + tabel.map((b) => {
      if (typeof b === 'string') return normTeks(b);
      return `${normTeks(b?.pernyataan || b?.teks || '')}=${normTeks(b?.kunci || b?.jawaban || '')}`;
    }).join(' | '));
  }

  // 4. Pasangan / Menjodohkan
  const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan
    : Array.isArray(soal?.matching) ? soal.matching : [];
  if (pasangan.length) {
    bagian.push('pasangan:' + pasangan.map((p) => `${normTeks(p?.kiri)}>${normTeks(p?.kanan)}`).join(' | '));
  }

  return bagian.join(' # ');
}

/**
 * Sidik jari kunci jawaban universal (mendukung kunciJawaban, kunci_jawaban, kunci, jawaban)
 */
export function sidikJariKunci(soal) {
  const k = soal?.kunciJawaban ?? soal?.kunci_jawaban ?? soal?.kunci ?? soal?.jawaban ?? soal?.key;
  if (Array.isArray(k)) return [...k].map((x) => normTeks(x)).sort().join(',');
  return normTeks(k);
}

/**
 * Kunci pengelompokan duplikat 1:1 ketat (kunci jawaban, teks, bacaan, isi, dan gambar WAJIB sama).
 */
export function kunciDuplikat(soal) {
  return kunciDuplikatKetat(soal);
}

export function kunciKembarTanpaKunci(soal) {
  const teks = normTeks(teksSoalDari(soal));
  if (teks.length < MIN_TEKS_DUPLIKAT) return null;
  const mapel = String(soal?.mataPelajaran || soal?.mapel || soal?.mapel_soal || '').trim().toLowerCase();
  const jenjang = String(soal?.jenjang || '').trim().toLowerCase();
  const kelas = String(soal?.tingkatKelas || soal?.kelas || soal?.kelas_soal || '').trim().toLowerCase();
  const bacaan = sidikJariBacaan(soal);
  const gambar = sidikJariGambar(soal);
  const isi = sidikJariIsi(soal);

  return [mapel, jenjang, kelas, teks, bacaan, gambar, isi].join('|||');
}

export function kunciTeksSaja(soal) {
  const teks = normTeks(teksSoalDari(soal));
  if (teks.length < MIN_TEKS_DUPLIKAT) return null;
  const mapel = String(soal?.mataPelajaran || soal?.mapel || soal?.mapel_soal || '').trim().toLowerCase();
  const jenjang = String(soal?.jenjang || '').trim().toLowerCase();
  const kelas = String(soal?.tingkatKelas || soal?.kelas || soal?.kelas_soal || '').trim().toLowerCase();
  return [mapel, jenjang, kelas, teks].join('|||');
}

/** Kunci duplikat ketat 1:1: TEKS + BACAAN + OPSI/ISI + KUNCI JAWABAN + GAMBAR sama persis */
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
  MIN_TEKS_DUPLIKAT, sidikJariGambar, sidikJariIsi, sidikJariKunci, sidikJariBacaan,
  kunciDuplikat, kunciDuplikatKetat, kunciKembarTanpaKunci, kunciTeksSaja,
  bandingkanDuplikat, bandingkanDuaButir, alasanDuplikat,
};
