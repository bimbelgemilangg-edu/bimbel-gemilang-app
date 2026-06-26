// src/services/uploadService.js
import { createClient } from '@supabase/supabase-js';

// ✅ PERBAIKAN: Menggunakan URL subdomain proyek asli milik Bimbel Gemilang
const supabaseUrl = 'https://hqoasblnrsijbflupoir.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt';

// Inisialisasi Client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Nama Bucket Storage di Supabase
const BUCKET_NAME = 'materi-bimbel';

/**
 * Mengompres gambar sebelum diunggah ke storage untuk menghemat kuota gratisan
 */
const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal melakukan kompresi gambar.'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Mengunggah file E-Learning langsung dari input HTML
 */
export const uploadElearningFile = async (file, customPath = 'materi') => {
  try {
    if (!file) throw new Error('Tidak ada file yang dipilih.');

    let dataToUpload = file;
    let finalFileType = file.type;
    let finalFileName = file.name.replace(/\s+/g, '_'); 

    if (file.type.startsWith('image/')) {
      console.log(`📦 Mengompres gambar: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      try {
        dataToUpload = await compressImage(file, 1024, 0.7);
        finalFileType = 'image/jpeg';
        finalFileName = finalFileName.replace(/\.[^/.]+$/, '') + '.jpg';
        console.log(`✅ Gambar berhasil dikompres menjadi format JPEG`);
      } catch (compressError) {
        console.warn('Gagal mengompres gambar, menggunakan file asli:', compressError);
        dataToUpload = file; 
      }
    }

    const maxSize = 50 * 1024 * 1024; 
    const currentSize = dataToUpload.size || dataToUpload.length;
    if (currentSize > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal batas unggah adalah 50MB.');
    }

    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${finalFileName}`;

    let folderPath = `${customPath}/`;
    if (customPath === 'materi') {
      if (finalFileType.startsWith('image/')) {
        folderPath = 'gambar/';
      } else if (finalFileType === 'application/pdf') {
        folderPath = 'pdf/';
      } else {
        folderPath = 'dokumen/';
      }
    }

    const filePath = `${folderPath}${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, dataToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: finalFileType
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      downloadURL: urlData.publicUrl,
      fileId: data.id || uniqueFileName,
      filePath: filePath,
      fileName: file.name,
      message: 'File berhasil diunggah ke Supabase Storage.'
    };

  } catch (error) {
    console.error('Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengunggah file ke server.'
    };
  }
};

/**
 * ✅ TAMBAHAN: Fungsi deleteFile agar fitur hapus materi/file sampah tidak memicu error build
 */
export const deleteFile = async (filePath) => {
  try {
    if (!filePath) return { success: false, error: 'Path kosong' };
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Gagal menghapus file di Supabase:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Menghitung total kapasitas terpakai
 */
export const getStorageUsage = async () => {
  try {
    const getAllFiles = async (path = '') => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(path, { limit: 1000 });

      if (error) throw error;

      let total = 0;
      for (const item of data) {
        if (item.id === null) {
          const subPath = path ? `${path}/${item.name}` : item.name;
          total += await getAllFiles(subPath);
        } else {
          total += item.metadata?.size || 0;
        }
      }
      return total;
    };

    const totalBytes = await getAllFiles();
    const LIMIT_FREE_TIER = 1 * 1024 * 1024 * 1024;
    const remainingBytes = LIMIT_FREE_TIER - totalBytes;

    const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const remainingMB = (remainingBytes / (1024 * 1024)).toFixed(2);
    const percentageUsed = ((totalBytes / LIMIT_FREE_TIER) * 100).toFixed(1);

    return {
      success: true,
      usedMB: parseFloat(usedMB),
      remainingMB: parseFloat(remainingMB),
      percentageUsed: parseFloat(percentageUsed),
      textString: `${usedMB} MB terpakai dari 1024 MB (${percentageUsed}% digunakan)`
    };

  } catch (error) {
    console.error('Storage Usage Error:', error);
    return {
      success: false,
      error: error.message,
      usedMB: 0,
      remainingMB: 1024,
      percentageUsed: 0,
      textString: 'Gagal memuat informasi sisa penyimpanan'
    };
  }
};

export const uploadToDrive = async (base64Data, fileName, fileType) => {
  try {
    const response = await fetch(base64Data);
    const blob = await response.blob();
    const mockFile = new File([blob], fileName, { type: fileType });
    return await uploadElearningFile(mockFile, 'materi');
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const uploadToImgBB = async (imageBase64) => {
  return uploadToDrive(imageBase64, 'image.jpg', 'image/jpeg');
};

export const getDrivePreviewUrl = (url) => url;
export const getDriveDownloadUrl = (url) => url;

export default {
  uploadElearningFile,
  deleteFile,
  getStorageUsage,
  uploadToDrive,
  uploadToImgBB,
  getDrivePreviewUrl,
  getDriveDownloadUrl
};