import React from 'react';

export default function LoadingPanel({ status, sub }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'clamp(48px, 10vw, 80px) 24px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        width: 52, height: 52,
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderTopColor: '#63ebaf',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
        margin: '0 auto 26px',
        boxShadow: '0 0 18px rgba(99,235,175,0.15)'
      }} />
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(18px,3vw,22px)',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: 6,
        color: '#eceef3'
      }}>
        {status || 'Analyzing...'}
      </div>
      <div style={{ fontSize: 13, color: '#8a93a8' }}>
        {sub || 'Please wait'}
      </div>
    </div>
  );
}
