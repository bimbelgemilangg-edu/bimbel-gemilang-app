// src/pages/admin/owner/PanelTransaksi.jsx
// 🔥 TAB "SEMUA TRANSAKSI" Portal Owner: SELURUH riwayat uang masuk &
// keluar sejak awal usaha -- bukan cuma bulan berjalan seperti halaman
// admin. Ada filter periode/jenis/metode/kategori + pencarian, dan bisa
// di-download (Excel/CSV) untuk dianalisis sendiri atau dikasih ke
// pembukuan eksternal. Datanya live dari onSnapshot di shell.

import React, { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, Search, FilterX } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  keyBulanIni, keyBulanDariDate, namaBulanDariKey, tambahHari,
  unduhCSVTransaksi, barisTransaksiExcel,
  urutTanggalTerbaru,
} from './keuanganOwnerUtils';

const OPSI_PERIODE = [
  { id: 'bulanIni', label: 'Bulan ini' },
  { id: 'bulanLalu', label: 'Bulan lalu' },
  { id: 'tahunIni', label: 'Tahun ini' },
  { id: 'tahunLalu', label: 'Tahun lalu' },
  { id: '30hari', label: '30 hari terakhir' },
  { id: 'semua', label: 'Semua (sejak awal)' },
  { id: 'custom', label: 'Rentang tanggal...' },
];

const PanelTransaksi = ({ logs, rp, isMobile }) => {
  const [periode, setPeriode] = useState('bulanIni');
  const [customDari, setCustomDari] = useState(() => `${keyBulanIni()}-01`);
  const [customSampai, setCustomSampai] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState('Semua');
  const [filterMetode, setFilterMetode] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [cari, setCari] = useState('');
  const [tampilCount, setTampilCount] = useState(100);

  // Daftar kategori yang pernah dipakai (buat opsi filter).
  const daftarKategori = useMemo(() => {
    const set = new Set(logs.map(l => l.category).filter(Boolean));
    return [...set].sort();
  }, [logs]);

  const rentang = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const hariIni = keyBulanDariDate(now) + '-' + String(now.getDate()).padStart(2, '0');
    const keySekarang = keyBulanIni();
    if (periode === 'bulanIni') return { dari: `${keySekarang}-01`, sampai: null, label: namaBulanDariKey(keySekarang) };
    if (periode === 'bulanLalu') {
      const d = new Date(y, m - 1, 1);
      const key = keyBulanDariDate(d);
      const akhir = new Date(y, m, 0).getDate();
      return { dari: `${key}-01`, sampai: `${key}-${String(akhir).padStart(2, '0')}`, label: namaBulanDariKey(key) };
    }
    if (periode === 'tahunIni') return { dari: `${y}-01-01`, sampai: null, label: `Tahun ${y}` };
    if (periode === 'tahunLalu') return { dari: `${y - 1}-01-01`, sampai: `${y - 1}-12-31`, label: `Tahun ${y - 1}` };
    if (periode === '30hari') return { dari: tambahHari(hariIni, -30), sampai: null, label: '30 hari terakhir' };
    if (periode === 'custom') return { dari: customDari, sampai: customSampai, label: `${customDari} s.d. ${customSampai}` };
    return { dari: null, sampai: null, label: 'Semua waktu' };
  }, [periode, customDari, customSampai]);

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const filtered = logs.filter(l => {
      if (rentang.dari && l.date && l.date < rentang.dari) return false;
      if (rentang.sampai && l.date && l.date > rentang.sampai) return false;
      if (!l.date && rentang.dari) return false; // log tanpa tanggal cuma muncul di "Semua"
      if (filterType !== 'Semua' && l.type !== filterType) return false;
      if (filterMetode !== 'Semua' && l.method !== filterMetode) return false;
      if (filterKategori !== 'Semua' && l.category !== filterKategori) return false;
      if (q) {
        // 🔥 UPGRADE: pencarian ikut mencakup nomor kwitansi & referensi
        // transfer -- owner bisa cari bukti bayar lewat nomor struk bank.
        const haystack = `${l.namaSiswa} ${l.note} ${l.category} ${l.noKwitansi} ${l.refTransfer}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort(urutTanggalTerbaru);

    let masuk = 0, keluar = 0, komitmen = 0, setorKas = 0;
    for (const l of filtered) {
      // 🔥 FIX (modul setor kas): type 'Transfer' = uang PINDAH kantong
      // (brankas admin -> kas owner), BUKAN pemasukan/pengeluaran. Kalau
      // ikut dijumlahkan ke "keluar", total belanja owner menggelembung
      // palsu tiap admin setor kas.
      if (l.type === 'Transfer') { setorKas += l.amount; continue; }
      if (l.type === 'Pemasukan') {
        if (l.methodAsli === 'Cicilan') komitmen += l.amount;
        else masuk += l.amount;
      } else keluar += l.amount;
    }
    return { filtered, masuk, keluar, komitmen, setorKas, netto: masuk - keluar };
  }, [logs, rentang, filterType, filterMetode, filterKategori, cari]);

  // Reset pagination lewat handler (bukan useEffect) -- semua setter
  // filter dibungkus supaya "tampilkan lebih banyak" mulai dari awal lagi.
  const gantiFilter = (setter) => (e) => { setter(e.target.value); setTampilCount(100); };
  const ditampilkan = hasil.filtered.slice(0, tampilCount);

  const namaFileDasar = () => `transaksi-${rentang.label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
  const handleUnduhCSV = () => unduhCSVTransaksi(hasil.filtered, `${namaFileDasar()}.csv`);
  const handleUnduhExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(barisTransaksiExcel(hasil.filtered));
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `${namaFileDasar()}.xlsx`);
  };

  const filterAktif = periode !== 'bulanIni' || filterType !== 'Semua' || filterMetode !== 'Semua' || filterKategori !== 'Semua' || cari !== '';
  const resetSemua = () => {
    setPeriode('bulanIni'); setFilterType('Semua'); setFilterMetode('Semua');
    setFilterKategori('Semua'); setCari(''); setTampilCount(100);
  };

  return (
    <div style={styles.card}>
      <div style={styles.judulRow}>
        <h3 style={styles.cardTitle}>🧾 Semua Transaksi — {rentang.label}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleUnduhExcel} style={styles.btnUnduh('#065f46')} title="Unduh hasil filter ke Excel">
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={handleUnduhCSV} style={styles.btnUnduh('#1e293b')} title="Unduh hasil filter ke CSV">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>
      <p style={styles.ket}>
        Seluruh riwayat uang masuk & keluar sejak awal usaha (halaman admin cuma menampilkan bulan berjalan). Angka di bawah sudah mengikuti filter. Pemasukan ber-metode "Cicilan" dipisah sebagai komitmen — bukan uang diterima.
      </p>

      {/* ===== FILTER ===== */}
      <div style={styles.filterGrid(isMobile)}>
        <div style={styles.filterGrup}>
          <label style={styles.filterLabel}>Periode</label>
          <select value={periode} onChange={gantiFilter(setPeriode)} style={styles.select}>
            {OPSI_PERIODE.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        {periode === 'custom' && (
          <>
            <div style={styles.filterGrup}>
              <label style={styles.filterLabel}>Dari tanggal</label>
              <input type="date" value={customDari} max={customSampai} onChange={gantiFilter(setCustomDari)} style={styles.select} />
            </div>
            <div style={styles.filterGrup}>
              <label style={styles.filterLabel}>Sampai tanggal</label>
              <input type="date" value={customSampai} min={customDari} onChange={gantiFilter(setCustomSampai)} style={styles.select} />
            </div>
          </>
        )}
        <div style={styles.filterGrup}>
          <label style={styles.filterLabel}>Jenis</label>
          <select value={filterType} onChange={gantiFilter(setFilterType)} style={styles.select}>
            {['Semua', 'Pemasukan', 'Pengeluaran'].map(o => <option key={o}>{o}</option>)}
            {/* 🔥 BARU: setoran kas admin (uang pindah kantong, bukan omzet/belanja). */}
            <option value="Transfer">🔁 Setor Kas</option>
          </select>
        </div>
        <div style={styles.filterGrup}>
          <label style={styles.filterLabel}>Metode</label>
          <select value={filterMetode} onChange={gantiFilter(setFilterMetode)} style={styles.select}>
            {['Semua', 'Tunai', 'Transfer', 'Cicilan', 'Lainnya'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={styles.filterGrup}>
          <label style={styles.filterLabel}>Kategori</label>
          <select value={filterKategori} onChange={gantiFilter(setFilterKategori)} style={styles.select}>
            <option>Semua</option>
            {daftarKategori.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div style={styles.filterGrup}>
          <label style={styles.filterLabel}>Cari (nama siswa / catatan)</label>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 9, top: 9 }} />
            <input
              value={cari}
              onChange={(e) => { setCari(e.target.value); setTampilCount(100); }}
              placeholder="Ketik nama / catatan..."
              style={{ ...styles.select, paddingLeft: 28 }}
            />
          </div>
        </div>
        {filterAktif && (
          <div style={{ ...styles.filterGrup, justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
            <button onClick={resetSemua} style={styles.btnReset}><FilterX size={13} /> Reset filter</button>
          </div>
        )}
      </div>

      {/* ===== RINGKASAN HASIL FILTER ===== */}
      <div style={styles.ringkasStrip(isMobile)}>
        <div style={styles.ringkasItem}>
          <span style={styles.ringkasLabel}>Transaksi</span>
          <b style={{ fontSize: 15, color: '#1e293b' }}>{hasil.filtered.length}</b>
        </div>
        <div style={styles.ringkasItem}>
          <span style={styles.ringkasLabel}>Masuk (diterima)</span>
          <b style={{ fontSize: 15, color: '#059669' }}>{rp(hasil.masuk)}</b>
        </div>
        <div style={styles.ringkasItem}>
          <span style={styles.ringkasLabel}>Keluar</span>
          <b style={{ fontSize: 15, color: '#dc2626' }}>{rp(hasil.keluar)}</b>
        </div>
        <div style={styles.ringkasItem}>
          <span style={styles.ringkasLabel}>Netto</span>
          <b style={{ fontSize: 15, color: hasil.netto >= 0 ? '#059669' : '#dc2626' }}>{rp(hasil.netto)}</b>
        </div>
        {hasil.komitmen > 0 && (
          <div style={styles.ringkasItem}>
            <span style={styles.ringkasLabel}>Komitmen cicilan (belum diterima)</span>
            <b style={{ fontSize: 15, color: '#d97706' }}>{rp(hasil.komitmen)}</b>
          </div>
        )}
        {hasil.setorKas > 0 && (
          <div style={styles.ringkasItem}>
            <span style={styles.ringkasLabel}>🔁 Setor kas (pindah kantong, bukan belanja)</span>
            <b style={{ fontSize: 15, color: '#b45309' }}>{rp(hasil.setorKas)}</b>
          </div>
        )}
      </div>

      {/* ===== TABEL ===== */}
      {hasil.filtered.length === 0 ? (
        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 30 }}>
          Tidak ada transaksi yang cocok dengan filter ini.
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thr}>
                  <th style={styles.th}>Tanggal</th>
                  <th style={styles.th}>Jenis</th>
                  <th style={styles.th}>Kategori</th>
                  <th style={styles.th}>Metode</th>
                  <th style={styles.th}>Siswa</th>
                  <th style={styles.th}>Catatan</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {ditampilkan.map((l, i) => (
                  <tr key={l.id || i} style={styles.tr}>
                    <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{l.date || <i style={{ color: '#cbd5e1' }}>tanpa tanggal</i>}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeJenis(l.type)}>{l.type === 'Transfer' ? '🔁 Setor Kas' : l.type}</span>
                    </td>
                    <td style={styles.td}>{l.category}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeMetode(l.method)}>{l.methodAsli || '(kosong)'}</span>
                      {l.noKwitansi && <div style={{ fontSize: 8.5, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>{l.noKwitansi}</div>}
                      {l.type === 'Transfer' && l.statusRekonsiliasi !== 'verified' && (
                        <div style={{ fontSize: 8.5, color: '#d97706', fontWeight: 800, marginTop: 2 }}>⏳ pending</div>
                      )}
                    </td>
                    <td style={styles.td}>{l.namaSiswa || '-'}</td>
                    <td style={{ ...styles.td, color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.note}>
                      {l.note || '-'}
                      {l.refTransfer && <div style={{ fontSize: 8.5, color: '#1d4ed8', fontWeight: 700 }}>ref: {l.refTransfer}</div>}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: l.type === 'Transfer' ? '#b45309' : l.type === 'Pemasukan' ? (l.methodAsli === 'Cicilan' ? '#d97706' : '#059669') : '#dc2626' }}>
                      {l.type === 'Transfer' ? '🔁' : l.type === 'Pemasukan' ? '+' : '-'} {rp(l.amount)}
                      {l.methodAsli === 'Cicilan' && l.type === 'Pemasukan' && <div style={{ fontSize: 8.5, color: '#d97706', fontWeight: 700 }}>komitmen</div>}
                      {l.type === 'Transfer' && <div style={{ fontSize: 8.5, color: '#b45309', fontWeight: 700 }}>pindah kantong</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tampilCount < hasil.filtered.length && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button onClick={() => setTampilCount(c => c + 150)} style={styles.btnLebih}>
                Tampilkan lebih banyak ({hasil.filtered.length - tampilCount} transaksi tersisa)
              </button>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: '6px 0 0' }}>
                Menampilkan {ditampilkan.length} dari {hasil.filtered.length}. Mau semuanya sekaligus? Pakai tombol Excel/CSV di atas.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  card: { background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  judulRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  ket: { fontSize: 11, color: '#94a3b8', margin: '4px 0 14px', lineHeight: 1.6, maxWidth: 860 },
  btnUnduh: (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: bg, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 11.5 }),
  btnReset: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11 },

  filterGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }),
  filterGrup: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel: { fontSize: 9.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  select: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#1e293b', background: 'white', width: '100%', boxSizing: 'border-box' },

  ringkasStrip: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: 12, marginBottom: 14 }),
  ringkasItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  ringkasLabel: { fontSize: 9.5, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 },

  btnLebih: { padding: '9px 18px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 },

  table: { width: '100%', borderCollapse: 'collapse', minWidth: 780 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '9px 10px', fontSize: 9.5, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 10px', fontSize: 11.5, color: '#334155' },
  badgeJenis: (t) => ({
    fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
    background: t === 'Pemasukan' ? '#dcfce7' : t === 'Transfer' ? '#fef3c7' : '#fee2e2',
    color: t === 'Pemasukan' ? '#15803d' : t === 'Transfer' ? '#b45309' : '#b91c1c',
  }),
  badgeMetode: (m) => ({
    fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
    background: m === 'Tunai' ? '#dcfce7' : m === 'Transfer' ? '#dbeafe' : m === 'Cicilan' ? '#fef3c7' : '#f1f5f9',
    color: m === 'Tunai' ? '#15803d' : m === 'Transfer' ? '#1d4ed8' : m === 'Cicilan' ? '#b45309' : '#64748b',
  }),
};

export default PanelTransaksi;
