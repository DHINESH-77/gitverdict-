import React, { useState, useEffect } from 'react';
import Card from './ui/Card';

const LOADING_STEPS = [
  'Querying public user profile data from GitHub REST nodes...',
  'Extracting repository listings (fork status, descriptions)...',
  'Auditing commit counts and author timestamps...',
  'Scrutinizing code commits for rush bursts and deadlines...',
  'Checking commit summaries for generic phrases (fix, update)...',
  'Scanning project README markdowns for duplication checks...',
  'Performing language recency and effort-weighted analysis...',
  'Inspecting repository size to spot file-folder dumps...',
  'Auditing issue threads and PR activities for collaboration indicators...',
  'Compiling final grading and textual summaries...'
];

export function LoadingState() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prevIndex) => (prevIndex + 1) % LOADING_STEPS.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto 0 auto' }}>
      <Card style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Loader Icon */}
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          marginBottom: '32px'
        }}>
          <div style={{
            boxSizing: 'border-box',
            display: 'block',
            position: 'absolute',
            width: '64px',
            height: '64px',
            border: '5px solid hsl(var(--primary-glow))',
            borderRadius: '50%'
          }} />
          <div style={{
            boxSizing: 'border-box',
            display: 'block',
            position: 'absolute',
            width: '64px',
            height: '64px',
            border: '5px solid transparent',
            borderTopColor: 'hsl(var(--primary))',
            borderBottomColor: 'hsl(var(--secondary))',
            borderRadius: '50%',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
          }} />
        </div>

        <h3 style={{
          fontSize: '1.2rem',
          fontFamily: 'var(--font-title)',
          fontWeight: 600,
          color: 'hsl(var(--text-primary))',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Analyzing GitHub Footprint
        </h3>

        <p style={{
          color: 'hsl(var(--text-secondary))',
          fontSize: '0.9rem',
          textAlign: 'center',
          minHeight: '24px',
          transition: 'all 0.3s ease',
          marginBottom: '40px',
          fontWeight: 500
        }}>
          {LOADING_STEPS[currentStepIndex]}
        </p>

        {/* Skeleton Layout */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="skeleton" style={{ height: '24px', width: '35%', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '60px', width: '100%', borderRadius: '8px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
          </div>
          <div className="skeleton" style={{ height: '14px', width: '85%', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '14px', width: '60%', borderRadius: '4px' }} />
        </div>
      </Card>

      {/* Inject Keyframe Spin Style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingState;
