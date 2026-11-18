// src/pages/student/tryout/JalurUjianAiPage.jsx
// ============================================================
// 🚀 JALUR UJIAN AI — PETA PERJALANAN KEMAMPUAN SISWA (BIMBEL GEMILANG)
//
// Karakteristik Utama:
// 1. Mengukur kemampuan siswa dengan mengukur "jalan" masing-masing siswa
//    (setiap siswa memiliki progres pengerjaan yang berbeda).
// 2. Terhubung langsung ke Paket Try Out Otomatis dari Admin (tryout-otomatis):
//    - TRY OUT PEMAHAMAN TKA SMP - Sabtu, 24 Okt (Start)
//    - TRY OUT PEMAHAMAN TKA SMP - Minggu, 1 Nov (Unit 1)
//    - TRY OUT PEMAHAMAN TKA SMP - Minggu, 8 Nov (Unit 2)
//    - Paket otomatis berikutnya otomatis tersambung sebagai node baru!
// 3. Tanpa Deadline: Seluruh tryout selalu terbuka bertahap sesuai keaktifan siswa.
// 4. Desain visual Winding Path ala Duolingo Kosmik: Latar tosca cerah, fun,
//    ramah, ada roket & astronot Gemilang mengintip di pojok layar.
// 5. Analitik AI: Menganalisis akurasi, kekuatan subtes, dan kelemahan materi.
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Rocket, Lock, CheckCircle2, Star, Sparkles, Brain, Trophy,
  ChevronLeft, AlertCircle, Play, ShieldAlert, Timer, Award,
  Flame, BarChart3, HelpCircle, X, Compass, ExternalLink,
  Target, Zap,
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

/**
 * Membangun laporan breakdown penguasaan per subtes / per mapel murni (Benchmark AmbisPTN)
 * Memastikan analisis siswa terisolasi, objektif, dan tidak mencampur Matematika vs Bahasa Indonesia.
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

  const [loading, setLoading] = useState(true);
  const [paketOtomatisDb, setPaketOtomatisDb] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [unitTerpilih, setUnitTerpilih] = useState(null);
  const [modalReviewTerbuka, setModalReviewTerbuka] = useState(false);
  const [sedangMenyiapkan, setSedangMenyiapkan] = useState(false);
  const [pesanError, setPesanError] = useState('');

  // 1. Tarik paket otomatis Firestore & sesi KHUSUS siswa yang aktif login
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

        const [snapPaket, snapSesi1, snapSesi2] = await Promise.all([
          getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif'))),
          querySesi1,
          querySesi2,
        ]);

        if (!aktif) return;

        const allPaket = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Saring paket yang sesuai untuk jenjang siswa
        const kSiswa = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
        const paketSiswa = saringPaketUntukSiswa(allPaket, { ...profil, kelasSekolah: kSiswa, kelas: kSiswa });

        // Filter paket yang murni berasal dari generator otomatis AI / pemahaman
        const paketAi = paketSiswa.filter(isPaketOtomatisAi);

        // Urutkan dari paket paling awal (terlama) ke paling baru agar membentuk alur petualangan
        paketAi.sort((a, b) => {
          const ta = a.waktuBuka ? new Date(a.waktuBuka).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.waktuBuka ? new Date(b.waktuBuka).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        });

        // Gabungkan dan dedup sesi khusus siswa yang login aktif (mencegah data antar siswa tercampur)
        const mapSesi = new Map();
        (snapSesi1.docs || []).forEach((d) => mapSesi.set(d.id, { id: d.id, ...d.data() }));
        (snapSesi2.docs || []).forEach((d) => mapSesi.set(d.id, { id: d.id, ...d.data() }));

        setPaketOtomatisDb(paketAi);
        setSesiList(Array.from(mapSesi.values()));
      } catch (err) {
        console.error('Gagal memuat paket jalur AI:', err);
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
    const cetakBiru = getDaftarUnitJalurUjian(targetJenjang?.jenjang || 'SMP');

    // Hubungkan dengan dokumen database jika sudah ada paket tersimpan untuk unit ini
    return cetakBiru.map((unit) => {
      const paketDb = (paketOtomatisDb || []).find((p) => p.id === unit.id || p.unitId === unit.id);
      if (paketDb) {
        return {
          ...unit,
          paketIdAsli: paketDb.id,
          // Pertahankan batasan durasi micro-learning ramah siswa (15-25 menit, 10-15 butir)
          durasiMenit: paketDb.durasiMenit && paketDb.durasiMenit <= 30 ? paketDb.durasiMenit : unit.durasiMenit,
          jumlahSoal: paketDb.daftarSoal?.length && paketDb.daftarSoal.length <= 15 ? paketDb.daftarSoal.length : unit.jumlahSoal,
        };
      }
      return unit;
    });
  }, [paketOtomatisDb, targetJenjang]);

  // 3. Hitung status progresi personal siswa (setiap siswa memiliki jalan berbeda)
  const { unitList, totalUnit, selesaiCount, persentaseSelesai } = useMemo(() => {
    return hitungProgresiJalur(daftarUnit, sesiList);
  }, [daftarUnit, sesiList]);

  // Tab Filter Subtes / Mata Pelajaran Mandiri (Benchmark AmbisPTN Practice)
  const [filterSubtesAktif, setFilterSubtesAktif] = useState('semua');

  const daftarFilter = useMemo(() => {
    const j = targetJenjang?.jenjang || 'SMP';
    if (j === 'SMA') {
      return [
        { id: 'semua', label: '🌟 Semua Misi (8 Unit)' },
        { id: 'TPS', label: '🧠 TPS (PU, PK, PBM, PPU)' },
        { id: 'Literasi', label: '📖 Literasi (LBI, LBE, PM)' },
        { id: 'Simulasi', label: '🎯 Simulasi Terpadu' },
      ];
    }
    return [
      { id: 'semua', label: '🌟 Semua Misi (8 Unit)' },
      { id: 'Matematika', label: '📐 TKA Matematika (4 Unit)' },
      { id: 'Bahasa Indonesia', label: '📖 TKA B. Indonesia (3 Unit)' },
      { id: 'Simulasi', label: '🎯 Simulasi Terpadu' },
    ];
  }, [targetJenjang]);

  // Saring node unit yang tampil sesuai tab filter
  const unitListTampil = useMemo(() => {
    if (filterSubtesAktif === 'semua') return unitList;
    return unitList.filter((u) => {
      if (u.tipe === 'review') return true;
      return u.kategoriSubtes === filterSubtesAktif;
    });
  }, [unitList, filterSubtesAktif]);

  // 4. Target Kampus Siswa (Bagi jenjang SMA/UTBK)
  const keadaanTarget = useDataTargetKampus(studentId, profil);
  const targetKampusData = useMemo(() => {
    const perb = keadaanTarget?.perbandingan;
    const p1 = perb?.pilihan?.[0];
    if (!p1) return null;
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

  // 5. Analisis Perilaku & Kognitif oleh Asisten Belajar Gemilang (HANYA sesi Roadmap siswa yang aktif)
  const analisisBelajar = useMemo(() => {
    // Bangun breakdown skor per subtes / per mapel murni (Benckmark AmbisPTN)
    const breakdownSubtes = bangunBreakdownSubtes(unitList);

    // Kumpulan ID unit sah milik Roadmap ini
    const validRoadmapIds = new Set();
    daftarUnit.forEach((u) => {
      if (u.id) validRoadmapIds.add(u.id);
      if (u.paketIdAsli) validRoadmapIds.add(u.paketIdAsli);
      if (u.unitId) validRoadmapIds.add(u.unitId);
    });

    // Saring sesi yang HANYA milik siswa yang login DAN KHUSUS paket/unit di Roadmap ini
    const sesiRoadmapSelesai = (sesiList || [])
      .filter((s) => {
        if (s.status !== 'selesai') return false;
        // Pagar isolasi siswa ketat
        const cocokSiswa = s.studentId === studentId || (studentDocId && s.studentId === studentDocId);
        if (!cocokSiswa) return false;
        // Pagar isolasi unit roadmap (tidak boleh mencampur aduk try out reguler atau latihan luar)
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

    // 🔒 JIKA BELUM ADA UNIT ROADMAP YANG SELESAI (Misal Siswa Baru / Belum Mengerjakan)
    if (totalSesi === 0 || selesaiCount === 0) {
      const namaPanggilan = profil.nama ? profil.nama.split(' ')[0] : 'Sahabat Gemilang';
      return {
        sudahAdaData: false,
        skorTerakhir: null,
        skorRata: null,
        tempoDetik: null,
        kategoriTempo: 'Misi Belum Dimulai',
        evaluasiWaktu: `Halo ${namaPanggilan}! Ritme pengerjaan dan efisiensi waktumu per butir soal akan otomatis dianalisis setelah kamu menyelesaikan simulasi Unit 1.`,
        evaluasiWacana: 'Asisten Belajar Gemilang akan menganalisis daya tahan membacamu dalam membedah wacana panjang dan kekebalan terhadap distraktor setelah kamu menuntaskan Unit 1.',
        evaluasiHitung: 'Ketelitian rumus dan pemodelan aljabarmu akan terpetakan secara presisi setelah kamu mengumpulkan jawaban simulasi pertama.',
        pesanTanggungJawab: 'Setiap siswa memiliki potensi dan kurva belajar yang unik. Mulai dari Unit 1 (12 soal • 20 menit) untuk memetakan kekuatan belajarmu!',
        breakdownSubtes,
        sesiSelesai: [],
      };
    }

    const sesiTerakhir = sesiRoadmapSelesai[sesiRoadmapSelesai.length - 1];
    const skorTerakhir = Math.round(Number(sesiTerakhir.totalSkorPersen) || 0);
    const skorRata = Math.round(sesiRoadmapSelesai.reduce((acc, s) => acc + (Number(s.totalSkorPersen) || 0), 0) / totalSesi);

    // Hitung rata-rata detik per butir soal dari sesi Roadmap siswa ini
    const tempoArr = sesiRoadmapSelesai.map((s) => {
      const start = s.waktuMulaiMs || (s.createdAt?.toMillis ? s.createdAt.toMillis() : null);
      const end = s.waktuSelesai?.toMillis ? s.waktuSelesai.toMillis() : (s.waktuSelesaiMs || null);
      const n = s.totalSoal || (s.soalDinilaiIds || []).length || (s.daftarSoal || []).length || 12;
      if (start && end && end > start && n > 0) {
        return Math.round((end - start) / 1000 / n);
      }
      return null;
    }).filter(Boolean);

    const avgTempo = tempoArr.length ? Math.round(tempoArr.reduce((a, b) => a + b, 0) / tempoArr.length) : 60;
    const namaSiswa = profil.nama ? profil.nama.split(' ')[0] : 'Kamu';

    // Evaluasi Pacing Waktu
    let kategoriTempo = 'Taktis & Terukur';
    let evaluasiWaktu = '';
    if (avgTempo < 45) {
      kategoriTempo = 'Tempo Cepat (Cenderung Terburu-buru)';
      evaluasiWaktu = `${namaSiswa} menyelesaikan soal dengan tempo rata-rata ${avgTempo} detik/soal (sangat cepat). Daya tangkapmu sangat tangkas, namun tempo yang tergesa-gesa ini meningkatkan risiko blunder membaca instruksi terkecil.`;
    } else if (avgTempo <= 75) {
      kategoriTempo = 'Tempo Taktis & Terukur (Ideal)';
      evaluasiWaktu = `Ritme pengerjaan ${namaSiswa} sangat seimbang dan proporsional di angka ${avgTempo} detik/soal. Kamu mampu membagi waktu secara cerdas antara soal wacana dan penalaran hitungan.`;
    } else {
      kategoriTempo = 'Tempo Sangat Hati-hati (Perlu Alokasi Taktis)';
      evaluasiWaktu = `${namaSiswa} sangat cermat dengan tempo rata-rata ${avgTempo} detik/soal. Namun kebiasaan terjebak terlalu lama di 2-3 soal rumit di awal membuat energimu terkuras dan terburu-buru di nomor-nomor akhir.`;
    }

    // Evaluasi Wacana & Literasi (Disesuaikan dengan Akurasi Nyata Siswa)
    let evaluasiWacana = '';
    if (skorRata >= 85) {
      evaluasiWacana = `Daya tahan membacamu sangat solid (${skorRata}%). Kamu mampu menemukan ide pokok dan fakta tersirat tanpa mudah terperangkap oleh opsi distraktor kata negasi (seperti "kecuali" atau "pernyataan bertolak belakang").`;
    } else if (skorRata >= 65) {
      evaluasiWacana = `Pemahaman wacanamu cukup baik (${skorRata}%), namun kamu perlu menghemat waktu membaca dengan teknik membaca pertanyaan terlebih dahulu sebelum membaca seluruh wacana.`;
    } else {
      evaluasiWacana = `Akurasi wacanamu (${skorRata}%) menunjukkan indikasi kelelahan membaca. Kamu cenderung memilih opsi yang terlihat mirip di awal tanpa memverifikasi fakta di paragraf akhir.`;
    }

    // Evaluasi Ketelitian Matematis (Disesuaikan dengan Akurasi Nyata Siswa)
    let evaluasiHitung = '';
    if (skorRata >= 85) {
      evaluasiHitung = 'Presisi komputasi matematis sangat tinggi dengan indeks kecerobohan yang minim. Struktur penalaran dan penurunan aljabarmu sudah terstandarisasi dengan sangat baik.';
    } else if (skorRata >= 65) {
      evaluasiHitung = 'Konsep dasar aljabar dan hitunganmu sudah terbentuk, namun masih terjadi kecerobohan kecil pada perpindahan tanda (+/-) atau penyederhanaan bentuk akhir.';
    } else {
      evaluasiHitung = 'Perlu penguatan fundamental pada operasi bilangan rasional dan aljabar dasar. Hindari terburu-buru mengunci jawaban sebelum menguji kembali hasil substitusi.';
    }

    // Tanggung Jawab Belajar Pribadi
    let pesanTanggungJawab = '';
    if (skorRata >= 85) {
      pesanTanggungJawab = `Hebat, ${namaSiswa}! Capaianmu (${skorRata}%) sudah melampaui standar kelulusan (85.0%). Pertahankan konsistensi ini hingga seluruh unit terselesaikan!`;
    } else {
      pesanTanggungJawab = 'Terapkan strategi "Lewati 90 Detik": jika sebuah soal belum menemukan titik terang dalam 90 detik, tandai dan lanjutkan dulu untuk mengamankan nomor mudah. Kunci kelulusan berada di konsistensimu!';
    }

    return {
      sudahAdaData: true,
      skorTerakhir,
      skorRata,
      tempoDetik: avgTempo,
      kategoriTempo,
      evaluasiWaktu,
      evaluasiWacana,
      evaluasiHitung,
      pesanTanggungJawab,
      breakdownSubtes,
      sesiSelesai: sesiRoadmapSelesai,
    };
  }, [daftarUnit, sesiList, selesaiCount, studentId, studentDocId, profil, unitList]);

  // Handler klik node unit
  const handleKlikUnit = (unit) => {
    if (unit.tipe === 'review') {
      setModalReviewTerbuka(true);
      return;
    }
    setUnitTerpilih(unit);
  };

  // Handler meluncurkan ujian simulasi
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
      // Jika paket belum ada di database, siapkan
      if (!unit.paketIdAsli) {
        await pastikanPaketUnitTersedia(db, unit, targetJenjang?.jenjang || 'SMP');
      }
      navigate(`/siswa/tryout/${targetPaketId}?jalur=ai&unitNomor=${unit.unitNomor}`);
    } catch (err) {
      console.error('Gagal menyiapkan ujian:', err);
      setPesanError('Gagal membuka paket simulasi. Silakan periksa koneksi internet Anda.');
      setSedangMenyiapkan(false);
    }
  };

  // JIKA SISWA BUKAN KELAS AKHIR
  if (!targetJenjang) {
    return (
      <div style={st.bukanAkhIRWrapper || st.bukanAkhirWrapper}>
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
            ✨ Untuk kelasmu (<strong>{profil.kelas || 'Reguler'}</strong>), silakan nikmati menu <strong>Latihan Harian</strong> dan <strong>Materi Modul E-Learning</strong> untuk memperkuat nilai harian!
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

  // Hitung ketinggian dinamis peta berdasarkan jumlah unit yang tampil
  const tinggiMap = Math.max(680, unitListTampil.length * 145 + 180);

  return (
    <div style={st.container}>
      {/* Background garis topografi kosmik halus */}
      <div style={st.bgTopologyOverlay} aria-hidden="true" />

      {/* HEADER ATAS: TOMBOL KEMBALI, BADGE JENJANG, AVATAR, & REVIEW */}
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
                {selesaiCount}/{totalUnit} Misi Dituntaskan
              </span>
            </div>
            <h1 style={st.headerJudul}>{targetJenjang.subJudul}</h1>
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
                      : 'Mulai Ujian untuk Membaca GAP'}
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
                  {targetJenjang.jenjang === 'SMP' ? 'Standarisasi TKA SMP (Kelas 7, 8 & 9) Menuju SMA Unggulan' : 'Asesmen Standarisasi TKA SD Menuju SMP Favorit'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  Standar Kelulusan: <span style={{ color: '#0d9488' }}>85.0</span> • Akurasi Terkini: <b>{analisisBelajar.skorRata != null ? `${analisisBelajar.skorRata}%` : 'Mulai Tahap 1'}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🧭 TAB NAVIGASI SUBTES (BENCHMARK AMBISPTN PRACTICE) */}
      <div style={st.tabFilterSubtesWrap}>
        <div style={st.tabFilterSubtesScroll}>
          {daftarFilter.map((f) => {
            const isAktif = filterSubtesAktif === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterSubtesAktif(f.id)}
                style={{
                  ...st.btnFilterSubtes,
                  background: isAktif ? '#0f766e' : 'rgba(255, 255, 255, 0.92)',
                  color: isAktif ? '#ffffff' : '#0f766e',
                  border: isAktif ? '1.5px solid #0f766e' : '1.5px solid rgba(255, 255, 255, 0.7)',
                  boxShadow: isAktif ? '0 4px 12px rgba(15, 118, 110, 0.35)' : '0 2px 6px rgba(0,0,0,0.06)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 🗺️ PETA JALUR BERLIKU (WINDING GAME PATH) ALA DUOLINGO       */}
      {/* ============================================================ */}
      <main style={{ ...st.mapStageWrapper, height: tinggiMap }}>
        {/* SVG KURVA JALUR BERLIKU PUTIH PUTUS-PUTUS TEBAL */}
        <svg
          style={st.svgJalur}
          viewBox={`0 0 360 ${tinggiMap}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Path berliku dinamis menghubungkan dari node bawah ke atas */}
          {unitListTampil.map((u, i) => {
            if (i >= unitListTampil.length - 1) return null;
            // Node i ada di posisi (x1, y1), Node i+1 di (x2, y2)
            const y1 = tinggiMap - 120 - i * 145;
            const y2 = tinggiMap - 120 - (i + 1) * 145;
            const isTopReviewNext = i + 1 === unitListTampil.length - 1;
            const x1 = i === 0 ? 180 : i % 2 === 1 ? 100 : 260;
            const x2 = isTopReviewNext ? 180 : (i + 1) % 2 === 1 ? 100 : 260;
            const cx1 = x1;
            const cy1 = (y1 + y2) / 2;
            const cx2 = x2;
            const cy2 = (y1 + y2) / 2;

            return (
              <path
                key={u.id}
                d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                stroke="#ffffff"
                strokeWidth="5"
                strokeDasharray="9 9"
                strokeLinecap="round"
                opacity="0.92"
              />
            );
          })}
        </svg>

        {/* ORNAMEN KOSMIK GEMILANG DI SEKITAR JALUR */}
        <div style={{ ...st.ornamenKosmik, top: '15%', right: '12%' }}>🪐</div>
        <div style={{ ...st.ornamenKosmik, top: '35%', left: '10%' }}>⭐</div>
        <div style={{ ...st.ornamenKosmik, top: '55%', right: '14%' }}>☄️</div>
        <div style={{ ...st.ornamenKosmik, top: '75%', left: '12%' }}>✨</div>

        {/* RENDER NODE-NODE BERTAHAP SECARA BERLIKU DARI BAWAH KE ATAS */}
        {unitListTampil.map((unit, idx) => {
          const yPos = tinggiMap - 120 - idx * 145;
          const isTopReview = unit.tipe === 'review';
          const xPos = isTopReview ? '50%' : idx === 0 ? '50%' : idx % 2 === 1 ? '28%' : '72%';

          if (isTopReview) {
            return (
              <div
                key={unit.id}
                style={{ ...st.nodeContainer, top: yPos - 20, left: xPos, transform: 'translateX(-50%)' }}
              >
                <button
                  type="button"
                  onClick={() => setModalReviewTerbuka(true)}
                  style={st.tombolCapsuleReview}
                >
                  <Brain size={18} color="#0d9488" />
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#0f766e' }}>Review Hasil</span>
                </button>
              </div>
            );
          }

          if (unit.unitNomor === 1) {
            return (
              <div
                key={unit.id}
                style={{ ...st.nodeContainer, top: yPos - 45, left: xPos, transform: 'translateX(-50%)' }}
              >
                <KomponenNodeStart unit={unit} onKlik={handleKlikUnit} />
              </div>
            );
          }

          return (
            <div
              key={unit.id}
              style={{ ...st.nodeContainer, top: yPos - 38, left: xPos, transform: 'translateX(-50%)' }}
            >
              <KomponenNodeUnit unit={unit} onKlik={handleKlikUnit} />
            </div>
          );
        })}

        {/* MASKOT ASTRO GEMILANG MENGINTIP CERIA DI POJOK KANAN BAWAH */}
        <div style={st.maskotMengintip} title="Hai! Aku Master G, pemandumu di Roadmap Kemampuan!">
          <div style={{ position: 'relative' }}>
            <MaskotAstronot size={88} />
            <div style={st.balonBicaraMaskot}>
              Ayo selesaikan misimu! 🚀
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL SHEET DETAIL UNIT SIMULASI                             */}
      {/* ============================================================ */}
      {unitTerpilih && (
        <div style={st.overlayModal} onClick={() => setUnitTerpilih(null)}>
          <div style={st.sheetModal} onClick={(e) => e.stopPropagation()}>
            <div style={st.dragHandle} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: unitTerpilih.status === 'completed' ? '#d1fae5' : unitTerpilih.status === 'current' ? '#ffedd5' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unitTerpilih.status === 'completed' ? (
                    <CheckCircle2 size={26} color="#059669" />
                  ) : unitTerpilih.status === 'current' ? (
                    <Rocket size={26} color="#ea580c" />
                  ) : (
                    <Lock size={26} color="#64748b" />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                    Tahap {unitTerpilih.unitNomor} • {targetJenjang.namaUjian}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                    {unitTerpilih.judul}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnitTerpilih(null)}
                style={st.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Lencana Ramah: Micro-learning / Penguasaan Pola Kilat */}
            <div style={{
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 700,
              color: '#0f766e',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Zap size={15} color="#0d9488" style={{ flexShrink: 0 }} />
              <span>Latihan Kilat 15–20 Menit: Kuasai Pola Ini untuk Menaklukkan Ujian! ⚡</span>
            </div>

            {unitTerpilih.polaFokus && (
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#475569',
                marginBottom: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}>
                🎯 Target Pola: <strong>{unitTerpilih.polaFokus}</strong>
              </div>
            )}

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              {unitTerpilih.deskripsi}
            </p>

            <div style={st.gridSpesifikasi}>
              <div style={st.kotakSpek}>
                <Timer size={18} color="#0d9488" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Waktu Ujian</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{unitTerpilih.durasiMenit} Menit</div>
                </div>
              </div>
              <div style={st.kotakSpek}>
                <Award size={18} color="#0d9488" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Jumlah Butir</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{unitTerpilih.jumlahSoal} Soal</div>
                </div>
              </div>
              <div style={st.kotakSpek}>
                <ShieldAlert size={18} color="#f97316" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Pengawasan</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Anti-Cheat Online</div>
                </div>
              </div>
              <div style={st.kotakSpek}>
                <Flame size={18} color="#eab308" />
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Bonus Hadiah</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>+{unitTerpilih.xpReward} XP</div>
                </div>
              </div>
            </div>

            {unitTerpilih.status === 'completed' && (
              <div style={st.kartuHasilSelesai}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Misi Telah Selesai Dikerjakan</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#78350f' }}>
                      Akurasi Skor: {unitTerpilih.skor}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {unitTerpilih.status === 'locked' && (
              <div style={st.kartuStatusLocked}>
                <Lock size={20} color="#b45309" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e' }}>
                  Unit ini masih terkunci. Selesaikan Tahap {unitTerpilih.unitNomor - 1} terlebih dahulu untuk membuka tahap ini.
                </span>
              </div>
            )}

            {pesanError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10, color: '#b91c1c', fontSize: 12, marginTop: 12 }}>
                {pesanError}
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              {unitTerpilih.status === 'current' ? (
                <button
                  type="button"
                  disabled={sedangMenyiapkan}
                  onClick={() => handleMulaiUjian(unitTerpilih)}
                  style={st.btnLuncurkanUjian}
                >
                  <Rocket size={20} />
                  <span>{sedangMenyiapkan ? 'Menyiapkan Simulasi...' : 'Mulai Simulasi Ujian 🚀'}</span>
                </button>
              ) : unitTerpilih.status === 'completed' ? (
                <button
                  type="button"
                  onClick={() => {
                    setUnitTerpilih(null);
                    setModalReviewTerbuka(true);
                  }}
                  style={st.btnBukaAnalisisUtama}
                >
                  <Brain size={18} />
                  <span>Buka Analisis Asisten Belajar Gemilang 🧠</span>
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, padding: '6px 0' }}>
                  Selesaikan tahap sebelumnya untuk melanjutkan misi ini
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL REVIEW & ANALISIS KEMAMPUAN BELAJAR AI                 */}
      {/* ============================================================ */}
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

            {/* 🎯 KARTU TARGET KAMPUS & PENGUKURAN GAP */}
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
                        : 'Mulai Ujian Tahap 1'}
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

            {/* 🧠 3 KARTU ANALISIS KOGNITIF & PERILAKU */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
              {/* Dimensi 1: Ritme & Pacing */}
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

              {/* Dimensi 2: Daya Tahan Wacana Panjang */}
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

              {/* Dimensi 3: Presisi Komputasi */}
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

              {/* Prinsip Belajar Mandiri Berkelanjutan */}
              <div style={st.kartuRefleksiMandiri}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <Brain size={16} color="#047857" />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#065f46' }}>
                    Tanggung Jawab Belajar Pribadi
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#047857', lineHeight: 1.5, margin: 0 }}>
                  {analisisBelajar.pesanTanggungJawab}
                </p>
              </div>
            </div>

            {/* BANNER AJAKAN MULAI BILA BELUM ADA PENGERJAAN SAMA SEKALI */}
            {!analisisBelajar.sudahAdaData && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px dashed #86efac',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#166534', marginBottom: 4 }}>
                  🌱 Misi Roadmap Belum Dimulai
                </div>
                <p style={{ fontSize: 12, color: '#15803d', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Halo <strong>{profil.nama || 'Siswa'}</strong>! Selesaikan simulasi Unit 1 (12 soal • 20 menit) untuk mengaktifkan radar kemampuan kognitif, mengukur tempo pengerjaan, dan melihat evaluasi personal Asisten Belajar Gemilang.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModalReviewTerbuka(false);
                    const u1 = unitList.find((u) => u.unitNomor === 1) || unitList[0];
                    if (u1) handleKlikUnit(u1);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 18px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  🚀 Mulai Unit 1 Sekarang (20 Menit)
                </button>
              </div>
            )}

            {/* 📊 DIAGNOSA PENGUASAAN SUBTES / MAPEL (FORMAT AMBISPTN BENCHMARK) */}
            <div style={st.kartuBreakdownSubtes}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <BarChart3 size={17} color="#0d9488" />
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f766e' }}>
                    Diagnosa Penguasaan Subtes / Mapel
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                  Standar {targetJenjang.jenjang === 'SMA' ? '7 Subtes SNPMB' : 'TKA Mandiri'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(analisisBelajar.breakdownSubtes || []).map((stItem) => (
                  <div key={stItem.kode} style={st.barisBreakdownItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>
                        {stItem.nama}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {stItem.sudahSelesai ? (
                          <span style={{ fontWeight: 900, color: stItem.warna, fontSize: 13 }}>
                            {stItem.skorRata}%
                          </span>
                        ) : null}
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: stItem.sudahSelesai ? (stItem.skorRata >= 80 ? '#dcfce7' : stItem.skorRata >= 65 ? '#dbeafe' : '#fef3c7') : '#f1f5f9',
                          color: stItem.warna,
                        }}>
                          {stItem.labelStatus}
                        </span>
                      </div>
                    </div>

                    <div style={st.barSubtesTrack}>
                      <div style={{
                        height: '100%',
                        width: stItem.sudahSelesai ? `${Math.min(100, Math.max(5, stItem.skorRata))}%` : '0%',
                        background: stItem.warna,
                        borderRadius: 99,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HISTORI CAPAIAN MISI */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                Histori Capaian Jalur Misi:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {unitList.filter((u) => u.tipe !== 'review').map((u) => (
                  <div key={u.id} style={st.barisHistoriUnit}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: u.status === 'completed' ? '#d1fae5' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {u.status === 'completed' ? <CheckCircle2 size={16} color="#059669" /> : <Lock size={15} color="#94a3b8" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{u.judul}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{u.mapel}</div>
                      </div>
                    </div>
                    <div>
                      {u.status === 'completed' ? (
                        <span style={st.badgeSkorSelesai}>{u.skor}%</span>
                      ) : (
                        <span style={st.badgeBelumSelesai}>{u.status === 'current' ? 'Bisa Mulai' : 'Terkunci'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalReviewTerbuka(false)}
              style={st.btnTutupReview}
            >
              Kembali ke Peta Jalur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// KOMPONEN NODE START (BESAR, BULAT, ORANYE HANGAT)
// ============================================================
function KomponenNodeStart({ unit, onKlik }) {
  const isCompleted = unit.status === 'completed';
  const labelSubtes = unit.subtesKode
    ? (unit.subtesKode === 'MTK' ? 'TKA MTK' : unit.subtesKode === 'BINDO' ? 'TKA B. Indo' : unit.subtesKode)
    : (unit.mapel || 'Unit 1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => onKlik(unit)}
        style={{
          ...st.btnNodeStart,
          background: isCompleted
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #fb923c 0%, #f97316 60%, #ea580c 100%)',
          boxShadow: isCompleted
            ? '0 10px 24px rgba(16, 185, 129, 0.45), inset 0 2px 4px rgba(255,255,255,0.4)'
            : '0 10px 24px rgba(249, 115, 22, 0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
        }}
        title={`Tahap ${unit.unitNomor}: ${unit.judul}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isCompleted ? (
            <CheckCircle2 size={32} color="#ffffff" strokeWidth={2.5} />
          ) : (
            <Rocket size={34} color="#ffffff" strokeWidth={2.4} />
          )}
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', marginTop: 2, letterSpacing: 0.5 }}>
            {isCompleted ? 'SELESAI' : 'START'}
          </span>
        </div>
      </button>

      <div style={st.labelNodeBawah}>
        <span style={{ fontWeight: 800, color: '#064e3b', fontSize: 11.5 }}>
          Unit 1 • {labelSubtes}
        </span>
        {isCompleted && (
          <span style={{ fontSize: 11, fontWeight: 800, color: '#047857', marginLeft: 4 }}>
            ({unit.skor}%)
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN NODE UNIT TAHAP BERIKUTNYA
// ============================================================
function KomponenNodeUnit({ unit, onKlik }) {
  const isCompleted = unit.status === 'completed';
  const isCurrent = unit.status === 'current';
  const labelSubtes = unit.subtesKode
    ? (unit.subtesKode === 'MTK' ? 'TKA MTK' : unit.subtesKode === 'BINDO' ? 'TKA B. Indo' : unit.subtesKode === 'TERPADU' ? 'Simulasi Terpadu' : unit.subtesKode)
    : (unit.mapel || `Unit ${unit.unitNomor}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => onKlik(unit)}
        style={{
          ...st.btnNodeUnit,
          background: isCompleted
            ? 'linear-gradient(135deg, #34d399 0%, #059669 100%)'
            : isCurrent
              ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              : 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
          opacity: unit.status === 'locked' ? 0.85 : 1,
          boxShadow: isCurrent
            ? '0 0 0 6px rgba(251, 191, 36, 0.35), 0 8px 20px rgba(245, 158, 11, 0.45)'
            : isCompleted
              ? '0 8px 18px rgba(16, 185, 129, 0.35)'
              : '0 6px 14px rgba(13, 148, 136, 0.35)',
        }}
        title={`Tahap ${unit.unitNomor}: ${unit.judul}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isCompleted ? (
            <Star size={24} color="#ffffff" fill="#ffffff" />
          ) : isCurrent ? (
            <Play size={24} color="#ffffff" fill="#ffffff" />
          ) : (
            <Lock size={22} color="#ffffff" strokeWidth={2.4} />
          )}
          <span style={{ fontSize: 11.5, fontWeight: 900, color: '#ffffff', marginTop: 1 }}>
            {unit.unitNomor}
          </span>
        </div>
      </button>

      <div style={st.labelNodeBawah}>
        <span style={{ fontWeight: 800, color: '#064e3b', fontSize: 11 }}>
          Unit {unit.unitNomor} • {labelSubtes}
        </span>
        {isCompleted && (
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#047857', marginLeft: 3 }}>
            ({unit.skor}%)
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STYLES OBJECT (TEMA HIJAU TOSCA CERAH FUN KOSMIK GEMILANG)
// ============================================================
const st = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
    position: 'relative',
    overflowX: 'hidden',
    paddingBottom: 90,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  bgTopologyOverlay: {
    position: 'absolute',
    inset: 0,
    opacity: 0.12,
    backgroundImage: `radial-gradient(circle at 20% 30%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 70%, #ffffff 1.5px, transparent 1.5px)`,
    backgroundSize: '40px 40px, 60px 60px',
    pointerEvents: 'none',
  },
  headerBar: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
  },
  headerJudul: {
    fontSize: 15,
    fontWeight: 800,
    color: '#ffffff',
    margin: '2px 0 0',
    textShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  badgeJenjang: {
    fontSize: 10,
    fontWeight: 900,
    color: '#ffffff',
    background: '#f97316',
    padding: '2px 7px',
    borderRadius: 99,
    letterSpacing: 0.5,
  },
  btnLingkaranPutih: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
  },
  btnReviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#ffffff',
    border: 'none',
    padding: '7px 14px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 800,
    color: '#0f766e',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  avatarBulat: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
  },
  barProgresBungkus: {
    position: 'relative',
    zIndex: 10,
    margin: '12px 16px 0',
    background: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    padding: '10px 14px',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.15)',
  },
  tabFilterSubtesWrap: {
    position: 'relative',
    zIndex: 10,
    margin: '10px 16px 14px',
  },
  tabFilterSubtesScroll: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    overflowX: 'auto',
    paddingBottom: 4,
    scrollbarWidth: 'none',
  },
  btnFilterSubtes: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  kartuBreakdownSubtes: {
    background: '#ffffff',
    border: '1.5px solid #ccfbf1',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 14,
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.08)',
  },
  barisBreakdownItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  barSubtesTrack: {
    height: 7,
    background: '#e2e8f0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarTrack: {
    height: 8,
    background: '#e2e8f0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #059669)',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  mapStageWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 420,
    margin: '0 auto',
  },
  svgJalur: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  nodeContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  btnNodeStart: {
    width: 92,
    height: 92,
    borderRadius: '50%',
    border: '4px solid #ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  },
  btnNodeUnit: {
    width: 74,
    height: 74,
    borderRadius: '50%',
    border: '3.5px solid #ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  },
  labelNodeBawah: {
    marginTop: 6,
    background: 'rgba(255, 255, 255, 0.94)',
    padding: '3px 10px',
    borderRadius: 99,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: 165,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tombolCapsuleReview: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 24px',
    borderRadius: 99,
    background: '#ffffff',
    border: '3px solid #ccfbf1',
    boxShadow: '0 6px 18px rgba(13, 148, 136, 0.3)',
    cursor: 'pointer',
  },
  ornamenKosmik: {
    position: 'absolute',
    fontSize: 26,
    pointerEvents: 'none',
    opacity: 0.85,
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
  },
  maskotMengintip: {
    position: 'absolute',
    bottom: 25,
    right: -4,
    zIndex: 8,
    cursor: 'pointer',
  },
  balonBicaraMaskot: {
    position: 'absolute',
    top: -24,
    right: 35,
    background: '#ffffff',
    color: '#0f766e',
    fontSize: 10.5,
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: 8,
    boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
    whiteSpace: 'nowrap',
  },
  // Modal Styles
  overlayModal: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheetModal: {
    width: '100%',
    maxWidth: 480,
    background: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: '12px 20px 30px',
    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.25s ease-out',
  },
  sheetReviewModal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: '12px 20px 30px',
    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
  },
  dragHandle: {
    width: 44,
    height: 5,
    background: '#cbd5e1',
    borderRadius: 99,
    margin: '0 auto 16px',
  },
  btnCloseModal: {
    background: '#f1f5f9',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  gridSpesifikasi: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  kotakSpek: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  kartuHasilSelesai: {
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: 14,
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnLihatAnalisisKecil: {
    background: '#d97706',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 11.5,
    cursor: 'pointer',
  },
  kartuStatusLocked: {
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  btnLuncurkanUjian: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(234, 88, 12, 0.35)',
  },
  btnKerjakanUlang: {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnTutupModal: {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    background: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  // Review Modal Styles
  iconReviewCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: '#ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kartuRingkasanPerform: {
    background: 'linear-gradient(135deg, #ccfbf1 0%, #e6fffa 100%)',
    border: '1px solid #99f6e4',
    borderRadius: 16,
    padding: '16px',
    marginBottom: 16,
  },
  barisHistoriUnit: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 12,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  badgeSkorSelesai: {
    fontSize: 12,
    fontWeight: 800,
    color: '#047857',
    background: '#d1fae5',
    padding: '3px 8px',
    borderRadius: 99,
  },
  badgeBelumSelesai: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    background: '#e2e8f0',
    padding: '3px 8px',
    borderRadius: 99,
  },
  kartuSaranAi: {
    background: '#f5f3ff',
    border: '1px solid #ddd6fe',
    borderRadius: 14,
    padding: '14px',
    marginBottom: 20,
  },
  btnTutupReview: {
    width: '100%',
    padding: '13px',
    borderRadius: 14,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
  // Target Kampus & Analisis Asisten Belajar Gemilang
  kartuTargetGoalWrap: {
    margin: '10px 16px 0',
    position: 'relative',
    zIndex: 10,
  },
  kartuTargetGoalInner: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: '12px 14px',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  kartuTargetBelumAda: {
    background: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    padding: '12px 14px',
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  badgeKampusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  btnUbahTargetKecil: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnPasangTargetSekarang: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '7px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(13,148,136,0.3)',
  },
  btnBukaAnalisisUtama: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 14.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(13, 148, 136, 0.35)',
  },
  kartuGapKampusWrap: {
    background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    border: '1px solid #99f6e4',
    borderRadius: 14,
    padding: '12px 14px',
    marginBottom: 12,
  },
  kartuDimensiPerilaku: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '11px 13px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  badgeDimensiAi: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#0f766e',
    background: '#ccfbf1',
    padding: '2px 8px',
    borderRadius: 99,
  },
  teksDimensiAi: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 1.55,
    margin: 0,
  },
  kartuRefleksiMandiri: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 12,
    padding: '11px 13px',
  },
  // Bukan Jenjang Akhir Styles
  bukanAkhirWrapper: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  kartuBukanAkhir: {
    maxWidth: 420,
    background: '#ffffff',
    borderRadius: 20,
    padding: '28px 20px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  tombolKembaliBeranda: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
};
