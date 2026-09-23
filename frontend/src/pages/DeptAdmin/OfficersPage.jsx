import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../../components/SharedComponents';
import { useNotif } from '../../components/Notification';
import { EditOfficerModal, ConfirmDialog } from '../../components/AdminModals';

const OFFICER_ROLES = [
  'HOD', 'HOO', 'Section Officer', 'Secretary', 'Joint Secretary',
  'Deputy Secretary', 'Under Secretary', 'Superintendent', 'Assistant Superintendent',
];

function CreateOfficerModal({ deptId, onClose, onSuccess }) {
  const { createUser } = useApp();
  const notif = useNotif();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', officerRole: '',
    profileImage: '',
  });
  const [showPass, setShowPass] = useState(false);

  // Handle profile picture selection — convert to base64 data URL
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      notif('Only JPG and PNG images are allowed', 'error'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, profileImage: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password || !form.officerRole) {
      notif('Please fill all fields including the designation', 'error'); return;
    }
    try {
      await createUser({ ...form, role: 'officer', deptId });
      notif(`${form.officerRole} added successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (e) { notif(e.message, 'error'); }
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">Add Officer / Official</div>

        {/* Profile Picture Upload — NEW */}
        <div className="form-group">
          <label className="lbl">Profile Picture <span className="muted">(optional)</span></label>
          <label className="profile-pic-upload-wrap" htmlFor="create-officer-pic">
            {form.profileImage ? (
              <img src={form.profileImage} alt="Preview" className="profile-pic-preview" />
            ) : (
              <div className="profile-pic-default-preview">📷</div>
            )}
            <span className="profile-pic-upload-hint">
              {form.profileImage ? 'Click to change photo' : 'Click to upload JPG or PNG'}
            </span>
          </label>
          <input
            id="create-officer-pic"
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>

        <div className="form-group">
          <label className="lbl">Designation</label>
          <select className="sel" value={form.officerRole}
            onChange={e => setForm(f => ({ ...f, officerRole: e.target.value }))}>
            <option value="">Select Designation...</option>
            {OFFICER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="lbl">First Name</label>
            <input className="inp" placeholder="First" value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="lbl">Last Name</label>
            <input className="inp" placeholder="Last" value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="lbl">Official Email</label>
          <input className="inp" type="email" placeholder="officer@sikkim.gov.in" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="lbl">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              className="inp"
              type={showPass ? "text" : "password"}
              placeholder="••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: '4px 8px', fontSize: 11 }}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleSubmit}>Add Officer</button>
        </div>
      </div>
    </div>
  );
}

export default function OfficersPage() {
  const { currentUser, getOffs, getDept, removeUser } = useApp();
  const notif = useNotif();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOfficer, setEditingOfficer]   = useState(null);
  const [deletingOfficer, setDeletingOfficer] = useState(null);
  const [, forceUpdate] = useState(0);

  const officers = getOffs(currentUser.deptId);
  const dept     = getDept(currentUser.deptId);

  const handleDelete = () => {
    removeUser(deletingOfficer.id);
    notif('Officer removed', 'success');
    setDeletingOfficer(null);
    forceUpdate(n => n + 1);
  };

  return (
    <>
      <div className="card">
        <div className="card-title flex aic jsb">
          <span>Officers & Officials — {dept ? dept.name : ''}</span>
          <button className="btn btn-accent btn-sm" onClick={() => setShowCreateModal(true)}>
            + Add Officer
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr><td colSpan="5"><EmptyState icon="🛡" text="No officers yet" /></td></tr>
              ) : officers.map(u => (
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
                  <td>
                    {u.officerRole
                      ? <span className="officer-role-badge">{u.officerRole}</span>
                      : <span className="chip muted">No designation</span>
                    }
                  </td>
                  <td className="muted">{u.email}</td>
                  <td><span className="badge b-off">{dept ? dept.name : ''}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingOfficer(u)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeletingOfficer(u)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateOfficerModal
          deptId={currentUser.deptId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => forceUpdate(n => n + 1)}
        />
      )}

      {editingOfficer && (
        <EditOfficerModal
          officer={editingOfficer}
          onClose={() => setEditingOfficer(null)}
          onSuccess={() => { forceUpdate(n => n + 1); setEditingOfficer(null); }}
        />
      )}

      {deletingOfficer && (
        <ConfirmDialog
          title="Remove Officer"
          message={`Remove "${deletingOfficer.firstName} ${deletingOfficer.lastName}" (${deletingOfficer.officerRole || 'No designation'})? This action cannot be undone.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeletingOfficer(null)}
        />
      )}
    </>
  );
}
