import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import UsernameForm from './components/UsernameForm';
import LoadingState from './components/LoadingState';
import VerdictCard from './components/VerdictCard';
import CompareView from './components/CompareView';
import { useVerdict } from './hooks/useVerdict';

/** Saves a completed audit to localStorage history (max 5 entries) */
function saveToHistory(username, grade, score) {
  try {
    const existing = JSON.parse(localStorage.getItem('gitverdict_history') || '[]');
    const filtered = existing.filter(h => h.username !== username);
    const updated = [{ username, grade, score }, ...filtered].slice(0, 5);
    localStorage.setItem('gitverdict_history', JSON.stringify(updated));
  } catch (_) {}
}

export function App() {
  const [compareMode, setCompareMode] = useState(false);

  // Primary verdict
  const { loading: loading1, error: error1, data: data1, getVerdict: getVerdict1, reset: reset1 } = useVerdict();
  // Compare verdict
  const { loading: loading2, error: error2, data: data2, getVerdict: getVerdict2, reset: reset2 } = useVerdict();

  const loading = loading1 || loading2;

  // Handle URL state sync
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u1 = params.get('user1') || params.get('user');
    const u2 = params.get('user2');

    if (u1) {
      getVerdict1(u1);
      if (u2) {
        setCompareMode(true);
        getVerdict2(u2);
      }
    }
  }, [getVerdict1, getVerdict2]);

  const handleSubmit = useCallback(async (username1, username2) => {
    reset1(); reset2();
    
    // Update URL query parameters without reloading
    const params = new URLSearchParams();
    if (username2) {
      params.set('user1', username1);
      params.set('user2', username2);
    } else {
      params.set('user', username1);
    }
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    getVerdict1(username1);
    if (username2) {
      getVerdict2(username2);
    }
  }, [getVerdict1, getVerdict2, reset1, reset2]);

  const handleReset = useCallback(() => {
    reset1(); reset2();
    // Clear URL query parameters
    window.history.pushState({}, '', window.location.pathname);
  }, [reset1, reset2]);

  // Save to history when data arrives
  React.useEffect(() => {
    if (data1) saveToHistory(data1.username, data1.grade, data1.overallScore);
  }, [data1]);
  React.useEffect(() => {
    if (data2) saveToHistory(data2.username, data2.grade, data2.overallScore);
  }, [data2]);

  // Determine current view
  const showResults = !loading && (data1 || error1);
  const showCompare = compareMode && showResults && (data2 || error2);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background glows */}
      <div className="bg-glow-container">
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />

        <main style={{ flex: 1, paddingBottom: '40px' }}>
          {/* Form screen */}
          {!showResults && (
            <UsernameForm
              onSubmit={handleSubmit}
              error={error1 || error2}
              loading={loading}
              compareMode={compareMode}
              onToggleCompare={() => { setCompareMode(m => !m); reset1(); reset2(); }}
            />
          )}

          {/* Loading screen */}
          {loading && <LoadingState />}

          {/* Single verdict */}
          {showResults && !compareMode && data1 && (
            <VerdictCard data={data1} onBack={handleReset} />
          )}

          {/* Error on single */}
          {showResults && !compareMode && !data1 && error1 && (
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <p style={{ color: 'hsl(var(--danger))' }}>{error1}</p>
              <button onClick={handleReset} style={{ marginTop: '16px', color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                ← Try Again
              </button>
            </div>
          )}

          {/* Compare view */}
          {showCompare && (
            <CompareView
              data1={data1}
              data2={data2}
              error1={error1}
              error2={error2}
              onBack={handleReset}
            />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
