// src/pages/teacher/LiveSessionTeacher.jsx
// ============================================================
// SESI KELAS LIVE (kontrol guru) -- fondasi fitur "buku interaktif":
// guru pilih soal-soal dari Bank Soal, mulai sesi, navigasi SATU
// SOAL PER SATU KALI (lockstep) -- semua siswa di kelas itu otomatis
// ngikutin di HP masing-masing secara real-time (lihat
// LiveSessionStudent.jsx). Guru lihat progres jawaban siswa LANGSUNG
// tanpa perlu refresh.
//
// KEPUTUSAN DESAIN (biar konsisten dgn kelas hybrid, guru jelasin di
// papan dulu -> siswa coba -> guru bahas): siswa TIDAK BISA maju
// sendiri, harus nunggu guru buka soal berikutnya/pembahasan. Ini
// disengaja, BUKAN keterbatasan teknis.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, addDoc, doc, updateDoc, onSnapshot, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeft, Play, ChevronRight, Users, CheckCircle2, XCircle, Square } from 'lucide-react';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';

export default function LiveSessionTeacher() {
  const navigate = useNavigate();
  const guruId = localStorage.getItem('teacherId') || localStorage.getItem('teacherNip') || '';

  const [tahapHalaman, setTahapHalaman] = useState('setup'); // 'setup' | 'live'
  const [kelasSekolah, setKelasSekolah] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [materiInput, setMateriInput] = useState('');
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [keranjang, setKeranjang] = useState([]); // soal terpilih, urut
  const [mencari, setMencari] = useState(false);

  const [sesiId, setSesiId] = useState(null);
  const [sesiData, setSesiData] = useState(null);
  const [peserta, setPeserta] = useState({}); // studentId -> {nama, jawabanPerSoal}

  // ---------------- SETUP: cari soal dari Bank Soal ----------------
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        const kelasSet = new Set();
        snap.forEach((d) => { const k = d.data().kelasSekolah; if (k) kelasSet.add(k); });
        setAvailableClasses(Array.from(kelasSet).sort());
      } catch (e) { console.error('Gagal ambil daftar kelas:', e); }
    })();
  }, []);

  const cariSoal = useCallback(async () => {
    if (!mataPelajaran.trim()) return alert('Isi mata pelajaran dulu.');
    setMencari(true);
    try {
      const q = query(collection(db, 'bank_soal'), where('mataPelajaran', '==', mataPelajaran), where('status', '==', 'aktif'));
      const snap = await getDocs(q);
      let hasil = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (materiInput.trim()) {
        const kunci = materiInput.trim().toLowerCase();
        hasil = hasil.filter((s) => (s.materi || '').toLowerCase().includes(kunci));
      }
      // 🔒 Sama kayak Try Out -- cuma tipe yang beneran punya renderer
      // yang boleh dipakai di sesi live (biar gak "kosong" pas ditampilin).
      const TIPE_DIDUKUNG = ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori', 'isian_singkat', 'numerik'];
      hasil = hasil.filter((s) => TIPE_DIDUKUNG.includes(s.tipe || 'pg_sederhana'));
      setDaftarSoal(hasil.slice(0, 40));
    } catch (e) {
      console.error('Gagal cari soal:', e);
      alert('Gagal mencari soal: ' + e.message);
    }
    setMencari(false);
  }, [mataPelajaran, materiInput]);

  const toggleKeranjang = (soal) => {
    setKeranjang((prev) => {
      const sudahAda = prev.find((s) => s.id === soal.id);
      if (sudahAda) return prev.filter((s) => s.id !== soal.id);
      return [...prev, soal];
    });
  };

  // ---------------- MULAI SESI ----------------
  const mulaiSesi = useCallback(async () => {
    if (!kelasSekolah) return alert('Pilih kelas dulu.');
    if (keranjang.length === 0) return alert('Pilih minimal 1 soal dulu.');
    try {
      const docRef = await addDoc(collection(db, 'sesi_live'), {
        guruId, kelasSekolah, mataPelajaran,
        daftarSoal: keranjang, // disimpan LANGSUNG (bukan cuma ID) biar siswa gak perlu query terpisah
        indexSekarang: 0,
        tahap: 'soal', // 'soal' | 'pembahasan'
        status: 'aktif',
        createdAt: serverTimestamp(),
      });
      setSesiId(docRef.id);
      setTahapHalaman('live');
    } catch (e) {
      console.error('Gagal mulai sesi:', e);
      alert('Gagal memulai sesi: ' + e.message);
    }
  }, [guruId, kelasSekolah, mataPelajaran, keranjang]);

  // ---------------- DENGARKAN SESI + PESERTA (real-time) ----------------
  useEffect(() => {
    if (!sesiId) return;
    const unsubSesi = onSnapshot(doc(db, 'sesi_live', sesiId), (snap) => {
      if (snap.exists()) setSesiData(snap.data());
    });
    const unsubPeserta = onSnapshot(collection(db, 'sesi_live', sesiId, 'peserta'), (snap) => {
      const map = {};
      snap.forEach((d) => { map[d.id] = d.data(); });
      setPeserta(map);
    });
    return () => { unsubSesi(); unsubPeserta(); };
  }, [sesiId]);

  const soalSekarang = sesiData?.daftarSoal?.[sesiData?.indexSekarang];
  const kunciBenarIndex = soalSekarang ? soalSekarang.kunciJawaban : null;

  const ringkasanJawaban = (() => {
    const daftar = Object.values(peserta);
    let sudahJawab = 0, benar = 0;
    daftar.forEach((p) => {
      const j = p.jawabanPerSoal?.[sesiData?.indexSekarang];
      if (j !== undefined) {
        sudahJawab += 1;
        // Perbandingan longgar -- kunciJawaban soal PG sederhana berupa
        // huruf (A/B/..) sedangkan jawaban siswa berupa index -- biar
        // aman dari 2 kemungkinan format, dicek dari sisi siswa yang
        // MENYIMPAN status benar/salahnya sendiri (lihat LiveSessionStudent).
        if (j?.benar) benar += 1;
      }
    });
    return { totalSiswa: daftar.length, sudahJawab, benar };
  })();

  const lanjutSoalBerikutnya = useCallback(async () => {
    if (!sesiId || !sesiData) return;
    const berikutnya = sesiData.indexSekarang + 1;
    if (berikutnya >= sesiData.daftarSoal.length) {
      await updateDoc(doc(db, 'sesi_live', sesiId), { status: 'selesai' });
      return;
    }
    await updateDoc(doc(db, 'sesi_live', sesiId), { indexSekarang: berikutnya, tahap: 'soal' });
  }, [sesiId, sesiData]);

  const bukaPembahasan = useCallback(async () => {
    if (!sesiId) return;
    await updateDoc(doc(db, 'sesi_live', sesiId), { tahap: 'pembahasan' });
  }, [sesiId]);

  const akhiriSesi = useCallback(async () => {
    if (!sesiId) return;
    if (!window.confirm('Yakin mau akhiri sesi live ini?')) return;
    await updateDoc(doc(db, 'sesi_live', sesiId), { status: 'selesai' });
    setTahapHalaman('setup');
    setSesiId(null);
    setSesiData(null);
    setKeranjang([]);
  }, [sesiId]);

  // ---------------- RENDER: SETUP ----------------
  if (tahapHalaman === 'setup') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16 }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>🔴 Mulai Sesi Kelas Live</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
          Siswa di kelas yang dipilih akan otomatis ngikutin soal yang kamu tampilkan, real-time di HP mereka.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <select value={kelasSekolah} onChange={(e) => setKelasSekolah(e.target.value)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb' }}>
            <option value="">-- Pilih Kelas --</option>
            {availableClasses.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input value={mataPelajaran} onChange={(e) => setMataPelajaran(e.target.value)} placeholder="Mata pelajaran (mis. Matematika)" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={materiInput} onChange={(e) => setMateriInput(e.target.value)} placeholder="Filter materi (opsional, mis. Bilangan Bulat)" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb' }} />
          <button onClick={cariSoal} disabled={mencari} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#5B2ECC', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            {mencari ? 'Mencari...' : 'Cari Soal'}
          </button>
        </div>

        {daftarSoal.length > 0 && (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
            {daftarSoal.map((s) => {
              const dipilih = keranjang.find((k) => k.id === s.id);
              const urutan = keranjang.findIndex((k) => k.id === s.id);
              return (
                <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 6px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                  <input type="checkbox" checked={!!dipilih} onChange={() => toggleKeranjang(s)} style={{ marginTop: 3 }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>
                    {dipilih && <b style={{ color: '#5B2ECC' }}>[{urutan + 1}] </b>}
                    {(s.soal || s.teks_soal || '').slice(0, 110)}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <button
          onClick={mulaiSesi}
          disabled={keranjang.length === 0 || !kelasSekolah}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: keranjang.length === 0 || !kelasSekolah ? '#e5e7eb' : '#dc2626', color: 'white', fontWeight: 800, fontSize: 14, cursor: keranjang.length === 0 || !kelasSekolah ? 'default' : 'pointer' }}
        >
          <Play size={16} /> Mulai Sesi Live ({keranjang.length} soal dipilih)
        </button>
      </div>
    );
  }

  // ---------------- RENDER: LIVE ----------------
  if (!sesiData) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat sesi...</div>;

  if (sesiData.status === 'selesai') {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 44 }}>✅</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Sesi Live Selesai</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#5B2ECC', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Kembali</button>
      </div>
    );
  }

  const opsi = soalSekarang?.opsiJawaban || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block', animation: 'pulseLive 1.2s infinite' }} />
          <style>{`@keyframes pulseLive { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#dc2626' }}>LIVE -- Kelas {sesiData.kelasSekolah}</span>
        </div>
        <button onClick={akhiriSesi} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Square size={12} /> Akhiri Sesi
        </button>
      </div>

      {/* Progres siswa REAL-TIME */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#f5f3ff', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#5B2ECC' }}><Users size={16} style={{ display: 'inline', marginRight: 4 }} />{ringkasanJawaban.totalSiswa}</div>
          <div style={{ fontSize: 10.5, color: '#7c3aed' }}>Siswa online</div>
        </div>
        <div style={{ flex: 1, background: '#fffbeb', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{ringkasanJawaban.sudahJawab}</div>
          <div style={{ fontSize: 10.5, color: '#b45309' }}>Sudah jawab</div>
        </div>
        <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{ringkasanJawaban.benar}</div>
          <div style={{ fontSize: 10.5, color: '#166534' }}>Jawaban benar</div>
        </div>
      </div>

      {/* Soal yang lagi ditampilin ke siswa */}
      <div style={{ border: '2px solid #5B2ECC', borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 700 }}>
          SOAL {sesiData.indexSekarang + 1} / {sesiData.daftarSoal.length} {sesiData.tahap === 'pembahasan' && '· MODE PEMBAHASAN'}
        </div>
        <div style={{ fontSize: 14, color: '#1e293b', marginBottom: 12, lineHeight: 1.6 }}><RenderMath text={soalSekarang?.soal || soalSekarang?.teks_soal} /></div>
        {soalSekarang?.tabelSoal && <RenderTable table={soalSekarang.tabelSoal} />}
        {opsi.map((opt, i) => {
          const teks = typeof opt === 'string' ? opt : (opt?.teks || '');
          const iniKunci = i === kunciBenarIndex;
          return (
            <div key={i} style={{
              padding: '9px 12px', borderRadius: 10, marginBottom: 6, fontSize: 13,
              background: sesiData.tahap === 'pembahasan' && iniKunci ? '#f0fdf4' : '#f8fafc',
              border: sesiData.tahap === 'pembahasan' && iniKunci ? '1px solid #22c55e' : '1px solid #e2e8f0',
              color: '#374151',
            }}>
              <b>{String.fromCharCode(65 + i)}.</b> <RenderMath text={teks} /> {sesiData.tahap === 'pembahasan' && iniKunci && '✔️'}
            </div>
          );
        })}
        {sesiData.tahap === 'pembahasan' && soalSekarang?.pembahasan && (
          <div style={{ marginTop: 10, background: '#f5f3ff', borderRadius: 10, padding: 12, fontSize: 12.5, color: '#4c1d95' }}>
            💡 <RenderMath text={soalSekarang.pembahasan} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {sesiData.tahap === 'soal' ? (
          <button onClick={bukaPembahasan} style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            💡 Buka Pembahasan
          </button>
        ) : (
          <button onClick={lanjutSoalBerikutnya} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px', borderRadius: 12, border: 'none', background: '#5B2ECC', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            {sesiData.indexSekarang + 1 >= sesiData.daftarSoal.length ? 'Selesaikan Sesi' : 'Soal Berikutnya'} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}