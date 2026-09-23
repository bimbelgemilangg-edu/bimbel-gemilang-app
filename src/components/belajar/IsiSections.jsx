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
import bintangGemilang from '../../assets/bintang-gemilang.png';
import { T, kotakRumus, kotakTips, kotakSukses } from '../../pages/student/belajar/tema';

// banyak judul level-1 sebelum indeks i (untuk penomoran A.1, A.2, ...)
function jumlahL1Sebelum(sections, i) {
  return sections
    .slice(0, i)
    .filter((x) => String(x.jenis || 'paragraf') === 'judul'
      && Number(x.level || 1) === 1).length;
}

export default function IsiSections({
  sections, offsetHuruf = 0, untukGuru = false,
}) {
  return (
    <>
      {sections.map((sec, i) => {
        const jenis = String(sec?.jenis || 'paragraf');
        if (jenis === 'judul') {
          // Turn 36: hierarki dua tingkat agar materi bisa dipelajari
          // sampai dasar: level 1 = Sub-elemen (A., B., ...),
          // level 2 = Fokus pembahasan (A.1, A.2, ...) gaya sub-subbab.
          const level = Number(sec.level || 1);
          const judulL1 = jumlahL1Sebelum(sections, i);
          if (level === 2) {
            // fokus ke-ke dalam sub-elemen ke-judulL1 (1-based);
            // huruf sub-elemen = judulL1-1 agar A.1, A.2, ... (fix Turn 38)
            const ke = sections
              .slice(0, i)
              .filter((x, xi) => String(x.jenis || 'paragraf') === 'judul'
                && Number(x.level || 1) === 2
                && jumlahL1Sebelum(sections, xi) === judulL1).length;
            return (
              <h4 key={i} id={`sec-${i}`} style={{ ...S.subJudul2, ...S.jangkar }}>
                <span style={S.subHuruf2}>
                  {String.fromCharCode(65 + offsetHuruf + judulL1 - 1)}.{ke + 1}
                </span>{' '}
                <MathText text={sec.teks} />
              </h4>
            );
          }
          const label = String.fromCharCode(65 + offsetHuruf + judulL1);
          return (
            <h3 key={i} id={`sec-${i}`} style={{ ...S.subJudul, ...S.jangkar }}>
              <span style={S.subHuruf}>{label}.</span> <MathText text={sec.teks} />
            </h3>
          );
        }
        if (jenis === 'alur') {
          // Alur ber-panah (flow proses) -- visual panah menurun antar langkah
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.alurWrap, ...S.jangkar }}>
              {sec.judul ? <div style={S.poinJudul}>🔁 {sec.judul}</div> : null}
              {(sec.items || []).map((it, k) => (
                <React.Fragment key={k}>
                  <div style={S.alurChip}><MathText text={it} /></div>
                  {k < (sec.items || []).length - 1 && (
                    <div style={S.alurPanah}>↓</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        }
        if (jenis === 'tabelinfo') {
          // baris bisa [a,b] (draft) atau {s:[a,b]} (hasil sanitasi Firestore)
          const pasangan = (r) => (Array.isArray(r) ? r
            : (Array.isArray(r && r.s) ? r.s
              : (r && r.k !== undefined ? [r.k, r.v] : [r && r.a, r && r.b])));
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.tabelWrap, ...S.jangkar }}>
              {sec.judul ? <div style={S.poinJudul}>📊 {sec.judul}</div> : null}
              <table style={S.tabel}>
                <thead>
                  <tr>
                    {(sec.kolom || ['Istilah/Komponen', 'Keterangan']).map((k2) => (
                      <th key={k2} style={S.tabelSel}>{k2}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(sec.rows || []).map((r0, k) => {
                    const r2 = pasangan(r0);
                    return (
                      <tr key={k}>
                        <td style={S.tabelSel}><MathText text={r2[0]} /></td>
                        <td style={S.tabelSel}><MathText text={r2[1]} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }
        if (jenis === 'istilah') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.poinBox, ...S.jangkar }}>
              <div style={S.poinJudul}>📖 Kamus mini istilah</div>
              <ul style={S.poinList}>
                {(sec.items || []).map((it0, k) => {
                  const it = Array.isArray(it0) ? it0
                    : (Array.isArray(it0 && it0.s) ? it0.s : [it0 && it0.k, it0 && it0.v]);
                  return (
                    <li key={k} style={S.poinItem}>
                      <b>{it[0]}</b> = {it[1]}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
        if (jenis === 'poin') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.poinBox, ...S.jangkar }}>
              {sec.judul ? <div style={S.poinJudul}>📌 {sec.judul}</div> : null}
              <ul style={S.poinList}>
                {(sec.items || []).map((it, k) => (
                  <li key={k} style={S.poinItem}><MathText text={it} /></li>
                ))}
              </ul>
            </div>
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
          // CATATAN GURU (Turn 34): callout tipe 'guru' atau berjudul
          // "Catatan Guru" HANYA tampil di sisi guru (panggung), tidak
          // pernah di reader siswa.
          const isGuru = String(sec.tipe) === 'guru'
            || /^catatan guru/i.test(String(sec.judul || ''));
          if (isGuru && !untukGuru) return null;
          // HOTFIX Turn 41: pakai sec.tipe langsung -- deklarasi `const tipe`
          // berada di bawah blok ini sehingga memicu TDZ crash produksi
          // ("Cannot access 'c' before initialization") saat ada callout.
          if (String(sec.tipe) === 'gemilang') {
            return (
              <div key={i} id={`sec-${i}`} style={{ ...S.gemilangBox, ...S.jangkar }}>
                <span style={S.gemilangIkon}>
                  <img src={bintangGemilang} alt="" style={S.gemilangImg} />
                </span>
                <span>
                  <b>{sec.judul || 'Bintang Gemilang — cara cepat'}:</b>{' '}
                  <MathText text={sec.teks} />
                </span>
              </div>
            );
          }
          if (isGuru) {
            return (
              <div key={i} id={`sec-${i}`} style={{ ...S.guruBox, ...S.jangkar }}>
                <span>👩‍🏫</span>
                <span>
                  <b>Catatan Guru (khusus pengajar): </b>
                  <MathText text={sec.teks} />
                </span>
              </div>
            );
          }
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
              {(() => {
                // Kredit sumber TIDAK ditampilkan ke siswa/guru (Turn 34):
                // disimpan untuk admin (daftar pustaka). Potong dari "Sumber:".
                const ket = String(sec.keterangan || '')
                  .split(/Sumber:/)[0].trim();
                return ket
                  ? <figcaption style={S.gambarKet}>{ket}</figcaption>
                  : null;
              })()}
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
  subJudul2: {
    fontSize: 14, fontWeight: 800, color: T.biruDalam,
    margin: '14px 0 6px', lineHeight: 1.4,
    borderLeft: `3px solid ${T.kotakBiruGaris}`, paddingLeft: 8,
  },
  subHuruf2: {
    color: T.biru, fontWeight: 800, marginRight: 6, fontSize: 12.5,
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
  alurWrap: {
    background: '#F4F9FF', border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 12, padding: '10px 14px', margin: '10px 0',
  },
  alurChip: {
    background: '#fff', border: `1.5px solid ${T.biru}`, color: T.biruDalam,
    borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
    textAlign: 'center', lineHeight: 1.5,
  },
  alurPanah: {
    textAlign: 'center', color: T.biru, fontWeight: 800, fontSize: 15,
    lineHeight: '18px',
  },
  poinBox: {
    background: '#F4F9FF', border: `1px solid ${T.kotakBiruGaris}`,
    borderLeft: `4px solid ${T.biru}`, borderRadius: 12,
    padding: '10px 14px', margin: '10px 0',
  },
  poinJudul: {
    fontWeight: 800, fontSize: 13, color: T.biruDalam, marginBottom: 6,
  },
  poinList: { margin: 0, paddingLeft: 18 },
  poinItem: {
    fontSize: 13, color: T.teks, lineHeight: 1.65, margin: '3px 0',
  },
  gemilangBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: 'linear-gradient(135deg,#FFF9E3 0%,#FFEFB8 100%)',
    border: '1.5px solid #F5C542', borderRadius: 14,
    padding: '10px 12px', margin: '12px 0',
    color: '#6B4E00', fontSize: 12.5, lineHeight: 1.65,
    boxShadow: '0 4px 14px rgba(245,197,66,.25)',
  },
  gemilangIkon: { flexShrink: 0, marginTop: -2 },
  gemilangImg: { width: 30, height: 30, display: 'block' },
  guruBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: '#FFF6DE', border: '1px solid #F1E1AE', color: '#8A6D1A',
    borderRadius: 12, padding: '10px 12px', margin: '10px 0',
    fontSize: 12.5, lineHeight: 1.65,
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
