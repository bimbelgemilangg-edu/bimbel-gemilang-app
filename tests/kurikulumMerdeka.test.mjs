// tests/kurikulumMerdeka.test.mjs
// ============================================================
// Uji peta Kurikulum Merdeka (src/utils/kurikulumMerdeka.js).
//
//     node tests/kurikulumMerdeka.test.mjs
//
// KENAPA INI PENTING
// Keluhan owner 2026-10-08: dropdown impor menampilkan Biologi & Sosiologi
// sebagai pilihan untuk dokumen SD, tidak ada IPAS, tidak ada pembeda
// "Matematika wajib vs minat" untuk SMA. Akar masalahnya: tidak ada peta
// kurikulum sama sekali — KATALOG_MAPEL adalah daftar datar tanpa ikatan
// jenjang/fase.
//
// Uji di bawah memaku KELUHAN ITU SENDIRI sebagai invarian, supaya tidak
// bisa regress diam-diam:
//   1. tekan SD  -> Biologi/Sosiologi/Fisika/Kimia TIDAK muncul, IPAS muncul
//   2. tekan SMP -> IPA & IPS muncul sebagai mapel utuh, IPAS tidak
//   3. tekan SMA -> ada Matematika DAN Matematika Tingkat Lanjut; yang
//      tingkat lanjut TIDAK ditawarkan untuk kelas 10 (Fase E)
//   4. penamaan K13 dipetakan, bukan dibiarkan beranak
//   5. nama yang tidak dikenal TIDAK dikarang penggantinya
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FASE_PER_KELAS,
  faseDariKelas,
  jenjangDariKelas,
  mapelBerlaku,
  daftarMapelUntuk,
  petakanNamaMapel,
  peringatanKeselarasanKurikulum,
} from '../src/utils/kurikulumMerdeka.js';

const namaDari = (daftar) => daftar.map((m) => m.nama);

// ------------------------------------------------------------
// 1. Fase per kelas
// ------------------------------------------------------------

test('fase mengikuti struktur Kurikulum Merdeka', () => {
  assert.equal(faseDariKelas('1'), 'A');
  assert.equal(faseDariKelas('2'), 'A');
  assert.equal(faseDariKelas('3'), 'B');
  assert.equal(faseDariKelas('6'), 'C');
  assert.equal(faseDariKelas('7'), 'D');
  assert.equal(faseDariKelas('9'), 'D');
  assert.equal(faseDariKelas('10'), 'E');
  assert.equal(faseDariKelas('12'), 'F');
});

test('kelas tak dikenal tidak dikarang fasenya', () => {
  assert.equal(faseDariKelas('13'), '');
  assert.equal(faseDariKelas(''), '');
  assert.equal(faseDariKelas(null), '');
  assert.equal(jenjangDariKelas('Semua'), '');
});

test('jenjang bisa disimpulkan dari kelas', () => {
  assert.equal(jenjangDariKelas('4'), 'SD/MI');
  assert.equal(jenjangDariKelas('8'), 'SMP/MTs');
  assert.equal(jenjangDariKelas('11'), 'SMA/MA');
});

test('tabel fase lengkap 1-12 tanpa lubang', () => {
  for (let k = 1; k <= 12; k += 1) assert.ok(FASE_PER_KELAS[k], `kelas ${k} harus punya fase`);
});

// ------------------------------------------------------------
// 2. KELUHAN 1: tekan SD, yang muncul mapel SD
// ------------------------------------------------------------

test('INVARIAN: SD tidak menawarkan Biologi/Sosiologi/Fisika/Kimia/IPA/IPS', () => {
  const nama = namaDari(daftarMapelUntuk({ jenjang: 'SD/MI' }));
  for (const salah of ['Biologi', 'Sosiologi', 'Fisika', 'Kimia', 'IPA', 'IPS', 'Sejarah', 'Ekonomi', 'Geografi']) {
    assert.ok(!nama.includes(salah), `${salah} tidak boleh ditawarkan untuk SD`);
  }
});

test('SD menawarkan IPAS (mulai Fase B), tidak untuk kelas 1-2', () => {
  assert.ok(namaDari(daftarMapelUntuk({ jenjang: 'SD/MI' })).includes('IPAS'));
  assert.ok(!namaDari(daftarMapelUntuk({ kelas: '1' })).includes('IPAS'), 'Fase A belum punya IPAS');
  assert.ok(namaDari(daftarMapelUntuk({ kelas: '3' })).includes('IPAS'));
  assert.ok(namaDari(daftarMapelUntuk({ kelas: '6' })).includes('IPAS'));
});

test('mapel inti SD tetap ada', () => {
  const nama = namaDari(daftarMapelUntuk({ jenjang: 'SD/MI' }));
  for (const wajib of ['Bahasa Indonesia', 'Matematika', 'Pendidikan Pancasila', 'PJOK', 'Seni dan Budaya']) {
    assert.ok(nama.includes(wajib), `${wajib} harus ada di SD`);
  }
});

// ------------------------------------------------------------
// 3. KELUHAN 2: SMP punya IPA & IPS utuh
// ------------------------------------------------------------

test('SMP menawarkan IPA dan IPS sebagai mapel utuh, bukan IPAS', () => {
  const nama = namaDari(daftarMapelUntuk({ jenjang: 'SMP/MTs' }));
  assert.ok(nama.includes('IPA'));
  assert.ok(nama.includes('IPS'));
  assert.ok(!nama.includes('IPAS'), 'IPAS hanya untuk SD');
  assert.ok(!nama.includes('Biologi'), 'di SMP rumpun ilmu belum dipecah');
  assert.ok(!nama.includes('Sosiologi'));
});

// ------------------------------------------------------------
// 4. KELUHAN 3: SMA punya wajib vs tingkat lanjut
// ------------------------------------------------------------

test('SMA menawarkan Matematika DAN Matematika Tingkat Lanjut', () => {
  const nama = namaDari(daftarMapelUntuk({ jenjang: 'SMA/MA' }));
  assert.ok(nama.includes('Matematika'));
  assert.ok(nama.includes('Matematika Tingkat Lanjut'));
});

test('INVARIAN: tingkat lanjut hanya Fase F (kelas 11-12), bukan kelas 10', () => {
  assert.ok(!namaDari(daftarMapelUntuk({ kelas: '10' })).includes('Matematika Tingkat Lanjut'));
  assert.ok(namaDari(daftarMapelUntuk({ kelas: '11' })).includes('Matematika Tingkat Lanjut'));
  assert.ok(namaDari(daftarMapelUntuk({ kelas: '12' })).includes('Matematika Tingkat Lanjut'));
  assert.equal(mapelBerlaku('mtk_tl', { kelas: '10' }), false);
  assert.equal(mapelBerlaku('mtk_tl', { kelas: '12' }), true);
});

test('rumpun ilmu SMA ditawarkan di Fase E dan F', () => {
  const nama = namaDari(daftarMapelUntuk({ jenjang: 'SMA/MA' }));
  for (const rumpun of ['Fisika', 'Kimia', 'Biologi', 'Sosiologi', 'Ekonomi', 'Geografi', 'Sejarah']) {
    assert.ok(nama.includes(rumpun), `${rumpun} harus ada di SMA`);
  }
});

test('kelompok wajib didahulukan dalam daftar (urutan yang enak dibaca)', () => {
  const daftar = daftarMapelUntuk({ jenjang: 'SMA/MA' });
  const idxWajib = daftar.findIndex((m) => m.kelompok === 'wajib');
  const idxPilihan = daftar.findIndex((m) => m.kelompok === 'pilihan');
  assert.ok(idxWajib < idxPilihan);
});

// ------------------------------------------------------------
// 5. Padanan nama lama / salah jenjang
// ------------------------------------------------------------

test('penamaan K13 dipetakan ke nama Kurikulum Merdeka', () => {
  assert.equal(petakanNamaMapel('Matematika Wajib', { jenjang: 'SMA/MA' }).nama, 'Matematika');
  const minat = petakanNamaMapel('Matematika Minat', { jenjang: 'SMA/MA', kelas: '12' });
  assert.equal(minat.nama, 'Matematika Tingkat Lanjut');
  assert.equal(minat.diubah, true);
  assert.equal(petakanNamaMapel('Matematika Peminatan', { jenjang: 'SMA/MA', kelas: '11' }).nama, 'Matematika Tingkat Lanjut');
});

test('rumpun ilmu di SD dipetakan ke IPAS', () => {
  for (const salah of ['Biologi', 'Fisika', 'Kimia', 'IPA', 'IPS', 'Sosiologi', 'Geografi', 'Sejarah']) {
    const h = petakanNamaMapel(salah, { jenjang: 'SD/MI' });
    assert.equal(h.nama, 'IPAS', `${salah} di SD harus jadi IPAS`);
    assert.equal(h.diubah, true);
  }
});

test('rumpun ilmu di SMP dipetakan ke IPA/IPS', () => {
  assert.equal(petakanNamaMapel('Biologi', { jenjang: 'SMP/MTs' }).nama, 'IPA');
  assert.equal(petakanNamaMapel('Kimia', { jenjang: 'SMP/MTs' }).nama, 'IPA');
  assert.equal(petakanNamaMapel('Sosiologi', { jenjang: 'SMP/MTs' }).nama, 'IPS');
  assert.equal(petakanNamaMapel('Ekonomi', { jenjang: 'SMP/MTs' }).nama, 'IPS');
});

test('INVARIAN: nama tak dikenal TIDAK dikarang penggantinya', () => {
  const h = petakanNamaMapel('Astronomi Terapan', { jenjang: 'SMA/MA' });
  assert.equal(h.nama, 'Astronomi Terapan');
  assert.equal(h.diubah, false);
  assert.equal(h.kode, '');
});

test('IPAS setelah SD diakui sebagai kejanggalan, bukan dipaksa pindah', () => {
  const h = petakanNamaMapel('IPAS', { jenjang: 'SMA/MA' });
  assert.equal(h.diubah, false, 'jangan menebak maksudnya — suruh manusia memeriksa jenjangnya');
  assert.match(h.alasan, /periksa kembali/i);
});

test('kelas tanpa jenjang tetap bisa disimpulkan dari kelasnya', () => {
  assert.equal(petakanNamaMapel('Biologi', { kelas: '4' }).nama, 'IPAS');
  assert.equal(petakanNamaMapel('Biologi', { kelas: '8' }).nama, 'IPA');
  assert.equal(petakanNamaMapel('Biologi', { kelas: '11' }).nama, 'Biologi');
});

test('nama sudah benar tidak ditandai berubah', () => {
  const h = petakanNamaMapel('Matematika', { jenjang: 'SD/MI', kelas: '5' });
  assert.equal(h.nama, 'Matematika');
  assert.equal(h.diubah, false);
});

// ------------------------------------------------------------
// 6. Peringatan keselarasan (untuk audit & pratinjau impor)
// ------------------------------------------------------------

test('butir selaras tidak mendapat peringatan', () => {
  assert.deepEqual(peringatanKeselarasanKurikulum({ mapel: 'Matematika', jenjang: 'SD/MI', kelas: '5' }), []);
  assert.deepEqual(peringatanKeselarasanKurikulum({ mapel: 'IPAS', jenjang: 'SD/MI', kelas: '4' }), []);
  assert.deepEqual(peringatanKeselarasanKurikulum({ mapel: 'Biologi', jenjang: 'SMA/MA', kelas: '11' }), []);
});

test('butir salah jenjang mendapat peringatan yang menyebut padanannya', () => {
  const p = peringatanKeselarasanKurikulum({ mapel: 'Biologi', jenjang: 'SD/MI', kelas: '4' });
  assert.equal(p.length, 1);
  assert.match(p[0], /IPAS/);
});

test('penamaan K13 tetap diperingatkan walau sudah bisa dipetakan', () => {
  const p = peringatanKeselarasanKurikulum({ mapel: 'Matematika Wajib', jenjang: 'SMA/MA', kelas: '12' });
  assert.ok(p.some((x) => /Kurikulum Merdeka menyebutnya "Matematika"/.test(x)));
});

test('mapel kosong tidak dituduh apa-apa di sini (urusan alat identitas)', () => {
  assert.deepEqual(peringatanKeselarasanKurikulum({ mapel: '', jenjang: 'SD/MI' }), []);
  assert.deepEqual(peringatanKeselarasanKurikulum({}), []);
});

test('mapel asing dilaporkan sebagai tidak ada di peta', () => {
  const p = peringatanKeselarasanKurikulum({ mapel: 'Astronomi Terapan', jenjang: 'SMA/MA' });
  assert.equal(p.length, 1);
  assert.match(p[0], /tidak ada di peta Kurikulum Merdeka/);
});
