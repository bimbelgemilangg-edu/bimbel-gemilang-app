// src/pages/teacher/LiveSessionTeacher.jsx
// ============================================================
// SESI KELAS LIVE (kontrol guru) -- fondasi fitur "buku interaktif":
// guru pilih BAB yang udah siap (bukan cari soal manual satu-satu),
// mulai sesi, navigasi SATU SOAL PER SATU KALI (lockstep) -- semua
// siswa di kelas itu otomatis ngikutin di HP masing-masing secara
// real-time (lihat LiveSessionStudent.jsx). Guru lihat progres
// jawaban siswa LANGSUNG tanpa perlu refresh.
//
// 🔥 KEPUTUSAN DESAIN PENTING: daftar "bab siap pakai" itu OTOMATIS
// kedeteksi dari Bank Soal (dikelompokkan per mataPelajaran+materi) --
// BUKAN dari koleksi admin terpisah yang perlu di-input manual lagi.
// Begitu admin import soal (via Import Hasil Scan AI, alur yang udah
// ada) dengan materi diisi konsisten (mis. "Bilangan Bulat dan
// Pecahan"), bab itu OTOMATIS muncul di daftar guru -- gak ada
// langkah admin tambahan, gak ada loading nyari soal di sisi guru
// (daftar bab disiapkan SEKALI di awal buka halaman, gak per-klik).
//
// KEPUTUSAN DESAIN LAIN (biar konsisten dgn kelas hybrid, guru
// jelasin di papan dulu -> siswa coba -> guru bahas): siswa TIDAK
// BISA maju sendiri, harus nunggu guru buka soal berikutnya/
// pembahasan. Ini disengaja, BUKAN keterbatasan teknis.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, addDoc, doc, updateDoc, onSnapshot, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeft, Play, ChevronRight, Users, Square, BookOpen } from 'lucide-react';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';

const TIPE_DIDUKUNG = ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori', 'isian_singkat', 'numerik'];

export default function LiveSessionTeacher() {
  const navigate = useNavigate();
  const guruId = localStorage.getItem('teacherId') || localStorage.getItem('teacherNip') || '';

  const [tahapHalaman, setTahapHalaman] = useState('pilih-bab'); // 'pilih-bab' | 'live'
  const [kelasSekolah, setKelasSekolah] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [daftarBab, setDaftarBab] = useState([]); // [{mataPelajaran, materi, soal:[...]}]
  const [memuatBab, setMemuatBab] = useState(true);
  const [sedangMulai, setSedangMulai] = useState(false);

  const [sesiId, setSesiId] = useState(null);
  const [sesiData, setSesiData] = useState(null);
  const [peserta, setPeserta] = useState({});

  // ---------------- Ambil daftar kelas ----------------
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

  // ---------------- Siapkan daftar BAB otomatis (SEKALI, bukan per-klik) ----------------
  useEffect(() => {
    (async () => {
      setMemuatBab(true);
      try {
        const snap = await getDocs(query(collection(db, 'bank_soal'), where('status', '==', 'aktif')));
        const perBab = {};
        snap.forEach((d) => {
          const s = { id: d.id, ...d.data() };
          if (!TIPE_DIDUKUNG.includes(s.tipe || 'pg_sederhana')) return;
          if (!s.materi || !s.mataPelajaran) return;
          const kunci = `${s.mataPelajaran}||${s.materi}`;
          if (!perBab[kunci]) perBab[kunci] = { mataPelajaran: s.mataPelajaran, materi: s.materi, soal: [] };
          perBab[kunci].soal.push(s);
        });
        const daftar = Object.values(perBab)
          .filter((b) => b.soal.length >= 3) // minimal 3 soal biar layak jadi 1 sesi
          .sort((a, b) => a.materi.localeCompare(b.materi));
        setDaftarBab(daftar);
      } catch (e) {
        console.error('Gagal siapkan daftar bab:', e);
      }
      setMemuatBab(false);
    })();
  }, []);

  // ---------------- MULAI SESI dari 1 bab ----------------
  const mulaiSesi = useCallback(async (bab) => {
    if (!kelasSekolah) return alert('Pilih kelas dulu.');
    setSedangMulai(true);
    try {
      const docRef = await addDoc(collection(db, 'sesi_live'), {
        guruId, kelasSekolah,
        mataPelajaran: bab.mataPelajaran,
        materiJudul: bab.materi,
        daftarSoal: bab.soal, // udah siap, gak ada query tambahan pas mulai -> instan
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
    setSedangMulai(false);
  }, [guruId, kelasSekolah]);

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
    setTahapHalaman('pilih-bab');
    setSesiId(null);
    setSesiData(null);
  }, [sesiId]);

  // ---------------- RENDER: PILIH BAB ----------------
  if (tahapHalaman === 'pilih-bab') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16 }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>🔴 Mulai Sesi Kelas Live</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
          Pilih kelas & bab -- siswa di kelas itu otomatis ngikutin di HP mereka, gak perlu setup manual.
        </p>

        <select value={kelasSekolah} onChange={(e) => setKelasSekolah(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e5e7eb', marginBottom: 18, fontSize: 14 }}>
          <option value="">-- Pilih Kelas Dulu --</option>
          {availableClasses.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>

        {!kelasSekolah ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 30, border: '1px dashed #d1d5db', borderRadius: 12 }}>
            Pilih kelas dulu buat lihat daftar bab yang siap dipakai.
          </div>
        ) : memuatBab ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 30 }}>Menyiapkan daftar bab...</div>
        ) : daftarBab.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 30, border: '1px dashed #d1d5db', borderRadius: 12 }}>
            Belum ada bab yang siap (minimal 3 soal per materi). Import soal dulu lewat halaman Bank Soal ya.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {daftarBab.map((bab) => (
              <button
                key={`${bab.mataPelajaran}-${bab.materi}`}
                onClick={() => mulaiSesi(bab)}
                disabled={sedangMulai}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', background: 'white', cursor: sedangMulai ? 'default' : 'pointer' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={20} color="#5B2ECC" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1e293b' }}>{bab.materi}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{bab.mataPelajaran} · {bab.soal.length} soal siap</div>
                </div>
                <Play size={18} color="#5B2ECC" />
              </button>
            ))}
          </div>
        )}
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
        <button onClick={() => { setTahapHalaman('pilih-bab'); setSesiId(null); setSesiData(null); }} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#5B2ECC', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
          Mulai Sesi Baru
        </button>
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
          <span style={{ fontWeight: 800, fontSize: 13, color: '#dc2626' }}>LIVE -- {sesiData.materiJudul} · Kelas {sesiData.kelasSekolah}</span>
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
        <div style={{ fontSize: 14, color: '#1e293b', marginBottom: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}><RenderMath text={soalSekarang?.soal || soalSekarang?.teks_soal} /></div>
        {(soalSekarang?.gambarUrls || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            {soalSekarang.gambarUrls.map((url, i) => <img key={i} src={url} alt="" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 8 }} />)}
          </div>
        )}
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