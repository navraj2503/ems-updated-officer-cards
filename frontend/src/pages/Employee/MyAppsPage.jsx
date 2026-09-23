import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppRow } from '../../components/SharedComponents';
import { AppDetailModal } from '../../components/Modals';
import { isStatusInProgress, isStatusApproved, isStatusRejected } from '../../utils/helpers';

// ===== MY APPLICATIONS PAGE =====
// Employee view: lists all applications submitted by the current employee.

export default function MyAppsPage({ onNavigate, filter }) {
  const { currentUser, getApps } = useApp();
  const [viewingAppId, setViewingAppId] = useState(null);

  const myApps = filter 
    ? getApps(a => {
        const isOwner = (a.employeeId?._id || a.employeeId?.id || a.employeeId) === currentUser.id;
        if (!isOwner) return false;
        if (filter === 'pending') return isStatusInProgress(a.status);
        if (filter === 'completed' || filter === 'approved') return isStatusApproved(a.status);
        if (filter === 'rejected') return isStatusRejected(a.status);
        return a.status === filter;
      })
    : getApps(a => (a.employeeId?._id || a.employeeId?.id || a.employeeId) === currentUser.id);

  const title = filter 
    ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`
    : 'My Applications';

  return (
    <>
      <div className="card">
        <div className="card-title">{title}</div>

        {myApps.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-txt">
              No applications yet.{' '}
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
          myApps.map(app => (
            <AppRow
              key={app.id}
              app={app}
              showEmp={false}
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
