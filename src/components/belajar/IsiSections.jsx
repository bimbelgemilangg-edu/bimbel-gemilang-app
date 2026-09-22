// src/components/belajar/IsiSections.jsx
// ============================================================
// Renderer sections materi v2 -- DIPAKAI BERSAMA oleh:
//   1. Reader siswa (BelajarReader.jsx)
//   2. Panggung Presentasi guru (PanggungPresentasi.jsx)
// Satu sumber kebenaran tampilan konten supaya layar siswa dan
// proyektor guru selalu identik (prinsip sinkron Fase 3).
// ============================================================
import React from 'react';
import {
  Lightbulb, TriangleAlert, Info, Image as IconGambar, CheckCircle2, Zap,
} from 'lucide-react';
import { MathText, MathBlock } from '../MathText';
import { T, kotakRumus, kotakTips, kotakSukses } from '../../pages/student/belajar/tema';

export default function IsiSections({ sections, offsetHuruf = 0 }) {
  return (
    <>
      {sections.map((sec, i) => {
        const jenis = String(sec?.jenis || 'paragraf');
        if (jenis === 'judul') {
          const sebelum = sections
            .slice(0, i)
            .filter((s) => String(s.jenis || 'paragraf') === 'judul').length;
          const label = String.fromCharCode(65 + offsetHuruf + sebelum);
          return (
            <h3 key={i} id={`sec-${i}`} style={{ ...S.subJudul, ...S.jangkar }}>
              <span style={S.subHuruf}>{label}.</span> <MathText text={sec.teks} />
            </h3>
          );
        }
        if (jenis === 'paragraf') {
          return <p key={i} id={`sec-${i}`} style={{ ...S.paragraf, ...S.jangkar }}><MathText text={sec.teks} /></p>;
        }
        if (jenis === 'rumus') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...kotakRumus, ...S.jangkar }}>
              <MathBlock text={sec.latex || sec.teks || ''} />
            </div>
          );
        }
        if (jenis === 'callout') {
          const tipe = String(sec.tipe || 'info');
          const gaya = tipe === 'tips' ? kotakTips
            : tipe === 'peringatan'
              ? { ...kotakTips, background: T.merahLatar, borderColor: T.merahGaris, color: '#B91C1C' }
              : tipe === 'gemilang'
                ? {
                  ...kotakTips, background: T.gradasiHero, borderColor: 'transparent',
                  color: '#fff', boxShadow: '0 8px 20px rgba(14,122,212,.28)',
                }
                : { ...kotakTips, background: T.kotakBiru, borderColor: T.kotakBiruGaris, color: T.biruDalam };
          const ikon = tipe === 'tips' ? <Lightbulb size={14} />
            : tipe === 'peringatan' ? <TriangleAlert size={14} />
              : tipe === 'gemilang' ? <Zap size={14} fill="currentColor" /> : <Info size={14} />;
          return (
            <div key={i} id={`sec-${i}`} style={{ ...gaya, ...S.jangkar }}>
              {ikon}
              <span>
                {sec.judul ? <b>{sec.judul}: </b> : null}
                <MathText text={sec.teks} />
              </span>
            </div>
          );
        }
        if (jenis === 'contoh') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.contohBox, ...S.jangkar }}>
              <div style={S.contohJudul}>
                <CheckCircle2 size={14} /> {sec.judul || 'Contoh'}
              </div>
              <p style={{ ...S.paragraf, margin: 0 }}><MathText text={sec.teks} /></p>
              {sec.pembahasan && (
                <div style={kotakSukses}>
                  <Lightbulb size={14} /> <span>{sec.pembahasan}</span>
                </div>
              )}
            </div>
          );
        }
        if (jenis === 'gambar') {
          return (
            <figure key={i} id={`sec-${i}`} style={{ margin: '0 0 16px', ...S.jangkar }}>
              {sec.url
                ? <img src={sec.url} alt={sec.keterangan || ''} style={S.gambar} loading="lazy" />
                : (
                  <div style={S.gambarKosong}>
                    <IconGambar size={22} /> Gambar menyusul
                  </div>
                )}
              {sec.keterangan && <figcaption style={S.gambarKet}>{sec.keterangan}</figcaption>}
            </figure>
          );
        }
        if (jenis === 'langkah') {
          return (
            <div key={i} id={`sec-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 16px', ...S.jangkar }}>
              {(sec.items || []).map((it, j) => (
                <div key={j} style={S.langkahItem}>
                  <span style={S.langkahNomor}>{j + 1}</span>
                  <span style={{ flex: 1 }}><MathText text={it} /></span>
                </div>
              ))}
            </div>
          );
        }
        return <p key={i} id={`sec-${i}`} style={{ ...S.paragraf, ...S.jangkar }}><MathText text={sec.teks} /></p>;
      })}
    </>
  );
}

const S = {
  jangkar: { scrollMarginTop: 76 },
  subJudul: {
    display: 'flex', alignItems: 'baseline', gap: 7,
    margin: '22px 0 8px', fontSize: 15.5, fontWeight: 800, color: T.judul,
  },
  subHuruf: { color: T.biru, fontStyle: 'italic' },
  paragraf: { margin: '0 0 13px', fontSize: 14, lineHeight: 1.85, color: T.teks },
  contohBox: {
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 12, padding: '13px 15px', margin: '0 0 15px',
  },
  contohJudul: {
    display: 'flex', alignItems: 'center', gap: 6, color: T.biruGelap,
    fontWeight: 800, fontSize: 12.5, marginBottom: 7,
  },
  gambar: { width: '100%', borderRadius: 12, display: 'block' },
  gambarKosong: {
    display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
    background: T.latar, border: `1px dashed ${T.garis}`, borderRadius: 12,
    color: T.samar, padding: 26, fontSize: 12.5,
  },
  gambarKet: { textAlign: 'center', color: T.samar, fontSize: 11.5, marginTop: 6 },
  langkahItem: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    fontSize: 13.5, lineHeight: 1.65, color: T.teks,
  },
  langkahNomor: {
    width: 24, height: 24, borderRadius: '50%', background: T.biru,
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0,
  },
};
