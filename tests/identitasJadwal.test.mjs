// tests/identitasJadwal.test.mjs
// ============================================================
// PENGAWAL item B3 batch 2 (keputusan owner D5, 3 Nov 2026): SATU aturan
// pencocokan jadwal↔guru untuk semua halaman guru. Yang dijaga di sini:
//   1. ID menang mutlak bila ada → dua guru bernama sama tidak saling melihat
//      kelas (lubang yang diperingatkan identitasGuru.js).
//   2. Nama hanya jadi kunci untuk data warisan tanpa `teacherId`, dan
//      dicocokkan longgar (spasi/kapitalisasi) → beda satu spasi tidak lagi
//      membuat kelas hilang di dasbor tetapi muncul di halaman absensi.
//   3. Jendela tanggal (−7..+7) dihitung dari komponen tanggal LOKAL, bukan
//      `new Date('YYYY-MM-DD')` yang berjangkar UTC — diverifikasi dengan dua
//      proses anak ber-TZ berbeda (Asia/Jakarta vs UTC).
// ============================================================
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  normTeks, identitasPencariJadwal, jadwalMilikGuru, rentangTanggalJadwal,
} from '../src/utils/identitasJadwal.js';

const MOD = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'utils', 'identitasJadwal.js');

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

console.log('identitasJadwal: satu aturan pencocokan jadwal↔guru + jendela tanggal');

const GURU = { guruId: 'GURU-005', id: 'docAni123', nama: '  Ani   Sari ' };
const IDT = identitasPencariJadwal(GURU);

uji('normTeks merapikan spasi berulang dan kapitalisasi', () => {
  assert.equal(normTeks('  Ani   SARI '), 'ani sari');
  assert.equal(normTeks(null), '');
  assert.equal(normTeks(undefined), '');
});

uji('identitasPencariJadwal mengumpulkan semua ID sah + nama ternormalkan', () => {
  assert.deepEqual(IDT.ids, ['GURU-005', 'docAni123']);
  assert.equal(IDT.nama, 'Ani   Sari', 'nama tampil dipertahankan apa adanya (hanya spasi tepi dibuang)');
  assert.equal(IDT.namaNorm, 'ani sari', 'nama untuk pencocokan dirapikan: spasi dalam + kapitalisasi');
});

uji('identitasPencariJadwal aman untuk guru tanpa data (tidak melempar)', () => {
  const kosong = identitasPencariJadwal(null);
  assert.deepEqual(kosong.ids, []);
  assert.equal(kosong.namaNorm, '');
});

uji('jadwal dengan teacherId cocok (docId maupun kode GURU-) diterima', () => {
  assert.equal(jadwalMilikGuru({ teacherId: 'docAni123' }, IDT), true);
  assert.equal(jadwalMilikGuru({ teacherId: 'GURU-005' }, IDT), true);
  assert.equal(jadwalMilikGuru({ teacherId: '  GURU-005  ' }, IDT), true, 'spasi di data tidak boleh memecah pencocokan');
});

uji('ATURAN 1: bila dokumen punya teacherId, nama DIABAIKAN (dua guru bernama sama tidak bocor)', () => {
  assert.equal(
    jadwalMilikGuru({ teacherId: 'docGuruLain', teacherName: 'Ani Sari' }, IDT),
    false,
    'nama cocok tapi ID milik guru lain → wajib ditolak',
  );
});

uji('ATURAN 2: dokumen warisan tanpa teacherId dicocokkan lewat teacherName longgar', () => {
  assert.equal(jadwalMilikGuru({ teacherId: '', teacherName: 'ani  SARI' }, IDT), true);
  assert.equal(jadwalMilikGuru({ teacherName: 'Ani Sari' }, IDT), true);
  assert.equal(jadwalMilikGuru({ teacherId: '', teacherName: 'Budi' }, IDT), false);
});

uji('ATURAN 2b: jalur warisan `booker` juga dikenali', () => {
  assert.equal(jadwalMilikGuru({ booker: 'ANI SARI' }, IDT), true);
  assert.equal(jadwalMilikGuru({ booker: 'Budi' }, IDT), false);
});

uji('guru tanpa nama tidak otomatis memiliki semua jadwal warisan', () => {
  const tanpaNama = identitasPencariJadwal({ guruId: 'GURU-009', id: 'docX' });
  assert.equal(jadwalMilikGuru({ teacherName: '' }, tanpaNama), false);
  assert.equal(jadwalMilikGuru({ teacherId: 'docX' }, tanpaNama), true);
});

uji('input rusak ditolak, bukan dilempar', () => {
  assert.equal(jadwalMilikGuru(null, IDT), false);
  assert.equal(jadwalMilikGuru({ teacherId: 'docAni123' }, null), false);
  assert.equal(jadwalMilikGuru('bukan-objek', IDT), false);
});

uji('jendela tanggal default −7..+7 hari dari tanggal bisnis', () => {
  const r = rentangTanggalJadwal({ hariIniStr: '2026-11-03' });
  assert.deepEqual(r, { hariIni: '2026-11-03', dari: '2026-10-27', sampai: '2026-11-10' });
});

uji('jendela aman lintas bulan dan lintas tahun', () => {
  assert.equal(rentangTanggalJadwal({ hariIniStr: '2026-01-01' }).dari, '2025-12-25');
  assert.equal(rentangTanggalJadwal({ hariIniStr: '2026-12-30' }).sampai, '2027-01-06');
  assert.equal(rentangTanggalJadwal({ hariIniStr: '2026-03-01' }).dari, '2026-02-22');
});

uji('lebar jendela bisa diubah; nilai negatif/aneh tidak merusak', () => {
  const r = rentangTanggalJadwal({ hariIniStr: '2026-11-03', mundurHari: 3, majuHari: 14 });
  assert.equal(r.dari, '2026-10-31');
  assert.equal(r.sampai, '2026-11-17');
  const aneh = rentangTanggalJadwal({ hariIniStr: '2026-11-03', mundurHari: -5, majuHari: 'x' });
  assert.equal(aneh.dari, '2026-10-29');
  assert.equal(aneh.sampai, '2026-11-03');
});

uji('jendela SAMA di TZ Asia/Jakarta dan TZ UTC (tidak ada drift zona)', () => {
  const skrip = `import { rentangTanggalJadwal } from ${JSON.stringify(MOD)};
    console.log(JSON.stringify(rentangTanggalJadwal({ hariIniStr: '2026-11-03' })));`;
  const hasil = ['Asia/Jakarta', 'UTC', 'America/New_York'].map((tz) => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', skrip], { encoding: 'utf8', env: { ...process.env, TZ: tz } });
    assert.equal(r.status, 0, `proses TZ=${tz} gagal: ${r.stderr?.slice(0, 200)}`);
    return r.stdout.trim();
  });
  assert.equal(hasil[0], hasil[1], 'Asia/Jakarta vs UTC berbeda');
  assert.equal(hasil[0], hasil[2], 'Asia/Jakarta vs America/New_York berbeda (string tanggal berjangkar UTC)');
  assert.equal(JSON.parse(hasil[0]).dari, '2026-10-27');
});

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
