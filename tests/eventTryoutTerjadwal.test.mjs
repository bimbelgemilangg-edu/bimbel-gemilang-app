// tests/eventTryoutTerjadwal.test.mjs
import assert from 'node:assert';
import {
  DAFTAR_EVENT_TRYOUT_SMA,
  getEventByTanggal,
  getEventByBulan,
  getStatusEventTerhadapWaktu,
  hubungkanSiswaKeTobkSession,
} from '../src/data/eventTryoutTerjadwalData.js';

console.log('🧪 Memulai pengujian Event Try Out Terjadwal 2x Seminggu (Benchmark AmbisPTN)...');

// 1. Uji Kelengkapan Event 2x Seminggu
assert.ok(DAFTAR_EVENT_TRYOUT_SMA.length >= 35, `Harus ada minimal 35 event terjadwal (ada: ${DAFTAR_EVENT_TRYOUT_SMA.length})`);

// 2. Uji Hari Pelaksanaan (Harus Hari Rabu dan Sabtu)
DAFTAR_EVENT_TRYOUT_SMA.forEach((ev) => {
  const d = new Date(ev.tanggalIso);
  const day = d.getDay();
  assert.ok(day === 3 || day === 6, `Event ${ev.judul} (${ev.tanggalIso}) harus jatuh di hari Rabu (3) atau Sabtu (6), bukan ${day}`);
  assert.ok(ev.token && ev.token.length >= 3, `Event ${ev.judul} harus memiliki token ujian resmi`);
  assert.strictEqual(ev.durasiMenit, 195, 'Durasi standar resmi harus 195 menit');
  assert.strictEqual(ev.totalSoal, 160, 'Jumlah soal standar resmi harus 160 soal');
  assert.strictEqual(ev.daftarSubtes.length, 7, 'Harus mencakup 7 subtes resmi SNPMB');
});
console.log(`✅ Uji 1 Berhasil: ${DAFTAR_EVENT_TRYOUT_SMA.length} event terjadwal 2x seminggu (Rabu & Sabtu) lengkap 7 subtes 160 soal`);

// 3. Uji Penamaan Marketing (Tryout Fundamental UTBK 1 & 2, Ambis UTBK, Siap UTBK, Berjuang UTBK)
const semuaJudul = DAFTAR_EVENT_TRYOUT_SMA.map((e) => e.judul);
const adaFundamental1 = semuaJudul.some((j) => j.includes('Fundamental UTBK 1'));
const adaFundamental2 = semuaJudul.some((j) => j.includes('Fundamental UTBK 2'));
const adaAmbis = semuaJudul.some((j) => j.includes('Ambis UTBK'));
const adaSiap = semuaJudul.some((j) => j.includes('Siap UTBK'));
const adaBerjuang = semuaJudul.some((j) => j.includes('Berjuang UTBK'));

assert.ok(adaFundamental1, 'Harus ada event bertajuk Tryout Fundamental UTBK 1');
assert.ok(adaFundamental2, 'Harus ada event bertajuk Tryout Fundamental UTBK 2');
assert.ok(adaAmbis, 'Harus ada event bertajuk Ambis UTBK');
assert.ok(adaSiap, 'Harus ada event bertajuk Siap UTBK');
assert.ok(adaBerjuang, 'Harus ada event bertajuk Berjuang UTBK');
console.log('✅ Uji 2 Berhasil: Penamaan marketing (Fundamental 1 & 2, Ambis, Siap, Berjuang) terpenuhi');

// 4. Uji Query Tanggal & Bulan
const eventHariIni = getEventByTanggal('2026-11-18');
assert.ok(eventHariIni.length >= 1, 'Harus ada event yang aktif pada Rabu, 18 November 2026');
assert.ok(eventHariIni[0].judul.includes('Berjuang UTBK') || eventHariIni[0].judul.includes('UTBK'));

const eventNov = getEventByBulan(2026, 10);
assert.strictEqual(eventNov.length, 8, 'Bulan November 2026 harus memiliki tepat 8 event (4 Rabu + 4 Sabtu)');

const eventDes = getEventByBulan(2026, 11);
assert.strictEqual(eventDes.length, 9, 'Bulan Desember 2026 harus memiliki tepat 9 event (5 Rabu + 4 Sabtu)');
console.log('✅ Uji 3 Berhasil: Filter tanggal dan bulan akurat (Nov: 8 event, Des: 9 event)');

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

console.log('🎉 SELURUH PENGUJIAN EVENT TRY OUT TERJADWAL SMA BERHASIL 100%!');
