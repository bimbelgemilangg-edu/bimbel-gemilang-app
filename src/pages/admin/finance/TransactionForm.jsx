import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { bolehCatatAdmin } from '../../../utils/keuanganAudit';
import { Save, ArrowUpCircle, ArrowDownCircle, Repeat, BookOpen, ExternalLink } from 'lucide-react';
import { uploadElearningFile } from '../../../services/uploadService';
import { KANAL } from '../../../utils/kanalUang';
import { ambilNomorKwitansiBerikutnya } from '../../../utils/kwitansi';
import InputRupiah from '../../../components/InputRupiah';

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
  const navigate = useNavigate();
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
    note: '',
    tujuanKanal: 'bankBimbel'
  });

  const showAlert = (msg, duration = 3000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  const getCategories = (type) => {
    if (type === 'Pemasukan') {
      return ['Penjualan Modul/Buku', 'Penjualan Seragam', 'Kantin/Snack', 'Hibah/Donasi', 'Lainnya'];
    }
    if (type === 'Transfer') {
      return [
        'Setor Kas ke Mas Bima (Owner)',
        'Setor Tunai ke Bank BSI',
        'Setor Kas dari Brankas',
        'Lainnya'
      ];
    }
    return ['Gaji Guru/Staf', 'Listrik & Air', 'Sewa Tempat', 'ATK & Perlengkapan', 'Internet/WiFi', 'Marketing/Iklan', 'Konsumsi', 'Maintenance/Service', 'Lainnya'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseInt(form.amount) <= 0) return showAlert('⚠️ Nominal harus diisi!');
    if (!form.category) return showAlert('⚠️ Pilih kategori!');

    const isTransfer = form.type === 'Transfer';

    // 🛡 18 Okt (kebijakan owner): pengeluaran BCA bukan hak catat admin.
    const cek = bolehCatatAdmin(form.type, form.method);
    if (!cek.boleh) return showAlert(`⚠️ ${cek.alasan}`);

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
        const folder = isTransfer ? 'bukti_setor_kas' : 'bukti_transfer';
        const hasil = await uploadElearningFile(buktiFile, `${folder}/${form.date.replace(/-/g, '')}`);
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

      const logPayload = {
        type: form.type,
        date: form.date,
        category: form.category,
        amount: parseInt(form.amount),
        method: isTransfer ? 'Tunai' : form.method,
        // Kanal eksplisit: Tunai & Setor Kas berasal dari Kas Admin, Transfer masuk Bank Bimbel
        kanal: isTransfer ? KANAL.KAS_ADMIN : (form.method === 'Transfer' ? KANAL.BANK : KANAL.KAS_ADMIN),
        note: form.note + (refTransfer.trim() ? ` [Rek: ${refTransfer.trim()}]` : ''),
        dicatatOleh: 'admin',
        buktiUrl,
        createdAt: serverTimestamp()
      };

      if (isTransfer) {
        logPayload.kanalDari = KANAL.KAS_ADMIN;
        logPayload.kanalKe = form.tujuanKanal || KANAL.BANK;
        logPayload.refTransfer = refTransfer.trim() || 'Setor Kas Brankas Admin';
      } else {
        logPayload.refTransfer = refTransfer.trim();
        logPayload.noKwitansi = noKwitansi;
        logPayload.statusRekonsiliasi = (form.type === 'Pemasukan' && form.method === 'Transfer') ? 'pending' : '';
      }

      await addDoc(collection(db, "finance_logs"), logPayload);

      showAlert(`✅ ${isTransfer ? 'Setor Kas ke Owner / Bank' : form.type} berhasil dicatat!${noKwitansi ? ` Kwitansi ${noKwitansi} dibuat.` : ''}`);
      setForm(prev => ({
        ...prev,
        amount: '',
        note: '',
        category: isTransfer ? 'Setor Kas ke Mas Bima (Owner)' : ''
      }));
      setRefTransfer('');
      setBuktiFile(null);
      setMintaKwitansi(false);
      // Kwitansi tersimpan di database & riwayat transaksi
    } catch (error) {
      console.error(error);
      showAlert('❌ Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPemasukan = form.type === 'Pemasukan';
  const isTransfer = form.type === 'Transfer';
  const isPengeluaran = form.type === 'Pengeluaran';
  const categories = getCategories(form.type);

  return (
    <div style={{maxWidth: 600}}>
      {alertMsg && (
        <div style={{
          background: '#1e293b', color: 'white', padding: '12px 20px',
          borderRadius: 10, marginBottom: 15, fontWeight: 'bold', fontSize: 13
        }}>{alertMsg}</div>
      )}

      {/* BANNER PANDUAN: JANGAN CATAT SPP / ENGLISH COURSE DI SINI */}
      <div style={{
        background: '#eff6ff',
        border: '1.5px solid #93c5fd',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <strong style={{ color: '#1e40af', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            💡 Mau catat SPP, Perpanjangan, atau Tambah Paket English Course?
          </strong>
          <span style={{ fontSize: 11.5, color: '#1e3a8a', lineHeight: 1.5, display: 'block' }}>
            Jangan dicatat lewat form ini (karena ini hanya kas operasional umum). 
            Buka menu <strong>Daftar Siswa &gt; Keuangan Siswa</strong> agar status paket &amp; masa aktif siswa tercatat otomatis!
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
          }}
        >
          <BookOpen size={14} /> Ke Daftar Siswa
        </button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>
          {isPemasukan ? (
            <><ArrowUpCircle size={20} color="#10b981" /> Input Pemasukan</>
          ) : isTransfer ? (
            <><Repeat size={20} color="#f59e0b" /> Setor Kas ke Owner / Bank BSI</>
          ) : (
            <><ArrowDownCircle size={20} color="#ef4444" /> Input Pengeluaran</>
          )}
        </h3>
        <p style={styles.subtitle}>
          {isPemasukan 
            ? 'Catat pemasukan SELAIN SPP/Pendaftaran (contoh: jual buku, seragam, hibah).'
            : isTransfer
            ? 'Pindahkan uang fisik dari brankas kasir admin ke Owner (Mas Bima) atau setor ke BSI. Uang keluar dari brankas, tapi BUKAN biaya operasional (laba bersih bimbel tetap aman & utuh).'
            : 'Catat semua uang keluar untuk operasional bimbel.'}
        </p>

        {/* Toggle Type */}
        <div style={styles.toggleRow}>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Pemasukan', category: '', method: 'Tunai'}))}
            style={styles.toggleBtn('Pemasukan', isPemasukan)}
          >
            <ArrowUpCircle size={15} /> Pemasukan
          </button>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Pengeluaran', category: '', method: 'Tunai'}))}
            style={styles.toggleBtn('Pengeluaran', isPengeluaran)}
          >
            <ArrowDownCircle size={15} /> Pengeluaran
          </button>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Transfer', category: 'Setor Kas ke Mas Bima (Owner)', method: 'Tunai', tujuanKanal: 'bankBimbel'}))}
            style={styles.toggleBtn('Transfer', isTransfer)}
          >
            <Repeat size={15} /> 🔁 Setor Kas
          </button>
        </div>

        {/* KOTAK PANDUAN KHUSUS SETOR KAS */}
        {isTransfer && (
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', color: '#b45309', fontSize: 13, marginBottom: 4 }}>
              <Repeat size={16} /> Pindah Kantong Internal (Kas Brankas &rarr; Rekening BSI / Owner)
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#92400e', lineHeight: 1.55 }}>
              Gunakan tombol ini jika Mas Bima mengambil uang dari brankas kasir untuk disetor ke bank atau diamankan. 
              <b> Saldo brankas fisik admin akan berkurang</b>, tetapi <b>laba bersih operasional bimbel TIDAK berkurang</b> (karena uangnya hanya pindah tempat penyimpanan).
            </p>
          </div>
        )}

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
            <InputRupiah 
              placeholder="Contoh: 1.000.000" 
              value={form.amount} 
              onChange={e => setForm(prev => ({...prev, amount: e.target.value}))} 
              style={{
                ...styles.input, 
                fontSize: 18, 
                fontWeight: 'bold',
                color: isPemasukan ? '#10b981' : isTransfer ? '#b45309' : '#ef4444',
                borderColor: isPemasukan ? '#10b981' : isTransfer ? '#f59e0b' : '#ef4444'
              }} 
              required 
            />
          </div>

          {/* Metode atau Tujuan Setoran */}
          {isTransfer ? (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tujuan Setoran Uang Kas</label>
              <select 
                value={form.tujuanKanal || 'bankBimbel'} 
                onChange={e => setForm(prev => ({...prev, tujuanKanal: e.target.value}))} 
                style={styles.input}
              >
                <option value="bankBimbel">🏦 Disetor ke Rekening Bank BSI Bimbel (Rek: 7373265521)</option>
                <option value="kasOwner">👑 Diserahkan Langsung ke Mas Bima (Owner)</option>
              </select>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 5 }}>
                💵 Sumber uang: <b>Kas Tunai Fisik di Brankas Admin (Laci Kasir)</b>
              </div>
            </div>
          ) : (
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
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginTop: 6 }}>
                {form.method === 'Tunai'
                  ? '→ Uang masuk ke: 💵 KAS TUNAI DI ADMIN (brankas kasir). Diserahkan ke owner lewat tombol Setor Kas.'
                  : '→ Uang masuk ke: 🏦 REKENING BANK BIMBEL. Wajib isi bukti di bawah supaya lolos rekonsiliasi owner.'}
              </div>
            </div>
          )}

          {/* Bukti Setor Kas Opsional */}
          {isTransfer && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Foto Struk Setoran / Slip Bank (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setBuktiFile(e.target.files?.[0] || null)}
                style={{ ...styles.input, padding: 8, background: 'white' }}
              />
            </div>
          )}

          {/* 🔥 BARU (modul rekonsiliasi): detail bukti transfer untuk pemasukan. */}
          {!isTransfer && form.method === 'Transfer' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 12px 2px', marginBottom: 14 }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  🏦 Nama Pemilik Rekening Pengirim (di Mutasi Bank) <span style={{ color: '#ef4444' }}>*WAJIB DIISI</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BCA a.n. Yoni Widyawati (Ibu Arya) / Bobby Lazuardi"
                  value={refTransfer}
                  onChange={e => setRefTransfer(e.target.value)}
                  style={styles.input}
                />
                <div style={{ fontSize: 10, color: '#1e40af', marginTop: 4 }}>
                  💡 Tuliskan nama pemilik rekening bank persis seperti di bukti transfer, agar Owner langsung cocok saat audit mutasi BCA.
                </div>
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

          {/* Keterangan */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Keterangan</label>
            <textarea 
              placeholder={isPemasukan ? 'Contoh: Terjual 5 buku paket' : isTransfer ? 'Contoh: Diserahkan ke Mas Bima untuk disimpan di rekening BSI' : 'Contoh: Bayar listrik bulan ini'} 
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
              background: isPemasukan ? '#10b981' : isTransfer ? '#f59e0b' : '#ef4444'
            }}
          >
            <Save size={16} /> {loading ? 'Menyimpan...' : isTransfer ? 'Simpan Setor Kas (Pindah Kantong)' : `Simpan ${form.type}`}
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
  toggleBtn: (mode, active) => {
    let color = '#10b981';
    let bg = '#f0fdf4';
    let text = '#166534';
    if (mode === 'Pengeluaran') {
      color = '#ef4444';
      bg = '#fef2f2';
      text = '#991b1b';
    } else if (mode === 'Transfer') {
      color = '#f59e0b';
      bg = '#fffbeb';
      text = '#b45309';
    }
    return {
      flex: 1, padding: '10px 8px', borderRadius: 10,
      border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
      background: active ? bg : 'white',
      color: active ? text : '#64748b',
      fontWeight: active ? 'bold' : '500', fontSize: 12,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      transition: '0.2s', textAlign: 'center'
    };
  },
  inputGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' },
  btnSubmit: { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};

export default TransactionForm;