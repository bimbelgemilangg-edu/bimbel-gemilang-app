// tests/eventTryoutTerjadwal.test.mjs
import assert from 'node:assert';
import {
  DAFTAR_EVENT_TRYOUT_SMA,
  getEventByTanggal,
  getEventByBulan,
  getStatusEventTerhadapWaktu,
  hubungkanSiswaKeTobkSession,
} from '../src/data/eventTryoutTerjadwalData.js';

console.log('🧪 Memulai pengujian Event Try Out Terjadwal 2x Sebulan (Benchmark AmbisPTN)...');

// 1. Uji Kelengkapan Event 2x Sebulan (Tepat 10 event untuk 5 bulan)
assert.strictEqual(DAFTAR_EVENT_TRYOUT_SMA.length, 10, `Harus ada tepat 10 event terjadwal (ada: ${DAFTAR_EVENT_TRYOUT_SMA.length})`);

// 2. Uji Kelengkapan Standar CBT UTBK Resmi
DAFTAR_EVENT_TRYOUT_SMA.forEach((ev) => {
  assert.ok(ev.token && ev.token.length >= 3, `Event ${ev.judul} harus memiliki token ujian resmi`);
  assert.strictEqual(ev.durasiMenit, 195, 'Durasi standar resmi harus 195 menit');
  assert.strictEqual(ev.totalSoal, 160, 'Jumlah soal standar resmi harus 160 soal');
  assert.strictEqual(ev.daftarSubtes.length, 7, 'Harus mencakup 7 subtes resmi SNPMB');
  assert.strictEqual(ev.jenjang, 'SMA', 'Harus berjenjang SMA');
});
console.log(`✅ Uji 1 Berhasil: Tepat 10 event resmi (2x sebulan) lengkap 7 subtes 160 soal 195 menit`);

// 3. Uji Penamaan Seri Berganti Per Bulan (Fondasi, Ambis, Siap, Berjuang, Puncak)
const semuaJudul = DAFTAR_EVENT_TRYOUT_SMA.map((e) => e.judul);
const adaFondasi1 = semuaJudul.some((j) => j.includes('Fondasi UTBK 1'));
const adaFondasi2 = semuaJudul.some((j) => j.includes('Fondasi UTBK 2'));
const adaAmbis = semuaJudul.some((j) => j.includes('Ambis UTBK'));
const adaSiap = semuaJudul.some((j) => j.includes('Siap UTBK'));
const adaBerjuang = semuaJudul.some((j) => j.includes('Berjuang UTBK'));
const adaPuncak = semuaJudul.some((j) => j.includes('Puncak UTBK'));

assert.ok(adaFondasi1, 'Harus ada event bertajuk Fondasi UTBK 1');
assert.ok(adaFondasi2, 'Harus ada event bertajuk Fondasi UTBK 2');
assert.ok(adaAmbis, 'Harus ada event bertajuk Ambis UTBK');
assert.ok(adaSiap, 'Harus ada event bertajuk Siap UTBK');
assert.ok(adaBerjuang, 'Harus ada event bertajuk Berjuang UTBK');
assert.ok(adaPuncak, 'Harus ada event bertajuk Puncak UTBK');
console.log('✅ Uji 2 Berhasil: Penamaan marketing (Fondasi, Ambis, Siap, Berjuang, Puncak) berganti tiap bulan');

// 4. Uji Query Tanggal & Tepat 2 Event per Bulan
const eventHariIni = getEventByTanggal('2026-11-18');
assert.strictEqual(eventHariIni.length, 1, 'Harus ada tepat 1 event aktif pada Rabu, 18 November 2026');
assert.ok(eventHariIni[0].judul.includes('Fondasi UTBK 1'));

const eventNov = getEventByBulan(2026, 10);
assert.strictEqual(eventNov.length, 2, 'Bulan November 2026 harus memiliki tepat 2 event');

const eventDes = getEventByBulan(2026, 11);
assert.strictEqual(eventDes.length, 2, 'Bulan Desember 2026 harus memiliki tepat 2 event');

const eventJan = getEventByBulan(2027, 0);
assert.strictEqual(eventJan.length, 2, 'Bulan Januari 2027 harus memiliki tepat 2 event');

const eventFeb = getEventByBulan(2027, 1);
assert.strictEqual(eventFeb.length, 2, 'Bulan Februari 2027 harus memiliki tepat 2 event');

const eventMar = getEventByBulan(2027, 2);
assert.strictEqual(eventMar.length, 2, 'Bulan Maret 2027 harus memiliki tepat 2 event');
console.log('✅ Uji 3 Berhasil: Setiap bulan memiliki tepat 2 event (Nov: 2, Des: 2, Jan: 2, Feb: 2, Mar: 2)');

// 5. Uji Helper Hubungkan ke TOBK Sesi
const dummyEvent = DAFTAR_EVENT_TRYOUT_SMA[0];
const dummyProfil = {
  studentId: 'STD-1226080001',
  nama: 'Kaka Desta Rahmadani',
  kelas: '12 SMA',
  telepon: '081234567890',
};
const dummyTarget = {
  namaPtn: 'Universitas Indonesia',
  namaProdi: 'Kedokteran',
};

const sesiResult = hubungkanSiswaKeTobkSession({
  event: dummyEvent,
  profil: dummyProfil,
  targetKampus: dummyTarget,
});

assert.ok(sesiResult, 'Sesi TOBK harus berhasil dibuat');
assert.strictEqual(sesiResult.nama, 'Kaka Desta Rahmadani');
assert.strictEqual(sesiResult.targetPtn, 'Universitas Indonesia');
assert.strictEqual(sesiResult.tokenResmi, dummyEvent.token);
console.log('✅ Uji 4 Berhasil: Sinkronisasi data siswa ke portal CBT profesional berjalan lancar');

console.log('🎉 SELURUH PENGUJIAN EVENT TRY OUT TERJADWAL 2X SEBULAN SMA BERHASIL 100%!');
