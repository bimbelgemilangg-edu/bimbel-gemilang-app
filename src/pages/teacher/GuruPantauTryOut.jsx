/**
 * ═══════════════════════════════════════════════════════════════════════
 *  PANTAU TRY OUT — VERSI TENTOR (diminta owner 2026-10)
 *  Route: /guru/tryout-monitor/:paketId
 *
 *  Alur: admin menghubungkan sebuah paket try out ke tentor (halaman
 *  Terbitkan Try Out) → tentor melihat banner di dashboard → masuk ke
 *  halaman ini untuk:
 *   • memantau peserta (sesi, status, skor),
 *   • melihat soal & jawaban tiap siswa,
 *   • MEMBERI PENILAIAN ESAI (kotak 0–100, hitung ulang total + XP) —
 *     identik dengan yang bisa dilakukan admin di HasilTryOutAdminPage,
 *     hanya aktornya guru (tercatat di audit log).
 *
 *  Akses: hanya tentor yang terhubung (paket.tentorId === id guru login).
 *  Catat: pengecekan di sisi klien; saat aturan keamanan Firestore
 *  (firebase/rules) diaktifkan, tambahkan aturan untuk role guru.
 * ═══════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, getDocs, query, collection, where, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { hitungTotalSkor } from '../../utils/skorSoalTryOut';
import { isSoalEsai } from '../../utils/skoringSoalKompleks';
import { catatAudit } from '../../utils/auditLog';
import RenderMath from '../../components/shared/RenderMath';
import RendererBenarSalah from '../../pages/student/tryout/RendererBenarSalah';
import RendererEssay from '../../pages/student/tryout/RendererEssay';
import RendererJodoh from '../../pages/student/tryout/RendererJodoh';
import RendererJodohSamping from '../../pages/student/tryout/RendererJodohSamping';
import RendererPilihanGanda from '../../pages/student/tryout/RendererPilihanGanda';
import RendererPilihanGandaKompleks from '../../pages/student/tryout/RendererPilihanGandaKompleks';
import RendererPilihanGandaKategori from '../../pages/student/tryout/RendererPilihanGandaKategori';
import RendererIsianSingkat from '../../pages/student/tryout/RendererIsianSingkat';
import RendererMenyusunKalimat from '../../pages/student/tryout/RendererMenyusunKalimat';
import RendererMenyusunParagraf from '../../pages/student/tryout/RendererMenyusunParagraf';
import RendererEsai from '../../pages/student/tryout/RendererEsai';
import SidebarGuru from '../../components/SidebarGuru';

function renderJawabanSiswa(soal, jawaban) {
  const props = { soal, modeTinjau: true, onChange: () => {} };
  const ada = jawaban !== undefined && jawaban !== null &&
    !(Array.isArray(jawaban) && jawaban.length === 0) &&
    !(typeof jawaban === 'object' && !Array.isArray(jawaban) && Object.keys(jawaban).length === 0);
  if (!ada) return <span style={{ fontSize: 11, color: '#94a3b8' }}>(tidak dijawab)</span>;
  switch (soal.tipe) {
    case 'benar_salah': return <RendererBenarSalah {...props} jawaban={jawaban} />;
    case 'essay': case 'uraian': return <RendererEssay {...props} jawaban={jawaban} />;
    case 'esai': return <RendererEsai {...props} jawaban={typeof jawaban === 'object' ? jawaban : { teks: String(jawaban) }} />;
    case 'jodoh': return <RendererJodoh {...props} jawaban={jawaban} />;
    case 'jodoh_samping': return <RendererJodohSamping {...props} jawaban={jawaban} />;
    case 'pg_sederhana': return <RendererPilihanGanda {...props} jawaban={jawaban} />;
    case 'pg_kompleks': return <RendererPilihanGandaKompleks {...props} jawaban={jawaban} />;
    case 'pg_kategori': return <RendererPilihanGandaKategori {...props} jawaban={jawaban} />;
    case 'isian_singkat': return <RendererIsianSingkat {...props} jawaban={jawaban} />;
    case 'menyusun_kalimat': return <RendererMenyusunKalimat {...props} jawaban={jawaban} />;
    case 'menyusun_paragraf': return <RendererMenyusunParagraf {...props} jawaban={jawaban} />;
    default: return <pre style={{ fontSize: 11 }}>{JSON.stringify(jawaban, null, 1)}</pre>;
  }
}

const poinEsai = (soal) => {
  const n = Number(soal.bobot || soal.poin || soal.skorMaks || 4);
  return Number.isFinite(n) && n > 0 ? n : 4;
};

function GuruPantauTryOut() {
  const { paketId } = useParams();
  const [paket, setPaket] = useState(null);
  const [sesiList, setSesiList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [inputEsai, setInputEsai] = useState({});
  const [simpanEsaiId, setSimpanEsaiId] = useState('');
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState({ tipe: null, teks: '' });
  const [guru, setGuru] = useState({ guruId: '', guruNama: 'Guru' });

  const muatSesi = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'tryout_sesi'), where('paketId', '==', paketId)));
      setSesiList(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) =>
        String(b.selesaiPada || b.mulaiPada || '').localeCompare(String(a.selesaiPada || a.mulaiPada || ''))));
    } catch { setSesiList([]); }
  }, [paketId]);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      try {
        const g = JSON.parse(localStorage.getItem('teacherData') || '{}');
        const gid = String(g.guruId || g.id || '');
        setGuru({ guruId: gid, guruNama: g.nama || g.teacherName || 'Guru' });
        const snap = await getDoc(doc(db, 'tryout_paket', paketId));
        if (batal) return;
        if (!snap.exists()) { setPesan({ tipe: 'err', teks: 'Paket tidak ditemukan.' }); setMemuat(false); return; }
        const d = snap.data();
        if (String(d.tentorId || '') !== gid) {
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

  async function simpanNilaiEsai(siswa, soalId, nilai) {
    if (!paket) return;
    const n = Math.max(0, Math.min(100, Math.round(Number.isFinite(Number(nilai)) ? Number(nilai) : 0)));
    setSimpanEsaiId(soalId);
    setPesan({ tipe: null, teks: '' });
    try {
      const nilaiEsai = { ...(detail?.nilaiEsai || {}), [soalId]: { nilai: n, dinilaiOleh: guru.guruNama || 'guru', dinilaiPada: new Date().toISOString() } };
      const daftarSoal = paket.daftarSoal || [];
      const totalBaru = hitungTotalSkor(daftarSoal, detail?.jawaban || {}, nilaiEsai);
      await updateDoc(doc(db, 'tryout_sesi', detail.id), { nilaiEsai, totalSkorPersen: totalBaru.persen, dihitungUlangPada: serverTimestamp(), dihitungUlangOleh: 'guru' });
      // XP siswa mengikuti total terbaru (pola sama dengan admin)
      if (detail.studentId) {
        const persenLama = Number(detail.totalSkorPersen) || 0;
        const delta = Math.max(-1000, Math.min(1000, Math.round(totalBaru.persen - persenLama)));
        if (delta !== 0) {
          try { await updateDoc(doc(db, 'siswa_progress', detail.studentId), { XP: increment(delta), XPTotal: increment(delta) }); } catch { /* non-blokir */ }
        }
      }
      setDetail({ ...detail, nilaiEsai, totalSkorPersen: totalBaru.persen });
      setSesiList((lama) => lama.map((s) => (s.id === detail.id ? { ...s, nilaiEsai, totalSkorPersen: totalBaru.persen } : s)));
      setInputEsai((m) => { const c = { ...m }; delete c[soalId]; return c; });
      setPesan({ tipe: 'ok', teks: `Nilai esai disimpan: ${n}/100` });
      catatAudit({
        aksi: 'tryout.esai', kategori: 'tryout', targetTipe: 'tryout_sesi', targetId: detail.id,
        targetLabel: `${siswa.nama || siswa.studentId} · ${paket.judul}`,
        detail: { paketId, soalId, nilai: n, totalPersenBaru: totalBaru.persen, oleh: 'guru', guruId: guru.guruId },
        peristiwa: 'esai dinilai guru',
      });
    } catch (e) {
      setPesan({ tipe: 'err', teks: `Gagal menyimpan: ${e.message}` });
      catatAudit({ aksi: 'tryout.esai.gagal', kategori: 'tryout', targetTipe: 'tryout_sesi', targetId: detail?.id, targetLabel: paket.judul, detail: { soalId, error: e.message, oleh: 'guru' }, peristiwa: 'gagal menyimpan nilai esai' });
    } finally { setSimpanEsaiId(''); }
  }

  const selesai = sesiList.filter((s) => s.status === 'selesai').length;
  const rerata = sesiList.length ? Math.round(sesiList.reduce((a, s) => a + (Number(s.totalSkorPersen) || 0), 0) / sesiList.length) : 0;
  const esaiBelumDinilai = sesiList.reduce((a, s) => {
    const daftar = paket?.daftarSoal || [];
    return a + daftar.filter((so) => isSoalEsai(so) && !s.nilaiEsai?.[String(so.id ?? so.kode ?? '')]).length;
  }, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      <SidebarGuru />
      <main style={{ flex: 1, padding: 20, maxWidth: 980, margin: '0 auto' }}>
        <Link to="/guru/dashboard" style={{ fontSize: 12, color: '#2563eb' }}>← Kembali ke Dashboard</Link>
        <h2 style={{ margin: '8px 0 4px', fontSize: 18 }}>🎯 Pantau Try Out</h2>
        {pesan.teks && <div style={{ margin: '8px 0', fontSize: 12, color: pesan.tipe === 'err' ? '#b91c1c' : '#15803d', background: pesan.tipe === 'err' ? '#fef2f2' : '#f0fdf4', border: '1px solid ' + (pesan.tipe === 'err' ? '#fecaca' : '#bbf7d0'), padding: '6px 10px', borderRadius: 8 }}>{pesan.teks}</div>}
        {memuat && <div style={{ fontSize: 12, color: '#6b7280' }}>Memuat...</div>}
        {paket && (
          <>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{paket.judul}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {paket.targetKelas} · {paket.targetKategori} · {paket.totalSoal || paket.daftarSoal?.length || 0} soal
                {paket.waktuTutup ? ` · ditutup ${new Date(paket.waktuTutup).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  ['Peserta', sesiList.length, '#2563eb'],
                  ['Selesai', selesai, '#16a34a'],
                  ['Rerata skor', rerata + '%', '#7c3aed'],
                  ['Esai belum dinilai', esaiBelumDinilai, esaiBelumDinilai > 0 ? '#d97706' : '#64748b'],
                ].map(([lbl, val, warna]) => (
                  <div key={lbl} style={{ padding: '8px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', minWidth: 110 }}>
                    <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: warna }}>{val}</div>
                  </div>
                ))}
                <button onClick={muatSesi} style={{ alignSelf: 'center', fontSize: 11, padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>🔄 Muat ulang</button>
              </div>
            </div>

            {sesiList.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>Belum ada peserta yang mengerjakan. Data muncul otomatis setelah siswa mulai/selesai; gunakan tombol Muat ulang.</div>}
            {sesiList.map((s) => {
              const daftar = paket.daftarSoal || [];
              const belumDinilai = daftar.filter((so) => isSoalEsai(so) && !s.nilaiEsai?.[String(so.id ?? so.kode ?? '')]).length;
              return (
                <div key={s.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.nama || s.studentId}</div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                      {s.kelasSekolah || ''} · {s.status === 'selesai' ? `selesai ${s.selesaiPada ? new Date(s.selesaiPada).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : ''}` : (s.status || 'aktif')}
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
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Detail: {detail.nama || detail.studentId}</div>
                  <button onClick={() => setDetail(null)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Tutup</button>
                </div>
                {(paket.daftarSoal || []).map((soal, idx) => {
                  const soalId = String(soal.id ?? soal.kode ?? idx + 1);
                  const nilai = detail.nilaiEsai?.[soalId];
                  const esai = isSoalEsai(soal);
                  return (
                    <div key={soalId} style={{ background: 'white', border: '1px solid ' + (esai && !nilai ? '#fde68a' : '#e2e8f0'), borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>Soal {idx + 1} · {String(soal.tipe || '').replace(/_/g, ' ')}</div>
                        {!esai && (
                          <div style={{ fontSize: 11, fontWeight: 800, color: detail.skorPerSoal?.[soalId] ? '#16a34a' : '#dc2626' }}>
                            {detail.skorPerSoal?.[soalId] ? 'BENAR' : 'SALAH'}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#0f172a', marginBottom: 8 }}>
                        <RenderMath content={soal.teksSoal} fontSize="13px" />
                        {Array.isArray(soal.gambar) && soal.gambar.filter(Boolean).map((g, i) => (
                          <img key={i} src={g} alt={`Gambar soal ${idx + 1}`} style={{ maxWidth: 220, borderRadius: 6, marginTop: 6, display: 'block' }} />
                        ))}
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>JAWABAN SISWA</div>
                        {renderJawabanSiswa(soal, (detail.jawaban || {})[soalId])}
                      </div>
                      {esai && (
                        <div style={{ marginTop: 10, background: nilai ? '#f0fdf4' : '#fffbeb', border: '1px solid ' + (nilai ? '#bbf7d0' : '#fde68a'), borderRadius: 8, padding: 10 }}>
                          {nilai ? (
                            <div style={{ fontSize: 12, color: '#15803d', marginBottom: 8 }}>
                              ✅ Dinilai: <b>{nilai.nilai}/100</b> · oleh {nilai.dinilaiOleh || 'admin'} · {nilai.dinilaiPada ? new Date(nilai.dinilaiPada).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                            </div>
                          ) : (
                            <div style={{ fontSize: 12, color: '#92400e', marginBottom: 8 }}>⏳ Esai belum dinilai (bobot {poinEsai(soal)} poin)</div>
                          )}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="number" min="0" max="100"
                              value={inputEsai[soalId] ?? (nilai?.nilai ?? '')}
                              onChange={(e) => setInputEsai((m) => ({ ...m, [soalId]: e.target.value }))}
                              placeholder="Nilai 0–100"
                              style={{ width: 110, padding: '7px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12.5 }}
                            />
                            <button
                              onClick={() => simpanNilaiEsai(detail, soalId, inputEsai[soalId] ?? nilai?.nilai ?? 0)}
                              disabled={simpanEsaiId === soalId}
                              style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: simpanEsaiId === soalId ? 0.6 : 1 }}
                            >
                              {simpanEsaiId === soalId ? 'Menyimpan...' : '💾 Simpan Penilaian'}
                            </button>
                            <span style={{ fontSize: 10.5, color: '#6b7280' }}>Total siswa & XP ikut terhitung ulang otomatis.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default GuruPantauTryOut;
