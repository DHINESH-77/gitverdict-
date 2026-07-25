import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Zap, GitBranch, Shield, Clock, ArrowRight, History, X } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

const DEMO_PROFILES = ['sindresorhus', 'torvalds', 'gaearon', 'addyosmani'];
const STAT_PILLS = [
  { icon: Shield, text: '8 Scoring Signals' },
  { icon: GitBranch, text: '100% Rule-Based' },
  { icon: Zap, text: 'No Login Required' },
];

/**
 * Extracts a GitHub username from a raw input string.
 * Handles: plain usernames, https://github.com/user, https://github.com/user/repo
 */
function extractUsername(input) {
  const trimmed = input.trim();
  // Match full GitHub URLs
  const urlMatch = trimmed.match(/github\.com\/([a-zA-Z0-9\-]+)/);
  if (urlMatch) return urlMatch[1];
  // Otherwise treat as plain username (strip leading @)
  return trimmed.replace(/^@/, '');
}

export function UsernameForm({ onSubmit, error, loading, compareMode, onToggleCompare }) {
  const [input, setInput] = useState('');
  const [compareInput, setCompareInput] = useState('');
  const [history, setHistory] = useState([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gitverdict_history') || '[]');
      setHistory(saved);
    } catch (_) {}
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = extractUsername(input);
    if (!username || loading) return;

    if (compareMode) {
      const username2 = extractUsername(compareInput);
      if (!username2) return;
      onSubmit(username, username2);
    } else {
      onSubmit(username);
    }
  };

  const handleDemo = () => {
    const pick = DEMO_PROFILES[Math.floor(Math.random() * DEMO_PROFILES.length)];
    setInput(pick);
    onSubmit(pick);
  };

  const handleHistoryClick = (username) => {
    setInput(username);
    onSubmit(username);
  };

  const clearHistory = () => {
    localStorage.removeItem('gitverdict_history');
    setHistory([]);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>

      {/* ── HERO SECTION ── */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'hsl(var(--primary-glow))',
          border: '1px solid hsl(var(--primary) / 0.3)',
          borderRadius: '999px',
          padding: '6px 16px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'hsl(var(--primary))',
          marginBottom: '24px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Zap size={12} />
          GitHub Profile Intelligence Engine
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontFamily: 'var(--font-title)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: '20px',
          letterSpacing: '-0.03em'
        }}>
          What Does Your GitHub
          <br />
          <span className="cyber-gradient-text">Actually Say About You?</span>
        </h1>

        {/* Sub-tagline */}
        <p style={{
          fontSize: '1.1rem',
          color: 'hsl(var(--text-secondary))',
          maxWidth: '520px',
          margin: '0 auto 32px auto',
          lineHeight: 1.6
        }}>
          Paste any profile URL or username. Get a plain-language audit that reads between the lines — not just raw stats.
        </p>

        {/* Stat pills */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          {STAT_PILLS.map(({ icon: Icon, text }) => (
            <div key={text} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-light))',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))'
            }}>
              <Icon size={13} style={{ color: 'hsl(var(--primary))' }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH CARD ── */}
      <Card style={{ padding: '32px' }}>

        {/* Compare mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button
            onClick={onToggleCompare}
            style={{
              background: compareMode ? 'hsl(var(--primary-glow))' : 'transparent',
              border: `1px solid ${compareMode ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border-light))'}`,
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: compareMode ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <GitBranch size={13} />
            {compareMode ? 'Compare Mode ON' : 'Compare Two Profiles'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Primary input */}
          <InputField
            value={input}
            onChange={setInput}
            placeholder={compareMode
              ? 'First profile — username or github.com/user'
              : 'Username or https://github.com/username'}
            disabled={loading}
          />

          {/* Second input (compare mode) */}
          {compareMode && (
            <div style={{ marginTop: '12px' }}>
              <InputField
                value={compareInput}
                onChange={setCompareInput}
                placeholder="Second profile — username or github.com/user"
                disabled={loading}
              />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !input.trim() || (compareMode && !compareInput.trim())}
              style={{ flex: 1, padding: '14px' }}
            >
              {loading
                ? 'Analyzing...'
                : compareMode
                  ? <>Compare Profiles <ArrowRight size={16} /></>
                  : <>Inspect Profile <ArrowRight size={16} /></>
              }
            </Button>
            {!compareMode && (
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                style={{
                  padding: '14px 20px',
                  background: 'hsl(var(--bg-darker))',
                  border: '1px solid hsl(var(--border-light))',
                  borderRadius: '12px',
                  color: 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(var(--border-light))'}
              >
                <Zap size={15} style={{ color: 'hsl(var(--warning))' }} />
                Try Demo
              </button>
            )}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginTop: '20px',
            padding: '14px 16px',
            background: 'hsl(var(--danger) / 0.1)',
            border: '1px solid hsl(var(--danger) / 0.3)',
            borderRadius: '10px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={17} style={{ color: 'hsl(var(--danger))', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Audit Failed</strong>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>{error}</span>
            </div>
          </div>
        )}
      </Card>

      {/* ── HISTORY PANEL ── */}
      {history.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'hsl(var(--text-muted))',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <History size={12} />
              Recently Audited
            </span>
            <button
              onClick={clearHistory}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--text-muted))',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={11} /> Clear
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {history.map(({ username, grade, score }) => (
              <button
                key={username}
                onClick={() => handleHistoryClick(username)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-light))',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'hsl(var(--text-secondary))',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'hsl(var(--border-light))'}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>@{username}</span>
                {grade && (
                  <span style={{
                    background: 'hsl(var(--primary-glow))',
                    color: 'hsl(var(--primary))',
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {grade} · {score}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable glowing input field */
function InputField({ value, onChange, placeholder, disabled }) {
  return (
    <div
      className="border-glow-focus"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'hsl(var(--bg-darker))',
        border: '1px solid hsl(var(--border-light))',
        borderRadius: '12px',
        padding: '4px 8px 4px 16px',
        transition: 'all 0.2s ease'
      }}
    >
      <Search size={18} style={{ color: 'hsl(var(--text-muted))', marginRight: '10px', flexShrink: 0 }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          width: '100%',
          padding: '12px 0',
          fontSize: '0.95rem',
          color: 'hsl(var(--text-primary))',
          fontFamily: 'var(--font-sans)'
        }}
      />
    </div>
  );
}

export default UsernameForm;
