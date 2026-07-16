// src/services/uploadService.js
import { createClient } from '@supabase/supabase-js';

// ✅ URL subdomain proyek asli Bimbel Gemilang
const supabaseUrl = 'https://hqoasblnrsijbflupoir.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsPJgcnaLOCPV9-DpSyMuA_EQkbrEKt';

// Inisialisasi Client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Nama Bucket Storage di Supabase
const BUCKET_NAME = 'materi-bimbel';

// ============================================================
// 🔥 SANITASI NAMA FILE - PERBAIKAN UTAMA
// ============================================================
const sanitizeFileName = (fileName) => {
  if (!fileName) return 'file';
  
  // Ambil nama file tanpa ekstensi
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  
  // 🔥 HAPUS SEMUA KARAKTER BERBAHAYA
  let sanitized = name
    // Ganti karakter aneh dengan underscore
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    // Ganti spasi dengan underscore
    .replace(/\s+/g, '_')
    // Hapus apostrof, petik, kurung
    .replace(/['"()]/g, '')
    // Hapus karakter ganda
    .replace(/_+/g, '_')
    // Hapus underscore di awal/akhir
    .replace(/^_|_$/g, '');
  
  // Jika hasil kosong, pakai default
  if (!sanitized) sanitized = 'file';
  
  // Batasi panjang nama
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized + ext;
};

/**
 * Mengompres gambar sebelum diunggah
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
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal kompresi gambar.'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// ============================================================
// 🔥 UPLOAD FILE KE SUPABASE - DENGAN SANITASI
// ============================================================
export const uploadElearningFile = async (file, customPath = 'materi') => {
  try {
    if (!file) throw new Error('Tidak ada file yang dipilih.');

    let dataToUpload = file;
    let finalFileType = file.type;
    let finalFileName = file.name;

    // Kompres gambar jika perlu
    if (file.type.startsWith('image/')) {
      console.log(`📦 Mengompres gambar: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      try {
        dataToUpload = await compressImage(file, 1024, 0.7);
        finalFileType = 'image/jpeg';
        finalFileName = finalFileName.replace(/\.[^/.]+$/, '') + '.jpg';
        console.log(`✅ Gambar berhasil dikompres`);
      } catch (compressError) {
        console.warn('⚠️ Gagal kompres, pakai file asli:', compressError);
        dataToUpload = file;
      }
    }

    // 🔥 SANITASI NAMA FILE (PERBAIKAN UTAMA)
    const sanitizedFileName = sanitizeFileName(finalFileName);
    
    // 🔥 CEK UKURAN FILE
    const maxSize = 50 * 1024 * 1024;
    const currentSize = dataToUpload.size || dataToUpload.length || 0;
    if (currentSize > maxSize) {
      throw new Error(`File terlalu besar (${(currentSize/1024/1024).toFixed(2)}MB). Maks 50MB.`);
    }

    // 🔥 TENTUKAN FOLDER
    const timestamp = Date.now();
    let folderPath = `${customPath}/`;
    
    // Tentukan sub-folder berdasarkan tipe file
    if (customPath === 'materi') {
      if (finalFileType.startsWith('image/')) {
        folderPath = 'gambar/';
      } else if (finalFileType === 'application/pdf') {
        folderPath = 'pdf/';
      } else if (finalFileType.includes('word') || finalFileType.includes('document')) {
        folderPath = 'dokumen/';
      } else {
        folderPath = 'dokumen/';
      }
    }

    // 🔥 BUILD FILE PATH YANG AMAN
    const filePath = `${folderPath}${timestamp}_${sanitizedFileName}`;

    console.log('📤 Uploading:', {
      original: file.name,
      sanitized: sanitizedFileName,
      path: filePath,
      size: (currentSize / 1024).toFixed(1) + ' KB'
    });

    // 🔥 UPLOAD KE SUPABASE
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, dataToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: finalFileType
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return { 
        success: false, 
        error: error.message || 'Gagal upload ke Supabase' 
      };
    }

    // 🔥 AMBIL URL PUBLIK
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Upload success:', filePath);

    return {
      success: true,
      downloadURL: urlData.publicUrl,
      fileId: data?.id || timestamp.toString(),
      filePath: filePath,
      fileName: sanitizedFileName,
      originalName: file.name,
      fileSize: currentSize,
      message: 'File berhasil diunggah ke Supabase Storage.'
    };

  } catch (error) {
    console.error('❌ Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengunggah file.'
    };
  }
};

// ============================================================
// 🔥 DELETE FILE DARI SUPABASE
// ============================================================
export const deleteFile = async (filePath) => {
  try {
    if (!filePath) {
      return { success: false, error: 'Path file kosong' };
    }

    console.log('🗑️ Deleting file:', filePath);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ Delete error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ File deleted:', filePath);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Delete Error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// 🔥 CEK FILE EXIST
// ============================================================
export const fileExists = async (filePath) => {
  try {
    if (!filePath) return false;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { 
        limit: 1, 
        search: filePath 
      });

    if (error) throw error;
    return data && data.length > 0;

  } catch (error) {
    console.error('❌ Check file error:', error);
    return false;
  }
};

// ============================================================
// 🔥 GET STORAGE USAGE
// ============================================================
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
          // Ini adalah folder
          const subPath = path ? `${path}/${item.name}` : item.name;
          total += await getAllFiles(subPath);
        } else {
          // Ini adalah file
          total += item.metadata?.size || 0;
        }
      }
      return total;
    };

    const totalBytes = await getAllFiles();
    const LIMIT_FREE_TIER = 1 * 1024 * 1024 * 1024; // 1GB
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
    console.error('❌ Storage Usage Error:', error);
    return {
      success: false,
      error: error.message,
      usedMB: 0,
      remainingMB: 1024,
      percentageUsed: 0,
      textString: 'Gagal memuat informasi penyimpanan'
    };
  }
};

// ============================================================
// 🔥 COMPATIBILITY FUNCTIONS
// ============================================================
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

// ============================================================
// 🔥 EXPORT DEFAULT
// ============================================================
export default {
  uploadElearningFile,
  deleteFile,
  fileExists,
  getStorageUsage,
  uploadToDrive,
  uploadToImgBB,
  getDrivePreviewUrl,
  getDriveDownloadUrl
};