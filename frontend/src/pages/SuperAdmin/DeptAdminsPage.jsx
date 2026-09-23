import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../../components/SharedComponents';
import { CreateDAModal } from '../../components/Modals';
import { ConfirmDialog, EditUserModal } from '../../components/AdminModals';
import { useNotif } from '../../components/Notification';

// ===== DEPT ADMINS PAGE (Super Admin) =====
// Edit & Delete with confirmation dialogs.
export default function DeptAdminsPage() {
  const { db, getDept, removeUser } = useApp();
  const notif = useNotif();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin]       = useState(null);
  const [deletingAdmin, setDeletingAdmin]     = useState(null);
  const [, forceUpdate] = useState(0);

  const admins = db.users.filter(u => u.role === 'dept_admin');

  const handleDelete = () => {
    removeUser(deletingAdmin.id);
    notif(`Admin "${deletingAdmin.firstName} ${deletingAdmin.lastName}" removed`, 'success');
    setDeletingAdmin(null);
    forceUpdate(n => n + 1);
  };

  return (
    <>
      <div className="card">
        <div className="card-title flex aic jsb">
          <span>Department Admins</span>
          <button className="btn btn-accent btn-sm" onClick={() => setShowCreateModal(true)}>
            + Add Dept Admin
          </button>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr><td colSpan="5"><EmptyState icon="👤" text="No dept admins yet" /></td></tr>
              ) : (
                admins.map(u => {
                  const dept = getDept(u.deptId);
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
                      <td>
                        <span className="badge b-da">
                          {dept ? dept.name : '—'}
                        </span>
                      </td>
                      <td><span className="badge b-done">Active</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditingAdmin(u)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeletingAdmin(u)}
                          >
                            🗑 Delete
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
        <CreateDAModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => forceUpdate(n => n + 1)}
        />
      )}

      {editingAdmin && (
        <EditUserModal
          user={editingAdmin}
          callerRole="super_admin"
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => { forceUpdate(n => n + 1); setEditingAdmin(null); }}
        />
      )}

      {deletingAdmin && (
        <ConfirmDialog
          title="Remove Department Admin"
          message={`Remove "${deletingAdmin.firstName} ${deletingAdmin.lastName}" as Department Admin? Their account will be deleted.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeletingAdmin(null)}
        />
      )}
    </>
  );
}
