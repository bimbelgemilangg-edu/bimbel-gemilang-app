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
import { ArrowLeft, CheckCircle2, XCircle, Flame } from 'lucide-react';
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

// 🔥 BARU (inspirasi UI check-in mingguan): tampilkan 7 hari terakhir
// (Sen-Min, berakhir hari ini) sebagai strip kecil "hari mana aja yang
// sudah latihan". CATATAN JUJUR soal keterbatasannya: sistem cuma
// menyimpan 1 ANGKA streak + tanggal terakhir aktif (bukan histori
// per-hari lengkap), jadi "sudah latihan" di sini adalah HASIL TEBAKAN
// mundur dari tanggal terakhir aktif sepanjang nilai streak -- bukan
// data historis asli per hari. Kalau nanti mau akurat 100%, perlu
// koleksi log harian terpisah (lihat "PENDING" di instruksi project).
function buatStrikMingguan(streak, lastActiveDateStr, hariIniStr) {
  const hariIni = new Date(hariIniStr);
  const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const hasilnya = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hariIni);
    d.setDate(d.getDate() - i);
    let done = false;
    if (lastActiveDateStr && streak > 0) {
      const lastMs = new Date(lastActiveDateStr).getTime();
      const iniMs = new Date(hariIniStr).getTime();
      const selisihLastKeIni = Math.round((iniMs - lastMs) / (1000 * 60 * 60 * 24));
      const offsetDariLast = i - selisihLastKeIni;
      done = offsetDariLast >= 0 && offsetDariLast < streak;
    }
    hasilnya.push({ label: namaHari[d.getDay()], done, isToday: i === 0 });
  }
  return hasilnya;
}

const XP_PER_BENAR = 10;
const XP_PER_SALAH = 2; // tetap dapat sedikit XP -- menghargai usaha, bukan cuma hasil (lihat diskusi SDT sebelumnya)

// 🔥 BARU: JATAH HARIAN -- tanpa ini, siswa bisa gasak SEMUA soal 1
// materi (bahkan 1 buku) dalam sekali duduk, karena sesi bisa diulang
// terus tanpa batas. Ini masalah nyata: (1) produksi soal itu proses
// pelan & kadang error, jadi bank soal harus dijaga tidak "habis"
// cuma dalam sehari; (2) secara pedagogis, latihan tersebar tiap hari
// (spaced practice) jauh lebih efektif daripada belajar maraton sekali
// lalu berhenti; (3) ini juga yang membangun "tanggung jawab harian"
// yang jadi salah satu tujuan gamifikasi ini dari awal -- ada jatah,
// ada batas, besok lagi, bukan sekali habis semua.
const JATAH_SOAL_PER_HARI = 20; // setara 2 sesi penuh (10 soal/sesi)

function hitungSisaJatah(progress, hariIniStr, batasHarian) {
  // Kalau belum pernah ada progres, ATAU progres terakhir itu bukan
  // HARI INI (hari sudah berganti) -- jatah kembali penuh. Kalau
  // progres itu memang dari hari ini, sisa jatah = batas dikurangi
  // yang sudah dipakai (tidak pernah minus).
  if (!progress || progress.soalHariIniTanggal !== hariIniStr) return batasHarian;
  return Math.max(0, batasHarian - (progress.soalHariIniCount || 0));
}

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
  // 🔥 BARU: sisa jatah soal hari ini. null = belum dihitung (masih
  // memuat), angka >= 0 setelahnya. Dicek SEBELUM tahap pilih-mapel
  // ditampilkan -- kalau 0, tampilkan layar "jatah habis" alih-alih
  // daftar mapel.
  const [sisaJatah, setSisaJatah] = useState(null);
  // 🔥 BARU: streak & tanggal terakhir aktif -- dipakai buat strip
  // "hari mana aja sudah latihan" di layar pilih mapel. Diisi dari data
  // yang SUDAH di-fetch buat hitung jatah harian (siswa_progress),
  // BUKAN query baru -- jadi tidak menambah baca Firestore sama sekali.
  const [streakSaatIni, setStreakSaatIni] = useState(0);
  const [lastActiveDateSaatIni, setLastActiveDateSaatIni] = useState(null);

  const [tahap, setTahap] = useState('memuat'); // memuat | pilih-mapel | pilih-mode | mengerjakan | selesai | jatah-habis
  const [semuaSoal, setSemuaSoal] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [daftarMapel, setDaftarMapel] = useState([]); // 🔥 BARU: [{mapel, jumlahSoal}]
  const [mapelDipilih, setMapelDipilih] = useState(null);
  const [daftarMateri, setDaftarMateri] = useState([]);

  const [soalSesi, setSoalSesi] = useState([]);
  const [indexSekarang, setIndexSekarang] = useState(0);
  const [jawabanDipilih, setJawabanDipilih] = useState(null);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [hasilSesi, setHasilSesi] = useState({ benar: 0, salah: 0 });

  // 🔥 BARU (rombak alur "kerjakan dulu, baru dikoreksi semua di
  // akhir"): setiap soal yang sudah dijawab ditampung di sini
  // (bukan langsung ditampilkan benar/salahnya) -- dipakai NANTI di
  // tahap 'mengoreksi' & 'selesai' buat animasi XP dan daftar tinjau
  // jawaban + pembahasan. `koreksiIndex` & `xpAnimasi` cuma dipakai
  // buat ANIMASI VISUAL (angka XP berjalan naik) -- total XP asli yang
  // benar-benar disimpan ke Firestore tetap dihitung dari `hasilSesi`
  // di selesaikanSesi(), SAMA seperti sebelumnya, supaya tidak ada
  // 2 sumber kebenaran yang bisa beda angka.
  const [hasilPerSoal, setHasilPerSoal] = useState([]); // [{soal, jawabanIndex, indexBenar, benar}]
  const [koreksiIndex, setKoreksiIndex] = useState(0);
  const [xpAnimasi, setXpAnimasi] = useState(0);

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

        // 🔥 BARU: cek jatah harian SEBELUM narik semua soal -- kalau
        // jatah sudah habis, gak perlu tarik data Bank Soal sama sekali
        // (hemat baca Firestore), langsung tampilkan layar "sampai besok".
        const hariIniStr = new Date().toISOString().slice(0, 10);
        let progresSiswa = null;
        try {
          const snapProgres = await getDoc(doc(db, 'siswa_progress', studentId));
          if (snapProgres.exists()) progresSiswa = snapProgres.data();
        } catch (e) {
          console.error('Gagal ambil progres harian:', e);
        }
        const jatahTersisa = hitungSisaJatah(progresSiswa, hariIniStr, JATAH_SOAL_PER_HARI);
        setSisaJatah(jatahTersisa);
        setStreakSaatIni(progresSiswa?.streak || 0);
        setLastActiveDateSaatIni(progresSiswa?.lastActiveDate || null);

        if (jatahTersisa <= 0) {
          setTahap('jatah-habis');
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
          soal = soal.filter((s) => {
            // 🔥 BARU: soal TKA/SNBT/UTBK dianggap LINTAS KELAS dalam 1
            // jenjang -- gak peduli kelas berapa yang kebetulan ke-tag
            // pas import (mis. materi kelas 7 dipakai buat latihan TKA
            // kelas 9). Ini penting karena TKA/UTBK memang soal
            // kompetensi kumulatif seluruh jenjang, bukan kurikulum 1
            // kelas spesifik -- kalau dipaksa cocok kelas persis, kelas
            // 9 (yang justru paling butuh latihan TKA) malah gak
            // kebagian soal yang materinya "ketagnya" kelas 7/8.
            if (s.jenisUjian && ['tka', 'snbt', 'utbk'].includes(s.jenisUjian.toLowerCase())) return true;
            // Soal REGULER (bukan TKA) tetap ketat per kelas -- gak mau
            // siswa kelas 7 kebagian materi Aljabar kelas 9 yang belum
            // dipelajari, atau sebaliknya.
            return !s.tingkatKelas || ekstrakAngkaKelas(s.tingkatKelas) === angkaKelasSiswa;
          });
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
    // 🔥 BARU: target sesi dipotong sesuai sisa jatah harian -- kalau
    // sisa jatah cuma 5, sesi ini cuma 5 soal (bukan tetap maksa 10),
    // biar pas habis sesi ini jatah beneran habis, bukan lewat batas.
    const targetSesi = Math.max(1, Math.min(10, sisaJatah ?? 10));
    const terpilih = pilihSoalRekomendasi(soalMapelDipilih, progressMap, Date.now(), targetSesi);
    if (terpilih.length === 0) return alert('Belum ada soal yang cocok untuk mapel/kelasmu. Coba lagi nanti.');
    setSoalSesi(terpilih);
    setIndexSekarang(0);
    setJawabanDipilih(null);
    setSedangMenyimpan(false);
    setHasilSesi({ benar: 0, salah: 0 });
    setHasilPerSoal([]);
    setKoreksiIndex(0);
    setXpAnimasi(0);
    setTahap('mengerjakan');
  }, [soalMapelDipilih, progressMap, sisaJatah]);

  const mulaiSesiManual = useCallback((materi) => {
    const targetSesi = Math.max(1, Math.min(10, sisaJatah ?? 10));
    const terpilih = pilihSoalManual(soalMapelDipilih, progressMap, materi, Date.now(), targetSesi);
    if (terpilih.length === 0) return alert('Belum ada soal di materi ini.');
    setSoalSesi(terpilih);
    setIndexSekarang(0);
    setJawabanDipilih(null);
    setSedangMenyimpan(false);
    setHasilSesi({ benar: 0, salah: 0 });
    setHasilPerSoal([]);
    setKoreksiIndex(0);
    setXpAnimasi(0);
    setTahap('mengerjakan');
  }, [soalMapelDipilih, progressMap, sisaJatah]);

  // ---------------- JAWAB SOAL ----------------
  const soalAktif = soalSesi[indexSekarang];

  const hurufKeIndex = (h) => (h ? h.toString().trim().toUpperCase().charCodeAt(0) - 65 : -1);

  // 🔥 ROMBAK ALUR: dulu 2 langkah ("Cek Jawaban" -> lihat benar/salah -> "Lanjut").
  // Sekarang 1 langkah -- begitu klik lanjut, jawaban LANGSUNG disimpan
  // (sama seperti sebelumnya, per-soal, biar aman kalau app ditutup di
  // tengah jalan), tapi benar/salahnya TIDAK ditampilkan ke siswa sama
  // sekali di sini -- cuma ditampung ke `hasilPerSoal`. Siswa baru lihat
  // hasilnya nanti di tahap 'mengoreksi' & 'selesai', setelah SEMUA soal
  // di sesi ini selesai dijawab.
  const jawabDanLanjut = useCallback(() => {
    if (jawabanDipilih === null || !soalAktif || sedangMenyimpan) return;
    setSedangMenyimpan(true);

    const indexBenar = hurufKeIndex(soalAktif.kunciJawaban);
    const benar = jawabanDipilih === indexBenar;

    setHasilSesi((prev) => ({ benar: prev.benar + (benar ? 1 : 0), salah: prev.salah + (benar ? 0 : 1) }));
    setHasilPerSoal((prev) => [...prev, { soal: soalAktif, jawabanIndex: jawabanDipilih, indexBenar, benar }]);

    // Update Leitner Box -- LOGIKA & WAKTU PENYIMPANAN SAMA PERSIS seperti
    // sebelumnya (langsung per-soal, fire-and-forget), TIDAK ditunda
    // sampai akhir sesi. Ini sengaja dipertahankan supaya progres tidak
    // hilang kalau siswa menutup app di tengah sesi -- yang berubah cuma
    // KAPAN hasilnya DITAMPILKAN ke siswa, bukan kapan datanya disimpan.
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

    setJawabanDipilih(null);
    setSedangMenyimpan(false);

    if (indexSekarang + 1 < soalSesi.length) {
      setIndexSekarang((i) => i + 1);
    } else {
      // Semua soal di sesi ini sudah dijawab -- masuk ke animasi
      // "mengirim" dulu, baru "mengoreksi" (lihat useEffect di bawah).
      setTahap('mengirim');
    }
  }, [jawabanDipilih, soalAktif, studentId, progressMap, indexSekarang, soalSesi.length, sedangMenyimpan]);

  // ---------------- ANIMASI "MENGIRIM" -> "MENGOREKSI" ----------------
  // Layar "mengirim" cuma jeda sebentar (kesan dikirim ke server),
  // lalu otomatis pindah ke "mengoreksi" yang animasinya dijalankan
  // oleh useEffect kedua di bawah.
  useEffect(() => {
    if (tahap !== 'mengirim') return;
    const timer = setTimeout(() => setTahap('mengoreksi'), 1300);
    return () => clearTimeout(timer);
  }, [tahap]);

  // Animasi "mengoreksi": ungkap hasil SATU SOAL PER LANGKAH, XP
  // berjalan naik dikit-dikit (dramatis, kayak lagi dikoreksi beneran)
  // -- begitu semua soal sudah "diperiksa" di animasi ini, baru panggil
  // selesaikanSesi() (hitung XP/streak/jatah FINAL & simpan ke
  // Firestore, PERSIS seperti sebelumnya).
  useEffect(() => {
    if (tahap !== 'mengoreksi') return;
    if (hasilPerSoal.length === 0) { selesaikanSesi(); return; }
    if (koreksiIndex >= hasilPerSoal.length) { selesaikanSesi(); return; }

    const timer = setTimeout(() => {
      const item = hasilPerSoal[koreksiIndex];
      const tambahanXp = item.benar ? XP_PER_BENAR : XP_PER_SALAH;
      setXpAnimasi((x) => x + tambahanXp);
      setKoreksiIndex((i) => i + 1);
    }, 550);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tahap, koreksiIndex, hasilPerSoal]);

  // ---------------- SELESAI SESI: XP + STREAK + JATAH HARIAN ----------------
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

        // 🔥 BARU: catat pemakaian jatah harian. Kalau catatan terakhir
        // BUKAN hari ini (hari baru), hitungan dimulai dari 0 lagi --
        // BUKAN ditambah ke sisa catatan kemarin.
        const soalHariIniSebelumnya = existing.soalHariIniTanggal === hariIniStr ? (existing.soalHariIniCount || 0) : 0;
        const soalHariIniBaru = soalHariIniSebelumnya + soalSesi.length;

        await setDoc(progRef, {
          xp: (existing.xp || 0) + xp,
          streak: streakBaru,
          lastActiveDate: hariIniStr,
          soalHariIniCount: soalHariIniBaru,
          soalHariIniTanggal: hariIniStr,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setStreakInfo({ streakBaru, naik: hasilStreak === 'NAIK' || hasilStreak === 1 });
        // Perbarui sisa jatah di layar (dipakai buat pesan di layar Selesai).
        setSisaJatah(Math.max(0, JATAH_SOAL_PER_HARI - soalHariIniBaru));
      } catch (e) {
        console.error('Gagal update XP/streak/jatah:', e);
      }
    }
    setTahap('selesai');
  }, [hasilSesi, studentId, soalSesi.length]);

  // ============================================================
  // RENDER
  // ============================================================
  // 🔥 DESAIN v1: tema "Misi Harian" -- dijahit ke identitas Gemilang
  // sendiri (maskot astronot), bukan contekan template generik. Header
  // gelap starfield dipakai konsisten di semua layar.
  // 🔥 ROMBAK v2 (permintaan: "kerjakan dulu semua, baru dikoreksi"):
  // alur pengerjaan diubah dari "cek per soal instan" jadi "kumpulkan
  // semua dulu -> animasi mengirim -> animasi dikoreksi (XP jalan naik)
  // -> hasil akhir + tinjau jawaban". Logika inti (Leitner Box, XP,
  // streak, jatah harian, filter jenjang/kelas) TIDAK diubah sama
  // sekali -- murni alur & tampilan.

  if (tahap === 'memuat') {
    return (
      <div style={st.pusat}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🧑‍🚀</div>
        <div>Menyiapkan misi harianmu...</div>
      </div>
    );
  }

  if (tahap === 'pilih-mapel') {
    const hariIniStr = new Date().toISOString().slice(0, 10);
    const strikMingguan = buatStrikMingguan(streakSaatIni, lastActiveDateSaatIni, hariIniStr);
    return (
      <div style={st.page}>
        <div style={st.hero}>
          <div style={st.heroStars} />
          <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtnDark}><ArrowLeft size={20} /></button>
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <div style={{ fontSize: 40 }}>🧑‍🚀</div>
            <h1 style={st.heroTitle}>Misi Harian</h1>
            <p style={st.heroSub}>Mau menjelajah planet mapel yang mana?</p>
          </div>

          {/* 🔥 BARU: strip streak mingguan, terinspirasi dari referensi
              kalender check-in -- 7 titik hari (Sen-Min), hari yang
              sudah latihan ditandai flame oranye menyala. */}
          {streakSaatIni > 0 && (
            <div style={{ position: 'relative', zIndex: 1, marginTop: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                <Flame size={16} color="#FB923C" />
                <span style={{ color: 'white', fontWeight: 800, fontSize: 13 }}>{streakSaatIni} Hari Beruntun</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {strikMingguan.map((h, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{h.label}</span>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, background: h.done ? 'linear-gradient(135deg, #FB923C, #FBBF24)' : 'rgba(255,255,255,0.12)',
                      border: h.isToday ? '2px solid white' : '2px solid transparent',
                    }}>
                      {h.done ? '🔥' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '20px 18px' }}>
          {daftarMapel.length === 0 ? (
            <div style={st.kosongBox}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛰️</div>
              {studentJenjang
                ? 'Belum ada soal tersedia untuk jenjang/kelasmu. Coba lagi nanti, ya.'
                : '⚠️ Data jenjang di profilmu belum lengkap. Hubungi admin untuk melengkapi data supaya Latihan Harian bisa menampilkan soal yang sesuai levelmu.'}
            </div>
          ) : (
            <div style={st.gridMapel}>
              {daftarMapel.map((m) => {
                const ikon = getIkonMapel(m.mapel);
                return (
                  <button key={m.mapel} onClick={() => pilihMapel(m.mapel)} style={{ ...st.kartuPlanet, borderColor: ikon.warna }}>
                    <div style={{ ...st.lingkaranIkon, background: `${ikon.warna}1a`, color: ikon.warna }}>{ikon.emoji}</div>
                    <span style={st.namaPlanet}>{m.mapel}</span>
                    <span style={st.jumlahSoalPlanet}>{m.jumlahSoal} soal</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tahap === 'pilih-mode') {
    const ikonMapel = getIkonMapel(mapelDipilih);
    return (
      <div style={st.page}>
        <div style={{ ...st.hero, paddingBottom: 24 }}>
          <div style={st.heroStars} />
          <button onClick={() => setTahap('pilih-mapel')} style={st.backBtnDark}><ArrowLeft size={20} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 26 }}>{ikonMapel.emoji}</span>
            <h1 style={{ ...st.heroTitle, fontSize: 20, textAlign: 'left' }}>{mapelDipilih}</h1>
          </div>
        </div>

        <div style={{ padding: '18px', marginTop: -14 }}>
          <button onClick={mulaiSesiRekomendasi} style={st.kartuRekomendasi}>
            <span style={{ fontSize: 30 }}>🚀</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Luncurkan Rekomendasi</div>
              <div style={{ fontSize: 11.5, opacity: 0.9 }}>10 soal disesuaikan titik lemahmu</div>
            </div>
            <ChevronRightIcon />
          </button>

          <div style={st.subJudulSeksi}>Atau pilih bab sendiri</div>
          {daftarMateri.length === 0 ? (
            <div style={st.kosongBox}>Belum ada soal di mapel ini.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daftarMateri.map((m) => {
                const belumDicoba = m.persentase === null;
                const lemah = !belumDicoba && m.persentase < 60;
                const warnaBar = belumDicoba ? '#cbd5e1' : lemah ? '#f97316' : '#22c55e';
                return (
                  <button key={m.materi} onClick={() => mulaiSesiManual(m.materi)} style={st.kartuBab}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={st.namaBab}>{m.materi}</div>
                      <div style={st.trackMini}>
                        <div style={{ ...st.fillMini, width: belumDicoba ? '0%' : `${m.persentase}%`, background: warnaBar }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: warnaBar, minWidth: 70, textAlign: 'right' }}>
                      {belumDicoba ? 'Baru' : `${m.persentase}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tahap === 'mengerjakan' && soalAktif) {
    const progresPersen = (indexSekarang / soalSesi.length) * 100;
    const ikonMapel = getIkonMapel(mapelDipilih);
    return (
      <div style={st.page}>
        <div style={{ ...st.hero, paddingBottom: 20 }}>
          <div style={st.heroStars} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtnDark}><ArrowLeft size={20} /></button>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>Soal {indexSekarang + 1} dari {soalSesi.length}</span>
          </div>
          <div style={st.jalurRoket}>
            <div style={{ ...st.jalurRoketFill, width: `${progresPersen}%` }} />
            <span style={{ ...st.rocketMarker, left: `calc(${progresPersen}% - 10px)` }}>🚀</span>
          </div>
        </div>

        <div style={{ padding: 18, marginTop: -6 }}>
          <div style={{ ...st.kartuSoal, borderTop: `4px solid ${ikonMapel.warna}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span>{ikonMapel.emoji}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{soalAktif.materi}</span>
            </div>

            {/* 🔥 BARU (BUG SERIUS DITEMUKAN): field `bacaan` sebelumnya
                TIDAK PERNAH dirender di halaman ini sama sekali --
                padahal sistem penyimpanan bacaan/stimulus sudah dibangun
                matang di sisi Import. Akibatnya soal yang menunjuk "teks
                tersebut" (mis. soal pemahaman bacaan) tampil TANPA
                bacaannya sama sekali -- literally tidak bisa dijawab.
                Sekarang bacaan ditampilkan dulu, dalam kotak terpisah,
                SEBELUM pertanyaannya -- persis urutan yang wajar
                dibaca siswa. */}
            {soalAktif.bacaan?.teks && (
              <div style={st.boxBacaan}>
                <div style={st.labelBacaan}>📖 Bacaan</div>
                <div style={{ lineHeight: 1.7 }}>{renderMath(soalAktif.bacaan.teks)}</div>
                {(soalAktif.bacaan.gambar || []).map((g, i) => (
                  <img key={i} src={g.uploadedUrl || g.dataUrl || g.url} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 10 }} />
                ))}
              </div>
            )}

            <div style={{ fontSize: 14.5, color: '#1e293b', lineHeight: 1.6, marginBottom: 18 }}>{renderMath(soalAktif.soal || soalAktif.teks_soal)}</div>

            {/* 🔥 ROMBAK: dulu begitu klik "Cek Jawaban", opsi langsung
                berubah hijau/merah + muncul pembahasan di sini juga.
                SEKARANG SENGAJA TIDAK ADA reveal benar/salah sama sekali
                di layar ini -- opsi cuma berubah warna waktu DIPILIH
                (ungu), bukan waktu DIPERIKSA. Hasil & pembahasan baru
                muncul nanti di tahap 'mengoreksi' & 'selesai', setelah
                SEMUA soal di sesi ini selesai dijawab. */}
            {(soalAktif.opsiJawaban || []).map((opsi, i) => {
              const teksOpsi = typeof opsi === 'string' ? opsi : (opsi?.teks || '');
              const dipilih = jawabanDipilih === i;
              const warna = dipilih ? '#7c3aed' : '#e2e8f0';

              return (
                <button
                  key={i}
                  disabled={sedangMenyimpan}
                  onClick={() => setJawabanDipilih(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                    padding: '13px 14px', borderRadius: 14, border: `2px solid ${warna}`, marginBottom: 9,
                    background: dipilih ? '#f5f3ff' : 'white',
                    cursor: sedangMenyimpan ? 'default' : 'pointer', fontSize: 13.5, color: '#1e293b',
                    transform: dipilih ? 'scale(1.01)' : 'scale(1)', transition: 'all 0.15s ease',
                    opacity: sedangMenyimpan ? 0.6 : 1,
                  }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${warna}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, color: warna }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{renderMath(teksOpsi)}</span>
                </button>
              );
            })}
          </div>

          <button onClick={jawabDanLanjut} disabled={jawabanDipilih === null || sedangMenyimpan} style={{ ...st.tombolUtama, opacity: jawabanDipilih === null ? 0.4 : 1 }}>
            {indexSekarang + 1 < soalSesi.length ? 'Lanjut Soal Berikutnya' : 'Kumpulkan Jawaban'}
          </button>
        </div>
      </div>
    );
  }

  // 🔥 BARU: layar transisi singkat, kesan jawaban "dikirim" buat
  // dikoreksi -- murni animasi, otomatis lanjut ke 'mengoreksi'
  // (lihat useEffect di atas).
  if (tahap === 'mengirim') {
    return (
      <div style={st.pusat}>
        <style>{`
          @keyframes gemilangKirimPulse { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.15); opacity: 1; } }
        `}</style>
        <div style={{ fontSize: 48, marginBottom: 14, animation: 'gemilangKirimPulse 1s ease-in-out infinite' }}>📡</div>
        <div style={{ fontWeight: 700, color: '#4C1D95' }}>Mengirim jawabanmu...</div>
      </div>
    );
  }

  // 🔥 BARU: layar "dikoreksi" -- ini yang bikin dramatis. Angka XP
  // berjalan naik dikit-dikit (bukan langsung muncul jadi), sambil
  // nampilin sudah berapa soal yang "diperiksa" -- ngasih kesan siswa
  // sungguhan lagi dikoreksi satu-satu, bukan cuma dihitung instan.
  if (tahap === 'mengoreksi') {
    const totalSoal = hasilPerSoal.length;
    return (
      <div style={st.pusat}>
        <style>{`
          @keyframes gemilangAngkaNaik { from { transform: translateY(6px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
        <div style={{ fontSize: 40, marginBottom: 6 }}>🧑‍🚀</div>
        <div style={{ fontWeight: 700, color: '#4C1D95', marginBottom: 18 }}>Sedang dikoreksi...</div>
        <div key={xpAnimasi} style={{ fontSize: 40, fontWeight: 800, color: '#7C3AED', fontVariantNumeric: 'tabular-nums', animation: 'gemilangAngkaNaik 0.35s ease-out' }}>
          +{xpAnimasi} XP
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: '#94a3b8' }}>
          Memeriksa soal {Math.min(koreksiIndex + 1, totalSoal)} dari {totalSoal}
        </div>
        <div style={{ width: 160, height: 6, background: '#e9e5fb', borderRadius: 10, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${totalSoal ? (koreksiIndex / totalSoal) * 100 : 0}%`, background: 'linear-gradient(90deg, #7C3AED, #FB923C)', borderRadius: 10, transition: 'width 0.35s ease' }} />
        </div>
      </div>
    );
  }

  if (tahap === 'selesai') {
    const semuaBenar = hasilSesi.salah === 0;
    return (
      <div style={st.page}>
        <style>{`
          @keyframes gemilangFloatUp { from { opacity: 0; transform: translateY(10px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes gemilangTwinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        `}</style>
        <div style={{ ...st.hero, minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={st.heroStars} />
          {['⭐','✨','⭐','✨'].map((s, i) => (
            <span key={i} style={{ position: 'absolute', fontSize: 14 + (i % 2) * 6, top: `${15 + i * 18}%`, left: `${10 + i * 24}%`, animation: `gemilangTwinkle ${1.4 + i * 0.3}s ease-in-out infinite` }}>{s}</span>
          ))}
          <div style={{ fontSize: 56, animation: 'gemilangFloatUp 0.5s ease-out' }}>{semuaBenar ? '🧑‍🚀' : '🛰️'}</div>
          <h1 style={{ ...st.heroTitle, fontSize: 20, marginTop: 6 }}>Misi Selesai!</h1>
        </div>

        <div style={{ padding: '20px 24px', textAlign: 'center', marginTop: -10 }}>
          <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 22 }}>
            {hasilSesi.benar} benar, {hasilSesi.salah} salah dari {soalSesi.length} soal
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            <div style={st.statBesar}>
              <span style={{ fontSize: 22 }}>🚀</span>
              <div style={st.statAngka}>+{xpDidapat}</div>
              <div style={st.statLabel}>XP didapat</div>
            </div>
            {streakInfo && (
              <div style={st.statBesar}>
                <Flame size={22} color="#f97316" />
                <div style={st.statAngka}>{streakInfo.streakBaru}</div>
                <div style={st.statLabel}>Hari Beruntun</div>
              </div>
            )}
          </div>

          {/* 🔥 BARU: info jatah harian -- kalau masih ada sisa, tawarkan
              lanjut mapel lain (BUKAN materi yang sama, biar bervariasi);
              kalau sudah habis, kasih tahu jelas + arahkan pulang. */}
          {sisaJatah !== null && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              {sisaJatah > 0
                ? `Jatah latihan hari ini masih tersisa ${sisaJatah} soal.`
                : 'Jatah latihan hari ini sudah habis. Sampai jumpa besok, Siswa Gemilang! 🎉'}
            </p>
          )}

          {/* 🔥 BARU: dulu pembahasan & benar/salah tampil LANGSUNG per
              soal waktu ngerjain. Sekarang semuanya baru diungkap DI
              SINI, setelah sesi selesai -- siswa scroll lihat satu-satu,
              lengkap sama pembahasannya. */}
          {hasilPerSoal.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>📋 TINJAU JAWABAN</div>
              {hasilPerSoal.map((item, idx) => {
                const opsi = item.soal.opsiJawaban || [];
                const teksOpsi = (i) => {
                  const o = opsi[i];
                  return typeof o === 'string' ? o : (o?.teks || '');
                };
                return (
                  <div key={idx} style={{ ...st.kartuSoal, marginBottom: 12, textAlign: 'left', borderLeft: `4px solid ${item.benar ? '#22c55e' : '#ef4444'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {item.benar ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: item.benar ? '#16a34a' : '#dc2626' }}>
                        Soal {idx + 1} — {item.benar ? 'Benar' : 'Kurang Tepat'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6, marginBottom: 10 }}>
                      {renderMath(item.soal.soal || item.soal.teks_soal)}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 4 }}>
                      Jawabanmu: <strong>{String.fromCharCode(65 + item.jawabanIndex)}. {renderMath(teksOpsi(item.jawabanIndex))}</strong>
                    </div>
                    {!item.benar && (
                      <div style={{ fontSize: 12.5, color: '#16a34a', marginBottom: 4 }}>
                        Kunci: <strong>{String.fromCharCode(65 + item.indexBenar)}. {renderMath(teksOpsi(item.indexBenar))}</strong>
                      </div>
                    )}
                    {item.soal.pembahasan && (
                      <div style={{ ...st.boxPembahasan, marginTop: 10 }}>
                        <b>💡 Pembahasan</b>
                        <div style={{ marginTop: 4 }}>{renderMath(item.soal.pembahasan)}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sisaJatah > 0 ? (
            <button onClick={() => setTahap('pilih-mapel')} style={st.tombolUtama}>Lanjut Mapel Lain</button>
          ) : (
            <button onClick={() => navigate('/siswa/dashboard')} style={st.tombolUtama}>Kembali ke Markas</button>
          )}
        </div>
      </div>
    );
  }

  // 🔥 BARU: layar ini muncul kalau siswa BUKA HALAMAN Latihan Harian
  // (bukan baru selesai sesi) tapi jatah hari itu ternyata sudah habis
  // dari sesi-sesi sebelumnya. Dibingkai positif ("sudah menyelesaikan
  // tanggung jawab hari ini"), bukan menghukum -- sesuai semangat
  // "tanggung jawab harian" yang jadi tujuan gamifikasi ini dari awal.
  if (tahap === 'jatah-habis') {
    return (
      <div style={st.page}>
        <style>{`@keyframes gemilangTwinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
        <div style={{ ...st.hero, minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={st.heroStars} />
          {['⭐','✨','⭐'].map((s, i) => (
            <span key={i} style={{ position: 'absolute', fontSize: 14 + (i % 2) * 6, top: `${18 + i * 20}%`, left: `${14 + i * 30}%`, animation: `gemilangTwinkle ${1.4 + i * 0.3}s ease-in-out infinite` }}>{s}</span>
          ))}
          <div style={{ fontSize: 56 }}>🧑‍🚀</div>
          <h1 style={{ ...st.heroTitle, fontSize: 19, marginTop: 8, textAlign: 'center', padding: '0 20px' }}>Kamu sudah menyelesaikan misi hari ini!</h1>
        </div>
        <div style={{ padding: '24px 28px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.7, marginBottom: 24 }}>
            Kerja bagus, Siswa Gemilang! Jatah latihan hari ini ({JATAH_SOAL_PER_HARI} soal) sudah tuntas.
            Bank soal butuh dijaga supaya tetap segar buat besok juga -- yuk balik lagi besok buat lanjut misi berikutnya. 🚀
          </p>
          <button onClick={() => navigate('/siswa/dashboard')} style={st.tombolUtama}>Kembali ke Markas</button>
        </div>
      </div>
    );
  }

  return null;
}

// 🔥 BARU: ikon & warna per mapel, biar tiap "planet" gampang dibedain
// sekilas mata -- bukan kartu abu-abu identik semua.
const IKON_MAPEL = {
  matematika: { emoji: '🔢', warna: '#4C6EF5' },
  'bahasa indonesia': { emoji: '📖', warna: '#F0447D' },
  'bahasa inggris': { emoji: '🌍', warna: '#0EA5E9' },
  kimia: { emoji: '🧪', warna: '#22C55E' },
  fisika: { emoji: '⚡', warna: '#F59E0B' },
  biologi: { emoji: '🌿', warna: '#16A34A' },
  ekonomi: { emoji: '💹', warna: '#0891B2' },
  sejarah: { emoji: '🏛️', warna: '#A16207' },
  geografi: { emoji: '🗺️', warna: '#0D9488' },
};
function getIkonMapel(nama) {
  const key = (nama || '').toLowerCase();
  for (const k in IKON_MAPEL) { if (key.includes(k)) return IKON_MAPEL[k]; }
  return { emoji: '📚', warna: '#7C3AED' };
}

function ChevronRightIcon() {
  return <span style={{ fontSize: 18, opacity: 0.85 }}>›</span>;
}

// ============================================================
// STYLE TOKENS -- tema "Misi Harian" (astronot/luar angkasa)
// ============================================================
// Warna inti: #1E1B4B (langit malam), #7C3AED (nebula/brand),
// #FB923C (dorongan roket/energi), #FBBF24 (bintang), #F4F2FF (orbit/bg).
const st = {
  page: { minHeight: '100vh', background: '#F4F2FF', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' },
  pusat: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'sans-serif', background: '#F4F2FF' },

  hero: {
    position: 'relative', overflow: 'hidden', padding: '18px 18px 30px',
    background: 'linear-gradient(160deg, #1E1B4B 0%, #4C1D95 100%)',
  },
  heroStars: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
    backgroundSize: '18px 18px', opacity: 0.5, pointerEvents: 'none',
  },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: 800, margin: '6px 0 2px' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, margin: 0 },
  backBtnDark: { position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' },

  jalurRoket: { position: 'relative', height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 10, marginTop: 16 },
  jalurRoketFill: { position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #FB923C, #FBBF24)', borderRadius: 10, transition: 'width 0.4s ease' },
  rocketMarker: { position: 'absolute', top: -9, fontSize: 16, transition: 'left 0.4s ease' },

  kosongBox: { textAlign: 'center', color: '#8b8398', padding: '36px 20px', fontSize: 13, background: 'white', borderRadius: 16 },

  gridMapel: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  kartuPlanet: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, background: 'white', border: '2px solid', borderRadius: 18, padding: 16, cursor: 'pointer', textAlign: 'left' },
  lingkaranIkon: { width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 2 },
  namaPlanet: { fontSize: 13.5, fontWeight: 700, color: '#1e293b' },
  jumlahSoalPlanet: { fontSize: 11, color: '#94a3b8' },

  kartuRekomendasi: { display: 'flex', alignItems: 'center', gap: 14, width: '100%', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', color: 'white', border: 'none', borderRadius: 18, padding: 18, cursor: 'pointer', boxShadow: '0 8px 20px rgba(124,58,237,0.3)' },
  subJudulSeksi: { fontSize: 12.5, fontWeight: 700, color: '#64748b', margin: '22px 0 10px' },
  kartuBab: { display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #ece7fb', borderRadius: 14, padding: '13px 16px', cursor: 'pointer' },
  namaBab: { fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 },
  trackMini: { height: 5, background: '#f1f0f9', borderRadius: 10, overflow: 'hidden' },
  fillMini: { height: '100%', borderRadius: 10, transition: 'width 0.3s ease' },

  kartuSoal: { background: 'white', borderRadius: 18, padding: 18, marginBottom: 16, boxShadow: '0 4px 16px rgba(30,27,75,0.06)' },
  boxBacaan: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: '#78350F' },
  labelBacaan: { fontSize: 11, fontWeight: 800, color: '#B45309', marginBottom: 8, textTransform: 'none' },
  boxPembahasan: { marginTop: 14, padding: 14, borderRadius: 12, background: '#F4F2FF', fontSize: 12.5, color: '#4C1D95', lineHeight: 1.6 },

  tombolUtama: { width: '100%', padding: '15px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 16px rgba(124,58,237,0.25)' },
  statBesar: { background: 'white', borderRadius: 16, padding: '16px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 4px 14px rgba(30,27,75,0.06)', minWidth: 100 },
  statAngka: { fontWeight: 800, fontSize: 19, color: '#1e293b', fontVariantNumeric: 'tabular-nums' },
  statLabel: { fontSize: 10.5, color: '#94a3b8' },
};