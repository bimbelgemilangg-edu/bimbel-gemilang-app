// src/utils/keranjangSoalGuru.js
// ============================================================
// KERANJANG SOAL TENTOR — murni, teruji.
// ============================================================
//
// KENAPA BERKAS INI ADA
// Owner 2026-10-08: keranjang harus jadi "kotak-kotak kartu berisi soal
// lengkap dengan gambarnya, jadi dibaca dahulu, dengan watermark logo
// Gemilang di belakangnya".
//
// Tetapi ada cacat yang harus dibereskan lebih dulu, dan inilah sebabnya
// keranjang butuh util sendiri. Di `CetakPaketLatihan.jsx` yang lama:
//
//   onClick={() => { setBabAktif(b); setTercentang([]); }}
//
// Setiap ganti jenjang/mapel/bab/kelas memanggil `setTercentang([])`.
// Artinya tentor yang sudah mencentang 15 soal lalu pindah bab untuk
// menambah lagi KEHILANGAN SEMUANYA tanpa peringatan — dan merakit soal
// lintas bab memang mustahil. Itu akar teknis dari keluhan "menu pilih
// membingungkan".
//
// Dua keputusan rancangan di berkas ini:
//
//   1. Keranjang menyimpan BUTIR, bukan id. Kalau hanya id, kartu tidak
//      bisa dirender setelah tentor pindah bab (butirnya sudah tidak ada
//      di daftar yang tampil). Menyimpan butir membuat keranjang mandiri
//      dari filter yang sedang aktif.
//   2. Keranjang adalah ARRAY, bukan Set — urutannya adalah nomor naskah
//      yang akan dicetak, jadi tentor bisa menaikkan/menurunkan butir.
//
// SOAL PAGAR TIPE: `TIPE_TERDUKUNG` di keranjangTryOut.js adalah pagar
// untuk RENDERER TRY OUT, bukan untuk mesin cetak. Menjodohkan misalnya
// tidak bisa dirender try out tapi SAH dicetak. Maka di sini tipe tak
// didukung hanya DIBENDERA, tidak diblokir — memblokirnya akan mencabut
// kemampuan mencetak yang selama ini ada (SOP janji #1: kompatibel mundur).
// Pagar kerasnya dipasang nanti di Fase 2 (merakit try out).
// ============================================================

import { tipeDidukung } from './keranjangTryOut.js';

// 🔥 2026-10-08: pembaca field (teks soal / identitas / bacaan) DIPINDAH ke
// src/utils/fieldButirSoal.js supaya mesin cetak, kartu baca, mesin audit, dan
// halaman pembersih memakai pengertian yang SAMA. Di sini hanya di-re-export
// agar pemanggil lama tidak patah.
export { teksSoalDari, identitasDari, bacaanDari } from './fieldButirSoal.js';
import { teksSoalDari, identitasDari } from './fieldButirSoal.js';

/** Bendera mutu yang perlu dilihat tentor SEBELUM mencetak. */
export function benderaButir(soal) {
  const bendera = [];
  if (soal?.kunciTerverifikasi === false) bendera.push('kunci belum terverifikasi (hasil AI)');
  if (soal?.pembahasanAsal === 'penalaran') bendera.push('pembahasan hasil penalaran model — periksa dulu');
  if (Array.isArray(soal?.potonganTertunda) && soal.potonganTertunda.length) {
    bendera.push(`${soal.potonganTertunda.length} figur menunggu potongan presisi`);
  }
  const kunci = soal?.kunciJawaban;
  const kunciKosong = kunci === '' || kunci === null || kunci === undefined
    || (Array.isArray(kunci) && kunci.length === 0);
  if (kunciKosong && soal?.tipe !== 'esai') bendera.push('kunci jawaban kosong');
  if (!tipeDidukung(soal)) bendera.push(`tipe "${soal?.tipe}" belum didukung renderer try out (tetap bisa dicetak)`);
  return bendera;
}

function idButir(soal, indeks) {
  return String(soal?.id ?? soal?.__id ?? `lokal-${indeks}`);
}

/**
 * Masukkan satu butir. Tidak mengubah array asal (murni).
 * @returns {{keranjang:Array, status:'baru'|'sudahAda'|'tanpaId'}}
 */
export function masukKeranjang(keranjang, soal) {
  const lama = Array.isArray(keranjang) ? keranjang : [];
  if (!soal) return { keranjang: lama, status: 'tanpaId' };
  const id = soal.id ?? soal.__id;
  if (id === undefined || id === null || id === '') return { keranjang: lama, status: 'tanpaId' };
  if (lama.some((s) => String(s?.id ?? s?.__id) === String(id))) {
    return { keranjang: lama, status: 'sudahAda' };
  }
  return { keranjang: [...lama, soal], status: 'baru' };
}

/**
 * Masukkan banyak butir sekaligus + rincian jujur untuk toast.
 * Memakai `hitungRincianMasukKeranjang` dari keranjangTryOut supaya
 * bahasanya sama dengan halaman admin (satu sumber kebenaran).
 */
export function masukKeranjangBanyak(keranjang, daftar) {
  let hasil = Array.isArray(keranjang) ? keranjang : [];
  let baru = 0;
  let sudahAda = 0;
  let ditolak = 0;
  for (const soal of daftar || []) {
    const r = masukKeranjang(hasil, soal);
    hasil = r.keranjang;
    if (r.status === 'baru') baru += 1;
    else if (r.status === 'sudahAda') sudahAda += 1;
    else ditolak += 1;
  }
  return { keranjang: hasil, rincian: { baru, sudahAda, dilewati: ditolak } };
}

/** Keluarkan satu butir berdasarkan id. */
export function keluarKeranjang(keranjang, id) {
  const lama = Array.isArray(keranjang) ? keranjang : [];
  return lama.filter((s) => String(s?.id ?? s?.__id) !== String(id));
}

/**
 * Pindahkan butir naik/turun. `arah` = -1 (naik) atau 1 (turun).
 * Tidak melempar bila id tidak ada atau sudah di ujung.
 */
export function pindahUrutan(keranjang, id, arah) {
  const lama = Array.isArray(keranjang) ? keranjang : [];
  const dari = lama.findIndex((s) => String(s?.id ?? s?.__id) === String(id));
  if (dari < 0) return lama;
  const ke = dari + (arah < 0 ? -1 : 1);
  if (ke < 0 || ke >= lama.length) return lama;
  const hasil = [...lama];
  [hasil[dari], hasil[ke]] = [hasil[ke], hasil[dari]];
  return hasil;
}

/** Ringkasan untuk bilah keranjang & judul naskah. */
export function ringkasKeranjang(keranjang) {
  const daftar = Array.isArray(keranjang) ? keranjang : [];
  const peta = (ambil) => {
    const m = new Map();
    daftar.forEach((s) => {
      const k = ambil(s);
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()]
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama, 'id'));
  };

  const berbendera = daftar.filter((s) => benderaButir(s).length > 0).length;
  const tanpaIdentitas = daftar.filter((s) => {
    const i = identitasDari(s);
    return i.mapel === '(tanpa mapel)' || i.jenjang === '(tanpa jenjang)' || i.materi === '(tanpa materi)';
  }).length;

  return {
    jumlah: daftar.length,
    perMateri: peta((s) => identitasDari(s).materi),
    perMapel: peta((s) => identitasDari(s).mapel),
    perJenjang: peta((s) => identitasDari(s).jenjang),
    berbendera,
    tanpaIdentitas,
  };
}

/**
 * Judul naskah yang JUJUR. Keranjang lintas bab tidak boleh diberi judul
 * satu bab — itu membuat lembar cetak mengaku sesuatu yang tidak benar.
 */
export function judulDariKeranjang(keranjang) {
  const r = ringkasKeranjang(keranjang);
  if (r.jumlah === 0) return 'Keranjang kosong';
  const jenjang = r.perJenjang.length === 1 ? r.perJenjang[0].nama : `${r.perJenjang.length} jenjang`;
  const mapel = r.perMapel.length === 1 ? r.perMapel[0].nama : `${r.perMapel.length} mapel`;
  const materi = r.perMateri.length === 1
    ? r.perMateri[0].nama
    : `${r.perMateri.length} materi`;
  return `${jenjang} · ${mapel} · ${materi}`;
}

/** Kalimat rincian untuk toast "pilih semua". */
export function teksRincianMasuk(rincian) {
  const bagian = [];
  if (rincian.baru > 0) bagian.push(`${rincian.baru} soal masuk keranjang`);
  if (rincian.sudahAda > 0) bagian.push(`${rincian.sudahAda} sudah ada di keranjang`);
  if (rincian.dilewati > 0) bagian.push(`${rincian.dilewati} dilewati (tanpa id)`);
  if (!bagian.length) return 'Tidak ada soal baru yang bisa dimasukkan.';
  return `✓ ${bagian.join(', ')}.`;
}

/** Id butir untuk key React — stabil walau id Firestore tidak ada. */
export function kunciButir(soal, indeks) {
  return idButir(soal, indeks);
}

export default {
  teksSoalDari,
  identitasDari,
  benderaButir,
  masukKeranjang,
  masukKeranjangBanyak,
  keluarKeranjang,
  pindahUrutan,
  ringkasKeranjang,
  judulDariKeranjang,
  teksRincianMasuk,
  kunciButir,
};
