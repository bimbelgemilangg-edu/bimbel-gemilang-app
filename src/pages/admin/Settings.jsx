import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings as SettingsIcon, Save, Lock, ShieldCheck } from 'lucide-react';

export default function AdminSettings({ db }) {
  const [prices, setPrices] = useState({ sd_1: 0, sd_3: 0, sd_6: 0, smp_1: 0, smp_3: 0, smp_6: 0, pendaftaran: 0 });
  const [adminPass, setAdminPass] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    getDoc(doc(db, "settings", "auth")).then(s => s.exists() && setAdminPass(s.data().password));
  }, [db]);

  const savePrices = async (e) => {
    e.preventDefault();
    setLoading(true);
    await setDoc(doc(db, "settings", "prices"), prices);
    setLoading(false);
    alert("Harga Berhasil Disimpan!");
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (adminPass.length < 5) return alert("Sandi minimal 5 karakter!");
    setLoading(true);
    await setDoc(doc(db, "settings", "auth"), { password: adminPass });
    setLoading(false);
    alert("Sandi Admin Berhasil Diubah!");
  };

  return (
    <div className="space-y-10 max-w-[1200px] mx-auto">
      {/* PENGATURAN HARGA */}
      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-blue-600"><SettingsIcon/> Pengaturan Biaya Paket</h2>
        <form onSubmit={savePrices} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.keys(prices).map((key) => (
            <div key={key}>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">{key.replace("_", " ")} (Rp)</label>
              <input type="number" className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold focus:border-blue-500 outline-none" value={prices[key]} onChange={e => setPrices({...prices, [key]: parseInt(e.target.value)})}/>
            </div>
          ))}
          <div className="md:col-span-3 pt-4">
            <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
              <Save size={20}/> {loading ? 'Menyimpan...' : 'Simpan Perubahan Harga'}
            </button>
          </div>
        </form>
      </section>

      {/* PENGATURAN KEAMANAN (FITUR BARU) */}
      <section className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white">
        <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-yellow-400"><Lock/> Keamanan Akses Admin</h2>
        <form onSubmit={savePassword} className="max-w-md space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase opacity-50 block mb-2">Sandi Baru Admin</label>
            <input 
              type="text" 
              className="w-full bg-white/10 border border-white/20 p-4 rounded-xl font-mono text-xl outline-none focus:border-yellow-400 transition-all"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              placeholder="Masukkan Sandi Baru..."
            />
          </div>
          <button disabled={loading} className="w-full bg-yellow-500 text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-400 flex items-center justify-center gap-2">
            <ShieldCheck size={20}/> Update Sandi Admin
          </button>
          <p className="text-[10px] opacity-40 italic mt-2">*Hati-hati, setelah diubah sandi lama tidak berlaku lagi.</p>
        </form>
      </section>
    </div>
  );
}