// /api/questionCollector.js
// Kandidat soal -> fingerprint -> dedup -> ranking berbasis source evidence.
import {
    buildCollectorQueries,
    dedupeSources,
    fingerprint,
    jinaSearch,
    clean
  } from './_lib/gemilangResearch.js';
  
  function candidateBlocks(content = '') {
    const text = String(content || '');
    const matches = text.match(/(?:\d+\.|\bSoal\s+\d+|\bNomor\s+\d+)[\s\S]{0,700}?(?=(?:\d+\.|\bSoal\s+\d+|\bNomor\s+\d+|$))/gi);
    return matches || [];
  }
  
  function rank(candidate) {
    let score = 0;
    if (candidate.url) score += 2;
    if (candidate.content.length > 120) score += 2;
    if (/hots|penalaran|analisis|alasan|mengapa|berdasarkan/i.test(candidate.content)) score += 2;
    if (/jawaban|kunci|pembahasan/i.test(candidate.content)) score += 2;
    if (/gambar|grafik|diagram|tabel/i.test(candidate.content)) score += 1;
    return score;
  }
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const { blueprintItem, mapel = 'Umum', kelas = '', targetYear = new Date().getFullYear() + 1, limit = 10, excludeFingerprints = [] } = req.body || {};
    if (!blueprintItem) return res.status(400).json({ success: false, error: 'blueprintItem wajib diisi.' });
  
    try {
      const queries = buildCollectorQueries({ blueprintItem, mapel, kelas, targetYear });
      const found = [];
      for (const query of queries) found.push(...await jinaSearch(query, { maxResults: 8 }));
      const sources = dedupeSources(found);
      const excluded = new Set((excludeFingerprints || []).map(fingerprint));
      const seen = new Set();
      const candidates = [];
  
      for (const source of sources) {
        const blocks = candidateBlocks(source.content);
        const units = blocks.length ? blocks : [source.content];
        for (const block of units) {
          const text = clean(block);
          const key = fingerprint(text);
          if (key.length < 50 || seen.has(key) || excluded.has(key)) continue;
          seen.add(key);
          candidates.push({
            candidateId: `cand_${candidates.length + 1}`,
            questionText: text,
            fingerprint: key,
            sourceTitle: source.title || '',
            sourceUrl: source.url || '',
            score: rank({ content: text, url: source.url })
          });
        }
      }
  
      candidates.sort((a, b) => b.score - a.score);
      return res.status(200).json({
        success: true,
        blueprintItem,
        candidates: candidates.slice(0, Math.max(1, Math.min(30, Number(limit) || 10))),
        diagnostics: { queries, sourceCount: sources.length, candidateCount: candidates.length }
      });
    } catch (error) {
      return res.status(error.status === 429 ? 429 : 502).json({ success: false, error: error.message });
    }
  }