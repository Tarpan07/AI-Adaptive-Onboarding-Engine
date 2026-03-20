const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function analyzeProfile(resumeText, jdText, onStatus) {
  onStatus('Parsing your resume...', 'Extracting skills and experience level');
  await sleep(300);
  onStatus('Analyzing job requirements...', 'Comparing your profile against the role');
  await sleep(400);

  const response = await fetch(`${API_BASE}/api/analyze/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Server error: ${response.status}`);

  onStatus('Building your learning path...', 'Generating personalized roadmap');
  await sleep(400);
  return data;
}
