import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../../components/SharedComponents';
import { CreateEmployeeModal } from '../../components/Modals';
import { EditEmployeeModal, ConfirmDialog } from '../../components/AdminModals';
import { useNotif } from '../../components/Notification';

// ===== EMPLOYEES PAGE (Dept Admin) =====
// List, Add, Edit, Remove employees in the department.
export default function EmployeesPage() {
  const { currentUser, getEmps, getDept, getApps, removeUser } = useApp();
  const notif = useNotif();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEmp, setEditingEmp]           = useState(null);
  const [deletingEmp, setDeletingEmp]         = useState(null);
  const [, forceUpdate] = useState(0);

  const employees = getEmps(currentUser.deptId);
  const dept      = getDept(currentUser.deptId);

  const handleDelete = () => {
    removeUser(deletingEmp.id);
    notif('Employee removed', 'success');
    setDeletingEmp(null);
    forceUpdate(n => n + 1);
  };

  return (
    <>
      <div className="card">
        <div className="card-title flex aic jsb">
          <span>Employees — {dept ? dept.name : ''}</span>
          <button className="btn btn-accent btn-sm" onClick={() => setShowCreateModal(true)}>
            + Add Employee
          </button>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Applications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan="4"><EmptyState icon="👤" text="No employees yet" /></td></tr>
              ) : (
                employees.map(u => {
                  const appCount = getApps(a => a.employeeId === u.id).length;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex aic gap12">
                          <div className="profile-avatar-mini" style={(u.profileImage && u.profileImage !== 'default-profile.png') ? { padding: 0, overflow: 'hidden', background: 'none' } : {}}>
                            {(u.profileImage && u.profileImage !== 'default-profile.png') ? (
                              <img src={u.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              `${u.firstName[0]}${u.lastName[0]}`
                            )}
                          </div>
                          <strong>{u.firstName} {u.lastName}</strong>
                        </div>
                      </td>
                      <td className="muted">{u.email}</td>
                      <td>{appCount}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingEmp(u)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeletingEmp(u)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateEmployeeModal
          deptId={currentUser.deptId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => forceUpdate(n => n + 1)}
        />
      )}

      {editingEmp && (
        <EditEmployeeModal
          employee={editingEmp}
          callerRole={currentUser.role}
          onClose={() => setEditingEmp(null)}
          onSuccess={() => { forceUpdate(n => n + 1); setEditingEmp(null); }}
        />
      )}

      {deletingEmp && (
        <ConfirmDialog
          title="Remove Employee"
          message={`Remove "${deletingEmp.firstName} ${deletingEmp.lastName}" from ${dept ? dept.name : 'the department'}? Their account will be deleted.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeletingEmp(null)}
        />
      )}
    </>
  );
}
