// src/pages/student/gemilang/BukuBacaPage.jsx
// ============================================================
// READER BUKU DIGITAL -- baca per seksi (+5 XP), Uji Pemahaman Bab
// (+10 XP/benar), hasil + pembahasan + visual interaktif.
// Sumber data: Firestore buku_digital/{bukuId}/bab/{babId}.
// Progres: siswa_buku_progress/{studentId_babId}; XP: siswa_progress.
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CheckCircle2, XCircle, PenLine } from 'lucide-react';
import { MathText, MathBlock } from '../../../components/MathText';
import VisualBuku from '../../../components/buku/VisualBuku';

const XP_SEKSI = 5;
const XP_BENAR = 10;

export default function BukuBacaPage() {
  const { bukuId, babId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || '';
  const [buku, setBuku] = useState(null);
  const [bab, setBab] = useState(null);
  const [siap, setSiap] = useState(false);
  const [selesaiSections, setSelesaiSections] = useState([]);
  const [quizTerbaik, setQuizTerbaik] = useState(null);
  const [mode, setMode] = useState('baca'); // baca | quiz | hasil
  const [jawaban, setJawaban] = useState({});
  const [hasil, setHasil] = useState(null);
  const [peringatan, setPeringatan] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [bSnap, babSnap] = await Promise.all([
          getDoc(doc(db, 'buku_digital', bukuId)),
          getDoc(doc(db, 'buku_digital', bukuId, 'bab', babId)),
        ]);
        if (bSnap.exists()) setBuku({ id: bSnap.id, ...bSnap.data() });
        if (babSnap.exists()) setBab({ id: babSnap.id, ...babSnap.data() });
      } catch (e) { console.error('Gagal muat bab:', e); }
      setSiap(true);
    })();
  }, [bukuId, babId]);

  useEffect(() => {
    if (!bab || !studentId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'siswa_buku_progress', `${studentId}_${bab.id}`));
        if (snap.exists()) {
          setSelesaiSections(snap.data().selesaiSections || []);
          setQuizTerbaik(snap.data().quizTerbaik ?? null);
        }
      } catch (e) { console.error('Gagal muat progres buku:', e); }
    })();
  }, [bab, studentId]);

  if (!siap) {
    return <div style={st.pusat}><div style={{ fontSize: 32 }}>📖</div><div style={{ marginTop: 8 }}>Memuat bab...</div></div>;
  }
  if (!bab) {
    return (
      <div style={st.pusat}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
        <div>Bab tidak ditemukan di database.</div>
        <button onClick={() => navigate('/siswa/buku')} style={{ ...st.tombolUtama, width: 'auto', marginTop: 16, padding: '10px 18px' }}>Kembali ke Rak Buku</button>
      </div>
    );
  }

  const sections = bab.sections || [];
  const ujiPemahaman = bab.ujiPemahaman || [];
  const warna = buku?.warna || '#4C6EF5';

  const simpanProgres = (patch) => {
    if (!studentId) return;
    setDoc(doc(db, 'siswa_buku_progress', `${studentId}_${bab.id}`), {
      studentId, babId: bab.id, ...patch, updatedAt: serverTimestamp(),
    }, { merge: true }).catch((e) => {
      console.error('Gagal simpan progres buku:', e);
      setPeringatan('Progres bacaan gagal tersimpan ke akunmu (koneksi). Coba buka lagi halaman ini sebentar lagi.');
    });
  };

  const tambahXp = async (xp) => {
    if (!studentId || xp <= 0) return;
    try {
      const jeda = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms));
      const ref = doc(db, 'siswa_progress', studentId);
      const snap = await Promise.race([getDoc(ref), jeda(8000)]);
      const ex = snap.exists() ? snap.data() : { xp: 0 };
      await Promise.race([setDoc(ref, { xp: (ex.xp || 0) + xp, updatedAt: serverTimestamp() }, { merge: true }), jeda(8000)]);
    } catch (e) {
      console.error('Gagal tambah XP buku:', e);
      setPeringatan('XP gagal tersimpan ke akunmu (koneksi lambat). Progres bacaan tetap aman tercatat.');
    }
  };

  const tandaiSelesai = (sid) => {
    if (selesaiSections.includes(sid)) return;
    const baru = [...selesaiSections, sid];
    setSelesaiSections(baru);
    simpanProgres({ selesaiSections: baru, terakhirDibacaSection: sid });
    tambahXp(XP_SEKSI);
    setToast(`+${XP_SEKSI} XP`);
    setTimeout(() => setToast(null), 1600);
  };

  const semuaTerjawab = ujiPemahaman.every((q) => {
    const j = jawaban[q.id];
    if (q.tipe === 'pg') return typeof j === 'number';
    if (q.tipe === 'multi') return Array.isArray(j) && j.length > 0;
    return Array.isArray(j) && j.length === (q.pernyataan || []).length && j.every((v) => typeof v === 'boolean');
  });

  const kumpulkanQuiz = () => {
    if (!semuaTerjawab) return;
    const daftar = ujiPemahaman.map((q) => {
      const j = jawaban[q.id];
      let benar = false;
      if (q.tipe === 'pg') benar = j === q.benar;
      else if (q.tipe === 'multi') benar = Array.isArray(j) && j.length === (q.benar || []).length && (q.benar || []).every((i) => j.includes(i));
      else benar = Array.isArray(j) && j.length === (q.benar || []).length && j.every((v, i) => v === q.benar[i]);
      return { q, j, benar };
    });
    const benarCount = daftar.filter((x) => x.benar).length;
    const persen = daftar.length ? Math.round((benarCount / daftar.length) * 100) : 0;
    const xp = benarCount * XP_BENAR;
    const terbaik = Math.max(quizTerbaik || 0, persen);
    setHasil({ daftar, benarCount, persen, xp });
    setQuizTerbaik(terbaik);
    simpanProgres({ quizTerbaik: terbaik });
    tambahXp(xp);
    setMode('hasil');
    window.scrollTo(0, 0);
  };

  const renderBlok = (blok, i) => {
    if (blok.tipe === 'p') return <p key={i} style={st.paragraf}><MathText text={blok.teks} /></p>;
    if (blok.tipe === 'list') return <ul key={i} style={st.list}>{(blok.items || []).map((it, j) => <li key={j} style={{ marginBottom: 6 }}><MathText text={it} /></li>)}</ul>;
    if (blok.tipe === 'math') return <div key={i} style={st.boxMath}><MathBlock text={blok.teks} /></div>;
    if (blok.tipe === 'contoh') return <div key={i} style={st.boxContoh}><b>✏️ Contoh</b><div style={{ marginTop: 4 }}><MathText text={blok.teks} /></div></div>;
    if (blok.tipe === 'tips') return <div key={i} style={st.boxTips}><b>💡 Tips</b><div style={{ marginTop: 4 }}><MathText text={blok.teks} /></div></div>;
    return null;
  };

  const persenBaca = sections.length ? Math.round((selesaiSections.length / sections.length) * 100) : 0;

  return (
    <div style={st.page}>
      {toast && <div style={st.toast}>{toast}</div>}
      {peringatan && (
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '10px 16px', fontSize: 11.5, color: '#92400e' }}>⚠️ {peringatan}</div>
      )}

      <div style={{ ...st.hero, background: `linear-gradient(160deg, ${warna} 0%, #1E1B4B 100%)` }}>
        <div style={st.heroStars} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <button onClick={() => (mode === 'baca' ? navigate(`/siswa/buku/${bukuId}`) : setMode('baca'))} style={st.backBtn}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{buku?.emoji || '📘'} {buku?.judul || ''}</div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{bab.judul}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 }}>
              {selesaiSections.length}/{sections.length} seksi selesai{quizTerbaik != null ? ` • quiz terbaik ${quizTerbaik}%` : ''}
            </div>
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 10, marginTop: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ height: '100%', width: `${persenBaca}%`, background: 'linear-gradient(90deg, #FB923C, #FBBF24)', borderRadius: 10, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {mode === 'baca' && (
        <div style={{ padding: '16px 16px 90px' }}>
          {sections.map((sec, idx) => {
            const sudah = selesaiSections.includes(sec.id);
            return (
              <div key={sec.id} style={st.kartuSeksi}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{sec.judul}</div>
                  {sudah && <CheckCircle2 size={18} color="#22c55e" />}
                </div>
                {(sec.blocks || []).map(renderBlok)}
                <button
                  onClick={() => tandaiSelesai(sec.id)}
                  disabled={sudah}
                  style={{ ...st.tombolKecil, background: sudah ? '#dcfce7' : '#7C3AED', color: sudah ? '#166534' : 'white' }}
                >
                  {sudah ? '✓ Selesai dibaca' : 'Tandai selesai & lanjut'}
                </button>
                {idx < sections.length - 1 && (
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 6 }}>Lanjut: {sections[idx + 1].judul}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mode === 'quiz' && (
        <div style={{ padding: '16px 16px 90px' }}>
          {ujiPemahaman.length === 0 ? (
            <div style={st.kartuSeksi}>Belum ada soal pemantapan di bab ini.</div>
          ) : ujiPemahaman.map((q, i) => (
            <div key={q.id} style={st.kartuSeksi}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={st.nomorSoal}>{i + 1}</span>
                <div style={{ flex: 1, fontSize: 13.5, color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  <MathText text={q.soal} />
                </div>
              </div>
              {q.visual && <VisualBuku visual={q.visual} />}
              {q.tipe === 'pg' && <InputPg q={q} nilai={jawaban[q.id]} set={(v) => setJawaban((p) => ({ ...p, [q.id]: v }))} />}
              {q.tipe === 'multi' && <InputMulti q={q} nilai={jawaban[q.id]} set={(v) => setJawaban((p) => ({ ...p, [q.id]: v }))} />}
              {q.tipe === 'bs' && <InputBs q={q} nilai={jawaban[q.id]} set={(v) => setJawaban((p) => ({ ...p, [q.id]: v }))} />}
            </div>
          ))}
        </div>
      )}

      {mode === 'hasil' && hasil && (
        <div style={{ padding: '16px 16px 40px' }}>
          <div style={{ ...st.kartuSeksi, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>{hasil.persen >= 70 ? '🧑‍🚀' : '🛰️'}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED' }}>{hasil.persen}%</div>
            <div style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 10px' }}>{hasil.benarCount} benar dari {hasil.daftar.length} soal • +{hasil.xp} XP</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => { setJawaban({}); setHasil(null); setMode('quiz'); window.scrollTo(0, 0); }} style={{ ...st.tombolKecil, background: '#f1f5f9', color: '#334155' }}>Ulangi Quiz</button>
              <button onClick={() => setMode('baca')} style={{ ...st.tombolKecil, background: '#7C3AED', color: 'white' }}>Kembali ke Bacaan</button>
            </div>
          </div>
          {hasil.daftar.map((item, i) => (
            <div key={i} style={{ ...st.kartuSeksi, borderLeft: `4px solid ${item.benar ? '#22c55e' : '#ef4444'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {item.benar ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                <span style={{ fontSize: 11.5, fontWeight: 700, color: item.benar ? '#16a34a' : '#dc2626' }}>Soal {i + 1} — {item.benar ? 'Benar' : 'Kurang Tepat'}</span>
              </div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                <MathText text={item.q.soal} />
              </div>
              {item.q.visual && <VisualBuku visual={item.q.visual} />}
              <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 3 }}>Jawabanmu: <b>{teksJawaban(item.q, item.j)}</b></div>
              {!item.benar && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 3 }}>Kunci: <b>{teksKunci(item.q)}</b></div>}
              {item.q.pembahasan && (
                <div style={st.boxPembahasan}>
                  <b>💡 Pembahasan</b>
                  <div style={{ marginTop: 4 }}><MathText text={item.q.pembahasan} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mode !== 'hasil' && (
        <div style={st.barBawah}>
          {mode === 'baca' ? (
            <button onClick={() => { setMode('quiz'); window.scrollTo(0, 0); }} style={st.tombolUtama}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <PenLine size={16} /> Uji Pemahaman Bab ({ujiPemahaman.length} soal)
              </span>
            </button>
          ) : (
            <button onClick={kumpulkanQuiz} disabled={!semuaTerjawab} style={{ ...st.tombolUtama, opacity: semuaTerjawab ? 1 : 0.4 }}>
              Kumpulkan Jawaban
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InputPg({ q, nilai, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.pilihan || []).map((p, i) => (
        <button key={i} onClick={() => set(i)} style={{ ...st.opsi, ...(nilai === i ? st.opsiAktif : {}) }}>
          <span style={st.huruf}>{String.fromCharCode(65 + i)}</span>
          <span style={{ flex: 1, textAlign: 'left' }}><MathText text={p} /></span>
        </button>
      ))}
    </div>
  );
}

function InputMulti({ q, nilai, set }) {
  const arr = Array.isArray(nilai) ? nilai : [];
  const toggle = (i) => set(arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(q.pilihan || []).map((p, i) => (
        <button key={i} onClick={() => toggle(i)} style={{ ...st.opsi, ...(arr.includes(i) ? st.opsiAktif : {}) }}>
          <span style={{ ...st.huruf, borderRadius: 6 }}>{arr.includes(i) ? '✓' : ''}</span>
          <span style={{ flex: 1, textAlign: 'left' }}><MathText text={p} /></span>
        </button>
      ))}
      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>Pilih lebih dari satu jawaban.</div>
    </div>
  );
}

function InputBs({ q, nilai, set }) {
  const arr = Array.isArray(nilai) ? nilai : Array((q.pernyataan || []).length).fill(null);
  const pilih = (i, v) => { const baru = [...arr]; baru[i] = v; set(baru); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(q.pernyataan || []).map((p, i) => (
        <div key={i} style={st.barisBs}>
          <div style={{ flex: 1, fontSize: 12.5, color: '#1e293b' }}><MathText text={p} /></div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => pilih(i, true)} style={{ ...st.pill, ...(arr[i] === true ? st.pillOk : {}) }}>Benar</button>
            <button onClick={() => pilih(i, false)} style={{ ...st.pill, ...(arr[i] === false ? st.pillNo : {}) }}>Salah</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const teksJawaban = (q, j) => {
  if (q.tipe === 'pg') return typeof j === 'number' ? (q.pilihan || [])[j] : '(kosong)';
  if (q.tipe === 'multi') return Array.isArray(j) && j.length ? j.slice().sort((a, b) => a - b).map((i) => (q.pilihan || [])[i]).join(' | ') : '(kosong)';
  return Array.isArray(j) ? j.map((v, i) => `${i + 1}) ${v ? 'Benar' : 'Salah'}`).join(', ') : '(kosong)';
};
const teksKunci = (q) => {
  if (q.tipe === 'pg') return (q.pilihan || [])[q.benar];
  if (q.tipe === 'multi') return (q.benar || []).map((i) => (q.pilihan || [])[i]).join(' | ');
  return (q.benar || []).map((v, i) => `${i + 1}) ${v ? 'Benar' : 'Salah'}`).join(', ');
};

const st = {
  page: { minHeight: '100vh', background: '#F4F2FF', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' },
  pusat: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: '#F4F2FF', fontFamily: 'sans-serif', textAlign: 'center', padding: 20 },
  hero: { position: 'relative', overflow: 'hidden', padding: '16px 16px 20px' },
  heroStars: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.08), transparent 45%)', pointerEvents: 'none' },
  backBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 },
  kartuSeksi: { background: 'white', borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: '0 4px 16px rgba(30,27,75,0.06)', textAlign: 'left' },
  paragraf: { fontSize: 13.5, color: '#334155', lineHeight: 1.75, marginBottom: 10, textAlign: 'left' },
  list: { fontSize: 13.5, color: '#334155', lineHeight: 1.7, paddingLeft: 18, marginBottom: 10, textAlign: 'left' },
  boxMath: { background: '#F4F2FF', border: '1px solid #e9e5fb', borderRadius: 12, padding: '6px 10px', marginBottom: 12, overflowX: 'auto' },
  boxContoh: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 13, color: '#78350F', textAlign: 'left' },
  boxTips: { background: '#F4F2FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 13, color: '#4C1D95', textAlign: 'left' },
  boxPembahasan: { marginTop: 10, padding: 12, borderRadius: 12, background: '#F4F2FF', fontSize: 12.5, color: '#4C1D95', lineHeight: 1.6, textAlign: 'left' },
  tombolUtama: { width: '100%', padding: 15, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 16, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 16px rgba(124,58,237,0.25)' },
  tombolKecil: { padding: '10px 14px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  nomorSoal: { width: 24, height: 24, borderRadius: '50%', background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  opsi: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '2px solid #e9e5fb', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', fontSize: 13, color: '#1e293b' },
  opsiAktif: { borderColor: '#7C3AED', background: '#F4F2FF' },
  huruf: { width: 24, height: 24, borderRadius: '50%', background: '#f1f0f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#4C1D95', flexShrink: 0 },
  barisBs: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e9e5fb', borderRadius: 12, padding: '10px 12px' },
  pill: { padding: '6px 10px', borderRadius: 999, border: '1px solid #e2e8f0', background: 'white', fontSize: 11, fontWeight: 700, color: '#64748b', cursor: 'pointer' },
  pillOk: { background: '#22c55e', borderColor: '#22c55e', color: 'white' },
  pillNo: { background: '#ef4444', borderColor: '#ef4444', color: 'white' },
  barBawah: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '12px 16px', background: 'rgba(255,255,255,0.96)', borderTop: '1px solid #e9e5fb', zIndex: 5, boxSizing: 'border-box' },
  toast: { position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)', background: '#7C3AED', color: 'white', borderRadius: 999, padding: '8px 16px', fontWeight: 800, fontSize: 13, zIndex: 10, boxShadow: '0 6px 16px rgba(124,58,237,0.35)' },
};
