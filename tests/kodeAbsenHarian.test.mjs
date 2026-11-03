// tests/kodeAbsenHarian.test.mjs
// ============================================================
// PENGAWAL keputusan owner D2 (opsi c, 3 Nov 2026): "manual tetap, tapi dasbor
// JUJUR bilang kode belum dibuat admin + tombol Coba lagi".
//
// Inti yang dijaga: "TIDAK TAHU" tidak boleh pernah dilaporkan sebagai "SALAH".
// Sebelum perbaikan, tiga keadaan berbeda (admin belum membuat kode / dokumen
// kosong / baca gagal karena kuota) semuanya berakhir di pesan
// "Token absensi salah!" — guru dituduh, kelas buntu, dan kuota habis pun
// menyamar jadi salah ketik (register bug B-06 + POLICY-ERROR-DAN-KUOTA aturan 1).
// ============================================================
import assert from 'node:assert/strict';
import {
  STATUS_KODE, normKode, statusKodeHarian, keteranganStatusKode, verifikasiKodeAbsen,
} from '../src/utils/kodeAbsenHarian.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

console.log('kodeAbsenHarian: tiga keadaan "tidak tahu" tidak lagi menyamar jadi "salah"');

/** Pesan boleh MENENANGKAN ("bukan salah Anda"), tetapi tidak boleh MENUDUH. */
function tidakMenuduh(pesan) {
  const tanpaPenenang = String(pesan).replace(/bukan salah anda/gi, '');
  assert.doesNotMatch(tanpaPenenang, /salah/i, `pesan masih menuduh guru: ${pesan}`);
}

uji('normKode membuang spasi dan menyamakan kapitalisasi', () => {
  assert.equal(normKode('  abc123 '), 'ABC123');
  assert.equal(normKode(null), '');
  assert.equal(normKode(undefined), '');
});

uji('status: dokumen ada + kode terisi = siap', () => {
  assert.equal(statusKodeHarian({ adaDokumen: true, kode: 'ABC123' }), STATUS_KODE.SIAP);
});

uji('status: dokumen tidak ada = belum dibuat admin (BUKAN gagal, BUKAN salah)', () => {
  assert.equal(statusKodeHarian({ adaDokumen: false }), STATUS_KODE.BELUM_DIBUAT);
});

uji('status: dokumen ada tapi kode kosong = keadaan sendiri', () => {
  assert.equal(statusKodeHarian({ adaDokumen: true, kode: '   ' }), STATUS_KODE.KOSONG);
});

uji('status: gagal baca MENANG atas "dokumen tidak ada" (kuota tidak boleh menyamar)', () => {
  assert.equal(statusKodeHarian({ gagalMuat: true, adaDokumen: false }), STATUS_KODE.GAGAL_BACA);
  assert.equal(statusKodeHarian({ gagalMuat: true, adaDokumen: true, kode: 'ABC' }), STATUS_KODE.GAGAL_BACA);
});

uji('status: masih memuat tidak dianggap siap', () => {
  assert.equal(statusKodeHarian({ memuat: true, adaDokumen: true, kode: 'ABC' }), STATUS_KODE.MEMUAT);
});

uji('hanya status SIAP yang boleh memverifikasi; sisanya menawarkan "Coba lagi"', () => {
  assert.equal(keteranganStatusKode(STATUS_KODE.SIAP).bolehVerifikasi, true);
  [STATUS_KODE.BELUM_DIBUAT, STATUS_KODE.KOSONG, STATUS_KODE.GAGAL_BACA, STATUS_KODE.MEMUAT].forEach((st) => {
    const ket = keteranganStatusKode(st);
    assert.equal(ket.bolehVerifikasi, false, `${st} tidak boleh bolehVerifikasi`);
    assert.ok(ket.judul && ket.pesan, `${st} wajib punya judul+pesan`);
  });
  [STATUS_KODE.BELUM_DIBUAT, STATUS_KODE.KOSONG, STATUS_KODE.GAGAL_BACA].forEach((st) => {
    assert.equal(keteranganStatusKode(st).saran, 'Coba lagi', `${st} wajib menawarkan jalan keluar`);
  });
});

uji('nada warna sesuai tingkat keadaan (info/peringatan/bahaya)', () => {
  assert.equal(keteranganStatusKode(STATUS_KODE.SIAP).nada, 'info');
  assert.equal(keteranganStatusKode(STATUS_KODE.BELUM_DIBUAT).nada, 'peringatan');
  assert.equal(keteranganStatusKode(STATUS_KODE.KOSONG).nada, 'peringatan');
  assert.equal(keteranganStatusKode(STATUS_KODE.GAGAL_BACA).nada, 'bahaya');
});

uji('verifikasi: input kosong → minta kode, bukan "salah"', () => {
  const h = verifikasiKodeAbsen({ input: '   ', kode: 'ABC123', status: STATUS_KODE.SIAP });
  assert.equal(h.lulus, false);
  assert.match(h.pesan, /masukkan kode/i);
  tidakMenuduh(h.pesan);
});

uji('verifikasi: kode belum dibuat admin → pesan menyebut admin, TIDAK menuduh guru', () => {
  const h = verifikasiKodeAbsen({ input: 'ABC123', kode: '', status: STATUS_KODE.BELUM_DIBUAT });
  assert.equal(h.lulus, false);
  assert.match(h.pesan, /belum dibuat admin/i);
  tidakMenuduh(h.pesan);
});

uji('verifikasi: gagal baca (kuota) → pesan menyebut gagal baca + coba lagi', () => {
  const h = verifikasiKodeAbsen({ input: 'ABC123', kode: 'ABC123', status: STATUS_KODE.GAGAL_BACA });
  assert.equal(h.lulus, false, 'walaupun teksnya kebetulan sama, keadaan tidak diketahui → jangan diloloskan');
  assert.match(h.pesan, /gagal dibaca/i);
  assert.match(h.pesan, /coba lagi/i);
  tidakMenuduh(h.pesan);
});

uji('verifikasi: dokumen kosong → pesan meminta admin mengisi', () => {
  const h = verifikasiKodeAbsen({ input: 'ABC', kode: '', status: STATUS_KODE.KOSONG });
  assert.equal(h.lulus, false);
  assert.match(h.pesan, /masih kosong/i);
});

uji('verifikasi: status siap + kode cocok (beda kapitalisasi/spasi) = lulus', () => {
  assert.equal(verifikasiKodeAbsen({ input: 'abc123', kode: 'ABC123', status: STATUS_KODE.SIAP }).lulus, true);
  assert.equal(verifikasiKodeAbsen({ input: '  ABC123  ', kode: 'abc123', status: STATUS_KODE.SIAP }).lulus, true);
});

uji('verifikasi: status siap + kode beda = "belum cocok" (satu-satunya jalur yang boleh menyalahkan input)', () => {
  const h = verifikasiKodeAbsen({ input: 'XYZ999', kode: 'ABC123', status: STATUS_KODE.SIAP });
  assert.equal(h.lulus, false);
  assert.match(h.pesan, /belum cocok/i);
});

uji('verifikasi: status tidak dikenal diperlakukan seperti belum siap (fail-safe)', () => {
  const h = verifikasiKodeAbsen({ input: 'ABC', kode: 'ABC', status: 'entah-apa' });
  assert.equal(h.lulus, false);
  assert.ok(h.pesan.length > 0);
});

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
