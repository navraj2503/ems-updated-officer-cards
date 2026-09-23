// Import React and hooks for managing state and side effects
import React, { useState, useEffect } from 'react';
// Import global application context to access login and data functions
import { useApp } from '../context/AppContext';
// Import notification hook to show toast alerts to the user
import { useNotif } from '../components/Notification';
// Import helper utilities for role-based styling (not used directly here but imported)
import { roleLbl, roleCls } from '../utils/helpers';

// ===== LANDING PAGE COMPONENT =====
// This is the public-facing entry point of the e-Office Management System.
// It features a hero slider, official notices, portal features, and a login modal.
export default function LandingPage() {
  // Extract authentication and data-fetching functions from the global AppContext
  const { getNotices, login, requestPasswordReset, fetchCaptcha } = useApp();
  // Initialize the notification function for showing success/error messages
  const notif = useNotif();
  // Fetch the latest official notices to display on the page
  const notices = getNotices();

  // Component-level states for UI control and form inputs
  const [showLoginModal, setShowLoginModal] = useState(false); // Controls visibility of the sign-in popup
  const [showForgot, setShowForgot] = useState(false);         // Toggles between Login and Forgot Password forms
  const [email, setEmail] = useState('');                      // Stores the email entered in forms
  const [name, setName] = useState('');                       // Stores the name entered in the forgot password form
  const [password, setPassword] = useState('');               // Stores the password entered in the login form
  const [showPassword, setShowPassword] = useState(false);     // Toggles password visibility
  const [captchaValue, setCaptchaValue] = useState('');       // Stores the user's captcha input
  const [captchaData, setCaptchaData] = useState(null);       // Stores the SVG and token from backend
  const [error, setError] = useState('');                     // Stores error messages to display in the modal
  const [resetSubmitted, setResetSubmitted] = useState(false); // Tracks if a password reset request was successful

  // Fetch captcha when modal opens
  useEffect(() => {
    if (showLoginModal && !showForgot) {
      refreshCaptcha();
    }
  }, [showLoginModal, showForgot]);

  const refreshCaptcha = async () => {
    setCaptchaValue('');
    const data = await fetchCaptcha();
    if (data) setCaptchaData(data);
  };

  // ===== HERO SLIDER LOGIC =====
  // Array of image paths located in the public/images folder
  const heroImages = ['/images/gangtok.jpeg', '/images/gangtok2.jpeg', '/images/gangtok3.jpeg'];
  // State to track which image is currently being displayed (index 0 or 1)
  const [currentHero, setCurrentHero] = useState(0);

  // Automatically cycle through hero images every 6 seconds
  useEffect(() => {
    // Set up a recurring timer
    const timer = setInterval(() => {
      // Increment the index, looping back to 0 when reaching the end of the array
      setCurrentHero(prev => (prev + 1) % heroImages.length);
    }, 5000); 
    // Clean up the timer when the component is unmounted to prevent memory leaks
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Function to handle the login form submission
  const handleLogin = async () => {
    setError(''); // Clear any previous errors
    
    if (!captchaValue.trim()) {
      setError('Please enter the captcha code');
      return;
    }

    // Call the global login function with trimmed input values and captcha
    const result = await login(email.trim(), password.trim(), captchaValue.trim(), captchaData?.captchaToken);
    
    // If login fails, display a user-friendly error message and refresh captcha
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
      refreshCaptcha();
    }
  };

  // Opens the login modal when the "Login to Portal" button is clicked
  const handleEnterPortal = () => {
    setShowLoginModal(true);
  };

  // Function to handle password reset requests
  const handleResetRequest = () => {
    // Basic validation: Ensure required fields are not empty
    if (!name.trim()) { notif('Enter your name', 'error'); return; }
    if (!email.trim()) { notif('Enter your email', 'error'); return; }
    try {
      // Call the global request function
      requestPasswordReset(name.trim(), email.trim());
      // Show the success state in the modal
      setResetSubmitted(true);
    } catch (e) {
      // Show error notification if the request fails
      notif(e.message, 'error');
    }
  };

  // Resets all modal states and input fields when the modal is closed
  const closeLoginModal = () => {
    setShowLoginModal(false);
    setShowForgot(false);
    setResetSubmitted(false);
    setError('');
    setEmail('');
    setName('');
    setPassword('');
  };

  return (
    <div className="landing">
      {/* ── NAVIGATION BAR ── */}
      {/* Displays the Government logo, titles, and the primary login trigger */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="landing-nav-logo-wrap">
            <img src="/images/nic.jpeg" alt="Logo" className="landing-nav-logo" />
          </div>
          <div>
            <div className="landing-nav-title">Government of Sikkim</div>
            <div className="landing-nav-subtitle">e-Office Management System</div>
          </div>
        </div>
        <button className="btn-login-nav" onClick={handleEnterPortal}>
          🔒 Login to Portal
        </button>
      </nav>

      {/* ── HERO SECTION ── */}
      {/* Features a full-width background slider with animated image transitions */}
      <div className="landing-hero-container">
        {/* Map through hero images to create layered slide divs */}
        {heroImages.map((img, idx) => (
          <div 
            key={idx}
            // The 'active' class triggers the CSS opacity transition for the current image
            className={`landing-hero-slide ${idx === currentHero ? 'active' : ''}`}
            style={{ 
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${img}')`
            }}
          />
        ))}
        
        {/* Main hero content: Titles, descriptions, and feature pills */}
        <div className="landing-hero-inner">
          <h1>Streamlining<br/><em>Government</em><br/>Operations</h1>
          <p>
            A unified digital platform for managing departmental workflows,
            applications, and communications across all Government of Sikkim departments.
          </p>
          <div className="landing-hero-pills">
            <span className="hero-pill">📋 Application Tracking</span>
            <span className="hero-pill">⚡ Digital Workflows</span>
            <span className="hero-pill">🔔 Real-time Notices</span>
            <span className="hero-pill">🏢 Multi-Department</span>
          </div>
          
          {/* SLIDER NAVIGATION DOTS */}
          {/* Allows users to manually switch between hero images */}
          <div className="hero-dots">
            {heroImages.map((_, idx) => (
              <span 
                key={idx} 
                className={`dot ${idx === currentHero ? 'active' : ''}`}
                onClick={() => setCurrentHero(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN BODY CONTENT ── */}
      <div className="landing-body">

        {/* OFFICIAL NOTICES SECTION */}
        {/* Displays a grid of notices fetched from the database */}
        <section className="landing-section">
          <div className="landing-section-title">
            <span>📢 Official Notices &amp; Circulars</span>
          </div>
          <div className="notice-list">
            {/* Conditional Rendering: Show a message if no notices are found */}
            {notices.length === 0 ? (
              <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center', background: '#fff', borderRadius: 16, gridColumn: '1 / -1' }}>
                No notices available at this time.
              </div>
            ) : (
              // Map through notices and render a card for each
              notices.map(n => (
                <div key={n.id} className={`notice-card priority-${n.priority}`}>
                  <div className="notice-card-header">
                    <div className="notice-title">{n.title}</div>
                    <div className="notice-date">{new Date(n.date).toLocaleDateString()}</div>
                  </div>
                  <div className="notice-content">{n.content}</div>
                  <div className="notice-actions">
                    <span className={`notice-priority-${n.priority}`}>
                      {n.priority} Priority
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* PORTAL FEATURES SECTION */}
        {/* High-level summary of what the system offers to users */}
        <section className="landing-section">
          <div className="landing-section-title">
            <span>🛠️ Portal Features</span>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <span className="feature-icon">🏢</span>
              <div className="feature-title">Department Portal</div>
              <p className="feature-desc">
                Access your department's e-office system, submit applications, and track approvals in real-time.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">✍️</span>
              <div className="feature-title">Submit Applications</div>
              <p className="feature-desc">
                Submit leave requests, equipment requisitions, and other official applications digitally.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <div className="feature-title">Track Progress</div>
              <p className="feature-desc">
                Monitor your application status through every step of the departmental approval workflow.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        © {new Date().getFullYear()} Government of Sikkim · e-Office Management System · All Rights Reserved
      </footer>

      {/* ── LOGIN / FORGOT PASSWORD MODAL ── */}
      {showLoginModal && (
        <div
          className="overlay"
          // Close the modal if the user clicks the darkened background area
          onClick={e => { if (e.target === e.currentTarget) closeLoginModal(); }}
        >
          <div className="modal" style={{ maxWidth: 430 }}>
            {/* Official Logo at the top of the form */}
            <div className="login-logo-container">
              <img src="/images/nic.jpeg" alt="Logo" className="login-logo-img" />
            </div>

            {/* TOGGLE LOGIC: Show Login Form OR Forgot Password Form */}
            {!showForgot ? (
              // ===== SIGN IN FORM =====
              <>
                <div className="modal-title" style={{ textAlign: 'center', marginTop: 12 }}>
                  Portal Sign In
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 22 }}>
                  Sign in to access the e-Office Management System
                </div>

                {/* Conditional Rendering: Show error box if login fails */}
                {error && (
                  <div className="login-error-msg" style={{ marginBottom: 20 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="lbl">Email Address</label>
                  <input className="inp" type="email" placeholder="user@sikkim.gov.in"
                    value={email} onChange={e => setEmail(e.target.value)}
                    // Allow submitting by pressing the 'Enter' key
                    onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <div className="form-group">
                  <label className="lbl">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="inp" type={showPassword ? 'text' : 'password'} placeholder="••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()} 
                      style={{ paddingRight: '40px' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Captcha Section */}
                <div className="form-group captcha-group">
                  <label className="lbl">Security Verification</label>
                  <div className="captcha-container">
                    <div 
                      className="captcha-svg" 
                      dangerouslySetInnerHTML={{ __html: captchaData?.svg }} 
                      title="Click to refresh"
                      onClick={refreshCaptcha}
                    />
                    <button className="btn-refresh-captcha" onClick={refreshCaptcha} type="button" title="Refresh Captcha">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                      </svg>
                    </button>
                  </div>
                  <input 
                    className="inp captcha-input" 
                    type="text" 
                    placeholder="Enter code above"
                    value={captchaValue}
                    onChange={e => setCaptchaValue(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </div>

                {/* Link to switch to Forgot Password view */}
                <div style={{ textAlign: 'center', marginTop: -8, marginBottom: 15 }}>
                  <span
                    style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot Password?
                  </span>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={closeLoginModal}>Cancel</button>
                  <button className="btn btn-accent" onClick={handleLogin}>Sign In →</button>
                </div>
              </>
            ) : resetSubmitted ? (
              // ===== SUCCESS MESSAGE (After Reset Request) =====
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div className="modal-title" style={{ fontSize: 18 }}>Request Sent</div>
                <p className="muted" style={{ margin: '12px 0 24px', fontSize: 13, lineHeight: 1.5 }}>
                  Your request has been sent to the admin who created your account.
                  They will share your password with you shortly.
                </p>
                <button className="btn btn-accent" style={{ width: '100%' }} onClick={closeLoginModal}>
                  Close
                </button>
              </div>
            ) : (
              // ===== FORGOT PASSWORD FORM =====
              <>
                <div className="modal-title" style={{ textAlign: 'center', marginTop: 12 }}>
                  Forgot Password
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 22 }}>
                  Enter your info to request a password reset
                </div>

                <div className="form-group">
                  <label className="lbl">Your Name</label>
                  <input className="inp" type="text" placeholder="Your full name"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="lbl">Registered Email</label>
                  <input className="inp" type="email" placeholder="user@sikkim.gov.in"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResetRequest()} />
                </div>

                <div className="modal-footer" style={{ marginTop: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setShowForgot(false)}>Back to Login</button>
                  <button className="btn btn-accent" onClick={handleResetRequest}>Send Request</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
