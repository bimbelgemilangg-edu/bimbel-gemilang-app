// PilihTampilanTryOut.jsx
// Sakelar fitur: 'papanJelajah' sejak keputusan owner 14 Okt 2026 adalah
// FITUR DEFAULT NYALA untuk SEMUA siswa (sakelar hanya rem darurat:
// settings/global_config.fiturPilot.papanJelajah.aktif === false mematikan).
// Siswa tanpa konfigurasi apa pun tetap melihat PapanJelajahPage baru.
import React, { useEffect, useState } from 'react';
import { fiturAktifUntuk } from '../../../services/sakelarFiturService';
import DaftarTryOutPage from './DaftarTryOutPage';
import PapanJelajahPage from './PapanJelajahPage';

export default function PilihTampilanTryOut() {
  const studentId = typeof localStorage !== 'undefined' ? localStorage.getItem('studentId') || '' : '';
  const [putusan, setPutusan] = useState(null);

  useEffect(() => {
    let hidup = true;
    fiturAktifUntuk('papanJelajah', { studentId })
      .then((p) => { if (hidup) setPutusan(p); })
      .catch(() => { if (hidup) setPutusan({ aktif: false, alasan: 'sakelar gagal dibaca' }); });
    return () => { hidup = false; };
  }, [studentId]);

  if (putusan === null) return <div style={{ padding: 28, color: '#667' }}>Memuat daftar try out…</div>;
  return putusan.aktif ? <PapanJelajahPage studentId={studentId} /> : <DaftarTryOutPage />;
}
