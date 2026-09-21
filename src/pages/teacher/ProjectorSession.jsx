import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Volume2, Maximize2, Sparkles } from 'lucide-react';
import { dengarSesi, dengarPeserta, dengarRelawan } from '../../services/sesiService';
import { tahapDenganId, formatTimer, sisaTimer } from '../../utils/tahapKelas';
import '../../components/buku/liveSession.css';

export default function ProjectorSession() {
  const { sesiId } = useParams();
  const [sesi, setSesi] = useState(null);
  const [peserta, setPeserta] = useState([]);
  const [relawan, setRelawan] = useState([]);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const timerStatus = sesi?.timerStatus;

  useEffect(() => {
    if (!sesiId) return undefined;
    const u1 = dengarSesi(sesiId, setSesi);
    const u2 = dengarPeserta(sesiId, setPeserta);
    const u3 = dengarRelawan(sesiId, setRelawan);
    return () => { u1(); u2(); u3(); };
  }, [sesiId]);

  useEffect(() => {
    if (timerStatus !== 'running') return undefined;
    const id = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timerStatus]);

  const antrean = relawan.filter((r) => r.status === 'menunggu').slice(0, 8);
  const aktif = sesi?.relawanAktif;
  const tahap = tahapDenganId(sesi?.tahapKelas);
  const timerDetik = sisaTimer(sesi, clockNow);
  const nomorAktif = sesi?.mode === 'materi'
    ? `Slide ${(sesi.slideAktif || 0) + 1}`
    : sesi?.soalAktif != null ? `Soal ${(sesi.soalAktif || 0) + 1}` : 'Menunggu soal';

  if (!sesi) {
    return <div className="live-projector"><div className="live-projector-shell"><div className="live-projector-card">Memuat ruang proyektor…</div></div></div>;
  }

  return (
    <main className="live-projector">
      <div className="live-projector-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
        <div className="live-projector-kicker">BIMBEL GEMILANG · RUANG KELAS</div>
            <div className="live-stage-projector">{tahap.ikon} TAHAP: {tahap.label} <span style={{ opacity: .65 }}>•</span> {sesi.timerStatus === 'running' ? '⏱' : '◷'} {formatTimer(timerDetik)}</div>
            <h1 className="live-projector-title">Belajar bersama, berani mencoba.</h1>
            <p className="live-projector-subtitle">{tahap.bantuan} Guru sedang memandu {nomorAktif}.</p>
          </div>
          <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} style={{ border: 0, borderRadius: 12, padding: 12, background: 'rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer' }} title="Layar penuh"><Maximize2 size={20} /></button>
        </div>

        <div className="live-projector-grid">
          <section className={`live-projector-card ${aktif ? 'live-projector-active' : ''}`} aria-live="polite">
            {aktif ? (
              <>
                <div className="live-projector-kicker" style={{ color: '#fde68a' }}>🎤 SISWA YANG DIPANGGIL GURU</div>
                <div className="live-projector-active-name">{aktif.nama}</div>
                <div className="live-projector-active-hint"><Volume2 size={18} style={{ verticalAlign: 'middle' }} /> Silakan maju ke papan dan jelaskan caramu.</div>
                <div style={{ marginTop: 22, color: '#fef3c7', fontSize: 15 }}>Teman-teman, beri kesempatan untuk mencoba dan apresiasi keberaniannya.</div>
              </>
            ) : (
              <>
                <div className="live-projector-kicker">STATUS KELAS</div>
                <div className="live-projector-active-name" style={{ color: '#c4b5fd' }}>Siapa mau mencoba?</div>
                <div className="live-projector-active-hint" style={{ color: '#ddd6fe' }}>Tekan “Saya mau maju” di perangkatmu. Namamu akan masuk ke antrean keberanian.</div>
              </>
            )}
          </section>

          <aside className="live-projector-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c4b5fd', fontWeight: 900 }}><Users size={18} /> RUANG KELAS</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
              <div><strong style={{ display: 'block', fontSize: 28 }}>{peserta.length}</strong><span style={{ color: '#94a3b8', fontSize: 12 }}>siswa terhubung</span></div>
              <div><strong style={{ display: 'block', fontSize: 28 }}>{antrean.length}</strong><span style={{ color: '#94a3b8', fontSize: 12 }}>siap mencoba</span></div>
            </div>
            <div style={{ marginTop: 24, color: '#94a3b8', fontSize: 11, letterSpacing: 1.5, fontWeight: 900 }}>ANTREAN KEBERANIAN</div>
            <div className="live-projector-queue">
              {antrean.length === 0 && <div style={{ color: '#64748b', fontSize: 13 }}>Belum ada nama di antrean.</div>}
              {antrean.map((r, i) => <div className="live-projector-queue-item" key={r.id}><span>{i + 1}. {r.nama || 'Siswa'}</span><span style={{ color: '#fbbf24' }}>siap</span></div>)}
            </div>
            <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 10 }}><Sparkles size={17} color="#fbbf24" /><span style={{ fontSize: 12, color: '#cbd5e1' }}>Keberanian mencoba mendapat <b style={{ color: '#fef3c7' }}>+25 XP</b>.</span></div>
          </aside>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, color: '#94a3b8', fontSize: 12 }}>
          <span>Kode sesi: <strong className="live-projector-code">{sesi.kode}</strong></span>
          <span>Gemilang Classroom Companion</span>
        </div>
      </div>
    </main>
  );
}
