// Import React and hooks for managing component state and side effects
import React, { useState, useEffect } from 'react';
// Import the global application context to access user session and notifications
import { useApp } from './context/AppContext';
// Import the notification hook to show toast alerts
import { useNotif } from './components/Notification';

// Import the various page components and layout elements
import LandingPage from './pages/LandingPage';
import LoginScreen from './components/LoginScreen';
import Sidebar, { NAV } from './components/Sidebar';
import { ICON_MAP } from './components/Icons';
import NoticesPage from './pages/NoticesPage';
import ProfilePage from './pages/ProfilePage';
import ResetRequestsPage from './pages/ResetRequestsPage';

// Import role-specific pages for Super Admin
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import DeptAdminsPage      from './pages/SuperAdmin/DeptAdminsPage';
import DepartmentsPage     from './pages/SuperAdmin/DepartmentsPage';
import AllAppsPage         from './pages/SuperAdmin/AllAppsPage';

// Import role-specific pages for Department Admin
import DeptAdminDashboard  from './pages/DeptAdmin/DeptAdminDashboard';
import OfficersPage        from './pages/DeptAdmin/OfficersPage';
import EmployeesPage       from './pages/DeptAdmin/EmployeesPage';
import WorkflowBuilderPage from './pages/DeptAdmin/WorkflowBuilderPage';
import DeptAppsPage        from './pages/DeptAdmin/DeptAppsPage';

// Import role-specific pages for Employees
import EmployeeDashboard      from './pages/Employee/EmployeeDashboard';
import MyAppsPage             from './pages/Employee/MyAppsPage';
import SubmitApplicationPage  from './pages/Employee/SubmitApplicationPage';
import TrackApplicationsPage from './pages/Shared/TrackApplicationsPage';

// Import role-specific pages for Officers
import OfficerDashboard    from './pages/Officer/OfficerDashboard';

// ===== MAIN APP COMPONENT =====
// This is the root component of the application. 
// It handles high-level routing, the global layout (header/sidebar), and notification display.
export default function App() {
  // Extract global state and actions from the AppContext
  const { currentUser, logout, showLanding, notifications, clearNotifications, markNotifRead } = useApp();
  // Initialize the toast notification function
  const notif = useNotif();

  // Local state for UI navigation and layout
  const [activePanel, setActivePanel] = useState(null);       // Tracks which page/tab is currently visible
  const [mobSidebarOpen, setMobSidebarOpen] = useState(false); // Controls the mobile slide-out menu
  const [collapsed, setCollapsed] = useState(false);           // Controls the desktop sidebar width
  const [showNotifs, setShowNotifs] = useState(false);         // Toggles the notification bell dropdown

  // Filter notifications to only show those belonging to the logged-in user
  const userNotifs = notifications.filter(n => (n.userId === currentUser?.id || n.userId === currentUser?._id));
  // Calculate how many notifications haven't been clicked/read yet
  const unreadCount = userNotifs.filter(n => !n.read && !n.isRead).length;

  // Helper function to format dates into "time ago" strings (e.g., "5m ago")
  const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—'; // Handle invalid date strings

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    // For older dates, return a standard localized date string
    return date.toLocaleDateString('en-GB');
  };

  // Helper function to choose the correct icon based on the notification type
  const getNotifIcon = (type) => {
    if (type.includes('approved') || type.includes('unhold')) return 'check';
    if (type.includes('rejected')) return 'x';
    if (type.includes('hold')) return 'clock';
    if (type.includes('submitted') || type.includes('resubmitted')) return 'plus';
    if (type.includes('sent_back')) return 'flow';
    if (type.includes('password')) return 'shield';
    if (type.includes('notice')) return 'notice';
    return 'bell'; // Default icon
  };

  // AUTO-REDIRECT LOGIC:
  // When a user logs in (currentUser changes), automatically send them to the 'dashboard' panel.
  useEffect(() => {
    if (currentUser) {
      setActivePanel('dashboard');
    } else {
      setActivePanel(null); // Clear panel on logout
    }
  }, [currentUser]);

  // Function to change the active page and close mobile menu
  const handleNavigate = (panelId) => {
    setActivePanel(panelId);
    setMobSidebarOpen(false);
  };

  // Function to sign out the user and show a confirmation toast
  const handleLogout = () => {
    logout();
    notif('Signed out successfully', 'info');
  };

  // Function to determine the text to display in the header title area
  const getPageTitle = () => {
    if (!currentUser || !activePanel) return 'Dashboard';
    const navItems = NAV[currentUser.role] || [];
    const item = navItems.find(n => n.id === activePanel);
    return item ? item.label : 'Dashboard';
  };

  // ===== DYNAMIC PAGE RENDERING =====
  // This function acts as a simple router, returning the correct component based on activePanel and User Role.
  const renderPage = () => {
    if (!currentUser || !activePanel) return null;
    const role = currentUser.role;

    // Shared panels available to all logged-in users
    if (activePanel === 'notices')  return <NoticesPage />;
    if (activePanel === 'profile')  return <ProfilePage />;
    if (activePanel === 'password-resets') return <ResetRequestsPage />;
    if (activePanel === 'track-apps') return <TrackApplicationsPage />;

    // Pages specific to Super Admins
    if (role === 'super_admin') {
      if (activePanel === 'dashboard')   return <SuperAdminDashboard />;
      if (activePanel === 'dept-admins') return <DeptAdminsPage />;
      if (activePanel === 'departments') return <DepartmentsPage />;
      if (activePanel === 'all-apps')          return <AllAppsPage />;
      if (activePanel === 'all-apps-pending')  return <AllAppsPage filter="pending" />;
      if (activePanel === 'all-apps-approved') return <AllAppsPage filter="completed" />;
      if (activePanel === 'all-apps-rejected') return <AllAppsPage filter="rejected" />;
    }

    // Pages specific to Department Admins
    if (role === 'dept_admin') {
      if (activePanel === 'dashboard') return <DeptAdminDashboard />;
      if (activePanel === 'officers')  return <OfficersPage />;
      if (activePanel === 'employees') return <EmployeesPage />;
      if (activePanel === 'workflow')  return <WorkflowBuilderPage />;
      if (activePanel === 'dept-apps')          return <DeptAppsPage />;
      if (activePanel === 'dept-apps-pending')  return <DeptAppsPage filter="pending" />;
      if (activePanel === 'dept-apps-approved') return <DeptAppsPage filter="completed" />;
      if (activePanel === 'dept-apps-rejected') return <DeptAppsPage filter="rejected" />;
    }

    // Pages specific to Officers
    if (role === 'officer') {
      if (activePanel === 'dashboard') return <OfficerDashboard />;
      if (activePanel === 'my-apps')          return <MyAppsPage onNavigate={handleNavigate} />;
      if (activePanel === 'my-apps-pending')  return <MyAppsPage onNavigate={handleNavigate} filter="pending" />;
      if (activePanel === 'my-apps-approved') return <MyAppsPage onNavigate={handleNavigate} filter="completed" />;
      if (activePanel === 'my-apps-rejected') return <MyAppsPage onNavigate={handleNavigate} filter="rejected" />;
      if (activePanel === 'submit')    return <SubmitApplicationPage onNavigate={handleNavigate} />;
    }

    // Pages specific to Employees
    if (role === 'employee') {
      if (activePanel === 'dashboard') return <EmployeeDashboard onNavigate={handleNavigate} />;
      if (activePanel === 'my-apps')          return <MyAppsPage onNavigate={handleNavigate} />;
      if (activePanel === 'my-apps-pending')  return <MyAppsPage onNavigate={handleNavigate} filter="pending" />;
      if (activePanel === 'my-apps-approved') return <MyAppsPage onNavigate={handleNavigate} filter="completed" />;
      if (activePanel === 'my-apps-rejected') return <MyAppsPage onNavigate={handleNavigate} filter="rejected" />;
      if (activePanel === 'submit')    return <SubmitApplicationPage onNavigate={handleNavigate} />;
    }

    return null; // Fallback if no panel matches
  };

  // Initial View Selection:
  // 1. Show the public landing page if not logged in.
  if (showLanding) return <LandingPage />;
  // 2. Show the login screen if authentication is required.
  if (!currentUser) return <LoginScreen />;

  // Function to handle the sidebar toggle button click
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobSidebarOpen(!mobSidebarOpen); // Slide menu on mobile
    } else {
      setCollapsed(!collapsed); // Minimize width on desktop
    }
  };

  // ===== MAIN PORTAL LAYOUT =====
  return (
    <div id="app">
      {/* Dimmed background overlay visible when the mobile sidebar is open */}
      <div
        className={`sidebar-overlay${mobSidebarOpen ? ' active' : ''}`}
        onClick={() => setMobSidebarOpen(false)}
      />

      {/* ── TOP HEADER BAR ── */}
      <div className="main-header">
        <div className="main-header-left">
          {/* Hamburger Menu Icon */}
          <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          {/* Dynamic Page Title (e.g., "Officer Inbox") */}
          <div className="main-title">{getPageTitle()}</div>
        </div>

        <div className="header-user">
          {/* Header Avatar: Show user photo if set */}
          {currentUser?.profileImage && currentUser.profileImage !== 'default-profile.png' && (
            <div className="header-avatar" style={{ 
              width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', 
              border: '1px solid var(--border)', marginRight: 12 
            }}>
              <img src={currentUser.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* ── NOTIFICATION BELL ── */}
          <div className="notif-bell-container">
            <button 
              className={`notif-bell-btn${showNotifs ? ' active' : ''}`} 
              onClick={() => setShowNotifs(!showNotifs)}
              title="Notifications"
            >
              {ICON_MAP.bell}
              {/* Show a red dot if there are unread items */}
              {unreadCount > 0 && <span className="notif-badge"></span>}
            </button>
            
            {/* Notification Dropdown Menu */}
            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
                  <button className="notif-clear" onClick={() => clearNotifications(currentUser.id)}>Clear All</button>
                </div>
                <div className="notif-list">
                  {userNotifs.length === 0 ? (
                    <div className="empty-notifs">No new notifications</div>
                  ) : (
                    // Map through the user's notifications
                    userNotifs.map(n => (
                      <div 
                        key={n.id || n._id} 
                        className={`notif-item${(!n.read && !n.isRead) ? ' unread' : ''}`}
                        onClick={() => markNotifRead(n.id || n._id)} // Mark as read on click
                      >
                        {/* Dynamic Icon based on type (e.g., green check for approval) */}
                        <div className="notif-icon-box">{ICON_MAP[getNotifIcon(n.type)] || ICON_MAP.bell}</div>
                        <div className="notif-content">
                          <div className="notif-text">{n.message}</div>
                          <div className="notif-time">{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="notif-footer">
                  <button onClick={() => { setShowNotifs(false); handleNavigate('notices'); }}>View all notices</button>
                </div>
              </div>
            )}
          </div>

          {/* Display logged-in user's name and role badge */}
          <span className="header-user-name">
            {currentUser.firstName} {currentUser.lastName}
          </span>
          {currentUser.officerRole && (
            <span className="officer-role-badge">{currentUser.officerRole}</span>
          )}
        </div>
      </div>

      {/* ── MAIN PORTAL BODY ── */}
      <div className="layout">
        {/* Persistent Sidebar Navigation */}
        <Sidebar
          activePanel={activePanel}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          mobOpen={mobSidebarOpen}
          collapsed={collapsed}
          onMobClose={() => setMobSidebarOpen(false)}
        />
        {/* Main Content Area where the dynamic page is rendered */}
        <main className="main">
          <div className="main-body">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
