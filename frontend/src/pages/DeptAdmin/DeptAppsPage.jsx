import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppRow, EmptyState } from '../../components/SharedComponents';
import { AppDetailModal } from '../../components/Modals';
import { useNotif } from '../../components/Notification';
import { isStatusInProgress, isStatusApproved, isStatusRejected } from '../../utils/helpers';

// ===== DEPT APPLICATIONS PAGE =====
// Dept Admin view: lists all applications submitted within the department.

export default function DeptAppsPage({ filter }) {
  const { currentUser, getApps, getDept, clearHistory } = useApp();
  const [viewingAppId, setViewingAppId] = useState(null);
  const notif = useNotif();

  const dept = getDept(currentUser.deptId);
  
  const apps = filter 
    ? getApps(a => {
        const appDeptId = (a.deptId?._id || a.deptId?.id || a.deptId);
        if (appDeptId !== currentUser.deptId) return false;
        if (filter === 'pending') return isStatusInProgress(a.status);
        if (filter === 'completed' || filter === 'approved') return isStatusApproved(a.status);
        if (filter === 'rejected') return isStatusRejected(a.status);
        return a.status === filter;
      })
    : getApps(a => (a.deptId?._id || a.deptId?.id || a.deptId) === currentUser.deptId);

  const historyApps = apps.filter(a => isStatusApproved(a.status) || isStatusRejected(a.status));

  const title = filter 
    ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`
    : `Applications — ${dept ? dept.name : ''}`;

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all approved and rejected applications from the department history?')) {
      clearHistory(currentUser.deptId);
      notif('History cleared successfully', 'success');
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>{title}</div>
          {historyApps.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClearHistory}>
              Clear History
            </button>
          )}
        </div>

        {apps.length === 0 ? (
          <EmptyState icon="📋" text="No applications yet" />
        ) : (
          apps.map(app => (
            <AppRow
              key={app.id}
              app={app}
              showEmp={true}
              onView={setViewingAppId}
            />
          ))
        )}
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
