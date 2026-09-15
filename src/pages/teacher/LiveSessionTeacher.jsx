// src/pages/teacher/LiveSessionTeacher.jsx
// REWRITE: sumber sesi = BAB BUKU DIGITAL (bukan bank_soal).
// Alur: pilih bab -> terangkan materi (proyektor) -> mulai latihan
// interaktif (kode ke proyektor) -> tayang soal lockstep -> buka kunci/
// langkah sambil dibahas -> rekap per soal.
import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { parseDaftarSoal } from '../../utils/parseSoal';
import RendererHtmlBab from '../../components/buku/RendererHtmlBab';
import {
  buatSesi, dengarSesi, dengarPeserta, dengarJawaban, ubahSesi, akhiriSesi,
} from '../../services/sesiService';

const S = {
  page: { maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' },
  card: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  select: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '9px 11px', fontSize: 13, background: '#fff', minWidth: 220 },
  btn: { background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnH: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnW: { background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnR: { background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btn2: { background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  kode: { fontSize: 34, fontWeight: 900, letterSpacing: 6, color: '#4338ca', background: '#eef2ff', border: '2px dashed #a5b4fc', borderRadius: 12, padding: '10px 24px' },
  chip: { background: '#eef2ff', color: '#4338ca', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 },
  bukuCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, cursor: 'pointer', textAlign: 'left' },
  babRow: { display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' },
  bar: { height: 12, borderRadius: 6, minWidth: 3, background: '#3498db' },
  opsi: (k) => ({ padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: k ? '#f0fdf4' : '#f8fafc', fontSize: 13, marginBottom: 6 }),
};

export default function LiveSessionTeacher() {
  const [tahap, setTahap] = useState('pilih'); // pilih | materi | live
  const [bukuList, setBukuList] = useState([]);
  const [bukuId, setBukuId] = useState('');
  const [babList, setBabList] = useState([]);
  const [bab, setBab] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState([]);
  const [jawaban, setJawaban] = useState([]);
  const [tab, setTab] = useState('soal');

  useEffect(() => {
    (async () => {
      try {
        const sn = await getDocs(collection(db, 'buku_digital'));
        setBukuList(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
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
      } catch (e) { console.error(e); }
    })();
  }, [bukuId]);

  useEffect(() => {
    if (!sesi) return undefined;
    const u1 = dengarSesi(sesi.id, (s) => { if (s) setSesi(s); });
    const u2 = dengarPeserta(sesi.id, setPeserta);
    const u3 = dengarJawaban(sesi.id, setJawaban);
    return () => { u1(); u2(); u3(); };
  }, [sesi && sesi.id]);

  const guruId = (() => {
    try { const t = JSON.parse(localStorage.getItem('teacherData') || '{}'); return t.guruId || t.id || ''; } catch { return ''; }
  })();

  async function bukaBab(item) {
    setBab(item);
    setSoalList(parseDaftarSoal(item.html || ''));
    setTahap('materi');
  }

  async function mulaiLatihan() {
    if (!soalList.length) { alert('Bab ini tidak punya soal terparse.'); return; }
    const s = await buatSesi({
      bukuId, babId: bab.id, guruId,
      catatan: bab.judul || '', soalPrioritas: [],
    });
    // simpan daftarSoal ke dokumen sesi supaya siswa & rekap konsisten
    await ubahSesi(s.id, { daftarSoal: soalList, materiJudul: bab.judul || '' });
    setSesi({ id: s.id, kode: s.kode, status: 'aktif', fase: 'soal', soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0, daftarSoal: soalList });
    setTahap('live');
  }

  const idx = sesi ? sesi.soalAktif : null;
  const soalNow = idx != null ? (sesi.daftarSoal || soalList)[idx] : null;
  const jwsNow = useMemo(() => (idx != null ? jawaban.filter((j) => j.soalIdx === idx) : []), [jawaban, idx]);
  const belum = peserta.filter((p) => !jwsNow.some((j) => j.siswaId === p.siswaId));

  const distribusi = useMemo(() => {
    if (!soalNow || !soalNow.kunci) return null;
    if (soalNow.kunci.tipe === 'pg') {
      return (soalNow.pilihan || []).map((p, i) => ({
        label: `${String.fromCharCode(65 + i)}. ${p}`,
        n: jwsNow.filter((j) => j.jawaban === i).length,
        benar: soalNow.kunci.pg === i,
      }));
    }
    if (soalNow.kunci.tipe === 'multi') {
      return (soalNow.pilihan || []).map((p, i) => ({
        label: p,
        n: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban.includes(i)).length,
        benar: (soalNow.kunci.multi || []).includes(i),
      }));
    }
    return (soalNow.pernyataan || []).map((p, i) => ({
      label: p,
      n: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban[i] === (soalNow.kunci.bs || [])[i]).length,
      nSalah: jwsNow.filter((j) => Array.isArray(j.jawaban) && j.jawaban[i] !== undefined && j.jawaban[i] !== (soalNow.kunci.bs || [])[i]).length,
      benar: true,
    }));
  }, [soalNow, jwsNow]);
  const maxN = distribusi ? Math.max(1, ...distribusi.map((d) => d.n + (d.nSalah || 0))) : 1;

  // ---------- TAHAP PILIH ----------
  if (tahap === 'pilih') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 10px' }}>📚 Pilih Bab Buku Digital untuk Sesi Kelas</h3>
          {!bukuId ? (
            <div style={S.grid}>
              {bukuList.map((b) => (
                <button key={b.id} style={S.bukuCard} onClick={() => setBukuId(b.id)}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{b.judul}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{b.mapel || 'Buku digital'}</div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button style={S.btn2} onClick={() => setBukuId('')}>⬅ Pilih buku lain</button>
              <div style={{ marginTop: 10 }}>
                {babList.map((x) => (
                  <div key={x.id} style={S.babRow} onClick={() => bukaBab(x)}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: '#ede9fe', color: '#5b21b6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{x.urutan ?? '•'}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{x.judul}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{x.html ? 'siap' : 'tanpa html'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- TAHAP MATERI (menerangkan di proyektor) ----------
  if (tahap === 'materi') {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.row}>
            <button style={S.btn2} onClick={() => setTahap('pilih')}>⬅ Ganti bab</button>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>📖 {bab.judul}</span>
            <button style={S.btnH} onClick={mulaiLatihan}>▶ Mulai Latihan Interaktif</button>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Terangkan materi di bawah ini lewat proyektor. Setelah selesai, tekan
            "Mulai Latihan Interaktif" — kode sesi akan muncul besar untuk dimasukkan siswa.
          </p>
        </div>
        <div style={S.card}>
          <RendererHtmlBab html={bab.html} babId={bab.id} bukuId={bukuId} modePresentasi />
        </div>
      </div>
    );
  }

  // ---------- TAHAP LIVE ----------
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.row}>
          <span style={S.kode}>{sesi.kode}</span>
          <span style={S.chip}>👥 {peserta.length} siswa</span>
          <span style={S.chip}>{idx != null ? `✍️ Soal ${idx + 1}/${(sesi.daftarSoal || []).length}` : '📖 siap tayang'}</span>
          {sesi.kunciTerbuka && <span style={{ ...S.chip, background: '#dcfce7', color: '#166534' }}>🔓 kunci terbuka</span>}
          <span style={{ flex: 1 }} />
          <button style={S.btnR} onClick={async () => { if (window.confirm('Akhiri sesi?')) { await akhiriSesi(sesi.id); setTahap('pilih'); setSesi(null); } }}>⏹ Akhiri</button>
        </div>
        <div style={S.row}>
          <select
            style={S.select}
            value={idx != null ? String(idx) : ''}
            onChange={(e) => e.target.value !== '' && ubahSesi(sesi.id, { soalAktif: Number(e.target.value), tahap: 'soal', kunciTerbuka: false, langkahTerbuka: 0 })}
          >
            <option value="">— pilih soal untuk ditayangkan —</option>
            {(sesi.daftarSoal || []).map((s, i) => (
              <option key={i} value={i}>#{s.nomor} ({s.tipe}) {s.teks.slice(0, 40)}</option>
            ))}
          </select>
          {idx != null && !sesi.kunciTerbuka && (
            <button style={S.btnW} onClick={() => ubahSesi(sesi.id, { kunciTerbuka: true, langkahTerbuka: 1 })}>🔓 Buka Kunci</button>
          )}
          {sesi.kunciTerbuka && (
            <button style={S.btn} onClick={() => ubahSesi(sesi.id, { langkahTerbuka: (sesi.langkahTerbuka || 1) + 1 })}>▸ Langkah Berikutnya</button>
          )}
          {sesi.kunciTerbuka && (
            <button style={S.btn2} onClick={() => ubahSesi(sesi.id, { kunciTerbuka: false, langkahTerbuka: 0 })}>🙈 Tutup Kunci</button>
          )}
          {idx != null && idx < (sesi.daftarSoal || []).length - 1 && (
            <button style={S.btn2} onClick={() => ubahSesi(sesi.id, { soalAktif: idx + 1, kunciTerbuka: false, langkahTerbuka: 0 })}>➡ Soal Berikutnya</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 12 }}>
        <div style={S.card}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Soal yang sedang tayang</h4>
          {!soalNow && <p style={{ fontSize: 12, color: '#64748b' }}>Pilih soal di atas untuk ditayangkan ke siswa.</p>}
          {soalNow && (
            <>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>{soalNow.teks}</div>
              {(soalNow.pilihan || []).map((p, i) => (
                <div key={i} style={S.opsi(sesi.kunciTerbuka && (soalNow.kunci.tipe === 'pg' ? soalNow.kunci.pg === i : (soalNow.kunci.tipe === 'multi' ? (soalNow.kunci.multi || []).includes(i) : false)))}>
                  <b>{String.fromCharCode(65 + i)}.</b> {p}
                </div>
              ))}
              {(soalNow.pernyataan || []).map((p, i) => (
                <div key={i} style={S.opsi(false)}>{i + 1}. {p}</div>
              ))}
              {sesi.kunciTerbuka && soalNow.pembahasan && (
                <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#4c1d95', marginTop: 8 }}>
                  💡 {soalNow.pembahasan.slice(0, 600)}
                </div>
              )}
            </>
          )}
        </div>
        <div style={S.card}>
          <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>📡 Jawaban siswa real-time</h4>
          {!soalNow && <p style={{ fontSize: 12, color: '#64748b' }}>Menunggu soal ditayangkan.</p>}
          {soalNow && (
            <>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                {jwsNow.length}/{peserta.length} menjawab • benar {jwsNow.filter((j) => j.benar).length}
              </div>
              {distribusi && distribusi.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, width: 170, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                  <div style={{ ...S.bar, width: `${((d.n + (d.nSalah || 0)) / maxN) * 130}px`, background: d.benar ? '#16a34a' : '#94a3b8' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{d.nSalah ? `${d.n}✓/${d.nSalah}✗` : d.n}</span>
                </div>
              ))}
              {belum.length > 0 && (
                <div style={{ fontSize: 11, color: '#f39c12', marginTop: 8 }}>Belum: {belum.map((p) => p.nama || p.siswaId).join(', ')}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}