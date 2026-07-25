import React from 'react';

export function Footer() {
  return (
    <footer style={{
      marginTop: '80px',
      padding: '24px 0',
      borderTop: '1px solid hsl(var(--border-light))',
      textAlign: 'center',
      fontSize: '0.8rem',
      color: 'hsl(var(--text-muted))'
    }}>
      <p style={{ marginBottom: '8px' }}>
        GitVerdict © {new Date().getFullYear()} — Powered by rule-based public repository audit scoring.
      </p>
      <p style={{ maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}>
        No ML or artificial weights. All verdicts are mapped from transparent heuristics: fork counts, commit patterns, README authenticity, language metrics, and structural dump checks.
      </p>
    </footer>
  );
}

export default Footer;
