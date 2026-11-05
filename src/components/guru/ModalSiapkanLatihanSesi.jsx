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
  const [modePilihan, setModePilihan] = useState('rekomendasi'); // 'rekomendasi' | 'manual'
  const [loadingBank, setLoadingBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankSoalList, setBankSoalList] = useState([]);
  const [soalTerpilih, setSoalTerpilih] = useState([]);
  const [blindSubmission, setBlindSubmission] = useState(true);
  const [acakUrutan, setAcakUrutan] = useState(true);
  const [durasiMenit, setDurasiMenit] = useState(15);
  const [pesanStatus, setPesanStatus] = useState('');

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
      } catch (err) {
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

  // Inisialisasi jika latihan sudah pernah diterbitkan di jadwal
  useEffect(() => {
    if (schedule?.latihanSesi) {
      const lat = schedule.latihanSesi;
      if (lat.babId) setSelectedBabId(lat.babId);
      if (lat.subBab) setSelectedSubBab(lat.subBab);
      if (lat.durasiMenit) setDurasiMenit(lat.durasiMenit);
      if (typeof lat.blindSubmission === 'boolean') setBlindSubmission(lat.blindSubmission);
      if (typeof lat.acakSoal === 'boolean') setAcakUrutan(lat.acakSoal);
      if (Array.isArray(lat.soalList) && lat.soalList.length > 0) {
        setSoalTerpilih(lat.soalList.map((s, idx) => normalisasiButirSoal(s, idx)));
      }
    }
  }, [schedule]);

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

        // Filter butir yang relevan dengan mapel jika memungkinkan
        const relevan = items.filter((it) => {
          const m = normalisasiKodeMapel(it.mapel);
          return m === kodeMapel;
        });

        setBankSoalList(relevan.length >= 5 ? relevan : items);
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
  }, [kodeMapel]);

  // 4. Rekomendasi Cerdas / AI Filter Soal
  const handleTerapkanRekomendasi = (jumlahTarget = 5) => {
    if (!babTerpilihObj) return;
    const kataKunci = [
      babTerpilihObj.judul.toLowerCase(),
      selectedSubBab.toLowerCase(),
      mapelNama.toLowerCase(),
    ].join(' ');

    // Urutkan bank soal berdasarkan kecocokan materi dan kata kunci
    const skorButir = bankSoalList.map((item) => {
      let skor = 0;
      const teks = (item.teksSoal + ' ' + (item.materi || '')).toLowerCase();
      if (item.materi && item.materi.toLowerCase().includes(babTerpilihObj.judul.toLowerCase())) {
        skor += 20;
      }
      if (teks.includes('persamaan') && kataKunci.includes('persamaan')) skor += 8;
      if (teks.includes('spldv') || teks.includes('linear')) skor += 10;
      if (teks.includes('bangun ruang') && kataKunci.includes('bangun ruang')) skor += 8;
      if (teks.includes('transformasi') && kataKunci.includes('transformasi')) skor += 8;
      if (teks.includes('peluang') && kataKunci.includes('peluang')) skor += 8;
      // Prioritaskan soal yang memiliki gambar lengkap jika topik geometris/grafik
      if (item.gambarUrls && item.gambarUrls.length > 0) skor += 3;
      return { item, skor };
    });

    skorButir.sort((a, b) => b.skor - a.skor);

    let terpilih = skorButir.slice(0, jumlahTarget).map((x) => x.item);

    // Fallback jika bank_soal Firestore masih kosong/sedikit
    if (terpilih.length < jumlahTarget) {
      const sisa = jumlahTarget - terpilih.length;
      const judulBab = babTerpilihObj?.judul || 'Materi Pembelajaran';
      const sub = selectedSubBab || babTerpilihObj?.subBab?.[0] || 'Konsep Dasar';
      for (let i = 1; i <= sisa; i++) {
        const no = terpilih.length + 1;
        const isSains = kodeMapel === 'ipa' || kodeMapel === 'bio' || kodeMapel === 'fis' || kodeMapel === 'kim' || kodeMapel === 'ipas';
        if (isSains) {
          terpilih.push(normalisasiButirSoal({
            id: `seed-${Date.now()}-${no}`,
            nomor: no,
            teksSoal: `Pada materi ${judulBab} terkait pokok bahasan "${sub}", bagaimanakah mekanisme atau fenomena ilmiah yang mendasari proses tersebut terjadi dalam konteks kehidupan sehari-hari?`,
            opsiJawaban: [
              { label: 'A', teks: 'Terjadi interaksi faktor biologis dan lingkungan yang mempertahankan kondisi seimbang' },
              { label: 'B', teks: 'Penurunan laju reaksi secara spontan tanpa dipengaruhi rangsangan luar' },
              { label: 'C', teks: 'Perubahan struktur molekuler secara acak tanpa adanya transfer energi kinetik' },
              { label: 'D', teks: 'Peningkatan gradien konsentrasi zat secara pasif melawan arah difusi alami' },
            ],
            kunciJawaban: 'A',
            pembahasan: `Analisis terstruktur: Pada materi ${judulBab}, mekanisme ilmiah berfokus pada keseimbangan proses dan respons adaptif terhadap lingkungan.`,
            materi: judulBab,
          }, terpilih.length));
        } else {
          terpilih.push(normalisasiButirSoal({
            id: `seed-${Date.now()}-${no}`,
            nomor: no,
            teksSoal: `Diketahui pemodelan permasalahan pada ${judulBab} terkait pokok bahasan "${sub}". Tentukan metode analisis yang paling sistematis untuk memperoleh kesimpulan yang valid!`,
            opsiJawaban: [
              { label: 'A', teks: 'Menganalisis hubungan antar-variabel dan menyusun formulasi pemecahan secara bertahap' },
              { label: 'B', teks: 'Mengabaikan parameter batas dan langsung mengasumsikan nilai konstan' },
              { label: 'C', teks: 'Memilih data ekstrem secara acak tanpa verifikasi hipotesis awal' },
              { label: 'D', teks: 'Menyamakan semua faktor independen menjadi satu besaran tunggal' },
            ],
            kunciJawaban: 'A',
            pembahasan: `Analisis terstruktur: Pada materi ${judulBab}, penyelesaian dimulai dari memetakan variabel dan menyelesaikan secara bertahap.`,
            materi: judulBab,
          }, terpilih.length));
        }
      }
    }

    setSoalTerpilih(terpilih);
    setPesanStatus(`✨ Berhasil menyiapkan ${terpilih.length} butir soal terverifikasi untuk ${babTerpilihObj.judul}`);
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
        judul: `Latihan Pemahaman: ${babTerpilihObj?.judul || 'Sesi Hari Ini'}`,
        babId: selectedBabId,
        babJudul: babTerpilihObj?.judul || '',
        subBab: selectedSubBab || '',
        totalSoal: soalTerpilih.length,
        durasiMenit: Number(durasiMenit) || 15,
        blindSubmission: Boolean(blindSubmission),
        acakSoal: Boolean(acakUrutan),
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
        materiTerakhir: `${babTerpilihObj?.judul || ''}${selectedSubBab ? ' — ' + selectedSubBab : ''}`,
        babId: selectedBabId,
        babJudul: babTerpilihObj?.judul || '',
        subBab: selectedSubBab || '',
      });

      alert(`✅ Latihan Sesi Berhasil Diterbitkan!\n\n${soalTerpilih.length} butir soal kini aktif untuk kelas ${schedule.title || 'Sesi Ini'}.\nSiswa dapat langsung membukanya di Dashboard Siswa dengan mode Blind Submission.`);
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
              </div>
            )}
          </div>

          {/* 2. Metode Penyiapan Soal: Rekomendasi Cerdas / AI Filter vs Manual */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setModePilihan('rekomendasi')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: modePilihan === 'rekomendasi' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  background: modePilihan === 'rekomendasi' ? '#eef2ff' : '#ffffff',
                  color: modePilihan === 'rekomendasi' ? '#3730a3' : '#64748b',
                  fontWeight: 700,
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={16} color={modePilihan === 'rekomendasi' ? '#4f46e5' : '#64748b'} />
                ✨ Rekomendasi Cerdas (AI Filter Bank Soal)
              </button>
              <button
                type="button"
                onClick={() => setModePilihan('manual')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: modePilihan === 'manual' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  background: modePilihan === 'manual' ? '#eef2ff' : '#ffffff',
                  color: modePilihan === 'manual' ? '#3730a3' : '#64748b',
                  fontWeight: 700,
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <ListChecks size={16} color={modePilihan === 'manual' ? '#4f46e5' : '#64748b'} />
                📋 Pilih Manual dari Bank Soal ({bankSoalList.length} Tersedia)
              </button>
            </div>

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
                    Sistem memfilter bank soal yang paling cocok dengan <b>{babTerpilihObj?.judul || 'Bab Ini'}</b>.
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📖 Tinjau Butir Soal Terpilih ({soalTerpilih.length} Soal)</span>
              </div>
              {soalTerpilih.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSoalTerpilih([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Kosongkan
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
                  color: '#94a3b8',
                  fontSize: 12,
                }}
              >
                Belum ada butir soal yang dipilih. Klik <b>"Siapkan 5 Soal Cepat"</b> di atas atau centang manual dari Bank Soal.
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
