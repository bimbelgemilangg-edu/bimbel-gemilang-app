// src/components/guru/ModalSiapkanLatihanSesi.jsx
// ============================================================
// Modal Penyiapan Latihan Pemahaman Sesi Tatap Muka (Pra-Kelas)
// Memungkinkan tentor memilih bab silabus resmi, menyeleksi 5-10
// soal dari Bank Soal (manual atau AI/rekomendasi cerdas),
// mereview butir soal secara lengkap (KaTeX matematika rapi,
// gambar tampil utuh, opsi A/B/C/D/E terstruktur), dan mengaktifkan
// mode pengaman anti-cheating (Blind Submission + Acak Soal/Opsi).
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Send,
  ListChecks,
  FolderCheck,
  Tag,
  PenTool,
  Plus,
  Eye,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import {
  daftarBabSilabus,
  semesterKalenderAktif,
  normalisasiKodeMapel,
  deteksiMapelJadwal,
  namaMapelLengkap,
} from '../../utils/silabusKurikulumMerdeka';
import RenderMath from '../RenderMath';
import TeksSoalBergambar from '../TeksSoalBergambar';
import { normalisasiButirSoal } from '../../utils/normalisasiSoalLatihan';

export default function ModalSiapkanLatihanSesi({
  schedule,
  teacher = null,
  onClose,
  onSuccess,
}) {
  const [semesterPilihan, setSemesterPilihan] = useState(() => semesterKalenderAktif());
  const [selectedBabId, setSelectedBabId] = useState('');
  const [selectedSubBab, setSelectedSubBab] = useState('');
  const [fokusBahasan, setFokusBahasan] = useState('');
  const [fokusKustom, setFokusKustom] = useState('');
  const [modePilihan, setModePilihan] = useState('rekomendasi'); // 'rekomendasi' | 'manual' | 'kuis_guru' | 'tulis_mandiri'
  const [loadingBank, setLoadingBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankSoalList, setBankSoalList] = useState([]);
  const [kuisTersediaList, setKuisTersediaList] = useState([]);
  const [loadingKuis, setLoadingKuis] = useState(false);
  const [selectedKuisId, setSelectedKuisId] = useState('');
  const [soalTerpilih, setSoalTerpilih] = useState([]);
  const [blindSubmission, setBlindSubmission] = useState(true);
  const [acakUrutan, setAcakUrutan] = useState(true);
  const [durasiMenit, setDurasiMenit] = useState(15);
  const [isKelasMandiri, setIsKelasMandiri] = useState(() => Boolean(schedule?.latihanSesi?.isKelasMandiri || schedule?.isKelasMandiri));
  const [pesanStatus, setPesanStatus] = useState('');

  // State untuk Form "✍️ Tulis Soal Mandiri" (Otonomi Privat Tentor)
  const [teksSoalBaru, setTeksSoalBaru] = useState('');
  const [opsiBaruA, setOpsiBaruA] = useState('');
  const [opsiBaruB, setOpsiBaruB] = useState('');
  const [opsiBaruC, setOpsiBaruC] = useState('');
  const [opsiBaruD, setOpsiBaruD] = useState('');
  const [kunciBaru, setKunciBaru] = useState('A');
  const [pembahasanBaru, setPembahasanBaru] = useState('');
  const [gambarUrlBaru, setGambarUrlBaru] = useState('');
  const [previewMath, setPreviewMath] = useState(false);

  // 1. Ekstraksi jenjang dan kelas dari jadwal
  const kelasAngka = useMemo(() => {
    if (!schedule) return '7';
    if (schedule.kelas) {
      const k = String(schedule.kelas).replace(/[^0-9]/g, '');
      if (k) return k;
    }
    if (Array.isArray(schedule.students) && schedule.students.length > 0) {
      for (const s of schedule.students) {
        const k = String(s.kelas || s.kelasSekolah || '').replace(/[^0-9]/g, '');
        if (k) return k;
      }
    }
    const mTitle = String(schedule.title || '').match(/\b([1-9]|1[0-2])\b/);
    if (mTitle) return mTitle[1];
    const mLevel = String(schedule.level || '').match(/\b([1-9]|1[0-2])\b/);
    if (mLevel) return mLevel[1];
    return '9';
  }, [schedule]);

  const kodeMapel = useMemo(() => {
    let t = teacher;
    if (!t) {
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('teacherData') : null;
        if (stored) t = JSON.parse(stored);
      } catch (_err) {
        t = null;
      }
    }
    return deteksiMapelJadwal(schedule, t);
  }, [schedule, teacher]);

  const isJenjangSD = useMemo(() => {
    if (!schedule) return false;
    const lvl = String(schedule.level || '').toUpperCase();
    if (lvl.includes('SD')) return true;
    const prog = String(schedule.program || '').toUpperCase();
    if (prog.includes('SD')) return true;
    const k = parseInt(kelasAngka, 10);
    return k >= 1 && k <= 6;
  }, [schedule, kelasAngka]);

  // Ekstraksi jenjang sesi: 'sd' | 'smp' | 'sma'
  const jenjangSesi = useMemo(() => {
    if (!schedule) return 'smp';
    const teks = `${schedule.title || ''} ${schedule.level || ''} ${schedule.program || ''} ${schedule.kelas || ''}`.toLowerCase();
    if (teks.includes('smp') || teks.includes('mts')) return 'smp';
    if (teks.includes('sma') || teks.includes('smk') || teks.includes('ma') || teks.includes('utbk') || teks.includes('snbt')) return 'sma';
    if (teks.includes('sd') || teks.includes('mi')) return 'sd';
    const k = parseInt(kelasAngka, 10);
    if (k >= 1 && k <= 6) return 'sd';
    if (k >= 7 && k <= 9) return 'smp';
    if (k >= 10 && k <= 12) return 'sma';
    return 'smp';
  }, [schedule, kelasAngka]);

  // 2. Daftar Bab resmi berdasarkan silabus
  const listBab = useMemo(() => {
    return daftarBabSilabus({
      kelas: kelasAngka,
      mapel: kodeMapel,
      semester: semesterPilihan,
    });
  }, [kelasAngka, kodeMapel, semesterPilihan]);

  // Set default bab pertama jika belum terpilih
  useEffect(() => {
    if (listBab.length > 0 && !selectedBabId) {
      setSelectedBabId(listBab[0].id);
      setSelectedSubBab(listBab[0].subBab?.[0] || '');
    }
  }, [listBab, selectedBabId]);

  const babTerpilihObj = useMemo(() => {
    return listBab.find((b) => b.id === selectedBabId) || listBab[0] || null;
  }, [listBab, selectedBabId]);

  // Ekstraksi kata kunci / sub-topik granular dari teks sub-bab Kurikulum Merdeka
  const subBabChips = useMemo(() => {
    if (!selectedSubBab) return [];
    const chips = [];
    // 1. Cek isi dalam tanda kurung (...) mis: (Tabung, Kerucut, dan Bola)
    const m = selectedSubBab.match(new RegExp('\\(([^)]+)\\)'));
    if (m && m[1]) {
      const part = m[1].split(new RegExp('[,/&]|(?:\\s+dan\\s+)|(?:\\s+atau\\s+)|(?:\\s+and\\s+)', 'i'));
      for (const p of part) {
        const clean = p.trim();
        if (
          clean.length > 1 &&
          clean.length < 35 &&
          !['lanjutan', 'penguatan', 'dll', 'dsb', 'dst'].includes(clean.toLowerCase())
        ) {
          chips.push(clean);
        }
      }
    }
    // 2. Jika tidak ada kurung atau chips kosong, split dari teks subBab langsung
    if (chips.length === 0) {
      const part = selectedSubBab.split(new RegExp('[,/&]|(?:\\s+dan\\s+)|(?:\\s+atau\\s+)|(?:\\s+and\\s+)', 'i'));
      for (const p of part) {
        const clean = p.replace(new RegExp('^\\d+[\\.\\)]\\s*'), '').trim();
        if (clean.length > 2 && clean.length < 35) {
          chips.push(clean);
        }
      }
    }
    return chips.slice(0, 6);
  }, [selectedSubBab]);

  const fokusAktif = useMemo(() => {
    return (fokusKustom.trim() || fokusBahasan.trim() || '');
  }, [fokusKustom, fokusBahasan]);

  // Reset fokus bahasan harian saat bab atau sub-bab diganti
  useEffect(() => {
    setFokusBahasan('');
    setFokusKustom('');
  }, [selectedBabId, selectedSubBab]);

  // Inisialisasi jika latihan sudah pernah diterbitkan di jadwal
  useEffect(() => {
    if (schedule?.latihanSesi) {
      const lat = schedule.latihanSesi;
      if (lat.babId) setSelectedBabId(lat.babId);
      if (lat.subBab) setSelectedSubBab(lat.subBab);
      if (lat.fokusBahasan) setFokusBahasan(lat.fokusBahasan);
      if (lat.kuisModulId) setSelectedKuisId(lat.kuisModulId);
      if (lat.durasiMenit) setDurasiMenit(lat.durasiMenit);
      if (typeof lat.blindSubmission === 'boolean') setBlindSubmission(lat.blindSubmission);
      if (typeof lat.acakSoal === 'boolean') setAcakUrutan(lat.acakSoal);
      if (typeof lat.isKelasMandiri === 'boolean') setIsKelasMandiri(lat.isKelasMandiri);
      if (Array.isArray(lat.soalList) && lat.soalList.length > 0) {
        setSoalTerpilih(lat.soalList.map((s, idx) => normalisasiButirSoal(s, idx)));
      }
    }
  }, [schedule]);

  // Muat Kuis E-Learning / Modul yang sudah pernah dibuat oleh guru
  useEffect(() => {
    let mounted = true;
    const fetchKuisGuru = async () => {
      setLoadingKuis(true);
      try {
        let qKuis;
        try {
          qKuis = query(
            collection(db, 'bimbel_modul'),
            where('type', '==', 'kuis_mandiri'),
            where('status', '==', 'aktif'),
            limit(60)
          );
        } catch {
          qKuis = query(collection(db, 'bimbel_modul'), limit(60));
        }

        const snap = await getDocs(qKuis);
        if (!mounted) return;

        const list = [];
        const myGuruId = teacher?.guruId || teacher?.id || '';

        snap.forEach((d) => {
          const data = d.data();
          const rawQuestions = Array.isArray(data.questions)
            ? data.questions
            : (Array.isArray(data.soalList) ? data.soalList : []);
          if (rawQuestions.length > 0) {
            const kuisMapel = normalisasiKodeMapel(data.kodeMapel || data.subject || data.mapel || '');
            const kuisGuruId = data.guruId || data.authorId || '';
            const isMine = Boolean(myGuruId && kuisGuruId === myGuruId);

            // ISOLASI KETAT PRIVASI & MAPEL:
            // 1. Kuis mapel lain TIDAK BOLEH muncul pada sesi guru (mis: MTK tidak boleh masuk ke Bahasa Indonesia)
            if (kuisMapel && kuisMapel !== 'umum' && kodeMapel && kodeMapel !== 'umum' && kuisMapel !== kodeMapel) {
              return;
            }

            // 2. Jika kuis bertipe 'umum' / tanpa mapel, hanya tampilkan jika dibuat oleh guru ini sendiri
            if (!isMine && (!kuisMapel || kuisMapel === 'umum') && kodeMapel !== 'umum') {
              return;
            }

            list.push({
              id: d.id,
              title: data.title || 'Kuis Tanpa Judul',
              subject: data.subject || data.mapel || namaMapelLengkap(kuisMapel),
              kodeMapel: kuisMapel,
              guruId: kuisGuruId,
              guruName: data.guruName || data.authorName || '',
              totalQuestions: rawQuestions.length,
              questions: rawQuestions,
              createdAt: data.createdAt,
              targetKelas: data.targetKelas || 'Semua',
              targetKategori: data.targetKategori || 'Semua',
              isMine,
            });
          }
        });

        // Urutkan: dahulukan kuis buatan guru sendiri (privat), baru kuis resmi mapel
        list.sort((a, b) => {
          if (a.isMine !== b.isMine) return b.isMine ? 1 : -1;
          return 0;
        });

        setKuisTersediaList(list);
        if (list.length > 0 && !selectedKuisId) {
          setSelectedKuisId(list[0].id);
        }
      } catch (err) {
        console.warn('Gagal memuat kuis guru dari bimbel_modul:', err);
      } finally {
        if (mounted) setLoadingKuis(false);
      }
    };

    fetchKuisGuru();
    return () => {
      mounted = false;
    };
  }, [kodeMapel, teacher, selectedKuisId]);

  // 3. Muat Bank Soal Firestore sesuai Mapel & Jenjang
  useEffect(() => {
    let mounted = true;
    const fetchBankSoal = async () => {
      setLoadingBank(true);
      try {
        let qBank;
        try {
          qBank = query(
            collection(db, 'bank_soal'),
            where('status', '==', 'aktif'),
            limit(100)
          );
        } catch {
          qBank = query(collection(db, 'bank_soal'), limit(100));
        }

        const snap = await getDocs(qBank);
        if (!mounted) return;

        const items = [];
        snap.forEach((d) => {
          const raw = { id: d.id, ...d.data() };
          const norm = normalisasiButirSoal(raw, items.length);
          if (norm && norm.teksSoal) {
            items.push(norm);
          }
        });

        // Filter butir yang relevan dengan mapel dan jenjang sesi
        const relevan = items.filter((it) => {
          const m = normalisasiKodeMapel(it.mapel);
          if (m !== kodeMapel) return false;

          const teksGabungan = `${it.jenjang || ''} ${it.tingkatKelas || ''} ${it.fase || ''} ${it.materi || ''} ${it.teksSoal || ''}`.toLowerCase();

          // Saring ketat materi SMA/UTBK agar tidak menyusup ke sesi SMP atau SD
          if (jenjangSesi === 'smp' || jenjangSesi === 'sd') {
            const isSMA = /\b(sma|smk|ma|utbk|snbt|fase e|fase f|kelas 10|kelas 11|kelas 12|kelas x\b|kelas xi\b|kelas xii\b)\b/i.test(teksGabungan);
            const isSMAKeyword = /trigonometri|\bsin\b|\bcos\b|\btan\b|\\sin|\\cos|\\tan|komposisi\s+fungsi|fungsi\s+invers|turunan|integral|matriks|vektor|eksponen|logaritma|dimensi tiga/i.test(teksGabungan);
            if (isSMA || isSMAKeyword) return false;
          }

          if (jenjangSesi === 'smp') {
            const isSD = /\b(sd|mi|fase a|fase b|fase c|kelas [1-6]\b)\b/i.test(`${it.jenjang || ''} ${it.tingkatKelas || ''} ${it.fase || ''}`.toLowerCase());
            if (isSD) return false;
          } else if (jenjangSesi === 'sma') {
            const isBawah = /\b(sd|smp|mi|mts|fase a|fase b|fase c|fase d|kelas [1-9]\b)\b/i.test(`${it.jenjang || ''} ${it.tingkatKelas || ''} ${it.fase || ''}`.toLowerCase());
            if (isBawah) return false;
          }

          return true;
        });

        setBankSoalList(relevan);
      } catch (err) {
        console.warn('Gagal memuat bank_soal:', err);
      } finally {
        if (mounted) setLoadingBank(false);
      }
    };

    fetchBankSoal();
    return () => {
      mounted = false;
    };
  }, [kodeMapel, jenjangSesi]);

  // 4A. Tambah Butir Soal Mandiri (Otonomi Privat Tentor)
  const handleTambahSoalMandiri = () => {
    if (!teksSoalBaru.trim()) {
      alert('Teks pertanyaan soal tidak boleh kosong.');
      return;
    }
    if (!opsiBaruA.trim() || !opsiBaruB.trim()) {
      alert('Mohon isi minimal Pilihan A dan Pilihan B.');
      return;
    }
    if (soalTerpilih.length >= 20) {
      alert('Maksimal 20 butir soal per sesi latihan agar siswa tidak kelelahan.');
      return;
    }

    const opsiJawaban = [
      { label: 'A', teks: opsiBaruA.trim() },
      { label: 'B', teks: opsiBaruB.trim() },
    ];
    if (opsiBaruC.trim()) opsiJawaban.push({ label: 'C', teks: opsiBaruC.trim() });
    if (opsiBaruD.trim()) opsiJawaban.push({ label: 'D', teks: opsiBaruD.trim() });

    const nomorBaru = soalTerpilih.length + 1;
    const butirBaru = normalisasiButirSoal(
      {
        id: `mandiri-${Date.now()}-${nomorBaru}`,
        nomor: nomorBaru,
        teksSoal: teksSoalBaru.trim(),
        opsiJawaban,
        kunciJawaban: kunciBaru || 'A',
        pembahasan: pembahasanBaru.trim() || `Kunci jawaban yang tepat adalah pilihan ${kunciBaru}.`,
        materi: fokusAktif
          ? `${babTerpilihObj?.judul || 'Materi'} (${fokusAktif})`
          : babTerpilihObj?.judul || 'Latihan Mandiri Tentor',
        gambarUrls: gambarUrlBaru.trim() ? [gambarUrlBaru.trim()] : [],
        isMandiri: true,
        guruId: teacher?.id || teacher?.guruId || '',
        guruName: teacher?.name || teacher?.nama || '',
      },
      soalTerpilih.length
    );

    setSoalTerpilih((prev) => [...prev, butirBaru]);
    setPesanStatus(`✍️ Soal #${nomorBaru} berhasil ditambahkan! Total ${nomorBaru} soal siap.`);

    // Reset formulir input mandiri
    setTeksSoalBaru('');
    setOpsiBaruA('');
    setOpsiBaruB('');
    setOpsiBaruC('');
    setOpsiBaruD('');
    setKunciBaru('A');
    setPembahasanBaru('');
    setGambarUrlBaru('');
  };

  // 4B. Ambil Soal dari Kuis E-Learning Guru
  const handleTerapkanKuisModul = (kuisTarget) => {
    const kuis = kuisTarget || kuisTersediaList.find((k) => k.id === selectedKuisId);
    if (!kuis || !Array.isArray(kuis.questions) || kuis.questions.length === 0) {
      alert('Kuis yang dipilih belum memiliki butir soal.');
      return;
    }

    const converted = kuis.questions
      .map((q, idx) => {
        return normalisasiButirSoal({
          ...q,
          id: q.id || `kuis-${kuis.id}-${idx + 1}`,
          nomor: idx + 1,
          materi: kuis.title || babTerpilihObj?.judul || 'Materi Kuis',
        }, idx);
      })
      .filter((s) => s && s.teksSoal);

    if (converted.length === 0) {
      alert('Tidak ada butir soal yang valid dalam kuis ini.');
      return;
    }

    setSoalTerpilih(converted);
    setPesanStatus(`📂 Berhasil memuat ${converted.length} butir soal dari kuis "${kuis.title}"`);
  };

  // 4B. Rekomendasi Cerdas / AI Filter Soal (Sadar Fokus Bahasan Harian)
  const handleTerapkanRekomendasi = (jumlahTarget = 5) => {
    if (!babTerpilihObj) return;
    const judulBabLower = (babTerpilihObj.judul || "").toLowerCase();
    const subBabLower = (selectedSubBab || "").toLowerCase();
    const fokusLower = (fokusAktif || "").toLowerCase();

    const kataKunci = [
      judulBabLower,
      subBabLower,
      fokusLower,
      (namaMapelLengkap(kodeMapel) || "").toLowerCase(),
    ].join(" ");

    const isSisiLengkung = [
      "sisi lengkung", "tabung", "kerucut", "bola", "selimut tabung", "selimut kerucut", "garis pelukis"
    ].some((k) => kataKunci.includes(k));

    const isSisiDatar = [
      "sisi datar", "kubus", "balok", "prisma", "limas"
    ].some((k) => kataKunci.includes(k));

    const isGeometriBangunRuang = [
      "bangun ruang", "bangun datar", "geometri", "kubus", "balok",
      "prisma", "limas", "tabung", "kerucut", "bola", "sisi datar",
      "sisi lengkung", "volume", "luas permukaan", "rusuk", "titik sudut",
    ].some((k) => kataKunci.includes(k));

    const isTopikSPLDV = [
      "spldv", "sistem persamaan", "linear dua variabel", "eliminasi", "substitusi",
    ].some((k) => kataKunci.includes(k));

    // Urutkan bank soal berdasarkan kecocokan materi dan kata kunci spesifik
    const skorButir = bankSoalList.map((item) => {
      let skor = 0;
      const teks = (item.teksSoal + " " + (item.materi || "")).toLowerCase();
      const metaTeks = (teks + " " + (item.jenjang || "") + " " + (item.tingkatKelas || "") + " " + (item.fase || "")).toLowerCase();

      // Penalti mutlak jika jenjang SMP/SD mendapati materi tingkat SMA / UTBK
      if (jenjangSesi === 'smp' || jenjangSesi === 'sd') {
        const isSMA = /\b(sma|smk|ma|utbk|snbt|fase e|fase f|kelas 10|kelas 11|kelas 12|kelas x\b|kelas xi\b|kelas xii\b)\b/i.test(metaTeks);
        const isSMAKeyword = /trigonometri|\bsin\b|\bcos\b|\btan\b|\\sin|\\cos|\\tan|komposisi\s+fungsi|fungsi\s+invers|turunan|integral|matriks|vektor|eksponen|logaritma|dimensi tiga/i.test(metaTeks);
        if (isSMA || isSMAKeyword) {
          return { item, skor: -1000 };
        }
      }

      // 1. Kecocokan nama bab / materi utama
      if (item.materi && judulBabLower && item.materi.toLowerCase().includes(judulBabLower)) {
        skor += 45;
      }

      // 2. Kategori Geometri Bangun Ruang Sisi Lengkung vs Sisi Datar
      if (isSisiLengkung) {
        // Harus ada istilah spesifik sisi lengkung
        const hasLengkungTerms = ["tabung", "kerucut", "bola", "selimut", "garis pelukis", "\\pi", "pi", "jari-jari", "diameter"].some(k => teks.includes(k));
        if (hasLengkungTerms) skor += 50;

        // Penalti keras jika materi sisi lengkung tapi soal membahas bangun datar 2D murni tanpa bangun ruang
        const isBangunDatarMurni = ["bujur sangkar", "persegi panjang", "luas persegi", "keliling dan luas"].some(k => teks.includes(k)) && !["tabung", "kerucut", "bola", "volume", "bangun ruang"].some(k => teks.includes(k));
        if (isBangunDatarMurni) skor -= 500;

        // Penalti jika materi sisi lengkung tapi soalnya bangun ruang sisi datar (kubus, balok, prisma, limas)
        const isSisiDatarItem = ["kubus", "balok", "prisma", "limas"].some(k => teks.includes(k)) && !["tabung", "kerucut", "bola"].some(k => teks.includes(k));
        if (isSisiDatarItem) skor -= 250;
      } else if (isSisiDatar) {
        const hasDatarTerms = ["kubus", "balok", "prisma", "limas", "rusuk", "diagonal sisi", "diagonal ruang", "jaring-jaring"].some(k => teks.includes(k));
        if (hasDatarTerms) skor += 50;
        // Penalti jika materi sisi datar tapi soalnya sisi lengkung
        const isLengkungItem = ["tabung", "kerucut", "bola"].some(k => teks.includes(k)) && !["kubus", "balok"].some(k => teks.includes(k));
        if (isLengkungItem) skor -= 250;
      } else if (isGeometriBangunRuang) {
        const hasGeomTerms = ["bangun ruang", "kubus", "balok", "prisma", "limas", "tabung", "kerucut", "bola", "volume", "luas permukaan", "rusuk", "titik sudut"].some(k => teks.includes(k));
        if (hasGeomTerms) skor += 25;
      }

      // Penalti aljabar/SPLDV jika geometri
      if (isGeometriBangunRuang || isSisiLengkung || isSisiDatar) {
        const isSPLDV = teks.includes("spldv") || teks.includes("linear dua variabel") || (teks.includes("persamaan linear") && !teks.includes("volume"));
        if (isSPLDV) skor -= 500;
      }

      // 3. Kategori Aljabar / SPLDV
      if (isTopikSPLDV) {
        const hasSPLDVTerms = teks.includes("spldv") || teks.includes("linear") || teks.includes("eliminasi") || teks.includes("substitusi");
        if (hasSPLDVTerms) skor += 40;
        // Penalti jika materi SPLDV tapi butir geometri bangun ruang
        if (teks.includes("bangun ruang") || teks.includes("kubus") || teks.includes("balok") || teks.includes("tabung")) skor -= 500;
      }

      // 4. Fokus Spesifik Hari Ini (Granularitas Sub-Topik Harian)
      if (fokusLower) {
        if (teks.includes(fokusLower)) {
          skor += 70; // Prioritas tertinggi jika butir membidik langsung fokus materi harian
        } else {
          // Jika guru memilih fokus spesifik (misal "Tabung saja"), saring keluar butir topik saingan (kerucut, bola)
          const saingan = subBabChips
            .map((c) => c.toLowerCase())
            .filter((c) => c !== fokusLower && c.length > 2);
          const adaSaingan = saingan.some((s) => teks.includes(s));
          if (adaSaingan) {
            skor -= 80; // Penalti kuat agar soal di luar fokus harian tidak tercampur
          }
        }
      }

      // 5. Kata kunci tematik lainnya
      if (teks.includes("transformasi") && kataKunci.includes("transformasi")) skor += 20;
      if (teks.includes("peluang") && kataKunci.includes("peluang")) skor += 20;
      if (teks.includes("statistika") && kataKunci.includes("statistika")) skor += 20;
      if (teks.includes("pangkat") && kataKunci.includes("pangkat")) skor += 20;
      if (teks.includes("akar") && kataKunci.includes("akar")) skor += 20;

      // Prioritaskan soal yang memiliki gambar lengkap jika topik geometris
      if (item.gambarUrls && item.gambarUrls.length > 0 && isGeometriBangunRuang) skor += 5;

      return { item, skor };
    });

    // Urutkan dari skor tertinggi
    skorButir.sort((a, b) => b.skor - a.skor);

    // HANYA ambil butir soal yang benar-benar relevan dan berbobot (skor >= 35)
    let terpilih = skorButir
      .filter((x) => x.skor >= 35)
      .slice(0, jumlahTarget)
      .map((x) => x.item);

    // Fallback kurasi terverifikasi HANYA untuk Matematika spesifik jika bank_soal masih kosong
    if (terpilih.length < jumlahTarget && kodeMapel === 'mtk') {
      const sisa = jumlahTarget - terpilih.length;
      const judulBab = babTerpilihObj?.judul || "Materi Pembelajaran";

      // Kumpulan seed kurasi spesifik per fokus topik
      let seedPool = null;

      if (fokusLower.includes("tabung")) {
        seedPool = [
          {
            teksSoal: "Sebuah tabung memiliki jari-jari alas $r = 7\\text{ cm}$ dan tinggi $t = 10\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume tabung tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.540\\text{ cm}^3$" },
              { label: "B", teks: "$1.450\\text{ cm}^3$" },
              { label: "C", teks: "$770\\text{ cm}^3$" },
              { label: "D", teks: "$440\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume tabung dihitung dengan rumus $V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = 154 \\times 10 = 1.540\\text{ cm}^3$.",
          },
          {
            teksSoal: "Sebuah kaleng biskuit berbentuk tabung memiliki jari-jari alas $7\\text{ cm}$ dan tinggi $20\\text{ cm}$. Luas selimut tabung tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$880\\text{ cm}^2$" },
              { label: "B", teks: "$440\\text{ cm}^2$" },
              { label: "C", teks: "$960\\text{ cm}^2$" },
              { label: "D", teks: "$1.760\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas selimut tabung dihitung dengan rumus $L_{\\text{selimut}} = 2\\pi r t = 2 \\times \\frac{22}{7} \\times 7 \\times 20 = 44 \\times 20 = 880\\text{ cm}^2$.",
          },
          {
            teksSoal: "Luas seluruh permukaan tabung tertutup yang memiliki jari-jari alas $7\\text{ cm}$ dan tinggi $15\\text{ cm}$ adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$968\\text{ cm}^2$" },
              { label: "B", teks: "$868\\text{ cm}^2$" },
              { label: "C", teks: "$1.024\\text{ cm}^2$" },
              { label: "D", teks: "$660\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas seluruh permukaan tabung tertutup: $L = 2\\pi r(r + t) = 2 \\times \\frac{22}{7} \\times 7 \\times (7 + 15) = 44 \\times 22 = 968\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah tabung memiliki volume $3.080\\text{ cm}^3$ dan jari-jari alas $7\\text{ cm}$. Tinggi tabung tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$20\\text{ cm}$" },
              { label: "B", teks: "$15\\text{ cm}$" },
              { label: "C", teks: "$25\\text{ cm}$" },
              { label: "D", teks: "$10\\text{ cm}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "$V = \\pi r^2 t \\implies 3.080 = \\frac{22}{7} \\times 49 \\times t \\implies 3.080 = 154 \\times t \\implies t = \\frac{3.080}{154} = 20\\text{ cm}$.",
          },
          {
            teksSoal: "Sebuah drum penampungan air berbentuk tabung memiliki diameter $14\\text{ dm}$ dan tinggi $10\\text{ dm}$. Jika drum terisi air penuh, maka volume air di dalam drum adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.540\\text{ liter}$" },
              { label: "B", teks: "$3.080\\text{ liter}$" },
              { label: "C", teks: "$770\\text{ liter}$" },
              { label: "D", teks: "$6.160\\text{ liter}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Diameter $= 14\\text{ dm} \\implies r = 7\\text{ dm}$. Volume drum $V = \\pi r^2 t = \\frac{22}{7} \\times 49 \\times 10 = 1.540\\text{ dm}^3 = 1.540\\text{ liter}$.",
          },
        ];
      } else if (fokusLower.includes("kerucut")) {
        seedPool = [
          {
            teksSoal: "Sebuah kerucut memiliki jari-jari alas $r = 6\\text{ cm}$ dan tinggi $t = 8\\text{ cm}$. Panjang garis pelukis ($s$) kerucut tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$10\\text{ cm}$" },
              { label: "B", teks: "$14\\text{ cm}$" },
              { label: "C", teks: "$12\\text{ cm}$" },
              { label: "D", teks: "$16\\text{ cm}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Garis pelukis dihitung dengan teorema Pythagoras: $s = \\sqrt{r^2 + t^2} = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\text{ cm}$.",
          },
          {
            teksSoal: "Sebuah kerucut memiliki jari-jari alas $7\\text{ cm}$ dan tinggi $12\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume kerucut tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$616\\text{ cm}^3$" },
              { label: "B", teks: "$1.848\\text{ cm}^3$" },
              { label: "C", teks: "$308\\text{ cm}^3$" },
              { label: "D", teks: "$924\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume kerucut: $V = \\frac{1}{3}\\pi r^2 t = \\frac{1}{3} \\times \\frac{22}{7} \\times 49 \\times 12 = \\frac{1}{3} \\times 154 \\times 12 = 154 \\times 4 = 616\\text{ cm}^3$.",
          },
          {
            teksSoal: "Sebuah caping (topi petani) berbentuk kerucut tanpa alas dengan jari-jari alas $7\\text{ cm}$ dan garis pelukis $25\\text{ cm}$. Luas selimut kerucut tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$550\\text{ cm}^2$" },
              { label: "B", teks: "$500\\text{ cm}^2$" },
              { label: "C", teks: "$450\\text{ cm}^2$" },
              { label: "D", teks: "$350\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas selimut kerucut: $L_{\\text{selimut}} = \\pi r s = \\frac{22}{7} \\times 7 \\times 25 = 22 \\times 25 = 550\\text{ cm}^2$.",
          },
          {
            teksSoal: "Luas seluruh permukaan kerucut dengan panjang jari-jari alas $7\\text{ cm}$ dan garis pelukis $10\\text{ cm}$ adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$374\\text{ cm}^2$" },
              { label: "B", teks: "$220\\text{ cm}^2$" },
              { label: "C", teks: "$440\\text{ cm}^2$" },
              { label: "D", teks: "$514\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas seluruh permukaan kerucut: $L = \\pi r(r + s) = \\frac{22}{7} \\times 7 \\times (7 + 10) = 22 \\times 17 = 374\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah cetakan tumpeng berbentuk kerucut memiliki diameter alas $14\\text{ cm}$ dan tinggi $15\\text{ cm}$. Volume cetakan tumpeng tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$770\\text{ cm}^3$" },
              { label: "B", teks: "$1.540\\text{ cm}^3$" },
              { label: "C", teks: "$2.310\\text{ cm}^3$" },
              { label: "D", teks: "$385\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "$r = 7\\text{ cm}$. Volume: $V = \\frac{1}{3}\\pi r^2 t = \\frac{1}{3} \\times \\frac{22}{7} \\times 49 \\times 15 = 154 \\times 5 = 770\\text{ cm}^3$.",
          },
        ];
      } else if (fokusLower.includes("bola")) {
        seedPool = [
          {
            teksSoal: "Sebuah bola memiliki jari-jari $r = 7\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume bola tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.437{,}33\\text{ cm}^3$" },
              { label: "B", teks: "$1.347{,}33\\text{ cm}^3$" },
              { label: "C", teks: "$616\\text{ cm}^3$" },
              { label: "D", teks: "$2.464\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume bola: $V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3} \\times \\frac{22}{7} \\times 343 = \\frac{4}{3} \\times 1.078 = 1.437{,}33\\text{ cm}^3$.",
          },
          {
            teksSoal: "Luas seluruh permukaan bola yang memiliki jari-jari alas $7\\text{ cm}$ adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$616\\text{ cm}^2$" },
              { label: "B", teks: "$308\\text{ cm}^2$" },
              { label: "C", teks: "$1.232\\text{ cm}^2$" },
              { label: "D", teks: "$154\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas permukaan bola: $L = 4\\pi r^2 = 4 \\times \\frac{22}{7} \\times 49 = 4 \\times 154 = 616\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah belahan bola padat (setengah bola tertutup) memiliki jari-jari $7\\text{ cm}$. Luas seluruh permukaannya adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$462\\text{ cm}^2$" },
              { label: "B", teks: "$308\\text{ cm}^2$" },
              { label: "C", teks: "$616\\text{ cm}^2$" },
              { label: "D", teks: "$154\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas setengah bola padat $= 3\\pi r^2 = 3 \\times \\frac{22}{7} \\times 49 = 3 \\times 154 = 462\\text{ cm}^2$.",
          },
          {
            teksSoal: "Jika panjang jari-jari sebuah bola diperbesar menjadi $2$ kali semula, maka volumenya akan menjadi ...",
            opsiJawaban: [
              { label: "A", teks: "$8$ kali volume semula" },
              { label: "B", teks: "$4$ kali volume semula" },
              { label: "C", teks: "$2$ kali volume semula" },
              { label: "D", teks: "$16$ kali volume semula" },
            ],
            kunciJawaban: "A",
            pembahasan: "$V \\propto r^3$. Bila jari-jari dikalikan 2, volume menjadi $2^3 = 8$ kali volume semula.",
          },
          {
            teksSoal: "Sebuah kubah miniatur berbentuk setengah bola berongga memiliki diameter $14\\text{ meter}$. Luas permukaan kubah yang akan dicat adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$308\\text{ m}^2$" },
              { label: "B", teks: "$616\\text{ m}^2$" },
              { label: "C", teks: "$154\\text{ m}^2$" },
              { label: "D", teks: "$462\\text{ m}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "$r = 7\\text{ m}$. Luas setengah bola berongga $= 2\\pi r^2 = 2 \\times \\frac{22}{7} \\times 49 = 308\\text{ m}^2$.",
          },
        ];
      } else if (fokusLower.includes("kubus")) {
        seedPool = [
          {
            teksSoal: "Sebuah kubus memiliki panjang rusuk $6\\text{ cm}$. Luas seluruh permukaan kubus tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$216\\text{ cm}^2$" },
              { label: "B", teks: "$180\\text{ cm}^2$" },
              { label: "C", teks: "$144\\text{ cm}^2$" },
              { label: "D", teks: "$96\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas permukaan kubus: $L = 6 \\times s^2 = 6 \\times 36 = 216\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah kubus memiliki volume $512\\text{ cm}^3$. Panjang rusuk kubus tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$8\\text{ cm}$" },
              { label: "B", teks: "$6\\text{ cm}$" },
              { label: "C", teks: "$7\\text{ cm}$" },
              { label: "D", teks: "$9\\text{ cm}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "$V = s^3 \\implies s = \\sqrt[3]{512} = 8\\text{ cm}$.",
          },
        ];
      } else if (fokusLower.includes("balok")) {
        seedPool = [
          {
            teksSoal: "Sebuah balok memiliki ukuran panjang $12\\text{ cm}$, lebar $8\\text{ cm}$, dan tinggi $5\\text{ cm}$. Volume balok tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$480\\text{ cm}^3$" },
              { label: "B", teks: "$420\\text{ cm}^3$" },
              { label: "C", teks: "$360\\text{ cm}^3$" },
              { label: "D", teks: "$240\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume balok: $V = p \\times l \\times t = 12 \\times 8 \\times 5 = 480\\text{ cm}^3$.",
          },
          {
            teksSoal: "Luas seluruh permukaan balok dengan ukuran panjang $10\\text{ cm}$, lebar $6\\text{ cm}$, dan tinggi $4\\text{ cm}$ adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$248\\text{ cm}^2$" },
              { label: "B", teks: "$240\\text{ cm}^2$" },
              { label: "C", teks: "$124\\text{ cm}^2$" },
              { label: "D", teks: "$180\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "$L = 2(pl + pt + lt) = 2(60 + 40 + 24) = 2 \\times 124 = 248\\text{ cm}^2$.",
          },
        ];
      } else if (isSisiLengkung) {
        seedPool = [
          {
            teksSoal: "Sebuah tabung memiliki jari-jari alas $r = 7\\text{ cm}$ dan tinggi $t = 10\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume tabung tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.540\\text{ cm}^3$" },
              { label: "B", teks: "$1.450\\text{ cm}^3$" },
              { label: "C", teks: "$770\\text{ cm}^3$" },
              { label: "D", teks: "$440\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume tabung dihitung dengan rumus $V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = 154 \\times 10 = 1.540\\text{ cm}^3$.",
          },
          {
            teksSoal: "Sebuah kaleng biskuit berbentuk tabung memiliki jari-jari alas $7\\text{ cm}$ dan tinggi $20\\text{ cm}$. Luas selimut tabung tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$880\\text{ cm}^2$" },
              { label: "B", teks: "$440\\text{ cm}^2$" },
              { label: "C", teks: "$960\\text{ cm}^2$" },
              { label: "D", teks: "$1.760\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas selimut tabung: $L_{\\text{selimut}} = 2\\pi r t = 2 \\times \\frac{22}{7} \\times 7 \\times 20 = 44 \\times 20 = 880\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah kerucut memiliki jari-jari alas $r = 6\\text{ cm}$ dan tinggi $t = 8\\text{ cm}$. Panjang garis pelukis ($s$) kerucut tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$10\\text{ cm}$" },
              { label: "B", teks: "$14\\text{ cm}$" },
              { label: "C", teks: "$12\\text{ cm}$" },
              { label: "D", teks: "$16\\text{ cm}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Panjang garis pelukis kerucut dihitung dengan rumus Pythagoras: $s = \\sqrt{r^2 + t^2} = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\text{ cm}$.",
          },
          {
            teksSoal: "Sebuah kerucut memiliki jari-jari alas $7\\text{ cm}$ dan tinggi $12\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume kerucut tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$616\\text{ cm}^3$" },
              { label: "B", teks: "$1.848\\text{ cm}^3$" },
              { label: "C", teks: "$308\\text{ cm}^3$" },
              { label: "D", teks: "$924\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume kerucut: $V = \\frac{1}{3}\\pi r^2 t = \\frac{1}{3} \\times \\frac{22}{7} \\times 49 \\times 12 = 154 \\times 4 = 616\\text{ cm}^3$.",
          },
          {
            teksSoal: "Sebuah bola memiliki jari-jari $r = 7\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume bola tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.437{,}33\\text{ cm}^3$" },
              { label: "B", teks: "$1.347{,}33\\text{ cm}^3$" },
              { label: "C", teks: "$616\\text{ cm}^3$" },
              { label: "D", teks: "$2.464\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume bola: $V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3} \\times \\frac{22}{7} \\times 343 = \\frac{4}{3} \\times 1.078 = 1.437{,}33\\text{ cm}^3$.",
          },
          {
            teksSoal: "Luas seluruh permukaan bola yang memiliki jari-jari $7\\text{ cm}$ adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$616\\text{ cm}^2$" },
              { label: "B", teks: "$308\\text{ cm}^2$" },
              { label: "C", teks: "$1.232\\text{ cm}^2$" },
              { label: "D", teks: "$154\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas permukaan bola: $L = 4\\pi r^2 = 4 \\times \\frac{22}{7} \\times 49 = 4 \\times 154 = 616\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah cetakan nasi tumpeng berbentuk kerucut memiliki diameter alas $14\\text{ cm}$ dan tinggi $15\\text{ cm}$. Volume cetakan tumpeng tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$770\\text{ cm}^3$" },
              { label: "B", teks: "$1.540\\text{ cm}^3$" },
              { label: "C", teks: "$2.310\\text{ cm}^3$" },
              { label: "D", teks: "$385\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Diameter $= 14\\text{ cm} \\implies r = 7\\text{ cm}$. $V = \\frac{1}{3}\\pi r^2 t = \\frac{1}{3} \\times \\frac{22}{7} \\times 49 \\times 15 = 154 \\times 5 = 770\\text{ cm}^3$.",
          },
          {
            teksSoal: "Luas seluruh permukaan tabung tertutup dengan jari-jari alas $7\\text{ cm}$ dan tinggi $15\\text{ cm}$ adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$968\\text{ cm}^2$" },
              { label: "B", teks: "$868\\text{ cm}^2$" },
              { label: "C", teks: "$1.024\\text{ cm}^2$" },
              { label: "D", teks: "$660\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas seluruh permukaan tabung tertutup: $L = 2\\pi r(r + t) = 2 \\times \\frac{22}{7} \\times 7 \\times (7 + 15) = 44 \\times 22 = 968\\text{ cm}^2$.",
          },
          {
            teksSoal: "Sebuah drum minyak berbentuk tabung memiliki jari-jari $7\\text{ dm}$ dan tinggi $10\\text{ dm}$. Jika drum terisi minyak penuh, volume minyak adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.540\\text{ liter}$" },
              { label: "B", teks: "$3.080\\text{ liter}$" },
              { label: "C", teks: "$770\\text{ liter}$" },
              { label: "D", teks: "$6.160\\text{ liter}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "$V = \\pi r^2 t = \\frac{22}{7} \\times 49 \\times 10 = 1.540\\text{ dm}^3 = 1.540\\text{ liter}$.",
          },
          {
            teksSoal: "Sebuah belahan bola padat (setengah bola pejal) memiliki jari-jari $7\\text{ cm}$. Luas seluruh permukaannya adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$462\\text{ cm}^2$" },
              { label: "B", teks: "$308\\text{ cm}^2$" },
              { label: "C", teks: "$616\\text{ cm}^2$" },
              { label: "D", teks: "$154\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas permukaan setengah bola pejal $= 3\\pi r^2 = 3 \\times \\frac{22}{7} \\times 49 = 3 \\times 154 = 462\\text{ cm}^2$.",
          },
        ];
      } else if (isGeometriBangunRuang) {
        seedPool = [
          {
            teksSoal: "Sebuah balok memiliki ukuran panjang $12\\text{ cm}$, lebar $8\\text{ cm}$, dan tinggi $5\\text{ cm}$. Volume balok tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$480\\text{ cm}^3$" },
              { label: "B", teks: "$420\\text{ cm}^3$" },
              { label: "C", teks: "$360\\text{ cm}^3$" },
              { label: "D", teks: "$240\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume balok dihitung dengan rumus $V = p \\times l \\times t = 12 \\times 8 \\times 5 = 480\\text{ cm}^3$.",
          },
          {
            teksSoal: "Sebuah kubus memiliki panjang rusuk $6\\text{ cm}$. Luas seluruh permukaan kubus tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$216\\text{ cm}^2$" },
              { label: "B", teks: "$180\\text{ cm}^2$" },
              { label: "C", teks: "$144\\text{ cm}^2$" },
              { label: "D", teks: "$96\\text{ cm}^2$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Luas permukaan kubus memiliki 6 sisi persegi identik: $L = 6 \\times s^2 = 6 \\times 6^2 = 6 \\times 36 = 216\\text{ cm}^2$.",
          },
          {
            teksSoal: "Banyaknya rusuk dan titik sudut pada sebuah prisma segitiga berturut-turut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$9$ rusuk dan $6$ titik sudut" },
              { label: "B", teks: "$6$ rusuk dan $9$ titik sudut" },
              { label: "C", teks: "$8$ rusuk dan $5$ titik sudut" },
              { label: "D", teks: "$12$ rusuk dan $8$ titik sudut" },
            ],
            kunciJawaban: "A",
            pembahasan: "Prisma segitiga memiliki 9 rusuk (3 rusuk alas, 3 rusuk tutup, 3 rusuk tegak) dan 6 titik sudut.",
          },
          {
            teksSoal: "Sebuah tabung memiliki jari-jari alas $7\\text{ cm}$ dan tinggi $10\\text{ cm}$. Dengan menggunakan $\\pi = \\frac{22}{7}$, volume tabung tersebut adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.540\\text{ cm}^3$" },
              { label: "B", teks: "$1.450\\text{ cm}^3$" },
              { label: "C", teks: "$770\\text{ cm}^3$" },
              { label: "D", teks: "$440\\text{ cm}^3$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume tabung dihitung dengan rumus $V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = 154 \\times 10 = 1.540\\text{ cm}^3$.",
          },
          {
            teksSoal: "Sebuah bak penampungan air berbentuk kubus dengan panjang rusuk bagian dalam $1\\text{ meter}$. Jika bak terisi air penuh, maka volume air di dalam bak adalah ...",
            opsiJawaban: [
              { label: "A", teks: "$1.000\\text{ liter}$" },
              { label: "B", teks: "$100\\text{ liter}$" },
              { label: "C", teks: "$500\\text{ liter}$" },
              { label: "D", teks: "$10.000\\text{ liter}$" },
            ],
            kunciJawaban: "A",
            pembahasan: "Volume kubus $V = s^3 = 1\\text{ m}^3$. Karena $1\\text{ m}^3 = 1.000\\text{ dm}^3 = 1.000\\text{ liter}$, maka volume air adalah $1.000\\text{ liter}$.",
          },
        ];
      }

      if (seedPool && seedPool.length > 0 && kodeMapel === 'mtk') {
        for (let i = 1; i <= sisa; i++) {
          const no = terpilih.length + 1;
          const templateDipilih = seedPool[(no - 1) % seedPool.length];
          terpilih.push(normalisasiButirSoal({
            id: `seed-${fokusLower ? 'fokus' : 'geom'}-${Date.now()}-${no}`,
            nomor: no,
            teksSoal: templateDipilih.teksSoal,
            opsiJawaban: templateDipilih.opsiJawaban,
            kunciJawaban: templateDipilih.kunciJawaban,
            pembahasan: templateDipilih.pembahasan,
            materi: fokusAktif ? `${judulBab} (${fokusAktif})` : judulBab,
          }, terpilih.length));
        }
      }
    }

    if (terpilih.length === 0) {
      setSoalTerpilih([]);
      setPesanStatus(
        `⚠️ Bank Soal belum memiliki butir aktif yang cocok untuk materi "${babTerpilihObj.judul}". Sistem tidak akan memaksakan soal generik. Silakan gunakan tab "✍️ Tulis Soal Mandiri" untuk mengetik soal Anda sendiri, atau gunakan tab "📂 Pakai Kuis Pribadi".`
      );
      return;
    }

    setSoalTerpilih(terpilih);
    if (terpilih.length < jumlahTarget) {
      setPesanStatus(
        `✨ Ditemukan ${terpilih.length} butir soal terverifikasi untuk ${babTerpilihObj.judul}${fokusAktif ? ` (Fokus: ${fokusAktif})` : ''}. Anda dapat melengkapinya via tab "✍️ Tulis Soal Mandiri".`
      );
    } else {
      setPesanStatus(
        `✨ Berhasil menyiapkan ${terpilih.length} butir soal terverifikasi untuk ${babTerpilihObj.judul}${fokusAktif ? ` (Fokus: ${fokusAktif})` : ''}`
      );
    }
  };

  // Toggle pilihan butir soal pada mode manual
  const handleTogglePilihManual = (soal) => {
    const ada = soalTerpilih.some((s) => s.id === soal.id);
    if (ada) {
      setSoalTerpilih(soalTerpilih.filter((s) => s.id !== soal.id));
    } else {
      if (soalTerpilih.length >= 15) {
        alert('Maksimal 15 soal untuk satu sesi latihan formatif agar siswa tidak kelelahan.');
        return;
      }
      setSoalTerpilih([...soalTerpilih, soal]);
    }
  };

  // Hapus butir soal dari daftar review
  const handleHapusSoal = (indexHapus) => {
    setSoalTerpilih(soalTerpilih.filter((_, idx) => idx !== indexHapus));
  };

  // 5. Simpan & Terbitkan Latihan ke Jadwal Bimbel
  const handleTerbitkanLatihan = async () => {
    if (!schedule?.id) return;
    if (soalTerpilih.length === 0) {
      alert('Pilih atau siapkan minimal 1 soal sebelum menerbitkan latihan sesi.');
      return;
    }

    setSaving(true);
    try {
      const dataLatihan = {
        id: schedule.latihanSesi?.id || `lat-${schedule.id}-${Date.now()}`,
        judul: isKelasMandiri
          ? `Latihan Mandiri Terpandu: ${babTerpilihObj?.judul || 'Sesi Hari Ini'}${fokusAktif ? ` (Fokus: ${fokusAktif})` : ''}`
          : `Latihan Pemahaman: ${babTerpilihObj?.judul || 'Sesi Hari Ini'}${fokusAktif ? ` (Fokus: ${fokusAktif})` : ''}`,
        babId: selectedBabId,
        babJudul: babTerpilihObj?.judul || '',
        subBab: selectedSubBab || '',
        fokusBahasan: fokusAktif || '',
        kuisModulId: modePilihan === 'kuis_guru' ? selectedKuisId : (schedule.latihanSesi?.kuisModulId || null),
        sumberLatihan: modePilihan === 'kuis_guru' ? 'kuis_mandiri' : 'bank_soal',
        totalSoal: soalTerpilih.length,
        durasiMenit: Number(durasiMenit) || 15,
        blindSubmission: Boolean(blindSubmission),
        acakSoal: Boolean(acakUrutan),
        isKelasMandiri: Boolean(isKelasMandiri),
        tipeSesi: isKelasMandiri ? 'mandiri' : 'tatap_muka',
        pesanInstruksi: isKelasMandiri ? 'Tentor sesi hari ini berhalangan hadir. Sesi kelas dialihkan menjadi Belajar Mandiri Terpandu.' : '',
        terbitPada: schedule.latihanSesi?.terbitPada || new Date().toISOString(),
        diperbaruiPada: new Date().toISOString(),
        status: 'aktif',
        soalList: soalTerpilih.map((s, idx) => ({
          id: s.id || `soal-${idx + 1}`,
          nomor: idx + 1,
          teksSoal: s.teksSoal || '',
          opsiJawaban: s.opsiJawaban || [],
          kunciJawaban: s.kunciJawaban || 'A',
          pembahasan: s.pembahasan || '',
          gambarUrls: s.gambarUrls || [],
        })),
        hasil: schedule.latihanSesi?.hasil || {},
      };

      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), {
        latihanSesi: dataLatihan,
        isKelasMandiri: Boolean(isKelasMandiri),
        materiTerakhir: `${babTerpilihObj?.judul || ''}${selectedSubBab ? ' — ' + selectedSubBab : ''}${fokusAktif ? ` [Fokus: ${fokusAktif}]` : ''}`,
        babId: selectedBabId,
        babJudul: babTerpilihObj?.judul || '',
        subBab: selectedSubBab || '',
        fokusBahasan: fokusAktif || '',
      });

      alert(
        isKelasMandiri
          ? `⚡ Mode Kelas Mandiri Berhasil Diaktifkan!\n\n${soalTerpilih.length} butir soal terbit untuk kelas mandiri ${schedule.title || 'Sesi Ini'}.\nSiswa di kelas dapat langsung membuka panduan materi dan latihan mandiri di Dashboard Siswa.`
          : `✅ Latihan Sesi Berhasil Diterbitkan!\n\n${soalTerpilih.length} butir soal kini aktif untuk kelas ${schedule.title || 'Sesi Ini'}.\nSiswa dapat langsung membukanya di Dashboard Siswa dengan mode Blind Submission.`
      );
      if (onSuccess) onSuccess(dataLatihan);
      if (onClose) onClose();
    } catch (err) {
      console.error('Gagal menerbitkan latihan sesi:', err);
      alert('Gagal menerbitkan latihan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  // 6. Tutup / Hapus Sesi Latihan
  const handleTutupLatihan = async () => {
    if (!window.confirm('Tutup sesi latihan ini? Siswa yang belum mengerjakan tidak akan bisa mengakses lagi.')) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), {
        'latihanSesi.status': 'ditutup',
      });
      alert('Latihan sesi telah ditutup.');
      if (onSuccess) onSuccess({ ...schedule.latihanSesi, status: 'ditutup' });
      if (onClose) onClose();
    } catch (err) {
      alert('Gagal menutup latihan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleHapusLatihan = async () => {
    if (!window.confirm('Hapus seluruh paket latihan sesi ini dari jadwal kelas? Data yang sudah tersimpan akan dibersihkan.')) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'jadwal_bimbel', schedule.id), {
        latihanSesi: null,
      });
      alert('Paket latihan sesi berhasil dihapus.');
      if (onSuccess) onSuccess(null);
      if (onClose) onClose();
    } catch (err) {
      alert('Gagal menghapus latihan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 820,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                }}
              >
                Pra-Kelas · Verifikasi Guru
              </span>
              <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>
                🎯 Penyiapan Latihan Pemahaman Sesi
              </h3>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#64748b' }}>
              Kelas: <b>{(schedule?.title && schedule?.title !== 'Materi Umum') ? schedule.title : namaMapelLengkap(kodeMapel)}</b> · {schedule?.planet || 'Ruang Kelas'} · {schedule?.start} - {schedule?.end}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {isJenjangSD && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                color: '#92400e',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🌱</span>
              <div>
                <b>Pengecualian Sementara:</b> Penyiapan latihan pemahaman sesi tatap muka saat ini difokuskan penuh untuk jenjang <b>SMP</b> dan <b>SMA</b>. Untuk kelas <b>SD</b>, materi pembelajaran dicatat secara mandiri oleh tentor di laporan sesi.
              </div>
            </div>
          )}
          {/* Status Aktif Latihan Sebelumnya */}
          {schedule?.latihanSesi?.status === 'aktif' && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={16} /> Latihan Sesi Ini Sedang Aktif di Siswa
                </div>
                <div style={{ fontSize: 11.5, color: '#15803d', marginTop: 2 }}>
                  Judul: <b>{schedule.latihanSesi.judul}</b> · {schedule.latihanSesi.totalSoal} Soal · Diterbitkan {new Date(schedule.latihanSesi.terbitPada).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleTutupLatihan}
                  disabled={saving}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🔒 Tutup Latihan
                </button>
                <button
                  type="button"
                  onClick={handleHapusLatihan}
                  disabled={saving}
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} style={{ display: 'inline', verticalAlign: -1 }} /> Hapus
                </button>
              </div>
            </div>
          )}

          {/* 1. Pemilihan Bab Silabus Kurikulum Merdeka */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} color="#4f46e5" /> 1. Tentukan Bab & Pokok Bahasan Hari Ini
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setSemesterPilihan('1')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: semesterPilihan === '1' ? '#4f46e5' : '#e2e8f0',
                    color: semesterPilihan === '1' ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Semester 1 (Ganjil)
                </button>
                <button
                  type="button"
                  onClick={() => setSemesterPilihan('2')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: semesterPilihan === '2' ? '#4f46e5' : '#e2e8f0',
                    color: semesterPilihan === '2' ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  Semester 2 (Genap)
                </button>
              </div>
            </div>

            <select
              value={selectedBabId}
              onChange={(e) => {
                setSelectedBabId(e.target.value);
                const b = listBab.find((item) => item.id === e.target.value);
                if (b) setSelectedSubBab(b.subBab?.[0] || '');
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
                color: '#1e293b',
                background: '#ffffff',
                marginBottom: 8,
                outline: 'none',
                fontWeight: 600,
              }}
            >
              <option value="">-- Pilih Bab Silabus Kurikulum Merdeka --</option>
              {listBab.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.judul} {b.alokasiSesi ? `(${b.alokasiSesi} Sesi)` : ''}
                </option>
              ))}
            </select>

            {babTerpilihObj && Array.isArray(babTerpilihObj.subBab) && babTerpilihObj.subBab.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Sub-Bab / Topik Bahasan:
                </label>
                <select
                  value={selectedSubBab}
                  onChange={(e) => setSelectedSubBab(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    color: '#334155',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  {babTerpilihObj.subBab.map((sub, i) => (
                    <option key={i} value={sub}>
                      {i + 1}. {sub}
                    </option>
                  ))}
                </select>

                {/* 1.B Granularitas / Fokus Spesifik Hari Ini (Misal: Tabung saja, Kerucut saja, GLB saja) */}
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Tag size={13} color="#4f46e5" />
                      🎯 Fokus Bahasan Sesi Hari Ini (Jika Materi Baru Diajarkan Sebagian):
                    </label>
                    {fokusAktif && (
                      <button
                        type="button"
                        onClick={() => {
                          setFokusBahasan('');
                          setFokusKustom('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Reset Fokus
                      </button>
                    )}
                  </div>

                  {/* Chips Pilihan Cepat Sub-Topik Granular */}
                  {subBabChips.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setFokusBahasan('');
                          setFokusKustom('');
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          border: !fokusAktif ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                          background: !fokusAktif ? '#eef2ff' : '#f8fafc',
                          color: !fokusAktif ? '#4338ca' : '#64748b',
                          fontSize: 11,
                          fontWeight: !fokusAktif ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        🌐 Seluruh Sub-Bab (Gabungan)
                      </button>
                      {subBabChips.map((chip, idx) => {
                        const isSelected = fokusBahasan.toLowerCase() === chip.toLowerCase() && !fokusKustom;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFokusBahasan(chip);
                              setFokusKustom('');
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 20,
                              border: isSelected ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
                              background: isSelected ? '#faf5ff' : '#ffffff',
                              color: isSelected ? '#6b21a8' : '#334155',
                              fontSize: 11,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>🔹 {chip} Saja</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Kolom Teks Fokus Kustom Bebas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="text"
                      value={fokusKustom}
                      onChange={(e) => setFokusKustom(e.target.value)}
                      placeholder="Atau ketik topik spesifik hari ini (mis: Tabung saja, Luas Permukaan Tabung, Eliminasi SPLDV)..."
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 11.5,
                        outline: 'none',
                        background: '#f8fafc',
                      }}
                    />
                  </div>
                  {fokusAktif && (
                    <div style={{ fontSize: 10.5, color: '#6b21a8', marginTop: 5 }}>
                      ✨ Rekomendasi AI & filter Bank Soal akan difokuskan khusus pada: <b>{fokusAktif}</b>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Metode Penyiapan Soal: Otonomi Privat Tentor (Tulis Mandiri / Kuis Pribadi / Bank Soal / Rekomendasi) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setModePilihan('tulis_mandiri')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: modePilihan === 'tulis_mandiri' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  background: modePilihan === 'tulis_mandiri' ? '#eef2ff' : '#ffffff',
                  color: modePilihan === 'tulis_mandiri' ? '#3730a3' : '#64748b',
                  fontWeight: 700,
                  fontSize: 11.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <PenTool size={14} color={modePilihan === 'tulis_mandiri' ? '#4f46e5' : '#64748b'} />
                ✍️ Tulis Soal Mandiri
              </button>
              <button
                type="button"
                onClick={() => setModePilihan('kuis_guru')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: modePilihan === 'kuis_guru' ? '2px solid #059669' : '1px solid #e2e8f0',
                  background: modePilihan === 'kuis_guru' ? '#ecfdf5' : '#ffffff',
                  color: modePilihan === 'kuis_guru' ? '#065f46' : '#64748b',
                  fontWeight: 700,
                  fontSize: 11.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <FolderCheck size={14} color={modePilihan === 'kuis_guru' ? '#059669' : '#64748b'} />
                📂 Pakai Kuis Pribadi ({kuisTersediaList.length})
              </button>
              <button
                type="button"
                onClick={() => setModePilihan('manual')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: modePilihan === 'manual' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: modePilihan === 'manual' ? '#f0f9ff' : '#ffffff',
                  color: modePilihan === 'manual' ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  fontSize: 11.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <ListChecks size={14} color={modePilihan === 'manual' ? '#0284c7' : '#64748b'} />
                📋 Bank Soal ({bankSoalList.length})
              </button>
              <button
                type="button"
                onClick={() => setModePilihan('rekomendasi')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: modePilihan === 'rekomendasi' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                  background: modePilihan === 'rekomendasi' ? '#faf5ff' : '#ffffff',
                  color: modePilihan === 'rekomendasi' ? '#6b21a8' : '#64748b',
                  fontWeight: 700,
                  fontSize: 11.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} color={modePilihan === 'rekomendasi' ? '#7c3aed' : '#64748b'} />
                ✨ Rekomendasi Cerdas
              </button>
            </div>

            {/* Panel Mode Tulis Soal Mandiri (Otonomi Privat Tentor) */}
            {modePilihan === 'tulis_mandiri' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #c7d2fe',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#312e81', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PenTool size={16} color="#4338ca" /> Tulis Butir Soal Mandiri (Khusus Sesi Ini)
                    </div>
                    <div style={{ fontSize: 11, color: '#6366f1', marginTop: 2 }}>
                      Ketik soal orisinal sesuai materi yang diajarkan hari ini. Bersifat privat untuk sesi kelas Anda.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewMath(!previewMath)}
                    style={{
                      background: previewMath ? '#4f46e5' : '#e0e7ff',
                      color: previewMath ? '#ffffff' : '#3730a3',
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Eye size={13} /> {previewMath ? 'Tutup Preview Math' : 'Live KaTeX Preview'}
                  </button>
                </div>

                {/* Teks Pertanyaan */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Pertanyaan / Teks Soal: <span style={{ fontSize: 10.5, fontWeight: 400, color: '#64748b' }}>{"(Dukungan rumus matematika KaTeX: ketik $r = 7\\text{ cm}$ atau $\\pi r^2 t$)"}</span>
                  </label>
                  <textarea
                    rows={3}
                    value={teksSoalBaru}
                    onChange={(e) => setTeksSoalBaru(e.target.value)}
                    placeholder="Contoh: Sebuah tabung memiliki jari-jari $r = 7\text{ cm}$ dan tinggi $t = 10\text{ cm}$. Dengan $\pi = \frac{22}{7}$, volume tabung adalah ..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12.5,
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {previewMath && teksSoalBaru && (
                    <div style={{ marginTop: 6, padding: '8px 12px', background: '#ffffff', border: '1px dashed #818cf8', borderRadius: 8, fontSize: 12.5 }}>
                      <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700, marginBottom: 2 }}>Preview KaTeX:</div>
                      <RenderMath text={teksSoalBaru} />
                    </div>
                  )}
                </div>

                {/* Opsi Pilihan Ganda (A, B, C, D) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Pilihan A {kunciBaru === 'A' && <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ (Kunci)</span>}:
                    </label>
                    <input
                      type="text"
                      value={opsiBaruA}
                      onChange={(e) => setOpsiBaruA(e.target.value)}
                      placeholder="Jawaban A (mis: $1.540\text{ cm}^3$)"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Pilihan B {kunciBaru === 'B' && <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ (Kunci)</span>}:
                    </label>
                    <input
                      type="text"
                      value={opsiBaruB}
                      onChange={(e) => setOpsiBaruB(e.target.value)}
                      placeholder="Jawaban B"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Pilihan C {kunciBaru === 'C' && <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ (Kunci)</span>}:
                    </label>
                    <input
                      type="text"
                      value={opsiBaruC}
                      onChange={(e) => setOpsiBaruC(e.target.value)}
                      placeholder="Jawaban C (opsional)"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Pilihan D {kunciBaru === 'D' && <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ (Kunci)</span>}:
                    </label>
                    <input
                      type="text"
                      value={opsiBaruD}
                      onChange={(e) => setOpsiBaruD(e.target.value)}
                      placeholder="Jawaban D (opsional)"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Baris Kunci Jawaban, Pembahasan Singkat, Gambar & Tombol Tambah */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ minWidth: 120 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Kunci Jawaban:
                    </label>
                    <select
                      value={kunciBaru}
                      onChange={(e) => setKunciBaru(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #86efac', fontSize: 12, fontWeight: 700, color: '#166534', background: '#f0fdf4' }}
                    >
                      <option value="A">Pilihan A</option>
                      <option value="B">Pilihan B</option>
                      <option value="C">Pilihan C</option>
                      <option value="D">Pilihan D</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      Pembahasan Singkat (Opsional):
                    </label>
                    <input
                      type="text"
                      value={pembahasanBaru}
                      onChange={(e) => setPembahasanBaru(e.target.value)}
                      placeholder="Rumus/Langkah penyelesaian..."
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 2 }}>
                      URL Gambar (Opsional):
                    </label>
                    <input
                      type="text"
                      value={gambarUrlBaru}
                      onChange={(e) => setGambarUrlBaru(e.target.value)}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTambahSoalMandiri}
                    style={{
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    <Plus size={15} /> Tambahkan ke Latihan
                  </button>
                </div>
              </div>
            )}

            {/* Panel Mode Rekomendasi Cerdas */}
            {modePilihan === 'rekomendasi' && (
              <div
                style={{
                  background: '#faf5ff',
                  border: '1px dashed #d8b4fe',
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#581c87' }}>
                    Tarik Butir Soal Sesuai Silabus Hari Ini
                  </div>
                  <div style={{ fontSize: 11, color: '#7e22ce', marginTop: 2 }}>
                    Sistem memfilter bank soal yang paling cocok dengan <b>{babTerpilihObj?.judul || 'Bab Ini'}</b>
                    {fokusAktif ? <span> · Fokus: <b>{fokusAktif}</b></span> : ''}.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleTerapkanRekomendasi(5)}
                    style={{
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={13} /> Siapkan 5 Soal Cepat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTerapkanRekomendasi(10)}
                    style={{
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '7px 12px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Siapkan 10 Soal
                  </button>
                </div>
              </div>
            )}

            {/* Panel Mode Pakai Kuis yang Sudah Pernah Dibuat (E-Learning) */}
            {modePilihan === 'kuis_guru' && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
                    📂 Gunakan Kuis yang Sudah Pernah Dibuat di E-Learning
                  </div>
                  <div style={{ fontSize: 11.5, color: '#15803d', marginTop: 2 }}>
                    Pilih kuis mandiri yang sudah pernah Anda buat di modul / e-learning sebelumnya.
                    Seluruh butir soal akan langsung dipasang untuk aktivitas latihan kelas hari ini tanpa perlu input ulang!
                  </div>
                </div>

                {loadingKuis ? (
                  <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: '#15803d' }}>
                    Memuat kuis dari e-learning...
                  </div>
                ) : kuisTersediaList.length === 0 ? (
                  <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: '#15803d', background: '#ffffff', borderRadius: 8 }}>
                    Belum ada kuis yang ditemukan untuk mata pelajaran ini. Anda dapat menggunakan tab <b>"✍️ Tulis Soal Mandiri"</b> untuk mengetik soal pribadi Anda, atau centang dari Bank Soal.
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={selectedKuisId}
                        onChange={(e) => setSelectedKuisId(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 260,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid #86efac',
                          fontSize: 12,
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {kuisTersediaList.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.isMine ? '★ [Kuis Saya] ' : ''}{k.title} ({k.totalQuestions} Soal{k.subject ? ` · ${k.subject}` : ''})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleTerapkanKuisModul()}
                        style={{
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <FolderCheck size={14} /> Pasang Kuis Ini ke Sesi
                      </button>
                    </div>

                    {/* Info ringkas kuis terpilih */}
                    {selectedKuisId && (() => {
                      const k = kuisTersediaList.find((item) => item.id === selectedKuisId);
                      if (!k) return null;
                      return (
                        <div style={{ marginTop: 8, fontSize: 11, color: '#166534', background: '#dcfce7', padding: '6px 10px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            <b>{k.title}</b> · Mapel: {k.subject || 'Umum'} · {k.totalQuestions} Soal
                            {k.guruName ? ` · Dibuat oleh: ${k.guruName}` : ''}
                          </span>
                          <span style={{ fontSize: 10.5, color: '#15803d' }}>
                            ID: {k.id.slice(0, 8)}...
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Panel Mode Manual */}
            {modePilihan === 'manual' && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {loadingBank ? (
                  <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                    Memuat butir dari Bank Soal...
                  </div>
                ) : bankSoalList.length === 0 ? (
                  <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                    Belum ada butir bank soal aktif untuk mapel ini. Gunakan mode Rekomendasi Cerdas di atas.
                  </div>
                ) : (
                  bankSoalList.map((soal) => {
                    const isSelected = soalTerpilih.some((s) => s.id === soal.id);
                    return (
                      <div
                        key={soal.id}
                        onClick={() => handleTogglePilihManual(soal)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: isSelected ? '#e0f2fe' : '#ffffff',
                          border: isSelected ? '1px solid #7dd3fc' : '1px solid #e2e8f0',
                          marginBottom: 6,
                          cursor: 'pointer',
                          transition: '0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ marginTop: 3, cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1, fontSize: 12, color: '#1e293b' }}>
                          <div style={{ fontWeight: 600, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            <RenderMath text={soal.teksSoal} />
                          </div>
                          {soal.gambarUrls && soal.gambarUrls.length > 0 && (
                            <div style={{ fontSize: 10, color: '#4338ca', marginTop: 2 }}>
                              🖼️ Membawa {soal.gambarUrls.length} Gambar
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                            Kunci: <b>{soal.kunciJawaban || 'A'}</b> · Materi: {soal.materi || babTerpilihObj?.judul || 'Umum'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {pesanStatus && (
            <div style={{ fontSize: 11.5, color: '#047857', background: '#ecfdf5', padding: '6px 10px', borderRadius: 6, marginBottom: 14 }}>
              {pesanStatus}
            </div>
          )}

          {/* 3. Tinjau & Review Soal yang Akan Diterbitkan (DENGAN RENDERMATH & GAMBAR UTUH) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📖 Tinjau Butir Soal Terpilih ({soalTerpilih.length} Soal)</span>
              </div>
              {soalTerpilih.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Kosongkan semua butir soal dalam daftar terpilih ini? Anda dapat memilih atau menulis butir soal baru.')) {
                      setSoalTerpilih([]);
                      setPesanStatus('🗑️ Daftar soal telah dikosongkan. Silakan tulis soal mandiri atau pilih butir baru.');
                    }
                  }}
                  title="Kosongkan seluruh butir yang dipilih dan buat baru"
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Trash2 size={12} /> 🗑️ Kosongkan & Buat Ulang
                </button>
              )}
            </div>

            {soalTerpilih.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 12,
                  color: '#64748b',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Belum Ada Butir Soal Terpilih
                </div>
                <div>
                  Silakan tulis soal orisinal di tab <b>"✍️ Tulis Soal Mandiri"</b>, gunakan kuis di tab <b>"📂 Pakai Kuis Pribadi"</b>, atau pilih dari Bank Soal.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {soalTerpilih.map((soal, idx) => (
                  <div
                    key={soal.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 16,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Header Butir Soal */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: '#eef2ff', color: '#4338ca', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                          Soal #{idx + 1}
                        </span>
                        {soal.materi && (
                          <span style={{ fontSize: 10.5, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                            {soal.materi}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleHapusSoal(idx)}
                        title="Hapus butir ini dari paket latihan"
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>

                    {/* Badan Soal: KaTeX Matematika Rapi + Gambar Utuh */}
                    <div style={{ marginBottom: 12 }}>
                      <TeksSoalBergambar
                        teks={soal.teksSoal}
                        gambarUrls={soal.gambarUrls || []}
                        gayaTeks={{ fontSize: 13.5, lineHeight: 1.6, color: '#0f172a' }}
                        gayaGambar={{ maxHeight: 220, margin: '10px 0', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }}
                      />
                    </div>

                    {/* Opsi Jawaban Terstruktur & RenderMath */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                      {Array.isArray(soal.opsiJawaban) &&
                        soal.opsiJawaban.map((op, oIdx) => {
                          const isKunci = String(op.label).toUpperCase() === String(soal.kunciJawaban || 'A').toUpperCase();
                          return (
                            <div
                              key={oIdx}
                              style={{
                                fontSize: 12,
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: isKunci ? '#f0fdf4' : '#f8fafc',
                                border: isKunci ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                                color: isKunci ? '#15803d' : '#1e293b',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: isKunci ? '#16a34a' : '#e2e8f0',
                                  color: isKunci ? '#ffffff' : '#334155',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {op.label}
                              </span>
                              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                                <RenderMath text={op.teks} />
                                {isKunci && (
                                  <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 800, color: '#16a34a' }}>
                                    ✓ (Kunci)
                                  </span>
                                )}
                                {Array.isArray(op.gambar) && op.gambar.length > 0 && (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                    {op.gambar.map((g, gi) => (
                                      <img
                                        key={gi}
                                        src={typeof g === 'string' ? g : g?.url}
                                        alt={`Gambar opsi ${op.label}`}
                                        style={{ maxHeight: 90, borderRadius: 6, border: '1px solid #cbd5e1' }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Pengaman Anti-Cheating & Pengaturan Sesi */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <ShieldCheck size={15} color="#059669" /> 3. Pengaman Anti-Cheating & Perilaku Formatif
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Blind Submission */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={blindSubmission}
                  onChange={(e) => setBlindSubmission(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span>
                  <b>Blind Submission (Sembunyikan Kunci Jawaban Instan)</b>
                  <span style={{ display: 'block', fontSize: 10.5, color: '#64748b' }}>
                    Setelah kirim, siswa HANYA melihat pesan apresiasi + bonus XP. Kunci jawaban tidak dibuka agar teman sebangku tidak menyalin jawaban.
                  </span>
                </span>
              </label>

              {/* Acak Soal & Opsi */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={acakUrutan}
                  onChange={(e) => setAcakUrutan(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span>
                  <b>Acak Urutan Soal & Pilihan Ganda (A/B/C/D) Per Siswa</b>
                  <span style={{ display: 'block', fontSize: 10.5, color: '#64748b' }}>
                    Nomor 1 dan urutan opsi di HP Siswa A berbeda dengan Siswa B sehingga mencontek huruf teman sebelah tidak berguna.
                  </span>
                </span>
              </label>

              {/* Alokasi Waktu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#475569' }}>Perkiraan Waktu Pengerjaan di Kelas:</span>
                <select
                  value={durasiMenit}
                  onChange={(e) => setDurasiMenit(Number(e.target.value))}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 11,
                    background: '#ffffff',
                  }}
                >
                  <option value={10}>10 Menit (Refleksi Cepat)</option>
                  <option value={15}>15 Menit (Standar Formatif)</option>
                  <option value={20}>20 Menit (Pendalaman Soal)</option>
                  <option value={30}>30 Menit (Kuis Sesi Panjang)</option>
                </select>
              </div>

              {/* Mode Sesi Mandiri Terpandu */}
              <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px dashed #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11.5, color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isKelasMandiri}
                    onChange={(e) => setIsKelasMandiri(e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer' }}
                  />
                  <span>
                    <b style={{ color: isKelasMandiri ? '#4338ca' : '#1e293b' }}>
                      ⚡ Aktifkan Mode Sesi Mandiri Terpandu (Tentor Berhalangan Hadir)
                    </b>
                    <span style={{ display: 'block', fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                      Centang ini jika tentor sesi berhalangan hadir. Siswa akan menerima instruksi panduan belajar mandiri & latihan terarah di kelas sehingga kegiatan belajar tetap produktif.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div style={{ fontSize: 11, color: '#64748b' }}>
            Total {soalTerpilih.length} butir soal siap diterbitkan.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleTerbitkanLatihan}
              disabled={saving || soalTerpilih.length === 0}
              style={{
                background: saving || soalTerpilih.length === 0 ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: saving || soalTerpilih.length === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
              }}
            >
              <Send size={14} /> {saving ? 'Menerbitkan...' : '🚀 Terbitkan Latihan ke Kelas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
