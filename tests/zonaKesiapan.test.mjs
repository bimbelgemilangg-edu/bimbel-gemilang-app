// tests/zonaKesiapan.test.mjs — matriks zona & aturan formasi Pilihan 1/2
// ============================================================
//     node tests/zonaKesiapan.test.mjs
//
// KENAPA INI PENTING
// Angka di berkas ini menentukan apa yang dilihat siswa kelas 12 tentang
// peluangnya masuk kampus impian. Salah ambang = salah arah belajar setahun.
// Karena itu test-nya memeriksa SIFAT (invarian), bukan potret output:
// rentang harus menutup semua bilangan, tidak boleh tumpang tindih, dan data
// yang hilang tidak boleh berubah menjadi zona berwarna.
//
// Sumber angka: sheet SOP_GEMBLENGAN_TRYOUT & SIMULATOR_EVALUASI_SISWA pada
// berkas owner. Disalin, bukan dikarang — lihat kepala utils/zonaKesiapan.js.
// ============================================================
import assert from 'node:assert/strict';
import {
  ZONA, MATRIKS_ZONA, zonaDariGap, bandingkanSkor, nilaiFormasi, nilaiTren,
} from '../src/utils/zonaKesiapan.js';
import { bungkusAngka, sanggahanSkor } from '../src/utils/statusDataPtn.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}

console.log('zonaKesiapan — matriks zona & formasi pilihan');

const skorRef = (min, rata, maks) => ({
  minimum: bungkusAngka(min, { sumber: 'uji' }),
  rataRata: bungkusAngka(rata, { sumber: 'uji' }),
  maksimum: bungkusAngka(maks, { sumber: 'uji' }),
});

// ======================================================== SIFAT MATRIKS
uji('INVARIAN: rentang zona menutup SEMUA bilangan bulat -200..200', () => {
  for (let g = -200; g <= 200; g += 1) {
    const z = zonaDariGap(g);
    assert.notEqual(z.id, ZONA.TANPA_DATA, `gap ${g} jatuh ke TANPA_DATA`);
    assert.ok(z.nama, `gap ${g} tidak punya nama zona`);
  }
});

uji('INVARIAN: tidak ada gap yang masuk ke dua zona', () => {
  for (let g = -200; g <= 200; g += 1) {
    const cocok = MATRIKS_ZONA.filter((m) => g >= m.minGap && g <= m.maksGap);
    assert.equal(cocok.length, 1, `gap ${g} cocok ke ${cocok.length} zona`);
  }
});

uji('nilai batas persis seperti SOP owner', () => {
  // SOP: Hijau Sangat Aman >= +25 | Hijau Kompetitif 0..+24 |
  //      Kuning -1..-25 | Merah < -25
  assert.equal(zonaDariGap(25).id, ZONA.HIJAU_AMAN);
  assert.equal(zonaDariGap(24).id, ZONA.HIJAU_KOMPETITIF);
  assert.equal(zonaDariGap(0).id, ZONA.HIJAU_KOMPETITIF, 'gap 0 = surplus, harus hijau');
  assert.equal(zonaDariGap(-1).id, ZONA.KUNING);
  assert.equal(zonaDariGap(-25).id, ZONA.KUNING);
  assert.equal(zonaDariGap(-26).id, ZONA.MERAH);
});

uji('setiap zona membawa tindakan, bukan cuma label', () => {
  // Blueprint §6: hasil evaluasi harus memengaruhi pembelajaran berikutnya.
  // Zona tanpa frekuensi drill & intervensi tidak bisa ditindaklanjuti tentor.
  for (const z of MATRIKS_ZONA) {
    assert.ok(z.frekuensiDrill, `${z.id} tanpa frekuensiDrill`);
    assert.ok(z.intervensi, `${z.id} tanpa intervensi`);
    assert.ok(z.rekomendasiFormasi, `${z.id} tanpa rekomendasiFormasi`);
    assert.ok(z.risiko, `${z.id} tanpa tingkat risiko`);
  }
});

uji('INVARIAN: tidak ada zona yang mengembalikan persentase peluang', () => {
  // Blueprint §3D melarang persentase peluang diterima tanpa model tervalidasi.
  for (let g = -200; g <= 200; g += 7) {
    const z = zonaDariGap(g);
    for (const [k, v] of Object.entries(z)) {
      assert.ok(!/peluang|persen|probab/i.test(k), `field terlarang: ${k}`);
      if (typeof v === 'string') assert.ok(!/\d+\s*%/.test(v), `persentase di ${k}: ${v}`);
    }
  }
});

// ==================================================== DATA HILANG
uji('INVARIAN: gap null jadi TANPA_DATA, bukan zona berwarna', () => {
  // Menampilkan "Zona Merah" untuk prodi yang datanya tidak ada akan
  // menakut-nakuti siswa tanpa dasar.
  for (const g of [null, undefined, NaN, '', 'abc']) {
    assert.equal(zonaDariGap(g).id, ZONA.TANPA_DATA, `gap ${JSON.stringify(g)}`);
  }
});

uji('bandingkanSkor dengan prodi tanpa skor acuan -> zona TANPA_DATA + penjelasan', () => {
  const r = bandingkanSkor(685, skorRef(null, null, null));
  assert.equal(r.zona.id, ZONA.TANPA_DATA);
  assert.equal(r.gapMinimum, null);
  assert.equal(r.skorAcuanTersedia, false);
  assert.ok(r.peringatan.some((p) => /belum punya skor acuan/i.test(p)));
});

uji('bandingkanSkor tanpa skor siswa -> TANPA_DATA, bukan gap 0', () => {
  // gap 0 akan terbaca "pas di ambang, Zona Hijau Kompetitif" -- kebohongan.
  for (const s of [null, undefined, '', NaN]) {
    const r = bandingkanSkor(s, skorRef(672, 696, 740));
    assert.equal(r.gapMinimum, null, `skor ${JSON.stringify(s)}`);
    assert.equal(r.zona.id, ZONA.TANPA_DATA);
  }
});

uji('bandingkanSkor menghitung selisih terhadap MINIMUM, dan rata-rata terpisah', () => {
  // Contoh nyata dari sheet SIMULATOR baris 12: siswa 685 vs UNEJ Kedokteran
  // min 672 / rata2 696 -> GAP +13 (surplus) tapi -11 terhadap rata-rata.
  const r = bandingkanSkor(685, skorRef(672, 696, 740));
  assert.equal(r.gapMinimum, 13);
  assert.equal(r.gapRataRata, -11);
  assert.equal(r.zona.id, ZONA.HIJAU_KOMPETITIF);
});

uji('INVARIAN: skor estimasi selalu membawa peringatan, termasuk saat zonanya bagus', () => {
  const r = bandingkanSkor(780, skorRef(672, 696, 740));
  assert.equal(r.zona.id, ZONA.HIJAU_AMAN);
  assert.ok(r.peringatan.some((p) => /estimasi/i.test(p)), 'harus mengaku estimasi');
  assert.ok(r.peringatan.some((p) => /try out internal/i.test(p)), 'harus memisahkan TO internal dari UTBK');
});

uji('sanggahan menyebut larangan label passing grade', () => {
  assert.match(sanggahanSkor(), /bukan passing grade resmi/i);
});

// ============================================================== FORMASI
uji('contoh sheet SIMULATOR: Pilihan 1 -23 (PERLU DRILL), Pilihan 2 +13 (KOMPETITIF)', () => {
  // Baris 11-12 berkas owner: siswa 685, UNAIR Kedokteran min 708, UNEJ min 672.
  const p1 = bandingkanSkor(685, skorRef(708, 735, 778));
  const p2 = bandingkanSkor(685, skorRef(672, 696, 740));
  assert.equal(p1.gapMinimum, -23);
  assert.equal(p2.gapMinimum, 13);
  assert.equal(p1.zona.id, ZONA.KUNING);
  assert.equal(p2.zona.id, ZONA.HIJAU_KOMPETITIF);
  const f = nilaiFormasi(p1, p2);
  assert.equal(f.aman, true, 'Pilihan 1 menantang tapi Pilihan 2 surplus -> SOP menerima');
  assert.ok(f.catatan.some((c) => /menantang/i.test(c)));
});

uji('INVARIAN: Pilihan 2 di bawah minimum membuat formasi TIDAK aman', () => {
  // Aturan SOP: "Pilihan 2 WAJIB surplus (GAP >= 0 thd Min)".
  const p1 = bandingkanSkor(600, skorRef(580, 600, 620));
  const p2 = bandingkanSkor(600, skorRef(610, 630, 650));
  const f = nilaiFormasi(p1, p2);
  assert.equal(f.aman, false);
  assert.match(f.label, /cadangan/i);
  assert.ok(f.catatan.some((c) => /jaring pengaman/i.test(c)), 'harus menjelaskan akibatnya');
});

uji('Pilihan 1 di Zona Merah ditandai, dan batas -25 dihormati', () => {
  const p2 = bandingkanSkor(600, skorRef(500, 520, 540));
  assert.equal(nilaiFormasi(bandingkanSkor(600, skorRef(626, 640, 660)), p2).aman, false, 'gap -26 = merah');
  assert.equal(nilaiFormasi(bandingkanSkor(600, skorRef(625, 640, 660)), p2).aman, true, 'gap -25 = masih diterima');
});

uji('formasi dengan data tidak lengkap tidak diberi vonis aman/tidak aman', () => {
  const f = nilaiFormasi({ gapMinimum: null }, { gapMinimum: 13 });
  assert.equal(f.aman, false);
  assert.equal(f.label, 'Belum bisa dinilai');
  assert.ok(f.catatan.length > 0, 'harus menjelaskan kenapa belum bisa dinilai');
});

uji('catatan formasi menjelaskan dasar penilaiannya (blueprint §3D)', () => {
  // Boleh memberi kategori, tapi WAJIB menjelaskan dasarnya.
  const f = nilaiFormasi(bandingkanSkor(685, skorRef(672, 696, 740)), bandingkanSkor(685, skorRef(640, 660, 680)));
  assert.ok(f.catatan.length >= 1);
  for (const c of f.catatan) {
    assert.ok(c.length > 25, `catatan terlalu dangkal: ${c}`);
    assert.ok(/SOP|selisih|Zona/.test(c), `catatan harus menyebut dasar: ${c}`);
  }
});

// ================================================================= TREN
uji('INVARIAN: satu hasil try out TIDAK boleh disimpulkan sebagai tren', () => {
  // Blueprint §3E: "Perubahan status target tidak boleh dilakukan hanya
  // berdasarkan satu hasil try out yang belum tentu mewakili kemampuan siswa."
  for (const riwayat of [[], [{ skor: 700 }], [{ skor: 500 }, { skor: 700 }]]) {
    const t = nilaiTren(riwayat);
    assert.equal(t.arah, 'belum_cukup_data', `riwayat ${riwayat.length} titik`);
    assert.equal(t.deltaRataRata, null);
    assert.ok(/belum mewakili|Butuh minimal/.test(t.pesan));
  }
});

uji('tren naik/turun/stabil dibaca dari rata-rata delta', () => {
  assert.equal(nilaiTren([{ skor: 600 }, { skor: 630 }, { skor: 660 }]).arah, 'meningkat');
  assert.equal(nilaiTren([{ skor: 660 }, { skor: 630 }, { skor: 600 }]).arah, 'menurun');
  assert.equal(nilaiTren([{ skor: 640 }, { skor: 642 }, { skor: 641 }]).arah, 'stabil');
});

uji('kenaikan 100 poin pada percobaan terakhir tetap dihitung tren, bukan lonjakan diam', () => {
  const t = nilaiTren([{ skor: 600 }, { skor: 601 }, { skor: 701 }]);
  assert.equal(t.arah, 'meningkat');
  assert.equal(t.deltaTerakhir, 100);
});

uji('penurunan pada hasil terakhir selalu disebut walau tren keseluruhan naik', () => {
  // Ini kasus yang paling sering membuat tentor salah baca grafik.
  const t = nilaiTren([{ skor: 500 }, { skor: 600 }, { skor: 650 }, { skor: 620 }]);
  assert.equal(t.arah, 'meningkat');
  assert.ok(/terakhir turun/.test(t.pesan), 'penurunan terakhir harus disebut');
});

uji('titik data rusak dilewati, bukan membuat tren gagal', () => {
  const t = nilaiTren([{ skor: 600 }, { skor: null }, { skor: 'abc' }, { skor: 630 }, { skor: 660 }]);
  assert.equal(t.jumlahTitik, 3);
  assert.equal(t.arah, 'meningkat');
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
