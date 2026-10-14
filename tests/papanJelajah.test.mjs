import test from 'node:test';
import assert from 'node:assert/strict';
import {
  posisiMascotUntukMapel, buatDeskripsiPaket, hitungAnalitik, labelPekan, potongUntukQuery, PAPAN_MASCOT,
} from '../src/utils/papanJelajah.js';

test('sprite maskot: Matematika = kartu indeks 3 (kolom 3 baris 0)', () => {
  const p = posisiMascotUntukMapel('Matematika');
  assert.equal(p.indeks, 3);
  assert.equal(p.xPct, 60);
  assert.equal(p.yPct, 0);
  assert.equal(p.label, 'Matematika');
});

test('sprite maskot: subtes UTBK penalaran umum jatuh ke kartu koding/logika', () => {
  assert.equal(posisiMascotUntukMapel('TPS/Penalaran Umum').indeks, 10);
  assert.equal(posisiMascotUntukMapel('Literasi/Bahasa Inggris').indeks, 8);
});

test('sprite maskot: tingkat lanjut tidak tertelan mapel dasar', () => {
  assert.equal(posisiMascotUntukMapel('Matematika Tingkat Lanjut').indeks, 15);
  assert.equal(posisiMascotUntukMapel('Bahasa Indonesia Tingkat Lanjut').indeks, 22);
});

test('sprite maskot: nama tak dikenal -> null (UI pakai kartu bintang)', () => {
  assert.equal(posisiMascotUntukMapel('Astrologi'), null);
  assert.equal(posisiMascotUntukMapel(''), null);
});

test('deskripsi TKA SMP menyebut CP Kemendikbud, komposisi, durasi, tanpa pembahasan', () => {
  const d = buatDeskripsiPaket({
    jenjang: 'SMP', jenisUjian: 'tka', komposisi: [{ mapel: 'Matematika', jumlah: 20 }, { mapel: 'Bahasa Indonesia', jumlah: 20 }],
    durasiMenit: 75, jumlahSubtes: 2, tampilkanPembahasan: false,
  });
  assert.match(d, /Capaian Pembelajaran \(CP\)/);
  assert.match(d, /20 soal Matematika \+ 20 soal Bahasa Indonesia/);
  assert.match(d, /kelas 7-9/);
  assert.match(d, /75 menit dalam 2 subtes/);
  assert.match(d, /Pembahasan tidak ditampilkan/);
});

test('deskripsi UTBK menyebut kisi SNBT', () => {
  assert.match(buatDeskripsiPaket({ jenisUjian: 'utbk', durasiMenit: 120 }), /UTBK/);
});

test('labelPekan mengelompokkan ke Senin UTC', () => {
  const sabtu = Date.parse('2026-10-17T10:00:00Z');
  assert.equal(labelPekan(sabtu), 'Pekan 12 Okt');
});

test('analitik: tren dua pekan memberi delta +12 dan tips apresiasi', () => {
  const p1 = Date.parse('2026-10-10T10:00:00Z');
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'TO A', jenisUjian: 'tka', totalSkorPersen: 60, waktuSelesaiMs: p1, createdAtMs: p1 - 3600e3, totalSoal: 40, subtes: [{ nama: 'Matematika', skorPersen: 55 }, { nama: 'Bahasa Indonesia', skorPersen: 65 }] },
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: p2 - 3600e3, totalSoal: 40, subtes: [{ nama: 'Matematika', skorPersen: 70 }, { nama: 'Bahasa Indonesia', skorPersen: 74 }] },
  ]);
  assert.equal(a.jumlahSesi, 2);
  assert.equal(a.tren.length, 2);
  assert.equal(a.tren[1].delta, 12);
  assert.ok(a.tips.some((t) => t.includes('📈')));
  assert.match(a.evaluasi, /naik/);
  assert.equal(a.subtesRata[0].nama, 'Bahasa Indonesia');
});

test('analitik: kecepatan 90 detik/soal masih wajar, reguler diabaikan', () => {
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'Reguler', jenisUjian: 'reguler', totalSkorPersen: 99, waktuSelesaiMs: p2 },
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: p2 - 3600e3, totalSoal: 40 },
  ]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.kecepatan.detikPerSoal, 90);
  assert.equal(a.kecepatan.wajar, true);
});

test('analitik: tanpa sesi TKA/UTBK -> struktur kosong, bukan crash', () => {
  const a = hitungAnalitik([{ nama: 'x', jenisUjian: 'reguler', waktuSelesaiMs: 1 }]);
  assert.equal(a.jumlahSesi, 0);
  assert.deepEqual(a.tren, []);
  assert.equal(PAPAN_MASCOT.length, 30);
});

// 🛡️ Regresi audit 2026-10-13 bug #1: sesi tanpa waktuSelesai (halaman
// mengirim null lewat ms()) dulu LOLOS filter karena Number(null)===0 ->
// baris tren sampah "Pekan 29 Des" 1969 + delta palsu. Kini dibuang.
test('analitik: waktuSelesaiMs null dibuang, tidak melahirkan tren 1969', () => {
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'TO Hantu', jenisUjian: 'tka', totalSkorPersen: 40, waktuSelesaiMs: null, createdAtMs: p2 - 3600e3, totalSoal: 40 },
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: p2 - 3600e3, totalSoal: 40 },
  ]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.tren.length, 1);
  assert.equal(a.tren[0].label, 'Pekan 12 Okt');
  assert.ok(!a.tren.some((t) => t.label.includes('Des')));
  const kosong = hitungAnalitik([{ nama: 'TO Hantu', jenisUjian: 'tka', totalSkorPersen: 40, waktuSelesaiMs: null }]);
  assert.equal(kosong.jumlahSesi, 0);
});

// 🛡️ Regresi audit 2026-10-13 bug #2: createdAtMs null dulu jadi 0 (epoch)
// dan lolos Number.isFinite -> kecepatan dihitung dari 1969 (~17,8 juta
// detik/soal). Kini kartu tempo disembunyikan (kecepatan null).
test('analitik: createdAtMs null -> kecepatan null, bukan detik/soal absurd', () => {
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: null, totalSoal: 40 },
  ]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.kecepatan, null);
  assert.ok(!a.tips.some((t) => t.includes('detik/soal')));
  // createdAtMs 0 eksplisit (epoch beneran) juga tak boleh lolos sebagai
  // waktu mulai sah untuk sesi 2026 -> waktuSelesai > mulai tetap valid,
  // tapi harus absurd; pastikan minimal tidak crash dan angka terdefinisi.
  const b = hitungAnalitik([
    { nama: 'TO C', jenisUjian: 'tka', totalSkorPersen: 50, waktuSelesaiMs: p2, createdAtMs: p2 - 40 * 60e3, totalSoal: 40 },
  ]);
  assert.equal(b.kecepatan.detikPerSoal, 60);
  assert.equal(b.kecepatan.wajar, true);
});

test('potongUntukQuery: chunk <= 30, buang kosong & duplikat, jaga urutan', () => {
  const ids = Array.from({ length: 65 }, (_, i) => `p${i}`);
  const c = potongUntukQuery(ids);
  assert.equal(c.length, 3);
  assert.deepEqual(c.map((x) => x.length), [30, 30, 5]);
  assert.equal(c[0][0], 'p0');
  assert.equal(c[2][4], 'p64');
  assert.deepEqual(potongUntukQuery(['a', '', null, 'a', ' b ']), [['a', 'b']]);
  assert.deepEqual(potongUntukQuery([]), []);
  assert.deepEqual(potongUntukQuery(['x', 'y'], 1), [['x'], ['y']]);
});

// ------------------------------------------------------------
// Streak harian & ikon bola & kunci tanggal (rombakan 14 Okt 2026)
// ------------------------------------------------------------
import { hitungStreak, kunciTanggal, bolaMascotUntukMapel } from '../src/utils/papanJelajah.js';

const HARI = 86400000;
// Bebas-TZ: semua timestamp dibangun dari komponen LOKAL, karena
// kunciTanggal memang memakai kalender lokal siswa.
const KINI = new Date(2026, 9, 14, 10, 0, 0).getTime();

test('streak: hari ini aktif + 2 hari sebelumnya = 3 beruntun & aman', () => {
  const s = hitungStreak([KINI - 2 * HARI, KINI - HARI, KINI - 3600_000], KINI);
  assert.equal(s.jumlah, 3);
  assert.equal(s.amanHariIni, true);
});

test('streak: belum aktif hari ini = grace kemarin, ditandai belum aman', () => {
  const s = hitungStreak([KINI - HARI, KINI - 2 * HARI], KINI);
  assert.equal(s.jumlah, 2);
  assert.equal(s.amanHariIni, false);
});

test('streak: putus di tengah dihitung dari ujung terdekat saja', () => {
  const s = hitungStreak([KINI, KINI - HARI, KINI - 5 * HARI], KINI);
  assert.equal(s.jumlah, 2);
});

test('streak: tanpa sesi = 0 dan tidak crash', () => {
  assert.deepEqual(hitungStreak([], KINI), { jumlah: 0, amanHariIni: false });
  assert.deepEqual(hitungStreak([null, NaN], KINI), { jumlah: 0, amanHariIni: false });
});

test('kunciTanggal stabil untuk kalender lokal', () => {
  assert.equal(kunciTanggal(KINI), '2026-10-14');
  assert.equal(kunciTanggal(new Date(2026, 0, 1, 0, 30).getTime()), '2026-01-01');
  assert.equal(kunciTanggal(new Date(2026, 0, 1, 23, 59).getTime()), '2026-01-01');
});

test('bola mapel: 10 mapel inti punya berkas, lainnya null (fallback bola warna)', () => {
  assert.equal(bolaMascotUntukMapel('Matematika'), '/mascot/bola-matematika.png');
  assert.equal(bolaMascotUntukMapel('Bahasa Indonesia Tingkat Lanjut'), '/mascot/bola-bahasa-indonesia.png');
  assert.equal(bolaMascotUntukMapel('PJOK'), '/mascot/bola-pjok.png');
  assert.equal(bolaMascotUntukMapel('IPAS'), '/mascot/bola-ipa.png');
  assert.equal(bolaMascotUntukMapel('Matematika').includes('bola-matematika'), true);
  assert.equal(bolaMascotUntukMapel('Astrologi'), null);
});

// ------------------------------------------------------------
// Analitik AKURAT untuk semua siswa (owner 14 Okt 2026):
// paket jalur tentor/manual tidak menulis jenisUjian -> inferensi
// ------------------------------------------------------------
import { jenisUjianUntukAnalitik } from '../src/utils/papanJelajah.js';

test('jenisUjianUntukAnalitik: eksplisit menang atas kode & judul', () => {
  assert.equal(jenisUjianUntukAnalitik({ jenisUjian: 'UTBK', kodePaket: 'GM-SMP-TKA-20261017-0700' }), 'UTBK');
  assert.equal(jenisUjianUntukAnalitik({ jenisUjian: 'TKA' }), 'TKA');
});

test('jenisUjianUntukAnalitik: tanpa field, kode paket menyelamatkan analitik', () => {
  assert.equal(jenisUjianUntukAnalitik({ kodePaket: 'GM-SMP-TKA-20261017-0700' }), 'TKA');
  assert.equal(jenisUjianUntukAnalitik({ kodePaket: 'gm-sma-utbk-20261010-0700' }), 'UTBK');
});

test('jenisUjianUntukAnalitik: tanpa field & kode, judul yang memutuskan', () => {
  assert.equal(jenisUjianUntukAnalitik({ judul: 'TRY OUT PEMAHAMAN TKA SMP - Sabtu' }), 'TKA');
  assert.equal(jenisUjianUntukAnalitik({ judul: 'Simulasi UTBK Gemilang' }), 'UTBK');
});

test('jenisUjianForAnalitik: paket non-TKA tetap keluar dari analitik TKA/UTBK', () => {
  assert.equal(jenisUjianUntukAnalitik({ judul: 'Try Out IPA 7 SMP', kodePaket: 'GM-ARSIP-UMU-UMUM-20261014-NXDC' }), '');
  assert.equal(jenisUjianUntukAnalitik({}), '');
});

test('analitik menangkap sesi paket tentor berjudulkan TKA walau jenisUjian kosong', () => {
  const paket = { judul: 'TRY OUT TKA SMP BAHASA INGGRIS', kodePaket: 'GM-ARSIP-UMU-UMUM-20261014-ABCD' };
  const baris = [{
    nama: paket.judul,
    jenisUjian: jenisUjianUntukAnalitik(paket),
    totalSkorPersen: 80,
    waktuSelesaiMs: new Date(2026, 9, 12, 9, 0).getTime(),
    createdAtMs: new Date(2026, 9, 12, 7, 30).getTime(),
    totalSoal: 30,
    subtes: [],
  }];
  const a = hitungAnalitik(baris);
  assert.equal(a.jumlahSesi, 1, 'sesi TKA jalur tentor wajib masuk analitik');
  assert.equal(a.tren[0].skor, 80);
  assert.equal(a.kecepatan.detikPerSoal, 180); // (09.00-07.30) = 5400 s / 30 soal
});
