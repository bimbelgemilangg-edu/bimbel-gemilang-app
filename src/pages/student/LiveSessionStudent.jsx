// src/pages/student/LiveSessionStudent.jsx
// Sisi siswa sesi live. Soal Benar/Salah dirender sebagai GRID CBT
// (pernyataan + tombol radio B/S besar yang bisa ditekan), sesuai
// standar ujian. Setelah guru buka kunci, tiap baris menyala
// hijau/merah dan kolom kunci ditandai.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cekBenar } from '../../utils/parseSoal';
import { cariSesiByKode, gabungSesi, dengarSesi, kirimJawaban } from '../../services/sesiService';

const S = {
  page: { maxWidth: 560, margin: '0 auto', padding: 16, fontFamily: 'sans-serif', minHeight: '100vh', background: '#f8fafc' },
  card: { background: '#fff', border: '1px solid #e3e6ef', borderRadius: 12, padding: 16, marginBottom: 12 },
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  input: { border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px', fontSize: 14, background: '#fff' },
  btn: { width: '100%', padding: 12, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' },
  btn2: { padding: '8px 12px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  chip: { background: '#eef2ff', color: '#4338ca', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  opsi: (a, k, s) => ({ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 10, border: `2px solid ${s && k ? '#16a34a' : s && a ? '#e74c3c' : a ? '#7C3AED' : '#e2e8f0'}`, background: s && k ? '#f0fdf4' : s && a ? '#fef2f2' : a ? '#f5f3ff' : '#fff', fontSize: 13.5, cursor: s ? 'default' : 'pointer', marginBottom: 8 }),
  langkah: { background: '#fbfcff', border: '1px solid #eef1f6', borderRadius: 10, padding: '9px 12px', margin: '7px 0', fontSize: 13, lineHeight: 1.6 },
  // ===== GRID CBT =====
  cbt: { border: '1px solid #e3e6ef', borderRadius: 12, overflow: 'hidden', background: '#fff', margin: '10px 0' },
  cbtHead: { display: 'grid', gridTemplateColumns: '1fr 76px 76px', background: '#4C6EF5', color: '#fff', fontSize: 11, fontWeight: 800 },
  cbtHeadText: { padding: '8px 10px' },
  cbtHeadOpt: { padding: '8px 4px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,.25)' },
  cbtRow: (salah) => ({ display: 'grid', gridTemplateColumns: '1fr 76px 76px', borderTop: '1px solid #eef1f6', background: salah ? '#fef2f2' : 'transparent' }),
  cbtText: { padding: '10px', fontSize: 13, lineHeight: 1.55 },
  cbtOpt: { display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #eef1f6', padding: '6px 0' },
  cbtBtn: (a, k, s) => ({
    width: 42, height: 42, borderRadius: '50%',
    border: s && k ? '2px solid #16a34a' : a ? '2px solid #7C3AED' : '2px solid #cbd5e1',
    background: s && k ? '#f0fdf4' : a ? '#7C3AED' : '#fff',
    color: a ? '#fff' : s && k ? '#16a34a' : '#64748b',
    fontWeight: 800, fontSize: 12, cursor: s ? 'default' : 'pointer',
  }),
};

export default function LiveSessionStudent() {
  const navigate = useNavigate();
  const siswaId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';
  const nama = localStorage.getItem('studentName') || 'Siswa';
  const [kode, setKode] = useState('');
  const [sesi, setSesi] = useState(null);
  const [pilih, setPilih] = useState(null);
  const [terkirim, setTerkirim] = useState({});
  const [err, setErr] = useState('');

  useEffect(() => { setPilih(null); }, [sesi && sesi.soalAktif]);

  useEffect(() => {
    if (!sesi) return undefined;
    const u = dengarSesi(sesi.id, (s) => { if (s) setSesi(s); });
    return u;
  }, [sesi && sesi.id]);

  async function gabung() {
    setErr('');
    const s = await cariSesiByKode(kode);
    if (!s) { setErr('Kode tidak ditemukan / sesi sudah berakhir.'); return; }
    await gabungSesi(s.id, siswaId, nama);
    setSesi(s);
  }

  const idx = sesi ? sesi.soalAktif : null;
  const soal = idx != null ? (sesi.daftarSoal || [])[idx] : null;
  const sudah = idx != null ? !!terkirim[idx] : false;
  const terbuka = sesi ? !!sesi.kunciTerbuka : false;

  async function kirim() {
    if (pilih === null || (Array.isArray(pilih) && pilih.length === 0)) return;
    const benar = cekBenar(soal.kunci, pilih);
    await kirimJawaban(sesi.id, { siswaId, nama, soalIdx: idx, jawaban: pilih, benar });
    setTerkirim((t) => ({ ...t, [idx]: benar }));
  }

  if (!sesi) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 10px' }}>🎧 Gabung Sesi Kelas</h3>
          <div style={S.row}>
            <input style={{ ...S.input, width: 150, letterSpacing: 3, textTransform: 'uppercase' }} placeholder="KODE" value={kode} onChange={(e) => setKode(e.target.value)} />
            <button style={{ ...S.btn, width: 'auto' }} onClick={gabung}>Gabung</button>
          </div>
          {err && <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 700 }}>{err}</div>}
          <p style={{ fontSize: 11.5, color: '#64748b', margin: '8px 0 0' }}>Minta kode sesi ke guru (ditampilkan di proyektor).</p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.row}>
          <span style={S.chip}>🔴 {sesi.kode}</span>
          <span style={S.chip}>{sesi.materiJudul || 'Sesi kelas'}</span>
          {idx != null && <span style={S.chip}>Soal {idx + 1}/{(sesi.daftarSoal || []).length}</span>}
        </div>
      </div>

      {idx == null && (
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>📖</div>
          <p style={{ fontSize: 13, color: '#475569' }}>Guru sedang menerangkan materi. Perhatikan proyektor.</p>
          {sesi.bukuId && sesi.babId && (
            <button style={S.btn2} onClick={() => navigate(`/siswa/buku/${sesi.bukuId}/${sesi.babId}`)}>Buka modul untuk menyimak</button>
          )}
        </div>
      )}

      {soal && (
        <div style={S.card}>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{soal.teks}</div>

          {/* ===== PG ===== */}
          {soal.kunci && soal.kunci.tipe === 'pg' && (soal.pilihan || []).map((p, i) => (
            <button key={i} style={S.opsi(pilih === i, terbuka && soal.kunci.pg === i, terbuka)} disabled={sudah || terbuka} onClick={() => setPilih(i)}>
              <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
              <span style={{ flex: 1 }}>{p}</span>
              {terbuka && soal.kunci.pg === i && '✅'}
            </button>
          ))}

          {/* ===== MULTI ===== */}
          {soal.kunci && soal.kunci.tipe === 'multi' && (soal.pilihan || []).map((p, i) => {
            const arr = Array.isArray(pilih) ? pilih : [];
            const a = arr.includes(i);
            const k = terbuka && (soal.kunci.multi || []).includes(i);
            return (
              <button key={i} style={S.opsi(a, k, terbuka)} disabled={sudah || terbuka}
                onClick={() => setPilih(a ? arr.filter((x) => x !== i) : [...arr, i])}>
                <span style={{ fontWeight: 800, width: 20 }}>{a ? '✓' : ''}</span>
                <span style={{ flex: 1 }}>{p}</span>
                {k && '✅'}
              </button>
            );
          })}

          {/* ===== BENAR/SALAH — GRID CBT ===== */}
          {soal.kunci && soal.kunci.tipe === 'bs' && (
            <div style={S.cbt}>
              <div style={S.cbtHead}>
                <span style={S.cbtHeadText}>Pernyataan</span>
                <span style={S.cbtHeadOpt}>Benar</span>
                <span style={S.cbtHeadOpt}>Salah</span>
              </div>
              {(soal.pernyataan || []).map((p, i) => {
                const arr = Array.isArray(pilih) ? [...pilih] : [];
                const kunciB = (soal.kunci.bs || [])[i];
                const sayaSalah = terbuka && arr[i] !== undefined && arr[i] !== kunciB;
                return (
                  <div key={i} style={S.cbtRow(sayaSalah)}>
                    <div style={S.cbtText}>{i + 1}. {p}</div>
                    <div style={S.cbtOpt}>
                      <button
                        style={S.cbtBtn(arr[i] === true, terbuka && kunciB === true, terbuka)}
                        disabled={sudah || terbuka}
                        onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = true; setPilih(a); }}
                      >B</button>
                    </div>
                    <div style={S.cbtOpt}>
                      <button
                        style={S.cbtBtn(arr[i] === false, terbuka && kunciB === false, terbuka)}
                        disabled={sudah || terbuka}
                        onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = false; setPilih(a); }}
                      >S</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!sudah && !terbuka && (
            <button style={S.btn} disabled={pilih === null || (Array.isArray(pilih) && pilih.length === 0)} onClick={kirim}>📤 Kirim Jawaban</button>
          )}
          {sudah && !terbuka && (
            <div style={{ fontSize: 12.5, color: '#166534', fontWeight: 700, marginTop: 8 }}>✅ Terkirim — tunggu guru membuka pembahasan.</div>
          )}
          {terbuka && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#4338ca', marginBottom: 6 }}>💡 Pembahasan:</div>
              {(soal.langkah || []).slice(0, Math.max(1, sesi.langkahTerbuka || 1)).map((l, i) => (
                <div key={i} style={S.langkah}><b>{i + 1}.</b> {l}</div>
              ))}
              {(soal.langkah || []).length > Math.max(1, sesi.langkahTerbuka || 1) && (
                <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>Menunggu langkah berikutnya dari guru…</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}