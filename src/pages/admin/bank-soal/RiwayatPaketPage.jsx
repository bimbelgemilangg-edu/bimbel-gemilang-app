// src/pages/admin/bank-soal/RiwayatPaketPage.jsx
// ============================================================
// RIWAYAT PAKET — ledger try out yang dapat dicari & dicetak ulang.
//
// KENAPA ADA (arahan owner 2026-10-12): "setiap paket yang telah
// dikeluarkan harus ada record-nya ... tinggal searching pakai try out
// pada tanggal hari itu ... downloadkan berupa PDF rapi ada logo
// gemilang ... semua track record-nya jelas". Sebelumnya paket hanya
// hidup sebagai baris di halaman jadwal; begitu lewat, ia sulit
// ditemukan kembali meski siswanya datang minta pembahasannya.
//
// Halaman ini BACA-SAJA terhadap paket & sesi, kecuali SATU tindakan
// bertanda: membuat PAKET SUSULAN (mesinTryOutOtomatis dengan excludeIds
// paket asli) untuk siswa telat -- sesuai kebijakan anti-bocor: paket
// hidup tidak pernah dibuka ulang, yang telat mendapat paket setara
// berkode baru.
//
// PDF memakai DialogCetakNaskah yang SUDAH ADA (komponen cetak induk),
// sehingga naskah ulang otomatis memuat kode paket di pojok kop dan chip
// logo per seksi (fitur 9119902) -- tidak ada mesin cetak kedua.
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { kodePaketTampil, cocokPencarianPaket } from '../../../utils/kodePaket';
import { siapkanDrafDariTemplate, COL_TEMPLATE } from '../../../utils/mesinTryOutOtomatis';
import DialogCetakNaskah from '../../../components/DialogCetakNaskah';

const gayaKartu = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 };
const gayaTombol = (warna, mati) => ({
  padding: '7px 12px', borderRadius: 9, border: 'none', background: warna, color: '#fff',
  fontSize: 11.5, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer', opacity: mati ? 0.5 : 1,
});
const fmt = (t) => (t ? new Date(t).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

export default function RiwayatPaketPage() {
  const [paket, setPaket] = useState([]);
  const [jumlahSesi, setJumlahSesi] = useState({});
  const [kueri, setKueri] = useState('');
  const [statusMuat, setStatusMuat] = useState('');
  const [cetak, setCetak] = useState(null);
  const [busy, setBusy] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 1024);

  const muat = useCallback(async () => {
    setStatusMuat('memuat…');
    try {
      const snapP = await getDocs(collection(db, 'tryout_paket'));
      const daftar = snapP.docs.map((d) => ({ id: d.id, ...d.data() }));
      daftar.sort((a, b) => String(b.kodePaket || b.createdAt?.seconds || 0).localeCompare(String(a.kodePaket || a.createdAt?.seconds || 0)));
      const snapS = await getDocs(collection(db, 'tryout_sesi'));
      const hitung = {};
      snapS.forEach((d) => { const pid = d.data().paketId; hitung[pid] = (hitung[pid] || 0) + 1; });
      setPaket(daftar);
      setJumlahSesi(hitung);
      setStatusMuat(`${daftar.length} paket · ${snapS.size} sesi tercatat · ${new Date().toLocaleTimeString('id-ID')}`);
    } catch (e) {
      setStatusMuat(`Gagal memuat: ${e?.message || e}`);
    }
  }, []);

  useEffect(() => { muat(); }, [muat]);

  const tampil = useMemo(() => paket.filter((p) => cocokPencarianPaket(p, kueri)), [paket, kueri]);

  const buatSusulan = async (p) => {
    if (busy) return;
    setBusy(true);
    try {
      const ids = (Array.isArray(p.daftarSoal) ? p.daftarSoal.map((s) => s.id || s.soalId).filter(Boolean) : [])
        .concat((p.subtes || []).flatMap((g) => g.soalIds || []));
      if (!p.templateId) { alert('Paket ini tidak menyimpan templateId — buat susulan manual lewat Jadwal Try Out Otomatis.'); return; }
      const tRef = await getDoc(doc(db, COL_TEMPLATE, p.templateId));
      if (!tRef.exists()) { alert('Template asli paket ini sudah tidak ada — buat susulan manual lewat Jadwal.'); return; }
      const sekarang = Date.now();
      const hasil = await siapkanDrafDariTemplate(
        { id: tRef.id, ...tRef.data() },
        { waktuBuka: sekarang, waktuTutup: sekarang + 7 * 24 * 3600 * 1000 },
        { excludeIds: [...new Set(ids)] },
      );
      if (hasil?.ok) {
        alert(`✅ PAKET SUSULAN dibuat sebagai DRAF:\n${hasil.judul}\nkode: ${hasil.kodePaket || '(lihat halaman jadwal)'}\n${hasil.totalSoal} soal (butir paket asli dilewati semua).\n\nBuka Jadwal Try Out Otomatis untuk meninjau lalu TERBITKAN. Siswa telat mengerjakan susulan ini, bukan paket hidup.`);
        muat();
      } else {
        alert(`⚠️ Susulan gagal: ${hasil?.error || 'stok tidak cukup setelah pengecualian'}`);
      }
    } catch (e) {
      alert(`❌ Gagal membuat susulan: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main style={{ marginLeft: isMobile ? '0' : '250px', padding: isMobile ? '15px' : '28px', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>🗂️ Riwayat Paket Try Out</h2>
        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>
          Ledger seluruh paket yang pernah diterbitkan. Cari per kode paket, tanggal (YYYYMMDD), atau judul.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            value={kueri}
            onChange={(e) => setKueri(e.target.value)}
            placeholder="GM-SMA-TKA-20261017-0800 · 20261017 · judul paket…"
            style={{ flex: 1, minWidth: 240, padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5 }}
          />
          <button onClick={muat} style={gayaTombol('#2563eb', false)}>⟳ Muat ulang</button>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{statusMuat}</div>

        <div style={{ ...gayaKartu, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                {['Kode paket', 'Judul', 'Jenjang', 'Status', 'Dibuka', 'Soal', 'Peserta', 'Aksi'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tampil.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{kodePaketTampil(p)}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{p.judul}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{p.jenjangTemplate || p.jenjang || '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ borderRadius: 999, padding: '2px 8px', fontSize: 10.5, fontWeight: 800, background: p.status === 'aktif' ? '#f0fdf4' : p.status === 'draf' ? '#fffbeb' : '#f1f5f9', color: p.status === 'aktif' ? '#166534' : p.status === 'draf' ? '#92400e' : '#334155', border: '1px solid #e2e8f0' }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{fmt(p.waktuBuka)}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{p.totalSoal}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{jumlahSesi[p.id] || 0}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setCetak(p)} style={{ ...gayaTombol('#0e7490', false), marginRight: 6 }}>🖨️ PDF</button>
                    <button onClick={() => buatSusulan(p)} disabled={busy || p.status === 'draf'} style={gayaTombol('#7c3aed', busy || p.status === 'draf')}>🎟️ Susulan</button>
                  </td>
                </tr>
              ))}
              {tampil.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 22, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Tidak ada paket yang cocok dengan pencarian.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.7 }}>
          🖨️ <b>PDF</b> membuka dialog cetak induk: naskah siswa + kunci bergaya buku, ber-watermark logo Gemilang
          dan berkode paket di pojok kop serta tiap seksi. 🎟️ <b>Susulan</b> membuat DRAF baru dari template yang sama
          dengan seluruh butir paket asli dilewati (anti-bocor); terbitkan dari halaman Jadwal setelah ditinjau.
        </div>

        {cetak && <DialogCetakNaskah input={cetak} onClose={() => setCetak(null)} />}
      </main>
    </div>
  );
}
