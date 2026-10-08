// tests/rakitTryOutTentor.test.mjs
// ============================================================
// Uji Fase 2: tentor merakit try out -> admin menyetujui.
// (src/utils/rakitTryOutTentor.js + src/utils/statusTryOutPaket.js)
//
//     node tests/rakitTryOutTentor.test.mjs
//
// KEPUTUSAN OWNER: tentor boleh membuat try out TETAPI perlu approval.
// Uji di bawah memaku hal-hal yang kalau meleset akan berdampak ke siswa:
//
//   1. draf tidak pernah terlihat sebagai paket terbit,
//   2. paket WARISAN tanpa field status tidak ikut hilang dari daftar
//      (regresi yang akan terasa seperti "paketnya hilang"),
//   3. tentor TIDAK BISA menerbitkan paketnya sendiri melewati admin,
//   4. jadwal terbit adalah keputusan admin, bukan efek samping usulan,
//   5. tipe yang tak bisa dirender renderer try out DITOLAK di sini
//      (berbeda dari keranjang cetak yang hanya membenderainya).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_BUTIR, MIN_PANJANG_ALASAN_TOLAK, GRANULARITAS,
  kelompokkanJadiSubtes, putusanKirimDraf, bangunPayloadDraf,
  putusanApprove, putusanTolak, ringkasDraf,
} from '../src/utils/rakitTryOutTentor.js';
import {
  STATUS_PAKET, bolehTampilUmum, saringPaketTerbit, labelStatus,
  transisiStatus, perluAntreanApproval,
} from '../src/utils/statusTryOutPaket.js';

const butir = (id, tambahan = {}) => ({
  id,
  tipe: 'pg_sederhana',
  soal: `Butir nomor ${id} tentang materi ini dan itu.`,
  opsiJawaban: ['a', 'b', 'c', 'd'],
  kunciJawaban: 'B',
  mataPelajaran: 'Matematika',
  jenjang: 'SMA/MA',
  materi: 'Lingkaran',
  tingkatKelas: '11',
  status: 'aktif',
  ...tambahan,
});

const paketButir = (n, tambahan = {}) => Array.from({ length: n }, (_, i) => butir(`s${i + 1}`, tambahan));
const GURU = { id: 'guru-001', nama: 'Pak Andi' };

// ------------------------------------------------------------
// 1. Status & kebocoran draf
// ------------------------------------------------------------

test('draf/usulan/ditolak TIDAK boleh tampil di daftar umum', () => {
  assert.equal(bolehTampilUmum(STATUS_PAKET.DRAF), false);
  assert.equal(bolehTampilUmum(STATUS_PAKET.MENUNGGU), false);
  assert.equal(bolehTampilUmum(STATUS_PAKET.DITOLAK), false);
  assert.equal(bolehTampilUmum(STATUS_PAKET.NONAKTIF), false);
  assert.equal(bolehTampilUmum(STATUS_PAKET.AKTIF), true);
});

test('INVARIAN: paket WARISAN tanpa field status tetap tampil (bukan hilang)', () => {
  // Menyaring dengan `status === 'aktif'` di sisi klien akan menghapus paket
  // lama yang tidak punya field status dari Perpustakaan & dasbor guru.
  assert.equal(bolehTampilUmum(undefined), true);
  assert.equal(bolehTampilUmum(''), true);
  assert.equal(bolehTampilUmum(null), true);
});

test('saringPaketTerbit membuang draf tapi memelihara warisan', () => {
  const hasil = saringPaketTerbit([
    { id: 'a' },                                    // warisan tanpa status
    { id: 'b', status: 'aktif' },
    { id: 'c', status: 'menunggu_approval' },
    { id: 'd', status: 'draf' },
    { id: 'e', status: 'ditolak' },
  ]);
  assert.deepEqual(hasil.map((p) => p.id), ['a', 'b']);
  assert.deepEqual(saringPaketTerbit(null), []);
});

test('label status manusiawi, termasuk untuk data lama', () => {
  assert.equal(labelStatus('menunggu_approval'), 'Menunggu persetujuan admin');
  assert.equal(labelStatus('aktif'), 'Terbit');
  assert.match(labelStatus(''), /data lama/);
});

test('antrean approval hanya menampung status menunggu', () => {
  assert.equal(perluAntreanApproval('menunggu_approval'), true);
  assert.equal(perluAntreanApproval('aktif'), false);
  assert.equal(perluAntreanApproval(undefined), false);
});

// ------------------------------------------------------------
// 2. Mesin transisi: siapa boleh apa
// ------------------------------------------------------------

test('INVARIAN: tentor TIDAK BISA menerbitkan paketnya sendiri', () => {
  const t = transisiStatus('menunggu_approval', 'aktif', 'tentor');
  assert.equal(t.boleh, false);
  assert.match(t.alasan, /Hanya admin atau owner/);
});

test('admin boleh menyetujui dan menolak', () => {
  assert.equal(transisiStatus('menunggu_approval', 'aktif', 'admin').boleh, true);
  assert.equal(transisiStatus('menunggu_approval', 'ditolak', 'admin').boleh, true);
  assert.equal(transisiStatus('menunggu_approval', 'ditolak', 'tentor').boleh, false);
});

test('tentor boleh mengirim usulan dan menariknya kembali jadi draf', () => {
  assert.equal(transisiStatus('draf', 'menunggu_approval', 'tentor').boleh, true);
  assert.equal(transisiStatus('menunggu_approval', 'draf', 'tentor').boleh, true);
  assert.equal(transisiStatus('ditolak', 'menunggu_approval', 'tentor').boleh, true, 'boleh diperbaiki & dikirim ulang');
});

test('lompatan status yang tidak masuk akal ditolak', () => {
  assert.equal(transisiStatus('draf', 'aktif', 'admin').boleh, false, 'draf harus diusulkan dulu');
  assert.equal(transisiStatus('aktif', 'ditolak', 'admin').boleh, false, 'paket terbit tidak bisa "ditolak"');
  assert.equal(transisiStatus('nonaktif', 'menunggu_approval', 'admin').boleh, false);
});

test('transisi ke status yang sama selalu diizinkan (idempoten)', () => {
  assert.equal(transisiStatus('aktif', 'aktif', 'tentor').boleh, true);
});

// ------------------------------------------------------------
// 3. Pengelompokan subtes
// ------------------------------------------------------------

test('pengelompokan per mapel mempertahankan urutan pilihan tentor', () => {
  const soal = [
    butir('1', { mataPelajaran: 'Matematika' }),
    butir('2', { mataPelajaran: 'Kimia' }),
    butir('3', { mataPelajaran: 'Matematika' }),
  ];
  const subtes = kelompokkanJadiSubtes(soal, GRANULARITAS.MAPEL);
  assert.deepEqual(subtes.map((s) => s.nama), ['Matematika', 'Kimia'], 'Matematika tetap pertama karena dipilih lebih dulu');
  assert.deepEqual(subtes[0].soalIds, ['1', '3']);
  assert.equal(subtes[0].jumlah, 2);
});

test('pengelompokan per materi memisahkan bab walau mapelnya sama', () => {
  const soal = [butir('1', { materi: 'Lingkaran' }), butir('2', { materi: 'Turunan' })];
  const subtes = kelompokkanJadiSubtes(soal, GRANULARITAS.MATERI);
  assert.equal(subtes.length, 2);
  assert.match(subtes[0].nama, /Matematika — Lingkaran/);
});

test('granularitas "satu" menghasilkan satu subtes utuh', () => {
  const subtes = kelompokkanJadiSubtes(paketButir(6), GRANULARITAS.SATU);
  assert.equal(subtes.length, 1);
  assert.equal(subtes[0].jumlah, 6);
});

test('butir tanpa materi dikelompokkan ke mapelnya, bukan ke "(tanpa materi)"', () => {
  const subtes = kelompokkanJadiSubtes([butir('1', { materi: '', bab: '', topik: '' })], GRANULARITAS.MATERI);
  assert.equal(subtes[0].nama, 'Matematika');
});

test('input kosong/janggal tidak melempar', () => {
  assert.deepEqual(kelompokkanJadiSubtes([]), []);
  assert.deepEqual(kelompokkanJadiSubtes(null), []);
  assert.deepEqual(kelompokkanJadiSubtes(undefined, 'aneh'), []);
});

// ------------------------------------------------------------
// 4. Pagar sebelum kirim ke admin
// ------------------------------------------------------------

test('draf sehat boleh dikirim', () => {
  const p = putusanKirimDraf({ judul: 'Try Out TKA Matematika SMA', daftarSoal: paketButir(10), durasiTotalMenit: 60, targetKelas: 'SMA/MA', targetKategori: 'Matematika' });
  assert.equal(p.boleh, true);
  assert.deepEqual(p.alasan, []);
  assert.equal(p.ringkasan.jumlahButir, 10);
  assert.equal(p.ringkasan.jumlahSubtes, 1);
});

test('judul wajib dan tidak boleh asal', () => {
  assert.equal(putusanKirimDraf({ judul: '', daftarSoal: paketButir(10) }).boleh, false);
  assert.equal(putusanKirimDraf({ judul: 'TO', daftarSoal: paketButir(10) }).boleh, false);
});

test(`kurang dari ${MIN_BUTIR} butir ditolak dengan jalan keluar`, () => {
  const p = putusanKirimDraf({ judul: 'Try Out Pendek', daftarSoal: paketButir(3) });
  assert.equal(p.boleh, false);
  assert.match(p.alasan.join(' '), /Cetak Latihan/, 'harus menunjuk alternatif, bukan cuma melarang');
});

test('INVARIAN: tipe yang tak bisa dirender try out DITOLAK (bukan sekadar dibenderai)', () => {
  const soal = [...paketButir(6), butir('j1', { tipe: 'menjodohkan', pasangan: [{ kiri: 'a', kanan: 'b' }] })];
  const p = putusanKirimDraf({ judul: 'Try Out Campuran', daftarSoal: soal });
  assert.equal(p.boleh, false);
  assert.match(p.alasan.join(' '), /menjodohkan/);
  assert.match(p.alasan.join(' '), /tetap bisa DICETAK/, 'tetap memberi jalan keluar');
});

test('durasi di luar batas ditolak', () => {
  assert.equal(putusanKirimDraf({ judul: 'Try Out Valid', daftarSoal: paketButir(10), durasiTotalMenit: 0 }).boleh, false);
  assert.equal(putusanKirimDraf({ judul: 'Try Out Valid', daftarSoal: paketButir(10), durasiTotalMenit: 9999 }).boleh, false);
  assert.equal(putusanKirimDraf({ judul: 'Try Out Valid', daftarSoal: paketButir(10), durasiTotalMenit: 120 }).boleh, true);
});

test('mode per-subtes tanpa durasi per subtes ditolak', () => {
  const p = putusanKirimDraf({ judul: 'Try Out Subtes', daftarSoal: paketButir(10), modeTimer: 'per-subtes', subtes: [{ nama: 'Matematika' }] });
  assert.equal(p.boleh, false);
  assert.match(p.alasan.join(' '), /belum punya durasi/);
  const q = putusanKirimDraf({ judul: 'Try Out Subtes', daftarSoal: paketButir(10), modeTimer: 'per-subtes', subtes: [{ nama: 'Matematika', durasiMenit: 30 }] });
  assert.equal(q.boleh, true);
});

test('mode timer tak dikenal ditolak', () => {
  assert.equal(putusanKirimDraf({ judul: 'Try Out Aneh', daftarSoal: paketButir(10), modeTimer: 'bebas' }).boleh, false);
});

test('butir tanpa teks soal ditolak; butir berbendera hanya diperingatkan', () => {
  const tanpaTeks = putusanKirimDraf({ judul: 'Try Out Rusak', daftarSoal: [...paketButir(6), butir('x', { soal: '', teksSoal: '' })] });
  assert.equal(tanpaTeks.boleh, false);

  const berbendera = putusanKirimDraf({ judul: 'Try Out AI', daftarSoal: paketButir(8, { kunciTerverifikasi: false }), targetKelas: 'SMA/MA', targetKategori: 'Matematika' });
  assert.equal(berbendera.boleh, true);
  assert.ok(berbendera.peringatan.some((p) => /bendera mutu/.test(p)));
});

test('paket lintas jenjang tanpa sasaran kelas diperingatkan, bukan ditolak', () => {
  const p = putusanKirimDraf({
    judul: 'Try Out Campur Jenjang',
    daftarSoal: [...paketButir(4), ...paketButir(4).map((s, i) => ({ ...s, id: `b${i}`, jenjang: 'SMP/MTs' }))],
  });
  assert.equal(p.boleh, true);
  assert.ok(p.peringatan.some((w) => /jenjang berbeda/.test(w)));
});

// ------------------------------------------------------------
// 5. Bentuk dokumen draf
// ------------------------------------------------------------

test('payload draf memakai status MENUNGGU dan skema yang dibaca siswa', () => {
  const dok = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(10), durasiTotalMenit: 90, guru: GURU });
  assert.equal(dok.status, STATUS_PAKET.MENUNGGU);
  assert.equal(dok.totalSoal, 10);
  assert.equal(dok.daftarSoal.length, 10);
  assert.equal(dok.modeTimer, 'total');
  assert.equal(dok.durasiTotalMenit, 90);
  assert.equal(dok.dibuatOleh, 'tentor');
  assert.equal(dok.tentorNama, 'Pak Andi');
  // field yang dibaca TryOutView.jsx harus ADA
  for (const f of ['daftarSoal', 'totalSoal', 'modeTimer', 'subtes', 'antiCheatAktif', 'wajibKamera', 'soalAcak', 'judul']) {
    assert.ok(f in dok, `field ${f} wajib ada agar paket bisa dikerjakan siswa`);
  }
});

test('INVARIAN: jadwal terbit dikosongkan — itu keputusan admin, bukan efek usulan', () => {
  const dok = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(10), guru: GURU });
  assert.equal(dok.waktuBuka, null);
  assert.equal(dok.waktuTutup, null);
});

test('target kelas/kategori disimpulkan dari isi bila tentor tidak mengisinya', () => {
  const dok = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(6), guru: GURU });
  assert.equal(dok.targetKelas, 'SMA/MA');
  assert.equal(dok.targetKategori, 'Matematika');

  const campur = bangunPayloadDraf({
    judul: 'Try Out Campur',
    daftarSoal: [...paketButir(3), ...paketButir(3).map((s, i) => ({ ...s, id: `c${i}`, mataPelajaran: 'Kimia' }))],
    guru: GURU,
  });
  assert.equal(campur.targetKategori, '', 'tidak boleh menebak bila mapelnya campuran');
});

test('wajibKamera hanya hidup bila anti-cheat aktif (tidak menyalakan kamera diam-diam)', () => {
  const a = bangunPayloadDraf({ judul: 'Try Out A', daftarSoal: paketButir(6), antiCheatAktif: false, wajibKamera: true, guru: GURU });
  assert.equal(a.wajibKamera, false);
  const b = bangunPayloadDraf({ judul: 'Try Out B', daftarSoal: paketButir(6), antiCheatAktif: true, wajibKamera: true, guru: GURU });
  assert.equal(b.wajibKamera, true);
});

test('riwayat status dimulai dari usulan tentor', () => {
  const dok = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(6), guru: GURU });
  assert.equal(dok.riwayatStatus.length, 1);
  assert.equal(dok.riwayatStatus[0].status, STATUS_PAKET.MENUNGGU);
  assert.equal(dok.riwayatStatus[0].peran, 'tentor');
});

// ------------------------------------------------------------
// 6. Keputusan admin
// ------------------------------------------------------------

test('admin menyetujui: status jadi aktif + jadwal terisi + riwayat bertambah', () => {
  const draf = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(10), guru: GURU });
  const besok = new Date(Date.now() + 86400000).toISOString();
  const lusa = new Date(Date.now() + 2 * 86400000).toISOString();
  const h = putusanApprove(draf, { jadwalBuka: besok, jadwalTutup: lusa, oleh: 'Bu Rina' });
  assert.equal(h.boleh, true);
  assert.equal(h.payload.status, 'aktif');
  assert.equal(h.payload.disetujuiOleh, 'Bu Rina');
  assert.equal(h.payload.waktuBuka, besok);
  assert.equal(h.payload.waktuTutup, lusa);
  assert.equal(h.payload.riwayatStatus.length, 2);
});

test('menyetujui tanpa jadwal diperbolehkan (langsung bisa dikerjakan)', () => {
  const draf = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(10), guru: GURU });
  const h = putusanApprove(draf);
  assert.equal(h.boleh, true);
  assert.equal(h.payload.waktuBuka, null);
});

test('draf yang BELUM diusulkan tidak bisa langsung disetujui', () => {
  const h = putusanApprove({ status: 'draf', daftarSoal: paketButir(10) });
  assert.equal(h.boleh, false);
  assert.match(h.alasan.join(' '), /tidak bisa langsung jadi/);
});

test('paket kosong / bertipe tak didukung tidak bisa disetujui', () => {
  assert.equal(putusanApprove({ status: 'menunggu_approval', daftarSoal: [] }).boleh, false);
  const h = putusanApprove({ status: 'menunggu_approval', daftarSoal: [butir('j', { tipe: 'menjodohkan' })] });
  assert.equal(h.boleh, false);
  assert.match(h.alasan.join(' '), /tidak bisa dirender/);
});

test('jadwal terbalik & deadline lampau ditolak', () => {
  const draf = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(10), guru: GURU });
  const kini = Date.now();
  assert.equal(putusanApprove(draf, { jadwalBuka: new Date(kini + 2e6).toISOString(), jadwalTutup: new Date(kini + 1e6).toISOString() }).boleh, false);
  assert.equal(putusanApprove(draf, { jadwalTutup: new Date(kini - 1e6).toISOString() }).boleh, false);
});

test(`menolak wajib menyertakan alasan berarti (>= ${MIN_PANJANG_ALASAN_TOLAK} huruf)`, () => {
  const draf = bangunPayloadDraf({ judul: 'Try Out TKA', daftarSoal: paketButir(10), guru: GURU });
  assert.equal(putusanTolak(draf, '').boleh, false);
  assert.equal(putusanTolak(draf, 'jelek').boleh, false);
  const h = putusanTolak(draf, 'Soal nomor 3 kuncinya keliru dan durasi terlalu pendek untuk 40 butir.', 'Bu Rina');
  assert.equal(h.boleh, true);
  assert.equal(h.payload.status, 'ditolak');
  assert.match(h.payload.ditolakAlasan, /kuncinya keliru/);
  assert.equal(h.payload.riwayatStatus.length, 2);
});

test('putusan admin atas input janggal tidak melempar', () => {
  assert.equal(putusanApprove(null).boleh, false);
  assert.equal(putusanTolak(null, null).boleh, false);
  assert.equal(putusanApprove({}).boleh, false);
});

// ------------------------------------------------------------
// 7. Ringkasan untuk antrean admin
// ------------------------------------------------------------

test('ringkasan draf memberi admin gambaran sekali pandang', () => {
  const dok = bangunPayloadDraf({ judul: 'Try Out TKA Matematika', daftarSoal: paketButir(8, { kunciTerverifikasi: false }), guru: GURU });
  const r = ringkasDraf(dok);
  assert.equal(r.judul, 'Try Out TKA Matematika');
  assert.equal(r.jumlahButir, 8);
  assert.equal(r.jumlahSubtes, 1);
  assert.deepEqual(r.mapel, ['Matematika']);
  assert.equal(r.berbendera, 8);
  assert.equal(r.diusulkanOleh, 'Pak Andi');
});

test('ringkasan paket kosong/janggal tidak melempar', () => {
  assert.equal(ringkasDraf({}).judul, '(tanpa judul)');
  assert.equal(ringkasDraf(null).jumlahButir, 0);
});
