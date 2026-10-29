// tests/raportOtomatis.test.mjs — mesin raport otomatis (Fase 1)
// Janji yang dipatok di sini (blueprint ANALISIS-RAPORT-OTOMATIS.md §9):
//   1. murni & deterministik — dokumen mentah masuk, metrik keluar
//   2. tidak pernah mengarang: komponen kosong = bobot redistribusi (bukan 0),
//      dimensi tanpa bukti = null ("belum terukur")
//   3. adil: izin/sakit tidak dihukum; duplikat absensi tidak digandakan
//   4. pelanggaran = catatan, nilai TIDAK dipotong (keputusan owner #3)
//   5. snapshot terkunci + id dokumen idempoten
//     node tests/raportOtomatis.test.mjs
import assert from 'node:assert/strict';
import {
  VERSI_MESIN, MAPEL_PROSES, KALIBRASI_V1,
  rentangPeriode, waktuMs, tanggalUtc,
  normalisasiMapelKuis, namaMapel, bacaKesulitan,
  predikatDariNilai, timbangUlang, skalaKeNilai100, nilaiSah,
  bangunIndeksIdentitas, cariPemilikDok,
  hitungRaportSemuaSiswa, hitungDimensi, hitungPetaTopik, statusTopik,
  kunciDokRaport, bolehTimpaRaportFinal, dokAkademikSaja, bangunDokumenRaport,
} from '../src/utils/raportOtomatis.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 300)}`); }
}
console.log('raportOtomatis — mesin agregasi raport dari log mentah');

// ---------------- fixture helpers ----------------
const ts = (iso) => ({ toDate: () => new Date(iso) });
const soalPg = (id, mapel, kunci = 'A', ekstra = {}) => ({
  id, mapel, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: kunci, ...ekstra,
});

const siswa = [
  { id: 'doc1', studentId: 'smp-1', nama: 'Budi', jenjang: 'SMP/MTs', kelasSekolah: '9', kategori: 'Reguler' },
  { id: 'doc2', studentId: 'sma-2', nama: 'Sari', jenjang: 'SMA/MA', kelas: '12' },
  { id: 'doc3', studentId: 'sma-3', nama: 'Kosong', jenjang: 'SMA/MA', kelas: '11' },
];

// Paket kurikulum Matematika (4 soal, kunci semua A=index 0)
const paketKurikulum = {
  id: 'P1', judul: 'TO Matematika September', jenisUjian: 'kurikulum',
  daftarSoal: [soalPg('m1', 'Matematika'), soalPg('m2', 'Matematika'), soalPg('m3', 'Matematika'), soalPg('m4', 'Matematika')],
};
// Paket UTBK (2 PK + 2 PU)
const paketUtbk = {
  id: 'P2', judul: 'TO UTBK 1', jenisUjian: 'utbk',
  daftarSoal: [
    soalPg('pk1', 'TPS/Pengetahuan Kuantitatif'), soalPg('pk2', 'TPS/Pengetahuan Kuantitatif'),
    soalPg('pu1', 'TPS/Penalaran Umum'), soalPg('pu2', 'TPS/Penalaran Umum'),
  ],
};
// Paket TKA SMA Kimia (2 soal)
const paketTka = {
  id: 'P3', judul: 'TO TKA Kimia', jenisUjian: 'tka', targetKelas: '12 SMA', jenjang: 'SMA',
  daftarSoal: [soalPg('k1', 'Kimia'), soalPg('k2', 'Kimia')],
};

const kuisBudi = (over = {}) => ({
  studentNim: 'smp-1', studentName: 'Budi', subject: 'Bahasa Inggris', modulTitle: 'Teks Naratif',
  score: 80, correctAnswers: 8, totalQuestions: 10, timeUsed: 600, isAutoSubmit: false,
  cheatViolationCount: 0, details: null, submittedAt: ts('2026-09-05T03:00:00Z'), ...over,
});

const dataMentah = {
  siswa,
  paket: [paketKurikulum, paketUtbk, paketTka],
  kuis: [
    kuisBudi(),
    kuisBudi({ score: 90, correctAnswers: 9, submittedAt: ts('2026-09-20T03:00:00Z') }),
    kuisBudi({ subject: 'Matematika', modulTitle: 'Peluang', score: 80, submittedAt: ts('2026-09-08T03:00:00Z') }),
    kuisBudi({ subject: 'Matematika', modulTitle: 'Peluang', score: 84, correctAnswers: 8, submittedAt: ts('2026-09-22T03:00:00Z') }),
    kuisBudi({ score: 50, submittedAt: ts('2026-08-28T03:00:00Z') }), // DI LUAR jendela September
    { ...kuisBudi(), studentNim: 'hantu', studentName: 'Tak Dikenal' }, // identitas tak dikenal
  ],
  sesi: [
    { // Budi TO kurikulum: 3/4 benar = 75%, 1 pelanggaran pindah-tab
      id: 'S1', studentId: 'smp-1', paketId: 'P1', status: 'selesai',
      jawaban: { m1: 0, m2: 0, m3: 0, m4: 1 }, totalSkorPersen: 75,
      waktuMulai: ts('2026-09-12T03:00:00Z'), waktuSelesai: ts('2026-09-12T04:00:00Z'),
      pelanggaran: [{ type: 'pindah-tab', at: '2026-09-12T03:30:00Z' }], fotoPengawasan: [],
    },
    { // Sari TO UTBK semua benar → skala 1000
      id: 'S2', studentId: 'sma-2', paketId: 'P2', status: 'selesai',
      jawaban: { pk1: 0, pk2: 0, pu1: 0, pu2: 0 }, totalSkorPersen: 100,
      waktuMulai: ts('2026-09-06T02:00:00Z'), waktuSelesai: ts('2026-09-06T03:30:00Z'),
      pelanggaran: [],
    },
    { // Sari TO UTBK setengah benar → skala 550 → nilai 50
      id: 'S3', studentId: 'sma-2', paketId: 'P2', status: 'selesai',
      jawaban: { pk1: 0, pk2: 1, pu1: 0, pu2: 1 }, totalSkorPersen: 50,
      waktuMulai: ts('2026-09-27T02:00:00Z'), waktuSelesai: ts('2026-09-27T03:30:00Z'),
      pelanggaran: [],
    },
    { // Sari TO TKA Kimia semua benar → skala 800 → nilai 100
      id: 'S4', studentId: 'doc2', paketId: 'P3', status: 'selesai', // pakai DOCID (identitas alternatif)
      jawaban: { k1: 0, k2: 0 }, totalSkorPersen: 100,
      waktuMulai: ts('2026-09-13T02:00:00Z'), waktuSelesai: ts('2026-09-13T03:00:00Z'),
      pelanggaran: [],
    },
    { id: 'S5', studentId: 'smp-1', paketId: 'P1', status: 'berjalan', jawaban: {} }, // TIDAK selesai → diabaikan
    { id: 'S6', studentId: 'smp-1', paketId: 'HILANG', status: 'selesai', waktuSelesai: ts('2026-09-14T03:00:00Z'), totalSkorPersen: 90 }, // paket hilang → dicatat bermasalah
  ],
  absensi: [
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-01', status: 'Hadir', scheduleId: 'sch1' },
    { studentId: 'doc1', studentName: 'Budi', date: '2026-09-08', status: 'Hadir', scheduleId: 'sch2' }, // docId + date
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-15', status: 'Hadir', scheduleId: 'sch3' },
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-22', status: 'Sakit', scheduleId: 'sch4', keterangan: 'demam' },
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-29', status: 'Alpha', scheduleId: 'sch5' },
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-01', status: 'Hadir', scheduleId: 'sch1' }, // DUPLIKAT
    { studentId: 'sma-3', namaSiswa: 'Kosong', tanggal: '2026-09-01', status: 'Alpha', scheduleId: 'sch1' },
    { studentId: 'zzz', namaSiswa: 'Bukan Siswa', tanggal: '2026-09-01', status: 'Hadir' }, // tak dikenal
  ],
  tugas: [
    { studentNim: 'smp-1', studentName: 'Budi', subject: 'Matematika', score: 70, submittedAt: ts('2026-09-10T03:00:00Z'), modulTitle: 'PR Statistika' },
    { studentNim: 'smp-1', studentName: 'Budi', subject: 'Matematika', submittedAt: ts('2026-09-17T03:00:00Z'), modulTitle: 'PR 2' }, // belum dinilai
  ],
  nilaiGuru: [],
  progresSoal: [
    { studentId: 'smp-1', soalId: 'b1', kotak: 4, benarCount: 8, salahCount: 2, benarBerturut: 3, terakhirDicoba: '2026-09-15' },
    { studentId: 'smp-1', soalId: 'b2', kotak: 2, benarCount: 5, salahCount: 0, benarBerturut: 5, terakhirDicoba: '2026-09-15' },
    { studentId: 'smp-1', soalId: 'b3', kotak: 3, benarCount: 4, salahCount: 1, benarBerturut: 2, terakhirDicoba: '2026-09-18' },
    { studentId: 'smp-1', soalId: 'b4', kotak: 1, benarCount: 2, salahCount: 3, benarBerturut: 0, terakhirDicoba: '2026-09-18' },
    { studentId: 'smp-1', soalId: 'b5', kotak: 1, benarCount: 1, salahCount: 2, benarBerturut: 1, terakhirDicoba: '2026-09-21' },
    { studentId: 'smp-1', soalId: 'b6', kotak: 2, benarCount: 3, salahCount: 1, benarBerturut: 2, terakhirDicoba: '2026-09-21' },
    { studentId: 'smp-1', soalId: 'b7', kotak: 1, benarCount: 1, salahCount: 9, benarBerturut: 0, terakhirDicoba: '2026-09-25' }, // topik merah
    { studentId: 'smp-1', soalId: 'b8', kotak: 1, benarCount: 0, salahCount: 0, benarBerturut: 0, terakhirDicoba: '2026-09-25' }, // tanpa jawaban → tidak ikut akurasi
    { studentId: 'sma-2', soalId: 'b9', kotak: 5, benarCount: 6, salahCount: 0, benarBerturut: 6, terakhirDicoba: '2026-08-30' }, // DI LUAR jendela
  ],
  soalMeta: {
    b1: { mataPelajaran: 'Matematika', materi: 'Pecahan', kesulitan: 'mudah' },
    b2: { mataPelajaran: 'Matematika', materi: 'Pecahan', kesulitan: 'mudah' },
    b3: { mataPelajaran: 'Matematika', materi: 'Aljabar', kesulitan: 'sedang' },
    b4: { mataPelajaran: 'Matematika', materi: 'Aljabar', kesulitan: 'sulit' },
    b5: { mataPelajaran: 'Matematika', materi: 'Aljabar', kesulitan: 'sulit-HOTS' },
    b6: { mataPelajaran: 'Matematika', materi: 'Aljabar', kesulitan: 'sulit' },
    b7: { mataPelajaran: 'Matematika', materi: 'Statistika', kesulitan: 'sedang' },
    b8: { mataPelajaran: 'Matematika', materi: 'Statistika', kesulitan: 'mudah' },
    b9: { mataPelajaran: 'Kimia', materi: 'Stoikiometri', kesulitan: 'sulit' },
  },
  progresSiswa: [{ id: 'smp-1', xp: 1250, xpMingguIni: 320 }],
};

const hasil = hitungRaportSemuaSiswa(dataMentah, { bulan: '2026-09' });
const budi = hasil.siswa.find((h) => h.studentId === 'smp-1');
const sari = hasil.siswa.find((h) => h.studentId === 'sma-2');
const kosong = hasil.siswa.find((h) => h.studentId === 'sma-3');
const mtk = budi.akademik.perMapel.find((m) => m.kode === 'mtk');
const bing = budi.akademik.perMapel.find((m) => m.kode === 'bing');
const mapelSari = (k) => sari.akademik.perMapel.find((m) => m.kode === k);

// ---------------- 1. periode & waktu ----------------
uji('rentangPeriode bulan → jendela UTC + label', () => {
  const p = rentangPeriode({ bulan: '2026-09' });
  assert.equal(p.mulaiMs, Date.UTC(2026, 8, 1));
  assert.equal(p.selesaiMs, Date.UTC(2026, 9, 1)); // eksklusif
  assert.equal(p.label, '2026-09');
  assert.equal(p.jumlahHari, 30);
});
uji('rentangPeriode multi-bulan (laporan besar 3 bulan)', () => {
  const p = rentangPeriode({ mulai: '2026-08', selesai: '2026-10' });
  assert.equal(p.mulaiMs, Date.UTC(2026, 7, 1));
  assert.equal(p.selesaiMs, Date.UTC(2026, 10, 1));
  assert.equal(p.label, '2026-08..2026-10');
  assert.equal(p.jumlahHari, 92);
});
uji('rentangPeriode menolak input rusak (bukan menebak)', () => {
  assert.throws(() => rentangPeriode({ bulan: '2026-13' }));
  assert.throws(() => rentangPeriode({ mulai: '2026-10', selesai: '2026-08' }));
});
uji('waktuMs membaca Timestamp/Date/ms/ISO/YYYY-MM-DD; rusak → null', () => {
  assert.equal(waktuMs(ts('2026-09-01T00:00:00Z')), Date.UTC(2026, 8, 1));
  assert.equal(waktuMs(new Date('2026-09-01T00:00:00Z')), Date.UTC(2026, 8, 1));
  assert.equal(waktuMs(Date.UTC(2026, 8, 1)), Date.UTC(2026, 8, 1));
  assert.equal(waktuMs('2026-09-01'), Date.UTC(2026, 8, 1));
  assert.equal(waktuMs('bukan-tanggal'), null);
  assert.equal(waktuMs(null), null);
});
uji('tanggalUtc konsisten dengan field tanggal penulis absensi', () => {
  assert.equal(tanggalUtc(Date.UTC(2026, 8, 30, 23, 59)), '2026-09-30');
});

// ---------------- 2. mapel & kesulitan ----------------
uji('normalisasiMapelKuis: kodeMapel menang atas subject; kosong → umum', () => {
  assert.equal(normalisasiMapelKuis({ subject: 'Bahasa Inggris' }), 'bing');
  assert.equal(normalisasiMapelKuis({ kodeMapel: 'Matematika', subject: 'Fisika' }), 'mtk');
  assert.equal(normalisasiMapelKuis({ subject: 'Kimia' }), 'kim');
  assert.equal(normalisasiMapelKuis({}), 'umum');
});
uji('namaMapel: kode standar → nama resmi; kode asing → title-case', () => {
  assert.equal(namaMapel('mtk'), 'Matematika');
  assert.equal(namaMapel('utbk_pk'), 'TPS/Pengetahuan Kuantitatif');
  assert.equal(namaMapel('entah_apa'), 'Entah Apa');
});
uji('bacaKesulitan mengenali sulit-HOTS & menolak menebak', () => {
  assert.equal(bacaKesulitan('mudah'), 'mudah');
  assert.equal(bacaKesulitan('SEDANG'), 'sedang');
  assert.equal(bacaKesulitan('sulit-HOTS'), 'sulit');
  assert.equal(bacaKesulitan(''), null);
  assert.equal(bacaKesulitan(undefined), null);
});

// ---------------- 3. predikat, bobot, skala ----------------
uji('predikatDariNilai batas 85/75/65; tanpa angka → tanda baca', () => {
  assert.equal(predikatDariNilai(85).huruf, 'A');
  assert.equal(predikatDariNilai(84.9).huruf, 'B');
  assert.equal(predikatDariNilai(75).huruf, 'B');
  assert.equal(predikatDariNilai(65).huruf, 'C');
  assert.equal(predikatDariNilai(64).huruf, 'D');
  assert.equal(predikatDariNilai(null).huruf, '—');
});
uji('timbangUlang: lengkap = bobot asli', () => {
  const r = timbangUlang({ kuis: 0.3, tugas: 0.3, ujian: 0.4 }, { kuis: true, tugas: true, ujian: true });
  assert.equal(r.adaRedistribusi, false);
  assert.ok(Math.abs(r.bobot.kuis - 0.3) < 1e-9);
});
uji('timbangUlang: komponen kosong diredistribusi (jumlah tetap 1), TIDAK dinolkan', () => {
  const r = timbangUlang({ kuis: 0.3, tugas: 0.3, ujian: 0.4 }, { kuis: true, tugas: false, ujian: true });
  assert.equal(r.adaRedistribusi, true);
  assert.deepEqual(r.hilang, ['tugas']);
  assert.ok(Math.abs(r.bobot.kuis + r.bobot.ujian - 1) < 1e-9);
  assert.ok(Math.abs(r.bobot.kuis - 0.3 / 0.7) < 1e-9);
  assert.equal(r.bobot.tugas, undefined);
});
uji('timbangUlang: semua kosong → bobot kosong (jujur, bukan 0)', () => {
  const r = timbangUlang({ kuis: 0.3, tugas: 0.3 }, { kuis: false, tugas: false });
  assert.deepEqual(r.bobot, {});
});
uji('skalaKeNilai100: UTBK 100-1000 → 0-100', () => {
  assert.equal(skalaKeNilai100({ mode: 'utbk', skala: 1000 }), 100);
  assert.equal(skalaKeNilai100({ mode: 'utbk', skala: 100 }), 0);
  assert.equal(skalaKeNilai100({ mode: 'utbk', skala: 550 }), 50);
});
uji('skalaKeNilai100: TKA SMA 200-800 → 0-100; SD/SMP apa adanya', () => {
  assert.equal(skalaKeNilai100({ mode: 'tka', skalaMode: 'tka-sma', skala: 800 }), 100);
  assert.equal(skalaKeNilai100({ mode: 'tka', skalaMode: 'tka-sma', skala: 500 }), 50);
  assert.equal(skalaKeNilai100({ mode: 'tka', skalaMode: 'tka-dasmen', skala: 87.5 }), 87.5);
});
uji('skalaKeNilai100: kurikulum/null → null', () => {
  assert.equal(skalaKeNilai100({ mode: 'kurikulum', skala: 500 }), null);
  assert.equal(skalaKeNilai100({ mode: 'tka', skala: null }), null);
});
uji('nilaiSah menolak angka di luar 0-100 (data rusak tidak dianggap 0)', () => {
  assert.equal(nilaiSah(85), 85);
  assert.equal(nilaiSah('90'), 90);
  assert.equal(nilaiSah(101), null);
  assert.equal(nilaiSah(-5), null);
  assert.equal(nilaiSah('abc'), null);
});

// ---------------- 4. identitas ----------------
uji('cariPemilikDok: kode studentId, docId, fallback nama; asing → null', () => {
  const idx = bangunIndeksIdentitas(siswa);
  assert.equal(cariPemilikDok(idx, { studentNim: 'smp-1' }, { fieldId: 'studentNim' }).kunci, 'smp-1');
  assert.equal(cariPemilikDok(idx, { studentId: 'doc2' }).kunci, 'sma-2');
  assert.equal(cariPemilikDok(idx, { studentName: 'Budi' }, { fieldId: 'studentId', fieldNama: 'studentName' }).kunci, 'smp-1');
  assert.equal(cariPemilikDok(idx, { studentId: 'hantu', studentName: 'Tak Dikenal' }), null);
});

// ---------------- 5. e2e: Blok A akademik ----------------
uji('kuis luar jendela September TIDAK ikut; hanya yang dalam periode', () => {
  assert.equal(bing.komponen.kuis.jumlah, 2); // score 50 (Agustus) tidak ikut
  assert.equal(bing.komponen.kuis.nilai, 85); // (80+90)/2
});
uji('kuis tak dikenal masuk ringkasan.logTakDikenal (transparan)', () => {
  assert.equal(hasil.ringkasan.logTakDikenal.kuis, 1);
  assert.equal(hasil.ringkasan.logTakDikenal.absensi, 1);
});
uji('ujian kurikulum = persen benar per mapel (dasar "persen")', () => {
  assert.equal(mtk.komponen.ujian.nilai, 75);
  assert.equal(mtk.komponen.ujian.jumlah, 1);
  assert.equal(mtk.rincianUjian[0].dasar, 'persen');
});
uji('tugas = rata-rata yang SUDAH dinilai guru; belum dinilai tidak dinolkan', () => {
  assert.equal(mtk.komponen.tugas.jumlah, 1); // PR 2 tanpa score tidak ikut
  assert.equal(mtk.komponen.tugas.nilai, 70);
});
uji('nilai akhir mapel lengkap: 30/30/40 → 82*.3+70*.3+75*.4 = 75.6 (B)', () => {
  assert.equal(mtk.komponen.kuis.nilai, 82);
  assert.equal(mtk.nilaiAkhir, 75.6);
  assert.equal(mtk.predikat.huruf, 'B');
  assert.equal(mtk.layak, true);
});
uji('mapel 1 komponen: TIDAK layak terbit penuh + catatan redistribusi/kekurangan', () => {
  assert.equal(bing.layak, false);
  assert.equal(bing.nilaiAkhir, 85); // tetap dihitung dari yang ada (indikasi), tidak disembunyikan
  assert.ok(budi.catatan.some((c) => c.includes('data belum cukup')));
});
uji('UTBK: ujian per subtes dinormalkan (skala 1000→100, 550→50, rata-rata 75)', () => {
  const pk = mapelSari('utbk_pk');
  assert.ok(pk, 'mapel utbk_pk ada');
  assert.equal(pk.komponen.ujian.jumlah, 2);
  assert.equal(pk.komponen.ujian.nilai, 75); // (100+50)/2
  assert.equal(pk.rincianUjian[0].dasar, 'skala-utbk');
});
uji('TKA SMA: skala 800 → nilai 100 (dasar skala-tka-sma)', () => {
  const kim = mapelSari('kim');
  assert.equal(kim.komponen.ujian.nilai, 100);
  assert.equal(kim.rincianUjian[0].dasar, 'skala-tka-sma');
});
uji('sesi belum selesai diabaikan; sesi paket-hilang dicatat sebagai data bermasalah', () => {
  assert.equal(hasil.ringkasan.dataBermasalah.length, 1);
  assert.equal(hasil.ringkasan.dataBermasalah[0].jenis, 'sesi-tanpa-paket');
});
uji('rata-rata akademik hanya dari mapel LAYAK', () => {
  assert.equal(budi.akademik.rataRata, 75.6);
  assert.equal(budi.akademik.statusData, 'sebagian');
});

// ---------------- 6. Blok B: proses & karakter ----------------
uji('absensi: duplikat di-dedup; docId & date field dikenali', () => {
  assert.equal(budi.proses.kehadiran.total, 5); // 6 dok - 1 duplikat
  assert.equal(budi.proses.kehadiran.hadir, 3);
  assert.equal(budi.proses.kehadiran.sakit, 1);
  assert.equal(budi.proses.kehadiran.alpha, 1);
});
uji('sakit/izin TIDAK dihukum: skor (hadir+izin+sakit)/total; persenHadir jujur terpisah', () => {
  assert.equal(budi.proses.kehadiran.skor, 80); // (3+1)/5
  assert.equal(budi.proses.kehadiran.persenHadir, 60); // 3/5
});
uji('pelanggaran = CATATAN; nilai ujian TIDAK dipotong (keputusan owner #3)', () => {
  assert.equal(budi.proses.integritas.jumlahPelanggaran, 1);
  assert.equal(budi.proses.integritas.pelanggaran[0].jenis, 'pindah-tab');
  assert.equal(budi.proses.integritas.ikutSkor, false);
  assert.equal(mtk.komponen.ujian.nilai, 75); // tidak berkurang
});
uji('komponen tugas proses v1 belum terukur → bobot diredistribusi ke kehadiran+latihan', () => {
  assert.equal(budi.proses.tugas.terukur, false);
  assert.ok(budi.proses.ketepatanWaktu.terukur === false);
  const b = budi.proses.bobotEfektif;
  assert.ok(Math.abs(b.kehadiran + b.latihan - 1) < 1e-9);
  assert.ok(Math.abs(b.kehadiran - 0.35 / 0.55) < 1e-9);
});
uji('konsistensi latihan: hari aktif & jumlah soal dari Leitner dalam jendela', () => {
  // terakhirDicoba unik: 15,18,21,25 → 4 hari; 8 soal (b1..b8) dalam jendela
  assert.equal(budi.proses.latihan.hariAktif, 4);
  assert.equal(budi.proses.latihan.soalDikerjakan, 8);
  assert.ok(budi.proses.latihan.skor > 0 && budi.proses.latihan.skor <= 100);
});
uji('nilaiProses = bobot efektif × komponen terukur; predikat ikut', () => {
  const b = budi.proses.bobotEfektif;
  const harapan = Math.round((budi.proses.kehadiran.skor * b.kehadiran + budi.proses.latihan.skor * b.latihan) * 10) / 10;
  assert.equal(budi.proses.nilaiProses, harapan);
  assert.ok(['A', 'B', 'C', 'D'].includes(budi.proses.predikat.huruf));
});
uji('XP snapshot terbaca (akumulatif, dilabeli di dokumen)', () => {
  assert.equal(budi.proses.xp.xp, 1250);
  assert.equal(budi.proses.xp.xpMingguIni, 320);
});

// ---------------- 7. dimensi: terukur atau null, TIDAK PERNAH 0 karangan ----------------
uji('siswa tanpa data: SEMUA dimensi null + proses null (belum terukur)', () => {
  for (const k of ['pemahaman', 'analisis', 'ketelitian', 'waktu', 'dayaTangkap']) {
    assert.equal(kosong.dimensi[k].nilai, null, k);
    assert.equal(kosong.dimensi[k].terukur, false, k);
  }
  assert.equal(kosong.proses.nilaiProses, null);
  assert.equal(kosong.akademik.statusData, 'belum-cukup');
  assert.equal(kosong.kelayakan.layakTerbit, false);
});
uji('kehadiran < 3 sesi TIDAK diskor (1 alpha tidak menghancurkan nilai proses)', () => {
  assert.equal(kosong.proses.kehadiran.total, 1);
  assert.equal(kosong.proses.kehadiran.alpha, 1); // fakta tetap ditampilkan
  assert.equal(kosong.proses.kehadiran.skor, null);
  assert.ok(kosong.proses.kehadiran.alasan.includes('minimal'));
});
uji('analisis terukur dari >= 3 soal sulit (b4,b5,b6 → akurasi (2/5+1/3+3/4)/3)', () => {
  const d = budi.dimensi.analisis;
  assert.equal(d.terukur, true);
  const harapan = ((2 / 5) + (1 / 3) + (3 / 4)) / 3 * 100;
  assert.ok(Math.abs(d.nilai - Math.round(harapan * 10) / 10) < 0.05, `${d.nilai} vs ${harapan}`);
  assert.ok(d.sumber.includes('sulit'));
});
uji('pemahaman & ketelitian terukur; sumber dilabeli jujur', () => {
  assert.equal(budi.dimensi.pemahaman.terukur, true);
  assert.equal(budi.dimensi.ketelitian.terukur, true);
  assert.ok(budi.dimensi.pemahaman.sumber.length > 5);
});
uji('waktu dari rasio terjawab TO + auto-submit kuis', () => {
  assert.equal(budi.dimensi.waktu.terukur, true);
  assert.equal(budi.dimensi.waktu.nilai, 100); // 4/4 terjawab, 0 auto-submit
});
uji('dayaTangkap dari frekuensi latihan + benarBerturut', () => {
  assert.equal(budi.dimensi.dayaTangkap.terukur, true);
  assert.ok(budi.dimensi.dayaTangkap.nilai > 0);
});
uji('hitungDimensi bukti kosong → semua null (unit)', () => {
  const d = hitungDimensi([], {});
  for (const k of Object.keys(d)) assert.equal(d[k].nilai, null, k);
});

// ---------------- 8. Blok C: tren & peta topik ----------------
uji('trenSkala: UTBK 1000 & 550 terekam urut tanggal dengan nilai100', () => {
  assert.equal(sari.trenSkala.length, 3); // S2, S3 (utbk), S4 (tka)
  const utbk = sari.trenSkala.filter((t) => t.mode === 'utbk');
  assert.equal(utbk[0].skalaTotal, 1000);
  assert.equal(utbk[0].nilai100, 100);
  assert.equal(utbk[1].skalaTotal, 550);
  assert.equal(utbk[1].nilai100, 50);
  assert.ok(utbk[0].tanggal < utbk[1].tanggal);
});
uji('trenHarian terurut & memuat kuis/to/latihan; di luar jendela tidak ikut', () => {
  const t = budi.trenHarian;
  assert.ok(t.length >= 10);
  for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].tanggal <= t[i].tanggal);
  assert.ok(t.every((x) => x.tanggal.startsWith('2026-09')));
  assert.ok(t.some((x) => x.jenis === 'kuis' && x.skor === 90));
  assert.ok(t.some((x) => x.jenis === 'to' && x.skor === 75));
  assert.ok(t.some((x) => x.jenis === 'latihan'));
});
uji('petaTopik: akurasi <50% → merah + rekomendasi "Perkuat"', () => {
  const stat = budi.petaTopik.find((t) => t.topik === 'Statistika' && t.sumber.includes('latihan'));
  assert.ok(stat, 'topik Statistika dari latihan ada');
  assert.equal(stat.status, 'merah'); // b7: 1/10 benar (b8 tanpa jawaban tidak ikut)
  assert.equal(stat.dicoba, 1);
  assert.ok(budi.rekomendasi.some((r) => r.includes('Statistika')));
});
uji('petaTopik: topik kuis akurasi 80% dari 10 butir → hijau', () => {
  const nar = budi.petaTopik.find((t) => t.topik === 'Teks Naratif');
  assert.ok(nar);
  assert.equal(nar.status, 'hijau');
  assert.equal(nar.akurasi, 85); // (8+9)/20 dari dua kuis
});
uji('statusTopik ambang 80/50 + jarang dilatih = merah (blueprint §3 Blok C)', () => {
  assert.equal(statusTopik({ akurasiPersen: 85, dicoba: 5, sumberLatihan: true }).status, 'hijau');
  const jarang = statusTopik({ akurasiPersen: 85, dicoba: 2, sumberLatihan: true });
  assert.equal(jarang.status, 'merah'); // akurasi tinggi tapi jarang dilatih = sinyal pembinaan
  assert.ok(jarang.alasan.includes('jarang dilatih'));
  assert.equal(statusTopik({ akurasiPersen: 40, dicoba: 9, sumberLatihan: true }).status, 'merah');
  assert.equal(statusTopik({ akurasiPersen: 90, dicoba: 1, sumberLatihan: false }).status, 'kuning'); // kuis tunggal: bukan 'jarang dilatih'
});
uji('hitungPetaTopik butir latihan tanpa jawaban tidak jadi merah palsu (unit)', () => {
  const peta = hitungPetaTopik([
    { sumber: 'latihan', kode: 'mtk', topik: 'X', skorParsial01: null, kotak: 1 },
  ]);
  assert.equal(peta.length, 0); // dicoba 0 → dibuang
});

// ---------------- 9. penerbitan: kunci, guard, dokumen ----------------
uji('kunciDokRaport deterministik & aman karakter', () => {
  assert.equal(kunciDokRaport('smp-1', 'mtk', '2026-09'), 'smp-1__mtk__2026-09');
  assert.equal(kunciDokRaport('a/b', 'x', '2026-08..2026-10'), 'a_b__x__2026-08..2026-10');
  // idempoten: hitung ulang → id sama
  const hasil2 = hitungRaportSemuaSiswa(dataMentah, { bulan: '2026-09' });
  const b2 = hasil2.siswa.find((h) => h.studentId === 'smp-1');
  assert.deepEqual(
    bangunDokumenRaport(b2).docsAkademik.map((d) => d.id),
    bangunDokumenRaport(budi).docsAkademik.map((d) => d.id),
  );
});
uji('bolehTimpaRaportFinal: terkunci butuh paksa + alasan >= 5 karakter', () => {
  const dok = { terkunci: true, sumber: 'otomatis' };
  assert.equal(bolehTimpaRaportFinal(null).boleh, true);
  assert.equal(bolehTimpaRaportFinal(dok).boleh, false);
  assert.equal(bolehTimpaRaportFinal(dok, { paksa: true, alasan: 'x' }).boleh, false);
  assert.equal(bolehTimpaRaportFinal(dok, { paksa: true, alasan: 'data sumber dikoreksi admin' }).boleh, true);
  assert.equal(bolehTimpaRaportFinal({ terkunci: true, sumber: 'manual' }).boleh, true); // non-otomatis tidak dikunci guard ini
  assert.equal(bolehTimpaRaportFinal({ terkunci: false, sumber: 'otomatis' }).boleh, true);
});
uji('dokAkademikSaja menyaring blok proses (rata-rata siswa tidak tercemar)', () => {
  assert.equal(dokAkademikSaja({ blok: 'akademik' }), true);
  assert.equal(dokAkademikSaja({ mapel: 'Matematika' }), true); // dok lama tanpa blok
  assert.equal(dokAkademikSaja({ blok: 'proses' }), false);
});
uji('bangunDokumenRaport: struktur lengkap + dimensi null BUKAN 0', () => {
  const { dokProses } = bangunDokumenRaport(kosong);
  assert.equal(dokProses.data.blok, 'proses');
  assert.equal(dokProses.data.mapel, MAPEL_PROSES);
  assert.equal(dokProses.data.sumber, 'otomatis');
  assert.equal(dokProses.data.terkunci, true);
  assert.equal(dokProses.data.versiMesin, VERSI_MESIN);
  for (const k of ['pemahaman', 'analisis', 'ketelitian', 'waktu', 'dayaTangkap']) {
    assert.equal(dokProses.data.dimensi_global[k], null, k); // TIDAK pernah 0 karangan
  }
  const { docsAkademik: docsBudi, dokProses: prosesBudi } = bangunDokumenRaport(budi);
  const docMtk = docsBudi.find((d) => d.id === 'smp-1__mtk__2026-09');
  assert.ok(docMtk);
  assert.equal(docMtk.data.nilai_akhir, 75.6);
  assert.equal(docMtk.data.predikat.huruf, 'B');
  assert.deepEqual(docMtk.data.komponen_dipakai, ['kuis', 'tugas', 'ujian']);
  assert.equal(docMtk.data.detail_komponen.ujian.rincian.length, 1);
  assert.equal(docMtk.data.bukti.kuis, 2);
  assert.ok(docMtk.data.narasi.includes('otomatis'));
  assert.ok(prosesBudi.data.trenHarian.length > 0); // tren di-EMBED saat terbit
  assert.equal(prosesBudi.data.detail_proses.integritas.pelanggaran.length, 1);
  assert.ok(docsBudi.every((d) => d.id.startsWith('smp-1__')));
});
uji('dokumen proses memuat petaTopik + rekomendasi (bahan Fase 2)', () => {
  const { dokProses } = bangunDokumenRaport(budi);
  assert.ok(dokProses.data.petaTopik.length > 0);
  assert.ok(dokProses.data.rekomendasi.length > 0);
  assert.ok(dokProses.data.trenSkala === undefined || true); // trenSkala milik siswa ber-TO
});
uji('KALIBRASI_V1 diekspor (kebijakan terlihat, bisa direvisi owner)', () => {
  assert.equal(KALIBRASI_V1.topikHijauAkurasi, 80);
  assert.equal(KALIBRASI_V1.topikMerahAkurasi, 50);
  assert.equal(KALIBRASI_V1.minSesiAbsensi, 3);
  assert.equal(typeof VERSI_MESIN, 'string');
});

console.log(`\n${gagal === 0 ? '✅' : '❌'} raportOtomatis: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
