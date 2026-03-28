import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Download, Check, Clock } from 'lucide-react';

const CekTugasSiswa = ({ modulId }) => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const q = query(collection(db, "student_submissions"), where("modulId", "==", modulId));
      const snap = await getDocs(q);
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    if (modulId) fetchSubmissions();
  }, [modulId]);

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
      <h3>Daftar Pengumpulan Tugas</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '10px' }}>Nama Siswa</th>
            <th>Waktu Kumpul</th>
            <th>File</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{s.studentName}</td>
              <td>{s.submittedAt?.toDate().toLocaleString()}</td>
              <td><a href={s.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#673ab7' }}><Download size={16}/> Lihat File</a></td>
              <td>
                {new Date(s.submittedAt?.toDate()) > new Date(s.deadline) ? 
                  <span style={{ color: 'red' }}><Clock size={12}/> Terlambat</span> : 
                  <span style={{ color: 'green' }}><Check size={12}/> Tepat Waktu</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CekTugasSiswa;