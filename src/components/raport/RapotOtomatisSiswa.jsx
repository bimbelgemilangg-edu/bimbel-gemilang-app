// src/components/raport/RapotOtomatisSiswa.jsx
// ============================================================
// FASE 2 RAPORT OTOMATIS (21 Okt 2026) — tampilan siswa untuk snapshot
// TERBIT (raport_final sumber:'otomatis', termasuk blok:'proses').
//
// Janji tampilan (blueprint §9 lapis 4):
//   - nilai akademik & proses/karakter DUA angka terpisah (keputusan owner)
//   - dimensi tanpa bukti = label "belum terukur" (TIDAK PERNAH 0)
//   - pelanggaran integritas = catatan pembinaan, bukan pengurang nilai
//   - tren try out (skala nasional), tren harian (sparkline), peta topik
//     merah/kuning/hijau + rekomendasi — semua dari snapshot terkunci,
//     tidak ada perhitungan ulang di sisi siswa (hemat baca & konsisten
//     dengan PDF yang dicetak admin dari dokumen yang sama).
// Komponen ini BACA-SAJA: menerima grup dokumen dari StudentSmartReport.
// ============================================================
import React, { useState } from 'react';
import { Bot, Brain, Lightbulb, Target, Clock, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import {
  poinSparkline, warnaStatusTopik, warnaPredikatHuruf, DIMENSI_LABEL, DIMENSI_KEYS,
  poinRadar, seriRadarDariModel, WARNA_RADAR_GLOBAL, RADAR_MAKS_SERI,
  petaTampil, rekomendasiTampil, deskripsiMapel, bersihkanV1,
} from '../../utils/raportCetak';
import { predikatDariNilai } from '../../utils/raportOtomatis';
import { narasiCapaianSiswa } from '../../utils/laporanBelajar';

const gayaKartu = { background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e2e8f0', marginBottom: 16 };
const gayaMini = { border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', background: '#f8fafc', fontSize: 11, flex: '1 1 150px' };

const dimensiIkon = (k) => ({
  pemahaman: <Brain size={14} />, analisis: <Lightbulb size={14} />, ketelitian: <Target size={14} />,
  waktu: <Clock size={14} />, dayaTangkap: <Zap size={14} />,
}[k] || null);

const fmt = (n) => (Number.isFinite(n) ? n : '—');

/** Sparkline React dari poinSparkline (murni) — null skor tidak digambar. */
function SparklineTren({ trenHarian, lebar }) {
  const s = poinSparkline(trenHarian, { lebar, tinggi: 48 });
  if (!s) {
    return <div style={{ fontSize: 11, color: '#94a3b8' }}>Belum ada minimal 2 aktivitas berskor untuk digambarkan.</div>;
  }
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${s.lebar} ${s.tinggi + 12}`} style={{ maxWidth: s.lebar }} role="img" aria-label="Tren skor harian">
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={s.points} />
        <circle cx={s.terakhir.x} cy={s.terakhir.y} r="3" fill="#4f46e5" />
        <text x={s.pertama.x} y={s.tinggi + 9} fontSize="8" fill="#64748b">{s.pertama.tanggal}</text>
        <text x={Math.min(s.terakhir.x, s.lebar - 90)} y={s.tinggi + 9} fontSize="8" fill="#64748b" textAnchor="end">{`${s.terakhir.tanggal} · ${s.terakhir.skor}`}</text>
      </svg>
      <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.jumlah} aktivitas berskor · min {s.min} · maks {s.max}</div>
    </div>
  );
}

/** Bagan jaring laba-laba React dari poinRadar (murni) — dimensi null tidak
 * digambar di 0; seri <3 dimensi terukur tampil sebagai titik (jujur). */
function RadarDimensi({ proses, akademik, isMobile }) {
  const { seri, jumlahMapel } = seriRadarDariModel({ proses, akademik });
  const g = poinRadar(seri, { ukuran: isMobile ? 210 : 250 });
  if (!g) {
    return <div style={{ fontSize: 11, color: '#94a3b8' }}>Belum ada dimensi terukur — bagan tidak digambar daripada menampilkan bentuk kosong yang menyesatkan.</div>;
  }
  const terpotong = Math.max(0, jumlahMapel - RADAR_MAKS_SERI);
  const sudut = (i) => ((-90 + (i * 360) / g.sumbu.length) * Math.PI) / 180;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="100%" viewBox={`0 0 ${g.lebar} ${g.tinggi}`} style={{ maxWidth: g.lebar }} role="img" aria-label="Bagan jaring laba-laba dimensi">
        {g.cincin.map((pct) => (
          <polygon
            key={pct}
            points={g.sumbu.map((_, i) => {
              const r = (pct / 100) * g.R;
              return `${Math.round((g.pusat.x + Math.cos(sudut(i)) * r) * 10) / 10},${Math.round((g.pusat.y + Math.sin(sudut(i)) * r) * 10) / 10}`;
            }).join(' ')}
            fill="none"
            stroke="#e2e8f0"
          />
        ))}
        {g.sumbu.map((a) => <line key={a.key} x1={g.pusat.x} y1={g.pusat.y} x2={a.xUjung} y2={a.yUjung} stroke="#cbd5e1" />)}
        {g.seri.map((x) => (
          <g key={x.label}>
            {x.bisaPoligon ? (
              <polygon points={x.points} fill={x.warna} fillOpacity={x.tebal ? 0.1 : 0.05} stroke={x.warna} strokeWidth={x.tebal ? 2.6 : 1.6} strokeDasharray={x.putus ? '4 3' : undefined} />
            ) : null}
            {x.poin.map((p) => <circle key={p.key} cx={p.x} cy={p.y} r={x.tebal ? 2.6 : 2} fill={x.warna} />)}
            {x.tebal && x.poin.map((p) => {
              const dx = p.x - g.pusat.x; const dy = p.y - g.pusat.y;
              const len = Math.hypot(dx, dy) || 1;
              return (
                <text key={p.key} x={p.x + (dx / len) * 11} y={p.y + (dy / len) * 11} fontSize="9" fontWeight="800" fill={WARNA_RADAR_GLOBAL} textAnchor="middle">
                  {p.nilai}
                </text>
              );
            })}
          </g>
        ))}
        {g.sumbu.map((a) => (
          <text key={a.key} x={a.xLabel} y={a.yLabel} fontSize="9.5" fontWeight="700" fill="#334155" textAnchor={a.anchor}>
            {a.label}
          </text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginTop: 4 }}>
        {g.seri.map((x) => (
          <span key={x.label} style={{ fontSize: 9.5, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#334155' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: x.warna, display: 'inline-block' }} />
            {x.label}{x.jumlahNull ? ` · ${x.jumlahNull} belum terukur` : ''}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 4 }}>
        Garis tebal indigo = dimensi global; poligon tipis = per mapel. Sumbu yang tidak tersentuh poligon berarti belum terukur (tidak digambar di 0).
        {terpotong > 0 ? ` Menampilkan ${RADAR_MAKS_SERI} mapel pertama dari ${jumlahMapel}.` : ''}
      </div>
    </div>
  );
}

export default function RapotOtomatisSiswa({ grup = [], isMobile = false, capaianPerPeriode = {} }) {
  const [periodeSel, setPeriodeSel] = useState(null);
  const entri = grup.find((g) => g.periode === periodeSel) || grup[0] || null;
  if (!entri) return null;

  const proses = entri.proses || null;
  const akademik = entri.akademik || [];
  const mapelLayak = akademik.filter((d) => Number.isFinite(d.nilai_akhir) && d.statusData !== 'belum-cukup');
  const rataFallback = mapelLayak.length
    ? Math.round((mapelLayak.reduce((s, d) => s + d.nilai_akhir, 0) / mapelLayak.length) * 10) / 10
    : null;
  const rataAkademik = proses && Number.isFinite(proses.rataRataAkademik) ? proses.rataRataAkademik : rataFallback;
  const predikatAkademik = predikatDariNilai(rataAkademik);
  const nilaiProses = proses && Number.isFinite(proses.nilai_akhir) ? proses.nilai_akhir : null;
  const predikatProses = (proses && proses.predikat) || predikatDariNilai(nilaiProses);
  const dp = (proses && proses.detail_proses) || {};
  const kh = dp.kehadiran || {};
  const lh = dp.latihan || {};
  const tt = dp.tugas || {};
  const kw = dp.ketepatanWaktu || {};
  const ig = dp.integritas || {};
  const trenSkala = (proses && proses.trenSkala) || [];
  // Jenjang tanpa TO berskala nasional (tidak menyentuh TKA/SNBT): tren ujian
  // tetap dianalisis dari persen benar per paket — '—' jujur, bukan 0 karangan.
  const trenPersen = trenSkala.length
    ? []
    : ((proses && proses.trenHarian) || []).filter((t) => t.jenis === 'to' && t.skor !== null && t.skor !== undefined);
  const petaTopik = (proses && proses.petaTopik) || [];
  const rekomendasi = rekomendasiTampil(petaTopik); // v1.2: wajah baru tanpa terbit ulang
  const dihitungPada = entri.jejak?.dihitungPada ? new Date(entri.jejak.dihitungPada).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div>
      {/* ===== KEPALA + PEMILIH PERIODE ===== */}
      <div style={{ ...gayaKartu, borderColor: '#c7d2fe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Bot size={18} color="#4338ca" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Rapor Otomatis</h3>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 999, padding: '2px 8px' }}>
            dihitung otomatis oleh Asisten Belajar Gemilang dari log aktivitasmu{entri.terkunci ? ' · snapshot terkunci 🔒' : ''}
          </span>
        </div>
        {grup.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {grup.map((g) => (
              <button
                key={g.periode}
                type="button"
                onClick={() => setPeriodeSel(g.periode)}
                style={{
                  padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${g.periode === entri.periode ? '#4338ca' : '#e2e8f0'}`,
                  background: g.periode === entri.periode ? '#4338ca' : '#fff',
                  color: g.periode === entri.periode ? '#fff' : '#475569',
                }}
              >
                {g.labelManusiawi}
              </button>
            ))}
          </div>
        )}
        {grup.length === 1 && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Periode: <b>{entri.labelManusiawi}</b></div>
        )}

        {/* Dua angka terpisah (keputusan owner) */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 140px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: warnaPredikatHuruf(predikatAkademik.huruf) }}>{fmt(rataAkademik)}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>AKADEMIK · {predikatAkademik.huruf} ({predikatAkademik.label})</div>
          </div>
          <div style={{ flex: '1 1 140px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: warnaPredikatHuruf(predikatProses.huruf) }}>{fmt(nilaiProses)}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>PROSES & KARAKTER · {predikatProses.huruf} ({predikatProses.label})</div>
          </div>
        </div>
        {proses && proses.kelayakan && !proses.kelayakan.layakTerbit && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px' }}>
            {proses.kelayakan.alasan || 'Sebagian capaian masih dilengkapi dari asesmen berikutnya; semua angka yang tampil berasal dari aktivitas nyata.'}
          </div>
        )}
        {/* v1.5.1: capaian yang dinilai tentor (laporan_belajar) — siswa melihat
            penilaian tentornya dengan bahasa yang sama seperti PDF orang tua. */}
        {(capaianPerPeriode[entri.periode] || []).length > 0 && (
          <div style={{ marginTop: 12, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#3730a3' }}>✍️ Laporan dari Tentor — capaian dinilai tentor</div>
            {(capaianPerPeriode[entri.periode] || []).map((d, i) => (
              <div key={`${d.kodeMapel || i}`} style={{ marginTop: 6, fontSize: 11.5, color: '#1e293b', lineHeight: 1.6 }}>
                <b>{d.namaMapel || d.kodeMapel || 'Capaian'}.</b> {narasiCapaianSiswa(d, {})}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== BLOK A: PER MAPEL ===== */}
      <div style={gayaKartu}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>📚 Capaian per Mapel ({akademik.length})</h3>
        {akademik.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada aktivitas akademik terdeteksi pada periode ini.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {akademik.map((d) => {
            const dimensiNull = DIMENSI_KEYS.filter((k) => !Number.isFinite(d.detail_dimensi?.[k]));
            const kom = d.detail_komponen || {};
            return (
              <details key={`${d.mapelKode}-${d.periode}`} style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', padding: '10px 12px' }}>
                <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{d.mapel}</span>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      kuis {kom.kuis?.jumlah ?? 0}× · tugas {kom.tugas?.jumlah ?? 0}× · try out {kom.ujian?.jumlah ?? 0}×
                      {dimensiNull.length > 0 && ` · ${dimensiNull.length} dimensi belum terukur`}
                    </div>
                  </div>
                  <span style={{ fontSize: 19, fontWeight: 800, color: warnaPredikatHuruf(d.predikat?.huruf) }}>
                    {fmt(d.nilai_akhir)} <span style={{ fontSize: 12 }}>{d.predikat?.huruf || '—'}</span>
                  </span>
                </summary>
                <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
                  <div style={{ marginBottom: 6 }}>{bersihkanV1(String(d.mode_perhitungan || '').replace(/^Data belum cukup\s*[—-]\s*/i, ''))}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {DIMENSI_KEYS.map((k) => {
                      const v = d.detail_dimensi?.[k];
                      const terukur = Number.isFinite(v);
                      return (
                        <span key={k} title={d.dimensi_sumber?.[k] || (terukur ? '' : 'belum terukur')} style={{ fontSize: 9.5, borderRadius: 999, padding: '2px 8px', border: `1px solid ${terukur ? '#c7d2fe' : '#e2e8f0'}`, color: terukur ? '#4338ca' : '#94a3b8', fontStyle: terukur ? 'normal' : 'italic' }}>
                          {DIMENSI_LABEL[k]}: {terukur ? v : 'belum terukur'}
                        </span>
                      );
                    })}
                  </div>
                  {(d.catatan || []).map((c, i) => <div key={i} style={{ fontSize: 10.5, color: '#b45309' }}>• {c}</div>)}
                  <div style={{ marginTop: 6, fontSize: 11 }}>{deskripsiMapel(d)}</div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* ===== BLOK B: PROSES & KARAKTER ===== */}
      {proses && (
        <div style={gayaKartu}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>🧭 Proses & Karakter</h3>
          <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 10 }}>{proses.mode_perhitungan}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={gayaMini}>
              <b>Kehadiran</b>
              <div>{kh.total ? `${kh.hadir}/${kh.total} hadir (${fmt(kh.persenHadir)}%) · ${kh.sakit ?? 0} sakit · ${kh.izin ?? 0} izin · ${kh.alpha ?? 0} alpha` : 'belum ada catatan'}</div>
              <div style={{ color: '#475569' }}>skor adil: <b>{fmt(kh.skor)}</b> {kh.skor == null && kh.total ? '(belum diskor)' : ''}</div>
              {kh.alasan && <div style={{ color: '#64748b' }}>{bersihkanV1(kh.alasan)}</div>}
              <div style={{ color: '#94a3b8', fontSize: 10 }}>sakit/izin tidak dihukum</div>
            </div>
            <div style={gayaMini}>
              <b>Latihan mandiri</b>
              <div>{lh.hariAktif ?? 0}/{lh.targetHari ?? '—'} hari aktif · {lh.soalDikerjakan ?? 0}/{lh.targetSoal ?? '—'} soal</div>
              <div style={{ color: '#475569' }}>skor: <b>{fmt(lh.skor)}</b></div>
            </div>
            <div style={gayaMini}>
              <b>Tugas</b>
              <div>{tt.terkumpul ?? 0} dikumpulkan{tt.dinilai !== undefined ? ` · ${tt.dinilai} dinilai guru` : ''}</div>
              {tt.terukur === false && tt.alasan && <div style={{ color: '#64748b' }}>{bersihkanV1(tt.alasan)}</div>}
            </div>
            <div style={gayaMini}>
              <b>Ketepatan waktu</b>
              <div style={{ color: '#94a3b8' }}>belum terukur (v1)</div>
              <div style={{ color: '#94a3b8', fontSize: 10 }}>{bersihkanV1(kw.alasan)}</div>
            </div>
            <div style={{ ...gayaMini, borderColor: (ig.jumlahPelanggaran || 0) > 0 ? '#fde68a' : '#e2e8f0', background: (ig.jumlahPelanggaran || 0) > 0 ? '#fffbeb' : '#f8fafc' }}>
              <b style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} /> Integritas ujian</b>
              <div style={{ color: (ig.jumlahPelanggaran || 0) > 0 ? '#92400e' : '#475569' }}>{ig.catatan || '—'}</div>
              {(ig.pelanggaran || []).map((v, i) => (
                <div key={i} style={{ fontSize: 10, color: '#92400e' }}>{v.tanggal} · {v.jenis}{v.paketJudul ? ` — ${v.paketJudul}` : ''}</div>
              ))}
            </div>
            {dp.xp && (
              <div style={gayaMini}>
                <b>XP</b>
                <div>{dp.xp.xp ?? 0} total · {dp.xp.xpMingguIni ?? 0} minggu ini</div>
              </div>
            )}
          </div>

          {/* 5 dimensi global (proksi otomatis) */}
          <h3 style={{ margin: '14px 0 8px', fontSize: 13, fontWeight: 700 }}>🧠 5 Dimensi (proksi otomatis dari log)</h3>
          <div style={{ marginBottom: 12 }}>
            <RadarDimensi proses={proses} akademik={akademik} isMobile={isMobile} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DIMENSI_KEYS.map((k) => {
              const v = proses.dimensi_global?.[k];
              const terukur = Number.isFinite(v);
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: terukur ? '#e0e7ff' : '#f1f5f9', color: terukur ? '#4338ca' : '#94a3b8' }}>
                    {dimensiIkon(k)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700 }}>{DIMENSI_LABEL[k]}</div>
                    <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{proses.dimensi_global_sumber?.[k] || (terukur ? '' : 'belum ada bukti yang cukup')}</div>
                    {terukur && (
                      <div style={{ height: 5, borderRadius: 3, background: '#e2e8f0', marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, v))}%`, borderRadius: 3, background: '#4f46e5' }} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: terukur ? '#4338ca' : '#94a3b8', minWidth: 38, textAlign: 'center', fontStyle: terukur ? 'normal' : 'italic' }}>
                    {terukur ? v : 'belum terukur'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== BLOK C: PERKEMBANGAN ===== */}
      {proses && (
        <div style={gayaKartu}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="#4f46e5" /> Perkembangan
          </h3>

          {trenSkala.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Try out — skala nasional</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {trenSkala.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11.5 }}>
                    <div>
                      <b>{t.paketJudul}</b>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{t.tanggal} · {t.mode}{t.skalaMode ? ` (${t.skalaMode})` : ''}</div>
                      {(t.perSubtes || []).length > 0 && (
                        <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{t.perSubtes.map((p) => `${p.kode}: ${p.skala ?? '—'}`).join(' · ')}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{fmt(t.skalaTotal)}</div>
                      <div style={{ fontSize: 9.5, color: '#64748b' }}>nilai/100: {Number.isFinite(t.nilai100) ? Math.round(t.nilai100 * 10) / 10 : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {trenSkala.length === 0 && trenPersen.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Try out — persen benar (jenjang tanpa skala nasional UTBK/TKA)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                {trenPersen.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11.5 }}>
                    <div>
                      <b>{t.label}</b>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{t.tanggal}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{fmt(t.skor)}%</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 12 }}>
                Jenjang/program ini tidak memakai try out berskala nasional — perkembangan dianalisis dari persen benar per paket (capaian sesungguhnya, bukan konversi karangan).
              </div>
            </>
          )}
          {trenSkala.length === 0 && trenPersen.length === 0 && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
              Belum ada try out pada periode ini — bagian skala dibiarkan &ldquo;—&rdquo; (belum terukur), tidak pernah dinolkan. Perkembangan tetap terlihat dari kuis, latihan harian, dan tugas.
            </div>
          )}

          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Catatan tren harian</div>
          <SparklineTren trenHarian={(proses.trenHarian || [])} lebar={isMobile ? 290 : 560} />

          {petaTopik.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, margin: '12px 0 6px' }}>Peta topik (warna = rencana pendampingan, bukan vonis)</div>
              {petaTampil(petaTopik).tipis.length > 0 && (
                <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 4 }}>
                  Masih mengumpulkan bukti (belum diwarnai): {petaTampil(petaTopik).tipis.length} topik berbukti &lt;3 soal.
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {petaTampil(petaTopik).berwarna.map((t, i) => (
                  <span key={i} title={`${t.alasan} · sumber: ${(t.sumber || []).join('+')}`} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, border: `1px solid ${warnaStatusTopik(t.status)}`, color: warnaStatusTopik(t.status), background: '#fff' }}>
                    {t.mapelNama}: {t.topik} · {fmt(t.akurasi)}% ({fmt(t.dicoba)})
                  </span>
                ))}
              </div>
            </>
          )}
          {rekomendasi.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11.5, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 10px', color: '#1e40af' }}>
              <b>Rencana pendampingan periode depan:</b>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {rekomendasi.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

        </div>
      )}

      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 18, textAlign: 'center' }}>
        Snapshot terkunci{entri.versiMesin ? ` · mesin ${entri.versiMesin}` : ''} · dihitung otomatis oleh Asisten Belajar Gemilang pada {dihitungPada} dari log aktivitas (kuis, try out, latihan, absensi, tugas).
        Angka yang sama tercetak pada PDF rapor yang diterima orang tua/wali.
      </div>
    </div>
  );
}
