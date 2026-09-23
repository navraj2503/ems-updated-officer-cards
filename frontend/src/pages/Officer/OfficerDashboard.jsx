// Import React and the 'useState' hook to manage component-level state
import React, { useState } from 'react';
// Import the global 'useApp' hook to access shared application data and current user info
import { useApp } from '../../context/AppContext';
// Import reusable UI components for statistics cards, inbox rows, and empty states
import { StatCard, InboxRow, EmptyState } from '../../components/SharedComponents';
// Import the modal component for viewing full application details
import { AppDetailModal } from '../../components/Modals';

// ===== OFFICER DASHBOARD COMPONENT =====
// This page is the primary landing screen for officers. 
// It displays summary statistics and lists applications that require their specific attention.

export default function OfficerDashboard() {
  // Extract the current user object, the application filtering helper, and pre-calculated stats from global state
  const { currentUser, getApps, dashboardStats } = useApp();
  
  // State to track which application is currently being viewed in the detail modal (stores the appId or null)
  const [viewingAppId, setViewingAppId] = useState(null);

  // Retrieve every application that belongs to the same department as the logged-in officer
  const allDeptApps = getApps(a => (a.deptId?._id || a.deptId?.id || a.deptId) === currentUser.deptId);

  // Filter the department applications to identify which ones specifically need the current officer's review
  const pendingMyReviewList = allDeptApps.filter(a => {
    // Standardize IDs to strings for reliable comparison
    const myId = (currentUser.id || currentUser._id)?.toString();
    
    // Get the current step details from the application's workflow steps array
    const currentStep = a.steps[a.currentStep];
    
    // Identify the officer assigned to the current workflow step
    const currentOfficerId = (currentStep?.officerId?._id || currentStep?.officerId?.id || currentOfficerId)?.toString();
    
    // Identify the recipient if the application was formally 'sent back'
    const sentBackToId = (a.sentBackTo?._id || a.sentBackTo?.id || a.sentBackTo)?.toString();
    
    // Logic 1: Standard Workflow. It's the officer's turn AND it hasn't been sent back to someone else.
    const isMyTurnInWorkflow = currentOfficerId === myId && !a.status.includes('sent_back');
    
    // Logic 2: Specific Correction. The application was explicitly sent back to this specific officer.
    const isSentBackToMe = a.status === 'sent_back_to_officer' && sentBackToId === myId;
    
    // Logic 3: Finality Check. Ensure the application hasn't already been finished (approved/rejected).
    const notFinal = !['approved', 'rejected', 'completed'].includes(a.status);
    
    // Return true if the application requires action from this officer
    return (isMyTurnInWorkflow || isSentBackToMe) && notFinal;
  });

  // Filter the department applications to show everything that is currently undergoing the workflow
  const allDeptPendingList = allDeptApps.filter(a => 
    !['approved', 'rejected', 'completed'].includes(a.status)
  );

  // The component renders the following UI layout:
  return (
    <>
      {/* SECTION 1: Summary Statistics Cards */}
      {/* These cards show real-time counts fetched directly from the backend dashboardStats API */}
      <div className="stats-grid">
        {/* Count of applications specifically assigned to the current officer */}
        <StatCard color="orange" value={dashboardStats.pendingForMe || 0}  label="Awaiting My Review" />
        
        {/* Count of all pending applications across the entire department */}
        <StatCard color="blue"   value={dashboardStats.deptPending || 0}   label="Total Dept Pending" />
        
        {/* Count of applications where this officer has already taken a step action */}
        <StatCard color="green"  value={dashboardStats.processedByMe || 0}     label="Reviewed by Me" />
        
        {/* Count of applications that have been rejected within the department */}
        <StatCard color="red"    value={dashboardStats.rejected || 0} label="Rejected" />
      </div>

      {/* SECTION 2: Action Required Table */}
      {/* Only visible if there are applications specifically waiting for this officer */}
      {pendingMyReviewList.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ color: 'var(--accent)' }}>Awaiting My Review</div>
          {/* Map through the filtered list and render a row for each application */}
          {pendingMyReviewList.map(app => (
            <InboxRow
              key={app.id} // Unique React key for list rendering
              app={app} // Pass the application data to the row component
              onView={setViewingAppId} // Trigger the detail modal when clicked
            />
          ))}
        </div>
      )}

      {/* SECTION 3: Departmental Workload Table */}
      {/* Shows all active applications in the department to provide overall visibility */}
      <div className="card">
        <div className="card-title">Departmental Pending Applications</div>
        {/* Display an empty state message if no applications are pending in the department */}
        {allDeptPendingList.length === 0 ? (
          <EmptyState icon="✅" text="No pending applications in department" />
        ) : (
          /* Map through all pending department applications */
          allDeptPendingList.map(app => (
            <InboxRow
              key={app.id}
              app={app}
              onView={setViewingAppId}
            />
          ))
        )}
      </div>

      {/* MODAL: Application Details */}
      {/* This component opens a popup window when 'viewingAppId' is set (not null) */}
      {viewingAppId && (
        <AppDetailModal
          appId={viewingAppId} // Pass the ID of the application to display
          onClose={() => setViewingAppId(null)} // Clear the ID to close the modal
        />
      )}
    </>
  );
}
