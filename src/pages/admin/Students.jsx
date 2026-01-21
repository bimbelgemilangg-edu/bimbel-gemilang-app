// --- FILE: src/pages/admin/Students.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';
import { GraduationCap, Plus, Save, UserPlus } from 'lucide-react';

export default function AdminStudents({ db }) {
  const [students, setStudents] = useState([]);
  const [prices, setPrices] = useState(null); // Ini tempat nyimpen harga dari Settings
  
  // State Form Pendaftaran
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", 
    parentJob: "", 
    level: "SD", // Default
    packageDuration: "1" // Default 1 bulan
  });

  // 1. Ambil Data Siswa & Data HARGA dari Settings (Fungsi yang kamu tanyakan tadi)
  useEffect(() => {
    // Ambil List Siswa
    const unsubStudents = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), (snap) => {
      setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    // Ambil Harga Paket (Logika Settings bekerja disini!)
    getDoc(doc(db, "settings", "prices")).then(snap => {
      if(snap.exists()) setPrices(snap.data());
    });

    return () => unsubStudents();
  }, [db]);

  // 2. Fungsi Daftar Siswa + AUTO INVOICE
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!prices) return alert("Setting Harga belum dimuat! Refresh halaman.");

    // Hitung Harga Otomatis berdasarkan Pilihan
    // Contoh key: 'sd_1', 'smp_3'
    const priceKey = `${formData.level.toLowerCase()}_${formData.packageDuration}`;
    const packagePrice = prices[priceKey] || 0;
    const registrationFee = prices.pendaftaran || 0;
    const totalBill = packagePrice + registrationFee;

    if (totalBill === 0) return alert("Harga paket 0? Cek menu Settings dulu!");

    try {
      await runTransaction(db, async (transaction) => {
        // A. Simpan Data Siswa
        const studentRef = doc(collection(db, "students"));
        transaction.set(studentRef, {
          name: formData.name,
          parentJob: formData.parentJob,
          level: formData.level,
          grade: formData.packageDuration + " Bulan", // Simpan durasi paket
          createdAt: serverTimestamp()
        });

        // B. OTOMATIS BIKIN TAGIHAN (INVOICE) 
        // Admin tidak perlu ketik angka manual!
        const invoiceRef = doc(collection(db, "invoices"));
        transaction.set(invoiceRef, {
          studentId: studentRef.id,
          studentName: formData.name,
          totalAmount: totalBill,
          remainingAmount: totalBill,
          status: 'unpaid',
          type: 'pendaftaran_awal',
          dueDate: new Date().toISOString().split('T')[0], // Jatuh tempo hari ini
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

      {/* FORM PENDAFTARAN OTOMATIS */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-blue-800 mb-4">Formulir Pendaftaran & Tagihan Otomatis</h3>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Nama */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap Siswa</label>
              <input required className="w-full border p-2 rounded mt-1" placeholder="Contoh: Budi Santoso"
                value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Input Pekerjaan Ortu */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Pekerjaan Orang Tua</label>
              <input className="w-full border p-2 rounded mt-1" placeholder="Contoh: Wiraswasta"
                value={formData.parentJob} onChange={e=>setFormData({...formData, parentJob: e.target.value})}
              />
            </div>

            {/* PILIH PAKET (KUNCI OTOMATISASI) */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Jenjang Sekolah</label>
              <select className="w-full border p-2 rounded mt-1 font-bold" value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})}>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Durasi Paket Bimbel</label>
              <select className="w-full border p-2 rounded mt-1 font-bold" value={formData.packageDuration} onChange={e=>setFormData({...formData, packageDuration: e.target.value})}>
                <option value="1">1 Bulan</option>
                <option value="3">3 Bulan</option>
              </select>
            </div>

            {/* PREVIEW HARGA (Supaya Admin yakin) */}
            <div className="col-span-2 bg-white p-3 rounded border border-blue-200 mt-2">
              <p className="text-xs text-gray-500 text-center">Estimasi Tagihan Otomatis (Sesuai Settings)</p>
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

      {/* LIST SISWA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {students.map(s => (
          <div key={s.id} className="p-4 border rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="font-bold text-gray-800">{s.name}</div>
              <div className="text-xs text-gray-500 mt-1 flex gap-2">
                <span className="bg-gray-100 px-2 py-0.5 rounded">{s.level}</span>
                <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">{s.parentJob || "No Data"}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Terdaftar sejak</span>
              <span className="text-xs font-mono">{s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}