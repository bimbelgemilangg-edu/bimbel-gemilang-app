// src/utils/uangTeks.js
// ============================================================
// SATU SUMBER kebenaran untuk mengubah nominal rupiah menjadi teks
// yang dicetak: `terbilang` (kata-kata) dan `rp` / `rpFmt` (angka
// berformat). Fungsi di berkas ini SEMUA murni -- tidak mengimpor
// Firebase, React, atau apa pun -- sehingga bisa diuji langsung di
// Node oleh tests/kwitansi.test.mjs.
//
// KENAPA DIPISAH DARI src/utils/kwitansi.js
// `kwitansi.js` mengimpor `db` dari '../firebase' di baris atas untuk
// mengambil nomor kwitansi berikutnya. Akibatnya seluruh berkas itu --
// termasuk `terbilang` yang tercetak di kwitansi resmi -- TIDAK BISA
// diimpor di Node, dan README mencatatnya sebagai utang: "belum bisa
// diuji karena berkasnya meng-impor Firebase". Logika murninya
// dipindah ke sini; `kwitansi.js` me-re-export semuanya sehingga
// TIDAK ADA pemanggil lama yang perlu diubah.
//
// BUG YANG DIPERBAIKI (audit 2026-10-05, terverifikasi dengan
// menjalankan kode lama):
//
// 1. `terbilang` memakai `Math.abs(parseInt(n) || 0)`, jadi TANDA MINUS
//    HILANG: terbilang(-500000) -> "Lima Ratus Ribu". Padahal `rp` di
//    berkas yang sama mempertahankan tandanya ("Rp -500.000"). Di satu
//    lembar kwitansi yang sama, angka dan hurufnya bisa saling
//    bertentangan -- dan kwitansi adalah dokumen yang dicetak,
//    ditandatangani, lalu diarsipkan orang tua siswa.
//
// 2. `parseInt` pada NUMBER bekerja lewat STRING. JavaScript memakai
//    notasi eksponen mulai 1e21, jadi parseInt(1e21) === parseInt("1e+21")
//    === 1. Nominal besar tercetak "Satu rupiah" / "Rp 1".
//
// 3. Nominal tak-hingga dicetak sebagai angka yang TERLIHAT SAH:
//    terbilang(Infinity) -> "Nol" dan rp(Infinity) -> "Rp 0". Kalau ada
//    pembagian nol atau field yang hilang, kasir mendapat kwitansi "Rp 0"
//    yang tampak normal dan menyerahkannya ke orang tua. Nominal rusak
//    harus TERLIHAT rusak, bukan menyamar jadi nol.
//
// 4. `rp` memotong (parseInt) sementara `rpFmt` di keuanganOwnerUtils
//    membulatkan (Math.round) -- dua formatter untuk mata uang yang sama
//    di satu aplikasi. Nominal pecahan (muncul dari amortisasi paket dan
//    perhitungan laba) tercetak BEDA di kwitansi dan di layar owner:
//    rp(250000.6) -> "Rp 250.000" tapi rpFmt(250000.6) -> "Rp 250.001".
//    Perilaku `rpFmt` yang membulatkan sudah dikunci test
//    (tests/keuangan.test.mjs:579), jadi `rp` yang disamakan ke sana.
// ============================================================

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh',
  'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Ditampilkan ketika nominal tidak bisa dipertanggungjawabkan. Sengaja
// BUKAN "Nol"/"Rp 0": nol adalah angka yang sah dan bisa dicetak sebagai
// kwitansi yang tampak benar. String ini jelas-jelas rusak di mata kasir.
export const TEKS_NOMINAL_TIDAK_SAH = '(nominal tidak sah)';
export const RP_NOMINAL_TIDAK_SAH = 'Rp —';

// Angka yang boleh dipakai sebagai nominal. String numerik tetap diterima
// (data lama dari Firestore sering menyimpan amount sebagai teks), tapi
// string campur seperti "12abc" DITOLAK -- sebelumnya parseInt mengambil
// "12"-nya saja dan mencetak "Dua Belas" tanpa mengeluh.
const POLA_ANGKA_STRING = /^[+-]?\d+(?:\.\d+)?$/;

/**
 * Koersi nominal rupiah -- satu-satunya tempat di seluruh aplikasi yang
 * memutuskan "nilai ini jadi angka berapa, dan apakah ia sah".
 *
 * @returns {{sah: boolean, nilai: number}} nilai = integer (dibulatkan,
 *   bukan dipotong, supaya cocok dengan rpFmt yang sudah dikunci test).
 *   sah = false berarti nominal tidak boleh dicetak.
 */
export function angkaRupiah(n) {
  // null/undefined/'' dipertahankan sebagai 0: banyak pemanggil mengoper
  // field yang belum termuat, dan kontrak lama untuk itu adalah nol.
  if (n === null || n === undefined || n === '') return { sah: true, nilai: 0 };

  if (typeof n === 'number') {
    if (!Number.isFinite(n)) return { sah: false, nilai: 0 };
    return { sah: true, nilai: Math.round(n) };
  }

  if (typeof n === 'string') {
    const t = n.trim();
    if (t === '') return { sah: true, nilai: 0 };
    if (!POLA_ANGKA_STRING.test(t)) return { sah: false, nilai: 0 };
    const v = Number(t);
    if (!Number.isFinite(v)) return { sah: false, nilai: 0 };
    return { sah: true, nilai: Math.round(v) };
  }

  // boolean, objek, array: bukan nominal.
  return { sah: false, nilai: 0 };
}

// Terbilang untuk nilai NON-NEGATIF. Logika intinya TIDAK DIUBAH dari
// versi lama -- ia sudah benar, dibuktikan dengan mengadu 3.035 nilai ke
// implementasi referensi independen (0 selisih). Yang diperbaiki hanya
// koersi masuknya dan penanganan tanda, di `terbilang` bawah.
function terbilangPositif(angka) {
  if (angka === 0) return 'Nol';
  if (angka < 12) return SATUAN[angka];
  if (angka < 20) return `${terbilangPositif(angka - 10)} Belas`;
  if (angka < 100) return `${terbilangPositif(Math.floor(angka / 10))} Puluh${angka % 10 ? ' ' + terbilangPositif(angka % 10) : ''}`;
  if (angka < 200) return `Seratus${angka - 100 ? ' ' + terbilangPositif(angka - 100) : ''}`;
  if (angka < 1000) return `${terbilangPositif(Math.floor(angka / 100))} Ratus${angka % 100 ? ' ' + terbilangPositif(angka % 100) : ''}`;
  if (angka < 2000) return `Seribu${angka - 1000 ? ' ' + terbilangPositif(angka - 1000) : ''}`;
  if (angka < 1000000) return `${terbilangPositif(Math.floor(angka / 1000))} Ribu${angka % 1000 ? ' ' + terbilangPositif(angka % 1000) : ''}`;
  if (angka < 1000000000) return `${terbilangPositif(Math.floor(angka / 1000000))} Juta${angka % 1000000 ? ' ' + terbilangPositif(angka % 1000000) : ''}`;
  // 🔥 Tingkat di atas Miliar DITAMBAHKAN (2026-10-05). Kode lama berhenti
  // di Miliar, sehingga 1e21 menghasilkan "Seribu Miliar Miliar" -- kata
  // "Miliar" dobel karena cabang terakhir memanggil dirinya lagi untuk
  // nilai yang masih di atas 1e9. Nominal sebesar itu tidak akan pernah
  // muncul di kwitansi bimbel, tapi sebelum perbaikan koersi di atas,
  // 1e21 tercetak "Satu" (parseInt lewat notasi eksponen), jadi jalur ini
  // memang bisa tersentuh data rusak dan harus benar, bukan lucu.
  if (angka < 1e12) return `${terbilangPositif(Math.floor(angka / 1000000000))} Miliar${angka % 1000000000 ? ' ' + terbilangPositif(angka % 1000000000) : ''}`;
  if (angka < 1e15) return `${terbilangPositif(Math.floor(angka / 1e12))} Triliun${angka % 1e12 ? ' ' + terbilangPositif(angka % 1e12) : ''}`;
  if (angka < 1e18) return `${terbilangPositif(Math.floor(angka / 1e15))} Kuadriliun${angka % 1e15 ? ' ' + terbilangPositif(angka % 1e15) : ''}`;
  return `${terbilangPositif(Math.floor(angka / 1e18))} Kuintiliun${angka % 1e18 ? ' ' + terbilangPositif(angka % 1e18) : ''}`;
}

/**
 * Nominal -> kata-kata rupiah, untuk dicetak di kwitansi.
 * Tanda minus DIPERTAHANKAN (prefiks "Minus") supaya kata-kata tidak
 * pernah bertentangan dengan angka `rp` di lembar yang sama.
 */
export function terbilang(n) {
  const { sah, nilai } = angkaRupiah(n);
  if (!sah) {
    console.error('[uangTeks] terbilang menolak nominal tidak sah:', n);
    return TEKS_NOMINAL_TIDAK_SAH;
  }
  if (nilai < 0) return `Minus ${terbilangPositif(-nilai)}`;
  return terbilangPositif(nilai);
}

/** Nominal -> "Rp 1.500.000". Membulatkan, sama seperti rpFmt. */
export function rp(n) {
  const { sah, nilai } = angkaRupiah(n);
  if (!sah) {
    console.error('[uangTeks] rp menolak nominal tidak sah:', n);
    return RP_NOMINAL_TIDAK_SAH;
  }
  return `Rp ${nilai.toLocaleString('id-ID')}`;
}

/** Sama seperti rp tanpa prefiks -- dipakai header tabel & ekspor PDF. */
export function angkaFmt(n) {
  const { sah, nilai } = angkaRupiah(n);
  if (!sah) return RP_NOMINAL_TIDAK_SAH.slice(3);
  return nilai.toLocaleString('id-ID');
}

/**
 * Alias yang dipertahankan agar keuanganOwnerUtils.js dan seluruh
 * pemanggil lamanya tidak perlu berubah. Perilakunya identik dengan rp.
 */
export const rpFmt = rp;

// ---------- TANGGAL & NOMOR KWITANSI (murni, ikut dipindah) ----------

export const tanggalPanjang = (tanggalStr) => {
  if (!tanggalStr) return new Date().toLocaleDateString('id-ID');
  const [y, m, d] = String(tanggalStr).split('-').map(Number);
  if (!y || !m || !d) return tanggalStr;
  return `${d} ${NAMA_BULAN[m - 1]} ${y}`;
};

export const prefixKwitansiBulan = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `KWT-${y}${m}-`;
};

export default {
  angkaRupiah,
  terbilang,
  rp,
  rpFmt,
  angkaFmt,
  tanggalPanjang,
  prefixKwitansiBulan,
  TEKS_NOMINAL_TIDAK_SAH,
  RP_NOMINAL_TIDAK_SAH,
};
