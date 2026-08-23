// /api/researchPlanner.js
// Riset resmi -> analisis blueprint -> rekomendasi distribusi
import {
    buildBlueprintQueries,
    callCloudflareAI,
    dedupeSources,
    extractAIText,
    extractJsonObjects,
    jinaSearch,
    readWebPage,
    clean,
    MODEL
  } from './_lib/gemilangResearch.js';
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  
    const { topic, mapel = 'Umum', kelas = '', targetYear = new Date().getFullYear() + 1, jumlahSoal = 40, arahan = '' } = req.body || {};
    if (!clean(topic)) return res.status(400).json({ success: false, error: 'Topik wajib diisi.' });
  
    try {
      const queries = buildBlueprintQueries({ topic, mapel, kelas, targetYear });
      const found = [];
      const errors = [];
      for (const query of queries) {
        try { found.push(...await jinaSearch(query, { maxResults: 8 })); }
        catch (error) { errors.push({ query, error: error.message }); }
      }
  
      const sources = dedupeSources(found);
      const pages = [];
      for (const source of sources.slice(0, 12)) pages.push(await readWebPage(source));
  
      const researchPack = pages.map((page, index) => `SOURCE ${index}\nTITLE: ${page.title}\nURL: ${page.url}\nCONTENT:\n${String(page.content || '').slice(0, 7000)}`).join('\n\n---\n\n');
  
      const system = `Kamu adalah Research Planner Bimbel Gemilang.\n\nBuat blueprint akademik sebelum pembuatan soal.\n\nATURAN:\n- Prioritaskan sumber resmi.\n- Jangan mengklaim distribusi jumlah sebagai resmi jika sumber resmi tidak memberikan angka.\n- Bila distribusi tidak resmi, beri allocationBasis = "Rekomendasi Gemilang".\n- Pisahkan sourceBasis: official / supporting / recommendation.\n- Jangan membuat URL palsu.\n- Output hanya satu JSON object.\n\nSCHEMA:\n{\n  "exam":"",\n  "level":"",\n  "grade":"",\n  "subject":"",\n  "targetYear":2027,\n  "totalQuestions":40,\n  "domains":[\n    {"name":"","subtopics":[],"competency":"","cognitiveLevel":"","allocation":0,"allocationBasis":"official|Rekomendasi Gemilang","sourceBasis":"official|supporting|recommendation","sourceIndex":0}\n  ],\n  "assessmentForm":[],\n  "officialSources":[],\n  "allocationStatus":"official|recommended",\n  "notes":""\n}`;
  
      const user = `INPUT GURU\nTopik: ${clean(topic)}\nMapel: ${clean(mapel)}\nKelas: ${clean(kelas)}\nTarget tahun: ${targetYear}\nJumlah: ${jumlahSoal}\nArahan: ${clean(arahan)}\n\nSUMBER RISET\n${researchPack}`;
  
      const ai = await callCloudflareAI(system, user);
      const raw = extractAIText(ai);
      const blueprint = extractJsonObjects(raw)[0];
      if (!blueprint) return res.status(502).json({ success: false, error: 'Cloudflare tidak menghasilkan blueprint yang valid.', debug: { raw: raw.slice(0, 2000) } });
  
      const officialSources = (blueprint.officialSources || []).map(source => ({ title: source.title || '', url: source.url || '' }));
      return res.status(200).json({
        success: true,
        blueprint: {
          ...blueprint,
          totalQuestions: Number(blueprint.totalQuestions || jumlahSoal),
          targetYear: Number(blueprint.targetYear || targetYear),
          allocationStatus: blueprint.allocationStatus || 'recommended'
        },
        researchSources: pages.map(page => ({ title: page.title || '', url: page.url || '' })),
        officialSources,
        diagnostics: { queries, searchSourceCount: sources.length, readablePageCount: pages.length, queryErrors: errors, model: MODEL }
      });
    } catch (error) {
      return res.status(error.status === 429 ? 429 : 502).json({ success: false, error: error.status === 429 ? 'Kuota Cloudflare Workers AI mencapai batas.' : 'Research Planner gagal.', debug: error.message });
    }
  }