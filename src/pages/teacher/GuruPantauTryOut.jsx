/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PANTAU TRY OUT — VERSI TENTOR (diminta owner 2026-10)
 *  Route: /guru/tryout-monitor/:paketId
 *
 *  Alur: admin menghubungkan paket try out ke tentor (halaman Terbitkan
 *  Try Out) → tentor melihat banner di dashboard guru → masuk ke sini:
 *   • memantau peserta (jumlah, selesai, rerata, esai menunggu),
 *   • melihat soal & jawaban tiap siswa (tampilan sama persis dgn admin),
 *   • MEMBERI PENILAIAN ESAI 0-100 → total skor & XP siswa terhitung
 *     ulang (termasuk potongan XP anti-curang) — identik dengan
 *     HasilTryOutAdminPage, hanya aktornya guru (tercatat di audit log).
 *
 *  Akses: hanya tentor yang terhubung (paket.tentorId === guru login).
 *  Catatan: pengecekan di sisi klien; saat aturan Firestore
 *  (firebase/rules) aktif, tambahkan aturan untuk role guru.
 * ═══════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { buatKodePaket } from '../../utils/kodePaket.js';
import { doc, getDoc, getDocs, query, collection, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { hitungTotalSkor, skorSatuSoal, soalBelumDijawab, isSoalEsai, poinEsai, pilihBarisBenarSalah, SKALA_NILAI_ESAI, pilihSoalDinilai } from '../../utils/skorSoalTryOut';
import { cariIndexBenar, kunciBarisBenarSalah } from '../../utils/skoringSoalKompleks';
import { terapkanPotonganXP } from '../../utils/potonganXPTryOut';
import { hitungSkalaSesi } from '../../utils/hitungSkalaSesi';
import { tambahXpMingguan } from '../../utils/mingguIni';
import { catatAudit, KATEGORI } from '../../utils/auditLog';
import { bacaIdentitasGuru, guruCocokDenganTentor } from '../../utils/identitasGuru';
import DialogCetakNaskah from '../../components/DialogCetakNaskah';
import { teksKunciSoal as teksKunci } from '../../utils/teksKunciSoal';
import { kebijakanGagalMuat } from '../../utils/keputusanMuat';
import {
  normalisasiKunciBaru,
  terapkanKoreksiPadaDaftarSoal,
  hitungUlangSatuSesi,
  eksekusiKoreksiDanHitungUlang,
} from '../../utils/koreksiKunciTryOut';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';
import LihatGambar from '../../components/LihatGambar';
import TeksSoalBergambar from '../../components/TeksSoalBergambar';
import RendererPgSederhana from '../student/tryout/RendererPgSederhana';
import RendererPgKompleks from '../student/tryout/RendererPgKompleks';
import RendererBenarSalah from '../student/tryout/RendererBenarSalah';
import RendererIsianSingkat from '../student/tryout/RendererIsianSingkat';
import RendererEsai from '../student/tryout/RendererEsai';
import SidebarGuru from '../../components/SidebarGuru';

/** Renderer tinjau — pola persis RendererSoalAdmin di HasilTryOutAdminPage. */
function RendererSoalGuru(props) {
  const tipe = props.soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks {...props} />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah {...props} />;
  if (tipe === 'isian_singkat' || tipe === 'numerik') return <RendererIsianSingkat {...props} />;
  if (tipe === 'esai' || tipe === 'uraian') return <RendererEsai {...props} />;
  return <RendererPgSederhana {...props} />;
}

// 🔥 BARU (mode tinjau paket): kunci disuapkan SEOLAH-OLAH sebagai jawaban
// siswa, supaya renderer menyorot opsi yang benar (hijau ✔️) persis seperti
// yang dilihat siswa setelah menjawab benar. Tentor belajar dari tampilan
// yang sama dengan yang akan dilihat siswa, bukan dari tabel kunci yang
// abstrak. Untuk esai tidak ada jawaban otomatis, jadi null.
function kunciSebagaiJawaban(soal) {
  const tipe = soal?.tipe || 'pg_sederhana';
  if (tipe === 'pg_sederhana') {
    const idx = cariIndexBenar(soal);
    return idx >= 0 ? idx : null;
  }
  if (tipe === 'pg_kompleks') {
    const mentah = soal?.kunciJawaban;
    if (Array.isArray(mentah)) return mentah.map((h) => String(h).toUpperCase());
    if (typeof mentah === 'string' && mentah.trim()) {
      return mentah.replace(/[\s,]+/g, '').split('').map((h) => h.toUpperCase());
    }
    return [];
  }
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    return pilihBarisBenarSalah(soal).map((b) => kunciBarisBenarSalah(b));
  }
  if (tipe === 'isian_singkat' || tipe === 'numerik') return String(soal?.kunciJawaban ?? '');
  return null;
}

export default function GuruPantauTryOut() {
  const { paketId } = useParams();
  const [paket, setPaket] = useState(null);
  // 🔥 BARU (2026-10-12, permintaan owner): tentor yang paketnya sudah
  // terbit perlu MEMBACA ULANG soal+kuncinya untuk bahan belajar/mengajar
  // ("guru mau klik lagi soalnya"). Sebelumnya dialog naskah hanya ada di
  // sisi admin; tentor hanya bisa memantau skor. Dialog ini baca-saja.
  const [bukaNaskah, setBukaNaskah] = useState(false);
  const [sesiList, setSesiList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [inputEsai, setInputEsai] = useState({});
  const [simpanEsaiId, setSimpanEsaiId] = useState('');
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState({ tipe: null, teks: '' });
  const [guru, setGuru] = useState({ guruId: '', guruNama: 'Guru' });

  // 🔥 FIX TAMPILAN (2026-10-05, laporan owner: "gak kelihatan"): halaman ini
  // merender <SidebarGuru /> sendiri, dan sidebar itu position:fixed lebar
  // 260px -- jadi ia TIDAK ikut mengalir di layout flex. Tanpa kompensasi
  // margin, <main> melebar sepenuh viewport dan kotak maxWidth 980 yang
  // di-center jatuh SEPARUHNYA DI BAWAH sidebar: judul, kartu "Peserta", dan
  // tombol kembali tertutup. Pola kompensasinya disalin persis dari halaman
  // lain yang juga merender sidebar sendiri (TeacherInputGrade.jsx:364 dan
  // TeacherGradeManager.jsx:93) -- marginLeft 260px + width calc di desktop,
  // nol di mobile.
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // 🔥 BARU (permintaan owner 2026-10-05: "bisa gak guru klik gambarnya biar
  // jelas"): URL gambar yang sedang diperbesar di lightbox, atau null.
  // Thumbnail soal hanya 200px dan foto jawaban esai 260px -- cukup untuk
  // mengenali, tidak untuk membaca label diagram atau tulisan tangan siswa.
  const [gambarDibuka, setGambarDibuka] = useState(null);
  // 🔥 BARU (2026-10-06, permintaan owner): sebelumnya soal & pembahasan
  // hanya bisa dilihat LEWAT sesi siswa (`detail`), jadi tentor harus
  // MENUNGGU ada siswa yang mengerjakan dulu baru bisa membaca soalnya --
  // padahal justru sebelum itulah tentor butuh mempelajarinya untuk
  // mengajar. Tab 'tinjau' menampilkan paket langsung dari bank soal.
  const [tab, setTab] = useState('peserta');
  // State untuk fitur Koreksi Kunci Jawaban oleh Tentor
  const [inputKoreksi, setInputKoreksi] = useState({});
  const [sedangKoreksiIndex, setSedangKoreksiIndex] = useState(null);
  const [sedangHitungUlangSemua, setSedangHitungUlangSemua] = useState(false);
  const [modalHasilKoreksi, setModalHasilKoreksi] = useState(null);
  const [filterKoreksi, setFilterKoreksi] = useState('semua');
  const [soalFokusId, setSoalFokusId] = useState(null);
  useEffect(() => {
    const saatResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', saatResize);
    return () => window.removeEventListener('resize', saatResize);
  }, []);

  const muatSesi = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'tryout_sesi'), where('paketId', '==', paketId)));
      setSesiList(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) =>
        String(b.selesaiPada || b.updatedAt || '').localeCompare(String(a.selesaiPada || a.updatedAt || ''))));
    } catch (e) {
      // 🔥 LAPIS 0 (audit kuota 2026-10-06): gagal baca TIDAK BOLEH tampil
      // sebagai "belum ada peserta" -- itu kebohongan yang membuat orang
      // menyimpulkan datanya hilang. Daftar lama dipertahankan (tidak di-reset
      // di sini), dan pesan jujur ditampilkan.
      setPesan({ tipe: 'err', teks: kebijakanGagalMuat(true, e?.message || '').pesan });
    }
  }, [paketId]);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      try {
        const idt = bacaIdentitasGuru();
        setGuru({ guruId: idt.semuaId[0] || '', guruNama: idt.guruNama });
        const snap = await getDoc(doc(db, 'tryout_paket', paketId));
        if (batal) return;
        if (!snap.exists()) { setPesan({ tipe: 'err', teks: 'Paket tidak ditemukan.' }); setMemuat(false); return; }
        const d = snap.data();
        // FIX 2026-10: terima docId MAUPUN kode GURU-0xx (admin menyimpan
        // docId; kode lama cuma menerima guruId → guru sah ditolak masuk).
        if (!guruCocokDenganTentor(d.tentorId)) {
          setPesan({ tipe: 'err', teks: 'Try out ini tidak terhubung ke akun Anda. Hubungi admin bila ini keliru.' });
          setMemuat(false); return;
        }
        setPaket({ id: snap.id, ...d });
        // 21 Okt: backfill kodePaket untuk paket lama (dibuat sebelum stempel
        // kode saat persetujuan) supaya kode soal TERSEMBUNG: kop naskah,
        // chip per butir, layar siswa, dan arsip memakai sumber yang sama.
        if (!String(d.kodePaket || '').trim()) {
          const mjen = /(SD|SMP|SMA|SMK)/i.exec(String(d.targetKelas || '') + ' ' + String(d.judul || ''));
          const tgl = d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date());
          const kode = buatKodePaket({
            jenjang: d.jenjang || d.jenjangTemplate || (mjen ? mjen[1] : ''),
            jenisUjian: d.jenisUjian || d.jenis || 'Reguler',
            tanggal: Number.isNaN(tgl?.getTime?.()) ? new Date() : tgl,
          });
          try {
            await updateDoc(doc(db, 'tryout_paket', snap.id), { kodePaket: kode });
            setPaket({ id: snap.id, ...d, kodePaket: kode });
          } catch { /* tulis gagal: tampilan tetap jatuh ke kode arsip stabil */ }
        }
        await muatSesi();
      } catch (e) { setPesan({ tipe: 'err', teks: e.message }); }
      if (!batal) setMemuat(false);
    })();
    return () => { batal = true; };
  }, [paketId, muatSesi]);

  /** Simpan nilai esai — SEMANTIK IDENTIK dengan simpanNilaiEsai admin
   *  (entri {poin, penilai, pada}, XP mentah×10 + potongan kecurangan,
   *  xp mingguan, field xp huruf kecil di siswa_progress). */
  async function simpanNilaiEsai(siswa, soal, poinInput) {
    if (!paket || !detail) return;
    const poin = Number(poinInput);
    if (!Number.isFinite(poin) || poin < 0 || poin > SKALA_NILAI_ESAI) {
      alert(`Nilai harus angka 0-${SKALA_NILAI_ESAI}.`);
      return;
    }
    setSimpanEsaiId(String(soal.id));
    setPesan({ tipe: null, teks: '' });
    const entri = { poin, penilai: guru.guruNama || 'guru', pada: new Date().toISOString() };
    const nilaiEsaiBaru = { ...(detail.nilaiEsai || {}), [soal.id]: entri };
    try {
      const { totalSkor, totalSkorPersen } = hitungTotalSkor(pilihSoalDinilai(paket.daftarSoal || [], detail), detail.jawaban || {}, nilaiEsaiBaru);
      const xpMentahBaru = Math.round(totalSkor * 10);
      const { xpFinal: xpFinalBaru } = terapkanPotonganXP(xpMentahBaru, detail.pelanggaran || []);
      const selisihXp = xpFinalBaru - (detail.xpFinal || 0);

      await updateDoc(doc(db, 'tryout_sesi', detail.id), {
        [`nilaiEsai.${soal.id}`]: entri,
        totalSkor, totalSkorPersen,
        xpMentah: xpMentahBaru, xpFinal: xpFinalBaru,
        esaiDinilaiPada: serverTimestamp(),
        dinilaiOlehGuru: guru.guruId || 'guru',
      });

      if (selisihXp !== 0 && detail.studentId) {
        const progRef = doc(db, 'siswa_progress', detail.studentId);
        const snapProg = await getDoc(progRef);
        const existing = snapProg.exists() ? snapProg.data() : {};
        const { xpMingguIni, xpMingguIniKunci } = tambahXpMingguan(existing.xpMingguIni, existing.xpMingguIniKunci, selisihXp);
        await updateDoc(progRef, {
          xp: Math.max(0, (existing.xp || 0) + selisihXp),
          xpMingguIni: Math.max(0, xpMingguIni),
          xpMingguIniKunci,
          updatedAt: serverTimestamp(),
        });
      }

      setDetail({ ...detail, nilaiEsai: nilaiEsaiBaru, totalSkor, totalSkorPersen, xpFinal: xpFinalBaru });
      setSesiList((lama) => lama.map((s) => (s.id === detail.id ? { ...s, nilaiEsai: nilaiEsaiBaru, totalSkor, totalSkorPersen, xpFinal: xpFinalBaru } : s)));
      setInputEsai((m) => { const c = { ...m }; delete c[String(soal.id)]; return c; });
      setPesan({ tipe: 'ok', teks: `Nilai esai tersimpan: ${poin}/${SKALA_NILAI_ESAI}. Total ${siswa.nama || siswa.studentId} sekarang akurasi ${totalSkorPersen}% (${xpFinalBaru} XP).` });
      catatAudit('tryout.esai.nilai.guru', {
        kategori: KATEGORI.LAINNYA,
        target: `Esai ${soal.id} • ${siswa.nama || siswa.studentId} • ${paket.judul}`,
        detail: { poin, paketId, guruId: guru.guruId, totalBaru: totalSkorPersen },
      });
    } catch (e) {
      setPesan({ tipe: 'err', teks: `Gagal menyimpan nilai: ${e.message}` });
    } finally { setSimpanEsaiId(''); }
  }

  /**
   * Eksekusi koreksi kunci satu butir soal oleh tentor dan hitung ulang skor semua siswa.
   */
  async function handleSimpanKoreksi(soalIndex, inputData) {
    if (!paket) return;
    const soal = (paket.daftarSoal || [])[soalIndex];
    if (!soal) return;

    const { kunciBaru, anulirBonus, catatan } = inputData || {};

    const konfirmasi = window.confirm(
      `Konfirmasi Perubahan Kunci Soal #${soalIndex + 1}:\n\n` +
      (anulirBonus
        ? `• Status: Dianulir / Diberi Bonus Penuh (Semua siswa yang mengikuti akan mendapat nilai benar 100%)\n`
        : `• Kunci Baru: ${kunciBaru}\n`) +
      (catatan ? `• Catatan Tentor: ${catatan}\n\n` : '\n') +
      `Sistem akan secara OTOMATIS menghitung ulang seluruh skor siswa, akurasi, dan XP dari sesi try out ini.\n\n` +
      `Lanjutkan simpan dan hitung ulang?`
    );
    if (!konfirmasi) return;

    setSedangKoreksiIndex(soalIndex);
    setPesan({ tipe: null, teks: '' });

    try {
      const daftarBaru = terapkanKoreksiPadaDaftarSoal(paket.daftarSoal || [], soalIndex, {
        kunciBaru,
        anulirBonus: !!anulirBonus,
        catatan,
        infoTentor: guru,
      });

      const res = await eksekusiKoreksiDanHitungUlang({
        db,
        paketId: paket.id,
        paket,
        daftarSoalBaru: daftarBaru,
        sesiList,
        soalIndex,
        infoTentor: guru,
        catatan,
        anulirBonus: !!anulirBonus,
        firestoreOps: { updateDoc, doc, getDoc, serverTimestamp },
        auditFn: (evt, data) => catatAudit(evt, { kategori: KATEGORI.LAINNYA, ...data }),
      });

      // Update state lokal paket
      setPaket((lama) => ({
        ...lama,
        daftarSoal: daftarBaru,
        terakhirDikoreksiPada: new Date().toISOString(),
        terakhirDikoreksiOleh: guru.guruNama,
      }));

      // Update state lokal sesiList secara reaktif
      setSesiList((lama) =>
        lama.map((s) => {
          const match = res.rincianPerubahan.find((r) => r.sesiId === s.id);
          if (match) {
            return {
              ...s,
              totalSkor: match.totalSkor,
              totalSkorPersen: match.totalSkorPersen,
              xpMentah: match.xpMentah,
              xpFinal: match.xpFinal,
              dikoreksiOlehTentor: guru.guruNama,
            };
          }
          return s;
        })
      );

      // Jika tentor sedang membuka detail jawaban seorang siswa, perbarui juga
      if (detail) {
        const match = res.rincianPerubahan.find((r) => r.sesiId === detail.id);
        if (match) {
          setDetail((lamaDetail) => ({
            ...lamaDetail,
            totalSkor: match.totalSkor,
            totalSkorPersen: match.totalSkorPersen,
            xpMentah: match.xpMentah,
            xpFinal: match.xpFinal,
          }));
        }
      }

      // Bersihkan input koreksi form soal ini
      setInputKoreksi((m) => {
        const c = { ...m };
        delete c[String(soal.id)];
        return c;
      });

      // Tampilkan modal hasil hitung ulang
      setModalHasilKoreksi(res);

      setPesan({
        tipe: 'ok',
        teks: `✅ Kunci Soal #${soalIndex + 1} berhasil diperbarui! Sebanyak ${res.totalSesiDiproses} sesi siswa telah dihitung ulang (${res.jumlahBerubah} siswa mengalami perubahan skor).`,
      });
    } catch (e) {
      console.error('Gagal koreksi kunci:', e);
      setPesan({ tipe: 'err', teks: `Gagal memperbarui kunci jawaban: ${e.message}` });
    } finally {
      setSedangKoreksiIndex(null);
    }
  }

  /**
   * Hitung ulang seluruh sesi yang sudah selesai terhadap daftarSoal aktif paket saat ini.
   */
  async function handleHitungUlangSemua() {
    if (!paket || sesiList.length === 0) return;
    const konfirmasi = window.confirm(
      `Hitung ulang seluruh ${sesiList.filter((s) => s.status === 'selesai').length} sesi peserta yang sudah selesai?\n\n` +
      `Ini akan mensinkronkan ulang seluruh skor, akurasi persen, dan XP siswa berdasarkan seluruh kunci jawaban terkini.`
    );
    if (!konfirmasi) return;

    setSedangHitungUlangSemua(true);
    setPesan({ tipe: null, teks: '' });

    try {
      const res = await eksekusiKoreksiDanHitungUlang({
        db,
        paketId: paket.id,
        paket,
        daftarSoalBaru: paket.daftarSoal || [],
        sesiList,
        soalIndex: 0,
        infoTentor: guru,
        catatan: 'Sinkronisasi menyeluruh seluruh sesi try out',
        anulirBonus: false,
        firestoreOps: { updateDoc, doc, getDoc, serverTimestamp },
        auditFn: (evt, data) => catatAudit(evt, { kategori: KATEGORI.LAINNYA, ...data }),
      });

      setSesiList((lama) =>
        lama.map((s) => {
          const match = res.rincianPerubahan.find((r) => r.sesiId === s.id);
          if (match) {
            return {
              ...s,
              totalSkor: match.totalSkor,
              totalSkorPersen: match.totalSkorPersen,
              xpMentah: match.xpMentah,
              xpFinal: match.xpFinal,
            };
          }
          return s;
        })
      );

      setModalHasilKoreksi(res);
      setPesan({
        tipe: 'ok',
        teks: `✅ Sinkronisasi tuntas! ${res.totalSesiDiproses} sesi siswa telah dihitung ulang (${res.jumlahBerubah} siswa mengalami pembaruan nilai).`,
      });
    } catch (e) {
      setPesan({ tipe: 'err', teks: `Gagal sinkronisasi sesi: ${e.message}` });
    } finally {
      setSedangHitungUlangSemua(false);
    }
  }

  const daftar = paket?.daftarSoal || [];
  const selesai = sesiList.filter((s) => s.status === 'selesai').length;
  const rerata = sesiList.length ? Math.round(sesiList.reduce((a, s) => a + (Number(s.totalSkorPersen) || 0), 0) / sesiList.length) : 0;
  const esaiBelumDinilai = sesiList.reduce((a, s) => a + daftar.filter((so) => isSoalEsai(so) && poinEsai(so, s.nilaiEsai) === null).length, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <SidebarGuru />
      <main style={{
        marginLeft: isMobile ? '0' : '216px',
        padding: isMobile ? '10px' : '20px',
        width: isMobile ? '100%' : 'calc(100% - 216px)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ width: '100%', maxWidth: 980, margin: '0 auto' }}>
        <Link to="/guru/dashboard" style={{ fontSize: 12, color: '#2563eb' }}>← Kembali ke Dashboard</Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: '8px 0 4px', fontSize: 18 }}>🎯 Pantau Try Out</h2>
          {paket && (
            <button
              type="button"
              onClick={() => setBukaNaskah(true)}
              style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#0e7490', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              📖 Lihat naskah soal & kunci
            </button>
          )}
        </div>
        {pesan.teks && <div style={{ margin: '8px 0', fontSize: 12, color: pesan.tipe === 'err' ? '#b91c1c' : '#15803d', background: pesan.tipe === 'err' ? '#fef2f2' : '#f0fdf4', border: '1px solid ' + (pesan.tipe === 'err' ? '#fecaca' : '#bbf7d0'), padding: '6px 10px', borderRadius: 8 }}>{pesan.teks}</div>}
        {memuat && <div style={{ fontSize: 12, color: '#6b7280' }}>Memuat...</div>}
        {paket && (
          <>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{paket.judul}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {paket.targetKelas} · {paket.targetKategori} · {paket.totalSoal || daftar.length} soal
                {paket.waktuTutup ? ` · ditutup ${new Date(paket.waktuTutup).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  ['Peserta', sesiList.length, '#2563eb'],
                  ['Selesai', selesai, '#16a34a'],
                  ['Rerata skor', rerata + '%', '#7c3aed'],
                  ['Esai menunggu penilaian', esaiBelumDinilai, esaiBelumDinilai > 0 ? '#d97706' : '#64748b'],
                ].map(([lbl, val, warna]) => (
                  <div key={lbl} style={{ padding: '8px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', minWidth: 110 }}>
                    <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: warna }}>{val}</div>
                  </div>
                ))}
                <button onClick={muatSesi} style={{ alignSelf: 'center', fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>🔄 Muat ulang</button>
              </div>
            </div>

            {/* 🔥 BARU: dua mode. "Peserta" = aliran lama (menunggu sesi
                siswa). "Tinjau" = baca paket LANGSUNG dari bank soal, tanpa
                menunggu siapa pun mengerjakan -- jawaban atas keluhan
                owner 2026-10-06. */}
            <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  ['peserta', `👥 Peserta & Penilaian (${sesiList.length})`],
                  ['tinjau', `📖 Tinjau Soal & Pembahasan (${daftar.length})`],
                  ['koreksi', `✏️ Koreksi Kunci & Hitung Ulang (${daftar.length})`],
                ].map(([k, lbl]) => (
                  <button
                    key={k}
                    onClick={() => { setTab(k); setSoalFokusId(null); }}
                    style={{
                      padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      border: tab === k ? '1.5px solid #3730a3' : '1px solid #d1d5db',
                      background: tab === k ? '#eef2ff' : 'white',
                      color: tab === k ? '#3730a3' : '#475569',
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              {tab === 'koreksi' && sesiList.filter((s) => s.status === 'selesai').length > 0 && (
                <button
                  type="button"
                  onClick={handleHitungUlangSemua}
                  disabled={sedangHitungUlangSemua}
                  style={{
                    padding: '7px 12px', borderRadius: 8, border: '1px solid #10b981',
                    background: '#ecfdf5', color: '#047857', fontSize: 11.5, fontWeight: 800,
                    cursor: 'pointer', opacity: sedangHitungUlangSemua ? 0.6 : 1,
                  }}
                >
                  {sedangHitungUlangSemua ? '🔄 Mensinkronkan...' : '🔄 Sinkronkan Seluruh Peserta Selesai'}
                </button>
              )}
            </div>

            {tab === 'peserta' && (<>
            {sesiList.length === 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                Belum ada peserta yang mengerjakan. Data muncul setelah siswa mulai/selesai; gunakan tombol Muat ulang.
                {' '}Ingin membaca soalnya sekarang untuk bahan mengajar?{' '}
                <button onClick={() => setTab('tinjau')} style={{ fontSize: 11.5, fontWeight: 800, color: '#3730a3', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                  Buka 📖 Tinjau Soal & Pembahasan
                </button>
              </div>
            )}
            {sesiList.map((s) => {
              const belumDinilai = daftar.filter((so) => isSoalEsai(so) && poinEsai(so, s.nilaiEsai) === null).length;
              // 🔥 2026-10-26: sistem penilaian baru konek ke sisi guru --
              // selain akurasi (%), tampilkan SKOR pada rentang resmi paket.
              const skala = s.status === 'selesai' ? hitungSkalaSesi(s, paket) : null;
              return (
                <div key={s.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.nama || s.studentId}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                      {s.kelasSekolah || ''} · {s.status === 'selesai' ? 'selesai' : (s.status || 'aktif')}
                      {s.status !== 'selesai' && s.progres?.total ? ` · mengerjakan ${s.progres.terjawab || 0}/${s.progres.total}` : ''} · {s.xpFinal || 0} XP
                    </div>
                  </div>
                  <span title="Akurasi jawaban" style={{ fontSize: 12, fontWeight: 800, color: Number(s.totalSkorPersen) >= 70 ? '#16a34a' : '#d97706' }}>akurasi {Math.round(Number(s.totalSkorPersen) || 0)}%</span>
                  {skala?.total != null && (
                    <span title={skala.label || 'Skor pada rentang resmi jenis ujian paket ini'} style={{ fontSize: 12, fontWeight: 800, color: '#3949AB', background: '#eef2ff', borderRadius: 999, padding: '2px 8px' }}>
                      skor {skala.total}
                    </span>
                  )}
                  {belumDinilai > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fef3c7', borderRadius: 999, padding: '2px 8px' }}>{belumDinilai} esai menunggu</span>}
                  <button onClick={() => { setDetail(s); setInputEsai({}); setPesan({ tipe: null, teks: '' }); }}
                          style={{ fontSize: 11.5, padding: '6px 12px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', fontWeight: 700, cursor: 'pointer' }}>
                    Lihat & Nilai
                  </button>
                </div>
              );
            })}

            {detail && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    👁️ Jawaban {detail.nama || detail.studentId} — akurasi {Math.round(Number(detail.totalSkorPersen) || 0)}% · {detail.xpFinal || 0} XP
                  </div>
                  <button onClick={() => setDetail(null)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Tutup</button>
                </div>
                {daftar.map((s, i) => {
                  const jwb = detail.jawaban?.[s.id];
                  const skor = skorSatuSoal(s, jwb);
                  const belumDijawab = soalBelumDijawab(s, jwb);
                  const esai = isSoalEsai(s);
                  const poinEsaiSiswa = esai ? poinEsai(s, detail.nilaiEsai) : null;
                  return (
                    <div key={s.id} style={{ background: 'white', border: '1px solid ' + (esai && poinEsaiSiswa === null ? '#fde68a' : '#e2e8f0'), borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>Soal {i + 1} · {String(s.tipe || '').replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: esai ? (poinEsaiSiswa !== null ? '#16a34a' : '#d97706') : (skor >= 0.99 ? '#16a34a' : skor > 0 ? '#d97706' : '#dc2626') }}>
                          {esai
                            ? (poinEsaiSiswa !== null ? `DINILAI ${poinEsaiSiswa}/${SKALA_NILAI_ESAI}` : 'ESAI BELUM DINILAI')
                            : (belumDijawab ? 'TIDAK DIJAWAB' : skor >= 0.99 ? 'BENAR' : skor > 0 ? `SEBAGIAN (${Math.round(skor * 100)}%)` : 'SALAH')}
                        </div>
                      </div>
                      {s.bacaan?.teks && (
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155' }}><RenderMath text={s.bacaan.teks} /></div>
                      )}
                      <TeksSoalBergambar
                        teks={s.soal || s.teks_soal}
                        gambarUrls={s.gambarUrls} gambarMeta={s.gambarMeta || null}
                        onKlikGambar={setGambarDibuka}
                        gayaTeks={{ marginBottom: 10 }}
                        gayaGambar={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, margin: '8px 0 10px' }}
                      />
                      {s.tabelSoal && <RenderTable table={s.tabelSoal} />}
                      <RendererSoalGuru soal={s} jawabanTerpilih={jwb} modeTinjau onKlikGambar={setGambarDibuka} />
                      {/* 🔥 BARU (permintaan owner 2026-10-05): "harusnya tentor
                          bisa melihat soal dan pembahasan lengkap untuk dibahas".
                          Sebelumnya berkas ini TIDAK menyebut `pembahasan` sama
                          sekali, padahal padanan adminnya
                          (HasilTryOutAdminPage.jsx:624) sudah menampilkannya --
                          jadi klaim "tampilan sama persis dgn admin" di commit
                          #106 tidak berlaku untuk pembahasan. Kotak pembahasan
                          disalin persis gaya admin (ungu, RenderMath) supaya
                          dua portal tidak punya dua bahasa visual. */}
                      <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 12, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <b>🔑 Kunci Sistem:</b> {teksKunci(s)}
                          {s.dikoreksiTentor && (
                            <span style={{ marginLeft: 8, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              ✅ Telah Dikoreksi Tentor ({s.koreksiTentor?.oleh})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTab('koreksi');
                            setSoalFokusId(s.id);
                            setTimeout(() => {
                              const el = document.getElementById(`soal-koreksi-${s.id}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 150);
                          }}
                          style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 6,
                            border: '1px solid #f59e0b', background: '#fffbeb', color: '#b45309',
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          ✏️ Kunci Keliru? Koreksi Butir Ini
                        </button>
                      </div>
                      {s.pembahasan && (
                        <div style={{ marginTop: 8, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                          <b>💡 Pembahasan:</b> <TeksSoalBergambar teks={s.pembahasan} gambarUrls={s.gambarUrls || []} gambarMeta={s.gambarMeta || null} region="pembahasan" />
                        </div>
                      )}
                      {esai && !belumDijawab && (
                        <div style={{ marginTop: 10, background: poinEsaiSiswa !== null ? '#f0fdf4' : '#fffbeb', border: '1px solid ' + (poinEsaiSiswa !== null ? '#bbf7d0' : '#fcd34d'), borderRadius: 10, padding: 12 }}>
                          {poinEsaiSiswa !== null ? (
                            <div style={{ fontSize: 12, color: '#15803d', marginBottom: 8 }}>
                              ✅ Sudah dinilai <b>{poinEsai(s, detail.nilaiEsai)}/{SKALA_NILAI_ESAI}</b> oleh {(detail.nilaiEsai || {})[s.id]?.penilai || 'admin'} — {(detail.nilaiEsai || {})[s.id]?.pada ? new Date((detail.nilaiEsai || {})[s.id].pada).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : ''}. Bisa dinilai ulang bila perlu.
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#92400e', marginBottom: 8 }}>
                              ✍️ Penilaian manual esai (skala 0-{SKALA_NILAI_ESAI})
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="number" min="0" max={SKALA_NILAI_ESAI}
                              value={inputEsai[String(s.id)] ?? (poinEsaiSiswa ?? '')}
                              onChange={(e) => setInputEsai((m) => ({ ...m, [String(s.id)]: e.target.value }))}
                              placeholder={`0-${SKALA_NILAI_ESAI}`}
                              style={{ width: 110, padding: '7px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12.5 }}
                            />
                            <button
                              onClick={() => simpanNilaiEsai(detail, s, inputEsai[String(s.id)] ?? poinEsaiSiswa ?? 0)}
                              disabled={simpanEsaiId === String(s.id)}
                              style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: simpanEsaiId === String(s.id) ? 0.6 : 1 }}
                            >
                              {simpanEsaiId === String(s.id) ? 'Menyimpan...' : '💾 Simpan Penilaian'}
                            </button>
                            <span style={{ fontSize: 10.5, color: '#6b7280' }}>Akurasi & XP siswa terhitung ulang otomatis (termasuk potongan anti-curang).</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </>)}

            {tab === 'tinjau' && (
              <div>
                <div style={{ fontSize: 12, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
                  📖 Mode tinjau: menampilkan SELURUH soal paket beserta kunci dan
                  pembahasan langsung dari bank soal, TANPA menunggu ada siswa yang
                  mengerjakan. Opsi benar disorot hijau seolah sudah dijawab, supaya
                  tentor bisa mempelajari alur soal sebelum mengajar.
                </div>
                {daftar.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    Paket ini tidak memuat daftar soal.
                  </div>
                )}
                {daftar.map((s, i) => {
                  const jwb = kunciSebagaiJawaban(s);
                  return (
                    <div key={s.id || i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>
                        Soal {i + 1} · {String(s.tipe || '').replace(/_/g, ' ')}
                      </div>
                      {s.bacaan?.teks && (
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155' }}><RenderMath text={s.bacaan.teks} /></div>
                      )}
                      <TeksSoalBergambar
                        teks={s.soal || s.teks_soal}
                        gambarUrls={s.gambarUrls} gambarMeta={s.gambarMeta || null}
                        onKlikGambar={setGambarDibuka}
                        gayaTeks={{ marginBottom: 10 }}
                        gayaGambar={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, margin: '8px 0 10px' }}
                      />
                      {s.tabelSoal && <RenderTable table={s.tabelSoal} />}
                      <RendererSoalGuru soal={s} jawabanTerpilih={jwb} modeTinjau onKlikGambar={setGambarDibuka} />
                      <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 12, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <b>🔑 Kunci Sistem:</b> {teksKunci(s)}
                          {s.dikoreksiTentor && (
                            <span style={{ marginLeft: 8, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              ✅ Telah Dikoreksi Tentor ({s.koreksiTentor?.oleh})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTab('koreksi');
                            setSoalFokusId(s.id);
                            setTimeout(() => {
                              const el = document.getElementById(`soal-koreksi-${s.id}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 150);
                          }}
                          style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 6,
                            border: '1px solid #f59e0b', background: '#fffbeb', color: '#b45309',
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          ✏️ Kunci Keliru? Koreksi Butir Ini
                        </button>
                      </div>
                      {s.pembahasan && (
                        <div style={{ marginTop: 8, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                          <b>💡 Pembahasan:</b> <TeksSoalBergambar teks={s.pembahasan} gambarUrls={s.gambarUrls || []} gambarMeta={s.gambarMeta || null} region="pembahasan" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'koreksi' && (
              <div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎯 Ruang Validasi & Koreksi Kunci Jawaban Tentor
                  </div>
                  <div style={{ fontSize: 11.5, color: '#047857', marginTop: 4, lineHeight: 1.5 }}>
                    Sebagai tentor terhubung, Anda dapat memvalidasi dan membetulkan kunci jawaban yang keliru dari bank soal atau AI pihak ketiga.
                    Saat Anda mengoreksi kunci dan mengklik simpan, sistem secara <b>OTOMATIS menghitung ulang seluruh skor siswa</b> yang sudah selesai
                    (menyesuaikan persentase akurasi, skor skala resmi ujian, serta saldo XP siswa) demi keadilan belajar.
                  </div>
                </div>

                {/* Filter Status Soal */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>Filter Butir:</span>
                  {[
                    ['semua', `Semua (${daftar.length})`],
                    ['belum', `🔍 Kunci Asli (${daftar.filter((s) => !s.dikoreksiTentor && !s.anulirBonus).length})`],
                    ['terkoreksi', `✅ Dikoreksi Tentor (${daftar.filter((s) => s.dikoreksiTentor && !s.anulirBonus).length})`],
                    ['bonus', `🎁 Dianulir/Bonus (${daftar.filter((s) => s.anulirBonus).length})`],
                  ].map(([fk, label]) => (
                    <button
                      key={fk}
                      type="button"
                      onClick={() => setFilterKoreksi(fk)}
                      style={{
                        padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: filterKoreksi === fk ? '1.5px solid #059669' : '1px solid #cbd5e1',
                        background: filterKoreksi === fk ? '#d1fae5' : 'white',
                        color: filterKoreksi === fk ? '#065f46' : '#64748b',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {daftar.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    Paket ini tidak memuat butir soal.
                  </div>
                )}

                {daftar
                  .map((s, i) => ({ soal: s, index: i }))
                  .filter(({ soal: s }) => {
                    if (filterKoreksi === 'belum') return !s.dikoreksiTentor && !s.anulirBonus;
                    if (filterKoreksi === 'terkoreksi') return !!s.dikoreksiTentor && !s.anulirBonus;
                    if (filterKoreksi === 'bonus') return !!s.anulirBonus;
                    return true;
                  })
                  .map(({ soal: s, index: i }) => {
                    const tipe = s.tipe || 'pg_sederhana';
                    const formState = inputKoreksi[s.id] || {
                      kunciBaru: teksKunci(s),
                      anulirBonus: !!s.anulirBonus,
                      catatan: s.koreksiTentor?.catatan || '',
                    };
                    const isFokus = soalFokusId === s.id;
                    const isSedangSimpan = sedangKoreksiIndex === i;

                    return (
                      <div
                        key={s.id || i}
                        id={`soal-koreksi-${s.id}`}
                        style={{
                          background: 'white',
                          border: isFokus ? '2px solid #2563eb' : (s.anulirBonus ? '1.5px solid #c084fc' : (s.dikoreksiTentor ? '1.5px solid #86efac' : '1px solid #e2e8f0')),
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 14,
                          boxShadow: isFokus ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Soal {i + 1}</span>
                            <span style={{ fontSize: 10, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                              {String(tipe).replace(/_/g, ' ')}
                            </span>
                            {s.mapel && (
                              <span style={{ fontSize: 10, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                {s.mapel}
                              </span>
                            )}
                          </div>
                          <div>
                            {s.anulirBonus ? (
                              <span style={{ fontSize: 11, background: '#f3e8ff', color: '#7e22ce', padding: '3px 10px', borderRadius: 999, fontWeight: 800 }}>
                                🎁 DIANULIR / BONUS PENUH
                              </span>
                            ) : s.dikoreksiTentor ? (
                              <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 999, fontWeight: 800 }}>
                                ✅ DIKOREKSI TENTOR ({s.koreksiTentor?.oleh || 'Tentor'})
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
                                🔍 Kunci Asli Sistem
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stimulus Bacaan */}
                        {s.bacaan?.teks && (
                          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155' }}>
                            <RenderMath text={s.bacaan.teks} />
                          </div>
                        )}

                        {/* Teks Soal & Gambar */}
                        <TeksSoalBergambar
                          teks={s.soal || s.teks_soal}
                          gambarUrls={s.gambarUrls}
                          gambarMeta={s.gambarMeta || null}
                          onKlikGambar={setGambarDibuka}
                          gayaTeks={{ marginBottom: 10, fontSize: 13, color: '#1e293b', fontWeight: 600 }}
                          gayaGambar={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, margin: '8px 0 10px' }}
                        />

                        {s.tabelSoal && <RenderTable table={s.tabelSoal} />}

                        {/* Tampilan Kunci Aktif Saat Ini */}
                        <div style={{ margin: '10px 0', padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Kunci Aktif Saat Ini: </span>
                          <b style={{ color: s.anulirBonus ? '#7e22ce' : (s.dikoreksiTentor ? '#15803d' : '#0369a1') }}>
                            {teksKunci(s)}
                          </b>
                          {s.koreksiTentor?.catatan && (
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                              Catatan tentor: &quot;{s.koreksiTentor.catatan}&quot;
                            </div>
                          )}
                        </div>

                        {/* Panel Form Koreksi Kunci */}
                        <div style={{ marginTop: 12, background: '#fdfefe', border: '1.5px dashed #cbd5e1', borderRadius: 10, padding: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            ✏️ Ubah Kunci Jawaban Butir #{i + 1}
                          </div>

                          {/* Opsi Anulir / Bonus Toggle */}
                          <div style={{ marginBottom: 12, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '8px 12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6b21a8' }}>
                              <input
                                type="checkbox"
                                checked={formState.anulirBonus}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setInputKoreksi((m) => ({
                                    ...m,
                                    [s.id]: { ...formState, anulirBonus: checked },
                                  }));
                                }}
                              />
                              🎁 Anulir butir soal ini (Beri bonus nilai 100% untuk semua siswa karena soal cacat/keliru total)
                            </label>
                          </div>

                          {/* Form Input Sesuai Tipe Soal (jika tidak dianulir) */}
                          {!formState.anulirBonus && (
                            <div style={{ marginBottom: 12 }}>
                              {tipe === 'pg_sederhana' && (
                                <div>
                                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 6 }}>
                                    Pilih opsi yang benar:
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {['A', 'B', 'C', 'D', 'E'].slice(0, (s.opsiJawaban || []).length || 5).map((huruf, idx) => {
                                      const teksOpsi = (s.opsiJawaban || [])[idx];
                                      const isiOpsi = typeof teksOpsi === 'string' ? teksOpsi : (teksOpsi?.teks || '');
                                      const isDipilih = formState.kunciBaru === huruf;
                                      return (
                                        <button
                                          key={huruf}
                                          type="button"
                                          onClick={() => {
                                            setInputKoreksi((m) => ({
                                              ...m,
                                              [s.id]: { ...formState, kunciBaru: huruf },
                                            }));
                                          }}
                                          style={{
                                            display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                                            border: isDipilih ? '2px solid #059669' : '1px solid #cbd5e1',
                                            background: isDipilih ? '#ecfdf5' : 'white',
                                            color: isDipilih ? '#065f46' : '#334155',
                                            fontWeight: isDipilih ? 700 : 500, fontSize: 12,
                                          }}
                                        >
                                          <span style={{
                                            width: 24, height: 24, borderRadius: 999, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', background: isDipilih ? '#059669' : '#e2e8f0',
                                            color: isDipilih ? 'white' : '#475569', fontWeight: 800, fontSize: 11,
                                          }}>
                                            {huruf}
                                          </span>
                                          <div style={{ flex: 1 }}>
                                            <RenderMath text={isiOpsi || `Pilihan ${huruf}`} />
                                          </div>
                                          {isDipilih && <span style={{ fontSize: 11, color: '#059669', fontWeight: 800 }}>✔ Kunci Terpilih</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {tipe === 'pg_kompleks' && (
                                <div>
                                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 6 }}>
                                    Centang opsi-opsi yang benar (bisa lebih dari satu):
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {['A', 'B', 'C', 'D', 'E'].slice(0, (s.opsiJawaban || []).length || 5).map((huruf) => {
                                      const arrKunci = Array.isArray(formState.kunciBaru)
                                        ? formState.kunciBaru
                                        : String(formState.kunciBaru || '').split(/[\s,]+/);
                                      const isChecked = arrKunci.includes(huruf);
                                      return (
                                        <button
                                          key={huruf}
                                          type="button"
                                          onClick={() => {
                                            const set = new Set(arrKunci);
                                            if (isChecked) set.delete(huruf);
                                            else set.add(huruf);
                                            const baru = [...set].filter(Boolean).sort().join(', ');
                                            setInputKoreksi((m) => ({
                                              ...m,
                                              [s.id]: { ...formState, kunciBaru: baru },
                                            }));
                                          }}
                                          style={{
                                            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                                            border: isChecked ? '2px solid #059669' : '1px solid #cbd5e1',
                                            background: isChecked ? '#ecfdf5' : 'white',
                                            color: isChecked ? '#065f46' : '#475569',
                                            fontWeight: 800, fontSize: 12,
                                          }}
                                        >
                                          {isChecked ? `[✔] Opsi ${huruf}` : `[ ] Opsi ${huruf}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {(tipe === 'benar_salah' || tipe === 'pg_kategori') && (
                                <div>
                                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 6 }}>
                                    Tentukan status benar / salah per baris pernyataan:
                                  </div>
                                  {pilihBarisBenarSalah(s).map((b, bIdx) => {
                                    const teksPernyataan = typeof b === 'string' ? b : (b?.teks || b?.pernyataan || `Pernyataan ${bIdx + 1}`);
                                    const arrBs = Array.isArray(formState.kunciBaru) ? formState.kunciBaru : [];
                                    const currentVal = arrBs[bIdx] || kunciBarisBenarSalah(b) || 'benar';
                                    return (
                                      <div key={bIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                                        <div style={{ fontSize: 12, color: '#334155', flex: 1 }}>
                                          <b>{bIdx + 1}.</b> <RenderMath text={teksPernyataan} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                          {['benar', 'salah'].map((st) => (
                                            <button
                                              key={st}
                                              type="button"
                                              onClick={() => {
                                                const salin = [...arrBs];
                                                salin[bIdx] = st;
                                                setInputKoreksi((m) => ({
                                                  ...m,
                                                  [s.id]: { ...formState, kunciBaru: salin },
                                                }));
                                              }}
                                              style={{
                                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                border: currentVal === st ? (st === 'benar' ? '1.5px solid #16a34a' : '1.5px solid #dc2626') : '1px solid #cbd5e1',
                                                background: currentVal === st ? (st === 'benar' ? '#dcfce7' : '#fee2e2') : 'white',
                                                color: currentVal === st ? (st === 'benar' ? '#15803d' : '#b91c1c') : '#64748b',
                                              }}
                                            >
                                              {st === 'benar' ? '✔ Benar' : '✖ Salah'}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {(tipe === 'isian_singkat' || tipe === 'numerik') && (
                                <div>
                                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 4 }}>
                                    Ketikkan jawaban teks / angka yang benar:
                                  </div>
                                  <input
                                    type="text"
                                    value={formState.kunciBaru || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setInputKoreksi((m) => ({
                                        ...m,
                                        [s.id]: { ...formState, kunciBaru: val },
                                      }));
                                    }}
                                    placeholder="Contoh: 42 atau fotosintesis"
                                    style={{ width: '100%', maxWidth: 360, padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Input Alasan Koreksi */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginBottom: 4 }}>
                              Alasan / Catatan Tentor (opsional, tersimpan di riwayat):
                            </div>
                            <input
                              type="text"
                              value={formState.catatan || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setInputKoreksi((m) => ({
                                  ...m,
                                  [s.id]: { ...formState, catatan: val },
                                }));
                              }}
                              placeholder="Misal: Kunci AI keliru pada tanda kurung, jawaban benar seharusnya B..."
                              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                            />
                          </div>

                          {/* Tombol Simpan & Hitung Ulang */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleSimpanKoreksi(i, formState)}
                              disabled={isSedangSimpan}
                              style={{
                                padding: '9px 18px', borderRadius: 10, border: 'none',
                                background: '#059669', color: 'white', fontSize: 12.5, fontWeight: 800,
                                cursor: 'pointer', opacity: isSedangSimpan ? 0.6 : 1,
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                              }}
                            >
                              {isSedangSimpan ? '🔄 Menghitung Ulang Seluruh Peserta...' : '💾 Simpan Kunci Baru & Hitung Ulang Skor Siswa 🔄'}
                            </button>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              ⚡ Otomatis menyesuaikan akurasi persentase, skor ujian, dan saldo XP seluruh peserta yang sudah selesai.
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {/* Modal Popup Hasil Hitung Ulang Skor Siswa */}
      {modalHasilKoreksi && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, maxWidth: 620, width: '100%',
            maxHeight: '90vh', overflowY: 'auto', padding: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Koreksi Kunci & Hitung Ulang Berhasil!</h3>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Soal #{modalHasilKoreksi.soalNomor} telah diperbarui. Nilai seluruh peserta telah disesuaikan secara adil.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, margin: '14px 0' }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Total Sesi Diproses</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{modalHasilKoreksi.totalSesiDiproses} Sesi</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Siswa Berubah Nilai</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{modalHasilKoreksi.jumlahBerubah} Siswa</div>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>Rincian Perubahan Nilai Siswa:</div>
            {modalHasilKoreksi.rincianPerubahan?.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                Belum ada siswa yang menyelesaikan try out ini. Nilai kunci baru akan langsung digunakan saat siswa mengerjakan.
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px' }}>Nama Siswa</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Akurasi Skor</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>XP Final</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalHasilKoreksi.rincianPerubahan.map((r, rIdx) => (
                      <tr key={r.sesiId || rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>{r.nama}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ color: '#64748b' }}>{r.totalSkorPersenLama}%</span>
                          <span style={{ margin: '0 4px', color: '#94a3b8' }}>→</span>
                          <b style={{ color: r.totalSkorPersen >= r.totalSkorPersenLama ? '#16a34a' : '#dc2626' }}>{r.totalSkorPersen}%</b>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{ color: '#64748b' }}>{r.xpFinalLama}</span>
                          <span style={{ margin: '0 4px', color: '#94a3b8' }}>→</span>
                          <b>{r.xpFinal}</b>
                          {r.selisihXp !== 0 && (
                            <span style={{ marginLeft: 4, fontSize: 10.5, fontWeight: 700, color: r.selisihXp > 0 ? '#16a34a' : '#dc2626' }}>
                              ({r.selisihXp > 0 ? '+' : ''}{r.selisihXp})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {r.berubah ? (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 6, fontWeight: 700, fontSize: 10 }}>
                              ⚡ Diperbarui
                            </span>
                          ) : (
                            <span style={{ background: '#f1f5f9', color: '#94a3b8', padding: '2px 6px', borderRadius: 6, fontWeight: 700, fontSize: 10 }}>
                              Tetap
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalHasilKoreksi(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb',
                  color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}
      {gambarDibuka && (
        <LihatGambar
          src={gambarDibuka}
          alt="Gambar diperbesar"
          caption="Gambar soal / opsi / foto jawaban"
          onClose={() => setGambarDibuka(null)}
        />
      )}
      {bukaNaskah && paket && (
        <DialogCetakNaskah input={paket} onClose={() => setBukaNaskah(false)} />
      )}
    </div>
  );
}
