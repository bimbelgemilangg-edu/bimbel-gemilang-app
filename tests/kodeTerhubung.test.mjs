// regresi 21 Okt: SATU kode soal tersambung di semua permukaan —
// kop naskah, chip per butir (siswa & kunci), layar siswa, arsip.
import test from 'node:test';
import assert from 'node:assert/strict';
import { kodeSoalSiswa, cocokCariKode } from '../src/utils/kodeSoalSiswa.js';
import { kodePaketTampil } from '../src/utils/kodePaket.js';
import { daftarBlokNaskah } from '../src/utils/naskahSoal.js';

const PAKET = { id: 'bJjhvqxK2r6oIm5CAG1G', kodePaket: 'GM-SMP-REG-20261020-0800', mapel: 'Matematika', targetKelas: '9 SMP' };

test('kodeSoalSiswa v2: turunan langsung kode paket', () => {
  assert.equal(kodeSoalSiswa({ paket: PAKET, nomor: 7 }), 'SMP-0800-07');
  assert.equal(kodeSoalSiswa({ paket: PAKET, nomor: 1 }), 'SMP-0800-01');
  assert.equal(kodeSoalSiswa({ paket: { kodePaket: 'GM-SMA-TKA-20261017-1030' }, nomor: 12 }), 'SMA-1030-12');
});

test('kodeSoalSiswa: paket lama tanpa kodePaket tetap stabil (suffix id dokumen)', () => {
  const lama = { id: 'bJjhvqxK2r6oIm5CAG1G', targetKelas: '9 SMP SMP', createdAt: new Date('2026-10-20T19:30:00') };
  const a = kodeSoalSiswa({ paket: lama, nomor: 3 });
  assert.equal(a, kodeSoalSiswa({ paket: lama, nomor: 3 }), 'stabil dipanggil ulang');
  assert.match(a, /^SMP-BJJH-03$/, `turut jenjang+id: ${a}`);
});

test('kodePaketTampil: jenjang turun dari targetKelas, bukan UMU lagi', () => {
  const lama = { id: 'bJjhvqxK2r6oIm5CAG1G', targetKelas: '9 SMP SMP', createdAt: new Date('2026-10-20T19:30:00') };
  const kode = kodePaketTampil(lama);
  assert.ok(!kode.includes('-UMU-'), `token jenjang tidak UMU: ${kode}`);
  assert.ok(kode.includes('-SMP-'), `punya token SMP: ${kode}`);
});

test('naskah cetak: kop & chip per butir memakai kode yang sama', () => {
  const soal = { tipe: 'pg_sederhana', teks: 'Luas permukaan limas dengan alas persegi adalah …. ', opsi: ['240', '384', '480', '144'], kunci: 'B' };
  const siswa = daftarBlokNaskah('siswa', PAKET, [soal, soal], 92, {}, 0, 2);
  const kunci = daftarBlokNaskah('kunci', PAKET, [soal, soal], 92, {}, 0, 2);
  assert.ok(siswa[0].includes('GM-SMP-REG-20261020-0800'), 'kop membawa kode paket');
  assert.ok(siswa[1].includes('nsk-kodesoal') && siswa[1].includes('SMP-0800-01'), 'butir 1 siswa ber-chip kode');
  assert.ok(siswa[2].includes('SMP-0800-02'), 'butir 2 siswa ber-chip kode');
  assert.ok(kunci[1].includes('SMP-0800-01'), 'kunci butir 1 ber-chip kode sama');
});

test('pencarian buku tulis toleran terhadap format tersambung', () => {
  assert.equal(cocokCariKode('SMP-0800-07', 'smp080007'), true);
  assert.equal(cocokCariKode('SMP-0800-07', '0800-07'), true);
  assert.equal(cocokCariKode('SMP-0800-07', 'SMA'), false);
});
