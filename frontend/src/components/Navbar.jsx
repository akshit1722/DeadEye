import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Activity, BookOpen, LogOut, LogIn, User } from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout, isRealFirebase } = useAuth();
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>🌀</span>
          <div>
            <span style={{ letterSpacing: '-0.03em', fontWeight: 800 }}>DEADEYE</span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: '-4px' }}>
              CYCLONE EARLY WARNING & EDUCATION
            </div>
          </div>
        </Link>
        <span className="brand-badge">
          {isRealFirebase ? '🔥 Firebase Auth' : '⚡ Live Dev Mode'}
        </span>
      </div>

      <nav className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <Activity size={17} />
          <span>Live Radar & Telemetry</span>
        </Link>
        <Link to="/sandbox" className={`nav-link ${location.pathname === '/sandbox' ? 'active' : ''}`}>
          <BookOpen size={17} />
          <span>Educational Sandbox</span>
        </Link>
      </nav>

      <div className="nav-auth-section">
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <User size={15} color="var(--accent-cyan)" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.displayName || currentUser.email}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {currentUser.role || 'Observer'}
                </span>
              </div>
            </div>
            <button onClick={logout} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <LogIn size={15} />
            <span>Sign In / Demo</span>
          </Link>
        )}
      </div>
    </header>
  );
}