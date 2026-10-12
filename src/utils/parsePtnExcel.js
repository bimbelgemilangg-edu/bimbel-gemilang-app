// src/utils/parsePtnExcel.js
// ============================================================
// Ubah baris mentah Excel "Database Riset PTN" menjadi dokumen siap simpan
// untuk koleksi `ptn` + subkoleksi `prodi`. Logika murni: TIDAK membaca
// berkas, TIDAK menyentuh Firestore — jadi bisa diuji.
//
// Yang membaca .xlsx-nya adalah scripts/bangun-impor-ptn.mjs; yang menulis ke
// Firestore nanti panel admin. Dipisah begini mengikuti pola repo: builder di
// scripts/ menghasilkan JSON, logika yang bisa salah ditaruh di utils/ supaya
// ada testnya.
//
// 🔥 PRINSIP YANG TIDAK BOLEH DILEMAHKAN
// Blueprint §3B: "Data yang belum lengkap harus ditandai sebagai belum
// tersedia, BUKAN diisi dengan perkiraan yang seolah-olah resmi."
//
// Maka parser ini TIDAK PERNAH menebak. Contoh nyata dari berkas sumber
// (Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026.xlsx):
//
//   - Baris 209 & 210 (UNEJ Teknik Sipil & Teknik Kimia) kolom `Bidang`
//     berisi 'S1' — jelas salah tempat, seharusnya 'Saintek'. Parser ini
//     MENOLAK nilai itu dan mencatatnya sebagai masalah, bukan diam-diam
//     mengisi 'Saintek' walau "sudah pasti maksudnya itu".
//   - `Wilayah` bercampur dengan nama kampus ("Jawa Timur (Kampus Jember)").
//     Dipisah jadi wilayah + kampus, dan sisanya yang tidak cocok pola
//     dibiarkan apa adanya + dicatat.
//   - `Klaster_Keketatan` di sheet master punya 7 nilai berbeda, sementara
//     sheet dashboard memakai 4 klaster dengan anggota yang BERBEDA pula
//     (USU & UNAND "Klaster 1" di master, tapi dashboard menyebut Klaster 1
//     hanya UI/ITB/UGM/UNAIR/ITS). Dua taksonomi yang saling bertentangan
//     disimpan APA ADANYA di field terpisah, tidak diratakan.
//   - Baris "Rata-rata / Total Keseluruhan" adalah TOTAL, bukan prodi.
//     Dibuang dari data, angkanya disimpan terpisah sebagai agregat.
//
// Setiap baris yang bermasalah masuk ke `masalah[]` dengan nomor baris Excel
// aslinya, supaya yang memperbaiki tahu harus membuka sel mana.
// ============================================================

import { STATUS_DATA, bungkusAngka } from './statusDataPtn.js';

/** Sumber default untuk angka yang datang dari berkas Excel tanpa kolom sumber. */
export const SUMBER_EXCEL = {
  nama: 'Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026.xlsx',
  // Sengaja null: berkas sumbernya TIDAK punya kolom tautan per baris.
  // Mengisi URL portal SNPMB ke sini akan membuat angka estimasi terlihat
  // seperti data resmi — persis yang dilarang blueprint.
  url: null,
  resmi: false,
};

export const BIDANG_SAH = ['saintek', 'soshum'];
export const JENJANG_SAH = ['s1', 'd3', 'd4', 's2', 's3', 'd1', 'd2'];

/** Bentuk_PTN yang jalurnya BUKAN SNBT/UTBK. */
export const BENTUK_DI_LUAR_SNBT = {
  // PTKIN (UIN/IAIN/STAIN) diseleksi lewat SPAN-PTKIN (rapor) dan UM-PTKIN
  // (SSE), bukan SNBT. Angka "Skor UTBK" untuk prodi PTKIN tidak berarti
  // apa-apa, jadi barisnya wajib ditandai, bukan diimpor diam-diam.
  PTKIN: 'Jalur masuk PTKIN adalah SPAN-PTKIN & UM-PTKIN, bukan SNBT/UTBK',
};

const norm = (s) => String(s ?? '').trim();
const hurufKecil = (s) => norm(s).toLowerCase();

function angka(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.,-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function bulat(v) {
  const n = angka(v);
  return n === null ? null : Math.round(n);
}

/** 'Jawa Timur (Kampus Jember)' -> { wilayah: 'Jawa Timur', kampus: 'Kampus Jember' } */
export function pisahkanWilayahKampus(mentah) {
  const t = norm(mentah);
  if (!t) return { wilayah: null, kampus: null };
  const m = t.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (m && /kampus/i.test(m[2])) {
    return { wilayah: norm(m[1]) || null, kampus: norm(m[2]) };
  }
  return { wilayah: t, kampus: null };
}

/**
 * Parse sheet PTN_MASTER_NASIONAL.
 * @param {object[]} baris tiap entri = { _baris, ...kolom sesuai header }
 */
export function parsePtnMaster(baris = []) {
  const masalah = [];
  const daftar = [];
  const lihatWebsite = new Map();

  for (const b of baris) {
    const id = norm(b.ID_PTN);
    if (!id) { masalah.push({ baris: b._baris, tingkat: 'error', pesan: 'ID_PTN kosong' }); continue; }
    if (/rata-?rata|total keseluruhan/i.test(id)) continue; // baris agregat

    const bentuk = norm(b.Bentuk_PTN);
    const catatanJalur = [];
    if (BENTUK_DI_LUAR_SNBT[bentuk]) {
      catatanJalur.push(BENTUK_DI_LUAR_SNBT[bentuk]);
      masalah.push({
        baris: b._baris, tingkat: 'peringatan', id,
        pesan: `${bentuk}: ${BENTUK_DI_LUAR_SNBT[bentuk]}`,
      });
    }

    const web = norm(b.Website_Resmi);
    if (web) {
      if (lihatWebsite.has(web)) {
        masalah.push({
          baris: b._baris, tingkat: 'peringatan', id,
          pesan: `Website_Resmi "${web}" dipakai juga oleh ${lihatWebsite.get(web)} — periksa apakah salah tempel`,
        });
      } else {
        lihatWebsite.set(web, id);
      }
    }

    daftar.push({
      id,
      nama: norm(b.Nama_PTN) || null,
      singkatan: norm(b.Singkatan) || null,
      provinsi: norm(b.Provinsi) || null,
      wilayahBesar: norm(b.Wilayah_Besar) || null,
      bentukPtn: bentuk || null,
      // Disimpan apa adanya. TIDAK dinormalkan ke taksonomi dashboard karena
      // keduanya bertentangan (lihat kepala berkas) — meratakan salah satunya
      // berarti mengarang.
      klasterKeketatanSumber: norm(b.Klaster_Keketatan) || null,
      websiteResmi: web || null,
      // Berkas sumber mengisi kolom ini dengan SATU URL yang sama untuk
      // seluruh 157 baris. Itu URL portal, bukan sumber per-institusi, jadi
      // disimpan sebagai portal rujukan — bukan sebagai bukti verifikasi.
      portalDayaTampung: norm(b.URL_SNPMB) || null,
      jalurSeleksi: catatanJalur.length ? 'di_luar_snbt' : 'snbt',
      catatanJalur: catatanJalur.length ? catatanJalur : [],
      statusData: STATUS_DATA.BELUM_VERIFIKASI,
      asalData: SUMBER_EXCEL.nama,
    });
  }
  return { daftar, masalah };
}

/**
 * Parse sheet prodi (TARGET_SKOR_PRODI_NASIONAL atau UNEJ_76_PRODI_LENGKAP).
 * Kedua sheet punya kolom yang sedikit berbeda; pemetaan namanya di sini.
 *
 * @param {object[]} baris
 * @param {object} o
 * @param {string} o.namaSheet     untuk pesan masalah & jejak asal
 * @param {string} o.kodeKolomId   'ID_PRODI' | 'ID_UNEJ'
 * @param {string} o.kodeKolomNama 'Nama_Prodi' | 'Nama_Program_Studi'
 * @param {number|null} o.tahunSeleksi
 */
export function parseProdi(baris = [], o = {}) {
  const {
    namaSheet = 'prodi',
    kodeKolomId = 'ID_PRODI',
    kodeKolomNama = 'Nama_Prodi',
    tahunSeleksi = null,
    // Sheet UNEJ tidak punya kolom Wilayah sama sekali (hanya Kampus). Tanpa
    // default ini, seluruh prodi UNEJ akan tersimpan dengan wilayah null --
    // padahal PTN induknya jelas berada di Jawa Timur menurut sheet master.
    // Nilainya berasal dari PTN_MASTER_NASIONAL, bukan karangan.
    wilayahDefault = null,
  } = o;
  const masalah = [];
  const daftar = [];
  let agregat = null;
  const idTerlihat = new Map();

  for (const b of baris) {
    const id = norm(b[kodeKolomId]);
    if (!id) { masalah.push({ baris: b._baris, sheet: namaSheet, tingkat: 'error', pesan: `${kodeKolomId} kosong` }); continue; }

    // Baris TOTAL ikut tersimpan di sheet yang sama dengan data. Kalau tidak
    // dibuang, ia akan muncul sebagai "program studi" bernama null dan
    // merusak rata-rata apa pun yang dihitung dari koleksi ini.
    if (/rata-?rata|total keseluruhan/i.test(id)) {
      agregat = {
        sheet: namaSheet,
        label: id,
        totalDayaTampung: bulat(b.Daya_Tampung_SNBT),
        totalPeminat: bulat(b.Peminat_SNBT),
        keketatanRataRata: angka(b.Keketatan_Persen),
        skorMinimumRataRata: angka(b.Skor_UTBK_Minimum),
        catatan: 'Baris agregat dari berkas sumber, BUKAN program studi. Disimpan terpisah.',
      };
      // Agregat di berkas sumber menghitung keketatan sebagai rata-rata rasio,
      // bukan total/total. Keduanya beda arti; dicatat supaya tidak dipakai
      // bergantian tanpa sadar.
      const t = bulat(b.Daya_Tampung_SNBT);
      const p = bulat(b.Peminat_SNBT);
      const k = angka(b.Keketatan_Persen);
      if (t && p && k !== null && Math.abs(k - t / p) > 0.0005) {
        masalah.push({
          baris: b._baris, sheet: namaSheet, tingkat: 'peringatan', id,
          pesan: `Keketatan agregat ${k.toFixed(4)} != tampung/peminat ${(t / p).toFixed(4)} — berkas sumber memakai rata-rata rasio, bukan rasio total`,
        });
      }
      continue;
    }

    if (idTerlihat.has(id)) {
      masalah.push({
        baris: b._baris, sheet: namaSheet, tingkat: 'error', id,
        pesan: `ID kembar dengan baris ${idTerlihat.get(id)} — baris ini dilewati`,
      });
      continue;
    }
    idTerlihat.set(id, b._baris);

    const namaProdi = norm(b[kodeKolomNama]) || null;
    if (!namaProdi) {
      masalah.push({ baris: b._baris, sheet: namaSheet, tingkat: 'error', id, pesan: 'Nama program studi kosong — baris dilewati' });
      continue;
    }

    // ---- jenjang ----
    const jenjang = norm(b.Jenjang) || null;
    if (jenjang && !JENJANG_SAH.includes(hurufKecil(jenjang))) {
      masalah.push({ baris: b._baris, sheet: namaSheet, tingkat: 'peringatan', id, pesan: `Jenjang tak dikenal: "${jenjang}"` });
    }

    // ---- bidang / kelompok ----
    // Dua sheet memakai nama kolom berbeda untuk hal yang sama.
    const bidangMentah = norm(b.Bidang ?? b.Kelompok) || null;
    let bidang = null;
    if (bidangMentah) {
      if (BIDANG_SAH.includes(hurufKecil(bidangMentah))) {
        bidang = hurufKecil(bidangMentah) === 'saintek' ? 'Saintek' : 'Soshum';
      } else {
        // JANGAN ditebak. Kasus nyata: baris 209-210 berkas sumber berisi 'S1'
        // di kolom Bidang — hampir pasti salah tempel, tapi "hampir pasti"
        // bukan dasar untuk menulis data.
        masalah.push({
          baris: b._baris, sheet: namaSheet, tingkat: 'error', id,
          pesan: `Bidang "${bidangMentah}" bukan Saintek/Soshum (kemungkinan salah kolom) — disimpan sebagai null, perlu perbaikan di sumber`,
        });
      }
    }

    // ---- wilayah vs kampus ----
    const { wilayah: wilayahPecahan, kampus: kampusPecahan } = pisahkanWilayahKampus(b.Wilayah);
    const wilayah = wilayahPecahan || (norm(b.Wilayah) ? null : wilayahDefault) || null;
    const kampus = norm(b.Kampus) || kampusPecahan || null;

    // ---- angka ----
    const tampung = bulat(b.Daya_Tampung_SNBT);
    const peminat = bulat(b.Peminat_SNBT);
    const keketatanBerkas = angka(b.Keketatan_Persen);
    const keketatanHitung = tampung && peminat ? tampung / peminat : null;
    if (keketatanBerkas !== null && keketatanHitung !== null
      && Math.abs(keketatanBerkas - keketatanHitung) > 0.0005) {
      masalah.push({
        baris: b._baris, sheet: namaSheet, tingkat: 'peringatan', id,
        pesan: `Keketatan ${keketatanBerkas.toFixed(4)} tidak sama dengan tampung/peminat ${keketatanHitung.toFixed(4)} — dipakai hasil hitung ulang`,
      });
    }

    const min = angka(b.Skor_UTBK_Minimum);
    const rata = angka(b.Skor_UTBK_Rata_Rata);
    const maks = angka(b.Skor_UTBK_Maksimum);
    if (min !== null && rata !== null && maks !== null && !(min <= rata && rata <= maks)) {
      masalah.push({
        baris: b._baris, sheet: namaSheet, tingkat: 'error', id,
        pesan: `Skor tidak berurutan: min ${min} / rata2 ${rata} / maks ${maks}`,
      });
    }

    const bungkusSkor = (v, jenis) => bungkusAngka(v, {
      sumber: `${SUMBER_EXCEL.nama} · ${namaSheet} · kolom ${jenis}`,
      sumberUrl: SUMBER_EXCEL.url,
      diambilPada: null, // berkas sumber tidak mencantumkan tanggal pengambilan
      resmi: SUMBER_EXCEL.resmi,
      tahunSeleksi,
    });

    daftar.push({
      id,
      idPtn: norm(b.Kode_PTN) || null,
      namaPtn: norm(b.Nama_PTN) || null,
      namaProdi,
      jenjang,
      bidang,
      wilayah,
      kampus,
      fakultas: norm(b.Fakultas) || null,
      dayaTampung: bungkusAngka(tampung, {
        sumber: `${SUMBER_EXCEL.nama} · ${namaSheet}`,
        // Daya tampung & peminat MEMANG dipublikasikan resmi oleh SNPMB, tapi
        // berkas sumber tidak menyebut tahunnya. Jadi statusnya tetap belum
        // terverifikasi sampai ada yang mengecek ke portal dan mengisi tanggal.
        sumberUrl: SUMBER_EXCEL.url,
        diambilPada: null,
        resmi: false,
        tahunSeleksi,
      }),
      peminat: bungkusAngka(peminat, {
        sumber: `${SUMBER_EXCEL.nama} · ${namaSheet}`,
        sumberUrl: SUMBER_EXCEL.url,
        diambilPada: null,
        resmi: false,
        tahunSeleksi,
      }),
      keketatan: keketatanHitung ?? keketatanBerkas,
      skorReferensi: {
        minimum: bungkusSkor(min, 'Skor_UTBK_Minimum'),
        rataRata: bungkusSkor(rata, 'Skor_UTBK_Rata_Rata'),
        maksimum: bungkusSkor(maks, 'Skor_UTBK_Maksimum'),
      },
      syaratKhusus: norm(b.Syarat_Khusus) || null,
      subtesKunci: norm(b.Subtes_Kunci) || null,
      // Kolom ini berisi 24 label editorial bebas ("Pilihan 2 Sangat Kuat",
      // "Cadangan Aman Banyuwangi", ...). Itu opini penyusun berkas, bukan
      // data — disimpan di field terpisah yang jelas namanya supaya tidak
      // pernah ditampilkan sebagai fakta.
      catatanPenyusun: norm(b.Rekomendasi_Strategi ?? b.Karakter_Pilihan) || null,
      statusData: STATUS_DATA.BELUM_VERIFIKASI,
      asalData: { sheet: namaSheet, barisExcel: b._baris, berkas: SUMBER_EXCEL.nama },
    });
  }
  return { daftar, masalah, agregat };
}

/**
 * Kunci pencocokan antar sheet: (idPtn, namaProdi).
 *
 * 🔥 JANGAN dippersempit jadi namaProdi saja. Sheet nasional memuat 266 prodi
 * dari 32 PTN, dan 34 nama prodi muncul lebih dari sekali LINTAS PTN
 * ("Pendidikan Dokter" ada di 8 PTN berbeda, "Farmasi" di 13). Pencocokan
 * berdasar nama saja membuat prodi UI diperkaya data UNEJ — fakultas & kampus
 * jadi salah institusi, dan 164 "konflik" palsu dilaporkan. Bug ini BENAR-BENAR
 * terjadi pada konversi perdana 2026-10-10 dan tertangkap oleh laporannya
 * sendiri; tests/parsePtnExcel.test.mjs kini menguncinya.
 */
export function kunciGabungProdi(p) {
  return `${hurufKecil(p?.idPtn)}|${hurufKecil(p?.namaProdi)}`;
}

/**
 * Gabungkan prodi dari dua sheet yang tumpang tindih.
 *
 * Berkas sumber menyimpan 76 prodi UNEJ dua kali: di sheet nasional (sebagai
 * bagian dari 266 prodi) dan di sheet khusus UNEJ (dengan kolom Fakultas &
 * Kampus tambahan). Diperiksa saat audit: untuk 76 prodi yang beririsan, skor
 * dan daya tampungnya COCOK semua — jadi tidak ada konflik nilai. Yang
 * dilakukan di sini hanya memperkaya, dan kalau suatu hari nilainya ternyata
 * beda, itu dicatat sebagai masalah, bukan dipilih diam-diam.
 *
 * @param {object[]} utama    hasil sheet nasional
 * @param {object[]} tambahan hasil sheet UNEJ — idPtn-nya HARUS sudah diisi
 *   lebih dulu (sheet itu tidak punya kolom Kode_PTN); yang tidak punya idPtn
 *   disimpan terpisah, tidak dicocokkan dengan menebak.
 */
export function gabungkanProdi(utama = [], tambahan = []) {
  const masalah = [];
  const indeks = new Map();
  for (const t of tambahan) {
    const k = kunciGabungProdi(t);
    if (!t.idPtn) {
      masalah.push({
        tingkat: 'error', id: t.id,
        pesan: 'idPtn kosong, tidak bisa dicocokkan antar sheet — disimpan sebagai prodi terpisah',
      });
      continue;
    }
    if (indeks.has(k)) {
      masalah.push({
        tingkat: 'error', id: t.id,
        pesan: `kunci gabung kembar dengan ${indeks.get(k).id} dalam sheet tambahan`,
      });
      continue;
    }
    indeks.set(k, t);
  }

  const hasil = utama.map((p) => {
    const t = p.idPtn ? indeks.get(kunciGabungProdi(p)) : null;
    if (!t) return { ...p };
    const kaya = { ...p };
    for (const field of ['fakultas', 'kampus', 'wilayah']) {
      if (!kaya[field] && t[field]) kaya[field] = t[field];
    }
    // Jaga-jaga kalau suatu hari dua sheet tidak lagi sepakat.
    for (const [label, a, b] of [
      ['Skor_UTBK_Minimum', p.skorReferensi?.minimum?.nilai, t.skorReferensi?.minimum?.nilai],
      ['Daya_Tampung_SNBT', p.dayaTampung?.nilai, t.dayaTampung?.nilai],
    ]) {
      if (a !== null && b !== null && a !== b) {
        masalah.push({
          tingkat: 'error', id: p.id,
          pesan: `${label} beda antar sheet: ${a} vs ${b} (dari ${t.id}) — dipakai sheet utama, perlu diputuskan manual`,
        });
      }
    }
    kaya.asalData = { ...p.asalData, diperkayaDari: t.asalData?.sheet || null };
    // ID sheet khusus disimpan sebagai alias, bukan menimpa id utama — kalau
    // ditimpa, rujukan silang ke sheet nasional putus.
    if (t.id && t.id !== p.id) kaya.idAlias = t.id;
    return kaya;
  });

  const kunciUtama = new Set(utama.filter((p) => p.idPtn).map(kunciGabungProdi));
  const hanyaTambahan = tambahan.filter((p) => !p.idPtn || !kunciUtama.has(kunciGabungProdi(p)));
  return { daftar: hasil.concat(hanyaTambahan), masalah };
}

/**
 * Parse sheet KOMPONEN_7_SUBTES_UTBK jadi katalog subtes.
 * Dipakai untuk memetakan hasil try out internal ke 7 komponen UTBK —
 * tapi lihat peringatan di docs/RANCANGAN-DATABASE-PTN.md: skor try out
 * Gemilang TIDAK otomatis setara skor UTBK.
 */
export function parseSubtes(baris = []) {
  const masalah = [];
  const daftar = [];
  for (const b of baris) {
    const nama = norm(b['Nama Subtes']);
    if (!nama || /total|lengkap/i.test(nama)) continue;
    const jumlah = bulat(b['Jumlah Soal']);
    const menit = bulat(b['Waktu (Menit)']);
    const detik = angka(b['Kecepatan Rata2 (Detik/Soal)']);
    if (jumlah && menit && detik !== null && Math.abs(detik - (menit * 60) / jumlah) > 1) {
      masalah.push({
        baris: b._baris, tingkat: 'peringatan', id: nama,
        pesan: `Kecepatan ${detik.toFixed(1)} dtk/soal != ${((menit * 60) / jumlah).toFixed(1)} dari jumlah & waktu`,
      });
    }
    daftar.push({
      id: norm(b.No) || nama.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      kelompok: norm(b['Kelompok Tes']) || null,
      nama,
      jumlahSoal: jumlah,
      waktuMenit: menit,
      detikPerSoal: detik,
      karakterSoal: norm(b['Karakter Soal & Jebakan']) || null,
      trik: norm(b['Trik Pengerjaan Cepat']) || null,
      prioritasProdi: norm(b['Prioritas Relevansi Prodi']) || null,
      // Struktur tes adalah informasi resmi yang diumumkan panitia, tapi
      // berkas sumber tidak mencantumkan tahun/tautan per baris.
      statusData: STATUS_DATA.BELUM_VERIFIKASI,
      asalData: SUMBER_EXCEL.nama,
    });
  }
  return { daftar, masalah };
}

/** Parse sheet SUMBER_REGULASI_RESMI jadi katalog tautan rujukan. */
export function parseSumber(baris = []) {
  const daftar = [];
  for (const b of baris) {
    const id = norm(b.ID_SUMBER);
    if (!id) continue;
    daftar.push({
      id,
      nama: norm(b['Nama Portal / Dokumen Resmi']) || null,
      instansi: norm(b['Instansi Penyelenggara']) || null,
      url: norm(b['Tautan Resmi (URL)']) || null,
      fungsi: norm(b['Fungsi Acuan Konsultasi']) || null,
      keteranganValidasi: norm(b['Keterangan Validasi']) || null,
      resmi: true, // sheet ini MEMANG daftar portal resmi
    });
  }
  return { daftar, masalah: [] };
}

export default {
  SUMBER_EXCEL, BIDANG_SAH, JENJANG_SAH, BENTUK_DI_LUAR_SNBT,
  pisahkanWilayahKampus, parsePtnMaster, parseProdi, gabungkanProdi, kunciGabungProdi,
  parseSubtes, parseSumber,
};
