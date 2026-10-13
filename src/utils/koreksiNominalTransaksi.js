// src/utils/koreksiNominalTransaksi.js
// 🔥 BARU (hotfix kasus nyata 2026-10-13: "perpanjangan didiskon jadi 900rb,
// dikoreksi kok gak berubah"): sebelumnya sistem punya TIGA pintu uang yang
// saling kunci -- "Koreksi Data" siswa SENGAJA tidak menyentuh finance_logs,
// edit transaksi MEMBLOKIR kategori "Perpanjangan Paket", dan hapus transaksi
// membalikkan nominal ASLI (bukan nominal diskon). Akibatnya kasus diskon /
// salah nominal perpanjangan TIDAK PUNYA pintu sama sekali: admin menempuh
// jalan memutar (koreksi siswa manual) dan data jadi setengah-setengah
// (ringkasan vs buku besar vs kwitansi berbeda-beda).
// Util ini adalah SATU sumber kebenaran hitungan untuk pintu baru "Koreksi
// Nominal/Metode Transaksi": given log transaksi + data siswa TERBARU,
// hitung tepat apa yang harus ditulis di finance_logs DAN di students supaya
// kedua buku tetap cocok. Murni (pure) & diuji di tests/koreksiNominalTransaksi.test.mjs.
export const METODE_UANG = ['Tunai', 'Transfer']; // uang benar-benar diterima
export const METODE_VALID = [...METODE_UANG, 'Cicilan']; // komitmen = belum ada uang

// Kategori log yang nominalnya MEMBENTUK tagihan siswa (bukan sekadar pembayaran).
export const KATEGORI_PEMBEDA_TAGIHAN = ['Pendaftaran', 'Perpanjangan Paket'];

const adalahUang = (metode) => METODE_UANG.includes(metode);

// Alasan koreksi WAJIB (jejak audit). Kembalikan pesan error, atau null kalau sah.
export function validasiAlasanKoreksi(alasan) {
  const bersih = String(alasan || '').trim();
  if (!bersih) return 'Alasan koreksi WAJIB diisi (buat jejak audit).';
  if (bersih.length < 5) return 'Alasan koreksi terlalu pendek -- tulis yang jelas, mis. "diskon saudara sesuai persetujuan owner".';
  return null;
}

// Hitung kaskade koreksi nominal/metode satu transaksi Pemasukan.
// Melempar Error (pesan ramah admin) kalau input/kombinasi tidak sah.
export function hitungKaskadeKoreksiNominal({ log, siswa, nominalBaru, metodeBaru }) {
  if (!log || !log.id) throw new Error('Data transaksi kosong.');
  if (log.type !== 'Pemasukan') throw new Error('Hanya transaksi tipe "Pemasukan" yang bisa dikoreksi dari sini.');
  if (!siswa) throw new Error('Data siswa tidak ditemukan untuk transaksi ini.');
  const nominal = Math.round(Number(nominalBaru));
  if (!Number.isFinite(nominal) || nominal < 0) throw new Error('Nominal baru tidak sah (harus angka >= 0).');
  if (!METODE_VALID.includes(metodeBaru)) throw new Error('Metode baru tidak sah (pilih Tunai/Transfer/Cicilan).');

  const nominalLama = Math.round(Number(log.amount) || 0);
  const metodeLama = log.method || 'Tunai';
  if (!METODE_VALID.includes(metodeLama)) throw new Error('Metode lama transaksi tidak dikenali: ' + metodeLama);

  const deltaNominal = nominal - nominalLama;
  // Selisih "uang benar-benar diterima": pindah metode Tunai/Transfer <-> Cicilan
  // mengubah apakah nominalnya dihitung sebagai uang masuk siswa.
  const deltaUang = (adalahUang(metodeBaru) ? nominal : 0) - (adalahUang(metodeLama) ? nominalLama : 0);
  const deltaTagihan = KATEGORI_PEMBEDA_TAGIHAN.includes(log.category) ? deltaNominal : 0;

  const tagihanLama = Math.round(Number(siswa.totalTagihan) || 0);
  const bayarLama = Math.round(Number(siswa.totalBayar) || 0);
  const tagihanBaru = tagihanLama + deltaTagihan;
  const bayarBaru = bayarLama + deltaUang;

  if (tagihanBaru < 0 || bayarBaru < 0) {
    throw new Error('Hasil koreksi membuat total minus -- cek lagi nominalnya.');
  }
  if (tagihanBaru < bayarBaru) {
    throw new Error(`Hasil koreksi membuat Total Tagihan (Rp ${tagihanBaru.toLocaleString()}) lebih kecil dari Dibayar (Rp ${bayarBaru.toLocaleString()}) -- perbaiki dulu transaksi pembayaran lainnya.`);
  }

  const catatan = [];
  if (log.category === 'Perpanjangan Paket') {
    catatan.push('Durasi & tanggal selesai paket TIDAK diubah (koreksi diskon/nominal hanya menyentuh uang).');
  }
  if (adalahUang(metodeLama) && !adalahUang(metodeBaru)) {
    catatan.push('Metode jadi Cicilan: nominal dianggap BELUM diterima, total Dibayar ikut turun.');
  }
  if (!adalahUang(metodeLama) && adalahUang(metodeBaru)) {
    catatan.push('Metode jadi Tunai/Transfer: nominal dianggap uang diterima, total Dibayar ikut naik.');
  }
  if (log.noKwitansi) {
    catatan.push(`Kwitansi ${log.noKwitansi} otomatis tercetak ulang dengan nominal baru lewat tombol Cetak Ulang.`);
  }

  return {
    nominalLama,
    metodeLama,
    updateLog: { amount: nominal, method: metodeBaru },
    updateSiswa: { totalTagihan: tagihanBaru, totalBayar: bayarBaru },
    deltaTagihan,
    deltaUang,
    catatan,
  };
}

// Deteksi "dua buku tidak cocok": selisih antara buku besar (finance_logs
// tipe Pemasukan yang uangnya benar-benar diterima) dan field totalBayar siswa.
// Nol = sinkron. Dipakai halaman keuangan siswa buat memasang banner peringatan.
export function selisihRingkasanVsLedger({ logs = [], totalBayar = 0 }) {
  const uangLedger = logs
    .filter((l) => l && l.type !== 'Transfer' && l.method !== 'Cicilan')
    .reduce((s, l) => s + (Math.round(Number(l.amount) || 0)), 0);
  return uangLedger - (Math.round(Number(totalBayar) || 0));
}
