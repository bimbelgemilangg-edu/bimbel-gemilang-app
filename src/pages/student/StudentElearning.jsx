// src/pages/student/StudentElearning.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Clock, ChevronLeft, ChevronRight, FileText, 
  Video, Link as LinkIcon, Calendar, User, Send, 
  CheckCircle, XCircle, AlertCircle, Download, Eye, 
  ExternalLink, FileQuestion, Award, ChevronDown, ChevronUp,
  Search, Filter, Layers, FolderOpen, Star, TrendingUp,
  MessageSquare, Paperclip, Upload, X, Menu, Home, Grid3x3, List,
  Image as ImageIcon, Play, File, HelpCircle
} from 'lucide-react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// 🔥 IMPORT UNTUK UPLOAD KE SUPABASE (TAMBAHAN, TIDAK MENGHAPUS APAPUN)
import { uploadToDrive } from '../../services/uploadService';

const StudentElearning = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [studentKelas, setStudentKelas] = useState("");
  const [studentKategori, setStudentKategori] = useState("");
  const [submissions, setSubmissions] = useState({});
  
  const [previewFile, setPreviewFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [assignmentFile, setAssignmentFile] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sId = localStorage.getItem('studentId');
    const sName = localStorage.getItem('studentName');
    setStudentId(sId);
    setStudentName(sName || "Siswa");
    if (sId) fetchStudentProfile(sId);
  }, []);

  useEffect(() => {
    if (studentKategori && studentKelas) fetchModules();
  }, [studentKategori, studentKelas]);

  useEffect(() => {
    const selectedModuleId = localStorage.getItem('selectedModuleId');
    if (selectedModuleId && modules.length > 0) {
      const targetModule = modules.find(m => m.id === selectedModuleId);
      if (targetModule) setSelectedModule(targetModule);
      localStorage.removeItem('selectedModuleId');
    }
  }, [modules]);

  useEffect(() => {
    let filtered = modules;
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType === 'module') {
      filtered = filtered.filter(m => m.type !== 'kuis_mandiri');
    } else if (filterType === 'quiz') {
      filtered = filtered.filter(m => m.type === 'kuis_mandiri');
    }
    setFilteredModules(filtered);
  }, [searchTerm, filterType, modules]);

  const fetchStudentProfile = async (id) => {
    try {
      const docSnap = await getDoc(doc(db, "students", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStudentKelas(data.kelasSekolah || "");
        setStudentKategori(data.kategori || "Reguler");
      }
    } catch (error) {
      console.error("Error fetch student profile:", error);
    }
  };

  const fetchModules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bimbel_modul"), where("status", "==", "aktif"), orderBy("updatedAt", "desc"));
      const snapshot = await getDocs(q);
      let allModules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allModules = allModules.filter(module => {
        const targetKategori = module.targetKategori || "Semua";
        const targetKelas = module.targetKelas || "Semua";
        const kategoriMatch = targetKategori === "Semua" || targetKategori === studentKategori;
        const kelasMatch = targetKelas === "Semua" || targetKelas === studentKelas;
        return kategoriMatch && kelasMatch;
      });
      setModules(allModules);
      setFilteredModules(allModules);
      if (studentId) await fetchSubmissions(studentId);
    } catch (error) {
      const snapshot = await getDocs(collection(db, "bimbel_modul"));
      let allModules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allModules = allModules.filter(module => {
        const isActive = module.status === "aktif";
        const targetKategori = module.targetKategori || "Semua";
        const targetKelas = module.targetKelas || "Semua";
        const kategoriMatch = targetKategori === "Semua" || targetKategori === studentKategori;
        const kelasMatch = targetKelas === "Semua" || targetKelas === studentKelas;
        return isActive && kategoriMatch && kelasMatch;
      });
      allModules.sort((a, b) => {
        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(0);
        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      setModules(allModules);
      setFilteredModules(allModules);
      if (studentId) await fetchSubmissions(studentId);
    }
    setLoading(false);
  };

  const fetchSubmissions = async (sId) => {
    try {
      const q = query(collection(db, "jawaban_tugas"), where("studentId", "==", sId));
      const snapshot = await getDocs(q);
      const submissionsMap = {};
      snapshot.forEach(doc => { submissionsMap[doc.data().modulId] = doc.data(); });
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error("Error fetch submissions:", error);
    }
  };

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => setSelectedModule(null);
  const handlePreviewFile = (fileUrl, fileName) => setPreviewFile({ url: fileUrl, name: fileName });

  const renderMath = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$.*?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        try { return <InlineMath key={i} math={part.substring(1, part.length - 1)} />; }
        catch (e) { return <span key={i} style={{ color: 'red' }}>{part}</span>; }
      }
      return <span key={i}>{part}</span>;
    });
  };

  // 🔥🔥🔥 FUNGSI HANDLE SUBMIT YANG DIPERBAIKI (TAMBAH UPLOAD KE SUPABASE) 🔥🔥🔥
  // SEMUA FITUR LAIN TETAP SAMA, HANYA PROSES UPLOAD FILE YANG DIUBAH
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!assignmentAnswer && !assignmentFile) return alert("❌ Harap isi jawaban atau upload file!");
    
    setSubmitting(true);
    try {
      let fileUrl = null, fileName = null, filePath = null;
      
      if (assignmentFile) {
        // Validasi ukuran file (maksimal 10MB)
        if (assignmentFile.size > 10 * 1024 * 1024) {
          throw new Error("Ukuran file terlalu besar. Maksimal 10MB.");
        }
        
        // Konversi file ke Base64 untuk dikirim ke uploadService
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(assignmentFile);
        });
        
        console.log(`📤 Upload file: ${assignmentFile.name} (${(assignmentFile.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // 🔥 UPLOAD KE SUPABASE STORAGE (PERUBAHAN UTAMA)
        const result = await uploadToDrive(base64, assignmentFile.name, assignmentFile.type);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        fileUrl = result.downloadURL;
        filePath = result.filePath;
        fileName = assignmentFile.name;
        
        console.log(`✅ Upload berhasil: ${fileUrl}`);
      }
      
      // 🔥 SIMPAN KE FIRESTORE (SAMA PERSIS DENGAN YANG LAMA, HANYA fileUrl SEKARANG DARI SUPABASE)
      await addDoc(collection(db, "jawaban_tugas"), {
        modulId: selectedModule.id,
        modulTitle: selectedModule.title,
        studentId,
        studentName,
        studentKelas,
        question: selectedAssignment.content,
        answer: assignmentAnswer,
        fileUrl,      // ← SEKARANG URL DARI SUPABASE (BUKAN BASE64)
        filePath,     // ← TAMBAHAN (PATH DI SUPABASE)
        fileName,
        status: "submitted",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert("✅ Tugas berhasil dikirim!");
      setSelectedAssignment(null);
      setAssignmentAnswer("");
      setAssignmentFile(null);
      await fetchSubmissions(studentId);
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Gagal mengirim tugas: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  // 🔥🔥🔥 END PERBAIKAN 🔥🔥🔥

  const getSubmissionStatus = (moduleId) => {
    const sub = submissions[moduleId];
    if (!sub) return { status: 'not_submitted', label: 'Belum', color: '#ef4444', bg: '#fee2e2', icon: <XCircle size={12} /> };
    if (sub.graded) return { status: 'graded', label: 'Dinilai', color: '#10b981', bg: '#dcfce7', icon: <CheckCircle size={12} /> };
    return { status: 'submitted', label: 'Terkirim', color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={12} /> };
  };

  // RENDER MODERN CARD (LIKE NETFLIX) - TIDAK BERUBAH
  const renderModernCard = (module) => {
    const isQuizMandiri = module.type === 'kuis_mandiri';
    const hasAssignment = module.blocks?.some(b => b.type === 'assignment');
    const hasQuiz = module.quizData?.length > 0;
    const submissionStatus = getSubmissionStatus(module.id);
    const coverImage = module.coverImage || module.imageUrl || null;

    return (
      <div 
        key={module.id} 
        onClick={() => handleModuleClick(module)}
        style={styles.modernCard}
      >
        {/* COVER IMAGE AREA */}
        <div style={styles.modernCardCover}>
          {coverImage ? (
            <>
              <img 
                src={coverImage} 
                alt={module.title}
                style={styles.modernCardImage}
              />
              <div style={styles.modernCardOverlay}>
                <span style={styles.modernCardPlayIcon}>▶</span>
              </div>
            </>
          ) : (
            <div style={styles.modernCardPlaceholder}>
              {isQuizMandiri ? <FileQuestion size={40} color="#8b5cf6" /> : <BookOpen size={40} color="#3b82f6" />}
            </div>
          )}
          
          {/* BADGE STATUS */}
          {submissionStatus.status !== 'not_submitted' && (
            <div style={{ ...styles.modernCardBadge, background: submissionStatus.bg, color: submissionStatus.color }}>
              {submissionStatus.icon} {submissionStatus.label}
            </div>
          )}
          
          {/* BADGE TYPE */}
          <div style={styles.modernCardTypeBadge}>
            {isQuizMandiri ? '📝 Kuis' : '📚 Modul'}
          </div>
        </div>
        
        {/* CARD BODY */}
        <div style={styles.modernCardBody}>
          <h3 style={styles.modernCardTitle}>{module.title}</h3>
          <p style={styles.modernCardSubject}>
            {module.subject || 'Materi Pembelajaran'}
          </p>
          
          {/* META INFO */}
          <div style={styles.modernCardMeta}>
            {hasAssignment && (
              <span style={styles.modernCardMetaItem}>
                <Send size={10} /> Tugas
              </span>
            )}
            {hasQuiz && (
              <span style={styles.modernCardMetaItem}>
                <HelpCircle size={10} /> Kuis
              </span>
            )}
            {module.deadlineTugas && (
              <span style={styles.modernCardMetaItem}>
                <Clock size={10} /> Deadline
              </span>
            )}
          </div>
          
          {/* DEADLINE DATE */}
          {module.deadlineTugas && (
            <div style={styles.modernCardDeadline}>
              <Clock size={10} color="#f59e0b" />
              <span>{new Date(module.deadlineTugas).toLocaleDateString('id-ID')}</span>
            </div>
          )}
          
          <button style={styles.modernCardBtn}>
            Buka Modul <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // RENDER LIST VIEW (ALTERNATIF) - TIDAK BERUBAH
  const renderListView = (module) => {
    const isQuizMandiri = module.type === 'kuis_mandiri';
    const submissionStatus = getSubmissionStatus(module.id);
    const coverImage = module.coverImage || module.imageUrl || null;

    return (
      <div key={module.id} onClick={() => handleModuleClick(module)} style={styles.listCard}>
        <div style={styles.listCardImage}>
          {coverImage ? (
            <img src={coverImage} alt={module.title} style={styles.listCardImg} />
          ) : (
            <div style={styles.listCardPlaceholder}>
              {isQuizMandiri ? <FileQuestion size={24} color="#8b5cf6" /> : <BookOpen size={24} color="#3b82f6" />}
            </div>
          )}
        </div>
        <div style={styles.listCardContent}>
          <div style={styles.listCardHeader}>
            <h3 style={styles.listCardTitle}>{module.title}</h3>
            <div style={{ ...styles.listCardBadge, background: submissionStatus.bg, color: submissionStatus.color }}>
              {submissionStatus.icon} {submissionStatus.label}
            </div>
          </div>
          <p style={styles.listCardSubject}>{module.subject || 'Materi Pembelajaran'}</p>
          <div style={styles.listCardMeta}>
            {module.blocks?.some(b => b.type === 'assignment') && <span>📝 Tugas</span>}
            {module.quizData?.length > 0 && <span>❓ Kuis</span>}
          </div>
        </div>
        <ChevronRight size={20} color="#94a3b8" />
      </div>
    );
  };

  // RENDER DETAIL MODUL - TIDAK BERUBAH
  const renderModuleDetail = () => {
    if (!selectedModule) return null;
    const assignments = selectedModule.blocks?.filter(b => b.type === 'assignment') || [];
    const materials = selectedModule.blocks?.filter(b => b.type !== 'assignment') || [];
    const hasQuiz = selectedModule.quizData?.length > 0;
    const coverImage = selectedModule.coverImage || selectedModule.imageUrl || null;

    return (
      <div style={styles.moduleDetail}>
        <div style={styles.detailHeader}>
          <button onClick={handleBack} style={styles.btnBack}><ChevronLeft size={20} /> Kembali</button>
          <div style={styles.detailTitle}>
            <h1 style={styles.detailTitleText}>{selectedModule.title}</h1>
            <div style={styles.detailMeta}>
              <span style={styles.detailMetaItem}><BookOpen size={14} /> {selectedModule.subject || 'Materi'}</span>
              {selectedModule.deadlineTugas && <span style={styles.detailMetaItem}><Clock size={14} /> Deadline: {new Date(selectedModule.deadlineTugas).toLocaleDateString('id-ID')}</span>}
            </div>
          </div>
        </div>
        
        {coverImage && (
          <div style={styles.detailCover}>
            <img src={coverImage} alt={selectedModule.title} style={styles.detailCoverImg} />
          </div>
        )}
        
        {selectedModule.description && (
          <div style={styles.descriptionBox}><p>{selectedModule.description}</p></div>
        )}
        
        {materials.length > 0 && (
          <div style={styles.sectionBox}>
            <h3 style={styles.sectionTitle}><BookOpen size={18} color="#3b82f6" /> Materi Pembelajaran</h3>
            <div style={styles.materialsList}>
              {materials.map((material, idx) => (
                <div key={material.id || idx} style={styles.materialCard}>
                  <div style={styles.materialIcon}>
                    {material.type === 'text' && <FileText size={24} color="#3b82f6" />}
                    {material.type === 'file' && <Download size={24} color="#10b981" />}
                    {material.type === 'video' && <Video size={24} color="#ef4444" />}
                    {!material.type && <FileText size={24} color="#64748b" />}
                  </div>
                  <div style={styles.materialContent}>
                    <h4 style={styles.materialTitle}>{material.title || `Materi ${idx + 1}`}</h4>
                    {material.type === 'text' && <div style={styles.materialText}>{renderMath(material.content)}</div>}
                    {material.type === 'file' && material.content && (
                      <div style={styles.filePreview}>
                        <span style={styles.fileName}>{material.fileName || 'File Materi'}</span>
                        <button onClick={() => handlePreviewFile(material.content, material.fileName)} style={styles.btnPreview}><Eye size={14} /> Lihat</button>
                        <a href={material.content} download style={styles.btnDownload}><Download size={14} /> Unduh</a>
                      </div>
                    )}
                    {material.type === 'video' && material.content && (
                      <div style={styles.videoLink}>
                        <a href={material.content} target="_blank" rel="noopener noreferrer" style={styles.linkExternal}><ExternalLink size={14} /> Buka Link Materi</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {assignments.length > 0 && (
          <div style={styles.sectionBox}>
            <h3 style={styles.sectionTitle}><Send size={18} color="#f59e0b" /> Tugas</h3>
            {assignments.map((assignment, idx) => {
              const submission = submissions[selectedModule.id];
              const isSubmitted = !!submission;
              return (
                <div key={assignment.id || idx} style={styles.assignmentCard}>
                  <div style={styles.assignmentHeader}>
                    <h4 style={styles.assignmentTitle}>{assignment.title || `Tugas ${idx + 1}`}</h4>
                    {isSubmitted && <span style={{ ...styles.badge, background: '#dcfce7', color: '#166534' }}><CheckCircle size={12} /> Terkirim</span>}
                  </div>
                  <div style={styles.assignmentContent}>{renderMath(assignment.content)}</div>
                  {assignment.endTime && <div style={styles.assignmentDeadline}><Clock size={14} /> Deadline: {new Date(assignment.endTime).toLocaleString('id-ID')}</div>}
                  {!isSubmitted ? (
                    <button onClick={() => setSelectedAssignment(assignment)} style={styles.btnSubmit}><Send size={16} /> Kumpulkan Tugas</button>
                  ) : (
                    <div style={styles.submittedInfo}><Clock size={14} /> Tugas sudah dikirim pada {new Date(submission.submittedAt?.toDate()).toLocaleString('id-ID')}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {hasQuiz && (
          <div style={styles.sectionBox}>
            <h3 style={styles.sectionTitle}><FileQuestion size={18} color="#8b5cf6" /> Kuis</h3>
            <div style={styles.quizCard}>
              <div style={styles.quizInfo}>
                <span>📝 {selectedModule.quizData?.length || 0} soal</span>
                {selectedModule.deadlineQuiz && <span>⏰ Deadline: {new Date(selectedModule.deadlineQuiz).toLocaleDateString('id-ID')}</span>}
              </div>
              <button onClick={() => window.location.href = `/siswa/kuis/${selectedModule.id}`} style={styles.btnQuiz}><FileQuestion size={16} /> Mulai Kuis</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // RENDER DAFTAR MODUL - TIDAK BERUBAH
  const renderModuleList = () => (
    <div style={styles.moduleList}>
      <div style={styles.listHeader}>
        <div>
          <h2 style={styles.listTitle}><BookOpen size={24} color="#3b82f6" /> E-Learning</h2>
          <p style={styles.listSubtitle}>Materi belajar, tugas, dan kuis untuk <strong>{studentKategori} - Kelas {studentKelas}</strong></p>
        </div>
        <div style={styles.viewToggle}>
          <button onClick={() => setViewMode('grid')} style={{ ...styles.viewBtn, background: viewMode === 'grid' ? '#3b82f6' : '#f1f5f9', color: viewMode === 'grid' ? 'white' : '#64748b' }}>
            <Grid3x3 size={16} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ ...styles.viewBtn, background: viewMode === 'list' ? '#3b82f6' : '#f1f5f9', color: viewMode === 'list' ? 'white' : '#64748b' }}>
            <List size={16} />
          </button>
        </div>
      </div>
      
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Cari materi atau tugas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        </div>
        <div style={styles.filterButtons}>
          <button onClick={() => setFilterType('all')} style={{ ...styles.filterBtn, background: filterType === 'all' ? '#3b82f6' : '#f1f5f9', color: filterType === 'all' ? 'white' : '#64748b' }}>Semua</button>
          <button onClick={() => setFilterType('module')} style={{ ...styles.filterBtn, background: filterType === 'module' ? '#3b82f6' : '#f1f5f9', color: filterType === 'module' ? 'white' : '#64748b' }}><BookOpen size={12} /> Modul</button>
          <button onClick={() => setFilterType('quiz')} style={{ ...styles.filterBtn, background: filterType === 'quiz' ? '#3b82f6' : '#f1f5f9', color: filterType === 'quiz' ? 'white' : '#64748b' }}><FileQuestion size={12} /> Kuis</button>
        </div>
      </div>
      
      <div style={styles.statsBar}>
        <div style={styles.statCard}><Layers size={16} /> {filteredModules.length} Modul</div>
        <div style={styles.statCard}><Send size={16} /> {filteredModules.filter(m => m.blocks?.some(b => b.type === 'assignment')).length} Tugas</div>
        <div style={styles.statCard}><FileQuestion size={16} /> {filteredModules.filter(m => m.quizData?.length > 0).length} Kuis</div>
      </div>
      
      {loading ? (
        <div style={styles.loadingBox}><div style={styles.spinner}></div><p>Memuat materi...</p></div>
      ) : filteredModules.length === 0 ? (
        <div style={styles.emptyBox}>
          <BookOpen size={48} color="#cbd5e1" />
          <p>Belum ada materi untuk {studentKategori} - Kelas {studentKelas}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={styles.modernGrid}>
          {filteredModules.map(module => renderModernCard(module))}
        </div>
      ) : (
        <div style={styles.listContainer}>
          {filteredModules.map(module => renderListView(module))}
        </div>
      )}
    </div>
  );

  // MODAL SUBMIT TUGAS - TIDAK BERUBAH
  const renderSubmitModal = () => {
    if (!selectedAssignment) return null;
    return (
      <div style={styles.modalOverlay} onClick={() => setSelectedAssignment(null)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}><h3 style={styles.modalTitle}>Kumpulkan Tugas</h3><button onClick={() => setSelectedAssignment(null)} style={styles.modalClose}><X size={20} /></button></div>
          <div style={styles.modalBody}>
            <div style={styles.assignmentQuestionBox}><label style={styles.modalLabel}>Soal/Instruksi:</label><div style={styles.assignmentQuestion}>{renderMath(selectedAssignment.content)}</div></div>
            <div style={styles.assignmentAnswerBox}><label style={styles.modalLabel}>Jawaban Anda:</label><textarea value={assignmentAnswer} onChange={(e) => setAssignmentAnswer(e.target.value)} placeholder="Tulis jawaban Anda di sini..." style={styles.assignmentTextarea} rows={6} /></div>
            <div style={styles.assignmentFileBox}>
              <label style={styles.modalLabel}>Upload File (Opsional):</label>
              <div style={styles.fileUploadArea}>
                <input type="file" id="assignmentFile" accept=".pdf,.doc,.docx,.jpg,.png,.txt" onChange={(e) => setAssignmentFile(e.target.files[0])} style={{ display: 'none' }} />
                <label htmlFor="assignmentFile" style={styles.fileUploadLabel}><Upload size={20} /> {assignmentFile ? assignmentFile.name : 'Klik untuk upload file'}</label>
                {assignmentFile && <button onClick={() => setAssignmentFile(null)} style={styles.removeFileBtn}><X size={14} /> Hapus</button>}
              </div>
              <p style={styles.fileHint}>Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button onClick={() => setSelectedAssignment(null)} style={styles.btnCancel}>Batal</button>
            <button onClick={handleSubmitAssignment} disabled={submitting} style={styles.btnSubmitModal}>{submitting ? 'Mengirim...' : 'Kirim Tugas'}</button>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewModal = () => {
    if (!previewFile) return null;
    return (
      <div style={styles.modalOverlay} onClick={() => setPreviewFile(null)}>
        <div style={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}><h3 style={styles.modalTitle}>Preview: {previewFile.name}</h3><button onClick={() => setPreviewFile(null)} style={styles.modalClose}><X size={20} /></button></div>
          <div style={styles.previewBody}>
            {previewFile.url.includes('.pdf') ? (
              <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`} style={styles.previewIframe} title="PDF Preview" />
            ) : previewFile.url.includes('.jpg') || previewFile.url.includes('.png') ? (
              <img src={previewFile.url} alt="Preview" style={styles.previewImage} />
            ) : (
              <div style={styles.previewFallback}><FileText size={48} color="#64748b" /><p>File tidak dapat dipreview langsung</p><a href={previewFile.url} download style={styles.btnDownloadLarge}><Download size={16} /> Unduh File</a></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {selectedModule ? renderModuleDetail() : renderModuleList()}
      {renderSubmitModal()}
      {renderPreviewModal()}
    </div>
  );
};

const styles = {
  container: { maxWidth: 1200, margin: '0 auto', padding: '20px', minHeight: '100vh', background: '#f8fafc' },
  
  // MODERN GRID STYLES
  modernGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  
  modernCard: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    ':hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 30px -12px rgba(0,0,0,0.15)' }
  },
  
  modernCardCover: {
    position: 'relative',
    height: '160px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overflow: 'hidden'
  },
  
  modernCardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    ':hover': { transform: 'scale(1.05)' }
  },
  
  modernCardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  
  modernCardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    ':hover': { opacity: 1 }
  },
  
  modernCardPlayIcon: {
    width: '48px',
    height: '48px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#1e293b'
  },
  
  modernCardBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backdropFilter: 'blur(4px)'
  },
  
  modernCardTypeBadge: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '600',
    background: 'rgba(0,0,0,0.6)',
    color: 'white'
  },
  
  modernCardBody: { padding: '16px' },
  
  modernCardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  
  modernCardSubject: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 12px 0'
  },
  
  modernCardMeta: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  
  modernCardMetaItem: {
    fontSize: '10px',
    padding: '3px 8px',
    borderRadius: '12px',
    background: '#f1f5f9',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  
  modernCardDeadline: {
    fontSize: '11px',
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '12px'
  },
  
  modernCardBtn: {
    width: '100%',
    padding: '10px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  
  // LIST VIEW STYLES
  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  
  listCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'white',
    padding: '12px',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #e2e8f0',
    ':hover': { background: '#f8fafc', transform: 'translateX(4px)' }
  },
  
  listCardImage: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#f1f5f9'
  },
  
  listCardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  listCardPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listCardContent: { flex: 1 },
  listCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' },
  listCardTitle: { fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 },
  listCardBadge: { padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  listCardSubject: { fontSize: '11px', color: '#64748b', margin: '0 0 6px 0' },
  listCardMeta: { display: 'flex', gap: '8px', fontSize: '10px', color: '#94a3b8' },
  
  // HEADER & FILTER STYLES
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  listTitle: { fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 },
  listSubtitle: { fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' },
  
  viewToggle: { display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' },
  viewBtn: { padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' },
  
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '200px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '13px', background: 'transparent' },
  
  filterButtons: { display: 'flex', gap: '8px' },
  filterBtn: { padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' },
  
  statsBar: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  statCard: { background: 'white', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#1e293b', border: '1px solid #e2e8f0' },
  
  // DETAIL MODUL STYLES
  moduleDetail: { width: '100%' },
  detailHeader: { marginBottom: '24px' },
  btnBack: { display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginBottom: '16px' },
  detailTitle: { marginBottom: '8px' },
  detailTitleText: { fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' },
  detailMeta: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  detailMetaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' },
  detailCover: { marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' },
  detailCoverImg: { width: '100%', maxHeight: '300px', objectFit: 'cover' },
  descriptionBox: { background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginBottom: '24px', color: '#475569', fontSize: '14px', lineHeight: '1.6' },
  sectionBox: { background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' },
  materialsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  materialCard: { display: 'flex', gap: '14px', padding: '12px', background: '#f8fafc', borderRadius: '12px' },
  materialIcon: { flexShrink: 0 },
  materialContent: { flex: 1 },
  materialTitle: { fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' },
  materialText: { fontSize: '13px', color: '#475569', lineHeight: '1.6' },
  filePreview: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  fileName: { fontSize: '12px', color: '#3b82f6', background: '#eef2ff', padding: '4px 10px', borderRadius: '6px' },
  btnPreview: { background: '#eef2ff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  btnDownload: { background: '#f1f5f9', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#475569' },
  linkExternal: { display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', textDecoration: 'none', fontSize: '12px' },
  assignmentCard: { padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' },
  assignmentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' },
  assignmentTitle: { fontSize: '14px', fontWeight: '700', color: '#b45309', margin: 0 },
  badge: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },
  assignmentContent: { fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '12px' },
  assignmentDeadline: { fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' },
  btnSubmit: { background: '#f59e0b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  submittedInfo: { fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' },
  quizCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  quizInfo: { display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' },
  btnQuiz: { background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  
  loadingBox: { textAlign: 'center', padding: '60px', color: '#64748b' },
  emptyBox: { textAlign: 'center', padding: '60px', color: '#94a3b8' },
  spinner: { width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalContent: { background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' },
  previewModalContent: { background: 'white', borderRadius: '20px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
  modalTitle: { fontSize: '16px', fontWeight: '700', margin: 0 },
  modalClose: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  modalBody: { padding: '20px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e2e8f0' },
  assignmentQuestionBox: { marginBottom: '20px' },
  modalLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' },
  assignmentQuestion: { background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' },
  assignmentAnswerBox: { marginBottom: '20px' },
  assignmentTextarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  assignmentFileBox: { marginBottom: '20px' },
  fileUploadArea: { marginBottom: '8px' },
  fileUploadLabel: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#64748b' },
  removeFileBtn: { marginTop: '8px', background: '#fee2e2', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' },
  fileHint: { fontSize: '10px', color: '#94a3b8', margin: '4px 0 0' },
  btnCancel: { background: '#f1f5f9', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  btnSubmitModal: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  previewBody: { padding: '20px', minHeight: '400px' },
  previewIframe: { width: '100%', height: '500px', border: 'none', borderRadius: '8px' },
  previewImage: { maxWidth: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block', margin: '0 auto' },
  previewFallback: { textAlign: 'center', padding: '60px' },
  btnDownloadLarge: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: 'white', textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', marginTop: '16px' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .modern-card:hover .cover-image { transform: scale(1.05); } .modern-card:hover .card-overlay { opacity: 1; }`;
  document.head.appendChild(style);
}

export default StudentElearning;