import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy, limit, startAfter } from "firebase/firestore";
import { BookOpen, Plus, Search, FileText, HelpCircle, Trash2, Edit3, Eye, AlertCircle, Users, Calendar, Target, Layers, Send, Filter, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ModulManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('semua'); // 'semua', 'modul', 'tugas', 'kuis'
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterMapel, setFilterMapel] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  const COLLECTION_NAME = "bimbel_modul";
  const PAGE_SIZE = 12;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { 
    fetchItems(); 
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const siswaSnap = await getDocs(collection(db, "students"));
      const kelasSet = new Set();
      siswaSnap.forEach(doc => {
        const kelas = doc.data().kelasSekolah;
        if (kelas) kelasSet.add(kelas);
      });
      setAvailableClasses(['Semua', ...Array.from(kelasSet).sort()]);

      const modulSnap = await getDocs(collection(db, COLLECTION_NAME));
      const mapelSet = new Set();
      modulSnap.forEach(doc => {
        const mapel = doc.data().subject;
        if (mapel && mapel !== "Tugas") mapelSet.add(mapel);
      });
      setAvailableSubjects(['Semua', ...Array.from(mapelSet).sort()]);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchItems = async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let qConstraints = [orderBy("updatedAt", "desc")];
      if (!isLoadMore && lastDoc) qConstraints.push(startAfter(lastDoc));
      qConstraints.push(limit(PAGE_SIZE));
      
      const q = query(collection(db, COLLECTION_NAME), ...qConstraints);
      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (isLoadMore) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching items:", error);
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const allItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(allItems);
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("⚠️ Hapus permanen? Data tidak dapat dikembalikan.")) {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      setItems(items.filter(i => i.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    const b = {
      'aktif': { label: 'Aktif', color: '#10b981', bg: '#dcfce7' },
      'terjadwal': { label: 'Terjadwal', color: '#f59e0b', bg: '#fef3c7' },
      'arsip': { label: 'Arsip', color: '#64748b', bg: '#f1f5f9' }
    };
    return b[status] || b['aktif'];
  };

  const getTypeInfo = (item) => {
    if (item.type === 'kuis_mandiri') return { label: 'Kuis', icon: <HelpCircle size={12} />, color: '#f59e0b', bg: '#fef3c7' };
    if (item.type === 'assignment') return { label: 'Tugas', icon: <Send size={12} />, color: '#ef4444', bg: '#fee2e2' };
    if (item.blocks?.length > 0) return { label: 'Modul', icon: <BookOpen size={12} />, color: '#3b82f6', bg: '#dbeafe' };
    return { label: 'Materi', icon: <FileText size={12} />, color: '#64748b', bg: '#f1f5f9' };
  };

  const getFilteredItems = () => {
    let filtered = items;
    
    // Search
    if (searchTerm) {
      filtered = filtered.filter(item => 
        (item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.subject || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Tab filter
    if (activeTab === 'modul') {
      filtered = filtered.filter(item => !item.type || (item.blocks?.length > 0 && item.type !== 'kuis_mandiri' && item.type !== 'assignment'));
    } else if (activeTab === 'tugas') {
      filtered = filtered.filter(item => item.type === 'assignment');
    } else if (activeTab === 'kuis') {
      filtered = filtered.filter(item => item.type === 'kuis_mandiri');
    }
    
    // Kelas
    if (filterKelas !== "Semua") {
      filtered = filtered.filter(item => {
        const targetKelas = item.targetKelas || "Semua";
        return targetKelas === filterKelas || targetKelas === "Semua";
      });
    }
    
    // Mapel
    if (filterMapel !== "Semua") {
      filtered = filtered.filter(item => (item.subject || "Umum") === filterMapel);
    }
    
    // Status
    if (filterStatus !== "Semua") {
      filtered = filtered.filter(item => item.status === filterStatus || (!item.status && filterStatus === "aktif"));
    }
    
    return filtered;
  };

  const filteredItems = getFilteredItems();
  const hasActiveFilters = filterKelas !== "Semua" || filterMapel !== "Semua" || filterStatus !== "Semua";

  const clearFilters = () => {
    setFilterKelas("Semua");
    setFilterMapel("Semua");
    setFilterStatus("Semua");
    setSearchTerm("");
  };

  const loadMore = () => {
    if (hasMore && !loadingMore && filteredItems.length === items.length) {
      fetchItems(true);
    }
  };

  // Skeleton loading component
  const SkeletonCard = () => (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', padding: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <div style={{ width: 50, height: 18, background: '#f1f5f9', borderRadius: 4 }}></div>
        <div style={{ width: 60, height: 18, background: '#f1f5f9', borderRadius: 4 }}></div>
      </div>
      <div style={{ width: '70%', height: 18, background: '#f1f5f9', borderRadius: 4, marginBottom: 6 }}></div>
      <div style={{ width: '50%', height: 14, background: '#f1f5f9', borderRadius: 4, marginBottom: 10 }}></div>
      <div style={{ display: 'flex', gap: 5 }}>
        <div style={{ flex: 1, height: 28, background: '#f1f5f9', borderRadius: 6 }}></div>
        <div style={{ flex: 1, height: 28, background: '#f1f5f9', borderRadius: 6 }}></div>
        <div style={{ width: 28, height: 28, background: '#f1f5f9', borderRadius: 6 }}></div>
      </div>
    </div>
  );

  const stats = {
    total: items.length,
    modul: items.filter(i => !i.type || (i.blocks?.length > 0 && i.type !== 'kuis_mandiri' && i.type !== 'assignment')).length,
    tugas: items.filter(i => i.type === 'assignment').length,
    kuis: items.filter(i => i.type === 'kuis_mandiri').length,
  };

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#6366f1', padding: 10, borderRadius: 14 }}><BookOpen size={22} color="white"/></div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#1e293b' }}>E-Learning Console</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Kelola Modul Pembelajaran</p>
          </div>
        </div>
        <button onClick={() => navigate('/guru/modul/materi')} style={{
          background: '#6366f1', color: 'white', border: 'none', padding: isMobile ? '10px 16px' : '12px 20px', borderRadius: 10,
          cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 13, display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Plus size={16} /> Buat Modul Baru
        </button>
      </div>

      {/* STATS TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button 
          onClick={() => setActiveTab('semua')}
          style={{ 
            padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: activeTab === 'semua' ? '#6366f1' : '#f1f5f9',
            color: activeTab === 'semua' ? 'white' : '#64748b'
          }}
        >
          Semua ({stats.total})
        </button>
        <button 
          onClick={() => setActiveTab('modul')}
          style={{ 
            padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: activeTab === 'modul' ? '#3b82f6' : '#f1f5f9',
            color: activeTab === 'modul' ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <BookOpen size={14} /> Modul ({stats.modul})
        </button>
        <button 
          onClick={() => setActiveTab('tugas')}
          style={{ 
            padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: activeTab === 'tugas' ? '#ef4444' : '#f1f5f9',
            color: activeTab === 'tugas' ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <Send size={14} /> Tugas ({stats.tugas})
        </button>
        <button 
          onClick={() => setActiveTab('kuis')}
          style={{ 
            padding: '8px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: activeTab === 'kuis' ? '#f59e0b' : '#f1f5f9',
            color: activeTab === 'kuis' ? 'white' : '#64748b',
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <HelpCircle size={14} /> Kuis ({stats.kuis})
        </button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 18, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', flex: 2, minWidth: 200 }}>
            <Search size={16} color="#94a3b8" />
            <input 
              placeholder="Cari judul atau mapel..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }} 
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            )}
          </div>
          
          <button onClick={() => setShowFilters(!showFilters)} style={{
            background: hasActiveFilters ? '#3b82f6' : '#f1f5f9',
            color: hasActiveFilters ? 'white' : '#64748b',
            border: 'none', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Filter size={14} /> Filter {hasActiveFilters && <span style={{ background: 'white', color: '#3b82f6', borderRadius: 10, padding: '0 6px', marginLeft: 4 }}>●</span>}
          </button>
          
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 12, marginTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white' }}>
              <option value="Semua">🎓 Semua Kelas</option>
              {availableClasses.filter(k => k !== 'Semua').map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white' }}>
              <option value="Semua">📖 Semua Mapel</option>
              {availableSubjects.filter(s => s !== 'Semua').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white' }}>
              <option value="Semua">📋 Semua Status</option>
              <option value="aktif">🟢 Aktif</option>
              <option value="terjadwal">🟡 Terjadwal</option>
              <option value="arsip">📦 Arsip</option>
            </select>
          </div>
        )}
      </div>

      {/* INFO FILTER */}
      {hasActiveFilters && (
        <div style={{ fontSize: 11, color: '#3b82f6', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span>🔍 Menampilkan {filteredItems.length} item</span>
          {filterKelas !== "Semua" && <span style={{ background: '#eef2ff', padding: '2px 8px', borderRadius: 12 }}>🎓 {filterKelas}</span>}
          {filterMapel !== "Semua" && <span style={{ background: '#eef2ff', padding: '2px 8px', borderRadius: 12 }}>📖 {filterMapel}</span>}
          {filterStatus !== "Semua" && <span style={{ background: '#eef2ff', padding: '2px 8px', borderRadius: 12 }}>📋 {filterStatus === 'aktif' ? 'Aktif' : filterStatus === 'terjadwal' ? 'Terjadwal' : 'Arsip'}</span>}
        </div>
      )}

      {/* GRID */}
      {loading && items.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
          <AlertCircle size={48} color="#cbd5e1" />
          <h3 style={{ margin: '10px 0 4px', color: '#64748b' }}>Tidak Ada Konten</h3>
          <p style={{ fontSize: 12 }}>{searchTerm ? 'Coba ubah kata kunci.' : 'Buat modul pembelajaran baru.'}</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredItems.map(item => {
              const typeInfo = getTypeInfo(item);
              const sb = getStatusBadge(item.status);
              const targetKelas = item.targetKelas || "Semua";
              const isForAllClasses = targetKelas === "Semua";
              
              return (
                <div 
                  key={item.id} 
                  style={{ 
                    background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden', 
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)', borderTop: `4px solid ${typeInfo.color}`,
                    transition: 'all 0.2s ease', cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (typeInfo.label === 'Kuis') navigate(`/guru/manage-quiz?modulId=${item.id}`);
                    else if (typeInfo.label === 'Tugas') navigate(`/guru/manage-tugas?edit=${item.id}`);
                    else navigate(`/guru/modul/materi?edit=${item.id}`);
                  }}
                >
                  <div style={{ padding: 14 }}>
                    {/* BADGES */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700, background: sb.bg, color: sb.color }}>
                        {sb.label}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700, background: typeInfo.bg, color: typeInfo.color }}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      {item.subject && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>
                          {item.subject}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 600, background: isForAllClasses ? '#fef3c7' : '#e0e7ff', color: isForAllClasses ? '#b45309' : '#3730a3' }}>
                        {isForAllClasses ? '🌐 Semua' : `🎓 ${targetKelas}`}
                      </span>
                    </div>
                    
                    {/* TITLE */}
                    <h3 style={{ margin: '0 0 6px', fontSize: 14, color: '#1e293b', fontWeight: 700, lineHeight: 1.3 }}>{item.title || "Untitled"}</h3>
                    
                    {/* META INFO */}
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8', marginBottom: 12, flexWrap: 'wrap' }}>
                      {typeInfo.label === 'Kuis' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><HelpCircle size={10}/> {item.quizData?.length || 0} soal</span>
                      ) : typeInfo.label === 'Tugas' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10}/> {item.deadlineTugas ? new Date(item.deadlineTugas).toLocaleDateString('id-ID') : 'Tanpa deadline'}</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FileText size={10}/> {(item.blocks || []).length} konten</span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10}/> {item.targetKategori || 'Reguler'}</span>
                      {item.mingguKe && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>📅 Mg {item.mingguKe}</span>}
                    </div>
                    
                    {/* ACTIONS */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); 
                          if (typeInfo.label === 'Kuis') navigate(`/guru/manage-quiz?modulId=${item.id}`);
                          else if (typeInfo.label === 'Tugas') navigate(`/guru/manage-tugas?edit=${item.id}`);
                          else navigate(`/guru/modul/materi?edit=${item.id}`);
                        }} 
                        style={{ flex: 1, background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <Edit3 size={12} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open(`/siswa/materi/${item.id}`, '_blank'); }} 
                        style={{ flex: 1, background: '#1e293b', color: 'white', border: 'none', padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, item.id)} 
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* LOAD MORE BUTTON */}
          {hasMore && filteredItems.length === items.length && items.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button 
                onClick={loadMore} 
                disabled={loadingMore}
                style={{
                  background: '#f1f5f9', border: 'none', padding: '10px 24px', borderRadius: 20, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 6
                }}
              >
                {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModulManager;