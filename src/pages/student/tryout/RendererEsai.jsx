// src/pages/student/tryout/RendererEsai.jsx
// ============================================================
// 🔥 BARU (permintaan owner 2026-10-04): renderer soal tipe `esai`
// untuk Try Out. Siswa diberi DUA cara menjawab, persis seperti diminta:
//   1. KOTAK TEKS ("chat box") untuk mengetik jawaban, dan
//   2. TOMBOL KAMERA untuk memotret jawaban tulisan tangan di kertas
//      (di HP tombol ini langsung membuka kamera belakang).
// Keduanya opsional-sendiri-sendiri tapi minimal satu: jawaban dianggap
// ada kalau teks terisi ATAU foto terpasang.
//
// PENILAIAN: esai TIDAK dinilai otomatis. Jawaban dikirim apa adanya dan
// ditandai "menunggu penilaian guru"; admin menilai per siswa di halaman
// Hasil Try Out (skala 0-100 per soal), dan nilai itu masuk ke total
// akhir lewat hitungTotalSkor(..., nilaiEsai). Skor otomatis yang dilihat
// siswa sesaat setelah submit sengaja hanya mencakup soal non-esai,
// dengan catatan jelas di layar hasil.
//
// FOTO: disimpan sebagai data-URI hasil KOMPRESI (browser-image-compression,
// pola yang sama dengan WordImportQuiz.jsx) supaya dokumen Firestore
// (batas 1 MB) tidak jebol. Bila setelah kompresi masih terlalu besar,
// ditolak dengan pesan -- bukan diam-diam gagal.
// ============================================================

import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { soalBelumDijawab } from '../../../utils/skorSoalTryOut';

// Batas aman data-URI foto di dalam dokumen tryout_sesi (Firestore max 1 MB
// per dokumen, dan dokumen itu juga memuat seluruh jawaban teks + metadata).
const MAKS_FOTO_BYTES = 700 * 1024;

export default function RendererEsai({
  soal,
  jawabanTerpilih = null,
  onChange,
  modeTinjau = false,
  disabled = false,
  onKlikGambar = null,
}) {
  const [busyFoto, setBusyFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');

  const nilai = jawabanTerpilih && typeof jawabanTerpilih === 'object'
    ? jawabanTerpilih
    : { teks: typeof jawabanTerpilih === 'string' ? jawabanTerpilih : '', foto: '' };
  const teks = nilai.teks || '';
  const foto = nilai.foto || '';

  const kirim = (patch) => onChange?.({ ...nilai, ...patch });

  const belumDijawab = modeTinjau && soalBelumDijawab(soal, jawabanTerpilih);

  const ambilFoto = async (file) => {
    setErrorFoto('');
    if (!file) return;
    setBusyFoto(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1000,
        useExifOrientation: true,
        fileType: 'image/jpeg',
      });
      const dataUri = await imageCompression.getDataUrlFromFile(compressed);
      // dataUri berawalan "data:image/jpeg;base64," -- ukurannya kira-kira
      // 4/3 dari biner, jadi cek panjang string setelah dipotong header.
      const perkiraanByte = Math.floor((dataUri.length - dataUri.indexOf(',') - 1) * 0.75);
      if (perkiraanByte > MAKS_FOTO_BYTES) {
        setErrorFoto(
          `Foto masih terlalu besar (${Math.round(perkiraanByte / 1024)} KB). ` +
          'Potret ulang dari jarak dekat supaya tulisan memenuhi layar, atau ketik jawabanmu.',
        );
        return;
      }
      kirim({ foto: dataUri });
    } catch (e) {
      console.error('[Esai] gagal memproses foto:', e);
      setErrorFoto(`Gagal memproses foto: ${e?.message || e}. Kamu tetap bisa mengetik jawaban.`);
    } finally {
      setBusyFoto(false);
    }
  };

  return (
    <div>
      {belumDijawab && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb',
          border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px',
          marginBottom: 10, fontSize: 12, color: '#92400e', fontWeight: 700,
        }}>
          ⚠️ Soal ini tidak dijawab
        </div>
      )}

      {/* ===== KOTAK TEKS (chat box) ===== */}
      <textarea
        value={teks}
        onChange={(e) => kirim({ teks: e.target.value })}
        disabled={disabled || modeTinjau}
        placeholder="Ketik jawabanmu di sini... (atau potret jawaban tulisan tanganmu pakai tombol kamera di bawah)"
        style={{
          width: '100%', minHeight: 110, padding: '12px 14px', borderRadius: 12,
          border: '1px solid #cbd5e1', fontSize: 14, lineHeight: 1.6,
          fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
          background: disabled || modeTinjau ? '#f8fafc' : 'white',
          color: '#1e293b', outline: 'none',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, color: '#94a3b8' }}>
        <span>{teks.length} karakter</span>
        <span>jawaban tulisan tangan boleh difoto 👇</span>
      </div>

      {/* ===== TOMBOL KAMERA ===== */}
      {!modeTinjau && !disabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, cursor: busyFoto ? 'wait' : 'pointer',
            background: '#eef2ff', border: '1.5px solid #c7d2fe', color: '#3730a3',
            borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 800,
          }}>
            <Camera size={15} />
            {busyFoto ? 'Memproses foto...' : foto ? 'Ganti foto jawaban' : 'Foto jawaban tulisan tangan'}
            {/* capture="environment" = di HP langsung membuka kamera belakang;
                di desktop jatuh ke pemilih file biasa. */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              disabled={busyFoto}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ''; // boleh memotret ulang file yang sama
                ambilFoto(f);
              }}
            />
          </label>
          {foto && (
            <button
              type="button"
              onClick={() => kirim({ foto: '' })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef2f2',
                border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 10,
                padding: '9px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <Trash2 size={13} /> Hapus foto
            </button>
          )}
        </div>
      )}

      {errorFoto && (
        <div style={{ marginTop: 8, background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
          ⚠️ {errorFoto}
        </div>
      )}

      {/* ===== PRATINJAU FOTO ===== */}
      {foto && (
        <div style={{ marginTop: 10 }}>
          <img
            src={foto}
            alt="Foto jawaban"
            onClick={onKlikGambar ? () => onKlikGambar(foto) : undefined}
            title={onKlikGambar ? 'Klik untuk memperbesar' : undefined}
            style={{ maxWidth: 260, width: '100%', borderRadius: 10, border: '1px solid #e2e8f0', display: 'block', cursor: onKlikGambar ? 'zoom-in' : 'default' }}
          />
        </div>
      )}

      {/* ===== MODE TINJAU (admin / review siswa) ===== */}
      {modeTinjau && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: '#334155', whiteSpace: 'pre-wrap' }}>
            {teks || <span style={{ color: '#94a3b8' }}>(tidak ada jawaban teks)</span>}
          </div>
          {foto ? (
            <a href={foto} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4338ca', fontSize: 12, fontWeight: 700 }}>
              <ImageIcon size={14} /> Buka foto jawaban ukuran penuh
            </a>
          ) : (
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Tidak ada foto jawaban.</span>
          )}
          {soal.kunciJawaban && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#166534' }}>
              💡 Jawaban rujukan/rubrik dari pembuat soal: <b>{soal.kunciJawaban}</b>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
