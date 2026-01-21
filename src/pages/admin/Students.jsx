import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { GraduationCap, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square, FileSpreadsheet, FileText, Smartphone, MessageCircle, Calculator } from 'lucide-react';

// --- HELPER ---
const formatRupiah = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const parseRupiah = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\./g, '') || '0', 10);
};
const generateWALink = (phone, name) => {
  if (!phone) return "#";
  let p = phone.replace(/\D/g, ''); if (p.startsWith('0')) p = '62' + p.substring(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(`Halo Wali Murid *${name}*, kami dari Admin Bimbel...`)}`;
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  // State UI
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('biodata'); // 'biodata' | 'keuangan'

  // --- DATA SISWA LENGKAP ---
  const initialForm = {
    // Biodata
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "",
    // Ortu
    fatherName: "", fatherJob: "", fatherPhone: "",
    motherName: "", motherJob: "", motherPhone: "",
    emergencyWAPhone: "", 
    // Paket (PENTING UNTUK HARGA)
    packageDuration: "1" 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- STATE KEUANGAN (AUTO HITUNG) ---
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [dpAmountStr, setDpAmountStr] = useState(""); 
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  
  // Setting Cicilan
  const [installmentPlan, setInstallmentPlan] = useState(1); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    return () => unsub();
  }, [db]);

  // --- HITUNG KEUANGAN (LOGIKA INI YANG KEMBALI) ---
  const calculateFinancials = () => {
    if (!prices) return { packagePrice: 0, regFee: 0, total: 0, sisaHutang: 0 };
    
    // Ambil harga dari Settings berdasarkan Paket yg dipilih
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0;
    const total = packagePrice + regFee;
    
    const bayarSekarang = parseRupiah(dpAmountStr);
    const sisaHutang = total - bayarSekarang;

    return { packagePrice, regFee, total, bayarSekarang, sisaHutang };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // 1. EDIT DATA SAJA
    if (isEditing) {
      await updateDoc(doc(db, "students", editId), formData);
      alert("Biodata Berhasil Diupdate!"); resetForm(); return;
    }

    // 2. DAFTAR BARU (PAKAI AUTO HARGA)
    if (!prices) return alert("Koneksi Harga Gagal. Coba Refresh.");
    const fin = calculateFinancials();

    if (fin.sisaHutang < 0) return alert("Uang bayar kebanyakan!");

    try {
      await runTransaction(db, async (t) => {
        // A. Simpan Siswa
        const sRef = doc(collection(db, "students"));
        t.set(sRef, { ...formData, status: 'active', joinedAt: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });

        // B. Catat Pembayaran (Kalau ada)
        if (fin.bayarSekarang > 0) {
          t.set(doc(collection(db, "payments")), {
            studentName: formData.name, amount: fin.bayarSekarang, method: paymentMethod,
            date: serverTimestamp(), category: 'Pendaftaran', description: 'Pembayaran Awal (DP/Lunas)'
          });
        }

        // C. Buat Tagihan (Lunas/Cicilan)
        // Logika Split Tagihan
        if (fin.sisaHutang > 0) {
          const perMonth = Math.ceil(fin.sisaHutang / installmentPlan);
          for (let i = 0; i < installmentPlan; i++) {
            const due = new Date(startDate); due.setMonth(due.getMonth() + i);
            let amount = perMonth;
            if (i === installmentPlan - 1) amount = fin.sisaHutang - (perMonth * (installmentPlan - 1));

            t.set(doc(collection(db, "invoices")), {
              studentId: sRef.id, studentName: formData.name,
              totalAmount: amount, remainingAmount: amount, status: 'unpaid', type: 'cicilan',
              dueDate: due.toISOString().split('T')[0],
              waPhone: formData.emergencyWAPhone, // Simpan WA untuk Reminder
              details: `Cicilan ${i+1}/${installmentPlan} - Paket ${formData.schoolLevel}`,
              createdAt: serverTimestamp()
            });
          }
        } else {
          // Kalau Lunas Full, tetap buat invoice status PAID (Buat History)
          t.set(doc(collection(db, "invoices")), {
            studentId: sRef.id, studentName: formData.name,
            totalAmount: fin.total, remainingAmount: 0, status: 'paid', type: 'pendaftaran',
            dueDate: new Date().toISOString().split('T')[0],
            waPhone: formData.emergencyWAPhone,
            details: `LUNAS - Paket ${formData.schoolLevel} (${formData.packageDuration} Bulan)`,
            createdAt: serverTimestamp()
          });
        }
      });
      alert("Siswa Terdaftar! Keuangan Tercatat."); resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "students", id)); };
  const handleEditClick = (s) => { setFormData(s); setEditId(s.id); setIsEditing(true); setShowForm(true); setActiveTab('biodata'); };
  const resetForm = () => { setShowForm(false); setIsEditing(false); setEditId(null); setFormData(initialForm); setIncludeRegFee(true); setDpAmountStr(""); setInstallmentPlan(1); setStartDate(new Date().toISOString().split('T')[0]); };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
        <div><h2 className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-blue-600"/> Data Siswa</h2><p className="text-xs text-gray-500">{students.length} Siswa Aktif</p></div>
        <div className="flex gap-2">
          <button onClick={()=>alert("Segera Hadir")} className="bg-gray-100 px-3 py-2 rounded text-xs font-bold text-gray-600">Export PDF</button>
          <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex gap-2 hover:bg-blue-700"><UserPlus size={18}/> {showForm ? 'Tutup' : 'Baru'}</button>
        </div>
      </div>

      {/* FORM INPUT (TAB BIODATA & KEUANGAN) */}
      {showForm && (
        <div className="bg-white rounded-xl border shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-blue-50 p-4 flex justify-between items-center border-b border-blue-100">
             <h3 className="font-bold text-blue-800">{isEditing ? 'Edit Data' : 'Pendaftaran Siswa Baru'}</h3>
             <button onClick={resetForm}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
          </div>

          <form onSubmit={handleSave} className="p-6">
            <div className="flex border-b mb-6">
              <button type="button" onClick={()=>setActiveTab('biodata')} className={`px-4 py-2 font-bold ${activeTab==='biodata'?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>1. Biodata Lengkap</button>
              <button type="button" onClick={()=>setActiveTab('keuangan')} className={`px-4 py-2 font-bold ${activeTab==='keuangan'?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>2. Paket & Pembayaran</button>
            </div>

            {/* TAB 1: BIODATA (Data Lengkap) */}
            {activeTab === 'biodata' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
                <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
                <div><label className="lbl">Gender</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                <div><label className="lbl">Tempat Lahir</label><input className="inp" value={formData.pob} onChange={e=>setFormData({...formData,pob:e.target.value})}/></div>
                <div><label className="lbl">Tanggal Lahir</label><input type="date" className="inp" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/></div>
                <div className="md:col-span-2 border-t pt-2 mt-2"><label className="lbl text-blue-600">Data Sekolah & Ortu</label></div>
                <div><label className="lbl">Nama Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
                <div className="flex gap-2"><div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div><div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div></div>
                <div><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
                <div><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
                <div className="md:col-span-2 bg-green-50 p-2 rounded border border-green-200"><label className="lbl text-green-700">No WA (Wajib utk Tagihan)</label><input required className="inp border-green-300" placeholder="08xxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
                <button type="button" onClick={()=>setActiveTab('keuangan')} className="btn-next md:col-span-2">Lanjut ke Pembayaran &rarr;</button>
              </div>
            )}

            {/* TAB 2: KEUANGAN (AUTO HITUNG) */}
            {activeTab === 'keuangan' && (
              <div className="space-y-4">
                {/* PILIH PAKET (INI YANG TADI HILANG, SAYA KEMBALIKAN) */}
                <div className="bg-white p-4 border rounded shadow-sm">
                  <h4 className="font-bold text-gray-700 border-b pb-2 mb-3 flex gap-2"><Calculator size={18}/> PILIH PAKET BIMBEL</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="lbl">Jenjang (Sesuai Biodata)</label>
                      <input disabled className="inp bg-gray-100 font-bold" value={formData.schoolLevel} />
                    </div>
                    <div>
                      <label className="lbl">Durasi Paket</label>
                      <select className="inp font-bold bg-blue-50 text-blue-800" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration:e.target.value})}>
                        <option value="1">1 Bulan</option>
                        <option value="3">3 Bulan</option>
                        <option value="6">6 Bulan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div className="bg-blue-50 p-4 border border-blue-200 rounded-xl">
                    <h4 className="font-bold text-blue-900 border-b border-blue-200 pb-2 mb-3">RINCIAN TAGIHAN OTOMATIS</h4>
                    
                    {/* CHECKBOX BIAYA DAFTAR (KEMBALI MUNCUL) */}
                    <div onClick={() => setIncludeRegFee(!includeRegFee)} className="flex items-center gap-2 cursor-pointer mb-3 bg-white p-2 rounded border">
                      {includeRegFee ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-gray-400"/>}
                      <div>
                        <span className="text-sm font-bold text-gray-700">Tambah Biaya Pendaftaran?</span>
                        <div className="text-xs text-gray-500">Otomatis tambah Rp {formatRupiah(prices?.pendaftaran||0)}</div>
                      </div>
                    </div>

                    {/* TOTAL */}
                    <div className="flex justify-between items-center mb-4 bg-blue-100 p-3 rounded">
                      <span className="font-bold text-blue-900">TOTAL YANG HARUS DIBAYAR:</span>
                      <span className="text-2xl font-black text-blue-800">Rp {formatRupiah(calculateFinancials().total)}</span>
                    </div>

                    {/* INPUT BAYAR */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="lbl">Bayar Sekarang (DP/Lunas)</label>
                        <input className="inp font-bold text-lg" placeholder="Rp 0" value={dpAmountStr} onChange={e => setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/>
                        <div className="flex gap-1 mt-1">
                          <button type="button" onClick={()=>setDpAmountStr("0")} className="text-[10px] bg-white border px-2 py-1 rounded">Nanti</button>
                          <button type="button" onClick={()=>setDpAmountStr(formatRupiah(calculateFinancials().total))} className="text-[10px] bg-green-100 text-green-700 border px-2 py-1 rounded font-bold">Lunas</button>
                        </div>
                      </div>
                      <div>
                        <label className="lbl">Sisa Hutang</label>
                        <div className={`text-xl font-black ${calculateFinancials().sisaHutang > 0 ? 'text-red-600' : 'text-green-600'}`}>Rp {formatRupiah(calculateFinancials().sisaHutang)}</div>
                      </div>
                    </div>

                    {/* SETTING CICILAN (KALAU ADA SISA) */}
                    {calculateFinancials().sisaHutang > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <label className="lbl text-orange-700 mb-2">Pengaturan Cicilan (Jatuh Tempo)</label>
                        <div className="flex gap-2">
                          <input type="date" className="inp w-1/2" value={startDate} onChange={e=>setStartDate(e.target.value)} title="Tanggal Mulai Tagihan"/>
                          <select className="inp w-1/2" value={installmentPlan} onChange={e=>setInstallmentPlan(parseInt(e.target.value))}>
                            {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}x Kali Bayar</option>)}
                          </select>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 italic">Sistem akan otomatis membuat {installmentPlan} invoice jatuh tempo bulanan mulai {startDate}.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={resetForm} className="flex-1 py-3 bg-white border rounded font-bold text-gray-500">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded font-bold shadow-lg hover:bg-blue-700">
                    {isEditing ? 'SIMPAN PERUBAHAN' : 'PROSES PENDAFTARAN'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* LIST SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {students.map(s => (
          <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md">
            <div>
              <div className="font-bold text-gray-800">{s.name}</div>
              <div className="text-xs text-gray-500">{s.schoolLevel} - {s.schoolName}</div>
              <div className="text-[10px] text-gray-400 mt-1">WA: {s.emergencyWAPhone || '-'}</div>
            </div>
            <div className="flex gap-2">
              <a href={generateWALink(s.emergencyWAPhone, s.name)} target="_blank" className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"><MessageCircle size={16}/></a>
              <button onClick={()=>handleEditClick(s)} className="p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"><Edit size={16}/></button>
              <button onClick={()=>handleDelete(s.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.lbl{font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:4px}.inp{width:100%;border:1px solid #d1d5db;padding:8px;border-radius:6px;font-size:0.9rem}.btn-next{width:100%;padding:12px;border-radius:8px;font-weight:bold;margin-top:10px;background:#eff6ff;color:#1d4ed8;border:1px solid #dbeafe}`}</style>
    </div>
  );
}