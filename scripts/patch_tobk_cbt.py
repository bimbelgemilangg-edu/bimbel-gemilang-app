import os

file_path = 'src/pages/public/tobk/TobkCbtPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add imports
old_import = "import { db } from '../../../firebase';"
if old_import not in text:
    target_imp = "import { bacaanDari, gambarButirDari } from '../../../utils/fieldButirSoal';"
    replacement_imp = """import { bacaanDari, gambarButirDari } from '../../../utils/fieldButirSoal';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';"""
    text = text.replace(target_imp, replacement_imp, 1)

old_backup = """      // Ambil Backup Jawaban & Sisa Waktu
      try {
        const rawJawab = localStorage.getItem(`tobk_jawaban_${sesi.pesertaId}`);
        if (rawJawab) {
          const parsed = JSON.parse(rawJawab);
          if (parsed.jawaban) setJawaban(parsed.jawaban);
          if (parsed.ragu) setRagu(parsed.ragu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
          if (parsed.subtesAktifIndex !== undefined && Number(parsed.subtesAktifIndex) < sList.length) {
            setSubtesAktifIndex(Number(parsed.subtesAktifIndex));
          }
          if (parsed.indexSoal !== undefined) {
            setIndexSoal(Number(parsed.indexSoal));
          }
        }

        const savedDetik = localStorage.getItem(`tobk_sisa_detik_${sesi.pesertaId}`);
        if (savedDetik && Number(savedDetik) > 5) {
          detikAwal = Number(savedDetik);
        }
      } catch (e) {}"""

new_backup = """      // Ambil Backup Jawaban & Sisa Waktu (Local + Cloud Firestore Recovery)
      try {
        let loadedJawabanLocal = false;
        const rawJawab = localStorage.getItem(`tobk_jawaban_${sesi.pesertaId}`);
        if (rawJawab) {
          const parsed = JSON.parse(rawJawab);
          if (parsed.jawaban && Object.keys(parsed.jawaban).length > 0) {
            setJawaban(parsed.jawaban);
            loadedJawabanLocal = true;
          }
          if (parsed.ragu) setRagu(parsed.ragu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
          if (parsed.subtesAktifIndex !== undefined && Number(parsed.subtesAktifIndex) < sList.length) {
            setSubtesAktifIndex(Number(parsed.subtesAktifIndex));
          }
          if (parsed.indexSoal !== undefined) {
            setIndexSoal(Number(parsed.indexSoal));
          }
        }

        // Jika localStorage kosong (misal siswa pindah laptop/komputer lain), pulihkan jawaban dari Cloud Firestore
        if (!loadedJawabanLocal && sesi.pesertaId) {
          try {
            const snapCloud = await getDoc(doc(db, 'tobk_event_jawaban', sesi.pesertaId));
            if (snapCloud.exists()) {
              const dataCloud = snapCloud.data();
              if (dataCloud.jawaban) setJawaban(dataCloud.jawaban);
              if (dataCloud.ragu) setRagu(dataCloud.ragu);
              if (dataCloud.pelanggaran) setPelanggaran(dataCloud.pelanggaran);
              if (dataCloud.subtesAktifIndex !== undefined && Number(dataCloud.subtesAktifIndex) < sList.length) {
                setSubtesAktifIndex(Number(dataCloud.subtesAktifIndex));
              }
              if (dataCloud.indexSoal !== undefined) {
                setIndexSoal(Number(dataCloud.indexSoal));
              }
            }
          } catch (errCloud) {
            console.warn('[TOBK] Gagal sync jawaban dari cloud:', errCloud);
          }
        }

        const savedDetik = localStorage.getItem(`tobk_sisa_detik_${sesi.pesertaId}`);
        if (savedDetik && Number(savedDetik) > 5) {
          detikAwal = Number(savedDetik);
        }

        // Tandai status aktif "mengerjakan" di database Firestore
        try {
          await updateDoc(doc(db, 'tobk_event_leads', sesi.pesertaId), {
            statusUjian: 'mengerjakan',
            waktuMulai: new Date().toISOString(),
          });
        } catch (errStatus) {}
      } catch (e) {}"""

assert old_backup in text, 'old_backup not found'
text = text.replace(old_backup, new_backup, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched TobkCbtPage.jsx successfully!')
