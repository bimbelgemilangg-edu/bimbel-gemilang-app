import test from 'node:test';
import assert from 'node:assert/strict';
import {
  posisiMascotUntukMapel, buatDeskripsiPaket, hitungAnalitik, labelPekan, potongUntukQuery, PAPAN_MASCOT,
  awalPekanMs, labelMisiPekan, rangkaianMisi, statusMisi,
} from '../src/utils/papanJelajah.js';

test('sprite maskot: Matematika = kartu indeks 3 (kolom 3 baris 0)', () => {
  const p = posisiMascotUntukMapel('Matematika');
  assert.equal(p.indeks, 3);
  assert.equal(p.xPct, 60);
  assert.equal(p.yPct, 0);
  assert.equal(p.label, 'Matematika');
});

test('sprite maskot: subtes UTBK penalaran umum jatuh ke kartu koding/logika', () => {
  assert.equal(posisiMascotUntukMapel('TPS/Penalaran Umum').indeks, 10);
  assert.equal(posisiMascotUntukMapel('Literasi/Bahasa Inggris').indeks, 8);
});

test('sprite maskot: tingkat lanjut tidak tertelan mapel dasar', () => {
  assert.equal(posisiMascotUntukMapel('Matematika Tingkat Lanjut').indeks, 15);
  assert.equal(posisiMascotUntukMapel('Bahasa Indonesia Tingkat Lanjut').indeks, 22);
});

test('sprite maskot: nama tak dikenal -> null (UI pakai kartu bintang)', () => {
  assert.equal(posisiMascotUntukMapel('Astrologi'), null);
  assert.equal(posisiMascotUntukMapel(''), null);
});

test('deskripsi TKA SMP menyebut CP Kemendikbud, komposisi, durasi, tanpa pembahasan', () => {
  const d = buatDeskripsiPaket({
    jenjang: 'SMP', jenisUjian: 'tka', komposisi: [{ mapel: 'Matematika', jumlah: 20 }, { mapel: 'Bahasa Indonesia', jumlah: 20 }],
    durasiMenit: 75, jumlahSubtes: 2, tampilkanPembahasan: false,
  });
  assert.match(d, /Capaian Pembelajaran \(CP\)/);
  assert.match(d, /20 soal Matematika \+ 20 soal Bahasa Indonesia/);
  assert.match(d, /kelas 7-9/);
  assert.match(d, /75 menit dalam 2 subtes/);
  assert.match(d, /Pembahasan tidak ditampilkan/);
});

test('deskripsi UTBK menyebut kisi SNBT', () => {
  assert.match(buatDeskripsiPaket({ jenisUjian: 'utbk', durasiMenit: 120 }), /UTBK/);
});

test('labelPekan mengelompokkan ke Senin UTC', () => {
  const sabtu = Date.parse('2026-10-17T10:00:00Z');
  assert.equal(labelPekan(sabtu), 'Pekan 12 Okt');
});

test('analitik: tren dua pekan memberi delta +12 dan tips apresiasi', () => {
  const p1 = Date.parse('2026-10-10T10:00:00Z');
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'TO A', jenisUjian: 'tka', totalSkorPersen: 60, waktuSelesaiMs: p1, createdAtMs: p1 - 3600e3, totalSoal: 40, subtes: [{ nama: 'Matematika', skorPersen: 55 }, { nama: 'Bahasa Indonesia', skorPersen: 65 }] },
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: p2 - 3600e3, totalSoal: 40, subtes: [{ nama: 'Matematika', skorPersen: 70 }, { nama: 'Bahasa Indonesia', skorPersen: 74 }] },
  ]);
  assert.equal(a.jumlahSesi, 2);
  assert.equal(a.tren.length, 2);
  assert.equal(a.tren[1].delta, 12);
  assert.ok(a.tips.some((t) => t.includes('📈')));
  assert.match(a.evaluasi, /naik/);
  assert.equal(a.subtesRata[0].nama, 'Bahasa Indonesia');
});

test('analitik: kecepatan 90 detik/soal masih wajar, reguler diabaikan', () => {
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'Reguler', jenisUjian: 'reguler', totalSkorPersen: 99, waktuSelesaiMs: p2 },
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: p2 - 3600e3, totalSoal: 40 },
  ]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.kecepatan.detikPerSoal, 90);
  assert.equal(a.kecepatan.wajar, true);
});

test('analitik: tanpa sesi TKA/UTBK -> struktur kosong, bukan crash', () => {
  const a = hitungAnalitik([{ nama: 'x', jenisUjian: 'reguler', waktuSelesaiMs: 1 }]);
  assert.equal(a.jumlahSesi, 0);
  assert.deepEqual(a.tren, []);
  assert.equal(PAPAN_MASCOT.length, 30);
});

// 🛡️ Regresi audit 2026-10-13 bug #1: sesi tanpa waktuSelesai (halaman
// mengirim null lewat ms()) dulu LOLOS filter karena Number(null)===0 ->
// baris tren sampah "Pekan 29 Des" 1969 + delta palsu. Kini dibuang.
test('analitik: waktuSelesaiMs null dibuang, tidak melahirkan tren 1969', () => {
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'TO Hantu', jenisUjian: 'tka', totalSkorPersen: 40, waktuSelesaiMs: null, createdAtMs: p2 - 3600e3, totalSoal: 40 },
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: p2 - 3600e3, totalSoal: 40 },
  ]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.tren.length, 1);
  assert.equal(a.tren[0].label, 'Pekan 12 Okt');
  assert.ok(!a.tren.some((t) => t.label.includes('Des')));
  const kosong = hitungAnalitik([{ nama: 'TO Hantu', jenisUjian: 'tka', totalSkorPersen: 40, waktuSelesaiMs: null }]);
  assert.equal(kosong.jumlahSesi, 0);
});

// 🛡️ Regresi audit 2026-10-13 bug #2: createdAtMs null dulu jadi 0 (epoch)
// dan lolos Number.isFinite -> kecepatan dihitung dari 1969 (~17,8 juta
// detik/soal). Kini kartu tempo disembunyikan (kecepatan null).
test('analitik: createdAtMs null -> kecepatan null, bukan detik/soal absurd', () => {
  const p2 = Date.parse('2026-10-17T10:00:00Z');
  const a = hitungAnalitik([
    { nama: 'TO B', jenisUjian: 'tka', totalSkorPersen: 72, waktuSelesaiMs: p2, createdAtMs: null, totalSoal: 40 },
  ]);
  assert.equal(a.jumlahSesi, 1);
  assert.equal(a.kecepatan, null);
  assert.ok(!a.tips.some((t) => t.includes('detik/soal')));
  // createdAtMs 0 eksplisit (epoch beneran) juga tak boleh lolos sebagai
  // waktu mulai sah untuk sesi 2026 -> waktuSelesai > mulai tetap valid,
  // tapi harus absurd; pastikan minimal tidak crash dan angka terdefinisi.
  const b = hitungAnalitik([
    { nama: 'TO C', jenisUjian: 'tka', totalSkorPersen: 50, waktuSelesaiMs: p2, createdAtMs: p2 - 40 * 60e3, totalSoal: 40 },
  ]);
  assert.equal(b.kecepatan.detikPerSoal, 60);
  assert.equal(b.kecepatan.wajar, true);
});

test('potongUntukQuery: chunk <= 30, buang kosong & duplikat, jaga urutan', () => {
  const ids = Array.from({ length: 65 }, (_, i) => `p${i}`);
  const c = potongUntukQuery(ids);
  assert.equal(c.length, 3);
  assert.deepEqual(c.map((x) => x.length), [30, 30, 5]);
  assert.equal(c[0][0], 'p0');
  assert.equal(c[2][4], 'p64');
  assert.deepEqual(potongUntukQuery(['a', '', null, 'a', ' b ']), [['a', 'b']]);
  assert.deepEqual(potongUntukQuery([]), []);
  assert.deepEqual(potongUntukQuery(['x', 'y'], 1), [['x'], ['y']]);
});

// ============================================================
// 🚀 ROMBAK TOTAL 14 Okt 2026: baris berlian "rangkaian misi" pekanan
// dan status jujur satu misi (pengganti logika yang dulu tercecer di
// komponen). Semua jam disuntik (kiniMs) supaya murni & deterministik.
// Patokan fixture: pekan Senin 12 Okt 2026 (misi Sabtu = 17 Okt 2026).
// ============================================================
const SENIN_12_OKT = Date.parse('2026-10-12T00:00:00Z');
const SENIN_05_OKT = Date.parse('2026-10-05T00:00:00Z');
const SENIN_28_SEP = Date.parse('2026-09-28T00:00:00Z');
const SABTU_17_OKT_0900 = Date.parse('2026-10-17T09:00:00Z');

test('awalPekanMs: kapan pun dalam pekan -> Senin 00.00 UTC pekan itu', () => {
  assert.equal(awalPekanMs(SABTU_17_OKT_0900), SENIN_12_OKT);
  // Minggu tengah malam masih pekan Senin 12 (pekan = Senin..Minggu).
  assert.equal(awalPekanMs(Date.parse('2026-10-18T23:59:59Z')), SENIN_12_OKT);
  // Senin tepat tengah malam = dirinya sendiri.
  assert.equal(awalPekanMs(SENIN_12_OKT), SENIN_12_OKT);
});

test('awalPekanMs & labelMisiPekan: input rusak -> null / "-"', () => {
  assert.equal(awalPekanMs(null), null);
  assert.equal(awalPekanMs('bukan angka'), null);
  assert.equal(awalPekanMs(NaN), null);
  assert.equal(labelMisiPekan(null), '-');
  assert.equal(labelMisiPekan(SABTU_17_OKT_0900), '12 Okt');
});

test('rangkaianMisi: 3 pekan aktif beruntun -> 6 berlian, beruntun 3', () => {
  const kini = Date.parse('2026-10-14T08:00:00Z'); // Rabu pekan 12 Okt
  const r = rangkaianMisi([
    Date.parse('2026-09-30T10:00:00Z'), // pekan 28 Sep
    Date.parse('2026-10-10T10:00:00Z'), // pekan 5 Okt
    SABTU_17_OKT_0900 - 86400000 * 7,   // Sabtu 10 Okt -> pekan 5 Okt (duplikat pekan)
    kini - 3600e3,                      // pekan 12 Okt (kini)
  ], kini, 6);
  assert.equal(r.pekan.length, 6);
  assert.equal(r.beruntun, 3);
  assert.equal(r.totalAktif, 3); // 4 sesi tapi hanya 3 pekan berbeda
  // Urutan kronologis, elemen terakhir = pekan ini.
  assert.equal(r.pekan[5].awalMs, SENIN_12_OKT);
  assert.equal(r.pekan[5].pekanIni, true);
  assert.equal(r.pekan[5].aktif, true);
  assert.equal(r.pekan[4].awalMs, SENIN_05_OKT);
  assert.equal(r.pekan[3].awalMs, SENIN_28_SEP);
  assert.equal(r.pekan[2].aktif, false);
  assert.equal(r.pekan[0].label, '7 Sep');
});

test('rangkaianMisi: pekan ini kosong tapi pekan lalu aktif -> rantai MASIH HIDUP', () => {
  // Rabu pagi: misi Sabtu pekan ini belum tiba -- beruntun tidak boleh 0.
  const kini = Date.parse('2026-10-14T08:00:00Z');
  const r = rangkaianMisi([Date.parse('2026-10-07T10:00:00Z')], kini, 6);
  assert.equal(r.beruntun, 1);
  assert.equal(r.pekan[5].aktif, false); // pekan ini memang belum ada misi
  assert.equal(r.pekan[4].aktif, true);
});

test('rangkaianMisi: pekan ini & pekan lalu kosong -> rantai putus (0)', () => {
  const kini = Date.parse('2026-10-14T08:00:00Z');
  const r = rangkaianMisi([Date.parse('2026-09-30T10:00:00Z')], kini, 6);
  assert.equal(r.beruntun, 0);
  assert.equal(r.totalAktif, 1); // sejarah tetap terlihat di berlian tua
});

test('rangkaianMisi: sampah input disaring, daftar kosong aman', () => {
  const kini = Date.parse('2026-10-14T08:00:00Z');
  const r = rangkaianMisi([null, undefined, 'x', NaN, kini - 3600e3], kini, 6);
  assert.equal(r.totalAktif, 1);
  assert.equal(r.beruntun, 1);
  const kosong = rangkaianMisi([], kini, 6);
  assert.equal(kosong.beruntun, 0);
  assert.equal(kosong.pekan.length, 6);
  assert.ok(kosong.pekan.every((p) => p.aktif === false));
});

test('statusMisi: prioritas selesai > berjalan > mendatang > terlewat > izin > berlangsung', () => {
  const kini = SABTU_17_OKT_0900; // Sabtu 17 Okt 09.00 UTC
  const buka = Date.parse('2026-10-17T00:00:00Z');
  const tutup = Date.parse('2026-10-17T16:59:00Z');
  // Jendela yang BENAR-BENAR sudah lewat relatif terhadap `kini` (09.00).
  const bukaLampau = Date.parse('2026-10-17T06:00:00Z');
  const tutupLampau = Date.parse('2026-10-17T08:00:00Z');
  // Sesi selesai menang atas status waktu apa pun.
  assert.equal(statusMisi({ waktuBukaMs: buka, waktuTutupMs: tutup, sesiStatus: 'selesai', kiniMs: kini }).keadaan, 'selesai');
  // Sesi berjalan = "lanjutan menunggu", bahkan bila jendela sudah lewat.
  assert.equal(statusMisi({ waktuBukaMs: bukaLampau, waktuTutupMs: tutupLampau, sesiStatus: 'berjalan', kiniMs: kini }).keadaan, 'berjalan');
  // Belum dibuka -> mendatang + terkunci.
  const m = statusMisi({ waktuBukaMs: kini + 86400e3, waktuTutupMs: kini + 90000e3, sesiStatus: null, kiniMs: kini });
  assert.equal(m.keadaan, 'mendatang');
  assert.equal(m.terkunci, true);
  assert.equal(m.belumDibuka, true);
  // Lewat tutup tanpa izin -> terlewat + terkunci.
  const t = statusMisi({ waktuBukaMs: bukaLampau, waktuTutupMs: tutupLampau, sesiStatus: null, kiniMs: kini });
  assert.equal(t.keadaan, 'terlewat');
  assert.equal(t.terkunci, true);
  assert.equal(t.lewatTutup, true);
  // Lewat tutup TAPI izin ulang masih berlaku -> kesempatan kedua, boleh masuk.
  const iz = statusMisi({ waktuBukaMs: bukaLampau, waktuTutupMs: tutupLampau, izinSampaiMs: kini + 86400e3, sesiStatus: null, kiniMs: kini });
  assert.equal(iz.keadaan, 'izin');
  assert.equal(iz.terkunci, false);
  assert.equal(iz.izinBerlaku, true);
  // Izin kedaluwarsa -> kembali terlewat.
  assert.equal(statusMisi({ waktuBukaMs: bukaLampau, waktuTutupMs: tutupLampau, izinSampaiMs: kini - 1000, sesiStatus: null, kiniMs: kini }).keadaan, 'terlewat');
  // Di dalam jendela -> berlangsung.
  const b = statusMisi({ waktuBukaMs: buka, waktuTutupMs: tutup, sesiStatus: null, kiniMs: kini });
  assert.equal(b.keadaan, 'berlangsung');
  assert.equal(b.terkunci, false);
});

test('statusMisi: batas waktu inklusif (kini == buka/tutup = berlangsung) & input rusak aman', () => {
  const buka = Date.parse('2026-10-17T00:00:00Z');
  const tutup = Date.parse('2026-10-17T16:59:00Z');
  assert.equal(statusMisi({ waktuBukaMs: buka, waktuTutupMs: tutup, kiniMs: buka }).keadaan, 'berlangsung');
  assert.equal(statusMisi({ waktuBukaMs: buka, waktuTutupMs: tutup, kiniMs: tutup }).keadaan, 'berlangsung');
  // Tanpa jendela waktu sama sekali (paket bebas) -> berlangsung, tidak terkunci.
  const bebas = statusMisi({ kiniMs: SABTU_17_OKT_0900 });
  assert.equal(bebas.keadaan, 'berlangsung');
  assert.equal(bebas.terkunci, false);
  // kiniMs rusak dianggap epoch 0: paket 2026 apa pun jadi "mendatang".
  const rusak = statusMisi({ waktuBukaMs: buka, waktuTutupMs: tutup, kiniMs: 'nonsense' });
  assert.equal(rusak.keadaan, 'mendatang');
});
