import React from 'react';

export default function TelemetryCard({ title, value, unit, delta, icon: Icon, alertColor = 'var(--accent-cyan)' }) {
  return (
    <div className="telemetry-card" style={{ borderColor: 'var(--border-color)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: alertColor }} />
      <div className="telemetry-header">
        <span>{title}</span>
        {Icon && <Icon size={18} color={alertColor} />}
      </div>
      <div className="telemetry-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {delta && <div className="telemetry-delta"><span>{delta}</span></div>}
    </div>
  );
}