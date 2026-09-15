// src/pages/student/LiveSessionStudent.jsx
// Sisi siswa: otomatis mendeteksi sesi live aktif untuk kelasnya (sesi_live),
// bergabung, lalu mengikuti lockstep: materi -> soal (pg/multi/bs) -> pembahasan.
// Jawaban ditulis ke sesi_live/{id}/peserta/{studentId}.jawabanPerSoal.{index}
// (format yang SUDAH dibaca rekap guru).
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dengarSesiAktifKelas, gabungSesiLive, kirimJawabanLive } from '../../services/sesiService';

const S = {
  page: { maxWidth: 520, margin: '0 auto', padding: 16, fontFamily: 'sans-serif', minHeight: '100vh', background: '#f8fafc' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16, marginBottom: 12 },
  chip: { background: '#ebf5fb', color: '#3498db', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700 },
  opsi: (a, k, s) => ({ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 10, border: `2px solid ${s && k ? '#27ae60' : s && a ? '#e74c3c' : a ? '#8e44ad' : '#e2e8f0'}`, background: s && k ? '#f0fdf4' : s && a ? '#fef2f2' : a ? '#f5f3ff' : '#fff', fontSize: 13.5, cursor: s ? 'default' : 'pointer', marginBottom: 8 }),
  btn: { width: '100%', padding: 12, background: '#8e44ad', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer' },
  btn2: { padding: '8px 12px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
};

function cocok(tipe, kunci, jw) {
  if (tipe === 'pg') return jw === kunci;
  if (tipe === 'multi') return Array.isArray(jw) && Array.isArray(kunci) && jw.length === kunci.length && kunci.every((i) => jw.includes(i));
  if (tipe === 'bs') return Array.isArray(jw) && Array.isArray(kunci) && jw.length === kunci.length && jw.every((v, i) => v === kunci[i]);
  return false;
}

export default function LiveSessionStudent() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';
  const studentName = localStorage.getItem('studentName') || 'Siswa';
  const studentKelas = localStorage.getItem('studentKelas') || localStorage.getItem('studentGrade') || '';
  const [sesi, setSesi] = useState(null);
  const [pilih, setPilih] = useState(null);
  const [terkirim, setTerkirim] = useState({});
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!studentKelas) return undefined;
    const u = dengarSesiAktifKelas(studentKelas, setSesi);
    return u;
  }, [studentKelas]);

  useEffect(() => {
    if (sesi && studentId && !joinedRef.current) {
      joinedRef.current = true;
      gabungSesiLive(sesi.id, studentId, studentName).catch(() => {});
    }
  }, [sesi, studentId, studentName]);

  useEffect(() => { setPilih(null); }, [sesi?.indexSekarang]);

  if (!studentKelas) {
    return <div style={S.page}><div style={S.card}>Data kelasmu belum ada. Login ulang supaya kelas terbaca.</div></div>;
  }
  if (!sesi) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40 }}>📡</div>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Belum Ada Sesi Live</h2>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 6 }}>
            Kalau gurumu memulai sesi kelas, layar ini otomatis terbuka sendiri — tidak perlu refresh.
          </p>
        </div>
      </div>
    );
  }

  const soal = sesi.indexSekarang != null ? (sesi.daftarSoal || [])[sesi.indexSekarang] : null;
  const sudah = sesi.indexSekarang != null ? !!terkirim[sesi.indexSekarang] : false;
  const pembahasan = sesi.tahap === 'pembahasan';

  async function kirim() {
    if (pilih === null || (Array.isArray(pilih) && pilih.length === 0)) return;
    const benar = cocok(soal.tipe, soal.kunciJawaban, pilih);
    await kirimJawabanLive(sesi.id, studentId, studentName, sesi.indexSekarang, pilih, benar);
    setTerkirim((t) => ({ ...t, [sesi.indexSekarang]: benar }));
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={S.chip}>🔴 LIVE</span>
          <span style={S.chip}>{sesi.materiJudul || sesi.mataPelajaran}</span>
          {soal && <span style={S.chip}>Soal {sesi.indexSekarang + 1}/{sesi.daftarSoal.length}</span>}
        </div>
      </div>

      {sesi.tahap === 'materi' && (
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>📖</div>
          <p style={{ fontSize: 13, color: '#475569' }}>Guru sedang menerangkan materi. Perhatikan papan/proyektor.</p>
          {sesi.bukuId && sesi.babId && (
            <button style={S.btn2} onClick={() => navigate(`/student/buku/${sesi.bukuId}/${sesi.babId}`)}>Buka modul untuk menyimak</button>
          )}
        </div>
      )}

      {sesi.tahap !== 'materi' && soal && (
        <div style={S.card}>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{soal.soal}</div>

          {soal.tipe === 'pg' && (soal.opsiJawaban || []).map((o, i) => (
            <button key={i} style={S.opsi(pilih === i, pembahasan && soal.kunciJawaban === i, pembahasan)} disabled={sudah || pembahasan} onClick={() => setPilih(i)}>
              <span style={{ fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
              <span style={{ flex: 1 }}>{o}</span>
              {pembahasan && soal.kunciJawaban === i && '✅'}
            </button>
          ))}

          {soal.tipe === 'multi' && (soal.opsiJawaban || []).map((o, i) => {
            const arr = Array.isArray(pilih) ? pilih : [];
            const a = arr.includes(i);
            const k = pembahasan && (soal.kunciJawaban || []).includes(i);
            return (
              <button key={i} style={S.opsi(a, k, pembahasan)} disabled={sudah || pembahasan}
                onClick={() => setPilih(a ? arr.filter((x) => x !== i) : [...arr, i])}>
                <span style={{ fontWeight: 800, width: 20 }}>{a ? '✓' : ''}</span>
                <span style={{ flex: 1 }}>{o}</span>
                {k && '✅'}
              </button>
            );
          })}

          {soal.tipe === 'bs' && (soal.pernyataan || []).map((p, i) => {
            const arr = Array.isArray(pilih) ? [...pilih] : [];
            const k = pembahasan && (soal.kunciJawaban || [])[i];
            return (
              <div key={i} style={{ ...S.opsi(false, k, pembahasan), cursor: 'default', display: 'block' }}>
                <div style={{ marginBottom: 6 }}>{i + 1}. {p}</div>
                {!pembahasan && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...S.btn2, ...(arr[i] === true ? { background: '#8e44ad', color: '#fff' } : {}) }} disabled={sudah}
                      onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = true; setPilih(a); }}>Benar</button>
                    <button style={{ ...S.btn2, ...(arr[i] === false ? { background: '#8e44ad', color: '#fff' } : {}) }} disabled={sudah}
                      onClick={() => { const a = [...(Array.isArray(pilih) ? pilih : [])]; a[i] = false; setPilih(a); }}>Salah</button>
                  </div>
                )}
                {pembahasan && <div style={{ fontSize: 12, fontWeight: 700, color: k ? '#27ae60' : '#e74c3c' }}>Kunci: {k ? 'Benar' : 'Salah'}</div>}
              </div>
            );
          })}

          {!sudah && !pembahasan && (
            <button style={S.btn} disabled={pilih === null || (Array.isArray(pilih) && pilih.length === 0)} onClick={kirim}>📤 Kirim Jawaban</button>
          )}
          {sudah && !pembahasan && <div style={{ fontSize: 12.5, color: '#27ae60', fontWeight: 700, marginTop: 8 }}>✅ Terkirim — menunggu guru membuka pembahasan.</div>}
          {pembahasan && soal.pembahasan && (
            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: 12, fontSize: 12.5, color: '#4c1d95', marginTop: 10 }}>💡 {soal.pembahasan}</div>
          )}
        </div>
      )}

      {sesi.tahap !== 'materi' && !soal && (
        <div style={S.card}>Menunggu guru menayangkan soal…</div>
      )}
    </div>
  );
}