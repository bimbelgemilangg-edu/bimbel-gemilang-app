// tests/ambisBenchmark.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { getLogoPtn, getMonogramPtn } from '../src/utils/logoPtnHelper.js';
import { isPaketOtomatisAi } from '../src/utils/jalurUjianAiConfig.js';
import rawDataPtn from '../src/data/imporPtnData.json' with { type: 'json' };

test('logoPtnHelper: resolusi logo resmi dan fallback monogram', () => {
  const logoUI = getLogoPtn({ singkatan: 'UI', nama: 'Universitas Indonesia' });
  assert.ok(logoUI && logoUI.includes('Makara_UI'), 'Logo UI harus merujuk ke Makara UI');

  const logoITB = getLogoPtn({ singkatan: 'ITB', nama: 'Institut Teknologi Bandung' });
  assert.ok(logoITB && logoITB.includes('Institut_Teknologi_Bandung'), 'Logo ITB harus tersedia');

  const monogram = getMonogramPtn({ singkatan: 'POLSRI', nama: 'Politeknik Negeri Sriwijaya' });
  assert.equal(monogram.inisial, 'POLSRI');
});

test('database 173 PTN: kelengkapan data PTN dan Prodi untuk eksplorasi', () => {
  assert.ok(rawDataPtn.ptn && rawDataPtn.ptn.length >= 150, 'Jumlah PTN minimal 150');
  assert.ok(rawDataPtn.prodi && rawDataPtn.prodi.length >= 200, 'Jumlah Prodi minimal 200');

  const prodiDokterUi = rawDataPtn.prodi.find((p) => p.idPtn === 'PTN-036' && p.namaProdi.includes('Dokter'));
  assert.ok(prodiDokterUi, 'Prodi Dokter UI harus ada');
  assert.ok(prodiDokterUi.skorReferensi.minimum.nilai >= 700, 'Passing grade Dokter UI harus realistis >= 700');
});

test('isPaketOtomatisAi: memisahkan keras paket tryout akbar / lama (40 soal) dari micro-learning (12-15 soal)', () => {
  // Paket tryout besar / lama dengan 40 soal dan 75 menit -> BUKAN paket otomatis AI roadmap!
  const paketTryoutLama = {
    id: 'paket-smp-lama',
    judul: 'TRY OUT PEMAHAMAN TKA SMP - Sabtu, 17 Okt',
    durasiMenit: 75,
    daftarSoal: new Array(40).fill({ id: 's' }),
    terjadwal: true,
  };
  assert.equal(isPaketOtomatisAi(paketTryoutLama), false, 'Tryout 40 soal harus ditolak dari roadmap');

  // Paket micro-learning 12 butir 20 menit -> SAH paket otomatis AI roadmap
  const paketMicro = {
    id: 'unit_smp_1',
    judul: 'Unit 1: TKA Matematika — Pola Bilangan',
    durasiMenit: 20,
    daftarSoal: new Array(12).fill({ id: 's' }),
    jalurUjianAi: true,
  };
  assert.equal(isPaketOtomatisAi(paketMicro), true, 'Unit 12 soal harus diterima sebagai paket otomatis roadmap');
});
