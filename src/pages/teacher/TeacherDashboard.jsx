// src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import {
  collection, query, where, getDocs, doc, getDoc,
  orderBy, serverTimestamp, limit, onSnapshot, updateDoc, writeBatch
} from "firebase/firestore";
import {
  Clock, Users, BookOpen, Star, ArrowRight,
  Calendar, Layout, MapPin, X, ChevronRight,
  TrendingUp, Award, Megaphone,
  Home, LogOut, Settings, Bell, Sparkles,
  ChevronDown, Menu, Sun, Moon, Gift, Crown,
  Zap, Flame, Target, Layers, FileText, Send,
  CheckCircle, AlertCircle, MessageCircle, Phone,
  Video, ExternalLink, Copy, Hash, Tag, Link2,
  CalendarDays, Clock4, User, GraduationCap,
  Briefcase, BarChart3, Activity, PieChart,
  RefreshCw, Loader2, Eye, EyeOff, Radio
} from 'lucide-react';
import ModalBukuGuru from '../../components/buku/ModalBukuGuru';
import { daftarIdGuru } from '../../utils/identitasGuru';
import { bolehTampilUmum } from '../../utils/statusTryOutPaket';
import {
  FIELD_LAPORAN_BELAJAR, pengisianDibuka,
  kunciPencocokLaporan, kunciQuerySiswaUntukGuru, hitungTugasLaporanBelajar,
} from '../../utils/laporanBelajar';
import { potongUntukQuery } from '../../utils/papanJelajah';
import { tanggalLokalStr } from '../../utils/waktuLokal';
import { identitasPencariJadwal, jadwalMilikGuru, rentangTanggalJadwal } from '../../utils/identitasJadwal';
import { hitungStatistikGuru } from '../../utils/statistikGuru';
import {
  STATUS_KODE, statusKodeHarian, keteranganStatusKode, verifikasiKodeAbsen,
} from '../../utils/kodeAbsenHarian';
import { kebijakanGagalMuat } from '../../utils/keputusanMuat';
import { hapusSesiGuru } from '../../utils/sesiLoginGuru';
import { bacaLogMengajar, BATAS_LOG_DASBOR } from '../../services/logMengajarService';

// ============================================================
// KONSTANTA & FUNGSI MURNI (di luar komponen: tidak ikut render ulang)
// ============================================================
// Batas dokumen yang boleh ditarik dasbor guru per kebutuhan. Angka ini pagar
// kuota, bukan selera: lihat docs/REGISTER-BUG-DASHBOARD-GURU.md B-14/B-17.
const BATAS_PENGUMUMAN_BACA = 20; // diambil 20 terbaru, disaring portal di klien
const BATAS_PENGUMUMAN_TAMPIL = 3;
const BATAS_NOTIFIKASI_BACA = 100; // pagar biaya; notifikasi guru jarang
const BATAS_NOTIFIKASI_TAMPIL = 5;
// Batas log mengajar + penanganan indeks yang belum dipasang ada di
// services/logMengajarService.js supaya dasbor dan halaman Riwayat memakai
// SATU cara baca (dan satu tempat membuang field gaji).

// Label blok data untuk banner jujur (B-04/B-22): guru perlu tahu BAGIAN MANA
// yang gagal, bukan melihat seluruh layar jadi 0 tanpa penjelasan.
const LABEL_BLOK = {
  profil: 'Profil guru',
  jadwal: 'Jadwal mengajar',
  logs: 'Riwayat mengajar (kehadiran)',
  pengumuman: 'Pengumuman',
  notifikasi: 'Notifikasi',
  kode: 'Kode absensi harian',
};

/** Salam dihitung ulang tiap aplikasi terlihat lagi (B-23), bukan sekali seumur mount. */
const salamUntukJam = (tanggal = new Date()) => {
  const jam = tanggal.getHours();
  if (jam < 12) return 'Selamat Pagi 🌅';
  if (jam < 15) return 'Selamat Siang ☀️';
  if (jam < 19) return 'Selamat Sore 🌤️';
  return 'Selamat Malam 🌙';
};

/** Stempel waktu notifikasi bisa Timestamp/string/angka — dinormalkan ke ms. */
const waktuNotifMs = (n) => {
  const c = n?.createdAt;
  if (!c) return 0;
  if (typeof c.toMillis === 'function') return c.toMillis();
  if (typeof c.toDate === 'function') {
    const t = c.toDate().getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof c === 'string' || typeof c === 'number') {
    const t = new Date(c).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
};

/** Ringkas error Firestore jadi sebab yang bisa dibaca manusia (policy kuota). */
const ringkasErrorMuat = (e) => {
  const kode = String(e?.code || '');
  const pesan = String(e?.message || '');
  if (kode === 'resource-exhausted' || /429|quota exceeded/i.test(pesan)) return 'kuota baca habis';
  if (kode === 'failed-precondition') return 'indeks pencarian belum dipasang';
  if (kode === 'permission-denied') return 'akses ditolak';
  if (kode === 'unavailable' || /network/i.test(pesan)) return 'jaringan';
  return kode || pesan.slice(0, 40) || 'sebab tidak diketahui';
};

/** Notifikasi dianggap belum dibaca bila `isRead` (penulis) ATAU `read` (pembaca lama) falsy. */
const belumDibaca = (n) => !((n?.isRead ?? n?.read) === true);

// ============================================================
// LOGO COMPONENT - Menggunakan gambar dari folder public
// ============================================================
const LogoGemilang = ({ size = "medium", variant = "default", showText = true }) => {
  const sizes = {
    small: { width: 30, height: 30, fontSize: 12 },
    medium: { width: 40, height: 40, fontSize: 14 },
    large: { width: 60, height: 60, fontSize: 18 },
  };
  const currentSize = sizes[size] || sizes.medium;
  const logoSrc = "/pwa-192x192.png";
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <img
        src={logoSrc}
        alt="Bimbel Gemilang"
        style={{
          width: currentSize.width,
          height: currentSize.height,
          objectFit: 'contain',
          borderRadius: variant === 'dark' ? '50%' : '0',
          filter: variant === 'dark' ? 'none' : 'none',
        }}
        onError={(e) => {
          e.target.style.display = 'none';
          const parent = e.target.parentElement;
          const fallback = document.createElement('span');
          fallback.textContent = '📚';
          fallback.style.fontSize = currentSize.fontSize + 4 + 'px';
          parent.appendChild(fallback);
        }}
      />
      {showText && (
        <span style={{
          fontSize: currentSize.fontSize,
          fontWeight: 800,
          color: variant === 'dark' ? '#1A237E' : '#652D90',
          letterSpacing: '-0.5px',
        }}>
          Bimbel Gemilang
        </span>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const TeacherDashboard = () => {
  const navigate = useNavigate();
  // ── Try Out yang terhubung ke guru ini (dipilih admin di halaman Terbitkan) ──
  const [tryoutTerhubung, setTryoutTerhubung] = useState([]);
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        // FIX 2026-10: admin menyimpan `tentorId` = docId Firestore, sementara
        // kode lama di sini hanya mencari kode `guruId` (GURU-0xx) → banner
        // tidak pernah muncul. Kini KEDUA identitas dicari sekaligus
        // (lihat src/utils/identitasGuru.js).
        const ids = daftarIdGuru();
        if (ids.length === 0) return;
        const snap = await getDocs(query(collection(db, 'tryout_paket'), where('tentorId', 'in', ids)));
        if (batal) return;
        setTryoutTerhubung(snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          // 🔥 2026-10-08: filter lama hanya membuang 'nonaktif'. Begitu ada
          // status 'menunggu_approval'/'draf'/'ditolak' (Fase 2: tentor
          // mengusulkan try out), usulan yang belum disetujui akan masuk banner
          // dan terlihat seperti paket aktif. Pakai penyaring yang sama dengan
          // Perpustakaan supaya tidak ada dua daftar status.
          .filter((p) => bolehTampilUmum(p.status))
          .sort((a, b) => (b.tentorDihubungkanPada || '').localeCompare(a.tentorDihubungkanPada || '')));
      } catch { /* tampilkan kosong */ }
    })();
    return () => { batal = true; };
  }, []);
  
  // ===== STATES =====
  // v1.6.5 (item B3, keputusan owner D2/D3/D5): dasbor tidak lagi menyimpan
  // "daftar jadi" hasil sapuan SELURUH riwayat jadwal. Yang disimpan adalah
  // SATU jendela tanggal (−7..+7 hari); pengelompokan layar dan angka kartu
  // dihitung fungsi murni di utils/statistikGuru.js (teruji) supaya definisi
  // angka hanya ada di satu tempat dan biaya bacanya DATAR selamanya.
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hariIniStr, setHariIniStr] = useState(() => tanggalLokalStr());
  const [jadwalJendela, setJadwalJendela] = useState([]);
  const [logsMengajar, setLogsMengajar] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showBuku, setShowBuku] = useState(false);
  const [inputToken, setInputToken] = useState("");
  const [pesanKode, setPesanKode] = useState("");
  const [pendingSchedule, setPendingSchedule] = useState(null);
  // Kode absensi = STATUS + isi, bukan string polos. String polos membuat tiga
  // keadaan berbeda (belum dibuat admin / dokumen kosong / gagal baca karena
  // kuota) sama-sama berakhir di tuduhan "token salah" — register bug B-06.
  const [kodeAbsen, setKodeAbsen] = useState({ status: STATUS_KODE.MEMUAT, kode: '' });
  const [memuatKode, setMemuatKode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [greeting, setGreeting] = useState('');
  // Banner jujur per BLOK data (docs/POLICY-ERROR-DAN-KUOTA.md): satu kueri
  // gagal tidak boleh menular ke blok lain, dan tidak boleh menyamar jadi "0".
  const [gagalMuat, setGagalMuat] = useState({});
  // B-01: profil tanpa identitas dulu membuat spinner muter selamanya.
  const [profilBermasalah, setProfilBermasalah] = useState(null);
  // Tugas "Pengisian Laporan Belajar" (muncul saat admin membuka periode,
  // hilang otomatis bila semua siswa mapel guru ini sudah selesai diisi).
  const [laporanTugas, setLaporanTugas] = useState(null);

  // ===== REFS =====
  const notificationRef = useRef(null);
  // Penanda "kita punya data lama" — dipakai kebijakanGagalMuat agar kegagalan
  // baca mempertahankan data yang masih benar, bukan mengosongkan layar.
  const punyaJadwalRef = useRef(false);
  const punyaLogsRef = useRef(false);
  const punyaPengumumanRef = useRef(false);
  const punyaNotifRef = useRef(false);

  // ===== TURUNAN MURNI (tanpa baca data; teruji di tests/) =====
  // Identitas guru diturunkan dari PRIMITIF, bukan dari objek `guru`: setiap
  // refresh membuat objek guru baru, dan bila objek itu jadi dependensi effect
  // maka langganan jadwal akan dipasang-ulang (baca ulang) tiap refresh.
  const guruKode = guru?.guruId || '';
  const guruDocId = guru?.id || '';
  const guruTeacherId = guru?.teacherId || '';
  const guruNama = guru?.nama || '';
  const identitas = useMemo(
    () => identitasPencariJadwal({ guruId: guruKode, id: guruDocId, teacherId: guruTeacherId, nama: guruNama }),
    [guruKode, guruDocId, guruTeacherId, guruNama],
  );
  // Jendela tanggal bisnis LOKAL — bukan UTC (lihat utils/waktuLokal.js).
  const rentang = useMemo(() => rentangTanggalJadwal({ hariIniStr }), [hariIniStr]);
  const statistik = useMemo(
    () => hitungStatistikGuru({ jadwal: jadwalJendela, logs: logsMengajar, hariIniStr }),
    [jadwalJendela, logsMengajar, hariIniStr],
  );
  const todaySchedules = statistik.daftarHariIni;
  const upcomingSchedules = statistik.daftarMendatang;
  const kehadiran = statistik.kehadiran;
  const jumlahBelumDibaca = notifications.filter(belumDibaca).length;
  const daftarGagal = Object.entries(gagalMuat).filter(([, v]) => v && v.pesan);
  const keteranganKode = keteranganStatusKode(kodeAbsen.status);

  // ===== EFFECTS =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tanggal bisnis & salam disegarkan saat aplikasi kembali terlihat (B-12,
  // B-23). Dulu keduanya dihitung SEKALI saat mount: aplikasi guru yang dibiarkan
  // terbuka lewat tengah malam WIB tetap menampilkan jadwal KEMARIN sampai
  // dimuat ulang, dan salamnya salah. Tidak ada polling — hanya peristiwa
  // visibilitychange/focus, jadi nol biaya kuota tambahan.
  useEffect(() => {
    const perbarui = () => {
      const kini = tanggalLokalStr();
      setHariIniStr((lama) => (lama === kini ? lama : kini));
      setGreeting(salamUntukJam(new Date()));
    };
    queueMicrotask(perbarui); // hindari setState sinkron di badan effect
    document.addEventListener('visibilitychange', perbarui);
    window.addEventListener('focus', perbarui);
    return () => {
      document.removeEventListener('visibilitychange', perbarui);
      window.removeEventListener('focus', perbarui);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== TUGAS PENGISIAN LAPORAN BELAJAR =====
  // Reaktif terhadap sakelar admin (onSnapshot settings) sehingga kartu
  // muncul/hilang tanpa refresh — TETAPI sejak v1.6.2 dua pembakar kuota
  // dipadamkan:
  //   1. siswa tidak lagi dibaca SELURUH koleksi; hanya query tertarget
  //      `array-contains` per mapel ampuan (+ 'semua'), sebesar denominasi;
  //   2. laporan_belajar tidak lagi dibaca seluruh periode; hanya dokumen
  //      milik siswa guru ini (chunk ≤30 untuk batas `in` Firestore);
  //   3. hitungan TIDAK ulang jalan bila irisan settings yang relevan
  //      (FIELD_LAPORAN_BELAJAR) tidak berubah — perubahan gaji/sakelar/PIN
  //      oleh admin tidak lagi memicu bacaan apa pun di HP guru.
  // Logika hitungan pindah ke util murni hitungTugasLaporanBelajar (teruji).
  useEffect(() => {
    let batal = false;
    const ref = doc(db, 'settings', 'global_config');
    let sidikTerakhir;
    const hitung = async (cfgLaporan) => {
      const putus = pengisianDibuka(cfgLaporan);
      if (!putus.dibuka || !guru) { if (!batal) setLaporanTugas(null); return; }
      try {
        const pakaiSiswa = new Map();
        for (const kunci of kunciQuerySiswaUntukGuru(guru)) {
          const snap = await getDocs(query(collection(db, 'students'), where('enrolledSubjects', 'array-contains', kunci)));
          snap.docs.forEach((d) => {
            const s = { id: d.id, ...d.data() };
            if (!pakaiSiswa.has(s.id)) pakaiSiswa.set(s.id, s);
          });
        }
        const daftarSiswa = [...pakaiSiswa.values()];
        const dokLaporan = {};
        for (const chunk of potongUntukQuery(daftarSiswa.map((s) => s.id))) {
          const snapLaporan = await getDocs(query(
            collection(db, 'laporan_belajar'),
            where('periode', '==', putus.periode),
            where('studentId', 'in', chunk),
          ));
          snapLaporan.docs.forEach((d) => {
            const x = d.data();
            dokLaporan[kunciPencocokLaporan(x.studentId, x.kodeMapel)] = x;
          });
        }
        if (batal) return;
        const { total, selesai, semuaSelesai } = hitungTugasLaporanBelajar({ guru, daftarSiswa, dokLaporan });
        if (!batal) {
          setLaporanTugas({
            periode: putus.periode, periodeLabel: putus.periodeLabel || putus.periode,
            total, selesai, semuaSelesai,
          });
        }
      } catch (e) {
        console.error('Gagal memuat tugas laporan belajar:', e);
        if (!batal) setLaporanTugas(null);
      }
    };
    const unsub = onSnapshot(ref, (snap) => {
      const cfg = (snap.data() || {})[FIELD_LAPORAN_BELAJAR] || null;
      const sidik = JSON.stringify(cfg);
      if (sidik === sidikTerakhir) return; // perubahan settings LAIN: tanpa bacaan
      sidikTerakhir = sidik;
      hitung(cfg);
    }, () => { if (!batal) setLaporanTugas(null); });
    return () => { batal = true; unsub(); };
  }, [guru]);

  // ===== PEMUATAN DATA (v1.6.5: jendela tanggal + identitas tunggal) =====
  // Tiga prinsip hemat kuota yang dipegang blok ini:
  //   1. SATU kueri per kebutuhan, selalu dibatasi (jendela tanggal / limit).
  //   2. Identitas guru lewat utils/identitasJadwal (docId + kode GURU-), bukan
  //      pencocokan nama yang membuat dua halaman guru saling bertentangan.
  //   3. Kegagalan per blok dicatat jujur, data lama dipertahankan
  //      (docs/POLICY-ERROR-DAN-KUOTA.md) — tidak ada `catch` yang mengubah
  //      "tidak tahu" menjadi "kosong".
  const catatGagal = useCallback((blok, e, dataLamaAda) => {
    setGagalMuat((g) => ({ ...g, [blok]: kebijakanGagalMuat(dataLamaAda, ringkasErrorMuat(e)) }));
  }, []);

  const hapusGagal = useCallback((blok) => {
    setGagalMuat((g) => (g[blok] ? { ...g, [blok]: null } : g));
  }, []);

  const fetchTeacherProfile = useCallback(async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('teacherData'));
      if (!saved) {
        navigate('/login-guru');
        return null;
      }
      
      try {
        const teacherQuery = query(
          collection(db, "teachers"),
          where("email", "==", saved.email)
        );
        const snap = await getDocs(teacherQuery);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          const fullData = { ...saved, ...data, id: snap.docs[0].id };
          setGuru(fullData);
          hapusGagal('profil');
          return fullData;
        }
      } catch (e) {
        // v1.6.5 (B-22): cache perangkat tetap dipakai — itu lebih baik daripada
        // layar kosong — tetapi kegagalannya TIDAK lagi disembunyikan. Dulu
        // `catch { console.log(...) }` membuat kuota habis terlihat seperti
        // "data profil normal", padahal nama/mapel bisa saja sudah basi.
        console.warn('Profil guru dipakai dari cache perangkat:', e);
        catatGagal('profil', e, true);
      }
      
      setGuru(saved);
      return saved;
    } catch (e) {
      console.error('Error:', e);
      navigate('/login-guru');
      return null;
    }
  }, [navigate, catatGagal, hapusGagal]);

  // ── Kode absensi harian: SATU dokumen, dibaca ulang tanpa memuat dasbor ──
  // Keputusan owner D2 (opsi c): kode tetap dibuat admin, tetapi dasbor wajib
  // JUJUR soal keadaannya dan menyediakan "Coba lagi" yang murah (1 dokumen).
  const bacaKodeHarian = useCallback(async (tanggalStr, { senyap = false } = {}) => {
    if (!tanggalStr) return;
    if (!senyap) setMemuatKode(true);
    try {
      const snap = await getDoc(doc(db, 'settings', `daily_code_${tanggalStr}`));
      const kode = snap.exists() ? (snap.data().code || '') : '';
      setKodeAbsen({ status: statusKodeHarian({ adaDokumen: snap.exists(), kode }), kode });
      setPesanKode('');
      hapusGagal('kode');
    } catch (e) {
      console.error('Gagal membaca kode absensi harian:', e);
      setKodeAbsen({ status: STATUS_KODE.GAGAL_BACA, kode: '' });
      catatGagal('kode', e, false);
    } finally {
      if (!senyap) setMemuatKode(false);
    }
  }, [catatGagal, hapusGagal]);

  useEffect(() => {
    queueMicrotask(() => { bacaKodeHarian(hariIniStr, { senyap: true }); });
  }, [hariIniStr, bacaKodeHarian]);

  const fetchData = useCallback(async (teacher) => {
    // B-01: keluar dini TANPA menurunkan `loading` = spinner muter selamanya.
    if (!teacher) {
      setLoading(false);
      setRefreshing(false);
      return null;
    }
    const idt = identitasPencariJadwal(teacher);
    if (!idt.nama && idt.ids.length === 0) {
      setProfilBermasalah('tanpa-identitas');
      setLoading(false);
      setRefreshing(false);
      return null;
    }
    setProfilBermasalah(null);
    setLoading(true);

    // 1. LOG MENGAJAR (bahan angka kehadiran)
    if (idt.ids.length) {
      try {
        // Identitas tunggal + pembuangan field gaji: services/logMengajarService
        // (dipakai juga halaman Riwayat) — lihat register bug B-05/B-26.
        const logs = await bacaLogMengajar({ ids: idt.ids, batas: BATAS_LOG_DASBOR });
        setLogsMengajar(logs);
        punyaLogsRef.current = true;
        hapusGagal('logs');
      } catch (e) {
        console.error('Gagal memuat log mengajar:', e);
        catatGagal('logs', e, punyaLogsRef.current);
      }
    } else {
      setLogsMengajar([]);
    }

    // 2. PENGUMUMAN — portal disaring dari 20 terbaru, bukan dari 5 terbaru.
    // Dulu `limit(5)` dipasang SEBELUM filter portal: bila lima kiriman terakhir
    // admin ditujukan ke siswa, guru tidak melihat pengumuman apa pun (B-11).
    try {
      const snapAnnounce = await getDocs(query(
        collection(db, 'student_contents'),
        orderBy('createdAt', 'desc'),
        limit(BATAS_PENGUMUMAN_BACA),
      ));
      setAnnouncements(snapAnnounce.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.targetPortal === 'Guru' || p.targetPortal === 'Semua' || !p.targetPortal)
        .slice(0, BATAS_PENGUMUMAN_TAMPIL));
      punyaPengumumanRef.current = true;
      hapusGagal('pengumuman');
    } catch (e) {
      console.error('Gagal memuat pengumuman:', e);
      catatGagal('pengumuman', e, punyaPengumumanRef.current);
    }

    // 3. NOTIFIKASI — SATU kueri (dulu dua), dengan nama field yang benar-benar
    // ditulis src/utils/notifications.js: `recipientId` + `recipientType: 'guru'`
    // dan bendera `isRead`. Kueri lama mencari `userType/recipientType == 'teacher'`
    // yang tidak pernah ditulis siapa pun → panel mati total (B-02).
    if (idt.ids.length) {
      try {
        const snapNotif = await getDocs(query(
          collection(db, 'notifications'),
          where('recipientId', 'in', idt.ids),
          limit(BATAS_NOTIFIKASI_BACA),
        ));
        setNotifications(snapNotif.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((n) => {
            const tipe = String(n.recipientType || 'guru').toLowerCase();
            return tipe === 'guru' || tipe === 'teacher';
          })
          .sort((a, b) => waktuNotifMs(b) - waktuNotifMs(a))
          .slice(0, BATAS_NOTIFIKASI_TAMPIL));
        punyaNotifRef.current = true;
        hapusGagal('notifikasi');
      } catch (e) {
        console.error('Gagal memuat notifikasi:', e);
        catatGagal('notifikasi', e, punyaNotifRef.current);
      }
    }

    setLoading(false);
    setRefreshing(false);
    return teacher;
  }, [catatGagal, hapusGagal]);

  // ===== LANGGANAN JADWAL: SATU kueri jendela, identitas dicocokkan di klien =====
  // Pengganti dua pemborosan lama: (a) `getDocs` SELURUH riwayat jadwal guru
  // tanpa batas tanggal, dan (b) `onSnapshot` terpisah untuk hari ini — jadi
  // satu hari bisa membaca riwayat dua kali. Sekarang satu langganan jendela
  // −7..+7 hari (biaya DATAR, tidak tumbuh seiring umur bimbel) dan aturan
  // "jadwal ini punya siapa" berasal dari utils/identitasJadwal (ID menang;
  // nama hanya untuk data warisan tanpa teacherId) sehingga dasbor dan halaman
  // absensi tidak lagi bertentangan (B-13).
  //
  // Kueri ini SENGAJA hanya memfilter satu field (dateStr) agar cukup dengan
  // indeks tunggal: tidak bergantung indeks komposit yang harus di-deploy dulu.
  // Penyempitan lanjutan (filter teacherId juga) dicatat di register sebagai
  // langkah hemat berikutnya, bukan syarat berjalannya perbaikan ini.
  useEffect(() => {
    if (!identitas.ids.length && !identitas.nama) return undefined;
    const idt = identitas;
    const q = query(
      collection(db, 'jadwal_bimbel'),
      where('dateStr', '>=', rentang.dari),
      where('dateStr', '<=', rentang.sampai),
    );
    // Nilai kembali effect = fungsi unsubscribe itu sendiri, LANGSUNG.
    // Pola lama menyimpannya ke variabel yang diisi di dalam `init()` async,
    // sehingga bila guru pindah halaman sebelum init selesai, cleanup melihat
    // null dan langganan bocor selamanya (B-15).
    return onSnapshot(q, (snap) => {
      const milik = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((j) => jadwalMilikGuru(j, idt));
      if (milik.length > 0) punyaJadwalRef.current = true;
      setJadwalJendela(milik);
      hapusGagal('jadwal');
    }, (err) => {
      console.error('Gagal memuat jadwal (jendela):', err);
      catatGagal('jadwal', err, punyaJadwalRef.current);
      setLoading(false);
      setRefreshing(false);
    });
  }, [identitas, rentang.dari, rentang.sampai, catatGagal, hapusGagal]);

  // ===== INIT: profil guru → data =====
  useEffect(() => {
    let batal = false;
    (async () => {
      const teacher = await fetchTeacherProfile();
      if (batal) return;
      await fetchData(teacher);
      if (!batal) setLoading(false);
    })();
    return () => { batal = true; };
  }, [fetchTeacherProfile, fetchData]);

  // ===== HANDLERS =====
  const handleRefresh = async () => {
    setRefreshing(true);
    const teacher = await fetchTeacherProfile();
    await fetchData(teacher);              // menangani teacher null sendiri (B-01)
    await bacaKodeHarian(hariIniStr, { senyap: true });
    setRefreshing(false);
  };

  const handleStartClass = (schedule) => {
    setPendingSchedule(schedule);
    setShowStartModal(true);
    setInputToken("");
    setPesanKode("");
    // Bila kode belum siap (belum dibuat admin / gagal dibaca), baca ulang SATU
    // dokumen sekarang: jauh lebih murah daripada guru menebak-nebak atau
    // memuat ulang seluruh dasbor, dan menutup jalan buntu B-06.
    if (kodeAbsen.status !== STATUS_KODE.SIAP) bacaKodeHarian(hariIniStr);
  };

  const handleVerifyTokenAndStart = async () => {
    if (!pendingSchedule) {
      setPesanKode('Tidak ada jadwal yang dipilih. Tutup kotak ini dan pilih kelas dari daftar.');
      return;
    }

    // Keputusan owner D2 (opsi c): verifikasi lewat SATU fungsi teruji yang
    // membedakan "kode salah ketik" dari "kode belum dibuat admin" dan dari
    // "gagal dibaca karena kuota". Dulu ketiganya dituduhkan sebagai
    // "Token absensi salah!" dan guru buntu tanpa jalan keluar.
    const hasil = verifikasiKodeAbsen({
      input: inputToken,
      kode: kodeAbsen.kode,
      status: kodeAbsen.status,
    });
    if (!hasil.lulus) {
      setPesanKode(hasil.pesan);
      // Ketikan dikosongkan HANYA bila memang salah ketik; menghapus input saat
      // penyebabnya di luar kendali guru cuma menghukum.
      if (kodeAbsen.status === STATUS_KODE.SIAP) setInputToken("");
      return;
    }
    setPesanKode("");

    try {
      await updateDoc(doc(db, "jadwal_bimbel", pendingSchedule.id), {
        status: 'ongoing',
        startedAt: serverTimestamp()
      });
      
      setShowStartModal(false);
      setInputToken("");
      navigate('/guru/class-session/' + pendingSchedule.id);
    } catch (error) {
      console.error("Gagal memulai kelas:", error);
      alert("❌ Terjadi kesalahan sistem saat membuka kelas: " + error.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Yakin ingin keluar?')) {
      // B-25: dulu yang dihapus `teacherData`, `isLoggedIn`, `userRole` — padahal
      // penjaga rute GuruRoute memeriksa `isGuruLoggedIn` dan `role`. Sesudah
      // logout keduanya masih ada sehingga /guru/* tetap terbuka di perangkat
      // bersama. Sekarang kunci sesi dikelola satu tempat (utils/sesiLoginGuru).
      hapusSesiGuru();
      navigate('/login-guru');
    }
  };

  /**
   * "Tandai semua" dulu tombol MATI (tanpa onClick — B-03). Sekarang benar-benar
   * menulis `isRead` (nama field yang dipakai penulis notifikasi), dibatasi pada
   * yang tampil saja, dan gagal pun dilaporkan jujur lewat banner.
   */
  const tandaiSemuaDibaca = async () => {
    const belum = notifications.filter(belumDibaca);
    if (belum.length === 0) return;
    try {
      const batch = writeBatch(db);
      belum.forEach((n) => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
      await batch.commit();
      setNotifications((lama) => lama.map((n) => ({ ...n, isRead: true })));
      hapusGagal('notifikasi');
    } catch (e) {
      console.error('Gagal menandai notifikasi dibaca:', e);
      catatGagal('notifikasi', e, punyaNotifRef.current);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return parseInt(parts[2]) + ' ' + months[parseInt(parts[1]) - 1] + ' ' + parts[0];
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <LogoGemilang size="medium" variant="default" showText={true} />
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Memuat dashboard...</p>
      </div>
    );
  }

  // B-01: profil tanpa identitas dulu membuat spinner berputar SELAMANYA tanpa
  // pesan apa pun. Sekarang keadaannya dinyatakan + ada dua jalan keluar.
  if (profilBermasalah) {
    return (
      <div style={styles.loadingContainer}>
        <LogoGemilang size="medium" variant="default" showText={true} />
        <div style={styles.panelMasalah} role="status">
          <h2 style={styles.judulMasalah}>Data profil Anda belum lengkap</h2>
          <p style={styles.teksMasalah}>
            Sistem tidak menemukan nama atau ID guru pada data login di perangkat ini,
            sehingga jadwal dan riwayat Anda tidak bisa diambil. Data Anda di server tidak
            hilang — ini soal sesi di perangkat ini.
          </p>
          <div style={styles.aksiMasalah}>
            <button type="button" onClick={handleRefresh} style={styles.tombolUtama}>
              <RefreshCw size={15} /> Muat ulang
            </button>
            <button type="button" onClick={handleLogout} style={styles.tombolSekunder}>
              <LogOut size={15} /> Keluar &amp; masuk lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ═══ BANNER JUJUR: blok data yang gagal dimuat (B-04, B-22) ═══
          Dulu satu kueri yang gagal menelan SEMUA blok di bawahnya dan layar
          menampilkan 0 tanpa penjelasan — guru menyimpulkan datanya hilang.
          Sekarang tiap blok melaporkan dirinya sendiri, data lama dipertahankan,
          dan ada satu tombol "Coba lagi" (docs/POLICY-ERROR-DAN-KUOTA.md). */}
      {daftarGagal.length > 0 && (
        <div style={styles.bannerGagal} role="status">
          <div style={styles.judulBannerGagal}>
            <AlertCircle size={16} /> Sebagian data belum bisa dimuat
          </div>
          <ul style={styles.isiBannerGagal}>
            {daftarGagal.map(([blok, ket]) => (
              <li key={blok}>
                <b>{LABEL_BLOK[blok] || blok}</b>: {ket.pesan}
              </li>
            ))}
          </ul>
          <button type="button" onClick={handleRefresh} disabled={refreshing} style={styles.tombolCobaLagi}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Coba lagi
          </button>
        </div>
      )}
      {/* ═══ TUGAS BESAR: PENGISIAN LAPORAN BELAJAR (owner 31 Okt 2026) ═══
          Muncul selama admin membuka periode; HILANG otomatis begitu semua
          siswa mapel guru ini selesai diisi. Capaian guru = isi utama PDF. */}
      {laporanTugas && !laporanTugas.semuaSelesai && (
        <button
          type="button"
          onClick={() => navigate('/guru/laporan-belajar')}
          style={{ width: '100%', textAlign: 'left', margin: '0 0 16px', padding: '18px 20px', borderRadius: 16, cursor: 'pointer', border: '1px solid #c7d2fe', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', boxShadow: '0 8px 22px rgba(79,70,229,.28)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
            <FileText size={19} /> Pengisian Laporan Belajar — {laporanTugas.periodeLabel}
          </div>
          <div style={{ fontSize: 12.5, color: '#e0e7ff', marginBottom: 10, lineHeight: 1.5 }}>
            Isi capaian, catatan, dan rencana pengayaan untuk siswa Anda. Isian Anda menjadi <b>isi utama laporan belajar orang tua</b>; keaktifan otomatis (kuis, try out, absensi) dari sistem Gemilang ikut dilampirkan.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px', height: 10, background: 'rgba(255,255,255,.28)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${laporanTugas.total ? Math.round((laporanTugas.selesai / laporanTugas.total) * 100) : 0}%`, background: 'white', transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>{laporanTugas.selesai}/{laporanTugas.total} siswa selesai</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, background: 'white', color: '#4338ca', borderRadius: 99, padding: '4px 12px' }}>Isi sekarang →</span>
          </div>
        </button>
      )}
      {/* ═══ BANNER: TRY OUT TERHUBUNG (dipinta owner 2026-10) ═══
          Guru yang dipilih admin sebagai tentor pemantau melihat kartu ini;
          isinya: pantau peserta, soal, jawaban, skor, dan menilai esai. */}
      {tryoutTerhubung.length > 0 && (
        <div style={{ margin: '0 0 16px', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg,#eef2ff,#faf5ff)', border: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#3730a3', marginBottom: 8 }}>
            🎯 Try Out yang Dipercayakan Kepada Anda ({tryoutTerhubung.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 8 }}>
            {tryoutTerhubung.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/guru/tryout-monitor/${p.id}`)}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: '1px solid #c7d2fe', background: 'white', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e1b4b' }}>{p.judul}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {p.totalSoal || p.daftarSoal?.length || 0} soal · {p.targetKelas} — pantau peserta, nilai esai, lihat skor →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {/* ===== HEADER ===== */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <LogoGemilang size="small" variant="default" />
        </div>
        <div style={styles.headerRight}>
          <span style={styles.greeting}>{greeting}</span>
          <div style={styles.notifWrapper} ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={styles.notifBtn}
              aria-label={jumlahBelumDibaca > 0 ? `Notifikasi, ${jumlahBelumDibaca} belum dibaca` : 'Notifikasi'}
            >
              <Bell size={18} />
              {jumlahBelumDibaca > 0 && (
                <span style={styles.notifDot}>{jumlahBelumDibaca}</span>
              )}
            </button>
            {showNotifications && (
              <div style={styles.notifDropdown}>
                <div style={styles.notifHeader}>
                  <span style={styles.notifTitle}>Notifikasi</span>
                  <button
                    type="button"
                    onClick={tandaiSemuaDibaca}
                    disabled={jumlahBelumDibaca === 0}
                    style={{
                      ...styles.notifMarkAll,
                      opacity: jumlahBelumDibaca === 0 ? 0.5 : 1,
                      cursor: jumlahBelumDibaca === 0 ? 'default' : 'pointer',
                    }}
                  >
                    Tandai semua{jumlahBelumDibaca > 0 ? ` (${jumlahBelumDibaca})` : ''}
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div style={styles.notifEmpty}>Tidak ada notifikasi</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={n.id || i} style={styles.notifItem(belumDibaca(n))}>
                      <div style={styles.notifIcon}>
                        {n.type === 'modul_baru' ? <BookOpen size={12} /> : <Bell size={12} />}
                      </div>
                      <div style={styles.notifContent}>
                        <div style={styles.notifMsg}>{n.message || n.title}</div>
                        <div style={styles.notifTime}>
                          {waktuNotifMs(n) ? new Date(waktuNotifMs(n)).toLocaleDateString('id-ID') : 'Baru'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            style={styles.refreshBtn}
            disabled={refreshing}
            aria-label="Muat ulang data dasbor"
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          </button>
          {/* B-18: dulu `<div onClick>` — tidak bisa difokus keyboard dan tidak
              terbaca screen reader. Sekarang tombol sungguhan. */}
          <button
            type="button"
            onClick={() => navigate('/guru/profile')}
            style={styles.avatar}
            aria-label={`Profil ${guru?.nama || 'guru'}`}
          >
            {getInitials(guru?.nama)}
          </button>
          <button type="button" onClick={handleLogout} style={styles.logoutBtn} aria-label="Keluar">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ===== BANNER ===== */}
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bannerBadge}>
            <Sparkles size={12} /> Welcome
          </div>
          <h1 style={styles.bannerTitle}>
            Assalamu'alaikum, {guru?.nama?.split(' ')[0] || 'Guru'}! 👋
          </h1>
          <p style={styles.bannerSub}>
            {guru?.mapel ? 'Pengajar ' + guru.mapel : 'Pengajar Bimbel Gemilang'}
            {guru?.guruId && <span style={styles.bannerId}> • <Hash size={10} /> {guru.guruId}</span>}
          </p>
          <div style={styles.bannerTags}>
            <span style={styles.bannerTag}>
              <Calendar size={12} /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span style={styles.bannerTag}>
              <Clock size={12} /> {todaySchedules.length} sesi hari ini
            </span>
            <span style={styles.bannerTag}>
              <Users size={12} /> {statistik.siswaTerjadwal} siswa terjadwal
            </span>
          </div>
        </div>
        <div style={styles.bannerRight}>
          <div style={styles.bannerLogo}>
            <LogoGemilang size="large" variant="dark" showText={false} />
          </div>
          <div style={styles.bannerProgress}>
            <div style={styles.bannerProgressLabel}>
              <span>Kehadiran</span>
              <span style={styles.bannerProgressValue}>
                {kehadiran.persen === null ? '—' : `${kehadiran.persen}%`}
              </span>
            </div>
            <div style={styles.bannerProgressBar}>
              <div style={{...styles.bannerProgressFill, width: `${kehadiran.persen ?? 0}%`}} />
            </div>
            {/* Jujur soal bahan hitungannya: tanpa bukti, tampilkan "—" + sebab,
                bukan 0% yang menuduh guru tidak hadir (B-05/B-10, keputusan D4). */}
            <div style={styles.bannerProgressNote}>
              {kehadiran.persen === null
                ? 'Belum ada sesi tersimpan untuk dihitung'
                : `${kehadiran.hadir}/${kehadiran.total} kehadiran · ${kehadiran.sesiTerhitung} sesi${kehadiran.perkiraan ? ` · ${kehadiran.perkiraan} perkiraan` : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS CARDS =====
          Definisi baru (keputusan owner D3, 3 Nov 2026): setiap angka wajib
          bisa dihitung dari jendela 15 hari yang memang ditarik, dan labelnya
          menyatakan periodenya. Kartu lama ("Total Siswa" ber-badge "Aktif",
          "Total Kelas" sepanjang masa, "+N" yang ternyata sesi 7 hari ke
          belakang) semuanya menyesatkan — register bug B-07/B-08/B-09. */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon('primary')}>
            <Calendar size={20} color="#3b82f6" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{statistik.sesiHariIni}</div>
            <div style={styles.statLabel}>Sesi Hari Ini</div>
          </div>
          <div style={styles.statTrend('neutral')}>
            <CalendarDays size={12} /> {statistik.sesiMendatang} agenda
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon('warning')}>
            <BookOpen size={20} color="#f59e0b" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{statistik.sesi7Hari}</div>
            <div style={styles.statLabel}>Sesi 7 Hari Terakhir</div>
          </div>
          <div style={styles.statTrend('neutral')}>
            <CheckCircle size={12} /> {statistik.sesiSelesai7Hari} selesai
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon('success')}>
            <Users size={20} color="#10b981" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>{statistik.siswaTerjadwal}</div>
            <div style={styles.statLabel}>Siswa Terjadwal</div>
          </div>
          <div style={styles.statTrend('neutral')}>
            <CalendarDays size={12} /> {formatDate(rentang.dari)}–{formatDate(rentang.sampai)}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon('purple')}>
            <Award size={20} color="#8b5cf6" />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>
              {kehadiran.persen === null ? '—' : `${kehadiran.persen}%`}
            </div>
            <div style={styles.statLabel}>Kehadiran</div>
          </div>
          {/* Tanpa bukti = tanpa vonis: "—" dan jumlahnya, bukan 0% merah. */}
          <div style={styles.statTrend(kehadiran.persen === null ? 'neutral' : kehadiran.persen >= 70 ? 'up' : 'down')}>
            <Activity size={12} />
            {kehadiran.persen === null
              ? 'belum ada sesi'
              : `${kehadiran.sesiTerhitung} sesi${kehadiran.perkiraan ? ` · ${kehadiran.perkiraan} perkiraan` : ''}`}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={styles.mainGrid(isMobile)}>
        {/* ===== LEFT: SCHEDULES ===== */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <Layout size={16} /> Jadwal Mengajar
            </h3>
            <div style={styles.sectionActions}>
              <button onClick={() => navigate('/guru/schedule')} style={styles.seeAllBtn}>
                Lihat Semua <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div style={styles.scheduleSubHeader}>
            <span style={styles.scheduleSubTitle}>📅 Hari Ini</span>
            <span style={styles.scheduleCount}>{todaySchedules.length} sesi</span>
          </div>

          {todaySchedules.length === 0 ? (
            <div style={styles.emptyState}>
              <Calendar size={32} color="#cbd5e1" />
              <p style={styles.emptyText}>Tidak ada jadwal hari ini</p>
              <p style={styles.emptySub}>Istirahat atau persiapan materi 📚</p>
            </div>
          ) : (
            <div style={styles.scheduleList}>
              {todaySchedules.slice(0, 5).map(item => {
                const isCompleted = item.status === 'completed';
                const isOngoing = item.status === 'ongoing';
                let btnText = 'Mulai Kelas';
                let btnBg = '#3b82f6';
                let disabled = false;
                
                if (isCompleted) {
                  btnText = '✓ Selesai';
                  btnBg = '#10b981';
                  disabled = true;
                } else if (isOngoing) {
                  btnText = '🔄 Lanjutkan Kelas';
                  btnBg = '#f59e0b';
                  disabled = false;
                }
                
                return (
                  <div key={item.id} style={styles.scheduleCard}>
                    <div style={styles.scheduleTime}>
                      <span style={styles.scheduleTimeText}>{item.start}</span>
                      <span style={styles.scheduleTimeEnd}>- {item.end}</span>
                    </div>
                    <div style={styles.scheduleContent}>
                      <div style={styles.scheduleTitle}>
                        {item.title || 'Materi Umum'}
                        {item.mapelId && (
                          <span style={styles.scheduleMapelId}>
                            <Tag size={10} /> {item.mapelId}
                          </span>
                        )}
                      </div>
                      <div style={styles.scheduleMeta}>
                        <span><MapPin size={10} /> {item.planet || 'Ruang'}</span>
                        <span><Users size={10} /> {item.students?.length || 0} siswa</span>
                        <span style={styles.programBadge(item.program)}>
                          {item.program || 'Reguler'}
                        </span>
                        {item.teacherId && (
                          <span style={styles.teacherIdBadge}>
                            <Hash size={8} /> {item.teacherId}
                          </span>
                        )}
                      </div>
                      {item.students && item.students.length > 0 && (
                        <div style={styles.studentPreview}>
                          {item.students.slice(0, 3).map((s, i) => (
                            <span key={i} style={styles.studentChip}>
                              {s.nama?.split(' ')[0] || 'Siswa'}
                            </span>
                          ))}
                          {item.students.length > 3 && (
                            <span style={styles.studentMore}>+{item.students.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        if (isOngoing) {
                          navigate('/guru/class-session/' + item.id);
                        } else {
                          handleStartClass(item);
                        }
                      }}
                      style={{
                        ...styles.startBtn,
                        background: btnBg,
                        opacity: disabled ? 0.7 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                      disabled={disabled}
                    >
                      {btnText} <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {upcomingSchedules.length > 0 && (
            <div style={styles.upcomingSection}>
              <div style={styles.scheduleSubHeader}>
                <span style={styles.scheduleSubTitle}>📆 7 Hari Ke Depan</span>
                <span style={styles.scheduleCount}>{upcomingSchedules.length} sesi</span>
              </div>
              <div style={styles.upcomingList}>
                {upcomingSchedules.slice(0, 3).map(item => (
                  <div key={item.id} style={styles.upcomingCard}>
                    <span style={styles.upcomingDate}>{formatDate(item.dateStr)}</span>
                    <span style={styles.upcomingTime}>{item.start}</span>
                    <span style={styles.upcomingTitle}>{item.title || 'Materi'}</span>
                    <span style={styles.upcomingTeacher}>{item.teacherName || item.booker}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT: QUICK ACTIONS & INFO ===== */}
        <div style={styles.rightCol}>
          {/* Quick Actions */}
          <div style={styles.quickActionsCard}>
            <h4 style={styles.quickActionsTitle}>⚡ Akses Cepat</h4>
            <div style={styles.quickActionsGrid}>
              <button onClick={() => navigate('/guru/history')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fef3c7', color: '#b45309'}}>
                  <Clock4 size={18} />
                </div>
                <span style={styles.quickLabel}>Riwayat</span>
                <span style={styles.quickDesc}>Lihat histori</span>
              </button>
              <button onClick={() => navigate('/guru/modul')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#d1fae5', color: '#059669'}}>
                  <Layers size={18} />
                </div>
                <span style={styles.quickLabel}>E-Learning</span>
                <span style={styles.quickDesc}>Materi & tugas</span>
              </button>
              <button onClick={() => navigate('/guru/sesi-live')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fee2e2', color: '#dc2626'}}>
                  <Radio size={18} />
                </div>
                <span style={styles.quickLabel}>Sesi Kelas Live</span>
                <span style={styles.quickDesc}>Latihan bareng siswa</span>
              </button>
              {/* 🔥 BARU: Buku Digital - Mode Persiapan Guru */}
              <button onClick={() => setShowBuku(true)} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#dbeafe', color: '#1d4ed8'}}>
                  <BookOpen size={18} />
                </div>
                <span style={styles.quickLabel}>Buku Digital</span>
                <span style={styles.quickDesc}>Baca materi & kunci</span>
              </button>
              <button onClick={() => navigate('/guru/profile')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fce7f3', color: '#be185d'}}>
                  <User size={18} />
                </div>
                <span style={styles.quickLabel}>Profil</span>
                <span style={styles.quickDesc}>Data diri</span>
              </button>
              <button onClick={() => navigate('/guru/grades/input')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#ede9fe', color: '#6d28d9'}}>
                  <GraduationCap size={18} />
                </div>
                <span style={styles.quickLabel}>Nilai</span>
                <span style={styles.quickDesc}>Input nilai</span>
              </button>
              <button onClick={() => navigate('/guru/modul/tugas')} style={styles.quickAction}>
                <div style={{...styles.quickIcon, background: '#fef2f2', color: '#dc2626'}}>
                  <Send size={18} />
                </div>
                <span style={styles.quickLabel}>Tugas</span>
                <span style={styles.quickDesc}>Kelola tugas</span>
              </button>
            </div>
          </div>

          {/* Teacher Info Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <User size={16} color="#652D90" />
              <h4 style={styles.infoTitle}>Profil Guru</h4>
            </div>
            <div style={styles.teacherInfo}>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Nama</span>
                <span style={styles.teacherInfoValue}>{guru?.nama || '-'}</span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>ID Guru</span>
                <span style={styles.teacherInfoValue}>
                  <Hash size={12} /> {guru?.guruId || 'Belum ada ID'}
                </span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Mapel</span>
                <span style={styles.teacherInfoValue}>
                  <BookOpen size={12} /> {guru?.mapel || '-'}
                  {guru?.kodeMapel && <span style={styles.mapelIdTag}> {guru.kodeMapel}</span>}
                </span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Status</span>
                <span style={styles.teacherInfoValue}>
                  <span style={styles.statusActive}>{guru?.status || 'Aktif'}</span>
                </span>
              </div>
              <div style={styles.teacherInfoRow}>
                <span style={styles.teacherInfoLabel}>Email</span>
                <span style={styles.teacherInfoValue}>{guru?.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div style={styles.announceCard}>
              <div style={styles.infoHeader}>
                <Megaphone size={16} color="#e11d48" />
                <h4 style={styles.infoTitle}>Pengumuman</h4>
              </div>
              {announcements.slice(0, 3).map(p => (
                <div key={p.id} style={styles.announceItem} onClick={() => setSelectedNews(p)}>
                  {p.imageUrl && (
                    <img src={p.imageUrl} style={styles.announceImage} alt="" />
                  )}
                  <div style={styles.announceContent}>
                    <div style={styles.announceTitle}>{p.title}</div>
                    <div style={styles.announceDate}>
                      {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('id-ID') : ''}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#4B5563" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <LogoGemilang size="small" variant="default" showText={true} />
          <div style={styles.footerLinks}>
            <a href="/" style={styles.footerLink}>Home</a>
            <a href="/guru/modul" style={styles.footerLink}>E-Learning</a>
            <a href="/guru/schedule" style={styles.footerLink}>Jadwal</a>
            <a href="/guru/grades/input" style={styles.footerLink}>Nilai</a>
          </div>
          <div style={styles.socialLinks}>
            <a href="https://instagram.com/bimbelgemilangs" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>📸</span>
            </a>
            <a href="https://tiktok.com/@bimbelgemilang" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>🎵</span>
            </a>
            <a href="https://youtube.com/@bimbelgemilang" target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
              <span style={styles.socialIcon}>▶️</span>
            </a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Bimbel Gemilang. All rights reserved.</span>
        </div>
      </div>

      {/* ===== MODAL: NEWS DETAIL ===== */}
      {selectedNews && (
        <div style={styles.modalOverlay} onClick={() => setSelectedNews(null)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNews(null)} style={styles.modalClose}>
              <X size={18} />
            </button>
            {selectedNews.imageUrl && (
              <img src={selectedNews.imageUrl} style={styles.modalImage} alt="" />
            )}
            <div style={styles.modalBody}>
              <span style={styles.modalTag}>📢 Pengumuman</span>
              <h2 style={styles.modalTitle}>{selectedNews.title}</h2>
              <p style={styles.modalText}>{selectedNews.content}</p>
              {selectedNews.createdAt?.toDate && (
                <div style={styles.modalDate}>
                  {new Date(selectedNews.createdAt.toDate()).toLocaleDateString('id-ID', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: KODE ABSENSI (keputusan owner D2 = opsi c) =====
          Kebijakan TIDAK berubah: kelas tetap dibuka dengan kode buatan admin.
          Yang berubah adalah kejujurannya — tiga keadaan yang dulu sama-sama
          dituduhkan sebagai "Token absensi salah!" kini dibedakan, dan tiap
          keadaan punya jalan keluar (baca ulang SATU dokumen, bukan reload). */}
      {showStartModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStartModal(false)}>
          <div style={styles.modalCode} onClick={e => e.stopPropagation()}>
            <div style={styles.modalCodeIcon}>{keteranganKode.bolehVerifikasi ? '🔐' : '⚠️'}</div>
            <h3 style={styles.modalCodeTitle}>Otentikasi Kelas</h3>
            <p style={styles.modalCodeSub}>
              Masukkan kode absensi harian untuk memulai sesi {formatDate(hariIniStr)}.
            </p>

            {kodeAbsen.status !== STATUS_KODE.SIAP && (
              <div style={styles.kodeNada(keteranganKode.nada)} role="status">
                <div style={styles.kodeNadaJudul}>
                  <AlertCircle size={14} /> {keteranganKode.judul}
                </div>
                <div style={styles.kodeNadaTeks}>{keteranganKode.pesan}</div>
              </div>
            )}

            <input
              type="text"
              value={inputToken}
              onChange={e => { setInputToken(e.target.value.toUpperCase()); setPesanKode(''); }}
              style={{
                ...styles.modalCodeInput,
                opacity: keteranganKode.bolehVerifikasi ? 1 : 0.6,
              }}
              placeholder="KODE ABSEN"
              maxLength={6}
              autoFocus
              disabled={!keteranganKode.bolehVerifikasi || memuatKode}
              aria-label="Kode absensi harian"
              aria-describedby="ket-kode-harian"
            />
            <div style={styles.modalCodeHint} id="ket-kode-harian">
              <Clock size={12} />
              {memuatKode
                ? 'Memeriksa kode hari ini…'
                : kodeAbsen.status === STATUS_KODE.SIAP
                  ? 'Kode berlaku hari ini'
                  : 'Kode dibuat oleh admin untuk tanggal ini'}
            </div>

            {pesanKode && (
              <div style={styles.pesanKodeInline} role="alert">{pesanKode}</div>
            )}

            <div style={styles.modalCodeActions}>
              <button type="button" onClick={() => setShowStartModal(false)} style={styles.modalCodeCancel}>
                BATAL
              </button>
              {keteranganKode.saran && (
                <button
                  type="button"
                  onClick={() => bacaKodeHarian(hariIniStr)}
                  disabled={memuatKode}
                  style={styles.modalCodeRetry}
                >
                  <RefreshCw size={14} className={memuatKode ? 'spin' : ''} /> {keteranganKode.saran}
                </button>
              )}
              <button
                type="button"
                onClick={handleVerifyTokenAndStart}
                disabled={!keteranganKode.bolehVerifikasi}
                style={{
                  ...styles.modalCodeSubmit,
                  opacity: keteranganKode.bolehVerifikasi ? 1 : 0.55,
                  cursor: keteranganKode.bolehVerifikasi ? 'pointer' : 'not-allowed',
                }}
              >
                <Zap size={14} /> VERIFIKASI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 BARU: Modal Buku Digital (Mode Persiapan Guru) */}
      {showBuku && (
        <ModalBukuGuru open={showBuku} onClose={() => setShowBuku(false)} />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 16px 32px',
    width: '100%',
    boxSizing: 'border-box',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '70vh',
    gap: 16,
    background: '#f8fafc'
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #652D90',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#4B5563', fontSize: 13, fontWeight: 500 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: '10px 16px',
    background: 'white',
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  greeting: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  notifWrapper: { position: 'relative' },
  notifBtn: {
    position: 'relative',
    background: '#f1f5f9',
    border: 'none',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    background: '#B91C1C',
    color: 'white',
    fontSize: 11,
    fontWeight: 700,
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 320,
    maxHeight: 400,
    overflowY: 'auto',
    background: 'white',
    borderRadius: 14,
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    border: '1px solid #f1f5f9',
    zIndex: 100,
    padding: 8,
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #f1f5f9',
  },
  notifTitle: { fontWeight: 700, fontSize: 13, color: '#1e293b' },
  notifMarkAll: { fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' },
  notifEmpty: { padding: '20px', textAlign: 'center', color: '#4B5563', fontSize: 12 },
  notifItem: (unread) => ({
    display: 'flex',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: unread ? '#eff6ff' : 'transparent',
    borderBottom: '1px solid #f1f5f9',
    transition: '0.2s',
    cursor: 'pointer',
  }),
  notifIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#3b82f6',
  },
  notifContent: { flex: 1 },
  notifMsg: { fontSize: 12, color: '#1e293b' },
  notifTime: { fontSize: 11, color: '#4B5563', marginTop: 2 },
  refreshBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  // Sekarang elemen <button> sungguhan (B-18) → default UA (border, padding,
  // font) wajib dinetralkan agar tampilannya identik dengan versi lama.
  // Ukuran sasaran sentuh 44 px sengaja ditabung ke rombak E2 (register B-19).
  avatar: {
    width: 36,
    height: 36,
    border: 'none',
    padding: 0,
    fontFamily: 'inherit',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #652D90, #8b5cf6)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(101,45,144,0.3)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    padding: '6px 8px',
    cursor: 'pointer',
    color: '#4B5563',
    borderRadius: 8,
    transition: '0.2s',
  },
  banner: {
    background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)',
    padding: '20px 24px',
    borderRadius: 16,
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
    boxShadow: '0 4px 20px rgba(26,35,126,0.3)',
  },
  bannerLeft: { flex: 1 },
  bannerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(255,255,255,0.15)',
    padding: '2px 10px',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
  },
  bannerTitle: { margin: '4px 0', fontSize: 22, fontWeight: 800 },
  bannerSub: { margin: '2px 0 10px', fontSize: 13, opacity: 0.85 },
  bannerId: { fontSize: 11, opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 2 },
  bannerTags: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  bannerTag: {
    background: 'rgba(255,255,255,0.12)',
    padding: '3px 12px',
    borderRadius: 16,
    fontSize: 11,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  bannerRight: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  bannerLogo: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerProgress: { width: 160 },
  bannerProgressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.8, marginBottom: 2 },
  bannerProgressValue: { fontWeight: 700 },
  bannerProgressBar: { height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  bannerProgressFill: { height: '100%', background: 'linear-gradient(90deg, #fbbf24, #10b981)', borderRadius: 2, transition: 'width 0.8s ease' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: 'white',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  statIcon: (color) => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    background: color === 'primary' ? '#eff6ff' : color === 'success' ? '#ecfdf5' : color === 'warning' ? '#fffbeb' : '#f5f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  statInfo: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: 900, color: '#1e293b', lineHeight: 1.2 },
  statLabel: { fontSize: 11, color: '#4B5563', fontWeight: 500 },
  statTrend: (direction) => ({
    fontSize: 11,
    fontWeight: 600,
    color: direction === 'up' ? '#15803D' : direction === 'down' ? '#B91C1C' : '#4B5563',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 8px',
    borderRadius: 8,
    background: direction === 'up' ? '#ecfdf5' : direction === 'down' ? '#fef2f2' : '#f1f5f9',
  }),
  mainGrid: (m) => ({
    display: 'grid',
    gridTemplateColumns: m ? '1fr' : '1.6fr 1fr',
    gap: 16,
    marginBottom: 20,
  }),
  rightCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  section: {
    background: 'white',
    padding: 16,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#1e293b'
  },
  sectionActions: { display: 'flex', gap: 6 },
  seeAllBtn: {
    background: 'none',
    border: 'none',
    color: '#652D90',
    fontWeight: 600,
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  scheduleSubHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  scheduleSubTitle: { fontSize: 12, fontWeight: 600, color: '#64748b' },
  scheduleCount: {
    fontSize: 11,
    color: '#4B5563',
    background: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: 10
  },
  scheduleList: { display: 'flex', flexDirection: 'column', gap: 8 },
  scheduleCard: {
    background: '#f8fafc',
    padding: '12px 14px',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    border: '1px solid #f1f5f9',
    transition: '0.2s',
  },
  scheduleTime: { minWidth: 60, flexShrink: 0 },
  scheduleTimeText: { fontWeight: 800, fontSize: 13, color: '#1e293b' },
  scheduleTimeEnd: { fontSize: 11, color: '#4B5563' },
  scheduleContent: { flex: 1, minWidth: 120 },
  scheduleTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  scheduleMapelId: {
    fontSize: 11,
    color: '#8b5cf6',
    background: '#ede9fe',
    padding: '1px 6px',
    borderRadius: 4,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2
  },
  scheduleMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    fontSize: 11,
    color: '#64748b',
    flexWrap: 'wrap'
  },
  programBadge: (p) => ({
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 12,
    background: p === 'English' ? '#fef3c7' : '#dbeafe',
    color: p === 'English' ? '#b45309' : '#2563eb',
  }),
  teacherIdBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    background: '#f1f5f9',
    color: '#64748b',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  },
  studentPreview: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  studentChip: {
    background: '#e0e7ff',
    color: '#3730a3',
    padding: '1px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
  },
  studentMore: { fontSize: 11, color: '#4B5563' },
  startBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    transition: '0.2s',
  },
  emptyState: { textAlign: 'center', padding: '30px 12px', color: '#4B5563' },
  emptyText: { fontSize: 13, fontWeight: 600, margin: '8px 0 2px', color: '#64748b' },
  emptySub: { fontSize: 11, margin: 0 },
  upcomingSection: { marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' },
  upcomingList: { display: 'flex', flexDirection: 'column', gap: 6 },
  upcomingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: '#f8fafc',
    borderRadius: 8,
    fontSize: 11,
    flexWrap: 'wrap',
  },
  upcomingDate: { fontWeight: 600, color: '#1e293b', minWidth: 70 },
  upcomingTime: { color: '#3b82f6', fontWeight: 600 },
  upcomingTitle: { color: '#64748b', flex: 1 },
  upcomingTeacher: { fontSize: 11, color: '#4B5563' },
  quickActionsCard: {
    background: 'white',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  quickActionsTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b' },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  quickAction: {
    background: '#f8fafc',
    padding: '10px 8px',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    fontFamily: 'inherit',
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickLabel: { fontSize: 11, fontWeight: 700, color: '#1e293b' },
  quickDesc: { fontSize: 11, color: '#4B5563' },
  infoCard: {
    background: 'white',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  infoHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoTitle: { margin: 0, fontWeight: 700, fontSize: 13, color: '#1e293b' },
  teacherInfo: { display: 'flex', flexDirection: 'column', gap: 6 },
  teacherInfoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '2px 0' },
  teacherInfoLabel: { color: '#4B5563' },
  teacherInfoValue: { fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 },
  mapelIdTag: { fontSize: 11, color: '#8b5cf6', background: '#ede9fe', padding: '1px 6px', borderRadius: 4 },
  statusActive: { color: '#15803D', background: '#dcfce7', padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 },
  announceCard: {
    background: 'white',
    padding: 14,
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  announceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
    marginBottom: 6,
    transition: '0.2s',
  },
  announceImage: { width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 },
  announceContent: { flex: 1 },
  announceTitle: { fontSize: 11, fontWeight: 600, color: '#1e293b' },
  announceDate: { fontSize: 11, color: '#4B5563', marginTop: 2 },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
  },
  footerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLinks: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  footerLink: { color: '#64748b', textDecoration: 'none', fontSize: 11, fontWeight: 500 },
  socialLinks: { display: 'flex', gap: 8 },
  socialLink: {
    color: '#1e293b',
    textDecoration: 'none',
    fontSize: 16,
    padding: '4px 8px',
    background: '#f8fafc',
    borderRadius: 8,
    transition: '0.2s',
  },
  socialIcon: { fontSize: 16 },
  footerBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
    fontSize: 11,
    color: '#4B5563',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    background: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 480,
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'fadeInUp 0.3s ease',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(255,255,255,0.95)',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    cursor: 'pointer',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  modalImage: { width: '100%', maxHeight: 200, objectFit: 'cover' },
  modalBody: { padding: 20 },
  modalTag: { fontSize: 11, color: '#652D90', fontWeight: 800, textTransform: 'uppercase' },
  modalTitle: { margin: '4px 0 8px', fontSize: 18, fontWeight: 900, color: '#1e293b' },
  modalText: { fontSize: 13, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  modalDate: { marginTop: 12, fontSize: 11, color: '#4B5563' },
  modalCode: {
    background: 'white',
    padding: 28,
    borderRadius: 20,
    width: '90%',
    maxWidth: 340,
    textAlign: 'center',
    animation: 'fadeInUp 0.3s ease',
  },
  modalCodeIcon: { fontSize: 40, marginBottom: 8 },
  modalCodeTitle: { margin: '0 0 4px', fontWeight: 900, fontSize: 18, color: '#1e293b' },
  modalCodeSub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  modalCodeInput: {
    width: '100%',
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    outline: 'none',
    fontWeight: 900,
    letterSpacing: 4,
    background: '#f8fafc',
    transition: '0.2s',
  },
  modalCodeHint: { fontSize: 11, color: '#4B5563', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  modalCodeActions: { display: 'flex', gap: 8, marginTop: 16 },
  modalCodeCancel: {
    flex: 1,
    padding: 10,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  modalCodeSubmit: {
    flex: 2,
    padding: 10,
    background: 'linear-gradient(135deg, #652D90, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(101,45,144,0.3)',
  },

  // ============================================================
  // v1.6.5 — keadaan JUJUR (register bug B-01/B-04/B-06/B-22).
  // Warna mengikuti token docs/SISTEM-DESAIN-GEMILANG.md: teks bahaya #B91C1C,
  // peringatan #B45309, info #2563EB, teks sekunder #4B5563 — semua terukur
  // ≥4,5:1 di atas latar tintanya.
  // ============================================================
  bannerGagal: {
    margin: '0 0 16px',
    padding: '12px 14px',
    borderRadius: 14,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
  },
  judulBannerGagal: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 800,
    color: '#B91C1C',
  },
  isiBannerGagal: {
    margin: '6px 0 10px',
    paddingLeft: 18,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: '#1F2937',
  },
  tombolCobaLagi: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '10px 16px',
    borderRadius: 999,
    border: '1px solid #B91C1C',
    background: 'white',
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  panelMasalah: {
    maxWidth: 460,
    padding: 20,
    background: 'white',
    border: '1px solid #E7DFD3',
    borderRadius: 20,
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(31,41,55,0.08)',
  },
  judulMasalah: { fontSize: 17, fontWeight: 800, color: '#1F2937', margin: '0 0 8px' },
  teksMasalah: { fontSize: 13.5, lineHeight: 1.55, color: '#4B5563', margin: '0 0 16px' },
  aksiMasalah: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  tombolUtama: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    background: '#652D90',
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tombolSekunder: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '10px 18px',
    borderRadius: 999,
    border: '1px solid #652D90',
    background: 'white',
    color: '#652D90',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  // Catatan kecil di bawah bar kehadiran (di atas banner gelap → teks terang).
  bannerProgressNote: { fontSize: 11, marginTop: 6, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 },
  kodeNada: (nada) => ({
    margin: '0 0 12px',
    padding: '10px 12px',
    borderRadius: 14,
    textAlign: 'left',
    background: nada === 'bahaya' ? '#FEF2F2' : nada === 'peringatan' ? '#FFFBEB' : '#EFF6FF',
    border: `1px solid ${nada === 'bahaya' ? '#FECACA' : nada === 'peringatan' ? '#FDE68A' : '#BFDBFE'}`,
  }),
  kodeNadaJudul: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 800,
    marginBottom: 2,
    color: '#1F2937',
  },
  kodeNadaTeks: { fontSize: 12.5, lineHeight: 1.5, color: '#4B5563' },
  pesanKodeInline: {
    margin: '10px 0 0',
    padding: '8px 10px',
    borderRadius: 10,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: 'center',
  },
  modalCodeRetry: {
    flex: 1,
    minHeight: 44,
    padding: 10,
    background: 'white',
    color: '#B45309',
    border: '1px solid #B45309',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
};

export default TeacherDashboard;