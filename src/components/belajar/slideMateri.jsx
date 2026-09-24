// src/components/belajar/slideMateri.jsx
// ============================================================
// MODE PPT (Turn 77): generator slide dari sections materi v2 +
// renderer slide besar untuk panggung guru & layar siswa yang
// mengikuti sesi. Bacaan diubah menjadi slide: judul besar, satu
// gagasan per slide, gambar tampil utuh rapi beserta caption-nya.
// ============================================================
import React from 'react';
import { MathText } from '../MathText';
import { T } from '../../pages/student/belajar/tema';

/** Susun sections menjadi daftar slide.
 *  Aturan: judul = slide judul; gambar = slide gambar utuh;
 *  poin/tabelinfo/callout/contoh = slide sendiri;
 *  paragraf digabung maksimal 2 per slide agar tidak padat. */
export function buatSlide(sections = []) {
  const slides = [];
  let buf = [];
  const flush = () => {
    if (buf.length) { slides.push({ t: 'teks', paras: buf }); buf = []; }
  };
  sections.forEach((s) => {
    const j = s.jenis || 'paragraf';
    if (j === 'judul') { flush(); slides.push({ t: 'judul', teks: s.teks }); }
    else if (j === 'gambar') { flush(); slides.push({ t: 'gambar', url: s.url, keterangan: s.keterangan }); }
    else if (j === 'poin') { flush(); slides.push({ t: 'poin', judul: s.judul, items: s.items || [] }); }
    else if (j === 'tabelinfo') { flush(); slides.push({ t: 'tabel', judul: s.judul, kolom: s.kolom || [], rows: s.rows || [] }); }
    else if (j === 'callout') { flush(); slides.push({ t: 'callout', tipe: s.tipe, judul: s.judul, teks: s.teks }); }
    else if (j === 'contoh') { flush(); slides.push({ t: 'contoh', teks: s.teks }); }
    else if (j === 'alur') { flush(); slides.push({ t: 'poin', judul: s.judul, items: s.items || [] }); }
    else if (j === 'istilah') {
      flush();
      slides.push({
        t: 'poin', judul: s.judul || 'Kamus mini istilah',
        items: (s.items || []).map((it) => `${it.k}: ${it.v}`),
      });
    } else {
      buf.push(s.teks || '');
      if (buf.length >= 2) flush();
    }
  });
  flush();
  return slides;
}

const WRAP = {
  background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 18,
  padding: '26px 26px 22px', minHeight: 320, boxShadow: '0 10px 30px rgba(15,23,42,.06)',
};
const JUD = { fontSize: 26, lineHeight: 1.3, fontWeight: 900, color: T.judul, margin: 0 };
const PAR = { fontSize: 16.5, lineHeight: 1.8, color: T.teks, margin: '0 0 12px' };
const KET = { fontSize: 12.5, lineHeight: 1.6, color: T.samar, marginTop: 10 };

export function SlideView({ slide }) {
  if (!slide) return <div style={WRAP}>Slide tidak tersedia.</div>;
  if (slide.t === 'judul') {
    return (
      <div style={{ ...WRAP, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(135deg,#EAF5FF 0%,#FFFFFF 70%)' }}>
        <h2 style={{ ...JUD, fontSize: 30 }}>{slide.teks}</h2>
      </div>
    );
  }
  if (slide.t === 'gambar') {
    return (
      <div style={WRAP}>
        <img src={slide.url} alt={slide.keterangan || ''}
          style={{ display: 'block', width: '100%', maxHeight: 430, objectFit: 'contain', background: '#fff', borderRadius: 12 }} />
        {slide.keterangan ? <div style={KET}>{slide.keterangan}</div> : null}
      </div>
    );
  }
  if (slide.t === 'poin') {
    return (
      <div style={WRAP}>
        {slide.judul ? <h3 style={{ ...JUD, fontSize: 20, marginBottom: 12 }}>{slide.judul}</h3> : null}
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(slide.items || []).map((it, i) => (
            <li key={i} style={{ fontSize: 16, lineHeight: 1.7, color: T.teks }}><MathText text={it} /></li>
          ))}
        </ul>
      </div>
    );
  }
  if (slide.t === 'tabel') {
    return (
      <div style={WRAP}>
        {slide.judul ? <h3 style={{ ...JUD, fontSize: 20, marginBottom: 12 }}>📊 {slide.judul}</h3> : null}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5 }}>
            <thead>
              <tr>
                {(slide.kolom || []).map((k) => (
                  <th key={k} style={{ border: `1px solid ${T.garis}`, padding: '8px 10px', background: T.latar, textAlign: 'left' }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(slide.rows || []).map((r, i) => (
                <tr key={i}>
                  {(slide.kolom || []).map((k, c) => (
                    <td key={c} style={{ border: `1px solid ${T.garis}`, padding: '8px 10px', verticalAlign: 'top' }}>
                      <MathText text={r[['k', 'v', 'w', 'x', 'y'][c]] || ''} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (slide.t === 'callout') {
    const warna = slide.tipe === 'gemilang' ? T.amberLatar
      : slide.tipe === 'peringatan' ? T.merahLatar : T.kotakBiru;
    return (
      <div style={{ ...WRAP, background: warna }}>
        {slide.judul ? <h3 style={{ ...JUD, fontSize: 18, marginBottom: 8 }}>{slide.judul}</h3> : null}
        <p style={{ ...PAR, margin: 0 }}><MathText text={slide.teks} /></p>
      </div>
    );
  }
  if (slide.t === 'contoh') {
    return (
      <div style={{ ...WRAP, background: '#F4F9FF' }}>
        <h3 style={{ ...JUD, fontSize: 18, marginBottom: 8 }}>✍️ Contoh terpecah langkah</h3>
        <p style={{ ...PAR, margin: 0 }}><MathText text={slide.teks} /></p>
      </div>
    );
  }
  return (
    <div style={WRAP}>
      {(slide.paras || []).map((p, i) => <p key={i} style={PAR}><MathText text={p} /></p>)}
    </div>
  );
}
