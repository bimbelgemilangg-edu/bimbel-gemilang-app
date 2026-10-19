// regresi 19 Okt: laporan orang tua per anak harus deterministik & lengkap.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dataBaganSkor, susunNarasiOrangTua, susunSaranBelajar,
} from '../src/utils/laporanOrangTuaPdf.js';

const SISWA = {
  studentId: 'S1', nama: 'Tasya', kelas: '9', jumlahSesi: 4, skorRata: 66,
  delta: 6, arah: 'naik', detikPerSoal: 95, tempoWajar: true,
  terkuat: { nama: 'Numerasi', skor: 80 }, terlemah: { nama: 'Aljabar', skor: 45 },
};
const BARIS = [
  { studentId: 'S1', waktuSelesaiMs: 1000, totalSkorPersen: 60, labelPekan: 'P1' },
  { studentId: 'S1', waktuSelesaiMs: 2000, totalSkorPersen: 72, labelPekan: 'P2' },
];

test('dataBaganSkor urut waktu & membulat', () => {
  const d = dataBaganSkor([...BARIS].reverse());
  assert.deepEqual(d, [{ label: 'P1', skor: 60 }, { label: 'P2', skor: 72 }]);
});

test('narasi menyebut nama, skor, tren, kekuatan & kelemahan — tanpa undefined', () => {
  const teks = susunNarasiOrangTua(SISWA).join(' ');
  for (const k of ['Tasya', '66%', '+6', 'Numerasi', 'Aljabar', '95']) assert.ok(teks.includes(k), k);
  assert.ok(!/undefined|NaN/.test(teks));
});

test('saran memuat subtes terlemah & catatan tempo bila tak wajar', () => {
  const saran = susunSaranBelajar(SISWA).join(' ');
  assert.match(saran, /Aljabar/);
  assert.match(saran, /Numerasi/);
  const lambat = susunSaranBelajar({ ...SISWA, tempoWajar: false }).join(' ');
  assert.match(lambat, /timer/);
});
