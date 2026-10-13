import test from 'node:test';
import assert from 'node:assert/strict';
import {
  posisiMascotUntukMapel, buatDeskripsiPaket, hitungAnalitik, labelPekan, PAPAN_MASCOT,
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
