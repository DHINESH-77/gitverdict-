import React, { useState, useEffect } from 'react';
import { Scale, Github, Sun, Moon } from 'lucide-react';

export function Header() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gitverdict_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gitverdict_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      marginBottom: '48px',
      borderBottom: '1px solid hsl(var(--border-light))'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'hsl(var(--primary-glow))',
          padding: '8px',
          borderRadius: '10px',
          border: '1px solid hsl(var(--primary) / 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Scale size={24} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-title)', fontWeight: 800, lineHeight: 1 }}>
            Git<span className="cyber-gradient-text">Verdict</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
            GitHub Audit Engine
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <a 
          href="https://github.com/DHINESH-77" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Github size={16} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}

export default Header;
