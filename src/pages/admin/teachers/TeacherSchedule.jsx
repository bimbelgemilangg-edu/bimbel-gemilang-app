import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Calendar, Clock, MapPin, Users, BookOpen, Search } from 'lucide-react';

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mengambil data guru dari localStorage
  const teacherData = JSON.parse(localStorage.getItem('teacherData')) || {};
  const teacherName = teacherData.nama || "";

  useEffect(() => {
    const fetchTeacherSchedules = async () => {
      if (!teacherName) return;
      
      setLoading(true);
      try {
        // Query: Ambil dari 'jadwal_bimbel' dimana 'booker' adalah nama guru ini
        const q = query(
          collection(db, "jadwal_bimbel"),
          where("booker", "==", teacherName),
          orderBy("dateStr", "desc") // Menampilkan jadwal terbaru di atas
        );

        const querySnapshot = await getDocs(q);
        const fetchedSchedules = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSchedules(fetchedSchedules);
      } catch (error) {
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherSchedules();
  }, [teacherName]);

  // Fungsi untuk memformat tanggal (YYYY-MM-DD -> 28 Maret 2026)
  const formatNiceDate = (dateStr) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  const filteredSchedules = schedules.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.planet?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Jadwal Mengajar Anda</h1>
        <p style={styles.subtitle}>Halo, {teacherName}. Berikut adalah daftar seluruh sesi mengajar Anda.</p>
      </div>

      <div style={styles.searchBar}>
        <Search size={20} color="#94a3b8" />
        <input 
          type="text" 
          placeholder="Cari materi atau ruang..." 
          style={styles.inputSearch}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={styles.emptyState}>Memuat jadwal...</div>
      ) : filteredSchedules.length > 0 ? (
        <div style={styles.grid}>
          {filteredSchedules.map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.dateTag}>{formatNiceDate(item.dateStr)}</span>
                <div style={{...styles.badge, background: item.program === 'English' ? '#e0f2fe' : '#f0fdf4'}}>
                  {item.program}
                </div>
              </div>
              
              <h2 style={styles.classTitle}>{item.title || "Materi Umum"}</h2>
              
              <div style={styles.infoRow}>
                <Clock size={16} color="#64748b" />
                <span>{item.start} - {item.end} WIB</span>
              </div>
              
              <div style={styles.infoRow}>
                <MapPin size={16} color="#64748b" />
                <span>Ruang {item.planet}</span>
              </div>

              <div style={styles.infoRow}>
                <Users size={16} color="#64748b" />
                <span>{item.students?.length || 0} Siswa Terdaftar</span>
              </div>

              <div style={styles.footerAction}>
                <button 
                  onClick={() => window.location.href = '/guru/manual-input'} 
                  style={styles.btnAction}
                >
                  <BookOpen size={16} /> Buka Absensi
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Calendar size={48} color="#cbd5e1" />
          <p>Belum ada jadwal yang ditemukan.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '30px' },
  title: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '5px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '12px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', marginBottom: '25px' },
  inputSearch: { border: 'none', outline: 'none', width: '100%', fontSize: '15px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
  dateTag: { fontSize: '12px', fontWeight: '700', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px' },
  badge: { padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' },
  classTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '14px', marginBottom: '10px' },
  footerAction: { marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' },
  btnAction: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' },
  emptyState: { textAlign: 'center', padding: '100px 0', color: '#94a3b8' }
};

export default TeacherSchedule;