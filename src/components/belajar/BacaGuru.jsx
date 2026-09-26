// src/components/belajar/BacaGuru.jsx
// ============================================================
// MODE BACA GURU (Turn 93 — arahan owner): tampilan DOKUMEN BERSIH
// ala HTML buku untuk guru membaca materi — tanpa kartu interaktif
// siswa. Widget interaktif dirender STATIS sebagai tabel/list berisi
// (guru melihat pasangan/kunci langsung), dan kartu CARA GEMILANG
// tetap tampil rapi secara statis (rumus + jurus terbuka, tanpa
// tombol "buka jurus"). Zona/latihan dirender dengan KUNCI terlihat.
// ============================================================
import React from 'react';
import { MathText, MathBlock } from '../MathText';
import { Crown } from 'lucide-react';

const W = {
  wrap: { maxWidth: 760, margin: '0 auto', color: '#111', fontSize: 15, lineHeight: 1.75 },
  hbar: (n) => ({
    background: n === 2 ? 'linear-gradient(#c2c2c2,#a5a5a5)' : 'linear-gradient(#d4d4d4,#bdbdbd)',
    border: '1px solid #7f7f7f', borderRadius: 4, padding: '6px 10px',
    fontWeight: 800, color: '#141414', margin: '22px 0 10px',
    fontSize: n === 2 ? 17 : 15,
  }),
  p: { margin: '8px 0', textAlign: 'justify' },
  kecil: { fontSize: 12.5, color: '#444', margin: '6px 0' },
  tabel: { width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: 13.5 },
  th: { border: '1.6px solid #444', background: '#9c9c9c', color: '#111', padding: '6px 8px', textAlign: 'left', fontWeight: 800 },
  td: { border: '1.6px solid #444', padding: '6px 8px', verticalAlign: 'top', lineHeight: 1.5 },
  ol: { margin: '8px 0', paddingLeft: 26 },
  li: { margin: '5px 0', textAlign: 'justify' },
  catatan: (warna, garis) => ({
    background: warna, border: `1px solid ${garis}`, borderRadius: 6,
    padding: '8px 12px', margin: '10px 0', fontSize: 13.5, lineHeight: 1.65,
  }),
  cg: {
    border: '2.5px solid #6D28D9', borderRadius: 10,
    background: 'linear-gradient(160deg,#FFFDF7 0%,#FFF3D6 100%)',
    padding: '12px 14px', margin: '14px 0',
  },
  cgJudul: {
    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    fontWeight: 900, color: '#5B21B6', fontSize: 14.5, marginBottom: 8,
  },
  cgRumus: {
    background: '#fff', border: '2px solid #F5C542', borderRadius: 8,
    padding: '8px 10px', color: '#6B4E00', fontWeight: 800, fontSize: 13.5,
    lineHeight: 1.6, textAlign: 'center', marginBottom: 8,
  },
  cgLangkah: { margin: 0, paddingLeft: 22, color: '#3B0764', fontSize: 13, lineHeight: 1.7 },
  kunci: { color: '#15803D', fontWeight: 800 },
  gambar: { width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', background: '#fff', border: '1px solid #ccc', borderRadius: 6 },
  gket: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 6 },
};

const pasanganItem = (it) => (Array.isArray(it) ? { k: it[0], v: it[1] } : it);

function WidgetStatis({ sec }) {
  const jenis = sec.jenis;
  if (jenis === 'jodohMini') {
    return (
      <table style={W.tabel}>
        <thead><tr><th style={W.th}>Pasangan</th><th style={W.th}>Kiri</th><th style={W.th}>Kanan</th></tr></thead>
        <tbody>
          {(sec.items || []).map((it, i) => (
            <tr key={i}>
              <td style={W.td}>{i + 1}</td>
              <td style={W.td}><MathText text={it.kiri} /></td>
              <td style={W.td}><MathText text={it.kanan} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (jenis === 'flashcard') {
    return (
      <table style={W.tabel}>
        <thead><tr><th style={W.th}>Depan</th><th style={W.th}>Belakang</th></tr></thead>
        <tbody>
          {(sec.items || []).map((it, i) => (
            <tr key={i}><td style={W.td}><MathText text={it.depan} /></td><td style={W.td}><MathText text={it.belakang} /></td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (jenis === 'urutan') {
    return (
      <ol style={W.ol}>
        {(sec.items || []).map((it, i) => (
          <li key={i} style={W.li}><MathText text={typeof it === 'string' ? it : (it.teks || '')} /></li>
        ))}
      </ol>
    );
  }
  if (jenis === 'benarSalah') {
    return (
      <ol style={W.ol}>
        {(sec.items || []).map((it, i) => (
          <li key={i} style={W.li}>
            <MathText text={it.teks} /> — <span style={W.kunci}>{it.jawaban === true || it.jawaban === 'benar' ? 'BENAR' : 'SALAH'}</span>
            {it.penjelasan ? <span style={{ color: '#555' }}> ({it.penjelasan})</span> : null}
          </li>
        ))}
      </ol>
    );
  }
  if (jenis === 'isianRumpang') {
    return (
      <ol style={W.ol}>
        {(sec.items || []).map((it, i) => (
          <li key={i} style={W.li}>
            <MathText text={it.teks} /> — <span style={W.kunci}>{Array.isArray(it.jawaban) ? it.jawaban[0] : it.jawaban}</span>
            {it.penjelasan ? <span style={{ color: '#555' }}> ({it.penjelasan})</span> : null}
          </li>
        ))}
      </ol>
    );
  }
  if (jenis === 'video') {
    return (
      <p style={W.kecil}>
        🎬 {sec.judul || 'Video'}: <a href={sec.url} target="_blank" rel="noreferrer">{sec.url}</a>
        {sec.keterangan ? ` — ${sec.keterangan}` : ''}
      </p>
    );
  }
  return null;
}

function KartuGemilangStatis({ sec }) {
  return (
    <div style={W.cg}>
      <div style={W.cgJudul}><Crown size={16} /> {sec.judul || 'Cara Gemilang'}</div>
      {sec.teks ? <div style={W.cgRumus}><MathText text={sec.teks} /></div> : null}
      {(sec.items || []).length ? (
        <ol style={W.cgLangkah}>
          {(sec.items || []).map((it, i) => <li key={i}><MathText text={it} /></li>)}
        </ol>
      ) : null}
    </div>
  );
}

export function ZonaStatis({ sec, judul }) {
  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ fontWeight: 800, fontSize: 13.5, color: '#5B21B6', marginBottom: 6 }}>
        🎮 {judul || 'Zona Berlatih'} • {(sec.items || []).length} soal (kunci terlihat untuk guru)
      </div>
      {(sec.items || []).map((q, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{i + 1}. <MathText text={q.soal} /></div>
          <ol style={{ ...W.ol, marginTop: 4 }} type="A">
            {(q.opsi || []).map((op, j) => (
              <li key={j} style={{ ...W.li, margin: '2px 0', fontSize: 13, ...(j === Number(q.jawaban) ? { color: '#15803D', fontWeight: 800 } : {}) }}>
                {op}{j === Number(q.jawaban) ? ' ✅' : ''}
              </li>
            ))}
          </ol>
          {q.pembahasan ? <div style={W.kecil}>{q.pembahasan}</div> : null}
        </div>
      ))}
    </div>
  );
}

export default function BacaGuruSections({ sections = [] }) {
  return (
    <div style={W.wrap}>
      {sections.map((sec, i) => {
        const jenis = sec.jenis || 'paragraf';
        if (jenis === 'judul') {
          // huruf subbab = jumlah judul sebelum index ini (tanpa reassign)
          const n = sections.slice(0, i).filter((x) => (x.jenis || 'paragraf') === 'judul').length;
          return (
            <div key={i} style={W.hbar(3)}>
              {String.fromCharCode(65 + n)}. {sec.teks}
            </div>
          );
        }
        if (jenis === 'kilat') return <p key={i} style={W.p}><b>⚡ Konsep Kilat 60 detik.</b> <MathText text={sec.teks} /></p>;
        if (jenis === 'peta') {
          return (
            <React.Fragment key={i}>
              <p style={W.p}><b>🗺 Peta Besar.</b> <MathText text={sec.teks} /></p>
              {sec.url ? <img src={sec.url} alt={sec.keterangan || ''} style={W.gambar} /> : null}
            </React.Fragment>
          );
        }
        if (jenis === 'gambar') {
          return (
            <React.Fragment key={i}>
              <img src={sec.url} alt={sec.keterangan || ''} style={W.gambar} loading="lazy" />
              {sec.keterangan ? <div style={W.gket}>{sec.keterangan}</div> : null}
            </React.Fragment>
          );
        }
        if (jenis === 'poin' || jenis === 'alur') {
          return (
            <React.Fragment key={i}>
              {sec.judul ? <div style={{ fontWeight: 800, margin: '10px 0 4px', fontSize: 14 }}>📌 {sec.judul}</div> : null}
              <ol style={W.ol}>
                {(sec.items || []).map((it, k) => <li key={k} style={W.li}><MathText text={it} /></li>)}
              </ol>
            </React.Fragment>
          );
        }
        if (jenis === 'istilah') {
          return (
            <table key={i} style={W.tabel}>
              <thead><tr><th style={W.th}>Istilah</th><th style={W.th}>Pengertian</th></tr></thead>
              <tbody>
                {(sec.items || []).map((it0, k) => {
                  const it = pasanganItem(it0);
                  return (
                    <tr key={k}><td style={W.td}><b>{it.k}</b></td><td style={W.td}><MathText text={it.v} /></td></tr>
                  );
                })}
              </tbody>
            </table>
          );
        }
        if (jenis === 'tabelinfo') {
          const kolom = sec.kolom || ['Istilah/Komponen', 'Keterangan'];
          const nKol = Math.max(2, kolom.length);
          return (
            <table key={i} style={W.tabel}>
              {sec.judul ? <caption style={{ textAlign: 'left', fontWeight: 800, fontSize: 13.5, marginBottom: 4 }}>📊 {sec.judul}</caption> : null}
              <thead><tr>{kolom.map((k) => <th key={k} style={W.th}>{k}</th>)}</tr></thead>
              <tbody>
                {(sec.rows || []).map((r0, k) => {
                  const r = Array.isArray(r0) ? r0 : (r0 && r0.k !== undefined ? [r0.k, r0.v, r0.w, r0.x, r0.y] : [r0 && r0.a, r0 && r0.b]);
                  return (
                    <tr key={k}>
                      {Array.from({ length: nKol }).map((_, ci) => (
                        <td key={ci} style={W.td}><MathText text={r[ci] !== undefined ? r[ci] : '-'} /></td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        }
        if (jenis === 'contoh') {
          const bagian = String(sec.teks || '').split(/(?=Langkah \d+)/);
          return (
            <React.Fragment key={i}>
              <div style={{ fontWeight: 800, margin: '10px 0 4px', fontSize: 14 }}>✍️ Contoh terpecah langkah</div>
              {bagian.length > 1 ? (
                <ol style={W.ol}>{bagian.map((b, k) => <li key={k} style={W.li}><MathText text={b.trim()} /></li>)}</ol>
              ) : (
                <p style={W.p}><MathText text={sec.teks} /></p>
              )}
            </React.Fragment>
          );
        }
        if (jenis === 'caraGemilang' || (jenis === 'callout' && sec.tipe === 'gemilang')) {
          return <KartuGemilangStatis key={i} sec={sec} />;
        }
        if (jenis === 'callout') {
          const tipe = sec.tipe || 'info';
          if (tipe === 'peringatan') return <div key={i} style={W.catatan('#FEF2F2', '#FCA5A5')}><b>⚠️ {sec.judul ? sec.judul + ': ' : ''}</b><MathText text={sec.teks} /></div>;
          if (tipe === 'tips') return <div key={i} style={W.catatan('#F0FDF4', '#86EFAC')}><b>💡 {sec.judul ? sec.judul + ': ' : ''}</b><MathText text={sec.teks} /></div>;
          if (tipe === 'guru') return <div key={i} style={W.catatan('#FFF6DE', '#F1E1AE')}><b>🧑‍🏫 {sec.judul ? sec.judul + ': ' : ''}</b><MathText text={sec.teks} /></div>;
          return <div key={i} style={W.catatan('#EFF6FF', '#93C5FD')}><b>ℹ️ {sec.judul ? sec.judul + ': ' : ''}</b><MathText text={sec.teks} /></div>;
        }
        if (jenis === 'zona') return <ZonaStatis key={i} sec={sec} judul={sec.judul} />;
        if (jenis === 'rumus') {
          return (
            <div key={i} style={{ textAlign: 'center', margin: '10px 0', fontWeight: 800 }}>
              {sec.latex ? <MathBlock latex={sec.latex} /> : <MathText text={sec.teks} />}
            </div>
          );
        }
        // widget interaktif -> statis
        if (['jodohMini', 'isianRumpang', 'flashcard', 'urutan', 'benarSalah', 'video'].includes(jenis)) {
          return (
            <React.Fragment key={i}>
              {sec.judul ? <div style={{ fontWeight: 800, margin: '10px 0 4px', fontSize: 14 }}>{sec.judul}</div> : null}
              <WidgetStatis sec={sec} />
            </React.Fragment>
          );
        }
        return <p key={i} style={W.p}><MathText text={sec.teks} /></p>;
      })}
    </div>
  );
}

// Daftar soal + KUNCI terlihat untuk mode baca guru (tab latihan).
export function BacaGuruKuis({ kuis = [] }) {
  return (
    <div style={W.wrap}>
      <div style={W.hbar(3)}>Kunci & pembahasan (tampilan guru)</div>
      {kuis.map((s, i) => {
        const t = s.tipe || 'pg';
        return (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{i + 1}. <MathText text={String(s.soal || '').split('\n\n').slice(-1)[0]} /></div>
            {t === 'tabel' ? (
              <table style={W.tabel}>
                <thead><tr><th style={W.th}>Pernyataan</th>{(s.kolom || []).map((k) => <th key={k} style={W.th}>{k}</th>)}</tr></thead>
                <tbody>
                  {(s.baris || []).map((b, r) => (
                    <tr key={r}>
                      <td style={W.td}>{b}</td>
                      {(s.kolom || []).map((k, c) => (
                        <td key={c} style={{ ...W.td, textAlign: 'center', fontWeight: 800, color: (s.jawaban || [])[r] === c ? '#15803D' : '#bbb' }}>
                          {(s.jawaban || [])[r] === c ? '✓' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ol style={{ ...W.ol, marginTop: 4 }} type="A">
                {(s.opsi || []).map((op, j) => {
                  const benar = t === 'pgMulti' ? (s.jawaban || []).includes(j) : s.jawaban === j;
                  return (
                    <li key={j} style={{ ...W.li, margin: '2px 0', fontSize: 13, ...(benar ? { color: '#15803D', fontWeight: 800 } : {}) }}>
                      {op}{benar ? ' ✅' : ''}
                    </li>
                  );
                })}
              </ol>
            )}
            {s.pembahasan ? <div style={W.kecil}>{s.pembahasan}</div> : null}
            <div style={{ ...W.kecil, color: '#888' }}>Sumber: {s.sumber || '-'}</div>
          </div>
        );
      })}
    </div>
  );
}
