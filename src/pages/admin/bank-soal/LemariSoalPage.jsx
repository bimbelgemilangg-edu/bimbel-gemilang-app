// src/pages/admin/bank-soal/LemariSoalPage.jsx
// ============================================================
// LEMARI SOAL (Admin) -- Langkah 6 dari roadmap perbaikan fondasi
// Bank Soal. Ini "rak buku" yang jadi alasan awal semua kerjaan
// Langkah 1-5 kemarin -- begitu materi & mapel sudah rapi, jelajah
// soal bisa dibangun berdasarkan struktur yang BENERAN masuk akal
// (Jenjang > Mapel > Bab), bukan folder impor + materi mentah yang
// berantakan kayak tab "Jelajah per Folder" yang lama.
// ============================================================
// Alur: pilih Jenjang -> pilih Mapel -> pilih Bab (materi baku hasil
// Langkah 3-5) -> lihat daftar soalnya. Ada kotak cari cepat buat
// lompat langsung ke bab atau isi soal tertentu tanpa drill-down
// manual dari atas.
//
// 🔒 READ-ONLY: halaman ini cuma menampilkan, tidak mengubah data
// bank_soal sama sekali. Aman dibuka kapan saja.
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Loader2, ChevronRight, Search, GraduationCap, BookOpen, FolderOpen, FileText } from 'lucide-react';

const URUTAN_JENJANG = ['SD/MI', 'SMP/MTs', 'SMA/MA'];

const LABEL_TIPE = {
  pg_sederhana: 'PG Sederhana',
  pg_kompleks: 'PG Kompleks',
  benar_salah: 'Benar/Salah',
  pg_kategori: 'Kategori B/S',
  isian_singkat: 'Isian Singkat',
  numerik: 'Numerik',
  menjodohkan: 'Menjodohkan',
};

export default function LemariSoalPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [semuaSoal, setSemuaSoal] = useState([]);
  const [jenjangAktif, setJenjangAktif] = useState(null);
  const [mapelAktif, setMapelAktif] = useState(null);
  const [materiAktif, setMateriAktif] = useState(null);
  const [cari, setCari] = useState('');

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'bank_soal'));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.status !== 'nonaktif' && s.status !== 'dihapus');
      setSemuaSoal(list);
    } catch (e) {
      console.error('Gagal memuat bank soal:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { muat(); }, [muat]);

  // ---------------- Level 1: Jenjang ----------------
  const daftarJenjang = useMemo(() => {
    const peta = new Map();
    semuaSoal.forEach((s) => {
      const j = s.jenjang || '(Belum diatur)';
      peta.set(j, (peta.get(j) || 0) + 1);
    });
    const utama = URUTAN_JENJANG.filter((j) => peta.has(j)).map((j) => ({ nama: j, jumlah: peta.get(j) }));
    const sisanya = [...peta.entries()].filter(([j]) => !URUTAN_JENJANG.includes(j)).map(([nama, jumlah]) => ({ nama, jumlah }));
    return [...utama, ...sisanya];
  }, [semuaSoal]);

  // ---------------- Level 2: Mapel (dalam jenjang aktif) ----------------
  const daftarMapel = useMemo(() => {
    if (!jenjangAktif) return [];
    const peta = new Map();
    semuaSoal.filter((s) => (s.jenjang || '(Belum diatur)') === jenjangAktif).forEach((s) => {
      const m = s.mataPelajaran || '(Belum diatur)';
      peta.set(m, (peta.get(m) || 0) + 1);
    });
    return [...peta.entries()].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
  }, [semuaSoal, jenjangAktif]);

  // ---------------- Level 3: Bab/Materi (dalam jenjang+mapel aktif) ----------------
  const daftarMateri = useMemo(() => {
    if (!jenjangAktif || !mapelAktif) return [];
    const peta = new Map();
    semuaSoal
      .filter((s) => (s.jenjang || '(Belum diatur)') === jenjangAktif && (s.mataPelajaran || '(Belum diatur)') === mapelAktif)
      .forEach((s) => {
        const m = (s.materi || '').trim() || '(Belum diatur)';
        peta.set(m, (peta.get(m) || 0) + 1);
      });
    return [...peta.entries()].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
  }, [semuaSoal, jenjangAktif, mapelAktif]);

  // ---------------- Level 4: Daftar soal (dalam bab aktif) ----------------
  const daftarSoalBab = useMemo(() => {
    if (!jenjangAktif || !mapelAktif || !materiAktif) return [];
    return semuaSoal.filter((s) =>
      (s.jenjang || '(Belum diatur)') === jenjangAktif &&
      (s.mataPelajaran || '(Belum diatur)') === mapelAktif &&
      ((s.materi || '').trim() || '(Belum diatur)') === materiAktif
    );
  }, [semuaSoal, jenjangAktif, mapelAktif, materiAktif]);

  // ---------------- Pencarian cepat lintas semua level ----------------
  const hasilCari = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    if (kunci.length < 3) return null;
    return semuaSoal.filter((s) =>
      String(s.materi || '').toLowerCase().includes(kunci) ||
      String(s.soal || '').toLowerCase().includes(kunci)
    ).slice(0, 100);
  }, [semuaSoal, cari]);

  const pilihJenjang = (j) => { setJenjangAktif(j); setMapelAktif(null); setMateriAktif(null); };
  const pilihMapel = (m) => { setMapelAktif(m); setMateriAktif(null); };

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box' };
  const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 };
  const rakStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', marginBottom: 8 };
  const rakAktifStyle = { ...rakStyle, background: '#f5f3ff', border: '1px solid #ddd6fe' };

  const breadcrumb = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
      <span onClick={() => pilihJenjang(null)} style={{ cursor: 'pointer', fontWeight: jenjangAktif ? 400 : 800, color: jenjangAktif ? '#6b7280' : '#5B2ECC' }}>Semua Jenjang</span>
      {jenjangAktif && <><ChevronRight size={13} /><span onClick={() => pilihMapel(null)} style={{ cursor: 'pointer', fontWeight: mapelAktif ? 400 : 800, color: mapelAktif ? '#6b7280' : '#5B2ECC' }}>{jenjangAktif}</span></>}
      {mapelAktif && <><ChevronRight size={13} /><span onClick={() => setMateriAktif(null)} style={{ cursor: 'pointer', fontWeight: materiAktif ? 400 : 800, color: materiAktif ? '#6b7280' : '#5B2ECC' }}>{mapelAktif}</span></>}
      {materiAktif && <><ChevronRight size={13} /><span style={{ fontWeight: 800, color: '#5B2ECC' }}>{materiAktif}</span></>}
    </div>
  );

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🗄️ Lemari Soal</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Jelajah bank soal berdasarkan Jenjang → Mapel → Bab -- struktur ini sekarang ikut Taksonomi Materi yang sudah dirapikan, bukan folder impor lagi.
          </p>
        </div>

        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="#9ca3af" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari cepat lintas semua bab (ketik minimal 3 huruf) -- nama bab atau isi soal..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}><Loader2 className="spin" size={20} /> Memuat lemari soal...</div>
        ) : hasilCari ? (
          <div style={cardStyle}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Hasil cari: "{cari}"</div>
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>{hasilCari.length} soal ditemukan (maks 100 ditampilkan). Kosongkan kotak cari buat balik jelajah normal.</div>
            {hasilCari.map((s) => (
              <div key={s.id} style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', marginBottom: 6 }}>
                <div style={{ fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.soal || '(teks kosong)'}</div>
                <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3 }}>{s.mataPelajaran || '-'} · {s.jenjang || '-'} · Kelas {s.tingkatKelas || 'Semua'} · <b style={{ color: '#5B2ECC' }}>{s.materi || '(belum diatur)'}</b></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {breadcrumb}

            {!jenjangAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={15} /> Pilih Jenjang</div>
                {daftarJenjang.map((j) => (
                  <div key={j.nama} style={rakStyle} onClick={() => pilihJenjang(j.nama)}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{j.nama}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{j.jumlah} soal <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></span>
                  </div>
                ))}
              </div>
            )}

            {jenjangAktif && !mapelAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={15} /> Pilih Mapel di {jenjangAktif}</div>
                {daftarMapel.map((m) => (
                  <div key={m.nama} style={rakStyle} onClick={() => pilihMapel(m.nama)}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{m.nama}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{m.jumlah} soal <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></span>
                  </div>
                ))}
              </div>
            )}

            {jenjangAktif && mapelAktif && !materiAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FolderOpen size={15} /> Pilih Bab di {mapelAktif} · {jenjangAktif}</div>
                {daftarMateri.map((m) => (
                  <div key={m.nama} style={rakStyle} onClick={() => setMateriAktif(m.nama)}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{m.nama}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{m.jumlah} soal <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></span>
                  </div>
                ))}
              </div>
            )}

            {materiAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={15} /> {daftarSoalBab.length} soal di "{materiAktif}"</div>
                {daftarSoalBab.map((s) => (
                  <div key={s.id} style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', marginBottom: 6 }}>
                    <div style={{ fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.soal || '(teks kosong)'}</div>
                    <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3 }}>{LABEL_TIPE[s.tipe] || s.tipe || 'PG Sederhana'} · Kelas {s.tingkatKelas || 'Semua'}{s.subMateri ? ` · ${s.subMateri}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}