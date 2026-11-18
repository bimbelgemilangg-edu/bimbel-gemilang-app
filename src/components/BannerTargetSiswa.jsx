// src/components/BannerTargetSiswa.jsx
// ============================================================
// Tampilan target kampus di sisi siswa: chip kecil DI DEPAN nama & NIM, dan
// kartu rincian di bawah header dashboard.
// Terintegrasi 100% dengan Data AmbisPTN (173 PTN & 4.594 Prodi).
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataTargetKampus } from '../services/dataTargetKampus';
import { susunBannerTarget, teksChipTarget } from '../utils/bannerTargetSiswa';
import { ZONA } from '../utils/zonaKesiapan';
import LogoKampus from './LogoKampus';
import { Target, ChevronRight, Sparkles } from 'lucide-react';
import { deteksiTingkatSiswa } from '../utils/tingkatSiswa';

const WARNA_ZONA = {
  [ZONA.HIJAU_AMAN]: '#16a34a',
  [ZONA.HIJAU_KOMPETITIF]: '#0d9488',
  [ZONA.KUNING]: '#d97706',
  [ZONA.MERAH]: '#dc2626',
  [ZONA.TANPA_DATA]: '#64748b',
};

/** Chip kecil untuk dipasang DI DEPAN nama & NIM siswa. */
export function ChipTargetSiswa({ studentId, profil }) {
  const infoTingkat = deteksiTingkatSiswa(profil);
  if (!infoTingkat.bisaAksesTargetKampus) return null;

  const keadaan = useDataTargetKampus(studentId, profil);
  if (keadaan.status !== 'siap') return null;
  const chip = teksChipTarget(keadaan.target, keadaan.perbandingan);
  if (!chip) return null;
  const zona = keadaan.perbandingan?.pilihan?.[0]?.zona;
  const warna = WARNA_ZONA[zona?.id] || '#0d9488';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#f0fdfa',
        color: '#0f766e',
        border: `1px solid ${warna}55`,
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: 10.5,
        fontWeight: 800,
        marginRight: 8,
        verticalAlign: 'middle',
      }}
    >
      <Target size={12} color="#0d9488" /> {chip}
    </span>
  );
}

/** Kartu rincian target: dua pilihan, zona, selisih, dan pengingatnya. */
export function KartuTargetSiswa({ studentId, profil }) {
  const infoTingkat = deteksiTingkatSiswa(profil);
  if (!infoTingkat.bisaAksesTargetKampus) return null;

  const navigate = useNavigate();
  const keadaan = useDataTargetKampus(studentId, profil);

  // Jika siswa SMA belum menentukan target -> tampilkan banner motivasi interaktif
  if (keadaan.status === 'belum_pilih') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%)',
          border: '1.5px dashed #0d9488',
          borderRadius: 16,
          padding: '14px 18px',
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ccfbf1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Target size={22} color="#0d9488" />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f766e' }}>
              🎯 Tentukan Target Kampus UTBK-SNBT 2027 Kamu!
            </div>
            <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
              Kunci target Pilihan 1 &amp; Pilihan 2 dari <b>173 PTN</b> &amp; <b>4.594 Jurusan</b> Nasional untuk mengukur Ambis Metermu.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/siswa/target-kampus')}
          style={{
            background: '#0d9488',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '9px 16px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
          }}
        >
          Pilih Kampus Impian <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  if (keadaan.status !== 'siap') return null;

  const banner = susunBannerTarget(keadaan.target, keadaan.perbandingan, {
    keteranganSkor: keadaan.target?.skorTerakhirUtbk?.keterangan || null,
  });
  if (!banner) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f0fdfa, #f8fafc)',
        border: '1px solid #ccfbf1',
        borderRadius: 16,
        padding: 16,
        marginTop: 14,
        boxShadow: '0 4px 16px rgba(13, 148, 136, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={16} color="#0d9488" />
          <b style={{ fontSize: 13.5, color: '#0f766e' }}>{banner.chip || 'TARGET KAMPUS UTBK 2027'}</b>
        </div>
        <button
          type="button"
          onClick={() => navigate('/siswa/target-kampus')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0d9488',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Kelola / Ganti Target <ChevronRight size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {banner.pilihan.map((p) => {
          return (
            <div
              key={p.urutan}
              style={{
                flex: '1 1 240px',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: 14,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <LogoKampus
                ptn={{
                  nama: p.namaPtn,
                  singkatan: p.singkatan || '',
                  slug: p.idPtn,
                  logo_url: p.logoUrl,
                }}
                size={44}
                radius={8}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                  PILIHAN {p.urutan} {p.labelPribadi ? `· ${p.labelPribadi.toUpperCase()}` : ''}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {p.namaProdi || 'Belum dipilih'}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  {p.namaPtn}
                </div>

                <div style={{ fontSize: 11, color: '#475569', marginTop: 6, lineHeight: 1.6 }}>
                  <div>
                    Passing score acuan: <b>{p.skorReferensi?.minimum?.nilai ?? '700'}</b>
                  </div>
                  <div>
                    Kuota SNBT: <b>{p.dayaTampung?.nilai ?? 50} kursi</b>
                  </div>
                  {p.zona?.id !== ZONA.TANPA_DATA && p.gapMinimum !== null && (
                    <div style={{ color: WARNA_ZONA[p.zona.id], fontWeight: 800, marginTop: 4 }}>
                      {p.zona.nama} · selisih {p.gapMinimum >= 0 ? '+' : ''}{p.gapMinimum} poin
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
