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
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, deleteDoc, addDoc } from 'firebase/firestore';
import {
  Rocket, Lock, CheckCircle2, Star, Sparkles, Brain, Trophy,
  ChevronLeft, AlertCircle, Play, ShieldAlert, Timer, Award,
  Flame, BarChart3, HelpCircle, X, Compass, ExternalLink,
  Target, Zap, RotateCcw, ArrowRight, BookOpen, Layers, Check, Scissors,
  GraduationCap, Download,
} from 'lucide-react';
import { DAFTAR_SUBTES_SMP, SEMUA_BAB_SMP } from '../../../data/tkaSmpModulData.js';
import { DAFTAR_SUBTES_MODUL, SEMUA_BAB_MODUL } from '../../../data/ambisModulUtbkData.js';
import RenderMath from '../../../components/RenderMath';
import PetaGunungPendakian from '../../../components/tryout/PetaGunungPendakian';
import { hitungKuotaPendakianMingguIni, muatPosisiTemanPendakian } from '../../../utils/kuotaPendakian';
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
  resetProgresLatihanSiswa,
  normalisasiButir,
} from '../../../data/ambisLatihanBankSoal';
import AmbisPracticePlayer from '../../../components/latihan/AmbisPracticePlayer';
import { htmlPaketSiswa } from '../../../utils/cetakLatihan';
import { cetakLewatIframe } from '../../../utils/kwitansi';

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

function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export default function JalurUjianAiPage() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // HANYA Kelas 9 SMP untuk TKA SMP, dan HANYA Kelas 12 SMA untuk UTBK-SNBT
  const isSmp = targetJenjang?.jenjang === 'SMP' && targetJenjang?.kelas === '9';
  const isUtbk = targetJenjang?.jenjang === 'SMA' && targetJenjang?.kelas === '12';
  const isSd = false; // TKA SD BELUM DI BUAT (Sesuai arahan owner)

  // Daftar Subtes Dinamis (SMP: MTK, BIN, IPA, BIG; SD: MTK, BIN; SMA: 7 Subtes UTBK)
  const daftarSubtes = useMemo(() => {
    return getSubtesLatihanList(targetJenjang?.jenjang || 'SMA');
  }, [targetJenjang]);

  const daftarSubtesModul = useMemo(() => {
    return isSmp ? DAFTAR_SUBTES_SMP : DAFTAR_SUBTES_MODUL;
  }, [isSmp]);

  const semuaBabModul = useMemo(() => {
    return isSmp ? SEMUA_BAB_SMP : SEMUA_BAB_MODUL;
  }, [isSmp]);

  // 3 Pilar Kelas Pendampingan:
  // 'latihan_kelas' (Tugas Bersama Tentor & Buku Besar)
  // 'modul_materi' (Modul Teori TKA/UTBK)
  // 'ambis_practice' (Latihan Mandiri AI Kuota Mingguan)
  const [tabTampilan, setTabTampilan] = useState(() => {
    const params = new URLSearchParams(location.search || '');
    const t = params.get('tab');
    if (t === 'ekspedisi_jalur' || t === 'peta_jalur') return 'ekspedisi_jalur';
    if (location.pathname.includes('/roadmap')) return 'ekspedisi_jalur';
    return 'latihan_kelas';
  });
  const [temanPendakian, setTemanPendakian] = useState({ temanList: [], perPos: new Map() });
  const [daftarTerbitanTentor, setDaftarTerbitanTentor] = useState([]);
  const [subtesModulTerpilih, setSubtesModulTerpilih] = useState('ALL');
  const [subtesSilabusTerpilih, setSubtesSilabusTerpilih] = useState(() => (targetJenjang?.jenjang === 'SMP' ? 'MTK' : targetJenjang?.jenjang === 'SD' ? 'MTK' : 'PU'));

  // Kuota Latihan Mandiri Mingguan (1x per pekan)
  const weekKey = useMemo(() => getWeekKey(), []);
  const [subtesKilatTerpilih, setSubtesKilatTerpilih] = useState(() => (targetJenjang?.jenjang === 'SMP' ? 'MTK' : targetJenjang?.jenjang === 'SD' ? 'MTK' : 'PU'));
  const storageWeeklyKey = useMemo(() => {
    return `gemilang_weekly_drill_${studentId || studentDocId || 'default'}_${subtesKilatTerpilih}_${weekKey}`;
  }, [studentId, studentDocId, subtesKilatTerpilih, weekKey]);
  const [misiMingguanData, setMisiMingguanData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paketOtomatisDb, setPaketOtomatisDb] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [bankSoalFirestore, setBankSoalFirestore] = useState([]);
  const [unitTerpilih, setUnitTerpilih] = useState(null);
  const [modalReviewTerbuka, setModalReviewTerbuka] = useState(false);
  const [sedangMenyiapkan, setSedangMenyiapkan] = useState(false);
  const [pesanError, setPesanError] = useState('');

  // State untuk AmbisPTN Practice
  const [modeLatihan, setModeLatihan] = useState('Active Recall'); // 'Active Recall' | 'Basic'
  const [subtesDetailModal, setSubtesDetailModal] = useState(null); // Subtes yang sedang dibuka rincian paketnya
  const [sesiLatihanAktif, setSesiLatihanAktif] = useState(null); // Sesi player pengerjaan aktif

  // State update counter latihan siswa
  const [refreshLatihanTick, setRefreshLatihanTick] = useState(0);

  // Pastikan subtesKilatTerpilih sinkron dengan daftar subtes jenjang aktif
  useEffect(() => {
    if (daftarSubtes && daftarSubtes.length > 0) {
      if (!daftarSubtes.some((s) => s.kode === subtesKilatTerpilih)) {
        setSubtesKilatTerpilih(daftarSubtes[0].kode);
      }
    }
  }, [daftarSubtes, subtesKilatTerpilih]);

  // Efek memuat data kuota latihan mandiri mingguan
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageWeeklyKey);
      if (raw) {
        setMisiMingguanData(JSON.parse(raw));
      } else {
        setMisiMingguanData(null);
      }
    } catch (e) {
      setMisiMingguanData(null);
    }
  }, [storageWeeklyKey, refreshLatihanTick]);

  // Efek memuat paket terbitan dari tentor untuk kelas pendampingan
  useEffect(() => {
    async function muatTerbitan() {
      let list = [];
      try {
        const snap = await getDocs(collection(db, 'kelas_pendampingan_terbitan'));
        snap.forEach((d) => list.push({ docId: d.id, ...d.data() }));
      } catch (e) {
        console.warn('Muat firestore terbitan fallback ke local:', e);
      }
      if (list.length === 0) {
        try {
          list = JSON.parse(localStorage.getItem('gemilang_paket_pendampingan_terbitan') || '[]');
        } catch (err) {
          list = [];
        }
      }
      const jenjangSiswa = targetJenjang?.jenjang || 'SMA';
      const disaring = list.filter((p) => {
        if (!p.jenjang) return true;
        return p.jenjang.toUpperCase() === jenjangSiswa.toUpperCase();
      });
      setDaftarTerbitanTentor(disaring.length > 0 ? disaring : list);
    }
    muatTerbitan();
  }, [targetJenjang, refreshLatihanTick]);

  // Pemeriksa apakah suatu paket silabus resmi sudah dibuka kuncinya oleh tentor di kelas
  const isPaketDibukaTentor = useCallback((paket) => {
    if (!paket || !daftarTerbitanTentor || daftarTerbitanTentor.length === 0) return false;
    return daftarTerbitanTentor.some((t) => {
      if (t.status && t.status !== 'aktif') return false;
      if (t.terbuka === false) return false;
      if (t.id === paket.id || t.paketId === paket.id) return true;
      if (
        t.babNomor != null &&
        paket.babNomor != null &&
        Number(t.babNomor) === Number(paket.babNomor) &&
        t.paketNomor != null &&
        paket.paketNomor != null &&
        Number(t.paketNomor) === Number(paket.paketNomor)
      ) {
        return true;
      }
      if (t.judul && paket.judul) {
        const jT = t.judul.toLowerCase();
        const jP = paket.judul.toLowerCase();
        if (jT === jP || jT.includes(jP) || jP.includes(jT)) return true;
      }
      if (t.judulPaket && paket.judul) {
        const jT = t.judulPaket.toLowerCase();
        const jP = paket.judul.toLowerCase();
        if (jT === jP || jT.includes(jP) || jP.includes(jT)) return true;
      }
      return false;
    });
  }, [daftarTerbitanTentor]);

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
        const querySumber = getDocs(collection(db, 'sumber_soal')).catch((e) => {
          console.warn('Gagal memuat sumber_soal:', e);
          return { docs: [] };
        });

        const [snapPaket, snapSesi1, snapSesi2, snapBankSoal, snapSumberSoal] = await Promise.all([
          getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif'))),
          querySesi1,
          querySesi2,
          queryBank,
          querySumber,
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

        // Identifikasi folder sumber (sumber_soal) khusus TKA / Pendampingan
        const folders = (snapSumberSoal.docs || []).map((d) => ({ id: d.id, ...d.data() }));
        const folderMap = new Map();
        folders.forEach((f) => folderMap.set(f.id, f));

        const tkaFolderIds = new Set(
          folders
            .filter((f) => {
              const jn = String(f.jenisUjian || '').toUpperCase();
              const nm = String(f.judul || f.nama || '').toLowerCase();
              const jg = String(f.jenjang || '').toUpperCase();
              return (
                jn === 'TKA' ||
                nm.includes('tka') ||
                nm.includes('pendampingan') ||
                (jg.includes('SMP') && !nm.includes('reguler') && !nm.includes('ulangan'))
              );
            })
            .map((f) => f.id)
        );

        const allBankSoal = (snapBankSoal.docs || [])
          .map((d) => {
            const data = d.data();
            const folder = data.sumberSoalId ? folderMap.get(data.sumberSoalId) : null;
            return {
              id: d.id,
              ...data,
              folderNama: folder ? (folder.judul || folder.nama || '') : (data.folderNama || ''),
              sumberSoalNama: folder ? (folder.judul || folder.nama || '') : (data.sumberSoalNama || ''),
            };
          })
          .filter((d) => d.status !== 'dihapus');

        // Filter ketat isolasi: Khusus SMP, HANYA ambil butir soal dari Folder TKA pengguna atau jenisUjian TKA
        let bankSoalTersaring = allBankSoal;
        if (isSmp) {
          bankSoalTersaring = allBankSoal.filter((s) => {
            const isDariFolderTka = s.sumberSoalId && tkaFolderIds.has(s.sumberSoalId);
            const isJenisTka = String(s.jenisUjian || '').toUpperCase() === 'TKA';
            const isTagTka = Array.isArray(s.tags) && s.tags.some((t) => String(t).toUpperCase().includes('TKA'));
            const isFolderNamaTka = (
              String(s.folderNama || '').toLowerCase().includes('tka') ||
              String(s.folderNama || '').toLowerCase().includes('pendampingan')
            );

            // Jika ada sumberSoalId dan BUKAN folder TKA, jangan masukkan
            if (s.sumberSoalId && !isDariFolderTka && !isJenisTka && !isFolderNamaTka) {
              return false;
            }

            // Jika soal orphan tanpa folder, harus eksplisit jenisUjian TKA
            if (!s.sumberSoalId && !isJenisTka && !isTagTka) {
              return false;
            }

            // Buang mapel non-TKA (IPS, Geografi, Sejarah, PPKN, Agama)
            const sm = String(s.mataPelajaran || s.mapel || s.subtes || '').toLowerCase();
            const st = (String(s.materi || '') + ' ' + String(s.bab || '') + ' ' + String(s.teksSoal || s.soal || '')).toLowerCase();
            if (
              sm.includes('ips') || sm.includes('geografi') || sm.includes('ekonomi') ||
              sm.includes('sosiologi') || sm.includes('sejarah') || sm.includes('agama') ||
              sm.includes('ppkn') || sm.includes('pancasila') || st.includes('keragaman alam indonesia') ||
              st.includes('fauna indonesia') || st.includes('garis khayal bio-geografi') ||
              st.includes('garis wallace')
            ) {
              return false;
            }

            return true;
          });
        }

        setPaketOtomatisDb(paketAi);
        setSesiList(Array.from(mapSesi.values()));
        setBankSoalFirestore(bankSoalTersaring);
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

  // 3. Progresi personal ekspedisi jalur & kuota pendakian mingguan (maks 2x/minggu)
  const { unitList, totalUnit, selesaiCount, persentaseSelesai } = useMemo(() => {
    return hitungProgresiJalur(daftarUnit, sesiList);
  }, [daftarUnit, sesiList]);

  const kuotaPendakian = useMemo(() => {
    return hitungKuotaPendakianMingguIni(sesiList, daftarUnit);
  }, [sesiList, daftarUnit]);

  // 3b. Muat posisi Pos pendakian teman sejenjang (bubble foto teman di Peta Gunung)
  useEffect(() => {
    if (!targetJenjang?.jenjang) return;
    let aktif = true;
    muatPosisiTemanPendakian(db, {
      jenjangTarget: targetJenjang.jenjang,
      myStudentId: studentId,
      myStudentDocId: studentDocId,
      daftarUnit,
    })
      .then((res) => {
        if (aktif && res) setTemanPendakian(res);
      })
      .catch((err) => console.warn('Gagal memuat posisi teman pendakian:', err));
    return () => { aktif = false; };
  }, [targetJenjang?.jenjang, studentId, studentDocId, daftarUnit]);

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
    setPesanError('');
    setUnitTerpilih(unit);
  };

  // Handler meluncurkan ujian simulasi unit ekspedisi
  const handleMulaiUjian = async (unit) => {
    if (!unit || unit.status === 'locked' || unit.status === 'completed' || sedangMenyiapkan) {
      if (unit?.status === 'completed') {
        setPesanError('Misi pendakian ini sudah selesai dikerjakan.');
      }
      return;
    }
    if (kuotaPendakian.terkunciMingguIni) {
      setPesanError(`⏳ Kuota pendakian minggu ini (${kuotaPendakian.maksimal}/${kuotaPendakian.maksimal}) sudah terpakai! Istirahat sejenak di Basecamp dan lanjutkan pendakian lagi ${kuotaPendakian.labelReset} agar bank soal tetap terjaga.`);
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
      paket: { id: `kilat_${subtesObj.kode.toLowerCase()}_${Date.now()}`, judul: `Misi Latihan Pekanan (10 Soal)` },
      daftarSoal: soalKilat,
      mode: modeLatihan,
      isWeeklyDrill: true,
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
      isWeeklyDrill: false,
    });
  };

  // Handler Misi Pelunasan Mandiri di Rumah (5 Butir Soal Adaptif Serupa)
  const handleMisiPelunasanMandiri = (subtes, paket) => {
    setSubtesDetailModal(null);
    const pool = (paket.soalList && paket.soalList.length > 0)
      ? paket.soalList
      : getBankSoalPerSubtes(subtes.kode, targetJenjang?.jenjang || 'SMA', bankSoalFirestore);

    // Ambil 5 butir soal secara acak/adaptif untuk penguatan tuntas
    const acak = [...pool];
    for (let i = acak.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [acak[i], acak[j]] = [acak[j], acak[i]];
    }
    const soalRemedial = acak.slice(0, Math.min(5, acak.length));

    setSesiLatihanAktif({
      subtes,
      paket: {
        ...paket,
        id: `${paket.id}_remedial_${Date.now()}`,
        judul: `Misi Pelunasan Mandiri: ${paket.ringkasBab || paket.judul}`,
      },
      daftarSoal: soalRemedial,
      mode: 'Active Recall',
      isWeeklyDrill: false,
    });
  };

  // Handler cetak lembar gunting tempel langsung dari kartu paket
  const handleCetakLembarGuntingPaket = (subtes, paket) => {
    const paketData = {
      judul: `${subtes?.nama || 'Latihan'} - ${paket.judul}`,
      mapel: subtes?.nama || 'Pendampingan',
      subjudul: 'Lembar Kotak Siap Gunting Ramah Buku Besar',
    };
    try {
      const html = htmlPaketSiswa(paketData, paket.soalList || [], { kertas: 'A4' });
      cetakLewatIframe(html, `Lembar-Gunting-${paket.judul}`);
    } catch (err) {
      console.error('Gagal mencetak lembar gunting tempel:', err);
      alert('Terjadi kesalahan saat menyiapkan dokumen cetak.');
    }
  };

  // Selesai Sesi Latihan
  const handleSelesaiLatihan = (hasil = {}) => {
    // Jika sesi ini adalah Latihan Kilat Mingguan, catat kuota pekanan
    if (sesiLatihanAktif?.isWeeklyDrill) {
      const record = {
        skor: hasil.skor || 0,
        benar: hasil.totalBenar || 0,
        total: hasil.totalSoal || 10,
        waktu: Date.now(),
        butirSalah: hasil.soalSalahList || [],
      };
      try {
        localStorage.setItem(storageWeeklyKey, JSON.stringify(record));
        setMisiMingguanData(record);
      } catch (e) {
        console.warn('Gagal menyimpan record misi mingguan:', e);
      }
    }

    // Jika sesi ini adalah Paket Soal Terbitan Tentor (Kelas Pendampingan)
    if (sesiLatihanAktif?.paket) {
      try {
        const lama = JSON.parse(localStorage.getItem('gemilang_hasil_terbitan_siswa') || '[]');
        const skorFinal = hasil.skor != null
          ? hasil.skor
          : Math.round(((hasil.totalBenar || 0) / Math.max(1, hasil.totalSoal || 10)) * 100);
        const record = {
          studentId: studentId || 'siswa_demo',
          studentNama: profil?.nama || 'Siswa Pendampingan',
          kelas: profil?.kelasSekolah || profil?.kelas || targetJenjang?.label || targetJenjang?.jenjang || '-',
          paketId: sesiLatihanAktif.paket.id,
          paketJudul: sesiLatihanAktif.paket.judul,
          subtesKode: sesiLatihanAktif.subtes?.kode || 'MTK',
          babNomor: Number(sesiLatihanAktif.paket.babNomor || 1),
          namaBab: sesiLatihanAktif.paket.bab || 'Bab 1: Bilangan',
          skor: skorFinal,
          benar: hasil.totalBenar || 0,
          total: hasil.totalSoal || 10,
          tuntas: skorFinal >= 75,
          waktu: Date.now(),
        };
        localStorage.setItem('gemilang_hasil_terbitan_siswa', JSON.stringify([record, ...lama]));
        try {
          addDoc(collection(db, 'gemilang_hasil_terbitan_siswa'), record);
        } catch (eDb) {
          console.warn('Simpan firestore hasil terbitan:', eDb);
        }
      } catch (e) {
        console.warn('Gagal menyimpan record terbitan siswa:', e);
      }
    }
    setSesiLatihanAktif(null);
    setRefreshLatihanTick((t) => t + 1);
  };

  // Handler pelunasan butir salah mingguan (Active Recall)
  const handlePelunasanSalahMingguan = () => {
    if (!misiMingguanData || !misiMingguanData.butirSalah || misiMingguanData.butirSalah.length === 0) return;
    const subtesObj = daftarSubtes.find((s) => s.kode === subtesKilatTerpilih) || daftarSubtes[0];
    setSesiLatihanAktif({
      subtes: subtesObj,
      paket: {
        id: `remedial_weekly_${subtesObj.kode.toLowerCase()}_${Date.now()}`,
        judul: `Pelunasan Active Recall Pekanan: ${subtesObj.nama}`,
      },
      daftarSoal: misiMingguanData.butirSalah,
      mode: 'Active Recall',
      isWeeklyDrill: false,
    });
  };

  // Reset kuota mingguan (untuk demo/uji coba)
  const handleResetMisiMingguan = () => {
    localStorage.removeItem(storageWeeklyKey);
    setMisiMingguanData(null);
    setRefreshLatihanTick((t) => t + 1);
  };

  // 🔄 Reset Progres Uji Coba Latihan Siswa (Kembalikan ke 0)
  const [sedangResetProgres, setSedangResetProgres] = useState(false);
  const handleResetProgres = async () => {
    const yakin = window.confirm(
      `Kembalikan progres latihan akun ${profil.nama || 'siswa'} ke semula (0 soal dilatih & matikan status)?\n\nCatatan: Ini aman dan hanya mereset riwayat uji coba latihan mandiri.`
    );
    if (!yakin) return;

    setSedangResetProgres(true);
    try {
      // 1. Bersihkan localStorage
      resetProgresLatihanSiswa(studentId);
      if (studentDocId && studentDocId !== studentId) {
        resetProgresLatihanSiswa(studentDocId);
      }

      // 2. Bersihkan sesi latihan mandiri di Firestore tryout_sesi bila ada
      if (studentId) {
        try {
          const qSesi = query(
            collection(db, 'tryout_sesi'),
            where('studentId', '==', studentId),
            where('sumber', '==', 'menu_jalur')
          );
          const snapSesi = await getDocs(qSesi);
          const hapusPromises = snapSesi.docs.map((d) => deleteDoc(doc(db, 'tryout_sesi', d.id)));
          await Promise.all(hapusPromises);
        } catch (errDb) {
          console.warn('[JalurUjianAiPage] Gagal bersihkan sesi Firestore:', errDb);
        }
      }

      // 3. Perbarui tampilan
      setRefreshLatihanTick((t) => t + 1);
      alert('Progres latihan mandiri berhasil dikembalikan ke semula! ✨');
    } catch (err) {
      console.error('Gagal reset progres latihan:', err);
      alert('Terjadi kesalahan saat mereset progres.');
    } finally {
      setSedangResetProgres(false);
    }
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

  // JIKA SISWA BUKAN KELAS 9 SMP ATAU KELAS 12 SMA
  if (!targetJenjang || (!isSmp && !isUtbk)) {
    return (
      <div style={st.bukanAkhirWrapper}>
        <div style={st.kartuBukanAkhir}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <MaskotAstronot size={110} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', margin: '0 0 10px' }}>
            Kelas Pendampingan Ujian Akhir
          </h2>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
            Halo <strong>{profil.nama || 'Siswa'}</strong>! Fitur <strong>Kelas Pendampingan</strong> saat ini dikhususkan bagi siswa <strong>Kelas 9 SMP (Persiapan TKA SMP)</strong> dan <strong>Kelas 12 SMA / Alumni (Persiapan UTBK-SNBT)</strong>.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left', fontSize: 13, color: '#166534' }}>
            ✨ Untuk kelasmu (<strong>{profil.kelasSekolah || profil.kelas || 'Reguler'}</strong>), silakan nikmati menu <strong>E-Learning</strong>, <strong>Latihan Harian</strong>, dan <strong>Try Out Terjadwal</strong> untuk mengasah kemampuan belajar!
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
            <h1 style={st.headerJudul}>Kelas Pendampingan Belajar</h1>
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
                  {targetJenjang.jenjang === 'SMP' ? 'Standarisasi TKA SMP Menuju SMA Unggulan' : 'Target Skor UTBK-SNBT Menuju PTN Impian'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  Standar Kelulusan: <span style={{ color: '#0d9488' }}>85.0</span> • Akurasi Terkini: <b>{analisisBelajar.skorRata != null ? `${analisisBelajar.skorRata}%` : 'Mulai Latihan'}</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🧭 TAB SWITCHER: 3 PILAR KELAS PENDAMPINGAN */}
      <div style={st.tabSwitcherWrap}>
        <button
          type="button"
          onClick={() => setTabTampilan('latihan_kelas')}
          style={{
            ...st.btnTabPilihan,
            background: tabTampilan === 'latihan_kelas' ? '#ffffff' : 'transparent',
            color: tabTampilan === 'latihan_kelas' ? '#0f766e' : '#64748b',
            boxShadow: tabTampilan === 'latihan_kelas' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tabTampilan === 'latihan_kelas' ? 800 : 600,
          }}
        >
          <GraduationCap size={16} />
          <span>📋 Latihan Kelas Bersama Tentor</span>
        </button>

        <button
          type="button"
          onClick={() => setTabTampilan('modul_materi')}
          style={{
            ...st.btnTabPilihan,
            background: tabTampilan === 'modul_materi' ? '#ffffff' : 'transparent',
            color: tabTampilan === 'modul_materi' ? '#0f766e' : '#64748b',
            boxShadow: tabTampilan === 'modul_materi' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            fontWeight: tabTampilan === 'modul_materi' ? 800 : 600,
          }}
        >
          <BookOpen size={16} />
          <span>📚 Modul Belajar (Materi Teori)</span>
        </button>

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
          <Zap size={16} />
          <span>⚡ Latihan Mandiri (Misi Mingguan)</span>
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
          <span>🗺️ Peta Jalur</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* PILAR 1: LATIHAN KELAS BERSAMA TENTOR & TRY OUT MINGGUAN            */}
      {/* ==================================================================== */}
      {tabTampilan === 'latihan_kelas' && (
        <div style={{ marginTop: 16 }}>
          {/* ================================================================ */}
          {/* 🎯 1. TRY OUT MINGGUAN UTAMA (OTOMATIS SISTEM PEKANAN)            */}
          {/* ================================================================ */}
          <div style={{
            background: misiMingguanData
              ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)'
              : 'linear-gradient(135deg, #78350f 0%, #b45309 60%, #d97706 100%)',
            borderRadius: 18,
            padding: '24px 26px',
            color: '#ffffff',
            marginBottom: 24,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div style={{ maxWidth: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.25)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  {misiMingguanData ? '✅ Tuntas Pekan Ini' : '⚡ Langkah Wajib Pekanan'}
                </span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>
                  Pekan: <b>{weekKey}</b> • Sistem Otomatis
                </span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px', color: '#ffffff' }}>
                {misiMingguanData
                  ? `Try Out Mingguan Pekan Ini Telah Tuntas! 🎉`
                  : `Ayo, Silakan Kerjakan Try Out Mingguanmu Dahulu!`}
              </h2>

              <p style={{ fontSize: 13.5, margin: 0, opacity: 0.95, lineHeight: 1.6 }}>
                {misiMingguanData
                  ? `Luar biasa! Kamu sudah menyelesaikan try out adaptif pekan ini dengan Skor ${misiMingguanData.skor} (${misiMingguanData.benar}/${misiMingguanData.total} Benar). Sekarang kamu siap mengikuti sesi latihan pendampingan bersama Tentor di bawah.`
                  : `Sebelum memulai sesi kelas pendampingan bersama Tentor, selesaikan Try Out Mingguan adaptif (10 butir) ini sebagai pemetaan kompetensimu. Sistem otomatis membatasi 1x akses per pekan agar bank soal tetap terlindungi.`}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
              {misiMingguanData ? (
                <>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, opacity: 0.9 }}>Hasil Try Out Pekanan</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fef08a' }}>
                      Skor: {misiMingguanData.skor}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.9 }}>
                      {misiMingguanData.benar} Benar • {misiMingguanData.total - misiMingguanData.benar} Belum Paham
                    </div>
                  </div>

                  {misiMingguanData.butirSalah && misiMingguanData.butirSalah.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePelunasanSalahMingguan}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#e11d48',
                        color: '#ffffff',
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
                      }}
                    >
                      <Zap size={14} />
                      <span>Pelunasan Salah ({misiMingguanData.butirSalah.length} Soal)</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleMulaiLatihanKilat}
                  style={{
                    padding: '14px 22px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#ffffff',
                    color: '#92400e',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                  }}
                >
                  <Play size={18} fill="#92400e" />
                  <span>Kerjakan Try Out Sekarang →</span>
                </button>
              )}
            </div>
          </div>

          {/* ================================================================ */}
          {/* 👨‍🏫 2. PAKET LATIHAN PENDAMPINGAN (DIKONTROL PENUH OLEH TENTOR)     */}
          {/* ================================================================ */}
          <div style={{
            background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 100%)',
            borderRadius: 18,
            padding: '20px 24px',
            color: '#ffffff',
            marginBottom: 24,
            boxShadow: '0 6px 20px rgba(13, 148, 136, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  Kontrol Penuh Oleh Tentor
                </span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>
                  Sesi Tatap Muka & Buku Besar Fisik
                </span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 6px', color: '#ffffff' }}>
                Paket Latihan Pendampingan Bersama Tentor
              </h3>
              <p style={{ fontSize: 13, margin: 0, opacity: 0.92, lineHeight: 1.55 }}>
                Berbeda dari Try Out Mingguan yang otomatis, paket latihan di bawah ini <b>sepenuhnya dikontrol oleh Tentor</b>. Posisi awal paket silabus masih <b>TERKUNCI (🔒)</b> dan kuncinya baru dibuka oleh Tentor saat sesi kelas tatap muka dimulai.
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'center',
              minWidth: 150,
            }}>
              <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700 }}>Alur Pengerjaan</div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#fef08a', margin: '3px 0' }}>
                🔒 Kunci Dibuka Tentor
              </div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Kerjakan di Buku Besar</div>
            </div>
          </div>

          {/* BAGIAN A: PAKET KHUSUS YANG SEDANG DIBUKA/DITERBITKAN GURU HARI INI */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚀</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  Paket Soal yang Diterbitkan Guru (Aktif di Kelas)
                </h3>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0d9488' }}>
                {daftarTerbitanTentor.filter((p) => p.status === 'aktif' || p.terbuka !== false).length} Paket Terbuka
              </span>
            </div>

            {daftarTerbitanTentor.filter((p) => p.status === 'aktif' || p.terbuka !== false).length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 16,
                padding: '28px 20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>👨‍🏫 🔒</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                  Belum Ada Paket Khusus yang Diterbitkan Guru Hari Ini
                </div>
                <p style={{ fontSize: 12.5, color: '#64748b', maxWidth: 500, margin: '0 auto 14px', lineHeight: 1.5 }}>
                  Paket latihan akan diterbitkan oleh Guru saat jam kelas pendampingan tatap muka dimulai. Pastikan buku catatan fisik (Buku Besar) sudah siap untuk menuliskan nomor dan langkah pengerjaan!
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {daftarTerbitanTentor
                  .filter((p) => p.status === 'aktif' || p.terbuka !== false)
                  .map((pkt) => {
                    const jumlahSoal = pkt.jumlahSoal || (pkt.daftarSoal ? pkt.daftarSoal.length : (pkt.soalList ? pkt.soalList.length : 0));
                    const soalListPkt = pkt.daftarSoal || pkt.soalList || [];
                    return (
                      <div
                        key={pkt.id || pkt.docId}
                        style={{
                          background: '#ffffff',
                          border: '2px solid #14b8a6',
                          borderRadius: 16,
                          padding: '18px 20px',
                          boxShadow: '0 4px 16px rgba(13, 148, 136, 0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                            <span style={{
                              background: '#0d9488',
                              color: '#ffffff',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 6,
                              textTransform: 'uppercase',
                            }}>
                              🔓 {pkt.subtes || pkt.mapel || 'TKA / UTBK'}
                            </span>
                            <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 700 }}>
                              {pkt.tentorNama ? `Guru: ${pkt.tentorNama}` : 'Dibuka Guru'}
                            </span>
                          </div>
                          <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                            {pkt.judulPaket || pkt.judul}
                          </h4>
                          {pkt.catatanTentor && (
                            <div style={{
                              background: '#f0fdfa',
                              borderLeft: '3px solid #0d9488',
                              padding: '8px 10px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              color: '#134e4a',
                              marginBottom: 12,
                              lineHeight: 1.4,
                            }}>
                              <b>Catatan Guru:</b> {pkt.catatanTentor}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                            📝 <b>{jumlahSoal} Butir Soal</b> • Estimasi {Math.max(15, jumlahSoal * 2)} Menit
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const soalTernormalisasi = soalListPkt
                                .map((s, idx) => normalisasiButir(s, pkt.subtes || pkt.mapel || 'MTK', pkt.bab || pkt.namaBab || 'Pendampingan', idx + 1) || s)
                                .filter(Boolean);
                              setSesiLatihanAktif({
                                subtes: { kode: pkt.subtes || pkt.mapel || 'TKA', nama: pkt.subtes || pkt.mapel || 'Latihan Kelas Tentor' },
                                paket: {
                                  id: pkt.id || pkt.docId,
                                  judul: pkt.judulPaket || pkt.judul,
                                  babNomor: Number(pkt.babNomor || 1),
                                  bab: pkt.bab || pkt.namaBab || 'Bab 1: Bilangan',
                                },
                                daftarSoal: soalTernormalisasi,
                                mode: 'Active Recall',
                                isWeeklyDrill: false,
                              });
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: 'none',
                              background: '#0d9488',
                              color: '#ffffff',
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              boxShadow: '0 4px 10px rgba(13, 148, 136, 0.25)',
                            }}
                          >
                            <Play size={15} />
                            <span>Kerjakan di Kelas (Buku Besar)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ==================================================================== */}
      {/* PILAR 2: MODUL BELAJAR (MATERI TEORI PEKANAN & RUMUS KILAT)         */}
      {/* ==================================================================== */}
      {tabTampilan === 'modul_materi' && (
        <div style={{ marginTop: 16 }}>
          {/* BANNER HEADER MODUL */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            borderRadius: 18,
            padding: '24px 26px',
            color: '#ffffff',
            marginBottom: 20,
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  Pilar Teori & Konsep
                </span>
                <span style={{ fontSize: 12, opacity: 0.9 }}>
                  {isSmp ? 'Kurikulum TKA SMP 2027' : 'Kurikulum Standar UTBK 2027'}
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px', color: '#ffffff' }}>
                Modul Teori & Ringkasan Rumus Kilat
              </h2>
              <p style={{ fontSize: 13.5, margin: 0, opacity: 0.92, lineHeight: 1.6 }}>
                Pelajari konsep inti, trik kilat 30 detik, jebakan umum, dan contoh soal bertahap sebelum kelas tatap muka dimulai. Dilengkapi rumus ringkas dan kuis pemahaman interaktif per bab.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/siswa/modul')}
              style={{
                background: '#ffffff',
                color: '#1e3a8a',
                border: 'none',
                padding: '12px 18px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <BookOpen size={16} />
              <span>Buka Portal Modul Lengkap</span>
            </button>
          </div>

          {/* Subtest Selector Pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 6 }}>
            <button
              type="button"
              onClick={() => setSubtesModulTerpilih('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: subtesModulTerpilih === 'ALL' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: subtesModulTerpilih === 'ALL' ? '#eff6ff' : '#ffffff',
                color: subtesModulTerpilih === 'ALL' ? '#1d4ed8' : '#64748b',
                fontSize: 12.5,
                fontWeight: subtesModulTerpilih === 'ALL' ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Semua Subtes ({isSmp ? SEMUA_BAB_SMP.length : SEMUA_BAB_MODUL.length} Bab)
            </button>
            {(isSmp ? DAFTAR_SUBTES_SMP : DAFTAR_SUBTES_MODUL).map((sub) => {
              const aktif = subtesModulTerpilih === sub.kode;
              return (
                <button
                  key={sub.kode}
                  type="button"
                  onClick={() => setSubtesModulTerpilih(sub.kode)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: aktif ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    background: aktif ? '#eff6ff' : '#ffffff',
                    color: aktif ? '#1d4ed8' : '#64748b',
                    fontSize: 12.5,
                    fontWeight: aktif ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{sub.emoji || '📖'}</span>
                  <span>{sub.singkatan || sub.kode} ({sub.totalBab || (sub.babList && sub.babList.length) || 0} Bab)</span>
                </button>
              );
            })}
          </div>

          {/* Cards Grid of Chapters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {(() => {
              const daftarBab = isSmp ? SEMUA_BAB_SMP : SEMUA_BAB_MODUL;
              const disaring = subtesModulTerpilih === 'ALL'
                ? daftarBab
                : daftarBab.filter((b) => (b.subtestKode || b.subtes) === subtesModulTerpilih);

              return disaring.map((bab, idx) => {
                const subKode = bab.subtestKode || bab.subtes || (isSmp ? 'MTK_SMP' : 'PU');
                const slug = bab.slug || `bab-${idx + 1}`;
                return (
                  <div
                    key={bab.id || `${subKode}_${slug}`}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '18px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <span style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                        }}>
                          {bab.subtestNama || subKode}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          ⏱️ {bab.durasiBacaMenit || 15} Menit
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                        {bab.judul}
                      </h4>
                      <p style={{
                        fontSize: 12,
                        color: '#64748b',
                        margin: '0 0 14px',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {bab.ringkasanSingkat || bab.deskripsi || (Array.isArray(bab.learningObjectives) ? bab.learningObjectives.join('. ') : 'Pelajari konsep materi teori dan latihan bertahap.')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/siswa/modul/${subKode}/${slug}`)}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: 10,
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 3px 8px rgba(37, 99, 235, 0.2)',
                        }}
                      >
                        <BookOpen size={14} />
                        <span>Baca Materi & Rumus</span>
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PILAR 3: LATIHAN MANDIRI AI (MISI MINGGUAN DENGAN SISTEM KUOTA)       */}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flame size={18} color="#ea580c" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#9a3412' }}>
                    {isSmp ? 'Pejuang SMA Unggulan (Lv. 1)' : isSd ? 'Pejuang SMP Favorit (Lv. 1)' : 'Pendaki Pemula (Lv. 1)'}
                  </span>
                </div>
                {statistikLatihan.totalSoalDikerjakanSemua > 0 && (
                  <button
                    type="button"
                    onClick={handleResetProgres}
                    disabled={sedangResetProgres}
                    title="Kembalikan progres uji coba ke 0"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#ffffff',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: 8,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={12} className={sedangResetProgres ? 'animate-spin' : ''} />
                    <span>{sedangResetProgres ? 'Mereset...' : 'Reset Progres'}</span>
                  </button>
                )}
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
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10, gap: 2 }}>
                {[
                  { id: 'Active Recall', label: '🧠 Active Recall' },
                  { id: 'Basic', label: '⚡ Basic' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModeLatihan(m.id)}
                    style={{
                      border: 'none',
                      background: modeLatihan === m.id ? '#ffffff' : 'transparent',
                      color: modeLatihan === m.id ? '#0f766e' : '#64748b',
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      boxShadow: modeLatihan === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 🤖 BUBBLE CHAT MASKOT ASTRONOT (GEMILANG ASSIST) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                background: modeLatihan === 'Active Recall' ? 'linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%)' : '#f8fafc',
                border: modeLatihan === 'Active Recall' ? '1.5px solid #99f6e4' : '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '11px 14px',
                marginBottom: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <MaskotAstronot size={40} mengambang={true} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>
                    Gemilang Assist (Master G)
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: modeLatihan === 'Active Recall' ? '#ccfbf1' : '#e2e8f0',
                    color: modeLatihan === 'Active Recall' ? '#0f766e' : '#475569',
                    border: modeLatihan === 'Active Recall' ? '1px solid #5eead4' : '1px solid #cbd5e1',
                  }}>
                    {modeLatihan === 'Active Recall' ? '🧠 Mode Active Recall (Sangat Disarankan)' : '⚡ Mode Basic (Standar Sekali Jalan)'}
                  </span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
                  {modeLatihan === 'Active Recall' ? (
                    <>
                      Halo Pejuang Gemilang! Di <strong>Mode Active Recall</strong>, setiap butir soal yang kamu jawab kurang tepat akan <span style={{ color: '#0f766e', fontWeight: 700 }}>otomatis diulang kembali di akhir sesi</span> hingga kamu berhasil menjawabnya dengan benar. Metode ini terbukti ilmiah melatih retensi memori jangka panjang agar tidak mudah lupa saat ujian asli!
                    </>
                  ) : (
                    <>
                      Halo Pejuang Gemilang! Di <strong>Mode Basic</strong>, kamu akan mengerjakan latihan secara <strong>mengalir sekali jalan (10 soal)</strong> dari awal sampai akhir tanpa pengulangan soal yang salah. Mode ini cocok untuk simulasi cepat mengukur kesiapan dan kecepatan pengerjaanmu.
                    </>
                  )}
                </div>
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

            {misiMingguanData ? (
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#22c55e',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>
                        Misi Mingguan {subtesKilatTerpilih} Tuntas!
                      </span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #86efac',
                      }}>
                        Skor: {misiMingguanData.skor}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                      {misiMingguanData.benar} dari {misiMingguanData.total} butir benar ({weekKey}). Kuota pekanan terjaga aman.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {misiMingguanData.butirSalah && misiMingguanData.butirSalah.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePelunasanSalahMingguan}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#e11d48',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)',
                      }}
                    >
                      <Zap size={14} />
                      <span>Pelunasan Active Recall ({misiMingguanData.butirSalah.length} Soal)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetMisiMingguan}
                    title="Reset simulasi kuota pekanan (untuk evaluasi/demo)"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#64748b',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Ulangi Simulasi</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMulaiLatihanKilat}
                style={st.btnMulaiLatihanKilat}
              >
                <Zap size={16} />
                <span>Mulai Misi Mingguan {subtesKilatTerpilih} (10 Soal • {modeLatihan}) 🚀</span>
              </button>
            )}
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
      {/* TAB 2: PETA GUNUNG PENDAKIAN (DENGAN BUBBLE TEMAN & KUOTA MINGGUAN)  */}
      {/* ==================================================================== */}
      {tabTampilan === 'ekspedisi_jalur' && (
        <PetaGunungPendakian
          unitList={unitList}
          persentaseSelesai={persentaseSelesai}
          kuotaPendakian={kuotaPendakian}
          temanPerPos={temanPendakian.perPos}
          temanList={temanPendakian.temanList}
          profilSaya={profil}
          isSmp={isSmp}
          onKlikUnit={handleKlikUnit}
        />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', background: '#f1f5f9', padding: 2, borderRadius: 8, gap: 2 }}>
                  {[
                    { id: 'Active Recall', label: '🧠 Active Recall' },
                    { id: 'Basic', label: '⚡ Basic' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModeLatihan(m.id)}
                      style={{
                        border: 'none',
                        background: modeLatihan === m.id ? '#ffffff' : 'transparent',
                        color: modeLatihan === m.id ? '#0f766e' : '#64748b',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        boxShadow: modeLatihan === m.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSubtesDetailModal(null)}
                  style={st.btnCloseModal}
                >
                  <X size={20} color="#64748b" />
                </button>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
              {subtesDetailModal.deskripsi}
            </p>

            <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              Pilih Paket Latihan Terstruktur per Bab (Maksimal 10 Soal per Paket):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              {(() => {
                const paketList = getPaketLatihanPerSubtes(subtesDetailModal.kode, 10, targetJenjang?.jenjang || 'SMA', bankSoalFirestore);
                if (paketList.length === 0) {
                  return (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: 13, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                      Belum ada paket soal untuk subtes ini. Butir soal dari Bank Soal akan otomatis terbit di sini.
                    </div>
                  );
                }

                // Kelompokkan per Bab kurikulum resmi
                const mapGrup = new Map();
                paketList.forEach((p) => {
                  const namaBab = p.namaBab || 'Materi Latihan Terstruktur';
                  if (!mapGrup.has(namaBab)) {
                    mapGrup.set(namaBab, {
                      namaBab,
                      babNomor: p.babNomor || 99,
                      items: [],
                    });
                  }
                  mapGrup.get(namaBab).items.push(p);
                });

                const daftarGrup = Array.from(mapGrup.values()).sort((a, b) => a.babNomor - b.babNomor);

                return daftarGrup.map((grup) => (
                  <div key={grup.namaBab} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15 }}>📖</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                          {grup.namaBab}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', background: '#ccfbf1', padding: '2px 8px', borderRadius: 99 }}>
                        {grup.items.length} Paket
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {grup.items.map((paket) => {
                        const progres = bacaProgresLatihanSiswa(studentId);
                        const infoPaket = progres?.paketMap?.[paket.id];
                        const sudahDikerjakan = Boolean(infoPaket && infoPaket.total > 0);
                        const akurasi = sudahDikerjakan ? (infoPaket.akurasi ?? Math.round((infoPaket.benar / Math.max(1, infoPaket.total)) * 100)) : 0;
                        const isLunas = sudahDikerjakan && akurasi >= 70;

                        return (
                          <div key={paket.id} style={{ ...st.kartuPaketModalItem, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                                    {paket.judul}
                                  </span>
                                  {sudahDikerjakan && (
                                    <span style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: 99,
                                      background: isLunas ? '#dcfce7' : '#fee2e2',
                                      color: isLunas ? '#15803d' : '#b91c1c',
                                      border: `1px solid ${isLunas ? '#86efac' : '#fca5a5'}`,
                                    }}>
                                      {isLunas ? `🟢 Lunas (${akurasi}%)` : `🟠 Belum Lunas (${akurasi}%)`}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                                  {paket.jumlahSoal} Butir Soal • Estimasi {paket.durasiMenit} Menit
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {sudahDikerjakan && !isLunas && (
                                  <button
                                    type="button"
                                    onClick={() => handleMisiPelunasanMandiri(subtesDetailModal, paket)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: 11.5,
                                      fontWeight: 800,
                                      color: '#ffffff',
                                      background: '#ea580c',
                                      border: 'none',
                                      borderRadius: 8,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      boxShadow: '0 2px 4px rgba(234, 88, 12, 0.25)',
                                    }}
                                    title="Selesaikan 5 soal adaptif untuk melunasi bab ini"
                                  >
                                    <Zap size={13} />
                                    <span>Pelunasan (5 Soal)</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleMulaiPaketSpesifik(subtesDetailModal, paket)}
                                  style={{
                                    ...st.btnMulaiPaketModal,
                                    background: subtesDetailModal.badgeWarna,
                                    padding: '6px 14px',
                                    fontSize: 12,
                                  }}
                                >
                                  <span>{sudahDikerjakan ? 'Latih Ulang →' : 'Latih →'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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

            {unitTerpilih.status === 'current' && kuotaPendakian.terkunciMingguIni && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: 10, color: '#92400e', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                ⏳ <b>Kuota Pendakian Minggu Ini ({kuotaPendakian.maksimal}/{kuotaPendakian.maksimal}) Sudah Terpakai.</b> Lanjutkan pendakian berikutnya <b>{kuotaPendakian.labelReset}</b> agar materi matang &amp; bank soal tetap terjaga.
              </div>
            )}

            <button
              type="button"
              disabled={sedangMenyiapkan || unitTerpilih.status === 'locked' || unitTerpilih.status === 'completed' || (unitTerpilih.status === 'current' && kuotaPendakian.terkunciMingguIni)}
              onClick={() => handleMulaiUjian(unitTerpilih)}
              style={{
                ...st.btnLuncurkanUjian,
                opacity: (sedangMenyiapkan || unitTerpilih.status === 'locked' || unitTerpilih.status === 'completed' || (unitTerpilih.status === 'current' && kuotaPendakian.terkunciMingguIni)) ? 0.55 : 1,
                cursor: (unitTerpilih.status === 'locked' || unitTerpilih.status === 'completed' || (unitTerpilih.status === 'current' && kuotaPendakian.terkunciMingguIni)) ? 'not-allowed' : 'pointer',
              }}
            >
              <Rocket size={18} />
              <span>
                {sedangMenyiapkan
                  ? 'Menyiapkan Simulasi...'
                  : unitTerpilih.status === 'completed'
                  ? 'Sudah Selesai ✓'
                  : unitTerpilih.status === 'locked'
                  ? 'Pos Masih Terkunci 🔒'
                  : kuotaPendakian.terkunciMingguIni
                  ? `Buka ${kuotaPendakian.labelReset} ⏳`
                  : 'Mulai Simulasi Ujian 🚀'}
              </span>
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
