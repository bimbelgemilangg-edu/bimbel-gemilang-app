// src/utils/kurikulumMerdeka.js
// ============================================================
// PETA KURIKULUM MERDEKA — satu sumber kebenaran mapel per jenjang/fase.
// ============================================================
//
// KELUHAN OWNER 2026-10-08 (sambil menunjukkan halaman impor):
// "gak ada mapel sesuai IPS SMP gitu atau IPAS, atau mapel sesuai kurikulum
// merdeka. Aku lebih suka ketika aku tekan SD, mapel yang muncul sesuai
// Kurikulum Merdeka — contoh biologi, sosiologi gak muncul. Atau SMA, ada
// mapel mtk wajib dan mtk minat. Gimana dong, salah dari akarnya."
//
// DIAGNOSIS: tidak ada peta kurikulum di repo ini sama sekali.
// `KATALOG_MAPEL` di mesinTaksonomiSoal.js adalah daftar DATAR 22 nama
// ('ipa','ips','ipas','bio','sos','mtk_tl', ...) tanpa ikatan jenjang atau
// fase apa pun. Akibatnya:
//   - dropdown impor menampilkan Biologi & Sosiologi sebagai pilihan untuk
//     dokumen SD (tidak sah di Kurikulum Merdeka: SD punya IPAS);
//   - tidak ada yang tahu bahwa "Matematika Wajib/Minat" adalah penamaan
//     K13; padanan Kurikulum Merdeka adalah `Matematika` dan
//     `Matematika Tingkat Lanjut`;
//   - deteksi otomatis bebas menagih 'Biologi' pada berkas SD karena skor
//     kata kunci tidak mengenal jenjang.
//
// Berkas ini adalah AKARNYA: satu tabel yang menyatakan mapel mana berlaku
// di jenjang & fase mana, kelompoknya (wajib/pilihan), dan padanan nama
// lama. Semua tempat yang menampilkan atau menagih mapel kelak membaca
// dari sini.
//
// ⚠️ TABEL INI ADALAH DATA, BUKAN LOGIKA YANG TERSEMBUNYI.
// Disusun dari struktur Kurikulum Merdeka (fase A–F dan mata pelajarannya).
// Owner/guru adalah pemegang keputusan kurikulum: bila ada baris yang tidak
// sesuai kebijakan sekolah, UBAH BARISNYA di sini — semua pemakai ikut
// berubah, dan uji di tests/kurikulumMerdeka.test.mjs akan menunjukkan
// baris mana yang bergeser.
// ============================================================

/** Kelas -> Fase Kurikulum Merdeka. */
export const FASE_PER_KELAS = {
  1: 'A', 2: 'A',
  3: 'B', 4: 'B',
  5: 'C', 6: 'C',
  7: 'D', 8: 'D', 9: 'D',
  10: 'E', 11: 'F', 12: 'F',
};

/** Fase -> jenjang. Dipakai saat hanya fase yang diketahui. */
export const JENJANG_PER_FASE = {
  A: 'SD/MI', B: 'SD/MI', C: 'SD/MI',
  D: 'SMP/MTs',
  E: 'SMA/MA', F: 'SMA/MA',
};

/**
 * Kelompok mapel:
 *  - 'wajib'   : diikuti semua siswa di fase itu
 *  - 'pilihan' : mata pelajaran pilihan (Fase F SMA, atau opsional di SD)
 * `fase`: daftar fase tempat mapel ini SAH diajarkan.
 * `alias`: nama lama/salah kaprah yang harus dipetakan ke sini.
 */
export const MAPEL_KURIKULUM = [
  // ---- umum, semua jenjang ----
  { kode: 'bind', nama: 'Bahasa Indonesia', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['bahasa indonesia', 'b.indonesia', 'bindo', 'bahasa indonesa'] },
  { kode: 'mtk', nama: 'Matematika', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['matematika', 'mtk', 'matematik', 'matematika wajib', 'math'] },
  { kode: 'bing', nama: 'Bahasa Inggris', fase: ['B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['bahasa inggris', 'english', 'b.inggris', 'binggris'] },
  { kode: 'pancasila', nama: 'Pendidikan Pancasila', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['ppkn', 'pkn', 'pendidikan pancasila', 'pancasila', 'pendidikan kewarganegaraan'] },
  { kode: 'pjok', nama: 'PJOK', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['pjok', 'penjaskes', 'olahraga', 'pendidikan jasmani'] },
  { kode: 'seni', nama: 'Seni dan Budaya', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['seni budaya', 'seni', 'sbdp', 'seni rupa', 'seni musik'] },
  { kode: 'pai', nama: 'Pendidikan Agama', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['pai', 'agama islam', 'pendidikan agama', 'agama'] },

  // 🔥 DITAMBAHKAN 2026-10-09 setelah MEMBACA SELURUH BANK (2.900 butir):
  // 'Literasi' adalah mapel SUNGGUHAN di bank ini (664 butir, gaya AKM, ada di
  // SD/SMP/SMA) — tetapi tidak ada di peta, sehingga audit menerbitkan 664
  // peringatan palsu "tidak ada di peta Kurikulum Merdeka". Yang salah adalah
  // petanya, bukan datanya. Bila kelak owner memutuskan Literasi dilebur ke
  // Bahasa Indonesia, cukup hapus baris ini dan peta ulang 664 butir itu.
  { kode: 'lit', nama: 'Literasi', fase: ['A', 'B', 'C', 'D', 'E', 'F'], kelompok: 'wajib', alias: ['literasi', 'literasi indonesia', 'akm literasi', 'literasi numerasi'] },

  // ---- SD/MI: hanya IPAS, TIDAK ADA IPA/IPS/Biologi/Fisika/Kimia terpisah ----
  { kode: 'ipas', nama: 'IPAS', fase: ['B', 'C'], kelompok: 'wajib', alias: ['ipas', 'ilmu pengetahuan alam dan sosial', 'ipa sd', 'ips sd'] },

  // ---- SMP/MTs (Fase D): IPA & IPS sebagai mapel UTUH ----
  { kode: 'ipa', nama: 'IPA', fase: ['D'], kelompok: 'wajib', alias: ['ipa', 'ilmu pengetahuan alam', 'sains'] },
  { kode: 'ips', nama: 'IPS', fase: ['D'], kelompok: 'wajib', alias: ['ips', 'ilmu pengetahuan sosial'] },

  // ---- SMA/MA (Fase E–F): rumpun ilmu terpisah ----
  { kode: 'fis', nama: 'Fisika', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['fisika', 'physics'] },
  { kode: 'kim', nama: 'Kimia', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['kimia', 'chemistry'] },
  { kode: 'bio', nama: 'Biologi', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['biologi', 'biology'] },
  { kode: 'sos', nama: 'Sosiologi', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['sosiologi', 'sociology', 'sosio'] },
  { kode: 'eko', nama: 'Ekonomi', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['ekonomi', 'economy', 'akuntansi'] },
  { kode: 'geo', nama: 'Geografi', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['geografi', 'geography'] },
  { kode: 'ant', nama: 'Antropologi', fase: ['E', 'F'], kelompok: 'pilihan', alias: ['antropologi', 'anthropology'] },
  { kode: 'sej', nama: 'Sejarah', fase: ['E', 'F'], kelompok: 'wajib', alias: ['sejarah', 'history'] },

  // ---- SMA Fase F: mata pelajaran tingkat lanjut (pengganti "peminatan") ----
  { kode: 'mtk_tl', nama: 'Matematika Tingkat Lanjut', fase: ['F'], kelompok: 'pilihan', alias: ['matematika tingkat lanjut', 'matematika lanjut', 'matematika minat', 'matematika peminatan', 'mtk minat', 'mtk peminatan', 'matematika wajib dan minat'] },
  { kode: 'bind_tl', nama: 'Bahasa Indonesia Tingkat Lanjut', fase: ['F'], kelompok: 'pilihan', alias: ['bahasa indonesia tingkat lanjut', 'bindo tingkat lanjut', 'bahasa indonesia peminatan'] },
  { kode: 'bing_tl', nama: 'Bahasa Inggris Tingkat Lanjut', fase: ['F'], kelompok: 'pilihan', alias: ['bahasa inggris tingkat lanjut', 'english advanced', 'bahasa inggris peminatan'] },

  // ---- Informatika: SMP ke atas ----
  { kode: 'tik', nama: 'Informatika', fase: ['D', 'E', 'F'], kelompok: 'wajib', alias: ['informatika', 'tik', 'komputer', 'pemrograman'] },
];

/** Padanan lintas-jenjang untuk nama yang sah di jenjang LAIN. */
const PINDAH_JENJANG = {
  // di SD, rumpun ilmu melebur jadi IPAS
  ipa: { 'SD/MI': 'ipas' },
  ips: { 'SD/MI': 'ipas' },
  bio: { 'SD/MI': 'ipas', 'SMP/MTs': 'ipa' },
  fis: { 'SD/MI': 'ipas', 'SMP/MTs': 'ipa' },
  kim: { 'SD/MI': 'ipas', 'SMP/MTs': 'ipa' },
  sos: { 'SD/MI': 'ipas', 'SMP/MTs': 'ips' },
  eko: { 'SD/MI': 'ipas', 'SMP/MTs': 'ips' },
  geo: { 'SD/MI': 'ipas', 'SMP/MTs': 'ips' },
  ant: { 'SD/MI': 'ipas', 'SMP/MTs': 'ips' },
  sej: { 'SD/MI': 'ipas', 'SMP/MTs': 'ips' },
  // IPAS tidak ada setelah SD
  ipas: { 'SMP/MTs': null, 'SMA/MA': null },
};

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s/]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function faseDariKelas(kelas) {
  const k = String(kelas ?? '').trim();
  return FASE_PER_KELAS[k] || '';
}

export function jenjangDariKelas(kelas) {
  const f = faseDariKelas(kelas);
  return JENJANG_PER_FASE[f] || '';
}

function cari(kodeAtauNama) {
  const t = norm(kodeAtauNama);
  if (!t) return null;
  // Kode ('mtk_tl') ikut dinormalkan saat dibandingkan, sebab norm()
  // mengubah garis bawah jadi spasi — tanpa ini pencarian lewat kode
  // selalu gagal dan diam-diam jatuh ke "tidak dikenal".
  return MAPEL_KURIKULUM.find((m) => m.kode === t || norm(m.kode) === t || m.nama.toLowerCase() === t || m.alias.includes(t)) || null;
}

/**
 * Apakah mapel ini sah diajarkan di jenjang/kelas tersebut?
 * Tanpa kelas, sah bila jenjangnya beririsan dengan fase mapel.
 */
export function mapelBerlaku(kodeAtauNama, { jenjang = '', kelas = '' } = {}) {
  const m = cari(kodeAtauNama);
  if (!m) return false;
  if (kelas) {
    const f = faseDariKelas(kelas);
    if (f) return m.fase.includes(f);
  }
  if (jenjang) {
    return m.fase.some((f) => JENJANG_PER_FASE[f] === jenjang);
  }
  return true;
}

/**
 * Daftar mapel yang BOLEH ditawarkan untuk sebuah jenjang/kelas.
 * Inilah yang membuat dropdown "tekan SD" hanya menampilkan mapel SD.
 */
export function daftarMapelUntuk({ jenjang = '', kelas = '' } = {}) {
  const urut = ['wajib', 'pilihan'];
  return MAPEL_KURIKULUM
    .filter((m) => {
      if (kelas) {
        const f = faseDariKelas(kelas);
        if (f) return m.fase.includes(f);
      }
      if (jenjang) return m.fase.some((f) => JENJANG_PER_FASE[f] === jenjang);
      return true;
    })
    .sort((a, b) => urut.indexOf(a.kelompok) - urut.indexOf(b.kelompok) || a.nama.localeCompare(b.nama, 'id'))
    .map((m) => ({ kode: m.kode, nama: m.nama, kelompok: m.kelompok, fase: [...m.fase] }));
}

/**
 * Apakah jenjang ini dimodelkan oleh peta kurikulum?
 * SMK dan UTBK/SNBT belum: struktur mapelnya tidak mengikuti fase A-F yang
 * sama. Untuk jenjang yang belum dipetakan, form HARUS menawarkan daftar
 * lengkap seperti sebelumnya — memperlihatkan daftar hampir kosong justru
 * menjebak pengguna ke jalan buntu.
 */
export function jenjangDipetakan(jenjang) {
  return Object.values(JENJANG_PER_FASE).includes(String(jenjang ?? '').trim());
}

/**
 * Petakan sebuah nama mapel (dari form, berkas impor, atau dokumen lama)
 * ke nama yang SAH untuk jenjang/kelas tersebut.
 * @returns {{nama:string, kode:string, diubah:boolean, alasan:string}}
 *   Bila nama tidak dikenali sama sekali, dikembalikan apa adanya dengan
 *   `diubah:false` — mengarang nama baru lebih berbahaya daripada mengaku.
 */
export function petakanNamaMapel(nama, { jenjang = '', kelas = '' } = {}) {
  const m = cari(nama);
  if (!m) return { nama: String(nama || '').trim(), kode: '', diubah: false, alasan: 'nama tidak dikenal peta kurikulum' };

  const jenjangEfektif = jenjang || jenjangDariKelas(kelas);
  if (!jenjangEfektif) return { nama: m.nama, kode: m.kode, diubah: m.nama !== String(nama).trim(), alasan: m.nama !== String(nama).trim() ? 'nama dinormalkan' : '' };

  // Sudah sah di jenjang ini?
  if (m.fase.some((f) => JENJANG_PER_FASE[f] === jenjangEfektif)) {
    // Tapi cek fase kelasnya: mis. "Matematika Tingkat Lanjut" untuk kelas 10.
    if (kelas) {
      const f = faseDariKelas(kelas);
      if (f && !m.fase.includes(f)) {
        return {
          nama: m.nama, kode: m.kode, diubah: false,
          alasan: `${m.nama} tidak diajarkan di kelas ${kelas} (fase ${f})`,
        };
      }
    }
    return { nama: m.nama, kode: m.kode, diubah: m.nama !== String(nama).trim(), alasan: m.nama !== String(nama).trim() ? 'nama dinormalkan' : '' };
  }

  // Tidak sah di jenjang ini — coba padanan lintas jenjang.
  const tujuan = PINDAH_JENJANG[m.kode]?.[jenjangEfektif];
  if (tujuan) {
    const t = cari(tujuan);
    return {
      nama: t.nama, kode: t.kode, diubah: true,
      alasan: `${m.nama} tidak ada di ${jenjangEfektif}; padanan Kurikulum Merdeka: ${t.nama}`,
    };
  }
  if (tujuan === null) {
    return {
      nama: m.nama, kode: m.kode, diubah: false,
      alasan: `${m.nama} adalah mapel ${jenjangEfektif === 'SD/MI' ? 'setelah SD' : 'jenjang SD'} — periksa kembali jenjang dokumennya`,
    };
  }
  return { nama: m.nama, kode: m.kode, diubah: false, alasan: `${m.nama} tidak dikenal di ${jenjangEfektif}` };
}

/**
 * Peringatan keselarasan kurikulum untuk sebuah butir — dipakai mesin audit
 * dan pratinjau impor supaya data lama yang salah tag bisa ditemukan.
 * @returns {string[]} kosong bila selaras
 */
export function peringatanKeselarasanKurikulum({ mapel = '', jenjang = '', kelas = '' } = {}) {
  const pesan = [];
  const nama = String(mapel || '').trim();
  if (!nama) return pesan; // ketiadaan identitas ditangani alat lain
  const m = cari(nama);
  if (!m) {
    pesan.push(`Mapel "${nama}" tidak ada di peta Kurikulum Merdeka`);
    return pesan;
  }
  const hasil = petakanNamaMapel(nama, { jenjang, kelas });
  if (hasil.diubah) pesan.push(hasil.alasan);
  else if (hasil.alasan && !hasil.diubah && hasil.alasan.includes('tidak')) pesan.push(hasil.alasan);

  // penamaan K13 yang masih beredar
  const n = norm(nama);
  if (n.includes('wajib') && n.includes('matematika')) pesan.push('Penamaan K13 "Matematika Wajib" — Kurikulum Merdeka menyebutnya "Matematika"');
  if ((n.includes('minat') || n.includes('peminatan')) && n.includes('matematika')) pesan.push('Penamaan K13 "Matematika Minat/Peminatan" — Kurikulum Merdeka menyebutnya "Matematika Tingkat Lanjut"');
  return pesan;
}

export default {
  FASE_PER_KELAS, JENJANG_PER_FASE, MAPEL_KURIKULUM,
  faseDariKelas, jenjangDariKelas, mapelBerlaku, daftarMapelUntuk,
  jenjangDipetakan, petakanNamaMapel, peringatanKeselarasanKurikulum,
};
