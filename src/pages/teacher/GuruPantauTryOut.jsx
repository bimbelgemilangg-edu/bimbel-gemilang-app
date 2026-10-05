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
import { hitungTotalSkor, skorSatuSoal, soalBelumDijawab, isSoalEsai, poinEsai, SKALA_NILAI_ESAI } from '../../utils/skorSoalTryOut';
import { terapkanPotonganXP } from '../../utils/potonganXPTryOut';
import { tambahXpMingguan } from '../../utils/mingguIni';
import { catatAudit, KATEGORI } from '../../utils/auditLog';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';
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

            {sesiList.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', background: 'white', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>Belum ada peserta yang mengerjakan. Data muncul setelah siswa mulai/selesai; gunakan tombol Muat ulang.</div>}
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
                            <img key={gi} src={url} alt={`Gambar soal ${gi + 1}`} style={{ maxWidth: 200, maxHeight: 160, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                          ))}
                        </div>
                      )}
                      {s.tabelSoal && <RenderTable table={s.tabelSoal} />}
                      <RendererSoalGuru soal={s} jawabanTerpilih={jwb} modeTinjau />
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
          </>
        )}
      </main>
    </div>
  );
}
