// src/pages/PendaftaranTentor.jsx
//
// ============================================================
// FORM PENDAFTARAN TENTOR/STAFF -- BIMBEL GEMILANG
// ============================================================
// 🔥 BARU: file BARU, TERPISAH dari PendaftaranOnline.jsx (pendaftaran
// siswa). Sengaja gak menimpa/merombak file siswa yang sudah ada --
// biar pendaftaran siswa TETAP JALAN NORMAL tanpa risiko, dan gak perlu
// ada "proses kembalikan" yang rawan kesalahan. Kalau suatu saat form
// ini gak dibutuhkan lagi, tinggal berhenti kasih link-nya ke pelamar,
// gak perlu ubah kode apa pun lagi.
//
// ALUR: Data Diri -> Upload Dokumen (CV + Foto) -> Surat Lamaran (kotak
// kosong, pelamar ketik sendiri) -> Submit.
//
// Data tersimpan di koleksi Firestore "tutor_applications".
// File (CV & foto) di-upload ke Supabase Storage lewat uploadService.js
// yang sudah ada (folder terpisah: "cv-pelamar-tentor" & "foto-pelamar-tentor").
// ============================================================

import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadElearningFile } from '../services/uploadService';

const POSISI_OPTIONS = [
  'Tentor/Guru',
  'Admin',
  'Staff Pendukung',
  'Lainnya',
];

const PendaftaranTentor = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    namaLengkap: '',
    whatsappAktif: '',
    email: '',
    alamatDomisili: '',
    posisiDilamar: 'Tentor/Guru',
    bidangDiminati: '', // 🔥 bebas ketik -- bisa mapel spesifik (kalau Tentor) atau bidang lain (kalau Admin/Support)
  });

  const [cvFile, setCvFile] = useState(null);
  const [cvUploadedUrl, setCvUploadedUrl] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState('');
  const [fotoUploadedUrl, setFotoUploadedUrl] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [suratLamaran, setSuratLamaran] = useState('');

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ============================================================
  // UPLOAD CV
  // ============================================================
  const handleCvChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadingCv(true);
    setCvFile(file);

    try {
      const result = await uploadElearningFile(file, 'cv-pelamar-tentor');
      if (result.success) {
        setCvUploadedUrl(result.downloadURL);
        setCvFileName(result.originalName || file.name);
      } else {
        setError('Gagal upload CV: ' + (result.error || 'Terjadi kesalahan.'));
        setCvFile(null);
      }
    } catch (err) {
      setError('Gagal upload CV: ' + err.message);
      setCvFile(null);
    }
    setUploadingCv(false);
  };

  // ============================================================
  // UPLOAD FOTO
  // ============================================================
  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploadingFoto(true);
    setFotoPreviewUrl(URL.createObjectURL(file));

    try {
      const result = await uploadElearningFile(file, 'foto-pelamar-tentor');
      if (result.success) {
        setFotoUploadedUrl(result.downloadURL);
      } else {
        setError('Gagal upload foto: ' + (result.error || 'Terjadi kesalahan.'));
        setFotoPreviewUrl('');
      }
    } catch (err) {
      setError('Gagal upload foto: ' + err.message);
      setFotoPreviewUrl('');
    }
    setUploadingFoto(false);
  };

  // ============================================================
  // VALIDASI PER STEP
  // ============================================================
  const validate = (s) => {
    if (s === 1) {
      if (!form.namaLengkap.trim()) return 'Nama lengkap wajib diisi!';
      if (!form.whatsappAktif.trim() || !/^\d+$/.test(form.whatsappAktif) || form.whatsappAktif.length < 10) return 'Nomor WhatsApp wajib (angka, min 10 digit)!';
      if (!form.alamatDomisili.trim()) return 'Alamat domisili wajib diisi!';
    }
    if (s === 2) {
      if (!cvUploadedUrl) return 'CV wajib diunggah dan berhasil ter-upload!';
      if (!fotoUploadedUrl) return 'Foto diri terbaru wajib diunggah dan berhasil ter-upload!';
    }
    if (s === 3) {
      if (!suratLamaran.trim() || suratLamaran.trim().length < 20) return 'Surat lamaran wajib diisi (minimal beberapa kalimat)!';
    }
    return null;
  };

  const goNext = (s) => {
    const err = validate(s);
    if (err) { setError(err); setTimeout(() => setError(''), 4000); return; }
    setError('');
    setStep(s + 1);
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async () => {
    const err = validate(1) || validate(2) || validate(3);
    if (err) { setError(err); setTimeout(() => setError(''), 4000); return; }

    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, "tutor_applications"), {
        ...form,
        cvUrl: cvUploadedUrl,
        cvFileName: cvFileName,
        fotoUrl: fotoUploadedUrl,
        suratLamaran: suratLamaran.trim(),
        status: 'baru',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (e) {
      setError('Gagal mengirim lamaran: ' + e.message);
    }
    setLoading(false);
  };

  const steps = ['📋 Data Diri', '📎 Dokumen', '✉️ Surat Lamaran'];

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>

        <div style={styles.header}>
          <img src="/pwa-192x192.png" alt="Logo" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Pendaftaran Tentor & Staff</h1>
            <p style={styles.subtitle}>Bimbel Gemilang · Glagahagung</p>
          </div>
        </div>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        {isSuccess ? (
          <div style={styles.successBox}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: 20 }}>Lamaran Berhasil Dikirim!</h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
              Terima kasih <strong>{form.namaLengkap}</strong> telah melamar di Bimbel Gemilang.
            </p>
            <div style={styles.successInfo}>
              <p>📞 Tim kami akan menghubungi WhatsApp <strong>{form.whatsappAktif}</strong> apabila lamaran Anda lolos seleksi awal.</p>
              <p>🙏 Mohon bersabar menunggu kabar dari kami.</p>
            </div>
            <button onClick={() => window.location.reload()} style={styles.btnNext}>
              📝 Kirim Lamaran Lain
            </button>
          </div>
        ) : (
          <>
            <div style={styles.stepRow}>
              {steps.map((label, idx) => (
                <div key={idx} style={styles.stepItem}>
                  <div style={{ ...styles.stepDot, background: step > idx + 1 ? '#10b981' : step === idx + 1 ? '#652D90' : '#e2e8f0', color: step > idx + 1 || step === idx + 1 ? 'white' : '#94a3b8' }}>
                    {step > idx + 1 ? '✓' : idx + 1}
                  </div>
                  <span style={{ ...styles.stepLabel, color: step === idx + 1 ? '#652D90' : '#94a3b8', fontWeight: step === idx + 1 ? 700 : 400 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* STEP 1: DATA DIRI */}
            {step === 1 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📋 Data Diri Pelamar</h3>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nama Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="namaLengkap" value={form.namaLengkap} onChange={handleChange} style={styles.input} placeholder="Masukkan nama lengkap" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nomor WhatsApp Aktif <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="tel" name="whatsappAktif" value={form.whatsappAktif} onChange={handleChange} style={styles.input} placeholder="081234567890" />
                  <small style={styles.hint}>Hanya angka, minimal 10 digit</small>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email (opsional)</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="nama@email.com" />
                </div>

                <div style={styles.row}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Posisi yang Dilamar <span style={{ color: '#ef4444' }}>*</span></label>
                    <select name="posisiDilamar" value={form.posisiDilamar} onChange={handleChange} style={styles.select}>
                      {POSISI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Bidang/Mapel yang Diminati</label>
                    <input type="text" name="bidangDiminati" value={form.bidangDiminati} onChange={handleChange} style={styles.input} placeholder="mis. Matematika SMP-SMA, atau Administrasi" />
                    <small style={styles.hint}>Opsional -- isi kalau relevan dengan posisi di atas</small>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Alamat Domisili <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea name="alamatDomisili" value={form.alamatDomisili} onChange={handleChange} style={styles.textarea} placeholder="Desa, Kecamatan, Kabupaten" rows={3} />
                </div>

                <button onClick={() => goNext(1)} style={styles.btnNext}>Selanjutnya: Dokumen →</button>
              </div>
            )}

            {/* STEP 2: UPLOAD DOKUMEN */}
            {step === 2 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>📎 Upload Dokumen</h3>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>CV / Curriculum Vitae <span style={{ color: '#ef4444' }}>*</span></label>
                  {!cvUploadedUrl ? (
                    <label style={styles.uploadBox(uploadingCv)}>
                      <input type="file" accept=".pdf,image/*" onChange={handleCvChange} disabled={uploadingCv} style={{ display: 'none' }} />
                      {uploadingCv ? '⏳ Mengunggah CV...' : '📄 Pilih File CV (PDF/Gambar)'}
                    </label>
                  ) : (
                    <div style={styles.successFileBox}>
                      <span>✅ {cvFileName}</span>
                      <button type="button" onClick={() => { setCvUploadedUrl(''); setCvFileName(''); setCvFile(null); }} style={styles.btnGanti}>Ganti</button>
                    </div>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Foto Diri Terbaru <span style={{ color: '#ef4444' }}>*</span></label>
                  {!fotoUploadedUrl ? (
                    <label style={styles.uploadBox(uploadingFoto)}>
                      <input type="file" accept="image/*" onChange={handleFotoChange} disabled={uploadingFoto} style={{ display: 'none' }} />
                      {uploadingFoto ? '⏳ Mengunggah foto...' : '🖼️ Pilih Foto Diri'}
                    </label>
                  ) : (
                    <div style={styles.fotoSuccessBox}>
                      {fotoPreviewUrl && <img src={fotoPreviewUrl} alt="Preview foto" style={styles.fotoThumb} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>✅ Foto tersimpan</div>
                        <button type="button" onClick={() => { setFotoUploadedUrl(''); setFotoPreviewUrl(''); setFotoFile(null); }} style={styles.btnGanti}>Ganti foto</button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={() => setStep(1)} style={styles.btnPrev}>← Sebelumnya</button>
                  <button onClick={() => goNext(2)} style={styles.btnNext}>Selanjutnya: Surat Lamaran →</button>
                </div>
              </div>
            )}

            {/* STEP 3: SURAT LAMARAN */}
            {step === 3 && (
              <div style={styles.formArea}>
                <h3 style={styles.sectionTitle}>✉️ Surat Lamaran</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
                  Tuliskan surat lamaran Anda -- ceritakan motivasi, pengalaman, dan kenapa Anda cocok untuk posisi ini.
                </p>
                <textarea
                  value={suratLamaran}
                  onChange={(e) => setSuratLamaran(e.target.value)}
                  style={styles.suratTextarea}
                  placeholder="Kepada Yth. Bimbel Gemilang,&#10;&#10;Perkenalkan saya..."
                  rows={12}
                />
                <small style={styles.hint}>{suratLamaran.trim().length} karakter</small>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button onClick={() => setStep(2)} style={styles.btnPrev}>← Sebelumnya</button>
                  <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnSubmit, opacity: loading ? 0.7 : 1 }}>
                    {loading ? '⏳ Mengirim...' : '🚀 Kirim Lamaran'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.infoPaket}>
        <p>📍 <strong>Lokasi:</strong> Glagahagung, Purwoharjo, Banyuwangi</p>
      </div>
    </div>
  );
};

// ============================================================
// STYLES (konsisten dengan PendaftaranOnline.jsx)
// ============================================================
const styles = {
  wrapper: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#f8fafc', fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" },
  card: { width: '100%', maxWidth: '600px', background: 'white', borderRadius: '16px', padding: '32px 28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' },
  logo: { width: '56px', height: '56px', borderRadius: '12px', border: '2px solid #e2e8f0', objectFit: 'cover', flexShrink: 0 },
  title: { fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.3 },
  subtitle: { fontSize: '13px', color: '#64748b', margin: '2px 0 0' },
  errorBox: { padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', fontWeight: 600, marginBottom: '16px' },
  stepRow: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  stepDot: { width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, transition: 'all 0.3s ease' },
  stepLabel: { fontSize: '10px', transition: 'all 0.3s ease', whiteSpace: 'nowrap' },
  formArea: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px', paddingBottom: '8px', borderBottom: '2px solid #f1f5f9' },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 600, color: '#475569' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white', color: '#1e293b', boxSizing: 'border-box', width: '100%' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'white', color: '#1e293b', cursor: 'pointer', boxSizing: 'border-box', width: '100%' },
  textarea: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '70px', fontFamily: 'inherit', background: 'white', color: '#1e293b', boxSizing: 'border-box', width: '100%' },
  suratTextarea: { padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', resize: 'vertical', minHeight: '220px', fontFamily: 'inherit', background: 'white', color: '#1e293b', boxSizing: 'border-box', width: '100%', lineHeight: 1.6 },
  hint: { fontSize: '10px', color: '#94a3b8', marginTop: '2px' },
  row: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  btnPrev: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', flex: 1 },
  btnNext: { padding: '12px', borderRadius: '8px', border: 'none', background: '#652D90', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', flex: 1 },
  btnSubmit: { padding: '12px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)', flex: 1 },
  successBox: { textAlign: 'center', padding: '20px 0' },
  successInfo: { background: '#f0fdf4', padding: '14px', borderRadius: '8px', textAlign: 'left', fontSize: '13px', color: '#166534', marginBottom: '16px', lineHeight: '1.8', border: '1px solid #bbf7d0' },
  infoPaket: { width: '100%', maxWidth: '600px', marginTop: '16px', padding: '16px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', lineHeight: '1.8', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },

  // 🔥 BARU: upload dokumen (CV + foto)
  uploadBox: (loading) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px', borderRadius: '8px', border: '2px dashed #652D90',
    color: '#652D90', fontWeight: 'bold', fontSize: '13px',
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
    background: '#faf5ff',
  }),
  successFileBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0',
    background: '#f0fdf4', fontSize: '13px', color: '#166534', fontWeight: 600,
  },
  fotoSuccessBox: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 10, border: '1px solid #bbf7d0', background: '#f0fdf4',
  },
  fotoThumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' },
  btnGanti: {
    background: 'none', border: 'none', color: '#652D90', fontSize: 11,
    fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 4,
  },
};

export default PendaftaranTentor;