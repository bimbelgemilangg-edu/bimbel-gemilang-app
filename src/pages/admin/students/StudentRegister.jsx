import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Save, X, Calculator, ArrowLeft, ArrowRight, Calendar } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function StudentRegister({ db, onCancel, onSuccess }) {
  const [step, setStep] = useState(1); 
  const [prices, setPrices] = useState(null);
  
  // FORM DATA UTAMA
  const [formData, setFormData] = useState({
    name: "", nickname: "", pob: "", dob: "", gender: "L",
    schoolName: "", schoolLevel: "SD", schoolGrade: "1",
    studentPhone: "", address: "", 
    fatherName: "", fatherJob: "", motherName: "", motherJob: "", emergencyWAPhone: "", // Added Jobs
    packageDuration: "1"
  });

  // STATE KEUANGAN
  const [includeRegFee, setIncludeRegFee] = useState(true);
  const [discountStr, setDiscountStr] = useState("0"); // Diskon
  const [paymentType, setPaymentType] = useState("Lunas"); // 'Lunas' | 'Cicilan'
  const [installmentMonths, setInstallmentMonths] = useState(1); // 1, 2, 3
  const [dpAmountStr, setDpAmountStr] = useState("");
  
  // STATE TANGGAL CICILAN (Array of Dates)
  const [dueDates, setDueDates] = useState([new Date().toISOString().split('T')[0]]);

  useEffect(() => {
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
  }, [db]);

  // Efek Otomatis Atur Tanggal Cicilan
  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < installmentMonths; i++) {
      const d = new Date(today);
      d.setMonth(today.getMonth() + i + 1); // Bulan depan, depannya lagi, dst
      dates.push(d.toISOString().split('T')[0]);
    }
    setDueDates(dates);
  }, [installmentMonths]);

  // Hitung-hitungan Duit
  const calculateFinancials = () => {
    if (!prices) return { total: 0, sisa: 0 };
    
    const priceKey = `${formData.schoolLevel.toLowerCase()}_${formData.packageDuration}`;
    const basePrice = prices[priceKey] || 0;
    const regFee = includeRegFee ? (prices.pendaftaran || 0) : 0;
    const discount = parseRupiah(discountStr);
    
    const grandTotal = Math.max(0, basePrice + regFee - discount);
    
    // Jika Lunas, DP = Total. Jika Cicilan, DP = Input User
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

    if (paymentType === 'Cicilan' && fin.remaining <= 0) {
      return alert("Jika Cicilan, harus ada sisa hutang! Ubah ke Lunas jika sudah bayar semua.");
    }

    try {
      await runTransaction(db, async (t) => {
        // 1. SIMPAN DATA SISWA
        const studentRef = doc(collection(db, "students"));
        t.set(studentRef, { 
          ...formData, 
          status: 'active', 
          joinedAt: new Date().toISOString().split('T')[0], 
          createdAt: serverTimestamp() 
        });

        // 2. SIMPAN PEMASUKAN (UANG DITERIMA HARI INI)
        if (fin.paidNow > 0) {
          const payRef = doc(collection(db, "payments"));
          t.set(payRef, { 
            studentName: formData.name, 
            amount: fin.paidNow, 
            method: 'Tunai', 
            type: 'income',
            category: 'Pendaftaran', 
            description: `Pembayaran Awal (${formData.name})`,
            date: serverTimestamp() 
          });
        }

        // 3. SIMPAN TUNGGAKAN (INVOICE)
        // Jika Lunas -> Tidak buat invoice (atau buat status paid jika mau record, tapi disini kita skip biar bersih)
        // Jika Cicilan -> Pecah invoice sesuai jumlah bulan
        if (fin.remaining > 0 && paymentType === 'Cicilan') {
          const amountPerMonth = Math.ceil(fin.remaining / installmentMonths);
          
          for (let i = 0; i < installmentMonths; i++) {
            // Hitung nominal (bulan terakhir adjustment biar pas)
            let currentAmount = amountPerMonth;
            if (i === installmentMonths - 1) {
              currentAmount = fin.remaining - (amountPerMonth * (installmentMonths - 1));
            }

            const invRef = doc(collection(db, "invoices"));
            t.set(invRef, { 
              studentId: studentRef.id, 
              studentName: formData.name, 
              totalAmount: currentAmount, 
              remainingAmount: currentAmount, 
              status: 'unpaid', 
              dueDate: dueDates[i], // Tanggal Jatuh Tempo sesuai inputan guru
              details: `Cicilan ${i+1}/${installmentMonths} Paket Belajar`, 
              createdAt: serverTimestamp() 
            });
          }
        }
      });
      alert("Pendaftaran Berhasil & Keuangan Tercatat!");
      onSuccess();
    } catch (err) { alert("Error: " + err.message); }
  };

  const financials = calculateFinancials();

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
      {/* Header */}
      <div className="bg-blue-600 p-8 flex justify-between items-center text-white">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Pendaftaran Siswa</h2>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Langkah {step} dari 3</p>
        </div>
        <button onClick={onCancel} className="bg-white/20 p-3 rounded-full hover:bg-red-500 transition-all"><X size={24}/></button>
      </div>

      <form onSubmit={handleSave} className="p-10 space-y-6">
        
        {/* STEP 1: DATA SISWA */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="col-span-2"><label className="lbl">Nama Lengkap</label><input required className="inp text-xl uppercase" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})}/></div>
              <div><label className="lbl">Panggilan</label><input className="inp" value={formData.nickname} onChange={e=>setFormData({...formData,nickname:e.target.value})}/></div>
              <div><label className="lbl">Gender</label><select className="inp" value={formData.gender} onChange={e=>setFormData({...formData,gender:e.target.value})}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div className="col-span-2"><label className="lbl">Alamat Siswa</label><input className="inp" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/></div>
              <div><label className="lbl">Sekolah</label><input className="inp" value={formData.schoolName} onChange={e=>setFormData({...formData,schoolName:e.target.value})}/></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="lbl">Jenjang</label><select className="inp" value={formData.schoolLevel} onChange={e=>setFormData({...formData,schoolLevel:e.target.value})}><option>SD</option><option>SMP</option></select></div>
                <div className="flex-1"><label className="lbl">Kelas</label><input className="inp" value={formData.schoolGrade} onChange={e=>setFormData({...formData,schoolGrade:e.target.value})}/></div>
              </div>
            </div>
            <div className="flex justify-end pt-4"><button type="button" onClick={()=>setStep(2)} className="btn-next">Lanjut Orang Tua <ArrowRight/></button></div>
          </div>
        )}

        {/* STEP 2: ORANG TUA (LENGKAP) */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <div><label className="lbl">Nama Ayah</label><input className="inp" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
              <div><label className="lbl">Pekerjaan Ayah</label><input className="inp" value={formData.fatherJob} onChange={e=>setFormData({...formData,fatherJob:e.target.value})}/></div>
              
              <div><label className="lbl">Nama Ibu</label><input className="inp" value={formData.motherName} onChange={e=>setFormData({...formData,motherName:e.target.value})}/></div>
              <div><label className="lbl">Pekerjaan Ibu</label><input className="inp" value={formData.motherJob} onChange={e=>setFormData({...formData,motherJob:e.target.value})}/></div>
              
              <div className="col-span-2 bg-green-50 p-6 rounded-2xl border border-green-200">
                <label className="lbl text-green-700">Nomor WhatsApp (Wajib untuk Tagihan)</label>
                <input required className="inp bg-white border-green-200 text-green-800 text-2xl font-black" placeholder="08xxxxxxxx" value={formData.emergencyWAPhone} onChange={e=>setFormData({...formData,emergencyWAPhone:e.target.value})}/>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={()=>setStep(1)} className="btn-back"><ArrowLeft/></button>
              <button type="button" onClick={()=>setStep(3)} className="btn-next">Lanjut Keuangan <ArrowRight/></button>
            </div>
          </div>
        )}

        {/* STEP 3: KEUANGAN (LUNAS / CICILAN) */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* KOLOM KIRI: KONFIGURASI HARGA */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <label className="lbl">1. Pilih Paket</label>
                  <select className="inp text-lg mb-4" value={formData.packageDuration} onChange={e=>setFormData({...formData,packageDuration:e.target.value})}>
                    <option value="1">1 Bulan (Reguler)</option>
                    <option value="3">3 Bulan (Hemat)</option>
                    <option value="6">6 Bulan (Semester)</option>
                  </select>
                  
                  <label className="lbl">2. Tambahan & Diskon</label>
                  <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={()=>setIncludeRegFee(!includeRegFee)}>
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${includeRegFee?'bg-blue-600 border-blue-600':'border-slate-300'}`}>{includeRegFee && <div className="w-2 h-2 bg-white rounded-full"></div>}</div>
                    <span className="text-xs font-bold uppercase">Biaya Pendaftaran (+ Rp {formatRupiah(prices?.pendaftaran||0)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Diskon:</span>
                    <input className="border-b-2 border-slate-300 bg-transparent font-bold w-full outline-none focus:border-blue-500" placeholder="0" value={discountStr} onChange={e=>setDiscountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <label className="lbl">3. Metode Pembayaran</label>
                  <div className="flex gap-2 mb-4">
                    <button type="button" onClick={()=>{setPaymentType('Lunas'); setInstallmentMonths(1);}} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${paymentType==='Lunas'?'bg-green-600 text-white shadow-lg':'bg-white border hover:bg-gray-50'}`}>Lunas</button>
                    <button type="button" onClick={()=>setPaymentType('Cicilan')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${paymentType==='Cicilan'?'bg-orange-500 text-white shadow-lg':'bg-white border hover:bg-gray-50'}`}>Cicilan</button>
                  </div>

                  {paymentType === 'Cicilan' && (
                    <div className="animate-in slide-in-from-top-2">
                      <label className="lbl">Jumlah Termin (Bulan)</label>
                      <select className="inp mb-4" value={installmentMonths} onChange={e=>setInstallmentMonths(parseInt(e.target.value))}>
                        <option value="2">2 Kali Bayar</option>
                        <option value="3">3 Kali Bayar</option>
                      </select>
                      
                      <label className="lbl text-orange-600">Atur Jatuh Tempo Per Bulan:</label>
                      <div className="space-y-2">
                        {dueDates.slice(0, installmentMonths).map((date, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-16">Cicilan {idx+1}</span>
                            <input type="date" className="inp py-2 text-xs" value={date} onChange={(e)=>handleDateChange(idx, e.target.value)}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: RINGKASAN TAGIHAN */}
              <div className="flex flex-col h-full">
                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/20 pb-4">Rincian Biaya</h3>
                    <div className="space-y-2 text-sm font-medium opacity-80">
                      <div className="flex justify-between"><span>Paket Belajar</span><span>Rp {formatRupiah(financials.basePrice)}</span></div>
                      <div className="flex justify-between"><span>Pendaftaran</span><span>+ Rp {formatRupiah(financials.regFee)}</span></div>
                      <div className="flex justify-between text-yellow-400"><span>Diskon</span><span>- Rp {formatRupiah(financials.discount)}</span></div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase tracking-widest">Total Tagihan</span>
                        <span className="text-4xl font-black">Rp {formatRupiah(financials.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    {paymentType === 'Lunas' ? (
                      <div className="bg-green-600 p-4 rounded-2xl text-center font-black uppercase text-xs tracking-widest">LUNAS - Uang Diterima Full</div>
                    ) : (
                      <div className="bg-white p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Uang Diterima Hari Ini (DP)</label>
                        <input className="w-full text-2xl font-black text-blue-600 outline-none" placeholder="Rp 0" value={dpAmountStr} onChange={e=>setDpAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-between items-center px-2">
                      <span className="text-xs font-bold uppercase text-slate-400">Sisa Hutang (Masuk Piutang)</span>
                      <span className="text-xl font-black text-red-400">Rp {formatRupiah(financials.remaining)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <button type="button" onClick={()=>setStep(2)} className="btn-back"><ArrowLeft/></button>
              <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 flex gap-2 items-center"><Save size={20}/> Proses Pendaftaran</button>
            </div>
          </div>
        )}
      </form>

      <style>{`
        .lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block; }
        .inp { width: 100%; padding: 14px; border: 2px solid #e2e8f0; border-radius: 16px; font-weight: 700; color: #1e293b; outline: none; }
        .inp:focus { border-color: #2563eb; background: #eff6ff; }
        .btn-next { background-color: #0f172a; color: white; padding: 16px 32px; border-radius: 16px; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-next:hover { background-color: #2563eb; }
        .btn-back { background-color: #f1f5f9; color: #64748b; padding: 16px 32px; border-radius: 16px; font-weight: 900; }
        .btn-back:hover { background-color: #e2e8f0; }
      `}</style>
    </div>
  );
}