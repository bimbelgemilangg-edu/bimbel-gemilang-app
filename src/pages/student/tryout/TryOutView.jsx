// src/pages/student/tryout/TryOutView.jsx
// ============================================================
// HALAMAN UTAMA TRY OUT (siswa) -- menyatukan semua modul yang sudah
// dibangun terpisah:
//   - useTimerTryOut.js       (2 mode timer, diikat waktu mulai)
//   - useDeteksiKecuranganTryOut.js (kamera acak + tab/fullscreen)
//   - RendererPgSederhana/PgKompleks/BenarSalah.jsx (3 tipe soal)
//   - skoringSoalKompleks.js  (skor proporsional)
//   - potonganXPTryOut.js     (potongan XP dari pelanggaran)
//   - RingkasanPelanggaran.jsx (tampilan di layar hasil)
//
// KEPUTUSAN PENTING (jangan diubah tanpa alasan kuat):
// - Jawaban per soal DISIMPAN begitu pindah soal (bukan cuma di
//   akhir) -- konsisten sama prinsip "jangan sampai kehilangan progres
//   kalau app ketutup" yang sudah dipakai di Latihan Harian.
// - Mode 'per-subtes': begitu waktu 1 subtes habis, OTOMATIS pindah ke
//   subtes berikutnya -- TIDAK BISA balik ke subtes sebelumnya lagi
//   (persis UTBK/TKA asli).
// - waktuMulaiMs disimpan sebagai angka biasa (bukan cuma
//   serverTimestamp) supaya timer bisa langsung jalan tanpa nunggu
//   round-trip server. Konsekuensi jujur: siswa yang PAKSA ubah jam
//   sistem device-nya secara teknis BISA mengelabui timer ini -- sama
//   seperti keterbatasan anti-cheat lain di app ini, ini mempersulit,
//   bukan menjamin 100% (di skala bimbel ini reasonable trade-off,
//   bukan ujian nasional bersertifikat).
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  doc, getDoc, addDoc, updateDoc, collection, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { ArrowLeft, Camera, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';

import { useTimerTryOut } from './useTimerTryOut';
import { useDeteksiKecuranganTryOut } from './useDeteksiKecuranganTryOut';
import RendererPgSederhana from './RendererPgSederhana';
import RendererPgKompleks from './RendererPgKompleks';
import RendererBenarSalah from './RendererBenarSalah';
import RingkasanPelanggaran from './RingkasanPelanggaran';
import { hitungSkorPgKompleks, hitungSkorBenarSalah } from '../../../utils/skoringSoalKompleks';
import { terapkanPotonganXP } from '../../../utils/potonganXPTryOut';

const XP_PER_SOAL = 10; // konsisten sama XP_PER_BENAR di Latihan Harian

function RendererSoal(props) {
  const tipe = props.soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks {...props} />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah {...props} />;
  return <RendererPgSederhana {...props} />;
}

function skorSatuSoal(soal, jawaban) {
  const tipe = soal.tipe || 'pg_sederhana';
  if (jawaban === undefined || jawaban === null) return 0;
  if (tipe === 'pg_kompleks') return hitungSkorPgKompleks(soal.kunciJawaban, jawaban);
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    const baris = soal.tabel_benar_salah?.length ? soal.tabel_benar_salah : soal.pernyataan || [];
    return hitungSkorBenarSalah(baris, jawaban);
  }
  const indexBenar = String(soal.kunciJawaban || '').trim().toUpperCase().charCodeAt(0) - 65;
  return jawaban === indexBenar ? 1 : 0;
}

export default function TryOutView() {
  const { paketId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  const [tahap, setTahap] = useState('memuat'); // 'memuat' | 'mulai' | 'mengerjakan' | 'selesai'
  const [paket, setPaket] = useState(null);
  const [sesiId, setSesiId] = useState(null);
  const [jawaban, setJawaban] = useState({}); // { soalId: value }
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0);
  const [waktuMulaiMs, setWaktuMulaiMs] = useState(null);
  const [waktuMulaiSubtesMs, setWaktuMulaiSubtesMs] = useState(null);
  const [indexSoalAktif, setIndexSoalAktif] = useState(0);
  const [hasilAkhir, setHasilAkhir] = useState(null); // { xpMentah, xpFinal, totalSkorPersen, ... }
  const [fotoPengawasan, setFotoPengawasan] = useState([]);

  // ---------------- MUAT PAKET + CEK SESI YANG SUDAH ADA ----------------
  useEffect(() => {
    (async () => {
      try {
        const snapPaket = await getDoc(doc(db, 'tryout_paket', paketId));
        if (!snapPaket.exists()) { setTahap('tidak-ditemukan'); return; }
        const dataPaket = { id: snapPaket.id, ...snapPaket.data() };
        setPaket(dataPaket);

        const snapSesi = await getDocs(query(
          collection(db, 'tryout_sesi'),
          where('paketId', '==', paketId),
          where('studentId', '==', studentId),
        ));

        if (!snapSesi.empty) {
          const sesi = { id: snapSesi.docs[0].id, ...snapSesi.docs[0].data() };
          setSesiId(sesi.id);
          setJawaban(sesi.jawaban || {});
          setFotoPengawasan(sesi.fotoPengawasan || []);
          if (sesi.status === 'selesai') {
            setHasilAkhir({
              xpMentah: sesi.xpMentah, xpFinal: sesi.xpFinal, totalSkorPersen: sesi.totalSkorPersen, pelanggaran: sesi.pelanggaran || [],
            });
            setTahap('selesai');
          } else {
            setSubtesAktifIndex(sesi.subtesAktifIndex || 0);
            setWaktuMulaiMs(sesi.waktuMulaiMs || Date.now());
            setWaktuMulaiSubtesMs(sesi.waktuMulaiSubtesMs || Date.now());
            setTahap('mengerjakan');
          }
        } else {
          // 🔥 BARU: pagar kedua -- cek jadwal buka/deadline di sini
          // juga, bukan cuma di DaftarTryOutPage.jsx. Ini jaga-jaga
          // kalau siswa buka link try out langsung (bukan lewat daftar),
          // yang JADWALnya udah lewat/belum dibuka tetap gak bisa mulai.
          const sekarang = new Date();
          if (dataPaket.waktuBuka && sekarang < new Date(dataPaket.waktuBuka)) {
            setTahap('belum-dibuka');
          } else if (dataPaket.waktuTutup && sekarang > new Date(dataPaket.waktuTutup)) {
            setTahap('lewat-deadline');
          } else {
            setTahap('mulai');
          }
        }
      } catch (e) {
        console.error('Gagal memuat try out:', e);
        setTahap('gagal');
      }
    })();
  }, [paketId, studentId]);

  // Daftar soal yang SEDANG BOLEH dikerjakan -- kalau mode per-subtes,
  // cuma soal di subtes aktif (soal di subtes lain/sebelumnya TIDAK
  // ditampilkan lagi -- sesuai aturan "gak bisa balik").
  const daftarSoalAktif = useMemo(() => {
    if (!paket) return [];
    if (paket.modeTimer === 'per-subtes') {
      const subtesIni = paket.subtes?.[subtesAktifIndex];
      if (!subtesIni) return [];
      const idSet = new Set(subtesIni.soalIds);
      return paket.daftarSoal.filter((s) => idSet.has(s.id));
    }
    return paket.daftarSoal || [];
  }, [paket, subtesAktifIndex]);

  const soalAktif = daftarSoalAktif[indexSoalAktif];

  // ---------------- SIMPAN JAWABAN (per-soal, gak nunggu submit akhir) ----------------
  const simpanProgres = useCallback(async (jawabanBaru, subtesIndexBaru, waktuSubtesBaru) => {
    if (!sesiId) return;
    try {
      await updateDoc(doc(db, 'tryout_sesi', sesiId), {
        jawaban: jawabanBaru,
        subtesAktifIndex: subtesIndexBaru,
        waktuMulaiSubtesMs: waktuSubtesBaru,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Gagal menyimpan progres try out:', e);
    }
  }, [sesiId]);

  const ubahJawaban = useCallback((soalId, value) => {
    setJawaban((prev) => {
      const next = { ...prev, [soalId]: value };
      simpanProgres(next, subtesAktifIndex, waktuMulaiSubtesMs);
      return next;
    });
  }, [simpanProgres, subtesAktifIndex, waktuMulaiSubtesMs]);

  // ---------------- MULAI TRY OUT ----------------
  const mulaiTryOut = useCallback(async () => {
    const sekarang = Date.now();
    try {
      const docRef = await addDoc(collection(db, 'tryout_sesi'), {
        paketId,
        studentId,
        status: 'berjalan',
        jawaban: {},
        subtesAktifIndex: 0,
        waktuMulai: serverTimestamp(),
        waktuMulaiMs: sekarang,
        waktuMulaiSubtesMs: sekarang,
        pelanggaran: [],
        fotoPengawasan: [],
        createdAt: serverTimestamp(),
      });
      setSesiId(docRef.id);
      setWaktuMulaiMs(sekarang);
      setWaktuMulaiSubtesMs(sekarang);
      setTahap('mengerjakan');
    } catch (e) {
      console.error('Gagal memulai try out:', e);
      alert('Gagal memulai try out, coba lagi.');
    }
  }, [paketId, studentId]);

  // ---------------- ANTI-CHEAT ----------------
  const {
    pelanggaran, showPeringatan, tutupPeringatan, statusKamera, jumlahFotoTersimpan, videoRef,
  } = useDeteksiKecuranganTryOut({
    aktif: tahap === 'mengerjakan',
    wajibKamera: !!paket?.wajibKamera,
    onFotoTersimpan: (url) => setFotoPengawasan((prev) => [...prev, url]),
  });

  // ---------------- SUBMIT / SELESAIKAN ----------------
  const selesaikanTryOut = useCallback(async () => {
    if (!paket) return;
    let totalSkor = 0;
    paket.daftarSoal.forEach((s) => { totalSkor += skorSatuSoal(s, jawaban[s.id]); });
    const totalSkorPersen = Math.round((totalSkor / paket.daftarSoal.length) * 100);
    const xpMentah = Math.round(totalSkor * XP_PER_SOAL);
    const { xpFinal } = terapkanPotonganXP(xpMentah, pelanggaran);

    try {
      if (sesiId) {
        await updateDoc(doc(db, 'tryout_sesi', sesiId), {
          status: 'selesai',
          jawaban,
          totalSkorPersen,
          xpMentah,
          xpFinal,
          pelanggaran,
          fotoPengawasan,
          waktuSelesai: serverTimestamp(),
        });
      }

      // Tambahkan XP ke siswa_progress -- HANYA nambah XP, TIDAK
      // menyentuh streak/jatah harian (itu urusan Latihan Harian,
      // Try Out sistem terpisah).
      if (studentId) {
        const progRef = doc(db, 'siswa_progress', studentId);
        const snap = await getDoc(progRef);
        const xpSekarang = snap.exists() ? (snap.data().xp || 0) : 0;
        await updateDoc(progRef, { xp: xpSekarang + xpFinal, updatedAt: serverTimestamp() }).catch(async () => {
          // dokumen belum ada -- buat baru
          const { setDoc } = await import('firebase/firestore');
          await setDoc(progRef, { xp: xpFinal, updatedAt: serverTimestamp() }, { merge: true });
        });
      }
    } catch (e) {
      console.error('Gagal menyimpan hasil try out:', e);
    }

    setHasilAkhir({ xpMentah, xpFinal, totalSkorPersen, pelanggaran });
    setTahap('selesai');
  }, [paket, jawaban, pelanggaran, sesiId, fotoPengawasan, studentId]);

  // ---------------- TIMER ----------------
  const pindahSubtesBerikutnya = useCallback(() => {
    if (!paket) return;
    const berikutnya = subtesAktifIndex + 1;
    if (berikutnya >= paket.subtes.length) {
      selesaikanTryOut();
      return;
    }
    const sekarang = Date.now();
    setSubtesAktifIndex(berikutnya);
    setWaktuMulaiSubtesMs(sekarang);
    setIndexSoalAktif(0);
    simpanProgres(jawaban, berikutnya, sekarang);
    alert(`Waktu subtes "${paket.subtes[subtesAktifIndex].nama}" habis. Lanjut ke subtes "${paket.subtes[berikutnya].nama}".`);
  }, [paket, subtesAktifIndex, jawaban, simpanProgres, selesaikanTryOut]);

  const { teksWaktu, hampirHabis } = useTimerTryOut({
    aktif: tahap === 'mengerjakan',
    modeTimer: paket?.modeTimer,
    waktuMulaiMs,
    durasiTotalMenit: paket?.durasiTotalMenit,
    subtes: paket?.subtes,
    subtesAktifIndex,
    waktuMulaiSubtesMs,
    onHabis: paket?.modeTimer === 'per-subtes' ? pindahSubtesBerikutnya : selesaikanTryOut,
  });

  // ================= RENDER =================
  if (tahap === 'memuat') return <div style={st.pusat}>Memuat try out...</div>;
  if (tahap === 'tidak-ditemukan') return <div style={st.pusat}>Try out tidak ditemukan.</div>;
  if (tahap === 'belum-dibuka') {
    return (
      <div style={{ ...st.pusat, flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontWeight: 700, color: '#1e293b' }}>Try out ini belum dibuka</div>
        <div style={{ fontSize: 12.5 }}>Dibuka {new Date(paket.waktuBuka).toLocaleString('id-ID')}</div>
        <button onClick={() => navigate('/siswa/tryout')} style={{ ...st.tombolSekunder, marginTop: 10 }}>Kembali</button>
      </div>
    );
  }
  if (tahap === 'lewat-deadline') {
    return (
      <div style={{ ...st.pusat, flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 40 }}>⏰</div>
        <div style={{ fontWeight: 700, color: '#1e293b' }}>Try out ini sudah lewat deadline</div>
        <div style={{ fontSize: 12.5 }}>Ditutup {new Date(paket.waktuTutup).toLocaleString('id-ID')}</div>
        <button onClick={() => navigate('/siswa/tryout')} style={{ ...st.tombolSekunder, marginTop: 10 }}>Kembali</button>
      </div>
    );
  }
  if (tahap === 'gagal') return <div style={st.pusat}>Gagal memuat try out. Coba muat ulang halaman.</div>;

  if (tahap === 'mulai') {
    return (
      <div style={{ maxWidth: 560, margin: '40px auto', padding: 20, textAlign: 'center' }}>
        <button onClick={() => navigate(-1)} style={st.backBtn}><ArrowLeft size={16} /> Kembali</button>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎯</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{paket.judul}</h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '10px 0 20px' }}>
          {paket.totalSoal} soal · {paket.modeTimer === 'total' ? `${paket.durasiTotalMenit} menit total` : `${paket.subtes.length} subtes, tiap subtes ada batas waktu sendiri`}
        </p>
        {paket.antiCheatAktif && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, fontSize: 12, color: '#92400e', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
              <ShieldAlert size={14} /> Try out ini diawasi
            </div>
            Pindah tab/aplikasi, keluar fullscreen{paket.wajibKamera ? ', dan kamera mati' : ''} akan tercatat sebagai pelanggaran dan memotong XP kamu.
            {paket.wajibKamera && ' Pastikan kamera perangkatmu menyala dan wajahmu kelihatan jelas.'}
          </div>
        )}
        <button onClick={mulaiTryOut} style={st.tombolUtama}>Mulai Try Out</button>
      </div>
    );
  }

  if (tahap === 'selesai') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
        <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtn}><ArrowLeft size={16} /> Kembali ke Dashboard</button>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44 }}>🏁</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Try Out Selesai</h1>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed', margin: '10px 0' }}>{hasilAkhir?.totalSkorPersen}%</div>
        </div>

        <RingkasanPelanggaran
          pelanggaran={hasilAkhir?.pelanggaran || []}
          jumlahFotoTersimpan={fotoPengawasan.length}
          xpMentah={hasilAkhir?.xpMentah}
          xpFinal={hasilAkhir?.xpFinal}
        />

        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b', margin: '20px 0 10px' }}>📋 TINJAU JAWABAN</div>
        {paket.daftarSoal.map((s, i) => {
          const skor = skorSatuSoal(s, jawaban[s.id]);
          return (
            <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: skor >= 0.99 ? '#16a34a' : skor > 0 ? '#d97706' : '#dc2626', fontWeight: 700, marginBottom: 6 }}>
                Soal {i + 1} -- skor {Math.round(skor * 100)}%
              </div>
              <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10 }}>{s.soal || s.teks_soal}</div>
              <RendererSoal soal={s} jawabanTerpilih={jawaban[s.id]} modeTinjau />
              {s.pembahasan && (
                <div style={{ marginTop: 10, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#4c1d95' }}>
                  <b>💡 Pembahasan</b>
                  <div style={{ marginTop: 4 }}>{s.pembahasan}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------- MENGERJAKAN ----------------
  if (!soalAktif) return <div style={st.pusat}>Memuat soal...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, paddingBottom: 100 }}>
      <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

      {/* HEADER: timer + status kamera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#1e293b', borderRadius: 10, marginBottom: 12 }}>
        <div style={{ color: 'white', fontSize: 12.5 }}>
          {paket.modeTimer === 'per-subtes' ? paket.subtes[subtesAktifIndex]?.nama : paket.judul}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {paket.wajibKamera && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: statusKamera === 'aktif' ? '#4ade80' : '#f87171' }}>
              <Camera size={13} /> {statusKamera === 'aktif' ? 'Aktif' : statusKamera === 'memuat' ? 'Memuat...' : 'Tidak aktif'}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: hampirHabis ? '#f87171' : 'white' }}>
            <Clock size={14} /> {teksWaktu}
          </span>
        </div>
      </div>

      {/* PALET NOMOR SOAL */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {daftarSoalAktif.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndexSoalAktif(i)}
            style={{
              width: 30, height: 30, borderRadius: 6, border: i === indexSoalAktif ? '2px solid #7c3aed' : '1px solid #e2e8f0',
              background: jawaban[s.id] !== undefined ? '#ede9fe' : 'white', fontSize: 11.5, fontWeight: 700,
              color: i === indexSoalAktif ? '#7c3aed' : '#64748b', cursor: 'pointer',
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* SOAL */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{soalAktif.materi}</div>
        {soalAktif.bacaan?.teks && (
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: '#334155' }}>
            {soalAktif.bacaan.teks}
          </div>
        )}
        <div style={{ fontSize: 14, color: '#1e293b', marginBottom: 16 }}>{soalAktif.soal || soalAktif.teks_soal}</div>
        <RendererSoal
          soal={soalAktif}
          jawabanTerpilih={jawaban[soalAktif.id]}
          onChange={(val) => ubahJawaban(soalAktif.id, val)}
        />
      </div>

      {/* NAVIGASI */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setIndexSoalAktif((i) => Math.max(0, i - 1))}
          disabled={indexSoalAktif === 0}
          style={{ ...st.tombolSekunder, opacity: indexSoalAktif === 0 ? 0.4 : 1 }}
        >
          Sebelumnya
        </button>
        {indexSoalAktif < daftarSoalAktif.length - 1 ? (
          <button onClick={() => setIndexSoalAktif((i) => i + 1)} style={{ ...st.tombolUtama, flex: 1 }}>Selanjutnya</button>
        ) : (
          <button onClick={selesaikanTryOut} style={{ ...st.tombolUtama, flex: 1, background: '#16a34a' }}>
            <CheckCircle2 size={16} /> {paket.modeTimer === 'per-subtes' && subtesAktifIndex < paket.subtes.length - 1 ? 'Selesai Subtes Ini' : 'Kumpulkan Try Out'}
          </button>
        )}
      </div>

      {/* PERINGATAN KECURANGAN */}
      {showPeringatan && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <ShieldAlert size={32} color="#dc2626" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 6 }}>Pelanggaran Terdeteksi</div>
            <div style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 14 }}>
              Ini pelanggaran ke-{pelanggaran.length}. Kejadian ini tercatat dan akan memotong XP try out ini.
            </div>
            <button onClick={tutupPeringatan} style={st.tombolUtama}>Mengerti, Lanjutkan</button>
          </div>
        </div>
      )}
    </div>
  );
}

const st = {
  pusat: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b', fontSize: 13 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 },
  tombolUtama: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 20px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', width: '100%' },
  tombolSekunder: { padding: '13px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: 'white', borderRadius: 16, padding: 24, maxWidth: 340, textAlign: 'center' },
};