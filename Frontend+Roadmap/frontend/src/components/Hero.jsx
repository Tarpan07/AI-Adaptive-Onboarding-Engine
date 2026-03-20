import React, { useEffect, useRef, useState } from 'react';
import '../styles/Hero.css';

const LINES = [
  { key: 0, text: 'YOUR PERSONALIZED', speed: 48 },
  { key: 1, text: 'LEARNING PATH.',    speed: 64 },
  { key: 2, text: 'IN SECONDS.',       speed: 72 },
];

export default function Hero() {
  const [typed, setTyped]       = useState(['', '', '']);
  const [activeLine, setActive] = useState(0);
  const [done, setDone]         = useState(false);
  const timerRef                = useRef(null);

  const startTyping = (li = 0, ci = 0, state = ['', '', '']) => {
    if (li >= LINES.length) { setDone(true); return; }
    const { text, speed } = LINES[li];
    if (ci <= text.length) {
      const next = [...state]; next[li] = text.slice(0, ci);
      setTyped(next); setActive(li);
      timerRef.current = setTimeout(() => startTyping(li, ci + 1, next), speed + Math.random() * 22 - 10);
    } else {
      timerRef.current = setTimeout(() => startTyping(li + 1, 0, state), li < LINES.length - 1 ? 150 : 0);
    }
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => startTyping(), 500);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className="hero">
      <div className="hero-inner">
        <div>
          <div className="hero-label">Adaptive Learning Engine</div>
          <div className="hero-heading">
            <span className="typing-line1">{typed[0]}{activeLine === 0 && !done && <span className="typing-cursor cursor-l1" />}</span>
            <span className="typing-line2">{typed[1]}{activeLine === 1 && !done && <span className="typing-cursor cursor-l2" />}</span>
            <span className="typing-line3">{typed[2]}{activeLine === 2 && !done && <span className="typing-cursor cursor-l3" />}</span>
          </div>
          <p className={`hero-sub${done ? ' visible' : ''}`}>
            Upload your resume and job description. Our AI extracts your skills, identifies exact gaps, and generates an experience-adapted learning roadmap with real courses.
          </p>
        </div>
        <div className="hero-deco">
          <svg viewBox="0 0 240 240" fill="none">
            <circle cx="120" cy="120" r="100" stroke="white" strokeWidth="0.5" strokeDasharray="4 8"/>
            <circle cx="120" cy="120" r="66"  stroke="white" strokeWidth="0.5" strokeDasharray="4 8"/>
            <circle cx="120" cy="120" r="32"  stroke="white" strokeWidth="0.5"/>
            <line x1="20"  y1="120" x2="220" y2="120" stroke="white" strokeWidth="0.5"/>
            <line x1="120" y1="20"  x2="120" y2="220" stroke="white" strokeWidth="0.5"/>
            <line x1="49"  y1="49"  x2="191" y2="191" stroke="white" strokeWidth="0.5" opacity="0.4"/>
            <line x1="191" y1="49"  x2="49"  y2="191" stroke="white" strokeWidth="0.5" opacity="0.4"/>
            <circle cx="120" cy="20"  r="3" fill="white"/>
            <circle cx="120" cy="220" r="3" fill="white"/>
            <circle cx="20"  cy="120" r="3" fill="white"/>
            <circle cx="220" cy="120" r="3" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
