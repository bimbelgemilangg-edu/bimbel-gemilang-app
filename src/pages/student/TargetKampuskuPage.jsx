// src/pages/student/TargetKampuskuPage.jsx
// ============================================================
// Halaman siswa untuk target kampus: kartu yang sama dengan di dashboard,
// plus pintu ke try out dan papan peringkat.
//
// Halaman ini HANYA berarti untuk siswa yang didaftarkan admin (kelas 12,
// fitur aktif, dokumen target ada). Siswa lain yang nyasar ke URL-nya
// melihat penjelasan singkat, bukan error dan bukan kartu kosong --
// mengikuti pola GateAksesSiswa.jsx yang sudah ada di repo.
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, PlayCircle, Trophy, FileDown } from 'lucide-react';
import { KartuTargetSiswa } from '../../components/BannerTargetSiswa';
import { useDataTargetKampus, muatDataTargetKampus } from '../../services/dataTargetKampus';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { muatStatusSiswa } from '../../utils/statusAkunSiswa';
import { isiSuratTarget } from '../../utils/isiSuratTarget';
import { ambilAsetSurat, unduhSuratTarget } from '../../utils/suratTargetPdf';

const S = {
  wrap: { maxWidth: 760, margin: '0 auto', padding: 16 },
  judul: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' },
  sub: { fontSize: 12.5, color: '#64748b', lineHeight: 1.6, margin: '0 0 12px' },
  pintu: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: '12px 14px', fontSize: 13.5, fontWeight: 700, color: '#334155',
    cursor: 'pointer', marginBottom: 10,
  },
};

export default function TargetKampuskuPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';
  const keadaan = useDataTargetKampus(studentId, profil);

  if (keadaan.status !== 'siap') {
    return (
      <div style={S.wrap}>
        <h1 style={S.judul}><Target size={22} color="#7c3aed" /> Target Kampusku</h1>
        <p style={S.sub}>
          Halaman ini terbuka setelah kamu dan orang tua/wali berkonsultasi dengan
          pembimbing Gemilang dan target Pilihan 1 &amp; 2 kamu didaftarkan.
          Bila kamu kelas 12 dan sudah konsultasi tapi halaman ini masih kosong,
          hubungi admin bimbel.
        </p>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <h1 style={S.judul}><Target size={22} color="#7c3aed" /> Target Kampusku</h1>
      <p style={S.sub}>
        Target ini hasil konsultasimu bersama pembimbing. Angka di dalamnya estimasi
        untuk bahan perencanaan — bukan janji kelulusan, dan bukan angka resmi panitia.
      </p>
      <KartuTargetSiswa studentId={studentId} profil={profil} />
      <div style={{ marginTop: 14 }}>
        <button type="button" style={S.pintu} onClick={async () => {
          const [st, data] = await Promise.all([muatStatusSiswa(), muatDataTargetKampus(studentId)]);
          if (!data) return;
          const isi = isiSuratTarget({
            siswa: st?.student || {},
            target: data.target,
            pilihan: keadaan.perbandingan?.pilihan || [],
            skor: data.target?.skorTerakhirUtbk?.nilai ?? null,
          });
          const aset = await ambilAsetSurat();
          await unduhSuratTarget(isi, aset);
        }}>
          <FileDown size={18} color="#7c3aed" /> Unduh Surat Komitmenku (PDF resmi Gemilang)
        </button>
        <button type="button" style={S.pintu} onClick={() => navigate('/siswa/tryout')}>
          <PlayCircle size={18} color="#7c3aed" /> Kerjakan try out — skormu menggeser zona kesiapan
        </button>
        <button type="button" style={S.pintu} onClick={() => navigate('/siswa/leaderboard')}>
          <Trophy size={18} color="#f59e0b" /> Lihat posisi skormu di papan peringkat
        </button>
      </div>
    </div>
  );
}
