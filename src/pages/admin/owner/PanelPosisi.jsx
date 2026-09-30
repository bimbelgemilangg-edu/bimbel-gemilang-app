// src/pages/admin/owner/PanelPosisi.jsx
// 🔥 TAB "POSISI REAL-TIME" Portal Owner: jawaban sekali lirik buat
// pertanyaan "posisi uangku SEKARANG gimana?". Semua angka dihitung
// dari snapshot Firestore live (onSnapshot di shell OwnerFinance), jadi
// begitu admin mencatat transaksi di halaman Keuangan, angka di sini
// ikut berubah TANPA perlu refresh.

import React, { useMemo } from 'react';
import {
  Wallet, ShieldCheck, AlertCircle, PiggyBank, Activity,
  CalendarClock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  hitungSaldo, analisisSiswa, analisisTagihan, labaRugiAkrual,
  keyBulanIni, namaBulanDariKey, urutTanggalTerbaru, formatWaktu,
  tanggalLokalHariIni,
} from './keuanganOwnerUtils';

const PanelPosisi = ({ logs, students, tagihanList, teacherLogs, settings, rp, isMobile, terakhirUpdate }) => {
  const data = useMemo(() => {
    const now = new Date();
    const saldo = hitungSaldo(logs);
    const siswaInfo = analisisSiswa(students, now);
    const tagihanInfo = analisisTagihan(tagihanList, tanggalLokalHariIni());
    const bulanIni = keyBulanIni();
    const akrual = labaRugiAkrual({ students, teacherLogs, settings }, [bulanIni]);
    const feed = [...logs].sort(urutTanggalTerbaru).slice(0, 12);
    return { saldo, siswaInfo, tagihanInfo, akrual, feed, bulanIni, now };
  }, [logs, students, tagihanList, teacherLogs, settings]);

  const { saldo, siswaInfo, tagihanInfo, akrual, feed, bulanIni } = data;
  const profitBersih = akrual.profit;

  return (
    <div>
      {/* ===== RINGKASAN POSISI (bahasa manusia, bukan istilah akuntansi) ===== */}
      <div style={styles.ringkasBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Activity size={16} color="#0ea5e9" />
          <b style={{ fontSize: 13, color: '#0c4a6e' }}>Posisi kamu saat ini</b>
          <span style={styles.liveBadge}><span style={styles.liveDot} /> LIVE</span>
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
            Update otomatis terakhir: {terakhirUpdate ? formatWaktu(terakhirUpdate) : '-'} — tidak perlu refresh
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#334155', lineHeight: 1.8 }}>
          Uang yang benar-benar ada sekarang: <b>{rp(saldo.total)}</b> (tunai {rp(saldo.tunai)} + bank {rp(saldo.bank)}
          {saldo.tanpaMetode !== 0 ? <> + data lama {rp(saldo.tanpaMetode)}</> : null}).
          Profit bersih bulan ini yang aman diambil: <b style={{ color: profitBersih >= 0 ? '#059669' : '#dc2626' }}>{rp(profitBersih)}</b>.
          Yang masih harus ditagih ke siswa: <b style={{ color: '#dc2626' }}>{rp(siswaInfo.totalPiutang)}</b>.
          Yang <u>jangan diambil dulu</u> karena masih titipan sesi belum diajarkan: <b style={{ color: '#d97706' }}>{rp(siswaInfo.totalKewajiban)}</b>.
        </p>
      </div>

      {/* ===== HERO: KAS vs PROFIT ===== */}
      <div style={styles.heroGrid(isMobile)}>
        <div style={styles.heroCard('#1e293b')}>
          <Wallet size={20} color="rgba(255,255,255,0.6)" />
          <span style={styles.heroLabel}>Kas Yang Ada Sekarang</span>
          <h1 style={styles.heroValue}>{rp(saldo.total)}</h1>
          <div style={styles.heroDetail}>
            <span>💵 Tunai: {rp(saldo.tunai)}</span>
            <span>💳 Bank: {rp(saldo.bank)}</span>
            {saldo.tanpaMetode !== 0 && <span>❔ Data lama tanpa metode: {rp(saldo.tanpaMetode)}</span>}
          </div>
          {tagihanInfo.belumDiterima > 0 && (
            <p style={{ ...styles.heroNote, color: '#fde68a' }}>
              📋 Cicilan terjadwal yang BELUM diterima: {rp(tagihanInfo.belumDiterima)} ({tagihanInfo.jumlahJadwal} tagihan) — TIDAK dihitung sebagai kas. Baru masuk kas saat tiap cicilannya dibayar.
            </p>
          )}
          <p style={styles.heroNote}>⚠️ Ini BUKAN profit. Sebagian adalah titipan siswa yang bayar di muka.</p>
        </div>

        <div style={styles.heroCard(profitBersih >= 0 ? '#065f46' : '#7f1d1d')}>
          <ShieldCheck size={20} color="rgba(255,255,255,0.6)" />
          <span style={styles.heroLabel}>Profit Bersih {namaBulanDariKey(bulanIni)} (Aman Diambil)</span>
          <h1 style={styles.heroValue}>{rp(profitBersih)}</h1>
          <div style={styles.heroDetail}>
            <span>Dari {siswaInfo.jumlahSiswaAktif} siswa aktif bulan ini</span>
            <span>Pendapatan kepake: {rp(akrual.pendapatan)}</span>
          </div>
          <p style={styles.heroNote}>✅ Pendapatan yang sudah "kepake" (diajarkan) dikurangi honor guru, biaya tetap, dan penyusutan. Rincian lengkap di tab 📈 Analisis.</p>
        </div>
      </div>

      {/* ===== KEWAJIBAN & PIUTANG ===== */}
      <div style={styles.warnGrid(isMobile)}>
        <div style={styles.warnCard('#fff7ed', '#f97316')}>
          <PiggyBank size={18} color="#f97316" />
          <span style={styles.warnLabel}>Kewajiban Belum Terpenuhi (Titipan)</span>
          <h3 style={{ ...styles.warnValue, color: '#f97316' }}>{rp(siswaInfo.totalKewajiban)}</h3>
          <p style={styles.warnDesc}>Duit yang SUDAH masuk kas, tapi masih "milik" sesi belajar yang BELUM diajarkan (siswa bayar 3/6 bulan di muka). <b>Jangan diambil dulu.</b></p>
        </div>
        <div style={styles.warnCard('#fef2f2', '#ef4444')}>
          <AlertCircle size={18} color="#ef4444" />
          <span style={styles.warnLabel}>Piutang (Belum Dibayar Siswa)</span>
          <h3 style={{ ...styles.warnValue, color: '#ef4444' }}>{rp(siswaInfo.totalPiutang)}</h3>
          <p style={styles.warnDesc}>
            Tagihan yang belum dilunasi siswa — duit yang belum masuk sama sekali.
            {siswaInfo.rinciPiutang.length > 0 && <> Terbesar: <b>{siswaInfo.rinciPiutang[0].nama}</b> ({rp(siswaInfo.rinciPiutang[0].sisa)}).</>}
          </p>
        </div>
      </div>

      {/* ===== LIVE FEED + CICILAN JATUH TEMPO ===== */}
      <div style={styles.duaKolom(isMobile)}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <Activity size={16} color="#0ea5e9" /> Transaksi Terbaru
            <span style={styles.liveBadge}><span style={styles.liveDot} /> LIVE</span>
          </h3>
          {feed.length === 0 ? (
            <p style={styles.kosong}>Belum ada transaksi tercatat.</p>
          ) : (
            <div>
              {feed.map((l, i) => (
                <div key={l.id || i} style={styles.feedRow}>
                  <div style={styles.feedIkon(l.type)}>
                    {l.type === 'Pemasukan' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                      {l.category}{l.namaSiswa ? <span style={{ fontWeight: 400, color: '#64748b' }}> — {l.namaSiswa}</span> : null}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      {l.date || 'tanpa tanggal'} • {l.methodAsli || 'tanpa metode'}
                      {l.methodAsli === 'Cicilan' && l.type === 'Pemasukan' ? ' • komitmen, uang belum diterima' : ''}
                    </div>
                  </div>
                  <b style={{ fontSize: 12, color: l.type === 'Pemasukan' ? '#059669' : '#dc2626', whiteSpace: 'nowrap' }}>
                    {l.type === 'Pemasukan' ? '+' : '-'} {rp(l.amount)}
                  </b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}><CalendarClock size={16} color="#d97706" /> Cicilan Jatuh Tempo (30 hari ke depan)</h3>
          {tagihanInfo.jatuhTempo30.length === 0 ? (
            <p style={styles.kosong}>Tidak ada cicilan siswa yang jatuh tempo dalam 30 hari ke depan. 👍</p>
          ) : (
            <div>
              {tagihanInfo.jatuhTempo30.map((c, i) => (
                <div key={i} style={styles.feedRow}>
                  <div style={styles.feedIkon(c.telat ? 'Pengeluaran' : 'Netral')}>
                    <CalendarClock size={13} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{c.namaSiswa} <span style={{ fontWeight: 400, color: '#64748b' }}>• cicilan ke-{c.bulanKe}</span></div>
                    <div style={{ fontSize: 10, color: c.telat ? '#dc2626' : '#94a3b8', fontWeight: c.telat ? 800 : 400 }}>
                      {c.telat ? `⚠️ TERLAMBAT — jatuh tempo ${c.jatuhTempo}` : `Jatuh tempo ${c.jatuhTempo}`}
                    </div>
                  </div>
                  <b style={{ fontSize: 12, color: '#d97706', whiteSpace: 'nowrap' }}>{rp(c.nominal)}</b>
                </div>
              ))}
              <div style={styles.feedTotal}>
                <span>Total yang akan masuk bila semua tepat waktu</span>
                <b style={{ color: '#d97706' }}>{rp(tagihanInfo.jatuhTempo30.reduce((s, c) => s + c.nominal, 0))}</b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  ringkasBox: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 14, padding: '14px 18px', marginBottom: 16 },
  liveBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#15803d', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse-dot 1.5s ease-in-out infinite' },

  heroGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15, marginBottom: 16 }),
  heroCard: (bg) => ({ background: bg, padding: 20, borderRadius: 16, color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }),
  heroLabel: { display: 'block', fontSize: 11, opacity: 0.8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { margin: '8px 0', fontSize: 26, fontWeight: 'bold' },
  heroDetail: { display: 'flex', gap: 16, fontSize: 11, opacity: 0.85, marginBottom: 8, flexWrap: 'wrap' },
  heroNote: { fontSize: 10, opacity: 0.75, margin: 0, lineHeight: 1.5 },

  warnGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15, marginBottom: 16 }),
  warnCard: (bg, color) => ({ background: bg, padding: 16, borderRadius: 14, border: `1px solid ${color}30` }),
  warnLabel: { display: 'block', fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 700 },
  warnValue: { margin: '6px 0', fontSize: 20, fontWeight: 'bold' },
  warnDesc: { fontSize: 10.5, color: '#64748b', margin: 0, lineHeight: 1.6 },

  duaKolom: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15, marginBottom: 16, alignItems: 'start' }),
  card: { background: 'white', padding: 18, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  cardTitle: { margin: '0 0 12px', fontSize: 14, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kosong: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 16, margin: 0 },

  feedRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' },
  feedIkon: (type) => ({
    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    background: type === 'Pemasukan' ? '#dcfce7' : type === 'Pengeluaran' ? '#fee2e2' : '#fef3c7',
    color: type === 'Pemasukan' ? '#16a34a' : type === 'Pengeluaran' ? '#dc2626' : '#d97706',
  }),
  feedTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b', padding: '10px 0 0', fontWeight: 700 },
};

export default PanelPosisi;
