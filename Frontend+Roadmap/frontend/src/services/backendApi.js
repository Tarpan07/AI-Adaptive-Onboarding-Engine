/**
 * backendApi.js
 * ─────────────────────────────────────────────────────────────
 * Connects the React frontend to the Django REST backend.
 *
 * Endpoint : POST /api/analyze/
 * Content  : multipart/form-data  (two PDF files)
 * Returns  : JSON  → transformed into the shape SkillGapPanel expects
 * ─────────────────────────────────────────────────────────────
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Helpers ──────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Health-check — called once on app load to confirm the Django
 * server is reachable before the user tries to upload files.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health/`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Response Transformer ─────────────────────────────────────
/**
 * The Django backend returns:
 * {
 *   candidate_skills : ["Python", "SQL", …],          // strings
 *   required_skills  : ["Programming", …],             // strings
 *   skill_gaps       : ["Programming", …],             // strings
 *   learning_path    : [ { step_number, course_title, skill,
 *                          level, duration_weeks, link, reason } ],
 *   reasoning_trace  : "…",                           // plain string
 *   summary          : { original_gaps, expanded_gaps,
 *                        prerequisites_added, total_steps,
 *                        total_weeks, skill_gap_summary }
 * }
 *
 * The frontend SkillGapPanel expects:
 * {
 *   candidate_name, years_experience, experience_level, summary,
 *   skills_have      : [{ name, level }],
 *   match_percent    : number,
 *   job_title        : string,
 *   summary_stats    : { original_gaps, prerequisites_added,
 *                        total_steps, total_weeks, skill_gap_summary },
 *   skill_gaps       : [{ skill, current_level, required_level, gap_size }],
 *   expanded_gaps    : [{ skill, current_level, required_level,
 *                         gap_size, auto_added }],
 *   learning_path    : [{ step_number, course_title, skill, level,
 *                         duration_weeks, link, reason, tags }],
 *   reasoning_points : [{ icon, iconClass, title, body, badge, badgeClass }],
 *   reasoning_trace  : string
 * }
 */
function transformResponse(raw, resumeData) {
  const {
    candidate_skills = [],
    required_skills  = [],
    skill_gaps       = [],        // simple strings from backend
    learning_path    = [],
    reasoning_trace  = '',
    summary          = {},
  } = raw;

  // ── skills_have ──────────────────────────────────────────────
  const skills_have = candidate_skills.map(name => ({
    name,
    level: 'intermediate',        // backend doesn't return levels yet
  }));

  // ── match_percent ─────────────────────────────────────────────
  const total      = required_skills.length || 1;
  const matched    = required_skills.filter(
    s => candidate_skills.map(c => c.toLowerCase()).includes(s.toLowerCase())
  ).length;
  const match_percent = Math.round((matched / total) * 100);

  // ── skill_gaps — convert strings → structured objects ─────────
  const structuredGaps = skill_gaps.map(skill => ({
    skill,
    current_level:  0,
    required_level: 3,
    gap_size:       3,
    auto_added:     false,
  }));

  // ── expanded_gaps — learning_path may reference extra skills ──
  const pathSkills   = [...new Set(learning_path.map(s => s.skill))];
  const gapSkillSet  = new Set(skill_gaps.map(s => s.toLowerCase()));
  const expandedGaps = pathSkills.map(skill => ({
    skill,
    current_level:  0,
    required_level: 3,
    gap_size:       3,
    auto_added:     !gapSkillSet.has(skill.toLowerCase()),
  }));

  // ── learning_path — add tags if missing ───────────────────────
  const enrichedPath = learning_path.map((step, i) => ({
    ...step,
    step_number: step.step_number ?? i + 1,
    tags: step.tags ?? _inferTags(step),
  }));

  // ── summary_stats ─────────────────────────────────────────────
  const summary_stats = {
    original_gaps:       summary.original_gaps       ?? skill_gaps.length,
    prerequisites_added: summary.prerequisites_added ?? 0,
    total_steps:         summary.total_steps         ?? learning_path.length,
    total_weeks:         summary.total_weeks         ?? enrichedPath.reduce((a, s) => a + (s.duration_weeks || 0), 0),
    skill_gap_summary:   summary.skill_gap_summary   ?? `${skill_gaps.length} skill gap(s) identified for ${raw.job_title || 'this role'}.`,
  };

  // ── reasoning_points — derive from reasoning_trace string ─────
  const reasoning_points = _deriveReasoningPoints(
    skill_gaps,
    summary_stats.prerequisites_added,
    reasoning_trace
  );

  return {
    candidate_name:   resumeData?.name    || 'Candidate',
    years_experience: resumeData?.experience_years || 0,
    experience_level: _mapLevel(resumeData?.experience_level),
    current_title:    null,
    summary:          `Candidate with ${resumeData?.experience_years || 0} year(s) experience transitioning into ${raw.job_title || 'this role'}.`,
    skills_have,
    match_percent,
    job_title:        raw.job_title || summary.job_title || 'Target Role',
    summary_stats,
    skill_gaps:       structuredGaps,
    expanded_gaps:    expandedGaps,
    learning_path:    enrichedPath,
    reasoning_points,
    reasoning_trace,
  };
}

// ─── Small utility functions ──────────────────────────────────

function _mapLevel(level) {
  const map = { fresher: 'Beginner', mid: 'Intermediate', senior: 'Advanced' };
  return map[level] || 'Intermediate';
}

function _inferTags(step) {
  const lvl   = step.level?.toLowerCase() || '';
  const skill = step.skill?.toLowerCase() || '';
  const tag1  = skill.includes('prerequisite') || step.reason?.toLowerCase().includes('prerequisite')
    ? 'Prerequisite' : 'Core skill';
  const tag2  = lvl === 'beginner'     ? 'Beginner'
              : lvl === 'intermediate' ? 'Intermediate'
              : lvl === 'expert'       ? 'Expert'
              : 'Intermediate';
  return [tag1, tag2];
}

function _deriveReasoningPoints(skill_gaps, prereqCount, traceText) {
  const points = [];

  // High-priority gaps (first two)
  skill_gaps.slice(0, 2).forEach(skill => {
    points.push({
      icon:       '🔴',
      iconClass:  'high',
      title:      `${skill} — high priority gap`,
      body:       `This skill is required for the target role and was not found in the candidate's profile.`,
      badge:      'Gap identified · steps added',
      badgeClass: 'red',
    });
  });

  // Auto-added prerequisites
  if (prereqCount > 0) {
    points.push({
      icon:       '🟡',
      iconClass:  'auto',
      title:      `${prereqCount} prerequisite(s) auto-added`,
      body:       `The skill graph detected foundational skills needed before tackling the primary gaps.`,
      badge:      `${prereqCount} prerequisites auto-detected`,
      badgeClass: 'grn',
    });
  }

  // Medium-priority gaps (remaining)
  skill_gaps.slice(2).forEach(skill => {
    points.push({
      icon:       '🟣',
      iconClass:  'med',
      title:      `${skill} — medium priority`,
      body:       `Additional skill gap identified. Addressed in the learning path.`,
      badge:      'Partially addressed',
      badgeClass: 'pur',
    });
  });

  return points;
}

// ─── Main export ──────────────────────────────────────────────
/**
 * analyzeProfile
 * ─────────────────────────────────────────────────────────────
 * Called by App.jsx exactly like the old claudeApi.js was.
 *
 * Args:
 *   resumeFile  : File object (PDF)
 *   jdFile      : File object (PDF)
 *   onStatus    : (statusText, subText) => void
 *   onStreamLine: (logLine) => void
 *
 * Returns:
 *   Transformed response object ready for SkillGapPanel
 */
export async function analyzeProfile(resumeFile, jdFile, onStatus, onStreamLine) {

  onStatus('Uploading your documents…', 'Sending resume and job description to server');
  onStreamLine('Connecting to backend…');
  await sleep(300);

  // ── Build multipart/form-data ──────────────────────────────
  const formData = new FormData();
  formData.append('resume',          resumeFile);
  formData.append('job_description', jdFile);

  onStreamLine('Uploading PDF files…');
  onStatus('Parsing your resume…', 'Extracting skills and experience level');

  // ── POST to Django ─────────────────────────────────────────
  let response;
  try {
    response = await fetch(`${API_BASE}/api/analyze/`, {
      method: 'POST',
      body:   formData,
      // Do NOT set Content-Type — browser sets it automatically
      // with the correct boundary for multipart/form-data
    });
  } catch (networkErr) {
    throw new Error(
      `Cannot reach the backend at ${API_BASE}. ` +
      `Make sure Django is running (python manage.py runserver).`
    );
  }

  onStreamLine('Analyzing skill gaps…');
  onStatus('Analyzing job requirements…', 'Comparing your profile against the role');

  if (!response.ok) {
    let errMsg = `Server error ${response.status}`;
    try {
      const errBody = await response.json();
      errMsg = errBody.error || errBody.details || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const raw = await response.json();

  onStreamLine('Building personalised learning path…');
  onStatus('Building your learning path…', 'Generating personalised roadmap');
  await sleep(300);

  // ── Store parsed resume data for transformer ───────────────
  // The backend returns candidate_skills but not a structured
  // resume object — we reconstruct a minimal one for the UI
  const resumeData = {
    name:             raw.candidate_name || 'Candidate',
    experience_years: raw.experience_years || 0,
    experience_level: raw.experience_level || 'mid',
  };

  const transformed = transformResponse(raw, resumeData);

  onStreamLine('Analysis complete ✓');
  return transformed;
}
