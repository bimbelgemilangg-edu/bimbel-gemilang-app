import React, { useState } from 'react';
import { ArrowLeft, User, DollarSign, Calendar, Edit, Printer, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const formatRupiah = (val) => "Rp " + (val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0");

export default function StudentDetail({ student, studentInvoices, studentPayments, studentLogs, onBack, onEdit }) {
  const [tab, setTab] = useState('profile'); // profile | finance | attendance

  // Hitung Total Tunggakan Realtime
  const totalDebt = studentInvoices.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      {/* Header Profile */}
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
        <button onClick={onBack} className="absolute top-8 left-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><ArrowLeft size={24}/></button>
        <div className="text-center pt-8">
          <div className="w-32 h-32 bg-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl font-black text-slate-400 border-4 border-white shadow-xl uppercase">{student.name.substring(0,2)}</div>
          <h1 className="text-4xl font-black uppercase text-slate-800 tracking-tighter mb-2">{student.name}</h1>
          <p className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-8">{student.schoolLevel} • {student.schoolName}</p>
          
          {/* Menu Tab */}
          <div className="flex justify-center gap-4 bg-slate-50 p-2 rounded-[2rem] w-fit mx-auto">
            {[
              {id:'profile', l:'Biodata', i:User},
              {id:'finance', l:'Keuangan', i:DollarSign},
              {id:'attendance', l:'Absensi', i:Calendar}
            ].map(m => (
              <button key={m.id} onClick={()=>setTab(m.id)} className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase flex items-center gap-2 transition-all ${tab===m.id?'bg-white shadow-lg text-blue-600':'text-slate-400 hover:text-slate-600'}`}>
                <m.i size={16}/> {m.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- TAB 1: PROFIL --- */}
      {tab === 'profile' && (
        <div className="bg-white p-10 rounded-[3rem] shadow-lg animate-in fade-in">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h3 className="text-2xl font-black uppercase">Data Pribadi</h3>
            <button onClick={onEdit} className="px-6 py-3 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-xs uppercase hover:bg-yellow-500 flex gap-2"><Edit size={16}/> Edit Data</button>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-4">
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Jenis Kelamin</p><p className="font-bold text-lg">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Tempat, Tgl Lahir</p><p className="font-bold text-lg">{student.pob}, {student.dob}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Alamat</p><p className="font-bold text-lg">{student.address}</p></div>
            </div>
            <div className="space-y-4">
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Nama Ayah / Ibu</p><p className="font-bold text-lg">{student.fatherName} / {student.motherName}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Kontak Darurat (WA)</p><p className="font-bold text-xl text-green-600">{student.emergencyWAPhone}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Tanggal Bergabung</p><p className="font-bold text-lg">{student.joinedAt}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: KEUANGAN (TERHUBUNG KE PUSAT) --- */}
      {tab === 'finance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Status Card */}
          <div className={`p-8 rounded-[3rem] border-4 flex justify-between items-center ${totalDebt > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            <div>
              <p className={`font-black uppercase text-xs tracking-widest mb-1 ${totalDebt > 0 ? 'text-red-400' : 'text-green-400'}`}>Status Keuangan</p>
              <h2 className={`text-4xl font-black ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>{totalDebt > 0 ? 'TERTUNGGAK' : 'LUNAS / AMAN'}</h2>
            </div>
            <div className="text-right">
              <p className="font-black uppercase text-xs tracking-widest text-slate-400 mb-1">Total Hutang</p>
              <p className="text-3xl font-black text-slate-800">{formatRupiah(totalDebt)}</p>
            </div>
          </div>

          {/* Daftar Tagihan */}
          <div className="bg-white p-8 rounded-[3rem] shadow-lg">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><AlertCircle className="text-orange-500"/> Tagihan Aktif</h3>
            {studentInvoices.length === 0 ? <p className="text-slate-400 italic font-bold text-center py-4">Tidak ada tagihan aktif.</p> : (
              <div className="space-y-4">
                {studentInvoices.map(inv => (
                  <div key={inv.id} className="p-6 border-2 border-slate-100 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="font-black text-sm uppercase">{inv.details}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Jatuh Tempo: {inv.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${inv.status==='paid'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{inv.status}</span>
                      <p className="font-black text-xl mt-1">{formatRupiah(inv.remainingAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Riwayat Pembayaran */}
          <div className="bg-white p-8 rounded-[3rem] shadow-lg">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><CheckCircle className="text-green-500"/> Riwayat Pembayaran</h3>
            <div className="space-y-4">
              {studentPayments.map(pay => (
                <div key={pay.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs uppercase text-slate-500">{pay.date?.toDate().toLocaleDateString('id-ID')}</p>
                    <p className="font-black text-sm uppercase">{pay.description}</p>
                  </div>
                  <p className="font-black text-lg text-green-600">+{formatRupiah(pay.amount)}</p>
                </div>
              ))}
              {studentPayments.length === 0 && <p className="text-slate-400 italic font-bold text-center py-4">Belum ada riwayat pembayaran.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: ABSENSI --- */}
      {tab === 'attendance' && (
        <div className="bg-white p-8 rounded-[3rem] shadow-lg animate-in fade-in">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase">Rekam Jejak Kehadiran</h3>
            <button onClick={() => window.print()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase flex gap-2"><Printer size={16}/> Print Laporan</button>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <tr><th className="p-4 rounded-l-xl">Tanggal</th><th className="p-4">Mapel</th><th className="p-4">Tentor</th><th className="p-4 rounded-r-xl text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {studentLogs.map(log => {
                const status = log.studentsLog.find(s => s.id === student.id)?.status;
                return (
                  <tr key={log.id}>
                    <td className="p-4 font-bold text-sm text-slate-600">{log.date}</td>
                    <td className="p-4 font-black uppercase text-sm">{log.subject}</td>
                    <td className="p-4 font-bold uppercase text-xs text-slate-500">{log.teacherName}</td>
                    <td className="p-4 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${status==='Hadir'?'bg-green-100 text-green-600':status==='Alpha'?'bg-red-100 text-red-600':'bg-yellow-100 text-yellow-600'}`}>{status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {studentLogs.length === 0 && <div className="text-center py-10 text-slate-400 font-bold italic">Belum ada data kehadiran.</div>}
        </div>
      )}
    </div>
  );
}