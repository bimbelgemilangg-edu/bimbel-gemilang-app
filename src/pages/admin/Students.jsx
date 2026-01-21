// --- FILE: src/pages/admin/Students.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';
import { GraduationCap, Plus, UserPlus } from 'lucide-react';

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", parentJob: "", 
    level: "SD", 
    packageDuration: "1"
  });

  useEffect(() => {
    const unsubStudents = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), (snap) => {
      setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    getDoc(doc(db, "settings", "prices")).then(snap => {
      if(snap.exists()) setPrices(snap.data());
    });
    return () => unsubStudents();
  }, [db]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!prices) return alert("Setting Harga belum dimuat! Refresh halaman.");

    // KUNCI: Key harus cocok dengan yang ada di Settings (sd_1, sd_6, smp_3, dll)
    const priceKey = `${formData.level.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const registrationFee = prices.pendaftaran || 0;
    const totalBill = packagePrice + registrationFee;

    if (totalBill === 0) return alert(`Harga paket ${formData.level} - ${formData.packageDuration} Bulan belum diset di Settings!`);

    try {
      await runTransaction(db, async (transaction) => {
        const studentRef = doc(collection(db, "students"));
        transaction.set(studentRef, {
          name: formData.name,
          parentJob: formData.parentJob,
          level: formData.level,
          grade: formData.packageDuration + " Bulan",
          createdAt: serverTimestamp()
        });
        const invoiceRef = doc(collection(db, "invoices"));
        transaction.set(invoiceRef, {
          studentId: studentRef.id,
          studentName: formData.name,
          totalAmount: totalBill,
          remainingAmount: totalBill,
          status: 'unpaid',
          type: 'pendaftaran_awal',
          dueDate: new Date().toISOString().split('T')[0],
          details: `Pendaftaran + Paket ${formData.level} (${formData.packageDuration} Bulan)`,
          createdAt: serverTimestamp()
        });
      });

      alert(`Siswa Terdaftar! Tagihan Rp ${totalBill.toLocaleString()} otomatis dibuat.`);
      setShowForm(false);
      setFormData({ name: "", parentJob: "", level: "SD", packageDuration: "1" });
    } catch (err) {
      console.error(err);
      alert("Gagal daftar: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><GraduationCap className="text-blue-600"/> Master Siswa</h2>
          <p className="text-xs text-gray-500">Total: {students.length} Siswa Aktif</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
          <UserPlus size={18}/> Daftar Siswa Baru
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-blue-800 mb-4">Formulir Pendaftaran & Tagihan Otomatis</h3>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap Siswa</label>
              <input required className="w-full border p-2 rounded mt-1" placeholder="Contoh: Budi Santoso"
                value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Pekerjaan Orang Tua</label>
              <input className="w-full border p-2 rounded mt-1" placeholder="Contoh: Wiraswasta"
                value={formData.parentJob} onChange={e=>setFormData({...formData, parentJob: e.target.value})}
              />
            </div>

            {/* REVISI: HANYA SD & SMP */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Jenjang Sekolah</label>
              <select className="w-full border p-2 rounded mt-1 font-bold" value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})}>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
              </select>
            </div>

            {/* REVISI: 1, 3, 6 BULAN */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Durasi Paket Bimbel</label>
              <select className="w-full border p-2 rounded mt-1 font-bold" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration: e.target.value})}>
                <option value="1">1 Bulan</option>
                <option value="3">3 Bulan</option>
                <option value="6">6 Bulan</option>
              </select>
            </div>

            <div className="col-span-2 bg-white p-3 rounded border border-blue-200 mt-2">
              <p className="text-xs text-gray-500 text-center">Estimasi Tagihan Otomatis</p>
              <p className="text-xl font-black text-center text-blue-600">
                {prices ? `Rp ${((prices[`${formData.level.toLowerCase()}_${formData.packageDuration}`]||0) + (prices.pendaftaran||0)).toLocaleString()}` : "Loading..."}
              </p>
            </div>

            <div className="col-span-2 flex gap-2">
              <button type="button" onClick={()=>setShowForm(false)} className="flex-1 py-3 text-gray-500 font-bold bg-white border rounded hover:bg-gray-50">Batal</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg">SIMPAN & BUAT TAGIHAN</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {students.map(s => (
          <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm">
            <div>
              <div className="font-bold text-gray-800">{s.name}</div>
              <div className="text-xs text-gray-500 mt-1 flex gap-2">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{s.level}</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{s.grade}</span> 
                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">{s.parentJob || "-"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}