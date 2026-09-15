// src/pages/teacher/LiveSessionTeacher.jsx
// PINTU MASUK SESI LIVE GURU dengan 2 MODE:
//  📖 MATERI INTERAKTIF  -> dari BAB BUKU DIGITAL: slide ala PPT (cover,
//     kartu materi berurutan + rumus/gambar, refleksi) lalu soal bab di
//     akhir slide yang dikerjakan siswa secara interaktif.
//  ✍️ SOAL & PEMBAHASAN  -> dari BANK SOAL: latihan terpantau saja;
//     pembahasan disampaikan GURU (teks pembahasan hanya privat di guru).
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseDaftarSoal, parseSlides, cekBenar, CSS_MODUL } from '../../utils/parseSoal';
import {
  buatSesi, dengarSesi, dengarPeserta, dengarJawaban, ubahSesi, akhiriSesi,
} from '../../services/sesiService';

const S = {
  page: { maxWidth: 1150, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' },
  card: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 11px', fontSize: 13, background: '#fff', minWidth: 220 },
  btn: { background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnH: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnW: { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnR: { background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btn2: { background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  kode: { fontSize: 30, fontWeight: 900, letterSpacing: 5, color: '#4338ca', background: '#eef2ff', border: '2px dashed #a5b4fc', borderRadius: 12, padding: '8px 20px' },
  chip: { background: '#eef2ff', color: '#4338ca', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  modeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 },
  modeCard: { background: '#fff', border: '2px solid #e2e8f0', borderRadius: 14, padding: 18, cursor: 'pointer', textAlign: 'left', transition: '0.2s' },
  babRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' },
  slideBox: { background: '#0f172a', borderRadius: 14, padding: 18, minHeight: 320, color: '#e2e8f0' },
  bar: { height: 12, borderRadius: 6, minWidth: 3, background: '#3498db' },
  opsi: (k) => ({ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: k ? '#f0fdf4' : '#f8fafc', fontSize: 13, marginBottom: 6 }),
  grid2: { display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 12 },
};

export default function LiveSessionTeacher() {
  const [tahap, setTahap] = useState('mode'); // mode | buku | bab | bank | live
  const [bukuList, setBukuList] = useState([]);
  const [bukuId, setBukuId] = useState('');
  const [babList, setBabList] = useState([]);
  const [babHtml, setBabHtml] = useState('');
  const [bankList, setBankList] = useState([]);
  const [bankPick, setBankPick] = useState(null);
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState([]);
  const [jawaban, setJawaban] = useState([]);

  const guruId = (() => {
    try { const t = JSON.parse(localStorage.getItem('teacherData') || '{}'); return t.guruId || t.id || ''; } catch { return ''; }
  })();

  useEffect(() => {
    (async () => {
      try { const sn = await getDocs(collection(db, 'buku_digital')); setBukuList(sn.docs.map((d) => ({ id: d.id, ...d.data() }))); } catch (e) {}
      try {
        const sn = await getDocs(collection(db, 'bank_soal'));
        const grup = {};
        sn.docs.forEach((d) => {
          const s = { id: d.id, ...d.data() };
          if (s.status && s.status !== 'aktif') return;
          const key = (s.mataPelajaran || s.mapel || 'Umum') + '||' + (s.materi || 'Umum');
          if (!grup[key]) grup[key] = { key, mapel: s.mataPelajaran || s.mapel || 'Umum', materi: s.materi || 'Umum', items: [] };
          grup[key].items.push(s);
        });
        setBankList(Object.values(grup).filter((g) => g.items.length >= 3));
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!bukuId) { setBabList([]); return; }
    (async () => {
      try {
        const sn = await getDocs(collection(db, 'buku_digital', bukuId, 'bab'));
        const l = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
        l.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setBabList(l);
      } catch (e) {}
    })();
  }, [bukuId]);

  useEffect(() => {
    if (!sesi) return undefined;
    const u1 = dengarSesi(sesi.id, (s) => { if (s) setSesi(s); });
    const u2 = dengarPeserta(sesi.id, setPeserta);
    const u3 = dengarJawaban(sesi.id, setJawaban);
    return () => { u1(); u2(); u3(); };
  }, [sesi && sesi.id]);

  useEffect(() => {
    if (!sesi || sesi.mode !== 'materi' || !sesi.babId) return;
    (async () => {
      try {
        const s = await getDoc(doc(db, 'buku_digital', sesi.bukuId, 'bab', sesi.babId));
        if (s.exists()) setBabHtml(s.data().html || '');
      } catch (e) {}
    })();
  }, [sesi && sesi.id, sesi && sesi.mode]);

  const slides = useMemo(() => (babHtml ? parseSlides(babHtml) : []), [babHtml]);
  const daftarSoal = sesi ? (sesi.daftarSoal || []) : [];
  const slideNow = slides[sesi ? (sesi.slideAktif || 0) : 0] || null;
  const soalMateriNow = slideNow && slideNow.tipe === 'soal' ? daftarSoal[slideNow.soalIdx] : null;
  const soalBankNow = sesi && sesi.mode === 'bank' && sesi.soalAktif != null ? daftarSoal[sesi.soalAktif] : null;
  const soalNow = soalMateriNow || soalBankNow || null;
  const idxNow = soalMateriNow ? slideNow.soalIdx : (sesi ? sesi.soalAktif : null);

  const jwsNow = useMemo(() => (idxNow != null ? jawaban.filter((j) => j.soalIdx === idxNow) : []), [jawaban, idxNow]);
  const belum = peserta.filter((p) => !jwsNow.some((j) => j.siswaId === p.siswaId));
  const distribusi = useMemo(() => {
    if (!soalNow || !soalNow.kunci) return null;
    if (soalNow.kunci.tipe === 'pg') return (soalNow.pilihan || []).map((p, i) => ({ label: `${String.fromCharCode(65 + i)}. ${p}`, n: jwsNow.filter((j) => j.jawaban === i).length, benar: soalNow.kunci.pg === i }));
    if (soalNow.kunci.tipe === 'multi') return (soalNow.pilihan || []).map((p, i) => ({ label: p, n: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban.includes(i)).length, benar: (soalNow.kunci.multi || []).includes(i) }));
    return (soalNow.pernyataan || []).map((p, i) => ({ label: p, n: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban[i] === (soalNow.kunci.bs || [])[i]).length, nSalah: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban[i] !== undefined && j.jawaban[i] !== (soalNow.kunci.bs || [])[i]).length, benar: true }));
  }, [soalNow, jwsNow]);
  const maxN = distribusi ? Math.max(1, ...distribusi.map((d) => d.n + (d.nSalah || 0))) : 1;

  async function mulaiMateri(babItem) {
    const html = babItem.html || '';
    const soals = parseDaftarSoal(html);
    if (!soals.length) { alert('Bab ini tidak punya soal terparse.'); return; }
    const s = await buatSesi({ mode: 'materi', sumber: 'buku', bukuId, babId: babItem.id, guruId, daftarSoal: soals, catatan: babItem.judul || '' });
    setSesi({ id: s.id, kode: s.kode, mode: 'materi', sumber: 'buku', bukuId, babId: babItem.id, daftarSoal: soals, slideAktif: 0, soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0, status: 'aktif' });
    setBabHtml(html);
    setTahap('live');
  }

  async function mulaiBank() {
    if (!bankPick) return;
    const soals = bankPick.items.map((s) => {
      const tipe = /benar|salah/i.test(s.tipe || '') ? 'bs' : /kompleks|multi/i.test(s.tipe || '') ? 'multi' : 'pg';
      const kunci = tipe === 'pg' ? { tipe: 'pg', pg: typeof s.kunciJawaban === 'number' ? s.kunciJawaban : 0 }
        : tipe === 'multi' ? { tipe: 'multi', multi: Array.isArray(s.kunciJawaban) ? s.kunciJawaban : [] }
        : { tipe: 'bs', bs: Array.isArray(s.kunciJawaban) ? s.kunciJawaban : [] };
      return {
        idx: 0, nomor: String(s.nomor || ''), tipe, level: s.level || 'sedang', sumber: 'Bank Soal',
        teks: s.soal || s.teks_soal || s.teks || '', pilihan: s.opsiJawaban || s.pilihan || [],
        pernyataan: s.pernyataan || [], kunci, langkah: s.langkah || [], pembahasan: s.pembahasan || '',
      };
    });
    const s = await buatSesi({ mode: 'bank', sumber: 'bank', guruId, daftarSoal: soals, catatan: bankPick.materi });
    setSesi({ id: s.id, kode: s.kode, mode: 'bank', sumber: 'bank', daftarSoal: soals, slideAktif: 0, soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0, status: 'aktif' });
    setTahap('live');
  }

  const keSlide = (i) => ubahSesi(sesi.id, { slideAktif: Math.max(0, Math.min(slides.length - 1, i)), kunciTerbuka: false, langkahTerbuka: 0 });

  // ================= PILIH MODE =================
  if (tahap === 'mode') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>🔴 Mulai Sesi Kelas Live</h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>Pilih sumber sesi. Siswa bergabung lewat kode yang tampil di layar ini.</p>
        </div>
        <div style={S.modeGrid}>
          <button style={S.modeCard} onClick={() => setTahap('buku')}>
            <div style={{ fontSize: 26 }}>📖</div>
            <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 4px' }}>Materi Interaktif</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              Dari <b>bab buku digital</b>: slide materi tertata (rumus + gambar) seperti PPT,
              lalu di akhir slide ada <b>soal bab</b> yang dikerjakan siswa secara interaktif.
            </div>
          </button>
          <button style={S.modeCard} onClick={() => setTahap('bank')}>
            <div style={{ fontSize: 26 }}>✍️</div>
            <div style={{ fontSize: 15, fontWeight: 800, margin: '6px 0 4px' }}>Soal & Pembahasan</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              Dari <b>bank soal</b>: latihan terpantau saja. Siswa mengerjakan, guru memantau
              distribusi jawaban; <b>pembahasan disampaikan guru</b> secara lisan.
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ================= PILIH BUKU / BAB =================
  if (tahap === 'buku' || tahap === 'bab') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.row}>
            <button style={S.btn2} onClick={() => setTahap(tahap === 'bab' ? 'buku' : 'mode')}>⬅ Kembali</button>
            <span style={{ fontSize: 15, fontWeight: 800 }}>📖 {tahap === 'buku' ? 'Pilih Buku Digital' : 'Pilih Bab'}</span>
          </div>
          {tahap === 'buku' ? (
            <div style={S.modeGrid}>
              {bukuList.map((b) => (
                <button key={b.id} style={S.modeCard} onClick={() => { setBukuId(b.id); setTahap('bab'); }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{b.judul}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{b.mapel || 'Buku digital'}</div>
                </button>
              ))}
            </div>
          ) : (
            babList.map((x) => (
              <div key={x.id} style={S.babRow} onClick={() => mulaiMateri(x)}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{x.urutan ?? '•'}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{x.judul}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{x.html ? 'siap' : 'tanpa html'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ================= PILIH BANK SOAL =================
  if (tahap === 'bank') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.row}>
            <button style={S.btn2} onClick={() => setTahap('mode')}>⬅ Kembali</button>
            <span style={{ fontSize: 15, fontWeight: 800 }}>✍️ Pilih Paket Bank Soal</span>
          </div>
          {bankList.map((g) => (
            <div key={g.key} style={S.babRow} onClick={() => setBankPick(g)}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{g.materi}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{g.mapel} · {g.items.length} soal</span>
            </div>
          ))}
          {bankPick && (
            <button style={{ ...S.btnH, marginTop: 10 }} onClick={mulaiBank}>🚀 Mulai Sesi Soal ({bankPick.items.length} soal)</button>
          )}
        </div>
      </div>
    );
  }

  // ================= LIVE =================
  return (
    <div style={S.page}>
      <style>{CSS_MODUL}</style>
      <div style={S.card}>
        <div style={S.row}>
          <span style={S.kode}>{sesi.kode}</span>
          <span style={S.chip}>{sesi.mode === 'materi' ? '📖 Materi Interaktif' : '✍️ Soal & Pembahasan'}</span>
          <span style={S.chip}>👥 {peserta.length} siswa</span>
          {sesi.mode === 'materi' && slideNow && <span style={S.chip}>Slide {(sesi.slideAktif || 0) + 1}/{slides.length}</span>}
          {soalNow && <span style={S.chip}>✍️ Soal {idxNow + 1}/{daftarSoal.length}</span>}
          {sesi.kunciTerbuka && <span style={{ ...S.chip, background: '#dcfce7', color: '#166534' }}>🔓 kunci terbuka</span>}
          <span style={{ flex: 1 }} />
          <button style={S.btnR} onClick={async () => { if (window.confirm('Akhiri sesi?')) { await akhiriSesi(sesi.id); setTahap('mode'); setSesi(null); } }}>⏹ Akhiri</button>
        </div>
        {sesi.mode === 'materi' && (
          <div style={S.row}>
            <button style={S.btn2} disabled={(sesi.slideAktif || 0) <= 0} onClick={() => keSlide((sesi.slideAktif || 0) - 1)}>⬅ Slide</button>
            <button style={S.btn} disabled={(sesi.slideAktif || 0) >= slides.length - 1} onClick={() => keSlide((sesi.slideAktif || 0) + 1)}>Slide ➡</button>
            <select style={S.select} value={sesi.slideAktif || 0} onChange={(e) => keSlide(Number(e.target.value))}>
              {slides.map((sl, i) => (
                <option key={i} value={i}>{i + 1}. {sl.tipe === 'soal' ? `✍️ Soal ${sl.nomor}` : sl.tipe === 'cover' ? '🎯 Cover' : sl.tipe === 'refleksi' ? '💡 Refleksi' : sl.judul}</option>
              ))}
            </select>
          </div>
        )}
        {sesi.mode === 'bank' && (
          <div style={S.row}>
            <select style={S.select} value={sesi.soalAktif != null ? String(sesi.soalAktif) : ''} onChange={(e) => e.target.value !== '' && ubahSesi(sesi.id, { soalAktif: Number(e.target.value), kunciTerbuka: false, langkahTerbuka: 0 })}>
              <option value="">— pilih soal —</option>
              {daftarSoal.map((s, i) => <option key={i} value={i}>#{i + 1} ({s.tipe}) {String(s.teks).slice(0, 40)}</option>)}
            </select>
            {sesi.soalAktif != null && sesi.soalAktif < daftarSoal.length - 1 && (
              <button style={S.btn2} onClick={() => ubahSesi(sesi.id, { soalAktif: sesi.soalAktif + 1, kunciTerbuka: false, langkahTerbuka: 0 })}>➡ Soal Berikutnya</button>
            )}
          </div>
        )}
        {soalNow && (
          <div style={S.row}>
            {!sesi.kunciTerbuka && <button style={S.btnW} onClick={() => ubahSesi(sesi.id, { kunciTerbuka: true, langkahTerbuka: 1 })}>🔓 Buka Kunci ke Siswa</button>}
            {sesi.kunciTerbuka && <button style={S.btn2} onClick={() => ubahSesi(sesi.id, { kunciTerbuka: false, langkahTerbuka: 0 })}>🙈 Tutup Kunci</button>}
          </div>
        )}
      </div>

      <div style={S.grid2}>
        {/* ---- AREA PROYEKTOR ---- */}
        <div style={S.card}>
          {sesi.mode === 'materi' && slideNow && slideNow.tipe !== 'soal' && (
            <div style={S.slideBox}>
              {slideNow.tipe === 'cover' ? (
                <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: '#94a3b8', fontWeight: 800 }}>BAB · MATERI</div>
                  <h1 style={{ fontSize: 30, margin: '10px 0', color: '#fff' }}>{slideNow.judul}</h1>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {(slideNow.chips || []).map((c, i) => <span key={i} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '3px 12px', fontSize: 11 }}>{c}</span>)}
                  </div>
                </div>
              ) : (
                <div className="modmod" style={{ background: '#fff', borderRadius: 12, padding: 14 }} dangerouslySetInnerHTML={{ __html: slideNow.html }} />
              )}
            </div>
          )}
          {soalNow && (
            <div>
              <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{soalNow.teks}</div>
              {(soalNow.pilihan || []).map((p, i) => (
                <div key={i} style={S.opsi(sesi.kunciTerbuka && (soalNow.kunci.tipe === 'pg' ? soalNow.kunci.pg === i : (soalNow.kunci.tipe === 'multi' ? (soalNow.kunci.multi || []).includes(i) : false)))}>
                  <b>{String.fromCharCode(65 + i)}.</b> {p}
                </div>
              ))}
              {(soalNow.pernyataan || []).map((p, i) => (
                <div key={i} style={S.opsi(false)}>{i + 1}. {p}</div>
              ))}
              {sesi.mode === 'bank' && soalNow.pembahasan && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>🔒 Pembahasan (privat guru — sampaikan lisan)</summary>
                  <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#4c1d95', marginTop: 6 }}>{soalNow.pembahasan}</div>
                </details>
              )}
              {sesi.mode === 'materi' && soalNow.pembahasan && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: 'pointer', color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>🔒 Pembahasan modul (privat guru)</summary>
                  <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#4c1d95', marginTop: 6 }}>{soalNow.pembahasan}</div>
                </details>
              )}
            </div>
          )}
          {sesi.mode === 'materi' && !slideNow && <p style={{ fontSize: 12, color: '#64748b' }}>Memuat slide...</p>}
        </div>

        {/* ---- PANEL MONITOR ---- */}
        <div style={S.card}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>📡 Jawaban siswa real-time</h4>
          {!soalNow && <p style={{ fontSize: 12, color: '#64748b' }}>{sesi.mode === 'materi' ? 'Navigasi slide; saat slide soal tampil, jawaban siswa masuk ke sini.' : 'Pilih soal untuk ditayangkan.'}</p>}
          {soalNow && (
            <>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{jwsNow.length}/{peserta.length} menjawab • benar {jwsNow.filter((j) => j.benar).length}</div>
              {distribusi && distribusi.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, width: 160, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ ...S.bar, width: `${((d.n + (d.nSalah || 0)) / maxN) * 120}px`, background: d.benar ? '#16a34a' : '#94a3b8' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{d.nSalah ? `${d.n}✓/${d.nSalah}✗` : d.n}</span>
                </div>
              ))}
              {belum.length > 0 && <div style={{ fontSize: 11, color: '#f39c12', marginTop: 8 }}>Belum: {belum.map((p) => p.nama || p.siswaId).join(', ')}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}