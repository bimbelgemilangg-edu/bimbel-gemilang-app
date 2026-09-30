// src/pages/admin/owner/PanelNeraca.jsx
// 🔥 TAB "NERACA & LAPORAN" Portal Owner: jawaban buat pertanyaan
// "kalau tahun ditutup, posisi bisnis ini sebenarnya berapa?".
// Menampilkan NERACA (aset = kewajiban + ekuitas) per tanggal pilihan
// (bisa 31 Desember buat tutup buku akhir tahun), arus kas tahunan,
// dan tombol download laporan lengkap PDF/Excel yang isinya semua:
// posisi kas, laba rugi kas & akrual, neraca, arus kas, piutang, dan
// jadwal cicilan.
//
// Catatan kejujuran yang penting (juga tertulis di laporan):
// - Kas per tanggal lampau dihitung akurat dari tanggal finance_logs.
// - Piutang & titipan siswa dihitung dari data siswa TERBARU, karena
//   sistem tidak menyimpan riwayat perubahan data siswa per tanggal.
// - Ekuitas = angka penyeimbang (Aset - Kewajiban). Modal awal owner
//   tidak pernah dicatat terpisah, jadi ekuitas = akumulasi hasil usaha
//   yang terekam sistem.

import React, { useState, useMemo } from 'react';
import { Landmark, FileDown, FileSpreadsheet, Info, CalendarDays } from 'lucide-react';
import {
  tanggalLokalHariIni, keyBulanIni, daftarBulanTahun, namaBulanDariKey,
  bangunLaporan, unduhPDFLaporan, unduhExcelLaporan, urutTanggalTerbaru,
} from './keuanganOwnerUtils';

const PanelNeraca = ({ logs, students, teacherLogs, settings, tagihanList, rp, isMobile }) => {
  const [tanggalAcuan, setTanggalAcuan] = useState(tanggalLokalHariIni());
  const tahunIni = new Date().getFullYear();
  const hariIni = tanggalLokalHariIni();

  const laporan = useMemo(() => {
    const tahun = String(tanggalAcuan).slice(0, 4);
    // Periode laba rugi mengikuti tanggal acuan: tahun penuh untuk
    // tahun lampau (tutup buku), tahun berjalan s.d. bulan ini.
    const batas = parseInt(tahun, 10) === tahunIni ? keyBulanIni() : null;
    const bulanKeys = daftarBulanTahun(tahun, batas);
    return bangunLaporan({
      logs, students, teacherLogs, settings, tagihanList,
      tanggalAcuan,
      periodeLabel: `Tahun ${tahun}${batas ? ` (s.d. ${namaBulanDariKey(batas)})` : ' (tahun penuh)'}`,
      bulanKeys,
    });
  }, [logs, students, teacherLogs, settings, tagihanList, tanggalAcuan, tahunIni]);

  const { neraca, arusKas, saldoPerAcuan, kas, akrual, info } = laporan;

  const akhirTahunLalu = `${tahunIni - 1}-12-31`;
  const akhirTahunIni = `${tahunIni}-12-31`;

  const handleDownload = (jenis) => {
    const cap = String(tanggalAcuan);
    if (jenis === 'pdf') unduhPDFLaporan(laporan, `Neraca-Laporan-Gemilang-${cap}.pdf`);
    else {
      const setBulan = new Set(info.bulanKeys);
      const transaksiPeriode = [...logs]
        .filter(l => setBulan.has((l.date || '').slice(0, 7)))
        .sort(urutTanggalTerbaru);
      unduhExcelLaporan(laporan, transaksiPeriode, `Neraca-Laporan-Gemilang-${cap}.xlsx`);
    }
  };

  const barisNeraca = (label, nilai, opts = {}) => (
    <div style={{
      ...styles.neracaRow,
      ...(opts.inden ? { paddingLeft: 26 } : {}),
      ...(opts.tebal ? { fontWeight: 900, background: '#f8fafc', borderTop: '1.5px solid #e2e8f0' } : {}),
      ...(opts.header ? { fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: 10.5, letterSpacing: 0.8, background: '#f1f5f9' } : {}),
    }}>
      <span style={{ color: opts.header ? '#1e293b' : '#475569' }}>{label}</span>
      <b style={{ color: opts.warna || '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{nilai}</b>
    </div>
  );

  return (
    <div>
      {/* ===== KONTROL TANGGAL + DOWNLOAD ===== */}
      <div style={styles.kontrolBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <CalendarDays size={16} color="#475569" />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Neraca per tanggal:</span>
          <input
            type="date"
            value={tanggalAcuan}
            max={hariIni}
            onChange={e => e.target.value && setTanggalAcuan(e.target.value)}
            style={styles.inputTanggal}
          />
          <button onClick={() => setTanggalAcuan(hariIni)} style={styles.btnCepat(tanggalAcuan === hariIni)}>Hari ini</button>
          <button onClick={() => setTanggalAcuan(akhirTahunLalu)} style={styles.btnCepat(tanggalAcuan === akhirTahunLalu)}>Akhir {tahunIni - 1}</button>
          <button onClick={() => setTanggalAcuan(akhirTahunIni > hariIni ? hariIni : akhirTahunIni)} style={styles.btnCepat(false)} title={akhirTahunIni > hariIni ? 'Tahun ini belum selesai -- dipakai hari ini dulu' : ''}>
            Akhir {tahunIni}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => handleDownload('pdf')} style={styles.btnUnduh('#b91c1c')}><FileDown size={14} /> Laporan Lengkap PDF</button>
          <button onClick={() => handleDownload('excel')} style={styles.btnUnduh('#065f46')}><FileSpreadsheet size={14} /> Laporan Lengkap Excel</button>
        </div>
      </div>

      {/* ===== TABEL NERACA ===== */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}><Landmark size={17} color="#1e293b" /> Neraca Bisnis per {tanggalAcuan}</h3>
        <p style={styles.ketKecil}>
          Foto posisi bisnis di satu tanggal: semua yang kamu MILIKI (aset), semua yang masih jadi TANGGUNGAN ke siswa (kewajiban), dan sisanya milikmu sebagai pemilik (ekuitas).
        </p>

        <div style={styles.neracaBox}>
          {barisNeraca('ASET (yang dimiliki bisnis)', '', { header: true })}
          {barisNeraca('Kas tunai (uang fisik)', rp(neraca.aset.tunai), { inden: true })}
          {barisNeraca('Bank / transfer', rp(neraca.aset.bank), { inden: true })}
          {neraca.aset.tanpaMetode !== 0 && barisNeraca('Data lama tanpa metode', rp(neraca.aset.tanpaMetode), { inden: true })}
          {barisNeraca('Piutang siswa (tagihan belum dibayar)', rp(neraca.aset.piutang), { inden: true })}
          {barisNeraca('TOTAL ASET', rp(neraca.aset.total), { tebal: true })}

          <div style={{ height: 10 }} />
          {barisNeraca('KEWAJIBAN (tanggungan ke siswa)', '', { header: true })}
          {barisNeraca('Titipan siswa — sesi belajar belum diajarkan', rp(neraca.kewajiban.titipan), { inden: true, warna: '#d97706' })}
          {barisNeraca('TOTAL KEWAJIBAN', rp(neraca.kewajiban.total), { tebal: true })}

          <div style={{ height: 10 }} />
          {barisNeraca('EKUITAS (hak pemilik = Aset - Kewajiban)', rp(neraca.ekuitas), { tebal: true, warna: neraca.ekuitas >= 0 ? '#059669' : '#dc2626' })}
        </div>

        <div style={styles.grid2(isMobile)}>
          <div style={styles.memoBox('#fffbeb', '#f59e0b')}>
            <span style={styles.memoLabel}>📋 Di luar neraca: komitmen cicilan belum diterima</span>
            <b style={{ fontSize: 15, color: '#b45309' }}>{rp(neraca.memo.komitmenCicilanBelumDiterima)}</b>
            <span style={styles.memoKet}>{neraca.memo.jumlahJadwalCicilan} jadwal cicilan siswa. Bukan kas, bukan piutang akrual — baru tercatat begitu cicilannya dibayar.</span>
          </div>
          <div style={styles.memoBox('#eff6ff', '#3b82f6')}>
            <span style={styles.memoLabel}>🗂️ Sejak awal usaha (basis kas, semua riwayat)</span>
            <b style={{ fontSize: 15, color: '#1d4ed8' }}>{rp(neraca.memo.surplusKasSejakAwal)}</b>
            <span style={styles.memoKet}>Total masuk {rp(neraca.memo.totalMasukSejakAwal)} − total keluar {rp(neraca.memo.totalKeluarSejakAwal)} = surplus kas kumulatif.</span>
          </div>
        </div>

        <div style={styles.infoBox}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 10.5, lineHeight: 1.65 }}>
            <b>Cara baca:</b> kas per tanggal lampau dihitung akurat dari tanggal tiap transaksi. Piutang & titipan memakai data siswa terbaru (sistem tidak menyimpan riwayat data siswa masa lalu).
            Ekuitas adalah angka penyeimbang — modal awal yang kamu setor dulu tidak pernah dicatat di sistem, jadi ekuitas ≈ akumulasi hasil usaha yang terekam.
            Untuk tutup buku akhir tahun: pilih 31 Desember, lalu download PDF-nya sebagai arsip permanen.
          </span>
        </div>
      </div>

      {/* ===== ARUS KAS TAHUNAN ===== */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>💹 Arus Kas Tahun {arusKas.tahun}</h3>
        <p style={styles.ketKecil}>Pergerakan uang tunai+bank dari awal sampai akhir tahun — biar kelihatan bulan mana yang surplus dan bulan mana yang minus.</p>
        <div style={styles.grid2(isMobile)}>
          <div style={styles.statMini('#f8fafc')}>
            <span style={styles.statMiniLabel}>Saldo awal {arusKas.tahun}</span>
            <b>{rp(arusKas.saldoAwal)}</b>
          </div>
          <div style={styles.statMini('#f0fdf4')}>
            <span style={styles.statMiniLabel}>Total kas masuk</span>
            <b style={{ color: '#059669' }}>{rp(arusKas.totalMasuk)}</b>
          </div>
          <div style={styles.statMini('#fef2f2')}>
            <span style={styles.statMiniLabel}>Total kas keluar</span>
            <b style={{ color: '#dc2626' }}>{rp(arusKas.totalKeluar)}</b>
          </div>
          <div style={styles.statMini(arusKas.saldoAkhir >= 0 ? '#eff6ff' : '#fff7ed')}>
            <span style={styles.statMiniLabel}>Saldo akhir ({tanggalAcuan <= `${arusKas.tahun}-12-31` ? 'per ' + tanggalAcuan : 'akhir tahun'})</span>
            <b style={{ color: '#1d4ed8' }}>{rp(arusKas.saldoAkhir)}</b>
          </div>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Bulan</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Kas Masuk</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Kas Keluar</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Netto</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Saldo Akhir Bulan</th>
              </tr>
            </thead>
            <tbody>
              {arusKas.perBulan.map(b => (
                <tr key={b.bulan} style={styles.tr}>
                  <td style={styles.td}><b>{namaBulanDariKey(b.bulan)}</b></td>
                  <td style={{ ...styles.td, textAlign: 'right', color: '#059669' }}>{rp(b.masuk)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', color: '#dc2626' }}>{rp(b.keluar)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: b.netto >= 0 ? '#059669' : '#dc2626' }}>{rp(b.netto)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rp(b.saldoAkhirBulan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {arusKas.totalKomitmen > 0 && (
          <p style={{ fontSize: 10.5, color: '#b45309', margin: '10px 0 0' }}>
            📋 Memo: komitmen perpanjangan cicilan yang tercatat tahun {arusKas.tahun} tapi belum tentu diterima: {rp(arusKas.totalKomitmen)} — tidak masuk hitungan kas mana pun.
          </p>
        )}
      </div>

      {/* ===== RINGKASAN LABA RUGI TAHUN (biar gak perlu pindah tab) ===== */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🏆 Ringkasan Hasil Usaha {info.periodeLabel}</h3>
        <div style={styles.grid2(isMobile)}>
          <div style={styles.statMini('#f8fafc')}>
            <span style={styles.statMiniLabel}>Surplus kas (masuk − keluar)</span>
            <b style={{ color: kas.netto >= 0 ? '#059669' : '#dc2626' }}>{rp(kas.netto)}</b>
          </div>
          <div style={styles.statMini('#f8fafc')}>
            <span style={styles.statMiniLabel}>Profit sesungguhnya (akrual)</span>
            <b style={{ color: akrual.profit >= 0 ? '#059669' : '#dc2626' }}>{rp(akrual.profit)}</b>
          </div>
          <div style={styles.statMini('#f8fafc')}>
            <span style={styles.statMiniLabel}>Kas per {tanggalAcuan}</span>
            <b>{rp(saldoPerAcuan.total)}</b>
          </div>
          <div style={styles.statMini('#f8fafc')}>
            <span style={styles.statMiniLabel}>Ekuitas (hak pemilik)</span>
            <b style={{ color: neraca.ekuitas >= 0 ? '#059669' : '#dc2626' }}>{rp(neraca.ekuitas)}</b>
          </div>
        </div>
        <p style={{ fontSize: 10.5, color: '#94a3b8', margin: '10px 0 0', lineHeight: 1.6 }}>
          Rincian penuh per kategori & per bulan ada di tab 📈 Analisis. Download PDF/Excel di atas sudah memuat SEMUA: posisi kas, laba rugi dua basis, neraca, arus kas 12 bulan, daftar piutang, dan jadwal cicilan.
        </p>
      </div>
    </div>
  );
};

const styles = {
  kontrolBar: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  inputTanggal: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#1e293b', background: 'white' },
  btnCepat: (aktif) => ({ padding: '7px 12px', borderRadius: 8, border: aktif ? '2px solid #1e293b' : '1px solid #e2e8f0', background: aktif ? '#1e293b' : 'white', color: aktif ? 'white' : '#475569', cursor: 'pointer', fontWeight: 800, fontSize: 10.5 }),
  btnUnduh: (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', background: bg, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 11.5 }),

  card: { background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 16 },
  cardTitle: { margin: '0 0 4px', fontSize: 15, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ketKecil: { fontSize: 11, color: '#94a3b8', margin: '2px 0 14px', lineHeight: 1.6, maxWidth: 820 },

  neracaBox: { border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  neracaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '9px 14px', fontSize: 12, borderBottom: '1px solid #f1f5f9' },

  grid2: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12 }),
  memoBox: (bg, color) => ({ background: bg, border: `1px solid ${color}40`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 2 }),
  memoLabel: { fontSize: 10.5, fontWeight: 800, color: '#475569' },
  memoKet: { fontSize: 10, color: '#94a3b8', lineHeight: 1.55 },

  statMini: (bg) => ({ background: bg, borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 3, border: '1px solid #f1f5f9' }),
  statMiniLabel: { fontSize: 9.5, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 },

  infoBox: { background: '#eff6ff', padding: 12, borderRadius: 10, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: 8, color: '#1e40af', marginTop: 12 },

  table: { width: '100%', borderCollapse: 'collapse', minWidth: 560 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '9px 10px', fontSize: 9.5, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 10px', fontSize: 11.5, color: '#334155' },
};

export default PanelNeraca;
