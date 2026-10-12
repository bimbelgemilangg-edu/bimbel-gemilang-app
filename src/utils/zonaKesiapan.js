// src/utils/zonaKesiapan.js
// ============================================================
// Matriks 4 zona kesiapan + aturan formasi Pilihan 1 & Pilihan 2.
//
// SUMBERNYA BUKAN KARANGAN. Angka ambang, tingkat risiko, frekuensi drill,
// tindakan intervensi, dan rekomendasi formasi di bawah ini disalin dari
// sheet `SOP_GEMBLENGAN_TRYOUT` dan aturan main di sheet
// `SIMULATOR_EVALUASI_SISWA` pada berkas owner
// "Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026.xlsx":
//
//   Zona Hijau (Sangat Aman)  GAP >= +25   Sangat Rendah  1x TO / 2 minggu
//   Zona Hijau (Kompetitif)   GAP 0 s/d +24   Rendah-Sedang   1x TO / minggu
//   Zona Kuning (Perlu Drill) GAP -1 s/d -25  Sedang-Tinggi   2x drill / minggu
//   Zona Merah (Gemblengan)   GAP < -25       Sangat Tinggi   3-4x drill / minggu
//
//   Aturan formasi (panduan konsultan, sheet SIMULATOR baris 5):
//     "Target Pilihan 1 boleh menantang (GAP -25 s/d 0), tetapi Pilihan 2
//      WAJIB surplus (GAP >= 0 thd Min)."
//
// 🔥 TIGA HAL YANG DILARANG BLUEPRINT, DAN CARA BERKAS INI MENJAGANYA
//
// 1. TIDAK ADA persentase peluang diterima. Blueprint §3D: "Jangan memberikan
//    persentase peluang diterima yang tidak didukung model dan data
//    tervalidasi." Zona di bawah adalah LABEL KESIAPAN berdasarkan selisih
//    poin, bukan ramalan kelulusan. Tidak ada fungsi di sini yang
//    mengembalikan angka 0-100%.
//
// 2. TIDAK ADA label "passing grade". Yang dibandingkan adalah
//    `skorReferensi.minimum` yang di berkas sumber bernama
//    "Skor_UTBK_Minimum" -- padahal panitia SNPMB tidak mengumumkan nilai
//    minimum kelulusan per prodi. UI wajib memakai istilah "skor acuan" dan
//    menampilkan status datanya (lihat utils/statusDataPtn.js).
//
// 3. Data hilang TIDAK diberi zona. Kalau prodi tidak punya skor acuan,
//    hasilnya TANPA_DATA, bukan hijau atau merah. Menampilkan "Zona Merah"
//    untuk prodi yang datanya tidak ada akan menakut-nakuti siswa tanpa dasar.
//
// ⚠️ CATATAN PENTING TENTANG SKOR YANG DIPAKAI
// `skorSiswa` di sini adalah skor TRY OUT INTERNAL Gemilang. Blueprint §3C
// melarang menganggapnya otomatis setara skor UTBK resmi. Selisih yang
// dihasilkan karena itu adalah ALAT KONSULTASI ("seberapa jauh dari skor
// acuan"), bukan prediksi. UI wajib mengatakan itu.
// ============================================================

export const ZONA = {
  HIJAU_AMAN: 'hijau_aman',
  HIJAU_KOMPETITIF: 'hijau_kompetitif',
  KUNING: 'kuning',
  MERAH: 'merah',
  TANPA_DATA: 'tanpa_data',
};

/**
 * Definisi zona. `minGap` inklusif, `maksGap` inklusif.
 * Rentang disusun agar TIDAK TUMPANG TINDIH dan MENUTUP SEMUA bilangan:
 *   >= 25 | 0..24 | -25..-1 | <= -26
 * (test di tests/zonaKesiapan.test.mjs memeriksa kedua sifat itu secara
 * eksplisit, termasuk pada nilai batas.)
 */
/**
 * Apakah nilai ini benar-benar angka yang bisa dipakai.
 *
 * 🔥 `Number.isFinite(Number(v))` SAJA TIDAK CUKUP: `Number('')` bernilai 0,
 * jadi string kosong lolos dan diperlakukan sebagai skor NOL. Siswa yang belum
 * pernah try out akan mendapat gap "positif" terhadap prodi mana pun dan
 * ditampilkan sebagai Zona Hijau Kompetitif. Bug ini nyata terjadi saat test
 * pertama berkas ini dijalankan (2026-10-10) dan ditangkap oleh test
 * "INVARIAN: data kosong bukan angka" di tests/zonaKesiapan.test.mjs.
 */
export function angkaSah(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  return Number.isFinite(Number(v));
}

export const MATRIKS_ZONA = [
  {
    id: ZONA.HIJAU_AMAN,
    nama: 'Zona Hijau (Sangat Aman)',
    minGap: 25,
    maksGap: Infinity,
    risiko: 'Sangat Rendah',
    frekuensiDrill: '1x try out / 2 minggu',
    intervensi: 'Pertahankan konsistensi, latih stamina mental 195 menit, simulasi eliminasi cepat',
    rekomendasiFormasi: 'Pertahankan sebagai Pilihan 1 atau Pilihan 2',
  },
  {
    id: ZONA.HIJAU_KOMPETITIF,
    nama: 'Zona Hijau (Kompetitif)',
    minGap: 0,
    maksGap: 24,
    risiko: 'Rendah - Sedang',
    frekuensiDrill: '1x try out / minggu',
    intervensi: 'Fokus perkuat subtes pendukung, hindari blunder pada soal mudah/sedang',
    rekomendasiFormasi: 'Sangat layak sebagai Pilihan 2 (cadangan aman)',
  },
  {
    id: ZONA.KUNING,
    nama: 'Zona Kuning (Perlu Drill)',
    minGap: -25,
    maksGap: -1,
    risiko: 'Sedang - Tinggi',
    frekuensiDrill: '2x drill set / minggu',
    intervensi: 'Review konsep materi pada 2 subtes terlemah; drill bank soal bertingkat',
    rekomendasiFormasi: 'Boleh untuk Pilihan 1 jika Pilihan 2 berada di Zona Hijau',
  },
  {
    id: ZONA.MERAH,
    nama: 'Zona Merah (Gemblengan Total)',
    minGap: -Infinity,
    maksGap: -26,
    risiko: 'Sangat Tinggi',
    frekuensiDrill: '3-4x drill intensif / minggu',
    intervensi: 'Bedah tuntas konsep dasar, privat 1-on-1 pada subtes kuantitatif/penalaran',
    rekomendasiFormasi: 'Wajib reposisi Pilihan 2 ke prodi dengan skor acuan lebih realistis',
  },
];

/**
 * Tentukan zona dari selisih skor.
 *
 * @param {number|null} gap skorSiswa - skorAcuanMinimum. null bila salah satu
 *   tidak tersedia -- hasilnya TANPA_DATA, bukan zona berwarna.
 */
export function zonaDariGap(gap) {
  // angkaSah(), bukan Number.isFinite(Number(gap)): Number('') === 0 akan
  // membuat selisih yang tidak ada terbaca sebagai "tepat di ambang" dan
  // mendapat Zona Hijau Kompetitif.
  if (!angkaSah(gap)) {
    return { id: ZONA.TANPA_DATA, nama: 'Data belum tersedia', risiko: null, frekuensiDrill: null, intervensi: null, rekomendasiFormasi: null };
  }
  const g = Number(gap);
  const z = MATRIKS_ZONA.find((m) => g >= m.minGap && g <= m.maksGap);
  // Tidak boleh terjadi (rentang menutup semua bilangan). Kalau sampai terjadi,
  // gagal ke arah TANPA_DATA -- jangan mengarang zona.
  return z ? { ...z } : { id: ZONA.TANPA_DATA, nama: 'Data belum tersedia', risiko: null };
}

/**
 * Hitung selisih skor siswa terhadap satu prodi.
 *
 * @param {number|null} skorSiswa skor TO internal Gemilang (bukan skor UTBK)
 * @param {object|null} skorAcuan bungkus dari statusDataPtn.bungkusAngka
 * @returns {{gapMinimum: number|null, gapRataRata: number|null, zona: object,
 *            skorAcuanTersedia: boolean, peringatan: string[]}}
 */
export function bandingkanSkor(skorSiswa, skorAcuan) {
  const peringatan = [];
  const adaSiswa = angkaSah(skorSiswa);
  const min = skorAcuan?.minimum?.nilai ?? null;
  const rata = skorAcuan?.rataRata?.nilai ?? null;

  if (!adaSiswa) peringatan.push('Skor try out siswa belum tersedia.');
  if (min === null) peringatan.push('Prodi ini belum punya skor acuan minimum — zona tidak bisa ditentukan.');

  // Blueprint §3C: skor acuan yang belum terverifikasi harus mengaku.
  if (min !== null && skorAcuan?.minimum?.statusData && skorAcuan.minimum.statusData !== 'terverifikasi') {
    peringatan.push('Skor acuan berstatus estimasi, bukan angka resmi panitia.');
  }
  if (adaSiswa) {
    peringatan.push('Skor siswa berasal dari try out internal Gemilang, tidak otomatis setara skor UTBK resmi.');
  }

  const gapMinimum = adaSiswa && min !== null ? Number(skorSiswa) - Number(min) : null;
  const gapRataRata = adaSiswa && rata !== null ? Number(skorSiswa) - Number(rata) : null;

  return {
    gapMinimum,
    gapRataRata,
    zona: zonaDariGap(gapMinimum),
    skorAcuanTersedia: min !== null,
    peringatan,
  };
}

/**
 * Nilai formasi Pilihan 1 + Pilihan 2 terhadap aturan SOP.
 *
 * Aturan dari sheet SIMULATOR: Pilihan 1 boleh menantang (GAP -25 s/d 0),
 * Pilihan 2 WAJIB surplus (GAP >= 0 terhadap minimum).
 *
 * Fungsi ini TIDAK melarang -- keputusan tetap di siswa, orang tua, dan
 * pembimbing (blueprint §3D). Ia hanya menjelaskan konsekuensinya supaya
 * keputusan itu diambil dengan informasi utuh.
 *
 * @param {{gapMinimum: number|null}} p1
 * @param {{gapMinimum: number|null}} p2
 */
export function nilaiFormasi(p1, p2) {
  const catatan = [];
  const gap1 = p1?.gapMinimum ?? null;
  const gap2 = p2?.gapMinimum ?? null;

  if (gap1 === null || gap2 === null) {
    catatan.push('Formasi belum bisa dinilai lengkap karena salah satu pilihan tidak punya skor acuan atau skor siswa.');
  }

  // Pilihan 1 menantang masih diterima sampai batas Zona Kuning.
  if (gap1 !== null && gap1 < -25) {
    catatan.push(`Pilihan 1 berada di Zona Merah (selisih ${Math.round(gap1)}). SOP membolehkan Pilihan 1 menantang sampai selisih -25; di bawah itu peluangnya sangat kecil dan perlu gemblengan total.`);
  } else if (gap1 !== null && gap1 < 0) {
    catatan.push(`Pilihan 1 menantang (selisih ${Math.round(gap1)}) — masih dalam batas yang diterima SOP, asal Pilihan 2 aman.`);
  }

  // Pilihan 2 adalah jaring pengaman: wajib surplus.
  if (gap2 !== null && gap2 < 0) {
    catatan.push(`Pilihan 2 belum surplus (selisih ${Math.round(gap2)}). SOP mensyaratkan Pilihan 2 berada di Zona Hijau (selisih >= 0) sebagai cadangan aman. Formasi ini tidak punya jaring pengaman.`);
  } else if (gap2 !== null && gap2 < 25) {
    catatan.push(`Pilihan 2 aman tapi belum longgar (selisih ${Math.round(gap2)}). Sudah memenuhi syarat SOP; tambahan jarak membuat formasi lebih tahan guncangan.`);
  }

  const aman = gap1 !== null && gap2 !== null && gap1 >= -25 && gap2 >= 0;

  // Blueprint §3D mengizinkan sistem memberi kategori, TAPI "harus menjelaskan
  // dasar kategorinya". Formasi yang bagus tanpa penjelasan sama sekali membuat
  // siswa & orang tua menerima vonis tanpa bahan pertimbangan -- dan tidak ada
  // yang bisa diperiksa saat konsultasi. Jadi kasus positif pun wajib menyebut
  // dasarnya.
  if (aman && catatan.length === 0) {
    catatan.push(
      `Kedua pilihan memenuhi SOP: Pilihan 1 selisih ${Math.round(gap1)} terhadap skor acuan minimum `
      + `(batas menantang -25), Pilihan 2 selisih ${Math.round(gap2)} (syarat surplus >= 0).`,
    );
  }

  return {
    aman,
    // Label singkat untuk kartu, bukan vonis.
    label: gap1 === null || gap2 === null
      ? 'Belum bisa dinilai'
      : aman
        ? (gap2 >= 25 ? 'Formasi kuat' : 'Formasi memenuhi syarat')
        : (gap2 < 0 ? 'Tanpa cadangan aman' : 'Pilihan 1 terlalu jauh'),
    catatan,
  };
}

/**
 * Tren skor dari riwayat try out.
 *
 * 🔥 Blueprint §3E: "Perubahan status target tidak boleh dilakukan hanya
 * berdasarkan satu hasil try out yang belum tentu mewakili kemampuan siswa
 * secara konsisten." Maka fungsi ini MENOLAK menyimpulkan apa pun dari satu
 * atau dua titik data, dan mengatakannya terus terang.
 *
 * @param {Array<{tanggal?: any, skor: number}>} riwayat terlama -> terbaru
 * @param {number} minimalTitik jumlah titik minimum sebelum berani menyimpulkan
 */
export function nilaiTren(riwayat = [], minimalTitik = 3) {
  // Number(null) === 0 dan Number('') === 0 -- keduanya akan lolos
  // Number.isFinite dan ikut terhitung sebagai "skor 0", menyeret rata-rata
  // tren ke bawah. Disaring dengan angkaSah(), bukan Number().
  const titik = (Array.isArray(riwayat) ? riwayat : [])
    .filter((r) => angkaSah(r?.skor))
    .map((r) => ({ ...r, skor: Number(r.skor) }));

  if (titik.length < minimalTitik) {
    return {
      arah: 'belum_cukup_data',
      jumlahTitik: titik.length,
      deltaRataRata: null,
      deltaTerakhir: null,
      pesan: `Butuh minimal ${minimalTitik} hasil try out untuk menyimpulkan tren; sekarang ada ${titik.length}. Satu hasil belum mewakili kemampuan.`,
    };
  }

  const delta = [];
  for (let i = 1; i < titik.length; i += 1) delta.push(titik[i].skor - titik[i - 1].skor);
  const rata = delta.reduce((a, b) => a + b, 0) / delta.length;
  const terakhir = delta[delta.length - 1];

  let arah = 'stabil';
  if (rata >= 5) arah = 'meningkat';
  else if (rata <= -5) arah = 'menurun';

  const pesan = [];
  if (arah === 'meningkat') pesan.push(`Rata-rata naik ${rata.toFixed(1)} poin per try out.`);
  else if (arah === 'menurun') pesan.push(`Rata-rata turun ${Math.abs(rata).toFixed(1)} poin per try out.`);
  else pesan.push('Skor relatif stabil dalam rentang ini.');
  if (terakhir < 0) pesan.push('Hasil terakhir turun dari sebelumnya — periksa apakah ini fluktuasi wajar atau tanda materi perlu diulang.');

  return {
    arah,
    jumlahTitik: titik.length,
    deltaRataRata: Number(rata.toFixed(2)),
    deltaTerakhir: Number(terakhir.toFixed(2)),
    skorTerbaru: titik[titik.length - 1].skor,
    pesan: pesan.join(' '),
  };
}

export default {
  ZONA, MATRIKS_ZONA, angkaSah, zonaDariGap, bandingkanSkor, nilaiFormasi, nilaiTren,
};
