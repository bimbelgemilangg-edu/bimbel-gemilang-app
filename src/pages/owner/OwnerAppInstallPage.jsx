// src/pages/owner/OwnerAppInstallPage.jsx
// ============================================================
// HALAMAN RAHASIA INSTALASI APLIKASI OWNER (PWA STANDALONE)
// Memungkinkan Owner memasang aplikasi "Gemilang Owner" langsung
// di layar utama ponsel (Android / iPhone) agar setiap ada mutasi
// m-banking, Owner tinggal buka dari layar HP seperti aplikasi native.
// Halaman ini TIDAK ditampilkan di menu publik, siswa, maupun guru.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Smartphone, Download, Share, PlusSquare, ArrowRight,
  ShieldCheck, CheckCircle2, Lock, Sparkles, ExternalLink
} from 'lucide-react';

export default function OwnerAppInstallPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Pasang Manifest Khusus Owner secara Dinamis
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = '/manifest-owner.json';

    // 2. Pasang Meta Khusus iOS
    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitle) {
      appleTitle = document.createElement('meta');
      appleTitle.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitle);
    }
    appleTitle.content = 'Gemilang Owner';

    // 3. Deteksi Perangkat & Status Standalone (PWA)
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // 4. Tangkap Event PWA Install untuk Android / Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Untuk pengguna Android: Buka menu Chrome (titik tiga di kanan atas) lalu pilih "Tambahkan ke Layar Utama" atau "Install Aplikasi".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div style={styles.container}>
      {/* Background Glow */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.card}>
        {/* Header Icon */}
        <div style={styles.iconCircle}>
          <Crown size={32} color="#fbbf24" />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, margin: '0 auto 12px' }}>
          <Lock size={12} /> TAUTAN RAHASIA KHUSUS OWNER
        </div>

        <h1 style={styles.title}>Aplikasi Manajemen Bimbel</h1>
        <p style={styles.subtitle}>
          Pasang aplikasi khusus Owner di layar ponsel Anda. Setiap ada mutasi di m-banking, Anda tinggal buka aplikasi dari layar utama HP dalam 1 detik.
        </p>

        {/* STATUS JIKA SUDAH STANDALONE */}
        {isStandalone ? (
          <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: 14, padding: '16px', margin: '20px 0', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#34d399', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
              <CheckCircle2 size={18} /> Aplikasi Sudah Terpasang!
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#a7f3d0' }}>
              Anda sedang membuka aplikasi dalam mode native standalone.
            </p>
          </div>
        ) : (
          /* PANDUAN INSTALASI */
          <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isIOS ? (
              /* INSTRUKSI IPHONE / IOS SAFARI */
              <div style={styles.guideBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
                  <Smartphone size={16} /> Cara Pasang di iPhone (Safari):
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.8 }}>
                  <li>Ketuk tombol <b>Bagikan (Share) 📤</b> di bagian bawah layar Safari.</li>
                  <li>Gulir ke bawah dan ketuk <b>"Tambahkan ke Layar Utama" (Add to Home Screen) ➕</b>.</li>
                  <li>Ketuk <b>"Tambah" (Add)</b> di pojok kanan atas.</li>
                </ol>
                <div style={{ marginTop: 10, fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
                  ✓ Ikon emas <b>Gemilang Owner</b> akan langsung muncul di beranda iPhone Anda.
                </div>
              </div>
            ) : (
              /* TOMBOL INSTAL ANDROID */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  style={styles.btnInstall}
                >
                  <Download size={18} /> Pasang Aplikasi di Layar HP
                </button>
                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                  Jika tombol di atas tidak muncul, ketuk menu Chrome (titik tiga di kanan atas) lalu pilih <b>"Tambahkan ke Layar Utama"</b> atau <b>"Install Aplikasi"</b>.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TOMBOL LANGSUNG BUKA DASHBOARD */}
        <button
          type="button"
          onClick={() => navigate('/login-owner')}
          style={styles.btnOpen}
        >
          👑 Buka Portal Owner Langsung <ArrowRight size={16} />
        </button>

        {/* PRIVACY BADGE */}
        <div style={styles.footerInfo}>
          <ShieldCheck size={14} color="#60a5fa" />
          <span>Aman & Rahasia: Siswa dan guru tidak memiliki akses ke halaman ini.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #060911 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },
  glow1: {
    position: 'absolute', width: 340, height: 340, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.1), transparent 70%)',
    top: '5%', left: '10%', pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', width: 380, height: 380, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.1), transparent 70%)',
    bottom: '5%', right: '10%', pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 440,
    background: 'rgba(30, 41, 59, 0.75)',
    border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: 24,
    padding: '32px 24px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  iconCircle: {
    width: 68, height: 68, borderRadius: '50%',
    background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 0 25px rgba(251,191,36,0.2)',
  },
  title: { color: 'white', fontSize: 22, fontWeight: 800, margin: '0 0 8px' },
  subtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 1.6, margin: 0 },
  guideBox: {
    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: 14, padding: '16px', textAlign: 'left',
  },
  btnInstall: {
    width: '100%', padding: '14px 20px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    color: '#0f172a', fontWeight: 800, fontSize: 14, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
  },
  btnOpen: {
    width: '100%', padding: '13px 20px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: '0.2s', marginTop: 10,
  },
  footerInfo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 20, color: '#64748b', fontSize: 11, lineHeight: 1.4,
  },
};
