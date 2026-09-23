import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNotif } from './Notification';
import { roleLbl, roleCls } from '../utils/helpers';

// ===== FORGOT PASSWORD SCREEN =====
function ForgotPasswordScreen({ onBack }) {
  const { requestPasswordReset } = useApp();
  const notif = useNotif();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) { notif('Enter your name', 'error'); return; }
    if (!email.trim()) { notif('Enter your email', 'error'); return; }
    try {
      requestPasswordReset(name.trim(), email.trim());
      setSubmitted(true);
    } catch (e) {
      notif(e.message, 'error');
    }
  };

  if (submitted) {
    return (
      <div id="login-screen">
        <div className="login-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div className="login-logo" style={{ fontSize: 16 }}>Request Sent</div>
          <p className="muted" style={{ margin: '12px 0 20px', fontSize: 13 }}>
            Your request has been sent to the admin who created your account.
            They will share your password with you shortly.
          </p>
          <button className="btn-login" onClick={onBack}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div id="login-screen">
      <div className="login-box">
        <div className="login-logo" style={{ fontSize: 16, lineHeight: 1.3, marginBottom: 2 }}>
          🏛 Government of Sikkim
        </div>
        <div className="login-sub">Forgot Password</div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 18, textAlign: 'center' }}>
          Enter your name and registered email. Your request will be sent to the admin who created your account.
        </p>

        <div className="form-group">
          <label className="lbl">Your Name</label>
          <input
            className="inp"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="lbl">Registered Email</label>
          <input
            className="inp"
            type="email"
            placeholder="user@sikkim.gov.in"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button className="btn-login" onClick={handleSubmit}>Send Reset Request</button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span
            style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}
            onClick={onBack}
          >
            ← Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN LOGIN SCREEN =====
export default function LoginScreen() {
  const { login, getUser, goToLanding } = useApp();
  const notif = useNotif();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError]           = useState('');

  if (showForgot) return <ForgotPasswordScreen onBack={() => setShowForgot(false)} />;

  const handleLogin = () => {
    setError('');
    const success = login(email.trim(), password.trim());
    if (!success) setError('Invalid email or password. Please try again.');
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div id="login-screen">
      <div className="login-box">
        {/* Logo */}
        <div className="login-logo-container">
          <img src="/images/nic.jpeg" alt="Government of Sikkim" className="login-logo-img" />
        </div>
        <div className="login-logo" style={{ fontSize: 18, marginTop: 12 }}>
          Government of Sikkim
        </div>
        <div className="login-sub">e-Office Management System</div>

        {error && (
          <div className="login-error-msg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="lbl">Email</label>
          <input className="inp" type="email" placeholder="user@sikkim.gov.in"
            value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <div className="form-group">
          <label className="lbl">Password</label>
          <input className="inp" type="password" placeholder="••••••"
            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
        </div>

        <button className="btn-login" onClick={handleLogin}>Sign In</button>

        {/* Forgot password link */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <span
            style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}
            onClick={goToLanding}>← Back to Portal Home</span>
        </div>
      </div>
    </div>
  );
}
