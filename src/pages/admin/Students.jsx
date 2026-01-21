import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { GraduationCap, UserPlus, Save, Trash2, Edit, X, CheckSquare, Square, Smartphone, MessageCircle, Calendar } from 'lucide-react';

// --- HELPER ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;
const generateWALink = (phone, name) => {
  if (!phone) return "#";
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.substring(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(`Halo Wali Murid *${name}*, kami dari Admin Bimbel...`)}`;
};

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  // State UI
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState('siswa'); 

  // Data Form
  const initialForm = {
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "",
    fatherName: "", fatherJob: "", fatherPhone: "",
    motherName: "", motherJob: "", motherPhone: "",
    emergencyWAPhone: "", packageDuration: "1" 
  };
  const [formData, setFormData] = useState(initialForm);

  // State Keuangan
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [dpAmountStr, setDpAmountStr] = useState(""); 
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  
  // FITUR BARU: TANGGAL & DURASI CICILAN
  const [installmentPlan, setInstallmentPlan] = useState(1); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default hari ini

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    return () => unsub();
  }, [db]);

  const calculateFinancials = () => {
    if (!prices) return { total: 0, sisaHutang: 0 };
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const total = (prices[priceKey] || 0) + (includeRegFee ? (prices.pendaftaran || 0) : 0);
    const bayar = parseRupiah(dpAmountStr);
    return { total, bayar, sisaHutang: total - bayar };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await updateDoc(doc(db, "students", editId), formData);
      alert("Data Update!"); resetForm(); return;
    }
    if (!prices) return alert("Harga error");
    
    const fin = calculateFinancials();
    if (fin.sisaHutang < 0) return alert("Bayar kelebihan!");

    try {
      await runTransaction(db, async (t) => {
        // 1. Save Siswa
        const sRef = doc(collection(db, "students"));
        t.set(sRef, { ...formData, status: 'active', joinedAt: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });

        // 2. Save Payment (DP)
        if (fin.bayar > 0) {
          t.set(doc(collection(db, "payments")), {
            studentName: formData.name, amount: fin.bayar, method: paymentMethod,
            date: serverTimestamp(), category: 'Pendaftaran', description: 'Pembayaran Awal'
          });
        }

        // 3. LOGIKA CICILAN + TANGGAL CUSTOM
        if (fin.sisaHutang > 0) {
          const perMonth = Math.ceil(fin.sisaHutang / installmentPlan);
          for (let i = 0; i < installmentPlan; i++) {
            // Hitung Tanggal Jatuh Tempo Berurutan
            const due = new Date(startDate);
            due.setMonth(due.getMonth() + i); // Tambah bulan sesuai urutan
            
            let amount = perMonth;
            if (i === installmentPlan - 1) amount = fin.sisaHutang - (perMonth * (installmentPlan - 1)); // Koreksi selisih

            t.set(doc(collection(db, "invoices")), {
              studentId: sRef.id, studentName: formData.name,
              totalAmount: amount, remainingAmount: amount, status: 'unpaid', type: 'cicilan',
              dueDate: due.toISOString().split('T')[0], // TANGGAL CUSTOM DISIMPAN DISINI
              details: `Cicilan ${i+1}/${installmentPlan} - Paket ${formData.schoolLevel}`,
              waPhone: formData.emergencyWAPhone, // SIMPAN NO WA DI INVOICE AGAR BISA DIPANGGIL DI DASHBOARD
              createdAt: serverTimestamp()
            });
          }
        }
      });
      alert("Siswa Terdaftar & Tagihan Terjadwal!"); resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => { if(confirm("Hapus?")) await deleteDoc(doc(db, "students", id)); };
  const resetForm = () => { setShowForm(false); setIsEditing(false); setEditId(null); setFormData(initialForm); setIncludeRegFee(true); setDpAmountStr(""); setStartDate(new Date().toISOString().split('T')[0]); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
        <h2 className="font-bold text-xl flex gap-2"><GraduationCap className="text-blue-600"/> Data Siswa</h2>
        <button onClick={()=>{resetForm(); setShowForm(!showForm)}} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex gap-2 hover:bg-blue-700"><UserPlus size={18}/> {showForm ? 'Tutup' : 'Baru'}</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border shadow-lg p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex border-b mb-4">
            {['siswa','ortu','paket'].map(t=><button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 font-bold capitalize ${activeTab===t?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>{t}</button>)}
          </div>
          <form onSubmit={handleSave}>
            {activeTab==='siswa' && <div className="grid md:grid-cols-2 gap-4">
              <input required className="inp md:col-span-2" placeholder="Nama Lengkap" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/>
              <input className="inp" placeholder="Panggilan" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/>
              <select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select>
              <input className="inp" placeholder="Tempat Lahir" value={formData.pob} onChange={e=>setFormData({...formData,pob:e.target.value})}/>
              <input type="date" className="inp" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/>
              <input className="inp" placeholder="Sekolah" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/>
              <div className="flex gap-2"><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select><input className="inp" placeholder="Kelas" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div>
              <textarea className="inp md:col-span-2" placeholder="Alamat" rows="2" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/>
              <button type="button" onClick={()=>setActiveTab('ortu')} className="btn-next md:col-span-2">Lanjut</button>
            </div>}

            {activeTab==='ortu' && <div className="grid md:grid-cols-2 gap-4">
              <input className="inp" placeholder="Nama Ayah" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/>
              <input className="inp" placeholder="Kerjaan Ayah" value={formData.fatherJob} onChange={e=>setFormData({...formData,fatherJob:e.target.value})}/>
              <input className="inp" placeholder="Nama Ibu" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/>
              <input className="inp" placeholder="Kerjaan Ibu" value={formData.motherJob} onChange={e=>setFormData({...formData,motherJob:e.target.value})}/>
              <div className="md:col-span-2 bg-green-50 p-2 rounded border border-green-200"><label className="text-xs font-bold text-green-700">No WA Aktif (Wajib)</label><input required className="inp border-green-300" placeholder="08xxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
              <button type="button" onClick={()=>setActiveTab('paket')} className="btn-next md:col-span-2">Lanjut Pembayaran</button>
            </div>}

            {activeTab==='paket' && <div className="space-y-4">
              {!isEditing ? (
                <div className="bg-gray-50 p-4 rounded border">
                  <div className="flex justify-between mb-4"><span className="font-bold text-gray-600">TOTAL:</span><span className="text-xl font-black text-blue-800">Rp {formatRupiah(calculateFinancials().total)}</span></div>
                  
                  {/* INPUT BAYAR */}
                  <label className="text-xs font-bold text-blue-700">Bayar Sekarang (DP)</label>
                  <input type="text" className="w-full text-xl font-bold p-2 border-b-2 border-blue-600 outline-none bg-transparent" placeholder="Rp 0" value={dpAmountStr} onChange={e => setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/>
                  
                  {/* PENGATURAN CICILAN (TANGGAL & DURASI) */}
                  {calculateFinancials().sisaHutang > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                      <div className="text-xs font-bold text-orange-800 uppercase border-b border-orange-200 pb-1 mb-2">Setting Cicilan Sisa Rp {formatRupiah(calculateFinancials().sisaHutang)}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-orange-700 block">Mulai Tagihan Tgl</label>
                          <input type="date" className="w-full border p-1 rounded text-sm bg-white" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-orange-700 block">Durasi</label>
                          <select className="w-full border p-1 rounded text-sm bg-white font-bold" value={installmentPlan} onChange={e=>setInstallmentPlan(parseInt(e.target.value))}>
                            {[1,2,3,4,5,6].map(num => <option key={num} value={num}>{num}x Bulan</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="text-[10px] text-orange-600 mt-2 italic">
                        *Akan dibuat {installmentPlan} tagihan otomatis mulai tanggal {startDate}.
                      </div>
                    </div>
                  )}
                  <button className="btn-next bg-blue-600 text-white hover:bg-blue-700 mt-4">PROSES PENDAFTARAN</button>
                </div>
              ) : <button className="btn-next">SIMPAN PERUBAHAN</button>}
            </div>}
          </form>
        </div>
      )}

      {/* LIST SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {students.map(s => (
          <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm">
            <div><div className="font-bold text-gray-800">{s.name}</div><div className="text-xs text-gray-500">{s.schoolLevel} - {s.schoolGrade} • {s.emergencyWAPhone}</div></div>
            <div className="flex gap-2">
              <a href={generateWALink(s.emergencyWAPhone, s.name)} target="_blank" className="p-2 bg-green-100 text-green-600 rounded"><MessageCircle size={16}/></a>
              <button onClick={()=>{setFormData(s); setEditId(s.id); setIsEditing(true); setShowForm(true);}} className="p-2 bg-yellow-100 text-yellow-600 rounded"><Edit size={16}/></button>
              <button onClick={()=>handleDelete(s.id)} className="p-2 bg-red-100 text-red-600 rounded"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.lbl{font-size:0.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:2px}.inp{width:100%;border:1px solid #d1d5db;padding:8px;border-radius:6px;font-size:0.9rem}.btn-next{width:100%;padding:10px;border-radius:8px;font-weight:bold;margin-top:10px;background:#eff6ff;color:#1d4ed8}`}</style>
    </div>
  );
}