// src/utils/auditIdentitasSoal.js
// ============================================================
// MESIN AUDIT IDENTITAS & KESEHATAN BUTIR BANK SOAL — murni, teruji
// ============================================================
//
// KENAPA BERKAS INI ADA
// Owner 2026-10-08: "kedepannya kan kita buka fitur tentor bisa akses
// bank soal, maka nanti tentor pilih mapel, jenjang, materi, soal — kita
// harus cek apakah semua soal udah punya identitas, apakah ada soal rusak".
//
// Jawaban jujur atas pertanyaan itu TIDAK BISA didapat dari satu halaman
// saja, karena bank soal diisi oleh LIMA jalur tulis yang berbeda dan
// masing-masing memakai kosakata field sendiri:
//
//   Jalur                          mapel           jenjang        materi/bab
//   -----------------------------  --------------  -------------  -----------
//   Mesin Bank Soal (JSON)         mapel+mataPel.  'SMA'/'SMP'    bab, TANPA materi
//   Impor HTML Gemini              mapel+mataPel.  'SMA'/'SMP'    bab + materi
//   Import Buku & Soal (scan/AI)   mataPelajaran   'SMA/MA'       materi saja
//   Advanced Question Extractor    mataPelajaran   'SMA/MA'       TIDAK ADA
//   api/generateQuizFromTopic      (tidak menulis ke bank_soal)
//
// Dua akibat nyata yang dilihat tentor nanti:
//   1. DUA KOSAKATA `jenjang` hidup berdampingan ('SMA' vs 'SMA/MA'),
//      padahal Lemari Soal & Cetak Latihan menyaring dengan perbandingan
//      string PERSIS. Soal ber-jenjang 'SMA' tidak pernah muncul saat
//      tentor memilih 'SMA/MA' — ia jatuh ke kelompok "sisanya".
//   2. Penyaring hierarki membaca `materi`, tetapi mesin taksonomi menulis
//      `bab`. Jalur HTML Gemini sudah menyamakan keduanya (lihat
//      komentar di imporHtmlGeminiKeBank.js); jalur JSON belum.
//
// Maka yang dibutuhkan adalah ALAT UKUR, bukan tebakan. Berkas ini
// membaca dokumen apa adanya (sadar-alias), lalu melaporkan:
//   - cakupan tiap field identitas (berapa butir yang benar-benar punya),
//   - butir yang tak terjangkau hierarki tentor + alasannya,
//   - butir rusak per tipe (kunci di luar rentang opsi, placeholder
//     gambar yatim, LaTeX himpunan tak di-escape, aksara CJK, ...),
//   - rencana perbaikan DRY-RUN (apa yang akan berubah, tanpa menulis).
//
// ATURAN MAIN (docs/SOP-KESELAMATAN-PERUBAHAN.md janji #5):
// berkas ini TIDAK pernah menulis. Ia hanya memutuskan. Menulis ke
// `bank_soal` adalah keputusan owner yang dieksekusi halaman audit.
// ============================================================

// ------------------------------------------------------------
// 1. KOSAKATA BAKU
// ------------------------------------------------------------
// Jenjang dipatok di src/utils/jenjangBaku.js — SATU sumber kebenaran,
// dipakai bersama oleh mesin taksonomi (titik tulis) dan audit ini
// (titik ukur). Menyalin daftarnya ke sini akan melahirkan kembali bug
// yang sedang kita ukur.

import { JENJANG_BAKU, URUTAN_JENJANG, jenjangBaku } from './jenjangBaku.js';
// 🔥 2026-10-08: keselarasan Kurikulum Merdeka ikut diaudit. Data lama bisa
// saja tertag 'Biologi' untuk jenjang SD atau 'Matematika Wajib' (penamaan
// K13) — identitasnya "ada" tapi tidak selaras dengan kurikulum yang dipakai
// sekolah, jadi tetap perlu ditemukan dan dibereskan.
import { peringatanKeselarasanKurikulum, petakanNamaMapel } from './kurikulumMerdeka.js';
// 🔥 2026-10-08: audit dijadikan GENERAL CHECKUP. Satu sapuan yang sama kini
// juga menjawab dua pertanyaan fondasi lain: apakah ada butir kembar yang
// lolos masuk (sidik jari sadar gambar+kunci), dan seberapa pecah pohon
// materi yang akan dilihat tentor. Tanpa bacaan Firestore tambahan.
import { bandingkanDuplikat } from './kunciDuplikatSoal.js';

export { JENJANG_BAKU, URUTAN_JENJANG, jenjangBaku };

/** Enum `tipe` yang dikenali mesin skoring & mesin cetak (kontrak bank soal). */
export const TIPE_DIKENAL = [
  'pg_sederhana',
  'pg_kompleks',
  'benar_salah',
  'isian_singkat',
  'menjodohkan',
  'esai',
];

/** Tipe warisan yang masih beredar di data lama (draft materi v1). */
export const TIPE_WARISAN = {
  pg: 'pg_sederhana',
  pgMulti: 'pg_kompleks',
  pg_kategori: 'benar_salah',
  numerik: 'isian_singkat',
  tabel: 'benar_salah',
  jodoh: 'menjodohkan',
  isian: 'isian_singkat',
  uraian: 'esai',
};

/** Field identitas yang MENENTUKAN apakah butir terjangkau hierarki tentor. */
export const FIELD_WAJIB_TENTOR = ['mapel', 'jenjang', 'materi'];

/** Field yang dianjurkan (mempersempit pilihan, tapi tidak mematikan akses). */
export const FIELD_DIANJURKAN = ['kelas', 'kelompok', 'topik'];

// ------------------------------------------------------------
// 2. PEMBACA SADAR-ALIAS
// ------------------------------------------------------------

function normKunci(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function adaIsi(v) {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

/** Ambil nilai pertama yang benar-benar berisi dari daftar alias. */
export function ambilAlias(dok, alias) {
  const sumber = dok || {};
  for (const nama of alias) {
    if (adaIsi(sumber[nama])) return { nilai: sumber[nama], dari: nama };
  }
  return { nilai: '', dari: '' };
}

/**
 * Baca identitas sebuah dokumen bank soal apa adanya.
 * Tidak mengubah dokumen, tidak menebak yang tidak ada.
 */
export function bacaIdentitas(dok) {
  const d = dok || {};
  const mapel = ambilAlias(d, ['mataPelajaran', 'mapel']);
  const jenjang = jenjangBaku(ambilAlias(d, ['jenjang']).nilai);
  const kelas = ambilAlias(d, ['tingkatKelas', 'kelas']);
  // `materi` adalah yang dibaca penyaring; `bab`/`topik` adalah sumber
  // yang tersedia bila `materi` kosong (mesin taksonomi menulis `bab`).
  const materi = ambilAlias(d, ['materi']);
  const materiCadangan = ambilAlias(d, ['bab', 'topik', 'subBab']);
  const teks = ambilAlias(d, ['soal', 'teksSoal', 'teks_soal', 'pertanyaan']);

  return {
    teksSoal: String(teks.nilai || '').trim(),
    teksDari: teks.dari,
    mapel: String(mapel.nilai || '').trim(),
    mapelDari: mapel.dari,
    jenjang: jenjang.asli,
    jenjangBaku: jenjang.baku,
    jenjangDikenal: jenjang.dikenal,
    jenjangDiubah: jenjang.diubah,
    kelas: String(kelas.nilai || '').trim(),
    kelasDari: kelas.dari,
    materi: String(materi.nilai || '').trim(),
    materiDari: materi.dari,
    materiCadangan: String(materiCadangan.nilai || '').trim(),
    materiCadanganDari: materiCadangan.dari,
    kelompok: String(d.kelompok || '').trim(),
    topik: String(d.topik || '').trim(),
    kurikulum: String(d.kurikulum || '').trim(),
    fase: String(d.fase || '').trim(),
    status: String(d.status || 'aktif').trim(),
    tipe: String(d.tipe || '').trim(),
    sumberSoalId: d.sumberSoalId || null,
  };
}

// ------------------------------------------------------------
// 3. PERIKSA IDENTITAS
// ------------------------------------------------------------

/**
 * Putuskan identitas satu butir. Dua putusan yang BERBEDA dan sengaja
 * dipisah — mencampurnya menghasilkan laporan yang berbohong:
 *
 *   `lengkap`    : informasinya ADA (kita tahu soal ini SMA, Matematika,
 *                  bab Trigonometri) — walau tersimpan di kosakata/alias
 *                  yang tidak dibaca halaman mana pun.
 *   `terjangkau` : hierarki tentor (jenjang → mapel → materi) BENAR-BENAR
 *                  bisa menemukannya. Penyaring memakai perbandingan
 *                  string persis, jadi jenjang "SMA" tidak akan pernah
 *                  cocok dengan pilihan "SMA/MA", dan materi kosong
 *                  membuat butir jatuh ke kelompok "(Belum diatur)".
 *
 * Butir yang `lengkap` tapi tidak `terjangkau` adalah kasus paling
 * berbahaya: ia tidak terlihat rusak di mata admin, tapi lenyap dari
 * layar tentor.
 *
 * @returns {{identitas:object, lengkap:boolean, terjangkau:boolean,
 *            hilang:string[], takBaku:string[], hanyaAlias:string[]}}
 */
export function periksaIdentitas(dok) {
  const id = bacaIdentitas(dok);
  const hilang = [];
  const takBaku = [];
  const hanyaAlias = [];

  if (!id.mapel) hilang.push('mapel');
  if (!id.jenjang) hilang.push('jenjang');
  else if (!id.jenjangDikenal) takBaku.push(`jenjang "${id.jenjang}" bukan kosakata baku`);
  else if (id.jenjangDiubah) takBaku.push(`jenjang "${id.jenjang}" seharusnya "${id.jenjangBaku}"`);

  if (!id.materi) {
    if (id.materiCadangan) hanyaAlias.push(`materi kosong, tapi ${id.materiCadanganDari}="${id.materiCadangan}"`);
    else hilang.push('materi');
  }

  if (!id.kelas) hilang.push('kelas');

  // Keselarasan kurikulum: TIDAK dihitung sebagai "hilang" (identitasnya
  // ada), tapi dilaporkan terpisah supaya bisa dibereskan tanpa menakutkan.
  const kurikulum = peringatanKeselarasanKurikulum({
    mapel: id.mapel,
    jenjang: id.jenjangBaku || id.jenjang,
    kelas: id.kelas,
  });

  // `lengkap` mengabaikan alias/kosakata: yang ditanya "informasinya ada?"
  const lengkap = Boolean(id.mapel) && Boolean(id.jenjangDikenal) && Boolean(id.materi || id.materiCadangan);
  // `terjangkau` menuntut bentuk yang benar-benar dibaca penyaring.
  const terjangkau = Boolean(id.mapel)
    && Boolean(id.jenjangBaku) && !id.jenjangDiubah
    && Boolean(id.materi);

  return { identitas: id, lengkap, terjangkau, hilang, takBaku, hanyaAlias, kurikulum };
}

// ------------------------------------------------------------
// 4. DETEKSI BUTIR RUSAK
// ------------------------------------------------------------

const RE_CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;
const RE_HIMPUNAN_TANPA_ESCAPE = /(?<![\\$])\{\s*-?\d+(?:\s*,\s*-?\d+)*\s*\}/;
const RE_PLACEHOLDER_GAMBAR = /\{\{\s*GAMBAR_(\d+)\s*\}\}/gi;
const RE_HTML_MENTAH = /<(?:p|div|span|br|table|img|figure)\b/i;

/**
 * Ada aksara kontrol di dalam teks?
 *
 * Sengaja TIDAK pakai regex: aturan `no-control-regex` menolak pola yang
 * memuat aksara kontrol, padahal mendeteksi aksara kontrol justru
 * MAKSUDNYA di sini — ia jejak LaTeX yang termakan escape (insiden nyata:
 * `\frac` di JSON ber-backslash tunggal menjadi aksara form-feed).
 * Tab/newline/CR dianggap sah karena teks soal memang boleh multi-baris.
 */
function adaAksaraKontrol(teks) {
  const s = String(teks || '');
  for (let i = 0; i < s.length; i += 1) {
    const kode = s.charCodeAt(i);
    if (kode < 32 && kode !== 9 && kode !== 10 && kode !== 13) return true;
  }
  return false;
}

function jumlahHurufKunci(kunci) {
  const huruf = String(kunci || '').trim().toUpperCase();
  if (!huruf) return 0;
  return huruf.charCodeAt(0) - 64; // 'A' -> 1
}

function panjangDaftarOpsi(dok) {
  const opsi = Array.isArray(dok?.opsiJawaban) ? dok.opsiJawaban : [];
  return opsi.filter((o) => adaIsi(typeof o === 'string' ? o : o?.teks)).length;
}

/**
 * Deteksi butir rusak / perlu dicek.
 * @returns {{rusak:string[], perluDicek:string[]}}
 *   `rusak` = butir TIDAK BOLEH sampai ke siswa apa adanya.
 *   `perluDicek` = bisa dipakai, tapi ada yang harus dikonfirmasi manusia.
 */
export function deteksiSoalRusak(dok) {
  const d = dok || {};
  const rusak = [];
  const perluDicek = [];
  const id = bacaIdentitas(d);

  // --- teks soal ---
  if (!id.teksSoal) {
    rusak.push('Teks soal kosong');
  } else {
    if (id.teksSoal.length < 10) perluDicek.push(`Teks soal sangat pendek (${id.teksSoal.length} karakter)`);
    if (adaAksaraKontrol(id.teksSoal)) {
      rusak.push('Teks soal memuat aksara kontrol (escape LaTeX termakan)');
    }
    if (RE_CJK.test(id.teksSoal)) {
      rusak.push('Teks soal memuat aksara China/Jepang/Korea (ditolak penjaga CI)');
    }
    if (RE_HIMPUNAN_TANPA_ESCAPE.test(id.teksSoal)) {
      perluDicek.push('Kurung himpunan LaTeX tidak di-escape (risiko tayang sebagai "A = 2, 3")');
    }
    if (RE_HTML_MENTAH.test(id.teksSoal)) {
      perluDicek.push('Teks soal memuat tag HTML mentah');
    }
  }

  // --- placeholder gambar yatim ---
  const urlGambar = Array.isArray(d.gambarUrls) ? d.gambarUrls.filter(Boolean) : [];
  const daftarGambar = Array.isArray(d.gambar) ? d.gambar : [];
  const nomorGambarTersedia = new Set();
  daftarGambar.forEach((g, i) => {
    const idGambar = String(typeof g === 'string' ? g : g?.id || '');
    const cocok = idGambar.match(/GAMBAR_(\d+)/i);
    if (cocok) nomorGambarTersedia.add(Number(cocok[1]));
    else if (urlGambar[i]) nomorGambarTersedia.add(i + 1);
  });
  urlGambar.forEach((_, i) => nomorGambarTersedia.add(i + 1));

  const teksGabungan = `${id.teksSoal} ${String(d.pembahasan || '')}`;
  const placeholder = [...teksGabungan.matchAll(RE_PLACEHOLDER_GAMBAR)].map((m) => Number(m[1]));
  const yatim = [...new Set(placeholder)].filter((n) => !nomorGambarTersedia.has(n));
  if (yatim.length) {
    rusak.push(`Placeholder gambar tanpa pasangan: {{GAMBAR_${yatim.join(', GAMBAR_')}}}`);
  }
  if (Array.isArray(d.potonganTertunda) && d.potonganTertunda.length) {
    perluDicek.push(`${d.potonganTertunda.length} figur masih menunggu dipotong presisi`);
  }

  // --- tipe ---
  const tipe = id.tipe || 'pg_sederhana';
  if (!TIPE_DIKENAL.includes(tipe)) {
    if (TIPE_WARISAN[tipe]) {
      perluDicek.push(`Tipe warisan "${tipe}" (padanan baku: ${TIPE_WARISAN[tipe]})`);
    } else {
      rusak.push(`Tipe tak dikenal: "${tipe || '(kosong)'}"`);
    }
  }

  // --- kunci & opsi per tipe ---
  const kunci = d.kunciJawaban;
  const kunciKosong = !adaIsi(kunci);
  const opsi = panjangDaftarOpsi(d);
  const pernyataan = Array.isArray(d.pernyataan) ? d.pernyataan.filter((p) => adaIsi(typeof p === 'string' ? p : p?.teks)).length : 0;

  if (tipe === 'pg_sederhana') {
    if (opsi < 2) rusak.push(`Opsi jawaban kurang dari 2 (ada ${opsi})`);
    if (kunciKosong) rusak.push('Kunci jawaban kosong');
    else {
      const posisi = jumlahHurufKunci(kunci);
      if (posisi < 1 || posisi > 26) rusak.push(`Kunci jawaban bukan huruf A-Z: "${kunci}"`);
      else if (opsi >= 2 && posisi > opsi) rusak.push(`Kunci "${kunci}" di luar rentang opsi (hanya ada ${opsi} opsi)`);
    }
  } else if (tipe === 'pg_kompleks') {
    const butir = Math.max(opsi, pernyataan);
    if (butir < 2) rusak.push(`Pernyataan/opsi pg_kompleks kurang dari 2 (ada ${butir})`);
    if (kunciKosong) rusak.push('Kunci pg_kompleks kosong — soal akan selalu bernilai 0');
    else if (Array.isArray(kunci)) {
      const salah = kunci.filter((k) => {
        const p = jumlahHurufKunci(k);
        return p < 1 || (butir >= 2 && p > butir);
      });
      if (salah.length) rusak.push(`Kunci pg_kompleks di luar rentang: ${salah.join(', ')}`);
    }
  } else if (tipe === 'benar_salah') {
    const baris = Array.isArray(d.tabelBenarSalah) ? d.tabelBenarSalah : [];
    if (!baris.length && !pernyataan) rusak.push('Tabel pernyataan benar/salah kosong');
    const tanpaKunci = baris.filter((b) => !['benar', 'salah'].includes(String(b?.kunci || '').toLowerCase()));
    if (baris.length && tanpaKunci.length) {
      rusak.push(`${tanpaKunci.length} baris benar/salah tanpa kunci sah`);
    }
  } else if (tipe === 'menjodohkan') {
    const pasangan = Array.isArray(d.pasangan) ? d.pasangan : [];
    if (!pasangan.length) rusak.push('Daftar pasangan menjodohkan kosong');
    const bolong = pasangan.filter((p) => !adaIsi(p?.kiri) || !adaIsi(p?.kanan));
    if (pasangan.length && bolong.length) rusak.push(`${bolong.length} pasangan menjodohkan bolong kiri/kanan`);
  } else if (tipe === 'isian_singkat') {
    const ekuivalen = Array.isArray(d.jawabanEkuivalen) ? d.jawabanEkuivalen.filter(Boolean) : [];
    if (kunciKosong && !ekuivalen.length) rusak.push('Kunci isian singkat kosong');
  } else if (tipe === 'esai') {
    // Esai dinilai manusia: kunci = rubrik. Kosong tidak merusak, tapi
    // penilai tanpa rubrik akan menilai semaunya — itu perlu dicek.
    if (kunciKosong) perluDicek.push('Esai tanpa rubrik/jawaban rujukan untuk penilai');
  }

  // --- opsi ganda identik (siswa tak bisa memilih dengan pasti) ---
  if (Array.isArray(d.opsiJawaban) && d.opsiJawaban.length > 1) {
    const teks = d.opsiJawaban.map((o) => normKunci(typeof o === 'string' ? o : o?.teks)).filter(Boolean);
    if (new Set(teks).size !== teks.length) perluDicek.push('Ada opsi jawaban yang identik');
  }

  // --- pengakuan asal ---
  if (d.kunciTerverifikasi === false) perluDicek.push('Kunci belum terverifikasi (hasil analisis AI)');
  if (d.pembahasanAsal === 'penalaran') perluDicek.push('Pembahasan hasil penalaran model — guru perlu memeriksa');
  if (!String(d.pembahasan || '').trim()) perluDicek.push('Tanpa pembahasan');

  return { rusak, perluDicek };
}

// ------------------------------------------------------------
// 5. RENCANA PERBAIKAN (DRY-RUN — tidak pernah menulis)
// ------------------------------------------------------------

/**
 * Susun rencana perbaikan identitas. Prinsip: hanya MENGISI yang kosong
 * dan MENYERAGAMKAN kosakata. Nilai berbeda yang sama-sama terisi tidak
 * pernah ditimpa — itu wilayah keputusan manusia.
 *
 * @returns {Array<{id:string, perubahan:Object, alasan:string[]}>}
 */
export function rencanaPerbaikanIdentitas(daftar) {
  const rencana = [];
  for (const { id, data } of daftar || []) {
    const dok = data || {};
    const idn = bacaIdentitas(dok);
    const perubahan = {};
    const alasan = [];

    // 5.1 jenjang tak baku -> kosakata baku (nilai lama disimpan jujur)
    if (idn.jenjang && idn.jenjangDikenal && idn.jenjangDiubah) {
      perubahan.jenjang = idn.jenjangBaku;
      perubahan.jenjangSebelumBaku = idn.jenjang;
      alasan.push(`jenjang "${idn.jenjang}" diseragamkan jadi "${idn.jenjangBaku}"`);
    }

    // 5.1b mapel tidak selaras Kurikulum Merdeka untuk jenjangnya.
    // Kasus nyata owner 2026-10-08: butir SMP tertag "Sosiologi" karena
    // saat impor tidak ada waktu membenahi mesin -- padahal di Kurikulum
    // Merdeka SMP rumpun sosial adalah IPS. Dipetakan lewat peta kurikulum,
    // nilai lama disimpan di `mapelSebelumKurikulum` (tidak hilang).
    if (idn.mapel) {
      const petaMapel = petakanNamaMapel(idn.mapel, {
        jenjang: idn.jenjangBaku || idn.jenjang,
        kelas: idn.kelas,
      });
      if (petaMapel.diubah) {
        perubahan.mapel = petaMapel.nama;
        perubahan.mataPelajaran = petaMapel.nama;
        perubahan.mapelSebelumKurikulum = idn.mapel;
        alasan.push(petaMapel.alasan);
      }
    }

    // 5.2 materi kosong padahal bab/topik ada -> penyaring bisa melihatnya
    if (!idn.materi && idn.materiCadangan) {
      perubahan.materi = idn.materiCadangan;
      alasan.push(`materi diisi dari ${idn.materiCadanganDari}`);
    }

    // 5.3 alias mapel/kelas/teks saling melengkapi (bukan menimpa)
    if (!dok.mataPelajaran && dok.mapel) {
      perubahan.mataPelajaran = dok.mapel;
      alasan.push('alias mataPelajaran diisi dari mapel');
    } else if (!dok.mapel && dok.mataPelajaran) {
      perubahan.mapel = dok.mataPelajaran;
      alasan.push('alias mapel diisi dari mataPelajaran');
    }
    if (!dok.tingkatKelas && dok.kelas) {
      perubahan.tingkatKelas = String(dok.kelas);
      alasan.push('alias tingkatKelas diisi dari kelas');
    } else if (!dok.kelas && dok.tingkatKelas) {
      perubahan.kelas = String(dok.tingkatKelas);
      alasan.push('alias kelas diisi dari tingkatKelas');
    }
    if (!adaIsi(dok.teksSoal) && adaIsi(dok.soal)) {
      perubahan.teksSoal = dok.soal;
      alasan.push('alias teksSoal diisi dari soal');
    } else if (!adaIsi(dok.soal) && adaIsi(dok.teksSoal)) {
      perubahan.soal = dok.teksSoal;
      alasan.push('alias soal diisi dari teksSoal');
    }

    if (alasan.length) rencana.push({ id, perubahan, alasan });
  }
  return rencana;
}

// ------------------------------------------------------------
// 6. LAPORAN AGREGAT
// ------------------------------------------------------------

const STATUS_DIKECUALIKAN = ['nonaktif', 'dihapus'];

/**
 * Jatah baca harian Firestore tier gratis (dokumen/hari). Dipakai untuk
 * menyatakan biaya audit secara JUJUR — proyek ini pernah kena
 * 429 RESOURCE_EXHAUSTED (docs/POLICY-ERROR-DAN-KUOTA.md).
 */
export const JATAH_BACA_HARIAN = 50000;

/**
 * Nyatakan biaya satu penyapuan koleksi dalam satuan yang dimengerti owner.
 * @returns {{baca:number, persenJatah:number, kalimat:string}}
 */
export function hitungBiayaBaca(jumlahDokumen, jatah = JATAH_BACA_HARIAN) {
  const baca = Math.max(0, Number(jumlahDokumen) || 0);
  const persenJatah = jatah > 0 ? Math.round((baca / jatah) * 1000) / 10 : 0;
  return {
    baca,
    persenJatah,
    kalimat: `Menyapu koleksi ini membaca ${baca.toLocaleString('id-ID')} dokumen = ${persenJatah}% jatah baca harian (${jatah.toLocaleString('id-ID')}).`,
  };
}

/**
 * Audit penuh satu koleksi bank soal.
 * @param {Array<{id:string, data:object}>} daftar dokumen mentah dari Firestore
 * @param {object} [opsi] { ikutDikecualikan: boolean }
 * @returns {object} laporan
 */
export function auditBankSoal(daftar, opsi = {}) {
  const mentah = Array.isArray(daftar) ? daftar : [];
  const termasuk = [];
  const dikecualikan = [];

  for (const butir of mentah) {
    const data = butir?.data || butir || {};
    const status = String(data.status || 'aktif');
    if (!opsi.ikutDikecualikan && STATUS_DIKECUALIKAN.includes(status)) {
      dikecualikan.push({ id: butir?.id || '', status });
    } else {
      termasuk.push({ id: butir?.id || '', data });
    }
  }

  // --- cakupan field ---
  const cacah = {
    mapel: 0, jenjang: 0, jenjangBaku: 0, kelas: 0, materi: 0,
    materiLewatBab: 0, kelompok: 0, topik: 0, kurikulum: 0, fase: 0,
    pembahasan: 0, gambar: 0, sumberSoalId: 0, teksSoal: 0,
  };
  const petaJenjang = new Map();
  const petaJenjangTakBaku = new Map();
  const petaMapel = new Map();
  const tanpaIdentitas = [];
  const butirRusak = [];
  const butirCekManual = [];
  const petaKelompok = new Map();
  const daftarTakSelarasKurikulum = [];
  let identitasLengkap = 0; // informasi ada (walau mungkin tak terbaca penyaring)
  let tersembunyi = 0;      // lengkap tapi tak terjangkau hierarki tentor

  for (const { id, data } of termasuk) {
    const hasil = periksaIdentitas(data);
    const idn = hasil.identitas;
    const kesehatan = deteksiSoalRusak(data);
    if (hasil.lengkap) identitasLengkap += 1;

    if (idn.mapel) { cacah.mapel += 1; petaMapel.set(idn.mapel, (petaMapel.get(idn.mapel) || 0) + 1); }
    if (idn.jenjang) {
      cacah.jenjang += 1;
      const label = idn.jenjangBaku || idn.jenjang;
      petaJenjang.set(label, (petaJenjang.get(label) || 0) + 1);
      if (!idn.jenjangDikenal || idn.jenjangDiubah) {
        petaJenjangTakBaku.set(idn.jenjang, (petaJenjangTakBaku.get(idn.jenjang) || 0) + 1);
      }
    }
    if (idn.jenjangBaku) cacah.jenjangBaku += 1;
    if (idn.kelas) cacah.kelas += 1;
    if (idn.materi) cacah.materi += 1;
    else if (idn.materiCadangan) cacah.materiLewatBab += 1;
    if (idn.kelompok) cacah.kelompok += 1;
    if (idn.topik) cacah.topik += 1;
    if (idn.kurikulum) cacah.kurikulum += 1;
    if (idn.fase) cacah.fase += 1;
    if (String(data.pembahasan || '').trim()) cacah.pembahasan += 1;
    if ((Array.isArray(data.gambarUrls) && data.gambarUrls.length) || (Array.isArray(data.gambar) && data.gambar.length)) cacah.gambar += 1;
    if (data.sumberSoalId) cacah.sumberSoalId += 1;
    if (idn.teksSoal) cacah.teksSoal += 1;

    const pratinjau = idn.teksSoal.slice(0, 90) || '(tanpa teks)';
    if (!hasil.terjangkau) {
      tanpaIdentitas.push({
        id,
        pratinjau,
        mapel: idn.mapel || '(kosong)',
        jenjang: idn.jenjang || '(kosong)',
        materi: idn.materi || '(kosong)',
        // `lengkapTapiTersembunyi` = informasi identitasnya ADA, tetapi
        // tersimpan dalam bentuk yang tidak dibaca halaman penyaring.
        lengkapTapiTersembunyi: hasil.lengkap,
        hilang: hasil.hilang,
        takBaku: hasil.takBaku,
        hanyaAlias: hasil.hanyaAlias,
      });
    }
    if (hasil.lengkap && !hasil.terjangkau) tersembunyi += 1;
    if (hasil.kurikulum.length) {
      cacah.kurikulum += 1;
      daftarTakSelarasKurikulum.push({
        id,
        pratinjau,
        mapel: idn.mapel || '(kosong)',
        jenjang: idn.jenjang || '(kosong)',
        kelas: idn.kelas || '-',
        pesan: hasil.kurikulum,
      });
    }
    if (kesehatan.rusak.length) {
      butirRusak.push({ id, pratinjau, tipe: idn.tipe || 'pg_sederhana', alasan: kesehatan.rusak });
    } else if (kesehatan.perluDicek.length) {
      butirCekManual.push({ id, pratinjau, alasan: kesehatan.perluDicek });
    }

    // kesiapan per simpul hierarki tentor
    const simpul = `${idn.jenjangBaku || '(jenjang?)'}|||${idn.mapel || '(mapel?)'}|||${idn.materi || '(materi?)'}`;
    if (!petaKelompok.has(simpul)) {
      petaKelompok.set(simpul, {
        jenjang: idn.jenjangBaku || '(jenjang?)',
        mapel: idn.mapel || '(mapel?)',
        materi: idn.materi || '(materi?)',
        jumlah: 0, siap: 0, tersembunyi: 0, rusak: 0,
      });
    }
    const acc = petaKelompok.get(simpul);
    acc.jumlah += 1;
    if (kesehatan.rusak.length) acc.rusak += 1;
    else if (!hasil.terjangkau) acc.tersembunyi += 1;
    else acc.siap += 1;
  }

  const total = termasuk.length;
  const persen = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  const cakupan = [
    { field: 'teksSoal/soal', terisi: cacah.teksSoal, wajib: true },
    { field: 'mapel', terisi: cacah.mapel, wajib: true },
    { field: 'jenjang', terisi: cacah.jenjang, wajib: true },
    // `jenjang dikenali` = nilainya ADA dan bisa dipetakan ke kosakata baku.
    // Bukan berarti sudah baku: 'SMA' terhitung di sini padahal masih harus
    // diseragamkan jadi 'SMA/MA'. Yang belum diseragamkan dilaporkan terpisah
    // di `jenjang.takBaku` supaya dua angka ini tidak saling menutupi.
    { field: 'jenjang dikenali', terisi: cacah.jenjangBaku, wajib: true },
    { field: 'materi', terisi: cacah.materi, wajib: true },
    { field: 'kelas', terisi: cacah.kelas, wajib: false },
    { field: 'kelompok', terisi: cacah.kelompok, wajib: false },
    { field: 'topik', terisi: cacah.topik, wajib: false },
    { field: 'kurikulum', terisi: cacah.kurikulum, wajib: false },
    { field: 'fase', terisi: cacah.fase, wajib: false },
    { field: 'pembahasan', terisi: cacah.pembahasan, wajib: false },
  ].map((c) => ({ ...c, kosong: total - c.terisi, persen: persen(c.terisi) }));

  // ---- GENERAL CHECKUP: duplikat & fragmentasi materi ----
  const dup = bandingkanDuplikat(termasuk.map((t) => ({ ...t.data, id: t.id })), []);
  const petaSimpul = new Map();
  for (const { data } of termasuk) {
    const idn = bacaIdentitas(data);
    const simpul = `${idn.jenjangBaku || idn.jenjang || '(jenjang?)'}|||${idn.mapel || '(mapel?)'}|||${idn.materi || '(materi?)'}`;
    petaSimpul.set(simpul, (petaSimpul.get(simpul) || 0) + 1);
  }
  const simpulSatuButir = [...petaSimpul.values()].filter((n) => n === 1).length;
  const perMapelPecah = new Map();
  for (const [simpul, n] of petaSimpul) {
    const [, mapel] = simpul.split('|||');
    const acc = perMapelPecah.get(mapel) || { simpul: 0, butir: 0, satuButir: 0 };
    acc.simpul += 1;
    acc.butir += n;
    if (n === 1) acc.satuButir += 1;
    perMapelPecah.set(mapel, acc);
  }
  const materiTerpecah = [...perMapelPecah.entries()]
    .map(([mapel, v]) => ({ mapel, ...v, rata: v.simpul ? Math.round((v.butir / v.simpul) * 10) / 10 : 0 }))
    .filter((v) => v.rata < 4)
    .sort((a, b) => a.rata - b.rata || b.simpul - a.simpul);

  const jenjangTakBaku = [...petaJenjangTakBaku.entries()]
    .map(([nilai, jumlah]) => ({ nilai, jumlah, seharusnya: jenjangBaku(nilai).baku || '(tak dikenali)' }))
    .sort((a, b) => b.jumlah - a.jumlah);

  const perKelompok = [...petaKelompok.values()].sort(
    (a, b) => b.jumlah - a.jumlah || a.mapel.localeCompare(b.mapel, 'id')
  );

  const siapTentor = tanpaIdentitas.length === 0 && butirRusak.length === 0;
  const penghalang = [];
  if (tanpaIdentitas.length) {
    const benarBenarHilang = tanpaIdentitas.filter((t) => !t.lengkapTapiTersembunyi).length;
    penghalang.push(
      `${tanpaIdentitas.length} butir tidak terjangkau hierarki jenjang → mapel → materi `
      + `(${benarBenarHilang} benar-benar tanpa identitas, ${tersembunyi} identitasnya ada tapi tersimpan dalam bentuk yang tidak dibaca penyaring).`
    );
  }
  if (jenjangTakBaku.length) {
    penghalang.push(`Jenjang dipakai dalam ${jenjangTakBaku.length} kosakata berbeda (${jenjangTakBaku.map((j) => `"${j.nilai}"`).join(', ')}) — penyaring membandingkan string persis, jadi sebagian soal tak terjangkau.`);
  }
  if (cacah.materiLewatBab) {
    penghalang.push(`${cacah.materiLewatBab} butir punya bab/topik tapi field \`materi\` kosong — halaman penyaring membaca \`materi\`, jadi butir ini tampil sebagai "(Belum diatur)".`);
  }
  if (butirRusak.length) {
    penghalang.push(`${butirRusak.length} butir rusak (kunci di luar rentang, placeholder gambar yatim, dsb.) — harus diperbaiki/dinonaktifkan sebelum tentor memilihnya.`);
  }

  return {
    totalSemua: mentah.length,
    total,
    dikecualikan: dikecualikan.length,
    cakupan,
    jenjang: {
      baku: URUTAN_JENJANG.filter((j) => petaJenjang.has(j)).map((nama) => ({ nama, jumlah: petaJenjang.get(nama) })),
      lainnya: [...petaJenjang.entries()].filter(([n]) => !URUTAN_JENJANG.includes(n)).map(([nama, jumlah]) => ({ nama, jumlah })),
      takBaku: jenjangTakBaku,
      kosong: total - cacah.jenjang,
    },
    mapel: [...petaMapel.entries()].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah),
    tanpaIdentitas,
    takSelarasKurikulum: daftarTakSelarasKurikulum,
    butirRusak,
    butirCekManual,
    perKelompok,
    checkup: {
      duplikatPersis: dup.duplikatPersis.length,
      kembarBedaKunci: dup.kembarBedaKunci.length,
      perintahSamaGambarBeda: dup.teksSamaGambarBeda,
      contohKembarBedaKunci: dup.kembarBedaKunci.slice(0, 10).map((x) => ({
        id: x.baru?.id || '',
        pratinjau: x.pratinjau,
        sumber: x.sumber,
      })),
      simpulMateri: petaSimpul.size,
      simpulSatuButir,
      rataButirPerSimpul: petaSimpul.size ? Math.round((total / petaSimpul.size) * 100) / 100 : 0,
      materiTerpecah,
    },
    rencanaPerbaikan: rencanaPerbaikanIdentitas(termasuk),
    kesiapanTentor: { siap: siapTentor, penghalang },
    ringkasan: {
      // Dua angka yang sering disangka sama tapi artinya beda:
      //  identitasLengkap = informasinya ADA
      //  terjangkau       = hierarki tentor BENAR-BENAR bisa menemukannya
      identitasLengkap,
      persenIdentitasLengkap: persen(identitasLengkap),
      terjangkau: total - tanpaIdentitas.length,
      persenTerjangkau: persen(total - tanpaIdentitas.length),
      tersembunyi,
      takSelarasKurikulum: cacah.kurikulum,
      rusak: butirRusak.length,
      perluDicek: butirCekManual.length,
      materiLewatBab: cacah.materiLewatBab,
    },
  };
}

/** Baris CSV untuk diunduh (owner menganalisis di Excel/Claude). */
export function keCsvTanpaIdentitas(laporan) {
  const kepala = ['id', 'mapel', 'jenjang', 'materi', 'jenisMasalah', 'hilang', 'takBaku', 'hanyaAlias', 'pratinjau'];
  const baris = (laporan?.tanpaIdentitas || []).map((t) => [
    t.id, t.mapel, t.jenjang, t.materi,
    t.lengkapTapiTersembunyi ? 'tersembunyi (identitas ada, tak terbaca penyaring)' : 'tanpa identitas',
    t.hilang.join('; '), t.takBaku.join('; '), t.hanyaAlias.join('; '), t.pratinjau,
  ]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [kepala, ...baris].map((r) => r.map(escape).join(',')).join('\n');
}

/** Baris CSV butir rusak. */
export function keCsvRusak(laporan) {
  const kepala = ['id', 'tipe', 'alasan', 'pratinjau'];
  const baris = (laporan?.butirRusak || []).map((b) => [b.id, b.tipe, b.alasan.join('; '), b.pratinjau]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [kepala, ...baris].map((r) => r.map(escape).join(',')).join('\n');
}

export default {
  JENJANG_BAKU,
  URUTAN_JENJANG,
  TIPE_DIKENAL,
  TIPE_WARISAN,
  FIELD_WAJIB_TENTOR,
  FIELD_DIANJURKAN,
  JATAH_BACA_HARIAN,
  ambilAlias,
  jenjangBaku,
  bacaIdentitas,
  periksaIdentitas,
  deteksiSoalRusak,
  rencanaPerbaikanIdentitas,
  hitungBiayaBaca,
  auditBankSoal,
  keCsvTanpaIdentitas,
  keCsvRusak,
};
