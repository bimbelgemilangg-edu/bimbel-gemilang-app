import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const supabaseUrl = 'https://hqoasblnrsijbflupoir.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'materi-bimbel';

/**
 * Kompres gambar sebelum upload
 * @param {string} base64 - Base64 string gambar
 * @param {number} maxWidth - Lebar maksimal (default 1024px)
 * @param {number} quality - Kualitas JPEG (0 - 1), default 0.7
 * @returns {Promise<string>} - Base64 hasil kompresi
 */
const compressImage = (base64, maxWidth = 1024, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Hitung dimensi baru dengan proporsi yang sama
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Konversi ke JPEG dengan kualitas tertentu
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = reject;
  });
};

/**
 * Upload file ke Supabase Storage.
 * @param {string} fileData - Base64 string dari file.
 * @param {string} fileName - Nama file.
 * @param {string} fileType - MIME type file.
 * @returns {Promise<object>} - Hasil upload.
 */
export const uploadToDrive = async (fileData, fileName, fileType) => {
  try {
    let dataToUpload = fileData;
    let finalFileType = fileType;
    let finalFileName = fileName;
    
    // 🔥 KOMPRESI GAMBAR jika file adalah gambar
    if (fileType.startsWith('image/')) {
      console.log(`📦 Mengompres gambar: ukuran awal ~${(fileData.length / 1024 / 1024).toFixed(2)}MB`);
      dataToUpload = await compressImage(fileData, 1024, 0.7);
      finalFileType = 'image/jpeg';
      // Ubah ekstensi file menjadi .jpg
      finalFileName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
      console.log(`✅ Hasil kompresi: ~${(dataToUpload.length / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Validasi ukuran file (maksimal 50MB untuk Supabase Free Tier)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (dataToUpload.length > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 50MB.');
    }

    // Konversi Base64 ke Blob
    const response = await fetch(dataToUpload);
    const blob = await response.blob();

    // Generate nama file unik agar tidak tertimpa
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${finalFileName}`;
    
    // Tentukan path penyimpanan berdasarkan jenis file
    let folderPath = 'materi/';
    if (finalFileType.startsWith('image/')) {
      folderPath = 'gambar/';
    } else if (finalFileType === 'application/pdf') {
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
        contentType: finalFileType
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