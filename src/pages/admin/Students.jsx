import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { GraduationCap, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square, FileSpreadsheet, FileText, Smartphone, Briefcase, School } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseRupiah = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\./g, '') || '0', 10);
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  // State UI
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('siswa'); // 'siswa' | 'ortu' | 'paket'

  // --- DATA SISWA LENGKAP (SESUAI REQUEST) ---
  const initialForm = {
    // Data Siswa
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "",
    // Data Ortu
    fatherName: "", fatherJob: "", fatherPhone: "",
    motherName: "", motherJob: "", motherPhone: "",
    emergencyWAPhone: "", // No WA yang bisa dihubungi
    // Paket
    packageDuration: "1" // 1, 3, 6 Bulan
  };
  const [formData, setFormData] = useState(initialForm);

  // --- STATE KEUANGAN (Hanya saat Pendaftaran Baru) ---
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [dpAmountStr, setDpAmountStr] = useState(""); // Uang yang dibayar saat ini (DP)
  const [paymentMethod, setPaymentMethod] = useState("Tunai"); // Tunai / Transfer

  useEffect(() => {
    const unsubStudents = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), (snap) => {
      setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    getDoc(doc(db, "settings", "prices")).then(snap => {
      if(snap.exists()) setPrices(snap.data());
    });
    return () => unsubStudents();
  }, [db]);

  // --- HITUNG KEUANGAN ---
  const calculateFinancials = () => {
    if (!prices) return { packagePrice: 0, regFee: 0, total: 0 };
    
    // Key harga di Settings (misal: sd_1, smp_6)
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0;
    const total = packagePrice + regFee;
    
    const bayarSekarang = parseRupiah(dpAmountStr);
    const sisaHutang = total - bayarSekarang;

    return { packagePrice, regFee, total, bayarSekarang, sisaHutang };
  };

  // --- SIMPAN DATA ---
  const handleSave = async (e) => {
    e.preventDefault();
    
    // 1. UPDATE DATA (EDIT)
    if (isEditing) {
      await updateDoc(doc(db, "students", editId), formData);
      alert("Data Siswa Berhasil Diperbarui!");
      resetForm();
      return;
    }

    // 2. PENDAFTARAN BARU + KEUANGAN
    if (!prices) return alert("Koneksi harga gagal. Refresh halaman.");
    const fin = calculateFinancials();

    // Validasi sederhana
    if (fin.total === 0 && !confirm("Total Tagihan Rp 0. Lanjut?")) return;
    if (fin.sisaHutang < 0) return alert("Pembayaran melebihi total tagihan!");

    try {
      await runTransaction(db, async (transaction) => {
        // A. Simpan Data Lengkap Siswa
        const studentRef = doc(collection(db, "students"));
        transaction.set(studentRef, {
          ...formData,
          status: 'active',
          joinedAt: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });

        // B. Buat Invoice (Tagihan)
        // Logika: Jika lunas (sisa 0), status paid. Jika ada sisa, status partial.
        let statusInvoice = 'unpaid';
        if (fin.sisaHutang === 0) statusInvoice = 'paid';
        else if (fin.bayarSekarang > 0) statusInvoice = 'partial';

        const invoiceRef = doc(collection(db, "invoices"));
        transaction.set(invoiceRef, {
          studentId: studentRef.id,
          studentName: formData.name,
          totalAmount: fin.total,      // Total Harga Paket + Daftar
          remainingAmount: fin.sisaHutang, // Sisa yang belum dibayar
          status: statusInvoice,
          type: 'pendaftaran',
          dueDate: new Date().toISOString().split('T')[0], // Jatuh tempo default hari ini (bisa diedit di menu keuangan)
          details: `Paket ${formData.schoolLevel} ${formData.packageDuration} Bulan ${includeRegFee ? '+ Pendaftaran' : ''}`,
          createdAt: serverTimestamp()
        });

        // C. Catat Uang Masuk (Hanya jika ada pembayaran di muka)
        if (fin.bayarSekarang > 0) {
          const paymentRef = doc(collection(db, "payments"));
          transaction.set(paymentRef, {
            invoiceId: invoiceRef.id,
            studentName: formData.name,
            amount: fin.bayarSekarang,
            method: paymentMethod, // Tunai / Transfer (Bisa masuk Brankas/Bank nanti)
            date: serverTimestamp(),
            category: 'Pendaftaran',
            description: `Pembayaran Awal / DP Pendaftaran`
          });
        }
      });

      alert(`Siswa Terdaftar!\n\nTotal Tagihan: Rp ${formatRupiah(fin.total)}\nDibayar: Rp ${formatRupiah(fin.bayarSekarang)}\nSisa Hutang: Rp ${formatRupiah(fin.sisaHutang)}`);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan: " + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if(confirm(`Hapus data ${name}? Hati-hati, data nilai dan presensi mungkin hilang.`)) {
      await deleteDoc(doc(db, "students", id));
    }
  };

  const handleEditClick = (s) => {
    setFormData(s); // Load semua data
    setEditId(s.id);
    setIsEditing(true);
    setShowForm(true);
    setActiveTab('siswa');
  };

  const resetForm = () => {
    setShowForm(false); setIsEditing(false); setEditId(null);
    setFormData(initialForm); setIncludeRegFee(true); setDpAmountStr(""); setActiveTab('siswa');
  };

  // --- RENDER FORM ---
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border gap-4">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-blue-600"/> Data Siswa Lengkap</h2>
          <p className="text-xs text-gray-500">Total: {students.length} Siswa | Database Terpusat</p>
        </div>
        <div className="flex gap-2">
           {/* Tombol Dummy untuk Export (Logika nanti) */}
          <button onClick={()=>alert("Fitur Export PDF akan aktif setelah instalasi library.")} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-red-100"><FileText size={16}/> PDF</button>
          <button onClick={()=>alert("Fitur Export Excel akan aktif setelah instalasi library.")} className="bg-green-50 text-green-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-green-100"><FileSpreadsheet size={16}/> Excel</button>
          
          <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 ml-2">
            <UserPlus size={18}/> {showForm ? 'Tutup' : 'Daftar Baru'}
          </button>
        </div>
      </div>

      {/* FORM INPUT LENGKAP */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
             <h3 className="font-bold text-blue-800">{isEditing ? 'Edit Data Siswa' : 'Formulir Pendaftaran Siswa'}</h3>
             <button onClick={resetForm}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
          </div>

          <form onSubmit={handleSave} className="p-6">
            {/* TAB NAVIGASI */}
            <div className="flex border-b mb-6">
              <button type="button" onClick={()=>setActiveTab('siswa')} className={`px-4 py-2 text-sm font-bold ${activeTab==='siswa'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400 hover:text-gray-600'}`}>1. Identitas Siswa</button>
              <button type="button" onClick={()=>setActiveTab('ortu')} className={`px-4 py-2 text-sm font-bold ${activeTab==='ortu'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400 hover:text-gray-600'}`}>2. Orang Tua</button>
              <button type="button" onClick={()=>setActiveTab('paket')} className={`px-4 py-2 text-sm font-bold ${activeTab==='paket'?'border-b-2 border-blue-600 text-blue-600':'text-gray-400 hover:text-gray-600'}`}>3. Paket & Bayar</button>
            </div>

            {/* TAB 1: DATA SISWA */}
            {activeTab === 'siswa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} placeholder="Sesuai Akta Kelahiran"/></div>
                <div><label className="lbl">Nama Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData, nickname:e.target.value})}/></div>
                <div><label className="lbl">Jenis Kelamin</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                <div><label className="lbl">Tempat Lahir</label><input className="inp" value={formData.pob} onChange={e=>setFormData({...formData, pob:e.target.value})}/></div>
                <div><label className="lbl">Tanggal Lahir</label><input type="date" className="inp" value={formData.dob} onChange={e=>setFormData({...formData, dob:e.target.value})}/></div>
                <div><label className="lbl">Nama Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData, schoolName:e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData, schoolLevel:e.target.value})}><option value="SD">SD</option><option value="SMP">SMP</option></select></div>
                  <div><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData, schoolGrade:e.target.value})} placeholder="1/2/3..."/></div>
                </div>
                <div><label className="lbl">No HP Siswa (Opsional)</label><input className="inp" value={formData.studentPhone} onChange={e=>setFormData({...formData, studentPhone:e.target.value})}/></div>
                <div className="md:col-span-2"><label className="lbl">Alamat Rumah</label><textarea className="inp" rows="2" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})}/></div>
                <button type="button" onClick={()=>setActiveTab('ortu')} className="btn-next md:col-span-2">Lanjut ke Data Orang Tua</button>
              </div>
            )}

            {/* TAB 2: DATA ORTU */}
            {activeTab === 'ortu' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData, fatherName:e.target.value})}/></div>
                <div><label className="lbl">Pekerjaan Ayah</label><input className="inp" value={formData.fatherJob} onChange={e=>setFormData({...formData, fatherJob:e.target.value})}/></div>
                <div><label className="lbl">No HP Ayah</label><input className="inp" value={formData.fatherPhone} onChange={e=>setFormData({...formData, fatherPhone:e.target.value})}/></div>
                <div className="border-t md:col-span-2 my-2"></div>
                <div><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData, motherName:e.target.value})}/></div>
                <div><label className="lbl">Pekerjaan Ibu</label><input className="inp" value={formData.motherJob} onChange={e=>setFormData({...formData, motherJob:e.target.value})}/></div>
                <div><label className="lbl">No HP Ibu</label><input className="inp" value={formData.motherPhone} onChange={e=>setFormData({...formData, motherPhone:e.target.value})}/></div>
                <div className="md:col-span-2 bg-green-50 p-3 rounded border border-green-200">
                  <label className="lbl text-green-700">No WhatsApp Utama (Wajib)</label>
                  <input required className="inp border-green-300" placeholder="08xxxxxxxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData, emergencyWAPhone:e.target.value})}/>
                  <p className="text-[10px] text-green-600 mt-1">*Nomor ini akan digunakan untuk pengiriman tagihan & laporan.</p>
                </div>
                <button type="button" onClick={()=>setActiveTab('paket')} className="btn-next md:col-span-2">Lanjut ke Pembayaran</button>
              </div>
            )}

            {/* TAB 3: PAKET & KEUANGAN */}
            {activeTab === 'paket' && (
              <div className="space-y-4">
                {/* PILIH PAKET */}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="lbl">Jenjang Paket</label>
                      <div className="font-bold text-gray-800 bg-gray-100 p-2 rounded">{formData.schoolLevel}</div>
                   </div>
                   <div>
                      <label className="lbl">Durasi Paket</label>
                      <select className="inp font-bold" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration:e.target.value})}>
                        <option value="1">1 Bulan</option>
                        <option value="3">3 Bulan</option>
                        <option value="6">6 Bulan</option>
                      </select>
                   </div>
                </div>

                {/* AREA KASIR (Hanya Mode Baru) */}
                {!isEditing && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2"><Save className="text-blue-600"/> KASIR PENDAFTARAN</h4>
                    
                    {/* Checkbox Pendaftaran */}
                    <div onClick={() => setIncludeRegFee(!includeRegFee)} className="flex items-center gap-2 cursor-pointer mb-4">
                      {includeRegFee ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-gray-400"/>}
                      <span className="text-sm font-medium">Masukan Biaya Pendaftaran? (Rp {formatRupiah(prices?.pendaftaran||0)})</span>
                    </div>

                    {/* Ringkasan Biaya */}
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                      <span>Harga Paket ({formData.packageDuration} Bln):</span>
                      <span>Rp {formatRupiah(calculateFinancials().packagePrice)}</span>
                    </div>
                    {includeRegFee && (
                      <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                        <span>Biaya Pendaftaran:</span>
                        <span>Rp {formatRupiah(calculateFinancials().regFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4 text-lg font-black text-blue-800 border-t border-gray-300 pt-2">
                      <span>TOTAL TAGIHAN:</span>
                      <span>Rp {formatRupiah(calculateFinancials().total)}</span>
                    </div>

                    {/* Input Pembayaran */}
                    <div className="bg-white p-4 rounded border border-blue-100 shadow-sm">
                      <label className="lbl text-blue-700">Bayar Berapa Sekarang?</label>
                      <div className="flex gap-2 mb-2">
                        <button type="button" onClick={()=>setDpAmountStr("0")} className={`flex-1 text-xs py-1 border rounded ${dpAmountStr==="0"||dpAmountStr===""?'bg-red-100 text-red-700 border-red-300':'bg-gray-50'}`}>Nanti (0)</button>
                        <button type="button" onClick={()=>setDpAmountStr(formatRupiah(calculateFinancials().total))} className="flex-1 text-xs py-1 border rounded bg-green-100 text-green-700 border-green-300">Lunas Full</button>
                      </div>
                      <input 
                        type="text" 
                        className="w-full text-xl font-bold p-2 border-b-2 border-blue-600 outline-none mb-2" 
                        placeholder="Rp 0"
                        value={dpAmountStr}
                        onChange={e => setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}
                      />
                      
                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Metode</label>
                          <select className="w-full border p-1 rounded text-sm" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                            <option value="Tunai">Tunai / Cash</option>
                            <option value="Transfer">Transfer Bank</option>
                            <option value="QRIS">QRIS</option>
                          </select>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-500 uppercase font-bold">Sisa Hutang</div>
                          <div className={`text-lg font-black ${calculateFinancials().sisaHutang > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Rp {formatRupiah(calculateFinancials().sisaHutang)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-3 border rounded text-gray-600 font-bold hover:bg-gray-50">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg">
                    {isEditing ? 'SIMPAN PERUBAHAN' : 'PROSES PENDAFTARAN'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TABEL DATA SISWA */}
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b">
            <tr>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4 hidden md:table-cell">Sekolah / Kelas</th>
              <th className="p-4 hidden md:table-cell">Orang Tua</th>
              <th className="p-4">No WA</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-bold text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="font-medium">{s.schoolName || '-'}</div>
                  <div className="text-xs text-blue-600 bg-blue-50 inline-block px-1 rounded">{s.schoolLevel} - {s.schoolGrade}</div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="text-xs"><span className="font-bold">A:</span> {s.fatherName}</div>
                  <div className="text-xs"><span className="font-bold">I:</span> {s.motherName}</div>
                </td>
                <td className="p-4 flex items-center gap-1">
                   <Smartphone size={14} className="text-green-600"/> {s.emergencyWAPhone || '-'}
                </td>
                <td className="p-4 text-center">
                   <div className="flex justify-center gap-2">
                     <button onClick={()=>handleEditClick(s)} className="p-1.5 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"><Edit size={16}/></button>
                     <button onClick={()=>handleDelete(s.id, s.name)} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .lbl { display: block; font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 0.25rem; }
        .inp { width: 100%; border: 1px solid #e5e7eb; padding: 0.5rem; border-radius: 0.375rem; font-size: 0.875rem; }
        .inp:focus { outline: none; border-color: #2563eb; ring: 1px; }
        .btn-next { width: 100%; background: #eff6ff; color: #1d4ed8; padding: 0.75rem; border-radius: 0.5rem; font-weight: bold; margin-top: 1rem; }
        .btn-next:hover { background: #dbeafe; }
      `}</style>
    </div>
  );
}