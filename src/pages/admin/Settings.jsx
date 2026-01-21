import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, DollarSign } from 'lucide-react';

export default function AdminSettings({ db }) {
  const [prices, setPrices] = useState({ 
    pendaftaran: 0,
    sd_1: 0, sd_3: 0, 
    smp_1: 0, smp_3: 0, 
    sma_1: 0, sma_3: 0 
  });

  useEffect(() => {
    getDoc(doc(db, "settings", "prices")).then(s => {
      if(s.exists()) setPrices(s.data());
    });
  }, [db]);

  const save = async () => { 
    await setDoc(doc(db, "settings", "prices"), prices, { merge: true }); 
    alert("Harga Paket Tersimpan!"); 
  };

  const handleChange = (key, val) => {
    setPrices({...prices, [key]: parseInt(val) || 0});
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <h2 className="font-bold mb-6 flex items-center gap-2 text-xl text-gray-800">
        <DollarSign className="text-blue-600"/> Pengaturan Harga Paket
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label className="text-xs font-bold uppercase text-blue-800 mb-1 block">Biaya Pendaftaran (Awal Masuk)</label>
          <div className="flex items-center"><span className="bg-white px-3 py-2 border border-r-0 rounded-l text-gray-500">Rp</span><input type="number" className="w-full border p-2 rounded-r font-bold text-blue-900" value={prices.pendaftaran} onChange={e=>handleChange('pendaftaran', e.target.value)}/></div>
        </div>
        {[
          {k: 'sd_1', l: 'SD - 1 Bulan'}, {k: 'sd_3', l: 'SD - 3 Bulan'},
          {k: 'smp_1', l: 'SMP - 1 Bulan'}, {k: 'smp_3', l: 'SMP - 3 Bulan'},
          {k: 'sma_1', l: 'SMA - 1 Bulan'}, {k: 'sma_3', l: 'SMA - 3 Bulan'},
        ].map(item => (
          <div key={item.k}><label className="text-xs font-bold uppercase text-gray-500 mb-1 block">{item.l}</label><div className="flex items-center"><span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l text-gray-500">Rp</span><input type="number" className="w-full border p-2 rounded-r" value={prices[item.k]} onChange={e=>handleChange(item.k, e.target.value)}/></div></div>
        ))}
      </div>
      <button onClick={save} className="mt-8 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={18}/> SIMPAN PERUBAHAN</button>
    </div>
  );
}