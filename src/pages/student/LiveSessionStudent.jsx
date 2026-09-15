// src/pages/student/LiveSessionStudent.jsx
// REWRITE: siswa join sesi lewat KODE (ditampilkan guru di proyektor),
// lalu mengikuti lockstep: materi -> soal per soal -> pembahasan bertahap.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cekBenar } from '../../utils/parseSoal';
import {
  cariSesiByKode, gabungSesi, dengarSesi, kirimJawaban,
} from '../../services/sesiService';

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
  const joined = useRefSafe(sesi);

  useEffect(() => { setPilih(null); }, [sesi && sesi.soalAktif]);

  async function gabung() {
    setErr('');
    const s = await cariSesiByKode(kode);
    if (!s) { setErr('Kode tidak ditemukan / sesi sudah berakhir.'); return; }
    await gabungSesi(s.id, siswaId, nama);
    setSesi(s);
  }

  useEffect(() => {
    if (!sesi) return undefined;
    const u = dengarSesi(sesi.id, (s) => { if (s) setSesi(s); });
    return u;
  }, [sesi && sesi.id]);

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

          {soal.kunci && soal.kunci.tipe === 'pg' && (soal.pilihan || []).map((p, i) => (
            <button key={i} style={S.opsi(pilih === i, terbuka && soal.kunci.pg === i, terbuka)} disabled={sudah || terbuka} onClick={() => setPilih(i)}>
              <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
              <span style={{ flex: 1 }}>{p}</span>
              {terbuka && soal.kunci.pg === i && '✅'}
            </button>
          ))}

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

          {soal.kunci && soal.kunci.tipe === 'bs' && (soal.pernyataan || []).map((p, i) => {
            const arr = Array.isArray(pilih) ? [...pilih] : [];
            const k = terbuka && (soal.kunci.bs || [])[i];
            return (
              <div key={i} style={{ ...S.opsi(false, k, terbuka), cursor: 'default', display: 'block' }}>
                <div style={{ marginBottom: 6 }}>{i + 1}. {p}</div>
                {!terbuka && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...S.btn2, ...(arr[i] === true ? { background: '#7C3AED', color: '#fff' } : {}) }} disabled={sudah}
                      onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = true; setPilih(a); }}>Benar</button>
                    <button style={{ ...S.btn2, ...(arr[i] === false ? { background: '#7C3AED', color: '#fff' } : {}) }} disabled={sudah}
                      onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = false; setPilih(a); }}>Salah</button>
                  </div>
                )}
                {terbuka && <div style={{ fontSize: 12, fontWeight: 700, color: k ? '#16a34a' : '#e74c3c' }}>Kunci: {k ? 'Benar' : 'Salah'}</div>}
              </div>
            );
          })}

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

// helper kecil biar tidak perlu import useRef hanya untuk guard
function useRefSafe(v) { return v; }