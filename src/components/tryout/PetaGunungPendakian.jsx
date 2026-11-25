// src/components/tryout/PetaGunungPendakian.jsx
// ============================================================
// PETA GUNUNG PENDAKIAN (TERINSPIRASI REFERENSI "YOUR ASCENT")
// - Jalur pendakian berkelok dari kaki gunung (Pos 1) menuju Puncak (Review)
// - Bubble foto teman sekelas yang aktif di tiap Pos pendakian
// - Pembatasan kuota pendakian (maks 2x/minggu) agar bank soal terjaga
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Rocket,
  Clock,
  Users,
  Trophy,
  Sparkles,
  X,
  Compass,
} from 'lucide-react';

const WARNA_INISIAL = ['#0d9488', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669'];

function inisialNama(nama = '') {
  const parts = String(nama || 'S').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return String(nama || 'S').slice(0, 2).toUpperCase();
}

function AvatarBubble({ nama, fotoUrl, size = 34, borderColor = '#ffffff', glow = false, idx = 0 }) {
  const [imgErr, setImgErr] = useState(false);
  const bg = WARNA_INISIAL[idx % WARNA_INISIAL.length];

  return (
    <div
      title={nama}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `2.5px solid ${borderColor}`,
        background: bg,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(10, Math.round(size * 0.36)),
        fontWeight: 800,
        flexShrink: 0,
        boxShadow: glow
          ? '0 0 0 4px rgba(255, 255, 255, 0.45), 0 4px 14px rgba(13, 148, 136, 0.45)'
          : '0 2px 8px rgba(15, 23, 42, 0.25)',
      }}
    >
      {fotoUrl && !imgErr ? (
        <img
          src={fotoUrl}
          alt={nama}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{inisialNama(nama)}</span>
      )}
    </div>
  );
}

// Koordinat berkelok S-curve dari bawah (Pos 1) ke atas (Puncak/Pos 9)
// xPersen berada di antara 28%..72% agar label kiri/kanan & bubble muat rapi
const KOORDINAT_X_KELOK = [50, 32, 66, 34, 68, 32, 65, 38, 50];

export default function PetaGunungPendakian({
  unitList = [],
  persentaseSelesai = 0,
  kuotaPendakian = { terpakai: 0, maksimal: 2, sisa: 2, terkunciMingguIni: false, labelReset: 'Senin depan' },
  temanPerPos = new Map(),
  temanList = [],
  profilSaya = {},
  isSmp = true,
  onKlikUnit,
}) {
  const [modalTemanPos, setModalTemanPos] = useState(null);

  // Urutkan dari puncak (atas) ke kaki gunung (bawah) untuk tampilan visual mendaki
  const unitDariAtas = useMemo(() => {
    return [...(unitList || [])].reverse();
  }, [unitList]);

  // Pos tempat user saat ini berada
  const posSaya = useMemo(() => {
    const aktif = (unitList || []).find((u) => u.status === 'current');
    if (aktif) return aktif.unitNomor;
    const selesaiSemua = (unitList || []).every((u) => u.status === 'completed');
    return selesaiSemua ? (unitList?.length || 9) : 1;
  }, [unitList]);

  // Cari teman yang berada di Pos lebih tinggi untuk kalimat motivasi
  const temanTerdepan = useMemo(() => {
    const lebihTinggi = (temanList || [])
      .filter((t) => t.posSekarang > posSaya)
      .sort((a, b) => b.posSekarang - a.posSekarang);
    return lebihTinggi[0] || null;
  }, [temanList, posSaya]);

  const myNama = profilSaya?.nama || 'Kamu';
  const myFoto = profilSaya?.fotoUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentFotoUrl') : '') || '';

  return (
    <div style={{ marginTop: 14 }}>
      {/* ============================================================ */}
      {/* 1. HEADER HUD: PROGRES & KUOTA PENDAKIAN MINGGUAN (2x/PEKAN) */}
      {/* ============================================================ */}
      <div style={S.hudCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase' }}>
              <Compass size={14} />
              <span>{isSmp ? 'Pendakian TKA SMP Kelas 9' : 'Pendakian UTBK-SNBT Kelas 12'}</span>
            </div>
            <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
              Peta Puncak Kemampuan ({persentaseSelesai}% Tuntas)
            </h3>
          </div>

          {/* Pill Kuota Mingguan */}
          <div
            style={{
              padding: '7px 12px',
              borderRadius: 12,
              background: kuotaPendakian.terkunciMingguIni ? '#fef3c7' : '#ecfdf5',
              border: `1px solid ${kuotaPendakian.terkunciMingguIni ? '#fcd34d' : '#86efac'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {kuotaPendakian.terkunciMingguIni ? (
              <Clock size={16} color="#b45309" />
            ) : (
              <Rocket size={16} color="#059669" />
            )}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: kuotaPendakian.terkunciMingguIni ? '#92400e' : '#065f46' }}>
                Kuota Minggu Ini: {kuotaPendakian.sisa}/{kuotaPendakian.maksimal} Pendakian
              </div>
              <div style={{ fontSize: 10.5, color: kuotaPendakian.terkunciMingguIni ? '#b45309' : '#047857' }}>
                {kuotaPendakian.terkunciMingguIni
                  ? `Istirahat dulu • Buka lagi ${kuotaPendakian.labelReset}`
                  : 'Maksimal 2 pos/minggu agar bank soal & pemahaman terjaga'}
              </div>
            </div>
          </div>
        </div>

        {/* Bar Progres */}
        <div style={S.progressTrack}>
          <div style={{ ...S.progressFill, width: `${Math.max(4, persentaseSelesai)}%` }} />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. KANVAS GUNUNG PENDAKIAN BERKELOK (INSPIRED BY YOUR ASCENT) */}
      {/* ============================================================ */}
      <div style={S.mountainCanvas}>
        {/* Matahari Puncak Bersinar */}
        <div style={S.summitSunGlow} />
        <div style={S.summitSunCore}>
          <Trophy size={18} color="#d97706" />
        </div>

        {/* Siluet Lapisan Gunung Dekoratif */}
        <svg
          viewBox="0 0 800 1200"
          preserveAspectRatio="none"
          style={S.mountainSvgBg}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mtLeft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#99f6e4" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#0d9488" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="mtRight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.5" />
              <stop offset="45%" stopColor="#0284c7" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="trailGlow" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.92" />
              <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
            </linearGradient>
          </defs>
          {/* Lereng gunung kiri & kanan */}
          <polygon points="400,60 0,1200 430,1200" fill="url(#mtLeft)" />
          <polygon points="400,60 390,1200 800,1200" fill="url(#mtRight)" />
          {/* Jalur berkelok S-curve putih bersinar dari kaki gunung ke puncak */}
          <path
            d="M 400 78 C 310 175, 530 270, 270 390 C 150 450, 560 550, 520 660 C 480 770, 220 840, 270 960 C 310 1055, 490 1120, 400 1185"
            fill="none"
            stroke="url(#trailGlow)"
            strokeWidth="26"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M 400 78 C 310 175, 530 270, 270 390 C 150 450, 560 550, 520 660 C 480 770, 220 840, 270 960 C 310 1055, 490 1120, 400 1185"
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            strokeDasharray="10 10"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>

        {/* Daftar Pos dari Puncak (Atas) ke Pos 1 (Bawah) */}
        <div style={S.nodesStack}>
          {unitDariAtas.map((unit) => {
            const idxAsli = (unit.unitNomor || 1) - 1;
            const xPct = KOORDINAT_X_KELOK[idxAsli % KOORDINAT_X_KELOK.length];
            const isSisiKanan = xPct < 50; // Jika node agak kiri, kartu/info condong ke kanan & sebaliknya

            const isReview = unit.tipe === 'review';
            const isCompleted = unit.status === 'completed';
            const isCurrent = unit.status === 'current';
            const isCooldownBlocked = isCurrent && kuotaPendakian.terkunciMingguIni;
            const isLocked = unit.status === 'locked' || isCooldownBlocked;

            const temanDiPos = temanPerPos.get(unit.unitNomor) || [];
            const tampilTeman = temanDiPos.slice(0, 4);
            const sisaTeman = Math.max(0, temanDiPos.length - tampilTeman.length);

            return (
              <div
                key={unit.id}
                style={{
                  ...S.posRow,
                  justifyContent: xPct > 55 ? 'flex-end' : xPct < 45 ? 'flex-start' : 'center',
                }}
              >
                <div
                  style={{
                    ...S.posCluster,
                    flexDirection: isSisiKanan ? 'row' : 'row-reverse',
                  }}
                >
                  {/* NODE BULAT UTAMA + BUBBLE FOTO SAYA / TEMAN */}
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Bubble Foto Saya jika ini Pos aktif saya */}
                    {isCurrent && (
                      <div style={S.myBubbleTag}>
                        <AvatarBubble nama={myNama} fotoUrl={myFoto} size={36} borderColor="#facc15" glow />
                        <span style={S.myTagPill}>Kamu</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onKlikUnit(unit)}
                      title={unit.judul}
                      style={{
                        ...S.posCircle,
                        background: isReview
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : isCompleted
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : isCooldownBlocked
                          ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                          : isCurrent
                          ? 'linear-gradient(135deg, #0d9488, #0284c7)'
                          : 'rgba(15, 23, 42, 0.55)',
                        border: isCurrent
                          ? '4px solid #fef08a'
                          : isCompleted
                          ? '3px solid #a7f3d0'
                          : '2.5px solid rgba(255,255,255,0.65)',
                        boxShadow: isCurrent
                          ? '0 0 0 6px rgba(250, 204, 21, 0.28), 0 8px 20px rgba(0,0,0,0.35)'
                          : '0 6px 16px rgba(15, 23, 42, 0.32)',
                      }}
                    >
                      {isReview ? (
                        <Trophy size={24} color="#ffffff" />
                      ) : isCompleted ? (
                        <CheckCircle2 size={24} color="#ffffff" />
                      ) : isCooldownBlocked ? (
                        <Clock size={22} color="#ffffff" />
                      ) : isCurrent ? (
                        <Rocket size={24} color="#ffffff" />
                      ) : (
                        <Lock size={20} color="#cbd5e1" />
                      )}
                    </button>

                    {/* Nomor Pos */}
                    <span style={S.posNumberChip}>
                      {isReview ? '🏔️ Puncak' : `Pos ${unit.unitNomor}`}
                    </span>
                  </div>

                  {/* KARTU INFO MILESTONE + BUBBLE TEMAN DI POS INI */}
                  <div
                    onClick={() => onKlikUnit(unit)}
                    style={{
                      ...S.milestoneCard,
                      borderColor: isCurrent
                        ? (isCooldownBlocked ? '#fcd34d' : '#5eead4')
                        : 'rgba(255,255,255,0.28)',
                      background: isCurrent
                        ? 'rgba(255, 255, 255, 0.96)'
                        : isCompleted
                        ? 'rgba(240, 253, 250, 0.92)'
                        : 'rgba(15, 23, 42, 0.72)',
                      color: (isCurrent || isCompleted) ? '#0f172a' : '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: isCurrent ? '#0d9488' : isCompleted ? '#059669' : '#93c5fd',
                      }}>
                        {isReview ? 'EVALUASI PUNCAK' : (unit.mapel || `Pos ${unit.unitNomor}`)}
                      </span>
                      {isCompleted && (
                        <span style={{ fontSize: 10.5, fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 99 }}>
                          ✓ {unit.skor}%
                        </span>
                      )}
                      {isCurrent && !isCooldownBlocked && (
                        <span style={{ fontSize: 10, fontWeight: 900, background: '#0d9488', color: '#ffffff', padding: '2px 8px', borderRadius: 99 }}>
                          Mulai Misi 🚀
                        </span>
                      )}
                      {isCooldownBlocked && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 99 }}>
                          ⏳ {kuotaPendakian.labelReset}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.3 }}>
                      {unit.judul?.replace(/^Unit \d+:\s*/i, '')}
                    </div>

                    {!isReview && (
                      <div style={{ fontSize: 11, opacity: 0.78, marginTop: 3 }}>
                        {unit.jumlahSoal} Soal • {unit.durasiMenit} Menit • +{unit.xpReward} XP
                      </div>
                    )}

                    {/* BUBBLE FOTO TEMAN LAIN DI POS INI */}
                    {temanDiPos.length > 0 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalTemanPos({ pos: unit.unitNomor, judul: unit.judul, daftar: temanDiPos });
                        }}
                        style={{
                          marginTop: 8,
                          paddingTop: 7,
                          borderTop: `1px dashed ${(isCurrent || isCompleted) ? '#cbd5e1' : 'rgba(255,255,255,0.2)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          cursor: 'pointer',
                        }}
                        title="Klik untuk melihat daftar teman di Pos ini"
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {tampilTeman.map((t, i) => (
                            <div key={t.id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i }}>
                              <AvatarBubble
                                nama={t.nama}
                                fotoUrl={t.fotoUrl}
                                size={26}
                                borderColor={(isCurrent || isCompleted) ? '#ffffff' : '#1e293b'}
                                idx={i + unit.unitNomor}
                              />
                            </div>
                          ))}
                          {sisaTeman > 0 && (
                            <span style={{
                              marginLeft: -6,
                              background: '#0f172a',
                              color: '#ffffff',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 99,
                              border: '2px solid #ffffff',
                              zIndex: 1,
                            }}>
                              +{sisaTeman}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: (isCurrent || isCompleted) ? '#0f766e' : '#bae6fd',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          <Users size={11} /> {temanDiPos.length} teman di sini
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BAR BAWAH FLOATING ("You are here" + motivasi teman) */}
        <div style={S.bottomAscentBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#fde047" />
            <span style={{ fontWeight: 800 }}>Kamu di Pos {posSaya}</span>
          </div>
          <span style={{ fontSize: 12, opacity: 0.9 }}>
            {temanTerdepan
              ? `🔥 ${temanTerdepan.nama.split(' ')[0]} sudah di Pos ${temanTerdepan.posSekarang} — ayo kejar!`
              : temanList.length > 0
              ? `🏆 Kamu memimpin pendakian bersama ${temanList.length} teman!`
              : '🏔️ Mulai pendakian pertamamu minggu ini!'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MODAL DAFTAR TEMAN DI POS TERTENTU                        */}
      {/* ============================================================ */}
      {modalTemanPos && (
        <div style={S.modalOverlay} onClick={() => setModalTemanPos(null)}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488' }}>POS {modalTemanPos.pos}</div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  Teman Seperjuangan di Pos Ini ({modalTemanPos.daftar.length})
                </h4>
              </div>
              <button type="button" onClick={() => setModalTemanPos(null)} style={S.btnClose}>
                <X size={18} color="#475569" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {modalTemanPos.daftar.map((t, idx) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AvatarBubble nama={t.nama} fotoUrl={t.fotoUrl} size={36} idx={idx} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{t.nama}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{t.kelas || 'Siswa Aktif'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '3px 9px', borderRadius: 99 }}>
                    Pos {t.posSekarang}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  hudCard: {
    background: '#ffffff',
    borderRadius: 18,
    padding: '14px 16px',
    border: '1px solid #ccfbf1',
    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.08)',
    marginBottom: 14,
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 99,
    background: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    background: 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
    transition: 'width 0.3s ease',
  },
  mountainCanvas: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #e0f2fe 0%, #cffafe 18%, #0d9488 55%, #0f172a 100%)',
    padding: '54px 16px 74px',
    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.18)',
  },
  summitSunGlow: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 110,
    height: 110,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(254, 240, 138, 0.95) 0%, rgba(254, 240, 138, 0) 70%)',
    pointerEvents: 'none',
  },
  summitSunCore: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#fef9c3',
    border: '3px solid #fde047',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 24px rgba(250, 204, 21, 0.9)',
    zIndex: 2,
  },
  mountainSvgBg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  nodesStack: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 740,
    margin: '0 auto',
  },
  posRow: {
    display: 'flex',
    width: '100%',
  },
  posCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    maxWidth: '94%',
  },
  posCircle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  posNumberChip: {
    marginTop: 5,
    fontSize: 10.5,
    fontWeight: 800,
    color: '#ffffff',
    background: 'rgba(15, 23, 42, 0.65)',
    padding: '2px 8px',
    borderRadius: 99,
    backdropFilter: 'blur(4px)',
    whiteSpace: 'nowrap',
  },
  myBubbleTag: {
    position: 'absolute',
    top: -42,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 5,
  },
  myTagPill: {
    marginTop: -6,
    fontSize: 9.5,
    fontWeight: 900,
    background: '#facc15',
    color: '#0f172a',
    padding: '1px 6px',
    borderRadius: 99,
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  },
  milestoneCard: {
    borderRadius: 16,
    padding: '10px 14px',
    border: '1.5px solid rgba(255,255,255,0.28)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.2)',
    cursor: 'pointer',
    minWidth: 205,
    maxWidth: 320,
  },
  bottomAscentBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    zIndex: 4,
    background: 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: 16,
    padding: '10px 16px',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 13,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    background: '#ffffff',
    borderRadius: 20,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  btnClose: {
    border: 'none',
    background: '#f1f5f9',
    borderRadius: 8,
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
};
