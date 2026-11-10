// src/pages/public/tobk/TobkSelesaiPage.jsx
// ============================================================
// BUKTI PENYERAHAN & KONFIRMASI SELESAI TOBK GEMILANG
// (E-Ticket Resmi, Ringkasan Hasil, & Lead Follow-up)
// ============================================================

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, AlertOctagon, Trophy, Award, ShieldCheck,
  Calendar, Clock, User, School, Target, Share2, MessageCircle, Home
} from 'lucide-react';

export default function TobkSelesaiPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const hasil = location.state?.hasil || {
    statusUjian: 'selesai',
    skor: 80,
    totalBenar: 4,
    totalSalah: 1,
    totalKosong: 0,
    totalPelanggaran: 0,
    totalSoal: 5,
    waktuSelesai: new Date().toISOString(),
  };

  const peserta = location.state?.peserta || {
    pesertaId: 'lead_guest',
    nama: 'Peserta Ujian',
    whatsapp: '-',
    asalSekolah: 'Sekolah Menengah',
    targetPtn: 'PTN Impian',
    targetJurusan: 'Jurusan Favorit',
  };

  const eventData = location.state?.eventData || {
    judul: 'TRY OUT AKBAR UTBK GEMILANG 2026',
    kategori: 'UTBK',
  };

  const isDiskualifikasi = hasil.statusUjian === 'diskualifikasi';

  // Format Nomor WhatsApp Admin Gemilang
  const adminWaLink = `https://wa.me/6281234567890?text=Halo%20Bimbel%20Gemilang%2C%20saya%20${encodeURIComponent(peserta.nama || '')}%20telah%20menyelesaikan%20${encodeURIComponent(eventData.judul || 'Tryout')}%20dan%20ingin%20konsultasi%20analisis%20nilai%20PTN.`;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '40px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Banner Ucapan */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isDiskualifikasi ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
              color: isDiskualifikasi ? '#ef4444' : '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            {isDiskualifikasi ? <AlertOctagon size={36} /> : <CheckCircle2 size={36} />}
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', color: '#ffffff' }}>
            {isDiskualifikasi ? 'Ujian Dihentikan (Diskualifikasi)' : 'Ujian Telah Berhasil Diserahkan!'}
          </h1>

          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {isDiskualifikasi
              ? 'Terdeteksi pelanggaran melebihi batas toleransi pengawasan CBT. Data tercatat pada sistem.'
              : 'Jawaban Anda telah tersimpan dengan aman pada basis data pengawasan ujian Bimbel Gemilang.'}
          </p>
        </div>

        {/* E-Ticket / Bukti Pengerjaan Resmi */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            color: '#0f172a',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            marginBottom: '24px',
          }}
        >
          {/* Header Tiket */}
          <div style={{ background: isDiskualifikasi ? '#dc2626' : '#2563eb', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/pwa-192x192.png" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
              <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px' }}>
                TANDA TERIMA CBT RESMI
              </div>
            </div>

            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontFamily: 'monospace' }}>
              {peserta.pesertaId || 'ID-OFFICIAL'}
            </span>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Event Name */}
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              {eventData.judul}
            </div>

            {/* Grid Data Peserta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Nama Peserta</div>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{peserta.nama}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Asal Sekolah</div>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{peserta.asalSekolah}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Target Impian</div>
                <div style={{ fontWeight: 600, color: '#2563eb' }}>
                  {peserta.targetPtn} · {peserta.targetJurusan}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Waktu Selesai</div>
                <div style={{ fontWeight: 600, color: '#334155' }}>
                  {new Date(hasil.waktuSelesai || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>
            </div>

            {/* Ringkasan Skor */}
            {!isDiskualifikasi && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Skor Anda</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#2563eb' }}>{hasil.skor}</div>
                </div>

                <div style={{ height: '36px', width: '1px', background: '#cbd5e1' }} />

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Benar</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{hasil.totalBenar}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Salah</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{hasil.totalSalah}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Kosong</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#64748b' }}>{hasil.totalKosong}</div>
                </div>
              </div>
            )}

            {/* Status Pengawasan AI */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#166534' }}>
              <ShieldCheck size={18} />
              <div>
                <strong>Pengawasan AI Proctor:</strong> Ujian diselesaikan dengan pengawasan kamera dan proteksi browser layar penuh.
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Marketing Gemilang */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#ffffff' }}>
            Ingin Tahu Peluang Lolos di {peserta.targetPtn || 'PTN Impian'}?
          </h3>

          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
            Konsultasikan hasil try out Anda bersama tim konsultan akademik Bimbel Gemilang. Dapatkan pemetaan subtes lemah dan rekomendasi strategi belajar gratis.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={adminWaLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#22c55e', color: '#ffffff', textDecoration: 'none',
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
              }}
            >
              <MessageCircle size={16} /> Konsultasi Nilai via WhatsApp
            </a>

            <button
              onClick={() => navigate('/tobk')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#334155', color: '#f8fafc', border: 'none',
                padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Home size={15} /> Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
