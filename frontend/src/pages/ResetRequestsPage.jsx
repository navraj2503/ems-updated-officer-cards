import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/SharedComponents';
import { useNotif } from '../components/Notification';

export default function ResetRequestsPage() {
  const { currentUser, passwordResetRequests, updateResetRequestStatus } = useApp();
  const notif = useNotif();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [filter, setFilter] = useState('pending');

  // Filter requests based on status
  const filteredResets = passwordResetRequests.filter(r => r.status === filter);

  const handleAction = async (requestId, status) => {
    try {
      if (status === 'completed' && !newPassword.trim()) {
        notif('Please provide a new password', 'error');
        return;
      }

      await updateResetRequestStatus(requestId, status, remarks, status === 'completed' ? newPassword : null);
      
      notif(`Request ${status} successfully`, 'success');
      setSelectedRequest(null);
      setRemarks('');
      setNewPassword('');
    } catch (err) {
      notif(err.message, 'error');
    }
  };

  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <div className="card">
      <div className="card-title">
        {currentUser.role === 'super_admin' ? 'System-wide Password Requests' : 'Department Password Requests'}
      </div>
      
      {/* Tabs for different statuses */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {['pending', 'completed', 'rejected'].map(s => (
          <button 
            key={s}
            className={`tab-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'pending' && '🕒 '}
            {s === 'completed' && '✅ '}
            {s === 'rejected' && '❌ '}
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
        Manage password reset requests from employees. You can approve and set a temporary password or reject the request.
      </p>
      
      {filteredResets.length === 0 ? (
        <EmptyState icon="🔑" text={`No ${filter} requests`} />
      ) : (
        filteredResets.map(req => (
          <div key={req.id} className="inbox-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ii-left">
                <h4 style={{ margin: 0 }}>{req.employeeName}</h4>
                <p className="muted" style={{ fontSize: 12, margin: '4px 0' }}>
                  Email: {req.email} &nbsp;·&nbsp; Requested: {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="ii-right">
                {req.status === 'pending' && (
                  <button 
                    className="btn btn-sm btn-accent" 
                    onClick={() => setSelectedRequest(selectedRequest === req.id ? null : req.id)}
                  >
                    {selectedRequest === req.id ? 'Cancel' : 'Take Action'}
                  </button>
                )}
                {req.status !== 'pending' && (
                  <span className={`status-pill ${req.status}`}>
                    {req.status}
                  </span>
                )}
              </div>
            </div>

            {/* Action Panel for Pending Requests */}
            {selectedRequest === req.id && (
              <div className="action-panel animate-fade-in" style={{ width: '100%', padding: 15, background: 'var(--surface2)', borderRadius: 8, marginTop: 10 }}>
                <div className="form-group">
                  <label className="lbl">Administrator Remarks</label>
                  <textarea 
                    className="inp" 
                    placeholder="Enter any notes or instructions..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="lbl">New Temporary Password</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input 
                      className="inp" 
                      type="text"
                      placeholder="Enter or generate password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button className="btn btn-sm" onClick={generateTempPassword}>Generate</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                  <button 
                    className="btn btn-sm btn-accent" 
                    onClick={() => handleAction(req.id, 'completed')}
                  >
                    Reset & Complete
                  </button>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleAction(req.id, 'rejected')}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            )}

            {/* History info for non-pending requests */}
            {req.status !== 'pending' && (
              <div style={{ fontSize: 12, color: 'var(--muted)', width: '100%', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <strong>Remarks:</strong> {req.remarks || 'No remarks'} <br/>
                <strong>Processed:</strong> {new Date(req.reviewedAt).toLocaleString()}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
