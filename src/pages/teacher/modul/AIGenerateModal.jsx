// src/pages/teacher/modul/AIGenerateModal.jsx
import React, { useState } from 'react';
import { 
  X, Upload, FileText, Image, Sparkles, Loader2, 
  CheckCircle, AlertCircle, FileUp, CloudArrowUp,
  Plus, Trash2, Eye, Edit3, Send, Calculator
} from 'lucide-react';
import { extractQuestionsFromText, extractQuestionsFromPDF, parseManualText } from '../../../services/aiService';

const AIGenerateModal = ({ isOpen, onClose, onQuestionsGenerated, modulId }) => {
  const [activeTab, setActiveTab] = useState('file');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState('');
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    let questions = [];

    try {
      if (activeTab === 'file' && file) {
        const fileType = file.type;
        if (fileType === 'application/pdf') {
          questions = await extractQuestionsFromPDF(file, maxQuestions);
        } else if (fileType.startsWith('image/')) {
          questions = await extractQuestionsFromText(
            `[Gambar: ${file.name}] - Silakan upload gambar dengan teks soal yang jelas`,
            maxQuestions
          );
        } else {
          setError('Format file tidak didukung. Gunakan PDF atau Gambar.');
          setLoading(false);
          return;
        }
      } else if (activeTab === 'text' && manualText.trim()) {
        questions = await parseManualText(manualText, maxQuestions);
      } else {
        setError('Silakan upload file atau masukkan teks soal.');
        setLoading(false);
        return;
      }

      if (questions.length === 0) {
        setError('Tidak ada soal yang terdeteksi. Periksa format input.');
        setLoading(false);
        return;
      }

      setGeneratedQuestions(questions);
      
      if (typeof onQuestionsGenerated === 'function') {
        onQuestionsGenerated(questions);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Generate error:', err);
      setError('Gagal generate soal: ' + err.message);
      setLoading(false);
    }
  };

  const handleUseQuestions = () => {
    if (generatedQuestions.length > 0 && typeof onQuestionsGenerated === 'function') {
      onQuestionsGenerated(generatedQuestions);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <Sparkles size={20} color="#8b5cf6" />
            <h3 style={styles.modalTitle}>🤖 AI Generate Soal</h3>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.modalBody}>
          {/* Tabs */}
          <div style={styles.tabContainer}>
            <button 
              onClick={() => setActiveTab('file')}
              style={styles.tabButton(activeTab === 'file')}
            >
              <FileUp size={14} /> File / PDF
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              style={styles.tabButton(activeTab === 'text')}
            >
              <FileText size={14} /> Teks Manual
            </button>
          </div>

          {/* File Upload */}
          {activeTab === 'file' && (
            <div style={styles.fileArea}>
              <input 
                type="file" 
                id="fileUpload" 
                accept=".pdf,image/*" 
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              <label htmlFor="fileUpload" style={styles.fileLabel}>
                {file ? (
                  <div style={styles.fileInfo}>
                    <CheckCircle size={24} color="#10b981" />
                    <span style={styles.fileName}>{fileName}</span>
                    <button 
                      onClick={(e) => { e.preventDefault(); setFile(null); setFileName(''); }}
                      style={styles.removeFileBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={styles.uploadArea}>
                    <CloudArrowUp size={32} color="#94a3b8" />
                    <span style={styles.uploadText}>Klik atau seret file kesini</span>
                    <span style={styles.uploadSubtext}>Mendukung PDF & Gambar</span>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Text Area */}
          {activeTab === 'text' && (
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Tempelkan draf soal ujian di sini...
Contoh:
1. Berapa 2+2?
A. 2
B. 4
C. 6
D. 8

2. Ibu kota Indonesia?
A. Jakarta
B. Bandung
C. Surabaya
D. Medan"
              style={styles.textArea}
              rows={8}
            />
          )}

          {/* Config */}
          <div style={styles.configRow}>
            <div style={styles.configGroup}>
              <label style={styles.configLabel}>Maksimal Soal</label>
              <select 
                value={maxQuestions} 
                onChange={(e) => setMaxQuestions(parseInt(e.target.value))}
                style={styles.configSelect}
              >
                <option value="5">5 Soal</option>
                <option value="10">10 Soal</option>
                <option value="20">20 Soal</option>
                <option value="30">30 Soal</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            style={styles.generateBtn(loading)}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> 
                AI Sedang Memproses...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Ekstrak & Buat Soal
              </>
            )}
          </button>

          {/* Generated Questions Preview */}
          {generatedQuestions.length > 0 && (
            <div style={styles.previewSection}>
              <div style={styles.previewHeader}>
                <span style={styles.previewTitle}>
                  <CheckCircle size={16} color="#10b981" />
                  {generatedQuestions.length} Soal Terdeteksi
                </span>
                <button onClick={handleUseQuestions} style={styles.useBtn}>
                  <Send size={14} /> Gunakan Soal
                </button>
              </div>
              <div style={styles.previewList}>
                {generatedQuestions.slice(0, 3).map((q, i) => (
                  <div key={i} style={styles.previewItem}>
                    <span style={styles.previewNum}>{i + 1}.</span>
                    <span style={styles.previewText}>
                      {q.q || q.question || 'Soal'}
                      {q.options && q.options.length > 0 && (
                        <span style={styles.previewOptions}>
                          {q.options.map((opt, oi) => (
                            <span key={oi}>{String.fromCharCode(65 + oi)}. {opt}</span>
                          ))}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {generatedQuestions.length > 3 && (
                  <span style={styles.previewMore}>+{generatedQuestions.length - 3} soal lainnya</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    background: 'white',
    borderRadius: 16,
    maxWidth: 650,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b'
  },
  closeBtn: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  },
  modalBody: {
    padding: '20px',
    overflow: 'auto',
    flex: 1
  },
  tabContainer: {
    display: 'flex',
    gap: 6,
    background: '#f1f5f9',
    padding: 4,
    borderRadius: 10,
    marginBottom: 16
  },
  tabButton: (active) => ({
    flex: 1,
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    background: active ? 'white' : 'transparent',
    color: active ? '#1e293b' : '#64748b',
    boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  }),
  fileArea: {
    border: '2px dashed #e2e8f0',
    borderRadius: 12,
    padding: '20px',
    marginBottom: 16,
    textAlign: 'center',
    background: '#f8fafc',
    minHeight: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileInput: {
    display: 'none'
  },
  fileLabel: {
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  uploadText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b'
  },
  uploadSubtext: {
    fontSize: 11,
    color: '#94a3b8'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'white',
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #e2e8f0'
  },
  fileName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b'
  },
  removeFileBtn: {
    background: '#fee2e2',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ef4444'
  },
  textArea: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'monospace',
    background: '#f8fafc',
    marginBottom: 16,
    boxSizing: 'border-box'
  },
  configRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  configGroup: {
    flex: 1,
    minWidth: 120
  },
  configLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 4
  },
  configSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 12,
    background: 'white',
    outline: 'none'
  },
  errorBox: {
    padding: '10px 14px',
    background: '#fee2e2',
    borderRadius: 8,
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626'
  },
  generateBtn: (loading) => ({
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: loading ? '#94a3b8' : 'linear-gradient(135deg, #673ab7, #8b5cf6)',
    color: 'white',
    fontWeight: 700,
    fontSize: 13,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: '0.2s'
  }),
  previewSection: {
    marginTop: 16,
    padding: '14px',
    background: '#f8fafc',
    borderRadius: 10,
    border: '1px solid #e2e8f0'
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  useBtn: {
    padding: '6px 14px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  previewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 150,
    overflowY: 'auto'
  },
  previewItem: {
    display: 'flex',
    gap: 8,
    padding: '6px 10px',
    background: 'white',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    fontSize: 11
  },
  previewNum: {
    fontWeight: 700,
    color: '#673ab7',
    minWidth: 20
  },
  previewText: {
    color: '#1e293b',
    flex: 1
  },
  previewOptions: {
    display: 'block',
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  },
  previewMore: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    padding: '4px'
  }
};

export default AIGenerateModal;