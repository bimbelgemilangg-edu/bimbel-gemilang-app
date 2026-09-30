// src/pages/admin/finance/RiwayatKwitansi.jsx
// 🔥 BARU (permintaan owner: "cetak kwitansi dan riwayat kwitansi otomatis
// ada logo jelas... riwayat kwitansi dicetak dengan nomor jelas"):
// Halaman khusus KWITANSI buat admin kasir.
//
// Isinya:
// - Pemilih bulan BEBAS (kwitansi lama harus tetap bisa dicetak ulang --
//   beda dari Riwayat transaksi yang dikunci bulan berjalan; kwitansi
//   cuma menampilkan bukti pembayaran per transaksi, BUKAN saldo/omzet
//   akumulasi, jadi aman dilihat kasir).
// - Semua PEMASUKAN RIIL bulan terpilih (uang beneran diterima: Tunai /
//   Transfer / data lama). Komitmen Cicilan SENGAJA tidak masuk -- uang
//   belum diterima, kwitansi baru terbit saat tiap cicilan dibayar.
// - Nomor kwitansi otomatis (KWT-YYYYMM-001) tersimpan permanen di
//   dokumen finance_logs -- transaksi lama yang belum punya nomor bisa
//   dibuatkan nomor dari sini (satu-satu atau borongan).
// - Cetak per kwitansi (logo + terbilang + tanda tangan) dan Cetak
//   Daftar satu bulan penuh (rekap bernomor, siap diarsip/dicek owner).
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Receipt, Printer, ListOrdered, Hash, Loader2 } from 'lucide-react';
import {
  ambilNomorKwitansiBerikutnya, cetakKwitansi, kwitansiDariLog,
  cetakRingkasanKwitansi, rp, tanggalPanjang,
} from '../../../utils/kwitansi';

// Key bulan lokal 'YYYY-MM' (BUKAN toISOString/UTC -- sama seperti
// halaman keuangan lain, biar awal bulan gak geser sehari).
const keyBulanIni = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const labelBulan = (key) => {
  const [y, m] = String(key).split('-').map(Number);
  if (!y || !m) return key;
  return `${NAMA_BULAN[m - 1]} ${y}`;
};

const RiwayatKwitansi = () => {
  const [bulan, setBulan] = useState(keyBulanIni());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prosesNomorId, setProsesNomorId] = useState('');
  const [prosesMassal, setProsesMassal] = useState(false);

  // Query rentang tanggal satu field -- tidak butuh composite index.
  useEffect(() => {
    const [y, m] = bulan.split('-').map(Number);
    const awal = `${bulan}-01`;
    const bulanDepan = new Date(y, m, 1); // m sudah 1-based = bulan berikutnya
    const akhir = `${bulanDepan.getFullYear()}-${String(bulanDepan.getMonth() + 1).padStart(2, '0')}-01`;
    const q = query(
      collection(db, 'finance_logs'),
      where('date', '>=', awal),
      where('date', '<', akhir),
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // Kwitansi = bukti uang MASUK yang BENERAN diterima. Setor kas
        // (type 'Transfer') punya bukti sendiri (Bukti Setor Kas di tab
        // Tutup Kasir), dan komitmen Cicilan belum ada uangnya.
        .filter(l => l.type === 'Pemasukan' && l.method !== 'Cicilan')
        .sort((a, b) => {
          const dc = String(b.date || '').localeCompare(String(a.date || ''));
          if (dc !== 0) return dc;
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });
      setLogs(rows);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [bulan]);

  const total = useMemo(
    () => logs.reduce((s, l) => s + (parseInt(l.amount || 0) || 0), 0),
    [logs]
  );
  const belumBernomor = useMemo(() => logs.filter(l => !l.noKwitansi), [logs]);

  // Buatkan nomor kwitansi untuk SATU transaksi lama. Nomor mengikuti
  // BULAN TRANSAKSINYA (bukan bulan sekarang) supaya urutan arsip rapi.
  const buatkanNomor = async (log) => {
    setProsesNomorId(log.id);
    try {
      const tanggalTransaksi = log.date ? new Date(`${log.date}T00:00:00`) : new Date();
      const nomor = await ambilNomorKwitansiBerikutnya(tanggalTransaksi);
      await updateDoc(doc(db, 'finance_logs', log.id), { noKwitansi: nomor });
    } catch (e) {
      alert('❌ Gagal membuat nomor: ' + e.message);
    }
    setProsesNomorId('');
  };

  // Borongan: urut SATU-SATU (bukan Promise.all) -- nomor berikutnya
  // dihitung dari dokumen yang sudah tersimpan, jadi harus sekuensial
  // biar tidak kembar.
  const buatkanNomorSemua = async () => {
    if (belumBernomor.length === 0) return;
    if (!window.confirm(`Buatkan nomor kwitansi untuk ${belumBernomor.length} transaksi bulan ${labelBulan(bulan)} yang belum bernomor?`)) return;
    setProsesMassal(true);
    try {
      // Urutkan dari transaksi paling tua dulu supaya nomor urutnya
      // mengikuti kronologi (yang bayar duluan dapat nomor kecil).
      const urut = [...belumBernomor].sort((a, b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        ((a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
      );
      for (const log of urut) {
        const tanggalTransaksi = log.date ? new Date(`${log.date}T00:00:00`) : new Date();
        const nomor = await ambilNomorKwitansiBerikutnya(tanggalTransaksi);
        await updateDoc(doc(db, 'finance_logs', log.id), { noKwitansi: nomor });
      }
    } catch (e) {
      alert('❌ Sebagian gagal: ' + e.message);
    }
    setProsesMassal(false);
  };

  // Cetak satu kwitansi -- kalau belum punya nomor, tawarkan dibuatkan
  // dulu (kwitansi tanpa nomor gampang dipalsukan/sulit diverifikasi).
  const cetakSatu = async (log) => {
    let nomor = log.noKwitansi;
    if (!nomor) {
      if (!window.confirm('Transaksi ini belum punya nomor kwitansi. Buatkan nomor sekarang lalu cetak?')) return;
      setProsesNomorId(log.id);
      try {
        const tanggalTransaksi = log.date ? new Date(`${log.date}T00:00:00`) : new Date();
        nomor = await ambilNomorKwitansiBerikutnya(tanggalTransaksi);
        await updateDoc(doc(db, 'finance_logs', log.id), { noKwitansi: nomor });
      } catch (e) {
        setProsesNomorId('');
        return alert('❌ Gagal membuat nomor: ' + e.message);
      }
      setProsesNomorId('');
    }
    cetakKwitansi({ ...kwitansiDariLog({ ...log, noKwitansi: nomor }) });
  };

  return (
    <div>
      {/* HEADER + PEMILIH BULAN */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={20} color="#7c3aed" /> Riwayat Kwitansi
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, maxWidth: 640 }}>
            Semua pembayaran yang <b>uangnya beneran diterima</b> (tunai/transfer) bisa dicetak kwitansinya di sini —
            ada logo, nomor otomatis, dan terbilang. Komitmen cicilan belum terbit kwitansi (baru terbit saat tiap
            cicilan dibayar). Setor kas punya bukti sendiri di tab <b>Tutup Kasir</b>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="month"
            value={bulan}
            max={keyBulanIni()}
            onChange={e => {
              if (!e.target.value) return;
              // Loading diset di sini (bukan di dalam effect) -- pola yang
              // sama dengan halaman lain, menghindari setState-in-effect.
              setBulan(e.target.value);
              setLoading(true);
            }}
            style={styles.monthInput}
          />
          <button
            onClick={() => cetakRingkasanKwitansi(logs, labelBulan(bulan))}
            disabled={logs.length === 0}
            style={styles.btnCetakDaftar(logs.length === 0)}
            title="Cetak rekap semua kwitansi bulan ini (satu halaman daftar bernomor)"
          >
            <ListOrdered size={15} /> Cetak Daftar {labelBulan(bulan)}
          </button>
        </div>
      </div>

      {/* STATISTIK BULAN TERPILIH */}
      <div style={styles.statStrip}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Kwitansi</span>
          <b style={{ fontSize: 16, color: '#1e293b' }}>{logs.length}</b>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Nominal</span>
          <b style={{ fontSize: 16, color: '#7c3aed' }}>{rp(total)}</b>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Belum Bernomor</span>
          <b style={{ fontSize: 16, color: belumBernomor.length ? '#d97706' : '#16a34a' }}>{belumBernomor.length}</b>
        </div>
        {belumBernomor.length > 0 && (
          <button onClick={buatkanNomorSemua} disabled={prosesMassal} style={styles.btnNomorMassal}>
            {prosesMassal ? <Loader2 size={14} className="spin" /> : <Hash size={14} />}
            {prosesMassal ? 'Memproses...' : `Buatkan Nomor Sekaligus (${belumBernomor.length})`}
          </button>
        )}
      </div>

      {belumBernomor.length > 0 && (
        <div style={styles.hintKuning}>
          ⚠️ Transaksi lama (sebelum fitur kwitansi ada) belum punya nomor. Klik <b>“Buatkan Nomor Sekaligus”</b> atau
          tombol <b>Nomor</b> per baris — nomor dibuat mengikuti bulan transaksi aslinya, urut dari yang paling tua.
        </div>
      )}

      {/* TABEL */}
      <div style={styles.tableCard}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 12 }}>Memuat kwitansi...</p>
        ) : logs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 12 }}>
            Tidak ada pembayaran diterima di bulan {labelBulan(bulan)}.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No. Kwitansi</th>
                  <th style={styles.th}>Tanggal</th>
                  <th style={styles.th}>Diterima Dari</th>
                  <th style={styles.th}>Keperluan</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Jumlah</th>
                  <th style={styles.th}>Metode</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={styles.tr}>
                    <td style={styles.td}>
                      {l.noKwitansi ? (
                        <b style={{ fontFamily: 'monospace', fontSize: 12, color: '#7c3aed' }}>{l.noKwitansi}</b>
                      ) : (
                        <button onClick={() => buatkanNomor(l)} disabled={prosesNomorId === l.id} style={styles.btnBuatNomor}>
                          {prosesNomorId === l.id ? '⏳' : <><Hash size={11} /> Buatkan Nomor</>}
                        </button>
                      )}
                    </td>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{tanggalPanjang(l.date)}</td>
                    <td style={styles.td}>
                      <b>{l.namaSiswa || '-'}</b>
                      {l.studentId && <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{l.studentId}</div>}
                    </td>
                    <td style={{ ...styles.td, maxWidth: 240 }}>
                      <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>{l.category || '-'}</div>
                      {l.note && <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.note}>{l.note}</div>}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>
                      {rp(l.amount)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badgeMetode(l.method)}>
                        {l.method === 'Tunai' ? '💵 Tunai' : l.method === 'Transfer' ? '💳 Transfer' : `❔ ${l.method || 'Tanpa Metode'}`}
                      </span>
                      {l.refTransfer && <div style={{ fontSize: 9, color: '#1d4ed8', marginTop: 2 }}>ref: {l.refTransfer}</div>}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => cetakSatu(l)} disabled={prosesNomorId === l.id} style={styles.btnCetak} title="Cetak kwitansi">
                        <Printer size={13} /> Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#475569' }}>
                    TOTAL {logs.length} KWITANSI — {labelBulan(bulan)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}>{rp(total)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
};

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 },
  monthInput: { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#1e293b', background: 'white' },
  btnCetakDaftar: (disabled) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
    background: disabled ? '#e2e8f0' : '#7c3aed', color: disabled ? '#94a3b8' : 'white',
    border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 12,
  }),

  statStrip: { display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  statItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  statLabel: { fontSize: 9.5, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 },
  btnNomorMassal: { marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#fffbeb', color: '#b45309', border: '1.5px solid #f59e0b', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 12 },

  hintKuning: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 10, padding: '9px 13px', fontSize: 11.5, fontWeight: 600, lineHeight: 1.6, marginBottom: 12 },

  tableCard: { background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 820 },
  th: { padding: '10px 12px', fontSize: 9.5, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '9px 12px', fontSize: 12, color: '#334155' },

  badgeMetode: (m) => ({
    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
    background: m === 'Tunai' ? '#dcfce7' : m === 'Transfer' ? '#dbeafe' : '#f1f5f9',
    color: m === 'Tunai' ? '#15803d' : m === 'Transfer' ? '#1d4ed8' : '#64748b',
  }),
  btnBuatNomor: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', background: '#fffbeb', color: '#b45309', border: '1px solid #fcd34d', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 10.5, whiteSpace: 'nowrap' },
  btnCetak: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' },
};

export default RiwayatKwitansi;
