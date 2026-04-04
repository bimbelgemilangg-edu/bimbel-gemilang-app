import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { Book, Play, FileCheck, ArrowLeft, Clock, User, Search, Filter, GraduationCap } from 'lucide-react';
import StudentModuleView from './StudentModuleView'; 

const StudentElearning = () => {
  const [moduls, setModuls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    fetchModuls();
  }, []);

  const fetchModuls = async () => {
    try {
      const studentId = localStorage.getItem('studentId');
      if (!studentId) return;
      
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      
      let myKategori = "";
      let myKelas = "";

      if (studentSnap.exists()) {
        const sData = studentSnap.data();
        setStudentProfile(sData);
        myKategori = sData.kategori || "";
        myKelas = sData.kelasSekolah || "";
      }

      const q = query(collection(db, "bimbel_modul"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const allModuls = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // --- LOGIKA FILTER KETAT (STRICT FILTERING) ---
      const filtered = allModuls.filter(m => {
        // 1. Cek Parameter Baru (targetKategori & targetKelas)
        const hasNewTarget = m.targetKategori && m.targetKelas;
        
        if (hasNewTarget) {
          const matchKategori = m.targetKategori === "Semua" || m.targetKategori === myKategori;
          const matchKelas = m.targetKelas === "Semua" || m.targetKelas === myKelas;
          
          // Jika menggunakan target baru, WAJIB cocok kategori DAN kelas
          if (matchKategori && matchKelas) return true;
          
          // Jika sudah ada target baru tapi tidak cocok, langsung reject (jangan lanjut ke logika lama)
          return false;
        }

        // 2. Fallback ke Logika Lama (Jika m.target objek ada)
        if (m.target) {
          if (m.target.type === 'all') return true;
          if (m.target.type === 'grade' && m.target.grade === myKelas) return true;
          if (m.target.type === 'individual' && m.target.studentIds?.includes(studentId)) return true;
          return false;
        }

        // 3. Jika tidak ada target sama sekali (Data Rusak/Lama Sekali)
        // Default: Sembunyikan demi keamanan data
        return false;
      });

      setModuls(filtered);
    } catch (e) { 
      console.error("Gagal memuat modul:", e); 
    }
    setLoading(false);
  };

  const filteredBySearch = moduls.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selected) {
    return (
      <StudentModuleView 
        modulId={selected.id} 
        onBack={() => setSelected(null)} 
        studentData={{
          uid: localStorage.getItem('studentId'),
          id: localStorage.getItem('studentId'),
          nama: localStorage.getItem('studentName') || "Siswa",
          kelasSekolah: studentProfile?.kelasSekolah
        }}
      />
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={st.headerSection}>
        <div>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>📚 Ruang Belajar Digital</h2>
          <p style={{ color: '#64748b', marginTop: '5px' }}>
            {studentProfile ? `Materi untuk ${studentProfile.kategori} - Kelas ${studentProfile.kelasSekolah}` : "Menyiapkan modul terbaik untukmu..."}
          </p>
        </div>
        
        <div style={st.searchContainer}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari judul materi atau mata pelajaran..." 
            style={st.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div style={st.spinner}></div>
          <p style={{ color: '#673ab7', fontWeight: 'bold' }}>Menghubungkan ke Perpustakaan...</p>
        </div>
      ) : (
        <div style={st.grid}>
          {filteredBySearch.map(m => (
            <div key={m.id} onClick={() => setSelected(m)} style={st.card}>
              <div style={st.cardImageContainer}>
                <img 
                  src={m.coverImage || "https://images.unsplash.com/photo-1454165833767-027ffea9e78a?q=80&w=400"} 
                  style={st.cardImage} 
                  alt="Cover" 
                />
                <div style={st.subjectTag}>{m.subject || "Umum"}</div>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={st.metaRow}>
                   <span style={st.dateBadge}><Clock size={12}/> {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString() : 'Terbaru'}</span>
                </div>
                <h3 style={st.cardTitle}>{m.title}</h3>
                
                <div style={st.authorRow}>
                  <div style={st.avatarSmall}><User size={14} color="#673ab7"/></div>
                  <p style={st.cardAuthor}>{m.authorName || m.author || 'Guru Gemilang'}</p>
                </div>

                <div style={st.cardDivider}></div>
                
                <div style={st.cardFoot}>
                  <span>{m.blocks?.length || 0} Materi</span>
                  <div style={st.btnOpen}>Buka Materi <ChevronRight size={14} /></div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredBySearch.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '30px' }}>
               <div style={{ marginBottom: '20px' }}><Book size={48} color="#e2e8f0"/></div>
               <h3 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Materi Tidak Ditemukan</h3>
               <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                  Belum ada modul yang sesuai untuk jenjang kelas kamu saat ini.
               </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChevronRight = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

const st = {
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '12px 20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', minWidth: '300px' },
  searchInput: { border: 'none', outline: 'none', fontSize: '14px', width: '100%', color: '#1e293b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: 'white', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', cursor: 'pointer', transition: '0.3s', overflow: 'hidden', border: '1px solid #f1f5f9' },
  cardImageContainer: { position: 'relative', height: '160px', width: '100%' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover' },
  subjectTag: { position: 'absolute', top: '15px', left: '15px', background: 'rgba(103, 58, 183, 0.9)', color: 'white', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', backdropFilter: 'blur(4px)' },
  metaRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' },
  dateBadge: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8' },
  cardTitle: { margin: '0 0 15px 0', fontSize: '19px', fontWeight: '700', color: '#1e293b', lineHeight: 1.4, minHeight: '52px' },
  authorRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' },
  avatarSmall: { width: '24px', height: '24px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardAuthor: { color: '#64748b', fontSize: '13px', margin: 0, fontWeight: '500' },
  cardDivider: { height: '1px', background: '#f1f5f9', marginBottom: '15px' },
  cardFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' },
  btnOpen: { color: '#673ab7', display: 'flex', alignItems: 'center', gap: '4px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3e8ff', borderTop: '4px solid #673ab7', borderRadius: '50%', margin: '0 auto 15px', animation: 'spin 1s linear infinite' },
};

export default StudentElearning;