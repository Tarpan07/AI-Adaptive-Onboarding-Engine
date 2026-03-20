import React, { useState, useEffect } from 'react';
import { getCoursesForSkill } from '../data/rolesDatabase';
import '../styles/SkillGapPanel.css';

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

const STATUS_CYCLE = ['○ not started', '▶ in progress', '✓ done'];
const STATUS_CLASS  = ['status-idle',   'status-active',  'status-done'];

const LEVEL_COLOR = { Beginner: 'level-beginner', Intermediate: 'level-intermediate', Advanced: 'level-advanced' };

// ── Skill Gap Row (clickable → shows courses) ──────────────
function SkillGapRow({ skill, type, index }) {
  const [open,   setOpen]   = useState(false);
  const [status, setStatus] = useState(0);
  const courses = getCoursesForSkill(skill.name);

  return (
    <div className={`skill-row skill-row-${type}`} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="skill-row-header" onClick={() => setOpen(o => !o)}>
        <div className="skill-row-left">
          <div className={`skill-dot-lg skill-dot-${type}`} />
          <div>
            <div className="skill-row-name">{skill.name}</div>
            <div className="skill-row-meta">
              {type === 'gap'     && <>Required: <strong>{skill.required_level}</strong> · {skill.reason}</>}
              {type === 'partial' && <>Current: <strong>{skill.current_level}</strong> → Required: <strong>{skill.required_level}</strong> · {skill.reason}</>}
            </div>
          </div>
        </div>
        <div className="skill-row-right">
          <button
            className={`status-pill ${STATUS_CLASS[status]}`}
            onClick={e => { e.stopPropagation(); setStatus(s => (s + 1) % 3); }}
          >
            {STATUS_CYCLE[status]}
          </button>
          <div className={`skill-expand ${open ? 'open' : ''}`}>
            {open ? '▲ hide' : `▼ ${courses.length} courses`}
          </div>
        </div>
      </div>

      {open && (
        <div className="courses-drawer">
          <div className="courses-label">Courses for {skill.name}</div>
          <div className="courses-grid">
            {courses.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noreferrer" className="course-card">
                <div className="course-top">
                  <span className="course-provider">{c.provider}</span>
                  {c.free && <span className="course-free">FREE</span>}
                </div>
                <div className="course-title">{c.title}</div>
                <div className="course-meta">{c.duration} · {c.level}</div>
                <div className="course-cta">Open →</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Roadmap Node ──────────────────────────────────────────
function RoadmapNode({ module, index }) {
  const [status, setStatus] = useState(0);
  return (
    <div className="roadmap-node" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className={`node-num ${module.priority}`}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="node-body">
        <div className="node-header">
          <div className="node-title">{module.title}</div>
          <div className="node-header-right">
            <button
              className={`status-pill ${STATUS_CLASS[status]}`}
              onClick={() => setStatus(s => (s + 1) % 3)}
            >
              {STATUS_CYCLE[status]}
            </button>
            <div className={`node-pill ${module.priority}`}>{module.priority}</div>
          </div>
        </div>
        <div className="node-desc">{module.description}</div>
        <div className="node-tags">
          {(module.tags || []).map(t => <span key={t} className="node-tag">{t}</span>)}
        </div>
        <div className="node-duration">
          <span className="dur-dot" />
          ~{module.duration_weeks} week{module.duration_weeks !== 1 ? 's' : ''} estimated
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────
export default function SkillGapPanel({ data, onReset }) {
  const [barWidth, setBarWidth] = useState(0);
  const matchPct  = useCountUp(data.match_percent);
  const haveCnt   = useCountUp((data.skills_have    || []).length, 1000);
  const gapCnt    = useCountUp((data.skills_gap     || []).length, 1000);
  const weekCnt   = useCountUp((data.roadmap || []).reduce((a, m) => a + (m.duration_weeks || 0), 0), 1100);
  const partCnt   = useCountUp((data.skills_partial || []).length, 1000);

  useEffect(() => { setTimeout(() => setBarWidth(data.match_percent), 120); }, [data.match_percent]);

  const totalGaps = (data.skills_gap || []).length + (data.skills_partial || []).length;

  return (
    <div className="skillgap-panel panel-anim">

      {/* Candidate + role header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {(data.candidate_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
        <div className="profile-info">
          <div className="profile-name">{data.candidate_name || 'Your Profile'}</div>
          <div className="profile-meta">
            {data.years_experience} yrs experience
            {data.current_title ? ` · ${data.current_title}` : ''}
          </div>
          <div className="profile-meta">{data.summary}</div>
        </div>
        <div className={`level-badge ${LEVEL_COLOR[data.experience_level]}`}>
          {data.experience_level}
        </div>
      </div>

      {/* Role */}
      <div className="role-banner">
        <div className="role-banner-left">
          <div className="role-banner-label">Target Role</div>
          <div className="role-banner-title">{data.role_title}</div>
        </div>
        <div className="role-match-circle">
          <div className="rmc-pct">{matchPct}%</div>
          <div className="rmc-label">match</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card green">
          <div className="stat-label">Skills Ready</div>
          <div className="stat-value green">{haveCnt}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Skill Gaps</div>
          <div className="stat-value red">{gapCnt}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Partial Skills</div>
          <div className="stat-value amber">{partCnt}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Weeks to Ready</div>
          <div className="stat-value purple">{weekCnt}</div>
        </div>
      </div>

      {/* Match bar */}
      <div className="match-bar-card">
        <div className="match-bar-header">
          <div className="match-bar-label">Role Readiness</div>
          <div className="match-bar-pct">{matchPct}%</div>
        </div>
        <div className="match-bar-track">
          <div className="match-bar-fill" style={{ width: `${barWidth}%` }} />
        </div>
      </div>

      {/* Skills you have */}
      <div className="skills-have-card">
        <div className="skills-have-label">✅ Skills you already have</div>
        <div className="skills-have-tags">
          {(data.skills_have || []).map(s => (
            <span key={s.name} className="skill-tag have">
              <span className="skill-dot" />{s.name}
              <span className="skill-tag-level">{s.level}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Skill gaps — clickable */}
      {totalGaps > 0 && (
        <>
          <div className="section-heading">
            Skill Gap Report
            <span className="section-sub">Click any skill to see recommended courses</span>
          </div>
          <div className="skills-list">
            {(data.skills_gap || []).map((s, i) => (
              <SkillGapRow key={s.name} skill={s} type="gap" index={i} />
            ))}
            {(data.skills_partial || []).map((s, i) => (
              <SkillGapRow key={s.name} skill={s} type="partial" index={(data.skills_gap || []).length + i} />
            ))}
          </div>
        </>
      )}

      {/* Roadmap */}
      {(data.roadmap || []).length > 0 && (
        <>
          <div className="section-heading" style={{ marginTop: '32px' }}>
            Personalised Learning Roadmap
            <span className="section-sub">Adapted for {data.experience_level} level</span>
          </div>
          <div className="roadmap">
            {(data.roadmap || []).map((m, i) => (
              <RoadmapNode key={i} module={m} index={i} />
            ))}
          </div>
        </>
      )}

      <div className="results-divider" />
      <button className="btn-primary" onClick={onReset}>← Start Over</button>
    </div>
  );
}
