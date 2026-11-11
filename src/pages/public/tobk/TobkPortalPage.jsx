// src/pages/public/tobk/TobkPortalPage.jsx
// ============================================================
// PORTAL PENDAFTARAN TOBK AKBAR & EVENT PUBLIK BIMBEL GEMILANG
// (Landing Page & Marketing Lead Capture)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Sparkles, CheckCircle2, ShieldCheck, Clock, Camera,
  ArrowRight, Users, Award, BookOpen, AlertCircle
} from 'lucide-react';
import {
  ambilEventTobkAktifPublik, daftarPesertaTobk, simpanEventTobk,
  SOAL_PRESET_UTBK
} from '../../../services/tobkPublikService';

export default function TobkPortalPage() {
  const navigate = useNavigate();
  const [eventAktif, setEventAktif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Data Diri Peserta Luar
  const [formData, setFormData] = useState({
    nama: '',
    whatsapp: '',
    asalSekolah: '',
    kota: '',
    targetPtn: '',
    targetJurusan: '',
  });

  const [pesanError, setPesanError] = useState('');

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const eventIdParam = params.get('event');
        const tokenParam = params.get('token');
        if (tokenParam) {
          sessionStorage.setItem('tobk_prefill_token', tokenParam.trim());
        }

        let ev = null;
        if (eventIdParam) {
          ev = await ambilEventTobkById(eventIdParam);
        }
        if (!ev) {
          ev = await ambilEventTobkAktifPublik();
        }
        if (!ev) {
          // Buat default event jika belum ada
          const defaultEvent = {
            id: 'tobk_akbar_nasional_2026',
            judul: 'TRY OUT AKBAR UTBK-SNBT NASIONAL 2026',
            kategori: 'UTBK',
            durasiMenit: 90,
            token: 'GEMILANG2026',
            tokenAktif: true,
            maksimalPelanggaran: 3,
            wajibKamera: true,
            daftarSoal: SOAL_PRESET_UTBK,
            totalSoal: SOAL_PRESET_UTBK.length,
            keterangan: 'Simulasi CBT Skala Nasional dengan Pengawasan Kamera & Standar SNPMB Pusmendik',
            status: 'aktif',
          };
          ev = await simpanEventTobk(defaultEvent);
        }
        setEventAktif(ev);
      } catch (err) {
        console.error('Gagal inisialisasi event TOBK:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSubmitDaftar = async (e) => {
    e.preventDefault();
    setPesanError('');

    if (!formData.nama.trim()) {
      setPesanError('Nama lengkap wajib diisi!');
      return;
    }

    const waBersih = formData.whatsapp.replace(/[^0-9]/g, '');
    if (waBersih.length < 9) {
      setPesanError('Nomor WhatsApp tidak valid (minimal 10 digit angka)!');
      return;
    }

    if (!formData.asalSekolah.trim()) {
      setPesanError('Asal sekolah wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const peserta = await daftarPesertaTobk(eventAktif?.id, {
        ...formData,
        kategori: eventAktif?.kategori || 'UTBK',
      });

      // Lanjut ke Ruang Tunggu & Input Token
      navigate('/tobk/ruang-tunggu');
    } catch (err) {
      setPesanError('Gagal mendaftar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/pwa-192x192.png" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px', color: '#f59e0b' }}>
              BIMBEL GEMILANG
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              CBT Portal Nasional
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#93c5fd' }}>
          <ShieldCheck size={14} /> 100% Proctored CBT Engine
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
          {/* Kolom Kiri: Info Event & Keunggulan */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '16px' }}>
              <Trophy size={14} /> EVENT TERBUKA · GRATIS & BERSERTIFIKAT
            </div>

            <h1 style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.25, margin: '0 0 16px', color: '#ffffff' }}>
              {eventAktif?.judul || 'TRY OUT AKBAR UTBK GEMILANG'}
            </h1>

            <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 24px' }}>
              Uji kemampuan akademikmu dengan sistem ujian Computer Based Test (CBT) standar SNPMB Pusmendik. Dilengkapi sistem pengawasan AI Proctoring, analisis akurasi, dan sertifikat resmi.
            </p>

            {/* List Fitur Unggulan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '10px' }}>
                <Clock size={20} style={{ color: '#38bdf8' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Timer Ujian: {eventAktif?.durasiMenit || 90} Menit</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Manajemen waktu realistis per subtes & mapel</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '10px' }}>
                <Camera size={20} style={{ color: '#4ade80' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Webcam Anti-Curang (AI Proctor)</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Kamera aktif mengawasi kejujuran dan integritas selama tes</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '10px' }}>
                <ShieldCheck size={20} style={{ color: '#f59e0b' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Layar Terkunci (Kiosk Mode)</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Sistem 3 Strike: Dilarang beralih tab atau membuka aplikasi lain</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748b' }}>
              *Tidak memerlukan akun bimbel internal. Peserta dari sekolah mana pun dapat langsung mendaftar.
            </div>
          </div>

          {/* Kolom Kanan: Form Pendaftaran Cepat (Lead Capture) */}
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '30px 24px', color: '#0f172a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', background: '#dbeafe', color: '#1d4ed8', padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Langkah 1 Dari 2
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                Form Registrasi Peserta
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Lengkapi identitas untuk penerbitan tiket ujian & sertifikat
              </p>
            </div>

            {pesanError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertCircle size={16} /> {pesanError}
              </div>
            )}

            <form onSubmit={handleSubmitDaftar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Nama Lengkap Peserta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Nilai dan pembahasan akan dikirimkan ke nomor WhatsApp ini
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Asal Sekolah / Kampus *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SMAN 1 Surabaya"
                    value={formData.asalSekolah}
                    onChange={(e) => setFormData({ ...formData, asalSekolah: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Surabaya"
                    value={formData.kota}
                    onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Target PTN Impian
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: UI / ITB / UGM"
                    value={formData.targetPtn}
                    onChange={(e) => setFormData({ ...formData, targetPtn: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Target Jurusan / Prodi
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Kedokteran"
                    value={formData.targetJurusan}
                    onChange={(e) => setFormData({ ...formData, targetJurusan: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#2563eb', color: '#ffffff', border: 'none',
                  padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: submitting ? 'wait' : 'pointer', marginTop: '6px',
                  boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)'
                }}
              >
                {submitting ? 'Memproses Pendaftaran...' : 'Daftar & Masuk Ruang Tunggu'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
