// tests/koreksiKunciHitungUlang.test.mjs
// ============================================================
// UNIT TEST: Fitur Koreksi Kunci Jawaban oleh Tentor & Recalculate Score
// Memastikan:
// 1. Kunci jawaban baru ter-normalisasi dengan baik sesuai tipe soal.
// 2. Koreksi kunci tersimpan rapi beserta riwayat tentor & catatan.
// 3. Sesi siswa yang tadinya disalahkan sistem dihitung ulang otomatis
//    menjadi benar, akurasi persen naik, dan XP bertambah.
// 4. Soal yang dianulir/diberi bonus menghasilkan skor 1 bagi peserta.
// 5. Mock sinkronisasi Firestore (paket, sesi, dan siswa_progress) bekerja sempurna.
// ============================================================

import assert from 'node:assert/strict';
import {
  normalisasiKunciBaru,
  terapkanKoreksiPadaDaftarSoal,
  hitungUlangSatuSesi,
  eksekusiKoreksiDanHitungUlang,
} from '../src/utils/koreksiKunciTryOut.js';
import { skorSatuSoal, hitungTotalSkor } from '../src/utils/skorSoalTryOut.js';
import { teksKunciSoal } from '../src/utils/teksKunciSoal.js';
import { kunciMingguIni } from '../src/utils/mingguIni.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try {
    fn();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal++;
    console.log(`  ✗ ${nama}\n      ${String(e?.message || e)}`);
  }
}
async function ujiAsync(nama, fn) {
  try {
    await fn();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal++;
    console.log(`  ✗ ${nama}\n      ${String(e?.message || e)}`);
  }
}

console.log('koreksiKunciHitungUlang — Test Koreksi Kunci Tentor & Hitung Ulang');

// --- 1. Normalisasi Kunci Baru ---
console.log('\n1. Normalisasi Kunci Baru');

uji('PG Sederhana: konversi index atau huruf menjadi huruf kapital standar', () => {
  const soalPg = { tipe: 'pg_sederhana', opsiJawaban: ['A', 'B', 'C', 'D'] };
  assert.equal(normalisasiKunciBaru(soalPg, 1), 'B');
  assert.equal(normalisasiKunciBaru(soalPg, 'c'), 'C');
  assert.equal(normalisasiKunciBaru(soalPg, 'd'), 'D');
});

uji('PG Kompleks: deduplikasi dan pengurutan alfabetis', () => {
  const soalPgk = { tipe: 'pg_kompleks' };
  assert.deepEqual(normalisasiKunciBaru(soalPgk, ['b', 'A', 'b']), ['A', 'B']);
  assert.deepEqual(normalisasiKunciBaru(soalPgk, 'c, a, b'), ['A', 'B', 'C']);
});

uji('Benar Salah: normalisasi array status ke lowercase', () => {
  const soalBs = { tipe: 'benar_salah' };
  assert.deepEqual(normalisasiKunciBaru(soalBs, ['BENAR', 'Salah']), ['benar', 'salah']);
});

// --- 2. Terapkan Koreksi pada Soal ---
console.log('\n2. Terapkan Koreksi pada Daftar Soal');

const daftarSoalAwal = [
  {
    id: 's1',
    tipe: 'pg_sederhana',
    soal: 'Hasil dari 2 + 2 adalah...',
    opsiJawaban: ['2', '3', '4', '5'],
    kunciJawaban: 'B', // Kunci salah dari sistem AI impor (seharusnya C / 4)
  },
  {
    id: 's2',
    tipe: 'pg_sederhana',
    soal: 'Ibukota Jawa Barat adalah...',
    opsiJawaban: ['Bandung', 'Semarang', 'Surabaya'],
    kunciJawaban: 'A', // Sudah benar
  },
];

uji('Koreksi kunci butir s1 dari B menjadi C oleh tentor', () => {
  const daftarBaru = terapkanKoreksiPadaDaftarSoal(daftarSoalAwal, 0, {
    kunciBaru: 'C',
    catatan: 'Hasil 2+2 adalah 4 (opsi C), kunci AI sebelumnya keliru di B.',
    infoTentor: { guruNama: 'Tentor Budi', guruId: 'GURU-001' },
  });

  assert.equal(daftarBaru[0].kunciJawaban, 'C');
  assert.equal(daftarBaru[0].dikoreksiTentor, true);
  assert.equal(daftarBaru[0].koreksiTentor.oleh, 'Tentor Budi');
  assert.equal(daftarBaru[0].koreksiTentor.kunciSebelumnya, 'B');
  assert.equal(daftarBaru[0].koreksiTentor.kunciBaru, 'C');
  assert.equal(teksKunciSoal(daftarBaru[0]), 'C');

  // Soal kedua tidak terpengaruh
  assert.equal(daftarBaru[1].kunciJawaban, 'A');
});

uji('Tandai soal sebagai anulir/bonus penuh', () => {
  const daftarBaru = terapkanKoreksiPadaDaftarSoal(daftarSoalAwal, 0, {
    anulirBonus: true,
    catatan: 'Soal cacat, tidak ada opsi jawaban yang memenuhi.',
    infoTentor: { guruNama: 'Tentor Siti', guruId: 'GURU-002' },
  });

  assert.equal(daftarBaru[0].anulirBonus, true);
  assert.equal(skorSatuSoal(daftarBaru[0], 0), 1); // Siswa yang jawab opsi apa pun dapat poin 1
  assert.match(teksKunciSoal(daftarBaru[0]), /BONUS \/ DIANULIR/);
});

// --- 3. Hitung Ulang Satu Sesi ---
console.log('\n3. Hitung Ulang Sesi Siswa');

uji('Siswa yang menjawab C (sebelumnya salah) kini mendapat 100% dan XP naik', () => {
  // Sesi siswa menjawab: s1 -> index 2 (opsi C), s2 -> index 0 (opsi A)
  const sesiSiswa = {
    id: 'sesi-101',
    studentId: 'SISWA-01',
    nama: 'Budi Santoso',
    status: 'selesai',
    jawaban: {
      s1: 2, // Opsi C (benar secara fakta)
      s2: 0, // Opsi A (benar)
    },
    totalSkorPersen: 50, // Sebelumnya 50% karena s1 disalahkan sistem
    xpFinal: 10,
    pelanggaran: [],
  };

  // Sebelum koreksi: skor s1 bernilai 0
  assert.equal(skorSatuSoal(daftarSoalAwal[0], 2), 0);

  // Setelah koreksi ke C:
  const daftarTerkoreksi = terapkanKoreksiPadaDaftarSoal(daftarSoalAwal, 0, {
    kunciBaru: 'C',
    infoTentor: { guruNama: 'Tentor Budi' },
  });

  const hasil = hitungUlangSatuSesi(sesiSiswa, daftarTerkoreksi);
  assert.equal(hasil.totalSkorPersen, 100);
  assert.equal(hasil.totalSkorPersenLama, 50);
  assert.equal(hasil.selisihSkor, 50);
  assert.equal(hasil.xpFinal, 20); // 2 soal * 10 = 20 XP
  assert.equal(hasil.selisihXp, 10); // +10 XP
  assert.equal(hasil.berubah, true);
});

// --- 4. Eksekusi Mock Firestore ---
console.log('\n4. Eksekusi dan Sinkronisasi Mock Firestore');

await ujiAsync('Eksekusi simpan & hitung ulang memperbarui Firestore paket, sesi, dan progress XP', async () => {
  const store = {
    'tryout_paket/pkt-1': { id: 'pkt-1', judul: 'Tryout UTBK 1', daftarSoal: daftarSoalAwal },
    'tryout_sesi/sesi-1': {
      id: 'sesi-1',
      studentId: 'STD-1',
      nama: 'Ahmad',
      status: 'selesai',
      jawaban: { s1: 2, s2: 0 },
      totalSkorPersen: 50,
      xpFinal: 10,
      pelanggaran: [],
    },
    'siswa_progress/STD-1': {
      xp: 150,
      xpMingguIni: 80,
      xpMingguIniKunci: kunciMingguIni(),
    },
  };

  const mockFirestoreOps = {
    doc: (d, col, id) => ({ path: `${col}/${id}` }),
    updateDoc: async (docRef, data) => {
      store[docRef.path] = { ...(store[docRef.path] || {}), ...data };
    },
    getDoc: async (docRef) => ({
      exists: () => !!store[docRef.path],
      data: () => store[docRef.path] || {},
    }),
    serverTimestamp: () => '2026-11-18T10:00:00Z',
  };

  const auditEvents = [];
  const mockAudit = (evt, data) => auditEvents.push({ evt, data });

  const daftarBaru = terapkanKoreksiPadaDaftarSoal(daftarSoalAwal, 0, {
    kunciBaru: 'C',
    catatan: 'Validasi tentor: 2+2=4',
    infoTentor: { guruNama: 'Tentor Budi', guruId: 'GURU-01' },
  });

  const res = await eksekusiKoreksiDanHitungUlang({
    db: {},
    paketId: 'pkt-1',
    paket: store['tryout_paket/pkt-1'],
    daftarSoalBaru: daftarBaru,
    sesiList: [store['tryout_sesi/sesi-1']],
    soalIndex: 0,
    infoTentor: { guruNama: 'Tentor Budi', guruId: 'GURU-01' },
    catatan: 'Validasi tentor: 2+2=4',
    firestoreOps: mockFirestoreOps,
    auditFn: mockAudit,
  });

  assert.equal(res.sukses, true);
  assert.equal(res.jumlahBerubah, 1);

  // Periksa paket terupdate
  assert.equal(store['tryout_paket/pkt-1'].daftarSoal[0].kunciJawaban, 'C');
  assert.equal(store['tryout_paket/pkt-1'].terakhirDikoreksiOleh, 'Tentor Budi');

  // Periksa sesi terupdate
  assert.equal(store['tryout_sesi/sesi-1'].totalSkorPersen, 100);
  assert.equal(store['tryout_sesi/sesi-1'].xpFinal, 20);

  // Periksa progress XP siswa terupdate (+10 XP dari selisih)
  assert.equal(store['siswa_progress/STD-1'].xp, 160);
  assert.equal(store['siswa_progress/STD-1'].xpMingguIni, 90);

  // Periksa audit log tercatat
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].evt, 'tryout.kunci.koreksi');
  assert.equal(auditEvents[0].data.detail.soalNomor, 1);
});

console.log(`\n========================================================`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log(`========================================================`);

if (gagal > 0) process.exit(1);
