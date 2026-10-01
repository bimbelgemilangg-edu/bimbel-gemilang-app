// tests/keuangan.test.mjs
// ============================================================
// Test logika KEUANGAN — modul yang menghitung uang sungguhan.
//
//     node tests/keuangan.test.mjs
//
// KENAPA INI PENTING
// Lima PR terakhir (#88–#92) semuanya mengubah modul keuangan: kanal
// uang, kwitansi bernomor, setor kas & rekonsiliasi, amortisasi paket,
// honor tentor otomatis. Tidak satu pun punya test. Padahal yang
// dihitung adalah uang bimbel yang sebenarnya — saldo brankas, omzet,
// laba, neraca, dan dana titipan siswa.
//
// Yang diuji di sini adalah `keuanganOwnerUtils.js`: 993 baris logika
// murni (tanpa Firestore, tanpa React) yang menjadi satu-satunya sumber
// angka untuk layar owner, PDF, dan Excel. Modul ini bisa diimpor di
// Node apa adanya, jadi tidak perlu framework test.
//
// Setiap test ditulis untuk MENGUJI INVARIAN yang harus selalu benar
// pada uang, bukan sekadar memotret output sekarang. Contoh: "setor kas
// memindahkan uang antar kantong tapi tidak boleh mengubah total" —
// kalau suatu saat totalnya berubah, ada uang yang tercipta atau lenyap.
// ============================================================

import assert from 'node:assert/strict';
import {
  normalisasiLog,
  hitungSaldo,
  hitungSaldoPerTanggal,
  agregatBulanan,
  ringkasKas,
  arusKasTahun,
  rincianAmortisasi,
  alarmDanaKeramat,
  kategoriJadiArray,
  biayaBulananDariSettings,
  hppBulan,
  pendapatanKepakeBulan,
  daftarBulanTahun,
  daftar12BulanTerakhir,
  keyTanggalDariDate,
  keyBulanDariDate,
  isJendelaBayar,
  jumlahHariPadaBulan,
  STATUS_SESI_VALID,
  STATUS_SESI_MENUNGGU,
  namaBulanDariKey,
  tambahHari,
  rpFmt,
  angkaFmt,
  urutTanggalTerbaru,
} from '../src/pages/admin/owner/keuanganOwnerUtils.js';

let lulus = 0;
let gagal = 0;
const kegagalan = [];

function uji(nama, fn) {
  try {
    fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal += 1;
    const pesan = String(e && e.message ? e.message : e);
    kegagalan.push({ nama, pesan });
    console.log(`  ✗ ${nama}`);
    console.log(`      ${pesan.split('\n').join('\n      ').slice(0, 400)}`);
  }
}

function bagian(judul) {
  console.log(`\n${judul}`);
}

// Pembuat log yang sudah ternormalisasi, supaya test ringkas & eksplisit.
const log = (o) => normalisasiLog({ id: o.id || 'x', ...o });

console.log('keuanganOwnerUtils — test logika uang');

// ============================================================
bagian('normalisasiLog');
// ============================================================

uji('type tak dikenal jatuh ke Pengeluaran (bukan undefined)', () => {
  const l = log({ type: 'ngawur', amount: 5000, method: 'Tunai' });
  assert.equal(l.type, 'Pengeluaran');
});

uji('amount berupa string/NaN aman jadi angka', () => {
  assert.equal(log({ type: 'Pemasukan', amount: '150000', method: 'Tunai' }).amount, 150000);
  assert.equal(log({ type: 'Pemasukan', amount: 'abc', method: 'Tunai' }).amount, 0);
  assert.equal(log({ type: 'Pemasukan', method: 'Tunai' }).amount, 0);
});

uji('kanal diturunkan dari method untuk data lama tanpa field kanal', () => {
  assert.equal(log({ type: 'Pemasukan', amount: 1, method: 'Tunai' }).kanal, 'kasAdmin');
  assert.equal(log({ type: 'Pemasukan', amount: 1, method: 'Transfer' }).kanal, 'bankBimbel');
  assert.equal(log({ type: 'Pemasukan', amount: 1, method: 'Cicilan' }).kanal, '');
  assert.equal(log({ type: 'Pemasukan', amount: 1, method: 'Kripto' }).kanal, 'tanpaMetode');
});

uji('kanal eksplisit mengalahkan turunan method', () => {
  const l = log({ type: 'Pemasukan', amount: 1, method: 'Tunai', kanal: 'kasOwner' });
  assert.equal(l.kanal, 'kasOwner');
});

uji('method di luar 3 resmi dinormalkan jadi "Lainnya" tapi methodAsli tetap', () => {
  const l = log({ type: 'Pemasukan', amount: 1, method: 'QRIS' });
  assert.equal(l.method, 'Lainnya');
  assert.equal(l.methodAsli, 'QRIS');
});

uji('menerima doc Firestore, {id,data}, maupun objek polos', () => {
  const polos = { type: 'Pemasukan', amount: 7000, method: 'Tunai' };
  assert.equal(normalisasiLog({ id: 'a', ...polos }).amount, 7000);
  assert.equal(normalisasiLog({ id: 'a', data: polos }).amount, 7000);
  assert.equal(normalisasiLog({ id: 'a', data: () => polos }).amount, 7000);
});

// ============================================================
bagian('hitungSaldo — kanal uang');
// ============================================================

uji('pemasukan tunai masuk kasAdmin, transfer masuk bank', () => {
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai' }),
    log({ type: 'Pemasukan', amount: 50000, method: 'Transfer' }),
  ]);
  assert.equal(s.kasAdmin, 100000);
  assert.equal(s.bank, 50000);
  assert.equal(s.tunai, 100000);
  assert.equal(s.total, 150000);
});

uji('pengeluaran mengurangi kantong yang sesuai', () => {
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai' }),
    log({ type: 'Pengeluaran', amount: 30000, method: 'Tunai' }),
  ]);
  assert.equal(s.kasAdmin, 70000);
  assert.equal(s.total, 70000);
});

uji('tunai = kasAdmin + kasOwner (invarian pecahan brankas)', () => {
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai' }),
    log({ type: 'Pemasukan', amount: 40000, method: 'Tunai', kanal: 'kasOwner' }),
  ]);
  assert.equal(s.kasAdmin, 100000);
  assert.equal(s.kasOwner, 40000);
  assert.equal(s.tunai, s.kasAdmin + s.kasOwner);
});

uji('SETOR KAS memindah uang tanpa mengubah total (invarian terpenting)', () => {
  const sebelum = hitungSaldo([
    log({ type: 'Pemasukan', amount: 500000, method: 'Tunai' }),
  ]);
  const sesudah = hitungSaldo([
    log({ type: 'Pemasukan', amount: 500000, method: 'Tunai' }),
    log({ type: 'Transfer', amount: 200000, kanalDari: 'kasAdmin', kanalKe: 'kasOwner' }),
  ]);
  assert.equal(sebelum.total, 500000);
  assert.equal(sesudah.total, 500000, 'setor kas mengubah total uang — uang tercipta/lenyap');
  assert.equal(sesudah.kasAdmin, 300000);
  assert.equal(sesudah.kasOwner, 200000);
  assert.equal(sesudah.setorKas, 200000);
});

uji('setor kas kasAdmin -> bank juga tidak mengubah total', () => {
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 500000, method: 'Tunai' }),
    log({ type: 'Transfer', amount: 500000, kanalDari: 'kasAdmin', kanalKe: 'bankBimbel' }),
  ]);
  assert.equal(s.total, 500000);
  assert.equal(s.kasAdmin, 0);
  assert.equal(s.bank, 500000);
});

uji('setor kas dengan kanalDari tak dikenal TIDAK boleh menciptakan uang', () => {
  // INI UJI BUG: `hitungSaldo` hanya mengurangi kalau kanalDari adalah
  // kasAdmin/kasOwner/bankBimbel. Nilai lain (mis. 'tanpaMetode' dari data
  // lama) tidak mengurangi apa pun, tapi kanalKe TETAP menambah — sehingga
  // total saldo MEMBESAR dari ketiadaan.
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 100000, method: 'Kripto' }), // -> tanpaMetode
    log({ type: 'Transfer', amount: 50000, kanalDari: 'tanpaMetode', kanalKe: 'kasOwner' }),
  ]);
  assert.equal(s.total, 100000,
    `total jadi ${s.total} — setor kas menciptakan Rp ${s.total - 100000} dari ketiadaan`);
});

uji('setor kas dengan kanalDari/kanalKe kosong memakai default yang aman', () => {
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 300000, method: 'Tunai' }),
    log({ type: 'Transfer', amount: 100000 }), // tanpa kanalDari/kanalKe
  ]);
  assert.equal(s.total, 300000);
  assert.equal(s.kasAdmin, 200000);
  assert.equal(s.kasOwner, 100000);
});

uji('CICILAN bukan uang kas: tidak masuk saldo, cuma komitmen', () => {
  const s = hitungSaldo([
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai' }),
    log({ type: 'Pemasukan', amount: 750000, method: 'Cicilan' }),
  ]);
  assert.equal(s.total, 100000, 'cicilan ikut dihitung sebagai kas');
  assert.equal(s.komitmenCicilan, 750000);
});

uji('data lama tanpa method masuk "tanpaMetode" dan tetap dihitung ke total', () => {
  const s = hitungSaldo([log({ type: 'Pemasukan', amount: 25000, method: '' })]);
  assert.equal(s.tanpaMetode, 25000);
  assert.equal(s.total, 25000);
});

uji('daftar kosong menghasilkan semua nol, bukan NaN', () => {
  const s = hitungSaldo([]);
  for (const k of ['tunai', 'kasAdmin', 'kasOwner', 'bank', 'tanpaMetode', 'komitmenCicilan', 'setorKas', 'total']) {
    assert.equal(s[k], 0, `${k} bukan 0`);
  }
});

// ============================================================
bagian('hitungSaldoPerTanggal');
// ============================================================

uji('hanya menghitung transaksi sampai tanggal acuan', () => {
  const logs = [
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai', date: '2026-01-15' }),
    log({ type: 'Pemasukan', amount: 200000, method: 'Tunai', date: '2026-06-15' }),
  ];
  assert.equal(hitungSaldoPerTanggal(logs, '2026-03-01').total, 100000);
  assert.equal(hitungSaldoPerTanggal(logs, '2026-12-31').total, 300000);
  assert.equal(hitungSaldoPerTanggal(logs, '2025-12-31').total, 0);
});

uji('log tanpa tanggal selalu ikut (data lama)', () => {
  const logs = [log({ type: 'Pemasukan', amount: 50000, method: 'Tunai', date: '' })];
  assert.equal(hitungSaldoPerTanggal(logs, '2020-01-01').total, 50000);
});

uji('tanggal acuan kosong TIDAK boleh mengosongkan saldo tanpa peringatan', () => {
  // INI UJI KERAPUHAN: `l.date <= undefined` selalu false, jadi SEMUA log
  // bertanggal tersaring keluar dan saldo jadi 0 — angka yang tampak sah
  // padahal salah total. Kalau ini terjadi di produksi, neraca owner
  // menampilkan Rp 0 tanpa error apa pun.
  const logs = [log({ type: 'Pemasukan', amount: 900000, method: 'Tunai', date: '2026-05-05' })];
  const s = hitungSaldoPerTanggal(logs, undefined);
  assert.equal(s.total, 900000,
    'tanggalAcuan undefined membuat saldo jadi 0 — pemanggil lupa mengisi dan tidak ada satu pun error yang muncul');
});

// ============================================================
bagian('ringkasKas & agregatBulanan');
// ============================================================

uji('ringkasKas memisahkan setor kas dari omzet & belanja', () => {
  const r = ringkasKas([
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai', date: '2026-03-01' }),
    log({ type: 'Pengeluaran', amount: 20000, method: 'Tunai', date: '2026-03-02' }),
    log({ type: 'Transfer', amount: 50000, date: '2026-03-03', kanalDari: 'kasAdmin', kanalKe: 'kasOwner' }),
  ], ['2026-03']);
  assert.equal(r.masuk, 100000);
  assert.equal(r.keluar, 20000);
  assert.equal(r.netto, 80000);
  assert.equal(r.setorKas, 50000);
  assert.equal(r.jumlah, 3);
});

uji('filter bulan benar-benar menyaring', () => {
  const logs = [
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai', date: '2026-03-01' }),
    log({ type: 'Pemasukan', amount: 999999, method: 'Tunai', date: '2026-04-01' }),
  ];
  assert.equal(ringkasKas(logs, ['2026-03']).masuk, 100000);
  assert.equal(ringkasKas(logs, null).masuk, 1099999);
});

uji('cicilan masuk `komitmen`, bukan `masuk`', () => {
  const r = ringkasKas([
    log({ type: 'Pemasukan', amount: 750000, method: 'Cicilan', date: '2026-03-01' }),
  ], ['2026-03']);
  assert.equal(r.masuk, 0);
  assert.equal(r.komitmen, 750000);
});

uji('KONSISTENSI: netto ringkasKas === perubahan total hitungSaldo', () => {
  // Invarian silang antar fungsi. Kalau dua angka ini berbeda, laporan
  // owner akan menampilkan omzet yang tidak cocok dengan pergerakan saldo.
  const logs = [
    log({ type: 'Pemasukan', amount: 500000, method: 'Tunai', date: '2026-03-01' }),
    log({ type: 'Pemasukan', amount: 250000, method: 'Transfer', date: '2026-03-05' }),
    log({ type: 'Pengeluaran', amount: 75000, method: 'Tunai', date: '2026-03-10' }),
    log({ type: 'Pemasukan', amount: 1000000, method: 'Cicilan', date: '2026-03-11' }),
    log({ type: 'Transfer', amount: 100000, date: '2026-03-20', kanalDari: 'kasAdmin', kanalKe: 'kasOwner' }),
  ];
  const r = ringkasKas(logs, ['2026-03']);
  const s = hitungSaldo(logs);
  assert.equal(r.netto, s.total,
    `netto laporan ${r.netto} != total saldo ${s.total}`);
});

uji('agregatBulanan mengelompokkan per bulan', () => {
  const a = agregatBulanan([
    log({ type: 'Pemasukan', amount: 100, method: 'Tunai', date: '2026-01-05' }),
    log({ type: 'Pemasukan', amount: 200, method: 'Tunai', date: '2026-01-20' }),
    log({ type: 'Pemasukan', amount: 300, method: 'Tunai', date: '2026-02-01' }),
  ]);
  assert.equal(a.get('2026-01').masuk, 300);
  assert.equal(a.get('2026-01').jumlah, 2);
  assert.equal(a.get('2026-02').masuk, 300);
});

uji('agregatBulanan menaruh log tanpa tanggal di ember terpisah', () => {
  const a = agregatBulanan([log({ type: 'Pemasukan', amount: 50, method: 'Tunai', date: '' })]);
  assert.ok(a.has('tanpa-tanggal'));
  assert.equal(a.get('tanpa-tanggal').masuk, 50);
});

uji('KONSISTENSI: agregatBulanan & ringkasKas sepakat untuk bulan yang sama', () => {
  const logs = [
    log({ type: 'Pemasukan', amount: 400000, method: 'Tunai', date: '2026-07-01' }),
    log({ type: 'Pengeluaran', amount: 40000, method: 'Transfer', date: '2026-07-02' }),
    log({ type: 'Pemasukan', amount: 900000, method: 'Cicilan', date: '2026-07-03' }),
  ];
  const agg = agregatBulanan(logs).get('2026-07');
  const r = ringkasKas(logs, ['2026-07']);
  assert.equal(agg.masuk, r.masuk, `masuk beda: agregat ${agg.masuk} vs ringkas ${r.masuk}`);
  assert.equal(agg.keluar, r.keluar, `keluar beda: agregat ${agg.keluar} vs ringkas ${r.keluar}`);
  assert.equal(agg.komitmen, r.komitmen, `komitmen beda: agregat ${agg.komitmen} vs ringkas ${r.komitmen}`);
});

// ============================================================
bagian('arusKasTahun');
// ============================================================

uji('saldoAwal + netto tahun === saldoAkhir', () => {
  const logs = [
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai', date: '2025-11-01' }),
    log({ type: 'Pemasukan', amount: 200000, method: 'Tunai', date: '2026-02-01' }),
    log({ type: 'Pengeluaran', amount: 50000, method: 'Tunai', date: '2026-08-01' }),
  ];
  const a = arusKasTahun(logs, 2026);
  assert.equal(a.saldoAwal, 100000);
  assert.equal(a.totalMasuk, 200000);
  assert.equal(a.totalKeluar, 50000);
  assert.equal(a.netto, 150000);
  assert.equal(a.saldoAkhir, 250000);
  assert.equal(a.saldoAwal + a.netto, a.saldoAkhir, 'invarian arus kas rusak');
  assert.equal(a.perBulan.length, 12);
});

uji('saldoAkhir arusKasTahun === total hitungSaldo sampai akhir tahun', () => {
  const logs = [
    log({ type: 'Pemasukan', amount: 300000, method: 'Tunai', date: '2026-01-10' }),
    log({ type: 'Pengeluaran', amount: 120000, method: 'Tunai', date: '2026-06-10' }),
    log({ type: 'Transfer', amount: 80000, date: '2026-07-10', kanalDari: 'kasAdmin', kanalKe: 'bankBimbel' }),
  ];
  const a = arusKasTahun(logs, 2026);
  const s = hitungSaldo(logs);
  assert.equal(a.saldoAkhir, s.total,
    `arus kas bilang ${a.saldoAkhir}, hitungSaldo bilang ${s.total}`);
});

uji('saldo berjalan per bulan monoton sesuai transaksi', () => {
  const logs = [
    log({ type: 'Pemasukan', amount: 100000, method: 'Tunai', date: '2026-03-01' }),
    log({ type: 'Pengeluaran', amount: 40000, method: 'Tunai', date: '2026-05-01' }),
  ];
  const p = arusKasTahun(logs, 2026).perBulan;
  assert.equal(p[1].saldoAkhirBulan, 0);      // Februari: belum ada apa-apa
  assert.equal(p[2].saldoAkhirBulan, 100000); // Maret
  assert.equal(p[3].saldoAkhirBulan, 100000); // April: tidak berubah
  assert.equal(p[4].saldoAkhirBulan, 60000);  // Mei
});

// ============================================================
bagian('rincianAmortisasi (dana titipan / deferred revenue)');
// ============================================================

uji('paket 3 bulan: hak per bulan = total / 3', () => {
  const r = rincianAmortisasi(900000, 3, keyTanggalDariDate(new Date()));
  assert.equal(r.total, 900000);
  assert.equal(r.durasi, 3);
  assert.equal(r.hakPerBulan, 300000);
  assert.equal(r.bulanTerpakai, 1, 'bulan berjalan harus sudah jadi hak');
});

uji('bulanTerpakai tidak pernah melebihi durasi', () => {
  const dulu = tambahHari(keyTanggalDariDate(new Date()), -400);
  const r = rincianAmortisasi(1200000, 12, dulu);
  assert.equal(r.bulanTerpakai, 12);
  assert.equal(r.sudahJadiHak, 1200000);
  assert.equal(r.masihTitipan, 0);
});

uji('sudahJadiHak tidak pernah melebihi total (invarian)', () => {
  for (const total of [500000, 999999, 1000001, 2500000]) {
    for (const durasi of [1, 2, 3, 4, 6, 7, 12]) {
      const r = rincianAmortisasi(total, durasi, '2020-01-01');
      assert.ok(r.sudahJadiHak <= r.total,
        `sudahJadiHak ${r.sudahJadiHak} > total ${r.total} (durasi ${durasi})`);
      assert.ok(r.masihTitipan >= 0, 'masihTitipan negatif');
      assert.equal(r.sudahJadiHak + r.masihTitipan, r.total,
        `hak + titipan != total (durasi ${durasi})`);
    }
  }
});

uji('di AKHIR masa paket, dana titipan harus HABIS (bukan bersisa receh)', () => {
  // INI UJI BUG: hakPerBulan dibulatkan, jadi total/durasi yang tidak habis
  // dibagi menyisakan receh yang tidak pernah diakui sebagai hak.
  // Contoh nyata: Rp 1.000.000 / 3 = 333.333,33 -> 333.333 x 3 = 999.999.
  const r = rincianAmortisasi(1000000, 3, '2020-01-01'); // sudah lewat jauh
  assert.equal(r.bulanTerpakai, 3);
  assert.equal(r.masihTitipan, 0,
    `paket sudah selesai tapi masih ada dana titipan Rp ${r.masihTitipan} yang menggantung selamanya`);
  assert.equal(r.sudahJadiHak, 1000000);
});

uji('paket yang BELUM mulai tidak boleh mengakui hak bulan ini', () => {
  // INI UJI BUG: bulanTerpakai di-clamp ke minimal 1, jadi paket dengan
  // tanggalMulai di masa depan langsung mengakui satu bulan omzet padahal
  // jasanya belum diberikan sama sekali.
  const besok = tambahHari(keyTanggalDariDate(new Date()), 45);
  const r = rincianAmortisasi(600000, 6, besok);
  assert.equal(r.sudahJadiHak, 0,
    `paket mulai ${besok} tapi sudah mengakui hak Rp ${r.sudahJadiHak}`);
  assert.equal(r.masihTitipan, 600000);
});

uji('durasi 0 / tidak valid tidak menghasilkan Infinity atau NaN', () => {
  for (const d of [0, -1, null, undefined, 'abc']) {
    const r = rincianAmortisasi(600000, d, keyTanggalDariDate(new Date()));
    assert.ok(Number.isFinite(r.hakPerBulan), `hakPerBulan tidak hingga untuk durasi ${d}`);
    assert.ok(r.hakPerBulan > 0, `hakPerBulan harus positif untuk durasi ${d}`);
  }
});

uji('total 0 menghasilkan semua nol', () => {
  const r = rincianAmortisasi(0, 3, keyTanggalDariDate(new Date()));
  assert.equal(r.hakPerBulan, 0);
  assert.equal(r.sudahJadiHak, 0);
  assert.equal(r.masihTitipan, 0);
});

// ============================================================
bagian('alarmDanaKeramat');
// ============================================================

uji('aman saat kas >= titipan', () => {
  const a = alarmDanaKeramat({ total: 5000000 }, { totalKewajiban: 3000000 });
  assert.equal(a.aman, true);
  assert.equal(a.selisih, 2000000);
  assert.equal(a.kurang, 0);
});

uji('berbahaya saat kas < titipan, dan `kurang` = besarnya kekurangan', () => {
  const a = alarmDanaKeramat({ total: 1000000 }, { totalKewajiban: 3500000 });
  assert.equal(a.aman, false);
  assert.equal(a.kurang, 2500000);
  assert.equal(a.selisih, -2500000);
});

uji('impas dianggap aman', () => {
  assert.equal(alarmDanaKeramat({ total: 500 }, { totalKewajiban: 500 }).aman, true);
});

uji('input kosong tidak menghasilkan NaN', () => {
  const a = alarmDanaKeramat(null, null);
  assert.equal(a.titipan, 0);
  assert.equal(a.kasTersedia, 0);
  assert.equal(a.aman, true);
});

// ============================================================
bagian('biaya, HPP, pendapatan akrual');
// ============================================================

uji('biayaBulananDariSettings menjumlah biaya tetap + penyusutan', () => {
  const b = biayaBulananDariSettings({
    fixedCosts: [
      { amountPerMonth: 2000000 },
      { amountPerMonth: '500000' },
      { amountPerMonth: 'abc' },
    ],
    assets: [
      { purchasePrice: 12000000, usefulLifeMonths: 24 }, // 500.000/bln
      { purchasePrice: 5000000, usefulLifeMonths: 0 },   // dihindari bagi-0
      { purchasePrice: 3000000, usefulLifeMonths: 12 },  // 250.000/bln
    ],
  });
  assert.equal(b.totalFixed, 2500000);
  assert.equal(b.totalPenyusutan, 750000);
});

uji('penyusutan tidak pernah membagi nol', () => {
  const b = biayaBulananDariSettings({ assets: [{ purchasePrice: 999999, usefulLifeMonths: 0 }] });
  assert.equal(b.totalPenyusutan, 0);
  assert.ok(Number.isFinite(b.totalPenyusutan));
});

uji('hppBulan hanya menjumlah bulan yang cocok', () => {
  const t = [
    { tanggal: '2026-03-01', nominal: 100000 },
    { tanggal: '2026-03-28', nominal: 150000 },
    { tanggal: '2026-04-02', nominal: 999999 },
    { tanggal: '', nominal: 50 },
  ];
  assert.equal(hppBulan(t, '2026-03'), 250000);
  assert.equal(hppBulan(t, '2026-04'), 999999);
  assert.equal(hppBulan(t, '2026-05'), 0);
});

uji('pendapatanKepakeBulan hanya menghitung siswa yang paketnya meliputi bulan itu', () => {
  const students = [
    { tanggalMulai: '2026-01-01', tanggalSelesai: '2026-06-30', paketHargaBulanan: 300000 },
    { tanggalMulai: '2026-03-01', tanggalSelesai: '2026-03-31', paketHargaBulanan: 200000 },
    { tanggalMulai: '', tanggalSelesai: '2026-12-31', paketHargaBulanan: 100000 }, // diabaikan
  ];
  assert.equal(pendapatanKepakeBulan(students, '2026-03').total, 500000);
  assert.equal(pendapatanKepakeBulan(students, '2026-03').jumlah, 2);
  assert.equal(pendapatanKepakeBulan(students, '2026-05').total, 300000);
  assert.equal(pendapatanKepakeBulan(students, '2026-09').total, 0);
});

uji('siswa tanpa harga paket diabaikan, bukan dihitung nol-berarti-aktif', () => {
  const s = [{ tanggalMulai: '2026-01-01', tanggalSelesai: '2026-12-31', paketHargaBulanan: 0 }];
  assert.equal(pendapatanKepakeBulan(s, '2026-06').jumlah, 0);
});

// ============================================================
bagian('utilitas tanggal & format');
// ============================================================

uji('keyTanggalDariDate memakai waktu LOKAL, bukan UTC', () => {
  // Dibuat lewat konstruktor lokal (bukan string ISO) supaya tidak
  // bergantung pada zona waktu mesin yang menjalankan test.
  const d = new Date(2026, 0, 1, 12, 0, 0);
  assert.equal(keyTanggalDariDate(d), '2026-01-01');
  assert.equal(keyBulanDariDate(d), '2026-01');
});

uji('tambahHari melintasi batas bulan & tahun', () => {
  assert.equal(tambahHari('2026-01-31', 1), '2026-02-01');
  assert.equal(tambahHari('2026-12-31', 1), '2027-01-01');
  assert.equal(tambahHari('2026-03-01', -1), '2026-02-28');
  assert.equal(tambahHari('2024-03-01', -1), '2024-02-29'); // tahun kabisat
});

uji('daftarBulanTahun berhenti di bulan berjalan untuk tahun ini', () => {
  const semua = daftarBulanTahun(2026, null);
  assert.equal(semua.length, 12);
  assert.equal(semua[0], '2026-01');
  const dibatasi = daftarBulanTahun(2026, '2026-03');
  assert.deepEqual(dibatasi, ['2026-01', '2026-02', '2026-03']);
});

uji('daftar12BulanTerakhir berisi 12 bulan berurutan dan berakhir di bulan acuan', () => {
  const k = daftar12BulanTerakhir('2026-03');
  assert.equal(k.length, 12);
  assert.equal(k[11], '2026-03');
  assert.equal(k[0], '2025-04');
});

uji('namaBulanDariKey menolak key rusak tanpa crash', () => {
  assert.equal(namaBulanDariKey('2026-01'), 'Januari 2026');
  assert.equal(namaBulanDariKey('2026-13'), '2026-13');
  assert.equal(namaBulanDariKey(''), '-');
  assert.equal(namaBulanDariKey(null), '-');
});

uji('rpFmt & angkaFmt membulatkan dan menangani null', () => {
  assert.equal(rpFmt(null), 'Rp 0');
  assert.equal(rpFmt(1500.6), 'Rp 1.501');
  assert.equal(angkaFmt(undefined), '0');
});

uji('kategoriJadiArray mengurutkan dari terbesar', () => {
  const a = kategoriJadiArray({ SPP: 100, Pendaftaran: 900, Lain: 500 });
  assert.deepEqual(a.map(x => x.nama), ['Pendaftaran', 'Lain', 'SPP']);
  assert.deepEqual(kategoriJadiArray(null), []);
});

uji('urutTanggalTerbaru: tanggal baru dulu, seri dipecah createdAtMs', () => {
  const a = log({ type: 'Pemasukan', amount: 1, method: 'Tunai', date: '2026-01-01' });
  const b = log({ type: 'Pemasukan', amount: 1, method: 'Tunai', date: '2026-06-01' });
  assert.deepEqual([a, b].sort(urutTanggalTerbaru)[0].date, '2026-06-01');
});

// ============================================================
bagian('jendela bayar honor (menu owner akhir bulan)');
// ============================================================

uji('jumlah hari per bulan benar, termasuk kabisat', () => {
  assert.equal(jumlahHariPadaBulan(2026, 2), 28);
  assert.equal(jumlahHariPadaBulan(2024, 2), 29);
  assert.equal(jumlahHariPadaBulan(2026, 12), 31);
  assert.equal(jumlahHariPadaBulan(2026, 4), 30);
});

uji('jendela bayar = 7 hari terakhir bulan (termasuk tanggal akhir)', () => {
  // Februari 2026: 28 hari -> jendela mulai 22 (28-6)
  assert.equal(isJendelaBayar('2026-02-21'), false);
  assert.equal(isJendelaBayar('2026-02-22'), true);
  assert.equal(isJendelaBayar('2026-02-28'), true);
  // Desember: 31 hari -> jendela mulai 25
  assert.equal(isJendelaBayar('2026-12-24'), false);
  assert.equal(isJendelaBayar('2026-12-25'), true);
  assert.equal(isJendelaBayar('2026-12-31'), true);
  // Awal bulan jelas di luar jendela
  assert.equal(isJendelaBayar('2026-03-01'), false);
});

uji('input rusak tidak melempar dan tidak mengaku jendela', () => {
  for (const v of [null, undefined, '', 'abc', '2026-13-01', '2026-02-30']) {
    assert.equal(isJendelaBayar(v), false, `input ${JSON.stringify(v)} harus false`);
  }
});

uji('konstanta status sesi konsisten antara halaman admin & panel owner', () => {
  // Kedua sisi harus memakai string yang PERSIS sama, kalau tidak sesi yang
  // divalidasi admin tidak akan pernah terbaca "siap dibayar" oleh owner.
  assert.equal(STATUS_SESI_VALID, 'Valid / Sudah Terekap');
  assert.equal(STATUS_SESI_MENUNGGU, 'Menunggu Validasi');
});

// ============================================================
// RINGKASAN
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log('='.repeat(60));

if (gagal > 0) {
  console.log('\nRingkasan kegagalan:');
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}\n     ${k.pesan.split('\n')[0]}`));
  console.error('\n❌ ADA TEST YANG GAGAL.');
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
