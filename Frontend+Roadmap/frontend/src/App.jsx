import React, { useState } from 'react';
import './styles/App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import TabNav from './components/TabNav';
import UploadPanel from './components/UploadPanel';
import LoadingPanel from './components/LoadingPanel';
import SkillGapPanel from './components/SkillGapPanel';
import { analyzeProfile } from './services/claudeApi';

const SAMPLE_RESULT = {
  candidate_name: 'Jane Smith',
  years_experience: 5,
  current_title: 'Senior Software Engineer',
  experience_level: 'Advanced',
  role_title: 'Machine Learning Engineer',
  summary: 'Experienced software engineer with strong Python and React background. Transitioning toward ML engineering with foundational exposure.',
  match_percent: 52,
  skills_have: [
    { name: 'Python',    level: 'advanced' },
    { name: 'REST APIs', level: 'advanced' },
    { name: 'Docker',    level: 'intermediate' },
    { name: 'AWS',       level: 'intermediate' },
    { name: 'SQL',       level: 'intermediate' },
    { name: 'React',     level: 'advanced' },
    { name: 'Git',       level: 'advanced' },
    { name: 'CI/CD',     level: 'intermediate' },
  ],
  skills_partial: [
    { name: 'Machine Learning', current_level: 'beginner', required_level: 'intermediate', reason: 'scikit-learn exposure is good but production ML needed' },
  ],
  skills_gap: [
    { name: 'PyTorch',      required_level: 'advanced',     priority: 'high',   reason: 'Core framework for model training' },
    { name: 'MLOps',        required_level: 'intermediate', priority: 'high',   reason: 'Required for deployment and monitoring pipelines' },
    { name: 'Kubernetes',   required_level: 'intermediate', priority: 'medium', reason: 'Used for scaling ML workloads in production' },
    { name: 'Apache Spark', required_level: 'beginner',     priority: 'medium', reason: 'Data pipeline processing at scale' },
    { name: 'Airflow',      required_level: 'beginner',     priority: 'low',    reason: 'Workflow orchestration for training jobs' },
  ],
  roadmap: [
    { title: 'Machine Learning — Intermediate Level', description: 'Skip theory. Focus on production patterns: model evaluation, bias detection, A/B testing ML models, and serving strategies adapted for your Advanced engineering background.', priority: 'high', duration_weeks: 3, skill_name: 'Machine Learning', tags: ['scikit-learn', 'Model evaluation', 'Feature engineering'] },
    { title: 'PyTorch — Advanced Deep Learning', description: 'Custom training loops, distributed training, model optimization (quantization, pruning), and ONNX export for production deployment — skipping beginner PyTorch basics.', priority: 'high', duration_weeks: 4, skill_name: 'PyTorch', tags: ['PyTorch', 'Distributed training', 'ONNX', 'Model optimization'] },
    { title: 'MLOps & Production Pipelines', description: 'MLflow for experiment tracking, model registry, and deployment automation. Build a complete training-to-serving pipeline leveraging your existing Docker and CI/CD skills.', priority: 'high', duration_weeks: 3, skill_name: 'MLOps', tags: ['MLflow', 'Model serving', 'CI/CD for ML', 'Monitoring'] },
    { title: 'Kubernetes for ML Workloads', description: 'Extend your Docker knowledge to Kubernetes. Focus on GPU scheduling, resource limits, autoscaling, and Kubeflow for ML workflow orchestration.', priority: 'medium', duration_weeks: 3, skill_name: 'Kubernetes', tags: ['Kubernetes', 'Kubeflow', 'GPU scheduling', 'Helm'] },
    { title: 'Data Pipelines — Spark & Airflow', description: 'PySpark for large-scale feature engineering and Airflow for scheduling training jobs. Build an end-to-end pipeline that feeds a training job automatically.', priority: 'low', duration_weeks: 2, skill_name: 'Apache Spark', tags: ['PySpark', 'Apache Airflow', 'ETL', 'Feature store'] },
  ],
};

export default function App() {
  const [activeTab,      setActiveTab]      = useState('upload');
  const [isLoading,      setIsLoading]      = useState(false);
  const [results,        setResults]        = useState(null);
  const [loaderStatus,   setLoaderStatus]   = useState('');
  const [loaderSub,      setLoaderSub]      = useState('');

  const resultsUnlocked = !!results;

  const handleAnalyze = async ({ resumeText, jdText }) => {
    setIsLoading(true);
    try {
      const data = await analyzeProfile(resumeText, jdText,
        (s, b) => { setLoaderStatus(s); setLoaderSub(b); }
      );
      setResults(data);
      setActiveTab('results');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Tab navigation — always visible */}
      {!isLoading && (
        <TabNav
          activeTab={activeTab}
          onSwitch={handleTabSwitch}
          resultsUnlocked={resultsUnlocked}
        />
      )}

      {/* Upload tab */}
      {!isLoading && activeTab === 'upload' && (
        <>
          <Hero />
          <UploadPanel onAnalyze={handleAnalyze} onSample={handleSample} />
        </>
      )}

      {/* Loading */}
      {isLoading && <LoadingPanel status={loaderStatus} sub={loaderSub} />}

      {/* Results tab */}
      {!isLoading && activeTab === 'results' && results && (
        <SkillGapPanel data={results} onReset={handleReset} />
      )}
    </div>
  );
}
