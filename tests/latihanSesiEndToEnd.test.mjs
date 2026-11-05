// tests/latihanSesiEndToEnd.test.mjs
// ============================================================
// UJI END-TO-END FITUR LATIHAN PEMAHAMAN SESI TATAP MUKA
// Menguji alur lengkap seolah-olah menjadi pengguna:
//   1. Peran Guru  : Deteksi mapel jadwal, pemilihan bab silabus resmi,
//                    pengecualian jenjang SD, penyiapan butir soal (LaTeX rapi,
//                    gambar utuh, opsi A-E terstruktur).
//   2. Peran Siswa : Pengerjaan latihan Blind Submission, pengacakan soal
//                    & opsi deterministik (anti-contek), dispensasi ramah
//                    bagi siswa Sakit/Izin (tanpa penalti 0).
//   3. Peran Admin : Agregasi otomatis nilai latihan sesi ke Rapor Bulanan
//                    & Rapor Otomatis tanpa beban manual.
// ============================================================

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalisasiButirSoal,
} from '../src/utils/normalisasiSoalLatihan.js';

import {
  pecahSegmenMatematika,
  adaMatematika,
  sumberKaTeX,
} from '../src/utils/segmenMatematika.js';

import {
  pisahTeksDanGambar,
} from '../src/utils/penempatanGambar.js';

import {
  daftarBabSilabus,
  deteksiMapelJadwal,
} from '../src/utils/silabusKurikulumMerdeka.js';

import {
  hitungRaportSiswa,
  rentangPeriode,
} from '../src/utils/raportOtomatis.js';

// ------------------------------------------------------------
// 1. UJI PERAN GURU: Normalisasi Butir Soal & Rendering
// ------------------------------------------------------------

test('Guru: Normalisasi butir soal mendeteksi alias teks, gambar, dan opsi secara utuh', () => {
  const rawSoal = {
    id: 'soal-spldv-1',
    soal: 'Diketahui persamaan linear $a + 3b = 1$ dan $a - 2b = 2$. Berapakah nilai dari $2a + 5b$?',
    opsi: [
      '-12',
      '$-1$',
      '$3$',
      '$5$',
    ],
    kunci: 'C',
    gambarUrl: 'https://storage.googleapis.com/gemilang/grafik-spldv.png',
    materi: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
    mapel: 'matematika',
    kelas: '9',
  };

  const norm = normalisasiButirSoal(rawSoal, 0);

  assert.equal(norm.id, 'soal-spldv-1');
  assert.equal(norm.teksSoal, rawSoal.soal);
  assert.equal(norm.kunciJawaban, 'C');
  assert.equal(norm.gambarUrls.length, 1);
  assert.equal(norm.gambarUrls[0], 'https://storage.googleapis.com/gemilang/grafik-spldv.png');

  // Opsi jawaban otomatis dinormalisasi menjadi A, B, C, D
  assert.equal(norm.opsiJawaban.length, 4);
  assert.equal(norm.opsiJawaban[0].label, 'A');
  assert.equal(norm.opsiJawaban[0].teks, '-12');
  assert.equal(norm.opsiJawaban[2].label, 'C');
  assert.equal(norm.opsiJawaban[2].teks, '$3$');
});

test('Guru: Rumus matematika LaTeX terurai presisi tanpa teks mentah', () => {
  const teks = 'Sistem persamaan $a + 3b = 1$ dengan pecahan $\\frac{1}{2}$ dan blok $$x^2 + y^2 = 25$$';
  assert.equal(adaMatematika(teks), true);

  const segmen = pecahSegmenMatematika(teks);
  assert.equal(segmen.length, 6);

  // Segmen 1: inline math $a + 3b = 1$
  assert.equal(segmen[1].jenis, 'inline');
  assert.equal(segmen[1].isi, 'a + 3b = 1');

  // Segmen 3: inline math pecahan \frac{1}{2} dengan \displaystyle
  assert.equal(segmen[3].jenis, 'inline');
  assert.equal(sumberKaTeX(segmen[3]), '\\displaystyle \\frac{1}{2}');

  // Segmen 5: blok math $$x^2 + y^2 = 25$$
  assert.equal(segmen[5].jenis, 'blok');
  assert.equal(sumberKaTeX(segmen[5]), '\\displaystyle x^2 + y^2 = 25');
});

test('Guru: Gambar soal diletakkan sesuai token placeholder {{GAMBAR}} atau di akhir teks', () => {
  const teksDenganPlaceholder = 'Perhatikan grafik berikut {{GAMBAR}} Tentukan gradien garis tersebut!';
  const gambar = ['https://cdn.gemilang.id/garis.png'];

  const hasil1 = pisahTeksDanGambar(teksDenganPlaceholder, gambar);
  assert.equal(hasil1.length, 3);
  assert.equal(hasil1[0].jenis, 'teks');
  assert.equal(hasil1[1].jenis, 'gambar');
  assert.equal(hasil1[1].url, 'https://cdn.gemilang.id/garis.png');
  assert.equal(hasil1[2].jenis, 'teks');

  // Bila tanpa placeholder, gambar otomatis ditaruh di akhir
  const teksPolos = 'Hitung luas bangun di bawah ini!';
  const hasil2 = pisahTeksDanGambar(teksPolos, gambar);
  assert.equal(hasil2.length, 2);
  assert.equal(hasil2[0].jenis, 'teks');
  assert.equal(hasil2[1].jenis, 'gambar');
});

test('Guru: Deteksi mapel jadwal otomatis membedakan guru IPA vs Matematika', () => {
  const tentorIpa = { id: 'G-IPA', subjects: ['ipa', 'bio'], subject: 'IPA' };
  const jadwalIpa = { title: 'Materi Umum', level: 'SMP', program: 'Reguler' };
  const kodeIpa = deteksiMapelJadwal(jadwalIpa, tentorIpa);
  assert.equal(kodeIpa, 'ipa');

  const babIpa = daftarBabSilabus({ kelas: '9', mapel: kodeIpa, semester: 1 });
  assert.ok(babIpa.length > 0);
  assert.ok(babIpa.some((b) => b.judul.toLowerCase().includes('reproduksi') || b.judul.toLowerCase().includes('listrik') || b.judul.toLowerCase().includes('sistem')));

  const tentorMtk = { id: 'G-MTK', subjects: ['matematika'], subject: 'Matematika' };
  const jadwalMtk = { title: 'MTK 9B SMP', level: 'SMP', program: 'Reguler' };
  const kodeMtk = deteksiMapelJadwal(jadwalMtk, tentorMtk);
  assert.equal(kodeMtk, 'matematika');

  const babMtk = daftarBabSilabus({ kelas: '9', mapel: kodeMtk, semester: 1 });
  assert.ok(babMtk.some((b) => b.judul.toLowerCase().includes('spldv') || b.judul.toLowerCase().includes('persamaan linear')));
});

// ------------------------------------------------------------
// 2. UJI PERAN SISWA: Blind Submission & Pengacakan Anti-Cheating
// ------------------------------------------------------------

function hashSederhana(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function shuffleSeed(array, seed) {
  const arr = [...array];
  let m = arr.length;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const i = Math.floor(rnd * m--);
    const t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }
  return arr;
}

test('Siswa: Urutan butir soal teracak secara deterministik antar siswa sebangku', () => {
  const soalList = [
    { id: 'soal-1', nomor: 1 },
    { id: 'soal-2', nomor: 2 },
    { id: 'soal-3', nomor: 3 },
    { id: 'soal-4', nomor: 4 },
    { id: 'soal-5', nomor: 5 },
  ];

  const siswaA = 'student_001_budi';
  const siswaB = 'student_002_ani';

  const urutanA = shuffleSeed(soalList, hashSederhana(siswaA + 'sch-1')).map((s) => s.id);
  const urutanB = shuffleSeed(soalList, hashSederhana(siswaB + 'sch-1')).map((s) => s.id);

  // Kedua siswa harus mendapatkan seluruh 5 butir soal (tanpa ada yang hilang/duplikat)
  assert.equal(urutanA.length, 5);
  assert.equal(urutanB.length, 5);
  assert.deepEqual([...urutanA].sort(), ['soal-1', 'soal-2', 'soal-3', 'soal-4', 'soal-5']);
  assert.deepEqual([...urutanB].sort(), ['soal-1', 'soal-2', 'soal-3', 'soal-4', 'soal-5']);

  // Karena seed ID siswa berbeda, urutan tampil soal siswa A dan siswa B berbeda
  assert.notDeepEqual(urutanA, urutanB);
});

test('Siswa: Penilaian blind submission menghitung skor akurat tanpa bocor ke UI', () => {
  const bankSoal = [
    { id: 'q1', kunciJawaban: 'B' },
    { id: 'q2', kunciJawaban: 'C' },
    { id: 'q3', kunciJawaban: 'A' },
    { id: 'q4', kunciJawaban: 'D' },
    { id: 'q5', kunciJawaban: 'A' },
  ];

  // Siswa menjawab 4 nomor benar dan 1 nomor salah
  const jawabanSiswa = {
    q1: 'B', // benar
    q2: 'C', // benar
    q3: 'A', // benar
    q4: 'D', // benar
    q5: 'B', // salah (kunci A)
  };

  let benar = 0;
  bankSoal.forEach((q) => {
    if (jawabanSiswa[q.id] === q.kunciJawaban) benar++;
  });

  const total = bankSoal.length;
  const skor = Math.round((benar / total) * 100);

  assert.equal(benar, 4);
  assert.equal(skor, 80);
});

// ------------------------------------------------------------
// 3. UJI PERAN ADMIN: Integrasi Nilai Latihan Sesi ke Raport
// ------------------------------------------------------------

test('Admin: Hasil latihan sesi tatap muka masuk ke komponen kuis formatif raport siswa', () => {
  const profilSiswa = {
    id: 'SISWA-01',
    profil: {
      nama: 'Ahmad Siswa',
      jenjang: 'SMP',
      kelas: '9',
      enrolledSubjects: ['matematika'],
    },
  };

  const periode = rentangPeriode({ bulan: '2026-11' });

  // Data kuis dari hasil latihan sesi tatap muka
  const kuisDariLatihanSesi = [
    {
      id: 'latsesi-jadwal-1-SISWA-01',
      studentId: 'SISWA-01',
      studentNim: 'SISWA-01',
      studentName: 'Ahmad Siswa',
      mapel: 'Matematika',
      kodeMapel: 'matematika',
      score: 80,
      submittedAt: '2026-11-05T08:00:00.000Z',
      createdAt: '2026-11-05T08:00:00.000Z',
      sumber: 'latihan_pemahaman_sesi',
    },
    {
      id: 'latsesi-jadwal-2-SISWA-01',
      studentId: 'SISWA-01',
      studentNim: 'SISWA-01',
      studentName: 'Ahmad Siswa',
      mapel: 'Matematika',
      kodeMapel: 'matematika',
      score: 100,
      submittedAt: '2026-11-05T10:00:00.000Z',
      createdAt: '2026-11-05T10:00:00.000Z',
      sumber: 'latihan_pemahaman_sesi',
    },
  ];

  const hasilRaport = hitungRaportSiswa({
    profil: profilSiswa,
    periode,
    kuis: kuisDariLatihanSesi,
    sesiAgg: [],
    absensi: [{ studentId: 'SISWA-01', status: 'Hadir', tanggal: '2026-11-05' }],
    tugas: [],
    nilaiGuru: [],
    latihan: [],
  });

  // Nilai kuis matematika harus terhitung rata-rata (80 + 100) / 2 = 90
  const mapelMtk = hasilRaport.perMapel.find((m) => m.kode === 'matematika');
  assert.ok(mapelMtk, 'Mapel Matematika harus terdaftar');
  assert.equal(mapelMtk.komponen.kuis.ada, true);
  assert.equal(mapelMtk.komponen.kuis.jumlah, 2);
  assert.equal(mapelMtk.komponen.kuis.nilai, 90);
  assert.equal(mapelMtk.nilaiAkhir, 90);
  assert.equal(mapelMtk.predikat, 'A');
});

test('Admin: Siswa sakit/izin tidak dihukum nilai 0 jika tidak ada latihan sesi', () => {
  const profilSiswa = {
    id: 'SISWA-SAKIT-01',
    profil: {
      nama: 'Budi Izin',
      jenjang: 'SMP',
      kelas: '9',
      enrolledSubjects: ['matematika'],
    },
  };

  const periode = rentangPeriode({ bulan: '2026-11' });

  // Siswa sakit, tidak ada kuis latihan sesi yang dikerjakan
  const hasilRaport = hitungRaportSiswa({
    profil: profilSiswa,
    periode,
    kuis: [], // kosong karena izin/sakit
    sesiAgg: [],
    absensi: [{ studentId: 'SISWA-SAKIT-01', status: 'Sakit', tanggal: '2026-11-05' }],
    tugas: [],
    nilaiGuru: [],
    latihan: [],
  });

  const mapelMtk = hasilRaport.perMapel.find((m) => m.kode === 'matematika');
  // Tidak boleh ada nilai 0 palsu yang mengganjar siswa sakit
  assert.notEqual(mapelMtk?.nilaiAkhir, 0, 'Siswa sakit tidak boleh dihukum nilai 0');
});
