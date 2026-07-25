import React from 'react';
import { ArrowLeft, ArrowRight, Trophy, Minus, Download } from 'lucide-react';
import Card from './ui/Card';

const METRIC_LABELS = {
  originality: 'Originality',
  commitPattern: 'Commit Timeline',
  commitQuality: 'Commit Quality',
  readmeAuthenticity: 'README Authenticity',
  codeDumps: 'Incremental Builds',
  collaboration: 'Collaboration',
  accountAge: 'Account Maturity',
};

function getGradeColor(grade) {
  if (!grade) return 'var(--text-muted)';
  if (grade.startsWith('A')) return 'var(--success)';
  if (grade.startsWith('B')) return 'var(--secondary)';
  if (grade.startsWith('C')) return 'var(--warning)';
  return 'var(--danger)';
}

function ScorePill({ score }) {
  let color = 'var(--success)';
  if (score < 45) color = 'var(--danger)';
  else if (score < 75) color = 'var(--warning)';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      fontSize: '0.85rem',
      color: `hsl(${color})`
    }}>
      {score}
    </span>
  );
}

export function CompareView({ data1, data2, error1, error2, onBack }) {
  const profiles = [data1, data2];

  // Determine winner
  const winner = data1 && data2
    ? data1.overallScore > data2.overallScore ? 0
      : data2.overallScore > data1.overallScore ? 1
      : -1 // tie
    : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back and PDF Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }} className="no-print">
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'hsl(var(--text-secondary))',
            fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--primary))'}
          onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--text-secondary))'}
        >
          <ArrowLeft size={16} /> Back to search
        </button>

        <button 
          onClick={() => window.print()}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Download size={14} />
          <span>Download PDF Report</span>
        </button>
      </div>

      <h2 style={{
        textAlign: 'center', fontFamily: 'var(--font-title)', fontSize: '1.6rem',
        fontWeight: 800, marginBottom: '8px'
      }}>
        Profile <span className="cyber-gradient-text">Comparison</span>
      </h2>
      <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', marginBottom: '36px', fontSize: '0.9rem' }}>
        Side-by-side breakdown of every scoring signal
      </p>

      {/* Profile headers - Fixed column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <ProfileHeader data={data1} error={error1} isWinner={winner === 0} idx={0} />
        
        <div style={{ textAlign: 'center', minWidth: '50px', zIndex: 10 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: '0.8rem',
            color: 'hsl(var(--text-secondary))'
          }}>
            VS
          </div>
        </div>

        <ProfileHeader data={data2} error={error2} isWinner={winner === 1} idx={1} />
      </div>

      {/* Metric-by-metric comparison */}
      {data1 && data2 && (
        <Card>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>
            Signal Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(METRIC_LABELS).map(([key, label]) => {
              const v1 = data1.breakdown?.[key];
              const v2 = data2.breakdown?.[key];
              if (!v1 || !v2) return null;
              const diff = v1.score - v2.score;

              return (
                <div key={key} style={{
                  padding: '20px',
                  background: 'hsl(var(--bg-dark))',
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border-light) / 0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Row Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'hsl(var(--text-primary))', fontFamily: 'var(--font-title)' }}>
                      {label}
                    </span>
                    {diff !== 0 ? (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: `hsl(${diff > 0 ? 'var(--success)' : 'var(--danger)'} / 0.1)`,
                        color: `hsl(${diff > 0 ? 'var(--success)' : 'var(--danger)'})`,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {diff > 0 ? `+${diff}` : `${diff}`} pts
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: 'hsl(var(--bg-darker))', color: 'hsl(var(--text-muted))' }}>
                        =
                      </span>
                    )}
                  </div>

                  {/* Side-by-side comparative progress bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* User 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--text-secondary))' }}>@{data1.username}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v1.score}/100</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'hsl(var(--bg-darker))', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${v1.score}%`,
                          background: `hsl(${v1.score >= 75 ? 'var(--success)' : v1.score >= 45 ? 'var(--warning)' : 'var(--danger)'})`,
                          borderRadius: '3px', transition: 'width 1s ease-out'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-secondary))', marginTop: '2px', fontWeight: 500 }}>
                        {v1.label}
                      </span>
                    </div>

                    {/* User 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--text-secondary))' }}>@{data2.username}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v2.score}/100</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'hsl(var(--bg-darker))', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${v2.score}%`,
                          background: `hsl(${v2.score >= 75 ? 'var(--success)' : v2.score >= 45 ? 'var(--warning)' : 'var(--danger)'})`,
                          borderRadius: '3px', transition: 'width 1s ease-out'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-secondary))', marginTop: '2px', fontWeight: 500 }}>
                        {v2.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final verdict row */}
          {winner !== null && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'hsl(var(--primary-glow))',
              border: '1px solid hsl(var(--primary) / 0.3)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <Trophy size={20} style={{ color: 'hsl(var(--warning))', marginBottom: '8px' }} />
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>
                {winner === -1
                  ? "It's a tie! Both profiles score equally."
                  : <>
                      <span className="cyber-gradient-text">
                        @{profiles[winner]?.username}
                      </span>
                      {' '}wins by {Math.abs((data1?.overallScore || 0) - (data2?.overallScore || 0))} points
                    </>
                }
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function ProfileHeader({ data, error, isWinner, idx }) {
  const gradeColor = getGradeColor(data?.grade);

  return (
    <Card style={{ padding: '20px', position: 'relative' }}>
      {isWinner && (
        <div style={{
          position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
          background: 'hsl(var(--warning))', color: '#000', fontSize: '0.65rem', fontWeight: 800,
          padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em',
          whiteSpace: 'nowrap'
        }}>
          🏆 Winner
        </div>
      )}

      {data ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <img
            src={data.avatarUrl}
            alt={data.username}
            style={{ width: '56px', height: '56px', borderRadius: '50%', border: `2px solid hsl(${gradeColor})` }}
          />
          <div>
            <p style={{ fontWeight: 800, fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>{data.username}</p>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>{data.publicReposCount} repos</p>
          </div>
          <div style={{
            background: `hsl(${gradeColor} / 0.15)`,
            border: `1px solid hsl(${gradeColor} / 0.3)`,
            borderRadius: '10px',
            padding: '8px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: `hsl(${gradeColor})` }}>{data.grade}</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontFamily: 'var(--font-mono)' }}>{data.overallScore}/100</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', padding: '16px 0' }}>
          {error || 'No data'}
        </div>
      )}
    </Card>
  );
}

export default CompareView;
