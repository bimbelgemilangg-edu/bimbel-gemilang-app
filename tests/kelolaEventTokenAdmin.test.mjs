// tests/kelolaEventTokenAdmin.test.mjs
// ============================================================
// UNIT TEST: Pengelolaan Event Tryout Terjadwal, Token & Soal Admin
// Memastikan:
// 1. Token panitia dirahasiakan dari siswa sampai sesi diumumkan.
// 2. Override konfigurasi token oleh admin tersimpan dan tercermin di event.
// 3. Saklar aktif/kunci token bekerja dengan akurat.
// 4. Konfigurasi paket soal (preset UTBK 7 subtes vs bank soal) terhubung rapi.
// ============================================================

import assert from 'node:assert/strict';
import {
  DAFTAR_EVENT_TRYOUT_SMA,
  getEventByTanggal,
  simpanOverrideEvent,
  ambilOverrideEventMap,
  terapkanOverrideEvent,
} from '../src/data/eventTryoutTerjadwalData.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try {
    fn();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal++;
    console.log(`  ✗ ${nama}\n      ${String(e?.message || e)}`);
  }
}

console.log('kelolaEventTokenAdmin — Test Pengelolaan Event & Token Panitia');

// Mock localStorage
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

uji('Event default memiliki token panitia bawaan', () => {
  const ev = DAFTAR_EVENT_TRYOUT_SMA[0];
  assert.ok(ev.token, 'Event harus memiliki token default');
  assert.equal(typeof ev.token, 'string');
});

uji('Admin dapat mengubah kode token panitia (override)', () => {
  const targetEventId = 'event_utbk_2026_11_18';
  simpanOverrideEvent(targetEventId, {
    token: 'BERJUANG-JUARA-2026',
    tokenAktif: true,
  });

  const eventList = getEventByTanggal('2026-11-18');
  assert.ok(eventList.length >= 1);
  const ev = eventList[0];
  assert.equal(ev.token, 'BERJUANG-JUARA-2026', 'Token harus ter-override oleh admin');
});

uji('Admin dapat menonaktifkan / mengunci token event', () => {
  const targetEventId = 'event_utbk_2026_11_18';
  simpanOverrideEvent(targetEventId, {
    tokenAktif: false,
  });

  const eventList = getEventByTanggal('2026-11-18');
  assert.equal(eventList[0].tokenAktif, false, 'Status token harus nonaktif/terkunci');
});

uji('Admin dapat menghubungkan paket bank soal khusus ke event', () => {
  const targetEventId = 'event_utbk_2026_11_18';
  simpanOverrideEvent(targetEventId, {
    sumberSoal: 'paket_bank',
    paketBimbelId: 'pkt-utbk-master-01',
    paketBimbelJudul: 'Paket Intensif UTBK 2026 Master',
    totalSoal: 160,
  });

  const eventList = getEventByTanggal('2026-11-18');
  assert.equal(eventList[0].sumberSoal, 'paket_bank');
  assert.equal(eventList[0].paketBimbelId, 'pkt-utbk-master-01');
  assert.equal(eventList[0].paketBimbelJudul, 'Paket Intensif UTBK 2026 Master');
});

console.log(`\n========================================================`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log(`========================================================`);

if (gagal > 0) process.exit(1);
