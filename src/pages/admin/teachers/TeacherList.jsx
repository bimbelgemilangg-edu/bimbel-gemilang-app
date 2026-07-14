// src/pages/admin/teachers/TeacherList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db, auth } from '../../../firebase';
import { 
  collection, getDocs, deleteDoc, doc, updateDoc, addDoc, 
  query, where, orderBy, limit, startAfter, runTransaction
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
  Key, AlertCircle, CheckCircle, Copy, Hash, Tag, Link as LinkIcon,
  UserPlus, Shield, BadgeCheck, Sparkles, Database, Layers
} from 'lucide-react';

const TeacherList = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // State untuk lihat password
  const [showPasswordId, setShowPasswordId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ADD MODAL
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: '', 
    mapel: '', 
    kodeMapel: '',
    nohp: '', 
    alamat: '',
    email: '', 
    password: '', 
    status: 'Aktif'
  });
  const [adding, setAdding] = useState(false);

  // ADD MAPEL MODAL
  const [showMapelModal, setShowMapelModal] = useState(false);
  const [mapelForm, setMapelForm] = useState({
    namaMapel: '',
    deskripsi: '',
    kodeMapel: ''
  });
  const [addingMapel, setAddingMapel] = useState(false);

  // EDIT MODAL
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ 
    nama: '', 
    mapel: '', 
    kodeMapel: '',
    nohp: '', 
    alamat: '', 
    status: 'Aktif',
    email: '', 
    password: '', 
    fotoUrl: '', 
    authUid: '',
    guruId: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // ===== EFFECTS =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  // ===== FUNGSI AMBIL DATA =====
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTeachers(),
        fetchMapel()
      ]);
    } catch (error) {
      showAlert("❌ Gagal memuat data", true);
    }
    setLoading(false);
  };

  const fetchTeachers = async () => {
    try {
      const snap = await getDocs(collection(db, "teachers"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchMapel = async () => {
    try {
      const snap = await getDocs(collection(db, "mapel"));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.namaMapel || '').localeCompare(b.namaMapel || ''));
      setMapelList(data);
    } catch (error) {
      console.error("Error fetching mapel:", error);
    }
  };

  // ===== GENERATE KODE UNIK (FIXED: ANTI DUPLIKAT) =====
  const generateGuruId = async () => {
    try {
      // Ambil semua teacher dan cari ID terakhir
      const snap = await getDocs(collection(db, "teachers"));
      let maxNumber = 0;
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data.guruId) {
          // Ekstrak angka dari GURU-XXX
          const num = parseInt(data.guruId.replace('GURU-', ''));
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      // ID baru = max + 1
      const newNumber = maxNumber + 1;
      const newGuruId = `GURU-${String(newNumber).padStart(3, '0')}`;
      
      // VALIDASI: Cek apakah ID sudah digunakan (antisipasi duplikat)
      const idQuery = query(
        collection(db, "teachers"), 
        where("guruId", "==", newGuruId)
      );
      const idSnap = await getDocs(idQuery);
      
      if (!idSnap.empty) {
        // Jika ID sudah ada, generate ulang dengan timestamp
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `GURU-${timestamp}${random}`;
      }
      
      return newGuruId;
    } catch (error) {
      // Fallback: pakai timestamp + random
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `GURU-${timestamp}${random}`;
    }
  };

  const generateMapelId = async () => {
    try {
      const snap = await getDocs(collection(db, "mapel"));
      let maxNumber = 0;
      
      snap.forEach(doc => {
        const data = doc.data();
        if (data.kodeMapel) {
          const num = parseInt(data.kodeMapel.replace('MAPEL-', ''));
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      const newNumber = maxNumber + 1;
      const newMapelId = `MAPEL-${String(newNumber).padStart(3, '0')}`;
      
      // Validasi duplikat
      const idQuery = query(
        collection(db, "mapel"), 
        where("kodeMapel", "==", newMapelId)
      );
      const idSnap = await getDocs(idQuery);
      
      if (!idSnap.empty) {
        const timestamp = Date.now().toString().slice(-6);
        return `MAPEL-${timestamp}`;
      }
      
      return newMapelId;
    } catch (error) {
      const timestamp = Date.now().toString().slice(-6);
      return `MAPEL-${timestamp}`;
    }
  };

  // ===== TOAST =====
  const showAlert = (msg, isError = false) => {
    setAlertMsg({ text: msg, isError });
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // ===== COPY KE CLIPBOARD =====
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showAlert("📋 Disalin ke clipboard!");
    });
  };

  // ===== TAMBAH MAPEL BARU =====
  const handleAddMapel = async (e) => {
    e.preventDefault();
    if (!mapelForm.namaMapel) return showAlert("⚠️ Nama mapel wajib diisi!", true);
    
    setAddingMapel(true);
    try {
      const kodeMapel = await generateMapelId();
      
      // Cek duplikat nama mapel
      const nameQuery = query(
        collection(db, "mapel"), 
        where("namaMapel", "==", mapelForm.namaMapel)
      );
      const nameSnap = await getDocs(nameQuery);
      if (!nameSnap.empty) {
        return showAlert(`❌ Mapel "${mapelForm.namaMapel}" sudah ada!`, true);
      }
      
      await addDoc(collection(db, "mapel"), {
        ...mapelForm,
        kodeMapel: kodeMapel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      showAlert(`✅ Mapel "${mapelForm.namaMapel}" berhasil ditambahkan! (${kodeMapel})`);
      setShowMapelModal(false);
      setMapelForm({ namaMapel: '', deskripsi: '', kodeMapel: '' });
      fetchMapel();
    } catch (error) {
      showAlert("❌ Gagal menambah mapel: " + error.message, true);
    }
    setAddingMapel(false);
  };

  // ===== TAMBAH GURU BARU (FIXED: ANTI DUPLIKAT) =====
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!addForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
    if (!addForm.email) return showAlert("⚠️ Email wajib diisi!", true);
    if (!addForm.password) return showAlert("⚠️ Password wajib diisi!", true);
    if (!addForm.mapel) return showAlert("⚠️ Pilih mata pelajaran!", true);
    
    setAdding(true);
    try {
      // 1. CEK DUPLIKAT EMAIL DI FIRESTORE
      const emailQuery = query(
        collection(db, "teachers"), 
        where("email", "==", addForm.email)
      );
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        setAdding(false);
        return showAlert("❌ Email sudah terdaftar untuk guru lain!", true);
      }
      
      // 2. Buat akun Auth
      const userCredential = await createUserWithEmailAndPassword(auth, addForm.email, addForm.password);
      const authUid = userCredential.user.uid;
      
      // 3. Generate kode unik guru (AMAN)
      const guruId = await generateGuruId();
      
      // 4. Dapatkan kode mapel dari mapel yang dipilih
      const selectedMapel = mapelList.find(m => m.id === addForm.mapel);
      const kodeMapel = selectedMapel?.kodeMapel || 'MAPEL-000';
      
      // 5. Simpan ke Firestore
      const teacherData = {
        guruId: guruId,
        nama: addForm.nama,
        mapel: selectedMapel?.namaMapel || addForm.mapel,
        kodeMapel: kodeMapel,
        mapelId: addForm.mapel,
        nohp: addForm.nohp,
        alamat: addForm.alamat,
        email: addForm.email,
        passwordHint: addForm.password,
        status: addForm.status,
        authUid: authUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "teachers"), teacherData);
      
      showAlert(`✅ Guru ${addForm.nama} berhasil ditambahkan! (${guruId})`);
      setShowAddModal(false);
      setAddForm({ nama: '', mapel: '', kodeMapel: '', nohp: '', alamat: '', email: '', password: '', status: 'Aktif' });
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

  // ===== RESET PASSWORD =====
  const handleResetPassword = async (email, nama) => {
    if (!window.confirm(`Kirim email reset password untuk "${nama}"?\n\nEmail: ${email}`)) return;
    setResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(`📧 Email reset password telah dikirim ke ${email}`);
    } catch (error) {
      showAlert("❌ Gagal kirim reset password: " + error.message, true);
    }
    setResettingPassword(false);
  };

  // ===== HAPUS GURU =====
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

  // ===== UPLOAD FOTO =====
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

  // ===== BUKA EDIT =====
  const handleOpenEdit = (teacher) => {
    setEditModal(teacher.id);
    setEditForm({
      nama: teacher.nama || '',
      mapel: teacher.mapel || '',
      kodeMapel: teacher.kodeMapel || '',
      nohp: teacher.nohp || '',
      alamat: teacher.alamat || '',
      status: teacher.status || 'Aktif',
      email: teacher.email || '',
      password: '',
      fotoUrl: teacher.fotoUrl || '',
      authUid: teacher.authUid || '',
      guruId: teacher.guruId || ''
    });
  };

  // ===== SIMPAN EDIT =====
  const handleSaveEdit = async () => {
    if (!editForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
    setSaving(true);
    try {
      const updateData = {
        nama: editForm.nama,
        mapel: editForm.mapel,
        kodeMapel: editForm.kodeMapel,
        nohp: editForm.nohp,
        alamat: editForm.alamat,
        status: editForm.status,
        email: editForm.email,
        fotoUrl: editForm.fotoUrl,
        guruId: editForm.guruId,
        updatedAt: new Date().toISOString()
      };
      
      if (editForm.password && editForm.password.trim() !== '') {
        updateData.passwordHint = editForm.password;
      }
      
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

  // ===== FILTER DATA =====
  const filtered = teachers.filter(t => 
    (t.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.mapel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.guruId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.kodeMapel || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== SKELETON LOADING =====
  if (loading) return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Memuat data guru & mapel...</p>
        </div>
      </div>
    </div>
  );

  // ===== RENDER =====
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
            <button onClick={() => navigate('/admin/schedule')} style={styles.btnSchedule(isMobile)}>
              <Calendar size={14} /> Jadwal
            </button>
            <button onClick={() => navigate('/admin/teachers/salaries')} style={styles.btnSalary(isMobile)}>
              <DollarSign size={14} /> Gaji
            </button>
            <button onClick={() => setShowMapelModal(true)} style={styles.btnMapel(isMobile)}>
              <Layers size={14} /> Mapel
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
            <p style={styles.subtitle}>
              {teachers.length} guru terdaftar • {mapelList.length} mapel • 
              <span style={{color: '#10b981', fontWeight: 600}}> {teachers.filter(t => t.status === 'Aktif').length} aktif</span>
            </p>
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
          <div style={styles.statMini}>
            <BadgeCheck size={16} color="#f59e0b" />
            <div><h3>{teachers.filter(t => t.guruId).length}</h3><span>Memiliki ID</span></div>
          </div>
        </div>

        {/* FILTER */}
        <div style={styles.filterBar(isMobile)}>
          <div style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari nama, mapel, email, atau kode..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>}
          </div>
          <button onClick={fetchAllData} style={styles.btnRefresh(isMobile)}>
            <RefreshCw size={14} /> {!isMobile && 'Refresh'}
          </button>
        </div>

        {/* TABLE */}
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
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Foto</th>
                    <th style={styles.th}>Nama / ID</th>
                    <th style={styles.th}>Mapel / Kode</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Password</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, idx) => (
                    <tr key={t.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.indexBadge}>{idx + 1}</span>
                      </td>
                      <td style={styles.td}>
                        {t.fotoUrl ? (
                          <img src={t.fotoUrl} alt={t.nama} style={styles.avatarImg} />
                        ) : (
                          <div style={styles.avatarPlaceholder}>{t.nama?.charAt(0) || 'G'}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={{fontWeight: 'bold', fontSize: 14}}>{t.nama}</div>
                          <div style={styles.idBadge}>
                            <Hash size={10} /> {t.guruId || 'Belum ada ID'}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.mapelCell}>
                          <span style={styles.mapelBadge}>{t.mapel || 'Umum'}</span>
                          {t.kodeMapel && (
                            <span style={styles.kodeBadge}>
                              <Tag size={10} /> {t.kodeMapel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{fontSize: 11, color: '#475569', display:'flex', alignItems:'center', gap:4}}>
                          {t.email || '-'}
                          {t.email && (
                            <button 
                              onClick={() => copyToClipboard(t.email, `email-${t.id}`)}
                              style={styles.copyBtn}
                              title="Copy email"
                            >
                              <Copy size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {showPasswordId === t.id ? (
                          <div style={styles.passwordVisible}>
                            <span style={{fontSize: 11, fontWeight: 600, color: '#ef4444'}}>
                              {t.passwordHint || t.password || 'Tidak ada'}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(t.passwordHint || t.password || '', `pw-${t.id}`)}
                              style={styles.copyBtn}
                            >
                              <Copy size={10} />
                            </button>
                            <button 
                              onClick={() => setShowPasswordId(null)}
                              style={styles.copyBtn}
                            >
                              <EyeOff size={10} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowPasswordId(t.id)}
                            style={styles.btnShowPassword}
                          >
                            <Eye size={10} /> Lihat
                          </button>
                        )}
                        {copiedId === `pw-${t.id}` && (
                          <span style={styles.copiedBadge}>Disalin!</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(t.status)}>
                          {t.status || 'Aktif'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          <button onClick={() => handleOpenEdit(t)} style={{...styles.btnAction, background: '#fef3c7', color: '#b45309'}}>
                            <Edit3 size={14} />
                          </button>
                          {t.email && (
                            <button 
                              onClick={() => handleResetPassword(t.email, t.nama)} 
                              disabled={resettingPassword} 
                              style={{...styles.btnAction, background: '#e0e7ff', color: '#3730a3'}}
                            >
                              <Key size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => navigate('/admin/teachers/salaries', { state: { teacher: t } })} 
                            style={{...styles.btnAction, background: '#f0fdf4', color: '#166534'}}
                          >
                            <DollarSign size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(t.id, t.nama)} 
                            disabled={deleting === t.id} 
                            style={{...styles.btnAction, background: '#fee2e2', color: '#ef4444', opacity: deleting === t.id ? 0.5 : 1}}
                          >
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

        {/* ============================================ */}
        {/* MODAL TAMBAH MAPEL */}
        {/* ============================================ */}
        {showMapelModal && (
          <div style={styles.overlay} onClick={() => setShowMapelModal(false)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}><Layers size={18} /> Tambah Mapel Baru</h3>
                <button onClick={() => setShowMapelModal(false)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddMapel} style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nama Mapel *</label>
                  <input 
                    type="text" 
                    value={mapelForm.namaMapel} 
                    onChange={e => setMapelForm({...mapelForm, namaMapel: e.target.value})} 
                    style={styles.formInput} 
                    placeholder="Contoh: Matematika, IPA, Bahasa Inggris"
                    required 
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Deskripsi (Opsional)</label>
                  <input 
                    type="text" 
                    value={mapelForm.deskripsi} 
                    onChange={e => setMapelForm({...mapelForm, deskripsi: e.target.value})} 
                    style={styles.formInput} 
                    placeholder="Deskripsi singkat mapel"
                  />
                </div>
                <div style={styles.infoBox}>
                  <Sparkles size={14} color="#3b82f6" />
                  <span style={{fontSize: 12, color: '#64748b'}}>
                    Kode unik akan dibuat otomatis oleh sistem (MAPEL-XXX)
                  </span>
                </div>
                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setShowMapelModal(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" disabled={addingMapel} style={styles.btnSave}>
                    <Save size={16} /> {addingMapel ? 'Menyimpan...' : 'Simpan Mapel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL TAMBAH GURU */}
        {/* ============================================ */}
        {showAddModal && (
          <div style={styles.overlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}><UserPlus size={18} /> Tambah Guru Baru</h3>
                <button onClick={() => setShowAddModal(false)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddTeacher} style={styles.modalBody}>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nama Lengkap *</label>
                  <input 
                    type="text" 
                    value={addForm.nama} 
                    onChange={e => setAddForm({...addForm, nama: e.target.value})} 
                    style={styles.formInput} 
                    placeholder="Nama lengkap guru"
                    required 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mata Pelajaran *</label>
                  <div style={styles.selectWithButton}>
                    <select 
                      value={addForm.mapel} 
                      onChange={e => {
                        const selected = mapelList.find(m => m.id === e.target.value);
                        setAddForm({
                          ...addForm, 
                          mapel: e.target.value,
                          kodeMapel: selected?.kodeMapel || ''
                        });
                      }} 
                      style={{...styles.formSelect, flex: 1}}
                      required
                    >
                      <option value="">Pilih Mapel</option>
                      {mapelList.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.namaMapel} ({m.kodeMapel})
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      onClick={() => setShowMapelModal(true)}
                      style={styles.btnAddMapel}
                      title="Tambah mapel baru"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {addForm.kodeMapel && (
                    <div style={styles.infoBox}>
                      <Tag size={14} color="#3b82f6" />
                      <span style={{fontSize: 11, color: '#475569'}}>Kode Mapel: <strong>{addForm.kodeMapel}</strong></span>
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email (Login) *</label>
                  <div style={styles.inputWithIcon}>
                    <Mail size={16} color="#94a3b8" />
                    <input 
                      type="email" 
                      value={addForm.email} 
                      onChange={e => setAddForm({...addForm, email: e.target.value})} 
                      style={styles.formInput} 
                      placeholder="guru@email.com" 
                      required 
                    />
                  </div>
                  <p style={styles.hintText}>Email akan digunakan untuk login. Pastikan email valid dan unik.</p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password *</label>
                  <div style={styles.inputWithIcon}>
                    <Lock size={16} color="#94a3b8" />
                    <input 
                      type="text" 
                      value={addForm.password} 
                      onChange={e => setAddForm({...addForm, password: e.target.value})} 
                      style={styles.formInput} 
                      placeholder="Minimal 6 karakter" 
                      required 
                    />
                  </div>
                  <p style={styles.hintText}>Password disimpan dan bisa dilihat admin.</p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nomor HP</label>
                  <div style={styles.inputWithIcon}>
                    <Phone size={16} color="#94a3b8" />
                    <input 
                      type="text" 
                      value={addForm.nohp} 
                      onChange={e => setAddForm({...addForm, nohp: e.target.value})} 
                      style={styles.formInput} 
                      placeholder="08xxx" 
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Alamat</label>
                  <div style={styles.inputWithIcon}>
                    <MapPin size={16} color="#94a3b8" />
                    <input 
                      type="text" 
                      value={addForm.alamat} 
                      onChange={e => setAddForm({...addForm, alamat: e.target.value})} 
                      style={styles.formInput} 
                      placeholder="Alamat lengkap" 
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select 
                    value={addForm.status} 
                    onChange={e => setAddForm({...addForm, status: e.target.value})} 
                    style={styles.formSelect}
                  >
                    <option value="Aktif">✅ Aktif</option>
                    <option value="Cuti">🔕 Cuti</option>
                    <option value="Nonaktif">❌ Nonaktif</option>
                  </select>
                </div>

                <div style={styles.infoBox}>
                  <Shield size={14} color="#10b981" />
                  <span style={{fontSize: 12, color: '#166534'}}>
                    Guru akan mendapatkan kode unik otomatis: <strong>GURU-XXX</strong> (dijamin unik)
                  </span>
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" disabled={adding} style={styles.btnSave}>
                    <Save size={16} /> {adding ? 'Menyimpan...' : 'Simpan & Buat Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL EDIT GURU */}
        {/* ============================================ */}
        {editModal && (
          <div style={styles.overlay} onClick={() => setEditModal(null)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}><Edit3 size={18} /> Edit Data Guru</h3>
                <button onClick={() => setEditModal(null)} style={styles.btnClose}><X size={20} /></button>
              </div>
              <div style={styles.modalBody}>
                
                {/* Foto */}
                <div style={styles.photoSection}>
                  <label style={styles.formLabel}>Foto Profil</label>
                  <div style={styles.photoContainer}>
                    {editForm.fotoUrl ? 
                      <img src={editForm.fotoUrl} alt="Foto" style={styles.photoPreview} /> :
                      <div style={styles.photoPlaceholder}><Camera size={32} color="#94a3b8" /></div>
                    }
                    <div style={styles.photoButtons}>
                      <label style={styles.btnPhotoUpload}>
                        <Upload size={14} /> {uploading ? '...' : 'Upload'}
                        <input type="file" accept="image/*" onChange={handleUploadPhoto} disabled={uploading} style={{display:'none'}} />
                      </label>
                      {editForm.fotoUrl && (
                        <button onClick={handleRemovePhoto} style={styles.btnPhotoRemove}>
                          <Trash2 size={14} /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Guru (Readonly) */}
                <div style={{...styles.formGroup, background: '#f8fafc', padding: 10, borderRadius: 8}}>
                  <label style={styles.formLabel}>ID Guru (Unik)</label>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <Hash size={14} color="#3b82f6" />
                    <span style={{fontWeight: 'bold', fontSize: 14, color: '#1e293b'}}>
                      {editForm.guruId || 'Belum ada ID'}
                    </span>
                    {editForm.guruId && (
                      <button 
                        onClick={() => copyToClipboard(editForm.guruId, `guru-${editModal}`)}
                        style={styles.copyBtn}
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nama Lengkap *</label>
                  <input 
                    type="text" 
                    value={editForm.nama} 
                    onChange={e => setEditForm({...editForm, nama: e.target.value})} 
                    style={styles.formInput} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mata Pelajaran</label>
                  <div style={styles.selectWithButton}>
                    <select 
                      value={editForm.mapel} 
                      onChange={e => {
                        const selected = mapelList.find(m => m.namaMapel === e.target.value);
                        setEditForm({
                          ...editForm, 
                          mapel: e.target.value,
                          kodeMapel: selected?.kodeMapel || ''
                        });
                      }} 
                      style={{...styles.formSelect, flex: 1}}
                    >
                      <option value="">Pilih Mapel</option>
                      {mapelList.map(m => (
                        <option key={m.id} value={m.namaMapel}>
                          {m.namaMapel} ({m.kodeMapel})
                        </option>
                      ))}
                    </select>
                  </div>
                  {editForm.kodeMapel && (
                    <div style={styles.infoBox}>
                      <Tag size={14} color="#3b82f6" />
                      <span style={{fontSize: 11, color: '#475569'}}>Kode Mapel: <strong>{editForm.kodeMapel}</strong></span>
                    </div>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                    style={styles.formInput} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password Baru (Opsional)</label>
                  <input 
                    type="text" 
                    value={editForm.password} 
                    onChange={e => setEditForm({...editForm, password: e.target.value})} 
                    style={styles.formInput} 
                    placeholder="Isi untuk reset password" 
                  />
                  <p style={styles.hintText}>Password baru akan disimpan & email reset dikirim.</p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Nomor HP</label>
                  <input 
                    type="text" 
                    value={editForm.nohp} 
                    onChange={e => setEditForm({...editForm, nohp: e.target.value})} 
                    style={styles.formInput} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Alamat</label>
                  <input 
                    type="text" 
                    value={editForm.alamat} 
                    onChange={e => setEditForm({...editForm, alamat: e.target.value})} 
                    style={styles.formInput} 
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select 
                    value={editForm.status} 
                    onChange={e => setEditForm({...editForm, status: e.target.value})} 
                    style={styles.formSelect}
                  >
                    <option value="Aktif">✅ Aktif</option>
                    <option value="Cuti">🔕 Cuti</option>
                    <option value="Nonaktif">❌ Nonaktif</option>
                  </select>
                </div>

                <div style={styles.modalFooter}>
                  <button onClick={() => setEditModal(null)} style={styles.btnCancel}>Batal</button>
                  <button onClick={handleSaveEdit} disabled={saving || uploading} style={styles.btnSave}>
                    <Save size={16} /> {saving ? '...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ============================================
// STYLES
// ============================================
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box', 
    transition: '0.3s' 
  }),
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    padding: '12px 20px', borderRadius: 12, 
    fontWeight: 'bold', fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    color: 'white' 
  },
  loadingState: { textAlign: 'center', padding: 80 },
  spinner: { 
    width: 40, height: 40, 
    border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', 
    borderRadius: '50%', animation: 'spin 1s linear infinite', 
    margin: '0 auto 15px' 
  },
  
  // Breadcrumb
  breadcrumb: (m) => ({ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0 
  }),
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  breadcrumbActions: (m) => ({ display: 'flex', gap: 8, flexWrap: 'wrap' }),
  
  // Buttons
  btnSchedule: (m) => ({ 
    background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', 
    padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 
  }),
  btnSalary: (m) => ({ 
    background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', 
    padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 
  }),
  btnMapel: (m) => ({ 
    background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', 
    padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 
  }),
  btnAdd: (m) => ({ 
    background: '#3b82f6', color: 'white', border: 'none', 
    padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, fontSize: m ? 11 : 12, display: 'flex', alignItems: 'center', gap: 4 
  }),
  btnAddMapel: {
    padding: '8px 12px', background: '#10b981', color: 'white', 
    border: 'none', borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  selectWithButton: {
    display: 'flex', gap: 8, alignItems: 'center'
  },
  
  // Header
  header: (m) => ({ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 10 : 0 
  }),
  pageTitle: (m) => ({ 
    margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, 
    display: 'flex', alignItems: 'center', gap: 8 
  }),
  subtitle: { color: '#64748b', marginTop: 4, fontSize: 13 },
  
  // Stats
  statsRow: (m) => ({ display: 'flex', gap: m ? 8 : 15, marginBottom: 20, flexWrap: 'wrap' }),
  statMini: { 
    flex: 1, minWidth: 80, background: 'white', padding: 12, borderRadius: 12, 
    display: 'flex', alignItems: 'center', gap: 10, 
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' 
  },
  
  // Filter
  filterBar: (m) => ({ display: 'flex', gap: 10, marginBottom: 20, flexDirection: m ? 'column' : 'row' }),
  searchBox: { 
    flex: 2, display: 'flex', alignItems: 'center', gap: 8, 
    background: 'white', padding: '10px 15px', borderRadius: 10, 
    border: '1px solid #e2e8f0' 
  },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 14, background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 },
  btnRefresh: (m) => ({ 
    background: 'white', border: '1px solid #e2e8f0', padding: '10px 15px', 
    borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, 
    fontSize: 13, color: '#64748b' 
  }),
  
  // Table
  card: { 
    background: 'white', borderRadius: 14, 
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', 
    overflow: 'hidden' 
  },
  emptyState: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 900 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { 
    padding: '10px 12px', fontSize: 10, color: '#64748b', 
    fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' 
  },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '10px 12px', fontSize: 12, verticalAlign: 'middle' },
  
  // Cells
  indexBadge: { 
    display: 'inline-block', width: 24, height: 24, 
    background: '#f1f5f9', borderRadius: '50%', 
    textAlign: 'center', lineHeight: '24px', fontSize: 11, 
    fontWeight: 600, color: '#64748b' 
  },
  avatarImg: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { 
    width: 36, height: 36, borderRadius: '50%', background: '#673ab7', 
    color: 'white', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', fontWeight: 'bold', fontSize: 14 
  },
  nameCell: { display: 'flex', flexDirection: 'column', gap: 2 },
  idBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: 3, 
    fontSize: 9, color: '#3b82f6', background: '#eef2ff', 
    padding: '1px 6px', borderRadius: 10, fontWeight: 600,
    width: 'fit-content'
  },
  mapelCell: { display: 'flex', flexDirection: 'column', gap: 3 },
  mapelBadge: { 
    padding: '3px 8px', borderRadius: 10, fontSize: 11, 
    fontWeight: 'bold', background: '#e0e7ff', color: '#3730a3',
    width: 'fit-content'
  },
  kodeBadge: { 
    display: 'inline-flex', alignItems: 'center', gap: 3, 
    fontSize: 9, color: '#8b5cf6', background: '#ede9fe', 
    padding: '1px 6px', borderRadius: 10, fontWeight: 600,
    width: 'fit-content'
  },
  statusBadge: (s) => ({ 
    padding: '3px 8px', borderRadius: 10, fontSize: 10, 
    fontWeight: 'bold', 
    background: s === 'Aktif' ? '#dcfce7' : s === 'Cuti' ? '#fef3c7' : '#fee2e2', 
    color: s === 'Aktif' ? '#166534' : s === 'Cuti' ? '#b45309' : '#ef4444' 
  }),
  actionGroup: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  btnAction: { 
    background: '#f1f5f9', color: '#475569', border: 'none', 
    padding: '6px', borderRadius: 8, cursor: 'pointer', 
    display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },
  btnShowPassword: {
    background: '#f1f5f9', border: '1px solid #e2e8f0',
    padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
    fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4
  },
  passwordVisible: {
    display: 'flex', alignItems: 'center', gap: 4
  },
  copyBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center'
  },
  copiedBadge: {
    fontSize: 8, color: '#10b981', marginLeft: 4
  },
  
  // Modal
  overlay: { 
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
    background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', 
    alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(2px)' 
  },
  modal: (m) => ({ 
    background: 'white', padding: m ? 20 : 30, borderRadius: 20, 
    width: m ? '95%' : '550px', maxHeight: '90vh', overflowY: 'auto' 
  }),
  modalHeader: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 15 
  },
  btnClose: { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#e74c3c' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 15 },
  
  // Form
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  inputWithIcon: { 
    display: 'flex', alignItems: 'center', gap: 8, 
    background: '#f8fafc', padding: '10px 12px', borderRadius: 10, 
    border: '1px solid #e2e8f0' 
  },
  formInput: { 
    border: 'none', outline: 'none', background: 'transparent', 
    width: '100%', fontSize: 14, padding: 0 
  },
  formSelect: { 
    padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0', 
    fontSize: 14, background: 'white', width: '100%'
  },
  hintText: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  infoBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 8,
    background: '#f8fafc', border: '1px solid #e2e8f0'
  },
  modalFooter: { 
    display: 'flex', gap: 10, marginTop: 12 
  },
  btnCancel: { 
    flex: 1, padding: 10, background: '#f1f5f9', 
    border: 'none', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, color: '#64748b' 
  },
  btnSave: { 
    flex: 2, padding: 10, background: '#3b82f6', color: 'white', 
    border: 'none', borderRadius: 8, cursor: 'pointer', 
    fontWeight: 600, display: 'flex', alignItems: 'center', 
    justifyContent: 'center', gap: 6 
  },
  
  // Photo
  photoSection: { textAlign: 'center', marginBottom: 10 },
  photoContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  photoPreview: { 
    width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', 
    border: '3px solid #3b82f6' 
  },
  photoPlaceholder: { 
    width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', 
    display: 'flex', alignItems: 'center', justifyContent: 'center' 
  },
  photoButtons: { display: 'flex', gap: 8 },
  btnPhotoUpload: { 
    background: '#3b82f6', color: 'white', padding: '5px 12px', 
    borderRadius: 6, fontSize: 11, cursor: 'pointer', 
    display: 'flex', alignItems: 'center', gap: 4 
  },
  btnPhotoRemove: { 
    background: '#ef4444', color: 'white', padding: '5px 12px', 
    borderRadius: 6, fontSize: 11, cursor: 'pointer', 
    display: 'flex', alignItems: 'center', gap: 4 
  },
};

export default TeacherList;