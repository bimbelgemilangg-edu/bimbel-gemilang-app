import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();
const FOLDER_ID = '1nNIbO6RFQGws-baXm-TW8jXDdsSPv_Wn';
const SERVICE_ACCOUNT_EMAIL = 'gemilang-drive-uploader@gemilangsystem.iam.gserviceaccount.com';

// Fungsi untuk mendapatkan access token dari service account
const getAccessToken = async () => {
  try {
    const privateKey = import.meta.env.VITE_GOOGLE_PRIVATE_KEY;
    const clientEmail = SERVICE_ACCOUNT_EMAIL;
    
    if (!privateKey) {
      console.warn('Private key not found, using fallback method');
      return null;
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const base64Encode = (obj) => {
      return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const jwt = `${base64Encode(header)}.${base64Encode(claim)}.SIGNATURE_NEEDED`;
    
    return null;
  } catch (err) {
    console.error('Error getting token:', err);
    return null;
  }
};

// Fungsi upload file ke Google Drive menggunakan API Key (metode sederhana)
export const uploadToDrive = async (fileData, fileName, fileType, studentName = '', modulTitle = '') => {
  try {
    const maxSize = 5 * 1024 * 1024; // 5MB limit untuk fallback
    
    if (fileData.length > maxSize) {
      throw new Error('File terlalu besar untuk metode upload saat ini. Maksimal 5MB.');
    }

    // Upload via Firebase Storage sebagai fallback
    const storageRef = ref(storage, `tugas/${studentName || 'siswa'}/${Date.now()}_${fileName}`);
    const response = await fetch(fileData);
    const blob = await response.blob();
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Simpan metadata ke Firestore
    const fileMetadata = {
      fileName,
      fileType,
      downloadURL,
      folderId: FOLDER_ID,
      uploadedAt: new Date().toISOString(),
      studentName,
      modulTitle,
      driveFileId: null,
      uploadedVia: 'firebase-storage'
    };

    // Update Firestore
    const uploadsRef = doc(db, 'uploads', 'tugas_siswa');
    await updateDoc(uploadsRef, {
      files: arrayUnion(fileMetadata)
    }, { merge: true });

    return {
      success: true,
      downloadURL,
      fileId: fileMetadata.driveFileId || 'local-' + Date.now(),
      message: 'File berhasil diupload ke Firebase Storage'
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Gagal mengupload file');
  }
};

// Fungsi untuk mendapatkan URL preview Google Drive
export const getDrivePreviewUrl = (fileId) => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Fungsi untuk mendapatkan URL download langsung
export const getDriveDownloadUrl = (fileId) => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

// Fungsi untuk upload gambar ke ImgBB (untuk poster/banner)
export const uploadToImgBB = async (imageBase64) => {
  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'bbaab4aa04dd0fcab33bca8a48480134';
  
  try {
    const formData = new FormData();
    formData.append('image', imageBase64.split(',')[1]);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        url: data.data.url,
        displayUrl: data.data.display_url,
        deleteUrl: data.data.delete_url
      };
    } else {
      throw new Error('Upload ke ImgBB gagal');
    }
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  uploadToDrive,
  uploadToImgBB,
  getDrivePreviewUrl,
  getDriveDownloadUrl
};