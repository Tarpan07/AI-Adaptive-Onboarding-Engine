import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Header       from './components/Header';
import TabNav       from './components/TabNav';
import Hero         from './components/Hero';
import UploadPanel  from './components/UploadPanel';
import LoadingPanel from './components/LoadingPanel';
import SkillGapPanel from './components/SkillGapPanel';
import { analyzeProfile } from './services/claudeApi';
import { SAMPLE_RESULT }  from './data/sampleData';

export default function App() {
  const [activeTab,    setActiveTab]    = useState('upload');
  const [isLoading,    setIsLoading]    = useState(false);
  const [results,      setResults]      = useState(null);
  const [loaderStatus, setLoaderStatus] = useState('');
  const [loaderSub,    setLoaderSub]    = useState('');
  const [streamLog,    setStreamLog]    = useState([]);

  const resultsUnlocked = !!results;

  // Scroll to top on every view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, isLoading]);

  const handleAnalyze = async ({ resumeText, jdText }) => {
    setIsLoading(true);
    setStreamLog([]);
    try {
      const data = await analyzeProfile(
        resumeText,
        jdText,
        (s, b) => { setLoaderStatus(s); setLoaderSub(b); },
        (line)  => setStreamLog(prev => [...prev, line])
      );
      setResults(data);
      setActiveTab('results');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample data and jump straight to results
  const handleSample = () => {
    setResults(SAMPLE_RESULT);
    setActiveTab('results');
  };

  const handleReset = () => {
    setResults(null);
    setActiveTab('upload');
  };

  const handleTabSwitch = (tab) => {
    if (tab === 'results' && !resultsUnlocked) return;
    setActiveTab(tab);
  };

  return (
    <div className="app-shell">
      <Header />

      {!isLoading && (
        <TabNav
          activeTab={activeTab}
          onSwitch={handleTabSwitch}
          resultsUnlocked={resultsUnlocked}
        />
      )}

      {/* Upload screen */}
      {!isLoading && activeTab === 'upload' && (
        <>
          <Hero />
          <UploadPanel onAnalyze={handleAnalyze} onSample={handleSample} />
        </>
      )}

      {/* Loading screen */}
      {isLoading && (
        <LoadingPanel
          status={loaderStatus}
          sub={loaderSub}
          streamLog={streamLog}
        />
      )}

      {/* Results screen */}
      {!isLoading && activeTab === 'results' && results && (
        <SkillGapPanel data={results} onReset={handleReset} />
      )}
    </div>
  );
}
