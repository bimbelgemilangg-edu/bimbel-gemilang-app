// src/pages/admin/AdminUsers.jsx
// ⚠️ CATATAN KEAMANAN: halaman ini bagian dari pemisahan akun admin.
// Ia memberi akuntabilitas, tapi BUKAN perbaikan keamanan selama
// Firestore Rules masih terbuka. Lihat
// docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md sebelum mengandalkan
// pembatasan peran di sini sebagai kendali keamanan.
// ============================================================
// 🔥 BARU (pemisahan akun Admin): panel untuk OWNER dan MANAJER
// mengelola akun staf admin -- buat akun, atur peran, nonaktifkan,
// reset password.
//
// Kenapa perlu: sebelumnya semua staf masuk pakai SATU password
// bersama. Akibatnya kalau ada data keuangan yang salah, tidak ada
// cara tahu siapa yang mengubahnya, dan memberhentikan satu staf
// berarti mengganti password untuk SEMUA orang.
//
// Hak akses halaman ini:
//   - Owner (login PIN)          -> boleh semua
//   - Admin berperan 'manajer'   -> boleh semua
//   - Admin berperan 'kasir'     -> DITOLAK (routenya juga dikunci)
//
// Catatan: akun Owner sendiri TIDAK dikelola di sini. Owner masuk
// lewat Portal Owner (PIN), jalurnya terpisah dan tetap utuh.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, UserPlus, Trash2, KeyRound, Pencil, Check, X,
  RefreshCw, Crown, AlertTriangle, Eye, EyeOff, Search, Ban, CheckCircle2,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ambilSemuaAdmin, buatAdmin, perbaruiAdmin, gantiPasswordAdmin, hapusAdmin,
  normalisasiUsername, validasiUsername, validasiPassword,
  PERAN_ADMIN, LABEL_PERAN_ADMIN, ambilSesiAdmin,
} from '../../utils/adminAuth';
import { catatAudit, KATEGORI } from '../../utils/auditLog';
import { isOwnerSession } from '../../utils/roleAkses';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [daftar, setDaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cari, setCari] = useState('');
  const [bolehAkses, setBolehAkses] = useState(false);

  // ---- state form buat akun baru ----
  const [formBaru, setFormBaru] = useState({ username: '', nama: '', jabatan: '', peran: PERAN_ADMIN.KASIR, password: '' });
  const [showPwBaru, setShowPwBaru] = useState(false);
  const [simpanBaru, setSimpanBaru] = useState(false);
  const [errorBaru, setErrorBaru] = useState('');
  const [panelBaruTerbuka, setPanelBaruTerbuka] = useState(false);

  // ---- state edit ----
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  // ---- state reset password ----
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);

  // ---- state legacy ----
  const [legacyAktif, setLegacyAktif] = useState(true);
  const [simpanLegacy, setSimpanLegacy] = useState(false);

  const sesi = ambilSesiAdmin();
  const owner = isOwnerSession();
  const aktor = owner ? 'owner' : (sesi?.username || 'manajer');
  const aktorNama = owner ? 'Owner' : (sesi?.nama || 'Manajer');

  // ============================================================
  // GUARD: hanya owner / manajer
  // ============================================================
  const muatDaftar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [semua, snapCfg] = await Promise.all([
        ambilSemuaAdmin(),
        getDoc(doc(db, 'settings', 'global_config')).catch(() => null),
      ]);
      setDaftar(semua);
      if (snapCfg?.exists()) {
        setLegacyAktif(snapCfg.data()?.izinkanLoginAdminLegacy !== false);
      }
      // Kalau belum ada akun sama sekali, langsung buka panel buat akun
      // supaya owner tidak bingung harus mulai dari mana.
      if (semua.length === 0) setPanelBaruTerbuka(true);
    } catch (e) {
      console.error(e);
      setError(`Gagal memuat daftar akun: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cek hak akses: owner ATAU admin berperan manajer.
    const s = ambilSesiAdmin();
    const ok = isOwnerSession() || s?.peran === PERAN_ADMIN.MANAJER;
    setBolehAkses(ok);
    if (ok) muatDaftar();
  }, [muatDaftar]);

  if (!bolehAkses) {
    return (
      <div style={styles.page}>
        <div style={styles.ditolakCard}>
          <AlertTriangle size={40} color="#f59e0b" />
          <h2 style={{ color: '#fff', margin: '14px 0 6px' }}>Akses Ditolak</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Halaman ini hanya untuk <b>Owner</b> dan admin dengan peran <b>Manajer</b>.
            <br />Akun Anda berperan sebagai <b>{LABEL_PERAN_ADMIN[sesi?.peran] || 'tidak dikenal'}</b>.
          </p>
          <button style={styles.btnKembali} onClick={() => navigate('/admin')}>← Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // AKSI
  // ============================================================
  const handleSubmitBaru = async (e) => {
    e.preventDefault();
    setErrorBaru('');

    const errU = validasiUsername(formBaru.username);
    if (errU) { setErrorBaru(errU); return; }
    if (!formBaru.nama.trim()) { setErrorBaru('Nama lengkap wajib diisi.'); return; }
    const errP = validasiPassword(formBaru.password);
    if (errP) { setErrorBaru(errP); return; }

    setSimpanBaru(true);
    try {
      const { id } = await buatAdmin({
        username: formBaru.username,
        nama: formBaru.nama,
        jabatan: formBaru.jabatan,
        peran: formBaru.peran,
        password: formBaru.password,
        dibuatOleh: aktor,
      });
      catatAudit('akun.buat', {
        kategori: KATEGORI.AKUN,
        target: `Akun baru: ${id} (${formBaru.nama})`,
        detail: { peran: formBaru.peran, jabatan: formBaru.jabatan || '-', dibuatOleh: aktorNama },
      });
      setFormBaru({ username: '', nama: '', jabatan: '', peran: PERAN_ADMIN.KASIR, password: '' });
      setPanelBaruTerbuka(false);
      await muatDaftar();
      alert(`✅ Akun "${id}" berhasil dibuat.\n\nBeritahu staf untuk login di halaman Portal Admin dengan username tersebut.`);
    } catch (err) {
      console.error(err);
      setErrorBaru(err?.message || 'Gagal membuat akun.');
      catatAudit('akun.buat.gagal', {
        kategori: KATEGORI.AKUN,
        target: normalisasiUsername(formBaru.username),
        detail: { alasan: String(err?.message || err) },
      });
    } finally {
      setSimpanBaru(false);
    }
  };

  const toggleAktif = async (akun) => {
    const jadiAktif = akun.aktif === false;
    if (!jadiAktif && akun.id === sesi?.username) {
      alert('Anda tidak bisa menonaktifkan akun Anda sendiri.');
      return;
    }
    if (!window.confirm(
      jadiAktif
        ? `Aktifkan kembali akun "${akun.username}" (${akun.nama})?`
        : `Nonaktifkan akun "${akun.username}" (${akun.nama})?\n\nStaf ini langsung tidak bisa login. Datanya tetap tersimpan untuk jejak audit.`,
    )) return;

    try {
      await perbaruiAdmin(akun.id, { aktif: jadiAktif, ...(jadiAktif ? { dihapus: false } : {}) });
      catatAudit(jadiAktif ? 'akun.aktifkan' : 'akun.nonaktif', {
        kategori: KATEGORI.AKUN,
        target: `Akun: ${akun.username} (${akun.nama})`,
        detail: { oleh: aktorNama },
      });
      await muatDaftar();
    } catch (err) {
      alert(`Gagal: ${err?.message || err}`);
    }
  };

  const hapusAkun = async (akun) => {
    if (!window.confirm(
      `Hapus akun "${akun.username}" (${akun.nama})?\n\n` +
      'Akun akan dinonaktifkan permanen dan password-nya dikosongkan.\n' +
      'Riwayat jejak audit atas namanya TETAP tersimpan.',
    )) return;
    try {
      await hapusAdmin(akun.id);
      catatAudit('akun.hapus', {
        kategori: KATEGORI.AKUN,
        target: `Akun: ${akun.username} (${akun.nama})`,
        detail: { oleh: aktorNama, peranAkun: akun.peran },
      });
      await muatDaftar();
    } catch (err) {
      alert(`Tidak bisa dihapus: ${err?.message || err}`);
    }
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    const errP = validasiPassword(resetPw);
    if (errP) { alert(errP); return; }
    const akun = daftar.find((a) => a.id === resetId);
    if (!akun) return;
    try {
      await gantiPasswordAdmin(akun.id, resetPw, { wajibGanti: true });
      catatAudit('akun.resetpassword', {
        kategori: KATEGORI.AKUN,
        target: `Akun: ${akun.username} (${akun.nama})`,
        detail: { oleh: aktorNama, wajibGanti: true },
      });
      setResetId(null);
      setResetPw('');
      alert(`✅ Password "${akun.username}" sudah direset.\n\nStaf tersebut akan diminta menggantinya saat pertama masuk.`);
      await muatDaftar();
    } catch (err) {
      alert(`Gagal reset password: ${err?.message || err}`);
    }
  };

  const mulaiEdit = (akun) => {
    setEditId(akun.id);
    setEditData({ nama: akun.nama || '', jabatan: akun.jabatan || '', peran: akun.peran || PERAN_ADMIN.KASIR });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editData.nama?.trim()) { alert('Nama tidak boleh kosong.'); return; }
    const akun = daftar.find((a) => a.id === editId);
    if (akun?.id === sesi?.username && editData.peran !== PERAN_ADMIN.MANAJER) {
      alert('Anda tidak bisa menurunkan peran akun Anda sendiri dari halaman ini.');
      return;
    }
    try {
      await perbaruiAdmin(editId, {
        nama: editData.nama.trim(),
        jabatan: String(editData.jabatan || '').trim(),
        peran: editData.peran,
      });
      catatAudit('akun.ubah', {
        kategori: KATEGORI.AKUN,
        target: `Akun: ${editId}`,
        detail: { perubahan: editData, oleh: aktorNama },
      });
      setEditId(null);
      await muatDaftar();
    } catch (err) {
      alert(`Gagal menyimpan: ${err?.message || err}`);
    }
  };

  // ============================================================
  // LEGACY: matikan password bersama
  // ============================================================
  const toggleLegacy = async () => {
    const jumlahAktif = daftar.filter((a) => a.aktif !== false).length;
    const jadiAktif = !legacyAktif;

    if (!jadiAktif && jumlahAktif === 0) {
      alert(
        '⛔ Belum ada satu pun akun admin yang aktif.\n\n' +
        'Kalau password bersama dimatikan sekarang, tidak akan ada staf yang bisa masuk. ' +
        'Buat minimal satu akun dulu.',
      );
      return;
    }
    if (!jadiAktif && !window.confirm(
      `Matikan login dengan password bersama?\n\n` +
      `Setelah ini, ${jumlahAktif} akun admin yang terdaftar jadi SATU-SATUNYA cara masuk ke Portal Admin.\n` +
      'Owner tetap bisa masuk lewat Portal Owner (PIN).\n\n' +
      'Pastikan semua staf sudah punya akun dan tahu username-nya!',
    )) return;

    setSimpanLegacy(true);
    try {
      await setDoc(doc(db, 'settings', 'global_config'), {
        izinkanLoginAdminLegacy: jadiAktif,
      }, { merge: true });
      setLegacyAktif(jadiAktif);
      catatAudit('pengaturan.loginlegacy', {
        kategori: KATEGORI.AKUN,
        target: jadiAktif ? 'Password bersama DIAKTIFKAN kembali' : 'Password bersama DIMATIKAN',
        detail: { oleh: aktorNama, jumlahAkunAktif: jumlahAktif },
      });
    } catch (err) {
      alert(`Gagal menyimpan: ${err?.message || err}`);
    } finally {
      setSimpanLegacy(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  const daftarTampil = daftar.filter((a) => {
    if (!cari.trim()) return true;
    const k = cari.toLowerCase();
    return (
      String(a.username || '').toLowerCase().includes(k) ||
      String(a.nama || '').toLowerCase().includes(k) ||
      String(a.jabatan || '').toLowerCase().includes(k)
    );
  });

  const jumlahAktif = daftar.filter((a) => a.aktif !== false).length;
  const jumlahManajerAktif = daftar.filter((a) => a.aktif !== false && a.peran === PERAN_ADMIN.MANAJER).length;

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        {/* ===== HEADER ===== */}
        <div style={styles.header}>
          <div style={styles.headerIcon}><Shield size={26} color="#60a5fa" /></div>
          <div>
            <h1 style={styles.h1}>Pengguna Admin</h1>
            <p style={styles.sub}>
              Kelola siapa saja yang boleh masuk Portal Admin. Tiap staf punya akun sendiri
              supaya setiap aksi tercatat atas namanya.
            </p>
          </div>
        </div>

        {/* ===== STATUS ===== */}
        <div style={styles.statusRow}>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{jumlahAktif}</div>
            <div style={styles.statLabel}>Akun aktif</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>
              {daftar.filter((a) => a.aktif !== false
                && (a.peran === PERAN_ADMIN.OPERASIONAL || a.peran === PERAN_ADMIN.KASIR)).length}
            </div>
            <div style={styles.statLabel}>Operasional</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{jumlahManajerAktif}</div>
            <div style={styles.statLabel}>Manajer</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statAngka}>{daftar.length - jumlahAktif}</div>
            <div style={styles.statLabel}>Nonaktif</div>
          </div>
        </div>

        {/* ===== PERINGATAN MIGRASI ===== */}
        {daftar.length === 0 && (
          <div style={{ ...styles.banner, borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)' }}>
            <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <b style={{ color: '#fbbf24' }}>Belum ada akun admin bernama.</b>
              <p style={styles.bannerText}>
                Saat ini staf masih masuk memakai <b>satu password bersama</b> yang diatur di Pengaturan.
                Buat akun untuk tiap staf di bawah, lalu matikan password bersama. Setelah itu Anda bisa
                tahu persis siapa yang mencatat transaksi, menerbitkan kwitansi, atau mengubah data siswa.
              </p>
            </div>
          </div>
        )}

        {legacyAktif && daftar.length > 0 && (
          <div style={{ ...styles.banner, borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.07)' }}>
            <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <b style={{ color: '#fbbf24' }}>Password bersama masih aktif.</b>
              <p style={styles.bannerText}>
                Siapapun yang tahu password lama masih bisa masuk tanpa username, dan aksinya tercatat
                sebagai "akun bersama" (tidak jelas siapa). Kalau semua staf sudah punya akun,
                matikan jalur ini.
              </p>
              <button
                style={styles.btnKecilKuning}
                disabled={simpanLegacy || jumlahAktif === 0}
                onClick={toggleLegacy}
                title={jumlahAktif === 0 ? 'Buat minimal satu akun admin dulu' : 'Matikan login password bersama'}
              >
                {simpanLegacy ? <RefreshCw size={13} className="spin" /> : <Ban size={13} />}
                Matikan Password Bersama
              </button>
            </div>
          </div>
        )}

        {!legacyAktif && (
          <div style={{ ...styles.banner, borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.07)' }}>
            <CheckCircle2 size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <b style={{ color: '#4ade80' }}>Password bersama sudah dimatikan.</b>
              <p style={styles.bannerText}>
                Hanya akun terdaftar yang bisa masuk Portal Admin. Owner tetap lewat Portal Owner (PIN).
              </p>
              <button style={styles.btnKecilNetral} disabled={simpanLegacy} onClick={toggleLegacy}>
                {simpanLegacy ? <RefreshCw size={13} /> : <RefreshCw size={13} />}
                Aktifkan kembali password bersama
              </button>
            </div>
          </div>
        )}

        {jumlahManajerAktif === 0 && !owner && (
          <div style={{ ...styles.banner, borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)' }}>
            <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <b style={{ color: '#f87171' }}>Tidak ada akun Manajer yang aktif.</b>
              <p style={styles.bannerText}>
                Kalau Anda (owner) kehilangan akses PIN, tidak ada yang bisa mengelola akun admin.
                Promosikan minimal satu staf tepercaya jadi Manajer.
              </p>
            </div>
          </div>
        )}

        {error && <div style={styles.errorBar}>{error}</div>}

        {/* ===== TOOLBAR ===== */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={15} color="rgba(255,255,255,0.35)" />
            <input
              style={styles.searchInput}
              placeholder="Cari username / nama / jabatan..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.btnSekunder} onClick={muatDaftar} disabled={loading}>
              <RefreshCw size={15} /> Muat Ulang
            </button>
            <button style={styles.btnUtama} onClick={() => { setPanelBaruTerbuka((v) => !v); setErrorBaru(''); }}>
              {panelBaruTerbuka ? <X size={16} /> : <UserPlus size={16} />}
              {panelBaruTerbuka ? 'Tutup' : 'Buat Akun Baru'}
            </button>
          </div>
        </div>

        {/* ===== FORM AKUN BARU ===== */}
        {panelBaruTerbuka && (
          <form onSubmit={handleSubmitBaru} style={styles.formCard}>
            <h3 style={styles.formTitle}><UserPlus size={16} color="#60a5fa" /> Akun Admin Baru</h3>

            {errorBaru && <div style={styles.errorBar}>{errorBaru}</div>}

            <div style={styles.gridForm}>
              <div style={styles.field}>
                <label style={styles.labelField}>Username *</label>
                <input
                  style={styles.input}
                  value={formBaru.username}
                  onChange={(e) => setFormBaru({ ...formBaru, username: e.target.value })}
                  placeholder="mis. siti.kasir"
                  autoCapitalize="none" autoCorrect="off" spellCheck="false"
                  maxLength={24}
                />
                <small style={styles.hint}>Huruf kecil, angka, titik/strip/underscore. 3–24 karakter. Tidak bisa diubah nanti.</small>
              </div>

              <div style={styles.field}>
                <label style={styles.labelField}>Nama Lengkap *</label>
                <input
                  style={styles.input}
                  value={formBaru.nama}
                  onChange={(e) => setFormBaru({ ...formBaru, nama: e.target.value })}
                  placeholder="mis. Siti Nurhaliza"
                  maxLength={80}
                />
                <small style={styles.hint}>Nama ini yang muncul di sidebar dan di jejak audit.</small>
              </div>

              <div style={styles.field}>
                <label style={styles.labelField}>Jabatan</label>
                <input
                  style={styles.input}
                  value={formBaru.jabatan}
                  onChange={(e) => setFormBaru({ ...formBaru, jabatan: e.target.value })}
                  placeholder="mis. Kasir Pagi"
                  maxLength={60}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.labelField}>Peran *</label>
                <select
                  style={styles.input}
                  value={formBaru.peran}
                  onChange={(e) => setFormBaru({ ...formBaru, peran: e.target.value })}
                >
                  <option value={PERAN_ADMIN.OPERASIONAL}>
                    Operasional — kendali penuh tentor, siswa, validasi sesi & rekap gaji
                  </option>
                  <option value={PERAN_ADMIN.MANAJER}>
                    Manajer — operasional + kelola akun admin & jejak audit
                  </option>
                </select>
                <small style={styles.hint}>
                  Operasional TIDAK bisa kelola akun admin, buka jejak audit, pengaturan
                  global, atau portal owner. Eksekusi pembayaran honor tetap di Owner.
                </small>
              </div>

              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.labelField}>Password Awal *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...styles.input, paddingRight: 42 }}
                    type={showPwBaru ? 'text' : 'password'}
                    value={formBaru.password}
                    onChange={(e) => setFormBaru({ ...formBaru, password: e.target.value })}
                    placeholder="Minimal 8 karakter, campur huruf & angka"
                    autoComplete="new-password"
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPwBaru(!showPwBaru)}>
                    {showPwBaru ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <small style={styles.hint}>
                  Password di-hash sebelum disimpan — tidak ada yang bisa membaca password aslinya, termasuk Anda.
                  Staf akan diminta menggantinya sendiri nanti.
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button type="submit" style={styles.btnUtama} disabled={simpanBaru}>
                {simpanBaru ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
                {simpanBaru ? 'Menyimpan...' : 'Simpan Akun'}
              </button>
              <button type="button" style={styles.btnSekunder} onClick={() => setPanelBaruTerbuka(false)} disabled={simpanBaru}>
                Batal
              </button>
            </div>
          </form>
        )}

        {/* ===== TABEL AKUN ===== */}
        <div style={styles.tabelCard}>
          {loading ? (
            <div style={styles.kosong}><RefreshCw size={22} className="spin" /> Memuat daftar akun...</div>
          ) : daftarTampil.length === 0 ? (
            <div style={styles.kosong}>
              {daftar.length === 0 ? 'Belum ada akun admin. Klik "Buat Akun Baru" di atas.' : 'Tidak ada akun yang cocok dengan pencarian.'}
            </div>
          ) : (
            <div style={styles.tabelScroll}>
              <table style={styles.tabel}>
                <thead>
                  <tr>
                    <th style={styles.th}>Akun</th>
                    <th style={styles.th}>Peran</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Login Terakhir</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarTampil.map((a) => {
                    const aktif = a.aktif !== false;
                    const sedangEdit = editId === a.id;
                    const sedangReset = resetId === a.id;
                    const akunSendiri = a.id === sesi?.username;
                    const loginTerakhir = a.terakhirLogin?.toDate
                      ? a.terakhirLogin.toDate().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : (a.terakhirLogin ? String(a.terakhirLogin) : 'belum pernah');

                    return (
                      <React.Fragment key={a.id}>
                        <tr style={{ ...styles.tr, opacity: aktif ? 1 : 0.55 }}>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ ...styles.avatar, background: a.peran === PERAN_ADMIN.MANAJER ? 'rgba(139,92,246,0.18)' : 'rgba(96,165,250,0.15)' }}>
                                {a.peran === PERAN_ADMIN.MANAJER ? <Crown size={15} color="#a78bfa" /> : <Shield size={15} color="#60a5fa" />}
                              </div>
                              <div>
                                <div style={styles.namaAkun}>
                                  {a.nama || '(tanpa nama)'}
                                  {akunSendiri && <span style={styles.badgeAnda}>Anda</span>}
                                </div>
                                <div style={styles.usernameAkun}>@{a.username}{a.jabatan ? ` · ${a.jabatan}` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={a.peran === PERAN_ADMIN.MANAJER ? styles.pillUngu : styles.pillBiru}>
                              {LABEL_PERAN_ADMIN[a.peran] || a.peran}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={aktif ? styles.pillHijau : styles.pillMerah}>
                              {aktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                            {a.wajibGantiPassword && <span style={{ ...styles.pillKuning, marginLeft: 4 }}>perlu ganti password</span>}
                          </td>
                          <td style={styles.tdSmall}>
                            {loginTerakhir}
                            <div style={styles.perangkat}>{a.terakhirLoginPerangkat || ''}</div>
                            {typeof a.jumlahLogin === 'number' && a.jumlahLogin > 0 && (
                              <div style={styles.perangkat}>{a.jumlahLogin}× masuk</div>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                              <button style={styles.btnIkon} title="Ubah profil/peran" onClick={() => mulaiEdit(a)} disabled={!aktif}>
                                <Pencil size={14} />
                              </button>
                              <button style={styles.btnIkon} title="Reset password" onClick={() => { setResetId(sedangReset ? null : a.id); setResetPw(''); }} disabled={!aktif}>
                                <KeyRound size={14} />
                              </button>
                              <button
                                style={{ ...styles.btnIkon, color: aktif ? '#f59e0b' : '#4ade80' }}
                                title={aktif ? 'Nonaktifkan' : 'Aktifkan kembali'}
                                onClick={() => toggleAktif(a)}
                                disabled={akunSendiri && aktif}
                              >
                                {aktif ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                              </button>
                              <button style={{ ...styles.btnIkon, color: '#f87171' }} title="Hapus akun" onClick={() => hapusAkun(a)} disabled={akunSendiri}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* --- baris edit inline --- */}
                        {sedangEdit && (
                          <tr>
                            <td colSpan={5} style={styles.tdEditRow}>
                              <form onSubmit={submitEdit} style={styles.formInline}>
                                <div style={styles.field}>
                                  <label style={styles.labelField}>Nama Lengkap</label>
                                  <input style={styles.input} value={editData.nama || ''} onChange={(e) => setEditData({ ...editData, nama: e.target.value })} maxLength={80} />
                                </div>
                                <div style={styles.field}>
                                  <label style={styles.labelField}>Jabatan</label>
                                  <input style={styles.input} value={editData.jabatan || ''} onChange={(e) => setEditData({ ...editData, jabatan: e.target.value })} maxLength={60} />
                                </div>
                                <div style={styles.field}>
                                  <label style={styles.labelField}>Peran</label>
                                  <select
                                    style={styles.input}
                                    value={editData.peran}
                                    onChange={(e) => setEditData({ ...editData, peran: e.target.value })}
                                    disabled={akunSendiri}
                                  >
                                    <option value={PERAN_ADMIN.OPERASIONAL}>Operasional</option>
                                    <option value={PERAN_ADMIN.MANAJER}>Manajer</option>
                                  </select>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                                  <button type="submit" style={styles.btnUtamaKecil}><Check size={14} /> Simpan</button>
                                  <button type="button" style={styles.btnSekunderKecil} onClick={() => setEditId(null)}>Batal</button>
                                </div>
                              </form>
                              <small style={styles.hint}>Username <b>@{a.username}</b> tidak bisa diubah — itu identitasnya di jejak audit.</small>
                            </td>
                          </tr>
                        )}

                        {/* --- baris reset password inline --- */}
                        {sedangReset && (
                          <tr>
                            <td colSpan={5} style={styles.tdEditRow}>
                              <form onSubmit={submitResetPassword} style={styles.formInline}>
                                <div style={{ ...styles.field, flex: 1, minWidth: 240 }}>
                                  <label style={styles.labelField}>Password baru untuk <b>@{a.username}</b></label>
                                  <div style={{ position: 'relative' }}>
                                    <input
                                      style={{ ...styles.input, paddingRight: 42 }}
                                      type={showResetPw ? 'text' : 'password'}
                                      value={resetPw}
                                      onChange={(e) => setResetPw(e.target.value)}
                                      placeholder="Minimal 8 karakter"
                                      autoComplete="new-password"
                                      autoFocus
                                    />
                                    <button type="button" style={styles.eyeBtn} onClick={() => setShowResetPw(!showResetPw)}>
                                      {showResetPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                                  <button type="submit" style={styles.btnUtamaKecil}><KeyRound size={14} /> Set Password</button>
                                  <button type="button" style={styles.btnSekunderKecil} onClick={() => setResetId(null)}>Batal</button>
                                </div>
                              </form>
                              <small style={styles.hint}>Staf akan ditandai <b>"perlu ganti password"</b> dan diminta menggantinya sendiri saat login berikutnya. Sampaikan password ini lewat jalur aman, jangan lewat chat grup.</small>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ===== CATATAN OWNER ===== */}
        <div style={styles.catatan}>
          <Crown size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b style={{ color: '#fbbf24' }}>Soal akun Owner</b>
            <p style={styles.bannerText}>
              Akun Owner tidak dikelola di sini. Owner masuk lewat <b>Portal Owner</b> dengan PIN,
              dan otomatis punya hak tertinggi (termasuk membuka halaman ini). PIN diatur di
              Pengaturan Global. Jadi walaupun semua akun admin dinonaktifkan, Owner tidak pernah terkunci.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #060b18 0%, #0b1730 60%, #05080f 100%)',
    padding: '26px 20px 60px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrap: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  h1: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, margin: '4px 0 0', lineHeight: 1.55, maxWidth: 640 },

  statusRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 },
  statCard: {
    background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '14px 16px', textAlign: 'center',
  },
  statAngka: { color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 },

  banner: {
    display: 'flex', gap: 11, alignItems: 'flex-start',
    borderRadius: 14, padding: '13px 15px', marginBottom: 12,
    border: '1px solid',
  },
  bannerText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6, margin: '5px 0 8px' },
  errorBar: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '10px 13px', color: '#fca5a5', fontSize: 12.5, marginBottom: 12,
  },

  toolbar: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 },
  searchBox: {
    flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 11, padding: '0 12px',
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    color: '#fff', fontSize: 13, padding: '11px 0',
  },

  formCard: {
    background: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 16, padding: 18, marginBottom: 16,
  },
  formTitle: {
    color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 14px',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  gridForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 13 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  labelField: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', fontSize: 13.5, outline: 'none',
  },
  hint: { color: 'rgba(255,255,255,0.32)', fontSize: 10.5, lineHeight: 1.5 },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex',
  },

  btnUtama: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#06121f',
    border: 'none', borderRadius: 10, padding: '10px 16px',
    fontSize: 13, fontWeight: 800, cursor: 'pointer',
  },
  btnUtamaKecil: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'linear-gradient(135deg, #60a5fa, #2563eb)', color: '#06121f',
    border: 'none', borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
  },
  btnSekunder: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  btnSekunderKecil: {
    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 12px',
    fontSize: 12, cursor: 'pointer',
  },
  btnKecilKuning: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(245,158,11,0.18)', color: '#fbbf24',
    border: '1px solid rgba(245,158,11,0.35)', borderRadius: 9, padding: '7px 13px',
    fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  },
  btnKecilNetral: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, padding: '7px 13px',
    fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  },
  btnIkon: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: 6, color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btnKembali: {
    marginTop: 18, background: 'rgba(255,255,255,0.07)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10,
    padding: '10px 18px', fontSize: 13, cursor: 'pointer',
  },

  tabelCard: {
    background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, overflow: 'hidden',
  },
  tabelScroll: { overflowX: 'auto' },
  tabel: { width: '100%', borderCollapse: 'collapse', minWidth: 780 },
  th: {
    textAlign: 'left', padding: '12px 14px', fontSize: 10.5, fontWeight: 700,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.6,
    borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
  },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '12px 14px', fontSize: 13, color: 'rgba(255,255,255,0.8)', verticalAlign: 'middle' },
  tdSmall: { padding: '12px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', verticalAlign: 'middle' },
  tdEditRow: { padding: '14px', background: 'rgba(96,165,250,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  formInline: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 6 },
  avatar: {
    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  namaAkun: { color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 },
  usernameAkun: { color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 2 },
  perangkat: { color: 'rgba(255,255,255,0.3)', fontSize: 10.5, marginTop: 2 },
  badgeAnda: {
    background: 'rgba(34,197,94,0.18)', color: '#4ade80', fontSize: 9, fontWeight: 800,
    padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.4,
  },
  pillBiru: { background: 'rgba(96,165,250,0.15)', color: '#93c5fd', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20 },
  pillUngu: { background: 'rgba(139,92,246,0.18)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20 },
  pillHijau: { background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20 },
  pillMerah: { background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20 },
  pillKuning: { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 },
  kosong: { padding: '46px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },

  catatan: {
    display: 'flex', gap: 11, alignItems: 'flex-start', marginTop: 16,
    background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.18)',
    borderRadius: 14, padding: '13px 15px',
  },
  ditolakCard: {
    maxWidth: 420, margin: '14vh auto', textAlign: 'center',
    background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20, padding: '34px 28px',
  },
};

export default AdminUsers;
