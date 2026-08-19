// src/components/StudentDigitalCard.jsx
import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadElearningFile } from '../services/uploadService';
import { Camera, X, IdCard } from 'lucide-react';

// Logo diambil dari public/ (file yang sudah ada di project)
const LOGO_URL = '/pwa-512x512.png';

// ============================================================
// 🔥 GARIS-GARIS UNIK (barcode dekoratif) — dibuat dari hash
// studentId, JADI SELALU SAMA buat siswa yang sama tapi TIDAK
// menampilkan ID-nya sebagai teks/angka yang bisa dibaca. Murni
// visual identitas, bukan buat di-scan (yang bisa discan itu QR).
// ============================================================
const generateBarcodeBars = (seedStr, count = 38) => {
  let seed = 0;
  const str = String(seedStr || 'gemilang');
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) >>> 0;

  const bars = [];
  let s = seed || 12345;
  for (let i = 0; i < count; i++) {
    // xorshift sederhana biar deterministik & ringan
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    bars.push(2 + (s % 5)); // lebar garis 2-6px
  }
  return bars;
};

const StudentDigitalCard = ({ studentId, student, onUpdated }) => {
  const [flipped, setFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const {
    nama = 'Siswa',
    fotoUrl = null,
    fotoDiubahOlehSiswa = false, // 🔥 flag: sudah pakai jatah ganti foto sendiri?
  } = student || {};
  // 🔥 alamat disimpan di dalam field "ortu" (lihat EditStudent.jsx), bukan
  // di top-level -- disesuaikan biar konsisten dengan struktur data asli.
  const alamat = student?.ortu?.alamat || student?.alamat || '';

  const nim = student?.studentId || studentId || '';
  const bars = generateBarcodeBars(nim);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(`GEMILANG-SISWA:${nim}`, {
      width: 160,
      margin: 0,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => {});
    return () => { active = false; };
  }, [nim]);

  const handlePickFile = (e) => {
    e.stopPropagation(); // biar gak ikut mem-flip kartu
    if (fotoDiubahOlehSiswa) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset biar bisa pilih file yang sama lagi kalau gagal
    if (!file || !studentId) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      const result = await uploadElearningFile(file, 'foto-siswa');
      if (!result.success) throw new Error(result.error || 'Upload gagal');

      await updateDoc(doc(db, 'students', studentId), {
        fotoUrl: result.downloadURL,
        fotoDiubahOlehSiswa: true, // 🔒 jatah siswa terpakai, selanjutnya cuma admin
        fotoUpdatedAt: new Date().toISOString(),
      });

      onUpdated?.({ fotoUrl: result.downloadURL, fotoDiubahOlehSiswa: true });
    } catch (err) {
      console.error('Gagal upload foto siswa:', err);
      setErrorMsg('Gagal mengunggah foto. Coba lagi.');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}>
      <div
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        aria-label="Ketuk untuk membalik kartu identitas siswa"
        onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
        style={{
          position: 'relative', width: '100%', aspectRatio: '1.586 / 1',
          cursor: 'pointer', perspective: 1200,
        }}
      >
        <div style={{
          position: 'relative', width: '100%', height: '100%',
          transformStyle: 'preserve-3d', transition: 'transform 0.6s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>

          {/* ===== SISI DEPAN: foto + alamat saja ===== */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden',
            backfaceVisibility: 'hidden', boxShadow: '0 6px 20px rgba(103,58,183,0.25)',
            background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #673ab7 100%)',
            display: 'flex', flexDirection: 'column', padding: 18, color: 'white',
          }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(245,158,11,0.12)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
              <img src={LOGO_URL} alt="" style={{ width: 22, height: 22, borderRadius: 6 }} />
              <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#fcd34d', fontWeight: 700 }}>
                Bimbel Gemilang
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1, marginTop: 10 }}>
              <div style={{
                width: 78, height: 78, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
                border: '2px solid rgba(252,211,77,0.7)', background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#fcd34d' }}>
                    {nama.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{nama}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 1.4 }}>
                  {alamat || 'Alamat belum diisi'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <button
                onClick={handlePickFile}
                disabled={fotoDiubahOlehSiswa || uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
                  padding: '6px 10px', borderRadius: 10, border: 'none',
                  background: fotoDiubahOlehSiswa ? 'rgba(255,255,255,0.12)' : 'rgba(252,211,77,0.9)',
                  color: fotoDiubahOlehSiswa ? 'rgba(255,255,255,0.5)' : '#4c1d95',
                  cursor: fotoDiubahOlehSiswa || uploading ? 'default' : 'pointer',
                }}
              >
                <Camera size={12} />
                {uploading ? 'Mengunggah…' : fotoDiubahOlehSiswa ? 'Ganti lewat admin' : 'Ganti foto (1x)'}
              </button>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Ketuk kartu →</span>
            </div>

            {errorMsg && (
              <div style={{ position: 'absolute', bottom: 44, left: 18, right: 18, fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '5px 8px', borderRadius: 8 }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* ===== SISI BELAKANG: identitas + QR + garis unik ===== */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden',
            backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            boxShadow: '0 6px 20px rgba(30,27,75,0.3)', background: '#1e1b4b',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 16, color: 'white', gap: 8,
          }}>
            <img src={LOGO_URL} alt="Logo Bimbel Gemilang" style={{ width: 30, height: 30, borderRadius: 8, marginBottom: 2 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>Bimbingan Belajar Gemilang</div>
              <div style={{ fontSize: 9, color: '#fcd34d', letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>
                Kartu Identitas Siswa
              </div>
            </div>

            {qrDataUrl && (
              <div style={{ background: 'white', padding: 6, borderRadius: 10, marginTop: 2 }}>
                <img src={qrDataUrl} alt="QR identitas siswa" width={84} height={84} />
              </div>
            )}

            {/* garis-garis unik */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, marginTop: 2 }}>
              {bars.map((w, i) => (
                <div key={i} style={{ width: w, height: '100%', background: i % 4 === 0 ? '#fcd34d' : 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
              ))}
            </div>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: -2 }}>Identitas unik siswa</span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default StudentDigitalCard;