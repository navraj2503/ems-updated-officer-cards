import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { badgeCls, statusTxt, getDisplayName } from '../../utils/helpers';
import { AppDetailModal, EditApplicationModal } from '../../components/Modals';

export default function TrackApplicationsPage() {
  const { db, currentUser, getUser, getDept, deleteApplication } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [viewingAppId, setViewingAppId] = useState(null);
  const [editingAppId, setEditingAppId] = useState(null);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = isSuperAdmin || currentUser.role === 'dept_admin';

  // Filter logic
  const apps = db.applications.filter(app => {
    const applicant = getUser(app.employeeId);
    const applicantName = applicant ? `${applicant.firstName} ${applicant.lastName}` : '';
    const matchesSearch = app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    const appDeptId = (app.deptId?._id || app.deptId?.id || app.deptId);
    const userDeptId = (currentUser.deptId?._id || currentUser.deptId?.id || currentUser.deptId);
    const matchesDept = deptFilter === 'all' || appDeptId === deptFilter;
    
    const isOwner = (app.employeeId?._id || app.employeeId?.id || app.employeeId) === currentUser.id;

    // Visibility logic: Officers/DeptAdmin see their dept apps, Super Admin sees all
    if (isSuperAdmin) return matchesSearch && matchesStatus && matchesDept;
    
    if (currentUser.role === 'dept_admin' || currentUser.role === 'officer') {
      // Officers should also see apps they submitted (even if in different dept, though unlikely here)
      const inMyDept = appDeptId === userDeptId;
      return (inMyDept || isOwner) && matchesSearch && matchesStatus;
    }
    
    // Employees see only their own
    return isOwner && matchesSearch && matchesStatus;
  });

  return (
    <div className="card">
      <div className="card-title">Track Applications</div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input 
          className="inp" 
          style={{ flex: 1, minWidth: 200 }} 
          placeholder="Search by ID, Subject or Applicant..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        
        {isSuperAdmin && (
          <select 
            className="sel" 
            style={{ width: 180 }} 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {db.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}

        <select className="sel" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="forwarded">Forwarded</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="hold">On Hold</option>
          <option value="sent_back_to_officer">Sent Back (Officer)</option>
          <option value="sent_back_to_employee">Sent Back (Employee)</option>
        </select>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Applicant</th>
              <th>Status</th>
              <th>Current Holder</th>
              <th>Workflow Stage</th>
              <th>Submitted</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                  No applications found matching your criteria.
                </td>
              </tr>
            ) : (
              apps.map(app => {
                const applicantId = (app.employeeId?._id || app.employeeId?.id || app.employeeId)?.toString();
                const myId = (currentUser.id || currentUser._id)?.toString();
                const currentOfficerId = (app.steps[app.currentStep]?.officerId?._id || app.steps[app.currentStep]?.officerId?.id || app.steps[app.currentStep]?.officerId)?.toString();
                const sentBackToId = (app.sentBackTo?._id || app.sentBackTo?.id || app.sentBackTo)?.toString();

                const applicant = getUser(app.employeeId);
                const currentOfficer = getUser(currentOfficerId);
                const dept = getDept(app.deptId);
                
                const isOwner = applicantId === myId;
                const canDelete = isAdmin || isOwner;

                const isSentBack = app.status.includes('sent_back');
                const isSentBackToMe = (app.status === 'sent_back_to_officer' && myId === sentBackToId) ||
                                       (app.status === 'sent_back_to_employee' && applicantId === myId);

                const canEdit = (isSentBack && isOwner) || 
                                (app.status === 'sent_back_to_officer' && myId === sentBackToId);

                const isMyTurn = (
                  (!isSentBack && currentOfficerId === myId && !['approved', 'rejected', 'completed', 'hold'].includes(app.status)) ||
                  (app.status === 'sent_back_to_officer' && myId === sentBackToId)
                );

                const stageText = `${app.currentStep + 1} of ${app.steps.length}`;

                return (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 11 }}>{app.id.toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{dept?.name}</div>
                    </td>
                    <td>{getDisplayName(applicant, currentUser.role)}</td>
                    <td>
                      <span className={`badge ${badgeCls(app.status)}`} style={{ fontSize: 9 }}>{statusTxt(app.status)}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {['approved', 'rejected', 'completed'].includes(app.status) ? '—' : (
                        currentOfficer ? (currentOfficer.officerRole || currentOfficer.firstName) : '—'
                      )}
                    </td>
                    <td style={{ fontSize: 12, textAlign: 'center' }}>{stageText}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{app.submittedAt}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{app.lastUpdated || app.submittedAt}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setViewingAppId(app.id)} title="View Details & History">
                          👁️ View
                        </button>
                        {canEdit && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            onClick={() => setEditingAppId(app.id)}
                            title="Edit Application"
                          >
                            ✍️ Edit
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this application?')) {
                                deleteApplication(app.id);
                              }
                            }}
                            title="Delete Application"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {viewingAppId && (
        <AppDetailModal appId={viewingAppId} onClose={() => setViewingAppId(null)} />
      )}

      {editingAppId && (
        <EditApplicationModal appId={editingAppId} onClose={() => setEditingAppId(null)} />
      )}
    </div>
  );
}