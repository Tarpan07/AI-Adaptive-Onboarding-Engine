import React, { useState } from 'react';
import '../styles/Header.css';

export default function Header() {
  const [open,  setOpen]  = useState(false);
  const [key,   setKey]   = useState(localStorage.getItem('sm_api_key') || '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem('sm_api_key', key);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          Skill<span className="logo-acc">Map</span><span className="logo-dot" />
        </div>
        <div className="header-right">
          <div className="header-badge">AI Onboarding Engine</div>
          <button className="settings-btn" onClick={() => setOpen(true)} title="API Settings">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">API Settings</div>
              <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-label">Anthropic API Key <span className="modal-badge">localStorage only</span></div>
              <input className="modal-input" type="password" placeholder="sk-ant-api03-..." value={key} onChange={e => setKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
              <div className="modal-hint">Saved locally in your browser. Never sent anywhere except Anthropic's API directly.</div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={save}>{saved ? '✓ Saved!' : 'Save key'}</button>
              <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
