import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNotif } from '../components/Notification';
import { roleLbl, roleCls } from '../utils/helpers';

// ===== PROFILE PAGE =====
// All roles. Displays user info. Email is read-only.
// Password is never displayed. User can update name fields.
export default function ProfilePage() {
  const { currentUser, getDept, updateUser, exportData, importData } = useApp();
  const notif = useNotif();

  const dept = currentUser.deptId ? getDept(currentUser.deptId) : null;

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({
    firstName: currentUser.firstName,
    lastName:  currentUser.lastName,
    profileImage: currentUser.profileImage || '',
  });

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

  const handleSave = () => {
    if (!form.firstName.trim()) { notif('First name is required', 'error'); return; }
    updateUser(currentUser.id || currentUser._id, {
      firstName:    form.firstName.trim(),
      lastName:     form.lastName.trim(),
      profileImage: form.profileImage,
    });
    notif('Profile updated!', 'success');
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      profileImage: currentUser.profileImage || '',
    });
    setEditing(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = importData(ev.target.result);
      if (success) {
        notif('Data restored successfully!', 'success');
        // Small delay to let DB update before refreshing view
        setTimeout(() => window.location.reload(), 500);
      } else {
        notif('Failed to restore data. Invalid file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`;
  const primaryId = currentUser.officerRole || roleLbl(currentUser.role);
  const secondaryId = `${currentUser.firstName} ${currentUser.lastName}`;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar-large" style={(form.profileImage && form.profileImage !== 'default-profile.png') ? { padding: 0, overflow: 'hidden', background: 'none' } : {}}>
          {(form.profileImage && form.profileImage !== 'default-profile.png') ? (
            <img
              src={form.profileImage}
              alt={`${currentUser.firstName} ${currentUser.lastName}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
            />
          ) : (
            initials
          )}
        </div>
        <div className="profile-title-area">
          {editing ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="lbl" style={{ color: 'var(--accent)' }}>Change Profile Picture</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                <label className="btn btn-ghost btn-sm" htmlFor="profile-upload" style={{ cursor: 'pointer' }}>
                  📷 Upload New
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                {form.profileImage && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, profileImage: '' }))}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="profile-primary-id">{primaryId}</div>
              <div className="profile-secondary-id">{secondaryId}</div>
              <div className="profile-badge-row">
                <span className={`badge r-badge ${roleCls(currentUser.role)}`}>
                  {roleLbl(currentUser.role)}
                </span>
                {dept && (
                  <span className="chip" style={{ background: 'rgba(15,45,107,0.05)', border: '1px solid rgba(15,45,107,0.1)' }}>
                    {dept.name}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {!editing && (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            ✏️ Edit
          </button>
        )}
      </div>

      <div className="profile-info-section">
        <div className="profile-group-title">Personal Information</div>
        
        {editing ? (
          <div className="profile-field-card">
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="lbl">First Name</label>
                <input
                  className="inp"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="lbl">Last Name</label>
                <input
                  className="inp"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
          </div>
        ) : (
          <ProfileField label="Full Name" value={`${currentUser.firstName} ${currentUser.lastName}`} />
        )}

        <ProfileField
          label="Email Address"
          value={currentUser.email}
          note="Email is managed by administrators and cannot be changed here."
        />

        <div className="profile-group-title">Professional Details</div>
        
        <ProfileField label="Official Role" value={roleLbl(currentUser.role)} />
        
        {currentUser.officerRole && (
          <ProfileField label="Designation" value={currentUser.officerRole} />
        )}

        <ProfileField
          label="Department / Unit"
          value={dept ? dept.name : 'All Departments (System-wide)'}
        />

        <div className="profile-group-title">Security</div>
        <div className="profile-field-card" style={{ borderLeft: '3px solid var(--accent3)' }}>
          <div className="profile-field-label">Password</div>
          <div className="profile-field-value">••••••••••••</div>
          <div className="profile-field-note">
            For security, passwords are encrypted. Use the "Forgot Password" flow on the login screen for resets.
          </div>
        </div>

        {/* Data Portability — Cross-device support */}
        <div className="profile-group-title">Backup & Portability</div>
        <div className="profile-field-card" style={{ background: 'var(--surface2)' }}>
          <div className="profile-field-label">Cross-Device Synchronization</div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Since this app uses Local Storage, your data stays on this device. To move your data (including profile pictures) to another phone or laptop, use the tools below.
          </p>
          <div className="profile-sync-actions">
            <button className="btn btn-ghost btn-sm" onClick={exportData}>
              📤 Backup to File
            </button>
            <label className="btn btn-ghost btn-sm" htmlFor="import-db" style={{ cursor: 'pointer' }}>
              📥 Restore from File
            </label>
            <input
              id="import-db"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      {editing && (
        <div className="flex g2 mt3" style={{ marginTop: 32, justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
          <button className="btn btn-accent" onClick={handleSave}>Save Changes</button>
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, value, note }) {
  return (
    <div className="profile-field-card">
      <div className="profile-field-label">{label}</div>
      <div className="profile-field-value">{value}</div>
      {note && <div className="profile-field-note">{note}</div>}
    </div>
  );
}
