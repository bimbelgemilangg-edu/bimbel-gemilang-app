// src/pages/admin/owner/PanelAnalisis.jsx
// 🔥 TAB "ANALISIS & LABA RUGI" Portal Owner: jawab pertanyaan "bulan /
// tahun ini usahaku untung berapa sih, dan duitnya habis ke mana?".
// Dua sudut pandang disajikan berdampingan dan dijelaskan pakai bahasa
// manusia:
//   1. BASIS KAS   = uang yang beneran masuk/keluar di periode itu
//                    (dari finance_logs, komitmen cicilan TIDAK dihitung).
//   2. BASIS AKRUAL= "profit sesungguhnya" -- pendapatan dihitung dari
//                    jasa yang sudah/sedang DIAJARKAN per bulan dikurangi
//                    honor guru, biaya tetap, dan penyusutan.
// Plus grafik tren 12 bulan (recharts) dan komposisi kategori, serta
// tombol download laporan lengkap periode terpilih (PDF & Excel).

import React, { useState, useMemo } from 'react';
import { FileDown, FileSpreadsheet, Info, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  keyBulanIni, namaBulanDariKey, daftarBulanTahun,
  daftar12BulanTerakhir, agregatBulanan, ringkasKas, kategoriJadiArray,
  labaRugiAkrual, analisisSiswa, NAMA_BULAN_PENDEK, rpFmt,
  bangunLaporan, unduhPDFLaporan, unduhExcelLaporan, urutTanggalTerbaru,
  tanggalLokalHariIni,
} from './keuanganOwnerUtils';

const WARNA_PIE = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b', '#84cc16'];

const PanelAnalisis = ({ logs, students, teacherLogs, settings, tagihanList, rp, isMobile, privacyMode }) => {
  const tahunIni = new Date().getFullYear();
  const [mode, setMode] = useState('bulan'); // 'bulan' | 'tahun'
  const [bulanKey, setBulanKey] = useState(keyBulanIni());
  const [tahun, setTahun] = useState(tahunIni);

  // Daftar tahun yang punya data + tahun berjalan.
  const opsiTahun = useMemo(() => {
    const set = new Set([tahunIni]);
    for (const l of logs) {
      const y = parseInt(String(l.date || '').slice(0, 4), 10);
      if (y >= 2000 && y <= tahunIni + 1) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [logs, tahunIni]);

  const bulanKeys = useMemo(() => {
    if (mode === 'bulan') return [bulanKey];
    // Tahun berjalan cuma dihitung sampai bulan sekarang -- bulan depan
    // belum terjadi, jangan ikut "profit".
    const batas = tahun === tahunIni ? keyBulanIni() : null;
    return daftarBulanTahun(tahun, batas);
  }, [mode, bulanKey, tahun, tahunIni]);

  const periodeLabel = mode === 'bulan' ? namaBulanDariKey(bulanKey) : `Tahun ${tahun} (s.d. ${namaBulanDariKey(bulanKeys[bulanKeys.length - 1])})`;

  const hasil = useMemo(() => {
    const kas = ringkasKas(logs, bulanKeys);
    const akrual = labaRugiAkrual({ students, teacherLogs, settings }, bulanKeys);
    const siswaInfo = analisisSiswa(students, new Date());

    // Tren 12 bulan terakhir untuk grafik (terlepas dari periode terpilih).
    const agregat = agregatBulanan(logs);
    const trend = daftar12BulanTerakhir(keyBulanIni()).map(k => {
      const a = agregat.get(k) || { masuk: 0, keluar: 0, netto: 0 };
      const [, m] = k.split('-');
      return { label: NAMA_BULAN_PENDEK[parseInt(m, 10) - 1], masuk: a.masuk, keluar: a.keluar, netto: a.netto };
    });

    const pieKeluar = kategoriJadiArray(kas.perKategoriKeluar).map(k => ({ name: k.nama, value: k.nilai }));
    const pieMasuk = kategoriJadiArray(kas.perKategoriMasuk).map(k => ({ name: k.nama, value: k.nilai }));

    return { kas, akrual, siswaInfo, trend, pieKeluar, pieMasuk };
  }, [logs, students, teacherLogs, settings, bulanKeys]);

  const { kas, akrual, siswaInfo, trend, pieKeluar, pieMasuk } = hasil;

  const handleDownload = (jenis) => {
    const hariIni = tanggalLokalHariIni();
    // Tanggal acuan posisi kas: bulan/tahun lampau -> hari terakhirnya
    // (buat "neraca akhir tahun" persis per 31 Desember); periode yang
    // masih berjalan -> hari ini.
    let tanggalAcuan = hariIni;
    if (mode === 'bulan' && bulanKey < keyBulanIni()) {
      const [y, m] = bulanKey.split('-').map(v => parseInt(v, 10));
      tanggalAcuan = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    } else if (mode === 'tahun' && tahun < tahunIni) {
      tanggalAcuan = `${tahun}-12-31`;
    }
    const lap = bangunLaporan({
      logs, students, teacherLogs, settings, tagihanList,
      tanggalAcuan, periodeLabel, bulanKeys,
    });
    const cap = mode === 'bulan' ? bulanKey : String(tahun);
    if (jenis === 'pdf') unduhPDFLaporan(lap, `Laporan-Keuangan-Gemilang-${cap}.pdf`);
    else {
      const setBulan = new Set(bulanKeys);
      const transaksiPeriode = [...logs]
        .filter(l => setBulan.has((l.date || '').slice(0, 7)))
        .sort(urutTanggalTerbaru);
      unduhExcelLaporan(lap, transaksiPeriode, `Laporan-Keuangan-Gemilang-${cap}.xlsx`);
    }
  };

  const tooltipRp = (v) => rpFmt(v);

  return (
    <div>
      {/* ===== PEMILIH PERIODE + TOMBOL DOWNLOAD ===== */}
      <div style={styles.kontrolBar}>
        <div style={styles.modeToggle}>
          <button onClick={() => setMode('bulan')} style={styles.modeBtn(mode === 'bulan')}>Per Bulan</button>
          <button onClick={() => setMode('tahun')} style={styles.modeBtn(mode === 'tahun')}>Per Tahun</button>
        </div>
        {mode === 'bulan' ? (
          <input type="month" value={bulanKey} max={keyBulanIni()} onChange={e => e.target.value && setBulanKey(e.target.value)} style={styles.inputPeriode} />
        ) : (
          <select value={tahun} onChange={e => setTahun(parseInt(e.target.value, 10))} style={styles.inputPeriode}>
            {opsiTahun.map(t => <option key={t} value={t}>{t === tahunIni ? `${t} (tahun berjalan)` : t}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => handleDownload('pdf')} style={styles.btnUnduh('#b91c1c')}><FileDown size={14} /> Laporan PDF</button>
          <button onClick={() => handleDownload('excel')} style={styles.btnUnduh('#065f46')}><FileSpreadsheet size={14} /> Laporan Excel</button>
        </div>
      </div>

      {/* ===== KARTU RINGKASAN PERIODE ===== */}
      <div style={styles.grid3(isMobile)}>
        <div style={styles.statCard('#f0fdf4', '#16a34a')}>
          <TrendingUp size={16} color="#16a34a" />
          <span style={styles.statLabel}>Uang Masuk Diterima ({mode === 'bulan' ? 'bulan ini' : 'tahun ini'})</span>
          <b style={styles.statValue}>{rp(kas.masuk)}</b>
          <span style={styles.statSub}>Tunai {rp(kas.masukTunai)} • Transfer {rp(kas.masukTransfer)}{kas.masukLain !== 0 ? ` • tanpa metode ${rp(kas.masukLain)}` : ''}</span>
        </div>
        <div style={styles.statCard('#fef2f2', '#dc2626')}>
          <TrendingDown size={16} color="#dc2626" />
          <span style={styles.statLabel}>Uang Keluar</span>
          <b style={styles.statValue}>{rp(kas.keluar)}</b>
          <span style={styles.statSub}>{Object.keys(kas.perKategoriKeluar).length} kategori pengeluaran</span>
        </div>
        <div style={styles.statCard(kas.netto >= 0 ? '#eff6ff' : '#fff7ed', kas.netto >= 0 ? '#2563eb' : '#ea580c')}>
          <Scale size={16} color={kas.netto >= 0 ? '#2563eb' : '#ea580c'} />
          <span style={styles.statLabel}>Selisih Kas (Masuk - Keluar)</span>
          <b style={{ ...styles.statValue, color: kas.netto >= 0 ? '#2563eb' : '#ea580c' }}>{rp(kas.netto)}</b>
          <span style={styles.statSub}>
            {kas.komitmen > 0 ? `+ komitmen cicilan belum diterima ${rp(kas.komitmen)}` : 'tanpa komitmen cicilan menggantung'}
          </span>
        </div>
      </div>

      {/* ===== GRAFIK TREN 12 BULAN ===== */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📈 Tren 12 Bulan Terakhir — Uang Masuk vs Keluar</h3>
        {privacyMode ? (
          <p style={styles.privacyNote}>🙈 Mode sembunyi aktif — grafik dimatikan biar nominal tidak terlihat di layar. Matikan dulu (tombol di atas) untuk melihat grafik.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v) => (v >= 1000000 ? `${Math.round(v / 100000) / 10}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : v)} width={44} />
              <Tooltip formatter={tooltipRp} labelStyle={{ fontWeight: 800 }} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="masuk" name="Uang Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="keluar" name="Uang Keluar" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Line dataKey="netto" name="Netto" stroke="#1e293b" strokeWidth={2} dot={{ r: 2.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ===== PIE KATEGORI ===== */}
      <div style={styles.duaKolom(isMobile)}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💸 Pengeluaran per Kategori — {periodeLabel}</h3>
          {privacyMode ? <p style={styles.privacyNote}>🙈 Dimatikan saat mode sembunyi.</p>
            : pieKeluar.length === 0 ? <p style={styles.kosong}>Tidak ada pengeluaran di periode ini.</p>
              : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieKeluar} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {pieKeluar.map((entry, i) => <Cell key={i} fill={WARNA_PIE[i % WARNA_PIE.length]} />)}
                      </Pie>
                      <Tooltip formatter={tooltipRp} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {pieKeluar.map((k, i) => (
                    <div key={k.name} style={styles.legendRow}>
                      <span style={{ ...styles.legendDot, background: WARNA_PIE[i % WARNA_PIE.length] }} />
                      <span style={{ flex: 1 }}>{k.name}</span>
                      <b>{rp(k.value)}</b>
                      <span style={{ color: '#94a3b8', width: 44, textAlign: 'right' }}>{kas.keluar > 0 ? Math.round(k.value / kas.keluar * 100) : 0}%</span>
                    </div>
                  ))}
                </>
              )}
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💰 Pemasukan per Kategori — {periodeLabel}</h3>
          {privacyMode ? <p style={styles.privacyNote}>🙈 Dimatikan saat mode sembunyi.</p>
            : pieMasuk.length === 0 ? <p style={styles.kosong}>Tidak ada pemasukan diterima di periode ini.</p>
              : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieMasuk} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {pieMasuk.map((entry, i) => <Cell key={i} fill={WARNA_PIE[i % WARNA_PIE.length]} />)}
                      </Pie>
                      <Tooltip formatter={tooltipRp} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {pieMasuk.map((k, i) => (
                    <div key={k.name} style={styles.legendRow}>
                      <span style={{ ...styles.legendDot, background: WARNA_PIE[i % WARNA_PIE.length] }} />
                      <span style={{ flex: 1 }}>{k.name}</span>
                      <b>{rp(k.value)}</b>
                      <span style={{ color: '#94a3b8', width: 44, textAlign: 'right' }}>{kas.masuk > 0 ? Math.round(k.value / kas.masuk * 100) : 0}%</span>
                    </div>
                  ))}
                </>
              )}
        </div>
      </div>

      {/* ===== LABA RUGI DUA BASIS ===== */}
      <div style={styles.duaKolom(isMobile)}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🧮 Laba Rugi Basis Kas — {periodeLabel}</h3>
          <p style={styles.ketKecil}>Uang yang BENERAN masuk dan keluar di periode ini (komitmen cicilan tidak dihitung).</p>
          {kategoriJadiArray(kas.perKategoriMasuk).map(k => (
            <div key={'m-' + k.nama} style={styles.calcRow}>
              <span>+ {k.nama}</span><b style={{ color: '#059669' }}>{rp(k.nilai)}</b>
            </div>
          ))}
          {kategoriJadiArray(kas.perKategoriKeluar).map(k => (
            <div key={'k-' + k.nama} style={styles.calcRow}>
              <span>- {k.nama}</span><b style={{ color: '#dc2626' }}>{rp(k.nilai)}</b>
            </div>
          ))}
          <div style={styles.calcTotal}>
            <span>{kas.netto >= 0 ? '= SURPLUS KAS' : '= DEFISIT KAS'}</span>
            <b style={{ color: kas.netto >= 0 ? '#059669' : '#dc2626' }}>{rp(kas.netto)}</b>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏆 Profit Sesungguhnya (Akrual) — {periodeLabel}</h3>
          <p style={styles.ketKecil}>Pendapatan dari jasa yang SUDAH/SEDANG diajarkan, bukan sekadar kas masuk. Ini yang paling jujur buat menilai usaha.</p>
          <div style={styles.calcRow}>
            <span>Pendapatan yang kepake ({akrual.jumlahBulan} bulan)</span>
            <b style={{ color: '#059669' }}>+ {rp(akrual.pendapatan)}</b>
          </div>
          <div style={styles.calcRow}>
            <span>HPP — honor guru (riwayat sesi)</span>
            <b style={{ color: '#dc2626' }}>- {rp(akrual.hpp)}</b>
          </div>
          <div style={styles.calcRow}>
            <span>Biaya tetap ({(settings?.fixedCosts || []).length} pos)</span>
            <b style={{ color: '#dc2626' }}>- {rp(akrual.fixedTotal)}</b>
          </div>
          <div style={styles.calcRow}>
            <span>Penyusutan aset ({(settings?.assets || []).length} aset)</span>
            <b style={{ color: '#dc2626' }}>- {rp(akrual.penyusutanTotal)}</b>
          </div>
          <div style={styles.calcTotal}>
            <span>= {akrual.profit >= 0 ? 'PROFIT BERSIH' : 'RUGI BERSIH'}</span>
            <b style={{ color: akrual.profit >= 0 ? '#059669' : '#dc2626' }}>{rp(akrual.profit)}</b>
          </div>
          {mode === 'tahun' && akrual.perBulan.length > 1 && (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={styles.tableMini}>
                <thead>
                  <tr>
                    <th style={styles.thMini}>Bulan</th>
                    <th style={{ ...styles.thMini, textAlign: 'right' }}>Pendapatan</th>
                    <th style={{ ...styles.thMini, textAlign: 'right' }}>HPP</th>
                    <th style={{ ...styles.thMini, textAlign: 'right' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {akrual.perBulan.map(b => (
                    <tr key={b.bulan}>
                      <td style={styles.tdMini}>{namaBulanDariKey(b.bulan)}</td>
                      <td style={{ ...styles.tdMini, textAlign: 'right' }}>{rp(b.pendapatan)}</td>
                      <td style={{ ...styles.tdMini, textAlign: 'right', color: '#dc2626' }}>{rp(b.hpp)}</td>
                      <td style={{ ...styles.tdMini, textAlign: 'right', fontWeight: 800, color: b.profit >= 0 ? '#059669' : '#dc2626' }}>{rp(b.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== PENDAPATAN DIAKUI vs TITIPAN (per siswa) ===== */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🧾 Pendapatan Diakui vs Titipan (per Siswa, posisi hari ini)</h3>
        <p style={styles.ketKecil}>
          Dari duit yang SUDAH masuk (totalBayar), mana yang sudah jadi hak kamu (jasa sudah diajarkan) dan mana yang masih titipan siswa (jasa belum diberikan).
        </p>
        <div style={styles.hakGrid(isMobile)}>
          <div style={styles.hakCard('#f0fdf4', '#10b981')}>
            <span style={styles.hakLabel}>✅ Sudah Jadi Hak</span>
            <h3 style={{ ...styles.hakValue, color: '#10b981' }}>{rp(siswaInfo.totalSudahJadiHak)}</h3>
          </div>
          <div style={styles.hakCard('#fffbeb', '#f59e0b')}>
            <span style={styles.hakLabel}>⏳ Masih Titipan</span>
            <h3 style={{ ...styles.hakValue, color: '#f59e0b' }}>{rp(siswaInfo.totalMasihTitipan)}</h3>
          </div>
        </div>
        <div style={styles.warnStrip}>
          ⚠️ <b>Jangan ambil dari angka Titipan (kuning) untuk gaji/pribadi</b> — itu masih "milik" sesi belajar yang belum diajarkan ke siswa-siswa itu.
        </div>
        {siswaInfo.siswaDetail.length === 0 ? (
          <p style={styles.kosong}>Belum ada siswa aktif dengan data pembayaran lengkap.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thr}>
                  <th style={styles.th}>Nama Siswa</th>
                  <th style={styles.th}>Metode</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total Bayar</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Bulan Berjalan</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Sudah Jadi Hak</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Masih Titipan</th>
                </tr>
              </thead>
              <tbody>
                {siswaInfo.siswaDetail.map(row => (
                  <tr key={row.id} style={styles.tr}>
                    <td style={styles.td}><b>{row.nama}</b></td>
                    <td style={styles.td}>{row.metodeBayar}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{rp(row.totalBayar)}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{row.bulanBerjalan}/{row.durasiBulan}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{rp(row.sudahJadiHak)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: row.masihTitipan > 0 ? '#f59e0b' : '#cbd5e1', fontWeight: 700 }}>{rp(row.masihTitipan)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.infoBox}>
        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11, lineHeight: 1.6 }}>
          Biaya tetap & penyusutan dihitung flat per bulan dari tab "⚙️ Pengaturan" saat ini (sistem tidak menyimpan riwayat perubahan pengaturan).
          Kalau selisih kas dan profit akrual beda jauh, itu NORMAL — artinya ada uang masuk di muka (titipan) atau tagihan yang belum dibayar (piutang).
          Posisi menyeluruh ada di tab 🏦 Neraca, dan semua angka bisa di-download jadi PDF/Excel lewat tombol di atas.
        </span>
      </div>
    </div>
  );
};

const styles = {
  kontrolBar: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  modeToggle: { display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 },
  modeBtn: (aktif) => ({ padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11.5, background: aktif ? '#1e293b' : 'transparent', color: aktif ? 'white' : '#64748b' }),
  inputPeriode: { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#1e293b', background: 'white' },
  btnUnduh: (bg) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', background: bg, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 11.5 }),

  grid3: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }),
  statCard: (bg, color) => ({ background: bg, border: `1px solid ${color}25`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 3 }),
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 },
  statValue: { fontSize: 19, color: '#1e293b', fontWeight: 900 },
  statSub: { fontSize: 10, color: '#94a3b8', lineHeight: 1.5 },

  duaKolom: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 15, marginBottom: 16, alignItems: 'start' }),
  card: { background: 'white', padding: 18, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 16 },
  cardTitle: { margin: '0 0 6px', fontSize: 14, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  ketKecil: { fontSize: 10.5, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.6 },
  kosong: { fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 16, margin: 0 },
  privacyNote: { fontSize: 11.5, color: '#94a3b8', textAlign: 'center', padding: '40px 16px', margin: 0, background: '#f8fafc', borderRadius: 10 },

  legendRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#334155', padding: '4px 0' },
  legendDot: { width: 9, height: 9, borderRadius: 3, flexShrink: 0 },

  calcRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: 11.5, gap: 10 },
  calcTotal: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 2px', marginTop: 6, borderTop: '2px solid #1e293b', fontSize: 14, fontWeight: 900 },

  hakGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }),
  hakCard: (bg, color) => ({ background: bg, padding: 14, borderRadius: 12, border: `1px solid ${color}40` }),
  hakLabel: { fontSize: 11, color: '#64748b', fontWeight: 700 },
  hakValue: { margin: '6px 0 0', fontSize: 19, fontWeight: 900 },
  warnStrip: { background: '#fef2f2', color: '#991b1b', fontSize: 11, padding: '10px 14px', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 6, fontWeight: 600 },

  table: { width: '100%', borderCollapse: 'collapse', minWidth: 560 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '9px 10px', fontSize: 9.5, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 10px', fontSize: 11.5 },

  tableMini: { width: '100%', borderCollapse: 'collapse', fontSize: 10.5 },
  thMini: { padding: '5px 6px', fontSize: 9, color: '#64748b', fontWeight: 800, borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' },
  tdMini: { padding: '5px 6px', borderBottom: '1px solid #f8fafc', color: '#334155' },

  infoBox: { background: '#eff6ff', padding: 12, borderRadius: 10, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: 8, color: '#1e40af', marginBottom: 8 },
};

export default PanelAnalisis;
