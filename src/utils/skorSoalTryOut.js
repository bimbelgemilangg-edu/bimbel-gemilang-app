// src/utils/skorSoalTryOut.js
// ============================================================
// Hitung skor 1 soal Try Out (0..1) -- SATU-SATUNYA sumber logika ini,
// dipakai BARENG oleh:
//   1. TryOutView.jsx        -- pas siswa submit try out pertama kali
//   2. HasilTryOutAdminPage.jsx -- pas admin "Hitung Ulang" nilai lama
//      (mis. abis ketemu bug skoring, biar siswa yang kena imbas bisa
//      dikoreksi nilainya tanpa perlu ngerjain ulang dari awal)
//
// KENAPA DIPISAH KE SINI (bukan didefinisikan sendiri-sendiri di 2
// tempat): kalau logikanya beda tipis antara "pas ngerjain" dan "pas
// dihitung ulang admin", hasil "Hitung Ulang" bisa BEDA dari yang
// SEHARUSNYA didapat siswa -- padahal tujuannya justru mengoreksi jadi
// BENAR. Dengan 1 file bersama ini, itu tidak mungkin terjadi.
// ============================================================

import {
  hitungSkorPgKompleks, hitungSkorBenarSalah, cariIndexBenar,
  barisBenarSalahBisaDinilai, safeArray,
} from './skoringSoalKompleks.js';

// 🔥 BARU: 1 fungsi bersama buat "apa soal ini beneran tidak dijawab
// sama sekali" -- dipakai BARENG oleh RendererPgSederhana/PgKompleks/
// BenarSalah.jsx (buat nampilin tanda "⚠️ Tidak dijawab") DAN oleh
// TryOutView.jsx & HasilTryOutAdminPage.jsx (buat ringkasan di header
// tiap soal). Sebelumnya logika ini KETULIS ULANG beda-beda tipis di
// 4 tempat -- SEKARANG cuma 1 sumber, biar siswa & admin selalu lihat
// kesimpulan yang PERSIS sama soal mana yang beneran di-skip.
// 🔥 BARU (esai 2026-10-04): skala nilai manual per soal esai, 0-100.
// Admin menilai di halaman Hasil Try Out; poinnya masuk total lewat
// hitungTotalSkor(..., nilaiEsai).
export const SKALA_NILAI_ESAI = 100;

// 'uraian' = alias lama dari pipeline HTML Master; diperlakukan identik.
export const isSoalEsai = (soal) => {
  const t = soal?.tipe || '';
  return t === 'esai' || t === 'uraian';
};

/**
 * Poin esai yang sudah dinilai admin, dinormalkan ke 0..1 (setara bobot
 * satu soal pilihan ganda). null kalau belum dinilai.
 * Bentuk nilaiEsai: { [soalId]: { poin: 0-100, penilai, pada } }
 */
export function poinEsai(soal, nilaiEsai) {
  const v = nilaiEsai?.[soal?.id];
  if (!v || v.poin === undefined || v.poin === null || v.poin === '') return null;
  const p = Number(v.poin);
  if (!Number.isFinite(p)) return null;
  return Math.min(Math.max(p, 0), SKALA_NILAI_ESAI) / SKALA_NILAI_ESAI;
}

export function soalBelumDijawab(soal, jawaban) {
  const tipe = soal.tipe || 'pg_sederhana';
  // 🔥 BARU: esai dianggap terjawab kalau ADA TEKS atau ADA FOTO --
  // dua-duanya jalur jawaban yang sah sesuai permintaan owner.
  // 🛡️ AUDIT 2026-10-13: pakai isSoalEsai() supaya alias lama 'uraian'
  // (pipeline HTML Master) ikut terlayani -- dulu cuma 'esai' yang dicek
  // sehingga uraian berfoto bisa salah dilabeli "belum dijawab" di layar
  // siswa & ringkasan admin, padahal keranjang + renderer menerimanya.
  if (isSoalEsai(soal)) {
    const j = jawaban && typeof jawaban === 'object' ? jawaban : { teks: jawaban };
    return !String(j?.teks ?? '').trim() && !String(j?.foto ?? '').trim();
  }
  if (tipe === 'pg_kompleks') return safeArrayLokal(jawaban).length === 0;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return safeArrayLokal(jawaban).filter(Boolean).length === 0;
  // 🔥 BARU: isian_singkat & numerik -- jawabannya teks bebas, dianggap
  // "belum dijawab" kalau kosong/cuma spasi (bukan soal jawaban 0 di
  // pg_sederhana, di sini jawaban SELALU string jadi aman dicek trim).
  if (tipe === 'isian_singkat' || tipe === 'numerik') return !String(jawaban ?? '').trim();
  // pg_sederhana: jawabannya berupa INDEX ANGKA (termasuk 0 buat opsi
  // A) -- jangan sampai index 0 dianggap "kosong" cuma karena falsy.
  return jawaban === undefined || jawaban === null;
}

function safeArrayLokal(v) {
  return Array.isArray(v) ? v : [];
}

// 🔥 BARU: cocokkan jawaban isian_singkat/numerik -- 2 tipe soal yang
// tadinya SAMA SEKALI TIDAK BISA dikerjain di Try Out (cuma diblokir
// dari keranjang admin, lihat tipeDidukung() di TerbitkanTryOutPage).
function cocokJawabanSingkat(soal, jawabanSiswa) {
  const jawaban = String(jawabanSiswa ?? '').trim();
  if (!jawaban) return 0;
  const kandidat = [soal.kunciJawaban, ...(soal.jawabanEkuivalen || [])]
    .filter(Boolean)
    .map((k) => String(k).trim());

  if (soal.tipe === 'numerik') {
    // Koma dianggap titik desimal (kebiasaan nulis angka Indonesia),
    // dan boleh meleset dikit sesuai toleransiJawaban (mis. hasil
    // pembulatan/pecahan yang berbeda cara nulis).
    const angkaSiswa = parseFloat(jawaban.replace(',', '.'));
    if (isNaN(angkaSiswa)) return 0;
    const toleransi = soal.toleransiJawaban ?? 0;
    return kandidat.some((k) => {
      const angkaKunci = parseFloat(String(k).replace(',', '.'));
      return !isNaN(angkaKunci) && Math.abs(angkaSiswa - angkaKunci) <= toleransi;
    }) ? 1 : 0;
  }
  // isian_singkat: case-insensitive, spasi ganda dirapikan jadi 1
  const rapikan = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return kandidat.some((k) => rapikan(k) === rapikan(jawaban)) ? 1 : 0;
}

// Satu sumber pemilihan baris benar/salah (dialek tabel_benar_salah /
// tabelBenarSalah / pernyataan), dipakai skoring DAN pengecekan kelayakan.
export function pilihBarisBenarSalah(soal) {
  if (Array.isArray(soal?.tabel_benar_salah) && soal.tabel_benar_salah.length) return soal.tabel_benar_salah;
  if (Array.isArray(soal?.tabelBenarSalah) && soal.tabelBenarSalah.length) return soal.tabelBenarSalah;
  return Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
}

// 🔥 BARU (audit keluhan siswa): soal yang TIDAK BISA dinilai karena
// datanya rusak (baris benar/salah tanpa kunci sama sekali) dikeluarkan
// dari penyebut total -- kesalahan sistem tidak boleh mengurangi nilai
// siswa. Admin melihat jumlahnya lewat jumlahTidakBisaDinilai dan bisa
// memperbaiki datanya lewat catatan admin di bank soal.
// 🛡️ AUDIT 2026-10-13 (paket Sabtu 17 Okt): cakupan diperluas. Kasus
// nyata yang lolos dari versi lama: 4 soal pg_sederhana ber-kunci ganda
// ("A,D" -- impor salah tipe, seharusnya pg_kompleks) -> cariIndexBenar
// = -1 -> jawaban siswa APA PUN selalu 0 padahal ikut penyebut (skor
// maksimal paket terpanggang jadi 87,5%). Kriteria "bisa dinilai" kini
// = "ada jalur jawaban siswa yang bisa menghasilkan skor > 0":
// - pg_sederhana : kunci harus memetakan ke salah satu opsi (index >= 0)
// - pg_kompleks  : kunci (setelah normalisasi safeArray) harus huruf
//                  yang berada dalam rentang opsi -- kunci angka "1,3,5"
//                  tak pernah bisa dicentang siswa (renderer pakai huruf)
// - isian/numerik: minimal ada kunci atau jawaban ekuivalen
export function soalBisaDinilai(soal) {
  const tipe = soal?.tipe || 'pg_sederhana';
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    return barisBenarSalahBisaDinilai(pilihBarisBenarSalah(soal));
  }
  if (tipe === 'pg_sederhana') {
    return cariIndexBenar(soal) >= 0;
  }
  if (tipe === 'pg_kompleks') {
    const kunci = safeArray(soal?.kunciJawaban).map((h) => String(h).toUpperCase().trim());
    if (!kunci.length) return false;
    const nOpsi = (Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : []).length;
    return kunci.every((h) => /^[A-Z]$/.test(h) && h.charCodeAt(0) - 65 < nOpsi);
  }
  if (tipe === 'isian_singkat' || tipe === 'numerik') {
    const utama = String(soal?.kunciJawaban ?? '').trim();
    const ekuivalen = (Array.isArray(soal?.jawabanEkuivalen) ? soal.jawabanEkuivalen : [])
      .some((k) => String(k ?? '').trim() !== '');
    return utama !== '' || ekuivalen;
  }
  return true;
}

export function skorSatuSoal(soal, jawaban) {
  const tipe = soal.tipe || 'pg_sederhana';
  // 🔥 BARU: esai TIDAK punya skor otomatis. Kontribusi nilainya datang
  // dari penilaian manual admin (poinEsai), bukan dari fungsi ini.
  if (tipe === 'esai') return 0;
  if (jawaban === undefined || jawaban === null) return 0;
  try {
    if (tipe === 'pg_kompleks') return hitungSkorPgKompleks(soal.kunciJawaban, jawaban);
    if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
      const baris = pilihBarisBenarSalah(soal);
      return hitungSkorBenarSalah(baris, jawaban);
    }
    if (tipe === 'isian_singkat' || tipe === 'numerik') return cocokJawabanSingkat(soal, jawaban);
    const indexBenar = cariIndexBenar(soal);
    return jawaban === indexBenar ? 1 : 0;
  } catch (e) {
    // Soal ini datanya rusak -- jangan sampai proses submit/hitung
    // ulang SELURUH try out ikut gagal cuma gara-gara 1 soal.
    console.error('[TryOut] Gagal hitung skor soal:', soal.id, e);
    return 0;
  }
}

/**
 * Hitung total skor (0..100%) buat SEMUA soal dalam 1 paket, dari
 * jawaban yang sudah tersimpan (baik pas submit pertama kali maupun
 * pas mau dihitung ulang belakangan).
 */
/**
 * 🔥 2026-10-24 (bug "nilai berubah saat dihitung ulang"): siswa bisa
 * menerima daftar soal yang SUDAH DIFILTER akses mapelnya, sedangkan sisi
 * admin/guru menghitung ulang dari paket MENTAH -- soal yang tidak pernah
 * diterima siswa ikut jadi penyebut dan nilainya turun. Sejak ini sesi
 * menyimpan `soalDinilaiIds` (id soal yang benar-benar dinilai saat submit),
 * dan semua jalur hitung ulang WAJIB memakainya bila ada.
 * @param {Array} daftarSoal paket mentah atau terfilter
 * @param {object} [sesi] dokumen sesi (boleh punya soalDinilaiIds)
 * @returns {Array} daftar soal yang sah dipakai penyebut
 */
export function pilihSoalDinilai(daftarSoal, sesi) {
  const daftar = Array.isArray(daftarSoal) ? daftarSoal : [];
  const ids = Array.isArray(sesi?.soalDinilaiIds) ? sesi.soalDinilaiIds : null;
  if (!ids || ids.length === 0) return daftar;
  const set = new Set(ids);
  return daftar.filter((s) => set.has(s?.id));
}

export function hitungTotalSkor(daftarSoal, jawaban, nilaiEsai = null) {
  const daftar = daftarSoal || [];
  const soalAuto = daftar.filter((s) => !isSoalEsai(s) && soalBisaDinilai(s));
  const jumlahTidakBisaDinilai = daftar.filter((s) => !isSoalEsai(s) && !soalBisaDinilai(s)).length;
  let totalSkor = 0;
  soalAuto.forEach((s) => { totalSkor += skorSatuSoal(s, jawaban?.[s.id]); });

  // Esai masuk penyebut HANYA kalau sudah dinilai admin. Sebelum dinilai,
  // persentase mencerminkan bagian yang bisa dinilai otomatis -- dan layar
  // hasil siswa memberi catatan bahwa esainya masih menunggu guru.
  let penyebut = soalAuto.length;
  let esaiTernilai = 0;
  for (const s of daftar) {
    if (!isSoalEsai(s)) continue;
    const p = poinEsai(s, nilaiEsai);
    if (p !== null) {
      totalSkor += p;
      penyebut += 1;
      esaiTernilai += 1;
    }
  }

  const jumlahEsai = daftar.filter((s) => isSoalEsai(s)).length;
  const totalSkorPersen = penyebut > 0 ? Math.round((totalSkor / penyebut) * 100) : 0;
  return { totalSkor, totalSkorPersen, jumlahEsai, esaiTernilai, jumlahTidakBisaDinilai };
}