// Di TeacherList.jsx, HAPUS import auth dan fungsi-fungsi Auth
// Ganti dengan yang lebih sederhana

// HAPUS import ini:
// import { auth } from '../../../firebase';
// import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

// Ganti fungsi handleAddTeacher - HANYA SIMPAN KE FIRESTORE
const handleAddTeacher = async (e) => {
  e.preventDefault();
  if (!addForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
  if (!addForm.email) return showAlert("⚠️ Email wajib diisi!", true);
  if (!addForm.password) return showAlert("⚠️ Password wajib diisi!", true);
  
  setAdding(true);
  try {
    const teacherData = {
      nama: addForm.nama,
      mapel: addForm.mapel,
      nohp: addForm.nohp,
      alamat: addForm.alamat,
      email: addForm.email,
      passwordHint: addForm.password,
      status: addForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addDoc(collection(db, "teachers"), teacherData);
    
    showAlert(`✅ Guru ${addForm.nama} berhasil ditambahkan!`);
    setShowAddModal(false);
    setAddForm({ nama: '', mapel: '', nohp: '', alamat: '', email: '', password: '', status: 'Aktif' });
    fetchTeachers();
  } catch (error) { 
    showAlert("❌ Gagal menambah: " + error.message, true); 
  }
  setAdding(false);
};

// Ganti fungsi handleSaveEdit - HANYA UPDATE FIRESTORE
const handleSaveEdit = async () => {
  if (!editForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
  setSaving(true);
  try {
    const updateData = {
      nama: editForm.nama,
      mapel: editForm.mapel,
      nohp: editForm.nohp,
      alamat: editForm.alamat,
      status: editForm.status,
      email: editForm.email,
      fotoUrl: editForm.fotoUrl,
      updatedAt: new Date().toISOString()
    };
    
    // Jika password diisi, update juga
    if (editForm.password && editForm.password.trim() !== '') {
      updateData.passwordHint = editForm.password;
    }
    
    await updateDoc(doc(db, "teachers", editModal), updateData);
    
    showAlert("✅ Data guru berhasil diperbarui!");
    setEditModal(null);
    fetchTeachers();
  } catch (error) { 
    showAlert("❌ Gagal update: " + error.message, true); 
  }
  setSaving(false);
};

// Hapus fungsi handleResetPassword (tidak perlu)