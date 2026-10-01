// src/pages/LoginAdmin.jsx
// ⚠️ CATATAN KEAMANAN: halaman ini bagian dari pemisahan akun admin.
// Ia memberi akuntabilitas, tapi BUKAN perbaikan keamanan selama
// Firestore Rules masih terbuka. Lihat
// docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md sebelum mengandalkan
// pembatasan peran di sini sebagai kendali keamanan.
// ============================================================
// 🔥 BARU (pemisahan akun Admin): halaman login khusus staf admin,
// terpisah dari portal Guru / Siswa / Owner.
//
// Bedanya dengan login admin lama (yang nempel di Login.jsx):
//   LAMA : satu password bersama untuk SEMUA staf, tanpa username
//          -> tidak bisa tahu siapa yang masuk, tidak bisa cabut akses
//             satu orang, ganti staf = ganti password semua orang.
//   BARU : tiap staf punya username + password sendiri, password
//          di-hash PBKDF2, dan setiap percobaan masuk dicatat ke
//          jejak audit (audit_logs) lengkap dengan perangkat & waktu.
//
// JALUR WARISAN: kalau kolom username dikosongkan, halaman ini masih
// menerima password admin lama (settings.adminPassword) supaya TIDAK
// ADA staf yang terkunci saat update ini pertama kali dipasang.
// Setelah Owner selesai membuat akun per orang, jalur ini bisa
// dimatikan dari Pengaturan.
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Eye, EyeOff, User, Lock, AlertTriangle, Info } from 'lucide-react';
import { loginAdmin, normalisasiUsername, hapusSesiAdmin } from '../utils/adminAuth';
import { catatAudit, KATEGORI } from '../utils/auditLog';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Ambang pembatas percobaan (perlambatan brute-force sisi klien).
// Ini BUKAN pengganti Firestore Security Rules, tapi cukup untuk
// mencegah salah ketik berulang yang membanjiri kuota baca.
const MAKS_PERCOBAAN = 5;
const DENDA_MENIT = 2;
const KEY_COOLDOWN = 'gemilang:admin-login-cooldown';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sisaPercobaan, setSisaPercobaan] = useState(MAKS_PERCOBAAN);
  const [ cooldownAktif, setCooldownAktif ] = useState(false);
  const [detikCooldown, setDetikCooldown] = useState(0);
  const [bolehLegacy, setBolehLegacy] = useState(true);
  const inputUserRef = useRef(null);

  // --------------------------------------------------------
  // Baca preferensi owner: apakah password bersama masih boleh?
  // Gagal baca = anggap boleh (jangan pernah mengunci orang keluar
  // hanya karena masalah jaringan).
  // --------------------------------------------------------
  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global_config'));
        if (batal) return;
        const data = snap.exists() ? snap.data() : {};
        // Default: boleh, kecuali owner dengan tegas mematikan.
        setBolehLegacy(data.izinkanLoginAdminLegacy !== false);
      } catch {
        if (!batal) setBolehLegacy(true);
      }
    })();
    return () => { batal = true; };
  }, []);

  // --------------------------------------------------------
  // Cooldown setelah terlalu banyak percobaan gagal.
  // Disimpan di localStorage supaya reload tidak meresetnya.
  // --------------------------------------------------------
  useEffect(() => {
    const hitung = () => {
      try {
        const until = Number(localStorage.getItem(KEY_COOLDOWN) || 0);
        const sisa = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        setDetikCooldown(sisa);
        setCooldownAktif(sisa > 0);
        return sisa;
      } catch {
        return 0;
      }
    };
    if (hitung() <= 0) return undefined;
    const iv = setInterval(() => {
      if (hitung() <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const aktifkanCooldown = () => {
    try {
      localStorage.setItem(KEY_COOLDOWN, String(Date.now() + DENDA_MENIT * 60 * 1000));
    } catch { /* localStorage bisa penuh/diblokir; abaikan */ }
    setCooldownAktif(true);
    setDetikCooldown(DENDA_MENIT * 60);
    setSisaPercobaan(MAKS_PERCOBAAN);
  };

  // --------------------------------------------------------
  // Kalau sudah ada sesi admin/owner yang sah, langsung masuk.
  // Hindari orang harus login dua kali setelah reload.
  // --------------------------------------------------------
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (localStorage.getItem('isOwnerLoggedIn') === 'true' && role === 'owner') {
      navigate('/owner/finance', { replace: true });
      return;
    }
    if (localStorage.getItem('isLoggedIn') === 'true' && role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const formatDetik = (d) => `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (cooldownAktif) {
      setError(`Terlalu banyak percobaan gagal. Coba lagi dalam ${formatDetik(detikCooldown)}.`);
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      inputUserRef.current?.focus();
      return;
    }

    setLoading(true);
    const u = normalisasiUsername(username);

    try {
      const hasil = await loginAdmin({
        username: u,
        password,
        izinkanLegacy: bolehLegacy,
      });

      if (hasil.ok) {
        try { localStorage.removeItem(KEY_COOLDOWN); } catch { /* abaikan */ }
        setSisaPercobaan(MAKS_PERCOBAAN);

        if (hasil.jalur === 'legacy') {
          // Dicatat TERPISAH dan mencolok: ini jalur yang mau kita pensiunkan.
          catatAudit('login.legacy', {
            kategori: KATEGORI.AUTH,
            aktorOverride: { aktor: 'admin-legacy', aktorNama: 'Admin (password bersama)', peran: 'legacy' },
            target: 'Login tanpa username',
            detail: { catatan: 'Masih memakai password admin bersama yang lama' },
          });
        } else {
          catatAudit('login.sukses', {
            kategori: KATEGORI.AUTH,
            target: `Akun: ${hasil.sesi?.username || '-'}`,
            detail: { peran: hasil.sesi?.peran || '-' },
          });
        }

        navigate('/admin', { replace: true });
        return;
      }

      // ---- GAGAL ----
      const gagalSisa = sisaPercobaan - 1;

      // Jejak audit untuk percobaan gagal. Penting: catat username yang
      // DICOBAT (bukan password) supaya owner bisa lihat pola percobaan
      // masuk ke akun tertentu.
      catatAudit('login.gagal', {
        kategori: KATEGORI.AUTH,
        aktorOverride: {
          aktor: u || 'tanpa-username',
          aktorNama: u || '(tanpa username)',
          peran: 'tak-dikenal',
        },
        target: u ? `Akun dicoba: ${u}` : 'Login tanpa username',
        detail: {
          alasan: hasil.pesan,
          jalur: hasil.jalur,
          sisaPercobaan: Math.max(0, gagalSisa),
        },
      });

      if (gagalSisa <= 0) {
        aktifkanCooldown();
        setError(`Terlalu banyak percobaan gagal. Login dikunci sementara selama ${DENDA_MENIT} menit.`);
      } else {
        setSisaPercobaan(gagalSisa);
        setError(`${hasil.pesan} (sisa ${gagalSisa} percobaan sebelum dikunci sementara)`);
      }
      setPassword('');
    } catch (err) {
      console.error('Login Admin Error:', err);
      setError(`Gagal memproses login: ${err?.message || 'kesalahan tidak diketahui'}`);
      catatAudit('login.error', {
        kategori: KATEGORI.AUTH,
        aktorOverride: { aktor: u || 'tanpa-username', aktorNama: u || '(tanpa username)', peran: 'tak-dikenal' },
        detail: { pesanError: String(err?.message || err) },
      });
    } finally {
      setLoading(false);
    }
  };

  const u = normalisasiUsername(username);
  const modeLegacy = !u && bolehLegacy;

  return (
    <div style={styles.container}>
      <div style={styles.background}>
        <div style={styles.glow1} />
        <div style={styles.glow2} />
      </div>

      <div style={styles.card}>
        <button type="button" onClick={() => navigate('/')} style={styles.backBtn}>
          <ArrowLeft size={16} /> Kembali
        </button>

        <div style={styles.iconArea}>
          <div style={styles.iconCircle}>
            <Shield size={30} color="#60a5fa" />
          </div>
          <h1 style={styles.title}>Portal Admin</h1>
          <p style={styles.subtitle}>Masuk dengan akun staf Anda sendiri</p>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="admin-username">
              <User size={12} /> Username
            </label>
            <input
              id="admin-username"
              ref={inputUserRef}
              type="text"
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              style={styles.input}
              placeholder="nama.akun"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              maxLength={24}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="admin-password">
              <Lock size={12} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                style={{ ...styles.input, paddingRight: 44 }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || cooldownAktif}
            style={{ ...styles.btnSubmit, opacity: loading || cooldownAktif ? 0.55 : 1 }}
          >
            {cooldownAktif
              ? `⏳ Dikunci ${formatDetik(detikCooldown)}`
              : loading ? '⏳ Memverifikasi...' : '🛡️ Masuk Portal Admin'}
          </button>
        </form>

        {/* Penjelasan jalur warisan -- hanya muncul saat relevan supaya
            tidak membingungkan staf yang sudah punya akun. */}
        {bolehLegacy && (
          <div style={styles.infoBox}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {modeLegacy
                ? 'Belum punya akun sendiri? Kosongkan username dan isi password admin lama untuk masuk sementara. Setiap masuk lewat jalur ini TERCATAT sebagai "akun bersama" di jejak audit.'
                : 'Masuk dengan username Anda supaya setiap aksi tercatat atas nama Anda sendiri.'}
            </span>
          </div>
        )}

        {!bolehLegacy && (
          <div style={styles.infoBox}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Login dengan password bersama sudah dinonaktifkan Owner. Gunakan username akun Anda.</span>
          </div>
        )}

        <div style={styles.footer}>
          <small>Bimbel Gemilang · Area Terbatas Staf</small>
          <button
            type="button"
            style={styles.clearSessionBtn}
            onClick={() => { hapusSesiAdmin(); navigate('/'); }}
            title="Bersihkan sesi admin yang tersimpan di perangkat ini"
          >
            Lupa keluar? Bersihkan sesi
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STYLES -- senada dengan LoginOwner.jsx tapi identitas warna biru
// (Owner = emas, Admin = biru, Guru = biru tua, Siswa = hijau).
// ============================================================
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'linear-gradient(135deg, #060b18 0%, #0b1730 50%, #05080f 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  background: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 },
  glow1: {
    position: 'absolute', width: 320, height: 320, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,165,250,0.10), transparent 70%)',
    top: '8%', left: '8%',
  },
  glow2: {
    position: 'absolute', width: 360, height: 360, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
    bottom: '4%', right: '4%',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 400,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(96,165,250,0.16)',
    borderRadius: 24,
    padding: '28px 26px 20px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
    boxSizing: 'border-box',
  },
  backBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
    fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 6, marginBottom: 16, padding: 0,
  },
  iconArea: { textAlign: 'center', marginBottom: 20 },
  iconCircle: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px',
  },
  title: { color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 4px' },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 0.5,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  input: {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box',
    fontWeight: 600,
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
    padding: 0, display: 'flex',
  },
  btnSubmit: {
    padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#06121f',
    fontWeight: 800, fontSize: 14, marginTop: 2,
  },
  errorBox: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
    borderRadius: 12, padding: '10px 12px', marginBottom: 14,
    color: '#fca5a5', fontSize: 12.5, lineHeight: 1.5,
  },
  infoBox: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.16)',
    borderRadius: 12, padding: '10px 12px', marginTop: 14,
    color: 'rgba(255,255,255,0.45)', fontSize: 11.5, lineHeight: 1.55,
  },
  footer: {
    textAlign: 'center', marginTop: 18, color: 'rgba(255,255,255,0.15)',
    fontSize: 9, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
  },
  clearSessionBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)',
    fontSize: 10, cursor: 'pointer', textDecoration: 'underline', padding: 0,
  },
};

export default LoginAdmin;
