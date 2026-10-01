// src/pages/admin/AuditLogPage.jsx
// ⚠️ CATATAN KEAMANAN: halaman ini bagian dari pemisahan akun admin.
// Ia memberi akuntabilitas, tapi BUKAN perbaikan keamanan selama
// Firestore Rules masih terbuka. Lihat
// docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md sebelum mengandalkan
// pembatasan peran di sini sebagai kendali keamanan.
// ============================================================
// 🔥 BARU (akuntabilitas): penelusuran jejak aktivitas admin.
//
// Ini jawaban langsung untuk masalah "kalau terjadi kesalahan, tidak
// jelas siapa yang melakukannya". Setiap login (sukses/gagal), perubahan
// akun admin, dan aksi sensitif tercatat di koleksi `audit_logs`
// bersama nama akun, peran, waktu, dan perangkat.
//
// Hak akses: Owner (PIN) dan admin berperan 'manajer'.
//
// Catatan penting soal Firestore: filter gabungan (where + orderBy)
// butuh composite index. Supaya halaman ini tidak pernah mati karena
// index belum dibuat, `bacaAudit()` mengurutkan di sisi klien ketika
// ada filter aktif. Volume log yang diambil sengaja dibatasi.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, RefreshCw, Filter, Download, AlertTriangle, Search,
  ShieldCheck, ShieldAlert, LogIn, LogOut, UserCog, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  bacaAudit, formatWaktu, labelAksi, LABEL_KATEGORI, KATEGORI,
} from '../../utils/auditLog';
import { ambilSesiAdmin, PERAN_ADMIN, LABEL_PERAN_ADMIN } from '../../utils/adminAuth';
import { isOwnerSession } from '../../utils/roleAkses';

// Rentang tanggal cepat (dalam hari).
const RENTANG = [
  { label: 'Hari ini', hari: 0 },
  { label: '7 hari', hari: 7 },
  { label: '30 hari', hari: 30 },
  { label: 'Semua', hari: null },
];

const AuditLogPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAktor, setFilterAktor] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterHari, setFilterHari] = useState(7);
  const [cari, setCari] = useState('');
  const [hanyaLogin, setHanyaLogin] = useState(false);
  const [hanyaGagal, setHanyaGagal] = useState(false);
  const [terbuka, setTerbuka] = useState({});
  const [bolehAkses, setBolehAkses] = useState(false);
  const [daftarAktor, setDaftarAktor] = useState([]);

  const sesi = ambilSesiAdmin();

  const muat = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sejak = filterHari === null ? null : new Date(Date.now() - filterHari * 24 * 60 * 60 * 1000);
      const hasil = await bacaAudit({
        jumlah: 200,
        aktor: filterAktor,
        kategori: filterKategori,
        sejak,
      });
      setRows(hasil);
      // Kumpulkan daftar aktor unik untuk dropdown filter.
      const unik = Array.from(new Set(hasil.map((r) => r.aktor).filter(Boolean))).sort();
      setDaftarAktor((prev) => (prev.length > unik.length ? prev : unik));
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || e);
      setError(
        msg.includes('index') || msg.includes('FAILED_PRECONDITION')
          ? 'Firestore minta composite index untuk filter ini. Untuk sementara, pilih satu filter saja (aktor ATAU kategori ATAU tanggal), atau gunakan rentang "Semua" lalu saring di halaman ini.'
          : `Gagal memuat jejak: ${msg}`,
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filterAktor, filterKategori, filterHari]);

  useEffect(() => {
    const s = ambilSesiAdmin();
    setBolehAkses(isOwnerSession() || s?.peran === PERAN_ADMIN.MANAJER);
  }, []);

  useEffect(() => {
    if (bolehAkses) muat();
  }, [bolehAkses, muat]);

  if (!bolehAkses) {
    return (
      <div style={styles.page}>
        <div style={styles.ditolakCard}>
          <AlertTriangle size={40} color="#f59e0b" />
          <h2 style={{ color: '#fff', margin: '14px 0 6px' }}>Akses Ditolak</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Jejak audit hanya bisa dibuka oleh <b>Owner</b> dan admin berperan <b>Manajer</b>.
            <br />Akun Anda: <b>{LABEL_PERAN_ADMIN[sesi?.peran] || 'tidak dikenal'}</b>.
          </p>
          <button style={styles.btnKembali} onClick={() => navigate('/admin')}>← Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // FILTER SISI KLIEN (murah, tidak kena kuota Firestore)
  // ============================================================
  const k = cari.trim().toLowerCase();
  const tampil = rows.filter((r) => {
    if (hanyaLogin && r.kategori !== KATEGORI.AUTH) return false;
    if (hanyaGagal && !String(r.aksi || '').includes('gagal') && !String(r.aksi || '').includes('error')) return false;
    if (!k) return true;
    return [r.aktor, r.aktorNama, r.aksi, r.target, r.peran, r.perangkat]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(k));
  });

  const jumlahGagal = rows.filter((r) => String(r.aksi || '').includes('gagal')).length;
  const jumlahLogin = rows.filter((r) => r.kategori === KATEGORI.AUTH).length;

  // ============================================================
  // EKSPOR CSV -- supaya owner bisa simpan bukti di luar aplikasi
  // ============================================================
  const eksporCsv = () => {
    if (tampil.length === 0) { alert('Tidak ada data untuk diekspor.'); return; }
    const kepala = ['waktu', 'aktor', 'aktorNama', 'peran', 'kategori', 'aksi', 'target', 'perangkat', 'detail'];
    const baris = tampil.map((r) => kepala.map((f) => {
      let v = f === 'waktu' ? formatWaktu(r.waktu) : (f === 'detail' ? JSON.stringify(r.detail || {}) : r[f]);
      v = v === undefined || v === null ? '' : String(v);
      return `"${v.replace(/"/g, '""')}"`;
    }).join(','));
    const csv = `\uFEFF${kepala.join(',')}\n${baris.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jejak-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleRow = (id) => setTerbuka((t) => ({ ...t, [id]: !t[id] }));

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div style={styles.headerIcon}><History size={26} color="#60a5fa" /></div>
          <div>
            <h1 style={styles.h1}>Jejak Aktivitas Admin</h1>
            <p style={styles.sub}>
              Rekam jejak siapa masuk kapan, dari perangkat apa, dan aksi sensitif yang dilakukannya.
              Dipakai untuk menelusuri kalau ada data yang berubah tanpa penjelasan.
            </p>
          </div>
        </div>

        {/* ===== RINGKASAN ===== */}
        <div style={styles.statusRow}>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{rows.length}</div>
            <div style={styles.statLabel}>Kejadian terbaca</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{jumlahLogin}</div>
            <div style={styles.statLabel}>Peristiwa login</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: jumlahGagal > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)' }}>
            <div style={{ ...styles.statAngka, color: jumlahGagal > 0 ? '#f87171' : '#fff' }}>{jumlahGagal}</div>
            <div style={styles.statLabel}>Percobaan gagal</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{rows.filter((r) => r.aktor === 'admin-legacy').length}</div>
            <div style={styles.statLabel}>Masih pakai akun bersama</div>
          </div>
        </div>

        {rows.filter((r) => r.aktor === 'admin-legacy').length > 0 && (
          <div style={{ ...styles.banner, borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.07)' }}>
            <AlertTriangle size={17} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <b style={{ color: '#fbbf24' }}>Masih ada yang masuk tanpa identitas jelas.</b>
              <p style={styles.bannerText}>
                Sebagian login tercatat sebagai "akun bersama" — artinya staf masuk memakai password
                lama tanpa username, jadi tidak bisa dipastikan siapa. Buat akun per staf di menu
                <b> Pengguna Admin</b>, lalu matikan password bersama di sana.
              </p>
            </div>
          </div>
        )}

        {error && <div style={styles.errorBar}><AlertTriangle size={14} /> {error}</div>}

        {/* ===== FILTER ===== */}
        <div style={styles.filterCard}>
          <div style={styles.filterRow}>
            <div style={styles.filterField}>
              <label style={styles.labelField}><Filter size={11} /> Rentang</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {RENTANG.map((r) => (
                  <button
                    key={r.label}
                    style={filterHari === r.hari ? styles.chipAktif : styles.chip}
                    onClick={() => setFilterHari(r.hari)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterField}>
              <label style={styles.labelField}>Orang</label>
              <select style={styles.select} value={filterAktor} onChange={(e) => setFilterAktor(e.target.value)}>
                <option value="">Semua orang</option>
                {daftarAktor.map((a) => <option key={a} value={a}>{a}</option>)}
                {filterAktor && !daftarAktor.includes(filterAktor) && <option value={filterAktor}>{filterAktor}</option>}
              </select>
            </div>

            <div style={styles.filterField}>
              <label style={styles.labelField}>Kategori</label>
              <select style={styles.select} value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
                <option value="">Semua kategori</option>
                {Object.entries(LABEL_KATEGORI).map(([k2, v]) => <option key={k2} value={k2}>{v}</option>)}
              </select>
            </div>

            <div style={styles.filterField}>
              <label style={styles.labelField}><Search size={11} /> Cari</label>
              <input
                style={styles.select}
                placeholder="nama, aksi, target..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.filterRow2}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={hanyaLogin} onChange={(e) => setHanyaLogin(e.target.checked)} />
              <LogIn size={13} /> Hanya peristiwa login
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={hanyaGagal} onChange={(e) => setHanyaGagal(e.target.checked)} />
              <ShieldAlert size={13} /> Hanya yang gagal
            </label>
            <div style={{ flex: 1 }} />
            <button style={styles.btnSekunder} onClick={muat} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Muat Ulang
            </button>
            <button style={styles.btnUtama} onClick={eksporCsv} disabled={tampil.length === 0}>
              <Download size={14} /> Ekspor CSV ({tampil.length})
            </button>
          </div>
        </div>

        {/* ===== DAFTAR ===== */}
        <div style={styles.listCard}>
          {loading ? (
            <div style={styles.kosong}><RefreshCw size={22} className="spin" /> Memuat jejak aktivitas...</div>
          ) : tampil.length === 0 ? (
            <div style={styles.kosong}>
              <History size={26} />
              <div>
                {rows.length === 0
                  ? 'Belum ada jejak tercatat. Log mulai terisi begitu fitur ini terpasang dan ada aktivitas login/perubahan.'
                  : 'Tidak ada kejadian yang cocok dengan filter ini.'}
              </div>
            </div>
          ) : (
            tampil.map((r) => {
              const aksi = String(r.aksi || '');
              const gagal = aksi.includes('gagal') || aksi.includes('error');
              const isAuth = r.kategori === KATEGORI.AUTH;
              const isAkun = r.kategori === KATEGORI.AKUN;
              const detail = r.detail && Object.keys(r.detail).length > 0 ? r.detail : null;
              const buka = terbuka[r.id];

              return (
                <div key={r.id} style={{ ...styles.row, borderLeftColor: gagal ? '#ef4444' : isAuth ? '#60a5fa' : isAkun ? '#a78bfa' : '#334155' }}>
                  <div style={styles.rowUtama} onClick={() => detail && toggleRow(r.id)}>
                    <div style={{ ...styles.rowIkon, background: gagal ? 'rgba(239,68,68,0.12)' : 'rgba(96,165,250,0.1)' }}>
                      {gagal ? <ShieldAlert size={15} color="#f87171" />
                        : isAkun ? <UserCog size={15} color="#a78bfa" />
                        : isAuth ? <LogIn size={15} color="#60a5fa" />
                        : <ShieldCheck size={15} color="#60a5fa" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.rowJudul}>
                        <span style={{ ...styles.rowAksi, color: gagal ? '#fca5a5' : '#fff' }}>{labelAksi(aksi)}</span>
                        {r.aktor === 'admin-legacy' && <span style={styles.pillKuning}>akun bersama</span>}
                        {r.aktor === 'owner' && <span style={styles.pillEmas}>owner</span>}
                      </div>
                      <div style={styles.rowMeta}>
                        <b style={{ color: 'rgba(255,255,255,0.75)' }}>{r.aktorNama || r.aktor}</b>
                        {r.peran && r.peran !== 'tak-dikenal' && <span>· {LABEL_PERAN_ADMIN[r.peran] || r.peran}</span>}
                        {r.target && <span>· {r.target}</span>}
                      </div>
                    </div>

                    <div style={styles.rowWaktu}>
                      <div>{formatWaktu(r.waktu)}</div>
                      {r.perangkat && <div style={styles.rowPerangkat}>{r.perangkat}</div>}
                    </div>

                    {detail && (
                      <div style={styles.rowChevron}>{buka ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div>
                    )}
                  </div>

                  {buka && detail && (
                    <div style={styles.rowDetail}>
                      <table style={styles.detailTabel}>
                        <tbody>
                          {Object.entries(detail).map(([dk, dv]) => (
                            <tr key={dk}>
                              <td style={styles.detailKey}>{dk}</td>
                              <td style={styles.detailVal}>
                                {typeof dv === 'object' && dv !== null ? JSON.stringify(dv) : String(dv)}
                              </td>
                            </tr>
                          ))}
                          {r.url && (
                            <tr>
                              <td style={styles.detailKey}>halaman</td>
                              <td style={styles.detailVal}>{r.url}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ===== CATATAN ===== */}
        <div style={styles.catatan}>
          <ShieldCheck size={15} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b style={{ color: '#93c5fd' }}>Yang tercatat dan yang tidak</b>
            <p style={styles.bannerText}>
              Tercatat: setiap percobaan masuk (sukses maupun gagal, termasuk username yang dicoba),
              logout, pembuatan/perubahan/penonaktifan akun admin, reset password, dan perubahan
              pengaturan login. <b>Password dan PIN tidak pernah disimpan di log</b> — otomatis disaring.
              Aksi lain (transaksi keuangan, perubahan data siswa) akan menyusul dicatat bertahap.
            </p>
            <p style={{ ...styles.bannerText, margin: 0 }}>
              Log disimpan di Firestore koleksi <code style={styles.code}>audit_logs</code>.
              Kalau volumenya nanti besar, pertimbangkan arsip bulanan — ekspor CSV di atas bisa dipakai untuk itu.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #060b18 0%, #0b1730 60%, #05080f 100%)',
    padding: '26px 20px 60px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrap: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  h1: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, margin: '4px 0 0', lineHeight: 1.55, maxWidth: 660 },

  statusRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 },
  statCard: {
    background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '13px 16px', textAlign: 'center',
  },
  statAngka: { color: '#fff', fontSize: 23, fontWeight: 800, lineHeight: 1 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 },

  banner: { display: 'flex', gap: 11, alignItems: 'flex-start', borderRadius: 14, padding: '13px 15px', marginBottom: 12, border: '1px solid' },
  bannerText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6, margin: '5px 0 0' },
  errorBar: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '10px 13px', color: '#fca5a5', fontSize: 12.5, marginBottom: 12, lineHeight: 1.55,
  },

  filterCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, alignItems: 'end' },
  filterRow2: { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 },
  filterField: { display: 'flex', flexDirection: 'column', gap: 5 },
  labelField: {
    color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 0.5,
    display: 'flex', alignItems: 'center', gap: 4,
  },
  select: {
    padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 12.5,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  chip: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '7px 11px', color: 'rgba(255,255,255,0.6)',
    fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  },
  chipAktif: {
    background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.45)',
    borderRadius: 8, padding: '7px 11px', color: '#93c5fd', fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)',
    fontSize: 12, cursor: 'pointer',
  },
  btnUtama: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#06121f',
    border: 'none', borderRadius: 10, padding: '9px 15px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
  },
  btnSekunder: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 14px',
    fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  },
  btnKembali: {
    marginTop: 18, background: 'rgba(255,255,255,0.07)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10,
    padding: '10px 18px', fontSize: 13, cursor: 'pointer',
  },

  listCard: {
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, overflow: 'hidden',
  },
  kosong: {
    padding: '46px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, lineHeight: 1.6,
  },
  row: { borderBottom: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #334155' },
  rowUtama: { display: 'flex', gap: 11, alignItems: 'center', padding: '11px 14px', cursor: 'pointer' },
  rowIkon: { width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  rowJudul: { display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  rowAksi: { fontSize: 13, fontWeight: 700 },
  rowMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 11.5, marginTop: 3, display: 'flex', gap: 5, flexWrap: 'wrap' },
  rowWaktu: { textAlign: 'right', flexShrink: 0, color: 'rgba(255,255,255,0.55)', fontSize: 11.5, minWidth: 118 },
  rowPerangkat: { color: 'rgba(255,255,255,0.28)', fontSize: 10, marginTop: 2 },
  rowChevron: { color: 'rgba(255,255,255,0.25)', flexShrink: 0, display: 'flex' },
  rowDetail: { padding: '0 14px 13px 57px', background: 'rgba(0,0,0,0.18)' },
  detailTabel: { borderCollapse: 'collapse', width: '100%', maxWidth: 620 },
  detailKey: {
    padding: '4px 12px 4px 0', fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: 0.4, verticalAlign: 'top', whiteSpace: 'nowrap',
  },
  detailVal: { padding: '4px 0', fontSize: 12, color: 'rgba(255,255,255,0.72)', wordBreak: 'break-word' },

  pillKuning: { background: 'rgba(245,158,11,0.16)', color: '#fbbf24', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.3 },
  pillEmas: { background: 'rgba(251,191,36,0.16)', color: '#fde68a', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.3 },

  catatan: {
    display: 'flex', gap: 11, alignItems: 'flex-start', marginTop: 16,
    background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: 14, padding: '13px 15px',
  },
  code: {
    background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: 4,
    fontSize: 11, color: '#93c5fd',
  },
  ditolakCard: {
    maxWidth: 430, margin: '14vh auto', textAlign: 'center',
    background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20, padding: '34px 28px',
  },
};

export default AuditLogPage;
