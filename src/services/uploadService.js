import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const supabaseUrl = 'https://hqoasblnrsijbflupoir.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'materi-bimbel';

/**
 * Upload file ke Supabase Storage.
 * @param {string} fileData - Base64 string dari file.
 * @param {string} fileName - Nama file.
 * @param {string} fileType - MIME type file.
 * @returns {Promise<object>} - Hasil upload.
 */
export const uploadToDrive = async (fileData, fileName, fileType) => {
  try {
    // Validasi ukuran file (maksimal 50MB untuk Supabase Free Tier)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileData.length > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 50MB.');
    }

    // Konversi Base64 ke Blob
    const response = await fetch(fileData);
    const blob = await response.blob();

    // Generate nama file unik agar tidak tertimpa
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    
    // Tentukan path penyimpanan berdasarkan jenis file
    let folderPath = 'materi/';
    if (fileType.startsWith('image/')) {
      folderPath = 'gambar/';
    } else if (fileType === 'application/pdf') {
      folderPath = 'pdf/';
    } else {
      folderPath = 'dokumen/';
    }
    
    const filePath = `${folderPath}${uniqueFileName}`;

    // Upload ke Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType
      });

    if (error) throw error;

    // Dapatkan URL publik
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      downloadURL: urlData.publicUrl,
      fileId: data.id || uniqueFileName,
      filePath: filePath,
      message: 'File berhasil diupload ke Supabase Storage'
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengupload file'
    };
  }
};

// Untuk kompatibilitas dengan kode lama
export const uploadToImgBB = async (imageBase64) => {
  // Kita arahkan ke Supabase juga
  return uploadToDrive(imageBase64, 'image.jpg', 'image/jpeg');
};

export const getDrivePreviewUrl = (url) => url;
export const getDriveDownloadUrl = (url) => url;

export default {
  uploadToDrive,
  uploadToImgBB,
  getDrivePreviewUrl,
  getDriveDownloadUrl
};