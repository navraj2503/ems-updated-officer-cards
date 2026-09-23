import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { badgeCls, statusTxt, isStatusInProgress, isStatusApproved, isStatusRejected } from '../../utils/helpers';
import { AppDetailModal } from '../../components/Modals';

// ===== ALL APPLICATIONS PAGE =====
// Super Admin view: lists all applications in the entire system.

export default function AllAppsPage({ filter }) {
  const { db, getUser, getDept } = useApp();
  const [viewingAppId, setViewingAppId] = useState(null);

  const apps = filter 
    ? db.applications.filter(a => {
        if (filter === 'pending') return isStatusInProgress(a.status);
        if (filter === 'completed' || filter === 'approved') return isStatusApproved(a.status);
        if (filter === 'rejected') return isStatusRejected(a.status);
        return a.status === filter;
      })
    : db.applications;

  const title = filter 
    ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`
    : 'All Applications';

  return (
    <>
      <div className="card">
        <div className="card-title">{title}</div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map(app => {
                const employee = getUser(app.employeeId);
                const dept     = getDept(app.deptId);
                return (
                  <tr key={app.id}>
                    <td><strong>{app.title}</strong></td>
                    <td>{employee ? `${employee.firstName} ${employee.lastName}` : '—'}</td>
                    <td>{dept ? dept.name : '—'}</td>
                    <td>
                      <span className={`badge ${badgeCls(app.status)}`}>
                        {statusTxt(app.status)}
                      </span>
                    </td>
                    <td className="muted">{app.submittedAt}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setViewingAppId(app.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
