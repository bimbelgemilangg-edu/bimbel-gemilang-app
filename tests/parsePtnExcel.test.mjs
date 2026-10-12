// tests/parsePtnExcel.test.mjs — parser Excel database PTN
// ============================================================
//     node tests/parsePtnExcel.test.mjs
//
// KENAPA INI PENTING
// Fitur Rasionalisasi Kampus menyangkut keputusan siswa & orang tua tentang
// masa depan. Blueprint §3B melarang keras satu hal: "Data yang belum lengkap
// harus ditandai sebagai belum tersedia, BUKAN diisi dengan perkiraan yang
// seolah-olah resmi."
//
// Test di bawah ditulis dari MASALAH NYATA yang ditemukan di berkas sumber
// (Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026.xlsx), bukan dari kasus
// karangan. Setiap test menyebut baris/sheet asalnya supaya kalau suatu hari
// gagal, yang memeriksa tahu data mana yang berubah.
// ============================================================
import assert from 'node:assert/strict';
import {
  pisahkanWilayahKampus, parsePtnMaster, parseProdi, gabungkanProdi, parseSubtes,
  kunciGabungProdi,
} from '../src/utils/parsePtnExcel.js';
import { STATUS_DATA, bungkusAngka, sanggahanSkor } from '../src/utils/statusDataPtn.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('parsePtnExcel — parser database PTN');

// Baris contoh disalin dari bentuk aslinya di berkas sumber.
const barisNasional = (o = {}) => ({
  _baris: 5, ID_PRODI: 'UI-01', Kode_PTN: 'PTN-036', Nama_PTN: 'Universitas Indonesia',
  Wilayah: 'Jabodetabek', Bidang: 'Saintek', Nama_Prodi: 'Pendidikan Dokter', Jenjang: 'S1',
  Daya_Tampung_SNBT: 75, Peminat_SNBT: 3820, Keketatan_Persen: 75 / 3820,
  Skor_UTBK_Minimum: 715, Skor_UTBK_Rata_Rata: 742, Skor_UTBK_Maksimum: 785,
  Syarat_Khusus: 'Wajib Bebas Buta Warna Total',
  Subtes_Kunci: 'Penalaran Matematika & Pengetahuan Kuantitatif',
  Rekomendasi_Strategi: 'Pilihan 1 Prioritas Utama',
  ...o,
});

// ================================================== PENOLAKAN UNTUK MENEBAK
uji('INVARIAN: nilai di luar enum ditolak jadi null + dicatat, BUKAN ditebak', () => {
  // Kasus nyata baris 209 & 210 berkas sumber: kolom Bidang berisi 'S1'
  // (UNEJ Teknik Sipil & Teknik Kimia). Hampir pasti maksudnya 'Saintek',
  // tapi "hampir pasti" bukan dasar untuk menulis data.
  const { daftar, masalah } = parseProdi([barisNasional({ _baris: 209, Bidang: 'S1' })], {});
  assert.equal(daftar[0].bidang, null, 'bidang harus null, bukan Saintek hasil tebakan');
  const m = masalah.find((x) => x.baris === 209 && /Bidang/.test(x.pesan));
  assert.ok(m, 'harus ada catatan masalah yang menyebut nomor baris Excel');
  assert.equal(m.tingkat, 'error');
  assert.ok(/209/.test(String(m.baris)), 'pesan harus menuntun ke sel yang perlu diperbaiki');
});

uji('bidang sah tetap diterima dan dinormalkan kapitalisasinya', () => {
  for (const [masuk, keluar] of [['Saintek', 'Saintek'], ['saintek', 'Saintek'], ['SOSHUM', 'Soshum']]) {
    const { daftar, masalah } = parseProdi([barisNasional({ Bidang: masuk })], {});
    assert.equal(daftar[0].bidang, keluar, masuk);
    assert.equal(masalah.filter((m) => /Bidang/.test(m.pesan)).length, 0);
  }
});

uji('INVARIAN: angka yang hilang jadi null, TIDAK PERNAH 0', () => {
  // Blueprint: kosong = "belum tersedia", bukan angka yang menyamar.
  const { daftar } = parseProdi([barisNasional({
    Skor_UTBK_Minimum: null, Daya_Tampung_SNBT: '', Peminat_SNBT: undefined,
  })], {});
  const p = daftar[0];
  assert.equal(p.skorReferensi.minimum.nilai, null);
  assert.equal(p.skorReferensi.minimum.statusData, STATUS_DATA.BELUM_TERSEDIA);
  assert.equal(p.dayaTampung.nilai, null);
  assert.equal(p.peminat.nilai, null);
  assert.notEqual(p.dayaTampung.nilai, 0, '0 akan terbaca sebagai "daya tampungnya nol"');
});

// ============================================================ BARIS AGREGAT
uji('baris "Rata-rata / Total Keseluruhan" dibuang dari data, disimpan sebagai agregat', () => {
  // Baris 271 berkas sumber. Kalau ikut terimpor, ia menjadi "program studi"
  // bernama null dan merusak rata-rata apa pun yang dihitung dari koleksi.
  const agregatBaris = barisNasional({
    _baris: 271, ID_PRODI: 'Rata-rata / Total Keseluruhan', Nama_Prodi: null,
    Daya_Tampung_SNBT: 17745, Peminat_SNBT: 505870, Keketatan_Persen: 0.0454077,
  });
  const { daftar, agregat, masalah } = parseProdi([barisNasional(), agregatBaris], {});
  assert.equal(daftar.length, 1, 'hanya prodi sungguhan yang masuk daftar');
  assert.equal(daftar[0].id, 'UI-01');
  assert.ok(agregat, 'agregatnya harus disimpan, bukan dibuang begitu saja');
  assert.equal(agregat.totalDayaTampung, 17745);
  assert.ok(/bukan program studi/i.test(agregat.catatan));
  // Keketatan agregat di sumber adalah rata-rata rasio, bukan total/total.
  assert.ok(masalah.some((m) => /rata-rata rasio/.test(m.pesan)), 'perbedaan arti itu harus dicatat');
});

// ========================================================= WILAYAH vs KAMPUS
uji('"Jawa Timur (Kampus Jember)" dipecah jadi wilayah + kampus', () => {
  assert.deepEqual(pisahkanWilayahKampus('Jawa Timur (Kampus Jember)'),
    { wilayah: 'Jawa Timur', kampus: 'Kampus Jember' });
  assert.deepEqual(pisahkanWilayahKampus('Jabodetabek'), { wilayah: 'Jabodetabek', kampus: null });
  assert.deepEqual(pisahkanWilayahKampus(''), { wilayah: null, kampus: null });
  assert.deepEqual(pisahkanWilayahKampus(null), { wilayah: null, kampus: null });
});

uji('kurung yang BUKAN penanda kampus tidak dipecah (jangan merusak nama)', () => {
  // Prodi yang namanya memang berkampung, mis. "Keperawatan (Kampus Lumajang)"
  // ada di kolom NAMA, bukan Wilayah. Pemecah hanya dipakai untuk Wilayah.
  const { daftar } = parseProdi([barisNasional({ Wilayah: 'Sumatera (pindahan)' })], {});
  assert.equal(daftar[0].wilayah, 'Sumatera (pindahan)');
});

uji('sheet tanpa kolom Wilayah memakai wilayahDefault dari master, bukan null', () => {
  // Sheet UNEJ_76_PRODI_LENGKAP tidak punya kolom Wilayah sama sekali.
  const barisUnej = {
    _baris: 5, ID_UNEJ: 'UNEJ-01', Fakultas: 'Fakultas Kedokteran', Kampus: 'Kampus Jember',
    Jenjang: 'S1', Nama_Program_Studi: 'Pendidikan Dokter', Kelompok: 'Saintek',
    Daya_Tampung_SNBT: 60, Peminat_SNBT: 2980, Keketatan_Persen: 60 / 2980,
    Skor_UTBK_Minimum: 672, Skor_UTBK_Rata_Rata: 696, Skor_UTBK_Maksimum: 740,
    Syarat_Khusus: 'Wajib Bebas Buta Warna Total', Karakter_Pilihan: 'Pilihan 1 Prioritas Utama',
  };
  const { daftar } = parseProdi([barisUnej], {
    namaSheet: 'UNEJ', kodeKolomId: 'ID_UNEJ', kodeKolomNama: 'Nama_Program_Studi',
    wilayahDefault: 'Jawa Timur',
  });
  assert.equal(daftar[0].wilayah, 'Jawa Timur');
  assert.equal(daftar[0].kampus, 'Kampus Jember');
  assert.equal(daftar[0].bidang, 'Saintek', 'kolom Kelompok dibaca sebagai Bidang');
});

// ============================================================ JALUR SELEKSI
uji('PTKIN ditandai sebagai jalur di luar SNBT, bukan diimpor diam-diam', () => {
  // 31 dari 157 baris PTN_MASTER_NASIONAL berbentuk PTKIN (UIN/IAIN/STAIN).
  // Jalurnya SPAN-PTKIN & UM-PTKIN, bukan SNBT -- angka "skor UTBK" untuk
  // prodi PTKIN tidak berarti apa-apa.
  const { daftar, masalah } = parsePtnMaster([
    { _baris: 5, ID_PTN: 'PTN-001', Nama_PTN: 'UIN X', Bentuk_PTN: 'PTKIN', Klaster_Keketatan: 'Klaster Keagamaan' },
    { _baris: 6, ID_PTN: 'PTN-002', Nama_PTN: 'Universitas Y', Bentuk_PTN: 'Universitas', Klaster_Keketatan: 'Klaster 1' },
  ]);
  assert.equal(daftar[0].jalurSeleksi, 'di_luar_snbt');
  assert.ok(daftar[0].catatanJalur.length > 0);
  assert.equal(daftar[1].jalurSeleksi, 'snbt');
  assert.ok(masalah.some((m) => m.id === 'PTN-001' && /SPAN-PTKIN/.test(m.pesan)));
});

uji('INVARIAN: klaster dari sumber disimpan apa adanya, tidak diratakan', () => {
  // Sheet master punya 7 nilai klaster; sheet dashboard memakai 4 klaster
  // dengan anggota yang BERBEDA (USU & UNAND "Klaster 1" di master, tapi
  // dashboard menyebut Klaster 1 hanya UI/ITB/UGM/UNAIR/ITS). Meratakan
  // salah satunya berarti mengarang taksonomi.
  const { daftar } = parsePtnMaster([
    { _baris: 5, ID_PTN: 'PTN-007', Nama_PTN: 'USU', Bentuk_PTN: 'Universitas', Klaster_Keketatan: 'Klaster 1' },
    { _baris: 6, ID_PTN: 'PTN-036', Nama_PTN: 'UI', Bentuk_PTN: 'Universitas', Klaster_Keketatan: 'Klaster 1' },
  ]);
  assert.equal(daftar[0].klasterKeketatanSumber, 'Klaster 1');
  assert.equal(daftar[1].klasterKeketatanSumber, 'Klaster 1');
  assert.equal(daftar[0].klasterKeketatan, undefined, 'tidak boleh ada klaster hasil bikinan parser');
});

// ======================================================= PELACAKAN SUMBER
uji('INVARIAN: skor tanpa sumber/tanggal tidak pernah menyandang status terverifikasi', () => {
  // Ini penjaga terpenting berkas ini. Panitia SNPMB tidak mengumumkan
  // passing grade per prodi, jadi setiap "Skor_UTBK_Minimum" dari berkas
  // mana pun pasti estimasi. Parser tidak punya kuasa untuk menaikannya
  // jadi 'terverifikasi'.
  const { daftar } = parseProdi([barisNasional()], {});
  const s = daftar[0].skorReferensi.minimum;
  assert.equal(s.nilai, 715, 'nilainya tetap disimpan -- menyembunyikannya tidak membantu siapa pun');
  assert.equal(s.statusData, STATUS_DATA.BELUM_VERIFIKASI);
  assert.equal(s.resmi, false);
  assert.equal(s.sumberUrl, null);
  assert.ok(/xlsx/.test(s.sumber), 'harus jelas angka ini datang dari berkas Excel');
});

uji('bungkusAngka baru bisa terverifikasi bila sumber resmi + URL + tanggal lengkap', () => {
  const belum = bungkusAngka(700, { resmi: true, sumberUrl: 'https://x', diambilPada: null });
  assert.equal(belum.statusData, STATUS_DATA.BELUM_VERIFIKASI);
  const setengah = bungkusAngka(700, { resmi: false, sumberUrl: 'https://x', diambilPada: '2026-10-10' });
  assert.equal(setengah.statusData, STATUS_DATA.BELUM_VERIFIKASI);
  const lengkap = bungkusAngka(700, { resmi: true, sumberUrl: 'https://x', diambilPada: '2026-10-10' });
  assert.equal(lengkap.statusData, STATUS_DATA.TERVERIFIKASI);
});

uji('sanggahan menyebut tiga hal yang dilarang blueprint', () => {
  const t = sanggahanSkor();
  assert.match(t, /estimasi/i, 'harus mengaku estimasi');
  assert.match(t, /bukan passing grade resmi/i, 'harus menolak label passing grade');
  assert.match(t, /tidak otomatis setara/i, 'harus memisahkan skor TO internal dari UTBK');
});

uji('catatan editorial penyusun Excel dipisah dari data fakta', () => {
  // Kolom Rekomendasi_Strategi berisi 24 label bebas ("Pilihan 2 Sangat Kuat",
  // "Cadangan Aman Banyuwangi", ...). Itu opini penyusun, bukan data.
  const { daftar } = parseProdi([barisNasional({ Rekomendasi_Strategi: 'Pilihan 2 Sangat Kuat' })], {});
  assert.equal(daftar[0].catatanPenyusun, 'Pilihan 2 Sangat Kuat');
  assert.equal(daftar[0].rekomendasi, undefined, 'tidak boleh menyamar jadi field rekomendasi sistem');
  assert.equal(daftar[0].statusKelolosan, undefined);
});

// ============================================================== INTEGRITAS
uji('keketatan dihitung ulang dari tampung/peminat bila berkasnya tidak cocok', () => {
  const { daftar, masalah } = parseProdi([barisNasional({
    Daya_Tampung_SNBT: 75, Peminat_SNBT: 3820, Keketatan_Persen: 0.9,
  })], {});
  assert.ok(Math.abs(daftar[0].keketatan - 75 / 3820) < 1e-9);
  assert.ok(masalah.some((m) => /Keketatan/.test(m.pesan)));
});

uji('skor tidak berurutan (min > maks) dicatat sebagai error', () => {
  const { masalah } = parseProdi([barisNasional({
    Skor_UTBK_Minimum: 780, Skor_UTBK_Rata_Rata: 742, Skor_UTBK_Maksimum: 715,
  })], {});
  assert.ok(masalah.some((m) => m.tingkat === 'error' && /tidak berurutan/.test(m.pesan)));
});

uji('ID kembar: yang kedua dilewati dan dicatat', () => {
  const { daftar, masalah } = parseProdi([barisNasional(), barisNasional({ _baris: 9 })], {});
  assert.equal(daftar.length, 1);
  assert.ok(masalah.some((m) => /kembar/.test(m.pesan)));
});

uji('prodi tanpa nama dilewati (jangan simpan dokumen kosong)', () => {
  const { daftar, masalah } = parseProdi([barisNasional({ Nama_Prodi: '   ' })], {});
  assert.equal(daftar.length, 0);
  assert.ok(masalah.some((m) => /Nama program studi kosong/.test(m.pesan)));
});

uji('website PTN yang dipakai dua institusi dicurigai salah tempel', () => {
  // Kasus nyata: 157 baris master hanya punya 149 Website_Resmi unik.
  const { masalah } = parsePtnMaster([
    { _baris: 5, ID_PTN: 'PTN-001', Nama_PTN: 'A', Website_Resmi: 'https://sama.ac.id', Bentuk_PTN: 'Universitas' },
    { _baris: 6, ID_PTN: 'PTN-002', Nama_PTN: 'B', Website_Resmi: 'https://sama.ac.id', Bentuk_PTN: 'Politeknik' },
  ]);
  assert.ok(masalah.some((m) => /salah tempel/.test(m.pesan)));
});

// ================================================================ PENGGABUNGAN
uji('76 prodi UNEJ yang ada di dua sheet digabung, bukan diduplikasi', () => {
  const utama = [
    parseProdi([barisNasional({ ID_PRODI: 'UNEJ-01', Kode_PTN: 'PTN-077', Nama_PTN: 'Universitas Jember', Nama_Prodi: 'Pendidikan Dokter', Wilayah: 'Jawa Timur (Kampus Jember)',
      Skor_UTBK_Minimum: 672, Skor_UTBK_Rata_Rata: 696, Skor_UTBK_Maksimum: 740,
      Daya_Tampung_SNBT: 60, Peminat_SNBT: 2980 })], {}).daftar[0],
  ];
  const tambahan = [
    parseProdi([{
      _baris: 5, ID_UNEJ: 'UNEJ-01', Fakultas: 'Fakultas Kedokteran', Kampus: 'Kampus Jember',
      Jenjang: 'S1', Nama_Program_Studi: 'Pendidikan Dokter', Kelompok: 'Saintek',
      Daya_Tampung_SNBT: 60, Peminat_SNBT: 2980, Skor_UTBK_Minimum: 672,
      Skor_UTBK_Rata_Rata: 696, Skor_UTBK_Maksimum: 740,
    }], { kodeKolomId: 'ID_UNEJ', kodeKolomNama: 'Nama_Program_Studi', wilayahDefault: 'Jawa Timur' }).daftar[0],
  ];
  // Sheet UNEJ tidak punya kolom Kode_PTN, jadi idPtn diisi dari sheet nasional
  // lewat ID_UNEJ yang sama -- dilakukan SETELAH parse, bukan di baris mentah.
  tambahan[0].idPtn = 'PTN-077';
  const { daftar, masalah } = gabungkanProdi(utama, tambahan);
  assert.equal(daftar.length, 1, 'tidak boleh jadi dua dokumen');
  assert.equal(daftar[0].fakultas, 'Fakultas Kedokteran', 'diperkaya dari sheet UNEJ');
  assert.equal(daftar[0].kampus, 'Kampus Jember');
  assert.equal(daftar[0].skorReferensi.minimum.nilai, 672, 'nilai sheet utama dipertahankan');
  assert.equal(masalah.length, 0, 'audit menemukan kedua sheet sepakat untuk 76 prodi ini');
});

uji('INVARIAN: kalau dua sheet TIDAK sepakat, dikonflikkan secara terbuka', () => {
  const utama = [parseProdi([barisNasional({ Nama_Prodi: 'Farmasi', Skor_UTBK_Minimum: 675 })], {}).daftar[0]];
  const tambahan = [parseProdi([{
    _baris: 7, ID_UNEJ: 'X-03', Nama_Program_Studi: 'Farmasi', Jenjang: 'S1', Kelompok: 'Saintek',
    Daya_Tampung_SNBT: 65, Peminat_SNBT: 1850, Skor_UTBK_Minimum: 642,
    Skor_UTBK_Rata_Rata: 668, Skor_UTBK_Maksimum: 708,
  }], { kodeKolomId: 'ID_UNEJ', kodeKolomNama: 'Nama_Program_Studi' }).daftar[0]];
  tambahan[0].idPtn = 'PTN-036'; // PTN yang sama -> memang harus berbenturan
  const { masalah } = gabungkanProdi(utama, tambahan);
  assert.ok(masalah.some((m) => m.tingkat === 'error' && /beda antar sheet/.test(m.pesan)),
    'perbedaan antar sumber harus muncul sebagai error, bukan dipilih diam-diam');
});

uji('prodi yang hanya ada di sheet tambahan tetap ikut', () => {
  const utama = [parseProdi([barisNasional()], {}).daftar[0]];
  const tambahan = [parseProdi([{
    _baris: 9, ID_UNEJ: 'Z-01', Nama_Program_Studi: 'Prodi Langka', Jenjang: 'D3', Kelompok: 'Soshum',
  }], { kodeKolomId: 'ID_UNEJ', kodeKolomNama: 'Nama_Program_Studi' }).daftar[0]];
  const { daftar } = gabungkanProdi(utama, tambahan);
  assert.equal(daftar.length, 2);
  assert.ok(daftar.some((d) => d.namaProdi === 'Prodi Langka'));
});

// ================================================================== SUBTES
uji('baris TOTAL di sheet subtes dibuang; 7 subtes tersimpan', () => {
  const baris = [
    { _baris: 5, No: 1, 'Kelompok Tes': 'TPS', 'Nama Subtes': 'Penalaran Umum (PU)', 'Jumlah Soal': 30, 'Waktu (Menit)': 30, 'Kecepatan Rata2 (Detik/Soal)': 60 },
    { _baris: 6, No: 2, 'Kelompok Tes': 'TPS', 'Nama Subtes': 'Pengetahuan Kuantitatif (PK)', 'Jumlah Soal': 20, 'Waktu (Menit)': 20, 'Kecepatan Rata2 (Detik/Soal)': 60 },
    { _baris: 12, No: null, 'Kelompok Tes': 'TOTAL', 'Nama Subtes': '7 Subtes UTBK Lengkap', 'Jumlah Soal': 155, 'Waktu (Menit)': 195, 'Kecepatan Rata2 (Detik/Soal)': 75.4 },
  ];
  const { daftar } = parseSubtes(baris);
  assert.equal(daftar.length, 2);
  assert.ok(!daftar.some((d) => /TOTAL/i.test(d.nama)));
});

uji('kecepatan detik/soal yang tidak konsisten dengan jumlah & waktu dicatat', () => {
  const { masalah } = parseSubtes([{
    _baris: 5, No: 1, 'Nama Subtes': 'X', 'Jumlah Soal': 20, 'Waktu (Menit)': 30,
    'Kecepatan Rata2 (Detik/Soal)': 60, // seharusnya 90
  }]);
  assert.ok(masalah.some((m) => /dtk\/soal/.test(m.pesan)));
});


// 🔥 REGRESI NYATA (2026-10-10). Konversi perdana mencocokkan dua sheet
// berdasar NAMA PRODI SAJA. Sheet nasional memuat 266 prodi dari 32 PTN dan
// 34 nama muncul lebih dari sekali lintas PTN ("Pendidikan Dokter" di 8 PTN,
// "Farmasi" di 13). Hasilnya: Kedokteran UI diperkaya dengan Fakultas
// Kedokteran UNEJ dan "Kampus Jember", plus 164 laporan konflik palsu.
// Test ini yang memastikan bug itu tidak bisa kembali.
uji('REGRESI: prodi bernama sama di PTN berbeda TIDAK saling mencemari', () => {
  const uiKedokteran = parseProdi([barisNasional({
    ID_PRODI: 'UI-01', Kode_PTN: 'PTN-036', Nama_PTN: 'Universitas Indonesia',
    Nama_Prodi: 'Pendidikan Dokter', Wilayah: 'Jabodetabek',
    Skor_UTBK_Minimum: 715, Daya_Tampung_SNBT: 75,
  })], {}).daftar[0];
  const unpadKedokteran = parseProdi([barisNasional({
    ID_PRODI: 'UNPAD-01', Kode_PTN: 'PTN-045', Nama_PTN: 'Universitas Padjadjaran',
    Nama_Prodi: 'Pendidikan Dokter', Wilayah: 'Jawa Barat',
    Skor_UTBK_Minimum: 700, Daya_Tampung_SNBT: 70,
  })], {}).daftar[0];
  const unejKedokteran = parseProdi([{
    _baris: 5, ID_UNEJ: 'UNEJ-01', Fakultas: 'Fakultas Kedokteran', Kampus: 'Kampus Jember',
    Jenjang: 'S1', Nama_Program_Studi: 'Pendidikan Dokter', Kelompok: 'Saintek',
    Daya_Tampung_SNBT: 60, Peminat_SNBT: 2980, Skor_UTBK_Minimum: 672,
    Skor_UTBK_Rata_Rata: 696, Skor_UTBK_Maksimum: 740,
  }], { kodeKolomId: 'ID_UNEJ', kodeKolomNama: 'Nama_Program_Studi', wilayahDefault: 'Jawa Timur' }).daftar[0];
  unejKedokteran.idPtn = 'PTN-077'; // diisi dari sheet nasional lewat ID_UNEJ

  assert.equal(uiKedokteran.namaProdi, unpadKedokteran.namaProdi, 'prasyarat: namanya memang sama');
  const { daftar, masalah } = gabungkanProdi([uiKedokteran, unpadKedokteran], [unejKedokteran]);

  assert.equal(daftar.length, 3, 'ketiganya institusi berbeda -> tiga dokumen');
  const ui = daftar.find((d) => d.id === 'UI-01');
  assert.equal(ui.fakultas, null, 'UI tidak boleh mewarisi Fakultas Kedokteran UNEJ');
  assert.notEqual(ui.kampus, 'Kampus Jember', 'UI berada di Jabodetabek, bukan Jember');
  assert.equal(ui.skorReferensi.minimum.nilai, 715, 'skor UI tidak boleh tertukar skor UNEJ');
  assert.equal(ui.wilayah, 'Jabodetabek');
  assert.equal(masalah.filter((m) => /beda antar sheet/.test(m.pesan)).length, 0,
    'tidak boleh ada konflik palsu');
});

uji('REGRESI: baris tambahan tanpa idPtn tidak dicocokkan dengan menebak', () => {
  const utama = [parseProdi([barisNasional({ Nama_Prodi: 'Farmasi' })], {}).daftar[0]];
  const yatim = parseProdi([{
    _baris: 7, ID_UNEJ: 'X-01', Nama_Program_Studi: 'Farmasi', Jenjang: 'S1', Kelompok: 'Saintek',
  }], { kodeKolomId: 'ID_UNEJ', kodeKolomNama: 'Nama_Program_Studi' }).daftar[0];
  assert.equal(yatim.idPtn, null);
  const { daftar, masalah } = gabungkanProdi(utama, [yatim]);
  assert.equal(daftar.length, 2, 'disimpan terpisah, bukan digabung berdasar nama');
  assert.ok(masalah.some((m) => /idPtn kosong/.test(m.pesan)), 'harus dilaporkan, bukan didiamkan');
});

uji('kunciGabungProdi tidak peka huruf besar/kecil & spasi', () => {
  assert.equal(
    kunciGabungProdi({ idPtn: ' PTN-077 ', namaProdi: 'Pendidikan Dokter' }),
    kunciGabungProdi({ idPtn: 'ptn-077', namaProdi: 'pendidikan dokter' }),
  );
  assert.notEqual(
    kunciGabungProdi({ idPtn: 'PTN-036', namaProdi: 'Farmasi' }),
    kunciGabungProdi({ idPtn: 'PTN-077', namaProdi: 'Farmasi' }),
  );
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
