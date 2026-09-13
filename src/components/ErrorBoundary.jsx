// src/components/ErrorBoundary.jsx
// ============================================================
// PENGAMAN LAYAR PUTIH -- kalau ada error fase render, React
// biasanya melepas SEMUA tampilan (layar putih polos tanpa pesan).
// Boundary ini menangkap error itu dan MENAMPILKANNYA di layar
// lengkap dengan pesan + tumpukan singkat, supaya selalu ada
// bahan diagnosis (dan pengguna tidak menatap layar kosong).
// Juga menangkap error global (window.onerror) & unhandled
// promise rejection selama halaman hidup.
// ============================================================
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, ekstra: [] };
    this.onError = this.onError.bind(this);
    this.onRejection = this.onRejection.bind(this);
  }

  componentDidMount() {
    window.addEventListener('error', this.onError);
    window.addEventListener('unhandledrejection', this.onRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.onError);
    window.removeEventListener('unhandledrejection', this.onRejection);
  }

  onError(e) {
    this.setState((s) => ({
      ekstra: [...s.ekstra, `window.onerror: ${e.message || 'tanpa pesan'}`].slice(-6),
    }));
  }

  onRejection(e) {
    const pesan = e?.reason?.message || String(e?.reason || 'promise rejection tanpa pesan');
    this.setState((s) => ({ ekstra: [...s.ekstra, `unhandledrejection: ${pesan}`].slice(-6) }));
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary menangkap:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const err = this.state.error;
    return (
      <div style={{ minHeight: '100vh', background: '#fef2f2', padding: 24, fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', background: 'white', border: '1px solid #fecaca', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>
            ⚠️ Aplikasi berhenti karena error render
          </div>
          <div style={{ fontSize: 12.5, color: '#7f1d1d', marginBottom: 10 }}>
            Kirim teks di bawah ini ke developer untuk perbaikan cepat:
          </div>
          <pre style={{ background: '#0f172a', color: '#fca5a5', borderRadius: 8, padding: 12, fontSize: 11, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {String(err?.message || err)}
            {'\n\n'}
            {String(err?.stack || '').split('\n').slice(0, 8).join('\n')}
            {this.state.ekstra.length ? `\n\n${this.state.ekstra.join('\n')}` : ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Muat ulang halaman
          </button>
        </div>
      </div>
    );
  }
}