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
import LencanaPencapaian from '../../../components/LencanaPencapaian';
import { skorSatuSoal, hitungTotalSkor, soalBelumDijawab } from '../../../utils/skorSoalTryOut';
import { terapkanPotonganXP } from '../../../utils/potonganXPTryOut';
import { acakSoalPerSiswa } from '../../../utils/acakSoalTryOut';
import { tambahXpMingguan } from '../../../utils/mingguIni';

const XP_PER_SOAL = 10; // konsisten sama XP_PER_BENAR di Latihan Harian

function RendererSoal(props) {
  const tipe = props.soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks {...props} />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah {...props} />;
  return <RendererPgSederhana {...props} />;
}

// 🔥 BARU (bug freeze/blank putih ditemukan): sebelumnya kalau ADA
// SATU soal yang datanya aneh (mis. kunciJawaban tersimpan salah
// format), renderernya crash dan React nge-blank-in SELURUH halaman
// try out -- siswa kehilangan progres, harus reload, panik di tengah
// ujian beneran. Error Boundary ini nangkep crash itu SUPAYA CUMA
// SOAL YANG BERMASALAH doang yang kena, sisanya tetap jalan normal --
// siswa bisa tandai soal ini & lanjut ke soal lain, laporin ke admin
// belakangan lewat Audit.
class PenahanErrorSoal extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error('[TryOut] Soal ini bikin error waktu dirender:', this.props.soalId, error, info);
  }
  componentDidUpdate(prevProps) {
    // Reset begitu pindah ke soal lain, biar soal berikutnya dapat
    // kesempatan render dari nol (bukan ke-stuck di state error selamanya).
    if (prevProps.soalId !== this.props.soalId && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, textAlign: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, color: '#b91c1c', fontSize: 13 }}>
          ⚠️ Soal ini gagal ditampilkan (kemungkinan ada masalah data). Ini SUDAH TERCATAT --
          silakan lanjut ke soal berikutnya, admin akan mengecek soal ini nanti.
        </div>
      );
    }
    return this.props.children;
  }
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

  // 🔥 BARU: layar "Siapkan Kamera" -- state & videoRef-nya didefinisikan
  // di sini, tapi fungsi lanjutSetelahCekKamera() ditaruh SETELAH
  // mulaiTryOut() didefinisikan (lihat di bawah), biar gak kena error
  // "dipakai sebelum didefinisikan".
  const videoPrepRef = React.useRef(null);
  const streamPrepRef = React.useRef(null);
  const [statusKameraPrep, setStatusKameraPrep] = useState('memuat'); // 'memuat' | 'aktif' | 'ditolak'
  const [errorKameraPrep, setErrorKameraPrep] = useState(null); // nama error asli dari browser
  // 🔥 BARU: counter percobaan -- setiap admin/siswa klik "Coba Lagi",
  // angka ini naik, effect di bawah otomatis jalan ulang (minta izin
  // kamera dari nol lagi). Ini buat kasus siswa TADINYA klik "Block"
  // gak sengaja, terus dia benerin izinnya lewat setting browser --
  // tanpa tombol ini, satu-satunya cara ngulang adalah reload manual.
  const [percobaanKeKamera, setPercobaanKeKamera] = useState(0);

  useEffect(() => {
    if (tahap !== 'cek-kamera') return;
    let batal = false;
    setStatusKameraPrep('memuat');
    setErrorKameraPrep(null);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (batal) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamPrepRef.current = stream;
        if (videoPrepRef.current) videoPrepRef.current.srcObject = stream;
        setStatusKameraPrep('aktif');
      })
      .catch((err) => {
        console.error('Kamera ditolak/gagal pas persiapan:', err);
        setStatusKameraPrep('ditolak');
        setErrorKameraPrep(err?.name || 'Unknown');
      });
    return () => {
      batal = true;
      // Stream persiapan ini SENGAJA dimatikan begitu keluar dari
      // layar ini -- useDeteksiKecuranganTryOut.js bakal minta izin
      // kamera lagi dari awal pas tahap 'mengerjakan', biar 1 sumber
      // aja yang pegang stream aktif (menghindari 2 stream nyala
      // bersamaan yang bisa bikin browser bingung).
      streamPrepRef.current?.getTracks().forEach((t) => t.stop());
      streamPrepRef.current = null;
    };
  }, [tahap, percobaanKeKamera]);

  // ---------------- MUAT PAKET + CEK SESI YANG SUDAH ADA ----------------
  // 🔥 BARU: dulu ini nyaris inline di dalam useEffect doang -- kalau
  // gagal (jaringan lambat waktu pertama buka halaman), siswa cuma
  // dikasih pesan "Coba muat ulang halaman" (dead-end, harus refresh
  // manual browser). Sekarang dibungkus jadi fungsi yang bisa DIPANGGIL
  // ULANG dari tombol, plus dicoba otomatis 2x sebelum nyerah.
  const muatPaketDanSesi = useCallback(async (percobaanKe = 1) => {
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
        // Cek jadwal buka/deadline SEBELUM kasih tahap 'mulai'. Jaga-
        // jaga kalau siswa buka link try out langsung (bukan lewat
        // daftar yang udah nge-filter duluan).
        const sekarang = new Date();
        const belumDibuka = dataPaket.waktuBuka && sekarang < new Date(dataPaket.waktuBuka);
        const sudahLewatDeadline = dataPaket.waktuTutup && sekarang > new Date(dataPaket.waktuTutup);

        if (sudahLewatDeadline) {
          // "Izin Ulang Khusus" -- admin bisa kasih 1 siswa izin buat
          // ngerjain LAGI walau deadline PAKET-nya udah lewat, TANPA
          // harus buka deadline itu buat semua orang.
          const snapIzin = await getDoc(doc(db, 'tryout_izin_ulang', `${paketId}_${studentId}`));
          const izinMasihBerlaku = snapIzin.exists() && sekarang < new Date(snapIzin.data().waktuBerlakuSampai);
          if (!izinMasihBerlaku) {
            setTahap('lewat-deadline');
            return;
          }
        } else if (belumDibuka) {
          setTahap('belum-dibuka');
          return;
        }
        setTahap('mulai');
      }
    } catch (e) {
      console.error(`Gagal memuat try out (percobaan ke-${percobaanKe}):`, e);
      if (percobaanKe < 2) {
        setTimeout(() => muatPaketDanSesi(percobaanKe + 1), 1500);
        return;
      }
      setTahap('gagal');
    }
  }, [paketId, studentId]);

  useEffect(() => {
    muatPaketDanSesi();
  }, [paketId, studentId]);

  // Daftar soal yang SEDANG BOLEH dikerjakan -- kalau mode per-subtes,
  // cuma soal di subtes aktif (soal di subtes lain/sebelumnya TIDAK
  // ditampilkan lagi -- sesuai aturan "gak bisa balik").
  const daftarSoalAktif = useMemo(() => {
    if (!paket) return [];
    let hasil;
    if (paket.modeTimer === 'per-subtes') {
      const subtesIni = paket.subtes?.[subtesAktifIndex];
      if (!subtesIni) return [];
      const idSet = new Set(subtesIni.soalIds);
      hasil = paket.daftarSoal.filter((s) => idSet.has(s.id));
    } else {
      hasil = paket.daftarSoal || [];
    }

    // 🔥 BARU: acak urutan -- beda siswa beda urutan nomor (anti-nyontek
    // liat jawaban nomor sekian dari teman sebelah), TAPI konsisten
    // buat siswa yang sama (gak acak ulang tiap reload halaman, biar
    // gak bingung nomor loncat-loncat pas lagi ngerjain). `garam`
    // dibedain per subtes, biar urutan tiap subtes gak "ngikutin pola"
    // yang sama persis satu sama lain buat siswa yang sama.
    if (paket.soalAcak && studentId) {
      hasil = acakSoalPerSiswa(hasil, studentId, paketId, String(subtesAktifIndex));
    }
    return hasil;
  }, [paket, subtesAktifIndex, studentId, paketId]);

  const soalAktif = daftarSoalAktif[indexSoalAktif];

  // 🔥 BARU (BUG SERIUS DITEMUKAN): sebelumnya kalau updateDoc gagal
  // (mis. koneksi lemot/padat -- WAJAR kejadian pas banyak siswa
  // ngerjain try out BARENGAN), errornya cuma di-log ke console
  // browser (gak keliatan siswa sama sekali). Kalau abis itu siswa
  // reload halaman, TryOutView narik ulang jawaban dari Firestore --
  // yang ternyata KOSONG karena gagal kesimpen -- dan siswa keliatan
  // "gak jawab apa-apa" padahal dia BENERAN udah jawab. Sekarang: 1x
  // dicoba ulang otomatis, dan kalau tetap gagal, muncul PERINGATAN
  // JELAS di layar (bukan diam-diam) -- siswa jadi TAHU harus cek
  // koneksi & gak boleh reload sampai itu ilang.
  const [gagalSimpanProgres, setGagalSimpanProgres] = useState(false);

  const simpanProgres = useCallback(async (jawabanBaru, subtesIndexBaru, waktuSubtesBaru, sudahDicoba = false) => {
    if (!sesiId) return;
    try {
      await updateDoc(doc(db, 'tryout_sesi', sesiId), {
        jawaban: jawabanBaru,
        subtesAktifIndex: subtesIndexBaru,
        waktuMulaiSubtesMs: waktuSubtesBaru,
        updatedAt: serverTimestamp(),
      });
      setGagalSimpanProgres(false);
    } catch (e) {
      console.error('Gagal menyimpan progres try out:', e);
      if (!sudahDicoba) {
        // Coba sekali lagi setelah jeda singkat -- banyak kegagalan
        // jaringan itu cuma sesaat (macet 1-2 detik), bukan putus total.
        setTimeout(() => simpanProgres(jawabanBaru, subtesIndexBaru, waktuSubtesBaru, true), 1500);
      } else {
        setGagalSimpanProgres(true);
      }
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

  const lanjutSetelahCekKamera = useCallback(() => {
    streamPrepRef.current?.getTracks().forEach((t) => t.stop());
    mulaiTryOut();
  }, [mulaiTryOut]);

  // ---------------- ANTI-CHEAT ----------------
  const {
    pelanggaran, showPeringatan, tutupPeringatan, statusKamera, jumlahFotoTersimpan, videoRef,
  } = useDeteksiKecuranganTryOut({
    aktif: tahap === 'mengerjakan',
    wajibKamera: !!paket?.wajibKamera,
    onFotoTersimpan: (url) => setFotoPengawasan((prev) => [...prev, url]),
  });

  // ---------------- SUBMIT / SELESAIKAN ----------------
  // 🔥 BARU (BUG SERIUS DITEMUKAN): sebelumnya kalau penyimpanan HASIL
  // FINAL gagal (bukan cuma jawaban per-soal, tapi status:'selesai' +
  // skor + XP-nya), errornya cuma di-log ke console -- SISTEM TETAP
  // NAMPILIN "Selesai!" ke siswa PADAHAL DATANYA GAK PERNAH BENERAN
  // KESIMPEN. Siswa ngerasa udah kelar, tapi di database tryout_sesi-
  // nya masih 'berjalan'/kosong -- persis kejadian yang bikin siswa
  // komplain "aku udah jawab kok hasilnya 0%". Sekarang: dicoba
  // beberapa kali, dan kalau BENERAN gagal terus, siswa DIKASIH TAU
  // JELAS + tombol coba lagi -- BUKAN diam-diam dianggap selesai.
  const [gagalKirimAkhir, setGagalKirimAkhir] = useState(false);
  const [sedangMengirimAkhir, setSedangMengirimAkhir] = useState(false);

  const selesaikanTryOut = useCallback(async (percobaanKe = 1) => {
    if (!paket) return;
    setSedangMengirimAkhir(true);
    setGagalKirimAkhir(false);
    const { totalSkor, totalSkorPersen } = hitungTotalSkor(paket.daftarSoal, jawaban);
    const xpMentah = Math.round(totalSkor * XP_PER_SOAL);
    const { xpFinal } = terapkanPotonganXP(xpMentah, pelanggaran);

    try {
      // Penyimpanan yang BENERAN kritis (jawaban + skor final) --
      // ini yang WAJIB berhasil sebelum siswa dikasih tau "selesai".
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

      // Nambah XP -- kalau ini gagal, gak apa-apa dilanjut (bisa
      // dikoreksi belakangan lewat "Hitung Ulang" di admin), karena
      // data JAWABAN & SKOR-nya sendiri udah pasti aman tersimpan
      // (baris di atas udah berhasil kalau sampai sini).
      if (studentId) {
        const progRef = doc(db, 'siswa_progress', studentId);
        const snap = await getDoc(progRef);
        const existing = snap.exists() ? snap.data() : {};
        const { xpMingguIni, xpMingguIniKunci } = tambahXpMingguan(existing.xpMingguIni, existing.xpMingguIniKunci, xpFinal);
        await updateDoc(progRef, {
          xp: (existing.xp || 0) + xpFinal, xpMingguIni, xpMingguIniKunci, updatedAt: serverTimestamp(),
        }).catch(async () => {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(progRef, { xp: xpFinal, xpMingguIni, xpMingguIniKunci, updatedAt: serverTimestamp() }, { merge: true });
        });
      }

      setHasilAkhir({ xpMentah, xpFinal, totalSkorPersen, pelanggaran });
      setTahap('selesai');
    } catch (e) {
      console.error(`Gagal menyimpan hasil try out (percobaan ke-${percobaanKe}):`, e);
      if (percobaanKe < 3) {
        // Coba lagi otomatis, jeda makin lama tiap gagal (1.5s, 3s).
        setTimeout(() => selesaikanTryOut(percobaanKe + 1), percobaanKe * 1500);
        return;
      }
      // 🔒 Udah dicoba 3x tetap gagal -- JANGAN klaim selesai. Kasih
      // tau siswa jelas + tombol coba lagi manual, biar dia gak
      // ninggalin halaman ini dalam keadaan salah kira udah kelar.
      setGagalKirimAkhir(true);
    }
    setSedangMengirimAkhir(false);
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
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Kalau kamu merasa ini keliru, minta admin/gurumu buat cek ulang.</div>
        <button onClick={() => navigate('/siswa/tryout')} style={{ ...st.tombolSekunder, marginTop: 10 }}>Kembali</button>
      </div>
    );
  }
  if (tahap === 'gagal') {
    return (
      <div style={{ ...st.pusat, flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 40 }}>📡</div>
        <div style={{ fontWeight: 700, color: '#1e293b' }}>Gagal memuat try out</div>
        <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Kemungkinan koneksi internetmu lagi lambat/putus.</div>
        <button onClick={() => { setTahap('memuat'); muatPaketDanSesi(); }} style={{ ...st.tombolUtama, width: 'auto', padding: '10px 24px' }}>
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

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
        <button
          onClick={() => paket.wajibKamera ? setTahap('cek-kamera') : mulaiTryOut()}
          style={st.tombolUtama}
        >
          Mulai Try Out
        </button>
      </div>
    );
  }

  // 🔥 BARU: layar "Siapkan Kamera" -- muncul dulu SEBELUM try out
  // beneran mulai (timer belum jalan sama sekali di sini), khusus
  // buat paket yang wajibKamera. Siswa WAJIB lihat preview wajahnya
  // dulu sebelum lanjut, biar gak langsung ke-catat "kamera tidak
  // aktif" gara-gara belum sempat klik izinkan di browser.
  if (tahap === 'cek-kamera') {
    return (
      <div style={{ maxWidth: 420, margin: '40px auto', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Siapkan Kameramu</h1>
        <p style={{ color: '#6b7280', fontSize: 12.5, margin: '8px 0 16px' }}>
          Try out ini WAJIB kamera aktif selama pengerjaan -- gak bisa dimulai tanpa itu. Pastikan wajahmu kelihatan jelas di preview di bawah.
        </p>

        <div style={{ width: '100%', aspectRatio: '4/3', background: '#1e293b', borderRadius: 14, overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
          <video ref={videoPrepRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          {statusKameraPrep === 'memuat' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12.5 }}>
              Menunggu izin kamera dari browser...
            </div>
          )}
          {statusKameraPrep === 'ditolak' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, padding: 16, textAlign: 'center', gap: 4 }}>
              <span style={{ fontSize: 22 }}>🚫</span>
              <span style={{ fontWeight: 700 }}>Kamera belum diizinkan</span>
            </div>
          )}
        </div>

        {statusKameraPrep === 'aktif' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#16a34a', marginBottom: 14 }}>
            <ShieldAlert size={14} /> Kamera aktif, kamu siap mulai.
          </div>
        )}

        {/* 🔥 BARU: kalau kamera WAJIB (soal ini), TIDAK ADA jalan
            pintas buat "lanjut tanpa kamera" -- try out beneran gak
            bisa dimulai sampai kameranya nyala. Yang ada cuma tombol
            resmi buat COBA LAGI (buat kasus siswa gak sengaja klik
            "Block", atau baru aja benerin izinnya lewat setting
            browser). */}
        {statusKameraPrep === 'ditolak' && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 11.5, color: '#92400e', textAlign: 'left' }}>
            <b>Cara mengizinkan kamera:</b>
            <ol style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Klik ikon 🔒 / kamera di pojok kiri address bar browser</li>
              <li>Pilih "Izinkan" (Allow) untuk kamera</li>
              <li>Klik tombol "Coba Izinkan Lagi" di bawah ini</li>
            </ol>
          </div>
        )}

        <button onClick={lanjutSetelahCekKamera} disabled={statusKameraPrep !== 'aktif'} style={{ ...st.tombolUtama, opacity: statusKameraPrep === 'aktif' ? 1 : 0.5 }}>
          Saya Siap, Mulai Try Out
        </button>

        {statusKameraPrep === 'ditolak' && (
          <button
            onClick={() => setPercobaanKeKamera((n) => n + 1)}
            style={{ ...st.tombolSekunder, marginTop: 8, width: '100%', color: '#7c3aed', borderColor: '#c4b5fd' }}
          >
            🔄 Coba Izinkan Lagi
          </button>
        )}
      </div>
    );
  }

  if (tahap === 'selesai') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
        <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtn}><ArrowLeft size={16} /> Kembali ke Dashboard</button>

        <div style={{ marginBottom: 20 }}>
          <LencanaPencapaian
            tipe="skor"
            nilai={hasilAkhir?.totalSkorPersen}
            keterangan={paket.judul}
            xp={hasilAkhir?.xpFinal}
          />
          <p style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', marginTop: 10 }}>📸 Screenshot lencana ini buat status kamu!</p>
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
          const belumDijawab = soalBelumDijawab(s, jawaban[s.id]);
          return (
            <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, color: skor >= 0.99 ? '#16a34a' : skor > 0 ? '#d97706' : '#dc2626', fontWeight: 700, marginBottom: 6 }}>
                Soal {i + 1} -- skor {Math.round(skor * 100)}%{belumDijawab ? ' (Tidak dijawab)' : ''}
              </div>
              <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10 }}>{s.soal || s.teks_soal}</div>
              <PenahanErrorSoal soalId={s.id}>
                <RendererSoal soal={s} jawabanTerpilih={jawaban[s.id]} modeTinjau />
              </PenahanErrorSoal>
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

      {/* 🔥 BARU: peringatan JELAS kalau progres gagal kesimpen -- jangan
          reload/tutup app sampai ini ilang, biar jawaban gak "kelewat" */}
      {gagalSimpanProgres && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#b91c1c', fontWeight: 700 }}>
          ⚠️ Jawaban terakhir belum berhasil tersimpan -- cek koneksi internetmu. JANGAN tutup/reload halaman ini dulu.
        </div>
      )}

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
        <PenahanErrorSoal soalId={soalAktif.id}>
          <RendererSoal
            soal={soalAktif}
            jawabanTerpilih={jawaban[soalAktif.id]}
            onChange={(val) => ubahJawaban(soalAktif.id, val)}
          />
        </PenahanErrorSoal>
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
          <button onClick={() => selesaikanTryOut()} disabled={sedangMengirimAkhir} style={{ ...st.tombolUtama, flex: 1, background: '#16a34a', opacity: sedangMengirimAkhir ? 0.6 : 1 }}>
            {sedangMengirimAkhir ? 'Mengirim...' : (
              <>
                <CheckCircle2 size={16} /> {paket.modeTimer === 'per-subtes' && subtesAktifIndex < paket.subtes.length - 1 ? 'Selesai Subtes Ini' : 'Kumpulkan Try Out'}
              </>
            )}
          </button>
        )}
      </div>

      {/* 🔥 BARU: layar gagal kirim -- muncul TIMPA semua kalau
          penyimpanan hasil final beneran gagal terus setelah 3x
          dicoba. Siswa TIDAK dianggap selesai, jawabannya tetap aman
          di memori, tinggal klik coba lagi begitu koneksi membaik. */}
      {gagalKirimAkhir && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
            <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 6 }}>Gagal Mengirim Hasil</div>
            <div style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 14 }}>
              Jawabanmu AMAN, belum hilang -- cuma belum berhasil terkirim ke server. Cek koneksi internetmu, lalu coba lagi.
            </div>
            <button onClick={() => selesaikanTryOut()} disabled={sedangMengirimAkhir} style={st.tombolUtama}>
              {sedangMengirimAkhir ? 'Mengirim...' : '🔄 Coba Kirim Lagi'}
            </button>
          </div>
        </div>
      )}

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