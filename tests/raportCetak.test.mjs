// tests/raportCetak.test.mjs — lapisan cetak & presentasi raport otomatis (Fase 2)
// Janji yang dipatok di sini (blueprint ANALISIS-RAPORT-OTOMATIS.md §9 Fase 2):
//   1. MURNI — tidak mengimpor Firebase; HTML/SVG dibangun dari dokumen snapshot
//   2. JUJUR — null dicetak '—'/'belum terukur', tidak pernah jadi 0; tidak ada
//      NaN/undefined yang bocor ke cetakan
//   3. AMAN — semua teks dinamis di-escape (nama siswa/paket/catatan guru)
//   4. pelanggaran = catatan ("nilai tidak dipotong"), redistribusi bobot tercetak
//   5. cetak massal: sampul + page break per siswa, CSS hanya sekali
//   6. kompatibel dengan keluaran NYATA mesin (bangunDokumenRaport) — anti-drift
//     node tests/raportCetak.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  escapeHtml, labelPeriodeManusiawi, dataDok, kelompokDokOtomatis,
  poinSparkline, svgSparkline, warnaPredikatHuruf, warnaStatusTopik,
  poinRadar, svgRadar, seriRadarDariModel, LOGO_KOP, NAMA_PENERBIT,
  siapkanModelRaport, htmlRaportSiswa, htmlRaportMassal, judulCetakRaport,
  trenSemangat, petaTampil, rekomendasiTampil, narasiLaporan, deskripsiMapel,
} from '../src/utils/raportCetak.js';
import { hitungRaportSemuaSiswa, bangunDokumenRaport, VERSI_MESIN } from '../src/utils/raportOtomatis.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 300)}`); }
}
console.log('raportCetak — HTML cetakan & helper tampilan raport otomatis');

// ---------------- fixture mesin NYATA (anti-drift bentuk dokumen) ----------------
const ts = (iso) => ({ toDate: () => new Date(iso) });
const soalPg = (id, mapel, kunci = 'A') => ({
  id, mapel, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: kunci,
});
const dataMentah = {
  siswa: [
    { id: 'doc1', studentId: 'smp-1', nama: 'Budi', jenjang: 'SMP/MTs', kelasSekolah: '9', kategori: 'Reguler' },
    { id: 'doc2', studentId: 'sma-2', nama: 'Sari', jenjang: 'SMA/MA', kelas: '12' },
  ],
  paket: [{
    id: 'P1', judul: 'TO Matematika September', jenisUjian: 'kurikulum',
    daftarSoal: [soalPg('m1', 'Matematika'), soalPg('m2', 'Matematika'), soalPg('m3', 'Matematika'), soalPg('m4', 'Matematika')],
  }],
  kuis: [
    { studentNim: 'smp-1', studentName: 'Budi', subject: 'Bahasa Inggris', modulTitle: 'Teks Naratif', score: 80, correctAnswers: 8, totalQuestions: 10, timeUsed: 600, isAutoSubmit: false, cheatViolationCount: 0, submittedAt: ts('2026-09-05T03:00:00Z') },
    { studentNim: 'smp-1', studentName: 'Budi', subject: 'Bahasa Inggris', modulTitle: 'Teks Naratif', score: 90, correctAnswers: 9, totalQuestions: 10, timeUsed: 500, isAutoSubmit: false, cheatViolationCount: 0, submittedAt: ts('2026-09-20T03:00:00Z') },
    { studentNim: 'smp-1', studentName: 'Budi', subject: 'Matematika', modulTitle: 'Peluang', score: 84, correctAnswers: 8, totalQuestions: 10, timeUsed: 700, isAutoSubmit: false, cheatViolationCount: 0, submittedAt: ts('2026-09-22T03:00:00Z') },
    { studentNim: 'sma-2', studentName: 'Sari', subject: 'Bahasa Inggris', modulTitle: 'Reading', score: 70, correctAnswers: 7, totalQuestions: 10, timeUsed: 650, isAutoSubmit: false, cheatViolationCount: 0, submittedAt: ts('2026-09-11T03:00:00Z') },
  ],
  sesi: [{
    id: 'S1', studentId: 'smp-1', paketId: 'P1', status: 'selesai',
    jawaban: { m1: 0, m2: 0, m3: 0, m4: 1 }, totalSkorPersen: 75,
    waktuMulai: ts('2026-09-12T03:00:00Z'), waktuSelesai: ts('2026-09-12T04:00:00Z'),
    pelanggaran: [{ type: 'pindah-tab', at: '2026-09-12T03:30:00Z' }],
  }],
  absensi: [
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-05', status: 'hadir', scheduleId: 'a1' },
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-12', status: 'hadir', scheduleId: 'a2' },
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-19', status: 'sakit', scheduleId: 'a3' },
    { studentId: 'smp-1', namaSiswa: 'Budi', tanggal: '2026-09-26', status: 'hadir', scheduleId: 'a4' },
  ],
  tugas: [
    { studentNim: 'smp-1', studentName: 'Budi', subject: 'Bahasa Inggris', modulTitle: 'Essay', score: 90, submittedAt: ts('2026-09-15T03:00:00Z') },
  ],
  nilaiGuru: [],
  progresSoal: [
    { studentId: 'smp-1', soalId: 'q1', terakhirDicoba: '2026-09-10', kotak: 3, benarCount: 2, salahCount: 1, benarBerturut: 2 },
  ],
  soalMeta: { q1: { mataPelajaran: 'Matematika', materi: 'Peluang', kesulitan: 'mudah' } },
  progresSiswa: [{ id: 'doc1', studentId: 'smp-1', xp: 350, xpMingguIni: 40 }],
};
const hasil = hitungRaportSemuaSiswa(dataMentah, { bulan: '2026-09' });
const budi = hasil.siswa.find((s) => s.studentId === 'smp-1');
const sari = hasil.siswa.find((s) => s.studentId === 'sma-2');
const dokBudi = bangunDokumenRaport(budi);
const dokSari = bangunDokumenRaport(sari);

// dokumen bentuk "datar" seperti hasil baca Firestore ({id, ...data})
const datarDari = (d) => ({ id: d.id, ...d.data });
const htmlBudi = htmlRaportSiswa({
  dokAkademik: dokBudi.docsAkademik.map((d) => d.data),
  dokProses: dokBudi.dokProses.data,
  catatanGuru: 'Ananda <b>rajin</b> & konsisten.',
  identitas: { jenjang: budi.jenjang },
});

// ---------------- kemurnian ----------------
uji('raportCetak.js TIDAK mengimpor firebase & tanpa path absolut', () => {
  const src = readFileSync(new URL('../src/utils/raportCetak.js', import.meta.url), 'utf8');
  assert.equal(/from\s+['"]firebase/i.test(src), false);
  assert.equal(src.includes('/home/user/'), false);
});

// ---------------- escapeHtml & label periode ----------------
uji('escapeHtml: lima karakter berbahaya', () => {
  assert.equal(escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(0), '0');
});
uji('labelPeriodeManusiawi: bulan, rentang setahun, rentang lintas tahun, sampah', () => {
  assert.equal(labelPeriodeManusiawi('2026-08'), 'Agustus 2026');
  assert.equal(labelPeriodeManusiawi('2026-08..2026-10'), 'Agustus–Oktober 2026 (laporan besar)');
  assert.equal(labelPeriodeManusiawi('2025-11..2026-02'), 'November–Februari 2025–2026 (laporan besar)');
  assert.equal(labelPeriodeManusiawi('entah'), 'entah');
  assert.equal(labelPeriodeManusiawi(''), '');
});
uji('dataDok: {id,data} maupun datar, null aman', () => {
  assert.deepEqual(dataDok({ id: 'x', data: { a: 1 } }), { a: 1 });
  assert.deepEqual(dataDok({ id: 'x', a: 1 }), { id: 'x', a: 1 });
  assert.equal(dataDok(null), null);
});

// ---------------- kelompokDokOtomatis ----------------
uji('kelompokDokOtomatis: grup per periode, laporan besar duluan, manual disaring', () => {
  const docs = [
    { id: 'a', sumber: 'otomatis', blok: 'akademik', periode: '2026-09', mapel: 'Matematika', studentName: 'Budi' },
    { id: 'b', sumber: 'otomatis', blok: 'proses', periode: '2026-09', studentName: 'Budi' },
    { id: 'c', sumber: 'otomatis', blok: 'akademik', periode: '2026-08..2026-10', studentName: 'Budi' },
    { id: 'd', sumber: 'otomatis', blok: 'akademik', periode: '2026-08', studentName: 'Budi' },
    { id: 'e', sumber: 'manual', periode: '2026-09', mapel: 'Fisika' },
  ];
  const g = kelompokDokOtomatis(docs);
  assert.deepEqual(g.map((x) => x.periode), ['2026-08..2026-10', '2026-09', '2026-08']);
  const sep = g.find((x) => x.periode === '2026-09');
  assert.equal(sep.akademik.length, 1);
  assert.equal(sep.akademik[0].mapel, 'Matematika');
  assert.equal(sep.proses.blok, 'proses');
  assert.equal(g.find((x) => x.periode === '2026-08..2026-10').labelManusiawi, 'Agustus–Oktober 2026 (laporan besar)');
});
uji('kelompokDokOtomatis: akademik urut mapel + masukan bukan array aman', () => {
  const g = kelompokDokOtomatis([
    { sumber: 'otomatis', blok: 'akademik', periode: '2026-09', mapel: 'ZZZ' },
    { sumber: 'otomatis', blok: 'akademik', periode: '2026-09', mapel: 'AAA' },
  ]);
  assert.deepEqual(g[0].akademik.map((a) => a.mapel), ['AAA', 'ZZZ']);
  assert.deepEqual(kelompokDokOtomatis(null), []);
});

// ---------------- sparkline ----------------
uji('poinSparkline: <2 titik bernilai → null (tidak menggambar garis 0)', () => {
  assert.equal(poinSparkline([]), null);
  assert.equal(poinSparkline([{ tanggal: '2026-09-01', skor: 80 }]), null);
  assert.equal(poinSparkline([{ tanggal: 'a', skor: null }, { tanggal: 'b', skor: null }]), null);
});
uji('poinSparkline: skor null dilewati; min/max & ujung benar', () => {
  const s = poinSparkline([
    { tanggal: '2026-09-01', skor: 80 },
    { tanggal: '2026-09-02', skor: null },
    { tanggal: '2026-09-03', skor: 90 },
  ], { lebar: 100, tinggi: 40, pad: 0 });
  assert.equal(s.jumlah, 2);
  assert.equal(s.min, 80);
  assert.equal(s.max, 90);
  assert.equal(s.pertama.skor, 80);
  assert.equal(s.terakhir.skor, 90);
  assert.equal(s.points.split(' ').length, 2);
});
uji('poinSparkline: semua skor sama → garis di tengah, bukan menempel dasar', () => {
  const s = poinSparkline([
    { tanggal: 'a', skor: 70 }, { tanggal: 'b', skor: 70 },
  ], { lebar: 100, tinggi: 40, pad: 0 });
  assert.equal(s.titik[0].y, s.titik[1].y);
  assert.equal(s.titik[0].y, 20);
});
uji('svgSparkline: string SVG berisi polyline; kosong bila data tipis; tanggal di-escape', () => {
  assert.equal(svgSparkline([]), '');
  const svg = svgSparkline([{ tanggal: '<b>1</b>', skor: 60 }, { tanggal: '2026-09-02', skor: 70 }]);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('<polyline'));
  assert.ok(svg.includes('&lt;b&gt;1&lt;/b&gt;'));
  assert.ok(!svg.includes('<b>'));
});

// ---------------- warna ----------------
uji('warna predikat & status topik punya fallback', () => {
  assert.equal(warnaPredikatHuruf('A'), '#166534');
  assert.equal(warnaPredikatHuruf('X'), '#64748b');
  assert.equal(warnaStatusTopik('merah'), '#dc2626');
  assert.equal(warnaStatusTopik(null), '#94a3b8');
});

// ---------------- model ----------------
uji('v1.3: siapkanModelRaport → rata-rata capaian dari SEMUA mapel berangka', () => {
  const m = siapkanModelRaport({
    dokAkademik: [
      { data: { blok: 'akademik', mapel: 'A', studentName: 'X', periode: '2026-09', nilai_akhir: 80, statusData: 'lengkap' } },
      { data: { blok: 'akademik', mapel: 'B', studentName: 'X', periode: '2026-09', nilai_akhir: 40, statusData: 'belum-cukup' } },
    ],
  });
  assert.equal(m.ringkasan.rataRataAkademik, 60); // v1.3: B ikut — laporan ortu tak mengenal 'menunggu layak'
  assert.ok(m.ringkasan.predikatAkademik.huruf !== '—');
  assert.equal(m.identitas.nama, 'X');
});
uji('judulCetakRaport: judul file PDF terbaca', () => {
  assert.equal(judulCetakRaport({ nama: 'Budi', periode: '2026-09' }), 'Rapot Budi — September 2026');
});

// ---------------- HTML dari mesin NYATA (end-to-end anti-drift) ----------------
uji('html end-to-end: identitas, periode manusiawi, cap otomatis, versi mesin terkini', () => {
  assert.ok(htmlBudi.includes('Budi'));
  assert.ok(htmlBudi.includes('September 2026'));
  assert.ok(htmlBudi.includes('Dihitung otomatis dari log aktivitas'));
  assert.ok(htmlBudi.includes('snapshot TERKUNCI'));
  assert.ok(htmlBudi.includes(`Mesin ${VERSI_MESIN}`)); // versi ikut mesin, tak dipatok keras
  assert.ok(htmlBudi.includes('SMP/MTs')); // jenjang dari identitas
});
uji('html end-to-end: dua nilai terpisah (akademik & proses), tidak digabung', () => {
  assert.ok(htmlBudi.includes('CAPAIAN AKADEMIK'));
  assert.ok(htmlBudi.includes('NILAI PROSES & KARAKTER'));
  assert.ok(htmlBudi.includes('TIDAK digabung menjadi satu angka'));
});
uji('html end-to-end: komponen tercetak dengan jumlahnya + redistribusi bobot dijelaskan', () => {
  assert.ok(htmlBudi.includes('Bahasa Inggris'));
  assert.ok(htmlBudi.includes('(2×)')); // 2 kuis bing
  assert.ok(htmlBudi.includes('Gambaran awal capaian dari') || htmlBudi.includes('Capaian final dari')); // v1.3: kolom Deskripsi otomatis
  assert.ok(htmlBudi.includes('TO Matematika September')); // rincian ujian
});
uji('html end-to-end: pelanggaran = catatan, nilai tidak dipotong', () => {
  assert.ok(htmlBudi.includes('pindah-tab'));
  assert.ok(htmlBudi.includes('TIDAK dipotong'));
});
uji('html end-to-end: kehadiran adil (sakit tidak dihukum) + ketepatan waktu jujur', () => {
  assert.ok(htmlBudi.includes('3/4 hadir (75%)'));
  assert.ok(htmlBudi.includes('1 sakit'));
  assert.ok(htmlBudi.includes('belum ada tugas berjatuh tempo pada periode ini')); // ketepatan waktu
  assert.ok(!htmlBudi.includes('(v1)')); // v1.3: nol bocoran internal
});
uji('html end-to-end: latihan mandiri, XP, peta topik, tren', () => {
  assert.ok(htmlBudi.includes('350 total')); // XP
  assert.ok(htmlBudi.includes('Teks Naratif')); // peta topik dari kuis
  assert.ok(htmlBudi.includes('Peluang')); // peta topik dari latihan
  assert.ok(htmlBudi.includes('<polyline')); // sparkline tren harian
});
uji('html end-to-end: tidak ada NaN/undefined/null mentah yang bocor', () => {
  assert.ok(!htmlBudi.includes('NaN'));
  assert.ok(!htmlBudi.includes('undefined'));
  assert.ok(!htmlBudi.includes('>null<'));
});
uji('html: catatan guru & identitas di-escape (anti-XSS)', () => {
  assert.ok(htmlBudi.includes('&lt;b&gt;rajin&lt;/b&gt;'));
  assert.ok(!htmlBudi.includes('<b>rajin</b>'));
  const htmlXss = htmlRaportSiswa({
    dokAkademik: dokBudi.docsAkademik.map((d) => d.data),
    dokProses: dokBudi.dokProses.data,
    identitas: { nama: '<script>alert(1)</script>' },
  });
  assert.ok(!htmlXss.includes('<script>'));
  assert.ok(htmlXss.includes('&lt;script&gt;'));
});
uji('html: dokumen datar gaya Firestore menghasilkan cetakan yang sama', () => {
  const htmlDatar = htmlRaportSiswa({
    dokAkademik: dokBudi.docsAkademik.map(datarDari),
    dokProses: datarDari(dokBudi.dokProses),
  });
  assert.ok(htmlDatar.includes('Budi'));
  assert.ok(htmlDatar.includes('CAPAIAN AKADEMIK'));
});
uji('html: dokumen kosong total → tetap tercetak jujur, tidak melempar', () => {
  const h = htmlRaportSiswa({});
  assert.ok(h.includes('Tidak ada aktivitas akademik terdeteksi'));
  assert.ok(h.includes('Dokumen blok proses tidak ditemukan'));
});
uji('html: dimensi null dicetak "belum terukur", bukan 0', () => {
  const h = htmlRaportSiswa({
    dokAkademik: [{
      blok: 'akademik', mapel: 'Fisika', studentName: 'Nia', periode: '2026-09',
      nilai_akhir: null, predikat: { huruf: '—', label: 'Data belum cukup' }, statusData: 'belum-cukup',
      mode_perhitungan: 'Data belum cukup', komponen_dipakai: ['kuis'],
      detail_komponen: { kuis: { total: 60, jumlah: 1 }, tugas: { total: null, jumlah: 0 }, ujian: { total: null, jumlah: 0, rincian: [] } },
      detail_dimensi: { pemahaman: null, analisis: null, ketelitian: null, waktu: null, dayaTangkap: 72 },
      dimensi_sumber: { dayaTangkap: 'benarBerturut' }, catatan: [], narasi: '',
    }],
  });
  assert.ok(!h.includes('Pemahaman: 0')); // dimensi null tak pernah dicetak 0
  assert.ok(!h.includes('data belum cukup')); // v1.3: nol frasa defisit
  assert.ok(h.includes('Gambaran awal capaian dari kuis')); // deskripsi otomatis per mapel
});

// ---------------- cetak massal ----------------
uji('htmlRaportMassal: sampul + semua siswa + page break per siswa + CSS sekali', () => {
  const h = htmlRaportMassal({
    daftar: [
      { dokAkademik: dokBudi.docsAkademik.map((d) => d.data), dokProses: dokBudi.dokProses.data },
      { dokAkademik: dokSari.docsAkademik.map((d) => d.data), dokProses: dokSari.dokProses.data },
    ],
    judul: 'Rapor Jenjang SMP/MTs',
    periodeLabel: '2026-09',
  });
  assert.ok(h.includes('Rapor Jenjang SMP/MTs'));
  assert.ok(h.includes('2 siswa'));
  assert.ok(h.includes('Budi'));
  assert.ok(h.includes('Sari'));
  assert.equal((h.match(/<style>/g) || []).length, 1);
  // 2 siswa: yang pertama page-break inline (setelah sampul), sisanya kelas rp-hal
  assert.ok(h.includes('page-break-before:always'));
  assert.equal((h.match(/class="rp-hal"/g) || []).length, 1);
});
uji('htmlRaportMassal: daftar kosong → sampul jujur tanpa melempar', () => {
  const h = htmlRaportMassal({ daftar: [], periodeLabel: '2026-09' });
  assert.ok(h.includes('Tidak ada siswa untuk dicetak'));
});

// ---------------- Fase 3+poles: bagan jaring laba-laba ----------------
uji('poinRadar: geometri sumbu atas, radius proporsional nilai, null dilewati', () => {
  const g = poinRadar([
    { label: 'Global', tebal: true, dimensi: { pemahaman: 100, analisis: 50, ketelitian: null, waktu: 75, dayaTangkap: null } },
  ], { ukuran: 200 });
  assert.ok(g);
  assert.equal(g.sumbu.length, 5);
  // sumbu pertama (Pemahaman) tepat di atas pusat
  assert.equal(g.sumbu[0].xUjung, g.pusat.x);
  assert.ok(g.sumbu[0].yUjung < g.pusat.y);
  const s = g.seri[0];
  assert.equal(s.jumlahNull, 2);          // ketelitian & dayaTangkap null → TIDAK digambar di 0
  assert.equal(s.poin.length, 3);
  assert.equal(s.bisaPoligon, true);      // 3 titik terukur → poligon sah
  const jarak = (p) => Math.hypot(p.x - g.pusat.x, p.y - g.pusat.y);
  assert.ok(Math.abs(jarak(s.poin[0]) - g.R) < 1);        // nilai 100 → tepi
  assert.ok(Math.abs(jarak(s.poin[1]) - g.R / 2) < 1);    // nilai 50 → tengah
});
uji('poinRadar: <3 dimensi terukur → tanpa poligon (titik saja); semua null → null', () => {
  const tipis = poinRadar([{ label: 'X', dimensi: { pemahaman: 80, analisis: 60 } }]);
  assert.equal(tipis.seri[0].bisaPoligon, false);
  assert.equal(poinRadar([{ label: 'X', dimensi: { pemahaman: null, analisis: null, ketelitian: null, waktu: null, dayaTangkap: null } }]), null);
  assert.equal(poinRadar([]), null);
});
uji('svgRadar: SVG berisi poligon, label sumbu ter-escape, legenda; kosong → ""', () => {
  const svg = svgRadar([
    { label: 'Global <b>', tebal: true, dimensi: { pemahaman: 90, analisis: 70, ketelitian: 80, waktu: null, dayaTangkap: 60 } },
    { label: 'Matematika', warna: '#0ea5e9', dimensi: { pemahaman: 60, analisis: 55, ketelitian: 65, waktu: 50, dayaTangkap: 70 } },
  ]);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('<polygon'));
  assert.ok(svg.includes('Global &lt;b&gt;'));   // escape anti-XSS di legenda
  assert.ok(svg.includes('Pemahaman') && svg.includes('Daya Tangkap'));
  assert.ok(svg.includes('1 belum terukur')); // jujur di legenda
  assert.equal(svgRadar([]), '');
});
uji('seriRadarDariModel: global dulu, mapel tipis disaring, cap RADAR_MAKS_SERI', () => {
  const m = {
    proses: { dimensi_global: { pemahaman: 80, analisis: 70, ketelitian: 75, waktu: null, dayaTangkap: 65 } },
    akademik: [
      { mapel: 'Matematika', detail_dimensi: { pemahaman: 80, analisis: 70, ketelitian: null, waktu: null, dayaTangkap: null } },
      { mapel: 'Fisika', detail_dimensi: { pemahaman: null, analisis: null, ketelitian: null, waktu: null, dayaTangkap: null } },
    ],
  };
  const r = seriRadarDariModel(m);
  assert.equal(r.seri[0].label, 'Global (semua aktivitas)');
  assert.equal(r.seri[0].tebal, true);
  assert.deepEqual(r.seri.slice(1).map((s) => s.label), ['Matematika']); // Fisika 0 terukur → tidak digambar
  assert.equal(r.jumlahMapel, 1);
});
uji('html siswa: bagan jaring laba-laba tercetak + kalimat jujur sumbu kosong', () => {
  assert.ok(htmlBudi.includes('jaring laba-laba'));
  assert.ok(htmlBudi.includes('<svg') && htmlBudi.includes('<polygon'));
  assert.ok(htmlBudi.includes('belum terukur'));
});

// ---------------- Fase 3+poles: tanda tangan & logo kop ----------------
uji('html siswa: ttd "Hormat kami, Bimbingan Belajar Gemilang" + ortu', () => {
  assert.equal(NAMA_PENERBIT, 'Bimbingan Belajar Gemilang');
  assert.ok(htmlBudi.includes('Hormat kami,'));
  assert.ok(htmlBudi.includes(NAMA_PENERBIT));
  assert.ok(htmlBudi.includes('Tentor Pendamping'));
  assert.ok(htmlBudi.includes('Orang Tua/Wali,'));
  assert.equal((htmlBudi.match(/\(\.{5,}\)/g) || []).length, 2); // dua ruang tanda tangan
});
uji('logo kop: default LOGO_KOP, bisa diganti logoUrl (logo transparan)', () => {
  assert.ok(htmlBudi.includes(`src="${LOGO_KOP}"`));
  const h = htmlRaportSiswa({
    dokAkademik: dokBudi.docsAkademik.map((d) => d.data),
    dokProses: dokBudi.dokProses.data,
    logoUrl: '/logo-transparan.png',
  });
  assert.ok(h.includes('src="/logo-transparan.png"'));
  assert.equal(h.includes(`src="${LOGO_KOP}"`), false);
});

// ---------------- Fase 3+poles: jenjang tanpa TKA/SNBT ----------------
uji('tren tanpa skala nasional: analisis persen benar (bukan sekadar "—", bukan skala karangan)', () => {
  // Budi: TO paket kurikulum (tanpa skala UTBK/TKA) → trenSkala kosong tapi ada sesi 'to'
  assert.equal((dokBudi.dokProses.data.trenSkala || []).length, 0);
  assert.ok(htmlBudi.includes('persen benar per paket'));
  assert.ok(htmlBudi.includes('75')); // persen sesi TO-nya tercetak apa adanya
  assert.equal(htmlBudi.includes('skala-utbk'), false);
});
uji('tren tanpa TO sama sekali: kalimat jujur "—" belum terukur, tidak dinolkan', () => {
  const h = htmlRaportSiswa({
    dokAkademik: dokSari.docsAkademik.map((d) => d.data),
    dokProses: dokSari.dokProses.data,
  });
  assert.ok(h.includes("kolom skala dibiarkan '—' (belum terukur), tidak dinolkan"));
});

uji('v1.3: narasi otomatis lengkap; NOL frasa defisit di cetakan orang tua', () => {
  assert.ok(htmlBudi.includes('Laporan untuk Orang Tua/Wali'));
  assert.ok(htmlBudi.includes('Semangat & kebiasaan belajar'));
  // v1.3.1: istilah 'otomatis' harus dinamai — cap & narasi menyebut asisten
  assert.ok(htmlBudi.includes('Dihitung otomatis oleh Asisten Belajar Gemilang'));
  assert.ok(htmlBudi.includes('dihitung otomatis oleh Asisten Belajar Gemilang dari log aktivitas belajar'));
  for (const dilarang of ['Cara membaca rapor ini', 'data belum cukup', 'Data belum cukup',
    'bukan nilai nol', '(v1)', 'Bobot efektif', 'Kekuatan periode ini', 'belum diwarnai',
    'Rekomendasi penguatan', 'belum cukup untuk dinilai', 'masih tipis']) {
    assert.ok(!htmlBudi.includes(dilarang), `cetakan masih memuat frasa terlarang: ${dilarang}`);
  }
  // siswa tanpa satu pun asesmen akademik pun tetap dapat narasi utuh + deskripsi netral
  const h = htmlRaportSiswa({ dokProses: dokSari.dokProses.data });
  assert.ok(h.includes('Laporan untuk Orang Tua/Wali'));
  assert.ok(!h.includes('data belum cukup'));
});
uji('v1.3: narasiLaporan & deskripsiMapel selalu menghasilkan kalimat (tak pernah kosong)', () => {
  const kosong = narasiLaporan({});
  assert.ok(kosong.length > 100);
  assert.ok(kosong.includes('asesmen pertama') || kosong.includes('terisi otomatis'));
  assert.equal(deskripsiMapel({}), 'Belum ada asesmen mapel ini pada periode ini; capaian akan terisi otomatis begitu kuis atau try out pertama dilaksanakan.');
  assert.ok(deskripsiMapel({
    statusData: 'lengkap', predikat: { huruf: 'A' },
    detail_komponen: { kuis: { total: 80, jumlah: 2 }, tugas: { total: 90, jumlah: 1 }, ujian: { total: 85, jumlah: 1 } },
  }).includes('Capaian final dari kuis + tugas + try out/ujian'));
});
uji('v1.3: trenSemangat jujur (null bila titik <4)', () => {
  assert.equal(trenSemangat([]), null);
  assert.equal(trenSemangat([{ skor: 1 }, { skor: 2 }]), null);
  const naik = trenSemangat([{ skor: 50 }, { skor: 52 }, { skor: 70 }, { skor: 75 }]);
  assert.equal(naik.ikon, '▲');
});
uji('v1.2: snapshot LAMA (merah n=1) tampil tipis TANPA terbit ulang', () => {
  const lama = [{ status: 'merah', dicoba: 1, akurasi: 0, topik: 'Satu Soal', mapelNama: 'Matematika', sumber: ['latihan'], alasan: 'akurasi 0% < 50' }];
  const { tipis, berwarna } = petaTampil(lama);
  assert.equal(berwarna.length, 0);
  assert.equal(tipis.length, 1);
  assert.equal(rekomendasiTampil(lama).length, 0); // bukti n=1 tak boleh jadi rekomendasi
  const cukup = [{ status: 'merah', dicoba: 5, akurasi: 40, topik: 'Pecahan', mapelNama: 'Matematika', sumber: ['latihan'], alasan: '' }];
  assert.ok(rekomendasiTampil(cukup)[0].includes('Pendampingan terfokus'));
});

uji('v1.4: capaian guru jadi ISI UTAMA laporan ortu (primer atas narasi otomatis)', () => {
  const laporanGuru = [{
    namaMapel: 'Matematika',
    capaian: {
      pemahaman: { predikat: 'A', deskriptor: ['menguasai'] },
      keaktifan: { predikat: 'B', deskriptor: ['aktif-bertanya', 'menyanggah'] },
      sikap: { predikat: 'A', deskriptor: ['disiplin'] },
      perkembangan: { predikat: 'B', deskriptor: ['menanjak'] },
    },
    catatanGuru: 'Ananda sangat membantu teman sekelompok.',
    pengayaan: 'lanjut ke soal HOTS',
  }];
  const h = htmlRaportSiswa({
    dokAkademik: dokBudi.docsAkademik.map((d) => d.data),
    dokProses: dokBudi.dokProses.data,
    identitas: { jenjang: budi.jenjang },
    laporanGuru,
  });
  assert.ok(h.includes('capaian dinilai tentor'));         // label primer
  assert.ok(h.includes('Pemahaman Materi: Sangat Baik'));  // dimensi guru tercetak
  assert.ok(h.includes('aktif bertanya') && h.includes('menyanggah'));
  assert.ok(h.includes('Ananda sangat membantu teman'));   // catatan guru
  assert.ok(h.includes('Rencana pengayaan'));              // pengayaan
  assert.ok(h.includes('Matematika.'));                    // label mapel
  // tetap tanpa frasa defisit
  for (const dilarang of ['tidak valid', 'data belum cukup', 'belum lengkap']) {
    assert.ok(!h.toLowerCase().includes(dilarang), `masih memuat: ${dilarang}`);
  }
  // tanpa laporanGuru → jatuh ke narasi otomatis mesin (tidak rusak)
  const auto = htmlRaportSiswa({ dokAkademik: dokBudi.docsAkademik.map((d) => d.data), dokProses: dokBudi.dokProses.data, identitas: { jenjang: budi.jenjang } });
  assert.ok(!auto.includes('capaian dinilai tentor'));
  assert.ok(auto.includes('Laporan untuk Orang Tua/Wali'));
});

uji('v1.5: mapel T3 mendapat baris RENCANA di cetakan; fokus diambil dari pengayaan tentor bila ada; NOL frasa defisit', () => {
  const data = {
    siswa: [{ id: 'dC', studentId: 'cetak-1', nama: 'Caca', jenjang: 'SMP/MTs', kelasSekolah: '7', enrolledSubjects: ['mtk', 'bing'] }],
    paket: [], kuis: [], sesi: [],
    absensi: [{ studentId: 'cetak-1', namaSiswa: 'Caca', tanggal: '2026-10-06', status: 'hadir', scheduleId: 'c1' }],
    tugas: [], nilaiGuru: [], progresSoal: [], soalMeta: {}, progresSiswa: [],
  };
  const h = hitungRaportSemuaSiswa(data, { bulan: '2026-10' });
  const c = h.siswa.find((s) => s.studentId === 'cetak-1');
  const dok = bangunDokumenRaport(c);
  const html = htmlRaportSiswa({
    dokAkademik: dok.docsAkademik.map((d) => d.data),
    dokProses: dok.dokProses.data,
    laporanGuru: [{
      kodeMapel: 'bing', namaMapel: 'Bahasa Inggris',
      capaian: { pemahaman: { predikat: 'B' }, keaktifan: { predikat: 'B' }, sikap: { predikat: 'A' }, perkembangan: { predikat: 'B' } },
      catatan: 'Aktif bertanya selama sesi.', pengayaan: 'proyek literasi data kecil',
    }],
  });
  assert.ok(html.includes('Rencana: asesmen Matematika dijadwalkan pada periode berikutnya'));
  assert.ok(html.includes('fokus pendampingan: penguatan materi prasyarat secara terbimbing bersama tentor'));
  assert.ok(html.includes('fokus pendampingan: proyek literasi data kecil'));
  for (const dilarang of ['data belum cukup', 'Data belum cukup', 'belum valid', 'belum lengkap']) {
    assert.ok(!html.includes(dilarang), `cetakan memuat frasa terlarang: ${dilarang}`);
  }
});

uji('v1.5.3: capaian tentor kode varian (MAPEL-019 "GEOGRAFI SMA") tetap menempel ke mapel kurikulum geo', () => {
  const m = siapkanModelRaport({
    dokAkademik: [{
      blok: 'akademik', mapel: 'Geografi', mapelKode: 'geo', tier: 'T3', nilai_akhir: null,
      predikat: { huruf: '—' }, detail_komponen: {}, statusData: 'belum-cukup',
    }],
    dokProses: { blok: 'proses', nilai_akhir: 80, studentName: 'Vera', periode: '2026-10' },
    laporanGuru: [{
      kodeMapel: 'MAPEL-019', namaMapel: 'GEOGRAFI SMA',
      capaian: { pemahaman: { predikat: 'B' }, keaktifan: { predikat: 'B' }, sikap: { predikat: 'A' }, perkembangan: { predikat: 'B' } },
      catatan: 'Aktif membaca peta.', pengayaan: 'proyek peta tematik daerah',
    }],
  });
  assert.equal(m.akademik[0].rencana_fokus, 'proyek peta tematik daerah');
  const html = htmlRaportSiswa({ dokAkademik: m.akademik, dokProses: m.proses, laporanGuru: m.laporanGuru });
  assert.ok(html.includes('capaian dinilai tentor'));
  assert.ok(html.includes('fokus pendampingan: proyek peta tematik daerah'));
  assert.ok(!html.includes('data belum cukup'));
});

console.log(`\n[${lulus} lulus, ${gagal} gagal]`);
process.exit(gagal ? 1 : 0);
