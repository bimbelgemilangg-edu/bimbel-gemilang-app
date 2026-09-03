// src/pages/admin/bank-soal/TerbitkanKuisPage.jsx
// ============================================================
// TERBITKAN KUIS DARI BANK SOAL (Admin)
// ============================================================
// Jembatan dari "gudang" (bank_soal, hasil pipeline import di
// ImportHasilScanPage.jsx) ke siswa beneran. TIDAK bikin koleksi baru
// atau alur baru -- soal dikonversi ke bentuk quizData lalu disimpan
// sebagai dokumen bimbel_modul (type: 'kuis_mandiri'), PERSIS skema
// yang sudah dipakai & terbukti jalan di ManageQuiz.jsx dan dibaca
// StudentQuizView.jsx. Jadi semua infrastruktur (halaman kerjakan
// soal, penilaian otomatis, riwayat, dst) langsung kepakai tanpa
// dibangun ulang.
//
// KEPUTUSAN PENTING (dikonfirmasi ke admin sebelum dibangun):
// - Ini murni fitur ADMIN, TIDAK terikat guru/kodeMapel. Supaya kuis
//   ini bisa dibuka SEMUA siswa apa pun mapel yang mereka ikuti,
//   subject sengaja diisi 'Umum' -- ada jalur bypass eksplisit untuk
//   ini di hasSubjectAccess() (dipakai StudentDashboard.jsx DAN
//   StudentModuleView.jsx): `if (modulSubject.toLowerCase()==='umum')
//   return true`. Targeting yang BENERAN dipakai untuk membatasi siapa
//   yang bisa buka adalah `targetKelas` (dicocokkan persis ke
//   `kelasSekolah` siswa, mis. "10 SMA") -- bukan mapel.
// - notifyStudents() versi terbaru WAJIB kodeMapel ATAU
//   specificStudentIds (menolak kirim kalau kosong, supaya notif tidak
//   nyasar). Karena ini lintas-mapel, kita pakai specificStudentIds:
//   hitung sendiri siapa yang match targetKelas/targetKategori dari
//   collection "students", baru kirim ke ID-ID itu secara eksplisit.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  collection, getDocs, addDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { notifyStudents } from '../../../utils/notifications';
import {
  Rocket, Filter, CheckSquare, Square, Loader2, Send, ArrowLeft,
  AlertTriangle, CheckCircle2, BookOpen,
} from 'lucide-react';

// ============================================================
// KONVERSI bank_soal -> quizData (lihat penjelasan lengkap & bukti
// tes di konversiBankSoalKeQuiz.js yang sudah diverifikasi sebelumnya
// -- logika di bawah ini PERSIS SAMA, cuma ditempel langsung di sini
// supaya halaman ini satu file mandiri).
// ============================================================

function hurufKeIndex(huruf) {
  if (!huruf) return -1;
  const h = String(huruf).trim().toUpperCase();
  if (h.length !== 1) return -1;
  const idx = h.charCodeAt(0) - 65;
  return idx >= 0 && idx <= 25 ? idx : -1;
}

function konversiSoalKeQuiz(soal) {
  const tipeAsal = soal.tipe || 'pg_sederhana';

  let tipeKuis = 'multiple';
  if (tipeAsal === 'pg_kompleks') tipeKuis = 'multiselect';
  else if (tipeAsal === 'benar_salah' || tipeAsal === 'pg_kategori') tipeKuis = 'truefalse';
  else if (tipeAsal === 'menjodohkan') tipeKuis = 'matching';
  else if (tipeAsal === 'isian_singkat' || tipeAsal === 'numerik' || tipeAsal === 'uraian') tipeKuis = 'shortanswer';

  const opsiTeks = (soal.opsiJawaban || []).map((o) => (typeof o === 'string' ? o : (o?.teks || '')));
  const kunciMentah = soal.kunciJawaban;
  const daftarKunci = Array.isArray(kunciMentah) ? kunciMentah : [kunciMentah];
  const indexKunci = daftarKunci.map(hurufKeIndex).filter((i) => i >= 0);

  const statements = (tipeKuis === 'truefalse')
    ? (soal.tabelBenarSalah?.length ? soal.tabelBenarSalah : (soal.pernyataan || [])).map((p) => {
        if (typeof p === 'string') return { text: p, correct: false };
        const teks = p.pernyataan || p.teks || '';
        const jawabanMentah = String(p.jawaban || '').trim().toLowerCase();
        return { text: teks, correct: jawabanMentah === 'benar' || jawabanMentah === 'true' };
      })
    : [];

  const matchingPairs = (tipeKuis === 'matching')
    ? (soal.pasangan || []).map((p) => ({ kiri: p.kiri || '', kanan: p.kanan || '' }))
    : [];

  return {
    id: soal.id || `bs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: tipeKuis,
    question: soal.soal || soal.teks_soal || '',
    questionImage: (soal.gambarUrls && soal.gambarUrls[0]) || '',
    options: (tipeKuis === 'multiple' || tipeKuis === 'multiselect') ? (opsiTeks.length ? opsiTeks : ['', '', '', '']) : ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correctAnswer: tipeKuis === 'multiselect' ? null : (indexKunci[0] ?? 0),
    correctAnswers: tipeKuis === 'multiselect' ? indexKunci : [],
    explanation: soal.pembahasan || '',
    statements,
    readingText: '',
    subQuestions: [],
    shortAnswer: tipeKuis === 'shortanswer' ? String(daftarKunci[0] || '') : '',
    cause: '', effect: '', isCauseTrue: true, isEffectTrue: true,
    matchingPairs,
    needsImage: false, imageHint: '', imageSource: null,
    researchBacked: false, researchSources: [],
    visualRequired: false, visualKind: 'none',
    difficulty: soal.tingkatKesulitan || '',
    competency: soal.materi || '',
    _sumberBankSoalId: soal.id || null,
  };
}

function konversiBanyakSoalKeQuiz(daftarSoal) {
  const hasil = [];
  const peringatan = [];
  daftarSoal.forEach((soal, i) => {
    const quizItem = konversiSoalKeQuiz(soal);
    if (!quizItem.question.trim()) peringatan.push(`Soal ke-${i + 1} (id: ${soal.id || '?'}): teks soal kosong.`);
    if ((quizItem.type === 'multiple' || quizItem.type === 'multiselect') && quizItem.options.every((o) => !o)) {
      peringatan.push(`Soal ke-${i + 1} (id: ${soal.id || '?'}): opsi jawaban kosong semua.`);
    }
    hasil.push(quizItem);
  });
  return { quizData: hasil, peringatan };
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================

export default function TerbitkanKuisPage() {
  const navigate = useNavigate();

  const [filterMapel, setFilterMapel] = useState('');
  const [filterJenisUjian, setFilterJenisUjian] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterKesulitan, setFilterKesulitan] = useState('');
  const [filterMateri, setFilterMateri] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const [loadingSoal, setLoadingSoal] = useState(false);
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [terpilih, setTerpilih] = useState(new Set());
  const [sudahCari, setSudahCari] = useState(false);

  const [judulKuis, setJudulKuis] = useState('');
  const [targetKelas, setTargetKelas] = useState('Semua');
  const [targetKategori, setTargetKategori] = useState('Semua');
  const [availableClasses, setAvailableClasses] = useState(['Semua']);
  const [pakaiDeadline, setPakaiDeadline] = useState(false);
  const [deadlineTanggal, setDeadlineTanggal] = useState('');

  const [menerbitkan, setMenerbitkan] = useState(false);
  const [hasil, setHasil] = useState(null); // { success, message }

  // Ambil daftar kelas yang benar-benar ada dari data siswa (persis
  // pola ManageTugas.jsx) -- supaya dropdown target selalu sinkron
  // dengan format kelasSekolah yang dipakai beneran, bukan hardcode.
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        const kelasList = [...new Set(snap.docs.map((d) => d.data().kelasSekolah).filter(Boolean))];
        kelasList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(['Semua', ...kelasList]);
      } catch (e) {
        console.error('Gagal ambil daftar kelas:', e);
      }
    })();
  }, []);

  const cariSoal = useCallback(async () => {
    setLoadingSoal(true);
    setSudahCari(true);
    setTerpilih(new Set());
    try {
      // Firestore where() equality dulu buat mapel (paling selektif +
      // gak butuh index gabungan) -- sisanya (kelas/kesulitan/materi)
      // disaring di sisi klien supaya tidak butuh composite index baru
      // tiap kombinasi filter berubah.
      const constraints = [where('status', '==', 'aktif')];
      if (filterMapel.trim()) constraints.push(where('mataPelajaran', '==', filterMapel.trim()));
      if (filterJenisUjian.trim()) constraints.push(where('jenisUjian', '==', filterJenisUjian.trim()));
      const q = query(collection(db, 'bank_soal'), ...constraints);
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (filterKelas.trim()) list = list.filter((s) => String(s.tingkatKelas || '') === filterKelas.trim());
      if (filterKesulitan.trim()) list = list.filter((s) => String(s.tingkatKesulitan || '') === filterKesulitan.trim());
      if (filterMateri.trim()) {
        const kw = filterMateri.trim().toLowerCase();
        list = list.filter((s) => String(s.materi || '').toLowerCase().includes(kw));
      }
      if (filterTag.trim()) {
        const kw = filterTag.trim().toLowerCase();
        list = list.filter((s) => (s.tags || []).some((t) => String(t).toLowerCase().includes(kw)));
      }

      list.sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0));
      setDaftarSoal(list);
    } catch (e) {
      console.error('Gagal mencari soal:', e);
      alert('Gagal mengambil soal dari Bank Soal: ' + e.message);
    }
    setLoadingSoal(false);
  }, [filterMapel, filterJenisUjian, filterKelas, filterKesulitan, filterMateri, filterTag]);

  const toggleSoal = (id) => {
    setTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const pilihSemua = () => setTerpilih(new Set(daftarSoal.map((s) => s.id)));
  const batalkanSemua = () => setTerpilih(new Set());

  const handleTerbitkan = async () => {
    if (!judulKuis.trim()) return alert('Judul kuis wajib diisi.');
    if (terpilih.size === 0) return alert('Pilih minimal 1 soal dulu.');
    if (pakaiDeadline && !deadlineTanggal) return alert('Isi tanggal deadline, atau matikan opsi deadline.');

    const soalDipilih = daftarSoal.filter((s) => terpilih.has(s.id));
    const { quizData, peringatan } = konversiBanyakSoalKeQuiz(soalDipilih);

    if (peringatan.length > 0) {
      const lanjut = window.confirm(
        `⚠️ Ada ${peringatan.length} soal dengan kemungkinan masalah:\n\n${peringatan.slice(0, 5).join('\n')}` +
        (peringatan.length > 5 ? `\n...dan ${peringatan.length - 5} lainnya.` : '') +
        `\n\nTetap terbitkan?`,
      );
      if (!lanjut) return;
    }

    setMenerbitkan(true);
    setHasil(null);
    try {
      const payload = {
        title: judulKuis.toUpperCase(),
        subject: 'Umum', // 🔥 kunci utama: bypass gerbang mapel, lihat catatan di atas file
        kodeMapel: '',
        type: 'kuis_mandiri',
        status: 'aktif',
        targetKelas,
        targetKategori,
        quizData,
        totalQuestions: quizData.length,
        useSchedule: pakaiDeadline,
        quizOpenDate: null,
        quizCloseDate: pakaiDeadline ? deadlineTanggal : null,
        guruId: 'admin',
        guruName: 'Admin Bimbel Gemilang',
        authorName: 'Admin Bimbel Gemilang',
        sumberBankSoal: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'bimbel_modul'), payload);

      // Hitung penerima notifikasi sendiri (cocokkan targetKelas &
      // targetKategori ke data siswa) -- karena notifyStudents() sekarang
      // wajib kodeMapel ATAU specificStudentIds, dan kuis ini sengaja
      // lintas-mapel jadi tidak punya kodeMapel yang relevan.
      const snapSiswa = await getDocs(collection(db, 'students'));
      const penerimaIds = snapSiswa.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const cocokKelas = targetKelas === 'Semua' || s.kelasSekolah === targetKelas;
          const cocokKategori = targetKategori === 'Semua' || s.kategori === targetKategori;
          return cocokKelas && cocokKategori && !s.isBlocked;
        })
        .map((s) => s.studentId || s.id);

      if (penerimaIds.length > 0) {
        await notifyStudents({
          specificStudentIds: penerimaIds,
          type: 'kuis',
          title: '🚀 Tryout/Kuis Baru!',
          message: `"${judulKuis}" (${quizData.length} soal) sudah bisa dikerjakan${pakaiDeadline ? ` — batas waktu ${new Date(deadlineTanggal).toLocaleString('id-ID')}` : ''}.`,
          link: '/siswa/materi',
        });
      }

      setHasil({
        success: true,
        message: `Kuis "${judulKuis}" berhasil diterbitkan (${quizData.length} soal) ke ${penerimaIds.length} siswa.`,
      });
      setJudulKuis('');
      setTerpilih(new Set());
    } catch (e) {
      console.error('Gagal menerbitkan kuis:', e);
      setHasil({ success: false, message: 'Gagal menerbitkan: ' + e.message });
    }
    setMenerbitkan(false);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button
        onClick={() => navigate('/admin/bank-soal')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}
      >
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
        <Rocket size={24} color="#06b6d4" /> Terbitkan Kuis dari Bank Soal
      </h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        Pilih soal dari gudang (Bank Soal), lalu terbitkan sebagai kuis yang bisa langsung dikerjakan siswa. Tidak terikat guru/mapel tertentu.
      </p>

      {/* FILTER PENCARIAN SOAL */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 12 }}>
          <Filter size={15} /> Filter Soal
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <input placeholder="Mapel (mis. Matematika)" value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} style={inputStyle} />
          <select value={filterJenisUjian} onChange={(e) => setFilterJenisUjian(e.target.value)} style={inputStyle}>
            <option value="">Semua jenis ujian</option>
            <option value="TKA">TKA</option>
            <option value="SNBT/UTBK">SNBT/UTBK</option>
            <option value="Reguler">Reguler</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <input placeholder="Tingkat kelas (mis. 10)" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={inputStyle} />
          <select value={filterKesulitan} onChange={(e) => setFilterKesulitan(e.target.value)} style={inputStyle}>
            <option value="">Semua kesulitan</option>
            <option value="mudah">Mudah</option>
            <option value="sedang">Sedang</option>
            <option value="sulit">Sulit</option>
          </select>
          <input placeholder="Cari materi (mis. Logaritma)" value={filterMateri} onChange={(e) => setFilterMateri(e.target.value)} style={inputStyle} />
          <input placeholder="Cari tag (mis. hots, utbk)" value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={cariSoal} disabled={loadingSoal} style={{ ...btnPrimary, marginTop: 12 }}>
          {loadingSoal ? <Loader2 size={15} className="spin" /> : <BookOpen size={15} />}
          {loadingSoal ? 'Mencari...' : 'Cari Soal'}
        </button>
      </div>

      {/* HASIL PENCARIAN */}
      {sudahCari && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
              {daftarSoal.length} soal ditemukan · {terpilih.size} dipilih
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={pilihSemua} style={btnSecondary}>Pilih Semua</button>
              <button onClick={batalkanSemua} style={btnSecondary}>Batalkan Semua</button>
            </div>
          </div>

          {daftarSoal.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Tidak ada soal cocok dengan filter.</div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
              {daftarSoal.map((s) => (
                <div
                  key={s.id}
                  onClick={() => toggleSoal(s.id)}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px',
                    borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                    backgroundColor: terpilih.has(s.id) ? '#ecfeff' : 'white',
                  }}
                >
                  {terpilih.has(s.id) ? <CheckSquare size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} /> : <Square size={18} color="#cbd5e1" style={{ flexShrink: 0, marginTop: 2 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                      #{s.nomor} · {s.tipe} · {s.jenisUjian || '-'} · {s.materi || '-'} · {s.tingkatKesulitan || '-'}
                    </div>
                    <div style={{ fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.soal || s.teks_soal || '(tanpa teks)'}
                    </div>
                    {Array.isArray(s.tags) && s.tags.length > 0 && (
                      <div style={{ fontSize: 10, color: '#9d174d', marginTop: 2 }}>🏷️ {s.tags.join(', ')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM TERBITKAN */}
      {terpilih.size > 0 && (
        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0e7490', marginBottom: 12 }}>
            📤 Terbitkan {terpilih.size} Soal Terpilih
          </div>
          <input
            placeholder="Judul kuis (mis. Tryout TKA Matematika Paket 1)"
            value={judulKuis}
            onChange={(e) => setJudulKuis(e.target.value)}
            style={{ ...inputStyle, width: '100%', marginBottom: 10, backgroundColor: 'white' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
            <select value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}>
              {availableClasses.map((k) => <option key={k} value={k}>{k === 'Semua' ? 'Semua Kelas' : k}</option>)}
            </select>
            <select value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)} style={{ ...inputStyle, backgroundColor: 'white' }}>
              <option value="Semua">Semua Program</option>
              <option value="Reguler">Reguler</option>
              <option value="English">English</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 10 }}>
            <input type="checkbox" checked={pakaiDeadline} onChange={(e) => setPakaiDeadline(e.target.checked)} />
            Pakai batas waktu pengerjaan
          </label>
          {pakaiDeadline && (
            <input
              type="datetime-local"
              value={deadlineTanggal}
              onChange={(e) => setDeadlineTanggal(e.target.value)}
              style={{ ...inputStyle, marginBottom: 10, backgroundColor: 'white' }}
            />
          )}

          <button onClick={handleTerbitkan} disabled={menerbitkan} style={btnPrimary}>
            {menerbitkan ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
            {menerbitkan ? 'Menerbitkan...' : 'Terbitkan Kuis ke Siswa'}
          </button>
        </div>
      )}

      {hasil && (
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
          backgroundColor: hasil.success ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${hasil.success ? '#bbf7d0' : '#fecaca'}`,
          color: hasil.success ? '#166534' : '#b91c1c', fontSize: 13,
        }}>
          {hasil.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {hasil.message}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none',
};
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
  border: 'none', backgroundColor: '#06b6d4', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};
const btnSecondary = {
  padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', backgroundColor: 'white',
  fontSize: 12, cursor: 'pointer', color: '#374151',
};