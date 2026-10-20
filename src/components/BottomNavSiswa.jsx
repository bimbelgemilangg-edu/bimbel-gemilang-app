// src/components/BottomNavSiswa.jsx
// ============================================================
// NAVIGASI BAWAH ala app bank (20 Okt 2026, permintaan owner): empat
// slot datar + SATU tombol melayang di tengah = "AKSES BELAJAR
// MUDAH" (hub e-learning + buku digital). Hanya tampil di layar
// sempit (<=820px) supaya ponsel terasa seperti aplikasi asli;
// desktop tetap memakai sidebar. Slot aktif dihitung util murni
// menuBawahSiswa (teruji).
// ============================================================
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Rocket, GraduationCap, Calendar, UserCheck } from 'lucide-react';
import { DAFTAR_MENU_BAWAH, menuAktifBawah } from '../utils/menuBawahSiswa';

const IKON = { Home, Rocket, GraduationCap, Calendar, UserCheck };

export default function BottomNavSiswa() {
  const [mobile, setMobile] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth <= 820));
  useEffect(() => {
    const h = () => setMobile(window.innerWidth <= 820);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const aktif = menuAktifBawah(pathname);
  if (!mobile) return null;
  return (
    <>
      {/* spacer agar konten tidak tertutup bar */}
      <div style={{ height: 84 }} aria-hidden="true" />
      <nav
        aria-label="Navigasi bawah siswa"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
          background: '#ffffff', borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 16px rgba(15,23,42,0.10)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
          padding: '6px 6px calc(10px + env(safe-area-inset-bottom))',
        }}
      >
        {DAFTAR_MENU_BAWAH.map((m) => {
          const Ikon = IKON[m.icon] || Home;
          if (m.tengah) {
            const on = aktif === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(m.rute)}
                title="Akses Belajar Mudah — e-learning & buku digital"
                style={{
                  width: 64, height: 64, borderRadius: '50%', marginTop: -36,
                  background: 'linear-gradient(135deg,#8B5CF6,#5B2ECC)',
                  color: '#fff', border: '4px solid #fff',
                  boxShadow: on ? '0 8px 22px rgba(91,46,204,0.55)' : '0 6px 16px rgba(91,46,204,0.38)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <GraduationCap size={22} />
                <span style={{ fontSize: 7.5, fontWeight: 800, marginTop: 1, letterSpacing: 0.2 }}>BELAJAR</span>
              </button>
            );
          }
          const on = aktif === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate(m.rute)}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: on ? '#5B2ECC' : '#94a3b8',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                fontSize: 10, fontWeight: 700, padding: '4px 10px',
              }}
            >
              <Ikon size={20} strokeWidth={on ? 2.6 : 2} />
              {m.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
