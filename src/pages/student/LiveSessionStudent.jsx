// src/pages/student/LiveSessionStudent.jsx
// ============================================================
// SESI KELAS LIVE (sisi siswa) -- layar ini otomatis "ngikutin"
// apapun yang guru tampilin dari LiveSessionTeacher.jsx, real-time
// (pakai onSnapshot, BUKAN polling/refresh manual). Siswa TIDAK BISA
// maju sendiri -- ini sengaja (lihat penjelasan keputusan desain di
// LiveSessionTeacher.jsx).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, doc, setDoc, onSnapshot, query, where, getDocs, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeft, Users, Clock } from 'lucide-react';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';

export default function LiveSessionStudent() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';
  const studentName = localStorage.getItem('studentName') || 'Siswa';
  const studentKelas = localStorage.getItem('studentKelas') || '';

  const [sesiId, setSesiId] = useState(null);
  const [sesiData, setSesiData] = useState(null);
  const [dataSayaSendiri, setDataSayaSendiri] = useState(null);
  const [jawabanDipilih, setJawabanDipilih] = useState(null);
  const [mencari, setMencari] = useState(true);

  // ---------------- CARI SESI AKTIF buat kelas ini ----------------
  useEffect(() => {
    if (!studentKelas) { setMencari(false); return; }
    const q = query(
      collection(db, 'sesi_live'),
      where('kelasSekolah', '==', studentKelas),
      where('status', '==', 'aktif'),
    );
    // 🔥 onSnapshot (bukan getDocs sekali doang) -- biar begitu guru
    // MULAI sesi baru, layar siswa otomatis nemuin & nyambung TANPA
    // siswa perlu refresh/buka ulang halaman ini duluan.
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setSesiId(snap.docs[0].id);
      } else {
        setSesiId(null);
        setSesiData(null);
      }
      setMencari(false);
    }, (e) => { console.error('Gagal cari sesi live:', e); setMencari(false); });
    return () => unsub();
  }, [studentKelas]);

  // ---------------- DENGARKAN SESI (real-time) ----------------
  useEffect(() => {
    if (!sesiId) return;
    const unsub = onSnapshot(doc(db, 'sesi_live', sesiId), (snap) => {
      if (snap.exists()) setSesiData(snap.data());
    });
    return () => unsub();
  }, [sesiId]);

  // Reset pilihan jawaban tiap kali soal aktif GANTI (index berubah)
  useEffect(() => {
    setJawabanDipilih(null);
  }, [sesiData?.indexSekarang]);

  // ---------------- DENGARKAN DATA SENDIRI (biar tau udah jawab apa belum) ----------------
  useEffect(() => {
    if (!sesiId || !studentId) return;
    const unsub = onSnapshot(doc(db, 'sesi_live', sesiId, 'peserta', studentId), (snap) => {
      setDataSayaSendiri(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [sesiId, studentId]);

  const soalSekarang = sesiData?.daftarSoal?.[sesiData?.indexSekarang];
  const indexSoalIni = sesiData?.indexSekarang;
  const sudahJawabSoalIni = dataSayaSendiri?.jawabanPerSoal?.[indexSoalIni] !== undefined;

  const kirimJawaban = useCallback(async (pilihanIndex) => {
    if (!sesiId || !studentId || sudahJawabSoalIni || sesiData?.tahap !== 'soal') return;
    setJawabanDipilih(pilihanIndex);
    try {
      const benar = pilihanIndex === soalSekarang?.kunciJawaban;
      await setDoc(doc(db, 'sesi_live', sesiId, 'peserta', studentId), {
        nama: studentName,
        [`jawabanPerSoal.${indexSoalIni}`]: { pilihan: pilihanIndex, benar, waktu: serverTimestamp() },
      }, { merge: true });
    } catch (e) {
      console.error('Gagal kirim jawaban live:', e);
      setJawabanDipilih(null);
    }
  }, [sesiId, studentId, studentName, sudahJawabSoalIni, sesiData, soalSekarang, indexSoalIni]);

  // ---------------- RENDER ----------------
  if (mencari) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Mencari sesi kelas live...</div>;
  }

  if (!sesiId || !sesiData || sesiData.status === 'selesai') {
    return (
      <div style={{ maxWidth: 420, margin: '80px auto', textAlign: 'center', padding: 20, fontFamily: 'sans-serif' }}>
        <button onClick={() => navigate('/siswa/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 20 }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ fontSize: 44 }}>📡</div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Belum Ada Sesi Live</h2>
        <p style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
          Kalau gurumu udah mulai sesi kelas live, layar ini bakal otomatis kebuka sendiri -- gak perlu refresh.
        </p>
      </div>
    );
  }

  const opsi = soalSekarang?.opsiJawaban || [];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#1E3A8A', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulseLiveSiswa 1.2s infinite' }} />
        <style>{`@keyframes pulseLiveSiswa { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
        <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>Kelas Live -- {sesiData.mataPelajaran}</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
          Soal {sesiData.indexSekarang + 1}/{sesiData.daftarSoal.length}
        </span>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, color: '#1e293b', marginBottom: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            <RenderMath text={soalSekarang?.soal || soalSekarang?.teks_soal} />
          </div>
          {soalSekarang?.tabelSoal && <RenderTable table={soalSekarang.tabelSoal} />}

          {opsi.map((opt, i) => {
            const teks = typeof opt === 'string' ? opt : (opt?.teks || '');
            const iniDipilihSaya = dataSayaSendiri?.jawabanPerSoal?.[indexSoalIni]?.pilihan === i;
            const iniKunci = i === soalSekarang?.kunciJawaban;
            const modePembahasan = sesiData.tahap === 'pembahasan';

            let border = '#e2e8f0', bg = 'white';
            if (modePembahasan) {
              if (iniKunci) { border = '#22c55e'; bg = '#f0fdf4'; }
              else if (iniDipilihSaya) { border = '#ef4444'; bg = '#fef2f2'; }
            } else if (iniDipilihSaya) {
              border = '#5B2ECC'; bg = '#f5f3ff';
            }

            return (
              <button
                key={i}
                disabled={sudahJawabSoalIni || sesiData.tahap === 'pembahasan'}
                onClick={() => kirimJawaban(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderRadius: 12, border: `2px solid ${border}`, marginBottom: 8,
                  background: bg, cursor: sudahJawabSoalIni || sesiData.tahap === 'pembahasan' ? 'default' : 'pointer', fontSize: 13,
                }}
              >
                <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, color: border }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}><RenderMath text={teks} /></span>
                {modePembahasan && iniKunci && '✔️'}
              </button>
            );
          })}

          {sesiData.tahap === 'pembahasan' && soalSekarang?.pembahasan && (
            <div style={{ marginTop: 10, background: '#f5f3ff', borderRadius: 10, padding: 12, fontSize: 12.5, color: '#4c1d95' }}>
              💡 <RenderMath text={soalSekarang.pembahasan} />
            </div>
          )}
        </div>

        {/* Status nunggu -- biar siswa gak bingung kenapa "diem aja" */}
        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Clock size={13} />
          {sesiData.tahap === 'soal' && !sudahJawabSoalIni && 'Pilih jawabanmu...'}
          {sesiData.tahap === 'soal' && sudahJawabSoalIni && 'Jawaban terkirim! Menunggu guru buka pembahasan...'}
          {sesiData.tahap === 'pembahasan' && 'Guru lagi bahas -- lihat papan tulis ya!'}
        </div>
      </div>
    </div>
  );
}