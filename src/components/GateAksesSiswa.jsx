// src/components/GateAksesSiswa.jsx
// Bungkus halaman belajar: jika isBlocked / nonaktif → layar jelas,
// bukan 0 XP misterius. Halaman Keuangan & Dashboard tidak perlu gate ini.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Wallet, MessageCircle } from 'lucide-react';
import { muatStatusSiswa, pesanBlokir } from '../utils/statusAkunSiswa';

const WA_ADMIN = 'https://wa.me/628135752327';

export default function GateAksesSiswa({ children, fitur = 'fitur belajar' }) {
  const navigate = useNavigate();
  const [cek, setCek] = useState({ loading: true, aktif: true, student: null });

  useEffect(() => {
    let hidup = true;
    (async () => {
      const h = await muatStatusSiswa();
      if (!hidup) return;
      setCek({ loading: false, aktif: h.aktif, student: h.student });
      // simpan flag lokal biar sidebar/menu bisa baca cepat
      if (h.student) {
        localStorage.setItem('studentIsBlocked', h.student.isBlocked ? '1' : '0');
        if (h.student.status) localStorage.setItem('studentStatus', h.student.status);
      }
    })();
    return () => { hidup = false; };
  }, []);

  if (cek.loading) {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <p style={{ color: '#64748b', margin: 0 }}>Memeriksa status akun…</p>
        </div>
      </div>
    );
  }

  if (!cek.aktif) {
    const p = pesanBlokir(cek.student);
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.iconBox}>
            <Lock size={36} color="#ef4444" />
          </div>
          <h2 style={S.judul}>{p.judul}</h2>
          <p style={S.isi}>{p.isi}</p>
          <p style={S.hint}>
            Fitur <b>{fitur}</b> terkunci. Itu sebabnya XP sering terlihat 0 dan namamu tidak muncul di papan peringkat — sampai admin menandai akun <b>Aktif</b> (pembayaran lunas/disetujui).
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
            <button type="button" style={S.btnSecondary} onClick={() => navigate('/siswa/keuangan')}>
              <Wallet size={16} /> Lihat Administrasi
            </button>
            <button type="button" style={S.btnPrimary} onClick={() => window.open(WA_ADMIN, '_blank')}>
              <MessageCircle size={16} /> Hubungi Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

const S = {
  wrap: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: '#f8fafc',
  },
  card: {
    maxWidth: 440,
    width: '100%',
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #fee2e2',
    boxShadow: '0 8px 24px rgba(239,68,68,.08)',
    padding: '28px 24px',
    textAlign: 'center',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
  },
  judul: { margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1e293b' },
  isi: { margin: 0, fontSize: 14, lineHeight: 1.65, color: '#64748b' },
  hint: {
    margin: '14px 0 0',
    fontSize: 12.5,
    lineHeight: 1.6,
    color: '#92400e',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: '10px 12px',
    textAlign: 'left',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#4C6EF5',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
};