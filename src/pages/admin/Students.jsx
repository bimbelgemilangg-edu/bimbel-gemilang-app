import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { GraduationCap, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square, FileSpreadsheet, FileText, Smartphone, MessageCircle, Calendar } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseRupiah = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\./g, '') || '0', 10);
};

// --- HELPER: WA LINK GENERATOR ---
const generateWALink = (phone, name) => {
  if (!phone) return "#";
  let cleanPhone = phone.replace(/\D/g, ''); // Hapus non-angka
  if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1); // Ganti 08 jadi 628
  const text = `Halo Orang Tua siswa *${name}*, kami dari Admin Bimbel Gemilang...`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  // State UI
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('siswa'); 

  // --- DATA SISWA LENGKAP ---
  const initialForm = {
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "",
    fatherName: "", fatherJob: "", fatherPhone: "",
    motherName: "", motherJob: "", motherPhone: "",
    emergencyWAPhone: "", 
    packageDuration: "1" // Default 1 bulan
  };
  const [formData, setFormData] = useState(initialForm);

  // --- STATE KEUANGAN ---
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [dpAmountStr, setDpAmountStr] = useState(""); 
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [installmentPlan, setInstallmentPlan] = useState(1); // Rencana Cicilan (1x, 2x, 3x...)

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
    if (!prices) return { total: 0, sisaHutang: 0 };
    
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0;
    const total = packagePrice + regFee;
    
    const bayarSekarang = parseRupiah(dpAmountStr);
    const sisaHutang = total - bayarSekarang;

    return { packagePrice, regFee, total, bayarSekarang, sisaHutang };
  };

  // --- SIMPAN DATA (CORE LOGIC) ---
  const handleSave = async (e) => {
    e.preventDefault();
    
    // 1. UPDATE DATA (EDIT)
    if (isEditing) {
      await updateDoc(doc(db, "students", editId), formData);
      alert("Data Siswa Berhasil Diperbarui!"); resetForm(); return;
    }

    // 2. PENDAFTARAN BARU + SPLIT TAGIHAN
    if (!prices) return alert("Koneksi harga gagal.");
    const fin = calculateFinancials();

    if (fin.sisaHutang < 0) return alert("Pembayaran melebihi total tagihan!");

    try {
      await runTransaction(db, async (transaction) => {
        // A. Simpan Data Siswa
        const studentRef = doc(collection(db, "students"));
        transaction.set(studentRef, {
          ...formData,
          status: 'active',
          joinedAt: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });

        // B. Catat Pembayaran Awal (DP/Lunas) -> Masuk Laporan Kas
        if (fin.bayarSekarang > 0) {
          const paymentRef = doc(collection(db, "payments"));
          transaction.set(paymentRef, {
            studentName: formData.name, // Link nama manual krn invoice mungkin belum ada
            amount: fin.bayarSekarang,
            method: paymentMethod,
            date: serverTimestamp(),
            category: 'Pendaftaran',
            description: `Pembayaran Awal (Pendaftaran/DP)`
          });
        }

        // C. LOGIKA CICILAN OTOMATIS (SPLIT INVOICE)
        if (fin.sisaHutang > 0) {
          // Hitung cicilan per bulan
          const installmentAmount = Math.ceil(fin.sisaHutang / installmentPlan);
          
          for (let i = 0; i < installmentPlan; i++) {
            // Tentukan Jatuh Tempo (Bulan ini, Bulan Depan, dst)
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i); // Tambah bulan otomatis
            
            // Handle sisa pembagian (agar total pas)
            let currentAmount = installmentAmount;
            if (i === installmentPlan - 1) { // Cicilan terakhir menyesuaikan sisa
               const alreadyInvoiced = installmentAmount * (installmentPlan - 1);
               currentAmount = fin.sisaHutang - alreadyInvoiced;
            }

            const invoiceRef = doc(collection(db, "invoices"));
            transaction.set(invoiceRef, {
              studentId: studentRef.id,
              studentName: formData.name,
              totalAmount: currentAmount,
              remainingAmount: currentAmount, // Awalnya full hutang
              status: 'unpaid',
              type: 'cicilan_paket',
              dueDate: dueDate.toISOString().split('T')[0],
              details: `Cicilan ${i+1}/${installmentPlan} - Paket ${formData.schoolLevel}`,
              createdAt: serverTimestamp()
            });
          }
        }
      });

      alert(`Sukses! Siswa terdaftar.\nSisa hutang Rp ${formatRupiah(fin.sisaHutang)} telah dibagi menjadi ${installmentPlan} tagihan bulanan.`);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Gagal: " + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if(confirm(`Hapus data ${name}?`)) await deleteDoc(doc(db, "students", id));
  };

  const handleEditClick = (s) => {
    setFormData(s); setEditId(s.id); setIsEditing(true); setShowForm(true); setActiveTab('siswa');
  };

  const resetForm = () => {
    setShowForm(false); setIsEditing(false); setEditId(null);
    setFormData(initialForm); setIncludeRegFee(true); setDpAmountStr(""); setInstallmentPlan(1);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border gap-4">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-blue-600"/> Data Siswa Lengkap</h2>
          <p className="text-xs text-gray-500">Total: {students.length} Siswa | Database Terpusat</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>alert("Segera Hadir: Export PDF")} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-red-100"><FileText size={16}/> PDF</button>
          <button onClick={()=>alert("Segera Hadir: Export Excel")} className="bg-green-50 text-green-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-green-100"><FileSpreadsheet size={16}/> Excel</button>
          <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 ml-2"><UserPlus size={18}/> {showForm ? 'Tutup' : 'Daftar Baru'}</button>
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
            <div className="flex border-b mb-6">
              {['siswa','ortu','paket'].map(t => (
                <button key={t} type="button" onClick={()=>setActiveTab(t)} className={`px-4 py-2 text-sm font-bold capitalize ${activeTab===t?'border-b-2 border-blue-600 text-blue-600':'text-gray-400'}`}>{t === 'ortu' ? 'Orang Tua' : t}</button>
              ))}
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
                  <p className="text-[10px] text-green-600 mt-1">*Nomor ini untuk tombol Direct WA & Tagihan.</p>
                </div>
                <button type="button" onClick={()=>setActiveTab('paket')} className="btn-next md:col-span-2">Lanjut ke Pembayaran</button>
              </div>
            )}

            {/* TAB 3: PAKET & KEUANGAN (FITUR UTAMA) */}
            {activeTab === 'paket' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="lbl">Jenjang Paket</label>
                      <div className="font-bold text-gray-800 bg-gray-100 p-2 rounded">{formData.schoolLevel}</div>
                   </div>
                   <div>
                      <label className="lbl">Durasi Paket</label>
                      <select className="inp font-bold" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration:e.target.value})}><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select>
                   </div>
                </div>

                {!isEditing && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                    <h4 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2"><Save className="text-blue-600"/> KASIR PENDAFTARAN</h4>
                    
                    <div onClick={() => setIncludeRegFee(!includeRegFee)} className="flex items-center gap-2 cursor-pointer mb-4">
                      {includeRegFee ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-gray-400"/>}
                      <span className="text-sm font-medium">Masukan Biaya Pendaftaran? (Rp {formatRupiah(prices?.pendaftaran||0)})</span>
                    </div>

                    <div className="bg-white p-4 rounded border border-blue-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-600 font-bold">TOTAL TAGIHAN:</span>
                        <span className="text-xl font-black text-blue-800">Rp {formatRupiah(calculateFinancials().total)}</span>
                      </div>

                      {/* INPUT BAYAR */}
                      <label className="lbl text-blue-700">Bayar Berapa Sekarang?</label>
                      <div className="flex gap-2 mb-2">
                        <button type="button" onClick={()=>setDpAmountStr("0")} className={`flex-1 text-xs py-1 border rounded ${dpAmountStr==="0"||dpAmountStr===""?'bg-red-100 text-red-700 border-red-300':'bg-gray-50'}`}>Nanti (Rp 0)</button>
                        <button type="button" onClick={()=>setDpAmountStr(formatRupiah(calculateFinancials().total))} className="flex-1 text-xs py-1 border rounded bg-green-100 text-green-700 border-green-300">Lunas Full</button>
                      </div>
                      <input type="text" className="w-full text-xl font-bold p-2 border-b-2 border-blue-600 outline-none mb-2" placeholder="Rp 0" value={dpAmountStr} onChange={e => setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/>
                      
                      {/* SISA HUTANG & CICILAN */}
                      {calculateFinancials().sisaHutang > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="flex justify-between items-center border-b border-orange-200 pb-2 mb-2">
                            <span className="text-xs font-bold text-orange-800 uppercase">Sisa Hutang:</span>
                            <span className="text-lg font-black text-red-600">Rp {formatRupiah(calculateFinancials().sisaHutang)}</span>
                          </div>
                          
                          <label className="lbl text-orange-700">Rencana Cicilan (Berapa Kali?)</label>
                          <div className="flex gap-2 items-center">
                            <select className="border p-2 rounded w-20 font-bold text-center" value={installmentPlan} onChange={e=>setInstallmentPlan(parseInt(e.target.value))}>
                              {[1,2,3,4,5,6].map(num => <option key={num} value={num}>{num}x</option>)}
                            </select>
                            <div className="text-xs text-orange-600">
                              {installmentPlan > 1 
                                ? `Otomatis buat ${installmentPlan} tagihan @ Rp ${formatRupiah(Math.ceil(calculateFinancials().sisaHutang / installmentPlan))}`
                                : "Akan dibuat 1 tagihan pelunasan."}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-3 border rounded text-gray-600 font-bold hover:bg-gray-50">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg">{isEditing ? 'SIMPAN PERUBAHAN' : 'PROSES PENDAFTARAN'}</button>
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
              <th className="p-4 hidden md:table-cell">Info Sekolah</th>
              <th className="p-4 hidden md:table-cell">Kontak Ortu</th>
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
                  <div className="flex items-center gap-2">
                    <Smartphone size={14} className="text-gray-400"/>
                    <span className="font-mono text-xs">{s.emergencyWAPhone || '-'}</span>
                    {/* TOMBOL WA DIRECT */}
                    {s.emergencyWAPhone && (
                      <a href={generateWALink(s.emergencyWAPhone, s.name)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800 bg-green-50 p-1 rounded">
                        <MessageCircle size={16}/>
                      </a>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">Ayah: {s.fatherName}</div>
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
      <style>{`.lbl{display:block;font-size:0.75rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:0.25rem}.inp{width:100%;border:1px solid #e5e7eb;padding:0.5rem;border-radius:0.375rem;font-size:0.875rem}.inp:focus{outline:none;border-color:#2563eb;ring:1px}.btn-next{width:100%;background:#eff6ff;color:#1d4ed8;padding:0.75rem;border-radius:0.5rem;font-weight:bold;margin-top:1rem}.btn-next:hover{background:#dbeafe}`}</style>
    </div>
  );
}