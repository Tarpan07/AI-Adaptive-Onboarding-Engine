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
  const [resumeText, setResumeText] = useState('');
  const [jdText,     setJdText]     = useState('');
  const [error,      setError]      = useState('');

  const handleAnalyze = () => {
    setError('');
    if (!resumeText.trim()) return setError('Please provide your resume to continue.');
    if (!jdText.trim())     return setError('Please provide the job description to continue.');
    onAnalyze({ resumeText, jdText });
  };

  const handleSample = () => {
    setResumeText(SAMPLE_RESUME);
    setJdText(SAMPLE_JD);
    onSample(SAMPLE_RESUME, SAMPLE_JD);
  };

  return (
    <div className="upload-panel">
      <div className="upload-grid">

        {/* Resume */}
        <div className="card">
          <div className="card-title">Resume</div>
          <div className="card-sub">Upload your CV or paste your experience below</div>
          <DropZone icon="📄" title="Drop resume here" hint="PDF, DOC, or TXT · click to browse" onRead={setResumeText} />
          <div className="divider-or">or paste text</div>
          <textarea
            className="text-area"
            placeholder="Paste your resume, work experience, or skills here..."
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={6}
          />
        </div>

        {/* Job Description */}
        <div className="card">
          <div className="card-title">Job Description</div>
          <div className="card-sub">Paste the target role's requirements or upload the JD</div>
          <DropZone icon="💼" title="Drop JD here" hint="PDF, DOC, or TXT · click to browse" onRead={setJdText} />
          <div className="divider-or">or paste text</div>
          <textarea
            className="text-area"
            placeholder="Paste the job description here..."
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            rows={6}
          />
        </div>

      </div>

      <div className="action-bar">
        <button className="btn-primary" onClick={handleAnalyze}>Analyze my profile →</button>
        <button className="sample-link" onClick={handleSample}>or load sample data</button>
      </div>

      {error && (
        <div className="error-box"><span>⚠</span><div>{error}</div></div>
      )}
    </div>
  );
}
