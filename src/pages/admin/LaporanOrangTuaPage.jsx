// src/pages/admin/LaporanOrangTuaPage.jsx
// ============================================================
// LAPORAN ORANG TUA PERIODIK — satu sumber kebenaran dengan layar siswa.
//
// KENAPA ADA (arahan owner 2026-10-12): tujuan akhir sistem adalah
// mengukur kemampuan siswa "sebagai bahan evaluasi dan laporan ke orang
// tua". Laporan ini SENGAJA memakai util yang sama dengan banner siswa
// (trenMingguan.js) sehingga angka yang dibaca orang tua TIDAK MUNGKIN
// berbeda dari yang dilihat anaknya -- dua versi angka di satu keluarga
// membunuh kepercayaan pada sistem (prinsip desain rekam-paket bagian 3).
//
// Isi per siswa: identitas, kehadiran Sabtu, tren pekan (jumlah sesi &
// rata-rata & delta), kalimat tindakan berbahasa sasaran/target prodi,
// daftar paket yang dikerjakan ber-KODE (ledger), dan kolom catatan
// tentor yang HIDUP HANYA DI CETAKAN (tidak menulis skema Firestore baru
// tanpa keputusan owner).
//
// BACA-SAJA terhadap Firestore; satu-satunya keluaran adalah jendela
// cetak browser (PDF rapi berlogo Gemilang via dialog print).
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { hitungTrenMingguan, kalimatDelta, targetPoinDariSiswa } from '../../utils/trenMingguan';
import { kodePaketTampil } from '../../utils/kodePaket';
import { WATERMARK } from '../../utils/fieldButirSoal';

const gayaKartu = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 };
const fmtTgl = (t) => (t ? new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function tanggalDari(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function LaporanOrangTuaPage() {
  const [siswa, setSiswa] = useState([]);
  const [sesiPerSiswa, setSesiPerSiswa] = useState({});
  const [paketPerId, setPaketPerId] = useState({});
  const [statusMuat, setStatusMuat] = useState('');
  const [pilih, setPilih] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isMobile] = useState(window.innerWidth <= 1024);

  const muat = useCallback(async () => {
    setStatusMuat('memuat…');
    try {
      const [snapS, snapSesi, snapP] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'tryout_sesi')),
        getDocs(collection(db, 'tryout_paket')),
      ]);
      setSiswa(snapS.docs.map((d) => ({ id: d.id, ...d.data() })));
      const per = {};
      snapSesi.forEach((d) => {
        const x = d.data();
        const k = x.studentId || '';
        (per[k] = per[k] || []).push(x);
      });
      setSesiPerSiswa(per);
      setPaketPerId(Object.fromEntries(snapP.docs.map((d) => [d.id, { id: d.id, ...d.data() }])));
      setStatusMuat(`${snapS.size} siswa · ${snapSesi.size} sesi · ${snapP.size} paket`);
    } catch (e) {
      setStatusMuat(`Gagal memuat: ${e?.message || e}`);
    }
  }, []);
  // setTimeout: aturan react-hooks melarang setState sinkron di tubuh effect.
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
  }, [muat]);

  const baris = useMemo(() => siswa.map((s) => {
    const sesi = (sesiPerSiswa[s.studentId || s.id] || []).filter((x) => x.status === 'selesai');
    const tren = hitungTrenMingguan(sesi.map((x) => ({
      skor: Number(x.totalSkorPersen),
      waktu: x.updatedAt || x.waktuSelesai || x.createdAt,
      mapel: paketPerId[x.paketId]?.judul || '',
    })));
    const sabtu = sesi.filter((x) => (tanggalDari(x.updatedAt || x.waktuSelesai || x.createdAt)?.getDay() === 6)).length;
    return { s, sesi, tren, sabtu };
  }).sort((a, b) => String(a.s.nama || a.s.name || '').localeCompare(String(b.s.nama || b.s.name || ''))), [siswa, sesiPerSiswa, paketPerId]);

  const terpilih = baris.find((b) => b.s.id === pilih) || null;

  const cetak = () => {
    if (!terpilih) return;
    const { s, sesi, tren, sabtu } = terpilih;
    const logo = `${window.location.origin}${WATERMARK.logo}`;
    const nama = s.nama || s.name || s.studentId || '—';
    const target = targetPoinDariSiswa(s);
    const w = window.open('', '_blank');
    if (!w) { alert('Browser menahan jendela cetak. Izinkan pop-up untuk halaman ini.'); return; }
    w.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Laporan Perkembangan ${nama}</title>
<style>
  body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1e293b;margin:34px;line-height:1.55;
       background:url('') no-repeat;}
  .kop{display:flex;gap:12px;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:14px;}
  .kop img{width:52px;height:52px;object-fit:contain;}
  .kop h1{font-size:17px;margin:0;} .kop div{font-size:11px;color:#475569;}
  table{width:100%;border-collapse:collapse;font-size:11.5px;margin:8px 0 14px;}
  th,td{border:1px solid #cbd5e1;padding:5px 8px;text-align:left;}
  th{background:#f1f5f9;}
  .delta-naik{color:#166534;font-weight:700;} .delta-turun{color:#991b1b;font-weight:700;}
  .kalimat{background:#f8fafc;border-left:4px solid #6d28d9;padding:10px 12px;font-size:12px;border-radius:0 6px 6px 0;}
  .catatan{margin-top:16px;border:1px dashed #94a3b8;border-radius:8px;padding:10px 12px;font-size:12px;min-height:70px;white-space:pre-wrap;}
  .ttd{margin-top:34px;display:flex;justify-content:space-between;font-size:11.5px;}
  .wm{position:fixed;inset:0;z-index:-1;opacity:0.07;background:url('${logo}') center/340px no-repeat;}
  @media print{.noprint{display:none;}}
</style></head><body>
<div class="wm"></div>
<div class="kop"><img src="${logo}" alt=""/>
  <div><h1>Laporan Perkembangan Belajar — Bimbel Gemilang</h1>
  <div>Dicetak ${fmtTgl(Date.now())} · kode laporan GM-LPT-${Date.now().toString(36).toUpperCase()}</div></div>
</div>
<h2 style="font-size:14px;margin:0 0 2px;">${nama}</h2>
<div style="font-size:11.5px;color:#475569;margin-bottom:10px;">Kelas ${s.kelas || s.tingkatKelas || '—'} · Jenjang ${s.jenjang || '—'}${s.targetProdi ? ` · Target: ${s.targetProdi}` : ''}</div>
<table>
  <tr><th>Try out dikerjakan</th><td>${sesi.length}</td><th>Kehadiran Sabtu</th><td>${sabtu} kali</td></tr>
  <tr><th>Rata-rata pekan terakhir</th><td>${tren.terakhir ? `${tren.terakhir.rataSkor}%` : '—'}</td>
      <th>Perubahan vs pekan lalu</th><td class="${tren.terakhir?.delta > 0 ? 'delta-naik' : 'delta-turun'}">${tren.terakhir?.delta == null ? '—' : `${tren.terakhir.delta > 0 ? '+' : ''}${tren.terakhir.delta} poin`}</td></tr>
</table>
<div class="kalimat">${kalimatDelta(tren, target)}</div>
<h3 style="font-size:12.5px;margin:14px 0 4px;">Riwayat pekan</h3>
<table><tr><th>Pekan (Senin)</th><th>Try out</th><th>Rata-rata</th><th>Perubahan</th></tr>
${tren.seri.map((b) => `<tr><td>${b.kunci}</td><td>${b.jumlah}</td><td>${b.rataSkor}%</td><td class="${b.delta > 0 ? 'delta-naik' : b.delta < 0 ? 'delta-turun' : ''}">${b.delta == null ? '—' : `${b.delta > 0 ? '+' : ''}${b.delta}`}</td></tr>`).join('') || '<tr><td colspan="4">Belum ada pekan terukur.</td></tr>'}
</table>
<h3 style="font-size:12.5px;margin:14px 0 4px;">Paket yang dikerjakan</h3>
<table><tr><th>Kode paket</th><th>Paket</th><th>Tanggal</th><th>Skor</th></tr>
${sesi.map((x) => { const p = paketPerId[x.paketId]; const t = tanggalDari(x.updatedAt || x.waktuSelesai || x.createdAt); return `<tr><td>${p ? kodePaketTampil(p) : '—'}</td><td>${p?.judul || x.paketId || '—'}</td><td>${fmtTgl(t)}</td><td>${x.totalSkorPersen ?? '—'}%</td></tr>`; }).join('') || '<tr><td colspan="4">Belum ada paket dikerjakan.</td></tr>'}
</table>
<div class="catatan">Catatan tentor untuk orang tua:\n${catatan || '(diisi tangan saat penyerahan laporan)'}</div>
<div class="ttd"><div>Hormat kami,<br/><br/><br/>Tentor Pendamping</div><div>Orang Tua/Wali<br/><br/><br/>(...........................)</div></div>
<script>window.onload=function(){setTimeout(function(){window.print();},350);};</script>
</body></html>`);
    w.document.close();
  };

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main style={{ marginLeft: isMobile ? '0' : '250px', padding: isMobile ? '15px' : '28px', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>👪 Laporan Orang Tua</h2>
        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Angka laporan = angka yang dilihat siswa di layar "Perjalananmu" (satu sumber kebenaran).
          Dicetak sebagai PDF berlogo Gemilang lewat dialog print browser.
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{statusMuat} · <button onClick={muat} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>muat ulang</button></div>

        <div style={{ ...gayaKartu, padding: 0, overflow: 'auto', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 760 }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                {['Siswa', 'Kelas', 'Try out', 'Hadir Sabtu', 'Rata pekan ini', 'Delta', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.s.id} style={{ background: pilih === b.s.id ? '#eff6ff' : undefined, cursor: 'pointer' }} onClick={() => setPilih(b.s.id)}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{b.s.nama || b.s.name || b.s.studentId}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.s.kelas || b.s.tingkatKelas || '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.sesi.length}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.sabtu}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.tren.terakhir ? `${b.tren.terakhir.rataSkor}%` : '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, color: (b.tren.terakhir?.delta || 0) > 0 ? '#16a34a' : (b.tren.terakhir?.delta || 0) < 0 ? '#dc2626' : '#64748b' }}>
                    {b.tren.terakhir?.delta == null ? '—' : `${b.tren.terakhir.delta > 0 ? '+' : ''}${b.tren.terakhir.delta}`}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{pilih === b.s.id ? '✔' : ''}</td>
                </tr>
              ))}
              {baris.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Belum ada data siswa.</td></tr>}
            </tbody>
          </table>
        </div>

        {terpilih && (
          <div style={gayaKartu}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
              Catatan tentor untuk {terpilih.s.nama || terpilih.s.studentId} (hanya masuk cetakan, tidak disimpan ke Firestore):
            </div>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={4} placeholder="Mis.: Ananda konsisten naik 3 pekan berturut-turut; fokus bulan ini pada Penalaran Matematika…" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5 }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button onClick={cetak} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#0e7490', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>🖨️ Cetak / PDF laporan</button>
              <button onClick={() => { setPilih(''); setCatatan(''); }} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Batal</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
