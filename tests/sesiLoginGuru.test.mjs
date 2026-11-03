// tests/sesiLoginGuru.test.mjs
// ============================================================
// PENGAWAL register bug B-25 (3 Nov 2026): tombol Keluar di dasbor guru dulu
// menghapus kunci yang TIDAK dipakai penjaga rute, sehingga setelah logout
// `isGuruLoggedIn='true'` + `role='guru'` masih ada dan /guru/* tetap terbuka
// di perangkat bersama. Test ini memakai storage palsu (tanpa jsdom) dan
// memastikan: sesudah hapusSesiGuru(), penjaga rute menganggap BELUM masuk.
// ============================================================
import assert from 'node:assert/strict';
import { hapusSesiGuru, masihDianggapMasuk, KUNCI_SESI_GURU } from '../src/utils/sesiLoginGuru.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

/** Storage palsu berperilaku seperti localStorage (cukup untuk logika ini). */
function storagePalsu(isi = {}) {
  const data = new Map(Object.entries(isi));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    _sisa: () => Object.fromEntries(data),
  };
}

const SESI_GURU = {
  teacherData: '{"id":"docAni","nama":"Ani"}',
  guruInfo: '{"id":"docAni"}',
  isGuruLoggedIn: 'true',
  role: 'guru',
};

console.log('sesiLoginGuru: logout guru benar-benar menutup sesi');

uji('sesi guru lengkap dianggap sudah masuk oleh penjaga rute', () => {
  assert.equal(masihDianggapMasuk(storagePalsu(SESI_GURU)), true);
});

uji('REPRODUSENSI BUG LAMA: menghapus teacherData saja TIDAK menutup sesi', () => {
  const s = storagePalsu(SESI_GURU);
  s.removeItem('teacherData');
  s.removeItem('isLoggedIn');   // inilah yang dulu dihapus dashboard
  s.removeItem('userRole');
  assert.equal(masihDianggapMasuk(s), true, 'inilah lubangnya: masih dianggap masuk');
});

uji('hapusSesiGuru menutup sesi: penjaga rute menolak setelah logout', () => {
  const s = storagePalsu({ ...SESI_GURU, isLoggedIn: 'true', userRole: 'guru' });
  const dihapus = hapusSesiGuru(s);
  assert.equal(masihDianggapMasuk(s), false);
  KUNCI_SESI_GURU.forEach((k) => assert.equal(s.getItem(k), null, `${k} wajib hilang`));
  assert.equal(s.getItem('role'), null);
  assert.ok(dihapus.includes('isGuruLoggedIn') && dihapus.includes('teacherData'));
});

uji('hapusSesiGuru: `role` admin TIDAK ikut dibuang (perangkat bersama)', () => {
  const s = storagePalsu({ ...SESI_GURU, role: 'admin' });
  hapusSesiGuru(s);
  assert.equal(s.getItem('role'), 'admin', 'sesi admin tidak boleh ikut keluar');
  assert.equal(s.getItem('isGuruLoggedIn'), null);
});

uji('hapusSesiGuru: preferensi non-sesi tetap utuh (tidak seperti localStorage.clear)', () => {
  const s = storagePalsu({ ...SESI_GURU, sakelarPapanJelajah: 'nyala', gemilangTema: 'gelap' });
  hapusSesiGuru(s);
  assert.equal(s.getItem('sakelarPapanJelajah'), 'nyala');
  assert.equal(s.getItem('gemilangTema'), 'gelap');
});

uji('aman dipanggil dua kali dan saat storage kosong/tidak ada', () => {
  const kosong = storagePalsu({});
  assert.deepEqual(hapusSesiGuru(kosong), []);
  const s = storagePalsu(SESI_GURU);
  hapusSesiGuru(s);
  assert.deepEqual(hapusSesiGuru(s), [], 'pemanggilan kedua tidak melaporkan kunci apa pun');
  assert.deepEqual(hapusSesiGuru(null), [], 'tanpa storage: tidak melempar, tidak ada yang dihapus');
  assert.equal(masihDianggapMasuk(null), false);
});

uji('storage yang melempar (mode privat) tidak menggagalkan logout', () => {
  const rewel = {
    getItem: () => { throw new Error('denied'); },
    removeItem: () => { throw new Error('denied'); },
    setItem: () => { throw new Error('denied'); },
  };
  assert.doesNotThrow(() => hapusSesiGuru(rewel));
  assert.equal(masihDianggapMasuk(rewel), false);
});

uji('hanya teacherData (tanpa isGuruLoggedIn) tetap dianggap masuk → wajib ikut terhapus', () => {
  const s = storagePalsu({ teacherData: '{"id":"x"}', role: 'teacher' });
  assert.equal(masihDianggapMasuk(s), true);
  hapusSesiGuru(s);
  assert.equal(masihDianggapMasuk(s), false);
});

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
