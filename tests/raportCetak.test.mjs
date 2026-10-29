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
  siapkanModelRaport, htmlRaportSiswa, htmlRaportMassal, judulCetakRaport,
} from '../src/utils/raportCetak.js';
import { hitungRaportSemuaSiswa, bangunDokumenRaport } from '../src/utils/raportOtomatis.js';

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
uji('siapkanModelRaport: tanpa dokProses → rata-rata dihitung dari mapel layak saja', () => {
  const m = siapkanModelRaport({
    dokAkademik: [
      { data: { blok: 'akademik', mapel: 'A', studentName: 'X', periode: '2026-09', nilai_akhir: 80, statusData: 'lengkap' } },
      { data: { blok: 'akademik', mapel: 'B', studentName: 'X', periode: '2026-09', nilai_akhir: 40, statusData: 'belum-cukup' } },
    ],
  });
  assert.equal(m.ringkasan.rataRataAkademik, 80); // B belum-cukup TIDAK ikut rata-rata
  assert.equal(m.ringkasan.predikatAkademik.huruf, 'B');
  assert.equal(m.identitas.nama, 'X');
});
uji('judulCetakRaport: judul file PDF terbaca', () => {
  assert.equal(judulCetakRaport({ nama: 'Budi', periode: '2026-09' }), 'Rapot Budi — September 2026');
});

// ---------------- HTML dari mesin NYATA (end-to-end anti-drift) ----------------
uji('html end-to-end: identitas, periode manusiawi, cap otomatis, mesin v1.0', () => {
  assert.ok(htmlBudi.includes('Budi'));
  assert.ok(htmlBudi.includes('September 2026'));
  assert.ok(htmlBudi.includes('Dihitung otomatis dari log aktivitas'));
  assert.ok(htmlBudi.includes('snapshot TERKUNCI'));
  assert.ok(htmlBudi.includes('Mesin v1.0'));
  assert.ok(htmlBudi.includes('SMP/MTs')); // jenjang dari identitas
});
uji('html end-to-end: dua nilai terpisah (akademik & proses), tidak digabung', () => {
  assert.ok(htmlBudi.includes('RATA-RATA AKADEMIK'));
  assert.ok(htmlBudi.includes('NILAI PROSES & KARAKTER'));
  assert.ok(htmlBudi.includes('TIDAK digabung menjadi satu angka'));
});
uji('html end-to-end: komponen tercetak dengan jumlahnya + redistribusi bobot dijelaskan', () => {
  assert.ok(htmlBudi.includes('Bahasa Inggris'));
  assert.ok(htmlBudi.includes('(2×)')); // 2 kuis bing
  assert.ok(htmlBudi.includes('diredistribusi'));
  assert.ok(htmlBudi.includes('TO Matematika September')); // rincian ujian
});
uji('html end-to-end: pelanggaran = catatan, nilai tidak dipotong', () => {
  assert.ok(htmlBudi.includes('pindah-tab'));
  assert.ok(htmlBudi.includes('TIDAK dipotong'));
});
uji('html end-to-end: kehadiran adil (sakit tidak dihukum) + ketepatan waktu jujur', () => {
  assert.ok(htmlBudi.includes('3/4 hadir (75%)'));
  assert.ok(htmlBudi.includes('1 sakit'));
  assert.ok(htmlBudi.includes('belum terukur (v1)')); // ketepatan waktu
  assert.ok(htmlBudi.includes('waktu guru mencatat')); // alasan jujur
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
  assert.ok(htmlDatar.includes('RATA-RATA AKADEMIK'));
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
  assert.ok(h.includes('belum terukur'));
  assert.ok(h.includes('Daya Tangkap: 72'));
  assert.ok(!h.includes('Pemahaman: 0'));
  assert.ok(h.includes('data belum cukup'));
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

console.log(`\n[${lulus} lulus, ${gagal} gagal]`);
process.exit(gagal ? 1 : 0);
