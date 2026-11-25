// src/pages/admin/teachers/SesiGuruPage.jsx
// ============================================================
// TEMPAT KERJA ADMIN: SESI & VALIDASI GURU (BIMBEL GEMILANG)
// ============================================================
// Fitur Lengkap:
// 1. Cross-check kehadiran mengajar tentor hari ini & riwayat sesi.
// 2. Pemantauan kelengkapan siswa (lengkap vs parsial vs 0 hadir).
// 3. Deteksi otomatis kejanggalan ABSEN GANDA / DUPLIKAT (2x absen).
// 4. Penghapusan sesi keliru/duplikat secara permanen (Trash2 + Audit Log).
// 5. Modal rincian siswa hadir, materi jurnal, dan foto absensi kelas.
// 6. Shortcut 1-klik filter waktu: Hari Ini, Kemarin, 7 Hari, Bulan Ini.
// 7. Navigasi cepat antar menu: Jadwal Harian, Presensi Siswa, Kelola Guru, Gaji Guru.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, RefreshCw, Download, CheckCircle2, Undo2, Search,
  CalendarDays, Camera, Users, Clock, AlertTriangle, Trash2,
  Eye, X, ExternalLink, Calendar, BookOpen, AlertCircle, Check,
  ChevronRight, ArrowUpRight, GraduationCap, DollarSign, Edit3,
  ChevronDown, ChevronUp, Wallet,
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  keyTanggalDariDate,
  tanggalLokalHariIni,
  deteksiKejanggalanSesi,
  deteksiTumpangTindih,
  deteksiDuplikatSesi,
  LABEL_KEJANGGALAN,
  STATUS_SESI_VALID as STATUS_VALID,
  STATUS_SESI_MENUNGGU as STATUS_MENUNGGU,
} from '../owner/keuanganOwnerUtils';
import { catatAudit, KATEGORI, aktorSaatIni } from '../../../utils/auditLog';

export default function SesiGuruPage() {
  const navigate = useNavigate();
  const now = new Date();
  const hariIni = tanggalLokalHariIni();

  // Filter Tanggal & Waktu
  const [mulai, setMulai] = useState(keyTanggalDariDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [sampai, setSampai] = useState(keyTanggalDariDate(now));
  const [cari, setCari] = useState('');
  const [tabFilter, setTabFilter] = useState('SEMUA'); // 'SEMUA' | 'MENUNGGU' | 'VALID' | 'DUPLIKAT' | 'BERBENDERA'

  // Filter per guru jika diarahkan dari Kelola Guru (/admin/teachers/sesi?guru=<id>)
  const [guruId, setGuruId] = useState(
    () => new URLSearchParams(window.location.search).get('guru') || '',
  );

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prosesId, setProsesId] = useState('');
  const [modalDetail, setModalDetail] = useState(null);
  const [modalKoreksi, setModalKoreksi] = useState(null); // { log, nominalBaru: '', catatan: '' }
  const [showRekapTentor, setShowRekapTentor] = useState(false);

  // ============================================================
  // MUAT DATA SESI
  // ============================================================
  const muat = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(collection(db, 'teacher_logs'));
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setError(`Gagal memuat riwayat sesi: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  // ============================================================
  // DETEKSI KEJANGGALAN & DUPLIKAT (SATU SUMBER KEBENARAN)
  // ============================================================
  const tumpang = useMemo(() => deteksiTumpangTindih(logs), [logs]);
  const duplikatMap = useMemo(() => deteksiDuplikatSesi(logs), [logs]);

  const benderaOf = useCallback(
    (l) => {
      const b = deteksiKejanggalanSesi(l, hariIni);
      if (tumpang.has(l.id)) b.push('TUMPANG_TINDIH');
      if (duplikatMap.has(l.id)) b.push('DUPLIKAT_ABSEN');
      return b;
    },
    [hariIni, tumpang, duplikatMap],
  );

  // ============================================================
  // FILTER DATA SESI
  // ============================================================
  const tampil = useMemo(() => {
    const k = cari.trim().toLowerCase();
    const rows = logs.filter((l) => {
      if (!l || !l.tanggal) return false;
      const tanggal = String(l.tanggal).split(' ')[0];
      if (tanggal < mulai || tanggal > sampai) return false;
      if (guruId && l.teacherId !== guruId) return false;

      // Filter Tab
      if (tabFilter === 'MENUNGGU' && l.status === STATUS_VALID) return false;
      if (tabFilter === 'VALID' && l.status !== STATUS_VALID) return false;
      if (tabFilter === 'DUPLIKAT' && !duplikatMap.has(l.id)) return false;
      if (tabFilter === 'BERBENDERA' && benderaOf(l).length === 0) return false;

      // Filter Pencarian Teks
      if (k) {
        const daftarNamaSiswa = Array.isArray(l.daftarSiswaHadir)
          ? l.daftarSiswaHadir.map((s) => s?.nama || '').join(' ')
          : '';
        const gab = [
          l.namaGuru,
          l.program,
          l.kegiatan,
          l.kelasNama,
          l.level,
          l.status,
          l.materiHariIni,
          l.babJudul,
          daftarNamaSiswa,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!gab.includes(k)) return false;
      }
      return true;
    });

    // Urutkan tanggal terbaru & waktu terbaru
    rows.sort(
      (a, b) =>
        String(b.tanggal).localeCompare(String(a.tanggal)) ||
        String(b.waktu || '').localeCompare(String(a.waktu || '')),
    );
    return rows;
  }, [logs, mulai, sampai, cari, tabFilter, guruId, benderaOf, duplikatMap]);

  // Statistik Ringkas pada Rentang Terpilih
  const logsDalamRentang = useMemo(() => {
    return logs.filter((l) => {
      if (!l || !l.tanggal) return false;
      const tanggal = String(l.tanggal).split(' ')[0];
      if (tanggal < mulai || tanggal > sampai) return false;
      if (guruId && l.teacherId !== guruId) return false;
      return true;
    });
  }, [logs, mulai, sampai, guruId]);

  const jumlahTotal = logsDalamRentang.length;
  const jumlahMenunggu = useMemo(
    () => logsDalamRentang.filter((l) => l.status !== STATUS_VALID).length,
    [logsDalamRentang],
  );
  const jumlahValid = jumlahTotal - jumlahMenunggu;
  const jumlahDuplikat = useMemo(
    () => logsDalamRentang.filter((l) => duplikatMap.has(l.id)).length,
    [logsDalamRentang, duplikatMap],
  );
  const jumlahBerbendera = useMemo(
    () => logsDalamRentang.filter((l) => benderaOf(l).length > 0).length,
    [logsDalamRentang, benderaOf],
  );

  // Akumulasi Nominal Honor Rentang Terpilih
  const totalNominalSemua = useMemo(
    () => logsDalamRentang.reduce((acc, l) => acc + (Number(l.nominal) || 0), 0),
    [logsDalamRentang],
  );
  const totalNominalValid = useMemo(
    () =>
      logsDalamRentang
        .filter((l) => l.status === STATUS_VALID)
        .reduce((acc, l) => acc + (Number(l.nominal) || 0), 0),
    [logsDalamRentang],
  );
  const totalNominalMenunggu = useMemo(
    () =>
      logsDalamRentang
        .filter((l) => l.status !== STATUS_VALID)
        .reduce((acc, l) => acc + (Number(l.nominal) || 0), 0),
    [logsDalamRentang],
  );

  // Rekapitulasi Akhir Bulan per Tentor
  const rekapPerTentor = useMemo(() => {
    const map = {};
    logsDalamRentang.forEach((l) => {
      const key = l.teacherId || l.namaGuru || 'UNKNOWN';
      if (!map[key]) {
        map[key] = {
          teacherId: l.teacherId || '',
          namaGuru: l.namaGuru || 'Tanpa Nama',
          totalSesi: 0,
          sesiValid: 0,
          sesiMenunggu: 0,
          totalJam: 0,
          totalNominal: 0,
          nominalValid: 0,
          nominalMenunggu: 0,
          sesiKoreksiManual: 0,
        };
      }
      map[key].totalSesi += 1;
      const nom = Number(l.nominal) || 0;
      const dur = Number(l.durasiJam) || 0;
      map[key].totalNominal += nom;
      map[key].totalJam += dur;
      if (l.status === STATUS_VALID) {
        map[key].sesiValid += 1;
        map[key].nominalValid += nom;
      } else {
        map[key].sesiMenunggu += 1;
        map[key].nominalMenunggu += nom;
      }
      if (l.nominalDisesuaikan) {
        map[key].sesiKoreksiManual += 1;
      }
    });
    return Object.values(map).sort(
      (a, b) => b.totalNominal - a.totalNominal || b.totalSesi - a.totalSesi,
    );
  }, [logsDalamRentang]);

  // ============================================================
  // SHORTCUT WAKTU CEPAT (1-KLIK)
  // ============================================================
  const pasangFilterWaktu = (mode) => {
    const tglSekarang = new Date();
    const tglHariIniStr = keyTanggalDariDate(tglSekarang);

    if (mode === 'HARI_INI') {
      setMulai(tglHariIniStr);
      setSampai(tglHariIniStr);
    } else if (mode === 'KEMARIN') {
      const kem = new Date(tglSekarang);
      kem.setDate(kem.getDate() - 1);
      const kemStr = keyTanggalDariDate(kem);
      setMulai(kemStr);
      setSampai(kemStr);
    } else if (mode === '7_HARI') {
      const sem = new Date(tglSekarang);
      sem.setDate(sem.getDate() - 7);
      setMulai(keyTanggalDariDate(sem));
      setSampai(tglHariIniStr);
    } else if (mode === 'BULAN_INI') {
      setMulai(keyTanggalDariDate(new Date(tglSekarang.getFullYear(), tglSekarang.getMonth(), 1)));
      setSampai(tglHariIniStr);
    } else if (mode === 'SEMUA') {
      setMulai('2025-01-01');
      setSampai(tglHariIniStr);
    }
  };

  // ============================================================
  // AKSI OPERASIONAL: KOREKSI MANUAL NOMINAL HONOR
  // ============================================================
  const bukaModalKoreksi = (l) => {
    setModalKoreksi({
      log: l,
      nominalBaru:
        l.nominal !== undefined && l.nominal !== null ? String(l.nominal) : '0',
      catatan: l.nominalCatatan || '',
    });
  };

  const simpanKoreksiNominal = async () => {
    if (!modalKoreksi || !modalKoreksi.log) return;
    const { log, nominalBaru, catatan } = modalKoreksi;
    const parsed = parseInt(nominalBaru, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('Masukkan nominal honor yang valid (angka non-negatif).');
      return;
    }

    setProsesId(log.id);
    const aktor = aktorSaatIni();
    const lamaNominal = log.nominal ?? null;
    const updatePayload = {
      nominal: parsed,
      nominalDisesuaikan: true,
      nominalSebelumnya: lamaNominal,
      nominalCatatan: catatan || 'Koreksi manual admin pada sesi mengajar',
      nominalDisesuaikanOleh: aktor.aktorNama || aktor.aktor,
      nominalDisesuaikanPada: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'teacher_logs', log.id), updatePayload);
      catatAudit('guru.sesi.nominal_ubah', {
        kategori: KATEGORI.GURU,
        target: `Sesi ${log.namaGuru} · ${log.tanggal}`,
        detail: {
          logId: log.id,
          namaGuru: log.namaGuru,
          dari: lamaNominal,
          menjadi: parsed,
          catatan: catatan || 'Koreksi manual admin',
        },
      });

      setLogs((prev) =>
        prev.map((x) => (x.id === log.id ? { ...x, ...updatePayload } : x)),
      );
      if (modalDetail?.id === log.id) {
        setModalDetail((prev) => ({ ...prev, ...updatePayload }));
      }
      setModalKoreksi(null);
      alert(
        `✅ Nominal sesi ${log.namaGuru || 'Tentor'} berhasil diperbarui menjadi Rp ${parsed.toLocaleString('id-ID')}`,
      );
    } catch (e) {
      console.error(e);
      alert(`Gagal menyimpan nominal: ${e?.message || e}`);
    } finally {
      setProsesId('');
    }
  };

  // ============================================================
  // AKSI OPERASIONAL: SETUJUI VALIDASI
  // ============================================================
  const setujui = async (l) => {
    const b = benderaOf(l);
    const isDup = duplikatMap.has(l.id);
    const nominalRp = Number(l.nominal || 0).toLocaleString('id-ID');

    let pesanPeringatan = '';
    if (isDup) {
      pesanPeringatan += `\n🚨 PERINGATAN: Sesi ini terindikasi ABSEN GANDA (duplikat)!\n   Alasan: ${duplikatMap.get(l.id)}\n`;
    }
    if (b.length > 0) {
      pesanPeringatan += `\n⚠ Bendera Kejanggalan:\n${b.map((k) => `   - ${LABEL_KEJANGGALAN[k] || k}`).join('\n')}\n`;
    }
    if (!l.nominal || l.nominal === 0) {
      pesanPeringatan += `\n⚠️ PERHATIAN: Nominal saat ini Rp 0. Jika sistem salah menghitung, Anda dapat mengoreksi nominal terlebih dahulu via tombol [Koreksi Nominal].\n`;
    }

    const konfirmasi = window.confirm(
      `Setujui sesi mengajar ini sebagai VALID?\n\n` +
      `Tentor   : ${l.namaGuru || 'Tanpa Nama'}\n` +
      `Tanggal  : ${String(l.tanggal).split(' ')[0]} ${l.waktu || ''}\n` +
      `Kelas    : ${l.kelasNama || l.program || 'Umum'}\n` +
      `Kehadiran: ${l.siswaHadir ?? 0} siswa hadir\n` +
      `Nominal  : Rp ${nominalRp}${l.nominalDisesuaikan ? ' (Disesuaikan manual)' : ''}\n` +
      pesanPeringatan +
      `\nDengan menyetujui, Anda menyatakan sesi ini BENAR terjadi dan sah untuk pembayaran honor akhir bulan.`
    );
    if (!konfirmasi) return;

    setProsesId(l.id);
    const aktor = aktorSaatIni();
    try {
      await updateDoc(doc(db, 'teacher_logs', l.id), {
        status: STATUS_VALID,
        divalidasiOleh: aktor.aktor,
        divalidasiOlehNama: aktor.aktorNama,
        divalidasiPeran: aktor.peran,
        divalidasiPada: new Date().toISOString(),
      });
      catatAudit('guru.sesi.setujui', {
        kategori: KATEGORI.GURU,
        target: `Sesi ${l.namaGuru} · ${l.tanggal}`,
        detail: {
          logId: l.id,
          program: l.program || '',
          kelas: l.kelasNama || '',
          nominal: l.nominal || 0,
        },
      });
      setLogs((prev) =>
        prev.map((x) =>
          x.id === l.id
            ? { ...x, status: STATUS_VALID, divalidasiOlehNama: aktor.aktorNama }
            : x,
        ),
      );
      if (modalDetail?.id === l.id) {
        setModalDetail((prev) => ({
          ...prev,
          status: STATUS_VALID,
          divalidasiOlehNama: aktor.aktorNama,
        }));
      }
    } catch (e) {
      alert(`Gagal menyetujui: ${e?.message || e}`);
    } finally {
      setProsesId('');
    }
  };

  // ============================================================
  // AKSI OPERASIONAL: BATALKAN VALIDASI
  // ============================================================
  const batalkan = async (l) => {
    if (
      !window.confirm(
        `Batalkan validasi sesi ini?\n\n${l.namaGuru} · ${l.tanggal}\n\n` +
        'Status sesi akan kembali menjadi "Menunggu Validasi" dan tidak akan ikut di rekap honor sampai disetujui kembali.',
      )
    )
      return;

    setProsesId(l.id);
    try {
      await updateDoc(doc(db, 'teacher_logs', l.id), {
        status: STATUS_MENUNGGU,
        divalidasiOleh: '',
        divalidasiOlehNama: '',
        divalidasiPeran: '',
        divalidasiPada: '',
      });
      catatAudit('guru.sesi.batalkan', {
        kategori: KATEGORI.GURU,
        target: `Sesi ${l.namaGuru} · ${l.tanggal}`,
        detail: { logId: l.id, alasan: 'dibatalkan admin' },
      });
      setLogs((prev) =>
        prev.map((x) =>
          x.id === l.id
            ? { ...x, status: STATUS_MENUNGGU, divalidasiOlehNama: '' }
            : x,
        ),
      );
      if (modalDetail?.id === l.id) {
        setModalDetail((prev) => ({ ...prev, status: STATUS_MENUNGGU, divalidasiOlehNama: '' }));
      }
    } catch (e) {
      alert(`Gagal membatalkan: ${e?.message || e}`);
    } finally {
      setProsesId('');
    }
  };

  // ============================================================
  // AKSI OPERASIONAL: HAPUS SESI (DUPLIKAT / KELIRU)
  // ============================================================
  const hapusSesi = async (l) => {
    const isDup = duplikatMap.has(l.id);
    const konfirmasi = window.confirm(
      `⚠️ HAPUS SESI MENGAJAR?\n\n` +
      `Tentor   : ${l.namaGuru || 'Tanpa Nama'}\n` +
      `Tanggal  : ${String(l.tanggal).split(' ')[0]} ${l.waktu || ''}\n` +
      `Kelas    : ${l.kelasNama || l.program || 'Umum'}\n` +
      `Kehadiran: ${l.siswaHadir || 0} siswa hadir\n` +
      (isDup ? `\n🚨 Sesi ini terindikasi ABSEN GANDA (${duplikatMap.get(l.id)}).\n` : '') +
      `\nTindakan ini akan MENGHAPUS SESI SECARA PERMANEN dari Firestore dan riwayat guru.\n` +
      `Apakah Anda yakin ingin menghapus sesi ini?`
    );
    if (!konfirmasi) return;

    setProsesId(l.id);
    try {
      await deleteDoc(doc(db, 'teacher_logs', l.id));
      catatAudit('guru.sesi.hapus', {
        kategori: KATEGORI.GURU,
        target: `Sesi ${l.namaGuru} · ${l.tanggal}`,
        detail: {
          logId: l.id,
          namaGuru: l.namaGuru,
          tanggal: l.tanggal,
          kelas: l.kelasNama,
          alasan: isDup ? 'hapus absen ganda / duplikat' : 'dihapus manual admin',
        },
      });
      setLogs((prev) => prev.filter((x) => x.id !== l.id));
      if (modalDetail?.id === l.id) setModalDetail(null);
      alert(`✅ Sesi ${l.namaGuru} (${l.kelasNama || 'Kelas'}) berhasil dihapus.`);
    } catch (e) {
      alert(`❌ Gagal menghapus sesi: ${e?.message || e}`);
    } finally {
      setProsesId('');
    }
  };

  // ============================================================
  // UNDUH CSV RIWAYAT SESI
  // ============================================================
  const unduhCsv = () => {
    if (tampil.length === 0) {
      alert('Tidak ada baris sesi untuk diunduh pada saringan ini.');
      return;
    }
    const kepala = [
      'Tanggal', 'Waktu', 'Nama Guru', 'Program', 'Level', 'Kelas',
      'Kegiatan', 'Siswa Hadir', 'Total Siswa', 'Durasi Jam', 'Nominal Honor (Rp)', 'Status Nominal', 'Catatan Nominal', 'Status', 'Absen Ganda', 'Ada Foto Absensi',
    ];
    const baris = tampil.map((l) =>
      kepala
        .map((f) => {
          let v;
          switch (f) {
            case 'Tanggal': v = String(l.tanggal || '').split(' ')[0]; break;
            case 'Waktu': v = l.waktu || ''; break;
            case 'Nama Guru': v = l.namaGuru || ''; break;
            case 'Program': v = l.program || ''; break;
            case 'Level': v = l.level || ''; break;
            case 'Kelas': v = l.kelasNama || ''; break;
            case 'Kegiatan': v = l.kegiatan || ''; break;
            case 'Siswa Hadir': v = l.siswaHadir ?? ''; break;
            case 'Total Siswa': v = l.siswaTotal ?? ''; break;
            case 'Durasi Jam': v = l.durasiJam ?? ''; break;
            case 'Nominal Honor (Rp)': v = l.nominal ?? 0; break;
            case 'Status Nominal': v = l.nominalDisesuaikan ? 'Disesuaikan Manual' : 'Otomatis Sistem'; break;
            case 'Catatan Nominal': v = l.nominalCatatan || ''; break;
            case 'Status': v = l.status || ''; break;
            case 'Absen Ganda': v = duplikatMap.has(l.id) ? 'Ya (Duplikat)' : 'Tidak'; break;
            case 'Ada Foto Absensi': v = l.fotoAbsensiUrl ? 'Ya' : 'Tidak'; break;
            default: v = '';
          }
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    const csv = `\uFEFF${kepala.join(',')}\n${baris.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sesi-guru-gemilang_${mulai}_sd_${sampai}.csv`.replace(/\//g, '-');
    a.click();
    URL.revokeObjectURL(url);
    catatAudit('guru.sesi.unduh', {
      kategori: KATEGORI.GURU,
      target: `Riwayat sesi ${mulai} s/d ${sampai}`,
      detail: { jumlahBaris: tampil.length },
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* ===== TOP NAVIGATION / BREADCRUMB MENU ===== */}
        <div style={styles.quickNavRow}>
          <div style={styles.quickNavTitle}>
            <GraduationCap size={16} color="#0d9488" />
            <span>Pusat Manajemen Guru &amp; Akademik</span>
          </div>
          <div style={styles.quickNavButtons}>
            <button
              onClick={() => navigate('/admin/schedule')}
              style={styles.btnQuickNav}
              title="Lihat Jadwal Harian Kelas"
            >
              <Calendar size={13} /> Jadwal Harian
            </button>
            <button
              onClick={() => navigate('/admin/attendance')}
              style={styles.btnQuickNav}
              title="Lihat Presensi Siswa Harian"
            >
              <ClipboardCheck size={13} /> Presensi Siswa
            </button>
            <button
              onClick={() => navigate('/admin/teachers')}
              style={styles.btnQuickNav}
              title="Kelola Data Profil Guru"
            >
              <Users size={13} /> Kelola Guru
            </button>
            <button
              onClick={() => navigate('/admin/teachers/galeri')}
              style={styles.btnQuickNav}
              title="Lihat Galeri Foto Dokumentasi Mengajar Tentor"
            >
              <Camera size={13} color="#7c3aed" /> Galeri Mengajar
            </button>
            <button
              onClick={() => navigate('/admin/teachers/salaries')}
              style={styles.btnQuickNavHonor}
              title="Rekap Gaji & Pembayaran Honor Tentor"
            >
              <DollarSign size={13} /> Gaji Guru <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* ===== HEADER UTAMA ===== */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <CheckCircle2 size={26} color="#0d9488" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={styles.h1}>Sesi &amp; Validasi Guru</h1>
            <p style={styles.sub}>
              Verifikasi kehadiran mengajar tentor, cross-check kelengkapan kehadiran siswa, dan hapus sesi duplikat/salah agar rekap honor akurat.
            </p>
          </div>
        </div>

        {/* ===== KARTU METRIK RINGKAS (INTERAKTIF SEBAGAI TAB) ===== */}
        <div style={styles.metricGrid}>
          {/* Card 1: Semua Sesi */}
          <div
            onClick={() => setTabFilter('SEMUA')}
            style={{
              ...styles.metricCard,
              borderColor: tabFilter === 'SEMUA' ? '#0d9488' : '#e2e8f0',
              background: tabFilter === 'SEMUA' ? '#f0fdfa' : '#ffffff',
            }}
          >
            <div style={styles.metricLabel}>Total Sesi Rentang Ini</div>
            <div style={{ ...styles.metricVal, color: '#0f172a' }}>{jumlahTotal}</div>
            <div style={styles.metricSub}>Semua riwayat mengajar</div>
          </div>

          {/* Card 2: Menunggu Validasi */}
          <div
            onClick={() => setTabFilter('MENUNGGU')}
            style={{
              ...styles.metricCard,
              borderColor: tabFilter === 'MENUNGGU' ? '#f59e0b' : '#fef3c7',
              background: tabFilter === 'MENUNGGU' ? '#fffbeb' : '#ffffff',
            }}
          >
            <div style={{ ...styles.metricLabel, color: '#b45309' }}>Menunggu Validasi</div>
            <div style={{ ...styles.metricVal, color: '#d97706' }}>{jumlahMenunggu}</div>
            <div style={styles.metricSub}>Perlu persetujuan admin</div>
          </div>

          {/* Card 3: Sudah Valid */}
          <div
            onClick={() => setTabFilter('VALID')}
            style={{
              ...styles.metricCard,
              borderColor: tabFilter === 'VALID' ? '#10b981' : '#dcfce7',
              background: tabFilter === 'VALID' ? '#f0fdf4' : '#ffffff',
            }}
          >
            <div style={{ ...styles.metricLabel, color: '#15803d' }}>Sudah Valid</div>
            <div style={{ ...styles.metricVal, color: '#16a34a' }}>{jumlahValid}</div>
            <div style={styles.metricSub}>Siap dibayarkan</div>
          </div>

          {/* Card 4: Absen Ganda / Duplikat (PRIORITAS PENANGANAN) */}
          <div
            onClick={() => setTabFilter('DUPLIKAT')}
            style={{
              ...styles.metricCard,
              borderColor: tabFilter === 'DUPLIKAT' ? '#ef4444' : (jumlahDuplikat > 0 ? '#fecaca' : '#e2e8f0'),
              background: tabFilter === 'DUPLIKAT' ? '#fef2f2' : '#ffffff',
            }}
          >
            <div style={{ ...styles.metricLabel, color: '#b91c1c' }}>🚨 Absen Ganda (2x Absen)</div>
            <div style={{ ...styles.metricVal, color: jumlahDuplikat > 0 ? '#dc2626' : '#64748b' }}>
              {jumlahDuplikat}
            </div>
            <div style={styles.metricSub}>
              {jumlahDuplikat > 0 ? 'Hapus salah satu sesi duplikat' : 'Tidak ada duplikat'}
            </div>
          </div>

          {/* Card 5: Kejanggalan Lainnya */}
          <div
            onClick={() => setTabFilter('BERBENDERA')}
            style={{
              ...styles.metricCard,
              borderColor: tabFilter === 'BERBENDERA' ? '#6366f1' : '#e0e7ff',
              background: tabFilter === 'BERBENDERA' ? '#eef2ff' : '#ffffff',
            }}
          >
            <div style={{ ...styles.metricLabel, color: '#4338ca' }}>Kejanggalan Pola</div>
            <div style={{ ...styles.metricVal, color: '#4f46e5' }}>{jumlahBerbendera}</div>
            <div style={styles.metricSub}>0 hadir, jam tak wajar, dll</div>
          </div>

          {/* Card 6: Akumulasi Honor Rentang Ini */}
          <div
            onClick={() => setShowRekapTentor((prev) => !prev)}
            style={{
              ...styles.metricCard,
              borderColor: showRekapTentor ? '#0d9488' : '#ccfbf1',
              background: showRekapTentor ? '#f0fdfa' : '#ffffff',
              borderLeft: '4px solid #0d9488',
            }}
            title="Klik untuk membuka / menutup Rekapitulasi Honor per Tentor"
          >
            <div
              style={{
                ...styles.metricLabel,
                color: '#0f766e',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>💰 Total Honor Sesi</span>
              <span
                style={{
                  fontSize: 9.5,
                  background: '#ccfbf1',
                  color: '#0f766e',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 800,
                }}
              >
                {showRekapTentor ? '▲ Tutup Rekap' : '▼ Buka Rekap'}
              </span>
            </div>
            <div style={{ ...styles.metricVal, color: '#0f766e', fontSize: 20 }}>
              Rp {totalNominalSemua.toLocaleString('id-ID')}
            </div>
            <div style={styles.metricSub}>
              Valid: <b>Rp {totalNominalValid.toLocaleString('id-ID')}</b> · Pending: Rp{' '}
              {totalNominalMenunggu.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* ===== TOMBOL TOGGLE REKAPITULASI HONOR PER TENTOR ===== */}
        <div style={styles.rekapToggleBar}>
          <button
            onClick={() => setShowRekapTentor((prev) => !prev)}
            style={{
              ...styles.btnToggleRekap,
              background: showRekapTentor ? '#0d9488' : '#ffffff',
              color: showRekapTentor ? '#ffffff' : '#0f766e',
              borderColor: '#0d9488',
            }}
            title="Buka / tutup tabel rekapitulasi honor per tentor untuk cross-check akhir bulan"
          >
            <Wallet size={15} />
            <span>
              {showRekapTentor
                ? 'Sembunyikan Rekap Honor Akhir Bulan per Tentor'
                : '📊 Tampilkan Rekapitulasi Honor Akhir Bulan per Tentor'}{' '}
              ({rekapPerTentor.length} Tentor · Total Rp {totalNominalSemua.toLocaleString('id-ID')})
            </span>
            {showRekapTentor ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* ===== PANEL REKAPITULASI HONOR AKHIR BULAN PER TENTOR ===== */}
        {showRekapTentor && (
          <div style={styles.rekapTentorCard}>
            <div style={styles.rekapTentorHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={styles.rekapIconBox}>
                  <Wallet size={20} color="#0d9488" />
                </div>
                <div>
                  <h3 style={styles.rekapTitle}>
                    📊 Rekapitulasi Honor Mengajar Akhir Bulan per Tentor
                  </h3>
                  <div style={styles.rekapSub}>
                    Akumulasi honor mengajar pada rentang <b>{mulai}</b> s/d <b>{sampai}</b> ({rekapPerTentor.length} tentor aktif). Jika ada nominal sesi yang salah hitung oleh sistem, klik <b>"🔍 Lihat &amp; Koreksi Sesi"</b> lalu ubah via tombol <b>"Koreksi Nominal"</b> di tabel bawah.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowRekapTentor(false)}
                style={styles.btnTutupRekap}
                title="Tutup panel rekapitulasi honor"
              >
                ✕ Tutup Panel
              </button>
            </div>

            {rekapPerTentor.length === 0 ? (
              <div style={styles.rekapKosong}>
                Tidak ada data sesi guru pada rentang tanggal terpilih.
              </div>
            ) : (
              <div style={styles.rekapTableWrapper}>
                <table style={styles.rekapTable}>
                  <thead>
                    <tr style={styles.rekapThRow}>
                      <th style={styles.rekapTh}>No</th>
                      <th style={styles.rekapTh}>Nama Tentor / Guru</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'center' }}>Total Sesi</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'center' }}>Status Sesi</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'center' }}>Total Jam</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'right' }}>Total Honor (Rp)</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'right' }}>Honor Valid (Rp)</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'center' }}>Penyesuaian Manual</th>
                      <th style={{ ...styles.rekapTh, textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapPerTentor.map((r, idx) => {
                      const isSelected = guruId && (guruId === r.teacherId || guruId === r.namaGuru);
                      return (
                        <tr
                          key={r.teacherId || r.namaGuru || idx}
                          style={{
                            ...styles.rekapTr,
                            background: isSelected ? '#f0fdfa' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          }}
                        >
                          <td style={styles.rekapTd}>{idx + 1}</td>
                          <td style={styles.rekapTd}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>
                              {r.namaGuru}
                            </div>
                            {r.teacherId && (
                              <div style={{ fontSize: 10.5, color: '#64748b' }}>
                                ID: {r.teacherId}
                              </div>
                            )}
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'center' }}>
                            <span style={styles.pillSesiTotal}>{r.totalSesi} Sesi</span>
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <span style={styles.pillSesiValid} title="Sesi sudah disetujui valid">
                                {r.sesiValid} Valid
                              </span>
                              {r.sesiMenunggu > 0 && (
                                <span style={styles.pillSesiMenunggu} title="Sesi menunggu persetujuan admin">
                                  {r.sesiMenunggu} Menunggu
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'center', fontWeight: 600 }}>
                            {r.totalJam} Jam
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'right', fontWeight: 900, color: '#0f766e', fontSize: 13.5 }}>
                            Rp {r.totalNominal.toLocaleString('id-ID')}
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                            Rp {r.nominalValid.toLocaleString('id-ID')}
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'center' }}>
                            {r.sesiKoreksiManual > 0 ? (
                              <span style={styles.pillKoreksiAda}>
                                ✎ {r.sesiKoreksiManual} Sesi Dikoreksi
                              </span>
                            ) : (
                              <span style={styles.pillKoreksiNol}>Otomatis Sistem</span>
                            )}
                          </td>
                          <td style={{ ...styles.rekapTd, textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  setGuruId('');
                                } else {
                                  setGuruId(r.teacherId || r.namaGuru);
                                }
                              }}
                              style={isSelected ? styles.btnFilterGuruAktif : styles.btnFilterGuru}
                              title="Tampilkan daftar sesi guru ini di tabel bawah untuk dicek/koreksi nominalnya"
                            >
                              {isSelected ? '✕ Hapus Filter' : '🔍 Lihat & Koreksi Sesi'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={styles.rekapTfoot}>
                      <td colSpan={2} style={{ ...styles.rekapTd, fontWeight: 900, color: '#0f172a' }}>
                        GRAND TOTAL ({rekapPerTentor.length} GURU)
                      </td>
                      <td style={{ ...styles.rekapTd, textAlign: 'center', fontWeight: 900 }}>
                        {jumlahTotal} Sesi
                      </td>
                      <td style={{ ...styles.rekapTd, textAlign: 'center', fontWeight: 800 }}>
                        {jumlahValid} Valid · {jumlahMenunggu} Menunggu
                      </td>
                      <td style={{ ...styles.rekapTd, textAlign: 'center', fontWeight: 900 }}>
                        {rekapPerTentor.reduce((a, b) => a + b.totalJam, 0)} Jam
                      </td>
                      <td style={{ ...styles.rekapTd, textAlign: 'right', fontWeight: 900, color: '#0f766e', fontSize: 14 }}>
                        Rp {totalNominalSemua.toLocaleString('id-ID')}
                      </td>
                      <td style={{ ...styles.rekapTd, textAlign: 'right', fontWeight: 900, color: '#15803d', fontSize: 13 }}>
                        Rp {totalNominalValid.toLocaleString('id-ID')}
                      </td>
                      <td colSpan={2} style={{ ...styles.rekapTd, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                        Akumulasi siap sinkron ke menu Gaji Guru
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== BANNER PERINGATAN JIKA ADA ABSEN GANDA ===== */}
        {jumlahDuplikat > 0 && (
          <div style={styles.alertDuplikatBox}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
              <div>
                <b style={{ color: '#991b1b', fontSize: 13.5 }}>
                  Terdeteksi {jumlahDuplikat} Sesi Mengajar Absen Ganda (Tentor 2x Mengabsen)!
                </b>
                <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 2 }}>
                  Sistem mendeteksi jadwal/kelas yang sama diabsen dua kali oleh guru pada waktu yang sama. Silakan periksa daftar di bawah dan klik tombol <b>Hapus Sesi (🗑️)</b> pada sesi duplikat yang salah.
                </div>
              </div>
            </div>
            <button
              onClick={() => setTabFilter('DUPLIKAT')}
              style={styles.btnFilterDuplikatPill}
            >
              Lihat Hanya Sesi Duplikat
            </button>
          </div>
        )}

        {error && (
          <div style={styles.errorBar}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* ===== FILTER CONTROL BOX ===== */}
        <div style={styles.filterCard}>
          {/* Baris 1: Shortcut Waktu Cepat */}
          <div style={styles.shortcutTimeRow}>
            <span style={styles.shortcutLabel}>Filter Waktu Cepat:</span>
            <button
              onClick={() => pasangFilterWaktu('HARI_INI')}
              style={{
                ...styles.btnTimeShortcut,
                background: mulai === hariIni && sampai === hariIni ? '#0d9488' : '#f1f5f9',
                color: mulai === hariIni && sampai === hariIni ? '#ffffff' : '#334155',
                fontWeight: 700,
              }}
            >
              ⭐ Hari Ini ({new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
            </button>
            <button
              onClick={() => pasangFilterWaktu('KEMARIN')}
              style={styles.btnTimeShortcut}
            >
              Kemarin
            </button>
            <button
              onClick={() => pasangFilterWaktu('7_HARI')}
              style={styles.btnTimeShortcut}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => pasangFilterWaktu('BULAN_INI')}
              style={styles.btnTimeShortcut}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => pasangFilterWaktu('SEMUA')}
              style={styles.btnTimeShortcut}
            >
              Semua Waktu
            </button>
          </div>

          {/* Baris 2: Input Tanggal, Pencarian, & Filter */}
          <div style={styles.filterInputsRow}>
            <div style={styles.filterField}>
              <label style={styles.labelField}><CalendarDays size={12} /> Dari Tanggal</label>
              <input
                type="date"
                style={styles.inputDate}
                value={mulai}
                onChange={(e) => setMulai(e.target.value)}
              />
            </div>
            <div style={styles.filterField}>
              <label style={styles.labelField}><CalendarDays size={12} /> Sampai Tanggal</label>
              <input
                type="date"
                style={styles.inputDate}
                value={sampai}
                onChange={(e) => setSampai(e.target.value)}
              />
            </div>
            <div style={{ ...styles.filterField, flex: 2 }}>
              <label style={styles.labelField}><Search size={12} /> Cari Sesi / Tentor / Siswa / Materi</label>
              <input
                style={styles.inputText}
                placeholder="Cari nama guru, kelas, nama siswa hadir, atau materi..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button style={styles.btnRefresh} onClick={muat} disabled={loading} title="Muat ulang data sesi">
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Segarkan
              </button>
              <button
                style={styles.btnDownload}
                onClick={unduhCsv}
                disabled={tampil.length === 0}
                title="Unduh riwayat sesi dalam format CSV Excel"
              >
                <Download size={14} /> Unduh CSV ({tampil.length})
              </button>
            </div>
          </div>

          {/* Baris 3: Filter Chips & Reset Guru */}
          <div style={styles.tabNavRow}>
            <div style={styles.tabNavGroup}>
              <button
                onClick={() => setTabFilter('SEMUA')}
                style={tabFilter === 'SEMUA' ? styles.tabNavActive : styles.tabNav}
              >
                Semua Sesi ({logsDalamRentang.length})
              </button>
              <button
                onClick={() => setTabFilter('MENUNGGU')}
                style={tabFilter === 'MENUNGGU' ? styles.tabNavActiveAmber : styles.tabNav}
              >
                Menunggu Validasi ({jumlahMenunggu})
              </button>
              <button
                onClick={() => setTabFilter('VALID')}
                style={tabFilter === 'VALID' ? styles.tabNavActiveGreen : styles.tabNav}
              >
                Sudah Valid ({jumlahValid})
              </button>
              {jumlahDuplikat > 0 && (
                <button
                  onClick={() => setTabFilter('DUPLIKAT')}
                  style={tabFilter === 'DUPLIKAT' ? styles.tabNavActiveRed : styles.tabNavRed}
                >
                  🚨 Absen Ganda ({jumlahDuplikat})
                </button>
              )}
              {jumlahBerbendera > 0 && (
                <button
                  onClick={() => setTabFilter('BERBENDERA')}
                  style={tabFilter === 'BERBENDERA' ? styles.tabNavActiveIndigo : styles.tabNav}
                >
                  Kejanggalan Pola ({jumlahBerbendera})
                </button>
              )}
            </div>

            {guruId && (
              <button
                style={styles.chipGuruReset}
                onClick={() => setGuruId('')}
                title="Hapus filter guru dan tampilkan seluruh tentor"
              >
                Guru: ID {guruId} <span style={{ marginLeft: 4 }}>✕ Tampilkan Semua</span>
              </button>
            )}
          </div>
        </div>

        {/* ===== TABEL RIWAYAT SESI MENGAJAR ===== */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.emptyState}>
              <RefreshCw size={26} className="spin" color="#0d9488" />
              <div style={{ marginTop: 12, fontWeight: 700, color: '#334155' }}>
                Memuat riwayat sesi mengajar...
              </div>
            </div>
          ) : tampil.length === 0 ? (
            <div style={styles.emptyState}>
              <ClipboardCheck size={36} color="#94a3b8" />
              <div style={{ marginTop: 12, fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
                Tidak Ada Sesi Mengajar Ditemukan
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Silakan ubah rentang tanggal atau kata kunci pencarian di atas.
              </div>
            </div>
          ) : (
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>Waktu &amp; Tanggal</th>
                    <th style={styles.th}>Tentor &amp; Kelas</th>
                    <th style={styles.th}>Kehadiran Siswa &amp; Materi</th>
                    <th style={{ ...styles.th, minWidth: 155 }}>Honor / Nominal (Rp)</th>
                    <th style={styles.th}>Status &amp; Kejanggalan</th>
                    <th style={{ ...styles.th, textAlign: 'center', width: 140 }}>Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody>
                  {tampil.map((l) => {
                    const valid = l.status === STATUS_VALID;
                    const tanggal = String(l.tanggal || '').split(' ')[0];
                    const isDup = duplikatMap.has(l.id);
                    const b = benderaOf(l);

                    const hadir = Number(l.siswaHadir) || 0;
                    const total = Number(l.siswaTotal) || 0;
                    const daftarSiswa = Array.isArray(l.daftarSiswaHadir) ? l.daftarSiswaHadir : [];

                    return (
                      <tr
                        key={l.id}
                        style={{
                          ...styles.tr,
                          background: isDup ? '#fff5f5' : '#ffffff',
                          borderLeft: isDup ? '4px solid #ef4444' : '4px solid transparent',
                        }}
                      >
                        {/* 1. Waktu & Tanggal */}
                        <td style={styles.td}>
                          <div style={styles.tglText}>{tanggal}</div>
                          <div style={styles.jamText}>{l.waktu || '-'}</div>
                          <div style={styles.durasiChip}>
                            <Clock size={11} /> {typeof l.durasiJam === 'number' ? `${l.durasiJam} jam` : '-'}
                          </div>
                        </td>

                        {/* 2. Tentor & Kelas */}
                        <td style={styles.td}>
                          <div style={styles.guruNama}>{l.namaGuru || 'Tanpa Nama'}</div>
                          <div style={styles.kelasPill}>
                            {[l.program, l.kelasNama || l.tipeKelas].filter(Boolean).join(' · ')}
                          </div>
                          {l.materiHariIni && (
                            <div style={styles.materiPreviewText} title={l.materiHariIni}>
                              <BookOpen size={11} style={{ display: 'inline', marginRight: 4 }} />
                              {l.materiHariIni}
                            </div>
                          )}
                        </td>

                        {/* 3. Kehadiran Siswa & Rincian */}
                        <td style={styles.td}>
                          {/* Indikator Kelengkapan Siswa */}
                          <div style={{ marginBottom: 4 }}>
                            {total > 0 ? (
                              hadir >= total ? (
                                <span style={styles.kehadiranBadgeLengkap}>
                                  <Check size={11} strokeWidth={3} /> {hadir} / {total} Siswa (Lengkap 100%)
                                </span>
                              ) : hadir > 0 ? (
                                <span style={styles.kehadiranBadgeSebagian}>
                                  ⚠️ {hadir} / {total} Siswa ({total - hadir} Absen)
                                </span>
                              ) : (
                                <span style={styles.kehadiranBadgeNol}>
                                  ✕ 0 / {total} Siswa Hadir
                                </span>
                              )
                            ) : (
                              <span style={styles.kehadiranBadgeBiasa}>
                                <Users size={11} /> {hadir} Siswa Hadir
                              </span>
                            )}
                          </div>

                          {/* Cuplikan Daftar Siswa */}
                          {daftarSiswa.length > 0 ? (
                            <div style={styles.siswaListPreview}>
                              Murid:{' '}
                              <b>
                                {daftarSiswa.slice(0, 3).map((s) => s.nama || s.studentName).join(', ')}
                                {daftarSiswa.length > 3 ? ` +${daftarSiswa.length - 3} lainnya` : ''}
                              </b>
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Daftar siswa tidak tercatat</div>
                          )}

                          {/* Tombol Lihat Rincian & Foto */}
                          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                            <button
                              onClick={() => setModalDetail(l)}
                              style={styles.btnLihatMurid}
                              title="Buka rincian lengkap murid dan jurnal mengajar"
                            >
                              <Eye size={12} /> Cek Siswa &amp; Jurnal
                            </button>

                            {l.fotoAbsensiUrl && (
                              <a
                                href={l.fotoAbsensiUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.btnFotoMini}
                                title="Lihat foto bukti absensi kelas di tab baru"
                              >
                                <Camera size={12} /> Foto Bukti
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 4. Honor / Nominal (Rp) & Koreksi Manual */}
                        <td style={styles.td}>
                          <div style={styles.nominalText}>
                            Rp {(Number(l.nominal) || 0).toLocaleString('id-ID')}
                          </div>

                          {/* Indikator apakah nominal dihitung sistem atau manual */}
                          {l.nominalDisesuaikan ? (
                            <div
                              style={styles.badgeManualPill}
                              title={
                                l.nominalCatatan
                                  ? `Catatan: ${l.nominalCatatan} (oleh ${l.nominalDisesuaikanOleh || 'Admin'})`
                                  : `Disesuaikan manual oleh ${l.nominalDisesuaikanOleh || 'Admin'}`
                              }
                            >
                              <Edit3 size={10} /> Disesuaikan Manual
                            </div>
                          ) : (
                            <div style={styles.badgeOtomatisPill}>
                              Otomatis Sistem
                            </div>
                          )}

                          {l.nominalCatatan && (
                            <div style={styles.nominalCatatanText} title={l.nominalCatatan}>
                              "{l.nominalCatatan}"
                            </div>
                          )}

                          {/* Tombol Cepat Koreksi Nominal */}
                          <div style={{ marginTop: 6 }}>
                            <button
                              onClick={() => bukaModalKoreksi(l)}
                              style={styles.btnKoreksiMini}
                              title="Koreksi atau isi manual nominal honor sesi ini"
                            >
                              <Edit3 size={11} /> Koreksi Nominal
                            </button>
                          </div>
                        </td>

                        {/* 5. Status & Kejanggalan */}
                        <td style={styles.td}>
                          <div>
                            <span style={valid ? styles.statusBadgeValid : styles.statusBadgeMenunggu}>
                              {valid ? '✓ Sudah Valid' : '⏳ Menunggu Validasi'}
                            </span>
                          </div>

                          {valid && l.divalidasiOlehNama && (
                            <div style={styles.validatorText}>
                              Oleh: <b>{l.divalidasiOlehNama}</b>
                            </div>
                          )}

                          {/* Peringatan Absen Ganda (Duplikat) */}
                          {isDup && (
                            <div style={styles.duplikatWarningBox}>
                              <div style={{ fontWeight: 800 }}>🚨 Absen Ganda Terdeteksi!</div>
                              <div style={{ fontSize: 10.5, marginTop: 2 }}>{duplikatMap.get(l.id)}</div>
                            </div>
                          )}

                          {/* Peringatan Kejanggalan Lainnya */}
                          {b.filter((k) => k !== 'DUPLIKAT_ABSEN').length > 0 && (
                            <div style={styles.kejanggalanPillBox}>
                              {b
                                .filter((k) => k !== 'DUPLIKAT_ABSEN')
                                .map((k) => (
                                  <span key={k} style={styles.kejanggalanChip}>
                                    ⚑ {LABEL_KEJANGGALAN[k] || k}
                                  </span>
                                ))}
                            </div>
                          )}
                        </td>

                        {/* 5. Kolom Aksi */}
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <div style={styles.actionBtnGroup}>
                            {/* Tombol Setujui / Batal */}
                            {valid ? (
                              <button
                                style={styles.btnAksiUndo}
                                title="Batalkan validasi sesi ini"
                                onClick={() => batalkan(l)}
                                disabled={prosesId === l.id}
                              >
                                <Undo2 size={14} /> Batal
                              </button>
                            ) : (
                              <button
                                style={styles.btnAksiSetuju}
                                title="Setujui sesi ini sebagai sah & valid"
                                onClick={() => setujui(l)}
                                disabled={prosesId === l.id}
                              >
                                <CheckCircle2 size={14} /> Setujui
                              </button>
                            )}

                            {/* Tombol HAPUS Sesi (PENTING untuk salah / duplikat) */}
                            <button
                              style={styles.btnAksiHapus}
                              title="Hapus sesi ini secara permanen (misal salah absen / absen ganda)"
                              onClick={() => hapusSesi(l)}
                              disabled={prosesId === l.id}
                            >
                              <Trash2 size={14} /> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          MODAL DETAIL SESI & CROSS-CHECK KEHADIRAN MURID LENGKAP
          ============================================================ */}
      {modalDetail && (
        <div style={styles.modalOverlay} onClick={() => setModalDetail(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                  Rincian Sesi Mengajar &amp; Kehadiran Siswa
                </div>
                <h3 style={styles.modalTitle}>
                  {modalDetail.namaGuru || 'Tentor Bimbel'} · {modalDetail.kelasNama || modalDetail.program}
                </h3>
                <div style={styles.modalSubHeader}>
                  📅 {String(modalDetail.tanggal).split(' ')[0]} jam {modalDetail.waktu || '-'} (Durasi: {modalDetail.durasiJam || '-'} jam)
                </div>
              </div>
              <button
                onClick={() => setModalDetail(null)}
                style={styles.btnModalClose}
                title="Tutup dialog rincian"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
              {/* Peringatan jika Absen Ganda */}
              {duplikatMap.has(modalDetail.id) && (
                <div style={styles.modalAlertDuplikat}>
                  <AlertCircle size={20} color="#dc2626" />
                  <div>
                    <b style={{ color: '#991b1b' }}>🚨 Sesi Ini Terindikasi Absen Ganda (2x Absen)!</b>
                    <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 2 }}>
                      {duplikatMap.get(modalDetail.id)}. Jika sesi ini merupakan salah input atau duplikat dari sesi lainnya, Anda dapat langsung menghapusnya melalui tombol <b>"Hapus Sesi Duplikat Ini"</b> di bawah.
                    </div>
                  </div>
                </div>
              )}

              {/* Status Sesi & Validasi */}
              <div style={styles.modalSectionCard}>
                <div style={styles.modalSectionLabel}>Status Validasi Operasional</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span
                    style={
                      modalDetail.status === STATUS_VALID
                        ? styles.statusBadgeValid
                        : styles.statusBadgeMenunggu
                    }
                  >
                    {modalDetail.status === STATUS_VALID ? '✓ Sudah Valid' : '⏳ Menunggu Validasi'}
                  </span>
                  {modalDetail.divalidasiOlehNama && (
                    <span style={{ fontSize: 12, color: '#475569' }}>
                      Disetujui oleh: <b>{modalDetail.divalidasiOlehNama}</b>
                    </span>
                  )}
                </div>
              </div>

              {/* Honor Sesi Mengajar & Koreksi Manual */}
              <div style={styles.modalSectionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.modalSectionLabel}>Honor Sesi Mengajar</div>
                  <button
                    onClick={() => bukaModalKoreksi(modalDetail)}
                    style={styles.btnKoreksiMiniModal}
                    title="Buka dialog koreksi manual nominal honor"
                  >
                    <Edit3 size={12} /> Koreksi / Isi Manual Nominal
                  </button>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0f766e' }}>
                    Rp {Number(modalDetail.nominal || 0).toLocaleString('id-ID')}
                  </div>
                  {modalDetail.nominalDisesuaikan ? (
                    <span style={styles.badgeManualPill}>
                      <Edit3 size={10} /> Disesuaikan Manual oleh {modalDetail.nominalDisesuaikanOleh || 'Admin'}
                    </span>
                  ) : (
                    <span style={styles.badgeOtomatisPill}>
                      Dihitung Otomatis Sistem
                    </span>
                  )}
                </div>
                {modalDetail.nominalCatatan && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                    Catatan: "{modalDetail.nominalCatatan}"
                  </div>
                )}
                {modalDetail.nominalSebelumnya !== undefined && modalDetail.nominalSebelumnya !== null && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Nominal asli sistem sebelumnya: Rp {Number(modalDetail.nominalSebelumnya).toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              {/* Kelengkapan Siswa & Daftar Murid Hadir */}
              <div style={styles.modalSectionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.modalSectionLabel}>Kehadiran Siswa di Kelas</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                    {modalDetail.siswaHadir || 0} Hadir {modalDetail.siswaTotal ? `dari ${modalDetail.siswaTotal} Murid Terdaftar` : ''}
                  </div>
                </div>

                {Array.isArray(modalDetail.daftarSiswaHadir) && modalDetail.daftarSiswaHadir.length > 0 ? (
                  <div style={{ marginTop: 10 }}>
                    <table style={styles.subTable}>
                      <thead>
                        <tr style={styles.subThRow}>
                          <th style={styles.subTh}>No</th>
                          <th style={styles.subTh}>Nama Siswa</th>
                          <th style={styles.subTh}>Kelas / Sekolah</th>
                          <th style={{ ...styles.subTh, textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalDetail.daftarSiswaHadir.map((s, idx) => (
                          <tr key={s.id || idx} style={styles.subTr}>
                            <td style={styles.subTd}>{idx + 1}</td>
                            <td style={{ ...styles.subTd, fontWeight: 700, color: '#0f172a' }}>
                              {s.nama || s.studentName || 'Siswa'}
                            </td>
                            <td style={styles.subTd}>{s.kelas || s.kelasSekolah || '-'}</td>
                            <td style={{ ...styles.subTd, textAlign: 'center' }}>
                              <span style={styles.badgeHadirMini}>✓ Hadir</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={styles.emptySiswaInfo}>
                    Tidak ada rincian nama siswa pada dokumen sesi ini (hanya angka kehadiran: <b>{modalDetail.siswaHadir || 0} siswa</b>).
                  </div>
                )}
              </div>

              {/* Jurnal Pembelajaran & Materi */}
              <div style={styles.modalSectionCard}>
                <div style={styles.modalSectionLabel}>Materi &amp; Jurnal Mengajar</div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#1e293b', lineHeight: 1.6 }}>
                  <div>
                    Materi Pokok:{' '}
                    <b>
                      {modalDetail.materiHariIni ||
                        modalDetail.sdTopik ||
                        modalDetail.englishTopic ||
                        modalDetail.babJudul ||
                        '-'}
                    </b>
                  </div>
                  {modalDetail.subBab && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Sub-bab: {modalDetail.subBab}
                    </div>
                  )}
                  {modalDetail.statusKetuntasanMateri && (
                    <div style={{ fontSize: 12, color: '#0d9488', marginTop: 4 }}>
                      Ketuntasan: <b>{modalDetail.statusKetuntasanMateri}</b> · Pemahaman: <b>{modalDetail.tingkatPemahaman || 'Baik'}</b>
                    </div>
                  )}
                </div>
              </div>

              {/* Bukti Foto Absensi */}
              <div style={styles.modalSectionCard}>
                <div style={styles.modalSectionLabel}>Foto Bukti Kegiatan Kelas</div>
                {modalDetail.fotoAbsensiUrl ? (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <a
                      href={modalDetail.fotoAbsensiUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-block', position: 'relative' }}
                    >
                      <img
                        src={modalDetail.fotoAbsensiUrl}
                        alt="Foto Bukti Absensi"
                        style={styles.modalFotoImg}
                      />
                      <div style={styles.modalFotoOverlayBtn}>
                        <ExternalLink size={12} /> Buka Foto Penuh
                      </div>
                    </a>
                  </div>
                ) : (
                  <div style={styles.emptyFotoInfo}>
                    📷 Tentor tidak melampirkan foto bukti absensi pada sesi ini.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={styles.modalFooter}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => hapusSesi(modalDetail)}
                  style={styles.btnModalHapus}
                  title="Hapus sesi ini secara permanen"
                >
                  <Trash2 size={14} /> Hapus Sesi (Salah / Duplikat)
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {modalDetail.status === STATUS_VALID ? (
                  <button
                    onClick={() => batalkan(modalDetail)}
                    style={styles.btnModalUndo}
                  >
                    <Undo2 size={14} /> Batalkan Validasi
                  </button>
                ) : (
                  <button
                    onClick={() => setujui(modalDetail)}
                    style={styles.btnModalSetuju}
                  >
                    <CheckCircle2 size={14} /> Setujui Sesi Ini
                  </button>
                )}
                <button
                  onClick={() => setModalDetail(null)}
                  style={styles.btnModalTutup}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL KOREKSI MANUAL NOMINAL HONOR SESI
          ============================================================ */}
      {modalKoreksi && (
        <div style={styles.modalOverlay} onClick={() => setModalKoreksi(null)}>
          <div
            style={{ ...styles.modalCard, maxWidth: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={styles.modalHeader}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#0d9488',
                    textTransform: 'uppercase',
                  }}
                >
                  Penyesuaian Manual Honor
                </div>
                <h3 style={styles.modalTitle}>Koreksi Nominal Honor Sesi</h3>
                <div style={styles.modalSubHeader}>
                  {modalKoreksi.log?.namaGuru} ·{' '}
                  {modalKoreksi.log?.kelasNama || modalKoreksi.log?.program} (
                  {String(modalKoreksi.log?.tanggal).split(' ')[0]})
                </div>
              </div>
              <button
                onClick={() => setModalKoreksi(null)}
                style={styles.btnModalClose}
                title="Batal koreksi"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={styles.modalBody}>
              <div style={styles.koreksiInfoBox}>
                <AlertCircle size={18} color="#0d9488" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: '#134e4a', lineHeight: 1.45 }}>
                  Gunakan menu ini jika <b>sistem salah menghitung</b> nominal (misal durasi lebih lama, semi-privat, atau tarif khusus). Nominal yang Anda simpan akan langsung disinkronkan ke rekap akhir bulan dan audit log.
                </div>
              </div>

              {/* Nominal Saat Ini vs Baru */}
              <div>
                <label style={styles.labelField}>
                  <DollarSign size={13} color="#0d9488" /> Nominal Honor Baru (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  style={styles.inputNominalBig}
                  placeholder="Contoh: 35000"
                  value={modalKoreksi.nominalBaru}
                  onChange={(e) =>
                    setModalKoreksi((prev) => ({
                      ...prev,
                      nominalBaru: e.target.value,
                    }))
                  }
                  autoFocus
                />
                <div style={styles.nominalPreviewText}>
                  Terbaca:{' '}
                  <b>
                    Rp{' '}
                    {Number(modalKoreksi.nominalBaru || 0).toLocaleString(
                      'id-ID',
                    )}
                  </b>
                  {modalKoreksi.log?.nominal !== undefined && (
                    <span style={{ color: '#64748b', marginLeft: 8 }}>
                      (Sebelumnya: Rp{' '}
                      {Number(modalKoreksi.log.nominal || 0).toLocaleString(
                        'id-ID',
                      )}
                      )
                    </span>
                  )}
                </div>
              </div>

              {/* Pilihan Cepat Nominal */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    marginBottom: 6,
                  }}
                >
                  Pilihan Cepat Nominal Standar Bimbel:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[25000, 30000, 35000, 40000, 50000, 60000, 70000, 80000, 100000].map(
                    (nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() =>
                          setModalKoreksi((prev) => ({
                            ...prev,
                            nominalBaru: String(nom),
                          }))
                        }
                        style={{
                          ...styles.btnChipPreset,
                          background:
                            String(nom) === String(modalKoreksi.nominalBaru)
                              ? '#0d9488'
                              : '#f1f5f9',
                          color:
                            String(nom) === String(modalKoreksi.nominalBaru)
                              ? '#ffffff'
                              : '#334155',
                          borderColor:
                            String(nom) === String(modalKoreksi.nominalBaru)
                              ? '#0d9488'
                              : '#cbd5e1',
                        }}
                      >
                        Rp {nom.toLocaleString('id-ID')}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Alasan / Catatan Koreksi */}
              <div>
                <label style={styles.labelField}>
                  <BookOpen size={13} color="#0d9488" /> Alasan / Catatan Koreksi
                </label>
                <textarea
                  rows={2}
                  style={styles.inputTextarea}
                  placeholder="Contoh: Durasi 2 jam penuh, Kelas privat 2 siswa, Perbaikan sistem salah hitung"
                  value={modalKoreksi.catatan}
                  onChange={(e) =>
                    setModalKoreksi((prev) => ({
                      ...prev,
                      catatan: e.target.value,
                    }))
                  }
                />
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginTop: 4,
                  }}
                >
                  {[
                    'Sistem salah hitung tarif',
                    'Durasi jam tambahan',
                    'Kelas semi-privat',
                    'Penyesuaian jenjang SMP/SMA',
                  ].map((alasan) => (
                    <button
                      key={alasan}
                      type="button"
                      onClick={() =>
                        setModalKoreksi((prev) => ({
                          ...prev,
                          catatan: alasan,
                        }))
                      }
                      style={styles.btnAlasanPreset}
                    >
                      + {alasan}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setModalKoreksi(null)}
                style={styles.btnModalTutup}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={simpanKoreksiNominal}
                disabled={prosesId === modalKoreksi.log?.id}
                style={styles.btnSimpanNominal}
              >
                <Check size={14} strokeWidth={3} /> Simpan Koreksi (Rp{' '}
                {Number(modalKoreksi.nominalBaru || 0).toLocaleString('id-ID')}
                )
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ============================================================
// STYLES (MODERN, CLEAN LIGHT THEME GEMILANG)
// ============================================================
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '24px 20px 60px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#0f172a',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
  },

  // Quick Nav Row
  quickNavRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid #e2e8f0',
  },
  quickNavTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12.5,
    fontWeight: 700,
    color: '#0d9488',
  },
  quickNavButtons: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnQuickNav: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#334155',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  },
  btnQuickNavHonor: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },

  // Header Utama
  header: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    flexShrink: 0,
    background: '#f0fdfa',
    border: '1.5px solid #ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.1)',
  },
  h1: {
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: 13,
    color: '#64748b',
    margin: '4px 0 0',
    lineHeight: 1.5,
  },

  // Metric Grid
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: 14,
    border: '1.5px solid #e2e8f0',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  metricVal: {
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1.2,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Alert Box Duplikat
  alertDuplikatBox: {
    background: '#fef2f2',
    border: '1.5px solid #fecaca',
    borderRadius: 14,
    padding: '14px 18px',
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  btnFilterDuplikatPill: {
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
    flexShrink: 0,
  },

  errorBar: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12.5,
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  // Filter Card
  filterCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '16px 18px',
    marginBottom: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  shortcutTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid #f1f5f9',
  },
  shortcutLabel: {
    fontSize: 11.5,
    fontWeight: 800,
    color: '#64748b',
    marginRight: 4,
  },
  btnTimeShortcut: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#334155',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  },

  filterInputsRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 160,
  },
  labelField: {
    fontSize: 11,
    fontWeight: 800,
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  inputDate: {
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 12.5,
    color: '#0f172a',
    outline: 'none',
    background: '#ffffff',
  },
  inputText: {
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: 12.5,
    color: '#0f172a',
    outline: 'none',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
  },
  btnRefresh: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    color: '#334155',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
  },
  btnDownload: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
  },

  // Tab Nav Row
  tabNavRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
  },
  tabNavGroup: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  tabNav: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabNavRed: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#e11d48',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabNavActive: {
    background: '#0d9488',
    border: '1px solid #0d9488',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabNavActiveAmber: {
    background: '#d97706',
    border: '1px solid #d97706',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabNavActiveGreen: {
    background: '#16a34a',
    border: '1px solid #16a34a',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabNavActiveRed: {
    background: '#dc2626',
    border: '1px solid #dc2626',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabNavActiveIndigo: {
    background: '#4f46e5',
    border: '1px solid #4f46e5',
    color: '#ffffff',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  chipGuruReset: {
    background: '#e0e7ff',
    border: '1px solid #c7d2fe',
    color: '#4338ca',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Table Card
  tableCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  tableScroll: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    background: '#f8fafc',
    borderBottom: '1.5px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontSize: 11.5,
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '14px 16px',
    fontSize: 12.5,
    verticalAlign: 'top',
  },

  // Cell elements
  tglText: {
    fontWeight: 800,
    color: '#0f172a',
    fontSize: 13,
  },
  jamText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  durasiChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10.5,
    color: '#0f766e',
    background: '#f0fdfa',
    padding: '1px 6px',
    borderRadius: 4,
    marginTop: 4,
    fontWeight: 600,
  },
  guruNama: {
    fontWeight: 800,
    color: '#0f172a',
    fontSize: 13.5,
  },
  kelasPill: {
    display: 'inline-block',
    background: '#f1f5f9',
    color: '#334155',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    marginTop: 3,
  },
  materiPreviewText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Kehadiran Siswa Badges
  kehadiranBadgeLengkap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#dcfce7',
    color: '#15803d',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
  },
  kehadiranBadgeSebagian: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#fef3c7',
    color: '#b45309',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
  },
  kehadiranBadgeNol: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
  },
  kehadiranBadgeBiasa: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: '#f1f5f9',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  siswaListPreview: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 1.35,
  },
  btnLihatMurid: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#0f766e',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 10.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  btnFotoMini: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#2563eb',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 10.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
  },

  // Status Badges
  statusBadgeValid: {
    display: 'inline-block',
    background: '#dcfce7',
    color: '#15803d',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
  },
  statusBadgeMenunggu: {
    display: 'inline-block',
    background: '#fef3c7',
    color: '#b45309',
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
  },
  validatorText: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },

  // Kejanggalan Box
  duplikatWarningBox: {
    marginTop: 6,
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 11,
    lineHeight: 1.3,
  },
  kejanggalanPillBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  kejanggalanChip: {
    fontSize: 10,
    color: '#c2410c',
    background: '#fff7ed',
    border: '1px solid #ffedd5',
    padding: '1px 6px',
    borderRadius: 4,
    display: 'inline-block',
  },

  // Action Buttons
  actionBtnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
  },
  btnAksiSetuju: {
    width: '100%',
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnAksiUndo: {
    width: '100%',
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnAksiHapus: {
    width: '100%',
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#64748b',
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modalCard: {
    background: '#ffffff',
    borderRadius: 18,
    width: '100%',
    maxWidth: 620,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  modalTitle: {
    margin: '2px 0 0',
    fontSize: 17,
    fontWeight: 900,
    color: '#0f172a',
  },
  modalSubHeader: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  btnModalClose: {
    background: '#e2e8f0',
    border: 'none',
    color: '#475569',
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  modalAlertDuplikat: {
    background: '#fef2f2',
    border: '1.5px solid #fecaca',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  modalSectionCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '12px 14px',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  subTable: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  subThRow: {
    background: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
  },
  subTh: {
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 800,
    color: '#475569',
    textAlign: 'left',
  },
  subTr: {
    borderBottom: '1px solid #f1f5f9',
  },
  subTd: {
    padding: '8px 10px',
    fontSize: 12,
    color: '#334155',
  },
  badgeHadirMini: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 800,
  },
  emptySiswaInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    background: '#ffffff',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px dashed #cbd5e1',
  },
  emptyFotoInfo: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    padding: '16px',
    background: '#ffffff',
    borderRadius: 8,
    border: '1px dashed #cbd5e1',
  },
  modalFotoImg: {
    maxWidth: '100%',
    maxHeight: 240,
    borderRadius: 10,
    objectFit: 'contain',
    border: '1px solid #cbd5e1',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  modalFotoOverlayBtn: {
    marginTop: 6,
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modalFooter: {
    padding: '12px 20px',
    borderTop: '1px solid #e2e8f0',
    background: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnModalHapus: {
    background: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnModalSetuju: {
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnModalUndo: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnModalTutup: {
    background: '#ffffff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Rekap Toggle Bar
  rekapToggleBar: {
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  btnToggleRekap: {
    border: '1.5px solid #0d9488',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(13, 148, 136, 0.1)',
  },

  // Rekap Card & Table
  rekapTentorCard: {
    background: '#ffffff',
    border: '1.5px solid #ccfbf1',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 20,
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.08)',
  },
  rekapTentorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  rekapIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#f0fdfa',
    border: '1px solid #ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rekapTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 900,
    color: '#0f172a',
  },
  rekapSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 1.45,
  },
  btnTutupRekap: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  rekapKosong: {
    padding: '30px 16px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    background: '#f8fafc',
    borderRadius: 10,
  },
  rekapTableWrapper: {
    overflowX: 'auto',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
  },
  rekapTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: 12,
  },
  rekapThRow: {
    background: '#f0fdfa',
    borderBottom: '1.5px solid #ccfbf1',
  },
  rekapTh: {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 800,
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  rekapTr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  rekapTd: {
    padding: '10px 14px',
    verticalAlign: 'middle',
  },
  pillSesiTotal: {
    background: '#f1f5f9',
    color: '#334155',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-block',
  },
  pillSesiValid: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '2px 7px',
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 800,
  },
  pillSesiMenunggu: {
    background: '#fef3c7',
    color: '#b45309',
    padding: '2px 7px',
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 800,
  },
  pillKoreksiAda: {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 10.5,
    fontWeight: 700,
    display: 'inline-block',
  },
  pillKoreksiNol: {
    fontSize: 11,
    color: '#94a3b8',
  },
  btnFilterGuru: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#0f766e',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  btnFilterGuruAktif: {
    background: '#0d9488',
    border: '1px solid #0d9488',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  rekapTfoot: {
    background: '#f8fafc',
    borderTop: '2px solid #cbd5e1',
  },

  // Nominal Cell Elements
  nominalText: {
    fontWeight: 900,
    color: '#0f766e',
    fontSize: 14,
  },
  badgeManualPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    marginTop: 3,
  },
  badgeOtomatisPill: {
    display: 'inline-block',
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  nominalCatatanText: {
    fontSize: 10.5,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
    maxWidth: 180,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  btnKoreksiMini: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#0f766e',
    padding: '3px 8px',
    borderRadius: 5,
    fontSize: 10.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.15s ease',
  },
  btnKoreksiMiniModal: {
    background: '#0d9488',
    border: 'none',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },

  // Modal Koreksi Elements
  koreksiInfoBox: {
    background: '#f0fdfa',
    border: '1.5px solid #ccfbf1',
    borderRadius: 10,
    padding: '10px 12px',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  inputNominalBig: {
    width: '100%',
    boxSizing: 'border-box',
    border: '2px solid #0d9488',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 18,
    fontWeight: 900,
    color: '#0f766e',
    outline: 'none',
    background: '#ffffff',
    marginTop: 4,
  },
  nominalPreviewText: {
    fontSize: 12,
    color: '#0f766e',
    marginTop: 4,
  },
  btnChipPreset: {
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
  },
  inputTextarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1.5px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12.5,
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    marginTop: 4,
    resize: 'vertical',
  },
  btnAlasanPreset: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10.5,
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnSimpanNominal: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
};
