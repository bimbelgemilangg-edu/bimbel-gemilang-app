import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Save, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { uploadElearningFile } from '../../../services/uploadService';
import { KANAL } from '../../../utils/kanalUang';
import { ambilNomorKwitansiBerikutnya, cetakKwitansi } from '../../../utils/kwitansi';

// 🔥 FIX BUG NYATA (zona waktu & transaksi "gaib"):
// (1) Tanggal default form ini sebelumnya pakai toISOString() (UTC) -- buat
//     pengguna WIB (UTC+7), selama jam 00.00-06.59 defaultnya kebaca
//     "KEMARIN", dan tepat di tanggal 1 awal bulan malah jatuh ke BULAN
//     LALU.
// (2) Tanggal juga bebas dipilih ke bulan lalu/depan -- padahal Riwayat &
//     Dashboard admin DIKUNCI ke bulan berjalan. Transaksi bertanggal di
//     luar bulan ini gak akan pernah muncul di halaman admin mana pun
//     (tapi tetap kehitung di kas Portal Owner) -- angka jadi gak cocok
//     dan admin bingung mencarinya. Sekarang tanggal dikunci ke bulan
//     berjalan (min/max di input + validasi saat simpan).
const tanggalLokalHariIni = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const batasBulanBerjalan = () => {
  const n = new Date();
  const bln = String(n.getMonth() + 1).padStart(2, '0');
  const hariTerakhir = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  return {
    awal: `${n.getFullYear()}-${bln}-01`,
    akhir: `${n.getFullYear()}-${bln}-${String(hariTerakhir).padStart(2, '0')}`,
    nama: n.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  };
};

const TransactionForm = () => {
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  // 🔥 BARU (modul rekonsiliasi & kwitansi): bukti transfer (nomor ref +
  // foto struk) dan opsi kwitansi bernomor buat pemasukan.
  const [refTransfer, setRefTransfer] = useState('');
  const [buktiFile, setBuktiFile] = useState(null);
  const [mintaKwitansi, setMintaKwitansi] = useState(false);

  const [form, setForm] = useState({
    type: 'Pemasukan',
    date: tanggalLokalHariIni(),
    category: '',
    amount: '',
    method: 'Tunai',
    note: ''
  });

  const showAlert = (msg, duration = 3000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  const getCategories = (type) => {
    if (type === 'Pemasukan') {
      return ['Penjualan Modul/Buku', 'Penjualan Seragam', 'Kantin/Snack', 'Hibah/Donasi', 'Lainnya'];
    }
    return ['Gaji Guru/Staf', 'Listrik & Air', 'Sewa Tempat', 'ATK & Perlengkapan', 'Internet/WiFi', 'Marketing/Iklan', 'Konsumsi', 'Maintenance/Service', 'Lainnya'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseInt(form.amount) <= 0) return showAlert('⚠️ Nominal harus diisi!');
    if (!form.category) return showAlert('⚠️ Pilih kategori!');
    // 🔥 BARU (modul rekonsiliasi): pemasukan via TRANSFER BANK wajib
    // punya jejak -- nomor referensi struk ATAU foto bukti transfer.
    // Tanpa ini, owner tidak punya bahan buat mencocokkan mutasi
    // rekening di tab Rekonsiliasi (aturan main: transfer = wajib bukti).
    if (form.type === 'Pemasukan' && form.method === 'Transfer' && !refTransfer.trim() && !buktiFile) {
      return showAlert('⛔ Pemasukan transfer WAJIB diisi No. Referensi struk ATAU upload foto bukti transfer -- buat dicocokkan owner dengan mutasi rekening.');
    }
    // 🔥 BARU: validasi tanggal harus di dalam bulan berjalan -- input type=date
    // memang sudah dibatasi min/max, tapi di beberapa browser (terutama mobile)
    // pengguna masih bisa mengetik tanggal manual di luar batas, jadi tetap
    // divalidasi di sini sebelum disimpan.
    const batas = batasBulanBerjalan();
    if (!form.date || form.date < batas.awal || form.date > batas.akhir) {
      return showAlert(`⛔ Tanggal harus di dalam ${batas.nama} -- riwayat admin dikunci ke bulan berjalan. Transaksi bertanggal bulan lain tidak akan muncul di Riwayat.`);
    }

    setLoading(true);
    try {
      // Upload foto bukti dulu (kalau ada) -- kalau gagal, transaksi tidak
      // disimpan dulu (lebih baik gagal jelas daripada tersimpan tanpa bukti).
      let buktiUrl = '';
      if (buktiFile) {
        const hasil = await uploadElearningFile(buktiFile, `bukti_transfer/${form.date.replace(/-/g, '')}`);
        if (hasil?.success && hasil.downloadURL) buktiUrl = hasil.downloadURL;
        else throw new Error('Upload bukti gagal: ' + (hasil?.error || 'tidak ada URL'));
      }

      // 🔥 BARU (modul kwitansi): pemasukan uang riil bisa langsung
      // diterbitkan kwitansi bernomor resmi (KWT-YYYYMM-NNN) -- nomor
      // dibuat dari urutan bulan TANGGAL TRANSAKSI dan tersimpan permanen
      // di dokumen (tab Kwitansi bisa mencetak ulangnya kapan saja).
      let noKwitansi = '';
      if (form.type === 'Pemasukan' && mintaKwitansi) {
        noKwitansi = await ambilNomorKwitansiBerikutnya(new Date(`${form.date}T00:00:00`));
      }

      await addDoc(collection(db, "finance_logs"), {
        type: form.type,
        date: form.date,
        category: form.category,
        amount: parseInt(form.amount),
        method: form.method,
        // 🔥 BARU (modul kanal uang): kanal EKSPLISIT -- Tunai masuk
        // brankas admin kasir, Transfer masuk rekening bank bimbel.
        // Semua penghitung saldo (dashboard admin & portal owner) kini
        // tahu persis pintu masuk/keluar uangnya.
        kanal: form.method === 'Transfer' ? KANAL.BANK : KANAL.KAS_ADMIN,
        note: form.note,
        refTransfer: refTransfer.trim(),
        buktiUrl,
        noKwitansi,
        // Pemasukan transfer masuk antrean rekonsiliasi owner (pending).
        statusRekonsiliasi: (form.type === 'Pemasukan' && form.method === 'Transfer') ? 'pending' : '',
        createdAt: serverTimestamp()
      });

      showAlert(`✅ ${form.type} berhasil dicatat!${noKwitansi ? ` Kwitansi ${noKwitansi} dibuat.` : ''}`);
      const dataKwitansi = noKwitansi ? {
        nomor: noKwitansi, tanggal: form.date,
        diterimaDari: form.note || 'Pembayaran Umum',
        jumlah: parseInt(form.amount), keperluan: form.category,
        metode: form.method, refTransfer: refTransfer.trim(),
      } : null;
      setForm(prev => ({
        ...prev,
        amount: '',
        note: '',
        category: ''
      }));
      setRefTransfer('');
      setBuktiFile(null);
      setMintaKwitansi(false);
      if (dataKwitansi && window.confirm(`Kwitansi ${noKwitansi} sudah dibuat. Cetak sekarang?`)) {
        cetakKwitansi(dataKwitansi);
      }
    } catch (error) {
      console.error(error);
      showAlert('❌ Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPemasukan = form.type === 'Pemasukan';
  const categories = getCategories(form.type);

  return (
    <div style={{maxWidth: 600}}>
      {alertMsg && (
        <div style={{
          background: '#1e293b', color: 'white', padding: '12px 20px',
          borderRadius: 10, marginBottom: 15, fontWeight: 'bold', fontSize: 13
        }}>{alertMsg}</div>
      )}

      <div style={styles.card}>
        <h3 style={styles.title}>
          {isPemasukan ? (
            <><ArrowUpCircle size={20} color="#10b981" /> Input Pemasukan</>
          ) : (
            <><ArrowDownCircle size={20} color="#ef4444" /> Input Pengeluaran</>
          )}
        </h3>
        <p style={styles.subtitle}>
          {isPemasukan 
            ? 'Catat pemasukan SELAIN SPP/Pendaftaran (contoh: jual buku, seragam, hibah).'
            : 'Catat semua uang keluar untuk operasional bimbel.'}
        </p>

        {/* Toggle Type */}
        <div style={styles.toggleRow}>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Pemasukan', category: ''}))}
            style={styles.toggleBtn(true, isPemasukan)}
          >
            <ArrowUpCircle size={16} /> Pemasukan
          </button>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Pengeluaran', category: ''}))}
            style={styles.toggleBtn(false, !isPemasukan)}
          >
            <ArrowDownCircle size={16} /> Pengeluaran
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tanggal */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tanggal <small style={{color: '#94a3b8', fontWeight: 600}}>(dikunci di {batasBulanBerjalan().nama})</small></label>
            <input 
              type="date" 
              value={form.date} 
              min={batasBulanBerjalan().awal}
              max={batasBulanBerjalan().akhir}
              onChange={e => setForm(prev => ({...prev, date: e.target.value}))} 
              style={styles.input} 
            />
          </div>

          {/* Kategori */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Kategori</label>
            <select 
              value={form.category} 
              onChange={e => setForm(prev => ({...prev, category: e.target.value}))} 
              style={styles.input}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nominal (Rp)</label>
            <input 
              type="number" 
              placeholder="Contoh: 150000" 
              value={form.amount} 
              onChange={e => setForm(prev => ({...prev, amount: e.target.value}))} 
              style={{
                ...styles.input, 
                fontSize: 18, 
                fontWeight: 'bold',
                color: isPemasukan ? '#10b981' : '#ef4444',
                borderColor: isPemasukan ? '#10b981' : '#ef4444'
              }} 
              required 
            />
          </div>

          {/* Metode */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Metode</label>
            <select 
              value={form.method} 
              onChange={e => setForm(prev => ({...prev, method: e.target.value}))} 
              style={styles.input}
            >
              <option value="Tunai">💵 Tunai</option>
              <option value="Transfer">💳 Transfer</option>
            </select>
            {/* 🔥 BARU (modul kanal uang): penegas "uang masuk lewat pintu
                mana" -- biar admin sadar sejak input bahwa tunai = brankas
                kasir, transfer = rekening bimbel (yang dicocokkan owner). */}
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 6 }}>
              {form.method === 'Tunai'
                ? '→ Uang masuk ke: 💵 KAS TUNAI DI ADMIN (brankas kasir). Diserahkan ke owner lewat "Tutup Kasir".'
                : '→ Uang masuk ke: 🏦 REKENING BANK BIMBEL. Wajib isi bukti di bawah supaya lolos rekonsiliasi owner.'}
            </div>
          </div>

          {/* 🔥 BARU (modul rekonsiliasi): detail bukti transfer. */}
          {form.method === 'Transfer' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 12px 2px', marginBottom: 14 }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  No. Referensi / Struk Transfer {isPemasukan && <span style={{ color: '#ef4444' }}>*wajib (bila tanpa foto)</span>}
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-20260926-889912"
                  value={refTransfer}
                  onChange={e => setRefTransfer(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Foto Struk / Bukti Transfer</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setBuktiFile(e.target.files?.[0] || null)}
                  style={{ ...styles.input, padding: 8, background: 'white' }}
                />
              </div>
              {isPemasukan && (
                <p style={{ margin: '0 0 10px', fontSize: 10.5, color: '#1e40af', lineHeight: 1.5 }}>
                  💡 Transaksi ini masuk antrean <b>Rekonsiliasi Owner</b> dengan status <i>Pending</i> sampai
                  owner mencocokkannya dengan mutasi rekening.
                </p>
              )}
            </div>
          )}

          {/* 🔥 BARU (modul kwitansi): opsi terbit kwitansi bernomor. */}
          {isPemasukan && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={mintaKwitansi} onChange={e => setMintaKwitansi(e.target.checked)} />
              🧾 Terbitkan kwitansi resmi bernomor (logo + terbilang) — bisa langsung dicetak
            </label>
          )}

          {/* Keterangan */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Keterangan</label>
            <textarea 
              placeholder={isPemasukan ? 'Contoh: Terjual 5 buku paket' : 'Contoh: Bayar listrik bulan ini'} 
              value={form.note} 
              onChange={e => setForm(prev => ({...prev, note: e.target.value}))} 
              style={{...styles.input, height: 80, resize: 'vertical'}} 
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.btnSubmit,
              background: isPemasukan ? '#10b981' : '#ef4444'
            }}
          >
            <Save size={16} /> {loading ? 'Menyimpan...' : `Simpan ${form.type}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  card: { background: 'white', padding: 24, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  title: { margin: '0 0 4px 0', fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 20 },
  toggleRow: { display: 'flex', gap: 8, marginBottom: 20 },
  toggleBtn: (isIncome, active) => ({
    flex: 1, padding: '10px', borderRadius: 10,
    border: active ? `2px solid ${isIncome ? '#10b981' : '#ef4444'}` : '1px solid #e2e8f0',
    background: active ? (isIncome ? '#f0fdf4' : '#fef2f2') : 'white',
    color: active ? (isIncome ? '#166534' : '#991b1b') : '#64748b',
    fontWeight: active ? 'bold' : '500', fontSize: 13,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: '0.2s'
  }),
  inputGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' },
  btnSubmit: { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};

export default TransactionForm;