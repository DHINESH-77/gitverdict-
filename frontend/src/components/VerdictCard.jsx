import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Terminal, Heart, Users, Clock, TrendingUp, Download, GitBranch, Star, AlertTriangle, Zap, ExternalLink, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Card from './ui/Card';
import MetricRow from './MetricRow';

/** Animates a number counting up from 0 to target. Resets when animationKey changes. */
function useCountUp(target, animationKey, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    setCount(0); // reset to 0 on new data
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, animationKey, duration]);
  return count;
}

const TABS = [
  { id: 'audit',         label: 'Metric Audits',     icon: Terminal },
  { id: 'repos',         label: 'Repositories',      icon: GitBranch },
  { id: 'languages',     label: 'Tech Focus',        icon: Heart },
  { id: 'collaboration', label: 'Green Flags',       icon: Users },
  { id: 'accountAge',    label: 'Account Maturity',  icon: Clock },
  { id: 'explain',       label: 'How We Score',      icon: TrendingUp },
];

const EXPLAIN_ROWS = [
  { key: 'originality',       weight: 2.0, label: 'Originality Index',      desc: 'Fork ratio — what fraction of repos is original vs. untouched copies.' },
  { key: 'codeDumps',         weight: 2.0, label: 'Incremental Builds',      desc: 'Compares first-commit size to repo size to detect one-shot code dumps.' },
  { key: 'commitPattern',     weight: 1.5, label: 'Commit Timeline',         desc: 'Detects whether commits are spread over time or crammed into 3-day windows.' },
  { key: 'collaboration',     weight: 1.5, label: 'Collaboration',           desc: 'Tests presence of external PRs, issue activity, and testing references.' },
  { key: 'accountAge',        weight: 1.5, label: 'Account Maturity',        desc: 'Account age vs. repo volume velocity — flags brand-new accounts with many repos.' },
  { key: 'commitQuality',     weight: 1.0, label: 'Commit Quality',          desc: 'Ratio of generic messages (\'fix\', \'update\') to descriptive ones.' },
  { key: 'readmeAuthenticity',weight: 1.0, label: 'README Authenticity',     desc: 'Jaccard similarity across READMEs to detect template boilerplate.' },
];

export function VerdictCard({ data, onBack }) {
  const [activeTab, setActiveTab] = useState('audit');
  const [showToast, setShowToast] = useState(false);

  const {
    username, avatarUrl, htmlUrl, bio,
    publicReposCount, followers,
    overallScore, grade, summary,
    percentile, redFlags, greenFlags, breakdown
  } = data;

  const animatedScore = useCountUp(overallScore, username);

  const handleShare = () => {
    // Generate shareable URL
    const shareUrl = `${window.location.origin}${window.location.pathname}?user=${username}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    });
  };

  // Confetti for A grades
  useEffect(() => {
    if (grade?.startsWith('A')) {
      const duration = 2000;
      const end = Date.now() + duration;
      const fire = () => {
        if (Date.now() > end) return;
        confetti({ particleCount: 30, spread: 360, startVelocity: 20, ticks: 60, zIndex: 999, origin: { x: Math.random(), y: Math.random() * 0.4 } });
        requestAnimationFrame(fire);
      };
      fire();
    }
  }, [grade]);

  let gradeColor = 'var(--success)';
  if (grade === 'F' || grade === 'D') gradeColor = 'var(--danger)';
  else if (grade === 'C') gradeColor = 'var(--warning)';
  else if (grade === 'B') gradeColor = 'var(--secondary)';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Back + PDF Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-secondary))', fontWeight: 600, fontSize: '0.9rem' }}
            onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--primary))'}
            onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--text-secondary))'}
          >
            <ArrowLeft size={16} /> Back to search
          </button>

          <button 
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px' }}
          >
            <Download size={14} />
            <span>Download PDF Report</span>
          </button>

          <button 
            onClick={handleShare}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Share2 size={13} />
            <span>Share Report</span>
          </button>

          <button 
            onClick={() => {
              const markdown = `[![GitVerdict Audit Grade](https://img.shields.io/badge/GitVerdict-${grade}%20%7C%20${overallScore}%2F100-purple?style=for-the-badge&logo=github)](${window.location.origin}${window.location.pathname}?user=${username})`;
              navigator.clipboard.writeText(markdown).then(() => {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 2500);
              });
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid hsl(var(--primary) / 0.4)', background: 'hsl(var(--primary-glow))' }}
          >
            <Code size={13} style={{ color: 'hsl(var(--primary))' }} />
            <span>Copy README Badge</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Alert */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--primary) / 0.4)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px hsl(var(--primary-glow))',
          borderRadius: '10px',
          padding: '12px 20px',
          color: 'hsl(var(--text-primary))',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'tooltip-fade 0.2s ease-out'
        }}>
          <Zap size={14} style={{ color: 'hsl(var(--primary))' }} />
          <span>Copied to clipboard! Ready to paste.</span>
        </div>
      )}

      <Card style={{ padding: '28px 32px', marginBottom: '24px' }}>
        {/* Profile header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid hsl(var(--border-light))', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={avatarUrl} alt={username} style={{ width: '60px', height: '60px', borderRadius: '50%', border: `2px solid hsl(${gradeColor} / 0.5)` }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-title)', marginBottom: '2px' }}>{username}</h2>
              {bio && <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', maxWidth: '380px', lineHeight: 1.3 }}>{bio}</p>}
              <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                <span>{publicReposCount} repos</span>
                <span>•</span>
                <span>{followers} followers</span>
                {percentile !== null && percentile !== undefined && (
                  <>
                    <span>•</span>
                    <span style={{ color: 'hsl(var(--primary))' }}>Top {100 - percentile}% of profiles audited</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <a href={htmlUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>
            <User size={13} /> GitHub
          </a>
        </div>

        {/* Hero Score & Quick Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0 20px', gap: '20px' }}>
          {/* Grade circle */}
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'hsl(var(--bg-darker))',
            border: `3px solid hsl(${gradeColor})`,
            boxShadow: `0 0 30px hsl(${gradeColor} / 0.2)`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '2.6rem', fontFamily: 'var(--font-title)', fontWeight: 900, color: `hsl(${gradeColor})`, lineHeight: 1 }}>{grade}</span>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {animatedScore}/100
            </span>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            width: '100%',
            maxWidth: '620px',
            marginTop: '4px'
          }}>
            <div style={{ background: 'hsl(var(--bg-darker))', border: '1px solid hsl(var(--border-light))', padding: '10px 14px', borderRadius: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase' }}>Originality</span>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                {breakdown.originality?.details?.originalCount || 0} / {breakdown.originality?.details?.totalRepos || publicReposCount}
              </p>
            </div>
            <div style={{ background: 'hsl(var(--bg-darker))', border: '1px solid hsl(var(--border-light))', padding: '10px 14px', borderRadius: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase' }}>Commits Audited</span>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                {breakdown.commitQuality?.details?.totalCommits || 0}
              </p>
            </div>
            <div style={{ background: 'hsl(var(--bg-darker))', border: '1px solid hsl(var(--border-light))', padding: '10px 14px', borderRadius: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase' }}>Primary Stack</span>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'hsl(var(--primary))', marginTop: '2px' }}>
                {breakdown.languages?.details?.topLanguage || 'N/A'}
              </p>
            </div>
            <div style={{ background: 'hsl(var(--bg-darker))', border: '1px solid hsl(var(--border-light))', padding: '10px 14px', borderRadius: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, textTransform: 'uppercase' }}>Account Age</span>
              <p style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'hsl(var(--secondary))', marginTop: '2px' }}>
                {breakdown.accountAge?.details?.accountAgeYears || 0} yrs
              </p>
            </div>
          </div>

          {/* Summary */}
          <p style={{ textAlign: 'center', maxWidth: '580px', fontSize: '1rem', lineHeight: 1.6, color: 'hsl(var(--text-primary))', fontWeight: 500, margin: '6px 0' }}>
            "{summary}"
          </p>

          {/* Red / green flag pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {(redFlags || []).map(f => (
              <span key={f.key} style={{ fontSize: '0.72rem', padding: '4px 12px', borderRadius: '999px', background: 'hsl(var(--danger) / 0.08)', border: '1px solid hsl(var(--danger) / 0.25)', color: 'hsl(var(--danger))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🔴</span> {f.label}
              </span>
            ))}
            {(greenFlags || []).map(f => (
              <span key={f.key} style={{ fontSize: '0.72rem', padding: '4px 12px', borderRadius: '999px', background: 'hsl(var(--success) / 0.08)', border: '1px solid hsl(var(--success) / 0.25)', color: 'hsl(var(--success))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✅</span> {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border-light))', overflowX: 'auto', marginBottom: '24px', gap: '4px' }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', whiteSpace: 'nowrap',
                background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                color: active ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
                fontFamily: 'var(--font-title)'
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'hsl(var(--text-secondary))' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'hsl(var(--text-muted))' }}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <TabContent activeTab={activeTab} breakdown={breakdown} repositories={data.repositories} />
      </Card>
    </div>
  );
}

function TabContent({ activeTab, breakdown, repositories }) {
  const AUDIT_KEYS = ['originality', 'commitPattern', 'commitQuality', 'readmeAuthenticity', 'codeDumps'];

  if (activeTab === 'audit') {
    return (
      <div>
        {AUDIT_KEYS.map(key => breakdown[key] && (
          <MetricRow key={key} id={key} score={breakdown[key].score} label={breakdown[key].label} verdict={breakdown[key].verdict} />
        ))}
      </div>
    );
  }

  if (activeTab === 'repos') {
    const repos = repositories || [];
    const [repoFilter, setRepoFilter] = useState('all');

    if (repos.length === 0) {
      return <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No original repositories found.</p>;
    }

    const filteredRepos = repos.filter(r => {
      if (repoFilter === 'dumps') return r.isDump;
      if (repoFilter === 'bursts') return r.isBurst;
      if (repoFilter === 'stars') return r.stars > 0;
      return true;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
            Showing {filteredRepos.length} of {repos.length} original repositories · sorted by commit activity
          </p>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Repos' },
              { id: 'dumps', label: '⚠️ Code Dumps' },
              { id: 'bursts', label: '⚡ Burst Commits' },
              { id: 'stars', label: '⭐ Starred' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setRepoFilter(f.id)}
                style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: repoFilter === f.id ? '1px solid hsl(var(--primary) / 0.5)' : '1px solid hsl(var(--border-light))',
                  background: repoFilter === f.id ? 'hsl(var(--primary-glow))' : 'hsl(var(--bg-darker))',
                  color: repoFilter === f.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                  transition: 'all 0.15s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo, i) => <RepoCard key={repo.name} repo={repo} rank={i + 1} />)
        ) : (
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.82rem', padding: '16px 0', textAlign: 'center' }}>
            No repositories match the selected filter.
          </p>
        )}
      </div>
    );
  }

  if (activeTab === 'languages') {
    const langs = breakdown.languages?.details?.languages || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
          {breakdown.languages?.verdict}
        </p>
        {langs.length > 0 ? langs.map(lang => (
          <div key={lang.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: langColor(lang.name) }} />
                <span>{lang.name}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{lang.percentage}%</span>
            </div>
            <div style={{ height: '6px', background: 'hsl(var(--bg-darker))', borderRadius: '3px' }}>
              <div style={{ height: '100%', width: `${lang.percentage}%`, background: 'hsl(var(--primary))', borderRadius: '3px', transition: 'width 1s ease-out' }} />
            </div>
          </div>
        )) : <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No language data found.</p>}
      </div>
    );
  }

  if (activeTab === 'collaboration') {
    const flags = breakdown.collaboration?.details?.greenFlagsList || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.88rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>{breakdown.collaboration?.verdict}</p>
        {flags.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flags.map((flag, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'hsl(var(--bg-darker))', borderRadius: '8px', border: '1px solid hsl(var(--border-light))', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                <span style={{ color: 'hsl(var(--success))', fontWeight: 700 }}>✓</span>{flag}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No collaboration green flags detected.</p>
        )}
      </div>
    );
  }

  if (activeTab === 'accountAge') {
    const ag = breakdown.accountAge;
    if (!ag) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <MetricRow id="accountAge" score={ag.score} label={ag.label} verdict={ag.verdict} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Account Age', value: `${ag.details?.accountAgeYears}y` },
            { label: 'Total Repos', value: ag.details?.totalRepos },
            { label: 'Repos / Month', value: ag.details?.reposPerMonth },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '14px', background: 'hsl(var(--bg-darker))', borderRadius: '10px', border: '1px solid hsl(var(--border-light))', textAlign: 'center' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'hsl(var(--primary))' }}>{value}</p>
              <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '4px', fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'explain') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', marginBottom: '4px' }}>
          GitVerdict uses a <strong>weighted scoring system</strong> — not all signals are equal. Stronger fraud indicators carry more weight.
        </p>
        {EXPLAIN_ROWS.map(({ key, weight, label, desc }) => (
          <div key={key} style={{ display: 'flex', gap: '14px', padding: '14px', background: 'hsl(var(--bg-darker))', borderRadius: '10px', border: '1px solid hsl(var(--border-light))' }}>
            <div style={{ flexShrink: 0, padding: '4px 10px', background: 'hsl(var(--primary-glow))', border: '1px solid hsl(var(--primary) / 0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'hsl(var(--primary))' }}>×{weight}</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '3px' }}>{label}</p>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/** Language colour map (common languages) */
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95',
  Swift: '#F05138', Kotlin: '#A97BFF', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Dockerfile: '#384d54', Vue: '#41b883', Dart: '#00B4AB'
};

function langColor(name) {
  return LANG_COLORS[name] || '#6e7681';
}

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Individual repo card with commit bar, per-repo language breakdown, flags */
function RepoCard({ repo, rank }) {
  const maxCommits = 50; // visual cap for bar
  const barPct = Math.min(100, (repo.commitCount / maxCommits) * 100);

  return (
    <div style={{
      padding: '16px 18px',
      background: 'hsl(var(--bg-darker))',
      border: '1px solid hsl(var(--border-light))',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(var(--border-light))'}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Rank badge */}
          <span style={{
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem',
            padding: '2px 7px', borderRadius: '4px',
            background: rank <= 3 ? 'hsl(var(--warning) / 0.2)' : 'hsl(var(--bg-dark))',
            color: rank <= 3 ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))'
          }}>#{rank}</span>

          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: 700, fontSize: '0.95rem',
              fontFamily: 'var(--font-title)',
              color: 'hsl(var(--primary))',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            {repo.name}
            <ExternalLink size={12} />
          </a>

          {/* Flags */}
          {repo.isDump && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'hsl(var(--danger) / 0.12)', border: '1px solid hsl(var(--danger) / 0.3)', color: 'hsl(var(--danger))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={9} /> Code Dump
            </span>
          )}
          {repo.isBurst && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'hsl(var(--warning) / 0.12)', border: '1px solid hsl(var(--warning) / 0.3)', color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={9} /> Burst Commits
            </span>
          )}
        </div>

        {/* Stars */}
        {repo.stars > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 700, color: 'hsl(var(--warning))' }}>
            <Star size={12} fill="currentColor" /> {repo.stars}
          </span>
        )}
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.8rem', color: repo.description ? 'hsl(var(--text-secondary))' : 'hsl(var(--text-muted))', fontStyle: repo.description ? 'normal' : 'italic', lineHeight: 1.4, margin: 0 }}>
        {repo.description || 'No description provided.'}
      </p>

      {/* Commit activity bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
          <span>Commit Activity</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--text-primary))' }}>
            {repo.commitCount} commits{repo.commitCount >= 50 ? '+' : ''}
          </span>
        </div>
        <div style={{ height: '5px', background: 'hsl(var(--bg-dark))', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${barPct}%`,
            background: repo.commitCount >= 20
              ? 'hsl(var(--success))'
              : repo.commitCount >= 8
                ? 'hsl(var(--primary))'
                : 'hsl(var(--warning))',
            borderRadius: '3px',
            transition: 'width 1s ease-out'
          }} />
        </div>
      </div>

      {/* Per-repo language breakdown */}
      {repo.languageBreakdown && repo.languageBreakdown.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tech Stack</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {repo.languageBreakdown.slice(0, 6).map(lang => (
              <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: 'hsl(var(--bg-dark))', border: '1px solid hsl(var(--border-light))', fontSize: '0.72rem', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: langColor(lang.name), flexShrink: 0 }} />
                {lang.name}
                <span style={{ color: 'hsl(var(--text-muted))' }}>{lang.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta row: dates, size, issues */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'hsl(var(--text-muted))', fontWeight: 500, paddingTop: '4px', borderTop: '1px solid hsl(var(--border-light) / 0.4)' }}>
        <span>📅 First commit: {fmt(repo.firstCommitDate)}</span>
        <span>🕒 Last commit: {fmt(repo.lastCommitDate)}</span>
        {repo.sizeKB > 0 && <span>💾 {repo.sizeKB > 1024 ? `${(repo.sizeKB / 1024).toFixed(1)} MB` : `${repo.sizeKB} KB`}</span>}
        {repo.openIssues > 0 && <span>🐛 {repo.openIssues} open issues</span>}
      </div>
    </div>
  );
}

export default VerdictCard;
