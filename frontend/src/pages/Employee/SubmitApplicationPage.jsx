import React, { useState } from 'react';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { useNotif } from '../../components/Notification';
import { FlowVisualizer, EmptyState } from '../../components/SharedComponents';
import { DocumentPreviewModal } from '../../components/Modals';

// ===== SUBMIT APPLICATION PAGE =====
// Employee view: form to submit a new application.
// Shows a preview of the workflow the application will go through.

export default function SubmitApplicationPage({ onNavigate }) {
  const { currentUser, db, submitApplication } = useApp();
  const notif = useNotif();

  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [appType, setAppType]   = useState('');
  const [customType, setCustomType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const APP_TYPES = [
    { category: 'LEAVE APPLICATIONS', types: ['Casual Leave', 'Earned Leave', 'Medical Leave', 'Maternity Leave', 'Paternity Leave', 'Child Care Leave', 'Study Leave', 'Emergency Leave', 'Half-Day Leave', 'Special Leave', 'Leave Extension Request'] },
    { category: 'ATTENDANCE & DUTY', types: ['Attendance Regularization', 'Late Arrival Explanation', 'Early Departure Permission', 'Overtime Approval', 'Compensatory Leave', 'Duty Change Request', 'Shift Change Request'] },
    { category: 'TRAVEL & TOUR', types: ['Official Tour Approval', 'Travel Allowance Claim', 'Daily Allowance Claim', 'Vehicle Requirement Request', 'Accommodation Request', 'Travel Advance Request'] },
    { category: 'TRANSFER & POSTING', types: ['Transfer Request', 'Change of Posting', 'Inter Department Transfer', 'Deputation Request', 'Temporary Attachment Request'] },
    { category: 'FINANCIAL REQUESTS', types: ['Salary Advance', 'Medical Reimbursement', 'Travel Reimbursement', 'Internet Reimbursement', 'Telephone Reimbursement', 'Allowance Request', 'Loan Application'] },
    { category: 'ASSET & EQUIPMENT REQUESTS', types: ['Laptop Request', 'Desktop Request', 'Printer Request', 'Official Mobile Request', 'Software Access Request', 'Internet Access Request', 'Asset Repair Request', 'Asset Replacement Request', 'Stationery Request'] },
    { category: 'TRAINING & DEVELOPMENT', types: ['Training Program Request', 'Workshop Participation', 'Seminar Participation', 'Conference Approval', 'Certification Program Request'] },
    { category: 'HR & ADMINISTRATIVE REQUESTS', types: ['NOC Request', 'Experience Certificate', 'Service Certificate', 'Employment Verification', 'Personal Information Update', 'Bank Account Change Request', 'Nominee Update Request'] },
    { category: 'GRIEVANCES & COMPLAINTS', types: ['Workplace Grievance', 'IT Support Request', 'Infrastructure Complaint', 'Service Complaint', 'Workplace Harassment Complaint'] },
    { category: 'WORK ARRANGEMENTS', types: ['Work From Home Request', 'Flexible Working Hours Request', 'Special Permission Request'] },
    { category: 'PROCUREMENT & APPROVALS', types: ['Procurement Approval Request', 'Budget Approval Request', 'Purchase Request', 'Administrative Approval Request'] },
    { category: 'GENERAL', types: ['Other'] }
  ];

  const filteredTypes = APP_TYPES.map(cat => ({
    ...cat,
    types: cat.types.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.types.length > 0);

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

        // Upload to server immediately to get the path
        const { data } = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (data.success) {
          setAttachments(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            path: data.data.path, // Path returned by server
            preview: URL.createObjectURL(file) // For local preview
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

  // Filter out the current user if they are an officer in the workflow
  const deptId = currentUser.deptId?._id || currentUser.deptId?.id || currentUser.deptId;
  const workflow = (db.workflows[deptId] || []).filter(oid => oid !== currentUser.id && oid !== currentUser._id);

  // If no workflow is configured (or no other officers remain), show a warning
  if (workflow.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon="⚠️"
          text="No workflow configured for your department yet. Contact your Dept Admin."
        />
      </div>
    );
  }

  const handleSubmit = async () => {
    if (isUploading) {
      notif('Please wait for files to finish uploading...', 'info');
      return;
    }

    // Reset errors
    const newErrors = {};

    if (!appType) newErrors.appType = 'Please select an application type';
    if (appType === 'Other' && !customType.trim()) newErrors.customType = 'Please specify your application type';
    if (!title.trim()) newErrors.title = 'Please enter an application title';
    if (!description.trim()) newErrors.description = 'Please provide a detailed description';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notif('Please fill all required fields', 'error');
      return;
    }

    try {
      await submitApplication(
        currentUser.id, 
        currentUser.deptId, 
        title.trim(), 
        description.trim(), 
        appType,
        appType === 'Other' ? customType.trim() : null,
        attachments
      );
      notif('Application submitted!', 'success');
      onNavigate('my-apps');
    } catch (e) {
      notif(e.message, 'error');
    }
  };

  return (
    <div className="card">
      <div className="card-title">Submit New Application</div>

      {/* Application Type Dropdown */}
      <div className="form-group">
        <label className="lbl">Application Type <span style={{ color: 'var(--danger)' }}>*</span></label>
        {errors.appType && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>{errors.appType}</div>}
        <div className="custom-select-container">
          <select 
            className="inp" 
            value={appType} 
            onChange={(e) => {
              setAppType(e.target.value);
              setErrors(prev => ({ ...prev, appType: null }));
            }}
          >
            <option value="">-- Select Application Type --</option>
            {APP_TYPES.map(cat => (
              <optgroup key={cat.category} label={cat.category}>
                {cat.types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Type Field (if Other is selected) */}
      {appType === 'Other' && (
        <div className="form-group animate-fade-in">
          <label className="lbl">Specify Application Type <span style={{ color: 'var(--danger)' }}>*</span></label>
          {errors.customType && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>{errors.customType}</div>}
          <input
            className="inp"
            placeholder="Enter custom application type..."
            value={customType}
            onChange={e => {
              setCustomType(e.target.value);
              setErrors(prev => ({ ...prev, customType: null }));
            }}
          />
        </div>
      )}

      {/* Title Field */}
      <div className="form-group">
        <label className="lbl">Application Title <span style={{ color: 'var(--danger)' }}>*</span></label>
        {errors.title && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>{errors.title}</div>}
        <input
          className="inp"
          placeholder="e.g. Request for 3 days Casual Leave, Laptop for official use..."
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setErrors(prev => ({ ...prev, title: null }));
          }}
        />
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label className="lbl">Description <span style={{ color: 'var(--danger)' }}>*</span></label>
        {errors.description && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>{errors.description}</div>}
        <textarea
          className="inp"
          rows={4}
          style={{ resize: 'vertical' }}
          placeholder="Describe your request in detail..."
          value={description}
          onChange={e => {
            setDesc(e.target.value);
            setErrors(prev => ({ ...prev, description: null }));
          }}
        />
      </div>

      {/* Attachments Field */}
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
          id="file-upload" 
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip"
        />
        <label htmlFor="file-upload" className="btn btn-ghost" style={{ display: 'inline-block', cursor: 'pointer' }}>
          📎 Add Documents
        </label>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
          <strong>Supported file types:</strong><br />
          PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG, GIF, WEBP, ZIP<br />
          <strong>Maximum file size:</strong> 10 MB
        </div>
      </div>

      {/* Workflow Preview */}
      <div className="mb3">
        <div className="lbl mb2">Your application will pass through this workflow</div>
        <FlowVisualizer
          workflowIds={workflow}
          currentStep={null}
          steps={null}
        />
      </div>

      {/* Submit Button */}
      <button
        className="btn btn-accent"
        style={{ marginTop: 12 }}
        onClick={handleSubmit}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading Files...' : 'Submit Application'}
      </button>

      {previewFile && (
        <DocumentPreviewModal 
          file={previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </div>
  );
}
