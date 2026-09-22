// src/services/bankFileService.js
// ============================================================
// BANK MATERI (Fase 4.2, request owner Turn 15) -- gudang file
// pusat sisi ADMIN: upload sekali, pakai berulang di bab/materi
// mana pun (slide PPT, PDF, gambar, video). Menyatu dengan file
// lama karena memakai bucket Supabase yang sama ('materi-bimbel')
// via services/uploadService.js -- tidak ada duplikasi storage.
// ============================================================
import { supabase, uploadElearningFile } from './uploadService';

const BUCKET = 'materi-bimbel';

// Folder yang discan sebagai isi bank (folder upload v2 + folder
// legacy supaya file lama ikut terlihat & bisa dipakai ulang).
export const FOLDER_BANK = ['materi-v2', 'pdf', 'dokumen', 'gambar'];

const extOf = (name) => {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
};

export const jenisFile = (name) => {
  const e = extOf(name);
  if (['ppt', 'pptx'].includes(e)) return 'slide';
  if (e === 'pdf') return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'gambar';
  if (['mp4', 'webm', 'mov', 'm4v'].includes(e)) return 'video';
  if (['doc', 'docx'].includes(e)) return 'dokumen';
  return 'lain';
};

/**
 * List isi bank: gabungkan beberapa folder storage.
 * Return: [{ path, name, ukuran, jenis, updated, url }]
 */
export async function listBankFiles() {
  const hasil = [];
  for (const folder of FOLDER_BANK) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 300, sortBy: { column: 'created_at', order: 'desc' } });
      if (error || !data) continue;
      data.forEach((f) => {
        if (!f.name) return; // lewati sub-folder
        const path = `${folder}/${f.name}`;
        hasil.push({
          path,
          name: f.name,
          ukuran: f.metadata?.size || 0,
          jenis: jenisFile(f.name),
          updated: f.created_at || f.updated_at || '',
          url: supabase.storage.from(BUCKET).getPublicUrl(path).publicUrl,
        });
      });
    } catch (e) {
      console.warn('Gagal list folder bank:', folder, e);
    }
  }
  hasil.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  return hasil;
}

/** Upload file baru ke bank (folder materi-v2). Return obj file. */
export async function uploadBankFile(file) {
  const res = await uploadElearningFile(file, 'materi-v2');
  const url = res?.downloadURL || res?.url || '';
  if (!url) throw new Error('URL tidak dikembalikan Supabase.');
  // path relatif diambil dari ujung URL
  const idx = url.indexOf('/materi-bimbel/');
  const path = idx >= 0 ? decodeURIComponent(url.slice(idx + '/materi-bimbel/'.length)) : '';
  return {
    path,
    name: file.name,
    ukuran: file.size || 0,
    jenis: jenisFile(file.name),
    updated: new Date().toISOString(),
    url,
  };
}

/** Hapus file dari bank (admin saja; hati-hati file dipakai bab). */
export async function hapusBankFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export const formatUkuran = (b) => {
  const n = Number(b) || 0;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
};
