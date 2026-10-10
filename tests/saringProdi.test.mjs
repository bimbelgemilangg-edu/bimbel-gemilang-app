// tests/saringProdi.test.mjs — pencarian terkunci di dalam pilihan cascading
//     node tests/saringProdi.test.mjs
import assert from 'node:assert/strict';
import { saringProdi } from '../src/utils/saringProdi.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('saringProdi — pencarian tidak boleh kabur dari kampus terpilih');

const P = (id, idPtn, o = {}) => ({ id, idPtn, namaProdi: id, namaPtn: idPtn, ...o });
const prodi = [
  P('UNEJ-13', 'PTN-077', { namaProdi: 'Teknik Pertambangan', fakultas: 'Fakultas Teknik', kampus: 'Kampus Jember' }),
  P('UNEJ-15', 'PTN-077', { namaProdi: 'Teknik Sipil', fakultas: 'Fakultas Teknik' }),
  P('UNEJ-20', 'PTN-077', { namaProdi: 'Penyuluhan Pertanian', fakultas: 'Fakultas Pertanian' }),
  P('ITB-04', 'PTN-044', { namaProdi: 'Teknik Pertambangan', fakultas: 'FTTM' }),
  P('UNPAD-02', 'PTN-045', { namaProdi: 'Teknik Pertambangan' }),
];

uji('REGRESI: kampus terpilih + kata kunci -> hanya prodi kampus itu', () => {
  // Persis keluhan owner: filter UNEJ + ketik "perta" harusnya bukan
  // menampilkan FTTM ITB & Teknik Pertambangan kampus lain.
  const h = saringProdi({ prodi, ptnId: 'PTN-077', cari: 'perta' });
  assert.deepEqual(h.map((p) => p.id), ['UNEJ-13', 'UNEJ-20']);
  assert.ok(!h.some((p) => p.idPtn !== 'PTN-077'));
});

uji('fakultas terpilih menyempitkan lagi', () => {
  const h = saringProdi({ prodi, ptnId: 'PTN-077', fakultas: 'Fakultas Teknik', cari: 'perta' });
  assert.deepEqual(h.map((p) => p.id), ['UNEJ-13']);
});

uji('tanpa kata kunci: daftar = isi cascading, urut nama', () => {
  const h = saringProdi({ prodi, ptnId: 'PTN-077' });
  assert.deepEqual(h.map((p) => p.id), ['UNEJ-20', 'UNEJ-13', 'UNEJ-15']);
});

uji('tanpa kampus: pencarian menyeluruh sebagai jalan pintas', () => {
  const h = saringProdi({ prodi, cari: 'pertambangan' });
  assert.equal(h.length, 3, 'semua kampus boleh saat belum ada kampus terpilih');
});

uji('tidak peka huruf besar/kecil dan spasi pinggir', () => {
  assert.equal(saringProdi({ prodi, ptnId: 'PTN-077', cari: '  PERTA  ' }).length, 2);
});

uji('hasil pencarian dibatasi supaya layar tidak memanjang', () => {
  const banyak = Array.from({ length: 100 }, (_, i) => P(`X-${i}`, 'PTN-077', { namaProdi: `Prodi ${i}` }));
  assert.equal(saringProdi({ prodi: banyak, ptnId: 'PTN-077', cari: 'prodi' }).length, 40);
  assert.equal(saringProdi({ prodi: banyak, ptnId: 'PTN-077', cari: 'prodi', batas: 5 }).length, 5);
});

uji('masukan rusak tidak melempar', () => {
  assert.deepEqual(saringProdi({}), []);
  assert.deepEqual(saringProdi({ prodi: null, ptnId: null, cari: null }), []);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
