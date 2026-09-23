import api from '../utils/api';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { useApp } from '../context/AppContext';
import { useNotif } from './Notification';
import { badgeCls, statusTxt, getDisplayName, getFileUrl, downloadFile } from '../utils/helpers';
import { FlowVisualizer } from './SharedComponents';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ===== DOCUMENT PREVIEW MODAL =====
export function DocumentPreviewModal({ file, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const notif = useNotif();

  if (!file) return null;

  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type === 'application/pdf';

  const fileUrl = getFileUrl(file);

  const handleDownload = async () => {
    try {
      await downloadFile(file);
    } catch (err) {
      notif(err.message, 'error');
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <ModalWrapper onClose={onClose}>
      <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Preview: {file.name}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={handleDownload}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--accent)' }}
          >
            ⬇️ Download
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>
      
      <div style={{ 
        width: '100%', 
        height: '75vh', 
        backgroundColor: '#f3f4f6', 
        borderRadius: 8, 
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'block',
        marginTop: 10,
        padding: '20px 0'
      }}>
        {isImage ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <img 
              src={fileUrl} 
              alt={file.name} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          </div>
        ) : isPdf ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Document 
              file={fileUrl} 
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="loading">Loading PDF...</div>}
              error={<div className="error">Failed to load PDF.</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 10 }}>
                  <Page 
                    pageNumber={index + 1} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                    width={Math.min(window.innerWidth * 0.8, 700)}
                  />
                  <div style={{ textAlign: 'center', fontSize: 11, padding: 5, background: '#fff', color: 'var(--muted)' }}>
                    Page {index + 1} of {numPages}
                  </div>
                </div>
              ))}
            </Document>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>📄</div>
            <h3 style={{ color: 'var(--accent)', marginBottom: 10 }}>Preview not available</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              This file type ({file.type || 'unknown'}) cannot be previewed directly.
            </p>
            <div style={{ marginTop: 20 }}>
              <button 
                onClick={handleDownload}
                className="btn btn-accent"
              >
                Download to View File
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close Preview</button>
      </div>
    </ModalWrapper>
  );
}

// ===== EDIT APPLICATION MODAL =====
export function EditApplicationModal({ appId, onClose }) {
  const { db, updateApplicationContent, resubmitApplication, currentUser } = useApp();
  const notif = useNotif();
  const app = db.applications.find(a => a.id === appId);

  const [title, setTitle] = useState(app?.title || '');
  const [description, setDescription] = useState(app?.description || '');
  const [attachments, setAttachments] = useState(app?.files || []);
  const [previewFile, setPreviewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'zip'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    setIsUploading(true);
    for (const file of files) {
      // Frontend Validation: Extension
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        notif(`File type .${ext} is not supported.`, 'error');
        continue;
      }

      // Frontend Validation: Size
      if (file.size > MAX_SIZE) {
        notif(`File ${file.name} exceeds the 10MB limit.`, 'error');
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (data.success) {
          setAttachments(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            path: data.data.path,
            preview: URL.createObjectURL(file)
          }]);
        }
      } catch (err) {
        notif(`Failed to upload ${file.name}: ${err.response?.data?.error || err.message}`, 'error');
      }
    }
    setIsUploading(false);
    // Clear input so same file can be re-selected if removed
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  if (!app) return null;

  const handleSave = async () => {
    if (isUploading) {
      notif('Please wait for files to finish uploading...', 'info');
      return;
    }
    if (!title.trim() || !description.trim()) {
      notif('Title and Description are required', 'error');
      return;
    }
    try {
      await updateApplicationContent(app.id, title, description, attachments);
      notif('Application updated successfully', 'success');
    } catch (err) {
      notif(err.message, 'error');
    }
  };

  const handleResubmit = async () => {
    if (isUploading) {
      notif('Please wait for files to finish uploading...', 'info');
      return;
    }
    if (!title.trim() || !description.trim()) {
      notif('Title and Description are required', 'error');
      return;
    }
    try {
      await resubmitApplication(app.id, title, description, attachments, 'Corrected and resubmitted');
      notif('Application resubmitted successfully', 'success');
      onClose();
    } catch (err) {
      notif(err.message, 'error');
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="modal-title">Edit Application</div>
      
      <div className="form-group">
        <label className="lbl">Application Title</label>
        <input 
          className="inp"
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="e.g. Leave Request"
        />
      </div>

      <div className="form-group">
        <label className="lbl">Description / Content</label>
        <textarea 
          className="textarea" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Provide details..."
          style={{ minHeight: 150 }}
        />
      </div>

      <div className="form-group">
        <label className="lbl">Documents & Attachments</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {attachments.map(file => (
            <div key={file.id} style={{ 
              padding: '6px 12px', background: 'var(--surface2)', borderRadius: 6, 
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, border: '1px solid var(--border)' 
            }}>
              <span 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} 
                onClick={() => setPreviewFile(file)}
                title="Click to Preview"
              >
                📄 {file.name}
              </span>
              <button onClick={() => removeAttachment(file.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', marginLeft: 4 }}>✕</button>
            </div>
          ))}
        </div>
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange} 
          id="file-edit-upload" 
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip"
        />
        <label htmlFor="file-edit-upload" className="btn btn-ghost" style={{ display: 'inline-block', cursor: 'pointer' }}>
          📎 Replace / Add Documents
        </label>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
          <strong>Supported file types:</strong><br />
          PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, WEBP, ZIP<br />
          <strong>Maximum file size:</strong> 10 MB
        </div>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 20, border: '1px solid #fde68a' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#92400e', marginBottom: 4 }}>Correction Remarks</div>
        <p style={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>
          "{app.workflowHistory?.filter(h => h.actionType === 'sent_back').pop()?.remarks || 'No remarks provided.'}"
        </p>
      </div>

      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-ghost" onClick={handleSave} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Save Draft'}
        </button>
        <button className="btn btn-accent" onClick={handleResubmit} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Submit Correction'}
        </button>
      </div>

      {previewFile && (
        <DocumentPreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </ModalWrapper>
  );
}

// ===== MODAL WRAPPER =====
function ModalWrapper({ children, onClose, full = false }) {
  return ReactDOM.createPortal(
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${full ? 'full' : ''}`}>{children}</div>
    </div>,
    document.body
  );
}

// ===== APP DETAIL MODAL =====
// Step history shows Designation as primary, officer name in smaller text.
export function AppDetailModal({ appId, onClose }) {
  const { db, getUser, getDept, currentUser, reviewApplication, sendBackApplication, resubmitApplication, deleteApplication } = useApp();
  const notif = useNotif();
  const app = db.applications.find(a => a.id === appId);

  const [activeTab, setActiveTab] = useState('details');
  const [showReviewBox, setShowReviewBox] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [pendingDecision, setPendingDecision] = useState(null);
  const [sendBackTarget, setSendBackTarget] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isFull, setIsFull] = useState(false);

  if (!app) return null;

  const applicant   = getUser(app.employeeId);
  const dept        = getDept(app.deptId);
  const workflowIds = app.steps.map(s => s.officerId);

  const applicantName = getDisplayName(applicant, currentUser.role);
  const hideEmail = applicant?.role === 'officer' && currentUser.role === 'officer';

  const myId = (currentUser.id || currentUser._id)?.toString();
  const currentOfficerId = app.steps[app.currentStep]?.officerId;
  const currentOfficerIdStr = (currentOfficerId?._id || currentOfficerId?.id || currentOfficerId)?.toString();
  
  const applicantIdStr = (app.employeeId?._id || app.employeeId?.id || (typeof app.employeeId === 'string' ? app.employeeId : null))?.toString();
  const sentBackToIdStr = (app.sentBackTo?._id || app.sentBackTo?.id || (typeof app.sentBackTo === 'string' ? app.sentBackTo : null))?.toString();
  const sentBackByIdStr = (app.sentBackBy?._id || app.sentBackBy?.id || (typeof app.sentBackBy === 'string' ? app.sentBackBy : null))?.toString();

  const isOwner = applicantIdStr === myId;
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'dept_admin';

  const isSentBackToMe = (app.status === 'sent_back_to_officer' && sentBackToIdStr === myId) ||
                         (app.status === 'sent_back_to_employee' && applicantIdStr === myId);

  const isMyTurn = (
    (!app.status.includes('sent_back') && currentOfficerIdStr === myId && (['pending', 'forwarded', 'hold', 'submitted', 'in_progress'].includes(app.status))) ||
    (app.status === 'sent_back_to_officer' && sentBackToIdStr === myId)
  );

  const isSentBackByMe = app.status.includes('sent_back') && sentBackByIdStr === myId;

  const isOfficerReceivingBack = app.status === 'sent_back_to_officer' && sentBackToIdStr === myId;

  const canEditAsApplicant = app.status.includes('sent_back') && isOwner;

  // STRICT RULE: If it's sent back to someone else, current officer has NO rights.
  const hasActionsLocked = app.status.includes('sent_back') && !isSentBackToMe;

  const canDelete = isAdmin || isOwner;

  // Logic to find potential Send Back targets
  const getSendBackTargets = () => {
    const targets = [];
    // 1. Original Employee
    const empId = applicantIdStr;
    if (empId) {
      targets.push({ id: empId, label: `Original Applicant (${applicantName})`, type: 'employee' });
    }
    
    // 2. All Previous Officers in the workflow
    for (let i = 0; i < app.currentStep; i++) {
      const step = app.steps[i];
      const officer = getUser(step.officerId);
      if (officer) {
        const offId = (officer._id || officer.id)?.toString();
        if (offId) {
          targets.push({ 
            id: offId, 
            label: `Officer ${i + 1} (${officer.officerRole || `${officer.firstName} ${officer.lastName}`} — ${officer.firstName})`, 
            type: 'officer' 
          });
        }
      }
    }
    // Reverse to show the most recent officer first
    return targets.reverse();
  };

  const isLastStep = app.currentStep === app.steps.length - 1;

  const handleActionClick = (decision) => {
    setPendingDecision(decision);
    setShowReviewBox(true);
    setReviewNote('');
    if (decision === 'send_back') {
      const targets = getSendBackTargets();
      // If it was sent back to this officer, they might want to send it back to applicant directly
      setSendBackTarget(targets.length > 0 ? targets[0].id : '');
    }
  };

  const handleReviewSubmit = () => {
    // Validation for mandatory remarks
    const mandatoryRemarksDecisions = ['rejected', 'hold', 'send_back'];
    if (mandatoryRemarksDecisions.includes(pendingDecision) && !reviewNote.trim()) {
      notif(`Remarks are mandatory for ${statusTxt(pendingDecision)}`, 'error');
      return;
    }

    if (pendingDecision === 'send_back') {
      if (!sendBackTarget) {
        notif('Please select a target for send back', 'error');
        return;
      }
      sendBackApplication(app.id, currentUser.id, sendBackTarget, reviewNote);
      notif('Application sent back for correction', 'info');
    } else {
      reviewApplication(app.id, currentUser.id, pendingDecision, reviewNote);
      let successMsg = '';
      if (pendingDecision === 'approved') {
        successMsg = isLastStep ? 'Application fully accepted!' : 'Application approved and forwarded!';
      } else if (pendingDecision === 'hold') {
        successMsg = 'Application put on hold';
      } else if (pendingDecision === 'unhold') {
        successMsg = 'Application taken off hold';
      } else {
        successMsg = 'Application rejected.';
      }
      notif(successMsg, (pendingDecision === 'approved' || pendingDecision === 'unhold') ? 'success' : 'warning');
    }
    
    setShowReviewBox(false);
    setReviewNote('');
    setPendingDecision(null);
    onClose(); // Close modal after action so it "vanishes" from view immediately
  };

  const handleResubmit = () => {
    resubmitApplication(app.id, currentUser.id, 'Resubmitted after correction');
    notif('Application resubmitted successfully', 'success');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this application record forever?')) {
      deleteApplication(app.id);
      notif('Application record deleted', 'info');
      onClose();
    }
  };

  return (
    <ModalWrapper onClose={onClose} full={isFull}>
      <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
        <span>{app.title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => setIsFull(!isFull)}
            title={isFull ? "Exit Full Screen" : "View in Full Screen"}
          >
            {isFull ? '📉 Small View' : '📈 Full Screen'}
          </button>
          {canDelete && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={handleDelete} title="Delete Record">
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button 
          className={`btn-tab ${activeTab === 'details' ? 'active' : ''}`} 
          onClick={() => setActiveTab('details')}
          style={{ 
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'details' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'details' ? 'var(--accent)' : 'var(--muted)',
            fontWeight: activeTab === 'details' ? '700' : '500',
            fontSize: 13
          }}
        >
          Details
        </button>
        <button 
          className={`btn-tab ${activeTab === 'remarks' ? 'active' : ''}`} 
          onClick={() => setActiveTab('remarks')}
          style={{ 
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'remarks' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'remarks' ? 'var(--accent)' : 'var(--muted)',
            fontWeight: activeTab === 'remarks' ? '700' : '500',
            fontSize: 13
          }}
        >
          Remarks & Movement
        </button>
        <button 
          className={`btn-tab ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}
          style={{ 
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'history' ? 'var(--accent)' : 'var(--muted)',
            fontWeight: activeTab === 'history' ? '700' : '500',
            fontSize: 13
          }}
        >
          Timeline
        </button>
      </div>

      {activeTab === 'details' ? (
        <>
          {/* Main Content Area */}
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
              <span className={`badge ${badgeCls(app.status)}`}>{statusTxt(app.status)}</span>
              {dept && <span className="chip">{dept.name}</span>}
              <span className="chip">Submitted: {app.submittedAt}</span>
            </div>

            <div style={{ backgroundColor: 'var(--surface2)', padding: 14, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{app.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Applicant</div>
                <p style={{ fontSize: 13.5, fontWeight: 600 }}>{applicantName}</p>
                {!hideEmail && applicant && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{applicant.email}</p>}
              </div>
              {app.status.includes('sent_back') && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 6 }}>Action Required</div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic' }}>Sent back by {getUser(app.sentBackBy)?.firstName}</p>
                </div>
              )}
            </div>

            {app.files && app.files.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Attachments</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {app.files.map(file => {
                    const fileUrl = getFileUrl(file);

                    return (
                      <div 
                        key={file.id || file.path} 
                        style={{ 
                          padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, 
                          display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, border: '1px solid var(--border)',
                          color: 'var(--text)', fontWeight: 600
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 16 }}>📄</span>
                          <span style={{ 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            maxWidth: 150 
                          }} title={file.name}>
                            {file.name}
                          </span>
                        </span>
                        
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => setPreviewFile(file)}
                        >
                          👁️ View
                        </button>
                        <button 
                          onClick={() => downloadFile(file).catch(err => notif(err.message, 'error'))}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 10px', fontSize: 11, textDecoration: 'none' }}
                        >
                          ⬇️ Download
                        </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 12 }}>
              Workflow Progress
            </div>
            <FlowVisualizer
              workflowIds={workflowIds}
              currentStep={app.currentStep}
              steps={app.steps}
            />
          </div>

          {/* Actions section for current officer */}
          {isMyTurn && !isSentBackByMe && !hasActionsLocked && !showReviewBox && (
            <div style={{ marginTop: 20, padding: 16, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 15, color: 'var(--accent)' }}>
                {isOfficerReceivingBack ? 'Correction Received — Action Required' : 'Review Decision Needed'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {app.status === 'hold' ? (
                  <button className="btn btn-success" onClick={() => handleActionClick('unhold')} style={{ gridColumn: 'span 2' }}>
                    Unhold & Resume Process
                  </button>
                ) : (
                  <>
                    <button className="btn btn-success" onClick={() => handleActionClick('approved')}>
                      {isLastStep ? 'Accept' : (isOfficerReceivingBack ? 'Accept / Forward' : 'Approve / Forward')}
                    </button>
                    <button className="btn btn-danger" onClick={() => handleActionClick('rejected')}>
                      Reject
                    </button>
                    <button className="btn btn-ghost" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }} onClick={() => handleActionClick('hold')}>
                      Put on Hold
                    </button>
                    <button className="btn btn-ghost" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }} onClick={() => handleActionClick('send_back')}>
                      Send Back
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action section for resubmission if sent back to employee or if applicant wants to edit a sent back file */}
          {(isSentBackToMe || canEditAsApplicant) && !isOfficerReceivingBack && (
            <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#0369a1' }}>Action Required: Correction</div>
              <p style={{ fontSize: 12, color: '#0369a1', marginBottom: 15 }}>
                Please click the button below to edit your application and resubmit it after correcting the issues mentioned in the remarks.
              </p>
              <button className="btn btn-accent" style={{ width: '100%' }} onClick={() => setShowEditModal(true)}>
                ✍️ Edit Application
              </button>
            </div>
          )}

          {showEditModal && (
            <EditApplicationModal 
              appId={app.id} 
              onClose={() => {
                setShowEditModal(false);
                onClose(); // Also close detail modal as it will be updated/moved
              }} 
            />
          )}

          {showReviewBox && (
            <div style={{ marginTop: 20, padding: 18, backgroundColor: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ marginBottom: 12, fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                {pendingDecision === 'approved' ? 'Approve Application' : 
                 pendingDecision === 'rejected' ? 'Reject Application' :
                 pendingDecision === 'hold' ? 'Put on Hold' : 
                 pendingDecision === 'unhold' ? 'Unhold Application' : 'Send Back for Correction'}
              </div>

              {pendingDecision === 'send_back' && (
                <div style={{ marginBottom: 15 }}>
                  <label className="lbl">Send Back To</label>
                  <select 
                    className="sel" 
                    value={sendBackTarget} 
                    onChange={e => setSendBackTarget(e.target.value)}
                  >
                    {getSendBackTargets().map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 15 }}>
                <label className="lbl">
                  Remarks {['rejected', 'hold', 'send_back'].includes(pendingDecision) ? '(Mandatory)' : '(Optional)'}
                </label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 90 }}
                  placeholder="Enter your remarks here..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowReviewBox(false)}>
                  Cancel
                </button>
                <button
                  className={`btn ${pendingDecision === 'approved' ? 'btn-success' : 
                             pendingDecision === 'rejected' ? 'btn-danger' : 
                             pendingDecision === 'hold' ? 'btn-accent' : 'btn-accent'}`}
                  onClick={handleReviewSubmit}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'remarks' ? (
        <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
          <div className="tbl-wrap">
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Officer / User</th>
                  <th>Action</th>
                  <th>Remarks / Comments</th>
                </tr>
              </thead>
              <tbody>
                {(app.workflowHistory || []).slice().reverse().map((event, idx) => {
                  const actor = event.performedBy;
                  const target = event.performedTo;
                  return (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 11 }}>{event.timestamp}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{actor ? (actor.officerRole || `${actor.firstName} ${actor.lastName}`) : 'Unknown'}</div>
                        {target && <div style={{ fontSize: 10, color: 'var(--muted)' }}>To: {target.officerRole || target.firstName}</div>}
                      </td>
                      <td>
                        <span className={`badge ${badgeCls(event.status)}`} style={{ fontSize: 9, padding: '2px 8px' }}>
                          {event.actionType.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontStyle: 'italic', color: 'var(--text2)' }}>
                        {event.remarks || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="history-timeline">
          {(!app.workflowHistory || app.workflowHistory.length === 0) ? (
            <div className="empty" style={{ padding: '40px 0' }}>
              <div className="empty-icon">⏳</div>
              <div className="empty-txt">No history recorded yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {app.workflowHistory.slice().reverse().map((event, idx) => {
                const actor = event.performedBy;
                const target = event.performedTo;
                
                return (
                  <div key={idx} style={{ 
                    padding: 14, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className={`badge ${badgeCls(event.status)}`} style={{ fontSize: 9 }}>
                        {event.actionType.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{event.timestamp}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                      {actor ? (actor.officerRole || `${actor.firstName} ${actor.lastName}`) : 'Unknown'}
                      {target && <span style={{ fontWeight: 400, color: 'var(--muted)' }}> → {target.officerRole || `${target.firstName} ${target.lastName}`}</span>}
                    </div>
                    {event.remarks && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginTop: 8, paddingLeft: 10, borderLeft: '2px solid var(--border)' }}>
                        "{event.remarks}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, borderTop: '1px solid var(--border)', paddingTop: 15 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 12 }}>
          Step-by-Step Status
        </div>
        {app.steps.map((step, index) => {
          const officer  = getUser(step.officerId);
          const designation = officer?.officerRole || (officer ? `${officer.firstName} ${officer.lastName}` : 'Officer');
          const officerDisplayName = getDisplayName(officer, currentUser.role);
          const isNameShown = officerDisplayName !== designation;

          const badgeCss = badgeCls(step.status);
          return (
            <div key={index} className="inbox-item" style={{ cursor: 'default', marginBottom: 8, padding: '10px 14px' }}>
              <div className="ii-left">
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  Step {index + 1}: {designation}
                </div>
                {isNameShown && officer && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{officer.firstName} {officer.lastName}</div>}
                {step.note && <div style={{ fontSize: 12, fontStyle: 'italic', marginTop: 4, color: 'var(--text2)' }}>Note: {step.note}</div>}
              </div>
              <div className={`badge ${badgeCss}`}>{statusTxt(step.status)}</div>
            </div>
          );
        })}
      </div>

      {previewFile && (
        <DocumentPreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </ModalWrapper>
  );
}

// ===== CREATE DEPT ADMIN MODAL =====
export function CreateDAModal({ onClose, onSuccess }) {
  const { db, createUser } = useApp();
  const notif = useNotif();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', deptId: '',
    profileImage: '',
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

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password || !form.deptId) {
      notif('Fill all fields', 'error'); return;
    }
    try {
      await createUser({ ...form, role: 'dept_admin' });
      notif('Dept Admin created!', 'success');
      onSuccess(); onClose();
    } catch (e) { notif(e.message, 'error'); }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="modal-title">Add Department Admin</div>

      {/* Profile Picture Upload */}
      <div className="form-group">
        <label className="lbl">Profile Picture <span className="muted">(optional)</span></label>
        <label className="profile-pic-upload-wrap" htmlFor="create-da-pic">
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
          id="create-da-pic"
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
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
        <label className="lbl">Email</label>
        <input className="inp" type="email" placeholder="admin@dept.com" value={form.email}
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
      <div className="form-group">
        <label className="lbl">Department</label>
        <select className="sel" value={form.deptId}
          onChange={e => setForm(f => ({ ...f, deptId: e.target.value }))}>
          <option value="">Select...</option>
          {db.departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSubmit}>Create</button>
      </div>
    </ModalWrapper>
  );
}

// ===== CREATE DEPARTMENT MODAL =====
export function CreateDeptModal({ onClose, onSuccess }) {
  const { createDepartment } = useApp();
  const notif = useNotif();
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { notif('Enter a name', 'error'); return; }
    await createDepartment(name.trim());
    notif('Department created!', 'success');
    onSuccess(); onClose();
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="modal-title">New Department</div>
      <div className="form-group">
        <label className="lbl">Department Name</label>
        <input className="inp" placeholder="e.g. HR, Finance..." value={name}
          onChange={e => setName(e.target.value)} />
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSubmit}>Create</button>
      </div>
    </ModalWrapper>
  );
}

// ===== CREATE EMPLOYEE MODAL =====
export function CreateEmployeeModal({ deptId, onClose, onSuccess }) {
  const { createUser } = useApp();
  const notif = useNotif();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    profileImage: '',
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

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password) {
      notif('Fill all fields', 'error'); return;
    }
    try {
      await createUser({ ...form, role: 'employee', deptId });
      notif('Employee added!', 'success');
      onSuccess(); onClose();
    } catch (e) { notif(e.message, 'error'); }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="modal-title">Add Employee</div>

      {/* Profile Picture Upload */}
      <div className="form-group">
        <label className="lbl">Profile Picture <span className="muted">(optional)</span></label>
        <label className="profile-pic-upload-wrap" htmlFor="create-emp-pic">
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
          id="create-emp-pic"
          type="file"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />
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
        <label className="lbl">Email</label>
        <input className="inp" type="email" placeholder="emp@sikkim.gov.in" value={form.email}
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
        <button className="btn btn-accent" onClick={handleSubmit}>Add</button>
      </div>
    </ModalWrapper>
  );
}
