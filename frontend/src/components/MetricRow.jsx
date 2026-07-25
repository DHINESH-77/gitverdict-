import React, { useState } from 'react';
import { HelpCircle, GitFork, Calendar, FileText, Globe, Code, Layers, Users, ChevronDown, ChevronUp, Clock, Lightbulb } from 'lucide-react';
import Tooltip from './ui/Tooltip';

// Map metric IDs to Lucide Icons, tooltips, and improvement tips
const METRIC_METADATA = {
  originality: {
    title: 'Originality Index',
    icon: GitFork,
    tooltip: 'Measures the proportion of original repositories vs. unmodified forks.',
    tips: [
      'Delete or archive forked repos you never contributed to — they dilute your signal.',
      'Start original projects, even small utility scripts, instead of cloning templates.',
      'If you must fork, make at least one meaningful commit to show engagement.',
    ],
  },
  commitPattern: {
    title: 'Commit Timeline',
    icon: Calendar,
    tooltip: 'Analyzes whether code was written incrementally or rushed in a short burst.',
    tips: [
      'Commit after completing each small logical unit of work — not at the end of a session.',
      'Spread work across multiple days. Even 1–2 commits per day creates a consistent timeline.',
      'Use `git commit --amend` or feature branches to avoid bulk squash commits.',
    ],
  },
  commitQuality: {
    title: 'Commit Quality',
    icon: FileText,
    tooltip: 'Audits the descriptive clarity of commit messages against generic templates.',
    tips: [
      'Use the format: `type: brief description` — e.g., `feat: add login form validation`.',
      'Never commit with messages like "fix", "update", "done", or "wip" alone.',
      'Describe the *what* and *why*, not just *that* something changed.',
    ],
  },
  readmeAuthenticity: {
    title: 'README Authenticity',
    icon: Globe,
    tooltip: 'Detects duplicate boilerplate markdown content across projects.',
    tips: [
      'Write a unique README for every project — describe the actual problem it solves.',
      'Include: what it does, why you built it, tech stack used, and how to run it.',
      'Avoid copy-pasting README from tutorials or templates without modifying them.',
    ],
  },
  codeDumps: {
    title: 'Incremental Progress',
    icon: Layers,
    tooltip: 'Spots folders dumped in a single initial commit without revision history.',
    tips: [
      'Initialize your git repo before you start coding, not after you finish.',
      'Run `git add` and `git commit` at every meaningful milestone while building.',
      'Break large features into smaller commits — e.g., "add DB schema", "add API route", "add UI form".',
    ],
  },
  collaboration: {
    title: 'Collaboration Flags',
    icon: Users,
    tooltip: 'Checks for active testing suites, community PRs, and issue tracking engagement.',
    tips: [
      'Find a GitHub issue labeled "good first issue" on any open-source project and submit a PR.',
      'Add even basic tests to your projects — it\'s one of the strongest signals of engineering discipline.',
      'Create issues for bugs you encounter in your own projects — shows structured thinking.',
    ],
  },
};

export function MetricRow({ id, score, label, verdict }) {
  const [showTips, setShowTips] = useState(false);
  const meta = METRIC_METADATA[id] || { title: id, icon: Code, tooltip: '', tips: [] };
  const Icon = meta.icon;

  // Determine indicator color theme
  let statusColor = 'var(--success)';
  if (score < 45) {
    statusColor = 'var(--danger)';
  } else if (score < 75) {
    statusColor = 'var(--warning)';
  }

  const hasTips = meta.tips && meta.tips.length > 0 && score < 80;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '20px 0',
      borderBottom: '1px solid hsl(var(--border-light) / 0.5)'
    }}>
      {/* Label and Badge Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={18} style={{ color: `hsl(${statusColor})` }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{meta.title}</span>
          <Tooltip content={meta.tooltip}>
            <HelpCircle size={14} style={{ color: 'hsl(var(--text-muted))', cursor: 'help' }} />
          </Tooltip>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            background: `hsl(${statusColor} / 0.15)`,
            color: `hsl(${statusColor})`
          }}>
            {label}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem' }}>
            {score}/100
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: 'hsl(var(--bg-darker))',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: `hsl(${statusColor})`,
          boxShadow: `0 0 8px hsl(${statusColor} / 0.5)`,
          borderRadius: '3px',
          transition: 'width 1s ease-out'
        }} />
      </div>

      {/* Explanation Text */}
      <p style={{
        fontSize: '0.85rem',
        color: 'hsl(var(--text-secondary))',
        lineHeight: 1.4,
        marginTop: '2px'
      }}>
        {verdict}
      </p>

      {/* How to Improve — only shown on flagged metrics */}
      {hasTips && (
        <div>
          <button
            onClick={() => setShowTips(v => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--primary))',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0',
              fontFamily: 'var(--font-title)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Lightbulb size={13} />
            How to improve this
            {showTips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showTips && (
            <ul style={{
              marginTop: '10px',
              padding: '14px 16px',
              background: 'hsl(var(--primary-glow))',
              border: '1px solid hsl(var(--primary) / 0.2)',
              borderRadius: '8px',
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {meta.tips.map((tip, i) => (
                <li key={i} style={{
                  display: 'flex',
                  gap: '10px',
                  fontSize: '0.82rem',
                  color: 'hsl(var(--text-secondary))',
                  lineHeight: 1.5,
                }}>
                  <span style={{ color: 'hsl(var(--primary))', fontWeight: 800, flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default MetricRow;
