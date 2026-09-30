// src/pages/admin/owner/PanelRekonsiliasi.jsx
// 🔥 BARU (permintaan owner: "Fitur Checklist Rekonsiliasi -- menu khusus
// bagi Owner untuk mencocokkan mutasi bank dengan bukti bayar yang
// diinput admin (status: Pending -> Verified)"):
//
// Dua jenis baris yang WAJIB dicocokkan owner:
// 1. 💳 PEMASUKAN TRANSFER BANK -- admin mencatat "siswa bayar lewat
//    transfer". Owner harus cek MUTASI REKENING: uangnya beneran masuk?
//    Bukti struk/nomor referensi yang diinput admin ada di baris ini.
// 2. 🔁 SETORAN KAS ADMIN -- admin klik "Tutup Kasir". Owner harus cek
//    uang FISIK-nya beneran diterima. Bukti setor bisa dicetak admin.
//
// Status: 'pending' (default, menunggu) -> 'verified' (owner sudah cek).
// Verifikasi = updateDoc satu field di finance_logs (statusRekonsiliasi)
// -- panel ini live dari onSnapshot shell OwnerFinance, jadi begitu
// di-klik, semua tampilan ikut terupdate tanpa refresh.
import React, { useState, useMemo } from 'react';
import { db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  ShieldCheck, Clock, ExternalLink, AlertTriangle, CheckCircle2, Undo2, FileImage,
} from 'lucide-react';
import { tanggalLokalHariIni } from './keuanganOwnerUtils';
import { rp, tanggalPanjang } from '../../../utils/kwitansi';

const PanelRekonsiliasi = ({ logs, isMobile }) => {
  const [filterStatus, setFilterStatus] = useState('pending');
  const [busyId, setBusyId] = useState('');

  // Kandidat rekonsiliasi: pemasukan via transfer bank + setoran kas.
  const items = useMemo(() => logs
    .filter(l =>
      (l.type === 'Pemasukan' && l.methodAsli === 'Transfer') ||
      l.type === 'Transfer'
    )
    .map(l => ({ ...l, _status: l.statusRekonsiliasi === 'verified' ? 'verified' : 'pending' }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || (b.createdAtMs - a.createdAtMs)),
  [logs]);

  const stat = useMemo(() => {
    const pending = items.filter(i => i._status === 'pending');
    const verified = items.filter(i => i._status === 'verified');
    const tanpaBukti = pending.filter(i => i.type === 'Pemasukan' && !i.refTransfer && !i.buktiUrl);
    return {
      nPending: pending.length,
      nominalPending: pending.reduce((s, i) => s + i.amount, 0),
      nVerified: verified.length,
      nominalVerified: verified.reduce((s, i) => s + i.amount, 0),
      nTanpaBukti: tanpaBukti.length,
    };
  }, [items]);

  const ditampilkan = useMemo(() =>
    filterStatus === 'semua' ? items : items.filter(i => i._status === filterStatus),
  [items, filterStatus]);

  const setStatus = async (item, status) => {
    setBusyId(item.id);
    try {
      await updateDoc(doc(db, 'finance_logs', item.id), {
        statusRekonsiliasi: status,
        tanggalVerifikasi: status === 'verified' ? tanggalLokalHariIni() : '',
      });
    } catch (e) {
      alert('❌ Gagal update status: ' + e.message);
    }
    setBusyId('');
  };

  const verifikasi = (item) => {
    const label = item.type === 'Transfer'
      ? `Konfirmasi sudah MENERIMA uang fisik setor kas ${rp(item.amount)} dari admin?`
      : `Konfirmasi transfer ${rp(item.amount)} (${item.namaSiswa || item.note || item.category}) BENAR-BENAR MASUK di mutasi rekening?`;
    if (window.confirm(`${label}\n\nPastikan sudah mengecek rekening/kas sebelum memverifikasi.`)) setStatus(item, 'verified');
  };

  return (
    <div>
      {/* ===== STATISTIK ===== */}
      <div style={styles.statGrid(isMobile)}>
        <div style={styles.statCard('#fffbeb', '#d97706')}>
          <Clock size={18} color="#d97706" />
          <span style={styles.statLabel}>Menunggu Dicek (Pending)</span>
          <h3 style={{ ...styles.statValue, color: '#d97706' }}>{stat.nPending} item</h3>
          <span style={styles.statSub}>Total nominal: {rp(stat.nominalPending)}</span>
        </div>
        <div style={styles.statCard('#f0fdf4', '#16a34a')}>
          <ShieldCheck size={18} color="#16a34a" />
          <span style={styles.statLabel}>Sudah Diverifikasi</span>
          <h3 style={{ ...styles.statValue, color: '#16a34a' }}>{stat.nVerified} item</h3>
          <span style={styles.statSub}>Total nominal: {rp(stat.nominalVerified)}</span>
        </div>
        <div style={styles.statCard(stat.nTanpaBukti ? '#fef2f2' : '#f8fafc', stat.nTanpaBukti ? '#dc2626' : '#94a3b8')}>
          <AlertTriangle size={18} color={stat.nTanpaBukti ? '#dc2626' : '#94a3b8'} />
          <span style={styles.statLabel}>Transfer Tanpa Bukti/Ref</span>
          <h3 style={{ ...styles.statValue, color: stat.nTanpaBukti ? '#dc2626' : '#64748b' }}>{stat.nTanpaBukti} item</h3>
          <span style={styles.statSub}>
            {stat.nTanpaBukti ? 'Admin mencatat transfer tapi tidak mengisi nomor struk/foto — tanyakan bukti sebelum verifikasi!' : 'Semua transfer pending punya bukti. 👍'}
          </span>
        </div>
      </div>

      <p style={styles.ket}>
        ✅ <b>Cara pakai:</b> buka mutasi rekening bank (untuk 💳 transfer masuk) atau hitung uang fisik (untuk 🔁 setor kas),
        cocokkan dengan bukti di tiap baris, lalu klik <b>Verifikasi</b>. Baris yang belum cocok dibiarkan pending —
        status ini TIDAK mengubah angka saldo di mana pun, murni checklist kejujuran pembukuan.
      </p>

      {/* ===== FILTER ===== */}
      <div style={styles.filterRow}>
        {[
          { id: 'pending', label: `⏳ Pending (${stat.nPending})` },
          { id: 'verified', label: `✅ Verified (${stat.nVerified})` },
          { id: 'semua', label: `📋 Semua (${items.length})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterStatus(f.id)} style={styles.filterBtn(filterStatus === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ===== DAFTAR ===== */}
      {ditampilkan.length === 0 ? (
        <div style={styles.kosong}>
          {filterStatus === 'pending' ? '🎉 Tidak ada yang menunggu diverifikasi. Pembukuan bersih!' : 'Belum ada item.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ditampilkan.map(item => (
            <div key={item.id} style={styles.row(item._status)}>
              <div style={styles.ikon(item.type)}>
                {item.type === 'Transfer' ? '🔁' : '💳'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>
                  {item.type === 'Transfer' ? 'Setor Kas Admin → Kas Owner' : `Transfer Masuk — ${item.namaSiswa || item.category}`}
                  <span style={styles.badgeStatus(item._status)}>
                    {item._status === 'verified' ? `✅ VERIFIED ${item.tanggalVerifikasi ? `(${item.tanggalVerifikasi})` : ''}` : '⏳ PENDING'}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                  {tanggalPanjang(item.date)} • {item.note || item.category}
                  {item.noKwitansi ? ` • kwitansi ${item.noKwitansi}` : ''}
                </div>
                {/* Bukti-bukti */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                  {item.refTransfer && (
                    <span style={styles.buktiChip}>🔢 Ref/No. Struk: <b>{item.refTransfer}</b></span>
                  )}
                  {item.buktiUrl && (
                    <a href={item.buktiUrl} target="_blank" rel="noopener noreferrer" style={styles.buktiLink}>
                      <FileImage size={11} /> Lihat Foto Bukti <ExternalLink size={10} />
                    </a>
                  )}
                  {item.type === 'Pemasukan' && !item.refTransfer && !item.buktiUrl && (
                    <span style={styles.buktiChipMerah}>⚠️ Tanpa bukti — minta struk ke admin/siswa</span>
                  )}
                </div>
              </div>
              <b style={{ fontSize: 14, color: item.type === 'Transfer' ? '#b45309' : '#059669', whiteSpace: 'nowrap' }}>
                {rp(item.amount)}
              </b>
              <div style={{ display: 'flex', gap: 6 }}>
                {item._status === 'pending' ? (
                  <button onClick={() => verifikasi(item)} disabled={busyId === item.id} style={styles.btnVerif(busyId === item.id)}>
                    <CheckCircle2 size={13} /> Verifikasi
                  </button>
                ) : (
                  <button onClick={() => setStatus(item, 'pending')} disabled={busyId === item.id} style={styles.btnBatal} title="Kembalikan ke pending (kalau ternyata belum cocok)">
                    <Undo2 size={13} /> Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  statGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }),
  statCard: (bg, color) => ({ background: bg, border: `1px solid ${color}33`, borderRadius: 14, padding: 16 }),
  statLabel: { display: 'block', fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  statValue: { margin: '4px 0 2px', fontSize: 19 },
  statSub: { fontSize: 10.5, color: '#64748b' },

  ket: { fontSize: 11.5, color: '#475569', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 14px', lineHeight: 1.7, margin: '0 0 12px' },

  filterRow: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  filterBtn: (aktif) => ({
    padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: 800, fontSize: 11.5,
    border: aktif ? '1.5px solid #1e293b' : '1px solid #e2e8f0',
    background: aktif ? '#1e293b' : 'white', color: aktif ? 'white' : '#64748b',
  }),

  kosong: { textAlign: 'center', padding: 34, fontSize: 12.5, color: '#94a3b8', background: 'white', borderRadius: 14, border: '1px solid #f1f5f9' },

  row: (status) => ({
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    background: 'white', border: status === 'verified' ? '1px solid #bbf7d0' : '1.5px solid #fde68a',
    borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  }),
  ikon: (type) => ({
    width: 34, height: 34, borderRadius: 10, flexShrink: 0, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: type === 'Transfer' ? '#fef3c7' : '#dbeafe',
  }),
  badgeStatus: (status) => ({
    marginLeft: 8, fontSize: 8.5, fontWeight: 900, padding: '3px 8px', borderRadius: 20, verticalAlign: 'middle',
    background: status === 'verified' ? '#dcfce7' : '#fef3c7',
    color: status === 'verified' ? '#15803d' : '#b45309', letterSpacing: 0.5,
  }),
  buktiChip: { fontSize: 10, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 9px' },
  buktiChipMerah: { fontSize: 10, fontWeight: 700, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '3px 9px' },
  buktiLink: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '3px 9px', textDecoration: 'none' },

  btnVerif: (busy) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 13px',
    background: busy ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', borderRadius: 9,
    cursor: busy ? 'wait' : 'pointer', fontWeight: 800, fontSize: 11.5, whiteSpace: 'nowrap',
  }),
  btnBatal: {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 11px',
    background: 'white', color: '#b45309', border: '1px solid #fcd34d', borderRadius: 9,
    cursor: 'pointer', fontWeight: 800, fontSize: 11, whiteSpace: 'nowrap',
  },
};

export default PanelRekonsiliasi;
