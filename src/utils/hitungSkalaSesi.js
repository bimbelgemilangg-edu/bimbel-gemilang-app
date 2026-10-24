// src/utils/hitungSkalaSesi.js
// ============================================================
// Menghitung skala kebiasaan (utils/skorSkalaUtbk.js & skorSkalaTka.js)
// LANGSUNG dari dokumen sesi try out + paketnya, tanpa input manual admin.
//
// 🔥 KENAPA TIDAK DIHITUNG SAAT SISWA SUBMIT
// Tempat alami menulisnya adalah TryOutView.jsx saat submit. Berkas itu
// (2.778 baris, alur ujian yang sedang dipakai siswa) punya error lint
// warisan per 2026-10-10 -- menyentuhnya di minggu deadline berarti
// membersihkan ranjau CI sekaligus mengambil risiko pada alur ujian.
// Keputusan: hitung di SISI BACA (halaman target admin & layar hasil),
// bayar utang TryOutView di commit terpisah yang tenang.
//
// Murni & teruji: menerima objek sesi & paket apa pun (dari Firestore atau
// fixture), tidak menyentuh jaringan.
//
// 🔥 2026-10-24: SADAR-MODE. Jenis ujian paket (`jenisUjian` pilihan admin
// saat menerbitkan, atau tebakan dari isi) menentukan skala yang dipakai:
//   'utbk'      -> 100-1000 per komponen + bobot resmi SNBT 2025
//   'tka'       -> 200-800 per mata uji (SMA/SMK, Kepmendikdasmen 56/2026)
//                  atau 0-100 (SD/SMP); predikat Istimewa >= 725,00
//   'kurikulum' -> null (ujian sekolah: persen saja, tanpa skala nasional)
// Dan memakai `soalDinilaiIds` dari sesi supaya penyebutnya sama dengan yang
// dilihat siswa saat submit (bug 2026-10-24).
// ============================================================

import { skorSatuSoal, soalBisaDinilai, isSoalEsai, pilihSoalDinilai } from './skorSoalTryOut.js';
import { hitungSkalaUtbk } from './skorSkalaUtbk.js';
import {
  jenisUjianPaket, modeSkalaTka, persenKeSkalaTka, predikatTka, LABEL_SKALA_TKA,
} from './skorSkalaTka.js';
import { MAPEL_UTBK } from './mesinTaksonomiSoal.js';
import { apakahMapelUtbk } from '../../lib/kunciGemini.js';

const norm = (s) => String(s ?? '').toLowerCase().trim();

function subtesDariMapel(namaMapel) {
  const n = norm(namaMapel);
  const m = MAPEL_UTBK.find((x) => norm(x.nama) === n || x.kode === n);
  return m ? m.subtes : null;
}

const kosong = (mode, alasan) => ({
  mode, total: null, perSubtes: [], perKomponen: [], alasan, label: mode === 'tka' ? LABEL_SKALA_TKA : null,
});

/**
 * @param {object} sesi  dokumen tryout_sesi (field jawaban, status, soalDinilaiIds)
 * @param {object} paket dokumen tryout_paket (field daftarSoal, jenisUjian, targetKelas)
 * @returns {{mode: 'utbk'|'tka'|'kurikulum'|null, total: number|null, perSubtes: Array, perKomponen: Array, alasan?: string, catatan?: string, label?: string}}
 */
export function hitungSkalaSesi(sesi, paket) {
  if (!sesi || sesi.status !== 'selesai') {
    return kosong(null, 'sesi belum selesai');
  }
  const daftar = pilihSoalDinilai(paket?.daftarSoal || [], sesi);
  const jawaban = sesi.jawaban || {};
  const mode = jenisUjianPaket(paket, (m) => apakahMapelUtbk(m, MAPEL_UTBK));

  if (mode === 'kurikulum') {
    return kosong('kurikulum', 'paket jenis kurikulum/sekolah: tidak memakai skala nasional');
  }

  // Agregat per kelompok: subtes UTBK untuk mode utbk, mata uji untuk tka.
  const agg = new Map();
  for (const soal of daftar) {
    const mapel = soal?.mapel || soal?.mataPelajaran || '';
    if (isSoalEsai(soal) || !soalBisaDinilai(soal)) continue; // esai dinilai manusia
    const kunci = mode === 'utbk' ? subtesDariMapel(mapel) : (norm(mapel) || null);
    if (mode === 'utbk' && !apakahMapelUtbk(mapel, MAPEL_UTBK)) continue;
    if (!kunci) continue;
    const a = agg.get(kunci) || { kunci, nama: mapel || kunci, benar: 0, skor: 0, total: 0 };
    a.total += 1;
    const s = skorSatuSoal(soal, jawaban[soal.id]);
    if (s !== null) {
      a.skor += s;
      if (s >= 0.999) a.benar += 1;
    }
    agg.set(kunci, a);
  }
  if (agg.size === 0) {
    return kosong(mode, mode === 'utbk'
      ? 'paket ini bukan try out subtes UTBK'
      : 'paket ini tidak memuat mata uji TKA yang bisa dinilai');
  }
  const baris = [...agg.values()].map((a) => ({
    kode: a.kunci, nama: a.nama, benar: a.benar, skor: a.skor, total: a.total,
  }));

  if (mode === 'utbk') {
    return { ...hitungSkalaUtbk(baris), mode };
  }

  // ---- mode TKA ----
  const skalaMode = modeSkalaTka(paket);
  if (!skalaMode) {
    return kosong('tka', 'jenjang paket tidak terbaca: isi jenjang/target kelas (mis. "12 SMA" atau "6 SD") supaya skala TKA yang benar (SMA/SMK 200-800 vs SD/SMP 0-100) bisa dipilih');
  }
  const perSubtes = baris.map((b) => {
    const persen = (b.skor / b.total) * 100;
    const skala = skalaMode === 'tka-sma'
      ? persenKeSkalaTka(persen)
      : Math.round(persen * 100) / 100; // SD/SMP: 0-100, 2 desimal seperti laporan TKA
    return {
      ...b,
      persen: Number(persen.toFixed(1)),
      skala,
      predikat: skalaMode === 'tka-sma' ? predikatTka(skala) : null,
    };
  });
  const total = Math.round((perSubtes.reduce((x, b) => x + b.skala, 0) / perSubtes.length) * 100) / 100;
  return {
    mode: 'tka',
    skalaMode,
    total,
    perSubtes,
    perKomponen: [],
    catatan: skalaMode === 'tka-sma'
      ? 'TKA resmi melaporkan hasil PER MATA UJI; angka gabungan ini rata-rata skala mata uji, hanya untuk kemudahan membaca.'
      : 'TKA SD/SMP dilaporkan 0-100; angka gabungan ini rata-rata mata uji.',
    label: LABEL_SKALA_TKA,
  };
}

/** Ambil sesi selesai terbaru dari daftar sesi (urut waktuMulaiMs menurun). */
export function sesiTerbaru(sesiList = []) {
  return [...sesiList]
    .filter((s) => s && s.status === 'selesai')
    .sort((a, b) => (Number(b.waktuMulaiMs) || 0) - (Number(a.waktuMulaiMs) || 0))[0] || null;
}

export default { hitungSkalaSesi, sesiTerbaru };
