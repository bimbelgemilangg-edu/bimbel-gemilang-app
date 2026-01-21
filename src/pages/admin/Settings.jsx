import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings as SettingsIcon, Save, Lock, ShieldCheck, UserCheck } from 'lucide-react';

export default function AdminSettings({ db }) {
  const [prices, setPrices] = useState({ sd_1: 0, sd_3: 0, sd_6: 0, smp_1: 0, smp_3: 0, smp_6: 0, pendaftaran: 0 });
  const [adminPass, setAdminPass] = useState("");
  const [ownerPass, setOwnerPass] = useState(""); // State baru untuk Password Owner
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    getDoc(doc(db, "settings", "auth")).then(s => s.exists() && setAdminPass(s.data().password));
    // Ambil Password Owner
    getDoc(doc(db, "settings", "owner_auth")).then(s => {
      if(s.exists()) setOwnerPass(s.data().password);
      else setOwnerPass("2003"); // Default jika belum ada
    });
  }, [db]);

  const savePrices = async (e) => {
    e.preventDefault();
    setLoading(true);
    await setDoc(doc(db, "settings", "prices"), prices);
    setLoading(false);
    alert("Harga Berhasil Disimpan!");
  };

  const saveAdminPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    await setDoc(doc(db, "settings", "auth"), { password: adminPass });
    setLoading(false);
    alert("Sandi Admin Diperbarui!");
  };

  const saveOwnerPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    await setDoc(doc(db, "settings", "owner_auth"), { password: ownerPass });
    setLoading(false);
    alert("Sandi Owner (Keuangan) Berhasil Diperbarui!");
  };

  return (
    <div className="space-y-10 w-full max-w-[1400px] mx-auto pb-20">
      {/* HARGA PAKET */}
      <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <h2 className="text-3xl font-black mb-8 flex items-center gap-4 text-blue-600"><SettingsIcon size={32}/> Konfigurasi Biaya</h2>
        <form onSubmit={savePrices} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.keys(prices).map((key) => (
            <div key={key} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{key.replace("_", " ")}</label>
              <input type="number" className="w-full border-4 border-gray-50 p-4 rounded-2xl font-black text-xl outline-none" value={prices[key]} onChange={e => setPrices({...prices, [key]: parseInt(e.target.value)})}/>
            </div>
          ))}
          <button className="md:col-span-3 bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Update Harga</button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SANDI ADMIN */}
        <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-400"><Lock/> Sandi Masuk Admin</h2>
          <form onSubmit={saveAdminPassword} className="space-y-4">
            <input type="text" className="w-full bg-white/10 border border-white/20 p-4 rounded-xl font-mono text-xl outline-none" value={adminPass} onChange={e => setAdminPass(e.target.value)}/>
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase">Update Sandi Admin</button>
          </form>
        </section>

        {/* SANDI OWNER (BARU) */}
        <section className="bg-slate-950 p-10 rounded-[3rem] shadow-2xl text-white border-t-8 border-red-600">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-red-500"><UserCheck/> Sandi Otoritas Owner</h2>
          <p className="text-[10px] opacity-50 mb-4 uppercase font-bold tracking-widest">Digunakan untuk mengedit/menghapus mutasi keuangan</p>
          <form onSubmit={saveOwnerPassword} className="space-y-4">
            <input type="text" className="w-full bg-white/10 border border-white/20 p-4 rounded-xl font-mono text-xl outline-none focus:border-red-500" value={ownerPass} onChange={e => setOwnerPass(e.target.value)}/>
            <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase">Update Sandi Owner</button>
          </form>
        </section>
      </div>
    </div>
  );
}