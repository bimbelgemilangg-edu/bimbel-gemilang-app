// src/pages/admin/teachers/TeacherList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db, auth } from '../../../firebase';
import { 
  collection, getDocs, deleteDoc, doc, updateDoc, addDoc, 
  query, where, orderBy, limit, startAfter, runTransaction,
  setDoc, getDoc, serverTimestamp
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

// ============================================================
// 🔥 BARU: SATU GURU BISA NGAMPU LEBIH DARI 1 MATA PELAJARAN
// ============================================================
// Sebelumnya skema data guru cuma punya field TUNGGAL (mapel, mapelId,
// kodeMapel) -- artinya 1 guru = 1 mapel. Kalau kenyataannya guru itu
// ngajar 2-3 mapel, admin dulu terpaksa: (a) cuma pilih satu mapel dan
// mapel lainnya "hilang" dari data guru, atau (b) bikin akun guru
// duplikat buat tiap mapel -- dua-duanya bikin berantakan: siswa lihat
// badge mapel yang salah/kurang di halaman E-Learning "Per Guru", dan
// admin harus kelola beberapa akun buat 1 orang yang sama.
//
// Sekarang guru bisa pilih SEKALIGUS beberapa mapel lewat komponen
// MapelMultiSelect di bawah. Field baru yang jadi SUMBER UTAMA data:
//   - mapelIds: array id dokumen mapel, mis. ["mapelDocId1","mapelDocId2"]
//   - mapelDetails: array {id, namaMapel, kodeMapel} -- disimpan langsung
//     (didenormalisasi) di dokumen guru supaya halaman lain yang nampilin
//     daftar guru TIDAK perlu query tambahan per guru buat tau mapelnya.
// Field LAMA (mapel, kodeMapel, mapelId -- semuanya tunggal) TETAP diisi
// otomatis sebagai GABUNGAN semua mapel yang diampu (dipisah koma untuk
// mapel/kodeMapel, dan mapelId = mapel pertama). Ini supaya bagian lain
// sistem yang MASIH baca field tunggal itu (mis. halaman pembuatan modul
// materi yang belum di-update) tidak langsung error/rusak -- tinggal
// nanti dipindah bertahap ke mapelIds/mapelDetails.
const getTeacherMapelList = (t) => {
  if (t?.mapelDetails && t.mapelDetails.length > 0) return t.mapelDetails;
  // Fallback data lama: guru yang dibuat sebelum fitur ini ada cuma punya
  // field tunggal.
  if (t?.mapel) return [{ id: t.mapelId || '', namaMapel: t.mapel, kodeMapel: t.kodeMapel || '' }];
  return [];
};

const MapelMultiSelect = ({ mapelList, selectedIds, onChange }) => {
  const [open, setOpen] = useState(false);
  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };
  const selectedMapels = mapelList.filter(m => selectedIds.includes(m.id));

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          minHeight: 42, padding: '8px 12px', borderRadius: 10, border: '1px solid #e2e8f0',
          background: 'white', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center'
        }}
      >
        {selectedMapels.length === 0 ? (
          <span style={{ color: '#94a3b8', fontSize: 13 }}>Pilih 1 atau lebih mata pelajaran...</span>
        ) : selectedMapels.map(m => (
          <span key={m.id} style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            {m.namaMapel}
            <X size={10} onClick={(e) => { e.stopPropagation(); toggle(m.id); }} style={{ cursor: 'pointer' }} />
          </span>
        ))}
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, maxHeight: 220,
            overflowY: 'auto', zIndex: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
          }}>
            {mapelList.length === 0 ? (
              <p style={{ padding: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>Belum ada mapel. Tambah dulu lewat tombol "Mapel".</p>
            ) : mapelList.map(m => {
              const checked = selectedIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                    background: checked ? '#eff6ff' : 'white', borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <span>{m.namaMapel} <span style={{ fontSize: 10, color: '#94a3b8' }}>({m.kodeMapel})</span></span>
                  <input type="checkbox" checked={checked} onChange={() => {}} style={{ accentColor: '#3b82f6', width: 16, height: 16 }} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

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
    mapelIds: [], // 🔥 array, bukan string tunggal lagi
    nohp: '', 
    alamat: '',
    email: '', 
    password: '', 
    status: 'Aktif'
  });
  const [adding, setAdding] = useState(false);

  // ADD/EDIT MAPEL MODAL
  const [showMapelModal, setShowMapelModal] = useState(false);
  const [editingMapelId, setEditingMapelId] = useState(null); // null = mode tambah, terisi = mode edit
  const [mapelForm, setMapelForm] = useState({
    namaMapel: '',
    deskripsi: '',
    kodeMapel: ''
  });
  const [addingMapel, setAddingMapel] = useState(false);
  const [deletingMapel, setDeletingMapel] = useState(null);

  // EDIT MODAL
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ 
    nama: '', 
    mapelIds: [], // 🔥 array, bukan mapelId string tunggal lagi
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

  // ===== GENERATE KODE UNIK — ATOMIK PAKAI TRANSACTION =====
  // 🔥 FIX BUG: sebelumnya cara generate ID itu "baca semua data, cari
  // angka terbesar, +1" — TAPI antara baca dan nulis itu ada jeda waktu.
  // Kalau ada 2 admin nambah guru/mapel PERSIS berbarengan, keduanya bisa
  // baca angka terbesar yang SAMA dan menghasilkan ID yang SAMA juga
  // (baru ketahuan pas pengecekan duplikat, itupun gak selalu kejamin
  // nyambung baik). `runTransaction` sebenarnya SUDAH di-import dari awal
  // tapi TIDAK PERNAH benar-benar dipakai di manapun — kelihatannya
  // memang niatnya dipakai buat ini tapi belum sempat diselesaikan.
  // Sekarang pakai counter tersimpan yang diperbarui secara ATOMIK: kalau
  // 2 permintaan datang bersamaan, Firestore sendiri yang menjamin
  // urutannya benar, gak mungkin bentrok.
  const generateSequentialId = async (counterField, prefix, existingCollectionName, existingIdField) => {
    try {
      const counterRef = doc(db, "settings", "id_counters");

      // Bootstrap sekali doang: kalau counter ini belum pernah dipakai,
      // hitung dulu dari data yang SUDAH ADA supaya gak mulai dari 0 dan
      // bikin ID yang udah kepake sebelumnya.
      const counterSnap = await getDoc(counterRef);
      if (!counterSnap.exists() || counterSnap.data()[counterField] === undefined) {
        const snap = await getDocs(collection(db, existingCollectionName));
        let maxNumber = 0;
        snap.forEach(d => {
          const val = d.data()[existingIdField];
          if (val) {
            const num = parseInt(String(val).replace(prefix + '-', ''));
            if (!isNaN(num) && num > maxNumber) maxNumber = num;
          }
        });
        await setDoc(counterRef, { [counterField]: maxNumber }, { merge: true });
      }

      // Ambil nomor berikutnya secara ATOMIK
      const newNumber = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        const current = (snap.data()[counterField] || 0) + 1;
        transaction.set(counterRef, { [counterField]: current }, { merge: true });
        return current;
      });

      return `${prefix}-${String(newNumber).padStart(3, '0')}`;
    } catch (error) {
      // Fallback tetap dipertahankan: kalau transaction gagal (misal offline),
      // tetap bisa lanjut kerja pakai ID berbasis timestamp.
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}-${timestamp}${random}`;
    }
  };

  const generateGuruId = () => generateSequentialId('guruIdCounter', 'GURU', 'teachers', 'guruId');
  const generateMapelId = () => generateSequentialId('mapelIdCounter', 'MAPEL', 'mapel', 'kodeMapel');

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

  // ===== TAMBAH / UPDATE MAPEL =====
  // 🔥 FIX FITUR YANG HILANG: sebelumnya modal ini CUMA bisa nambah mapel
  // baru -- gak ada cara SAMA SEKALI buat edit/hapus mapel yang udah ada.
  // Sekarang 1 fungsi ini menangani dua-duanya, tergantung `editingMapelId`.
  const handleAddMapel = async (e) => {
    e.preventDefault();
    if (!mapelForm.namaMapel.trim()) return showAlert("⚠️ Nama mapel wajib diisi!", true);
    
    setAddingMapel(true);
    try {
      const namaTrim = mapelForm.namaMapel.trim();

      // 🔥 FIX: pengecekan duplikat sebelumnya case-sensitive persis --
      // "matematika" dan "Matematika" dianggap 2 mapel berbeda. Sekarang
      // dibandingkan tanpa peduli besar-kecil huruf, sambil tetap
      // menyimpan penulisan aslinya.
      const dupe = mapelList.find(m =>
        m.namaMapel.trim().toLowerCase() === namaTrim.toLowerCase() &&
        m.id !== editingMapelId
      );
      if (dupe) {
        setAddingMapel(false);
        return showAlert(`❌ Mapel "${namaTrim}" sudah ada!`, true);
      }

      if (editingMapelId) {
        // MODE EDIT — update mapel yang sudah ada
        await updateDoc(doc(db, "mapel", editingMapelId), {
          namaMapel: namaTrim,
          deskripsi: mapelForm.deskripsi || '',
          updatedAt: serverTimestamp(),
        });

        // 🔥 Sinkronkan juga ke semua guru yang pakai mapel ini, biar nama
        // mapel di data guru gak basi/beda sama nama mapel yang baru.
        // Sekarang ikut mengecek `mapelIds` (array, guru multi-mapel) --
        // bukan cuma `mapelId` tunggal (data lama) seperti sebelumnya.
        const affectedTeachers = teachers.filter(t =>
          t.mapelId === editingMapelId || (t.mapelIds && t.mapelIds.includes(editingMapelId))
        );
        await Promise.all(affectedTeachers.map(t => {
          const hasDetails = t.mapelDetails && t.mapelDetails.length > 0;
          const updatedDetails = hasDetails
            ? t.mapelDetails.map(md => md.id === editingMapelId ? { ...md, namaMapel: namaTrim } : md)
            : [{ id: editingMapelId, namaMapel: namaTrim, kodeMapel: t.kodeMapel || '' }];
          return updateDoc(doc(db, "teachers", t.id), {
            mapelDetails: updatedDetails,
            mapel: updatedDetails.map(m => m.namaMapel).join(', '),
            updatedAt: serverTimestamp(),
          });
        }));

        showAlert(`✅ Mapel "${namaTrim}" berhasil diperbarui!${affectedTeachers.length > 0 ? ` (${affectedTeachers.length} guru ikut disinkronkan)` : ''}`);
      } else {
        // MODE TAMBAH — mapel baru
        const kodeMapel = await generateMapelId();
        await addDoc(collection(db, "mapel"), {
          namaMapel: namaTrim,
          deskripsi: mapelForm.deskripsi || '',
          kodeMapel: kodeMapel,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        showAlert(`✅ Mapel "${namaTrim}" berhasil ditambahkan! (${kodeMapel})`);
      }

      setShowMapelModal(false);
      setEditingMapelId(null);
      setMapelForm({ namaMapel: '', deskripsi: '', kodeMapel: '' });
      fetchMapel();
      fetchTeachers();
    } catch (error) {
      showAlert("❌ Gagal menyimpan mapel: " + error.message, true);
    }
    setAddingMapel(false);
  };

  // 🔥 BARU: buka form dalam mode edit, prefill data mapel yang dipilih
  const handleOpenEditMapel = (mapel) => {
    setEditingMapelId(mapel.id);
    setMapelForm({
      namaMapel: mapel.namaMapel || '',
      deskripsi: mapel.deskripsi || '',
      kodeMapel: mapel.kodeMapel || '',
    });
  };

  const handleCancelEditMapel = () => {
    setEditingMapelId(null);
    setMapelForm({ namaMapel: '', deskripsi: '', kodeMapel: '' });
  };

  // 🔥 BARU: hapus mapel, dengan pengaman -- kalau masih ada guru yang
  // pakai mapel ini, admin diperingatkan dulu (biar gak ada guru yang
  // tiba-tiba "kehilangan" mapelnya tanpa sadar).
  const handleDeleteMapel = async (mapel) => {
    // 🔥 Ikut mengecek mapelIds (array) selain mapelId/kodeMapel tunggal.
    const usedBy = teachers.filter(t =>
      t.mapelId === mapel.id ||
      t.kodeMapel === mapel.kodeMapel ||
      (t.mapelIds && t.mapelIds.includes(mapel.id))
    );
    const warningExtra = usedBy.length > 0
      ? `\n\n⚠️ Mapel ini masih dipakai oleh ${usedBy.length} guru (${usedBy.map(t => t.nama).join(', ')}). Data guru TIDAK akan ikut terhapus, tapi kode mapelnya akan jadi tidak valid.`
      : '';
    if (!window.confirm(`Hapus mapel "${mapel.namaMapel}"?${warningExtra}`)) return;

    setDeletingMapel(mapel.id);
    try {
      await deleteDoc(doc(db, "mapel", mapel.id));
      showAlert(`🗑️ Mapel "${mapel.namaMapel}" dihapus!`);
      fetchMapel();
    } catch (error) {
      showAlert("❌ Gagal menghapus mapel: " + error.message, true);
    }
    setDeletingMapel(null);
  };

  // ===== TAMBAH GURU BARU (FIXED: ANTI DUPLIKAT + MULTI MAPEL) =====
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!addForm.nama) return showAlert("⚠️ Nama guru wajib diisi!", true);
    if (!addForm.email) return showAlert("⚠️ Email wajib diisi!", true);
    if (!addForm.password) return showAlert("⚠️ Password wajib diisi!", true);
    if (addForm.mapelIds.length === 0) return showAlert("⚠️ Pilih minimal 1 mata pelajaran!", true);
    
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
      
      // 4. Kumpulkan detail SEMUA mapel yang dipilih (bisa lebih dari 1)
      const selectedMapels = mapelList.filter(m => addForm.mapelIds.includes(m.id));
      
      // 5. Simpan ke Firestore
      const teacherData = {
        guruId: guruId,
        nama: addForm.nama,
        // 🔥 Sumber data utama sekarang array:
        mapelIds: addForm.mapelIds,
        mapelDetails: selectedMapels.map(m => ({ id: m.id, namaMapel: m.namaMapel, kodeMapel: m.kodeMapel })),
        // 🔥 Field lama dipertahankan (gabungan semua mapel yang diampu),
        // supaya bagian sistem lain yang belum diperbarui buat baca
        // mapelDetails/mapelIds tetap dapat data yang masuk akal.
        mapel: selectedMapels.map(m => m.namaMapel).join(', '),
        kodeMapel: selectedMapels.map(m => m.kodeMapel).join(', '),
        mapelId: selectedMapels[0]?.id || '',
        nohp: addForm.nohp,
        alamat: addForm.alamat,
        email: addForm.email,
        passwordHint: addForm.password,
        status: addForm.status,
        authUid: authUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "teachers"), teacherData);
      
      showAlert(`✅ Guru ${addForm.nama} berhasil ditambahkan! (${guruId})`);
      setShowAddModal(false);
      setAddForm({ nama: '', mapelIds: [], nohp: '', alamat: '', email: '', password: '', status: 'Aktif' });
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
      // 🔥 Langsung simpan ke Firestore juga, bukan cuma state lokal --
      // "Hapus" itu tindakan final, harusnya gak nunggu tombol "Simpan"
      // lagi. Kalau enggak, dan admin klik "Batal" setelah ini, file di
      // storage udah kehapus tapi Firestore masih nyimpen link yang udah
      // gak valid (foto jadi pecah di tempat lain yang nampilin data ini).
      await updateDoc(doc(db, "teachers", editModal), { fotoUrl: '', updatedAt: serverTimestamp() });
      showAlert("✅ Foto berhasil dihapus!");
    } catch (error) { showAlert("❌ Gagal hapus foto: " + error.message, true); }
  };

  // ===== BUKA EDIT =====
  const handleOpenEdit = (teacher) => {
    setEditModal(teacher.id);
    setEditForm({
      nama: teacher.nama || '',
      // 🔥 Fallback data lama: guru yang dibuat sebelum fitur multi-mapel
      // ada cuma punya `mapelId` tunggal -- dijadikan array berisi 1 item
      // supaya tetap kepilih dengan benar di MapelMultiSelect.
      mapelIds: (teacher.mapelIds && teacher.mapelIds.length > 0)
        ? teacher.mapelIds
        : (teacher.mapelId ? [teacher.mapelId] : []),
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
    if (editForm.mapelIds.length === 0) return showAlert("⚠️ Pilih minimal 1 mata pelajaran!", true);
    setSaving(true);
    try {
      const selectedMapels = mapelList.filter(m => editForm.mapelIds.includes(m.id));
      const updateData = {
        nama: editForm.nama,
        mapelIds: editForm.mapelIds,
        mapelDetails: selectedMapels.map(m => ({ id: m.id, namaMapel: m.namaMapel, kodeMapel: m.kodeMapel })),
        mapel: selectedMapels.map(m => m.namaMapel).join(', '),
        kodeMapel: selectedMapels.map(m => m.kodeMapel).join(', '),
        mapelId: selectedMapels[0]?.id || '',
        nohp: editForm.nohp,
        alamat: editForm.alamat,
        status: editForm.status,
        email: editForm.email,
        fotoUrl: editForm.fotoUrl,
        guruId: editForm.guruId,
        updatedAt: serverTimestamp()
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
  // 🔥 Pencarian sekarang ikut mencakup SEMUA mapel yang diampu guru
  // (bukan cuma field tunggal `mapel`), pakai helper getTeacherMapelList.
  const filtered = teachers.filter(t => {
    const mapels = getTeacherMapelList(t);
    const mapelNames = mapels.map(m => m.namaMapel).join(' ').toLowerCase();
    const mapelKodes = mapels.map(m => m.kodeMapel).join(' ').toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      (t.nama || '').toLowerCase().includes(term) ||
      mapelNames.includes(term) ||
      (t.email || '').toLowerCase().includes(term) ||
      (t.guruId || '').toLowerCase().includes(term) ||
      mapelKodes.includes(term)
    );
  });

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
            <button onClick={() => { handleCancelEditMapel(); setShowMapelModal(true); }} style={styles.btnMapel(isMobile)}>
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
                  {filtered.map((t, idx) => {
                    const mapels = getTeacherMapelList(t);
                    return (
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
                        {/* 🔥 Sekarang bisa nampilin LEBIH DARI 1 mapel per guru */}
                        <div style={styles.mapelCell}>
                          {mapels.length === 0 ? (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Belum ada mapel</span>
                          ) : mapels.map((m, mi) => (
                            <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={styles.mapelBadge}>{m.namaMapel}</span>
                              {m.kodeMapel && (
                                <span style={styles.kodeBadge}>
                                  <Tag size={10} /> {m.kodeMapel}
                                </span>
                              )}
                            </div>
                          ))}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* MODAL TAMBAH MAPEL */}
        {/* ============================================ */}
        {showMapelModal && (
          <div style={styles.overlay} onClick={() => { setShowMapelModal(false); handleCancelEditMapel(); }}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}><Layers size={18} /> {editingMapelId ? 'Edit Mapel' : 'Tambah Mapel Baru'}</h3>
                <button onClick={() => { setShowMapelModal(false); handleCancelEditMapel(); }} style={styles.btnClose}><X size={20} /></button>
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
                    {editingMapelId
                      ? <>Kode <strong>{mapelForm.kodeMapel}</strong> tetap sama, cuma nama & deskripsi yang berubah.</>
                      : 'Kode unik akan dibuat otomatis oleh sistem (MAPEL-XXX)'}
                  </span>
                </div>
                <div style={styles.modalFooter}>
                  {editingMapelId ? (
                    <button type="button" onClick={handleCancelEditMapel} style={styles.btnCancel}>Batal Edit</button>
                  ) : (
                    <button type="button" onClick={() => setShowMapelModal(false)} style={styles.btnCancel}>Tutup</button>
                  )}
                  <button type="submit" disabled={addingMapel} style={styles.btnSave}>
                    <Save size={16} /> {addingMapel ? 'Menyimpan...' : (editingMapelId ? 'Update Mapel' : 'Simpan Mapel')}
                  </button>
                </div>
              </form>

              {/* 🔥 BARU: daftar mapel yang sudah ada, sebelumnya sama sekali
                  tidak bisa dilihat/diedit/dihapus dari mana pun. */}
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                  📚 Mapel Terdaftar ({mapelList.length})
                </h4>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mapelList.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 12 }}>Belum ada mapel.</p>
                  ) : mapelList.map(m => {
                    const jumlahGuru = teachers.filter(t => t.mapelId === m.id || t.kodeMapel === m.kodeMapel || (t.mapelIds && t.mapelIds.includes(m.id))).length;
                    return (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                        borderRadius: 8, border: editingMapelId === m.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: editingMapelId === m.id ? '#eff6ff' : '#f8fafc',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{m.namaMapel}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>
                            {m.kodeMapel} {jumlahGuru > 0 && `• dipakai ${jumlahGuru} guru`}
                          </div>
                        </div>
                        <button onClick={() => handleOpenEditMapel(m)} title="Edit mapel" style={{ background: '#fef3c7', color: '#b45309', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteMapel(m)}
                          disabled={deletingMapel === m.id}
                          title="Hapus mapel"
                          style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', opacity: deletingMapel === m.id ? 0.5 : 1 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                  <label style={styles.formLabel}>Mata Pelajaran * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(bisa pilih lebih dari satu, mis. guru yang ngampu 2-3 mapel)</span></label>
                  <div style={styles.selectWithButton}>
                    <div style={{ flex: 1 }}>
                      <MapelMultiSelect
                        mapelList={mapelList}
                        selectedIds={addForm.mapelIds}
                        onChange={(ids) => setAddForm({ ...addForm, mapelIds: ids })}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowMapelModal(true)}
                      style={styles.btnAddMapel}
                      title="Tambah mapel baru"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {addForm.mapelIds.length > 0 && (
                    <div style={styles.infoBox}>
                      <Tag size={14} color="#3b82f6" />
                      <span style={{fontSize: 11, color: '#475569'}}>
                        Kode: <strong>{mapelList.filter(m => addForm.mapelIds.includes(m.id)).map(m => m.kodeMapel).join(', ')}</strong>
                      </span>
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
                  <label style={styles.formLabel}>Mata Pelajaran <span style={{ fontWeight: 400, color: '#94a3b8' }}>(bisa pilih lebih dari satu)</span></label>
                  <div style={styles.selectWithButton}>
                    <div style={{ flex: 1 }}>
                      <MapelMultiSelect
                        mapelList={mapelList}
                        selectedIds={editForm.mapelIds}
                        onChange={(ids) => setEditForm({ ...editForm, mapelIds: ids })}
                      />
                    </div>
                  </div>
                  {editForm.mapelIds.length > 0 && (
                    <div style={styles.infoBox}>
                      <Tag size={14} color="#3b82f6" />
                      <span style={{fontSize: 11, color: '#475569'}}>
                        Kode: <strong>{mapelList.filter(m => editForm.mapelIds.includes(m.id)).map(m => m.kodeMapel).join(', ')}</strong>
                      </span>
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
    display: 'flex', gap: 8, alignItems: 'flex-start'
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
  mapelCell: { display: 'flex', flexDirection: 'column', gap: 4 },
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