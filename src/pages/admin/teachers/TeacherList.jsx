import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db, auth } from '../../../firebase';
import { 
  collection, getDocs, deleteDoc, doc, updateDoc, addDoc, setDoc 
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, updatePassword, 
  sendPasswordResetEmail, deleteUser, fetchSignInMethodsForEmail,
  getAuth
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from '../../../firebase';
import { 
  Search, Plus, Edit3, Trash2, Users, Home, ChevronRight, 
  RefreshCw, BookOpen, DollarSign, Calendar, Briefcase, GraduationCap,
  X, Save, Upload, Phone, MapPin, Camera, Mail, Lock, Eye, EyeOff,
  Key, AlertCircle, CheckCircle
} from 'lucide-react';

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ADD MODAL
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: '',
    mapel: '',
    nohp: '',
    alamat: '',
    email: '',
    password: '',
    status: 'Aktif'
  });
  const [adding, setAdding] = useState(false);

  // EDIT MODAL
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ 
    nama: '', 
    mapel: '', 
    nohp: '', 
    alamat: '', 
    status: 'Aktif',
    email: '',
    password: '',
    fotoUrl: '',
    authUid: ''
  });
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, isError = false) => {
    setAlertMsg({ text: msg, isError });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teachers"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setTeachers(data);
    } catch (error) { 
      console.error("Fetch error:", error); 
      showAlert("Gagal memuat data guru", true);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchTeachers(); }, []);

  // 🔥 FUNGSI MEMBUAT AKUN AUTH OTOMATIS
  const createAuthAccount = async (email, password, nama) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`✅ Akun Auth dibuat untuk ${nama} (${email})`);
      return { success: true, uid: userCredential.user.uid };
    } catch (error) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        // Cari user UID yang sudah ada
        return { success: true, uid: null, message: "Email sudah terdaftar" };
      }
      return { success: false, error: error.message };
    }
  };

  // 🔥 FUNGSI UPDATE PASSWORD DI AUTH
  const updateAuthPassword = async (uid, newPassword) => {
    // Untuk update password, kita perlu user saat ini login
    // Solusi: Kirim email reset password
    try {
      await sendPasswordResetEmail(auth, editForm.email);
      return { success: true, message: "Email reset password telah dikirim" };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error.message };
    }
  };

  // 🔥 FUNGSI HAPUS AKUN AUTH
  const deleteAuthAccount = async (email) => {
    // Hapus user dari Auth perlu akses admin
    // Untuk keamanan, di Firebase Console saja atau via Cloud Function
    console.log(`User ${email} perlu dihapus manual dari Firebase Console jika perlu`);
    return { success: true, message: "Akun Auth tidak otomatis dihapus demi keamanan" };
  };

  // 🔥 TAMBAH GURU
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!addForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
    if (!addForm.email) return showAlert("⚠️ Email wajib diisi!", true);
    if (!addForm.password) return showAlert("⚠️ Password wajib diisi!", true);
    
    setAdding(true);
    try {
      // 1. Buat akun di Firebase Auth
      const authResult = await createAuthAccount(addForm.email, addForm.password, addForm.nama);
      
      if (!authResult.success) {
        throw new Error(authResult.error);
      }
      
      // 2. Simpan ke Firestore
      const teacherData = {
        nama: addForm.nama,
        mapel: addForm.mapel,
        nohp: addForm.nohp,
        alamat: addForm.alamat,
        email: addForm.email,
        status: addForm.status,
        authUid: authResult.uid,
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

  // 🔥 HAPUS GURU
  const handleDelete = async (id, nama, email) => {
    if (!window.confirm(`Yakin ingin menghapus guru "${nama}"?\n\nSemua data guru ini akan hilang permanen.`)) return;
    setDeleting(id);
    try {
      // Hapus foto dari storage
      const teacher = teachers.find(t => t.id === id);
      if (teacher?.fotoUrl) {
        try {
          const fotoRef = ref(storage, `teachers/${id}`);
          await deleteObject(fotoRef);
        } catch (e) { console.warn("Foto tidak ditemukan"); }
      }
      
      // Hapus dari Firestore
      await deleteDoc(doc(db, "teachers", id));
      
      // Hapus dari Auth (opsional, bisa manual)
      await deleteAuthAccount(email);
      
      showAlert(`🗑️ "${nama}" berhasil dihapus!`);
      fetchTeachers();
    } catch (error) { 
      showAlert("❌ Gagal menghapus: " + error.message, true); 
    }
    setDeleting(null);
  };

  // 🔥 RESET PASSWORD
  const handleResetPassword = async (email, nama) => {
    if (!window.confirm(`Kirim email reset password untuk "${nama}"?`)) return;
    setResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(`📧 Email reset password telah dikirim ke ${email}`);
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.code === 'auth/user-not-found') {
        showAlert("❌ Akun Auth tidak ditemukan. Buat ulang guru.", true);
      } else {
        showAlert("❌ Gagal kirim reset password: " + error.message, true);
      }
    }
    setResettingPassword(false);
  };

  // 🔥 UPLOAD FOTO
  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showAlert("❌ Harap upload file gambar!", true);
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      showAlert("❌ Ukuran foto maksimal 2MB!", true);
      return;
    }

    setUploading(true);
    try {
      if (editForm.fotoUrl) {
        try {
          const oldFotoRef = ref(storage, `teachers/${editModal}`);
          await deleteObject(oldFotoRef);
        } catch (e) {}
      }

      const fotoRef = ref(storage, `teachers/${editModal}`);
      await uploadBytes(fotoRef, file);
      const fotoUrl = await getDownloadURL(fotoRef);
      
      setEditForm(prev => ({ ...prev, fotoUrl }));
      showAlert("✅ Foto berhasil diupload!");
    } catch (error) {
      showAlert("❌ Gagal upload foto: " + error.message, true);
    } finally {
      setUploading(false);
    }
  };

  // 🔥 HAPUS FOTO
  const handleRemovePhoto = async () => {
    if (!window.confirm("Hapus foto guru ini?")) return;
    try {
      const fotoRef = ref(storage, `teachers/${editModal}`);
      await deleteObject(fotoRef);
      setEditForm(prev => ({ ...prev, fotoUrl: '' }));
      showAlert("✅ Foto berhasil dihapus!");
    } catch (error) {
      showAlert("❌ Gagal hapus foto: " + error.message, true);
    }
  };

  // 🔥 BUKA MODAL EDIT
  const handleOpenEdit = (teacher) => {
    setEditModal(teacher.id);
    setEditForm({
      nama: teacher.nama || '',
      mapel: teacher.mapel || '',
      nohp: teacher.nohp || '',
      alamat: teacher.alamat || '',
      status: teacher.status || 'Aktif',
      email: teacher.email || '',
      password: '',
      fotoUrl: teacher.fotoUrl || '',
      authUid: teacher.authUid || ''
    });
  };

  // 🔥 SIMPAN EDIT
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
      
      await updateDoc(doc(db, "teachers", editModal), updateData);
      
      // Jika password diisi, kirim email reset password
      if (editForm.password && editForm.password.trim() !== '') {
        await sendPasswordResetEmail(auth, editForm.email);
        showAlert(`📧 Email reset password telah dikirim ke ${editForm.email}`);
      }
      
      showAlert("✅ Data guru berhasil diperbarui!");
      setEditModal(null);
      fetchTeachers();
    } catch (error) { 
      showAlert("❌ Gagal update: " + error.message, true); 
    }
    setSaving(false);
  };

  const filtered = teachers.filter(t => 
    (t.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.mapel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mapelList = [...new Set(teachers.map(t => t.mapel).filter(Boolean))];

  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data guru...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && (
          <div style={{...styles.toast, background: alertMsg.isError ? '#ef4444' : '#1e293b'}}>
            {alertMsg.text}
          </div>
        )}

        {/* BREADCRUMB */}
        <div style={styles.breadcrumb(isMobile)}>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Kelola Guru</span>
          </div>
          <div style={styles.breadcrumbActions(isMobile)}>
            <button onClick={() => navigate('/admin/teachers/salaries')} style={styles.btnSalary(isMobile)}>
              <DollarSign size={14} /> Gaji
            </button>
            <button onClick={() => navigate('/admin/teachers/schedule')} style={styles.btnSchedule(isMobile)}>
              <Calendar size={14} /> Jadwal
            </button>
            <button onClick={() => setShowAddModal(true)} style={styles.btnAdd(isMobile)}>
              <Plus size={14} /> Tambah Guru
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><Users size={22} /> Daftar Guru</h2>
            <p style={styles.subtitle}>{teachers.length} guru terdaftar • {mapelList.length} mata pelajaran</p>
          </div>
        </div>

        {/* STATS */}
        <div style={styles.statsRow(isMobile)}>
          <div style={styles.statMini}>
            <Users size={16} color="#3b82f6" />
            <div><h3>{teachers.length}</h3><span>Total Guru</span></div>
          </div>
          <div style={styles.statMini}>
            <BookOpen size={16} color="#8b5cf6" />
            <div><h3>{mapelList.length}</h3><span>Mapel</span></div>
          </div>
          <div style={styles.statMini}>
            <Briefcase size={16} color="#10b981" />
            <div><h3>{teachers.filter(t => t.status === 'Aktif').length}</h3><span>Aktif</span></div>
          </div>
        </div>

        {/* FILTER */}
        <div style={styles.filterBar(isMobile)}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama, mapel, atau email..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>
            )}
          </div>
          <button onClick={fetchTeachers} style={styles.btnRefresh(isMobile)}>
            <RefreshCw size={14} /> {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* TABEL */}
        <div style={styles.card}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <GraduationCap size={48} color="#94a3b8" />
              <p style={{fontWeight: 'bold', marginTop: 10}}>
                {searchTerm ? 'Tidak ada guru yang cocok.' : 'Belum ada guru terdaftar.'}
              </p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thr}>
                    <th style={styles.th}>Foto</th>
                    <th style={styles.th}>Nama</th>
                    <th style={styles.th}>Mapel</th>
                    {!isMobile && <th style={styles.th}>Email</th>}
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>
                        {t.fotoUrl ? (
                          <img src={t.fotoUrl} alt={t.nama} style={styles.avatarImg} />
                        ) : (
                          <div style={styles.avatarPlaceholder}>{t.nama?.charAt(0) || 'G'}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{fontWeight: 'bold', fontSize: 14}}>{t.nama}</div>
                        {isMobile && <div style={{fontSize: 11, color: '#94a3b8'}}>{t.email || '-'}</div>}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mapelBadge}>{t.mapel || 'Umum'}</span>
                      </td>
                      {!isMobile && (
                        <td style={styles.td}>
                          <div style={{fontSize: 12}}>{t.email || '-'}</div>
                          {t.authUid ? (
                            <span style={{fontSize: 9, color: '#10b981'}}>✓ Terautentikasi</span>
                          ) : (
                            <span style={{fontSize: 9, color: '#f59e0b'}}>⚠️ Belum ada akun Auth</span>
                          )}
                        </td>
                      )}
                      <td style={styles.td}>
                        <span style={styles.statusBadge(t.status)}>{t.status || 'Aktif'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button onClick={() => handleOpenEdit(t)} style={{...styles.btnAction, background: '#fef3c7', color: '#b45309'}} title="Edit">
                            <Edit3 size={14} />
                          </button>
                          {t.email && (
                            <button onClick={() => handleResetPassword(t.email, t.nama)} disabled={resettingPassword} style={{...styles.btnAction, background: '#e0e7ff', color: '#3730a3'}} title="Reset Password">
                              <Key size={14} />
                            </button>
                          )}
                          <button onClick={() => navigate('/admin/teachers/salaries', { state: { teacher: t } })} style={{...styles.btnAction, background: '#f0fdf4', color: '#166534'}} title="Gaji">
                            <DollarSign size={14} />
                          </button>
                          <button onClick={() => handleDelete(t.id, t.nama, t.email)} disabled={deleting === t.id} style={{...styles.btnAction, background: '#fee2e2', color: '#ef4444', opacity: deleting === t.id ? 0.5 : 1}} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🔥 MODAL TAMBAH GURU */}
        {showAddModal && (
          <div style={styles.overlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>➕ Tambah Guru Baru</h3>
                <button onClick={() => setShowAddModal(false)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTeacher} style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nama Lengkap *</label>
                  <input type="text" value={addForm.nama} onChange={e => setAddForm({...addForm, nama: e.target.value})} style={styles.formInput} placeholder="Nama guru" required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mata Pelajaran</label>
                  <input type="text" value={addForm.mapel} onChange={e => setAddForm({...addForm, mapel: e.target.value})} style={styles.formInput} placeholder="Contoh: Matematika" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email (Login) *</label>
                  <div style={styles.inputWithIcon}>
                    <Mail size={16} color="#94a3b8" />
                    <input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} style={styles.formInput} placeholder="guru@example.com" required />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password *</label>
                  <div style={styles.inputWithIcon}>
                    <Lock size={16} color="#94a3b8" />
                    <input type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} style={styles.formInput} placeholder="Minimal 6 karakter" required />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nomor HP</label>
                  <input type="text" value={addForm.nohp} onChange={e => setAddForm({...addForm, nohp: e.target.value})} style={styles.formInput} placeholder="08xxx" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Alamat</label>
                  <input type="text" value={addForm.alamat} onChange={e => setAddForm({...addForm, alamat: e.target.value})} style={styles.formInput} placeholder="Alamat lengkap" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})} style={styles.formSelect}>
                    <option value="Aktif">✅ Aktif</option>
                    <option value="Cuti">🔕 Cuti</option>
                    <option value="Nonaktif">❌ Nonaktif</option>
                  </select>
                </div>
                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" disabled={adding} style={styles.btnSave}>
                    <Save size={16} /> {adding ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔥 MODAL EDIT GURU */}
        {editModal && (
          <div style={styles.overlay} onClick={() => setEditModal(null)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>✏️ Edit Data Guru</h3>
                <button onClick={() => setEditModal(null)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <div style={styles.modalBody}>
                {/* FOTO */}
                <div style={styles.photoSection}>
                  <label style={styles.formLabel}>Foto Profil</label>
                  <div style={styles.photoContainer}>
                    {editForm.fotoUrl ? (
                      <img src={editForm.fotoUrl} alt="Foto" style={styles.photoPreview} />
                    ) : (
                      <div style={styles.photoPlaceholder}><Camera size={32} color="#94a3b8" /></div>
                    )}
                    <div style={styles.photoButtons}>
                      <label style={styles.btnPhotoUpload}>
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
                        <input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploading} style={{display: 'none'}} />
                      </label>
                      {editForm.fotoUrl && (
                        <button onClick={handleRemovePhoto} style={styles.btnPhotoRemove}><Trash2 size={14} /> Hapus</button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nama Lengkap *</label>
                  <input type="text" value={editForm.nama} onChange={e => setEditForm({...editForm, nama: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mata Pelajaran</label>
                  <input type="text" value={editForm.mapel} onChange={e => setEditForm({...editForm, mapel: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <div style={styles.inputWithIcon}>
                    <Mail size={16} color="#94a3b8" />
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={styles.formInput} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password Baru (Opsional)</label>
                  <div style={styles.inputWithIcon}>
                    <Lock size={16} color="#94a3b8" />
                    <input type={showPassword ? "text" : "password"} value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} style={styles.formInput} placeholder="Kosongkan jika tidak diubah" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={styles.hintText}>Isi password baru lalu klik Simpan. Email reset akan dikirim.</p>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nomor HP</label>
                  <input type="text" value={editForm.nohp} onChange={e => setEditForm({...editForm, nohp: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Alamat</label>
                  <input type="text" value={editForm.alamat} onChange={e => setEditForm({...editForm, alamat: e.target.value})} style={styles.formInput} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={styles.formSelect}>
                    <option value="Aktif">✅ Aktif</option>
                    <option value="Cuti">🔕 Cuti</option>
                    <option value="Nonaktif">❌ Nonaktif</option>
                  </select>
                </div>
                <div style={styles.modalFooter}>
                  <button onClick={() => setEditModal(null)} style={styles.btnCancel}>Batal</button>
                  <button onClick={handleSaveEdit} disabled={saving || uploading} style={styles.btnSave}>
                    <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: 'white' },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { width: 40, height: 40, border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' },
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0 }),
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  breadcrumbActions: (m) => ({ display: 'flex', gap: 8, flexWrap: 'wrap' }),
  btnSalary: (m) => ({ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 }),
  btnSchedule: (m) => ({ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 }),
  btnAdd: (m) => ({ background: '#3b82f6', color: 'white', border: 'none', padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 }),
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 10 : 0 }),
  pageTitle: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, display: 'flex', alignItems: 'center', gap: 8 }),
  subtitle: { color: '#64748b', marginTop: 4, fontSize: 13 },
  statsRow: (m) => ({ display: 'flex', gap: m ? 8 : 15, marginBottom: 20 }),
  statMini: { flex: 1, background: 'white', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  filterBar: (m) => ({ display: 'flex', gap: 10, marginBottom: 20, flexDirection: m ? 'column' : 'row' }),
  searchBox: { flex: 2, display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '10px 15px', borderRadius: 10, border: '1px solid #e2e8f0' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 14, background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 },
  btnRefresh: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748b' }),
  card: { background: 'white', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' },
  emptyState: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 650 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px 15px', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '12px 15px', fontSize: 13, verticalAlign: 'middle' },
  avatarImg: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: '50%', background: '#673ab7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 },
  mapelBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold', background: '#e0e7ff', color: '#3730a3' },
  statusBadge: (s) => ({ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold', background: s === 'Aktif' ? '#dcfce7' : s === 'Cuti' ? '#fef3c7' : '#fee2e2', color: s === 'Aktif' ? '#166534' : s === 'Cuti' ? '#b45309' : '#ef4444' }),
  actionGroup: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  btnAction: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '7px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(2px)' },
  modal: (m) => ({ background: 'white', padding: m ? 20 : 30, borderRadius: 20, width: m ? '95%' : '550px', maxHeight: '90vh', overflowY: 'auto' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 15 },
  btnClose: { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#e74c3c' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 15 },
  photoSection: { textAlign: 'center', marginBottom: 10 },
  photoContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  photoPreview: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #3b82f6' },
  photoPlaceholder: { width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  photoButtons: { display: 'flex', gap: 8 },
  btnPhotoUpload: { background: '#3b82f6', color: 'white', padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  btnPhotoRemove: { background: '#ef4444', color: 'white', padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  inputWithIcon: { display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' },
  formInput: { border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14, padding: 0 },
  eyeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  hintText: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  formSelect: { padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, background: 'white' },
  modalFooter: { display: 'flex', gap: 10, marginTop: 10 },
  btnCancel: { flex: 1, padding: 12, background: '#f1f5f9', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#64748b' },
  btnSave: { flex: 2, padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

export default TeacherList;