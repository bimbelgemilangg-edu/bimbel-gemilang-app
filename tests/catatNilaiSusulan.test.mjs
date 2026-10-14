// tests/catatNilaiSusulan.test.mjs
// Uji pintu nilai susulan offline (pengganti tombol Susulan yang
// menggandakan paket — keputusan owner 14 Okt 2026 sore).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validasiNilaiSusulan, bangunSesiSusulan,
  XP_PER_SOAL_SUSULAN, SUMBER_NILAI_SUSULAN,
} from '../src/utils/catatNilaiSusulan.js';

test('validasi: skor di luar 0-100 atau bukan angka ditolak', () => {
  for (const skor of [105, -1, 'abc', null, NaN]) {
    const v = validasiNilaiSusulan({ skorPersen: skor, jumlahSoal: 40, sudahAdaSesi: false });
    assert.equal(v.boleh, false, `skor ${skor} harus ditolak`);
  }
});

test('validasi: siswa bersesi_existing ditolak; paket tanpa soal ditolak', () => {
  assert.equal(validasiNilaiSusulan({ skorPersen: 80, jumlahSoal: 40, sudahAdaSesi: true }).boleh, false);
  assert.equal(validasiNilaiSusulan({ skorPersen: 80, jumlahSoal: 0, sudahAdaSesi: false }).boleh, false);
  assert.equal(validasiNilaiSusulan({ skorPersen: 80, jumlahSoal: 40, sudahAdaSesi: false }).boleh, true);
});

test('payload: XP memakai rumus online (10 per poin) tanpa potongan', () => {
  const s = bangunSesiSusulan({ paketId: 'p1', studentId: 's1', skorPersen: 50, jumlahSoal: 40, padaMs: 1234567 });
  assert.equal(s.totalSkor, 20);
  assert.equal(s.xpMentah, 20 * XP_PER_SOAL_SUSULAN);
  assert.equal(s.xpFinal, s.xpMentah, 'tanpa pelanggaran tidak ada potongan');
  assert.equal(s.status, 'selesai');
  assert.equal(s.sumberNilai, SUMBER_NILAI_SUSULAN);
});

test('payload: jujur tanpa tempo online (waktuMulai & createdAt null)', () => {
  const s = bangunSesiSusulan({ paketId: 'p1', studentId: 's1', skorPersen: 100, jumlahSoal: 10, padaMs: 999 });
  assert.equal(s.waktuMulai, null);
  assert.equal(s.createdAt, null);
  assert.equal(s.waktuSelesaiMs, 999);
  assert.deepEqual(s.jawaban, {});
});
