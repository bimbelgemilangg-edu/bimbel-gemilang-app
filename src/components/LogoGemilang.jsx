// src/components/LogoGemilang.jsx
import React from 'react';

const LogoGemilang = ({ size = 'medium', showText = true, variant = 'default' }) => {
  const sizes = {
    small: { icon: 36, text: 14, gap: 6 },
    medium: { icon: 48, text: 18, gap: 10 },
    large: { icon: 60, text: 24, gap: 12 },
  };

  const s = sizes[size] || sizes.medium;

  const colors = {
    default: { bg: '#00C853', primary: '#1A237E', secondary: '#FFB830', accent: '#652D90' },
    dark: { bg: 'transparent', primary: '#FFFFFF', secondary: '#FFB830', accent: '#652D90' },
    light: { bg: 'transparent', primary: '#1A237E', secondary: '#FFB830', accent: '#652D90' },
  };

  const c = colors[variant] || colors.default;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: s.gap,
      background: variant === 'default' ? c.bg : 'transparent',
      padding: variant === 'default' ? `${s.gap * 0.8}px ${s.gap * 1.2}px` : 0,
      borderRadius: 10,
      width: 'fit-content',
    }}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 500 200" style={{ flexShrink: 0 }}>
        <path d="M80 170 Q80 60 160 60 L160 60 Q240 60 240 170 Z" fill={c.secondary} stroke="#FFFFFF" strokeWidth="6"/>
        <circle cx="160" cy="100" r="60" fill={c.accent} stroke="#FFFFFF" strokeWidth="16"/>
        <line x1="160" y1="55" x2="160" y2="45" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="160" cy="92" r="18" fill="#FFFFFF"/>
        <text x="260" y="70" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34" 
              fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round">BIMBEL</text>
        <text x="260" y="70" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34" 
              fill={c.primary} stroke="none">BIMBEL</text>
        <text x="260" y="115" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34" 
              fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="round">GEMILANG</text>
        <text x="260" y="115" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34" 
              fill={c.primary} stroke="none">GEMILANG</text>
      </svg>

      {showText && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 0.85,
          fontWeight: 900,
        }}>
          <span style={{
            fontSize: s.text * 0.8,
            color: c.primary,
            letterSpacing: 1,
            textShadow: variant === 'default' ? '2px 2px 0 #fff, -2px -2px 0 #fff' : 'none',
          }}>BIMBEL</span>
          <span style={{
            fontSize: s.text,
            color: c.primary,
            letterSpacing: 1,
            textShadow: variant === 'default' ? '2px 2px 0 #fff, -2px -2px 0 #fff' : 'none',
          }}>GEMILANG</span>
        </div>
      )}
    </div>
  );
};

export default LogoGemilang;