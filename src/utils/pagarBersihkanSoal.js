// src/utils/pagarBersihkanSoal.js
// ============================================================
// PAGAR LEDAKAN untuk pembersihan bank soal massal.
// ============================================================
//
// KENAPA BERKAS INI ADA
// Owner 2026-10-08: "aku takut yang dalam berantakan dan rapuh, mau tambah
// soal pun jadi takut." Ketakutan itu punya dasar yang konkret di kode:
//
//   1. `BersihkanSoalPage` mencentang OTOMATIS semua butir yang dianggap
//      rusak dan semua anggota duplikat kecuali satu, dengan satu-satunya
//      pengaman berupa `window.confirm` berisi angka.
//   2. Layar hanya menampilkan 300 butir rusak & 100 grup duplikat, tetapi
//      tulisannya terus terang: "...dan N lainnya (TETAP IKUT TERCENTANG &
//      TERHAPUS)". Artinya admin yang memeriksa 300 baris lalu menekan
//      Hapus bisa menghapus ribuan butir yang tidak pernah ia lihat.
//   3. Tidak ada ambang kewajaran. Bila detektornya yang keliru (mis. field
//      teks soal dibaca dari nama yang salah sehingga SEMUA butir dituduh
//      "Teks soal kosong"), satu klik menyapu seluruh bank.
//
// Prinsip pagar ini: HEURISTIK OTOMATIS TIDAK BOLEH PUNYA WEWENANG
// MENGHAPUS LEBIH BESAR DARIPADA YANG BISA DIPERIKSA MANUSIA DI LAYAR.
//
//   - Butir di luar batas tayang TIDAK PERNAH ikut tercentang diam-diam.
//   - Bila porsi butir "rusak" tidak wajar (>= ambang persen), kesimpulan
//     yang lebih mungkin adalah DETEKTORNYA yang salah, bukan datanya:
//     centang otomatis dimatikan total dan alasannya dikatakan jujur.
//
// Berkas ini murni dan teruji (tests/pagarBersihkanSoal.test.mjs) karena
// ia mengawal operasi yang menghapus data.
// ============================================================

/** Persentase butir "rusak" yang sudah tidak masuk akal untuk bank sehat. */
export const AMBANG_PERSEN_RUSAK = 15;

/** Jumlah butir yang benar-benar ditampilkan layar untuk dicentang. */
export const BATAS_TAYANG_RUSAK = 300;
export const BATAS_TAYANG_DUPLIKAT = 100;

/**
 * Putuskan seberapa banyak yang BOLEH tercentang otomatis.
 *
 * @param {object} o
 * @param {number} o.totalDiaudit          jumlah butir yang dipindai
 * @param {number} o.jumlahRusak           butir yang dituduh rusak
 * @param {number} o.jumlahDuplikatBerlebih anggota duplikat selain yang disimpan
 * @param {number} [o.batasTayangRusak]
 * @param {number} [o.batasTayangDuplikat]
 * @param {number} [o.ambangPersen]
 * @returns {object} putusan + pesan jujur untuk layar
 */
export function putusanPembersihan(input = {}) {
  const {
    totalDiaudit = 0,
    jumlahRusak = 0,
    jumlahDuplikatBerlebih = 0,
    batasTayangRusak = BATAS_TAYANG_RUSAK,
    batasTayangDuplikat = BATAS_TAYANG_DUPLIKAT,
    ambangPersen = AMBANG_PERSEN_RUSAK,
  } = input || {}; // `= {}` tidak menangkap null, jadi dijaga dua lapis
  const total = Math.max(0, Number(totalDiaudit) || 0);
  const rusak = Math.max(0, Number(jumlahRusak) || 0);
  const duplikat = Math.max(0, Number(jumlahDuplikatBerlebih) || 0);

  const persenRusak = total > 0 ? Math.round((rusak / total) * 1000) / 10 : 0;
  const mencurigakan = rusak > 0 && persenRusak >= ambangPersen;

  // Bila mencurigakan: NOL yang dicentang otomatis. Lebih baik admin
  // memeriksa manual daripada kehilangan bank soal karena heuristik.
  const autoRusak = mencurigakan ? 0 : Math.min(rusak, batasTayangRusak);
  const autoDuplikat = mencurigakan ? 0 : Math.min(duplikat, batasTayangDuplikat);

  const takTercentangRusak = rusak - autoRusak;
  const takTercentangDuplikat = duplikat - autoDuplikat;

  let pesan;
  if (mencurigakan) {
    pesan = `🛑 BERHENTI DULU: ${rusak.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')} butir `
      + `(${persenRusak}%) dituduh rusak. Sepanjang pengalaman, angka sebesar ini hampir selalu berarti `
      + `DETEKTORNYA yang keliru (misalnya teks soal dibaca dari nama field yang salah), bukan banknya yang rusak. `
      + `Tidak ada satu pun yang dicentang otomatis. Periksa beberapa butir di bawah: kalau isinya sebenarnya `
      + `normal, JANGAN hapus — laporkan sebagai bug.`;
  } else if (takTercentangRusak > 0 || takTercentangDuplikat > 0) {
    const bagian = [];
    if (takTercentangRusak > 0) bagian.push(`${takTercentangRusak.toLocaleString('id-ID')} butir rusak`);
    if (takTercentangDuplikat > 0) bagian.push(`${takTercentangDuplikat.toLocaleString('id-ID')} duplikat`);
    pesan = `ℹ️ Yang TIDAK tampil di layar (${bagian.join(' dan ')}) SENGAJA tidak ikut dicentang. `
      + `Tidak ada butir yang dihapus tanpa terlihat lebih dulu.`;
  } else if (rusak === 0 && duplikat === 0) {
    pesan = '✅ Tidak ada yang dituduh rusak maupun duplikat.';
  } else {
    pesan = `Semua temuan (${rusak.toLocaleString('id-ID')} rusak, ${duplikat.toLocaleString('id-ID')} duplikat) tampil di layar dan tercentang. Periksa sebelum menghapus.`;
  }

  return {
    totalDiaudit: total,
    jumlahRusak: rusak,
    jumlahDuplikatBerlebih: duplikat,
    persenRusak,
    mencurigakan,
    alasanMencurigakan: mencurigakan
      ? `${persenRusak}% butir dituduh rusak (ambang ${ambangPersen}%)`
      : '',
    bolehAutoCentang: !mencurigakan,
    autoCentangRusak: autoRusak,
    autoCentangDuplikat: autoDuplikat,
    takTercentangRusak,
    takTercentangDuplikat,
    totalAutoCentang: autoRusak + autoDuplikat,
    pesan,
  };
}

/**
 * Susun himpunan id yang BOLEH tercentang otomatis — hanya yang benar-benar
 * tampil di layar. Dipisah dari putusan supaya halamannya tidak menggoda
 * diri sendiri mencentang daftar penuh.
 *
 * @param {Array<{id:string}>} daftarRusakTampil   sudah dipotong batas tayang
 * @param {Array<{anggota:Array<{id:string}>, idDisimpan:string}>} grupDuplikatTampil
 * @param {object} putusan hasil putusanPembersihan
 * @returns {Set<string>}
 */
export function centangAman(daftarRusakTampil, grupDuplikatTampil, putusan) {
  const hasil = new Set();
  if (!putusan?.bolehAutoCentang) return hasil;

  for (const s of daftarRusakTampil || []) {
    if (s?.id) hasil.add(s.id);
  }
  for (const g of grupDuplikatTampil || []) {
    for (const a of g?.anggota || []) {
      if (a?.id && a.id !== g.idDisimpan) hasil.add(a.id);
    }
  }
  return hasil;
}

/** Kalimat konfirmasi hapus yang menyebut angka SEBENARNYA yang tercentang. */
export function teksKonfirmasiHapus(jumlahTercentang, { mencurigakan = false } = {}) {
  if (!jumlahTercentang) return '';
  const dasar = `Tandai ${jumlahTercentang.toLocaleString('id-ID')} soal sebagai dihapus `
    + '(soft-delete: status jadi "dihapus", masih bisa dipulihkan)? '
    + 'Soal ini langsung hilang dari Latihan Harian, Try Out, dan Audit Materi.';
  return mencurigakan
    ? `⚠️ ${dasar}\n\nPeringatan: porsi temuan tidak wajar. Yakin ini bukan bug detektor?`
    : dasar;
}

export default {
  AMBANG_PERSEN_RUSAK,
  BATAS_TAYANG_RUSAK,
  BATAS_TAYANG_DUPLIKAT,
  putusanPembersihan,
  centangAman,
  teksKonfirmasiHapus,
};
