// Import React and hooks for component management
import React, { useState } from 'react';
// Import global application context to access user and dashboard data
import { useApp } from '../context/AppContext';
// Import helper functions for displaying role labels and CSS classes
import { roleLbl, roleCls } from '../utils/helpers';
// Import the icon map to render SVG icons for navigation items
import { ICON_MAP } from './Icons';

// ===== NAVIGATION GROUPS CONFIGURATION =====
// This object defines the sidebar structure for each user role.
// Each role has a set of groups, and each group contains a list of navigation items.
const NAV_GROUPS = {
  super_admin: [
    {
      group: null, // No label for the first group
      items: [{ id: 'dashboard', icon: 'grid', label: 'Dashboard' }],
    },
    {
      group: 'Applications',
      items: [
        { id: 'track-apps', icon: 'file', label: 'Track Applications' },
        { id: 'all-apps', icon: 'file', label: 'All Applications' },
        // Sub-items are visually indented in the sidebar
        { id: 'all-apps-pending', icon: 'clock', label: 'Pending', sub: true },
        { id: 'all-apps-approved', icon: 'check', label: 'Approved', sub: true },
        { id: 'all-apps-rejected', icon: 'x', label: 'Rejected', sub: true },
      ],
    },
    {
      group: 'Management',
      items: [
        { id: 'dept-admins', icon: 'users',  label: 'Dept Admins' },
        { id: 'departments', icon: 'bldg',   label: 'Departments' },
        { id: 'password-resets', icon: 'shield', label: 'Password Resets' },
        { id: 'notices',     icon: 'notice', label: 'Manage Notices' },
      ],
    },
    {
      group: 'Account',
      items: [{ id: 'profile', icon: 'person', label: 'Profile' }],
    },
  ],
  dept_admin: [
    {
      group: null,
      items: [{ id: 'dashboard', icon: 'grid', label: 'Dashboard' }],
    },
    {
      group: 'Applications',
      items: [
        { id: 'track-apps', icon: 'file', label: 'Track Applications' },
        { id: 'dept-apps', icon: 'file', label: 'Applications' },
        { id: 'dept-apps-pending', icon: 'clock', label: 'Pending', sub: true },
        { id: 'dept-apps-approved', icon: 'check', label: 'Approved', sub: true },
        { id: 'dept-apps-rejected', icon: 'x', label: 'Rejected', sub: true },
      ],
    },
    {
      group: 'Management',
      items: [
        { id: 'officers',  icon: 'shield', label: 'Officers' },
        { id: 'employees', icon: 'users',  label: 'Employees' },
        { id: 'workflow',  icon: 'flow',   label: 'Workflow Builder' },
        { id: 'password-resets', icon: 'shield', label: 'Password Resets' },
        { id: 'notices',   icon: 'notice', label: 'Manage Notices' },
      ],
    },
    {
      group: 'Account',
      items: [{ id: 'profile', icon: 'person', label: 'Profile' }],
    },
  ],
  officer: [
    {
      group: null,
      items: [
        { id: 'dashboard', icon: 'grid',  label: 'Dashboard' },
      ],
    },
    {
      group: 'Personal',
      items: [
        { id: 'track-apps', icon: 'file', label: 'Track Applications' },
        { id: 'my-apps', icon: 'file', label: 'My Applications' },
        { id: 'my-apps-pending', icon: 'clock', label: 'Pending', sub: true },
        { id: 'my-apps-approved', icon: 'check', label: 'Approved', sub: true },
        { id: 'my-apps-rejected', icon: 'x', label: 'Rejected', sub: true },
        { id: 'submit',  icon: 'plus', label: 'Submit Application' },
      ],
    },
    {
      group: 'Account',
      items: [{ id: 'profile', icon: 'person', label: 'Profile' }],
    },
  ],
  employee: [
    {
      group: null,
      items: [{ id: 'dashboard', icon: 'grid', label: 'Dashboard' }],
    },
    {
      group: 'Applications',
      items: [
        { id: 'track-apps', icon: 'file', label: 'Track Applications' },
        { id: 'my-apps', icon: 'file', label: 'My Applications' },
        { id: 'my-apps-pending', icon: 'clock', label: 'Pending', sub: true },
        { id: 'my-apps-approved', icon: 'check', label: 'Approved', sub: true },
        { id: 'my-apps-rejected', icon: 'x', label: 'Rejected', sub: true },
        { id: 'submit',  icon: 'plus', label: 'Submit Application' },
      ],
    },
    {
      group: 'Account',
      items: [{ id: 'profile', icon: 'person', label: 'Profile' }],
    },
  ],
};

// Flat navigation array used for finding default panels or matching IDs quickly
const NAV = {
  super_admin: NAV_GROUPS.super_admin.flatMap(g => g.items),
  dept_admin:  NAV_GROUPS.dept_admin.flatMap(g => g.items),
  officer:     NAV_GROUPS.officer.flatMap(g => g.items),
  employee:    NAV_GROUPS.employee.flatMap(g => g.items),
};

// ===== SIDEBAR COMPONENT =====
// This is the persistent left-side menu that allows users to navigate the portal.
export default function Sidebar({ activePanel, onNavigate, onLogout, mobOpen, collapsed }) {
  // Extract user and dashboard statistics from the global state
  const { currentUser, getDept, dashboardStats } = useApp();

  // If no user is logged in, don't render the sidebar at all
  if (!currentUser) return null;

  // identify the navigation groups for the current user's role
  const groups   = NAV_GROUPS[currentUser.role] || [];
  // Get the name of the user's department
  const dept     = currentUser.deptId ? getDept(currentUser.deptId) : null;
  const deptName = dept ? dept.name : 'All Departments';
  // Generate initials for the avatar placeholder (e.g., "John Doe" -> "JD")
  const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`;

  // Build the dynamic CSS class string for the sidebar container
  const sidebarCls = [
    'sidebar',
    collapsed ? 'collapsed' : '', // Toggled by the desktop minimize button
    mobOpen   ? 'mob-open' : '',  // Toggled by the mobile menu button
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarCls}>
      {/* ── LOGO SECTION ── */}
      <div className="sb-logo">
        <div className="logo-img-wrap">
          <img src="/images/nic.jpeg" alt="Logo" className="sb-logo-img" />
        </div>
        <div className="logo-text">
          <div className="logo-main">Government of Sikkim</div>
          <div className="logo-sub">e-Office Management System</div>
        </div>
      </div>

      {/* ── USER PROFILE SECTION ── */}
      <div className="sb-user">
        <div className="sb-avatar" style={(currentUser.profileImage && currentUser.profileImage !== 'default-profile.png') ? { padding: 0, overflow: 'hidden', background: 'none' } : {}}>
          {/* Display profile image if available, otherwise show initials */}
          {(currentUser.profileImage && currentUser.profileImage !== 'default-profile.png') ? (
            <img src={currentUser.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div className="sb-user-info">
          {/* Display Role and optional Designation */}
          <div className={`sb-role ${roleCls(currentUser.role)}`}>
            {roleLbl(currentUser.role)}
            {currentUser.officerRole && ` · ${currentUser.officerRole}`}
          </div>
          <div className="sb-name">{currentUser.firstName} {currentUser.lastName}</div>
          <div className="sb-dept">{deptName}</div>
        </div>
      </div>

      {/* ── NAVIGATION MENU ── */}
      <nav className="sb-nav">
        {/* Loop through each navigation group */}
        {groups.map((group, gi) => (
          <div key={gi} className="sb-group">
            {/* Show group label (e.g., "Applications") only if sidebar is expanded */}
            {group.group && !collapsed && (
              <div className="sb-group-label">{group.group}</div>
            )}
            {/* Loop through each navigation item within the group */}
            {group.items.map(item => (
              <div
                key={item.id}
                className={`nav-item${activePanel === item.id ? ' active' : ''}${item.sub ? ' nav-sub' : ''}`}
                onClick={() => onNavigate(item.id)} // Trigger the page change
                title={collapsed ? item.label : undefined} // Tooltip for collapsed mode
              >
                {/* Render the SVG icon from the icon map */}
                {ICON_MAP[item.icon] || ICON_MAP['grid']}
                <span className="nav-label">{item.label}</span>
                
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* ── LOGOUT BUTTON ── */}
      <div className="sb-bottom">
        <button className="btn-logout" onClick={onLogout} title={collapsed ? 'Sign Out' : undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="nav-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

// Export the flat navigation structure for use in the App component
export { NAV };
