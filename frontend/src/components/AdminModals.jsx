import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../context/AppContext';
import { useNotif } from './Notification';

const OFFICER_ROLES = [
  'HOD', 'HOO', 'Section Officer', 'Secretary', 'Joint Secretary',
  'Deputy Secretary', 'Under Secretary', 'Superintendent', 'Assistant Superintendent',
];

// ===== MODAL WRAPPER (shared) =====
function ModalWrapper({ children, onClose, maxWidth = 480 }) {
  return ReactDOM.createPortal(
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ===== CONFIRM DIALOG =====
// Generic confirmation with optional danger styling.
export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return ReactDOM.createPortal(
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-title" style={{ color: danger ? 'var(--danger)' : undefined }}>
          {danger ? '⚠️ ' : ''}{title}
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          {message}
        </p>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-accent'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ===== EDIT DEPARTMENT MODAL =====
export function EditDeptModal({ dept, onClose, onSuccess }) {
  const { updateDepartment } = useApp();
  const notif = useNotif();
  const [name, setName] = useState(dept.name);

  const handleSave = () => {
    if (!name.trim()) { notif('Name cannot be empty', 'error'); return; }
    updateDepartment(dept.id, name.trim());
    notif('Department updated!', 'success');
    onSuccess();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth={400}>
      <div className="modal-title">Edit Department</div>
      <div className="form-group">
        <label className="lbl">Department Name</label>
        <input
          className="inp"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
        />
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSave}>Save</button>
      </div>
    </ModalWrapper>
  );
}

// ===== EDIT USER MODAL =====
// Used by Super Admin to edit Dept Admins.
// callerRole determines if email can be changed (only super_admin / dept_admin).
export function EditUserModal({ user, callerRole, onClose, onSuccess }) {
  const { db, updateUser } = useApp();
  const notif = useNotif();

  const canChangeEmail = callerRole === 'super_admin' || callerRole === 'dept_admin';

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName:  user.lastName,
    email:     user.email,
    password:  '', // Don't pre-fill password for security
    deptId:    (user.deptId?._id || user.deptId?.id || user.deptId) || '',
    profileImage: user.profileImage || '',
  });
  const [showPass, setShowPass] = useState(false);

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

  const handleSave = async () => {
    if (!form.firstName.trim()) { notif('First name is required', 'error'); return; }
    if (canChangeEmail && !form.email.trim()) { notif('Email is required', 'error'); return; }

    const updates = {
      firstName:    form.firstName.trim(),
      lastName:     form.lastName.trim(),
      profileImage: form.profileImage,
    };
    
    // Only send password if it was changed
    if (form.password.trim()) {
      if (form.password.trim().length < 3) {
        notif('Password must be at least 3 characters', 'error'); return;
      }
      updates.password = form.password.trim();
    }

    if (canChangeEmail) updates.email = form.email.trim();
    if (user.role === 'dept_admin') updates.deptId = form.deptId || null;
    
    const userId = user._id || user.id;
    await updateUser(userId, updates, callerRole);
    notif('User updated successfully!', 'success');
    onSuccess();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="modal-title">Edit {user.role === 'dept_admin' ? 'Dept Admin' : 'User'}</div>

      {/* Profile Picture Upload */}
      <div className="form-group">
        <label className="lbl">Profile Picture <span className="muted">(optional)</span></label>
        <label className="profile-pic-upload-wrap" htmlFor="edit-user-pic">
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
          id="edit-user-pic"
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="lbl">First Name</label>
          <input className="inp" value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="lbl">Last Name</label>
          <input className="inp" value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
        </div>
      </div>

      <div className="form-group">
        <label className="lbl">Email {!canChangeEmail && <span className="muted">(read-only)</span>}</label>
        <input
          className="inp"
          type="email"
          value={form.email}
          readOnly={!canChangeEmail}
          style={!canChangeEmail ? { background: 'var(--surface)', color: 'var(--muted)' } : {}}
          onChange={e => canChangeEmail && setForm(f => ({ ...f, email: e.target.value }))}
        />
        {!canChangeEmail && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            Only administrators can change email addresses.
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="lbl">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            className="inp"
            type={showPass ? "text" : "password"}
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

      {user.role === 'dept_admin' && (
        <div className="form-group">
          <label className="lbl">Department</label>
          <select className="sel" value={form.deptId}
            onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}>
            <option value="">None</option>
            {db.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSave}>Save Changes</button>
      </div>
    </ModalWrapper>
  );
}

// ===== EDIT OFFICER MODAL =====
// Dept Admin: can edit officer name AND designation.
export function EditOfficerModal({ officer, onClose, onSuccess }) {
  const { updateUser, updateOfficerRole } = useApp();
  const notif = useNotif();

  const [form, setForm] = useState({
    firstName:   officer.firstName,
    lastName:    officer.lastName,
    password:    '', // Don't pre-fill password
    officerRole: officer.officerRole || '',
    profileImage: officer.profileImage || '',
  });
  const [showPass, setShowPass] = useState(false);

  // Handle profile picture selection — NEW
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

  const handleSave = async () => {
    if (!form.firstName.trim()) { notif('First name is required', 'error'); return; }

    const updates = {
      firstName:    form.firstName.trim(),
      lastName:     form.lastName.trim(),
      profileImage: form.profileImage,
      officerRole:  form.officerRole,
    };

    if (form.password.trim()) {
      if (form.password.trim().length < 3) {
        notif('Password must be at least 3 characters', 'error'); return;
      }
      updates.password = form.password.trim();
    }

    const officerId = officer._id || officer.id;
    await updateUser(officerId, updates, 'dept_admin');
    
    notif('Officer updated!', 'success');
    onSuccess();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth={420}>
      <div className="modal-title">Edit Officer</div>

      {/* Profile Picture Upload — NEW */}
      <div className="form-group">
        <label className="lbl">Profile Picture <span className="muted">(optional)</span></label>
        <label className="profile-pic-upload-wrap" htmlFor="edit-officer-pic">
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
          id="edit-officer-pic"
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
          <option value="">No designation</option>
          {OFFICER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="lbl">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            className="inp"
            type={showPass ? "text" : "password"}
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

      <div className="form-row">
        <div className="form-group">
          <label className="lbl">First Name</label>
          <input className="inp" value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="lbl">Last Name</label>
          <input className="inp" value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
        </div>
      </div>

      <div className="form-group">
        <label className="lbl">Email <span className="muted">(read-only)</span></label>
        <input
          className="inp"
          value={officer.email}
          readOnly
          style={{ background: 'var(--surface)', color: 'var(--muted)' }}
        />
      </div>

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSave}>Save</button>
      </div>
    </ModalWrapper>
  );
}

// ===== EDIT EMPLOYEE MODAL =====
// Dept Admin: edit employee name. Email restriction enforced.
export function EditEmployeeModal({ employee, callerRole, onClose, onSuccess }) {
  const { updateUser } = useApp();
  const notif = useNotif();

  const canChangeEmail = callerRole === 'super_admin' || callerRole === 'dept_admin';

  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName:  employee.lastName,
    email:     employee.email,
    password:  '', // Don't pre-fill password
  });
  const [showPass, setShowPass] = useState(false);

  const handleSave = async () => {
    if (!form.firstName.trim()) { notif('First name is required', 'error'); return; }

    const updates = {
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
    };
    
    if (form.password.trim()) {
      if (form.password.trim().length < 3) {
        notif('Password must be at least 3 characters', 'error'); return;
      }
      updates.password = form.password.trim();
    }

    if (canChangeEmail) updates.email = form.email.trim();
    
    const employeeId = employee._id || employee.id;
    await updateUser(employeeId, updates, callerRole);
    notif('Employee updated!', 'success');
    onSuccess();
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth={420}>
      <div className="modal-title">Edit Employee</div>

      <div className="form-row">
        <div className="form-group">
          <label className="lbl">First Name</label>
          <input className="inp" value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="lbl">Last Name</label>
          <input className="inp" value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
        </div>
      </div>

      <div className="form-group">
        <label className="lbl">Email {!canChangeEmail && <span className="muted">(read-only)</span>}</label>
        <input
          className="inp"
          type="email"
          value={form.email}
          readOnly={!canChangeEmail}
          style={!canChangeEmail ? { background: 'var(--surface)', color: 'var(--muted)' } : {}}
          onChange={e => canChangeEmail && setForm(f => ({ ...f, email: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label className="lbl">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            className="inp"
            type={showPass ? "text" : "password"}
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
        <button className="btn btn-accent" onClick={handleSave}>Save Changes</button>
      </div>
    </ModalWrapper>
  );
}
