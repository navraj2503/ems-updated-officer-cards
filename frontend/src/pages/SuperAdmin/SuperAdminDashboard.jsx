import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard, EmptyState } from '../../components/SharedComponents';
import { useNotif } from '../../components/Notification';

// ===== SUPER ADMIN DASHBOARD =====
// Shows system-wide stats and a department overview table.

export default function SuperAdminDashboard() {
  const { db, getDA, getOffs, getEmps, getApps, dashboardStats } = useApp();

  const totalDepts = db.departments.length;
  const totalDAs   = db.users.filter(u => u.role === 'dept_admin').length;
  const totalOffs  = db.users.filter(u => u.role === 'officer').length;
  const totalApps  = db.applications.length;

  return (
    <>
      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard color="blue"   value={totalDepts} label="Departments" />
        <StatCard color="green"  value={totalDAs}   label="Dept Admins" />
        <StatCard color="orange" value={totalApps}  label="Applications" />
        <StatCard color="red"    value={dashboardStats.pendingResetRequests || 0} label="Reset Requests" />
      </div>

      {/* Department Overview Card */}
      <div className="card">
        <div className="card-title">Department Overview</div>
        {db.departments.length === 0 ? (
          <EmptyState icon="🏢" text="No departments yet" />
        ) : (
          db.departments.map(dept => {
            const da       = getDA(dept.id);
            const officers = getOffs(dept.id).length;
            const employees= getEmps(dept.id).length;
            const appCount = getApps(a => a.deptId === dept.id).length;

            return (
              <div key={dept.id} className="inbox-item">
                <div className="ii-left">
                  <h4>{dept.name}</h4>
                  <p>
                    Admin: <strong>{da ? `${da.firstName} ${da.lastName}` : 'Unassigned'}</strong>
                    &nbsp;·&nbsp; {officers} officers
                    &nbsp;·&nbsp; {employees} employees
                  </p>
                </div>
                <div className="ii-right">
                  <span className="badge b-prog">{appCount} applications</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
