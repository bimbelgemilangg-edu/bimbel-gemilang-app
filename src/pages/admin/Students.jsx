import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { GraduationCap, Plus, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (value) => {
  if (!value) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseRupiah = (value) => {
  return parseInt(value.replace(/\./g, '') || '0', 10);
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  // State Form
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Mode Edit
  const [editId, setEditId] = useState(null); // ID Siswa yg diedit

  // Data Form
  const [formData, setFormData] = useState({
    name: "", parentJob: "", 
    level: "SD", packageDuration: "1"
  });

  // State Tambahan untuk Tagihan
  const [includeRegFee, setIncludeRegFee] = useState(true); // Default: Pakai Biaya Pendaftaran
  const [customDueDate, setCustomDueDate] = useState(""); // Tanggal Jatuh Tempo Manual

  useEffect(() => {
    const unsubStudents = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), (snap) => {
      setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    getDoc(doc(db, "settings", "prices")).then(snap => {
      if(snap.exists()) setPrices(snap.data());
    });
    // Set default due date: Hari ini
    setCustomDueDate(new Date().toISOString().split('T')[0]);
    return () => unsubStudents();
  }, [db]);

  // --- HAPUS SISWA ---
  const handleDelete = async (id, name) => {
    if(confirm(`Yakin hapus data siswa: ${name}? Tagihan terkait tidak otomatis terhapus (harus dari menu Keuangan).`)) {
      await deleteDoc(doc(db, "students", id));
    }
  };

  // --- PERSIAPAN EDIT ---
  const handleEditClick = (s) => {
    setFormData({
      name: s.name, parentJob: s.parentJob || "",
      level: s.level, packageDuration: s.grade ? s.grade.split(" ")[0] : "1"
    });
    setEditId(s.id);
    setIsEditing(true);
    setShowForm(true);
  };

  // --- SIMPAN DATA (BARU / EDIT) ---
  const handleSave = async (e) => {
    e.preventDefault();

    // 1. JIKA MODE EDIT (Cuma update biodata)
    if (isEditing) {
      await updateDoc(doc(db, "students", editId), {
        name: formData.name,
        parentJob: formData.parentJob,
        level: formData.level,
        grade: formData.packageDuration + " Bulan"
      });
      alert("Data Siswa Diperbarui!");
      resetForm();
      return;
    }

    // 2. JIKA MODE BARU (Buat Siswa + Invoice)
    if (!prices) return alert("Setting Harga belum dimuat! Refresh halaman.");

    // Hitung Harga
    const priceKey = `${formData.level.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0; // Cek Checkbox
    const totalBill = packagePrice + regFee;

    if (totalBill === 0) {
      if(!confirm("Total Tagihan Rp 0. Yakin ingin melanjutkan?")) return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        // A. Simpan Data Siswa
        const studentRef = doc(collection(db, "students"));
        transaction.set(studentRef, {
          name: formData.name,
          parentJob: formData.parentJob,
          level: formData.level,
          grade: formData.packageDuration + " Bulan",
          createdAt: serverTimestamp()
        });

        // B. Buat Invoice
        const invoiceRef = doc(collection(db, "invoices"));
        transaction.set(invoiceRef, {
          studentId: studentRef.id,
          studentName: formData.name,
          totalAmount: totalBill,
          remainingAmount: totalBill,
          status: 'unpaid',
          type: 'pendaftaran',
          dueDate: customDueDate, // Pakai tanggal yg dipilih admin
          details: `Paket ${formData.level} (${formData.packageDuration} Bln) ${includeRegFee ? '+ Pendaftaran' : ''}`,
          createdAt: serverTimestamp()
        });
      });

      alert(`Siswa Tersimpan! Tagihan Rp ${formatRupiah(totalBill)} telah dibuat.`);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: "", parentJob: "", level: "SD", packageDuration: "1" });
    setIncludeRegFee(true);
  };

  // Helper Hitung Preview
  const calculatePreview = () => {
    if (!prices) return 0;
    const priceKey = `${formData.level.toLowerCase()}_${formData.packageDuration}`;
    const pkg = prices[priceKey] || 0;
    const reg = includeRegFee ? (prices.pendaftaran || 0) : 0;
    return pkg + reg;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-blue-600"/> Master Siswa</h2>
          <p className="text-xs text-gray-500">Kelola Data & Pendaftaran Baru</p>
        </div>
        <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
          <UserPlus size={18}/> {showForm ? 'Tutup Form' : 'Siswa Baru'}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-800">{isEditing ? 'Edit Biodata Siswa' : 'Pendaftaran Siswa Baru'}</h3>
            <button onClick={resetForm}><X className="text-gray-400 hover:text-red-500"/></button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Siswa</label>
              <input required className="w-full border p-2 rounded mt-1" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Pekerjaan Ortu</label>
              <input className="w-full border p-2 rounded mt-1" value={formData.parentJob} onChange={e=>setFormData({...formData, parentJob: e.target.value})}/>
            </div>

            {/* OPSI PAKET */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Jenjang</label>
              <select className="w-full border p-2 rounded mt-1 font-bold" value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})}>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Durasi</label>
              <select className="w-full border p-2 rounded mt-1 font-bold" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration: e.target.value})}>
                <option value="1">1 Bulan</option>
                <option value="3">3 Bulan</option>
                <option value="6">6 Bulan</option>
              </select>
            </div>

            {/* KHUSUS PENDAFTARAN BARU: OPSI TAGIHAN */}
            {!isEditing && (
              <div className="col-span-2 bg-white p-4 rounded-lg border border-blue-200 space-y-3">
                <p className="text-xs font-bold text-blue-600 border-b pb-2 mb-2">PENGATURAN TAGIHAN AWAL</p>
                
                {/* 1. Toggle Biaya Pendaftaran */}
                <div 
                  onClick={() => setIncludeRegFee(!includeRegFee)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  {includeRegFee ? <CheckSquare className="text-blue-600"/> : <Square className="text-gray-400"/>}
                  <div>
                    <span className="text-sm font-bold text-gray-700">Tambah Biaya Pendaftaran?</span>
                    <p className="text-xs text-gray-400">Centang jika ini siswa baru yang wajib bayar uang pangkal.</p>
                  </div>
                </div>

                {/* 2. Tanggal Jatuh Tempo */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Jatuh Tempo Tagihan</label>
                  <input type="date" className="border p-2 rounded w-full md:w-1/2 mt-1" value={customDueDate} onChange={e=>setCustomDueDate(e.target.value)} />
                </div>

                {/* 3. Preview Total */}
                <div className="text-right mt-2">
                  <span className="text-xs text-gray-400">Total Tagihan:</span>
                  <span className="text-2xl font-black text-blue-600 block">Rp {formatRupiah(calculatePreview())}</span>
                </div>
              </div>
            )}

            <div className="col-span-2 flex gap-2 mt-2">
              <button type="button" onClick={resetForm} className="flex-1 py-3 text-gray-500 font-bold bg-white border rounded">Batal</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg">
                {isEditing ? 'SIMPAN PERUBAHAN' : 'DAFTAR & BUAT TAGIHAN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {students.map(s => (
          <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm group">
            <div>
              <div className="font-bold text-gray-800">{s.name}</div>
              <div className="text-xs text-gray-500 mt-1 flex gap-2">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{s.level}</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{s.grade}</span> 
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={()=>handleEditClick(s)} className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200" title="Edit"><Edit size={16}/></button>
              <button onClick={()=>handleDelete(s.id, s.name)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200" title="Hapus"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}