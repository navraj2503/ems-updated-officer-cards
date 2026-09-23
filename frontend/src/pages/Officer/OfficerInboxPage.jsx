import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InboxRow, EmptyState } from '../../components/SharedComponents';
import { AppDetailModal } from '../../components/Modals';
import { useNotif } from '../../components/Notification';

// ===== OFFICER INBOX PAGE =====
// Shows two sections: applications pending this officer's review,
// and applications already reviewed by them.

export default function OfficerInboxPage() {
  const { currentUser, getApps, clearHistory } = useApp();
  const notif = useNotif();
  const [viewingAppId, setViewingAppId] = useState(null);

  const allDeptApps = getApps(a => {
    const appDeptId = a.deptId?._id || a.deptId?.id || a.deptId;
    const userDeptId = currentUser.deptId?._id || currentUser.deptId?.id || currentUser.deptId;
    return appDeptId === userDeptId;
  });

  const pendingApps = allDeptApps.filter(a => {
    const myId = (currentUser.id || currentUser._id)?.toString();
    const currentStep = a.steps[a.currentStep];
    const currentOfficerId = (currentStep?.officerId?._id || currentStep?.officerId?.id || currentStep?.officerId)?.toString();
    const sentBackToId = (a.sentBackTo?._id || a.sentBackTo?.id || a.sentBackTo)?.toString();
    
    // 1. Is it my turn in the standard workflow?
    const isMyTurnInWorkflow = currentOfficerId === myId && !a.status.includes('sent_back');
    
    // 2. Was it specifically sent back to me?
    const isSentBackToMe = a.status === 'sent_back_to_officer' && sentBackToId === myId;

    const notFinal = !['approved', 'rejected', 'completed'].includes(a.status);

    return (isMyTurnInWorkflow || isSentBackToMe) && notFinal;
  });

  const reviewedApps = allDeptApps.filter(a => {
    const hasReviewed = a.steps.some(s => (s.officerId === currentUser.id || s.officerId?._id === currentUser.id || s.officerId === currentUser._id) && s.status !== 'pending');
    const isCleared = (a.clearedBy || []).some(id => id === currentUser.id || id === currentUser._id);
    const isCurrentlyPendingMe = pendingApps.some(p => p.id === a.id || p._id === a._id);
    return hasReviewed && !isCleared && !isCurrentlyPendingMe;
  });

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your personal review history? This will not affect other officers or the application records.')) {
      clearHistory(currentUser.id);
      notif('Your history has been cleared', 'success');
    }
  };

  return (
    <>
      {/* Pending Review Section */}
      <div className="card">
        <div className="card-title">
          Pending Review{' '}
          <span className="badge b-pending" style={{ marginLeft: 4 }}>
            {pendingApps.length}
          </span>
        </div>
        {pendingApps.length === 0 ? (
          <EmptyState icon="✅" text="No pending applications" />
        ) : (
          pendingApps.map(app => (
            <InboxRow
              key={app.id}
              app={app}
              onView={setViewingAppId}
            />
          ))
        )}
      </div>

      {/* Already Reviewed Section - Re-added as Personal History */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            My History{' '}
            <span className="badge b-done" style={{ marginLeft: 4 }}>
              {reviewedApps.length}
            </span>
          </div>
          {reviewedApps.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleClearHistory} style={{ color: 'var(--danger)' }}>
              Clear My History
            </button>
          )}
        </div>
        {reviewedApps.length === 0 ? (
          <EmptyState icon="📋" text="No history items to show" />
        ) : (
          reviewedApps.map(app => (
            <InboxRow
              key={app.id}
              app={app}
              onView={setViewingAppId}
            />
          ))
        )}
      </div>

      <div style={{ padding: '0 10px', fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 20 }}>
        Looking for all department files? Check <strong>Track Applications</strong> in the sidebar.
      </div>

      {/* App Detail Modal */}
      {viewingAppId && (
        <AppDetailModal
          appId={viewingAppId}
          onClose={() => setViewingAppId(null)}
        />
      )}
    </>
  );
}
