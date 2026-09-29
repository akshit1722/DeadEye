import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Zap } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await signup(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleDemo(role) {
    loginAsDemo(role);
    navigate('/');
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="deadeye-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌀</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            {isLogin ? 'Access DeadEye Console' : 'Create Observer Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cyclone Early Warning, Trajectory & Education
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--alert-red-bg)', border: '1px solid var(--alert-red)', color: 'var(--alert-red)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" required className="form-input" placeholder="observer@deadeye.org" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Register')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            {isLogin ? "Need an account? Sign up here" : "Already registered? Sign in here"}
          </button>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            ⚡ Hackathon One-Click Quick Bypass
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button onClick={() => handleDemo('Disaster Management Specialist')} className="btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              <Zap size={15} color="var(--accent-cyan)" />
              <span>Enter as Emergency Response Specialist</span>
            </button>
            <button onClick={() => handleDemo('Student Researcher')} className="btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>
              <Zap size={15} color="#60a5fa" />
              <span>Enter as Student Researcher</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}