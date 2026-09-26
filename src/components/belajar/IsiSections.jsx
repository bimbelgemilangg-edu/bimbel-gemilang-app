// src/components/belajar/IsiSections.jsx
// ============================================================
// RENDERER MATERI v3 — ROMBAKAN TOTAL UI/UX (Turn 86)
// Mobile-first premium: kartu membulat, poin bernomor, tabel berbingkai
// N-kolom + gulir, gambar kartu + lightbox, kartu RUMUS CARA GEMILANG
// berbingkai ungu-emas dengan interaksi buka-jurus, contoh terpecah
// langkah otomatis, zona berlatih interaktif.
// Dipakai: Reader siswa, Panggung guru, editor admin.
// ============================================================
import React from 'react';
import {
  Lightbulb, TriangleAlert, Info, Image as IconGambar, CheckCircle2, Zap,
  Map as IconMap, Crown, X,
} from 'lucide-react';
import { MathText, MathBlock } from '../MathText';
import bintangGemilang from '../../assets/bintang-gemilang.png';
import WidgetInteraktif, { JENIS_INTERAKTIF } from './WidgetInteraktif';
import { T, kotakRumus, kotakTips, kotakSukses } from '../../pages/student/belajar/tema';

export const URL_FRAME_CG =
  'https://hqoasblnrsijbflupoir.supabase.co/storage/v1/object/public/materi-bimbel/materi-v2/gambar-sumber/cara-gemilang-frame.png';

// ---------------- gaya premium ----------------
const KARTU = {
  background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 18,
  padding: '14px 16px', margin: '0 0 14px',
  boxShadow: '0 6px 18px rgba(15,23,42,.05)',
};
const S = {
  jangkar: { scrollMarginTop: 84 },
  subJudul: {
    display: 'flex', alignItems: 'center', gap: 8,
    margin: '26px 0 12px', fontSize: 17.5, fontWeight: 900, color: T.judul,
    letterSpacing: -0.2,
  },
  subHuruf: {
    background: T.biru, color: '#fff', borderRadius: 10,
    padding: '2px 9px', fontSize: 13, fontWeight: 900, fontStyle: 'normal',
  },
  paragraf: { margin: '0 0 13px', fontSize: 15.5, lineHeight: 1.9, color: T.teks },
  // kartu kilat
  kilatBox: {
    background: 'linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%)',
    border: '1.5px solid #93C5FD', borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px',
  },
  kilatJudul: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontWeight: 900, color: '#1D4ED8', fontSize: 13, marginBottom: 6,
  },
  // peta besar
  petaBox: {
    background: '#F8FAFC', border: `1.5px dashed #94A3B8`, borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px',
  },
  petaJudul: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontWeight: 900, color: '#334155', fontSize: 13, marginBottom: 6,
  },
  // gambar + lightbox
  gambarKartu: {
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 18,
    padding: 10, margin: '0 0 14px', boxShadow: '0 6px 18px rgba(15,23,42,.06)',
  },
  gambar: {
    width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block',
    borderRadius: 12, background: '#fff', cursor: 'zoom-in',
  },
  gambarKet: { textAlign: 'center', color: T.samar, fontSize: 12, lineHeight: 1.65, marginTop: 8 },
  gambarZoomHint: {
    textAlign: 'center', color: '#94A3B8', fontSize: 10.5, marginTop: 4,
  },
  lightbox: {
    position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(2,6,23,.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 18, cursor: 'zoom-out',
  },
  lightboxImg: { maxWidth: '100%', maxHeight: '88vh', objectFit: 'contain', borderRadius: 10 },
  lightboxTutup: {
    position: 'absolute', top: 14, right: 14, background: '#fff', color: '#0F172A',
    border: 'none', borderRadius: 999, padding: '8px 10px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12,
  },
  // poin bernomor
  poinBox: {
    background: '#F4F9FF', border: `1px solid ${T.kotakBiruGaris}`,
    borderLeft: '4px solid ' + T.biru, borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px',
  },
  poinJudul: { fontWeight: 900, fontSize: 13.5, color: T.biruDalam, marginBottom: 8 },
  poinItem: {
    display: 'flex', gap: 9, alignItems: 'flex-start',
    fontSize: 14, lineHeight: 1.7, color: T.teks, margin: '0 0 8px',
  },
  poinNomor: {
    flexShrink: 0, width: 22, height: 22, borderRadius: 999,
    background: T.biru, color: '#fff', fontSize: 11.5, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  // tabel premium N-kolom
  tabelWrap: {
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 16,
    padding: 8, margin: '0 0 14px', overflowX: 'auto',
    boxShadow: '0 6px 18px rgba(15,23,42,.05)',
  },
  tabelJudul: { fontWeight: 900, fontSize: 13.5, color: T.biruDalam, margin: '4px 6px 8px' },
  tabel: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13.5, minWidth: 420 },
  tabelTh: {
    background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', color: '#1E3A8A',
    textAlign: 'left', padding: '9px 10px', fontWeight: 900, fontSize: 12.5,
    borderBottom: `2px solid ${T.kotakBiruGaris}`,
  },
  tabelSel: {
    padding: '9px 10px', borderBottom: `1px solid #E2E8F0`,
    verticalAlign: 'top', lineHeight: 1.6,
  },
  // contoh langkah
  contohBox: {
    background: '#F4F9FF', border: `1px solid ${T.kotakBiruGaris}`, borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px',
  },
  contohJudul: {
    display: 'flex', alignItems: 'center', gap: 6, color: T.biruGelap,
    fontWeight: 900, fontSize: 13.5, marginBottom: 8,
  },
  langkahItem: { display: 'flex', gap: 9, alignItems: 'flex-start', margin: '0 0 8px' },
  langkahNomor: {
    flexShrink: 0, width: 24, height: 24, borderRadius: 10,
    background: '#fff', border: `2px solid ${T.biru}`, color: T.biruDalam,
    fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center',
    justifyContent: 'center',
  },
  langkahTeks: { fontSize: 14, lineHeight: 1.7, color: T.teks },
  // kartu Cara Gemilang (rumus) berbingkai ungu-emas + buka jurus
  cgBox: {
    position: 'relative', borderRadius: 22, margin: '0 0 16px',
    border: '3px solid #6D28D9', overflow: 'hidden',
    background: 'linear-gradient(160deg,#FFFDF7 0%,#FFF3D6 100%)',
    boxShadow: '0 12px 28px rgba(109,40,217,.2)',
  },
  cgFrame: { width: '100%', maxHeight: 110, objectFit: 'contain', display: 'block', background: 'transparent' },
  cgIsi: { padding: '4px 16px 16px' },
  cgJudul: {
    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    fontWeight: 900, color: '#5B21B6', fontSize: 15, marginBottom: 6,
  },
  cgRumus: {
    background: '#fff', border: '2px solid #F5C542', borderRadius: 14,
    padding: '10px 12px', color: '#6B4E00', fontWeight: 800, fontSize: 14,
    lineHeight: 1.6, textAlign: 'center', marginBottom: 8,
  },
  cgTombol: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    width: '100%', border: 'none', borderRadius: 12, padding: '10px 12px',
    background: '#6D28D9', color: '#fff', fontWeight: 900, fontSize: 13,
    cursor: 'pointer',
  },
  cgLangkah: {
    marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7,
  },
  cgLangkahItem: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: '#fff', border: '1.5px solid #E9D5FF', borderRadius: 12,
    padding: '8px 10px', fontSize: 13, lineHeight: 1.65, color: '#3B0764',
  },
  // callout lain
  infoBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px', color: '#1E3A8A',
    fontSize: 13.5, lineHeight: 1.7,
  },
  warnBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px', color: '#991B1B',
    fontSize: 13.5, lineHeight: 1.7,
  },
  tipsBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 16,
    padding: '12px 14px', margin: '0 0 14px', color: '#166534',
    fontSize: 13.5, lineHeight: 1.7,
  },
  guruBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: '#FFF6DE', border: '1px solid #F1E1AE', color: '#8A6D1A',
    borderRadius: 16, padding: '12px 14px', margin: '0 0 14px',
    fontSize: 13, lineHeight: 1.7,
  },
  // zona berlatih
  zonaBox: {
    background: '#F5F3FF', border: '2px solid #7C3AED', borderRadius: 18,
    padding: '14px 14px', margin: '0 0 16px',
  },
  zonaJudul: { fontWeight: 900, color: '#5B21B6', fontSize: 14, marginBottom: 4 },
  zonaKet: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  zonaSoal: {
    background: '#fff', border: '1px solid #DDD6FE', borderRadius: 14,
    padding: '10px 12px', marginBottom: 10,
  },
  zonaSoalTeks: { fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 },
  zonaOpsi: {
    textAlign: 'left', borderRadius: 12, padding: '9px 10px', fontSize: 13,
    border: '1px solid #E2E8F0', background: '#fff', marginBottom: 6,
    display: 'block', width: '100%',
  },
  zonaCek: {
    borderRadius: 12, padding: '8px 16px', border: 'none',
    background: '#7C3AED', color: '#fff', fontWeight: 900, fontSize: 12.5,
    cursor: 'pointer',
  },
  zonaHasil: { marginTop: 6, fontSize: 12.5, lineHeight: 1.65 },
};

// ---------------- komponen internal ----------------
function GambarKartu({ url, keterangan }) {
  const [zoom, setZoom] = React.useState(false);
  return (
    <div style={S.gambarKartu}>
      <img src={url} alt={keterangan || ''} style={S.gambar}
        loading="lazy" onClick={() => setZoom(true)} />
      {keterangan ? <div style={S.gambarKet}>{keterangan}</div> : null}
      <div style={S.gambarZoomHint}>ketuk gambar untuk memperbesar</div>
      {zoom && (
        <div style={S.lightbox} onClick={() => setZoom(false)}>
          <button type="button" style={S.lightboxTutup}><X size={14} /> Tutup</button>
          <img src={url} alt={keterangan || ''} style={S.lightboxImg} />
        </div>
      )}
    </div>
  );
}

function ContohLangkah({ teks }) {
  const bagian = String(teks || '').split(/(?=Langkah \d+)/);
  if (bagian.length <= 1) {
    return (
      <div style={S.contohBox}>
        <div style={S.contohJudul}><CheckCircle2 size={15} /> Contoh</div>
        <div style={{ fontSize: 14, lineHeight: 1.75, color: T.teks }}><MathText text={teks} /></div>
      </div>
    );
  }
  return (
    <div style={S.contohBox}>
      <div style={S.contohJudul}><CheckCircle2 size={15} /> Contoh terpecah langkah</div>
      {bagian.map((b, i) => (
        <div key={i} style={S.langkahItem}>
          <span style={S.langkahNomor}>{i + 1}</span>
          <span style={S.langkahTeks}><MathText text={b.trim()} /></span>
        </div>
      ))}
    </div>
  );
}

function KartuCG({ judul, teks, items }) {
  const [buka, setBuka] = React.useState(false);
  // Turn 89 (koreksi owner): frame maskot JADI PEMUNGKUS PATEN yang
  // meng-cover tulisan — rasio asli 3:2 dipertahankan (tanpa distorsi),
  // isi (judul+rumus+tombol) diletakkan DI DALAM panel putih frame
  // lewat inset persentase. Jurus langkah-demi-langkah mekar ke panel
  // tersambung di bawah frame supaya tulisan panjang tetap rapi.
  return (
    <div style={{ margin: '0 0 16px' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 2', minHeight: 210 }}>
        <img src={URL_FRAME_CG} alt="" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
        <div style={{
          position: 'absolute', inset: '29% 10% 13% 10%',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          justifyContent: 'center', gap: 7, textAlign: 'center', overflow: 'hidden',
        }}>
          <div style={{ ...S.cgJudul, marginBottom: 0, fontSize: 13.5 }}><Crown size={15} /> {judul || 'Cara Gemilang'}</div>
          {teks ? (
            <div style={{ ...S.cgRumus, marginBottom: 0, fontSize: 12.5, lineHeight: 1.55 }}>
              <MathText text={teks} />
            </div>
          ) : null}
          {(items || []).length ? (
            <button type="button" style={{ ...S.cgTombol, padding: '8px 10px', fontSize: 12 }}
              onClick={() => setBuka((v) => !v)}>
              <Zap size={14} /> {buka ? 'Tutup jurus langkah-demi-langkah' : 'Buka jurus langkah-demi-langkah'}
            </button>
          ) : null}
        </div>
      </div>
      {buka && (items || []).length ? (
        <div style={{
          background: '#fff', border: '3px solid #6D28D9', borderTop: 'none',
          borderRadius: '0 0 18px 18px', padding: '12px 14px 14px', marginTop: -4,
          boxShadow: '0 12px 24px rgba(109,40,217,.16)',
        }}>
          <div style={{ fontWeight: 900, color: '#5B21B6', fontSize: 12.5, marginBottom: 8 }}>
            ⚡ Jurus langkah-demi-langkah
          </div>
          <div style={S.cgLangkah}>
            {(items || []).map((it, i) => (
              <div key={i} style={S.cgLangkahItem}>
                <span style={{ ...S.poinNomor, background: '#6D28D9' }}>{i + 1}</span>
                <span><MathText text={it} /></span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ZonaBerlatih({ sec }) {
  const [pil, setPil] = React.useState({});
  const [cek, setCek] = React.useState({});
  const soalList = sec.items || [];
  return (
    <div style={S.zonaBox}>
      <div style={S.zonaJudul}>🎮 Zona Berlatih • {soalList.length} soal pemanasan</div>
      <div style={S.zonaKet}>Pilih jawaban lalu tekan Cek — kunci terbuka per soal setelah dicek.</div>
      {soalList.map((q, qi) => {
        const sudah = !!cek[qi];
        const benar = sudah && Number(pil[qi]) === Number(q.jawaban);
        return (
          <div key={qi} style={S.zonaSoal}>
            <div style={S.zonaSoalTeks}>{qi + 1}. {q.soal}</div>
            {(q.opsi || []).map((op, oi) => (
              <button key={oi} type="button" disabled={sudah}
                onClick={() => setPil((o) => ({ ...o, [qi]: oi }))}
                style={{
                  ...S.zonaOpsi,
                  cursor: sudah ? 'default' : 'pointer',
                  border: sudah && oi === Number(q.jawaban) ? '2px solid #16A34A'
                    : sudah && pil[qi] === oi ? '2px solid #DC2626' : '1px solid #E2E8F0',
                  background: sudah && oi === Number(q.jawaban) ? '#ECFDF5'
                    : sudah && pil[qi] === oi ? '#FEF2F2' : '#fff',
                }}>
                {String.fromCharCode(65 + oi)}. {op}
              </button>
            ))}
            {!sudah ? (
              <button type="button" style={{ ...S.zonaCek, opacity: pil[qi] == null ? .5 : 1 }}
                disabled={pil[qi] == null}
                onClick={() => setCek((o) => ({ ...o, [qi]: true }))}>
                ✔ Cek jawaban
              </button>
            ) : (
              <div style={{ ...S.zonaHasil, color: benar ? '#15803D' : '#B91C1C' }}>
                {benar ? '✅ Benar! ' : '❌ Belum tepat. '}{q.pembahasan || ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TabelPremium({ sec }) {
  const kolom = (sec.kolom || ['Istilah/Komponen', 'Keterangan']);
  const pasangan = (r) => (Array.isArray(r) ? r
    : (Array.isArray(r && r.s) ? r.s
      : (r && r.k !== undefined ? [r.k, r.v, r.w, r.x, r.y] : [r && r.a, r && r.b])));
  const nKol = Math.max(2, kolom.length);
  return (
    <div style={S.tabelWrap}>
      {sec.judul ? <div style={S.tabelJudul}>📊 {sec.judul}</div> : null}
      <table style={S.tabel}>
        <thead>
          <tr>{kolom.map((k) => <th key={k} style={S.tabelTh}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {(sec.rows || []).map((r0, k) => {
            const r2 = pasangan(r0);
            return (
              <tr key={k} style={{ background: k % 2 ? '#F8FAFC' : '#fff' }}>
                {Array.from({ length: nKol }).map((_, ci) => (
                  <td key={ci} style={S.tabelSel}>
                    <MathText text={r2[ci] !== undefined ? r2[ci] : '-'} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- renderer utama ----------------
export default function IsiSections({ sections = [], offsetHuruf = 0, untukGuru = false }) {
  let huruf = offsetHuruf;
  return (
    <>
      {sections.map((sec, i) => {
        const jenis = sec.jenis || 'paragraf';
        if (jenis === 'judul') {
          huruf += 1;
          const hrf = String.fromCharCode(64 + huruf);
          return (
            <h3 key={i} id={`sec-${i}`} style={{ ...S.subJudul, ...S.jangkar }}>
              <span style={S.subHuruf}>{hrf}</span>
              <span style={{ flex: 1 }}>{sec.teks}</span>
            </h3>
          );
        }
        if (jenis === 'kilat') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.kilatBox, ...S.jangkar }}>
              <div style={S.kilatJudul}><Zap size={15} /> Konsep Kilat 60 detik</div>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: '#0F172A' }}>
                <MathText text={sec.teks} />
              </div>
            </div>
          );
        }
        if (jenis === 'peta') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.petaBox, ...S.jangkar }}>
              <div style={S.petaJudul}><IconMap size={15} /> Peta Besar</div>
              <div style={{ fontSize: 14, lineHeight: 1.75, color: T.teks }}>
                <MathText text={sec.teks} />
              </div>
              {sec.url ? <div style={{ marginTop: 10 }}><GambarKartu url={sec.url} keterangan={sec.keterangan} /></div> : null}
            </div>
          );
        }
        if (jenis === 'paragraf') {
          return (
            <p key={i} id={`sec-${i}`} style={{ ...S.paragraf, ...S.jangkar }}>
              <MathText text={sec.teks} />
            </p>
          );
        }
        if (jenis === 'gambar') {
          return (
            <div key={i} id={`sec-${i}`} style={S.jangkar}>
              <GambarKartu url={sec.url} keterangan={sec.keterangan} />
            </div>
          );
        }
        if (jenis === 'poin') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.poinBox, ...S.jangkar }}>
              {sec.judul ? <div style={S.poinJudul}>📌 {sec.judul}</div> : null}
              {(sec.items || []).map((it, k) => (
                <div key={k} style={S.poinItem}>
                  <span style={S.poinNomor}>{k + 1}</span>
                  <span style={{ flex: 1 }}><MathText text={it} /></span>
                </div>
              ))}
            </div>
          );
        }
        if (jenis === 'tabelinfo') return <div key={i} id={`sec-${i}`} style={S.jangkar}><TabelPremium sec={sec} /></div>;
        if (jenis === 'contoh') return <div key={i} id={`sec-${i}`} style={S.jangkar}><ContohLangkah teks={sec.teks} /></div>;
        if (jenis === 'caraGemilang') {
          return <div key={i} id={`sec-${i}`} style={S.jangkar}><KartuCG judul={sec.judul} teks={sec.teks} items={sec.items} /></div>;
        }
        if (jenis === 'zona') return <div key={i} id={`sec-${i}`} style={S.jangkar}><ZonaBerlatih sec={sec} /></div>;
        // 🔥 MATERI INTERAKTIF (Turn 87): jodohMini, isianRumpang, flashcard,
        // urutan, benarSalah, video — semua dirender widget bersama.
        if (JENIS_INTERAKTIF.has(jenis)) {
          return <div key={i} id={`sec-${i}`} style={S.jangkar}><WidgetInteraktif widget={sec} /></div>;
        }
        if (jenis === 'alur') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.poinBox, ...S.jangkar, background: '#F4F9FF' }}>
              {sec.judul ? <div style={S.poinJudul}>🧭 {sec.judul}</div> : null}
              {(sec.items || []).map((it, k) => (
                <div key={k} style={S.langkahItem}>
                  <span style={S.langkahNomor}>{k + 1}</span>
                  <span style={S.langkahTeks}><MathText text={it} /></span>
                </div>
              ))}
            </div>
          );
        }
        if (jenis === 'istilah') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.poinBox, ...S.jangkar, background: '#F8FAFC' }}>
              <div style={S.poinJudul}>📖 Kamus mini istilah</div>
              {(sec.items || []).map((it, k) => {
                const kk = Array.isArray(it) ? { k: it[0], v: it[1] } : it;
                return (
                  <div key={k} style={{ ...S.poinItem }}>
                    <span style={{ ...S.poinNomor, background: '#334155' }}>{String(kk.k || '').charAt(0)}</span>
                    <span style={{ flex: 1 }}><b>{kk.k}</b>: <MathText text={kk.v} /></span>
                  </div>
                );
              })}
            </div>
          );
        }
        if (jenis === 'callout') {
          const tipe = String(sec.tipe || 'info');
          if (tipe === 'gemilang') {
            return (
              <div key={i} id={`sec-${i}`} style={S.jangkar}>
                <KartuCG judul={sec.judul} teks={sec.teks} items={sec.items} />
              </div>
            );
          }
          if (tipe === 'guru' && !untukGuru) return null;
          const st = tipe === 'peringatan' ? S.warnBox : tipe === 'tips' ? S.tipsBox : tipe === 'guru' ? S.guruBox : S.infoBox;
          const Ikon = tipe === 'peringatan' ? TriangleAlert : tipe === 'tips' ? Lightbulb : Info;
          return (
            <div key={i} id={`sec-${i}`} style={{ ...st, ...S.jangkar }}>
              <Ikon size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ flex: 1 }}>
                {sec.judul ? <b>{sec.judul}: </b> : null}
                <MathText text={sec.teks} />
              </span>
            </div>
          );
        }
        if (jenis === 'rumus') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.jangkar, ...kotakRumus }}>
              {sec.latex ? <MathBlock latex={sec.latex} /> : <MathText text={sec.teks} />}
            </div>
          );
        }
        return (
          <p key={i} id={`sec-${i}`} style={{ ...S.paragraf, ...S.jangkar }}>
            <MathText text={sec.teks} />
          </p>
        );
      })}
    </>
  );
}
