// src/pages/admin/bank-soal/RapikanLiterasiPage.jsx
// ============================================================
// RAPIKAN MATERI LITERASI (Admin) -- Langkah 3 dari roadmap
// perbaikan fondasi Bank Soal (setelah Langkah 2: bersihkan soal
// rusak & duplikat).
// ============================================================
// Masalah yang dibereskan di sini ("Pola A" dari analisis Audit
// Materi): hampir semua nilai `materi` di mapel "Literasi" ternyata
// berformat "Jenis Teks - Judul Bacaan Spesifik" (mis. "Teks laporan
// - Rumah Adat dari Berbagai Daerah"). Karena judul bacaan itu unik
// per soal, tiap import baru = kategori baru yang gak pernah ketemu
// sebelumnya -- itu sebabnya folder Literasi "beranak" terus.
//
// FIX-NYA MEKANIS (bukan taksonomi manual): pecah string materi di
// tanda " - " PERTAMA. Bagian depan ("Teks laporan") jadi materi
// BAKU yang dipakai buat pengelompokan (dirapikan jadi Title Case
// biar konsisten walau sumbernya kadang huruf kecil semua). Bagian
// belakang ("Rumah Adat dari Berbagai Daerah") TETAP DISIMPAN, cuma
// dipindah ke field baru `subMateri` -- jadi info judul bacaan
// aslinya TIDAK HILANG, cuma gak lagi dipakai buat pengelompokan.
//
// Nilai materi yang TIDAK mengikuti pola ini (gak ada " - " sama
// sekali, mis. "Ejaan dan tanda baca") DIBIARKAN APA ADANYA -- itu
// sudah berupa 1 topik bersih, gak perlu diapa-apakan.
//
// 🔒 NON-DESTRUKTIF: tidak ada soal yang dihapus atau isinya diubah
// selain field materi & subMateri. Tetap ada tahap PRATINJAU sebelum
// "Terapkan" ditekan, sama seperti alat Bersihkan Soal.
//
// Sengaja DIBATASI ke mataPelajaran === 'Literasi' saja -- pola " - "
// di Matematika (mis. "Bilangan Cacah Sampai 10.000 – Nilai Tempat")
// itu KASUS BEDA (Pola B: variasi granularitas topik YANG SAMA,
// butuh tabel alias, bukan dipecah jadi induk+anak) -- jangan
// disamakan, itu pekerjaan Langkah 4 terpisah.
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { Loader2, ScanSearch, FolderTree, CheckCircle2, Sparkles } from 'lucide-react';

function titleCase(s) {
  return String(s || '').trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// Pecah di tanda " - " (spasi-strip-spasi) PERTAMA saja.
function pecahMateri(materi) {
  const teks = String(materi || '').trim();
  const idx = teks.search(/\s-\s/);
  if (idx === -1) return null; // gak ikut pola -- dibiarkan
  const prefix = teks.slice(0, idx).trim();
  const suffix = teks.slice(idx + 3).trim();
  if (!prefix || !suffix) return null;
  return { prefix, suffix };
}

export default function RapikanLiterasiPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [sudahPindai, setSudahPindai] = useState(false);
  const [soalCocok, setSoalCocok] = useState([]); // [{ id, materiAsli, prefix, suffix, canonical }]
  const [soalTanpaPola, setSoalTanpaPola] = useState([]); // dibiarkan apa adanya
  const [menerapkan, setMenerapkan] = useState(false);
  const [statusTerap, setStatusTerap] = useState('');
  const [sudahDiterapkan, setSudahDiterapkan] = useState(false);

  const pindai = useCallback(async () => {
    setLoading(true);
    setSudahPindai(false);
    setSudahDiterapkan(false);
    try {
      const snap = await getDocs(query(collection(db, 'bank_soal'), where('mataPelajaran', '==', 'Literasi')));
      const cocok = [];
      const tanpaPola = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.status === 'nonaktif' || data.status === 'dihapus') return;
        const hasil = pecahMateri(data.materi);
        if (hasil) {
          cocok.push({
            id: d.id,
            materiAsli: data.materi,
            prefix: hasil.prefix,
            suffix: hasil.suffix,
            canonical: titleCase(hasil.prefix),
          });
        } else {
          tanpaPola.push({ id: d.id, materi: data.materi || '(kosong)' });
        }
      });
      setSoalCocok(cocok);
      setSoalTanpaPola(tanpaPola);
      setSudahPindai(true);
    } catch (e) {
      console.error('Gagal memindai:', e);
      alert('Gagal memindai: ' + e.message);
    }
    setLoading(false);
  }, []);

  // Kelompokkan hasil cocok per kategori baku, buat pratinjau
  const kelompok = useMemo(() => {
    const peta = new Map();
    soalCocok.forEach((s) => {
      if (!peta.has(s.canonical)) peta.set(s.canonical, []);
      peta.get(s.canonical).push(s);
    });
    return [...peta.entries()]
      .map(([canonical, anggota]) => ({ canonical, anggota }))
      .sort((a, b) => b.anggota.length - a.anggota.length);
  }, [soalCocok]);

  const terapkanPerapian = useCallback(async () => {
    if (soalCocok.length === 0) return;
    if (!window.confirm(`Rapikan materi untuk ${soalCocok.length} soal Literasi jadi ${kelompok.length} kategori baku? Judul bacaan asli tetap disimpan di field subMateri, tidak hilang.`)) return;

    setMenerapkan(true);
    try {
      for (let i = 0; i < soalCocok.length; i += 400) {
        const potongan = soalCocok.slice(i, i + 400);
        const batch = writeBatch(db);
        potongan.forEach((s) => {
          batch.update(doc(db, 'bank_soal', s.id), {
            materi: s.canonical,
            subMateri: s.suffix,
            materiAsliSebelumRapi: s.materiAsli,
          });
        });
        await batch.commit();
        setStatusTerap(`${Math.min(i + 400, soalCocok.length)}/${soalCocok.length} soal dirapikan...`);
      }
      setStatusTerap(`✅ Selesai. ${soalCocok.length} soal dirapikan jadi ${kelompok.length} kategori.`);
      setSudahDiterapkan(true);
    } catch (e) {
      console.error('Gagal menerapkan:', e);
      setStatusTerap('❌ Gagal: ' + e.message);
    }
    setMenerapkan(false);
  }, [soalCocok, kelompok]);

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box' };
  const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 };

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>📚 Rapikan Materi Literasi</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Langkah 3: pecah pola "Jenis Teks - Judul Bacaan" jadi materi baku. Non-destruktif -- judul bacaan asli tetap disimpan (field subMateri), tidak dihapus.
          </p>
        </div>

        <button
          onClick={pindai}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 20 }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <ScanSearch size={16} />}
          {loading ? 'Memindai...' : 'Pindai Mapel Literasi'}
        </button>

        {sudahPindai && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700 }}>Soal Literasi dipindai</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{soalCocok.length + soalTanpaPola.length}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#ddd6fe' }}>
                <div style={{ fontSize: 11.5, color: '#5B2ECC', fontWeight: 700 }}>Akan dirapikan</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#5B2ECC' }}>{soalCocok.length}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#a7f3d0' }}>
                <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 700 }}>Jadi kategori baku</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{kelompok.length}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700 }}>Sudah bersih, dibiarkan</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{soalTanpaPola.length}</div>
              </div>
            </div>

            {!sudahDiterapkan && soalCocok.length > 0 && (
              <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: '#f5f3ff' }}>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  Siap merapikan <strong>{soalCocok.length}</strong> soal dari <strong>{new Set(soalCocok.map((s) => s.prefix.toLowerCase())).size + 0}</strong> variasi jadi <strong>{kelompok.length}</strong> kategori baku.
                </div>
                <button
                  onClick={terapkanPerapian}
                  disabled={menerapkan}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: menerapkan ? 'default' : 'pointer', opacity: menerapkan ? 0.6 : 1 }}
                >
                  {menerapkan ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                  Terapkan Perapian
                </button>
              </div>
            )}
            {statusTerap && (
              <div style={{ ...cardStyle, color: sudahDiterapkan ? '#166534' : '#374151', background: sudahDiterapkan ? '#f0fdf4' : 'white' }}>
                {sudahDiterapkan && <CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />}
                {statusTerap}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FolderTree size={16} /> Pratinjau kategori baku
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Ini "rak" yang akan terbentuk -- diurut dari yang paling banyak soalnya.</div>
              {kelompok.map((k) => (
                <div key={k.canonical} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#5B2ECC', marginBottom: 4 }}>{k.canonical} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11.5 }}>({k.anggota.length} soal)</span></div>
                  <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                    Contoh judul bacaan: {k.anggota.slice(0, 3).map((a) => a.suffix).join(' · ')}{k.anggota.length > 3 ? ', ...' : ''}
                  </div>
                </div>
              ))}
            </div>

            {soalTanpaPola.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Sudah bersih, tidak disentuh</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 10 }}>Nilai materi ini sudah berupa 1 topik jelas (gak ada " - "), dibiarkan apa adanya.</div>
                <div style={{ fontSize: 12, color: '#374151' }}>
                  {[...new Set(soalTanpaPola.map((s) => s.materi))].join(' · ')}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}