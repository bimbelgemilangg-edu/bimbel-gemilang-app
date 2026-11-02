// tests/aksesKontenSiswa.test.mjs — pagar akses konten siswa (v1.5.5)
// Tripwire audit pra-migrasi pondasi mapel v2: TIDAK BOLEH ada siswa terkunci
// dari modul/kuis gara-gara selisih kode lama vs kanonik, dan TIDAK BOLEH ada
// kebocoran lintas mapel (jebakan 'ipa'⊂'ipas', 'bind'⊂'bind_tl').
//   node tests/aksesKontenSiswa.test.mjs
import assert from 'node:assert/strict';
import { cocokkanAksesMapel, cocokkanAksesModul } from '../src/utils/aksesKontenSiswa.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}
console.log('aksesKontenSiswa — pagar akses modul & mapel (satu sumber v1.5.5)');

uji('semantik dasar pagar lama dipertahankan persis', () => {
  assert.equal(cocokkanAksesModul([], 'MATEMATIKA', 'mtk'), false); // 🔒 kosong = BLOKIR
  assert.equal(cocokkanAksesModul(['mtk'], 'Umum', ''), true);      // Umum selalu lolos
  assert.equal(cocokkanAksesModul(['mtk'], '', ''), true);          // tanpa label = tak ada dasar blokir
  assert.equal(cocokkanAksesModul(['semua'], 'MATEMATIKA', 'mtk'), true);
  assert.equal(cocokkanAksesModul(['mtk'], 'MATEMATIKA', 'mtk'), true);   // kode eksak
  assert.equal(cocokkanAksesModul(['Matematika'], 'MATEMATIKA', ''), true); // nama eksak
  assert.equal(cocokkanAksesModul(['ipa'], 'MATEMATIKA', 'mtk'), false);   // beda mapel = blokir
});

uji('migran: enrolled kanonik + modul kode lama tetap TERBUKA (jaring pengaman)', () => {
  // modul yang lolos dari rewrite: kodeMapel lama, subject nama varian
  assert.equal(cocokkanAksesModul(['geo'], 'GEOGRAFI SMA', 'MAPEL-019'), true);
  assert.equal(cocokkanAksesModul(['geo'], 'Geografi', ''), true);
  assert.equal(cocokkanAksesModul(['utbk_pu'], 'TPS/Penalaran Umum', 'MAPEL-100'), true);
});

uji('tak ada kebocoran lintas mapel: jebakan ipa⊂ipas & bind⊂bind_tl', () => {
  assert.equal(cocokkanAksesModul(['ipa'], 'IPAS', ''), false);
  assert.equal(cocokkanAksesModul(['ipas'], 'IPA', ''), false);
  assert.equal(cocokkanAksesModul(['ips'], 'IPA', ''), false);
  assert.equal(cocokkanAksesModul(['bind'], 'Bahasa Indonesia Tingkat Lanjut', ''), false);
  assert.equal(cocokkanAksesModul(['bind_tl'], 'Bahasa Indonesia', 'bind'), false);
  assert.equal(cocokkanAksesModul(['geo'], 'Geografi', ''), true); // kontrol positif
});

uji('era pra-migrasi (enrolled masih MAPEL-XXX): tidak menambah blokir baru', () => {
  // perilaku lama StudentDashboard/StudentQuizView: modul tanpa kode = jangan blokir
  assert.equal(cocokkanAksesModul(['MAPEL-019'], 'Geografi', ''), true);
  // kode lama eksak tetap cocok (tak berubah)
  assert.equal(cocokkanAksesModul(['MAPEL-019'], 'Geografi', 'MAPEL-019'), true);
  // dua kode lama berbeda = tetap blokir (persis semua halaman lama)
  assert.equal(cocokkanAksesModul(['MAPEL-019'], 'Geografi', 'MAPEL-020'), false);
});

uji('cocokkanAksesMapel (Latihan Harian) tidak berubah semantiknya', () => {
  assert.equal(cocokkanAksesMapel(['mtk'], ''), true);       // soal tanpa kode → jangan blokir
  assert.equal(cocokkanAksesMapel([], 'mtk'), false);        // 🔒 kosong = BLOKIR
  assert.equal(cocokkanAksesMapel(['semua'], 'mtk'), true);
  assert.equal(cocokkanAksesMapel(['geo', 'mtk'], 'mtk'), true);
  assert.equal(cocokkanAksesMapel(['geo'], 'mtk'), false);
});

console.log(`\n${gagal === 0 ? '✅' : '❌'} aksesKontenSiswa: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
