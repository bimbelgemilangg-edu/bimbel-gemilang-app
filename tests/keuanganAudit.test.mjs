// tests/keuanganAudit.test.mjs — regresi mesin audit owner (18 Okt 2026):
// transfer antar-kantong bukan masuk/keluar; prive/gaji terpisah;
// saldo per kantong; CSV aman untuk Excel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ringkasanAudit, trenBulanan, keCsvAudit, barisAudit, KATEGORI_PRIVE, KATEGORI_GAJI,
  statusPlafon, bolehCatatAdmin, saldoKasAdmin,
} from '../src/utils/keuanganAudit.js';

const LOGS = [
  { date: '2026-10-02', type: 'Pemasukan', category: 'SPP', amount: 500000, kanal: 'kasAdmin', dicatatOleh: 'admin' },
  { date: '2026-10-05', type: 'Pengeluaran', category: 'ATK', amount: 100000, kanal: 'kasAdmin', dicatatOleh: 'admin' },
  { date: '2026-10-10', type: 'Pengeluaran', category: KATEGORI_PRIVE, amount: 2000000, kanal: 'bankBimbel', dicatatOleh: 'owner', memoOwner: '2jt orang tua' },
  { date: '2026-10-12', type: 'Pengeluaran', category: KATEGORI_GAJI, amount: 1000000, kanal: 'bankBimbel', dicatatOleh: 'owner' },
  { date: '2026-10-31', type: 'Transfer', category: 'Serah tunai akhir bulan ke owner', amount: 400000, kanal: 'kasAdmin', kanalDari: 'kasAdmin', kanalKe: 'kasOwner', dicatatOleh: 'admin' },
];

test('ringkasanAudit: transfer bukan masuk/keluar; prive & gaji terpisah', () => {
  const r = ringkasanAudit(LOGS);
  assert.equal(r.masuk, 500000);
  assert.equal(r.keluar, 3100000, 'prive+gaji+ATK dihitung keluar');
  assert.equal(r.transfer, 400000);
  assert.equal(r.prive, 2000000);
  assert.equal(r.gaji, 1000000);
  assert.equal(r.perKantong.kasAdmin.saldo, 0, 'kas admin reset setelah serah: 500-100-400');
  assert.equal(r.perKantong.kasOwner.saldo, 400000);
  assert.equal(r.perKantong.bankBimbel.saldo, -3000000);
});

test('trenBulanan: bucket per bulan YYYY-MM', () => {
  const t = trenBulanan(LOGS);
  assert.equal(t.length, 1);
  assert.equal(t[0].bulan, '2026-10');
  assert.equal(t[0].masuk, 500000);
});

test('keCsvAudit: kutip & sembunyikan tidak berlaku (memo ikut, area owner)', () => {
  const csv = keCsvAudit(LOGS);
  assert.match(csv, /^\uFEFF"Tanggal"/);
  assert.match(csv, /"2jt orang tua"/);
  assert.ok(!csv.includes('undefined'));
});

test('barisAudit: fallback dicatatOleh admin & kantong default', () => {
  const b = barisAudit({ date: '2026-01-01', type: 'Pemasukan', amount: 1 });
  assert.equal(b.dicatatOleh, 'admin');
  assert.equal(b.kantong, 'tanpaMetode');
});

test('statusPlafon & bolehCatatAdmin & saldoKasAdmin (kebijakan 18 Okt)', () => {
  assert.deepEqual(statusPlafon(1500000, 2000000), { melebihi: false, wajibSerah: 0, saldo: 1500000, plafon: 2000000 });
  const st = statusPlafon(5000000, 2000000);
  assert.equal(st.melebihi, true);
  assert.equal(st.wajibSerah, 3000000);
  assert.equal(bolehCatatAdmin('Pengeluaran', 'Transfer').boleh, false, 'pengeluaran BCA hak owner');
  assert.equal(bolehCatatAdmin('Pengeluaran', 'Tunai').boleh, true);
  assert.equal(bolehCatatAdmin('Pemasukan', 'Transfer').boleh, true, 'pemasukan transfer admin boleh (rekonsiliasi pending)');
  assert.equal(saldoKasAdmin({ saldoAwal: 2000000, tunaiMasuk: 5000000, tunaiKeluar: 1000000, setorKas: 4000000, transferMasukKas: 0 }), 2000000);
});
