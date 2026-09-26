// src/components/belajar/RiwayatLatihanPanel.jsx
// ============================================================
// TAB RIWAYAT LATIHAN SISWA (Turn 95): daftar percobaan latihan &
// ujian bab ini (terbaru dulu) — nilai tiap percobaan + peta nomor
// salah/benar/kredit sebagian + ulasan per soal salah (jawabanmu
// vs kunci + pembahasan dua jalur). Mengganti tab "Diskusi".
// ============================================================
import React, { useEffect, useState } from 'react';
import { History, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { muatRiwayatLatihan, formatJawaban, formatKunci } from '../../services/riwayatLatihanService';
import PembahasanBox from './PembahasanBox';
import { MathText } from '../MathText';
import { T } from '../../pages/student/belajar/tema';

const S = {
  kartu: {
    background: '#fff', border: `1px solid ${T.garis}`, borderRadius: 14,
    padding: '12px 14px', marginBottom: 10,
  },
  kepala: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  chip: (ujian) => ({
    borderRadius: 999, padding: '2px 10px', fontSize: 10.5, fontWeight: 900,
    background: ujian ? '#F5F3FF' : T.kotakBiru,
    color: ujian ? '#5B21B6' : T.biruDalam,
    border: `1px solid ${ujian ? '#DDD6FE' : T.kotakBiruGaris}`,
  }),
  nilai: (v) => ({
    marginLeft: 'auto', fontWeight: 900, fontSize: 22, fontVariantNumeric: 'tabular-nums',
    color: v >= 75 ? T.hijauTeks : v >= 50 ? '#B45309' : '#B91C1C',
  }),
  peta: { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 },
  kotakNomor: (k) => ({
    width: 28, height: 28, borderRadius: 8, fontSize: 11.5, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: k === 1 ? T.hijauLatar : k > 0 ? T.amberLatar : T.merahLatar,
    color: k === 1 ? T.hijauTeks : k > 0 ? T.amberTeks : '#991B1B',
    border: `1px solid ${k === 1 ? T.hijauGaris : k > 0 ? T.amberGaris : T.merahGaris}`,
  }),
  ulasan: {
    marginTop: 10, background: '#F8FAFC', border: `1px solid ${T.garis}`,
    borderRadius: 12, padding: '10px 12px',
  },
  barisUlasan: { marginBottom: 10 },
  kecil: { fontSize: 12, color: T.samar, lineHeight: 1.6 },
};

const tgl = (ms) => (ms ? new Date(ms).toLocaleString('id-ID', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}) : '-');

export default function RiwayatLatihanPanel({ studentId, babId, kuis = [] }) {
  const [riwayat, setRiwayat] = useState(null);
  const [buka, setBuka] = useState({});

  useEffect(() => {
    let hidup = true;
    muatRiwayatLatihan(studentId, babId).then((r) => { if (hidup) setRiwayat(r); });
    return () => { hidup = false; };
  }, [studentId, babId]);

  if (riwayat === null) {
    return <div style={{ ...S.kartu, textAlign: 'center', color: T.samar, fontSize: 13 }}>Memuat riwayat…</div>;
  }
  if (riwayat.length === 0) {
    return (
      <div style={{ ...S.kartu, textAlign: 'center', color: T.samar, padding: '26px 16px' }}>
        <History size={26} style={{ margin: '0 auto 8px', display: 'block', opacity: .5 }} />
        Belum ada riwayat latihan/ujian di bab ini.<br />
        Kerjakan latihan atau ikut sesi ujian guru — hasilnya tersimpan di sini.
      </div>
    );
  }

  return (
    <>
      {riwayat.map((r, ri) => {
        const terbuka = !!buka[r.id];
        const salahParsial = (r.perSoal || []).filter((p) => (p.kredit || 0) < 1);
        return (
          <div key={r.id} style={S.kartu}>
            <div style={S.kepala}>
              <span style={S.chip(r.jenis === 'ujian')}>
                {r.jenis === 'ujian' ? `📝 Ujian${r.kode ? ` • kode ${r.kode}` : ''}` : '✍️ Latihan mandiri'}
              </span>
              <span style={{ fontSize: 11.5, color: T.samar, fontWeight: 700 }}>{tgl(r.tsMs)}</span>
              <span style={S.nilai(r.nilai || 0)}>{r.nilai}</span>
            </div>
            <div style={{ ...S.kecil, marginTop: 4 }}>
              {r.benar !== undefined ? `kredit ${Number(r.benar).toFixed(2)} • ` : ''}
              {r.total} soal • {salahParsial.length === 0
                ? '🎉 semua benar!'
                : `${salahParsial.length} nomor belum tepat (merah/kuning di bawah)`}
            </div>
            <div style={S.peta}>
              {(r.perSoal || []).map((p) => (
                <span key={p.i} style={S.kotakNomor(p.kredit || 0)} title={`Soal ${p.i + 1}`}>
                  {p.i + 1}
                </span>
              ))}
            </div>
            {salahParsial.length > 0 && (
              <button type="button"
                onClick={() => setBuka((o) => ({ ...o, [r.id]: !terbuka }))}
                style={{
                  marginTop: 10, display: 'inline-flex', gap: 6, alignItems: 'center',
                  background: '#fff', border: `1.5px solid ${T.garis}`, borderRadius: 10,
                  padding: '7px 12px', fontSize: 12, fontWeight: 800, color: T.biruDalam,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {terbuka ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {terbuka ? 'Tutup ulasan nomor salah' : `Ulas ${salahParsial.length} nomor yang salah`}
              </button>
            )}
            {terbuka && (
              <div style={S.ulasan}>
                {salahParsial.map((p) => {
                  const soal = kuis[p.i];
                  if (!soal) return null;
                  return (
                    <div key={p.i} style={S.barisUlasan}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={S.kotakNomor(p.kredit || 0)}>{p.i + 1}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#B91C1C' }}>
                          Jawabanmu: {formatJawaban(soal, p.jaw)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: T.hijauTeks }}>
                          Kunci: {formatKunci(soal)}
                        </span>
                        {(p.kredit || 0) > 0 && (
                          <span style={{ fontSize: 11, color: T.amberTeks, fontWeight: 800 }}>
                            kredit sebagian {Number(p.kredit).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div style={{ margin: '6px 0 4px', fontSize: 13, color: T.teks, lineHeight: 1.6 }}>
                        <MathText text={String(soal.soal || '').split('\n\n').slice(-1)[0]} />
                      </div>
                      <PembahasanBox soal={soal} />
                    </div>
                  );
                })}
              </div>
            )}
            {ri === 0 && (
              <div style={{ ...S.kecil, marginTop: 8, color: T.biruDalam }}>
                <FileText size={12} style={{ verticalAlign: -2 }} /> Percobaan terbaru — perbaiki nomor merah dulu, lalu coba lagi untuk menaikkan nilai terbaikmu.
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
