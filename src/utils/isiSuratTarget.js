// src/utils/isiSuratTarget.js
// ============================================================
// Penyusun ISI "Surat Pernyataan Target & Komitmen Belajar" — dokumen PDF
// resmi Gemilang yang diminta owner (2026-10-10):
//
//   "harusnya data langsung muncul pdf cetak siswa gemilang atas nama ...
//    berniat melanjutkan pendidikan ke program studi .... universitas ...
//    (isinya sesuaikan riset: informasi daya tampung dll) ... dari sisi
//    psikologis kita harus membangun faktor internal, lalu pdf di download
//    resmi gemilang dengan cap logo gemilang lengkap profil siswa"
//
// Berkas ini hanya menyusun STRUKTUR ISI (murni, teruji). Yang merender PDF
// adalah utils/suratTargetPdf.js. Dipisah supaya isi surat bisa diuji tanpa
// browser, mengikuti pola repo: naskahSoal.js (isi) vs DialogCetakNaskah (render).
//
// 🔥 DUA ATURAN ISI
// 1. FAKTOR INTERNAL. Bagian komitmen ditulis sebagai suara SISWA orang
//    pertama-singular ("saya"), bukan perintah dari lembaga. Psikologi tujuan
//    (goal-setting): komitmen yang diucapkan sendiri, spesifik, dan punya
//    rencana mingguan jauh lebih mungkin dijalankan daripada daftar larangan.
//    Frekuensi drill diambil dari ZONA kesiapan tiap pilihan (SOP owner),
//    jadi surat ini menyambungkan cita-cita dengan tindakan pekan ini.
// 2. JUJUR TANPA MENAKUTI. Surat ini dokumen motivasional resmi, jadi
//    label "belum_verifikasi" TIDAK dicetak di dalamnya (owner: verifikasi
//    dijelaskan admin langsung). TAPI satu catatan kaki tetap ada: skor acuan
//    adalah hasil riset internal Gemilang, bukan pengumuman resmi panitia.
//    Menghilangkannya sama saja mencetak klaim yang tidak bisa ditepati di
//    atas kertas berlogo.
// ============================================================

import { ZONA } from './zonaKesiapan.js';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function tanggalSurat(d = new Date(), kota = 'Banyuwangi') {
  return `${kota}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * @param {object} o
 * @param {object} o.siswa     dokumen students (nama, studentId, kelasSekolah, jenjang, ortu)
 * @param {object} o.target   dokumen target_kampus_siswa
 * @param {Array}  o.pilihan  baris perbandingan (susunPerbandingan) — membawa prodi + zona + gap
 * @param {number|null} o.skor
 * @param {object} [o.meta]   { kota, namaKonselor, tanggal }
 * @returns {object} struktur isi surat
 */
export function isiSuratTarget({ siswa, target, pilihan = [], skor = null, meta = {} }) {
  const terdaftar = (pilihan || []).filter((p) => p && p.tersedia);
  const namaOrtu = siswa?.ortu?.ayah || siswa?.ortu?.ibu || '';

  const barisTabel = terdaftar.map((p) => [
    `Pilihan ${p.urutan}`,
    p.namaProdi || '—',
    p.namaPtn || '—',
    p.dayaTampung?.nilai ?? '—',
    p.peminat?.nilai ?? '—',
    p.skorReferensi?.minimum?.nilai != null && p.skorReferensi?.maksimum?.nilai != null
      ? `${p.skorReferensi.minimum.nilai} – ${p.skorReferensi.maksimum.nilai}`
      : '—',
    p.syaratKhusus && p.syaratKhusus !== 'Tidak Ada Syarat Khusus' ? p.syaratKhusus : '—',
  ]);

  const rincian = terdaftar.map((p) => {
    const kal = [];
    kal.push(`${p.namaProdi} (${p.jenjang || '—'}${p.bidang ? `, ${p.bidang}` : ''}) pada ${p.namaPtn}${p.fakultas ? `, ${p.fakultas}` : ''}${p.kampus ? ` — ${p.kampus}` : ''}.`);
    kal.push(`Daya tampung ${p.dayaTampung?.nilai ?? '—'} kursi dengan ${p.peminat?.nilai ?? '—'} peminat pada tahun seleksi ${target?.tahunSeleksi || '—'}${p.keketatan ? ` (keketatan ± 1 : ${Math.round(1 / p.keketatan)})` : ''}.`);
    if (p.skorReferensi?.minimum?.nilai != null) {
      kal.push(`Skor acuan riset Gemilang: minimum ${p.skorReferensi.minimum.nilai}, rata-rata ${p.skorReferensi?.rataRata?.nilai ?? '—'}, maksimum ${p.skorReferensi?.maksimum?.nilai ?? '—'}.`);
    } else {
      kal.push('Skor acuan untuk prodi ini belum tersedia pada database riset Gemilang; pembimbing akan membahasnya langsung.');
    }
    if (p.syaratKhusus && p.syaratKhusus !== 'Tidak Ada Syarat Khusus') kal.push(`Syarat khusus yang wajib dipenuhi: ${p.syaratKhusus}.`);
    if (p.subtesKunci) kal.push(`Subtes kunci yang perlu dikuasai: ${p.subtesKunci}.`);
    if (skor != null && p.zona?.id && p.zona.id !== ZONA.TANPA_DATA) {
      kal.push(`Posisi saya saat ini: selisih ${p.gapMinimum >= 0 ? '+' : ''}${p.gapMinimum} terhadap skor acuan minimum (${p.zona.nama}), dengan rencana ${p.zona.frekuensiDrill}.`);
    }
    return { urutan: p.urutan, label: p.labelPribadi || (p.urutan === 1 ? 'impian' : 'cadangan'), kalimat: kal };
  });

  // Komitmen suara pertama siswa. Zona Pilihan 1 menentukan irama mingguan;
  // bila zona belum bisa dihitung, kalimatnya jujur mengatakan rencana
  // disusun bersama pembimbing -- bukan mengarang angka.
  const z1 = terdaftar[0]?.zona;
  const komitmen = [
    `Saya menetapkan ${terdaftar[0]?.namaProdi ? `${terdaftar[0].namaProdi} di ${terdaftar[0].namaPtn}` : 'pilihan utama saya'} sebagai tujuan utama saya pada seleksi tahun ${target?.tahunSeleksi || '—'}, dan saya memahami posisi saya hari ini terhadap tujuan itu.`,
    z1 && z1.id !== ZONA.TANPA_DATA
      ? `Saya menjalankan rencana belajar mingguan saya: ${z1.frekuensiDrill} sesuai zona kesiapan pilihan utama saya, bersama tentor dan pembimbing Gemilang.`
      : 'Saya menyusun rencana belajar mingguan saya bersama pembimbing Gemilang, dan meninjau ulang rencana itu setiap selesai try out.',
    'Saya mengerjakan setiap try out Gemilang sebagai latihan bertahan 195 menit: jujur pada waktu, jujur pada jawaban, dan membaca ulang setiap kesalahan saya sendiri.',
    'Saya memberitahu orang tua/wali saya tentang perkembangan saya setiap bulan, apa pun hasilnya, karena dukungan mereka bagian dari rencana saya.',
    'Bila hasil try out saya turun, saya tidak menurunkan tujuan saya sebelum berbincang dengan pembimbing; satu hasil bukan kemampuan saya.',
  ];

  return {
    kop: {
      institusi: 'BIMBEL GEMILANG',
      sub: 'Pusat Bimbingan & Konsultasi Perguruan Tinggi',
      judulDok: 'SURAT PERNYATAAN TARGET & KOMITMEN BELAJAR',
    },
    tanggal: meta.tanggal || tanggalSurat(new Date(), meta.kota),
    pembuka: 'Yang bertanda tangan di bawah ini:',
    identitas: [
      ['Nama', siswa?.nama || '—'],
      ['Nomor Induk Bimbel', siswa?.studentId || '—'],
      ['Kelas / Jenjang', `${siswa?.kelasSekolah || '—'} / ${siswa?.jenjang || '—'}`],
      ['Program', siswa?.kategori || 'Reguler'],
      ['Nama Orang Tua/Wali', namaOrtu || '—'],
    ],
    pernyataan: [
      `dengan sadar dan tanpa paksaan menyatakan berniat melanjutkan pendidikan tinggi melalui seleksi SNBT tahun ${target?.tahunSeleksi || '—'} dengan formasi pilihan berikut, sebagaimana hasil konsultasi saya bersama pembimbing Bimbel Gemilang:`,
    ],
    tabel: {
      kepala: ['Pilihan', 'Program Studi', 'Perguruan Tinggi', 'Tampung', 'Peminat', 'Skor Acuan', 'Syarat Khusus'],
      baris: barisTabel,
    },
    rincian,
    komitmen,
    penutup: 'Demikian surat pernyataan ini saya buat untuk menjadi pegangan saya belajar. Surat ini bukan janji kelulusan, melainkan janji usaha — dan saya memilih untuk menepatinya.',
    catatanKaki: 'Skor acuan pada surat ini merupakan hasil riset internal Bimbel Gemilang untuk keperluan perencanaan belajar, bukan pengumuman resmi panitia SNPMB. Data daya tampung & peminat mengikuti publikasi tahun seleksi yang tercantum.',
    tandaTangan: [
      { peran: 'Orang Tua/Wali', nama: namaOrtu || '(.................................)' },
      { peran: 'Siswa yang menyatakan', nama: siswa?.nama || '—' },
      { peran: 'Pembimbing Gemilang', nama: meta.namaKonselor || '(.................................)' },
    ],
    skorTercantum: skor,
    versiTarget: target?.versi || null,
  };
}

export default { isiSuratTarget, tanggalSurat };
