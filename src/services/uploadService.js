// Upload service menggunakan ImgBB API (GRATIS - NO CREDIT CARD)
const IMGBB_API_KEY = 'bbaab4aa04dd0fcab33bca8a48480134';

// Fungsi upload file ke ImgBB (mendukung gambar, PDF, DOCX, dll)
export const uploadToDrive = async (fileData, fileName, fileType, studentName = '', modulTitle = '') => {
  try {
    // ImgBB mendukung berbagai format file
    const maxSize = 32 * 1024 * 1024; // 32MB limit ImgBB gratis
    
    if (fileData.length > maxSize) {
      throw new Error('File terlalu besar. Maksimal 32MB.');
    }

    // Extract base64 data
    const base64Data = fileData.split(',')[1];
    
    // Upload ke ImgBB
    const formData = new FormData();
    formData.append('image', base64Data);
    formData.append('name', `${studentName}_${fileName}`);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        downloadURL: data.data.url,
        displayUrl: data.data.display_url,
        fileId: data.data.id,
        message: 'File berhasil diupload ke ImgBB'
      };
    } else {
      throw new Error(data.error?.message || 'Upload gagal');
    }

  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Gagal mengupload file');
  }
};

// Fungsi untuk mendapatkan URL preview (ImgBB menyediakan direct link)
export const getDrivePreviewUrl = (url) => {
  return url;
};

// Fungsi untuk mendapatkan URL download langsung
export const getDriveDownloadUrl = (url) => {
  return url;
};

// Fungsi untuk upload gambar ke ImgBB (sama dengan uploadToDrive)
export const uploadToImgBB = async (imageBase64) => {
  try {
    const base64Data = imageBase64.split(',')[1];
    const formData = new FormData();
    formData.append('image', base64Data);
    
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