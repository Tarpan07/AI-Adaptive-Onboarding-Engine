import React, { useState } from 'react';
import DropZone from './DropZone';
import '../styles/UploadPanel.css';

const SAMPLE_RESUME = `Jane Smith — Senior Software Engineer
5 years of experience building scalable web applications.
Skills: Python, JavaScript, React, REST APIs, SQL, Git, Docker, AWS (EC2, S3), CI/CD
Some ML exposure with scikit-learn. Led a team of 3 engineers.
Education: B.Tech Computer Science, 2018`;

const SAMPLE_JD = `Machine Learning Engineer — AI Platform Team
We are looking for an ML Engineer to deploy and monitor production ML models at scale.
Required: Python (Advanced), PyTorch or TensorFlow, MLOps, Kubernetes, CI/CD
Nice to have: LLMOps, Apache Spark, Airflow, vector databases
You will build training infrastructure and collaborate with research teams.`;

export default function UploadPanel({ onAnalyze, onSample }) {
  const [resumeText,   setResumeText]   = useState('');
  const [jdText,       setJdText]       = useState('');
  const [resumeReady,  setResumeReady]  = useState(false);
  const [jdReady,      setJdReady]      = useState(false);
  const [error,        setError]        = useState('');

  const handleAnalyze = () => {
    setError('');
    if (!resumeText.trim()) return setError('Please provide your resume to continue.');
    if (!jdText.trim())     return setError('Please provide the job description to continue.');
    onAnalyze({ resumeText, jdText });
  };

  const handleSample = () => {
    setResumeText(SAMPLE_RESUME);
    setJdText(SAMPLE_JD);
    setResumeReady(true);
    setJdReady(true);
    onSample();
  };

  return (
    <div className="upload-panel">
      <div className="upload-area">

        {/* ── Resume card ──────────────────────────────────── */}
        <div className="upload-card">
          <div className="upload-card-accent" />
          <div className="upload-card-inner">
            <div className="upload-card-header">
              <div className="upload-icon-wrap icon-resume">📄</div>
              <div>
                <div className="upload-card-title">Resume</div>
                <div className="upload-card-sub">Your skills &amp; experience</div>
              </div>
            </div>
            <DropZone
              onRead={setResumeText}
              onReady={() => setResumeReady(true)}
            />
            <div className="or-div">or paste text</div>
            <textarea
              className="upload-ta"
              placeholder="Paste your resume or skills here..."
              value={resumeText}
              rows={4}
              onChange={e => { setResumeText(e.target.value); if (e.target.value) setResumeReady(true); }}
              onFocus={() => setResumeReady(true)}
            />
            <div className={`card-status${resumeReady ? ' ready' : ''}`}>
              <div className={`status-dot${resumeReady ? ' ready' : ''}`} />
              {resumeReady ? 'Ready' : 'Waiting for input'}
            </div>
          </div>
        </div>

        {/* ── Job Description card ──────────────────────────── */}
        <div className="upload-card">
          <div className="upload-card-accent jd" />
          <div className="upload-card-inner">
            <div className="upload-card-header">
              <div className="upload-icon-wrap icon-jd">💼</div>
              <div>
                <div className="upload-card-title">Job Description</div>
                <div className="upload-card-sub">Target role requirements</div>
              </div>
            </div>
            <DropZone
              onRead={setJdText}
              onReady={() => setJdReady(true)}
            />
            <div className="or-div">or paste text</div>
            <textarea
              className="upload-ta"
              placeholder="Paste the job description here..."
              value={jdText}
              rows={4}
              onChange={e => { setJdText(e.target.value); if (e.target.value) setJdReady(true); }}
              onFocus={() => setJdReady(true)}
            />
            <div className={`card-status${jdReady ? ' ready' : ''}`}>
              <div className={`status-dot${jdReady ? ' ready' : ''}`} />
              {jdReady ? 'Ready' : 'Waiting for input'}
            </div>
          </div>
        </div>

      </div>

      <div className="action-row">
        <button className="btn-primary" onClick={handleAnalyze}>
          Analyze my profile →
        </button>
        <button className="btn-sample" onClick={handleSample}>
          or load sample data
        </button>
      </div>

      {error && (
        <div className="error-box">
          <span>⚠</span>
          <div>{error}</div>
        </div>
      )}
    </div>
  );
}
