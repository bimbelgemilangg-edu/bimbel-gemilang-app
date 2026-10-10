// tests/sakelarFitur.test.mjs — sakelar fitur / mode uji coba
// ============================================================
//     node tests/sakelarFitur.test.mjs
//
// KENAPA INI PENTING
// Repo ini deploy otomatis ke HP siswa (PWA autoUpdate) dan tidak punya
// mekanisme sakelar fitur sama sekali sebelum 2026-10-10. Berkas ini menjaga
// satu sifat yang tidak boleh pernah berubah:
//
//     APA PUN yang salah dengan konfigurasinya, fitur HARUS MATI.
//
// Gagal ke arah aman. Kalau satu saja test di bagian "default menolak" di
// bawah bisa diloloskan dengan mengubah kode, artinya ada jalan bagi fitur
// yang belum selesai untuk muncul di HP siswa sungguhan.
// ============================================================
import assert from 'node:assert/strict';
import {
  putuskanAksesFitur, bentukKonfigurasiFitur, MODE,
} from '../src/utils/sakelarFitur.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}

console.log('sakelarFitur — feature flag mode uji coba');

const SISWA_UJI = { studentId: 'GEM-UJI-001', kelasSekolah: '12 UJI' };
const SISWA_ASLI = { studentId: 'GEM-2024-0147', kelasSekolah: '12 SMA' };

const cfgWhitelist = {
  rasionalisasiKampus: {
    aktif: true, mode: MODE.WHITELIST, daftarSiswaUji: ['GEM-UJI-001'],
  },
};
const cfgKelas = {
  rasionalisasiKampus: {
    aktif: true, mode: MODE.KELAS, daftarKelasUji: ['12 UJI'],
  },
};

// ============================================================ DEFAULT MENOLAK
uji('INVARIAN: konfigurasi tidak ada / rusak -> fitur MATI', () => {
  const rusak = [
    null, undefined, {}, 0, false, '', 'rasionalisasiKampus', [],
    { rasionalisasiKampus: null },
    { rasionalisasiKampus: 'aktif' },
    { rasionalisasiKampus: [] },
    { fiturLain: { aktif: true, mode: 'semua' } },
  ];
  for (const k of rusak) {
    const r = putuskanAksesFitur(k, 'rasionalisasiKampus', SISWA_UJI);
    assert.equal(r.aktif, false, `harus MATI untuk konfigurasi: ${JSON.stringify(k)}`);
    assert.ok(r.alasan, 'harus menjelaskan kenapa mati');
  }
});

uji('INVARIAN: aktif !== true -> MATI (bukan truthy, harus true)', () => {
  for (const aktif of [false, null, undefined, 0, 1, 'true', 'ya', '1', {}, []]) {
    const k = { f: { aktif, mode: MODE.SEMUA } };
    assert.equal(
      putuskanAksesFitur(k, 'f', SISWA_UJI).aktif,
      false,
      `aktif=${JSON.stringify(aktif)} tidak boleh menyalakan fitur`,
    );
  }
});

uji('INVARIAN: mode tak dikenal -> MATI, jangan menebak maksud admin', () => {
  for (const mode of ['persen', 'SEMUA_ORANG', 'all', 'true', 1, {}]) {
    const k = { f: { aktif: true, mode, daftarSiswaUji: ['GEM-UJI-001'] } };
    assert.equal(
      putuskanAksesFitur(k, 'f', SISWA_UJI).aktif,
      false,
      `mode=${JSON.stringify(mode)} harus ditolak`,
    );
  }
});

uji('mode kosong -> jatuh ke whitelist (paling ketat), bukan ke semua', () => {
  const k = { f: { aktif: true, daftarSiswaUji: ['GEM-UJI-001'] } };
  assert.equal(putuskanAksesFitur(k, 'f', SISWA_UJI).aktif, true);
  assert.equal(putuskanAksesFitur(k, 'f', SISWA_ASLI).aktif, false);
});

uji('daftar uji kosong -> MATI walau aktif=true dan mode sah', () => {
  // Ini jebakan paling mungkin terjadi: admin menyalakan fitur lalu lupa
  // mengisi daftar. Kalau ini lolos, fitur tayang ke SEMUA siswa.
  const k1 = { f: { aktif: true, mode: MODE.WHITELIST, daftarSiswaUji: [] } };
  const k2 = { f: { aktif: true, mode: MODE.KELAS, daftarKelasUji: [] } };
  const k3 = { f: { aktif: true, mode: MODE.WHITELIST } };
  for (const k of [k1, k2, k3]) {
    assert.equal(putuskanAksesFitur(k, 'f', SISWA_UJI).aktif, false, JSON.stringify(k));
  }
});

uji('nama fitur kosong -> MATI', () => {
  for (const nama of ['', null, undefined, '   ']) {
    assert.equal(putuskanAksesFitur(cfgWhitelist, nama, SISWA_UJI).aktif, false);
  }
});

uji('data siswa kosong -> MATI untuk mode whitelist & kelas', () => {
  const kosong = [{}, { studentId: '' }, null, undefined];
  for (const s of kosong) {
    assert.equal(putuskanAksesFitur(cfgWhitelist, 'rasionalisasiKampus', s).aktif, false, JSON.stringify(s));
    assert.equal(putuskanAksesFitur(cfgKelas, 'rasionalisasiKampus', s).aktif, false, JSON.stringify(s));
  }
});

uji('opsi.aktif=false mematikan paksa walau konfigurasi menyala', () => {
  // Dipakai halaman yang di-ship dalam keadaan mati total saat dibangun.
  const k = { f: { aktif: true, mode: MODE.SEMUA } };
  assert.equal(putuskanAksesFitur(k, 'f', SISWA_ASLI, { aktif: false }).aktif, false);
});

// ================================================================== YANG LOLOS
uji('whitelist: hanya siswa terdaftar yang boleh', () => {
  assert.equal(putuskanAksesFitur(cfgWhitelist, 'rasionalisasiKampus', SISWA_UJI).aktif, true);
  assert.equal(putuskanAksesFitur(cfgWhitelist, 'rasionalisasiKampus', SISWA_ASLI).aktif, false);
});

uji('INVARIAN: siswa sungguhan tidak pernah lolos mode uji', () => {
  // Test terpenting di berkas ini. Selama mode masih whitelist/kelas dengan
  // daftar berisi akun uji, tidak boleh ada satu pun siswa biasa yang masuk.
  const siswaAsli = [
    { studentId: 'GEM-2024-0147', kelasSekolah: '12 SMA' },
    { studentId: 'GEM-2024-0002', kelasSekolah: '9 SMP' },
    { studentId: 'GEM-2023-0311', kelasSekolah: '6 SD' },
    { studentId: 'GEM-2024-0148', kelasSekolah: '12 UJI' }, // kelas uji, tapi bukan whitelist
  ];
  for (const s of siswaAsli) {
    assert.equal(putuskanAksesFitur(cfgWhitelist, 'rasionalisasiKampus', s).aktif, false, s.studentId);
  }
});

uji('kelas: semua siswa di kelas uji boleh, kelas lain tidak', () => {
  assert.equal(putuskanAksesFitur(cfgKelas, 'rasionalisasiKampus', SISWA_UJI).aktif, true);
  assert.equal(
    putuskanAksesFitur(cfgKelas, 'rasionalisasiKampus', { studentId: 'X', kelasSekolah: '12 UJI' }).aktif,
    true,
  );
  assert.equal(putuskanAksesFitur(cfgKelas, 'rasionalisasiKampus', SISWA_ASLI).aktif, false);
});

uji('mode semua: hanya bila admin memang menulisnya secara eksplisit', () => {
  const k = { f: { aktif: true, mode: MODE.SEMUA } };
  assert.equal(putuskanAksesFitur(k, 'f', SISWA_ASLI).aktif, true);
  assert.equal(putuskanAksesFitur(k, 'f', {}).aktif, true, 'mode semua tidak butuh identitas siswa');
});

uji('mode tidak peka huruf besar/kecil di sisi pembaca', () => {
  // Admin menulis konfigurasi ini lewat panel, tapi Firestore juga bisa diedit
  // tangan di Console. 'WHITELIST' harus berperilaku sama dengan 'whitelist',
  // bukan jatuh ke penolakan.
  const k = { f: { aktif: true, mode: 'WHITELIST', daftarSiswaUji: ['GEM-UJI-001'] } };
  assert.equal(putuskanAksesFitur(k, 'f', SISWA_UJI).aktif, true);
  assert.equal(putuskanAksesFitur(k, 'f', SISWA_ASLI).aktif, false);
  const k2 = { f: { aktif: true, mode: 'Semua' } };
  assert.equal(putuskanAksesFitur(k2, 'f', SISWA_ASLI).aktif, true);
});

uji('nama fitur tidak peka huruf besar/kecil', () => {
  // Admin menulis kunci di Firestore secara manual; jangan sampai fitur mati
  // cuma karena 'RasionalisasiKampus' vs 'rasionalisasiKampus'.
  for (const nama of ['rasionalisasiKampus', 'RasionalisasiKampus', 'RASIONALISASIKAMPUS', ' rasionalisasikampus ']) {
    assert.equal(putuskanAksesFitur(cfgWhitelist, nama, SISWA_UJI).aktif, true, nama);
  }
});

uji('beberapa fitur saling bebas (satu mati tidak mematikan yang lain)', () => {
  const k = {
    fiturA: { aktif: true, mode: MODE.SEMUA },
    fiturB: { aktif: false, mode: MODE.SEMUA },
  };
  assert.equal(putuskanAksesFitur(k, 'fiturA', SISWA_ASLI).aktif, true);
  assert.equal(putuskanAksesFitur(k, 'fiturB', SISWA_ASLI).aktif, false);
});

// ============================================================== BENTUK SIMPAN
uji('bentukKonfigurasiFitur menghasilkan default yang MATI', () => {
  const c = bentukKonfigurasiFitur({});
  assert.equal(c.aktif, false);
  assert.equal(c.mode, MODE.WHITELIST);
  assert.deepEqual(c.daftarSiswaUji, []);
  assert.deepEqual(c.daftarKelasUji, []);
  // Dan konfigurasi default itu sendiri harus ditolak oleh pengambil keputusan.
  assert.equal(putuskanAksesFitur({ f: c }, 'f', SISWA_UJI).aktif, false);
});

uji('bentukKonfigurasiFitur menolak mode tak dikenal -> whitelist', () => {
  for (const mode of ['ngawur', '', null, 'Semua_orang', 1, {}]) {
    assert.equal(bentukKonfigurasiFitur({ mode }).mode, MODE.WHITELIST, String(mode));
  }
});

uji('bentukKonfigurasiFitur membersihkan daftar dari entri kosong', () => {
  const c = bentukKonfigurasiFitur({ daftarSiswaUji: [' A ', '', null, 'B'] });
  assert.deepEqual(c.daftarSiswaUji, ['A', 'B']);
});

uji('INVARIAN: hasil bentukKonfigurasiFitur selalu bisa diputuskan tanpa error', () => {
  // Round-trip: apa pun yang admin simpan lewat panel, pembacanya tidak boleh
  // melempar error dan tidak boleh tiba-tiba menyalakan fitur.
  const masukan = [
    {}, { aktif: true }, { aktif: true, mode: 'kelas' },
    { aktif: true, mode: 'semua' }, { aktif: 'ya', mode: null },
    { aktif: true, mode: 'whitelist', daftarSiswaUji: 'bukan-array' },
  ];
  for (const m of masukan) {
    const c = bentukKonfigurasiFitur(m);
    const r = putuskanAksesFitur({ f: c }, 'f', SISWA_ASLI);
    assert.equal(typeof r.aktif, 'boolean');
    assert.ok(r.alasan !== undefined);
    if (c.aktif !== true || c.mode !== MODE.SEMUA) {
      assert.equal(r.aktif, false, `tidak boleh menyala: ${JSON.stringify(m)}`);
    }
  }
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
