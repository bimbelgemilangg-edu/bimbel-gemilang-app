import os

file_path = 'src/services/tobkPublikService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace line 31 export with import and export
old_import = "export { SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK } from '../data/utbk2026KatkielData';"
new_import = "import { SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK } from '../data/utbk2026KatkielData';\nexport { SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK };"

if old_import in text:
    text = text.replace(old_import, new_import)

recovery_code = """

// ============================================================
// 5. RESTORE PESERTA, HITUNG ULANG NILAI, & RECOVERY CBT
// Solusi darurat jika laptop siswa freeze / hang, salah diskualifikasi,
// atau nilai belum terbit akibat gangguan perangkat.
// ============================================================

export async function pulihkanPesertaTobk(pesertaId, statusBaru = 'mengerjakan') {
  if (!pesertaId) return { success: false, message: 'ID Peserta tidak valid' };

  try {
    const updatePayload = {
      statusUjian: statusBaru,
      totalPelanggaran: 0,
      waktuSelesai: null,
      skor: null,
    };

    try {
      await updateDoc(doc(db, 'tobk_event_leads', pesertaId), updatePayload);
    } catch (err) {
      console.warn('[TOBK] Gagal pulihkan peserta Firestore:', err);
    }

    try {
      await updateDoc(doc(db, 'tobk_event_jawaban', pesertaId), {
        pelanggaran: [],
      });
    } catch (err) {}

    const leads = getLocalLeads();
    const item = leads.find((l) => l.pesertaId === pesertaId || l.id === pesertaId);
    if (item) {
      Object.assign(item, updatePayload);
      saveLocalLeads(leads);
    }

    return {
      success: true,
      message: `Peserta berhasil dipulihkan! Status diubah menjadi "${statusBaru}" dan pelanggaran di-reset ke 0.`,
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function hitungUlangSkorPeserta(pesertaId, eventId = null) {
  if (!pesertaId) return { success: false, message: 'ID Peserta tidak valid' };

  try {
    // 1. Ambil Data Lead Peserta
    let lead = null;
    const leadRef = doc(db, 'tobk_event_leads', pesertaId);
    try {
      const snapLead = await getDoc(leadRef);
      if (snapLead.exists()) {
        lead = { id: snapLead.id, ...snapLead.data() };
      }
    } catch (e) {
      console.warn('[TOBK] Gagal ambil lead Firestore:', e);
    }

    if (!lead) {
      const local = getLocalLeads().find((l) => l.pesertaId === pesertaId || l.id === pesertaId);
      if (local) lead = local;
    }

    if (!lead) {
      return { success: false, message: 'Data peserta tidak ditemukan di database' };
    }

    const actualEventId = eventId || lead.eventId;

    // 2. Ambil Jawaban Peserta
    let jawaban = {};
    try {
      const snapJawab = await getDoc(doc(db, 'tobk_event_jawaban', pesertaId));
      if (snapJawab.exists()) {
        jawaban = snapJawab.data().jawaban || {};
      }
    } catch (e) {
      console.warn('[TOBK] Gagal ambil jawaban Firestore:', e);
    }

    if (Object.keys(jawaban).length === 0) {
      try {
        const raw = localStorage.getItem(`tobk_jawaban_${pesertaId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          jawaban = parsed.jawaban || {};
        }
      } catch (e) {}
    }

    // 3. Ambil Konfigurasi Soal Event
    let ev = null;
    if (actualEventId && actualEventId !== 'semua') {
      try {
        ev = await ambilEventTobkById(actualEventId);
      } catch (e) {}
    }

    let subtesList = [];
    if (ev && Array.isArray(ev.subtes) && ev.subtes.length > 0) {
      subtesList = ev.subtes;
    } else if (ev && Array.isArray(ev.daftarSoal) && ev.daftarSoal.length > 0) {
      subtesList = [{ id: 'subtes_utama', nama: ev.judul || 'Subtes Utama', durasiMenit: ev.durasiMenit || 90, soal: ev.daftarSoal }];
    } else {
      subtesList = SUBTES_RESMI_UTBK_2026;
    }

    const isTka = (ev?.formatUjian || '').startsWith('TKA') || (ev?.kategori || '').startsWith('TKA');
    const totalSoalAda = subtesList.flatMap((s) => s.soal || []).length;
    if (!isTka && (totalSoalAda < 50 || !ev || ev.formatUjian === 'UTBK_2026' || ev.sumberSoal === 'preset_utbk_2026')) {
      subtesList = SUBTES_RESMI_UTBK_2026;
    }

    subtesList = subtesList.map((sub, sIdx) => ({
      ...sub,
      soal: (sub.soal || []).map((q, qIdx) => ({
        ...q,
        id: q.id || `q_${sub.id || sIdx + 1}_${q.nomor || qIdx + 1}`,
      })),
    }));

    // 4. Hitung Skor
    const semuaSoal = subtesList.flatMap((s) => s.soal || []);
    let benar = 0;
    let salah = 0;
    let kosong = 0;
    let totalBobotTerkumpul = 0;
    let totalMaksBobot = 0;

    semuaSoal.forEach((soal) => {
      const mapelLow = (soal.mapel || '').toLowerCase();
      let bobotSoal = 1.0;
      if (mapelLow.includes('matematika') || mapelLow.includes('kuantitatif')) {
        bobotSoal = 1.25;
      } else if (mapelLow.includes('penalaran')) {
        bobotSoal = 1.15;
      } else if (mapelLow.includes('inggris')) {
        bobotSoal = 1.1;
      }

      totalMaksBobot += bobotSoal;

      const jawab = jawaban[soal.id];
      const kunci = soal.kunciJawaban || soal.kunci;
      if (!jawab || (typeof jawab === 'object' && Object.keys(jawab).length === 0)) {
        kosong++;
      } else if (typeof kunci === 'object' && kunci !== null && typeof jawab === 'object') {
        const keys = Object.keys(kunci);
        const cocok = keys.filter((k) => String(jawab[k] || '').toLowerCase() === String(kunci[k] || '').toLowerCase()).length;
        if (cocok === keys.length) {
          benar++;
          totalBobotTerkumpul += bobotSoal;
        } else if (cocok > 0) {
          totalBobotTerkumpul += bobotSoal * (cocok / keys.length);
          salah++;
        } else {
          salah++;
        }
      } else if (String(jawab).trim().toUpperCase() === String(kunci).trim().toUpperCase()) {
        benar++;
        totalBobotTerkumpul += bobotSoal;
      } else {
        salah++;
      }
    });

    const totalSoal = semuaSoal.length || 1;
    const skorPersen = Math.round((benar / totalSoal) * 100);
    const rasioBobot = totalMaksBobot > 0 ? totalBobotTerkumpul / totalMaksBobot : 0;
    const skorSkalaUtbk = Math.round(200 + rasioBobot * 600);
    const skorFinal = isTka ? skorPersen : skorSkalaUtbk;

    // Hitung per Subtes
    const skorSubtes = subtesList.map((s) => {
      const soalSub = s.soal || [];
      let sBenar = 0;
      let sSalah = 0;
      let sKosong = 0;
      let sBobotTerkumpul = 0;
      let sMaksBobot = 0;

      soalSub.forEach((soal) => {
        const mapelLow = (soal.mapel || s.nama || '').toLowerCase();
        let bobotSoal = 1.0;
        if (mapelLow.includes('matematika') || mapelLow.includes('kuantitatif')) bobotSoal = 1.25;
        else if (mapelLow.includes('penalaran')) bobotSoal = 1.15;
        else if (mapelLow.includes('inggris')) bobotSoal = 1.1;
        sMaksBobot += bobotSoal;

        const ans = jawaban[soal.id];
        const kunci = soal.kunciJawaban || soal.kunci;
        if (!ans || (typeof ans === 'object' && Object.keys(ans).length === 0)) {
          sKosong++;
        } else if (typeof kunci === 'object' && kunci !== null && typeof ans === 'object') {
          const keys = Object.keys(kunci);
          const cocok = keys.filter((k) => String(ans[k] || '').toLowerCase() === String(kunci[k] || '').toLowerCase()).length;
          if (cocok === keys.length) {
            sBenar++;
            sBobotTerkumpul += bobotSoal;
          } else if (cocok > 0) {
            sBobotTerkumpul += bobotSoal * (cocok / keys.length);
            sSalah++;
          } else {
            sSalah++;
          }
        } else if (String(ans).trim().toUpperCase() === String(kunci).trim().toUpperCase()) {
          sBenar++;
          sBobotTerkumpul += bobotSoal;
        } else {
          sSalah++;
        }
      });

      const rasioSub = sMaksBobot > 0 ? sBobotTerkumpul / sMaksBobot : 0;
      const skorSub = isTka ? Math.round((sBenar / (soalSub.length || 1)) * 100) : Math.round(200 + rasioSub * 600);

      return {
        id: s.id,
        kode: s.kode || s.id,
        nama: s.nama,
        skor: skorSub,
        benar: sBenar,
        salah: sSalah,
        kosong: sKosong,
        total: soalSub.length,
      };
    });

    const updatePayload = {
      statusUjian: 'selesai',
      skor: skorFinal,
      skorPersen,
      skorSubtes,
      totalBenar: benar,
      totalSalah: salah,
      totalKosong: kosong,
      totalPelanggaran: 0,
      waktuSelesai: new Date().toISOString(),
    };

    try {
      await updateDoc(leadRef, updatePayload);
    } catch (err) {
      console.warn('[TOBK] Gagal update hasil hitung ulang Firestore:', err);
    }

    const leads = getLocalLeads();
    const item = leads.find((l) => l.pesertaId === pesertaId || l.id === pesertaId);
    if (item) {
      Object.assign(item, updatePayload);
      saveLocalLeads(leads);
    }

    return {
      success: true,
      skor: skorFinal,
      benar,
      salah,
      kosong,
      totalTerjawab: Object.keys(jawaban).length,
      message: `Skor berhasil diterbitkan! Nilai: ${skorFinal} (Benar: ${benar}, Salah: ${salah}, Kosong: ${kosong} dari ${totalSoal} butir soal).`,
    };
  } catch (err) {
    console.error('[TOBK] Gagal hitung ulang:', err);
    return { success: false, message: 'Gagal kalkulasi nilai: ' + err.message };
  }
}

export async function hapusSatuPesertaTobk(pesertaId) {
  if (!pesertaId) return { success: false, message: 'ID Peserta tidak valid' };
  try {
    await deleteDoc(doc(db, 'tobk_event_leads', pesertaId));
  } catch (e) {}
  try {
    await deleteDoc(doc(db, 'tobk_event_jawaban', pesertaId));
  } catch (e) {}
  const leads = getLocalLeads().filter((l) => l.pesertaId !== pesertaId && l.id !== pesertaId);
  saveLocalLeads(leads);
  return { success: true, message: 'Data peserta berhasil dihapus!' };
}
"""

text += recovery_code
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Patch applied successfully!')
