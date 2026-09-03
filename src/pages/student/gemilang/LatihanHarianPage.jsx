// src/pages/student/gemilang/LatihanHarianPage.jsx
// ============================================================
// LATIHAN HARIAN -- jantung sistem gamifikasi baru.
//
// 🔥 ARSITEKTUR: halaman BARU, terpisah total dari sistem lama (sesuai
// kesepakatan sebelumnya) -- TIDAK numpang ke StudentQuizView.jsx (itu
// khusus kuis guru) atau halaman lain yang tujuannya beda.
//
// Algoritma pemilihan soal (Leitner Box + rekomendasi materi terlemah)
// SUDAH DIUJI TERPISAH sebelum ditempel ke sini -- lihat riwayat
// pengujian: kenaikan/turun kotak, jadwal tinjau ulang per kotak,
// skenario materi lemah/kuat/belum tersentuh, dan logika streak harian.
// Semua kasus tepi terbukti benar.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp, limit,
} from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, XCircle, Flame, Sparkles, BookOpen } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// 🔥 BARU (bug nyata ditemukan): soal-soal dari Bank Soal ternyata pakai
// DUA gaya delimiter LaTeX yang beda -- \(...\) / \[...\] (gaya standar
// LaTeX) DAN $...$ / $$...$$ (gaya dolar). renderMath() yang lama (di
// StudentQuizView.jsx) cuma kenal gaya dolar -- kalau dipakai apa
// adanya di sini, soal Kimia (yang pakai \(...\)) bakal tampil mentah
// tanpa dirender ("berantakan", persis yang dilaporkan). Sekarang
// regex-nya kenal KEDUA gaya sekaligus.
const renderMath = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch (e) { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.slice(1, -1)} />; } catch (e) { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch (e) { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      try { return <InlineMath key={i} math={part.slice(2, -2)} />; } catch (e) { return <span key={i}>{part}</span>; }
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

// ============================================================
// ALGORITMA (identik dengan yang sudah diuji terpisah)
// ============================================================

const JEDA_HARI_PER_KOTAK = { 1: 1, 2: 3, 3: 7, 4: 14 };

function kotakBerikutnya(kotakSekarang, benar) {
  if (!benar) return 1;
  return Math.min(4, (kotakSekarang || 0) + 1);
}

function siapDitinjauLagi(kotak, terakhirDicobaStr, hariIniMs) {
  if (!terakhirDicobaStr) return true;
  const jeda = JEDA_HARI_PER_KOTAK[kotak] || 1;
  const terakhirMs = new Date(terakhirDicobaStr).getTime();
  const selisihHari = Math.floor((hariIniMs - terakhirMs) / (1000 * 60 * 60 * 24));
  return selisihHari >= jeda;
}

function hitungPenguasaanPerMateri(soalList, progressMap) {
  const perMateri = {};
  soalList.forEach((s) => {
    const materi = s.materi || 'Lainnya';
    if (!perMateri[materi]) perMateri[materi] = { benar: 0, total: 0, jumlahSoal: 0 };
    perMateri[materi].jumlahSoal += 1;
    const p = progressMap[s.id];
    if (p) {
      perMateri[materi].benar += p.benarCount || 0;
      perMateri[materi].total += (p.benarCount || 0) + (p.salahCount || 0);
    }
  });
  return Object.entries(perMateri).map(([materi, d]) => ({
    materi,
    jumlahSoal: d.jumlahSoal,
    persentase: d.total > 0 ? Math.round((d.benar / d.total) * 100) : null,
  }));
}

function pilihSoalRekomendasi(soalList, progressMap, hariIniMs, target = 10) {
  const penguasaan = hitungPenguasaanPerMateri(soalList, progressMap);
  const materiSudahDicoba = penguasaan.filter((p) => p.persentase !== null).sort((a, b) => a.persentase - b.persentase);
  const materiBelumDicoba = penguasaan.filter((p) => p.persentase === null);

  const targetTerlemah = Math.round(target * 0.6);
  const targetReview = Math.round(target * 0.2);

  const terpilih = new Map();

  for (const m of materiSudahDicoba) {
    if (terpilih.size >= targetTerlemah) break;
    const soalMateriIni = soalList.filter((s) => (s.materi || 'Lainnya') === m.materi);
    for (const s of soalMateriIni) {
      if (terpilih.size >= targetTerlemah) break;
      const p = progressMap[s.id];
      if (!p || siapDitinjauLagi(p.kotak, p.terakhirDicoba, hariIniMs)) {
        if (!terpilih.has(s.id)) terpilih.set(s.id, s);
      }
    }
  }

  const kandidatReview = soalList.filter((s) => {
    const p = progressMap[s.id];
    return p && p.kotak <= 2 && siapDitinjauLagi(p.kotak, p.terakhirDicoba, hariIniMs) && !terpilih.has(s.id);
  });
  for (const s of kandidatReview) {
    if (terpilih.size >= targetTerlemah + targetReview) break;
    terpilih.set(s.id, s);
  }

  for (const m of materiBelumDicoba) {
    if (terpilih.size >= target) break;
    const soalMateriIni = soalList.filter((s) => (s.materi || 'Lainnya') === m.materi && !terpilih.has(s.id));
    for (const s of soalMateriIni) {
      if (terpilih.size >= target) break;
      terpilih.set(s.id, s);
    }
  }

  if (terpilih.size < target) {
    for (const s of soalList) {
      if (terpilih.size >= target) break;
      if (!terpilih.has(s.id)) terpilih.set(s.id, s);
    }
  }

  return Array.from(terpilih.values()).slice(0, target);
}

function pilihSoalManual(soalList, progressMap, materiDipilih, hariIniMs, target = 10) {
  const soalMateri = soalList.filter((s) => (s.materi || 'Lainnya') === materiDipilih);
  const belumDicoba = soalMateri.filter((s) => !progressMap[s.id]);
  const siapReview = soalMateri.filter((s) => {
    const p = progressMap[s.id];
    return p && siapDitinjauLagi(p.kotak, p.terakhirDicoba, hariIniMs);
  });

  const terpilih = new Map();
  // Prioritas: soal belum pernah dikerjakan dulu
  for (const s of belumDicoba) {
    if (terpilih.size >= target) break;
    terpilih.set(s.id, s);
  }
  // Selipkan review
  for (const s of siapReview) {
    if (terpilih.size >= target) break;
    if (!terpilih.has(s.id)) terpilih.set(s.id, s);
  }
  // Isi sisa dari soal apa pun di materi itu
  for (const s of soalMateri) {
    if (terpilih.size >= target) break;
    if (!terpilih.has(s.id)) terpilih.set(s.id, s);
  }
  return Array.from(terpilih.values()).slice(0, target);
}

function hitungStreakBaru(lastActiveDateStr, hariIniStr) {
  if (!lastActiveDateStr) return 1;
  if (lastActiveDateStr === hariIniStr) return null; // sudah latihan hari ini
  const kemarin = new Date(hariIniStr);
  kemarin.setDate(kemarin.getDate() - 1);
  const kemarinStr = kemarin.toISOString().slice(0, 10);
  return lastActiveDateStr === kemarinStr ? 'NAIK' : 1;
}

const XP_PER_BENAR = 10;
const XP_PER_SALAH = 2; // tetap dapat sedikit XP -- menghargai usaha, bukan cuma hasil (lihat diskusi SDT sebelumnya)

// 🔥 BARU (BUG KEAMANAN KONTEN DITEMUKAN): filter sebelumnya CUMA cek
// `tingkatKelas`, sama sekali TIDAK cek `jenjang` -- soal UTBK/SNBT atau
// SMA yang kelasnya sengaja dikosongkan (memang begitu desainnya untuk
// TKA lintas kelas, lihat diskusi sebelumnya) bisa LOLOS ke siswa SMP
// atau SD, karena syarat "kelas kosong = boleh lewat" tidak
// mempertimbangkan jenjang sama sekali. Ini serius -- siswa SMP bisa
// kena soal UTBK Kimia kelas 12 yang jauh di luar levelnya.
//
// PRINSIP PERBAIKAN: default HARUS AMAN (tolak) kalau jenjang tidak
// jelas cocok -- bukan longgar (terima) seperti kesalahan sebelumnya.
function cocokkanJenjang(jenjangSoal, jenjangSiswa) {
  if (!jenjangSoal) return false; // 🔒 soal tanpa jenjang ditolak, BUKAN diloloskan
  const soal = jenjangSoal.toLowerCase();
  const siswa = (jenjangSiswa || '').toLowerCase();
  if (siswa === 'smp') return soal.includes('smp');
  if (siswa === 'sd') return soal.includes('sd');
  // UTBK/SNBT sengaja DIIKUTKAN buat siswa SMA -- itu memang relevan
  // buat persiapan mereka (bukan celah, tapi kesesuaian yang disengaja).
  if (siswa === 'sma') return soal.includes('sma') || soal.includes('utbk') || soal.includes('snbt');
  return false; // jenjang siswa tidak dikenali -- tolak, jangan tebak
}

// 🔥 BARU (BUG NYATA DITEMUKAN): perbandingan kelas sebelumnya pakai
// `===` LANGSUNG antara `tingkatKelas` di Bank Soal (format angka
// polos, mis. "7") dengan `kelasSekolah` siswa (format gabungan, mis.
// "7 SMP") -- dua format ini TIDAK PERNAH sama persis, jadi SEMUA soal
// yang py tingkatKelas terisi otomatis gagal cocok ke SEMUA siswa,
// berapa pun kelasnya. Ini yang bikin "tidak ada soal sama sekali"
// muncul ke semua siswa kelas 7-9 padahal soalnya sudah ada. Sekarang
// dibandingkan angkanya SAJA (diekstrak dari kedua sisi), bukan
// string-nya utuh.
function ekstrakAngkaKelas(str) {
  const m = String(str || '').match(/\d+/);
  return m ? m[0] : '';
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================

export default function LatihanHarianPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';
  const studentKelas = localStorage.getItem('studentKelas') || '';
  // 🔥 BARU: jenjang TIDAK ada di localStorage -- harus diambil dari
  // dokumen siswa di Firestore (lihat useEffect di bawah).
  const [studentJenjang, setStudentJenjang] = useState(null); // null = belum siap, JANGAN mulai fetch soal dulu

  const [tahap, setTahap] = useState('memuat'); // memuat | pilih-mapel | pilih-mode | mengerjakan | selesai
  const [semuaSoal, setSemuaSoal] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [daftarMapel, setDaftarMapel] = useState([]); // 🔥 BARU: [{mapel, jumlahSoal}]
  const [mapelDipilih, setMapelDipilih] = useState(null);
  const [daftarMateri, setDaftarMateri] = useState([]);

  const [soalSesi, setSoalSesi] = useState([]);
  const [indexSekarang, setIndexSekarang] = useState(0);
  const [jawabanDipilih, setJawabanDipilih] = useState(null);
  const [sudahDicek, setSudahDicek] = useState(false);
  const [hasilSesi, setHasilSesi] = useState({ benar: 0, salah: 0 });

  const [xpDidapat, setXpDidapat] = useState(0);
  const [streakInfo, setStreakInfo] = useState(null);

  // ---------------- MUAT DATA AWAL ----------------
  useEffect(() => {
    if (!studentId) { setTahap('pilih-mapel'); return; }
    (async () => {
      try {
        // 🔥 BARU: ambil jenjang siswa DULU dari dokumen Firestore-nya
        // (bukan localStorage -- jenjang tidak pernah disimpan di situ).
        // WAJIB tahu jenjang siswa SEBELUM narik soal apa pun -- kalau
        // gagal/tidak ketemu, JANGAN lanjut narik semua soal tanpa
        // pagar (itu akar bug yang dilaporkan: soal SMA/UTBK bisa lolos
        // ke siswa SMP kalau jenjangnya tidak dicek).
        let jenjangSiswa = null;
        try {
          const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId), limit(1)));
          if (!snapSiswa.empty) jenjangSiswa = snapSiswa.docs[0].data().jenjang || null;
        } catch (e) {
          console.error('Gagal ambil jenjang siswa:', e);
        }
        setStudentJenjang(jenjangSiswa);

        if (!jenjangSiswa) {
          // 🔒 Jenjang tidak ketemu -- JANGAN tampilkan soal apa pun,
          // lebih aman kosong daripada salah kirim materi di luar level
          // siswa. Admin/wali kelas perlu melengkapi data jenjang siswa.
          console.error('Jenjang siswa tidak ditemukan -- Latihan Harian dikosongkan demi keamanan konten.');
          setSemuaSoal([]);
          setDaftarMapel([]);
          setTahap('pilih-mapel');
          return;
        }

        const constraints = [where('status', '==', 'aktif')];
        const snap = await getDocs(query(collection(db, 'bank_soal'), ...constraints));
        let soal = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // 🔥 PAGAR UTAMA: jenjang WAJIB cocok (default menolak kalau
        // tidak jelas -- lihat cocokkanJenjang()). Kelas baru dicek
        // SETELAH jenjang cocok, dan cuma sebagai penyaring tambahan
        // dalam jenjang yang SAMA (bukan pengganti jenjang).
        soal = soal.filter((s) => cocokkanJenjang(s.jenjang, jenjangSiswa));
        if (studentKelas) {
          const angkaKelasSiswa = ekstrakAngkaKelas(studentKelas);
          soal = soal.filter((s) => !s.tingkatKelas || ekstrakAngkaKelas(s.tingkatKelas) === angkaKelasSiswa);
        }
        // Hanya dukung pg_sederhana dulu di v1 -- tipe lain (kompleks,
        // kategori, isian) menyusul setelah UI jawabnya dibuat.
        soal = soal.filter((s) => (s.tipe || 'pg_sederhana') === 'pg_sederhana' && (s.opsiJawaban || []).length >= 2);
        setSemuaSoal(soal);

        const progSnap = await getDocs(query(collection(db, 'siswa_soal_progress'), where('studentId', '==', studentId)));
        const pMap = {};
        progSnap.forEach((d) => { pMap[d.data().soalId] = d.data(); });
        setProgressMap(pMap);

        // 🔥 BARU: kelompokkan per MAPEL dulu (jenjang+kelas mungkin
        // cocok buat banyak mapel sekaligus -- Matematika, Bahasa
        // Indonesia, dst -- jangan dicampur jadi 1 daftar materi datar).
        const perMapel = {};
        soal.forEach((s) => {
          const mapel = s.mataPelajaran || 'Lainnya';
          perMapel[mapel] = (perMapel[mapel] || 0) + 1;
        });
        setDaftarMapel(Object.entries(perMapel).map(([mapel, jumlahSoal]) => ({ mapel, jumlahSoal })).sort((a, b) => a.mapel.localeCompare(b.mapel)));

        setTahap('pilih-mapel');
      } catch (e) {
        console.error('Gagal memuat data latihan harian:', e);
        setTahap('pilih-mapel');
      }
    })();
  }, [studentId, studentKelas]);

  // 🔥 BARU: begitu mapel dipilih, hitung daftar materi/bab HANYA dari
  // mapel itu (bukan campuran semua mapel seperti sebelumnya).
  const pilihMapel = useCallback((mapel) => {
    setMapelDipilih(mapel);
    const soalMapelIni = semuaSoal.filter((s) => (s.mataPelajaran || 'Lainnya') === mapel);
    setDaftarMateri(hitungPenguasaanPerMateri(soalMapelIni, progressMap).sort((a, b) => (a.persentase ?? -1) - (b.persentase ?? -1)));
    setTahap('pilih-mode');
  }, [semuaSoal, progressMap]);

  // ---------------- MULAI SESI ----------------
  // 🔥 BARU: sesi SELALU dibatasi ke mapel yang sedang dipilih -- tidak
  // ada lagi campuran lintas mapel dalam 1 sesi latihan (1 sesi = 1
  // mapel, biar fokus & masuk akal secara pedagogis).
  const soalMapelDipilih = mapelDipilih ? semuaSoal.filter((s) => (s.mataPelajaran || 'Lainnya') === mapelDipilih) : [];

  const mulaiSesiRekomendasi = useCallback(() => {
    const terpilih = pilihSoalRekomendasi(soalMapelDipilih, progressMap, Date.now(), 10);
    if (terpilih.length === 0) return alert('Belum ada soal yang cocok untuk mapel/kelasmu. Coba lagi nanti.');
    setSoalSesi(terpilih);
    setIndexSekarang(0);
    setJawabanDipilih(null);
    setSudahDicek(false);
    setHasilSesi({ benar: 0, salah: 0 });
    setTahap('mengerjakan');
  }, [soalMapelDipilih, progressMap]);

  const mulaiSesiManual = useCallback((materi) => {
    const terpilih = pilihSoalManual(soalMapelDipilih, progressMap, materi, Date.now(), 10);
    if (terpilih.length === 0) return alert('Belum ada soal di materi ini.');
    setSoalSesi(terpilih);
    setIndexSekarang(0);
    setJawabanDipilih(null);
    setSudahDicek(false);
    setHasilSesi({ benar: 0, salah: 0 });
    setTahap('mengerjakan');
  }, [soalMapelDipilih, progressMap]);

  // ---------------- JAWAB SOAL ----------------
  const soalAktif = soalSesi[indexSekarang];

  const hurufKeIndex = (h) => (h ? h.toString().trim().toUpperCase().charCodeAt(0) - 65 : -1);

  const cekJawaban = useCallback(async () => {
    if (jawabanDipilih === null || !soalAktif) return;
    const indexBenar = hurufKeIndex(soalAktif.kunciJawaban);
    const benar = jawabanDipilih === indexBenar;
    setSudahDicek(true);
    setHasilSesi((prev) => ({ benar: prev.benar + (benar ? 1 : 0), salah: prev.salah + (benar ? 0 : 1) }));

    // 🔥 Update Leitner Box untuk soal ini -- disimpan langsung ke
    // Firestore per-soal (bukan ditunda sampai akhir sesi), supaya kalau
    // siswa menutup app di tengah jalan, progres yang sudah dikerjakan
    // TETAP TERSIMPAN, tidak hilang percuma.
    if (studentId) {
      const progKey = `${studentId}_${soalAktif.id}`;
      const existing = progressMap[soalAktif.id];
      const kotakBaru = kotakBerikutnya(existing?.kotak, benar);
      const hariIniStr = new Date().toISOString().slice(0, 10);
      const dataBaru = {
        studentId,
        soalId: soalAktif.id,
        kotak: kotakBaru,
        terakhirDicoba: hariIniStr,
        benarBerturut: benar ? (existing?.benarBerturut || 0) + 1 : 0,
        benarCount: (existing?.benarCount || 0) + (benar ? 1 : 0),
        salahCount: (existing?.salahCount || 0) + (benar ? 0 : 1),
        updatedAt: serverTimestamp(),
      };
      setDoc(doc(db, 'siswa_soal_progress', progKey), dataBaru).catch((e) => console.error('Gagal simpan progres soal:', e));
      setProgressMap((prev) => ({ ...prev, [soalAktif.id]: dataBaru }));
    }
  }, [jawabanDipilih, soalAktif, studentId, progressMap]);

  const lanjutSoal = useCallback(() => {
    if (indexSekarang + 1 < soalSesi.length) {
      setIndexSekarang((i) => i + 1);
      setJawabanDipilih(null);
      setSudahDicek(false);
    } else {
      selesaikanSesi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexSekarang, soalSesi.length]);

  // ---------------- SELESAI SESI: XP + STREAK ----------------
  const selesaikanSesi = useCallback(async () => {
    const xp = hasilSesi.benar * XP_PER_BENAR + hasilSesi.salah * XP_PER_SALAH;
    setXpDidapat(xp);

    if (studentId) {
      try {
        const hariIniStr = new Date().toISOString().slice(0, 10);
        const progRef = doc(db, 'siswa_progress', studentId);
        const snap = await getDoc(progRef);
        const existing = snap.exists() ? snap.data() : { xp: 0, streak: 0, lastActiveDate: null };

        const hasilStreak = hitungStreakBaru(existing.lastActiveDate, hariIniStr);
        let streakBaru = existing.streak || 0;
        if (hasilStreak === 'NAIK') streakBaru += 1;
        else if (hasilStreak === 1) streakBaru = 1;
        // hasilStreak === null -> sudah latihan hari ini, streak tidak berubah

        await setDoc(progRef, {
          xp: (existing.xp || 0) + xp,
          streak: streakBaru,
          lastActiveDate: hariIniStr,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setStreakInfo({ streakBaru, naik: hasilStreak === 'NAIK' || hasilStreak === 1 });
      } catch (e) {
        console.error('Gagal update XP/streak:', e);
      }
    }
    setTahap('selesai');
  }, [hasilSesi, studentId]);

  // ============================================================
  // RENDER
  // ============================================================

  if (tahap === 'memuat') {
    return <div style={st.pusat}>Memuat soal...</div>;
  }

  if (tahap === 'pilih-mapel') {
    return (
      <div style={st.page}>
        <div style={st.headerBar}>
          <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtn}><ArrowLeft size={20} /></button>
          <span style={st.headerTitle}>Latihan Harian</span>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>Mau latihan mapel apa hari ini?</div>
          {daftarMapel.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30, fontSize: 13 }}>
              {studentJenjang
                ? 'Belum ada soal tersedia untuk jenjang/kelasmu.'
                : '⚠️ Data jenjang di profilmu belum lengkap. Hubungi admin untuk melengkapi data supaya Latihan Harian bisa menampilkan soal yang sesuai levelmu.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daftarMapel.map((m) => (
                <button key={m.mapel} onClick={() => pilihMapel(m.mapel)} style={st.kartuMateri}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BookOpen size={18} color="#4f46e5" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.mapel}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{m.jumlahSoal} soal</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tahap === 'pilih-mode') {
    return (
      <div style={st.page}>
        <div style={st.headerBar}>
          <button onClick={() => setTahap('pilih-mapel')} style={st.backBtn}><ArrowLeft size={20} /></button>
          <span style={st.headerTitle}>{mapelDipilih}</span>
        </div>

        <div style={{ padding: 18 }}>
          <button onClick={mulaiSesiRekomendasi} style={st.kartuRekomendasi}>
            <Sparkles size={22} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Rekomendasi Otomatis</div>
              <div style={{ fontSize: 11.5, opacity: 0.9 }}>10 soal {mapelDipilih} disesuaikan kelemahanmu</div>
            </div>
          </button>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '20px 0 10px' }}>Atau pilih bab sendiri:</div>
          {daftarMateri.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30, fontSize: 13 }}>Belum ada soal di mapel ini.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daftarMateri.map((m) => (
                <button key={m.materi} onClick={() => mulaiSesiManual(m.materi)} style={st.kartuMateri}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BookOpen size={18} color="#4f46e5" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.materi}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: m.persentase === null ? '#94a3b8' : m.persentase < 60 ? '#dc2626' : '#16a34a' }}>
                    {m.persentase === null ? 'Belum dicoba' : `${m.persentase}%`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tahap === 'mengerjakan' && soalAktif) {
    const indexBenar = hurufKeIndex(soalAktif.kunciJawaban);
    return (
      <div style={st.page}>
        <div style={st.headerBar}>
          <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtn}><ArrowLeft size={20} /></button>
          <span style={st.headerTitle}>Soal {indexSekarang + 1} / {soalSesi.length}</span>
        </div>
        <div style={st.progressBarBg}>
          <div style={{ ...st.progressBarFill, width: `${((indexSekarang) / soalSesi.length) * 100}%` }} />
        </div>

        <div style={{ padding: 18 }}>
          <div style={st.kartuSoal}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{soalAktif.materi}</div>
            <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6, marginBottom: 16 }}>{renderMath(soalAktif.soal || soalAktif.teks_soal)}</div>

            {(soalAktif.opsiJawaban || []).map((opsi, i) => {
              const teksOpsi = typeof opsi === 'string' ? opsi : (opsi?.teks || '');
              const dipilih = jawabanDipilih === i;
              let warna = '#e2e8f0';
              if (sudahDicek) {
                if (i === indexBenar) warna = '#16a34a';
                else if (dipilih) warna = '#dc2626';
              } else if (dipilih) warna = '#4f46e5';

              return (
                <button
                  key={i}
                  disabled={sudahDicek}
                  onClick={() => setJawabanDipilih(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                    padding: '12px 14px', borderRadius: 12, border: `2px solid ${warna}`, marginBottom: 8,
                    background: sudahDicek && i === indexBenar ? '#f0fdf4' : sudahDicek && dipilih ? '#fef2f2' : dipilih ? '#eef2ff' : 'white',
                    cursor: sudahDicek ? 'default' : 'pointer', fontSize: 13, color: '#1e293b',
                  }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${warna}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {renderMath(teksOpsi)}
                  {sudahDicek && i === indexBenar && <CheckCircle2 size={16} color="#16a34a" style={{ marginLeft: 'auto' }} />}
                  {sudahDicek && dipilih && i !== indexBenar && <XCircle size={16} color="#dc2626" style={{ marginLeft: 'auto' }} />}
                </button>
              );
            })}

            {sudahDicek && soalAktif.pembahasan && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#eff6ff', fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.6 }}>
                <b>💡 Pembahasan:</b> {renderMath(soalAktif.pembahasan)}
              </div>
            )}
          </div>

          {!sudahDicek ? (
            <button onClick={cekJawaban} disabled={jawabanDipilih === null} style={{ ...st.tombolUtama, opacity: jawabanDipilih === null ? 0.5 : 1 }}>
              Cek Jawaban
            </button>
          ) : (
            <button onClick={lanjutSoal} style={st.tombolUtama}>
              {indexSekarang + 1 < soalSesi.length ? 'Lanjut Soal Berikutnya' : 'Lihat Hasil'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (tahap === 'selesai') {
    return (
      <div style={st.page}>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Sesi Selesai!</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
            {hasilSesi.benar} benar, {hasilSesi.salah} salah dari {soalSesi.length} soal
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <div style={st.statBesar}>
              <Sparkles size={20} color="#673ab7" />
              <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>+{xpDidapat}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>XP</div>
            </div>
            {streakInfo && (
              <div style={st.statBesar}>
                <Flame size={20} color="#f97316" />
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>{streakInfo.streakBaru}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Hari Streak</div>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/siswa/dashboard')} style={st.tombolUtama}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  return null;
}

const st = {
  page: { minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' },
  pusat: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'sans-serif' },
  headerBar: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'white', borderBottom: '1px solid #e2e8f0' },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerTitle: { fontSize: 15, fontWeight: 800, color: '#1e293b' },
  progressBarBg: { height: 5, background: '#e2e8f0' },
  progressBarFill: { height: '100%', background: '#4f46e5', transition: 'width 0.3s ease' },
  kartuRekomendasi: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', background: 'linear-gradient(135deg, #4f46e5, #673ab7)', color: 'white', border: 'none', borderRadius: 16, padding: 18, cursor: 'pointer' },
  kartuMateri: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' },
  kartuSoal: { background: 'white', borderRadius: 16, padding: 18, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
  tombolUtama: { width: '100%', padding: '14px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  statBesar: { background: 'white', borderRadius: 14, padding: '14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
};