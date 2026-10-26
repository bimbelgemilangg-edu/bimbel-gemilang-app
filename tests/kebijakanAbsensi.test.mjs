// tests/kebijakanAbsensi.test.mjs
//     node tests/kebijakanAbsensi.test.mjs
import assert from 'node:assert/strict';
import {
  statusBerikutnya, kebijakanUntukStatus, paketPerluIzinUlang,
  waktuBerlakuSampaiIso, GRACE_IZIN_HARI, SIKLUS_ABSENSI, statusDariDokumenAbsensi, keteranganKebijakan,
} from '../src/utils/kebijakanAbsensi.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('kebijakanAbsensi — konsekuensi otomatis status absensi');

uji('siklus roll-call: Belum->Hadir->Izin->Sakit->Alpha->Hadir', () => {
  assert.equal(statusBerikutnya(undefined), 'Hadir');
  assert.equal(statusBerikutnya('Belum'), 'Hadir');
  assert.equal(statusBerikutnya('Hadir'), 'Izin');
  assert.equal(statusBerikutnya('Izin'), 'Sakit');
  assert.equal(statusBerikutnya('Sakit'), 'Alpha');
  assert.equal(statusBerikutnya('Alpha'), 'Hadir');
  assert.equal(SIKLUS_ABSENSI.length, 4);
});

uji('hanya Izin & Sakit yang memicu akses susulan; Alpha tidak', () => {
  assert.equal(kebijakanUntukStatus('Izin').beriIzinUlang, true);
  assert.equal(kebijakanUntukStatus('Sakit').beriIzinUlang, true);
  assert.equal(kebijakanUntukStatus('Alpha').beriIzinUlang, false);
  assert.equal(kebijakanUntukStatus('Alpha').tindakLanjut, 'alpha');
  assert.equal(kebijakanUntukStatus('Hadir').beriIzinUlang, false);
});

const HARI = 86400000;
const TUTUP = 1000 * HARI;
uji('paket perlu izin ulang: tutup pada/setelah hari absen & sudah lewat', () => {
  const paket = { status: 'aktif', waktuTutup: new Date(TUTUP).toISOString() };
  assert.equal(paketPerluIzinUlang(paket, { tanggalAbsenMs: TUTUP - 2 * HARI, sekarangMs: TUTUP + HARI }), true);
  assert.equal(paketPerluIzinUlang(paket, { tanggalAbsenMs: TUTUP, sekarangMs: TUTUP + HARI }), true);
});
uji('tidak perlu: tutup sebelum hari absen, masih terbuka, sudah selesai, nonaktif, tanpa tutup', () => {
  const paket = { status: 'aktif', waktuTutup: new Date(TUTUP).toISOString() };
  assert.equal(paketPerluIzinUlang(paket, { tanggalAbsenMs: TUTUP + HARI, sekarangMs: TUTUP + 2 * HARI }), false);
  assert.equal(paketPerluIzinUlang(paket, { tanggalAbsenMs: TUTUP - HARI, sekarangMs: TUTUP - 1000 }), false);
  assert.equal(paketPerluIzinUlang(paket, { tanggalAbsenMs: TUTUP - HARI, sekarangMs: TUTUP + HARI, adaSesiSelesai: true }), false);
  assert.equal(paketPerluIzinUlang({ ...paket, status: 'nonaktif' }, { tanggalAbsenMs: TUTUP - HARI, sekarangMs: TUTUP + HARI }), false);
  assert.equal(paketPerluIzinUlang({ status: 'aktif' }, { tanggalAbsenMs: TUTUP - HARI, sekarangMs: TUTUP + HARI }), false);
});
uji('masa berlaku akses = sekarang + 7 hari', () => {
  const kini = 1700000000000;
  assert.equal(new Date(waktuBerlakuSampaiIso(kini)).getTime() - kini, GRACE_IZIN_HARI * HARI);
});

uji('REGRESI PRODUKSI 2026-10-26: dokumen lama boolean/tak dikenal tidak crash UI', () => {
  assert.equal(statusDariDokumenAbsensi({ status: true }), 'Hadir');
  assert.equal(statusDariDokumenAbsensi({ status: false }), undefined);
  assert.equal(statusDariDokumenAbsensi({ status: 'Izin' }), 'Izin');
  assert.equal(statusDariDokumenAbsensi({ status: 'Alpha' }), 'Alpha');
  assert.equal(statusDariDokumenAbsensi({ status: 'hadir' }), 'Hadir');
  assert.equal(statusDariDokumenAbsensi({}), undefined);
  // nilai truthy tak dikenal dipetakan aman, bukan dibiarkan non-string
  assert.equal(typeof statusDariDokumenAbsensi({ status: 1 }), 'string');
});

uji('keterangan muncul untuk tiap status, kosong untuk tak dikenal', () => {
  assert.match(keteranganKebijakan('Izin'), /TERMAAFKAN/);
  assert.match(keteranganKebijakan('Izin'), /7 hari/);
  assert.match(keteranganKebijakan('Sakit'), /OTOMATIS/);
  assert.match(keteranganKebijakan('Alpha'), /TIDAK ada akses otomatis/);
  assert.match(keteranganKebijakan('Hadir'), /tanpa konsekuensi/);
  assert.equal(keteranganKebijakan('Entah'), '');
  assert.equal(keteranganKebijakan(undefined), '');
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
