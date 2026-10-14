// PilihTampilanTryOut.jsx
// Gerbang sakelar fitur: bila 'papanJelajah' dinyalakan untuk siswa ini
// (settings/global_config.fiturPilot), pakai PapanJelajahPage baru;
// selain itu (termasuk saat konfigurasi gagal dibaca) pakai tampilan lama.
// DEFAULT MATI = try out Sabtu 17 Okt di produksi tidak boleh berubah rasa.
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
