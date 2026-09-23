import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard, AppRow, EmptyState, FlowVisualizer } from '../../components/SharedComponents';
import { AppDetailModal } from '../../components/Modals';
import { useNotif } from '../../components/Notification';
import { isStatusInProgress } from '../../utils/helpers';

// ===== DEPT ADMIN DASHBOARD =====
// Shows department-wide stats and recent activity.

export default function DeptAdminDashboard() {
  const { currentUser, getDept, getOffs, getEmps, getApps, db, dashboardStats } = useApp();
  const [viewingAppId, setViewingAppId] = useState(null);
  const notif = useNotif();

  const dept      = getDept(currentUser.deptId);
  const officers  = getOffs(currentUser.deptId);
  const employees = getEmps(currentUser.deptId);
  const allApps   = getApps(a => (a.deptId?._id || a.deptId?.id || a.deptId) === currentUser.deptId);
  const workflow  = db.workflows[currentUser.deptId] || [];

  // Show only last 4 applications
  const recentApps = allApps.slice(0, 4);

  return (
    <>
      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard color="blue"   value={dashboardStats.totalOfficers || officers.length}    label="Officers" />
        <StatCard color="green"  value={dashboardStats.totalEmployees || employees.length}   label="Employees" />
        <StatCard color="orange" value={dashboardStats.pendingApplications || 0} label="Pending Apps" />
        <StatCard color="red"    value={dashboardStats.pendingResetRequests || 0} label="Reset Requests" />
      </div>

      {/* Active Workflow Card */}
      <div className="card">
        <div className="card-title">
          Active Workflow — {dept ? dept.name : ''}
        </div>
        {workflow.length === 0 ? (
          <EmptyState icon="🔧" text="No workflow set up yet. Go to Workflow Builder." />
        ) : (
          <FlowVisualizer workflowIds={workflow} currentStep={null} steps={null} />
        )}
      </div>

      {/* Recent Applications Card */}
      <div className="card">
        <div className="card-title">Recent Applications</div>
        {allApps.length === 0 ? (
          <EmptyState icon="📋" text="No applications yet" />
        ) : (
          recentApps.map(app => (
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
