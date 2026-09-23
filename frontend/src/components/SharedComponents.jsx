import React from 'react';
import { useApp } from '../context/AppContext';
import { badgeCls, statusTxt, getDisplayName } from '../utils/helpers';

// ===== STAT CARD =====
export function StatCard({ color, value, label }) {
  return (
    <div className={`stat ${color}`}>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

// ===== EMPTY STATE =====
export function EmptyState({ icon, text }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-txt">{text}</div>
    </div>
  );
}

// ===== OFFICER DISPLAY HELPER =====
// Shows designation as primary label, officer name as smaller text below.
export function OfficerLabel({ officer, inline = false }) {
  if (!officer) return <span className="muted">Officer</span>;
  const designation = officer.officerRole || `${officer.firstName} ${officer.lastName}`;
  const name        = `${officer.firstName} ${officer.lastName}`;

  if (inline) {
    return (
      <span>
        <strong>{designation}</strong>
        <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>({name})</span>
      </span>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{designation}</div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>({name})</div>
    </div>
  );
}

// ===== FLOW VISUALIZER =====
// Shows designation (primary) with officer name in smaller text.
export function FlowVisualizer({ workflowIds, currentStep, steps }) {
  const { getUser, currentUser } = useApp();

  return (
    <div className="flow-wrap">
      {workflowIds.map((officerId, index) => {
        const officer = getUser(officerId);
        const designation = officer?.officerRole || (officer ? `${officer.firstName} ${officer.lastName}` : 'Officer');
        const officerDisplayName = getDisplayName(officer, currentUser?.role);
        const isNameShown = officerDisplayName !== designation;

        let circleCls = 'pend';

        if (steps) {
          const step = steps[index];
          if (step) {
            if (step.status === 'approved' || step.status === 'rejected') {
              circleCls = 'done';
            } else if (index === currentStep) {
              circleCls = 'cur';
            }
          }
        }

        return (
          <React.Fragment key={officerId + index}>
            <div className="flow-step">
              <div className={`flow-circle ${circleCls}`}>{index + 1}</div>
              <div className="flow-lbl">
                <div style={{ fontWeight: 600, fontSize: 11 }}>
                  {designation}
                </div>
              </div>
            </div>
            {index < workflowIds.length - 1 && (
              <div className="flow-arrow">→</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ===== APP ROW =====
export function AppRow({ app, showEmp, onView }) {
  const { getUser, currentUser } = useApp();
  const applicant = getUser(app.employeeId?._id || app.employeeId?.id || app.employeeId);
  const currentStep = app.steps[app.currentStep];
  const currentOfficer = getUser(currentStep?.officerId?._id || currentStep?.officerId?.id || currentStep?.officerId);

  const applicantDisplayName = applicant ? `${applicant.firstName} ${applicant.lastName}` : 'Unknown';

  return (
    <div className="inbox-item" onClick={() => onView(app._id || app.id)}>
      <div className="flex aic gap12" style={{ flex: 1, minWidth: 0 }}>
        <div className="profile-avatar-mini" style={(applicant?.profileImage && applicant.profileImage !== 'default-profile.png') ? { padding: 0, overflow: 'hidden', background: 'none' } : {}}>
          {(applicant?.profileImage && applicant.profileImage !== 'default-profile.png') ? (
            <img src={applicant.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            applicant ? `${applicant.firstName[0]}${applicant.lastName[0]}` : '?'
          )}
        </div>
        <div className="ii-left">
          <h4>
            {app.title}
            {showEmp && applicant && (
              <span className="muted" style={{ fontWeight: 400, fontFamily: 'sans-serif' }}>
                {' '}·{' '}{applicantDisplayName}
              </span>
            )}
          </h4>
          <p>
            {new Date(app.submittedAt).toLocaleDateString()} &nbsp;·&nbsp; 
            <span className="accent-text" style={{fontWeight: 600}}>
              {currentOfficer?.officerRole || (currentOfficer ? `${currentOfficer.firstName} ${currentOfficer.lastName}` : 'Officer')}
            </span>
          </p>
        </div>
      </div>
      <div className="ii-right">
        <div className="workflow-preview-mini">
          {app.steps.map((step, idx) => (
            <div 
              key={idx} 
              className={`wf-dot-mini ${idx === app.currentStep ? 'active' : ''} ${step.status}`}
              title={getUser(step.officerId?._id || step.officerId?.id || step.officerId)?.officerRole || 'Officer'}
            ></div>
          ))}
        </div>
        <span className={`badge ${badgeCls(app.status)}`}>
          {statusTxt(app.status)}
        </span>
      </div>
    </div>
  );
}

// ===== INBOX ROW =====
export function InboxRow({ app, onView }) {
  const { getUser, currentUser } = useApp();
  const applicant = getUser(app.employeeId);

  const applicantDisplayName = getDisplayName(applicant, currentUser?.role);

  const officerId = currentUser?.id;
  const myStep = app.steps.find(s => s.officerId === officerId);
  const hasReviewed = myStep && myStep.status !== 'pending';

  return (
    <div className="inbox-item" style={{ alignItems: 'center' }}>
      <div className="flex aic gap12" style={{ flex: 1, minWidth: 0 }}>
        <div className="profile-avatar-mini" style={(applicant?.profileImage && applicant.profileImage !== 'default-profile.png') ? { padding: 0, overflow: 'hidden', background: 'none' } : {}}>
          {(applicant?.profileImage && applicant.profileImage !== 'default-profile.png') ? (
            <img src={applicant.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            applicant ? `${applicant.firstName[0]}${applicant.lastName[0]}` : '?'
          )}
        </div>
        <div className="ii-left">
          <h4>{app.title}</h4>
          <p>
            {applicantDisplayName}
            {' '}&nbsp;·&nbsp;{' '}{app.submittedAt}
          </p>
          {hasReviewed && myStep.note && (
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
              " {myStep.note} "
            </div>
          )}
        </div>
      </div>
      <div className="ii-right">
        <span className={`badge ${badgeCls(app.status)}`}>
          {statusTxt(app.status)}
        </span>

        <button className="btn btn-ghost btn-sm" onClick={() => onView(app.id)}>
          View
        </button>
      </div>
    </div>
  );
}
