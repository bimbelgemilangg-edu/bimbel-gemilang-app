// src/pages/admin/bank-soal/DasborKesiapanStokPage.jsx
// ============================================================
// DASBOR KESIAPAN STOK — kompas untuk "render soal sebanyak-banyaknya".
//
// KENAPA ADA (arahan owner 2026-10-11): stok lemari soal adalah bahan
// bakar mesin try out otomatis; tanpa peta stok, usaha render buta.
// Mesin hitungnya util murni teruji (utils/kesiapanStok.js); halaman ini
// hanya membaca bank_soal SEKALI per klik dan menampilkannya, supaya
// angka di layar tidak bisa berbeda dengan angka yang diuji.
//
// BACA-SAJA: tidak ada writeBatch di sini. Menyetok tetap lewat pintu
// impor bergerbang; dasbor hanya menunjukkan KE MANA usaha render
// berikutnya paling berharga (diurutkan dari kelompok termiskin).
//
// ANGKA TARGET: targetBawaan() = usulan dokumen TAKSONOMI-&-TARGET-STOK.md
// (UTBK 150/subtes, TKA wajib 200, TKA pilihan 120, reguler 60, rasio
// pembahasan tercetak 0.6/0.5). Statusnya USULAN sampai owner mengesahkan;
// begitu disahkan, cukup ganti satu peta target di berkas itu.
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { hitungKesiapanStok, STATUS_STOK } from '../../../utils/kesiapanStok';

const WARNA_STATUS = {
  [STATUS_STOK.SIAP]: { bg: '#f0fdf4', bd: '#86efac', fg: '#166534' },
  [STATUS_STOK.TIPIS]: { bg: '#fef2f2', bd: '#fca5a5', fg: '#991b1b' },
  [STATUS_STOK.KUALITAS]: { bg: '#fffbeb', bd: '#fcd34d', fg: '#92400e' },
  [STATUS_STOK.KOSONG]: { bg: '#f1f5f9', bd: '#cbd5e1', fg: '#334155' },
};

const gayaKartu = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' };

export default function DasborKesiapanStokPage() {
  const [baris, setBaris] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [statusMuat, setStatusMuat] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [isMobile] = useState(window.innerWidth <= 1024);

  const muat = useCallback(async () => {
    // microtask dulu: aturan react-hooks melarang setState sinkron di tubuh
    // effect; pemanggilan dari useEffect jadinya lewat callback async.
    await Promise.resolve();
    setStatusMuat('memuat…');
    setError('');
    try {
      const snap = await getDocs(collection(db, 'bank_soal'));
      const butir = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const hasil = hitungKesiapanStok(butir);
      setBaris(hasil.baris);
      setRingkasan(hasil.ringkasan);
      setStatusMuat(`${butir.length} butir dibaca · ${new Date().toLocaleTimeString('id-ID')}`);
    } catch (e) {
      setError(`Gagal membaca bank soal: ${e?.message || e}`);
      setStatusMuat('');
    }
  }, []);

  // setTimeout supaya pemanggilan tidak sinkron di tubuh effect
  // (aturan react-hooks set-state-in-effect); bersih saat unmount.
  useEffect(() => {
    const t = setTimeout(() => muat(), 0);
    return () => clearTimeout(t);
  }, [muat]);

  const tampil = filter ? baris.filter((b) => b.status === filter) : baris;

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <main style={{ marginLeft: isMobile ? '0' : '250px', padding: isMobile ? '15px' : '28px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>📦 Kesiapan Stok Lemari Soal</h2>
            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
              Baca-saja. Diurutkan dari kelompok TERMISKIN supaya usaha render berikutnya tepat sasaran.
              Angka target masih USULAN (lihat TAKSONOMI-&-TARGET-STOK.md) sampai Anda sahkan.
            </div>
          </div>
          <button onClick={muat} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            ⟳ Muat ulang
          </button>
        </div>

        {error && <div style={{ ...gayaKartu, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        {statusMuat && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{statusMuat}</div>}

        {ringkasan && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              ['Butir aktif', ringkasan.totalAktif],
              ['Pembahasan tercetak', ringkasan.totalTercetak],
              ['Penalaran AI', ringkasan.totalPenalaran],
              ['Tanpa pembahasan', ringkasan.totalTanpaPembahasan],
              ['Grup SIAP', ringkasan.siap],
              ['Grup TIPIS', ringkasan.tipis],
              ['Grup KUALITAS', ringkasan.kualitas],
            ].map(([label, nilai]) => (
              <div key={label} style={{ ...gayaKartu, minWidth: 120 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{nilai}</div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {['', ...Object.values(STATUS_STOK)].map((st) => (
            <button
              key={st || 'semua'}
              onClick={() => setFilter(st)}
              style={{
                padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${filter === st ? '#2563eb' : '#e2e8f0'}`,
                background: filter === st ? '#eff6ff' : '#fff', color: filter === st ? '#1d4ed8' : '#475569',
              }}
            >
              {st || 'Semua status'}
            </button>
          ))}
        </div>

        <div style={{ ...gayaKartu, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                {['Status', 'Jenjang', 'Mapel', 'Jenis ujian', 'Aktif', 'Berkunci', 'Tercetak', 'Penalaran', 'Tanpa bahas', 'Gambar tertunda', 'Rasio tercetak', 'Target', 'Kurang'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tampil.map((b) => {
                const w = WARNA_STATUS[b.status] || WARNA_STATUS[STATUS_STOK.KOSONG];
                return (
                  <tr key={b.kunci}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ background: w.bg, border: `1px solid ${w.bd}`, color: w.fg, borderRadius: 999, padding: '2px 8px', fontSize: 10.5, fontWeight: 800 }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.jenjang}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{b.mapel}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.jenisUjian}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 800 }}>{b.aktif}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.berkunci}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#166534' }}>{b.tercetak}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#92400e' }}>{b.penalaran}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#991b1b' }}>{b.tanpaPembahasan}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.gambarTertunda}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{Math.round(b.rasioTerCetak * 100)}% / {Math.round(b.targetRasio * 100)}%</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>{b.target}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, color: b.kekurangan > 0 ? '#b91c1c' : '#166534' }}>{b.kekurangan || '—'}</td>
                  </tr>
                );
              })}
              {tampil.length === 0 && (
                <tr><td colSpan={13} style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Belum ada data. Tekan "Muat ulang".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
