import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { User, Save } from 'lucide-react';

export default function TeacherProfile({ db, user }) {
  const [data, setData] = useState({ name: user, university: '', subject: '', id: null });

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "users"), where("name", "==", user));
      const snap = await getDocs(q);
      if(!snap.empty) setData({ ...snap.docs[0].data(), id: snap.docs[0].id });
    };
    load();
  }, [db, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if(data.id) {
      await updateDoc(doc(db, "users", data.id), { university: data.university, subject: data.subject });
      alert("Profil Tersimpan!");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in slide-in-from-bottom-10">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center border-4 border-slate-50">
        <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-8 border-[6px] border-white shadow-xl flex items-center justify-center"><User size={64} className="text-slate-300"/></div>
        <h2 className="text-4xl font-black uppercase text-slate-800 tracking-tighter mb-1">{user}</h2>
        <p className="text-blue-500 font-bold uppercase text-xs tracking-[0.3em] mb-12">Tentor Profesional</p>
        
        <form onSubmit={handleSave} className="space-y-8 text-left">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Spesialisasi Mapel</label><input className="w-full bg-slate-50 p-6 rounded-[2rem] font-black text-xl text-slate-700 outline-none focus:bg-white focus:shadow-lg transition-all" value={data.subject} onChange={e=>setData({...data, subject:e.target.value})}/></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest">Alumni Universitas</label><input className="w-full bg-slate-50 p-6 rounded-[2rem] font-black text-xl text-slate-700 outline-none focus:bg-white focus:shadow-lg transition-all" value={data.university} onChange={e=>setData({...data, university:e.target.value})}/></div>
          <button className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"><Save size={20}/> Simpan Perubahan</button>
        </form>
      </div>
    </div>
  );
}