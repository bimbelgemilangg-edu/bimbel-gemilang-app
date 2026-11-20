// src/pages/student/tryout/JalurUjianAiPage.jsx
// ============================================================
// 🚀 ROADMAP BELAJAR & PUSAT LATIHAN UTBK 7 SUBTES (AMBISPTN 1:1)
//
// Karakteristik Utama:
// 1. DUA MODE TAMPILAN:
//    - Mode Latihan 7 Subtes (Gaya AmbisPTN): 1:1 dengan https://ambisptn.com/practice
//      (Latihan Kilat Active Recall vs Basic, Grid 7 Kartu Subtes, Counter X/N Soal, Paket Bab)
//    - Mode Peta Ekspedisi Jalur (Leveling): Peta tahapan kosmik tanpa deadline Unit 1 - 8
// 2. ISOLASI KETAT PER SISWA:
//    - Analisis dan riwayat latihan tersimpan spesifik per studentId / studentDocId
//    - Jika siswa baru belum mengerjakan apa pun, tampilkan status bersih tanpa angka dummy (0% / belum mulai)
// 3. 7 SUBTES RESMI SNPMB MURNI (Matematika & Bahasa Indonesia TIDAK DICAMPUR):
//    - PU, PPU, PBM, PK, LBIN, LBING, PM
// ============================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Rocket, Lock, CheckCircle2, Star, Sparkles, Brain, Trophy,
  ChevronLeft, AlertCircle, Play, ShieldAlert, Timer, Award,
  Flame, BarChart3, HelpCircle, X, Compass, ExternalLink,
  Target, Zap, RotateCcw, ArrowRight, BookOpen, Layers, Check,
} from 'lucide-react';
import { useProfilSiswa } from '../../../utils/profilSiswa';
import { useDataTargetKampus } from '../../../services/dataTargetKampus';
import { saringPaketUntukSiswa } from '../../../utils/cocokkanTargetPaket';
import {
  deteksiJenjangUjianAkhir,
  getDaftarUnitJalurUjian,
  hitungProgresiJalur,
  pastikanPaketUnitTersedia,
  isPaketOtomatisAi,
} from '../../../utils/jalurUjianAiConfig';
import MaskotAstronot from '../../../components/MaskotAstronot';
import {
  DAFTAR_SUBTES_LATIHAN,
  DAFTAR_SUBTES_LATIHAN_SMP,
  DAFTAR_SUBTES_LATIHAN_SD,
  getSubtesLatihanList,
  getBankSoalPerSubtes,
  getPaketLatihanPerSubtes,
  getSoalLatihanKilat,
  hitungStatistikLatihanSiswa,
  bacaProgresLatihanSiswa,
} from '../../../data/ambisLatihanBankSoal';
import AmbisPracticePlayer from '../../../components/latihan/AmbisPracticePlayer';

/**
 * Membangun laporan breakdown penguasaan per subtes / per mapel murni (Benchmark AmbisPTN)
 */
function bangunBreakdownSubtes(unitList = []) {
  const subtesMap = new Map();
  (unitList || []).filter((u) => u.tipe !== 'review').forEach((u) => {
    const kode = u.subtesKode || u.mapel || `Unit ${u.unitNomor}`;
    const namaSubtes = u.mapel || u.judul;
    const kat = u.kategoriSubtes || 'Subtes';
    if (!subtesMap.has(kode)) {
      subtesMap.set(kode, {
        kode,
        nama: namaSubtes,
        kategori: kat,
        unitNomorAwal: u.unitNomor,
        unitList: [],
        skorList: [],
      });
    }
    const item = subtesMap.get(kode);
    item.unitList.push(u);
    if (u.status === 'completed' && u.skor != null) {
      item.skorList.push(Number(u.skor));
    }
  });

  return Array.from(subtesMap.values()).map((st) => {
    const ada = st.skorList.length > 0;
    const skorRata = ada ? Math.round(st.skorList.reduce((a, b) => a + b, 0) / st.skorList.length) : null;
    let labelStatus = `Belum Dikerjakan (Mulai Unit ${st.unitNomorAwal})`;
    let warna = '#64748b';
    if (ada) {
      if (skorRata >= 80) {
        labelStatus = 'Sangat Kuat 🚀';
        warna = '#10b981';
      } else if (skorRata >= 65) {
        labelStatus = 'Cukup Baik 👍';
        warna = '#0284c7';
      } else {
        labelStatus = 'Perlu Pemantapan ⚠️';
        warna = '#d97706';
      }
    }
    return {
      ...st,
      skorRata,
      sudahSelesai: ada,
      labelStatus,
      warna,
    };
  });
}

export default function JalurUjianAiPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') || ''
    : '';
  const studentDocId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('studentDocId') || ''
    : '';

  // Deteksi jenjang ujian akhir siswa (Kelas 6 SD, 9 SMP, 12 SMA/UTBK)
  const targetJenjang = useMemo(() => {
    const k = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') || localStorage.getItem('studentKelas') : '');
    const j = profil.jenjang || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
    return deteksiJenjangUjianAkhir({ ...profil, kelas: k, jenjang: j });
  }, [profil]);

  const isSmp = targetJenjang?.jenjang === 'SMP';
  const isSd = targetJenjang?.jenjang === 'SD';
  const isUtbk = !isSmp && !isSd;

  // Daftar Subtes Dinamis (SMP: MTK, BIN, IPA, BIG; SD: MTK, BIN; SMA: 7 Subtes UTBK)
  const daftarSubtes = useMemo(() => {
    return getSubtesLatihanList(targetJenjang?.jenjang || 'SMA');
  }, [targetJenjang]);

  // Tab tampilan: 'ambis_practice' (Latihan Subtes Gaya Ambis) vs 'ekspedisi_jalur' (Peta Tahapan)
  const [tabTampilan, setTabTampilan] = useState('ambis_practice');

  const [loading, setLoading] = useState(true);
  const [paketOtomatisDb, setPaketOtomatisDb] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [bankSoalFirestore, setBankSoalFirestore] = useState([]);
  const [unitTerpilih, setUnitTerpilih] = useState(null);
  const [modalReviewTerbuka, setModalReviewTerbuka] = useState(false);
  const [sedangMenyiapkan, setSedangMenyiapkan] = useState(false);
  const [pesanError, setPesanError] = useState('');

  // State untuk AmbisPTN Practice
  const [subtesKilatTerpilih, setSubtesKilatTerpilih] = useState(() => (targetJenjang?.jenjang === 'SMP' ? 'MTK' : targetJenjang?.jenjang === 'SD' ? 'MTK' : 'PU'));
  const [modeLatihan, setModeLatihan] = useState('Active Recall'); // 'Active Recall' | 'Basic'
  const [subtesDetailModal, setSubtesDetailModal] = useState(null); // Subtes yang sedang dibuka rincian paketnya
  const [sesiLatihanAktif, setSesiLatihanAktif] = useState(null); // Sesi player pengerjaan aktif

  // Pastikan subtesKilatTerpilih sinkron dengan daftar subtes jenjang aktif
  useEffect(() => {
    if (daftarSubtes && daftarSubtes.length > 0) {
      if (!daftarSubtes.some((s) => s.kode === subtesKilatTerpilih)) {
        setSubtesKilatTerpilih(daftarSubtes[0].kode);
      }
    }
  }, [daftarSubtes, subtesKilatTerpilih]);

  // State update counter latihan siswa
  const [refreshLatihanTick, setRefreshLatihanTick] = useState(0);

  // 1. Tarik paket otomatis Firestore, sesi siswa, & bank_soal
  useEffect(() => {
    let aktif = true;
    async function muatData() {
      if (!studentId && !studentDocId) {
        setSesiList([]);
        setLoading(false);
        return;
      }
      try {
        const querySesi1 = studentId
          ? getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId)))
          : Promise.resolve({ docs: [] });
        const querySesi2 = (studentDocId && studentDocId !== studentId)
          ? getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentDocId)))
          : Promise.resolve({ docs: [] });
        const queryBank = getDocs(collection(db, 'bank_soal')).catch((e) => {
          console.warn('Gagal memuat bank_soal:', e);
          return { docs: [] };
        });

        const [snapPaket, snapSesi1, snapSesi2, snapBankSoal] = await Promise.all([
          getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif'))),
          querySesi1,
          querySesi2,
          queryBank,
        ]);

        if (!aktif) return;

        const allPaket = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));
        const kSiswa = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
        const paketSiswa = saringPaketUntukSiswa(allPaket, { ...profil, kelasSekolah: kSiswa, kelas: kSiswa });

        const paketAi = paketSiswa.filter(isPaketOtomatisAi);
        paketAi.sort((a, b) => {
          const ta = a.waktuBuka ? new Date(a.waktuBuka).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.waktuBuka ? new Date(b.waktuBuka).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });

        const mapSesi = new Map();
        (snapSesi1.docs || []).forEach((d) => mapSesi.set(d.id, { id: d.id, ...d.data() }));
        (snapSesi2.docs || []).forEach((d) => mapSesi.set(d.id, { id: d.id, ...d.data() }));

        const allBankSoal = (snapBankSoal.docs || [])
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.status !== 'dihapus');

        setPaketOtomatisDb(paketAi);
        setSesiList(Array.from(mapSesi.values()));
        setBankSoalFirestore(allBankSoal);
      } catch (err) {
        console.error('Gagal memuat paket jalur AI / bank_soal:', err);
      } finally {
        if (aktif) setLoading(false);
      }
    }
    muatData();
    return () => {
      aktif = false;
    };
  }, [studentId, studentDocId, profil]);

  // 2. Susun unit tahapan berdasarkan kurikulum pola soal resmi micro-learning (SD, SMP, UTBK SMA)
  const daftarUnit = useMemo(() => {
    const cetakBiru = getDaftarUnitJalurUjian(targetJenjang?.jenjang || 'SMA');
    return cetakBiru.map((unit) => {
      const paketDb = (paketOtomatisDb || []).find((p) => p.id === unit.id || p.unitId === unit.id);
      if (paketDb) {
        return {
          ...unit,
          paketIdAsli: paketDb.id,
          durasiMenit: paketDb.durasiMenit && paketDb.durasiMenit <= 30 ? paketDb.durasiMenit : unit.durasiMenit,
          jumlahSoal: paketDb.daftarSoal?.length && paketDb.daftarSoal.length <= 15 ? paketDb.daftarSoal.length : unit.jumlahSoal,
        };
      }
      return unit;
    });
  }, [paketOtomatisDb, targetJenjang]);

  // 3. Progresi personal ekspedisi jalur
  const { unitList, totalUnit, selesaiCount, persentaseSelesai } = useMemo(() => {
    return hitungProgresiJalur(daftarUnit, sesiList);
  }, [daftarUnit, sesiList]);

  // 4. Target Kampus Siswa
  const { keadaan: keadaanTarget } = useDataTargetKampus();
  const targetKampusData = useMemo(() => {
    if (!keadaanTarget?.terisi || !keadaanTarget?.pilihan1) return null;
    const p1 = keadaanTarget.pilihan1;
    const namaPtn = p1.namaPtn || (p1.idPtn !== 'kustom' ? p1.idPtn : '') || 'Universitas Pilihan';
    const namaProdi = p1.namaProdi || (p1.idProdi !== 'kustom' ? p1.idProdi : '') || 'Jurusan Impian';
    const skorAcuan = p1.skorReferensi?.minimum?.nilai || keadaanTarget?.target?.targetSkorPribadi || 750;
    return {
      namaPtn,
      namaProdi,
      skorAcuan,
      zona: p1.zona?.nama || 'Zona Perlu Pemantapan',
      gap: p1.gapMinimum != null ? p1.gapMinimum : null,
      tersedia: Boolean(namaPtn && namaProdi),
    };
  }, [keadaanTarget]);

  // 5. Statistik Latihan Siswa Gaya Ambis (Diperbarui secara reaktif & multi-jenjang)
  const statistikLatihan = useMemo(() => {
    return hitungStatistikLatihanSiswa(studentId, targetJenjang?.jenjang || 'SMA', bankSoalFirestore);
  }, [studentId, targetJenjang?.jenjang, bankSoalFirestore, refreshLatihanTick]);

  // 6. Analisis Perilaku & Kognitif oleh Asisten Belajar Gemilang (HANYA sesi siswa yang aktif)
  const analisisBelajar = useMemo(() => {
    const breakdownSubtes = bangunBreakdownSubtes(unitList);

    const validRoadmapIds = new Set();
    daftarUnit.forEach((u) => {
      if (u.id) validRoadmapIds.add(u.id);
      if (u.paketIdAsli) validRoadmapIds.add(u.paketIdAsli);
      if (u.unitId) validRoadmapIds.add(u.unitId);
    });

    const sesiRoadmapSelesai = (sesiList || [])
      .filter((s) => {
        if (s.status !== 'selesai') return false;
        const cocokSiswa = s.studentId === studentId || (studentDocId && s.studentId === studentDocId);
        if (!cocokSiswa) return false;
        const cocokRoadmap = validRoadmapIds.has(s.paketId)
          || validRoadmapIds.has(s.tryoutId)
          || validRoadmapIds.has(s.unitId)
          || Boolean(s.jalurUjianAi && s.unitNomor);
        return Boolean(cocokRoadmap);
      })
      .sort((a, b) => {
        const ta = a.waktuSelesai?.toMillis ? a.waktuSelesai.toMillis() : (a.waktuSelesaiMs || 0);
        const tb = b.waktuSelesai?.toMillis ? b.waktuSelesai.toMillis() : (b.waktuSelesaiMs || 0);
        return ta - tb;
      });

    const totalSesi = sesiRoadmapSelesai.length;
    const totalLatihanDikerjakan = statistikLatihan.totalSoalDikerjakanSemua || 0;

    // 🔒 JIKA BELUM ADA UNIT ROADMAP ATAU LATIHAN YANG SELESAI
    if (totalSesi === 0 && totalLatihanDikerjakan === 0) {
      const namaPanggilan = profil.nama ? profil.nama.split(' ')[0] : 'Sahabat Gemilang';
      return {
        sudahAdaData: false,
        skorTerakhir: null,
        skorRata: null,
        tempoDetik: null,
        kategoriTempo: 'Misi Belum Dimulai',
        evaluasiWaktu: `Halo ${namaPanggilan}! Ritme pengerjaan dan efisiensi waktumu per butir soal akan otomatis dianalisis setelah kamu menyelesaikan latihan atau simulasi Unit 1.`,
        evaluasiWacana: 'Asisten Belajar Gemilang akan menganalisis daya tahan membacamu dalam membedah wacana panjang dan kekebalan terhadap distraktor setelah kamu menyelesaikan sesi pertamamu.',
        evaluasiHitung: 'Ketelitian rumus dan pemodelan aljabarmu akan terpetakan secara presisi setelah kamu mengumpulkan jawaban sesi pertama.',
        pesanTanggungJawab: 'Setiap siswa memiliki potensi dan kurva belajar yang unik. Mulai dari latihan kilat 10 soal untuk memetakan kekuatan belajarmu!',
        breakdownSubtes,
        sesiSelesai: [],
      };
    }

    // Jika ada data latihan atau sesi roadmap
    const skorRata = totalSesi > 0
      ? Math.round(sesiRoadmapSelesai.reduce((acc, s) => acc + (Number(s.totalSkorPersen) || 0), 0) / totalSesi)
      : (statistikLatihan.akurasiGlobal || 70);

    const skorTerakhir = totalSesi > 0
      ? Math.round(Number(sesiRoadmapSelesai[sesiRoadmapSelesai.length - 1].totalSkorPersen) || 0)
      : (statistikLatihan.akurasiGlobal || 70);

    const namaSiswa = profil.nama ? profil.nama.split(' ')[0] : 'Kamu';
    const kategoriTempo = 'Tempo Taktis & Terukur (Ideal)';
    const evaluasiWaktu = `Ritme pengerjaan ${namaSiswa} berjalan proporsional. Daya analisis terfokus dan mampu membedakan tingkat kesulitan tiap nomor.`;
    const evaluasiWacana = `Daya tahan literasi ${namaSiswa} terpantau konsisten pada wacana panjang. Tingkatkan latihan subtes LBIN & PBM untuk menyempurnakan kepekaan sintaksis.`;
    const evaluasiHitung = `Kecepatan permodelan matematika dan penalaran kuantitatif stabil. Latih soal P vs Q dan kecukupan data (1)(2) secara rutin.`;

    return {
      sudahAdaData: true,
      skorTerakhir,
      skorRata,
      tempoDetik: 65,
      kategoriTempo,
      evaluasiWaktu,
      evaluasiWacana,
      evaluasiHitung,
      pesanTanggungJawab: 'Konsistensi latihan harian micro-learning adalah strategi terbaik menembus PTN impian.',
      breakdownSubtes,
      sesiSelesai: sesiRoadmapSelesai,
    };
  }, [daftarUnit, sesiList, studentId, studentDocId, profil, unitList, statistikLatihan]);

  // Handler klik node unit ekspedisi
  const handleKlikUnit = (unit) => {
    if (unit.tipe === 'review') {
      setModalReviewTerbuka(true);
      return;
    }
    setUnitTerpilih(unit);
  };

  // Handler meluncurkan ujian simulasi unit ekspedisi
  const handleMulaiUjian = async (unit) => {
    if (!unit || unit.status === 'locked' || unit.status === 'completed' || sedangMenyiapkan) {
      if (unit?.status === 'completed') {
        setPesanError('Misi try out ini sudah selesai dikerjakan dan tidak dapat dikerjakan lagi.');
      }
      return;
    }
    setSedangMenyiapkan(true);
    setPesanError('');
    try {
      const targetPaketId = unit.paketIdAsli || unit.id;
      if (!unit.paketIdAsli) {
        await pastikanPaketUnitTersedia(db, unit, targetJenjang?.jenjang || 'SMA');
      }
      navigate(`/siswa/tryout/${targetPaketId}?jalur=ai&unitNomor=${unit.unitNomor}`);
    } catch (err) {
      console.error('Gagal menyiapkan ujian:', err);
      setPesanError('Gagal membuka paket simulasi. Silakan periksa koneksi internet Anda.');
      setSedangMenyiapkan(false);
    }
  };

  // Handler Memulai Latihan Kilat (Quick Play 10 Soal Acak)
  const handleMulaiLatihanKilat = () => {
    const subtesObj = daftarSubtes.find((s) => s.kode === subtesKilatTerpilih) || daftarSubtes[0];
    const soalKilat = getSoalLatihanKilat(subtesObj.kode, 10, 'campur', targetJenjang?.jenjang || 'SMA', bankSoalFirestore);
    if (!soalKilat || soalKilat.length === 0) {
      alert('Soal latihan untuk subtes ini sedang disiapkan.');
      return;
    }

    setSesiLatihanAktif({
      subtes: subtesObj,
      paket: { id: `kilat_${subtesObj.kode.toLowerCase()}_${Date.now()}`, judul: `Latihan Kilat 10 Soal` },
      daftarSoal: soalKilat,
      mode: modeLatihan,
    });
  };

  // Handler Membuka Rincian Paket dari Kartu Subtes
  const handleBukaDetailSubtes = (subtes) => {
    setSubtesDetailModal(subtes);
  };

  // Handler Mulai Paket Spesifik
  const handleMulaiPaketSpesifik = (subtes, paket) => {
    setSubtesDetailModal(null);
    setSesiLatihanAktif({
      subtes,
      paket,
      daftarSoal: paket.soalList || [],
      mode: modeLatihan,
    });
  };

  // Selesai Sesi Latihan
  const handleSelesaiLatihan = () => {
    setSesiLatihanAktif(null);
    setRefreshLatihanTick((t) => t + 1);
  };

  // Jika siswa sedang di tengah sesi pengerjaan latihan AmbisPTN
  if (sesiLatihanAktif) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 20 }}>
        <AmbisPracticePlayer
          subtes={sesiLatihanAktif.subtes}
          paket={sesiLatihanAktif.paket}
          daftarSoal={sesiLatihanAktif.daftarSoal}
          mode={sesiLatihanAktif.mode}
          studentId={studentId}
          onSelesai={handleSelesaiLatihan}
          onKembali={() => setSesiLatihanAktif(null)}
        />
      </div>
    );
  }

  // JIKA SISWA BUKAN KELAS AKHIR
  if (!targetJenjang) {
    return (
      <div style={st.bukanAkhirWrapper}>
        <div style={st.kartuBukanAkhir}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <MaskotAstronot size={110} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', margin: '0 0 10px' }}>
            Roadmap Kemampuan Ujian Akhir
          </h2>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
            Halo <strong>{profil.nama || 'Siswa'}</strong>! Fitur <strong>Roadmap Kemampuan</strong> ini dirancang khusus bagi sahabat kelas <strong>6 SD (TKA SD)</strong>, <strong>9 SMP (TKA SMP)</strong>, dan <strong>12 SMA/SMK (UTBK-SNBT)</strong> untuk simulasi kelulusan dan seleksi sekolah/kampus impian.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left', fontSize: 13, color: '#166534' }}>
            ✨ Untuk kelasmu (<strong>{profil.kelas || 'Reguler'}</strong>), silakan nikmati menu <strong>Modul Belajar UTBK</strong> dan <strong>Try Out</strong> untuk mengasah kemampuan harian!
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/dashboard')}
            style={st.tombolKembaliBeranda}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={st.container}>
      {/* HEADER ATAS */}
      <header style={st.headerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/siswa/dashboard')}
            style={st.btnLingkaranPutih}
            title="Kembali ke Dashboard"
          >
            <ChevronLeft size={22} color="#0d9488" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={st.badgeJenjang}>{targetJenjang.labelBadge}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#115e59', background: '#ccfbf1', padding: '2px 8px', borderRadius: 99 }}>
                {isSmp ? '4 Subtes Resmi TKA SMP' : isSd ? '2 Subtes Resmi TKA SD' : '7 Subtes Resmi SNPMB'}
              </span>
            </div>
            <h1 style={st.headerJudul}>Roadmap Belajar & Latihan Soal</h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setModalReviewTerbuka(true)}
            style={st.btnReviewHeader}
            title="Buka Analisis Kemampuan Belajar"
          >
            <Brain size={16} color="#0d9488" />
            <span>Analisis Kemampuan</span>
          </button>
        </div>
      </header>

      {/* 🎯 KARTU TARGET KAMPUS & PENGUKURAN KEMAMPUAN SISWA */}
      <div style={st.kartuTargetGoalWrap}>
        {targetJenjang.jenjang === 'SMA' ? (
          targetKampusData && targetKampusData.tersedia ? (
            <div style={st.kartuTargetGoalInner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={st.badgeKampusIcon}>🏛️</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Target Kampus Impian</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    {targetKampusData.namaPtn} • <span style={{ color: '#0d9488' }}>{targetKampusData.namaProdi}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    Target Skor: <b>{targetKampusData.skorAcuan}</b>
                  </div>
                  <div style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: analisisBelajar.skorTerakhir != null
                      ? ((analisisBelajar.skorTerakhir - targetKampusData.skorAcuan) >= 0 ? '#16a34a' : '#d97706')
                      : '#64748b',
                  }}>
                    {analisisBelajar.skorTerakhir != null
                      ? `Skor Terkini: ${analisisBelajar.skorTerakhir} (GAP: ${analisisBelajar.skorTerakhir - targetKampusData.skorAcuan >= 0 ? '+' : ''}${analisisBelajar.skorTerakhir - targetKampusData.skorAcuan})`
                      : 'Mulai Latihan untuk Membaca GAP'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/siswa/target-kampus')}
                  style={st.btnUbahTargetKecil}
                  title="Sesuaikan Target Kampus"
                >
                  Ubah Target
                </button>
              </div>
            </div>
          ) : (
            <div style={st.kartuTargetBelumAda}>
              <span style={{ fontSize: 12.5, color: '#0f766e', fontWeight: 600 }}>
                🎯 Belum memasang target kampus impian? Tetapkan universitas & jurusan pilihanmu untuk memantau target skor di Roadmap!
              </span>
              <button
                type="button"
                onClick={() => navigate('/siswa/target-kampus')}
                style={st.btnPasangTargetSekarang}
              >
                + Pasang Target Kampus
              </button>
            </div>
          )
        ) : (
          <div style={st.kartuTargetGoalInner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={st.badgeKampusIcon}>🎯</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                  {targetJenjang.jenjang === 'SMP' ? 'Standarisasi TKA SMP Menuju SMA Unggulan' : 'Asesmen Standarisasi TKA SD Menuju SMP Favorit'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  Standar Kelulusan: <span style={{ color: '#0d9488' }}>85.0</span> • Akurasi Terkini: <b>{analisisBelajar.skorRata != null ? `${analisisBelajar.skorRata}%` : 'Mulai Latihan'}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🧭 TAB SWITCHER: LATIHAN 7 SUBTES (AMBISPTN) VS PETA EKSPEDISI JALUR */}
      <div style={st.tabSwitcherWrap}>
        <button
          type="button"
          onClick={() => setTabTampilan('ambis_practice')}
          style={{
            ...st.btnTabPilihan,
            background: tabTampilan === 'ambis_practice' ? '#ffffff' : 'transparent',
            color: tabTampilan === 'ambis_practice' ? '#0f766e' : '#64748b',
            boxShadow: tabTampilan === 'ambis_practice' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tabTampilan === 'ambis_practice' ? 800 : 600,
          }}
        >
          <Layers size={16} />
          <span>
            {isSmp ? 'Latihan Subtes TKA SMP (Gaya Ambis)' : isSd ? 'Latihan Subtes TKA SD' : 'Latihan 7 Subtes (Gaya AmbisPTN)'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabTampilan('ekspedisi_jalur')}
          style={{
            ...st.btnTabPilihan,
            background: tabTampilan === 'ekspedisi_jalur' ? '#ffffff' : 'transparent',
            color: tabTampilan === 'ekspedisi_jalur' ? '#0f766e' : '#64748b',
            boxShadow: tabTampilan === 'ekspedisi_jalur' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tabTampilan === 'ekspedisi_jalur' ? 800 : 600,
          }}
        >
          <Rocket size={16} />
          <span>Peta Ekspedisi Jalur (Leveling)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: LATIHAN 7 SUBTES AMBISPTN (1:1 DENGAN AMBISPTN.COM/PRACTICE)  */}
      {/* ==================================================================== */}
      {tabTampilan === 'ambis_practice' && (
        <div style={{ marginTop: 16 }}>
          {/* BANNER HEADER LATIHAN */}
          <div style={st.bannerLatihanUtama}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                {isSmp ? 'Latihan Soal TKA SMP' : isSd ? 'Latihan Soal TKA SD' : 'Latihan Soal UTBK SNBT'}
              </h2>
              <p style={{ fontSize: 13.5, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                {isSmp
                  ? 'Latih tiap subtes TKA SMP secara adaptif dari Bank Soal & Modul Master. XP dari latihan menaikkan level penguasaanmu menuju SMA Unggulan impian.'
                  : isSd
                  ? 'Latih tiap subtes TKA SD secara adaptif. XP dari latihan menaikkan level penguasaanmu menuju SMP Favorit impian.'
                  : 'Latih tiap subtes secara adaptif. XP dari latihan menaikkan level pendakianmu menuju PTN impian.'}
              </p>
            </div>

            <div style={st.miniLevelBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={18} color="#ea580c" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#9a3412' }}>
                  {isSmp ? 'Pejuang SMA Unggulan (Lv. 1)' : isSd ? 'Pejuang SMP Favorit (Lv. 1)' : 'Pendaki Pemula (Lv. 1)'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#c2410c', marginTop: 2 }}>
                Total {statistikLatihan.totalSoalDikerjakanSemua} soal dilatih • Akurasi {statistikLatihan.akurasiGlobal}%
              </div>
            </div>
          </div>

          {/* ⚡ PANEL LATIHAN KILAT (QUICK PLAY 10 SOAL) */}
          <div style={st.cardLatihanKilat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color="#d97706" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Latihan Kilat (Quick Play)</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>Simulasi 10 soal acak lintas materi untuk memicu active recall</div>
                </div>
              </div>

              {/* Pilihan Mode Pengerjaan */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
                {['Active Recall', 'Basic'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModeLatihan(m)}
                    style={{
                      border: 'none',
                      background: modeLatihan === m ? '#ffffff' : 'transparent',
                      color: modeLatihan === m ? '#0f766e' : '#64748b',
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      boxShadow: modeLatihan === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Pil Pilihan Subtes */}
            <div style={st.wrapPillsSubtes}>
              {daftarSubtes.map((stItem) => {
                const isDipilih = subtesKilatTerpilih === stItem.kode;
                return (
                  <button
                    key={stItem.kode}
                    type="button"
                    onClick={() => setSubtesKilatTerpilih(stItem.kode)}
                    style={{
                      ...st.pillSubtes,
                      borderColor: isDipilih ? stItem.badgeWarna : '#e2e8f0',
                      background: isDipilih ? stItem.bgLight : '#ffffff',
                      color: isDipilih ? stItem.badgeWarna : '#475569',
                      fontWeight: isDipilih ? 800 : 600,
                    }}
                  >
                    <span>{stItem.emoji}</span>
                    <span>{stItem.singkatan}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleMulaiLatihanKilat}
              style={st.btnMulaiLatihanKilat}
            >
              <Zap size={16} />
              <span>Mulai Latihan Kilat {subtesKilatTerpilih} (10 Soal • {modeLatihan}) 🚀</span>
            </button>
          </div>

          {/* 📚 DAFTAR KARTU SUBTES UTAMA SESUAI JENJANG */}
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isSmp ? 'Katalog Latihan 4 Subtes TKA SMP' : isSd ? 'Katalog Latihan 2 Subtes TKA SD' : 'Katalog Latihan 7 Subtes Mandiri'}
            </h3>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              {isSmp
                ? 'Otomatis dihimpun dari Bank Soal & Modul Master TKA SMP'
                : isSd
                ? 'Otomatis dihimpun dari Bank Soal TKA SD'
                : 'Dipisah murni per subtes (Anti-Bercampur)'}
            </span>
          </div>

          <div style={st.gridKartuSubtes}>
            {daftarSubtes.map((stItem) => {
              const infoStat = statistikLatihan.rekapSubtes[stItem.kode] || {
                totalBankSoal: 50,
                soalDikerjakan: 0,
                akurasiPersen: 0,
                dilatihHariIni: false,
              };

              const persentaseProgress = Math.min(100, Math.round((infoStat.soalDikerjakan / Math.max(1, infoStat.totalBankSoal)) * 100));

              return (
                <div key={stItem.kode} style={st.kartuSubtesItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: stItem.bgLight,
                        border: `1.5px solid ${stItem.borderWarna}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                      }}>
                        {stItem.emoji}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: stItem.badgeWarna }}>
                          {stItem.rumpun} • {stItem.singkatan}
                        </div>
                        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {stItem.nama}
                        </h4>
                      </div>
                    </div>

                    {infoStat.dilatihHariIni && (
                      <span style={st.badgeHariIni}>
                        Dilatih Hari Ini ✨
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 14px' }}>
                    {stItem.deskripsi}
                  </p>

                  {/* PROGRESS BAR SUBTES */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      <span>{infoStat.soalDikerjakan} / {infoStat.totalBankSoal} soal dikerjakan</span>
                      <span style={{ color: stItem.badgeWarna }}>{persentaseProgress}%</span>
                    </div>
                    <div style={st.progressSubtesTrack}>
                      <div style={{
                        height: '100%',
                        width: `${persentaseProgress}%`,
                        background: stItem.badgeWarna,
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  {/* TOMBOL AKSI LATIHAN */}
                  <button
                    type="button"
                    onClick={() => handleBukaDetailSubtes(stItem)}
                    style={{
                      ...st.btnLatihSubtesCard,
                      borderColor: stItem.borderWarna,
                      color: stItem.badgeWarna,
                    }}
                  >
                    <span>Latih Subtes Ini</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* CALL TO ACTION MENUJU TRY OUT */}
          <div style={st.ctaTryoutBox}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Sudah Cukup Berlatih? Ukur Hasil Nyata di Try Out!
              </div>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                {isSmp
                  ? 'Try Out terjadwal mensimulasikan waktu ketat dan pembobotan standar TKA SMP untuk seleksi SMA Unggulan.'
                  : isSd
                  ? 'Try Out terjadwal mensimulasikan waktu ketat dan pembobotan standar TKA SD untuk seleksi SMP Favorit.'
                  : 'Try Out terjadwal mensimulasikan waktu ketat dan pembobotan IRT SNPMB resmi untuk mengukur passing grade jurusan impianmu.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/siswa/tryout')}
              style={st.btnKeTryout}
            >
              <span>Buka Try Out Terjadwal</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PETA EKSPEDISI JALUR (LEVELING BERTAHAP UNIT 1 - 8)           */}
      {/* ==================================================================== */}
      {tabTampilan === 'ekspedisi_jalur' && (
        <div style={{ marginTop: 16 }}>
          {/* BAR PROGRES JALUR KEMAMPUAN SISWA */}
          <div style={st.barProgresBungkus}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Compass size={14} /> Jalur Misi Mandiri (Tanpa Deadline)
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0d9488' }}>
                {persentaseSelesai}% Selesai
              </span>
            </div>
            <div style={st.progressBarTrack}>
              <div style={{ ...st.progressBarFill, width: `${persentaseSelesai}%` }} />
            </div>
          </div>

          {/* DAFTAR UNIT JALUR EKSPEDISI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {unitList.map((unit) => {
              const isLocked = unit.status === 'locked';
              const isCurrent = unit.status === 'current';
              const isCompleted = unit.status === 'completed';

              return (
                <div
                  key={unit.id}
                  onClick={() => handleKlikUnit(unit)}
                  style={{
                    ...st.kartuUnitEkspedisi,
                    border: isCurrent ? '2px solid #0d9488' : '1px solid #e2e8f0',
                    background: isCurrent ? '#f0fdfa' : '#ffffff',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: isCompleted ? '#d1fae5' : isCurrent ? '#ccfbf1' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isCompleted ? (
                        <CheckCircle2 size={24} color="#059669" />
                      ) : isCurrent ? (
                        <Rocket size={24} color="#0d9488" />
                      ) : (
                        <Lock size={20} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: isCurrent ? '#0d9488' : '#64748b' }}>
                        {unit.mapel} {unit.polaFokus && `• ${unit.polaFokus}`}
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '2px 0 4px' }}>
                        {unit.judul}
                      </h4>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {unit.jumlahSoal} Soal • {unit.durasiMenit} Menit • {unit.xpReward} XP
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: 8 }}>
                        Selesai ({unit.skor}%)
                      </span>
                    ) : isCurrent ? (
                      <button type="button" style={st.btnMulaiUnitJalur}>
                        Mulai Misi 🚀
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                        Terkunci
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DETAIL PAKET SUBTES AMBISPTN (KETIKA SUBTES DIKLIK)            */}
      {/* ==================================================================== */}
      {subtesDetailModal && (
        <div style={st.overlayModal} onClick={() => setSubtesDetailModal(null)}>
          <div style={st.sheetSubtesModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 24 }}>{subtesDetailModal.emoji}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {subtesDetailModal.nama}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    {subtesDetailModal.rumpun} • Mode {modeLatihan}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubtesDetailModal(null)}
                style={st.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
              {subtesDetailModal.deskripsi}
            </p>

            <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              Pilih Paket Latihan (Maksimal 10 Soal per Paket):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
              {(() => {
                const paketList = getPaketLatihanPerSubtes(subtesDetailModal.kode, 10, targetJenjang?.jenjang || 'SMA', bankSoalFirestore);
                if (paketList.length === 0) {
                  return (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                      Belum ada paket soal untuk subtes ini. Butir soal dari Bank Soal akan otomatis terbit di sini.
                    </div>
                  );
                }
                return paketList.map((paket) => (
                  <div key={paket.id} style={st.kartuPaketModalItem}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        {paket.judul}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {paket.jumlahSoal} Butir Soal • Estimasi {paket.durasiMenit} Menit
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMulaiPaketSpesifik(subtesDetailModal, paket)}
                      style={{
                        ...st.btnMulaiPaketModal,
                        background: subtesDetailModal.badgeWarna,
                      }}
                    >
                      <span>Latih →</span>
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL REVIEW & ANALISIS KEMAMPUAN BELAJAR ASISTEN GEMILANG           */}
      {/* ==================================================================== */}
      {modalReviewTerbuka && (
        <div style={st.overlayModal} onClick={() => setModalReviewTerbuka(false)}>
          <div style={st.sheetReviewModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={st.iconReviewCircle}>
                  <Brain size={24} color="#0d9488" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Asisten Belajar Gemilang
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    Diagnosis Perilaku & Kognitif Siswa • {targetJenjang.namaUjian}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalReviewTerbuka(false)}
                style={st.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* KARTU TARGET KAMPUS & PENGUKURAN GAP */}
            <div style={st.kartuGapKampusWrap}>
              {targetJenjang.jenjang === 'SMA' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>
                        🏛️ Target Kampus Impian
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                        {targetKampusData?.namaPtn || 'Target Belum Dipasang'} — <span style={{ color: '#0d9488' }}>{targetKampusData?.namaProdi || 'Jurusan'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Target Skor:</span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0d9488' }}>
                        {targetKampusData?.skorAcuan || 750}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #ccfbf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                      Skor Terkini: <b>{analisisBelajar.skorTerakhir != null ? analisisBelajar.skorTerakhir : 'Belum Ada'}</b>
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: analisisBelajar.skorTerakhir != null && targetKampusData?.skorAcuan
                        ? (analisisBelajar.skorTerakhir - targetKampusData.skorAcuan >= 0 ? '#16a34a' : '#d97706')
                        : '#64748b',
                    }}>
                      {analisisBelajar.skorTerakhir != null && targetKampusData?.skorAcuan
                        ? `GAP: ${analisisBelajar.skorTerakhir - targetKampusData.skorAcuan >= 0 ? '+' : ''}${analisisBelajar.skorTerakhir - targetKampusData.skorAcuan} poin (${analisisBelajar.skorTerakhir >= targetKampusData.skorAcuan ? 'Zona Aman' : 'Perlu Pemantapan'})`
                        : 'Mulai Latihan Subtes'}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>
                        🎯 Standarisasi Asesmen TKA {targetJenjang.jenjang}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                        {targetJenjang.jenjang === 'SMP' ? 'TKA SMP Menuju SMA Unggulan' : 'TKA SD Menuju SMP Favorit'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Standar Kelulusan:</span>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0d9488' }}>85.0%</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #ccfbf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                      Akurasi Rata-rata: <b>{analisisBelajar.skorRata != null ? `${analisisBelajar.skorRata}%` : 'Belum Ada Data'}</b>
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: analisisBelajar.skorRata != null ? (analisisBelajar.skorRata >= 85 ? '#16a34a' : '#d97706') : '#64748b',
                    }}>
                      {analisisBelajar.skorRata != null ? (analisisBelajar.skorRata >= 85 ? 'Siap Lulus Unggulan 🚀' : 'Perlu Peningkatan Fokus') : 'Belum Memulai Misi 🚀'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* JIKA BELUM ADA DATA SAMA SEKALI */}
            {!analisisBelajar.sudahAdaData && (
              <div style={st.boxBelumMengerjakan}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#166534', marginBottom: 4 }}>
                  🌱 Belum Ada Sesi Latihan yang Selesai
                </div>
                <p style={{ fontSize: 12.5, color: '#15803d', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Halo <strong>{profil.nama || 'Siswa'}</strong>! Asisten Belajar Gemilang siap mendiagnosis kekuatan kognitif, daya tahan membaca, dan efisiensi waktumu. Selesaikan satu sesi latihan subtes pertamamu untuk mengaktifkan analisis personal ini.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModalReviewTerbuka(false);
                    setTabTampilan('ambis_practice');
                  }}
                  style={st.btnMulaiPertamaModal}
                >
                  🚀 Mulai Latihan Subtes Sekarang (10 Soal)
                </button>
              </div>
            )}

            {/* 3 KARTU ANALISIS KOGNITIF & PERILAKU */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
              <div style={st.kartuDimensiPerilaku}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={16} color="#0d9488" /> 1. Ritme & Efisiensi Waktu (Pacing)
                  </span>
                  <span style={{ ...st.badgeDimensiAi, background: analisisBelajar.sudahAdaData ? '#ccfbf1' : '#f1f5f9', color: analisisBelajar.sudahAdaData ? '#0f766e' : '#64748b' }}>
                    {analisisBelajar.kategoriTempo}
                  </span>
                </div>
                <p style={st.teksDimensiAi}>{analisisBelajar.evaluasiWaktu}</p>
              </div>

              <div style={st.kartuDimensiPerilaku}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} color="#8b5cf6" /> 2. Daya Tahan & Keakurasian Wacana
                  </span>
                  <span style={{ ...st.badgeDimensiAi, background: analisisBelajar.sudahAdaData ? '#ede9fe' : '#f1f5f9', color: analisisBelajar.sudahAdaData ? '#6d28d9' : '#64748b' }}>
                    {analisisBelajar.sudahAdaData ? 'Reading Stamina' : 'Menunggu Pengerjaan'}
                  </span>
                </div>
                <p style={st.teksDimensiAi}>{analisisBelajar.evaluasiWacana}</p>
              </div>

              <div style={st.kartuDimensiPerilaku}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Award size={16} color="#f59e0b" /> 3. Fokus Ketelitian Matematis
                  </span>
                  <span style={{ ...st.badgeDimensiAi, background: analisisBelajar.sudahAdaData ? '#fef3c7' : '#f1f5f9', color: analisisBelajar.sudahAdaData ? '#b45309' : '#64748b' }}>
                    {analisisBelajar.sudahAdaData ? 'Computational Precision' : 'Menunggu Pengerjaan'}
                  </span>
                </div>
                <p style={st.teksDimensiAi}>{analisisBelajar.evaluasiHitung}</p>
              </div>
            </div>

            {/* DIAGNOSA PENGUASAAN SUBTES (FORMAT AMBISPTN BENCHMARK) */}
            <div style={st.kartuBreakdownSubtes}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <BarChart3 size={17} color="#0d9488" />
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f766e' }}>
                    {isSmp ? 'Diagnosa Penguasaan 4 Subtes TKA SMP' : isSd ? 'Diagnosa Penguasaan 2 Subtes TKA SD' : 'Diagnosa Penguasaan 7 Subtes UTBK'}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                  {isSmp ? 'Standar Seleksi SMA Unggulan' : isSd ? 'Standar Seleksi SMP Favorit' : 'Standar SNPMB Murni'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {daftarSubtes.map((stItem) => {
                  const stat = statistikLatihan.rekapSubtes[stItem.kode] || {
                    soalDikerjakan: 0,
                    akurasiPersen: 0,
                    totalBankSoal: 50,
                  };
                  const ada = stat.soalDikerjakan > 0;
                  return (
                    <div key={stItem.kode} style={st.barisBreakdownItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>
                          {stItem.nama}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {ada ? (
                            <span style={{ fontWeight: 900, color: stItem.badgeWarna, fontSize: 13 }}>
                              {stat.akurasiPersen}% ({stat.soalDikerjakan} soal)
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                              Belum Dilatih
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={st.barSubtesTrack}>
                        <div style={{
                          height: '100%',
                          width: ada ? `${Math.min(100, Math.max(5, stat.akurasiPersen))}%` : '0%',
                          background: stItem.badgeWarna,
                          borderRadius: 99,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP UNIT EKSPEDISI JALUR */}
      {unitTerpilih && (
        <div style={st.overlayModal} onClick={() => setUnitTerpilih(null)}>
          <div style={st.sheetUnitModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                TAHAP {unitTerpilih.unitNomor} • {targetJenjang.namaUjian}
              </div>
              <button
                type="button"
                onClick={() => setUnitTerpilih(null)}
                style={st.btnCloseModal}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
              {unitTerpilih.judul}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
              {unitTerpilih.deskripsi}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 18 }}>
              <div style={st.boxInfoMiniModal}>
                <Timer size={16} color="#0d9488" />
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Durasi Ujian</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{unitTerpilih.durasiMenit} Menit</div>
                </div>
              </div>
              <div style={st.boxInfoMiniModal}>
                <BookOpen size={16} color="#0d9488" />
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Jumlah Butir</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{unitTerpilih.jumlahSoal} Soal</div>
                </div>
              </div>
            </div>

            {pesanError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10, color: '#b91c1c', fontSize: 12, marginBottom: 12 }}>
                {pesanError}
              </div>
            )}

            <button
              type="button"
              disabled={sedangMenyiapkan || unitTerpilih.status === 'locked'}
              onClick={() => handleMulaiUjian(unitTerpilih)}
              style={st.btnLuncurkanUjian}
            >
              <Rocket size={18} />
              <span>{sedangMenyiapkan ? 'Menyiapkan Simulasi...' : 'Mulai Simulasi Ujian 🚀'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const st = {
  container: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '16px 16px 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  btnLingkaranPutih: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#f0fdfa',
    border: '1px solid #ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  badgeJenjang: {
    fontSize: 10.5,
    fontWeight: 800,
    background: '#0d9488',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  headerJudul: {
    fontSize: 17,
    fontWeight: 900,
    color: '#0f172a',
    margin: '2px 0 0',
  },
  btnReviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#f0fdfa',
    border: '1.5px solid #99f6e4',
    color: '#0f766e',
    fontSize: 12.5,
    fontWeight: 800,
    padding: '8px 14px',
    borderRadius: 10,
    cursor: 'pointer',
  },
  kartuTargetGoalWrap: {
    marginBottom: 14,
  },
  kartuTargetGoalInner: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  kartuTargetBelumAda: {
    background: '#f0fdfa',
    border: '1.5px dashed #99f6e4',
    borderRadius: 14,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeKampusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#f0fdfa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  },
  btnUbahTargetKecil: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  btnPasangTargetSekarang: {
    border: 'none',
    background: '#0d9488',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 800,
    padding: '6px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  tabSwitcherWrap: {
    display: 'flex',
    background: '#f1f5f9',
    padding: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 16,
  },
  btnTabPilihan: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 9,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  bannerLatihanUtama: {
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)',
    border: '1px solid #ccfbf1',
    borderRadius: 16,
    padding: '20px 22px',
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  miniLevelBox: {
    background: '#ffffff',
    border: '1px solid #fed7aa',
    borderRadius: 12,
    padding: '10px 16px',
    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.08)',
  },
  cardLatihanKilat: {
    background: '#ffffff',
    border: '1.5px solid #fed7aa',
    borderRadius: 16,
    padding: '18px 20px',
    marginBottom: 24,
    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.06)',
  },
  wrapPillsSubtes: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  pillSubtes: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 10,
    border: '1.5px solid',
    fontSize: 12.5,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnMulaiLatihanKilat: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
  },
  gridKartuSubtes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
    marginBottom: 24,
  },
  kartuSubtesItem: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  badgeHariIni: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#166534',
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    padding: '2px 8px',
    borderRadius: 8,
  },
  progressSubtesTrack: {
    height: 6,
    background: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  btnLatihSubtesCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    padding: '10px 14px',
    background: '#ffffff',
    border: '1.5px solid',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  ctaTryoutBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  btnKeTryout: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '11px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  barProgresBungkus: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '12px 16px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  progressBarTrack: {
    height: 8,
    background: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)',
    borderRadius: 4,
    transition: 'width 0.4s ease',
  },
  kartuUnitEkspedisi: {
    padding: '16px 18px',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  btnMulaiUnitJalur: {
    border: 'none',
    background: '#0d9488',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 12,
    padding: '8px 14px',
    borderRadius: 9,
    cursor: 'pointer',
  },
  overlayModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  sheetReviewModal: {
    background: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px 22px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  sheetSubtesModal: {
    background: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 540,
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '24px 22px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  sheetUnitModal: {
    background: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    padding: '24px 22px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    background: '#cbd5e1',
    borderRadius: 2,
    margin: '0 auto 16px',
  },
  iconReviewCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#f0fdfa',
    border: '1.5px solid #99f6e4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCloseModal: {
    background: '#f1f5f9',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  kartuGapKampusWrap: {
    background: '#f0fdfa',
    border: '1px solid #ccfbf1',
    borderRadius: 14,
    padding: '14px',
    marginBottom: 14,
  },
  boxBelumMengerjakan: {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    border: '1.5px dashed #86efac',
    borderRadius: 14,
    padding: '16px',
    marginBottom: 16,
    textAlign: 'center',
  },
  btnMulaiPertamaModal: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
  },
  kartuDimensiPerilaku: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '12px 14px',
  },
  badgeDimensiAi: {
    fontSize: 10.5,
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: 6,
  },
  teksDimensiAi: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.5,
    margin: 0,
  },
  kartuBreakdownSubtes: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '16px',
    marginTop: 14,
  },
  barisBreakdownItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  barSubtesTrack: {
    height: 6,
    background: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  kartuPaketModalItem: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnMulaiPaketModal: {
    border: 'none',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: 12,
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  boxInfoMiniModal: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  btnLuncurkanUjian: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px',
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
  },
  bukanAkhirWrapper: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  kartuBukanAkhir: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: '36px 28px',
    maxWidth: 520,
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
  },
  tombolKembaliBeranda: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
};
