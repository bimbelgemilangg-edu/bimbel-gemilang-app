// tests/statistikGuru.test.mjs
// ============================================================
// PENGAWAL item B3 batch 4 (keputusan owner D3 + D4, 3 Nov 2026): angka kartu
// dasbor guru harus JUJUR dan bisa dihitung dari jendela ±15 hari saja.
// Yang dijaga:
//   • kehadiran tidak lagi dibagi roster versi sekarang secara membabi buta:
//     penyebut utama = `siswaTotal` di dalam log; roster sekarang hanya
//     cadangan untuk log lama dan ditandai `perkiraan`; tanpa dua-duanya sesi
//     TIDAK dihitung (bukan dihitung 0) dan muncul di `tanpaBukti`.
//   • tidak ada bukti sama sekali → persen `null` (UI menampilkan "—"), bukan
//     0% yang menuduh guru tidak hadir.
//   • siswa terjadwal = siswa unik di dalam jendela, bukan seluruh riwayat.
// ============================================================
import assert from 'node:assert/strict';
import { hitungKehadiran, hitungStatistikGuru } from '../src/utils/statistikGuru.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

console.log('statistikGuru: angka kartu jujur dari jendela 15 hari');

const HARI_INI = '2026-11-03';
const jadwal = (id, dateStr, start, students, status) => ({ id, dateStr, start, students, status });

const JENDELA = [
  jadwal('j1', '2026-11-02', '15:00', [{ studentId: 's1' }, { studentId: 's2' }], 'completed'),
  jadwal('j2', HARI_INI, '16:00', [{ studentId: 's2' }, { id: 's3' }], 'ongoing'),
  jadwal('j3', HARI_INI, '07:00', ['s4'], 'scheduled'),
  jadwal('j4', '2026-11-05', '10:00', [{ studentId: 's1' }], 'scheduled'),
  jadwal('j5', '2026-10-28', '08:00', [{ studentId: 's9' }], 'completed'),
];

uji('hitungKehadiran: penyebut utama siswaTotal dari log (bukan roster sekarang)', () => {
  const h = hitungKehadiran({
    logs: [
      { jadwalId: 'j1', siswaHadir: 4, siswaTotal: 5 },
      { jadwalId: 'j1', siswaHadir: 6, siswaTotal: 6 },
    ],
    rosterJadwal: new Map([['j1', 99]]), // roster sekarang sudah membesar: TIDAK boleh dipakai
  });
  assert.equal(h.hadir, 10);
  assert.equal(h.total, 11);
  assert.equal(h.persen, 91);
  assert.equal(h.perkiraan, 0);
  assert.equal(h.sesiTerhitung, 2);
});

uji('hitungKehadiran: log lama tanpa siswaTotal memakai roster & ditandai perkiraan', () => {
  const h = hitungKehadiran({
    logs: [{ jadwalId: 'j1', siswaHadir: 3 }],
    rosterJadwal: new Map([['j1', 4]]),
  });
  assert.equal(h.persen, 75);
  assert.equal(h.perkiraan, 1, 'wajib tercatat sebagai perkiraan supaya UI bisa jujur');
});

uji('hitungKehadiran: tanpa penyebut sama sekali → sesi tidak dihitung', () => {
  const h = hitungKehadiran({ logs: [{ jadwalId: 'jX', siswaHadir: 3 }], rosterJadwal: new Map() });
  assert.equal(h.sesiTerhitung, 0);
  assert.equal(h.tanpaBukti, 1);
  assert.equal(h.persen, null, 'null, bukan 0 — 0% berarti menuduh');
});

uji('hitungKehadiran: persen null bila belum ada satu pun sesi tersimpan', () => {
  assert.equal(hitungKehadiran({ logs: [] }).persen, null);
  assert.equal(hitungKehadiran({ logs: [] }).tanpaBukti, 0);
});

uji('hitungKehadiran: data rusak tidak menghasilkan >100% atau NaN', () => {
  const h = hitungKehadiran({
    logs: [
      { jadwalId: 'a', siswaHadir: 9, siswaTotal: 5 },  // hadir > total: dijepit
      { jadwalId: 'b', siswaHadir: 'banyak' },          // bukan angka
      { jadwalId: 'c', siswaHadir: -2, siswaTotal: 4 }, // negatif
      { jadwalId: 'd', siswaHadir: 2, siswaTotal: 4 },
    ],
  });
  assert.equal(h.persen, 78, '(5+0+0+2)/(5+0+0+4) dibulatkan');
  assert.equal(Number.isNaN(h.persen), false);
  assert.ok(h.persen <= 100);
  assert.equal(h.tanpaBukti, 2, 'log tanpa angka hadir yang sah tidak dihitung');
});

uji('hitungStatistikGuru: sesi hari ini terurut jam, bukan urutan dokumen', () => {
  const s = hitungStatistikGuru({ jadwal: JENDELA, logs: [], hariIniStr: HARI_INI });
  assert.equal(s.sesiHariIni, 2);
  assert.deepEqual(s.daftarHariIni.map((x) => x.id), ['j3', 'j2'], '07:00 harus di atas 16:00');
});

uji('hitungStatistikGuru: "7 hari terakhir" = riwayat dalam jendela + hari ini', () => {
  const s = hitungStatistikGuru({ jadwal: JENDELA, logs: [], hariIniStr: HARI_INI });
  assert.equal(s.sesi7Hari, 4, 'j5 (28 Okt) + j1 (2 Nov) + 2 sesi hari ini');
  assert.equal(s.sesiSelesai7Hari, 2, 'j1 & j5 berstatus completed');
  assert.equal(s.sesiMendatang, 1);
  assert.deepEqual(s.daftarMendatang.map((x) => x.id), ['j4']);
});

uji('hitungStatistikGuru: siswa terjadwal = unik, berbagai bentuk penulisan siswa', () => {
  const s = hitungStatistikGuru({ jadwal: JENDELA, logs: [], hariIniStr: HARI_INI });
  assert.equal(s.siswaTerjadwal, 5, 's1,s2,s3,s4,s9 — s1 & s2 muncul di beberapa jadwal tapi dihitung sekali');
});

uji('hitungStatistikGuru: siswa tanpa identitas tidak ikut dihitung', () => {
  const s = hitungStatistikGuru({
    jadwal: [jadwal('j1', HARI_INI, '07:00', [{ nama: 'tanpa id' }, '', null, { studentId: '  ' }, { studentId: 's1' }])],
    logs: [],
    hariIniStr: HARI_INI,
  });
  assert.equal(s.siswaTerjadwal, 1);
});

uji('hitungStatistikGuru: kehadiran ikut terhitung dari log + roster jendela', () => {
  const s = hitungStatistikGuru({
    jadwal: JENDELA,
    logs: [
      { jadwalId: 'j2', siswaHadir: 2, siswaTotal: 2 },
      { jadwalId: 'j5', siswaHadir: 1 }, // log lama: roster j5 ada di jendela → perkiraan
    ],
    hariIniStr: HARI_INI,
  });
  assert.equal(s.kehadiran.persen, 100, '(2+1)/(2+1)');
  assert.equal(s.kehadiran.perkiraan, 1);
  assert.equal(s.kehadiran.sesiTerhitung, 2);
});

uji('hitungStatistikGuru: input kosong/rusak tidak melempar', () => {
  const s = hitungStatistikGuru({});
  assert.equal(s.sesiHariIni, 0);
  assert.equal(s.siswaTerjadwal, 0);
  assert.equal(s.kehadiran.persen, null);
  assert.deepEqual(s.daftarHariIni, []);
  const t = hitungStatistikGuru({ jadwal: null, logs: null, hariIniStr: null });
  assert.equal(t.sesi7Hari, 0);
});

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
