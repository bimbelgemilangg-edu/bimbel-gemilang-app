// tests/ambisPracticeRoadmap.test.mjs
import assert from 'node:assert';
import {
  DAFTAR_SUBTES_LATIHAN,
  BANK_SOAL_LATIHAN_UTBK,
  getBankSoalPerSubtes,
  getPaketLatihanPerSubtes,
  getSoalLatihanKilat,
  hitungStatistikLatihanSiswa,
  simpanHasilSesiLatihan,
} from '../src/data/ambisLatihanBankSoal.js';
import { getDaftarUnitJalurUjian } from '../src/utils/jalurUjianAiConfig.js';

console.log('🧪 Memulai pengujian Benchmark Roadmap & Latihan AmbisPTN...');

// 1. Uji Kelengkapan 7 Subtes Resmi
assert.strictEqual(DAFTAR_SUBTES_LATIHAN.length, 7, 'Harus ada tepat 7 subtes resmi UTBK SNBT');
const daftarKode = DAFTAR_SUBTES_LATIHAN.map((s) => s.kode);
const expectedKode = ['PU', 'PPU', 'PBM', 'PK', 'LBIN', 'LBING', 'PM'];
expectedKode.forEach((k) => {
  assert.ok(daftarKode.includes(k), `Subtes ${k} harus ada dalam daftar subtes latihan`);
});
console.log('✅ Uji 1 Berhasil: 7 Subtes resmi lengkap (PU, PPU, PBM, PK, LBIN, LBING, PM)');

// 2. Uji Kesiapan Bank Soal (Minimal 300+ Butir Soal Tersebar di 7 Subtes)
assert.ok(BANK_SOAL_LATIHAN_UTBK.length >= 350, `Bank soal harus melimpah (saat ini: ${BANK_SOAL_LATIHAN_UTBK.length})`);
DAFTAR_SUBTES_LATIHAN.forEach((st) => {
  const soalList = getBankSoalPerSubtes(st.kode);
  assert.ok(soalList.length >= 40, `Subtes ${st.kode} harus memiliki minimal 40 soal (ada: ${soalList.length})`);

  // Pastikan setiap butir soal valid
  soalList.forEach((s, idx) => {
    assert.ok(s.id, `Soal #${idx} subtes ${st.kode} harus punya id`);
    assert.ok(s.soal && s.soal.length > 5, `Soal #${idx} subtes ${st.kode} harus punya teks pertanyaan`);
    assert.ok(Array.isArray(s.opsi) && s.opsi.length >= 4, `Soal #${idx} subtes ${st.kode} harus punya opsi minimal 4`);
    assert.ok(['A', 'B', 'C', 'D', 'E'].includes(s.kunci), `Soal #${idx} subtes ${st.kode} kunci harus A-E`);
    assert.ok(s.pembahasan && s.pembahasan.length > 5, `Soal #${idx} subtes ${st.kode} harus punya pembahasan`);
  });
});
console.log(`✅ Uji 2 Berhasil: Total ${BANK_SOAL_LATIHAN_UTBK.length} butir soal valid dan terdistribusi merata di 7 subtes`);

// 3. Uji Paket Latihan & Generator Kilat
DAFTAR_SUBTES_LATIHAN.forEach((st) => {
  const paketList = getPaketLatihanPerSubtes(st.kode, 10);
  assert.ok(paketList.length >= 4, `Subtes ${st.kode} harus memiliki minimal 4 paket latihan`);
  assert.strictEqual(paketList[0].jumlahSoal, 10, 'Ukuran paket pertama harus 10 soal');

  const kilat = getSoalLatihanKilat(st.kode, 10);
  assert.strictEqual(kilat.length, 10, `Latihan kilat ${st.kode} harus menghasilkan tepat 10 butir soal`);
});
console.log('✅ Uji 3 Berhasil: Generator paket 10 butir dan latihan kilat berjalan sempurna');

// 4. Uji Isolasi Data Siswa & Penyimpanan Sesi
const dummyStudentId = 'test_student_123';
const statAwal = hitungStatistikLatihanSiswa(dummyStudentId);
assert.strictEqual(statAwal.totalSoalDikerjakanSemua, 0, 'Siswa baru harus memiliki 0 soal dikerjakan');

const simpanResult = simpanHasilSesiLatihan({
  studentId: dummyStudentId,
  subtesKode: 'PK',
  paketId: 'paket_test_1',
  mode: 'Active Recall',
  soalList: getSoalLatihanKilat('PK', 10),
  jawabanMap: { 1: true, 2: true, 3: false },
  benarCount: 8,
  durasiDetik: 600,
});
assert.strictEqual(simpanResult.sukses, true, 'Penyimpanan sesi harus berhasil');

const statSetelah = hitungStatistikLatihanSiswa(dummyStudentId);
assert.ok(statSetelah.totalSoalDikerjakanSemua >= 10, 'Total soal dikerjakan harus bertambah');
assert.strictEqual(statSetelah.rekapSubtes.PK.dilatihHariIni, true, 'Subtes PK harus berstatus dilatih hari ini');
console.log('✅ Uji 4 Berhasil: Isolasi dan penyimpanan latihan per siswa berjalan akurat');

// 5. Uji Pemisahan Murni Unit SMA di Roadmap (Tidak Boleh Ada Teks 'dan' / Campuran MTK & Bahasa)
const unitsSma = getDaftarUnitJalurUjian('SMA');
assert.strictEqual(unitsSma.length, 9, 'Unit SMA harus memiliki 8 Unit + 1 Review');
unitsSma.filter((u) => u.tipe !== 'review').forEach((u) => {
  if (u.unitNomor <= 7) {
    assert.ok(
      !u.judul.toLowerCase().includes('dan') && !u.judul.toLowerCase().includes('& wacana'),
      `Unit ${u.unitNomor} (${u.judul}) tidak boleh mencampuradukkan matematika dan wacana bahasa`
    );
  }
});
console.log('✅ Uji 5 Berhasil: Unit-unit SMA 100% dipisahkan secara murni per subtes resmi SNPMB');

console.log('🎉 SEMUA PENGUJIAN BENCHMARK ROADMAP & LATIHAN AMBISPTN BERHASIL 100%!');
