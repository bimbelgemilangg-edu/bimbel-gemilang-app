// src/pages/admin/bank-soal/HasilKuisAdminPage.jsx
// ============================================================
// HASIL KUIS (Admin) -- lihat siapa SUDAH/BELUM mengerjakan kuis yang
// diterbitkan lewat TerbitkanKuisPage.jsx, skor, dan jawaban detail
// per soal. Sumber data: koleksi "jawaban_kuis" yang SUDAH ADA & SUDAH
// JALAN (dipakai StudentQuizView.jsx buat nyimpen submission, dan
// CekTugasSiswa.jsx buat guru lihat punya sendiri). Halaman ini versi
// admin, difilter guruId==='admin' -- HANYA kuis yang diterbitkan lewat
// TerbitkanKuisPage.jsx yang muncul di sini.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import {
  ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, Loader2,
  ChevronDown, ChevronUp, Users, Trophy,
} from 'lucide-react';

export default function HasilKuisAdminPage() {
  const navigate = useNavigate();

  const [loadingKuis, setLoadingKuis] = useState(true);
  const [daftarKuis, setDaftarKuis] = useState([]);
  const [kuisTerpilih, setKuisTerpilih] = useState(null);

  const [loadingHasil, setLoadingHasil] = useState(false);
  const [barisSiswa, setBarisSiswa] = useState([]); // { student, jawaban|null }
  const [expandedId, setExpandedId] = useState(null);

  // Ambil semua kuis yang diterbitkan admin (bukan punya guru per-mapel)
  useEffect(() => {
    (async () => {
      setLoadingKuis(true);
      try {
        const q = query(
          collection(db, 'bimbel_modul'),
          where('guruId', '==', 'admin'),
          where('type', '==', 'kuis_mandiri'),
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setDaftarKuis(list);
      } catch (e) {
        console.error('Gagal ambil daftar kuis admin:', e);
      }
      setLoadingKuis(false);
    })();
  }, []);

  const bukaHasil = useCallback(async (kuis) => {
    setKuisTerpilih(kuis);
    setExpandedId(null);
    setLoadingHasil(true);
    try {
      // 1) Siswa yang JADI TARGET kuis ini (sama persis logika saat
      // menerbitkan di TerbitkanKuisPage.jsx -- supaya "belum
      // mengerjakan" dihitung dari orang yang MEMANG seharusnya
      // mengerjakan, bukan seluruh siswa se-bimbel).
      const snapSiswa = await getDocs(collection(db, 'students'));
      const targetSiswa = snapSiswa.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const cocokKelas = kuis.targetKelas === 'Semua' || s.kelasSekolah === kuis.targetKelas;
          const cocokKategori = kuis.targetKategori === 'Semua' || s.kategori === kuis.targetKategori;
          return cocokKelas && cocokKategori && !s.isBlocked;
        });

      // 2) Semua jawaban yang sudah masuk untuk kuis ini
      const qJawaban = query(collection(db, 'jawaban_kuis'), where('modulId', '==', kuis.id));
      const snapJawaban = await getDocs(qJawaban);
      const jawabanList = snapJawaban.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 3) Gabungkan: cocokkan siswa <-> jawaban lewat studentNim, yang
      // isinya bisa berasal dari studentId ATAU id dokumen siswa (lihat
      // catatan di StudentQuizView.jsx: nim = studentId || nim || id).
      const jawabanByNim = new Map();
      jawabanList.forEach((j) => jawabanByNim.set(j.studentNim, j));

      const baris = targetSiswa.map((s) => {
        const nimKandidat = s.studentId || s.nim || s.id;
        const jawaban = jawabanByNim.get(nimKandidat) || jawabanByNim.get(s.id) || null;
        return { student: s, jawaban };
      });

      // Yang sudah kerja duluan, urut skor tertinggi; yang belum di bawah
      baris.sort((a, b) => {
        if (!!a.jawaban === !!b.jawaban) return (b.jawaban?.score || 0) - (a.jawaban?.score || 0);
        return a.jawaban ? -1 : 1;
      });

      setBarisSiswa(baris);
    } catch (e) {
      console.error('Gagal ambil hasil kuis:', e);
      alert('Gagal mengambil hasil: ' + e.message);
    }
    setLoadingHasil(false);
  }, []);

  const sudahCount = barisSiswa.filter((b) => b.jawaban).length;
  const rataRata = sudahCount > 0
    ? Math.round(barisSiswa.reduce((sum, b) => sum + (b.jawaban?.score || 0), 0) / sudahCount)
    : 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={backBtn}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>
        <ClipboardCheck size={24} color="#06b6d4" /> Hasil Kuis
      </h1>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* KOLOM KIRI: daftar kuis */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>KUIS DITERBITKAN</div>
          {loadingKuis ? (
            <Loader2 size={18} className="spin" />
          ) : daftarKuis.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Belum ada kuis diterbitkan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daftarKuis.map((k) => (
                <div
                  key={k.id}
                  onClick={() => bukaHasil(k)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${kuisTerpilih?.id === k.id ? '#06b6d4' : '#e5e7eb'}`,
                    backgroundColor: kuisTerpilih?.id === k.id ? '#ecfeff' : 'white',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{k.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {k.totalQuestions} soal · {k.targetKelas || 'Semua'} · {k.targetKategori || 'Semua'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KOLOM KANAN: hasil */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {!kuisTerpilih ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Pilih kuis di sebelah kiri untuk lihat hasilnya.
            </div>
          ) : loadingHasil ? (
            <Loader2 size={20} className="spin" />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={statCard}>
                  <Users size={16} color="#6b7280" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{sudahCount}/{barisSiswa.length}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>sudah mengerjakan</div>
                  </div>
                </div>
                <div style={statCard}>
                  <Trophy size={16} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{rataRata}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>rata-rata skor</div>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                {barisSiswa.map(({ student, jawaban }) => (
                  <div key={student.id}>
                    <div
                      onClick={() => jawaban && setExpandedId(expandedId === student.id ? null : student.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9', cursor: jawaban ? 'pointer' : 'default',
                        backgroundColor: jawaban ? 'white' : '#fef2f2',
                      }}
                    >
                      {jawaban ? <CheckCircle2 size={16} color="#16a34a" /> : <XCircle size={16} color="#dc2626" />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{student.namaLengkap || student.nama || '-'}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{student.kelasSekolah || '-'}</div>
                      </div>
                      {jawaban ? (
                        <>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0e7490' }}>{jawaban.score}</span>
                          {expandedId === student.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>BELUM KERJAKAN</span>
                      )}
                    </div>

                    {expandedId === student.id && jawaban && (
                      <div style={{ padding: '10px 14px 16px 40px', backgroundColor: '#f9fafb', borderBottom: '1px solid #f1f5f9' }}>
                        {(jawaban.details || []).map((d, i) => (
                          <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < jawaban.details.length - 1 ? '1px dashed #e5e7eb' : 'none' }}>
                            <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                              <b>{i + 1}.</b> {d.question}
                            </div>
                            <div style={{ fontSize: 11, color: d.isCorrect ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {d.isCorrect ? '✓ Benar' : '✗ Salah'}
                              {typeof d.partsCorrect === 'number' && d.partsTotal ? ` (${d.partsCorrect}/${d.partsTotal})` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const backBtn = { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 };
const statCard = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', backgroundColor: 'white' };