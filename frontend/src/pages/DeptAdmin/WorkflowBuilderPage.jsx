import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotif } from '../../components/Notification';
import OfficerCardList from '../../components/OfficerCardList';

// ===== WORKFLOW BUILDER PAGE =====
// Shows Designation as primary, officer name in smaller text below.
export default function WorkflowBuilderPage() {
  const { currentUser, getOffs, getDept, db, saveWorkflow } = useApp();
  const notif = useNotif();

  const dept     = getDept(currentUser.deptId);
  const officers = getOffs(currentUser.deptId);

  const [draft, setDraft]                     = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');

  useEffect(() => {
    setDraft([...(db.workflows[currentUser.deptId] || [])]);
  }, [currentUser.deptId]); // eslint-disable-line

  const addStep = () => {
    if (!selectedOfficerId) { notif('Select an officer', 'error'); return; }
    if (draft.includes(selectedOfficerId)) { notif('Already in workflow', 'error'); return; }
    setDraft(prev => [...prev, selectedOfficerId]);
    setSelectedOfficerId('');
  };

  const removeStep = (index) => setDraft(prev => prev.filter((_, i) => i !== index));
  const clearAll   = () => setDraft([]);
  const handleSave = () => { saveWorkflow(currentUser.deptId, draft); notif('Workflow saved!', 'success'); };

  return (
    <>
    <div className="card">
      <div className="card-title">Workflow Builder — {dept ? dept.name : ''}</div>
      <p className="muted mb3">
        Define the order officers review applications. Officers are shown by their designation.
      </p>

      {/* Add Officer to Workflow */}
      <div className="mb3">
        <label className="lbl">Add officer to workflow</label>
        <div className="flex g2">
          <select
            className="sel"
            style={{ flex: 1 }}
            value={selectedOfficerId}
            onChange={e => setSelectedOfficerId(e.target.value)}
          >
            <option value="">Choose officer...</option>
            {officers.map(o => (
              <option key={o.id} value={o.id}>
                {o.officerRole ? `${o.officerRole} — ` : ''}{o.firstName} {o.lastName}
              </option>
            ))}
          </select>
          <button className="btn btn-accent" onClick={addStep}>Add Step</button>
        </div>
      </div>

      {/* Workflow Sequence */}
      <label className="lbl mb2">Workflow sequence</label>
      <div className="wf-builder">
        {draft.length === 0 ? (
          <span className="wf-empty">No steps yet. Add officers above.</span>
        ) : (
          draft.map((officerId, index) => {
            const officer = officers.find(o => o.id === officerId);
            return (
              <React.Fragment key={officerId}>
                <div className="wf-step">
                  <span className="muted" style={{ fontSize: 10 }}>#{index + 1}</span>
                  <div style={{ textAlign: 'center' }}>
                    {/* PRIMARY: Designation */}
                    <div className="wf-step-name" style={{ fontWeight: 700 }}>
                      {officer ? (officer.officerRole || `${officer.firstName} ${officer.lastName}`) : 'Unknown'}
                    </div>
                  </div>
                  <button className="wf-step-rm" onClick={() => removeStep(index)}>×</button>
                </div>
                {index < draft.length - 1 && <span className="wf-arrow">→</span>}
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="flex g2 mt3">
        <button className="btn btn-accent" onClick={handleSave}>💾 Save Workflow</button>
        <button className="btn btn-ghost" onClick={clearAll}>Clear All</button>
      </div>
    </div>

    {/* ===== OFFICER CARDS SECTION — NEW FEATURE (ADDITIVE ONLY) ===== */}
    <div className="officer-cards-section">
      <div className="officer-cards-section-title">
        🪪 Officer Cards
      </div>
      <OfficerCardList officers={officers} deptName={dept ? dept.name : ''} />
    </div>
    </>
  );
}
