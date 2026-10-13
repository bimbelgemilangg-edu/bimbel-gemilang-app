// src/components/DialogKoreksiTransaksi.jsx
// 🔥 BARU (hotfix 2026-10-13): pintu "Koreksi Nominal/Metode Transaksi" --
// satu-satunya jalan yang SAH buat kasus diskon / salah nominal / salah
// metode pada SATU baris buku besar (finance_logs), termasuk kategori
// "Perpanjangan Paket" yang sebelumnya diblokir total dari edit transaksi.
// Bedanya dari "Koreksi Data" siswa: pintu ini menulis BUKU BESAR + DATA
// SISWA dalam SATU writeBatch (atomik) pakai hitungan kaskade dari
// utils/koreksiNominalTransaksi.js, dan WAJIB PIN Owner + alasan (jejak
// audit di koreksi_data_log). Data siswa dibaca ULANG dari server sesaat
// sebelum simpan (bukan dari state halaman) supaya gak ada lagi koreksi
// yang menimpa perubahan dari tab lain.
import React, { useState, useEffect } from 'react';
import { doc, getDoc, getDocs, query, where, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Save, ShieldAlert, Receipt } from 'lucide-react';
import {
  hitungKaskadeKoreksiNominal, validasiAlasanKoreksi, METODE_VALID, METODE_UANG,
} from '../utils/koreksiNominalTransaksi';

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  box: {
    background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460,
    maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 18px 50px rgba(15,23,42,0.35)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderBottom: '1px solid #e2e8f0',
  },
  title: { margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 },
  close: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 },
  body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  warning: {
    background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10,
    padding: '10px 12px', fontSize: 11.5, color: '#78350f', lineHeight: 1.5,
  },
  label: { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' },
  input: {
    width: '100%', padding: '9px 10px', border: '1.5px solid #cbd5e1', borderRadius: 8,
    fontSize: 13, boxSizing: 'border-box',
  },
  methodRow: { display: 'flex', gap: 8 },
  methodBtn: (aktif) => ({
    flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
    border: aktif ? '2px solid #10b981' : '1.5px solid #cbd5e1',
    background: aktif ? '#ecfdf5' : '#fff', color: aktif ? '#047857' : '#475569',
  }),
  preview: {
    background: '#f1f5f9', borderRadius: 10, padding: '10px 12px',
    fontSize: 11.5, color: '#334155', lineHeight: 1.6,
  },
  error: { color: '#dc2626', fontSize: 11, fontWeight: 700, marginTop: 4 },
  footer: { display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid #e2e8f0' },
  btnBatal: {
    padding: '9px 14px', borderRadius: 8, border: '1.5px solid #cbd5e1', background: '#fff',
    fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer',
  },
  btnSimpan: {
    padding: '9px 14px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff',
    fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  },
};

const DialogKoreksiTransaksi = ({ log, siswa, siswaId, namaSiswa, onClose, onSukses }) => {
  // 🔥 Siswa bisa dilewat langsung (halaman keuangan siswa sudah punya) atau
  // dicari sendiri dari kode unik di log (halaman Riwayat Transaksi cuma
  // pegang kode) -- biar pintu yang sama dipakai dua halaman tanpa duplikat.
  const [siswaAuto, setSiswaAuto] = useState(null);
  const [siswaDocId, setSiswaDocId] = useState(siswaId || '');
  useEffect(() => {
    if (siswaId) { setSiswaDocId(siswaId); return; }
    if (!log?.studentId) return;
    getDocs(query(collection(db, 'students'), where('studentId', '==', log.studentId)))
      .then((snap) => {
        if (!snap.empty) { setSiswaAuto(snap.docs[0].data()); setSiswaDocId(snap.docs[0].id); }
      })
      .catch(() => {});
  }, [log, siswaId]);
  const siswaPakai = siswa || siswaAuto;
  const [nominal, setNominal] = useState(String(log?.amount ?? ''));
  const [metode, setMetode] = useState(log?.method || 'Tunai');
  const [pin, setPin] = useState('');
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ownerPin, setOwnerPin] = useState('');
  const [pinBelumDiatur, setPinBelumDiatur] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'global_config')).then((snap) => {
      if (snap.exists() && snap.data().ownerPin) {
        setOwnerPin(snap.data().ownerPin);
        setPinBelumDiatur(false);
      } else {
        setOwnerPin('');
        setPinBelumDiatur(true);
      }
    }).catch(() => { setOwnerPin(''); setPinBelumDiatur(true); });
  }, []);

  if (!log) return null;

  // Pratinjau kaskade (hitung murni; error ditampilkan ramah, bukan crash)
  let pratinjau = null;
  let errorPratinjau = '';
  try {
    pratinjau = hitungKaskadeKoreksiNominal({
      log,
      siswa: siswaPakai || { totalTagihan: 0, totalBayar: 0 },
      nominalBaru: nominal, metodeBaru: metode,
    });
  } catch (e) {
    errorPratinjau = e.message;
  }

  const simpan = async () => {
    setError('');
    const alasanErr = validasiAlasanKoreksi(alasan);
    if (alasanErr) return setError(alasanErr);
    if (pinBelumDiatur || !ownerPin) return setError('⚠️ PIN Owner belum diatur. Atur dulu di halaman Pengaturan.');
    if (pin !== ownerPin) return setError('⛔ PIN Owner salah.');
    setBusy(true);
    try {
      // 🔥 Baca ULANG log & siswa dari server sesaat sebelum menulis --
      // koreksi dihitung dari data TERBARU, bukan state halaman yang bisa
      // sudah basi (akar keluhan "data berubah sendiri / gak berubah").
      const logSegar = await getDoc(doc(db, 'finance_logs', log.id));
      if (!logSegar.exists()) throw new Error('Transaksinya sudah tidak ada (mungkin sudah dihapus dari tab lain).');
      if (!siswaDocId) throw new Error('Siswa pemilik transaksi tidak ditemukan.');
      const siswaSegar = await getDoc(doc(db, 'students', siswaDocId));
      if (!siswaSegar.exists()) throw new Error('Data siswa tidak ditemukan.');
      const kaskade = hitungKaskadeKoreksiNominal({
        log: { id: logSegar.id, ...logSegar.data() },
        siswa: siswaSegar.data(),
        nominalBaru: nominal,
        metodeBaru: metode,
      });

      const batch = writeBatch(db);
      batch.update(doc(db, 'finance_logs', log.id), kaskade.updateLog);
      batch.update(doc(db, 'students', siswaDocId), kaskade.updateSiswa);
      // Jejak audit SATU PAKET dengan tulisannya (atomik): gak mungkin ada
      // koreksi transaksi tanpa jejak "sebelum-sesudah-alasan".
      batch.set(doc(collection(db, 'koreksi_data_log')), {
        jenis: 'koreksi_transaksi',
        logId: log.id,
        studentId: siswaSegar.data().studentId || siswaDocId,
        namaSiswa: namaSiswa || siswaSegar.data().nama || '',
        kategori: log.category || '',
        sebelum: { amount: kaskade.nominalLama, method: kaskade.metodeLama },
        sesudah: { amount: kaskade.updateLog.amount, method: kaskade.updateLog.method },
        dampakSiswa: kaskade.updateSiswa,
        alasan: alasan.trim(),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      onSukses?.();
    } catch (e) {
      setError('❌ Gagal menyimpan koreksi: ' + e.message);
    }
    setBusy(false);
  };

  return (
    <div style={styles.overlay} onClick={() => !busy && onClose()}>
      <div style={styles.box} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}><Receipt size={18} /> Koreksi Transaksi (diskon / salah input)</h3>
          <button style={styles.close} onClick={() => !busy && onClose()}><X size={18} /></button>
        </div>
        <div style={styles.body}>
          <div style={styles.warning}>
            <ShieldAlert size={13} style={{ verticalAlign: -2 }} /> Pintu ini mengoreksi <strong>SATU baris buku besar</strong> dan
            otomatis menyeragamkan total siswa (atomik). Nominal kwitansi ikut berubah saat dicetak ulang.
            {log.category === 'Perpanjangan Paket' && ' Durasi & tanggal selesai paket TIDAK berubah.'}
          </div>
          <div>
            <span style={styles.label}>Transaksi</span>
            <div style={{ fontSize: 12, color: '#334155' }}>
              {log.date} • {log.category} • <strong>Rp {(Math.round(Number(log.amount) || 0)).toLocaleString()}</strong> • {log.method}
              {log.noKwitansi ? ` • 🧾 ${log.noKwitansi}` : ''}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{log.note || ''}</div>
          </div>
          <div>
            <label style={styles.label}>Nominal benar (Rp)</label>
            <input style={styles.input} type="number" min="0" value={nominal} onChange={(e) => setNominal(e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Metode benar</label>
            <div style={styles.methodRow}>
              {METODE_VALID.map((m) => (
                <button key={m} type="button" style={styles.methodBtn(metode === m)} onClick={() => setMetode(m)}>
                  {m === 'Tunai' ? '💵' : m === 'Transfer' ? '💳' : '📋'} {m}
                </button>
              ))}
            </div>
            {!METODE_UANG.includes(metode) && (
              <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 4 }}>Cicilan = uang BELUM diterima (total Dibayar ikut turun).</div>
            )}
          </div>
          {pratinjau && siswaPakai && (
            <div style={styles.preview}>
              <strong>Dampak ke data siswa (dihitung otomatis):</strong><br />
              Total Tagihan → Rp {pratinjau.updateSiswa.totalTagihan.toLocaleString()}
              {' • '}Total Dibayar → Rp {pratinjau.updateSiswa.totalBayar.toLocaleString()}
              {pratinjau.catatan.map((c, i) => <span key={i}><br />• {c}</span>)}
            </div>
          )}
          {errorPratinjau && <div style={styles.error}>⚠️ {errorPratinjau}</div>}
          <div>
            <label style={styles.label}>PIN Owner</label>
            <input style={styles.input} type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Wajib" />
          </div>
          <div>
            <label style={styles.label}>Alasan koreksi <span style={{ color: '#ef4444' }}>*wajib</span></label>
            <textarea
              style={{ ...styles.input, minHeight: 54, resize: 'vertical' }}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: perpanjangan didiskon jadi 900rb sesuai persetujuan owner"
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
        </div>
        <div style={styles.footer}>
          <button style={styles.btnBatal} onClick={() => !busy && onClose()}>Batal</button>
          <button style={styles.btnSimpan} onClick={simpan} disabled={busy}>
            {busy ? '⏳' : <><Save size={15} /> Simpan Koreksi</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogKoreksiTransaksi;
