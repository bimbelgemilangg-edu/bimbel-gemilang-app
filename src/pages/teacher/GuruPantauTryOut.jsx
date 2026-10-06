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
import { doc, getDoc, getDocs, query, collection, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { hitungTotalSkor, skorSatuSoal, soalBelumDijawab, isSoalEsai, poinEsai, pilihBarisBenarSalah, SKALA_NILAI_ESAI } from '../../utils/skorSoalTryOut';
import { cariIndexBenar, kunciBarisBenarSalah } from '../../utils/skoringSoalKompleks';
import { terapkanPotonganXP } from '../../utils/potonganXPTryOut';
import { tambahXpMingguan } from '../../utils/mingguIni';
import { catatAudit, KATEGORI } from '../../utils/auditLog';
import { bacaIdentitasGuru, guruCocokDenganTentor } from '../../utils/identitasGuru';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';
import LihatGambar from '../../components/LihatGambar';
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

// 🔥 BARU (permintaan owner 2026-10-05): kunci jawaban sebagai TEKS.
// Sorotan warna dari renderer (hijau ✔️ / merah ✖️) cukup untuk melihat
// sekilas, tapi tidak cukup saat tentor MEMBAHAS soal di depan kelas --
// ia perlu bisa menyebut "kuncinya B" atau "baris 2 Salah" langsung.
// Fungsi ini menormalkan semua dialek penyimpanan kunci yang memang
// beraneka di repo ini (huruf tunggal, indeks angka, teks jawaban, array
// untuk pg_kompleks, string "AC", dan field jawaban/kunci per baris untuk
// benar_salah) -- toleransi yang sama dengan yang dipakai skoring.
function teksKunci(soal) {
  const tipe = soal?.tipe || 'pg_sederhana';
  if (tipe === 'esai' || tipe === 'uraian') return 'penilaian manual guru (0-100)';
  if (tipe === 'pg_sederhana') {
    const idx = cariIndexBenar(soal);
    return idx >= 0 ? String.fromCharCode(65 + idx) : '(kunci tidak tersedia)';
  }
  if (tipe === 'pg_kompleks') {
    const mentah = soal?.kunciJawaban;
    const kunci = Array.isArray(mentah) ? mentah
      : (typeof mentah === 'string' && mentah.trim() ? mentah.replace(/[\s,]+/g, '').split('') : []);
    return kunci.length ? kunci.map((h) => String(h).toUpperCase()).join(', ') : '(kunci tidak tersedia)';
  }
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    const baris = pilihBarisBenarSalah(soal);
    const isi = baris.map((b, i) => `${i + 1}: ${kunciBarisBenarSalah(b) || '?'}`).join(', ');
    return isi || '(kunci tidak tersedia)';
  }
  // isian_singkat / numerik: kunci utama plus jawaban ekuivalen yang diterima
  const utama = String(soal?.kunciJawaban ?? '').trim();
  const ekuivalen = Array.isArray(soal?.jawabanEkuivalen) ? soal.jawabanEkuivalen.filter(Boolean).map(String) : [];
  return [utama, ...ekuivalen].filter(Boolean).join(' / ') || '(kunci tidak tersedia)';
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
    } catch { setSesiList([]); }
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
      const { totalSkor, totalSkorPersen } = hitungTotalSkor(paket.daftarSoal || [], detail.jawaban || {}, nilaiEsaiBaru);
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
      setPesan({ tipe: 'ok', teks: `Nilai esai tersimpan: ${poin}/${SKALA_NILAI_ESAI}. Total ${siswa.nama || siswa.studentId} sekarang ${totalSkorPersen}% (${xpFinalBaru} XP).` });
      catatAudit('tryout.esai.nilai.guru', {
        kategori: KATEGORI.LAINNYA,
        target: `Esai ${soal.id} • ${siswa.nama || siswa.studentId} • ${paket.judul}`,
        detail: { poin, paketId, guruId: guru.guruId, totalBaru: totalSkorPersen },
      });
    } catch (e) {
      setPesan({ tipe: 'err', teks: `Gagal menyimpan nilai: ${e.message}` });
    } finally { setSimpanEsaiId(''); }
  }

  const daftar = paket?.daftarSoal || [];
  const selesai = sesiList.filter((s) => s.status === 'selesai').length;
  const rerata = sesiList.length ? Math.round(sesiList.reduce((a, s) => a + (Number(s.totalSkorPersen) || 0), 0) / sesiList.length) : 0;
  const esaiBelumDinilai = sesiList.reduce((a, s) => a + daftar.filter((so) => isSoalEsai(so) && poinEsai(so, s.nilaiEsai) === null).length, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <SidebarGuru />
      <main style={{
        marginLeft: isMobile ? '0' : '260px',
        padding: isMobile ? '10px' : '20px',
        width: isMobile ? '100%' : 'calc(100% - 260px)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ width: '100%', maxWidth: 980, margin: '0 auto' }}>
        <Link to="/guru/dashboard" style={{ fontSize: 12, color: '#2563eb' }}>← Kembali ke Dashboard</Link>
        <h2 style={{ margin: '8px 0 4px', fontSize: 18 }}>🎯 Pantau Try Out</h2>
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
            <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
              {[
                ['peserta', `👥 Peserta & Penilaian (${sesiList.length})`],
                ['tinjau', `📖 Tinjau Soal & Pembahasan (${daftar.length})`],
              ].map(([k, lbl]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
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
              return (
                <div key={s.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.nama || s.studentId}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                      {s.kelasSekolah || ''} · {s.status === 'selesai' ? 'selesai' : (s.status || 'aktif')} · {s.xpFinal || 0} XP
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: Number(s.totalSkorPersen) >= 70 ? '#16a34a' : '#d97706' }}>{Math.round(Number(s.totalSkorPersen) || 0)}%</span>
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
                    👁️ Jawaban {detail.nama || detail.studentId} — skor {Math.round(Number(detail.totalSkorPersen) || 0)}% · {detail.xpFinal || 0} XP
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
                      <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10 }}><RenderMath text={s.soal || s.teks_soal} /></div>
                      {(s.gambarUrls || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                          {s.gambarUrls.map((url, gi) => (
                            <img
                              key={gi}
                              src={url}
                              alt={`Gambar soal ${gi + 1}`}
                              onClick={() => setGambarDibuka(url)}
                              title="Klik untuk memperbesar"
                              style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'zoom-in' }}
                            />
                          ))}
                        </div>
                      )}
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
                      <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 12, color: '#166534' }}>
                        <b>🔑 Kunci:</b> {teksKunci(s)}
                      </div>
                      {s.pembahasan && (
                        <div style={{ marginTop: 8, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                          <b>💡 Pembahasan:</b> <RenderMath text={s.pembahasan} />
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
                            <span style={{ fontSize: 10.5, color: '#6b7280' }}>Total skor & XP siswa terhitung ulang otomatis (termasuk potongan anti-curang).</span>
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
                      <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10 }}><RenderMath text={s.soal || s.teks_soal} /></div>
                      {(s.gambarUrls || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                          {s.gambarUrls.map((url, gi) => (
                            <img
                              key={gi}
                              src={url}
                              alt={`Gambar soal ${gi + 1}`}
                              onClick={() => setGambarDibuka(url)}
                              title="Klik untuk memperbesar"
                              style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'zoom-in' }}
                            />
                          ))}
                        </div>
                      )}
                      {s.tabelSoal && <RenderTable table={s.tabelSoal} />}
                      <RendererSoalGuru soal={s} jawabanTerpilih={jwb} modeTinjau onKlikGambar={setGambarDibuka} />
                      <div style={{ marginTop: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 12, color: '#166534' }}>
                        <b>🔑 Kunci:</b> {teksKunci(s)}
                      </div>
                      {s.pembahasan && (
                        <div style={{ marginTop: 8, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                          <b>💡 Pembahasan:</b> <RenderMath text={s.pembahasan} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        </div>
      </main>
      {gambarDibuka && (
        <LihatGambar
          src={gambarDibuka}
          alt="Gambar diperbesar"
          caption="Gambar soal / opsi / foto jawaban"
          onClose={() => setGambarDibuka(null)}
        />
      )}
    </div>
  );
}
