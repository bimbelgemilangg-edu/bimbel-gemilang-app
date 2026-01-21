import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings as SettingsIcon, Save, Lock, UserCheck, ShieldAlert, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function AdminSettings({ db }) {
  // State Keamanan Menu
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  
  // State Data
  const [prices, setPrices] = useState({ sd_1: 0, sd_3: 0, sd_6: 0, smp_1: 0, smp_3: 0, smp_6: 0, pendaftaran: 0 });
  const [adminPass, setAdminPass] = useState("");
  const [ownerPass, setOwnerPass] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    // Load data di awal (tapi tidak ditampilkan sebelum login owner)
    getDoc(doc(db, "settings", "prices")).then(s => s.exists() && setPrices(s.data()));
    getDoc(doc(db, "settings", "auth")).then(s => s.exists() && setAdminPass(s.data().password));
    getDoc(doc(db, "settings", "owner_auth")).then(s => {
      if(s.exists()) setOwnerPass(s.data().password);
      else setOwnerPass("2003"); 
    });
  }, [db]);

  // --- VERIFIKASI PEMBUKA KUNCI PENGATURAN ---
  const handleUnlock = async (e) => {
    e.preventDefault();
    const snap = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = snap.exists() ? snap.data().password : "2003";
    
    if (ownerInput === correct) {
      setIsAuthorized(true);
    } else {
      alert("Sandi Otoritas Owner Salah! Akses Ditolak.");
      setOwnerInput("");
    }
  };

  const savePrices = async (e) => {
    e.preventDefault(); setLoading(true);
    await setDoc(doc(db, "settings", "prices"), prices);
    setLoading(false); alert("Harga Berhasil Disimpan!");
  };

  const saveAdminPassword = async (e) => {
    e.preventDefault(); setLoading(true);
    await setDoc(doc(db, "settings", "auth"), { password: adminPass });
    setLoading(false); alert("Sandi Login Admin Diperbarui!");
  };

  const saveOwnerPassword = async (e) => {
    e.preventDefault(); setLoading(true);
    await setDoc(doc(db, "settings", "owner_auth"), { password: ownerPass });
    setLoading(false); alert("Sandi Otoritas Owner Berhasil Diganti!");
  };

  // --- TAMPILAN 1: LAYAR KUNCI (GATEKEEPER) ---
  if (!isAuthorized) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center animate-in fade-in duration-500">
        <div className="bg-slate-900 w-full max-w-2xl rounded-[4rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] text-center border-b-8 border-red-600">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-lg shadow-red-500/10">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Area Terbatas Owner</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-12">Hanya pemilik yang diizinkan mengubah konfigurasi sistem</p>
          
          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="relative group">
              <input 
                autoFocus
                type={showPass ? "text" : "password"}
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="w-full bg-white/5 border-4 border-white/5 p-6 rounded-3xl text-center text-5xl font-black tracking-[0.5em] text-white outline-none focus:border-red-600 focus:bg-white/10 transition-all"
                placeholder="••••"
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={24}/> : <Eye size={24}/>}
              </button>
            </div>
            <button className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              Buka Pengaturan <ChevronRight size={28}/>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: MENU PENGATURAN UTAMA (SUDAH TERVERIFIKASI) ---
  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20 animate-in zoom-in-95 duration-500">
      
      {/* HEADER STATUS */}
      <div className="bg-green-500 p-4 rounded-3xl flex items-center justify-between px-10 text-white shadow-lg">
        <div className="flex items-center gap-4">
           <UserCheck size={24}/>
           <span className="font-black uppercase text-sm tracking-widest">Sesi Otoritas Owner Aktif</span>
        </div>
        <button onClick={() => setIsAuthorized(false)} className="bg-white/20 hover:bg-white/40 px-6 py-2 rounded-xl text-xs font-black uppercase">Kunci Kembali</button>
      </div>

      <section className="bg-white p-12 rounded-[3.5rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><SettingsIcon size={200}/></div>
        <h2 className="text-4xl font-black mb-12 flex items-center gap-6 text-slate-800 uppercase tracking-tighter">
          <div className="bg-blue-100 p-4 rounded-3xl text-blue-600"><SettingsIcon size={32}/></div>
          Biaya & Paket Belajar
        </h2>
        <form onSubmit={savePrices} className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {Object.keys(prices).map((key) => (
            <div key={key} className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-4">{key.replace("_", " ")}</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                <input type="number" className="w-full border-4 border-slate-50 bg-slate-50 p-6 pl-12 rounded-3xl font-black text-2xl outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner" value={prices[key]} onChange={e => setPrices({...prices, [key]: parseInt(e.target.value)})}/>
              </div>
            </div>
          ))}
          <button className="md:col-span-3 bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl hover:bg-blue-600 active:scale-95 transition-all">Simpan Perubahan Harga</button>
        </form>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LOGIN ADMIN */}
        <section className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-white">
          <h2 className="text-2xl font-black mb-10 flex items-center gap-4 text-blue-400 uppercase tracking-tight">
            <Lock size={28}/> Sandi Login Staf
          </h2>
          <form onSubmit={saveAdminPassword} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest ml-4">Password Login Admin</label>
              <input type="text" className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-mono text-3xl text-center outline-none focus:border-blue-400" value={adminPass} onChange={e => setAdminPass(e.target.value)}/>
            </div>
            <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl">Ganti Sandi Staf</button>
          </form>
        </section>

        {/* OTORITAS OWNER */}
        <section className="bg-slate-950 p-12 rounded-[3.5rem] shadow-2xl text-white border-t-8 border-red-600">
          <h2 className="text-2xl font-black mb-2 flex items-center gap-4 text-red-500 uppercase tracking-tight">
            <UserCheck size={28}/> Sandi Keamanan Owner
          </h2>
          <p className="text-[10px] opacity-40 mb-10 uppercase font-bold tracking-[0.2em]">Password untuk akses Pengaturan & Mutasi Kas</p>
          <form onSubmit={saveOwnerPassword} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest ml-4">Password Owner Baru</label>
              <input type="text" className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl font-mono text-3xl text-center outline-none focus:border-red-500" value={ownerPass} onChange={e => setOwnerPass(e.target.value)}/>
            </div>
            <button className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl">Ganti Sandi Owner</button>
          </form>
        </section>
      </div>
    </div>
  );
}