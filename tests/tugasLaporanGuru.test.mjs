// tests/tugasLaporanGuru.test.mjs
// ============================================================
// PENGAWAL REFAKTOR A3 (2 Nov 2026): kartu "tugas pengisian laporan
// belajar" di dashboard guru TIDAK LAGI membaca SELURUH koleksi students
// pada tiap perubahan settings. Bacaannya kini tertarget (array-contains
// per mapel + 'semua'), dan pemicunya membandingkan sidik jari konfigurasi
// supaya perubahan global_config yang TIDAK relevan tidak membakar bacaan.
//
// Test ini memaku dua hal:
//   1. SEMANTIK TIDAK BERUBAH -- hitungTugasLaporanBelajar menghasilkan
//      angka yang SAMA dengan algoritma lama (loop per mapel atas daftar
//      siswa penuh) pada fixture yang sama. Refaktor boleh mengubah cara
//      membaca, tidak boleh mengubah arti angka.
//   2. KUNCI QUERY & KUNCI COCOK benar -- kunciQuerySiswaUntukGuru memuat
//      kode mapel guru PLUS 'semua' (siswa yang terdaftar pada semua mapel
//      tidak boleh luput), dan kunciPencocokLaporan menormalkan huruf besar/
//      kecil supaya dokumen laporan lama tetap cocok.
// ============================================================
import assert from 'node:assert/strict';
import {
  mapelDiampuGuru, filterSiswaUntukGuru, statusPengisianSiswa,
  DIMENSI_KEYS_LAPORAN,
  kunciPencocokLaporan, kunciQuerySiswaUntukGuru, hitungTugasLaporanBelajar,
} from '../src/utils/laporanBelajar.js';
import { potongUntukQuery } from '../src/utils/papanJelajah.js';

const SEKARANG = Date.UTC(2026, 10, 2); // 2 Nov 2026, dipaku supaya tanggalSelesai deterministik

const guru = {
  docId: 'g1', nama: 'Rina',
  mapelDetails: [
    { kodeMapel: 'MTK', namaMapel: 'Matematika' },
    { kodeMapel: 'IPA', namaMapel: 'Ilmu Pengetahuan Alam' },
  ],
};

const siswa = (id, enrolled, ekstra = {}) => ({ id, nama: `Siswa ${id}`, enrolledSubjects: enrolled, status: 'aktif', ...ekstra });

const SEMUA_SISWA = [
  siswa('s1', ['MTK']),
  siswa('s2', ['semua']),
  siswa('s3', ['IPA', 'MTK']),
  siswa('s4', ['MTK'], { isBlocked: true }),                    // diblokir -> tidak dihitung
  siswa('s5', ['MTK'], { status: 'nonaktif' }),                 // nonaktif -> tidak dihitung
  siswa('s6', ['MTK'], { tanggalSelesai: '2026-10-01' }),       // masa aktif habis -> tidak dihitung
  siswa('s7', ['BING']),                                        // tidak terdaftar mapel guru -> tidak dihitung
];

const dokLaporan = {};
// Dokumen laporan TIDAK menyimpan field status: status DITURUNKAN dari
// kelengkapan dimensi capaian (statusPengisianSiswa). Fixture wajib meniru
// bentuk asli itu, bukan mengarang field 'status'.
const capaianPenuh = () => Object.fromEntries(DIMENSI_KEYS_LAPORAN.map((k) => [k, { predikat: 'A' }]));
const capaianSatu = () => ({ [DIMENSI_KEYS_LAPORAN[0]]: { predikat: 'B' } });
const isi = (studentId, kodeMapel, jenis) => {
  dokLaporan[kunciPencocokLaporan(studentId, kodeMapel)] = {
    studentId,
    kodeMapel,
    capaian: jenis === 'selesai' ? capaianPenuh() : jenis === 'draft' ? capaianSatu() : {},
  };
};
isi('s1', 'MTK', 'selesai');
isi('s2', 'MTK', 'selesai');
isi('s2', 'IPA', 'draft');
isi('s3', 'IPA', 'selesai');
// s3 MTK sengaja tidak ada dokumennya (belum diisi sama sekali)

function uji(nama, fn) {
  try { fn(); console.log('  ✓', nama); } catch (e) { console.log('  ✗', nama, '\n   ', e.message); process.exitCode = 1; }
}

console.log('tugasLaporanGuru: pengawal refaktor A3 (hitungan tertarget = hitungan lama)');

// ------------------------------------------------------------
// 1. ALGORITMA LAMA (salinan setia kode sebelum refaktor) sebagai pembanding
// ------------------------------------------------------------
function hitungCaraLama(daftarSiswaPenuh, guruX, dokX, sekarangMs) {
  const daftarMapel = mapelDiampuGuru(guruX);
  let total = 0; let selesai = 0;
  for (const m of daftarMapel) {
    const guruMapel = { ...guruX, kodeMapel: m.kodeMapel, mapelDetails: [m] };
    const daftar = filterSiswaUntukGuru(daftarSiswaPenuh, guruMapel, { sekarangMs });
    for (const s of daftar) {
      total += 1;
      const dok = dokX[`${s.id}__${String(m.kodeMapel).toLowerCase()}`];
      if (statusPengisianSiswa(dok) === 'selesai') selesai += 1;
    }
  }
  return { total, selesai, semuaSelesai: total > 0 && selesai === total };
}

// dokumen lama memakai kunci huruf-kecil persis `${id}__${kode.toLowerCase()}`
const dokKunciLama = {};
for (const k of Object.keys(dokLaporan)) dokKunciLama[k] = dokLaporan[k];

uji('hitungan baru SAMA PERSIS dengan algoritma lama pada fixture yang sama', () => {
  const lama = hitungCaraLama(SEMUA_SISWA, guru, dokKunciLama, SEKARANG);
  const baru = hitungTugasLaporanBelajar({ guru, daftarSiswa: SEMUA_SISWA, dokLaporan, sekarangMs: SEKARANG });
  assert.deepEqual(baru, lama);
  // dan angkanya memang yang kita harapkan dari membaca fixture dengan mata:
  // MTK: s1,s2,s3 (3) + IPA: s2,s3 (2) = 5 pasangan; selesai: s1-MTK, s2-MTK, s3-IPA = 3
  assert.deepEqual(baru, { total: 5, selesai: 3, semuaSelesai: false });
});

uji('total = jumlah pasangan siswa-aktif-terdaftar x mapel ampuan (invarian)', () => {
  const daftarMapel = mapelDiampuGuru(guru);
  let harap = 0;
  for (const m of daftarMapel) {
    harap += filterSiswaUntukGuru(SEMUA_SISWA, { ...guru, kodeMapel: m.kodeMapel, mapelDetails: [m] }, { sekarangMs: SEKARANG }).length;
  }
  const { total } = hitungTugasLaporanBelajar({ guru, daftarSiswa: SEMUA_SISWA, dokLaporan, sekarangMs: SEKARANG });
  assert.equal(total, harap);
});

uji('semuaSelesai hanya benar bila ADA siswa dan semuanya selesai', () => {
  const dokPenuh = {};
  for (const m of mapelDiampuGuru(guru)) {
    for (const s of filterSiswaUntukGuru(SEMUA_SISWA, { ...guru, kodeMapel: m.kodeMapel, mapelDetails: [m] }, { sekarangMs: SEKARANG })) {
      dokPenuh[kunciPencocokLaporan(s.id, m.kodeMapel)] = { studentId: s.id, kodeMapel: m.kodeMapel, capaian: capaianPenuh() };
    }
  }
  const penuh = hitungTugasLaporanBelajar({ guru, daftarSiswa: SEMUA_SISWA, dokLaporan: dokPenuh, sekarangMs: SEKARANG });
  assert.equal(penuh.semuaSelesai, true);
  const kosong = hitungTugasLaporanBelajar({ guru, daftarSiswa: [], dokLaporan: {}, sekarangMs: SEKARANG });
  assert.deepEqual(kosong, { total: 0, selesai: 0, semuaSelesai: false });
});

// ------------------------------------------------------------
// 2. KUNCI QUERY: siswa 'semua' tidak boleh luput dari bacaan tertarget
// ------------------------------------------------------------
uji('kunci query memuat kode mapel guru PLUS \'semua\', unik, ternormalkan', () => {
  const kunci = kunciQuerySiswaUntukGuru(guru);
  assert.deepEqual([...kunci].sort(), ['IPA', 'MTK', 'semua'].sort());
});

uji('guru tanpa mapel jelas tetap meminta \'semua\' (jangan bocorkan semua siswa tanpa sebab)', () => {
  assert.deepEqual([...kunciQuerySiswaUntukGuru({})], ['semua']);
});

uji('kunci query menormalkan huruf & spasi (field lama bebas_format)', () => {
  const kunci = kunciQuerySiswaUntukGuru({ kodeMapel: ' mtk , MTK ' });
  assert.deepEqual([...kunci].sort(), ['mtk', 'semua'].sort());
});

// ------------------------------------------------------------
// 3. KUNCI COCOK: dokumen laporan lama (huruf campur) tetap tertangkap
// ------------------------------------------------------------
uji('kunci cocok menormalkan HURUF saja; spasi dibiarkan persis perilaku kunci lama', () => {
  assert.equal(kunciPencocokLaporan('s1', 'MTK'), kunciPencocokLaporan('s1', 'mtk'));
  assert.equal(kunciPencocokLaporan('s1', 'MTK'), 's1__mtk');
  assert.notEqual(kunciPencocokLaporan('s1', 'MTK'), kunciPencocokLaporan('s2', 'MTK'));
});

// ------------------------------------------------------------
// 4. POTONG QUERY: 'in' Firestore maks 30 -> chunk aman & utuh
// ------------------------------------------------------------
uji('potongUntukQuery tidak pernah melebihi 30 dan tidak kehilangan anggota', () => {
  const ids = Array.from({ length: 75 }, (_, i) => `id-${i}`);
  const chunk = potongUntukQuery(ids);
  assert.ok(chunk.every((c) => c.length <= 30));
  assert.equal(chunk.flat().length, 75);
  assert.deepEqual(chunk.flat(), ids);
});

console.log(process.exitCode ? '\n❌ tugasLaporanGuru: ADA YANG GAGAL' : '\n✅ tugasLaporanGuru: semua lulus');
process.exit(process.exitCode || 0);
