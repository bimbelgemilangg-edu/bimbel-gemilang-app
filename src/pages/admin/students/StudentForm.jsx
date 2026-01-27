import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Save, X, Calculator, ArrowLeft, ArrowRight } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function StudentForm({ db, initialData, onCancel, onSuccess }) {
  const isEditing = !!initialData;
  const [step, setStep] = useState(1);
  const [prices, setPrices] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "", 
    fatherName: "", motherName: "", emergencyWAPhone: "",
    packageDuration: "1"
  });

  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [dpAmountStr, setDpAmountStr] = useState("");

  useEffect(() => {
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    if (initialData) setFormData(initialData); // Load data jika edit
  }, [db, initialData]);

  const calculateTotal = () => {
    if (!prices) return 0;
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    return (prices[priceKey] || 0) + (includeRegFee ? (prices.pendaftaran || 0) : 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Mode Edit: Update Siswa Saja (Keuangan tidak diubah dari sini agar aman)
        await updateDoc(doc(db, "students", initialData.id), formData);
        alert("Data Siswa Diperbarui!");
      } else {
        // Mode Baru: Siswa + Keuangan
        const total = calculateTotal();
        const bayar = parseRupiah(dpAmountStr);
        const sisa = total - bayar;

        await runTransaction(db, async (t) => {
          const studentRef = doc(collection(db, "students"));
          t.set(studentRef, { ...formData, status: 'active', joinedAt: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
          
          if(bayar > 0) {
            const payRef = doc(collection(db, "payments"));
            t.set(payRef, { studentName: formData.name, amount: bayar, method: 'Tunai', type: 'income', category: 'Pendaftaran', description: `DP Pendaftaran (${formData.name})`, date: serverTimestamp() });
          }
          if(sisa > 0) {
            const invRef = doc(collection(db, "invoices"));
            t.set(invRef, { studentId: studentRef.id, studentName: formData.name, totalAmount: sisa, remainingAmount: sisa, status: 'unpaid', dueDate: new Date().toISOString().split('T')[0], details: 'Biaya Pendaftaran', createdAt: serverTimestamp() });
          }
        });
        alert("Siswa Baru Berhasil Didaftarkan!");
      }
      onSuccess();
    } catch (err) { alert("Error: " + err.message); }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
      <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
        <h2 className="text-3xl font-black uppercase">{isEditing ? 'Edit Data Siswa' : 'Pendaftaran Baru'}</h2>
        <button onClick={onCancel} className="bg-white/20 p-3 rounded-full hover:bg-red-500 transition-all"><X size={24}/></button>
      </div>

      <form onSubmit={handleSave} className="p-10 space-y-6">
        {/* Step 1: Biodata */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp text-xl uppercase" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
              <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
              <div><label className="lbl">Gender</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div><label className="lbl">Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div>
                <div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div>
              </div>
              <div className="col-span-2"><label className="lbl">Alamat</label><input className="inp" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/></div>
            </div>
            <div className="flex justify-end pt-4"><button type="button" onClick={()=>setStep(2)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase flex gap-2">Lanjut <ArrowRight/></button></div>
          </div>
        )}

        {/* Step 2: Ortu */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
              <div><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
              <div className="col-span-2 bg-green-50 p-6 rounded-2xl border border-green-200"><label className="lbl text-green-700">WA Darurat (Wajib)</label><input required className="inp bg-white border-green-200 text-green-800 text-2xl" placeholder="08xxxxxxxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={()=>setStep(1)} className="bg-gray-100 px-8 py-4 rounded-2xl font-black"><ArrowLeft/></button>
              {isEditing ? (
                <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase flex gap-2"><Save/> Simpan Perubahan</button>
              ) : (
                <button type="button" onClick={()=>setStep(3)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase flex gap-2">Lanjut Bayar <ArrowRight/></button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Keuangan (Hanya Mode Daftar Baru) */}
        {step === 3 && !isEditing && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
              <h3 className="text-xl font-black uppercase mb-6 flex gap-2"><Calculator className="text-blue-600"/> Kalkulasi Biaya</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div><label className="lbl">Durasi Paket</label><select className="inp text-xl" value={formData.packageDuration} onChange={e=>setFormData({...formData,packageDuration:e.target.value})}><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select></div>
                <div onClick={()=>setIncludeRegFee(!includeRegFee)} className={`p-4 rounded-2xl border-2 cursor-pointer ${includeRegFee?'bg-blue-50 border-blue-500':'bg-white'}`}><span className="font-bold uppercase text-sm">Biaya Daftar? {includeRegFee?'YA':'TIDAK'}</span></div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex justify-between items-center mb-6"><span className="text-sm font-black text-slate-400 uppercase">Total Tagihan</span><span className="text-4xl font-black text-slate-800">Rp {formatRupiah(calculateTotal())}</span></div>
                <div className="bg-white p-6 rounded-2xl border-2 border-blue-100"><label className="lbl text-blue-600">Bayar DP (Rp)</label><input className="w-full text-4xl font-black text-blue-600 outline-none" placeholder="0" value={dpAmountStr} onChange={e=>setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/></div>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={()=>setStep(2)} className="bg-gray-100 px-8 py-4 rounded-2xl font-black"><ArrowLeft/></button>
              <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase shadow-xl flex gap-2"><Save/> Proses Daftar</button>
            </div>
          </div>
        )}
      </form>
      <style>{`.lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block; } .inp { width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 16px; font-weight: 700; outline: none; } .inp:focus { border-color: #2563eb; background: #eff6ff; }`}</style>
    </div>
  );
}