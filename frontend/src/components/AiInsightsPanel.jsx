import React, { useState } from 'react';
import { AlertTriangle, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

export default function AiInsightsPanel({ insights, loading }) {
  const [activeTab, setActiveTab] = useState('impact');

  if (loading) {
    return (
      <div className="deadeye-card ai-panel" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={28} className="pulse-dot" color="var(--accent-cyan)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Generating Gemini AI impact synthesis & physical analysis...
        </p>
      </div>
    );
  }

  if (!insights) return null;

  const { impact_summary, educational_breakdown, source } = insights;
  const alertClass = (impact_summary?.alert_level || 'RED').toLowerCase();

  return (
    <div className="deadeye-card ai-panel">
      <div className="ai-header">
        <div className="ai-header-title">
          <Sparkles size={20} color="var(--accent-cyan)" />
          <span>Gemini Cyclone Orchestrator</span>
        </div>
        <span className={`badge-alert ${alertClass}`}>
          <span className="pulse-dot"></span>
          {impact_summary?.alert_level || 'CRITICAL'} ALERT
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('impact')} className={activeTab === 'impact' ? 'btn-primary' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
          <AlertTriangle size={15} />
          Impact & Warning
        </button>
        <button onClick={() => setActiveTab('educational')} className={activeTab === 'educational' ? 'btn-primary' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
          <BookOpen size={15} />
          Educational Physics
        </button>
      </div>

      {activeTab === 'impact' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{impact_summary?.headline}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>{impact_summary?.threat_assessment}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--alert-red)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--alert-red)', fontWeight: 700 }}>LANDFALL PROXIMITY</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem' }}>{impact_summary?.landfall_warning}</div>
            </div>
            <div style={{ background: 'rgba(249, 115, 22, 0.08)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--alert-orange)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--alert-orange)', fontWeight: 700 }}>SURGE & INUNDATION</div>
              <div style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.25rem' }}>{impact_summary?.surge_and_flood_risk}</div>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actionable Directives</h4>
            <ul className="directive-list">
              {impact_summary?.actionable_directives?.map((d, i) => (
                <li key={i} className="directive-item">
                  <ShieldCheck size={18} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'educational' && (
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.75rem' }}>{educational_breakdown?.title}</h3>
          <div className="educational-callout">
            <h4>🌊 1. Ocean Heat Engine (SST)</h4>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{educational_breakdown?.thermal_engine_sst}</p>
          </div>
          <div className="educational-callout" style={{ marginTop: '0.75rem' }}>
            <h4>🌀 2. Barometric Pressure Gradient</h4>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{educational_breakdown?.pressure_wind_relationship}</p>
          </div>
          <div className="educational-callout" style={{ marginTop: '0.75rem' }}>
            <h4>🌍 3. Coriolis Deflection & Rainbands</h4>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{educational_breakdown?.coriolis_and_rotation}</p>
          </div>
          {educational_breakdown?.student_takeaway && (
            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-cyan)' }}>
              <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>KEY STUDENT LESSON:</strong>
              <p style={{ fontSize: '0.9rem', color: '#fff', marginTop: '0.2rem' }}>{educational_breakdown.student_takeaway}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>Engine: {source || 'Gemini 2.5 Flash'}</span>
        <span>Validation: Multi-Model Sync</span>
      </div>
    </div>
  );
}