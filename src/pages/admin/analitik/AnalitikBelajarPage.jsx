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
import { ArrowLeft, LineChart, Users, Timer, TrendingUp, Target } from 'lucide-react';
import { bangunAnalitikBelajar, IDEAL_DETIK_PER_SOAL } from '../../../utils/analitikBelajar.js';
import { unduhLaporanOrangTuaPdf } from '../../../utils/laporanOrangTuaPdf';
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
        snapSiswa.docs.forEach((d) => siswaById.set(d.id, { id: d.id, ...d.data() }));
        const hasil = [];
        snapSesi.docs.forEach((d) => {
          const s = { id: d.id, ...d.data() };
          const p = paketById.get(s.paketId || s.tryoutId || '');
          const jenis = jenisUjianUntukAnalitik(p || {});
          if (!/tka|utbk/i.test(jenis)) return; // dashboard ini khusus TKA/UTBK
          const daftar = p?.daftarSoal || [];
          const subtes = (p?.subtes || []).map((sb) => {
            const ids = new Set(sb.soalIds || sb.daftarSoal || []);
            const kelompok = ids.size ? daftar.filter((q) => ids.has(q.id)) : [];
            const r = kelompok.length ? hitungTotalSkor(kelompok, s.jawaban || {}) : null;
            return { nama: sb.nama || sb.judul || 'Subtes', skorPersen: r?.totalSkorPersen ?? null };
          }).filter((x) => x.skorPersen !== null);
          const sv = siswaById.get(s.studentId) || {};
          hasil.push({
            studentId: s.studentId || '',
            nama: sv.nama || sv.name || s.studentId || '(tanpa nama)',
            kelas: sv.kelas || sv.kelasSekolah || '',
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

  const analitik = useMemo(() => bangunAnalitikBelajar(baris), [baris]);
  const { kohort } = analitik;
  const trenTerakhir = kohort.trenPekan.length ? kohort.trenPekan[kohort.trenPekan.length - 1] : null;

  if (memuat) return <div style={{ padding: 30, color: '#6b7280' }}>Memuat analitik belajar…</div>;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 14, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
        <LineChart size={22} color="#7c3aed" /> Analitik Belajar TKA/UTBK
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
    </div>
  );
}
