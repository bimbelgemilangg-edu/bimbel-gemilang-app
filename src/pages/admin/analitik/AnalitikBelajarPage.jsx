// src/pages/admin/analitik/AnalitikBelajarPage.jsx
// ============================================================
// 📊 DASHBOARD ANALITIK BELAJAR (permintaan owner 14 Okt 2026):
// "sistem yang soalnya disusun AI harus ada analisisnya: kecepatan
// mengerjakan siswa, kekuatan, kelemahan, dan progres nilai naik/turun".
//
// Cakupan: semua sesi SELESAI pada paket TKA/UTBK — termasuk paket yang
// soalnya dipilih AI oleh mesin try out otomatis (jenisUjian dibaca lewat
// jenisUjianUntukAnalitik supaya paket jalur tentor/manual berjudulkan
// TKA/UTBK ikut terbaca, perbaikan PR #214).
//
// Seluruh perhitungan ada di util murni utils/analitikBelajar.js
// (teruji); halaman ini hanya memuat data & merender.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, LineChart as LineChartIcon, Users, Timer, TrendingUp, Target } from 'lucide-react';
import { bangunAnalitikBelajar, IDEAL_DETIK_PER_SOAL , identitasTampilSiswa } from '../../../utils/analitikBelajar.js';
import { unduhLaporanOrangTuaPdf, dataBaganSkor } from '../../../utils/laporanOrangTuaPdf';
import { analitikPerSubtes, deskripsiSiswaLengkap } from '../../../utils/analitikBelajar';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { jenisUjianUntukAnalitik } from '../../../utils/papanJelajah.js';
import { hitungTotalSkor } from '../../../utils/skorSoalTryOut.js';

const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);

const kartu = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14 };
const chipArah = {
  naik: { latar: '#f0fdf4', teks: '#166534', border: '#bbf7d0', label: '▲ naik' },
  turun: { latar: '#fef2f2', teks: '#991b1b', border: '#fecaca', label: '▼ turun' },
  stabil: { latar: '#f8fafc', teks: '#475569', border: '#e2e8f0', label: '→ stabil' },
  baru: { latar: '#eff6ff', teks: '#1d4ed8', border: '#bfdbfe', label: '● baru' },
};

export default function AnalitikBelajarPage() {
  const navigate = useNavigate();
  const [memuat, setMemuat] = useState(true);
  const [baris, setBaris] = useState([]);

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const [snapPaket, snapSesi, snapSiswa] = await Promise.all([
          getDocs(collection(db, 'tryout_paket')),
          getDocs(query(collection(db, 'tryout_sesi'), where('status', '==', 'selesai'))),
          getDocs(collection(db, 'students')),
        ]);
        if (!hidup) return;
        const paketById = new Map();
        snapPaket.docs.forEach((d) => paketById.set(d.id, { id: d.id, ...d.data() }));
        const siswaById = new Map();
        // 🔥 FIX BUG 19 Okt: join dulu hanya memakai ID dokumen Firestore,
        // padahal sesi menyimpan KODE siswa (STD-...) yang hidup sebagai
        // FIELD studentId di dokumen students -> join gagal untuk SEMUA
        // siswa dan tabel jatuh ke ID. Kini map dikunci multi-kunci.
        snapSiswa.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() };
          siswaById.set(d.id, data);
          if (data.studentId) siswaById.set(String(data.studentId), data);
          if (data.kodeSiswa) siswaById.set(String(data.kodeSiswa), data);
        });
        const hasil = [];
        snapSesi.docs.forEach((d) => {
          const s = { id: d.id, ...d.data() };
          const p = paketById.get(s.paketId || s.tryoutId || '');
          const jenis = jenisUjianUntukAnalitik(p || {});
          if (!/tka|utbk/i.test(jenis)) return; // dashboard ini khusus TKA/UTBK
          const daftar = p?.daftarSoal || [];
          let subtes = (p?.subtes || []).map((sb) => {
            const ids = new Set(sb.soalIds || sb.daftarSoal || []);
            const kelompok = ids.size ? daftar.filter((q) => ids.has(q.id)) : [];
            const r = kelompok.length ? hitungTotalSkor(kelompok, s.jawaban || {}) : null;
            return { nama: sb.nama || sb.judul || 'Subtes', skorPersen: r?.totalSkorPersen ?? null };
          }).filter((x) => x.skorPersen !== null);
          // 🔥 20 Okt (koneksi data): paket try out otomatis/draf lama ada
          // yang TIDAK menyimpan struktur subtes -> kekuatan/kelemahan &
          // radar kosong ('—'). Turunkan subtes dari mapel butir bank agar
          // laporan tetap berdata penuh.
          if (!subtes.length && daftar.length) {
            const grup = new Map();
            daftar.forEach((q) => {
              const mp = q.mataPelajaran || q.mapel || q.materi || 'Umum';
              if (!grup.has(mp)) grup.set(mp, []);
              grup.get(mp).push(q);
            });
            subtes = [...grup.entries()].map(([nama, kelompok]) => ({
              nama,
              skorPersen: hitungTotalSkor(kelompok, s.jawaban || {})?.totalSkorPersen ?? null,
            })).filter((x) => x.skorPersen !== null);
          }
          const sv = siswaById.get(s.studentId) || {};
          const ident = identitasTampilSiswa(sv, s);
          hasil.push({
            studentId: s.studentId || '',
            nama: ident.nama,
            kelas: ident.kelas,
            jenjang: ident.jenjang || p?.jenjang || p?.targetJenjang || '',
            paketId: p?.id || '',
            jenisUjian: jenis,
            totalSkorPersen: s.totalSkorPersen,
            waktuSelesaiMs: ms(s.waktuSelesai),
            createdAtMs: ms(s.createdAt),
            totalSoal: p?.totalSoal || daftar.length,
            subtes,
          });
        });
        setBaris(hasil);
      } catch (e) {
        console.error('Gagal memuat analitik belajar:', e);
      } finally {
        if (hidup) setMemuat(false);
      }
    })();
    return () => { hidup = false; };
  }, []);

  const [fJenjang, setFJenjang] = useState('');
  const [fJenis, setFJenis] = useState('');
  const [fNama, setFNama] = useState('');
  const [analisisSiswa, setAnalisisSiswa] = useState(null); // 🔍 modal 19 Okt
  const barisTerpilah = useMemo(() => baris.filter((b) => {
    if (fJenjang && String(b.jenjang || '') !== fJenjang) return false;
    if (fJenis && String(b.jenisUjian || '') !== fJenis) return false;
    if (fNama && !`${b.nama} ${b.studentId}`.toLowerCase().includes(fNama.toLowerCase())) return false;
    return true;
  }), [baris, fJenjang, fJenis, fNama]);
  const opsiJenjang = useMemo(() => [...new Set(baris.map((b) => b.jenjang).filter(Boolean))].sort(), [baris]);
  const opsiJenis = useMemo(() => [...new Set(baris.map((b) => b.jenisUjian).filter(Boolean))].sort(), [baris]);
  const analitik = useMemo(() => bangunAnalitikBelajar(barisTerpilah), [barisTerpilah]);

  const barisSiswaModal = analisisSiswa ? baris.filter((b) => String(b.studentId) === String(analisisSiswa.studentId)) : [];
  const perSubtesModal = analitikPerSubtes(barisSiswaModal);
  const trenModal = dataBaganSkor(barisSiswaModal);
  const deskModal = analisisSiswa ? deskripsiSiswaLengkap(analisisSiswa, perSubtesModal) : [];
  const { kohort } = analitik;
  const trenTerakhir = kohort.trenPekan.length ? kohort.trenPekan[kohort.trenPekan.length - 1] : null;

  if (memuat) return <div style={{ padding: 30, color: '#6b7280' }}>Memuat analitik belajar…</div>;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 14, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
        <LineChartIcon size={22} color="#7c3aed" /> Analitik Belajar TKA/UTBK
      </h1>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>
        Kecepatan mengerjakan, kekuatan & kelemahan per subtes, dan arah progres nilai tiap siswa —
        dihitung dari sesi selesai paket TKA/UTBK (termasuk paket yang butirnya dipilih AI oleh mesin try out otomatis).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div style={kartu}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}><Users size={13} style={{ verticalAlign: -2 }} /> SISWA TERANALISIS</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginTop: 4 }}>{kohort.jumlahSiswa}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{kohort.jumlahSesi} sesi TKA/UTBK selesai</div>
        </div>
        <div style={kartu}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}><Timer size={13} style={{ verticalAlign: -2 }} /> TEMPO RATA-RATA</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: kohort.detikPerSoalRata === null ? '#94a3b8' : kohort.detikPerSoalRata <= IDEAL_DETIK_PER_SOAL ? '#16a34a' : '#dc2626', marginTop: 4 }}>
            {kohort.detikPerSoalRata === null ? '—' : `${kohort.detikPerSoalRata}s`}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>per soal · ideal ≤ {IDEAL_DETIK_PER_SOAL}s</div>
        </div>
        <div style={kartu}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}><TrendingUp size={13} style={{ verticalAlign: -2 }} /> TREN PEKAN TERAKHIR</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginTop: 4 }}>
            {trenTerakhir ? trenTerakhir.skor : '—'}
            {trenTerakhir?.delta != null ? (
              <span style={{ fontSize: 12, fontWeight: 800, color: trenTerakhir.delta >= 0 ? '#16a34a' : '#dc2626', marginLeft: 6 }}>
                {trenTerakhir.delta >= 0 ? '▲ +' : '▼ '}{trenTerakhir.delta}
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{trenTerakhir ? trenTerakhir.label : 'belum ada data'}</div>
        </div>
        <div style={kartu}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}><Target size={13} style={{ verticalAlign: -2 }} /> SUBTES PALING SERING LEMAH</div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {kohort.subtesLemahUmum.length === 0 ? <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span> : kohort.subtesLemahUmum.map((s) => (
              <span key={s.nama} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>
                {s.nama} · {s.jumlah} siswa
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>bahan pilihan bedah soal pekan depan</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 10px' }}>
        {/* 19 Okt: saringan jenjang & jenis ujian otomatis + cari nama */}
        <select value={fJenjang} onChange={(e) => setFJenjang(e.target.value)} style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}>
          <option value="">semua jenjang</option>
          {opsiJenjang.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <select value={fJenis} onChange={(e) => setFJenis(e.target.value)} style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}>
          <option value="">semua jenis ujian</option>
          {opsiJenis.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        <input value={fNama} onChange={(e) => setFNama(e.target.value)} placeholder="cari nama / ID siswa..." style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12, minWidth: 200 }} />
        <span style={{ fontSize: 11.5, color: '#64748b' }}>{barisTerpilah.length} sesi cocok · {analitik.siswa.length} siswa</span>
      </div>
      <div style={{ ...kartu, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 820 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
              {['#', 'Siswa', 'Kelas', 'Sesi', 'Skor rata-rata', 'Progres', 'Tempo', 'Kekuatan', 'Kelemahan', 'Laporan'].map((h, i) => (
                <th key={h} style={{ padding: '9px 10px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analitik.siswa.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>Belum ada sesi TKA/UTBK selesai untuk dianalisis.</td></tr>
            ) : analitik.siswa.map((s, i) => {
              const c = chipArah[s.arah] || chipArah.baru;
              return (
                <tr key={s.studentId} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{i + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1e293b' }}>{s.nama}</td>
                  <td style={{ padding: '8px 10px', color: '#6b7280' }}>{s.kelas || '—'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.jumlahSesi}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>{s.skorRata}%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ background: c.latar, color: c.teks, border: `1px solid ${c.border}`, borderRadius: 999, padding: '2px 9px', fontSize: 10.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {c.label}{s.delta !== null ? ` ${s.delta > 0 ? '+' : ''}${s.delta}` : ''}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: s.detikPerSoal === null ? '#94a3b8' : s.tempoWajar ? '#16a34a' : '#dc2626' }}>
                    {s.detikPerSoal === null ? '—' : `${s.detikPerSoal}s/soal`}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    {s.terkuat ? <span style={{ color: '#166534', fontWeight: 700 }}>{s.terkuat.nama} ({s.terkuat.skor}%)</span> : '—'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    {s.terlemah ? <span style={{ color: '#991b1b', fontWeight: 700 }}>{s.terlemah.nama} ({s.terlemah.skor}%)</span> : '—'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    {/* 19 Okt: unduh PDF laporan orang tua per anak (permintaan owner) */}
                    <button
                      type="button"
                      onClick={() => unduhLaporanOrangTuaPdf({
                        siswa: s,
                        barisSesi: baris.filter((b) => String(b.studentId) === String(s.studentId)),
                        identitas: { namaBimbel: 'Bimbel Gemilang', penandatangan: '', jabatan: 'Kepala Operasional Bimbel Gemilang' },
                      })}
                      style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', borderRadius: 8, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ⬇ PDF ortu
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalisisSiswa(s)}
                      style={{ border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', borderRadius: 8, padding: '5px 9px', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 6 }}
                    >
                      🔍 Analisis
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, lineHeight: 1.6 }}>
        Progres = selisih skor dua sesi terakhir siswa (±{`≥5`} poin = naik/turun). Tempo dihitung dari waktu mulai→selesai
        sesi yang sah; sesi susulan offline jujur tidak punya tempo. Kekuatan/kelemahan = rata-rata skor per subtes lintas sesi.
      </p>
    
      {analisisSiswa && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 'min(980px, 96vw)', maxHeight: '92vh', overflow: 'auto', padding: 18, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>🔍 Analisis per subtes — {analisisSiswa.nama}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>kelas {analisisSiswa.kelas || '-'} · {analisisSiswa.jumlahSesi} sesi · diagram naik-turun & laba-laba + deskripsi kuantitatif</div>
              </div>
              <button type="button" onClick={() => setAnalisisSiswa(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Tutup</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginTop: 12 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 6 }}>DIAGRAM NAIK-TURUN (skor per sesi)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trenModal}>
                    <XAxis dataKey="label" fontSize={10} /><YAxis domain={[0, 100]} fontSize={10} />
                    <Tooltip /><Legend />
                    <Line type="monotone" dataKey="skor" name="skor %" stroke="#5B2ECC" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 6 }}>DIAGRAM LABA-LABA (akurasi per subtes)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={perSubtesModal.map((x) => ({ subtes: x.nama, skor: x.skorRata }))} outerRadius="70%">
                    <PolarGrid /><PolarAngleAxis dataKey="subtes" fontSize={9} /><PolarRadiusAxis domain={[0, 100]} fontSize={8} />
                    <Radar name="akurasi %" dataKey="skor" stroke="#0f767e" fill="#0f767e" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 6 }}>DESKRIPSI ANALISIS (objektif & kuantitatif)</div>
              {deskModal.map((d, di) => <p key={di} style={{ fontSize: 12, color: '#334155', lineHeight: 1.65, margin: '0 0 6px' }}>{d}</p>)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => unduhLaporanOrangTuaPdf({ siswa: analisisSiswa, barisSesi: barisSiswaModal, identitas: { namaBimbel: 'Bimbel Gemilang', penandatangan: '', jabatan: 'Kepala Operasional Bimbel Gemilang' } })} style={{ border: 'none', background: '#166534', color: '#fff', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                ⬇ Unduh PDF laporan ortu (lengkap per bagian)
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
