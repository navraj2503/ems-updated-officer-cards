// Import React and hooks for managing component state
import React, { useState } from 'react';
// Import global application context to access the user and their applications
import { useApp } from '../../context/AppContext';
// Import reusable UI components for the stats grid and application rows
import { StatCard, AppRow } from '../../components/SharedComponents';
// Import the detailed view modal for applications
import { AppDetailModal } from '../../components/Modals';
// Import helper utilities to check the status of an application
import { isStatusInProgress, isStatusApproved, isStatusRejected } from '../../utils/helpers';

// ===== EMPLOYEE DASHBOARD COMPONENT =====
// This page is the main landing area for employees.
// It displays a summary of their application counts and a list of every application they've submitted.

export default function EmployeeDashboard({ onNavigate }) {
  // Extract user info, the global application filtering function, and reset requests
  const { currentUser, getApps, passwordResetRequests } = useApp();
  // State to track which application is being viewed in the popup modal
  const [viewingAppId, setViewingAppId] = useState(null);

  // Find any active password reset request for this employee
  const myResetRequest = passwordResetRequests.find(r => 
    (r.employeeId === currentUser.id || r.employeeId === currentUser._id) && 
    r.status === 'pending'
  );

  // Filter the global applications list to find only those created by the current user
  const myApps = getApps(a => {
    // Standardize IDs for comparison (handle both object and string formats)
    const empId = a.employeeId?._id || a.employeeId?.id || a.employeeId;
    return empId === currentUser.id || empId === currentUser._id;
  });

  // Calculate summary counts for the dashboard cards
  const inProgress = myApps.filter(a => isStatusInProgress(a.status)).length;
  const approved   = myApps.filter(a => isStatusApproved(a.status)).length;
  const rejected   = myApps.filter(a => isStatusRejected(a.status)).length;

  return (
    <>
      {/* Password Reset Notice */}
      {myResetRequest && (
        <div className="notice-card priority-medium" style={{ marginBottom: 20 }}>
          <div className="notice-card-header">
            <div className="notice-title">🔑 Password Reset Request Pending</div>
          </div>
          <div className="notice-content">
            Your password reset request has been submitted to your administrator. Please wait for their review.
          </div>
        </div>
      )}

      {/* ── STATISTICS SECTION ── */}
      {/* Displays four colorful cards with summary counts */}
      <div className="stats-grid">
        <StatCard color="blue"   value={myApps.length} label="My Applications" />
        <StatCard color="orange" value={inProgress}    label="In Progress" />
        <StatCard color="green"  value={approved}      label="Approved" />
        <StatCard color="red"    value={rejected}      label="Rejected" />
      </div>

      {/* ── APPLICATIONS LIST ── */}
      <div className="card">
        <div className="card-title">My Applications</div>
        
        {/* If the user hasn't submitted anything yet, show a friendly prompt */}
        {myApps.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-txt">
              No applications yet.{' '}
              {/* Clicking this link triggers the navigation to the submission page */}
              <a
                href="#submit"
                onClick={e => { e.preventDefault(); onNavigate('submit'); }}
                style={{ color: 'var(--accent)' }}
              >
                Submit one →
              </a>
            </div>
          </div>
        ) : (
          // Map through the user's applications and render a row for each
          myApps.map(app => (
            <AppRow
              key={app.id}
              app={app}
              showEmp={false} // Don't show the employee's own name on their own dashboard
              onView={setViewingAppId} // Open the modal when clicked
            />
          ))
        )}
      </div>

      {/* ── APPLICATION DETAIL MODAL ── */}
      {/* This popup appears when 'viewingAppId' is set to a specific ID */}
      {viewingAppId && (
        <AppDetailModal
          appId={viewingAppId}
          onClose={() => setViewingAppId(null)} // Clear the ID to close the modal
        />
      )}
    </>
  );
}
