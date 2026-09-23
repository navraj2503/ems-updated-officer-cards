import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreateDeptModal } from '../../components/Modals';
import { ConfirmDialog, EditDeptModal } from '../../components/AdminModals';
import { useNotif } from '../../components/Notification';

// ===== DEPARTMENTS PAGE (Super Admin) =====
// Edit & Delete support with confirmation dialogs.
export default function DepartmentsPage() {
  const { db, getDA, getOffs, getEmps, getApps, deleteDepartment } = useApp();
  const notif = useNotif();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept]         = useState(null);
  const [deletingDept, setDeletingDept]       = useState(null);
  const [, forceUpdate] = useState(0);

  const handleDelete = () => {
    deleteDepartment(deletingDept.id);
    notif(`Department "${deletingDept.name}" deleted`, 'success');
    setDeletingDept(null);
    forceUpdate(n => n + 1);
  };

  return (
    <>
      <div className="card">
        <div className="card-title flex aic jsb">
          <span>Departments</span>
          <button className="btn btn-accent btn-sm" onClick={() => setShowCreateModal(true)}>
            + New Department
          </button>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Dept Admin</th>
                <th>Officers</th>
                <th>Employees</th>
                <th>Apps</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.departments.map(dept => {
                const da       = getDA(dept.id);
                const officers = getOffs(dept.id).length;
                const employees= getEmps(dept.id).length;
                const appCount = getApps(a => a.deptId === dept.id).length;

                return (
                  <tr key={dept.id}>
                    <td><strong>{dept.name}</strong></td>
                    <td>
                      {da
                        ? `${da.firstName} ${da.lastName}`
                        : <span className="muted">Unassigned</span>
                      }
                    </td>
                    <td>{officers}</td>
                    <td>{employees}</td>
                    <td>{appCount}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingDept(dept)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingDept(dept)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateDeptModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => forceUpdate(n => n + 1)}
        />
      )}

      {editingDept && (
        <EditDeptModal
          dept={editingDept}
          onClose={() => setEditingDept(null)}
          onSuccess={() => { forceUpdate(n => n + 1); setEditingDept(null); }}
        />
      )}

      {deletingDept && (
        <ConfirmDialog
          title="Delete Department"
          message={`Are you sure you want to delete "${deletingDept.name}"? This will also remove all associated data including applications and workflow settings.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeletingDept(null)}
        />
      )}
    </>
  );
}
