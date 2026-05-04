import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db, auth } from '../../../firebase';
import { 
  collection, getDocs, deleteDoc, doc, updateDoc, addDoc 
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from '../../../firebase';
import { 
  Search, Plus, Edit3, Trash2, Users, Home, ChevronRight, 
  RefreshCw, BookOpen, DollarSign, Calendar, Briefcase, GraduationCap,
  X, Save, Upload, Phone, MapPin, Camera, Mail, Lock, Eye, EyeOff,
  Key, AlertCircle, CheckCircle, Copy
} from 'lucide-react';

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ➕ State untuk lihat password
  const [showPasswordId, setShowPasswordId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ADD MODAL
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: '', mapel: '', nohp: '', alamat: '',
    email: '', password: '', status: 'Aktif'
  });
  const [adding, setAdding] = useState(false);

  // EDIT MODAL
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ 
    nama: '', mapel: '', nohp: '', alamat: '', status: 'Aktif',
    email: '', password: '', fotoUrl: '', authUid: ''
  });
  const [uploading, setUploading] = useState(false);
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
    } catch (error) { showAlert("Gagal memuat data guru", true); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, []);

  // ➕ Fungsi copy ke clipboard
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showAlert("📋 Disalin ke clipboard!");
    });
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!addForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
    if (!addForm.email) return showAlert("⚠️ Email wajib diisi!", true);
    if (!addForm.password) return showAlert("⚠️ Password wajib diisi!", true);
    
    setAdding(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, addForm.email, addForm.password);
      const authUid = userCredential.user.uid;
      
      const teacherData = {
        nama: addForm.nama,
        mapel: addForm.mapel,
        nohp: addForm.nohp,
        alamat: addForm.alamat,
        email: addForm.email,
        passwordHint: addForm.password, // ➕ Simpan password hint
        status: addForm.status,
        authUid: authUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "teachers"), teacherData);
      
      showAlert(`✅ Guru ${addForm.nama} berhasil ditambahkan!`);
      setShowAddModal(false);
      setAddForm({ nama: '', mapel: '', nohp: '', alamat: '', email: '', password: '', status: 'Aktif' });
      fetchTeachers();
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showAlert("❌ Email sudah terdaftar di sistem!", true);
      } else {
        showAlert("❌ Gagal menambah: " + error.message, true);
      }
    }
    setAdding(false);
  };

  const handleResetPassword = async (email, nama) => {
    if (!window.confirm(`Kirim email reset password untuk "${nama}"?\n\nEmail: ${email}`)) return;
    setResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(`📧 Email reset password telah dikirim ke ${email}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        showAlert("❌ Akun Auth tidak ditemukan. Mungkin email belum terdaftar di Auth.", true);
      } else {
        showAlert("❌ Gagal kirim reset password: " + error.message, true);
      }
    }
    setResettingPassword(false);
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus guru "${nama}"?`)) return;
    setDeleting(id);
    try {
      const teacher = teachers.find(t => t.id === id);
      if (teacher?.fotoUrl) {
        try { const fotoRef = ref(storage, `teachers/${id}`); await deleteObject(fotoRef); } catch (e) {}
      }
      await deleteDoc(doc(db, "teachers", id));
      showAlert(`🗑️ "${nama}" berhasil dihapus!`);
      fetchTeachers();
    } catch (error) { showAlert("❌ Gagal menghapus: " + error.message, true); }
    setDeleting(null);
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showAlert("❌ Harap upload file gambar!", true);
    if (file.size > 2 * 1024 * 1024) return showAlert("❌ Ukuran foto maksimal 2MB!", true);
    setUploading(true);
    try {
      if (editForm.fotoUrl) {
        try { const oldFotoRef = ref(storage, `teachers/${editModal}`); await deleteObject(oldFotoRef); } catch (e) {}
      }
      const fotoRef = ref(storage, `teachers/${editModal}`);
      await uploadBytes(fotoRef, file);
      const fotoUrl = await getDownloadURL(fotoRef);
      setEditForm(prev => ({ ...prev, fotoUrl }));
      showAlert("✅ Foto berhasil diupload!");
    } catch (error) { showAlert("❌ Gagal upload foto: " + error.message, true); }
    finally { setUploading(false); }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Hapus foto guru ini?")) return;
    try {
      const fotoRef = ref(storage, `teachers/${editModal}`);
      await deleteObject(fotoRef);
      setEditForm(prev => ({ ...prev, fotoUrl: '' }));
      showAlert("✅ Foto berhasil dihapus!");
    } catch (error) { showAlert("❌ Gagal hapus foto: " + error.message, true); }
  };

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
        passwordHint: editForm.password || undefined, // ➕ Update password hint
        updatedAt: new Date().toISOString()
      };
      
      // Hapus field undefined
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      await updateDoc(doc(db, "teachers", editModal), updateData);
      
      if (editForm.password && editForm.password.trim() !== '') {
        try {
          await sendPasswordResetEmail(auth, editForm.email);
          showAlert(`📧 Email reset password telah dikirim ke ${editForm.email}`);
        } catch (e) {
          showAlert("⚠️ Data tersimpan, tapi gagal kirim reset password: " + e.message, true);
        }
      }
      
      showAlert("✅ Data guru berhasil diperbarui!");
      setEditModal(null);
      fetchTeachers();
    } catch (error) { showAlert("❌ Gagal update: " + error.message, true); }
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
        
        {alertMsg && (
          <div style={{...styles.toast, background: alertMsg.isError ? '#ef4444' : '#1e293b'}}>
            {alertMsg.text}
          </div>
        )}

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
            <button onClick={() => setShowAddModal(true)} style={styles.btnAdd(isMobile)}>
              <Plus size={14} /> Tambah Guru
            </button>
          </div>
        </div>

        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><Users size={22} /> Daftar Guru</h2>
            <p style={styles.subtitle}>{teachers.length} guru terdaftar • {mapelList.length} mapel</p>
          </div>
        </div>

        <div style={styles.statsRow(isMobile)}>
          <div style={styles.statMini}><Users size={16} color="#3b82f6" /><div><h3>{teachers.length}</h3><span>Total</span></div></div>
          <div style={styles.statMini}><BookOpen size={16} color="#8b5cf6" /><div><h3>{mapelList.length}</h3><span>Mapel</span></div></div>
          <div style={styles.statMini}><Briefcase size={16} color="#10b981" /><div><h3>{teachers.filter(t => t.status === 'Aktif').length}</h3><span>Aktif</span></div></div>
        </div>

        <div style={styles.filterBar(isMobile)}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input placeholder="Cari nama, mapel, atau email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>}
          </div>
          <button onClick={fetchTeachers} style={styles.btnRefresh(isMobile)}><RefreshCw size={14} /> {!isMobile && 'Refresh'}</button>
        </div>

        <div style={styles.card}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <GraduationCap size={48} color="#94a3b8" />
              <p style={{fontWeight: 'bold', marginTop: 10}}>{searchTerm ? 'Tidak ada guru yang cocok.' : 'Belum ada guru terdaftar.'}</p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thr}>
                    <th style={styles.th}>Foto</th>
                    <th style={styles.th}>Nama</th>
                    <th style={styles.th}>Mapel</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Password</th>
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
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mapelBadge}>{t.mapel || 'Umum'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{fontSize: 11, color: '#475569', display:'flex',alignItems:'center',gap:4}}>
                          {t.email || '-'}
                          {t.email && (
                            <button 
                              onClick={() => copyToClipboard(t.email, `email-${t.id}`)}
                              style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0}}
                              title="Copy email"
                            >
                              <Copy size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {showPasswordId === t.id ? (
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <span style={{fontSize:11,fontWeight:600,color:'#ef4444'}}>
                              {t.passwordHint || t.password || 'Tidak ada'}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(t.passwordHint || t.password || '', `pw-${t.id}`)}
                              style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0}}
                            >
                              <Copy size={10} />
                            </button>
                            <button 
                              onClick={() => setShowPasswordId(null)}
                              style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:0}}
                            >
                              <EyeOff size={10} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowPasswordId(t.id)}
                            style={{background:'#f1f5f9',border:'1px solid #e2e8f0',padding:'4px 8px',borderRadius:6,cursor:'pointer',fontSize:10,color:'#64748b',display:'flex',alignItems:'center',gap:4}}
                          >
                            <Eye size={10} /> Lihat
                          </button>
                        )}
                        {copiedId === `pw-${t.id}` && (
                          <span style={{fontSize:8,color:'#10b981',marginLeft:4}}>Disalin!</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(t.status)}>{t.status || 'Aktif'}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button onClick={() => handleOpenEdit(t)} style={{...styles.btnAction, background: '#fef3c7', color: '#b45309'}}><Edit3 size={14} /></button>
                          {t.email && (
                            <button onClick={() => handleResetPassword(t.email, t.nama)} disabled={resettingPassword} style={{...styles.btnAction, background: '#e0e7ff', color: '#3730a3'}}><Key size={14} /></button>
                          )}
                          <button onClick={() => navigate('/admin/teachers/salaries', { state: { teacher: t } })} style={{...styles.btnAction, background: '#f0fdf4', color: '#166534'}}><DollarSign size={14} /></button>
                          <button onClick={() => handleDelete(t.id, t.nama)} disabled={deleting === t.id} style={{...styles.btnAction, background: '#fee2e2', color: '#ef4444', opacity: deleting === t.id ? 0.5 : 1}}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL TAMBAH */}
        {showAddModal && (
          <div style={styles.overlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>➕ Tambah Guru Baru</h3>
                <button onClick={() => setShowAddModal(false)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTeacher} style={styles.modalBody}>
                <div style={styles.formGroup}><label style={styles.formLabel}>Nama Lengkap *</label><input type="text" value={addForm.nama} onChange={e => setAddForm({...addForm, nama: e.target.value})} style={styles.formInput} placeholder="Nama guru" required /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Mata Pelajaran</label><input type="text" value={addForm.mapel} onChange={e => setAddForm({...addForm, mapel: e.target.value})} style={styles.formInput} placeholder="Contoh: Matematika" /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Email (Login) *</label><div style={styles.inputWithIcon}><Mail size={16} color="#94a3b8" /><input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} style={styles.formInput} placeholder="guru@email.com" required /></div><p style={styles.hintText}>Email akan digunakan untuk login. Pastikan email valid.</p></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Password *</label><div style={styles.inputWithIcon}><Lock size={16} color="#94a3b8" /><input type="text" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} style={styles.formInput} placeholder="Minimal 6 karakter" required /></div><p style={styles.hintText}>Password disimpan dan bisa dilihat admin.</p></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Nomor HP</label><input type="text" value={addForm.nohp} onChange={e => setAddForm({...addForm, nohp: e.target.value})} style={styles.formInput} placeholder="08xxx" /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Alamat</label><input type="text" value={addForm.alamat} onChange={e => setAddForm({...addForm, alamat: e.target.value})} style={styles.formInput} placeholder="Alamat lengkap" /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Status</label><select value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})} style={styles.formSelect}><option value="Aktif">✅ Aktif</option><option value="Cuti">🔕 Cuti</option><option value="Nonaktif">❌ Nonaktif</option></select></div>
                <div style={styles.modalFooter}><button type="button" onClick={() => setShowAddModal(false)} style={styles.btnCancel}>Batal</button><button type="submit" disabled={adding} style={styles.btnSave}><Save size={16} /> {adding ? 'Menyimpan...' : 'Simpan & Buat Akun'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT */}
        {editModal && (
          <div style={styles.overlay} onClick={() => setEditModal(null)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}><h3 style={{margin:0}}>✏️ Edit Data Guru</h3><button onClick={() => setEditModal(null)} style={styles.btnClose}><X size={20} /></button></div>
              <div style={styles.modalBody}>
                <div style={styles.photoSection}><label style={styles.formLabel}>Foto Profil</label><div style={styles.photoContainer}>{editForm.fotoUrl ? <img src={editForm.fotoUrl} alt="Foto" style={styles.photoPreview} /> : <div style={styles.photoPlaceholder}><Camera size={32} color="#94a3b8" /></div>}<div style={styles.photoButtons}><label style={styles.btnPhotoUpload}><Upload size={14} /> {uploading ? '...' : 'Upload'}<input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploading} style={{display:'none'}} /></label>{editForm.fotoUrl && <button onClick={handleRemovePhoto} style={styles.btnPhotoRemove}><Trash2 size={14} /> Hapus</button>}</div></div></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Nama Lengkap *</label><input type="text" value={editForm.nama} onChange={e => setEditForm({...editForm, nama: e.target.value})} style={styles.formInput} /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Mata Pelajaran</label><input type="text" value={editForm.mapel} onChange={e => setEditForm({...editForm, mapel: e.target.value})} style={styles.formInput} /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={styles.formInput} /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Password Baru (Opsional)</label><input type="text" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} style={styles.formInput} placeholder="Isi untuk reset password" /><p style={styles.hintText}>Password baru akan disimpan & email reset dikirim.</p></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Nomor HP</label><input type="text" value={editForm.nohp} onChange={e => setEditForm({...editForm, nohp: e.target.value})} style={styles.formInput} /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Alamat</label><input type="text" value={editForm.alamat} onChange={e => setEditForm({...editForm, alamat: e.target.value})} style={styles.formInput} /></div>
                <div style={styles.formGroup}><label style={styles.formLabel}>Status</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={styles.formSelect}><option value="Aktif">✅ Aktif</option><option value="Cuti">🔕 Cuti</option><option value="Nonaktif">❌ Nonaktif</option></select></div>
                <div style={styles.modalFooter}><button onClick={() => setEditModal(null)} style={styles.btnCancel}>Batal</button><button onClick={handleSaveEdit} disabled={saving || uploading} style={styles.btnSave}><Save size={16} /> {saving ? '...' : 'Simpan'}</button></div>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 750 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '10px 12px', fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '10px 12px', fontSize: 12, verticalAlign: 'middle' },
  avatarImg: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: '50%', background: '#673ab7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 },
  mapelBadge: { padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 'bold', background: '#e0e7ff', color: '#3730a3' },
  statusBadge: (s) => ({ padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 'bold', background: s === 'Aktif' ? '#dcfce7' : s === 'Cuti' ? '#fef3c7' : '#fee2e2', color: s === 'Aktif' ? '#166534' : s === 'Cuti' ? '#b45309' : '#ef4444' }),
  actionGroup: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  btnAction: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
  hintText: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  formSelect: { padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, background: 'white' },
  modalFooter: { display: 'flex', gap: 10, marginTop: 12 },
  btnCancel: { flex: 1, padding: 10, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#64748b' },
  btnSave: { flex: 2, padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

export default TeacherList;