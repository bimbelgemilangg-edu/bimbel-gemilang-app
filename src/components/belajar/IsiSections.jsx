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

// ============================================================
// Turn 82: STRUKTUR KONTEN CARA GEMILANG (deploy sekali; konten berikutnya
// cukup impor JSON tanpa deploy):
//  - jenis 'kilat'        : kartu Konsep Kilat 60 detik
//  - jenis 'peta'         : kartu Peta Besar subbab
//  - jenis 'caraGemilang' : kartu bermerek CARA GEMILANG (frame ungu-emas)
//  - jenis 'zona'         : Zona Berlatih = mini-quiz instan (koreksi lokal)
// ============================================================
export const URL_FRAME_CG =
  'https://hqoasblnrsijbflupoir.supabase.co/storage/v1/object/public/materi-bimbel/materi-v2/gambar-sumber/cara-gemilang-frame.png';

function ZonaBerlatih({ sec }) {
  const [pil, setPil] = React.useState({});
  const [cek, setCek] = React.useState({});
  const soalList = sec.items || [];
  return (
    <div style={{
      background: '#F5F3FF', border: '2px solid #7C3AED', borderRadius: 18,
      padding: '14px 16px', margin: '14px 0',
    }}>
      <div style={{ fontWeight: 900, color: '#5B21B6', fontSize: 14, marginBottom: 4 }}>
        🎮 Zona Berlatih • {soalList.length} soal pemanasan
      </div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
        Jawab lalu tekan Cek per soal — kunci terbuka hanya setelah dicek.
      </div>
      {soalList.map((q, qi) => {
        const sudah = !!cek[qi];
        const benar = sudah && Number(pil[qi]) === Number(q.jawaban);
        return (
          <div key={qi} style={{
            background: '#fff', border: '1px solid #DDD6FE', borderRadius: 14,
            padding: '10px 12px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              {qi + 1}. {q.soal}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(q.opsi || []).map((op, oi) => (
                <button key={oi} type="button" disabled={sudah}
                  onClick={() => setPil((o) => ({ ...o, [qi]: oi }))}
                  style={{
                    textAlign: 'left', borderRadius: 10, padding: '8px 10px',
                    fontSize: 13, cursor: sudah ? 'default' : 'pointer',
                    border: sudah && oi === Number(q.jawaban)
                      ? '2px solid #16A34A'
                      : sudah && pil[qi] === oi && !benar
                        ? '2px solid #DC2626'
                        : '1px solid #E2E8F0',
                    background: sudah && oi === Number(q.jawaban)
                      ? '#ECFDF5'
                      : sudah && pil[qi] === oi ? '#FEF2F2' : '#fff',
                  }}>
                  {String.fromCharCode(65 + oi)}. {op}
                </button>
              ))}
            </div>
            {!sudah ? (
              <button type="button" disabled={pil[qi] == null}
                onClick={() => setCek((o) => ({ ...o, [qi]: true }))}
                style={{
                  marginTop: 8, borderRadius: 10, padding: '7px 14px',
                  background: pil[qi] == null ? '#E2E8F0' : '#7C3AED',
                  color: pil[qi] == null ? '#94A3B8' : '#fff',
                  border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                }}>
                ✔ Cek
              </button>
            ) : (
              <div style={{
                marginTop: 8, fontSize: 12.5, lineHeight: 1.6,
                color: benar ? '#15803D' : '#B91C1C',
              }}>
                {benar ? '✅ Benar! ' : '❌ Belum tepat. '}
                {q.pembahasan || ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
              : (r && r.k !== undefined ? [r.k, r.v, r.w, r.x, r.y] : [r && r.a, r && r.b])));
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
                    const nKol = Math.max(2, (sec.kolom || []).length);
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
          if (jenis === 'kilat') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.jangkar,
              background: 'linear-gradient(135deg,#EFF6FF 0%,#DBEAFE 100%)',
              border: '1.5px solid #93C5FD', borderRadius: 16,
              padding: '12px 16px', margin: '12px 0' }}>
              <div style={{ fontWeight: 900, color: '#1D4ED8', fontSize: 13, marginBottom: 4 }}>
                ⚡ Konsep Kilat 60 detik
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.75, color: '#0F172A' }}>
                <MathText text={sec.teks} />
              </div>
            </div>
          );
        }
        if (jenis === 'peta') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.jangkar,
              background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: 16,
              padding: '12px 16px', margin: '12px 0' }}>
              <div style={{ fontWeight: 900, color: '#334155', fontSize: 13, marginBottom: 4 }}>
                🗺 Peta Besar
              </div>
              <div style={{ fontSize: 14.5, lineHeight: 1.75, color: '#0F172A' }}>
                <MathText text={sec.teks} />
              </div>
              {sec.url ? <img src={sec.url} alt={sec.keterangan || ''} style={{ ...S.gambar, marginTop: 10 }} /> : null}
            </div>
          );
        }
        if (jenis === 'caraGemilang') {
          return (
            <div key={i} id={`sec-${i}`} style={{ ...S.jangkar,
              background: 'linear-gradient(160deg,#FFFDF7 0%,#FFF3D6 100%)',
              border: '3px solid #6D28D9', borderRadius: 22,
              padding: '10px 14px 14px', margin: '16px 0',
              boxShadow: '0 10px 26px rgba(109,40,217,.18)' }}>
              <img src={URL_FRAME_CG} alt="Cara Gemilang"
                style={{ width: '100%', maxHeight: 120, objectFit: 'contain', display: 'block' }} />
              <div style={{ fontWeight: 900, color: '#5B21B6', fontSize: 15, margin: '6px 0 6px', textAlign: 'center' }}>
                👑 {sec.judul || 'Cara Gemilang'}
              </div>
              {sec.teks ? (
                <div style={{ fontSize: 14.5, lineHeight: 1.75, color: '#4C1D95', textAlign: 'center', marginBottom: 6 }}>
                  <MathText text={sec.teks} />
                </div>
              ) : null}
              {(sec.items || []).length ? (
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(sec.items || []).map((it, k) => (
                    <li key={k} style={{ fontSize: 14, lineHeight: 1.7, color: '#3B0764' }}>
                      <MathText text={it} />
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          );
        }
        if (jenis === 'zona') {
          return <ZonaBerlatih key={i} sec={sec} />;
        }
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
    margin: '26px 0 10px', fontSize: 17.5, fontWeight: 900, color: T.judul,
    letterSpacing: -0.2,
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
  paragraf: { margin: '0 0 14px', fontSize: 16, lineHeight: 1.9, color: T.teks, maxWidth: '72ch' },
  contohBox: {
    background: T.kotakBiru, border: `1px solid ${T.kotakBiruGaris}`,
    borderRadius: 12, padding: '13px 15px', margin: '0 0 15px',
  },
  contohJudul: {
    display: 'flex', alignItems: 'center', gap: 6, color: T.biruGelap,
    fontWeight: 800, fontSize: 12.5, marginBottom: 7,
  },
  gambar: {
    width: '100%', maxHeight: 520, objectFit: 'contain', background: '#fff',
    borderRadius: 16, display: 'block', border: `1px solid ${T.garis}`,
    padding: 8, boxShadow: '0 6px 18px rgba(15,23,42,.06)',
  },
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
    borderLeft: `4px solid ${T.biru}`, borderRadius: 16,
    padding: '12px 16px', margin: '12px 0',
  },
  poinJudul: {
    fontWeight: 800, fontSize: 13, color: T.biruDalam, marginBottom: 6,
  },
  poinList: { margin: 0, paddingLeft: 18 },
  poinItem: {
    fontSize: 14.5, color: T.teks, lineHeight: 1.75, margin: '4px 0',
  },
  gemilangBox: {
    display: 'flex', gap: 12, alignItems: 'flex-start',
    background: 'linear-gradient(135deg,#FFFDF5 0%,#FFEFB8 100%)',
    border: '2px solid #F5C542', borderRadius: 18,
    padding: '14px 16px', margin: '16px 0',
    color: '#6B4E00', fontSize: 13.5, lineHeight: 1.75,
    boxShadow: '0 8px 22px rgba(245,197,66,.3)',
  },
  gemilangIkon: { flexShrink: 0, marginTop: -2 },
  gemilangImg: { width: 30, height: 30, display: 'block' },
  guruBox: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    background: '#FFF6DE', border: '1px solid #F1E1AE', color: '#8A6D1A',
    borderRadius: 12, padding: '10px 12px', margin: '10px 0',
    fontSize: 12.5, lineHeight: 1.65,
  },
  gambarKet: { textAlign: 'center', color: T.samar, fontSize: 12, lineHeight: 1.6, marginTop: 8 },
  // Turn 80: style tabel premium (sebelumnya tidak terdefinisi -> tabel polos
  // tanpa border di produksi = tampilan 'berantakan' yang dikeluhkan owner).
  tabelWrap: {
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 16,
    padding: '10px 10px', margin: '14px 0', overflowX: 'auto',
    boxShadow: '0 6px 18px rgba(15,23,42,.05)',
  },
  tabel: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 },
  tabelSel: {
    padding: '10px 12px', borderBottom: `1px solid ${T.garis}`,
    textAlign: 'left', verticalAlign: 'top', lineHeight: 1.6, minWidth: 110,
  },
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
