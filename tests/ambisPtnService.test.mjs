// tests/ambisPtnService.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDaftarPtnAmbis,
  getDaftarProdiAmbis,
  getPtnBySlug,
  hitungGapTarget,
} from '../src/utils/ambisPtnDataHelper.js';
import { getLogoPtn, getMonogramPtn } from '../src/utils/logoPtnHelper.js';

test('targetKampusService: kelengkapan 173 PTN dan 4.594 prodi AmbisPTN', () => {
  const ptnList = getDaftarPtnAmbis();
  assert.equal(ptnList.length, 173, 'Harus memuat persis 173 PTN nasional');

  const prodiList = getDaftarProdiAmbis();
  assert.equal(prodiList.length, 4594, 'Harus memuat persis 4.594 program studi nasional');

  // Cek UI
  const ui = getPtnBySlug('universitas-indonesia');
  assert.ok(ui, 'Universitas Indonesia harus ditemukan');
  assert.equal(ui.name, 'Universitas Indonesia');
  assert.ok(ui.majors && ui.majors.length >= 70, 'UI harus memiliki minimal 70 prodi');

  // Cek prodi Kedokteran UI
  const kedokteranUi = prodiList.find((p) => (p.uni_slug === 'ui' || p.uni_short === 'UI') && p.name.includes('Kedokteran'));
  assert.ok(kedokteranUi, 'Kedokteran UI harus ada');
  assert.ok(kedokteranUi.passing_score >= 700, 'Passing score kedokteran UI harus >= 700');
  assert.ok(kedokteranUi.capacity > 0, 'Daya tampung harus positif');
});

test('targetKampusService: perhitungan GAP dan ambis meter', () => {
  // Skor siswa 720, target 700 -> GAP +20 (Hijau Aman)
  const hAman = hitungGapTarget(700, 720);
  assert.equal(hAman.zona, 'HIJAU_AMAN');
  assert.equal(hAman.gap, 20);

  // Skor siswa 705, target 700 -> GAP +5 (Hijau Kompetitif)
  const hKompetitif = hitungGapTarget(700, 705);
  assert.equal(hKompetitif.zona, 'HIJAU_KOMPETITIF');
  assert.equal(hKompetitif.gap, 5);

  // Skor siswa 680, target 700 -> GAP -20 (Kuning Pemantapan)
  const hKuning = hitungGapTarget(700, 680);
  assert.equal(hKuning.zona, 'KUNING');
  assert.equal(hKuning.gap, -20);

  // Skor siswa 620, target 700 -> GAP -80 (Merah)
  const hMerah = hitungGapTarget(700, 620);
  assert.equal(hMerah.zona, 'MERAH');
  assert.equal(hMerah.gap, -80);

  // Skor belum ada
  const hKosong = hitungGapTarget(700, null);
  assert.equal(hKosong.zona, 'TANPA_DATA');
});

test('logoPtnHelper: resolusi logo resmi Cloudflare R2 dan fallback monogram', () => {
  const logoApiBanyuwangi = getLogoPtn({
    slug: 'akademi-penerbang-indonesia-banyuwangi',
    uni_name: 'Akademi Penerbang Indonesia Banyuwangi',
  });
  assert.ok(logoApiBanyuwangi.includes('akademi-penerbang-indonesia-banyuwangi.png'));

  const logoUi = getLogoPtn({ singkatan: 'UI' });
  assert.ok(logoUi && logoUi.includes('Makara_UI'));
});
