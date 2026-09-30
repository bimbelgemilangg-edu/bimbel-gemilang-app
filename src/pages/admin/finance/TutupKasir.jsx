// src/pages/admin/finance/TutupKasir.jsx
// 🔥 BARU (permintaan owner: "Fitur Tutup Kasir / Setor Kas -- tombol di
// akhir giliran/minggu untuk mengunci total penerimaan fisik yang wajib
// diserahkan ke owner"):
//
// Alur:
// 1. Sistem menghitung UANG TUNAI FISIK DI BRANKAS ADMIN (kanal kasAdmin)
//    dari seluruh finance_logs -- masuk tunai dikurangi keluar tunai
//    dikurangi setoran yang sudah pernah dilakukan. Angka inilah yang
//    seharusnya bisa DIHITUNG FISIK oleh kasir.
// 2. Admin mengisi jumlah yang disetorkan (default = saldo brankas,
//    bisa dikoreksi kalau hitungan fisik beda -- selisihnya harus
//    dijelaskan di catatan, jadi jejak audit).
// 3. Submit -> SATU writeBatch: dokumen `setoran_kas` (arsip periode)
//    + finance_logs type 'Transfer' (uang PINDAH kanal kasAdmin ->
//    kasOwner; BUKAN pemasukan/pengeluaran -- tidak mengubah total uang,
//    tidak masuk omzet/belanja) dengan statusRekonsiliasi 'pending'.
// 4. Bukti setor bisa dicetak (logo + tanda tangan) dan owner
//    memverifikasi penerimaannya di Portal Owner -> tab Rekonsiliasi.
//
// Privasi tetap terjaga: halaman ini hanya menampilkan angka KAS TUNAI
// ADMIN (brankas kasir) -- saldo bank, kas owner, omzet akumulasi, dan
// laba bersih TIDAK pernah dihitung/ditampilkan di sini.
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import {
  collection, query, onSnapshot, doc, writeBatch, serverTimestamp, orderBy, limit,
} from 'firebase/firestore';
import { Lock, Printer, History, Wallet, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { normalisasiLog, hitungSaldo, tanggalLokalHariIni } from '../owner/keuanganOwnerUtils';
import { cetakBuktiSetorKas, rp, tanggalPanjang } from '../../../utils/kwitansi';

const compactTanggal = (str) => String(str || '').replace(/-/g, '');

const TutupKasir = () => {
  const [logs, setLogs] = useState([]);
  const [setoranList, setSetoranList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jumlahSetor, setJumlahSetor] = useState('');
  const [catatan, setCatatan] = useState('');
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState(null); // bukti setoran terakhir (buat dicetak ulang)

  // ===== DATA LIVE =====
  // finance_logs: seluruh riwayat (tanpa filter) -- tapi yang DIPAKAI dan
  // DITAMPILKAN cuma kantong kasAdmin. Setoran lama (type 'Transfer')
  // otomatis mengurangi saldo brankas lewat hitungSaldo.
  useEffect(() => {
    const unsubLogs = onSnapshot(collection(db, 'finance_logs'), (snap) => {
      setLogs(snap.docs.map(normalisasiLog));
      setLoading(false);
    }, () => setLoading(false));

    // Arsip setoran (buat riwayat + periode berjalan). orderBy satu
    // field saja -- tidak butuh composite index.
    const unsubSetoran = onSnapshot(
      query(collection(db, 'setoran_kas'), orderBy('tanggal', 'desc'), limit(50)),
      (snap) => setSetoranList(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );

    return () => { unsubLogs(); unsubSetoran(); };
  }, []);

  // ===== HITUNGAN =====
  const saldo = useMemo(() => hitungSaldo(logs), [logs]);
  const saldoBrankas = saldo.kasAdmin; // uang tunai fisik di tangan admin

  // Periode berjalan = sejak setoran terakhir (tanggal setoran terakhir
  // ikut periode BARU -- setoran itu sendiri sudah memindahkan uangnya,
  // jadi transaksi tunai di tanggal yang sama setelah setor tetap kena
  // hitung periode baru).
  const setoranTerakhir = setoranList[0] || null;
  const periodeAwal = setoranTerakhir?.tanggal || null;

  const periode = useMemo(() => {
    const rentang = logs.filter(l =>
      l.type !== 'Transfer' && l.kanal === 'kasAdmin' &&
      (!periodeAwal || (l.date && l.date >= periodeAwal))
    );
    let masuk = 0, keluar = 0, nMasuk = 0, nKeluar = 0;
    for (const l of rentang) {
      if (l.type === 'Pemasukan') { masuk += l.amount; nMasuk += 1; }
      else { keluar += l.amount; nKeluar += 1; }
    }
    return { masuk, keluar, nMasuk, nKeluar };
  }, [logs, periodeAwal]);

  // Status verifikasi tiap setoran dibaca dari finance_logs pasangannya
  // (satu sumber kebenaran: yang di-update owner adalah log Transfer).
  const statusSetoran = useMemo(() => {
    const map = {};
    for (const l of logs) {
      if (l.type === 'Transfer' && l.setoranId) map[l.setoranId] = l.statusRekonsiliasi || 'pending';
    }
    return map;
  }, [logs]);

  const defaultSetor = Math.max(saldoBrankas, 0);
  const nilaiSetor = jumlahSetor === '' ? defaultSetor : (parseInt(jumlahSetor) || 0);
  const selisihFisik = defaultSetor - nilaiSetor; // >0 = uang fisik kurang

  // ===== SUBMIT SETORAN =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nilaiSetor <= 0) return alert('⚠️ Jumlah setor harus lebih dari 0. Kalau brankas kosong, tidak perlu setor.');
    if (nilaiSetor > defaultSetor) {
      const lanjut = window.confirm(
        `Jumlah setor (${rp(nilaiSetor)}) LEBIH BESAR dari catatan sistem (${rp(defaultSetor)}).\n\n` +
        `Ini berarti ada uang tunai yang tidak tercatat sebagai transaksi. Lanjutkan? (selisih akan terlihat oleh owner di rekonsiliasi)`
      );
      if (!lanjut) return;
    } else if (selisihFisik > 0 && !catatan.trim()) {
      return alert(`⚠️ Uang fisik (${rp(nilaiSetor)}) lebih KECIL dari catatan sistem (${rp(defaultSetor)}) — selisih ${rp(selisihFisik)}.\n\nWajib tulis penjelasan di kolom Catatan (uang hilang? transaksi belum dicatat?) sebelum setor.`);
    }

    setBusy(true);
    try {
      const today = tanggalLokalHariIni();
      // Nomor bukti setor: SK-YYYYMMDD-urut (hitung dari arsip hari ini).
      const prefix = `SK-${compactTanggal(today)}-`;
      const sudahHariIni = setoranList.filter(s => String(s.nomor || '').startsWith(prefix)).length;
      const nomor = `${prefix}${String(sudahHariIni + 1).padStart(2, '0')}`;

      const batch = writeBatch(db);
      const setoranRef = doc(collection(db, 'setoran_kas'));
      const logRef = doc(collection(db, 'finance_logs'));

      batch.set(setoranRef, {
        nomor,
        tanggal: today,
        periodeAwal: periodeAwal || (logs.length ? 'awal usaha' : today),
        periodeAkhir: today,
        tunaiMasuk: periode.masuk,
        tunaiKeluar: periode.keluar,
        jumlahSetor: nilaiSetor,
        saldoSistem: defaultSetor,
        catatan: catatan.trim(),
        statusVerifikasi: 'pending',
        createdAt: serverTimestamp(),
      });

      // Log Transfer = uang PINDAH kantong (kasAdmin -> kasOwner), bukan
      // pemasukan/pengeluaran. method 'Tunai' karena fisiknya uang tunai.
      batch.set(logRef, {
        type: 'Transfer',
        date: today,
        category: 'Setor Kas ke Owner',
        amount: nilaiSetor,
        method: 'Tunai',
        kanalDari: 'kasAdmin',
        kanalKe: 'kasOwner',
        statusRekonsiliasi: 'pending',
        setoranId: setoranRef.id,
        note: `Tutup kasir ${nomor}${selisihFisik !== 0 ? ` (selisih fisik ${rp(-selisihFisik)} vs sistem)` : ''}${catatan.trim() ? ` - ${catatan.trim()}` : ''}`,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      const bukti = {
        nomor, tanggal: today,
        periodeAwal: periodeAwal || 'awal usaha', periodeAkhir: today,
        tunaiMasuk: periode.masuk, tunaiKeluar: periode.keluar,
        jumlahSetor: nilaiSetor, catatan: catatan.trim(),
      };
      setSukses(bukti);
      setJumlahSetor('');
      setCatatan('');
      if (window.confirm('✅ Setor kas tercatat!\n\nUang pindah dari brankas admin ke kas owner (menunggu verifikasi owner).\n\nCetak bukti setor sekarang?')) {
        cetakBuktiSetorKas(bukti);
      }
    } catch (err) {
      alert('❌ Gagal menyimpan setoran: ' + err.message);
    }
    setBusy(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Memuat data kas...</div>;

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={20} color="#b91c1c" /> Tutup Kasir / Setor Kas
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6 }}>
        Kunci penerimaan uang tunai dan serahkan ke owner. Setelah disetor, saldo brankas admin berkurang otomatis
        dan uang tercatat pindah ke <b>Kas Owner</b> — bukan pemasukan/pengeluaran baru. Owner memverifikasi di
        Portal Owner → tab ✅ Rekonsiliasi.
      </p>

      {sukses && (
        <div style={styles.suksesBox}>
          <CheckCircle2 size={18} color="#16a34a" />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, color: '#166534' }}>Setoran {sukses.nomor} tercatat — {rp(sukses.jumlahSetor)}</b>
            <div style={{ fontSize: 11, color: '#15803d' }}>Menunggu verifikasi owner. Cetak ulang bukti kapan saja dari riwayat di bawah.</div>
          </div>
          <button onClick={() => cetakBuktiSetorKas(sukses)} style={styles.btnCetakKecil}><Printer size={12} /> Cetak Bukti</button>
          <button onClick={() => setSukses(null)} style={styles.btnTutupKecil}>✕</button>
        </div>
      )}

      {/* ===== KARTU POSISI BRANKAS ===== */}
      <div style={styles.cardBrankas}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Wallet size={20} color="white" />
          <div>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Uang Tunai di Brankas Admin (menurut sistem)
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, margin: '2px 0' }}>{rp(saldoBrankas)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 11.5, opacity: 0.92 }}>
          <span>Periode berjalan sejak: <b>{periodeAwal ? tanggalPanjang(periodeAwal) : 'awal usaha'}</b></span>
          <span>Tunai masuk: <b>{rp(periode.masuk)}</b> ({periode.nMasuk} trx)</span>
          <span>Tunai keluar: <b>{rp(periode.keluar)}</b> ({periode.nKeluar} trx)</span>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 10.5, opacity: 0.8, lineHeight: 1.5 }}>
          💡 Hitung uang fisik di brankas dulu — seharusnya SAMA dengan angka di atas. Kalau beda, setor sesuai
          hitungan fisik dan wajib tulis penjelasan selisihnya di catatan (owner akan melihatnya).
        </p>
      </div>

      {/* ===== FORM SETOR ===== */}
      <form onSubmit={handleSubmit} style={styles.cardForm}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b' }}>🔐 Setor Kas ke Owner</h3>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Jumlah Disetorkan (Rp) — default = saldo brankas</label>
          <input
            type="number"
            value={jumlahSetor}
            placeholder={String(defaultSetor)}
            onChange={e => setJumlahSetor(e.target.value)}
            style={{ ...styles.input, fontSize: 18, fontWeight: 800, color: '#b91c1c' }}
            min={0}
          />
        </div>

        {selisihFisik !== 0 && jumlahSetor !== '' && (
          <div style={selisihFisik > 0 ? styles.selisihMerah : styles.selisihBiru}>
            {selisihFisik > 0 ? (
              <><AlertTriangle size={14} /> Fisik KURANG {rp(selisihFisik)} dari catatan sistem — wajib tulis penjelasan di catatan.</>
            ) : (
              <>Fisik LEBIH {rp(-selisihFisik)} dari catatan sistem — akan terlihat oleh owner di rekonsiliasi.</>
            )}
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Catatan (wajib kalau ada selisih fisik)</label>
          <textarea
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder="Contoh: selisih Rp 10.000 karena kembalian belum dicatat / setor sebagian, sisa besok"
            style={{ ...styles.input, height: 70, resize: 'vertical' }}
          />
        </div>

        <button type="submit" disabled={busy || defaultSetor <= 0 && jumlahSetor === ''} style={styles.btnSetor(busy)}>
          {busy ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
          {busy ? 'Menyimpan...' : `Kunci & Setor ${rp(nilaiSetor)}`}
        </button>
        {defaultSetor <= 0 && (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', textAlign: 'center' }}>
            Brankas kosong menurut sistem — tidak ada yang perlu disetor. 🎉
          </p>
        )}
      </form>

      {/* ===== RIWAYAT SETORAN ===== */}
      <div style={styles.cardRiwayat}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="#64748b" /> Riwayat Setoran Kas
        </h3>
        {setoranList.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, padding: '10px 0' }}>
            Belum pernah ada setoran. Setoran pertama periodenya dihitung sejak awal usaha.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {setoranList.map(s => {
              const status = statusSetoran[s.id] || s.statusVerifikasi || 'pending';
              return (
                <div key={s.id} style={styles.riwayatItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>
                      {s.nomor} <span style={{ fontWeight: 600, color: '#64748b' }}>• {tanggalPanjang(s.tanggal)}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      Periode: {s.periodeAwal === 'awal usaha' ? 'awal usaha' : tanggalPanjang(s.periodeAwal)} s.d. {tanggalPanjang(s.periodeAkhir)}
                      {s.catatan ? ` • catatan: ${s.catatan}` : ''}
                    </div>
                  </div>
                  <b style={{ fontSize: 13.5, color: '#b91c1c', whiteSpace: 'nowrap' }}>{rp(s.jumlahSetor)}</b>
                  <span style={styles.badgeStatus(status)}>
                    {status === 'verified' ? '✅ Diverifikasi Owner' : '⏳ Menunggu Owner'}
                  </span>
                  <button
                    onClick={() => cetakBuktiSetorKas({
                      nomor: s.nomor, tanggal: s.tanggal, periodeAwal: s.periodeAwal, periodeAkhir: s.periodeAkhir,
                      tunaiMasuk: s.tunaiMasuk, tunaiKeluar: s.tunaiKeluar, jumlahSetor: s.jumlahSetor, catatan: s.catatan,
                    })}
                    style={styles.btnCetakKecil}
                    title="Cetak ulang bukti setor"
                  >
                    <Printer size={12} /> Bukti
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
};

const styles = {
  suksesBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1.5px solid #22c55e', borderRadius: 12, padding: '12px 14px', marginBottom: 14 },
  btnCetakKecil: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' },
  btnTutupKecil: { padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 800 },

  cardBrankas: { background: 'linear-gradient(135deg,#1e293b,#334155)', color: 'white', borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  cardForm: { background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 20, marginBottom: 14 },
  cardRiwayat: { background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 20 },

  inputGroup: { marginBottom: 12 },
  label: { display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' },

  selisihMerah: { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '9px 12px', fontSize: 11.5, fontWeight: 700, marginBottom: 12, lineHeight: 1.5 },
  selisihBiru: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 10, padding: '9px 12px', fontSize: 11.5, fontWeight: 700, marginBottom: 12, lineHeight: 1.5 },

  btnSetor: (busy) => ({
    width: '100%', padding: 14, background: busy ? '#94a3b8' : '#b91c1c', color: 'white', border: 'none',
    borderRadius: 10, fontWeight: 900, fontSize: 14, cursor: busy ? 'wait' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(185,28,28,0.25)',
  }),

  riwayatItem: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px' },
  badgeStatus: (status) => ({
    fontSize: 9.5, fontWeight: 800, padding: '4px 9px', borderRadius: 20, whiteSpace: 'nowrap',
    background: status === 'verified' ? '#dcfce7' : '#fef3c7',
    color: status === 'verified' ? '#15803d' : '#b45309',
  }),
};

export default TutupKasir;
