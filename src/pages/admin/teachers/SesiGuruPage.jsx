// src/pages/admin/teachers/SesiGuruPage.jsx
// ============================================================
// 🔥 BARU (pembagian kewenangan admin vs owner, 2026-10-01):
// halaman KERJA ADMIN untuk absensi & riwayat sesi mengajar tentor.
//
// LATAR BELAKANG
// Sebelumnya satu-satunya tempat melihat dan menyetujui sesi mengajar
// adalah halaman Gaji Guru (/admin/teachers/salaries) yang TERKUNCI
// OWNER. Akibatnya dua hal rusak sekaligus:
//   1. Admin yang tugasnya memvalidasi "benarkah sesi ini terjadi"
//      tidak punya tempat kerja -- validasi operasional malah harus
//      masuk ke halaman uang.
//   2. Tombol "Gaji" di halaman Kelola Guru menjanjikan akses yang
//      ditolak rute-nya, jadi admin KLIK -> terpental ke /login-owner,
//      dan kalau dia login owner di sana, sesi admin-nya MATI
//      (sesi admin & owner saling meniadakan).
//
// PEMBAGIAN YANG DIPAKAI SEKARANG (sesuai keputusan owner):
//   ADMIN  : melihat fakta sesi (siapa mengajar apa, kapan, berapa jam,
//            berapa siswa hadir, bukti foto), MENYETUJUI / membatalkan
//            validasi, dan MENGUNDUH riwayat sesi. TANPA ANGKA UANG.
//   OWNER  : semua di atas PLUS nominal, tarif, bonus, dan pembayaran
//            (tetap di halaman Gaji Guru & Portal Owner).
//
// Halaman ini SENGAJA tidak menampilkan field `nominal` teacher_logs
// sama sekali, dan tidak punya aksi ubah-nominal/hapus-log. Kalau suatu
// saat ada kebutuhan admin melihat uang, itu keputusan owner dan harus
// diubah sadar-sadar, bukan lewat halaman ini.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardCheck, RefreshCw, Download, CheckCircle2, Undo2, Search,
  CalendarDays, Camera, Users, Clock, AlertTriangle, Lock,
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { keyTanggalDariDate } from '../owner/keuanganOwnerUtils';
import { catatAudit, KATEGORI } from '../../../utils/auditLog';

// Status sesi diambil dari satu sumber (keuanganOwnerUtils) supaya halaman
// admin dan panel bayar owner TIDAK pernah menulis string berbeda.
import {
  STATUS_SESI_VALID as STATUS_VALID,
  STATUS_SESI_MENUNGGU as STATUS_MENUNGGU,
} from '../owner/keuanganOwnerUtils';

const SesiGuruPage = () => {
  const now = new Date();
  const [mulai, setMulai] = useState(keyTanggalDariDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [sampai, setSampai] = useState(keyTanggalDariDate(now));
  const [cari, setCari] = useState('');
  const [hanyaMenunggu, setHanyaMenunggu] = useState(false);
  // Filter per guru -- dipakai tombol di halaman Kelola Guru
  // (/admin/teachers/sesi?guru=<id>) supaya admin bisa langsung melihat
  // riwayat satu tentor tanpa menyaring manual.
  const [guruId, setGuruId] = useState(
    () => new URLSearchParams(window.location.search).get('guru') || '',
  );
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prosesId, setProsesId] = useState('');

  // ============================================================
  // MUAT DATA
  // ============================================================
  const muat = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(collection(db, 'teacher_logs'));
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setError(`Gagal memuat riwayat sesi: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  // ============================================================
  // FILTER (sisi klien -- datanya sudah di tangan, murah)
  // ============================================================
  const tampil = useMemo(() => {
    const k = cari.trim().toLowerCase();
    const rows = logs.filter((l) => {
      if (!l || !l.tanggal) return false;
      const tanggal = String(l.tanggal).split(' ')[0];
      if (tanggal < mulai || tanggal > sampai) return false;
      if (guruId && l.teacherId !== guruId) return false;
      if (hanyaMenunggu && l.status === STATUS_VALID) return false;
      if (k) {
        const gab = [l.namaGuru, l.program, l.kegiatan, l.kelasNama, l.level, l.status]
          .filter(Boolean).join(' ').toLowerCase();
        if (!gab.includes(k)) return false;
      }
      return true;
    });
    rows.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))
      || String(b.waktu || '').localeCompare(String(a.waktu || '')));
    return rows;
  }, [logs, mulai, sampai, cari, hanyaMenunggu, guruId]);

  const jumlahMenunggu = useMemo(
    () => tampil.filter((l) => l.status !== STATUS_VALID).length,
    [tampil],
  );

  // ============================================================
  // AKSI VALIDASI (operasional, BUKAN uang)
  // ============================================================
  const setujui = async (l) => {
    if (!window.confirm(
      `Setujui sesi ini sebagai valid?\n\n${l.namaGuru} · ${l.tanggal}\n${l.program || ''} ${l.kelasNama || ''}\n\n` +
      'Dengan menyetujui, Anda menyatakan sesi ini BENAR terjadi sesuai catatan. ' +
      'Owner memakai status ini sebagai dasar pembayaran honor.',
    )) return;
    setProsesId(l.id);
    try {
      await updateDoc(doc(db, 'teacher_logs', l.id), { status: STATUS_VALID });
      catatAudit('guru.sesi.setujui', {
        kategori: KATEGORI.GURU,
        target: `Sesi ${l.namaGuru} · ${l.tanggal}`,
        detail: { logId: l.id, program: l.program || '', kelas: l.kelasNama || '' },
      });
      setLogs((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: STATUS_VALID } : x)));
    } catch (e) {
      alert(`Gagal menyetujui: ${e?.message || e}`);
    } finally {
      setProsesId('');
    }
  };

  const batalkan = async (l) => {
    if (!window.confirm(
      `Batalkan validasi sesi ini?\n\n${l.namaGuru} · ${l.tanggal}\n\n` +
      'Sesi kembali berstatus "Menunggu Validasi" dan tidak akan ikut ' +
      'sebagai dasar pembayaran sampai disetujui lagi.',
    )) return;
    setProsesId(l.id);
    try {
      await updateDoc(doc(db, 'teacher_logs', l.id), { status: STATUS_MENUNGGU });
      catatAudit('guru.sesi.batalkan', {
        kategori: KATEGORI.GURU,
        target: `Sesi ${l.namaGuru} · ${l.tanggal}`,
        detail: { logId: l.id, alasan: 'dibatalkan admin' },
      });
      setLogs((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: STATUS_MENUNGGU } : x)));
    } catch (e) {
      alert(`Gagal membatalkan: ${e?.message || e}`);
    } finally {
      setProsesId('');
    }
  };

  // ============================================================
  // UNDUH RIWAYAT SESI (CSV, tanpa nominal)
  // ============================================================
  const unduhCsv = () => {
    if (tampil.length === 0) { alert('Tidak ada baris untuk diunduh pada rentang ini.'); return; }
    const kepala = [
      'tanggal', 'waktu', 'namaGuru', 'program', 'level', 'kelas',
      'kegiatan', 'siswaHadir', 'durasiJam', 'status', 'adaFotoAbsensi',
    ];
    const baris = tampil.map((l) => kepala.map((f) => {
      let v;
      switch (f) {
        case 'tanggal': v = String(l.tanggal || '').split(' ')[0]; break;
        case 'waktu': v = l.waktu || ''; break;
        case 'namaGuru': v = l.namaGuru || ''; break;
        case 'program': v = l.program || ''; break;
        case 'level': v = l.level || ''; break;
        case 'kelas': v = l.kelasNama || ''; break;
        case 'kegiatan': v = l.kegiatan || ''; break;
        case 'siswaHadir': v = l.siswaHadir ?? ''; break;
        case 'durasiJam': v = l.durasiJam ?? ''; break;
        case 'status': v = l.status || ''; break;
        case 'adaFotoAbsensi': v = l.fotoAbsensiUrl ? 'ya' : 'tidak'; break;
        default: v = '';
      }
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(','));
    const csv = `\uFEFF${kepala.join(',')}\n${baris.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-sesi-guru_${mulai}_s/d_${sampai}.csv`.replace(/\//g, '-');
    a.click();
    URL.revokeObjectURL(url);
    catatAudit('guru.sesi.unduh', {
      kategori: KATEGORI.GURU,
      target: `Riwayat sesi ${mulai} s/d ${sampai}`,
      detail: { jumlahBaris: tampil.length },
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.headerIcon}><ClipboardCheck size={26} color="#60a5fa" /></div>
          <div>
            <h1 style={styles.h1}>Sesi & Validasi Guru</h1>
            <p style={styles.sub}>
              Tempat kerja admin untuk absensi tentor: periksa sesi mengajar setelah
              kelas selesai, setujui yang sah, dan unduh riwayatnya.
            </p>
          </div>
        </div>

        {/* Batas kewenangan dijelaskan terang-terangan supaya tidak ada
            admin yang mencari angka honor di sini, dan tidak ada owner
            yang khawatir operasionalnya bocor ke halaman uang. */}
        <div style={styles.batasBox}>
          <Lock size={15} color="#93c5fd" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b style={{ color: '#93c5fd' }}>Halaman ini sengaja tanpa angka uang.</b>
            <p style={styles.batasText}>
              Rekap nominal & tarif ada di menu <b>Gaji Guru</b> (wilayah admin operasional).
              Yang bukan wilayah admin adalah <b>eksekusi pembayaran</b>: itu tombol Owner di
              Portal Owner → Bayar Tentor, dan hanya bisa menekan bayar untuk sesi yang sudah
              Anda validasi di sini. Status "Valid" Anda adalah pintu pembuka pembayaran itu.
            </p>
          </div>
        </div>

        <div style={styles.statusRow}>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{tampil.length}</div>
            <div style={styles.statLabel}>Sesi pada rentang ini</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: jumlahMenunggu > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)' }}>
            <div style={{ ...styles.statAngka, color: jumlahMenunggu > 0 ? '#fbbf24' : '#fff' }}>{jumlahMenunggu}</div>
            <div style={styles.statLabel}>Menunggu validasi Anda</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{tampil.length - jumlahMenunggu}</div>
            <div style={styles.statLabel}>Sudah valid</div>
          </div>
        </div>

        {error && <div style={styles.errorBar}><AlertTriangle size={14} /> {error}</div>}

        {/* ===== FILTER ===== */}
        <div style={styles.filterCard}>
          <div style={styles.filterRow}>
            <div style={styles.filterField}>
              <label style={styles.labelField}><CalendarDays size={11} /> Dari</label>
              <input type="date" style={styles.select} value={mulai} onChange={(e) => setMulai(e.target.value)} />
            </div>
            <div style={styles.filterField}>
              <label style={styles.labelField}><CalendarDays size={11} /> Sampai</label>
              <input type="date" style={styles.select} value={sampai} onChange={(e) => setSampai(e.target.value)} />
            </div>
            <div style={{ ...styles.filterField, flex: 1 }}>
              <label style={styles.labelField}><Search size={11} /> Cari</label>
              <input
                style={styles.select}
                placeholder="nama guru, program, kelas..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </div>
          </div>
          <div style={styles.filterRow2}>
            {guruId && (
              <button
                style={styles.chipGuru}
                onClick={() => setGuruId('')}
                title="Hapus filter per guru"
              >
                Hanya 1 guru terpilih ✕ tampilkan semua
              </button>
            )}
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={hanyaMenunggu} onChange={(e) => setHanyaMenunggu(e.target.checked)} />
              Tampilkan yang menunggu validasi saja
            </label>
            <div style={{ flex: 1 }} />
            <button style={styles.btnSekunder} onClick={muat} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Muat Ulang
            </button>
            <button style={styles.btnUtama} onClick={unduhCsv} disabled={tampil.length === 0}>
              <Download size={14} /> Unduh CSV ({tampil.length})
            </button>
          </div>
        </div>

        {/* ===== DAFTAR SESI ===== */}
        <div style={styles.listCard}>
          {loading ? (
            <div style={styles.kosong}><RefreshCw size={22} className="spin" /> Memuat riwayat sesi...</div>
          ) : tampil.length === 0 ? (
            <div style={styles.kosong}>
              <ClipboardCheck size={26} />
              <div>Tidak ada sesi pada rentang & saringan ini.</div>
            </div>
          ) : (
            <div style={styles.tabelScroll}>
              <table style={styles.tabel}>
                <thead>
                  <tr>
                    <th style={styles.th}>Waktu</th>
                    <th style={styles.th}>Guru</th>
                    <th style={styles.th}>Kelas</th>
                    <th style={styles.th}>Kehadiran</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tampil.map((l) => {
                    const valid = l.status === STATUS_VALID;
                    const tanggal = String(l.tanggal || '').split(' ')[0];
                    return (
                      <tr key={l.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.tanggal}>{tanggal}</div>
                          <div style={styles.kecil}>{l.waktu || ''}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.nama}>{l.namaGuru || 'Tanpa Nama'}</div>
                          <div style={styles.kecil}>{[l.program, l.level].filter(Boolean).join(' · ') || '-'}</div>
                          <div style={styles.kecil}>{l.kegiatan || ''}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.kecil2}>{l.kelasNama || l.tipeKelas || '-'}</div>
                          <div style={styles.kecil}>
                            <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                            {typeof l.durasiJam === 'number' ? `${l.durasiJam} jam` : '-'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.kecil2}>
                            <Users size={11} style={{ display: 'inline', marginRight: 3 }} />
                            {l.siswaHadir ?? 0} siswa hadir
                          </div>
                          {l.fotoAbsensiUrl ? (
                            <a href={l.fotoAbsensiUrl} target="_blank" rel="noreferrer" style={styles.linkBukti}>
                              <Camera size={11} /> bukti foto
                            </a>
                          ) : (
                            <div style={styles.kecil}>tanpa foto</div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={valid ? styles.pillHijau : styles.pillKuning}>
                            {valid ? 'Valid' : 'Menunggu'}
                          </span>
                          {!valid && <div style={styles.kecil}>perlu persetujuan admin</div>}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          {valid ? (
                            <button
                              style={styles.btnIkon}
                              title="Batalkan validasi (mis. ada kekeliruan catatan)"
                              onClick={() => batalkan(l)}
                              disabled={prosesId === l.id}
                            >
                              <Undo2 size={14} />
                            </button>
                          ) : (
                            <button
                              style={{ ...styles.btnIkon, color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)' }}
                              title="Setujui sesi ini sebagai valid"
                              onClick={() => setujui(l)}
                              disabled={prosesId === l.id}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.catatan}>
          <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b style={{ color: '#fbbf24' }}>Tanggung jawab validasi</b>
            <p style={styles.batasText}>
              Status "Valid" yang Anda berikan dipakai Owner sebagai dasar membayar honor.
              Kalau ada sesi yang janggal (durasi tidak masuk akal, siswa hadir nol padahal
              kelas berjalan, bukti foto tidak ada), jangan disetujui dulu — konfirmasi ke
              tentornya. Semua persetujuan & pembatalan Anda tercatat di Jejak Aktivitas.
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
  wrap: { maxWidth: 1150, margin: '0 auto' },
  header: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  h1: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, margin: '4px 0 0', lineHeight: 1.55, maxWidth: 660 },

  batasBox: {
    display: 'flex', gap: 11, alignItems: 'flex-start',
    background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 14, padding: '13px 15px', marginBottom: 14,
  },
  batasText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6, margin: '5px 0 0' },

  statusRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 },
  statCard: {
    background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '13px 16px', textAlign: 'center',
  },
  statAngka: { color: '#fff', fontSize: 23, fontWeight: 800, lineHeight: 1 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 },

  errorBar: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '10px 13px', color: '#fca5a5', fontSize: 12.5, marginBottom: 12,
  },

  filterCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, alignItems: 'end' },
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
    colorScheme: 'dark',
  },
  chipGuru: {
    background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)',
    borderRadius: 20, padding: '6px 12px', color: '#93c5fd',
    fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
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

  listCard: {
    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, overflow: 'hidden',
  },
  kosong: {
    padding: '46px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  tabelScroll: { overflowX: 'auto' },
  tabel: { width: '100%', borderCollapse: 'collapse', minWidth: 860 },
  th: {
    textAlign: 'left', padding: '12px 14px', fontSize: 10.5, fontWeight: 700,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.6,
    borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
  },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '11px 14px', fontSize: 13, color: 'rgba(255,255,255,0.8)', verticalAlign: 'top' },
  tanggal: { color: '#fff', fontWeight: 700, fontSize: 12.5 },
  nama: { color: '#fff', fontWeight: 700, fontSize: 13 },
  kecil: { color: 'rgba(255,255,255,0.38)', fontSize: 10.5, marginTop: 2 },
  kecil2: { color: 'rgba(255,255,255,0.6)', fontSize: 11.5 },
  linkBukti: {
    color: '#93c5fd', fontSize: 10.5, textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3,
  },
  pillHijau: { background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20 },
  pillKuning: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20 },
  btnIkon: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: 7, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },

  catatan: {
    display: 'flex', gap: 11, alignItems: 'flex-start', marginTop: 16,
    background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)',
    borderRadius: 14, padding: '13px 15px',
  },
};

export default SesiGuruPage;
