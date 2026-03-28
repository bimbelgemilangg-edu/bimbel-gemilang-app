import React from 'react';
import { Trash2, Plus, CheckCircle } from 'lucide-react';

const ManageQuiz = ({ blockId, questions, onUpdate }) => {
  const addQuestion = () => {
    const newQuestions = [...questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }];
    onUpdate(blockId, newQuestions);
  };

  const updateQ = (qId, val) => {
    const newQuestions = questions.map(q => q.id === qId ? { ...q, q: val } : q);
    onUpdate(blockId, newQuestions);
  };

  const updateOpt = (qId, optIdx, val) => {
    const newQuestions = questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    });
    onUpdate(blockId, newQuestions);
  };

  const setCorrect = (qId, optIdx) => {
    const newQuestions = questions.map(q => q.id === qId ? { ...q, correct: optIdx } : q);
    onUpdate(blockId, newQuestions);
  };

  return (
    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {questions.map((item, idx) => (
        <div key={item.id} style={{ background: 'white', padding: '15px', marginBottom: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#673ab7' }}>SOAL #{idx + 1}</span>
            <button onClick={() => onUpdate(blockId, questions.filter(q => q.id !== item.id))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
              <Trash2 size={16}/>
            </button>
          </div>
          <input 
            style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            placeholder="Ketik pertanyaan kuis..."
            value={item.q}
            onChange={(e) => updateQ(item.id, e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {item.options.map((opt, optIdx) => (
              <div key={optIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: item.correct === optIdx ? '#f0fdf4' : '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input type="radio" checked={item.correct === optIdx} onChange={() => setCorrect(item.id, optIdx)} />
                <input 
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' }}
                  placeholder={`Opsi ${optIdx + 1}`}
                  value={opt}
                  onChange={(e) => updateOpt(item.id, optIdx, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addQuestion} style={{ width: '100%', padding: '12px', border: '2px dashed #673ab7', color: '#673ab7', background: 'white', cursor: 'pointer', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Plus size={16}/> Tambah Pertanyaan Kuis
      </button>
    </div>
  );
};

export default ManageQuiz;