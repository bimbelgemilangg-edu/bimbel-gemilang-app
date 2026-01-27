import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Save, X, ArrowLeft, ArrowRight } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function StudentRegister({ db, onCancel, onSuccess }) {
  const [step, setStep] = useState(1); 
  const [prices, setPrices] = useState(null);
  
  // FORM DATA
  const [formData, setFormData] = useState({
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "", 
    fatherName: "", fatherJob: "", 
    motherName: "", motherJob: "", 
    emergencyWAPhone: "", 
    packageDuration: "1"
  });

  // KEUANGAN
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [discountStr, setDiscountStr] = useState("0");
  const [paymentType, setPaymentType] = useState("Lunas"); 
  const [installmentMonths, setInstallmentMonths] = useState(1);
  const [dpAmountStr, setDpAmountStr] = useState("");
  const [dueDates, setDueDates] = useState([]);

  useEffect(() => {
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
  }, [db]);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < installmentMonths; i++) {
      const d = new Date(today);
      d.setMonth(today.getMonth() + i + 1);
      dates.push(d.toISOString().split('T')[0]);
    }
    setDueDates(dates);
  }, [installmentMonths]);

  const calculateFinancials = () => {
    if (!prices) return { total: 0, sisa: 0 };
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const basePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0;
    const discount = parseRupiah(discountStr);
    const grandTotal = Math.max(0, basePrice + regFee - discount);
    const paidNow = paymentType === 'Lunas' ? grandTotal : parseRupiah(dpAmountStr);
    const remaining = Math.max(0, grandTotal - paidNow);
    return { basePrice, regFee, discount, grandTotal, paidNow, remaining };
  };

  const handleDateChange = (index, value) => {
    const newDates = [...dueDates];
    newDates[index] = value;
    setDueDates(newDates);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fin = calculateFinancials();

    if (paymentType === 'Cicilan' && fin.remaining <= 0) return alert("Ubah ke Lunas jika sudah lunas.");
    
    try {
      await runTransaction(db, async (t) => {
        const studentRef = doc(collection(db, "students"));
        t.set(studentRef, { ...formData, status: 'active', joinedAt: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });

        if (fin.paidNow > 0) {
          const payRef = doc(collection(db, "payments"));
          t.set(payRef, { studentName: formData.name, amount: fin.paidNow, method: 'Tunai', type: 'income', category: 'Pendaftaran', description: `Pembayaran Awal (${formData.name})`, date: serverTimestamp() });
        }

        if (fin.remaining > 0 && paymentType === 'Cicilan') {
          const amountPerMonth = Math.ceil(fin.remaining / installmentMonths);
          for (let i = 0; i < installmentMonths; i++) {
            let currentAmount = (i === installmentMonths - 1) ? fin.remaining - (amountPerMonth * (installmentMonths - 1)) : amountPerMonth;
            if (currentAmount > 0) {
                const invRef = doc(collection(db, "invoices"));
                t.set(invRef, { studentId: studentRef.id, studentName: formData.name, totalAmount: currentAmount, remainingAmount: currentAmount, status: 'unpaid', dueDate: dueDates[i], details: `Cicilan ${i+1}/${installmentMonths}`, createdAt: serverTimestamp() });
            }
          }
        }
      });
      alert("Siswa Berhasil Didaftarkan!");
      onSuccess();
    } catch (err) { alert("Error: " + err.message); }
  };

  const financials = calculateFinancials();

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
      <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
        <div><h2 className="text-3xl font-black uppercase">Pendaftaran Siswa</h2><p className="text-xs font-bold uppercase mt-1">Langkah {step} dari 3</p></div>
        <button onClick={onCancel} className="bg-white/20 p-3 rounded-full hover:bg-red-500"><X size={24}/></button>
      </div>

      <form onSubmit={handleSave} className="p-10 space-y-6">
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp text-xl uppercase" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
            <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
            <div><label className="lbl">Gender</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
            <div className="col-span-2"><label className="lbl">Alamat</label><input className="inp" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/></div>
            <div><label className="lbl">Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
            <div className="flex gap-4"><div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div><div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div></div>
            <div className="col-span-2 flex justify-end pt-4"><button type="button" onClick={()=>setStep(2)} className="btn-next">Lanjut Ortu <ArrowRight/></button></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="space-y-3"><label className="lbl text-blue-600">Ayah</label><input className="inp" placeholder="Nama Ayah" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/><input className="inp" placeholder="Pekerjaan Ayah" value={formData.fatherJob} onChange={e=>setFormData({...formData,fatherJob:e.target.value})}/></div>
            <div className="space-y-3"><label className="lbl text-pink-600">Ibu</label><input className="inp" placeholder="Nama Ibu" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/><input className="inp" placeholder="Pekerjaan Ibu" value={formData.motherJob} onChange={e=>setFormData({...formData,motherJob:e.target.value})}/></div>
            <div className="col-span-2"><label className="lbl text-green-700">WhatsApp (Wajib)</label><input required className="inp border-green-200 text-green-800" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/></div>
            <div className="col-span-2 flex justify-between pt-4"><button type="button" onClick={()=>setStep(1)} className="btn-back"><ArrowLeft/></button><button type="button" onClick={()=>setStep(3)} className="btn-next">Lanjut Bayar <ArrowRight/></button></div>
          </div>
        )}

        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-3xl border">
                <label className="lbl">Paket</label><select className="inp text-lg mb-4" value={formData.packageDuration} onChange={e=>setFormData({...formData,packageDuration:e.target.value})}><option value="1">1 Bulan</option><option value="3">3 Bulan</option><option value="6">6 Bulan</option></select>
                <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold">Biaya Daftar?</span><input type="checkbox" checked={includeRegFee} onChange={e=>setIncludeRegFee(e.target.checked)} className="w-5 h-5"/></div>
                <label className="lbl text-orange-500">Diskon (Rp)</label><input className="inp font-bold text-orange-600" value={discountStr} onChange={e=>setDiscountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border">
                <div className="flex gap-2 mb-4"><button type="button" onClick={()=>{setPaymentType('Lunas');setInstallmentMonths(1)}} className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase ${paymentType==='Lunas'?'bg-green-600 text-white':'bg-white border'}`}>Lunas</button><button type="button" onClick={()=>setPaymentType('Cicilan')} className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase ${paymentType==='Cicilan'?'bg-orange-500 text-white':'bg-white border'}`}>Cicilan</button></div>
                {paymentType === 'Cicilan' && <div><label className="lbl">Tenor</label><select className="inp mb-2" value={installmentMonths} onChange={e=>setInstallmentMonths(parseInt(e.target.value))}><option value="2">2 Bulan</option><option value="3">3 Bulan</option></select>{dueDates.slice(0,installmentMonths).map((d,i)=><div key={i} className="flex gap-2 mt-2"><span className="text-[10px] w-10 font-bold mt-2">Ke-{i+1}</span><input type="date" className="inp py-1 text-xs" value={d} onChange={e=>handleDateChange(i,e.target.value)}/></div>)}</div>}
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="bg-slate-900 text-white p-6 rounded-[2rem]">
                <h3 className="text-sm font-black uppercase mb-4 opacity-70">Total Tagihan</h3>
                <p className="text-4xl font-black mb-4">Rp {formatRupiah(financials.grandTotal)}</p>
                {paymentType === 'Cicilan' && <div className="bg-white p-3 rounded-xl"><label className="text-[10px] text-black font-bold block mb-1">Bayar DP</label><input className="w-full text-2xl font-black text-blue-600 outline-none" placeholder="0" value={dpAmountStr} onChange={e=>setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/></div>}
              </div>
              <div className="flex justify-between mt-4"><button type="button" onClick={()=>setStep(2)} className="btn-back"><ArrowLeft/></button><button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase shadow-xl flex gap-2"><Save size={20}/> Simpan</button></div>
            </div>
          </div>
        )}
      </form>
      <style>{`.lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 4px; } .inp { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; font-weight: 700; outline: none; } .inp:focus { border-color: #2563eb; background: #eff6ff; } .btn-next { background: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 900; display: flex; align-items: center; gap: 8px; } .btn-back { background: #f1f5f9; color: #64748b; padding: 12px 24px; border-radius: 12px; font-weight: 900; }`}</style>
    </div>
  );
}