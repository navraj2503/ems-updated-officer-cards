import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNotif } from '../components/Notification';
import { genId } from '../utils/helpers';

function NoticeModal({ notice, onClose, onSave }) {
  const [form, setForm] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    priority: notice?.priority || 'normal',
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-title">{notice ? 'Edit Notice' : 'Add New Notice'}</div>
        <div className="form-group">
          <label className="lbl">Title</label>
          <input className="inp" placeholder="Notice title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="lbl">Content</label>
          <textarea className="inp textarea" placeholder="Notice content..." value={form.content}
            style={{ minHeight: 120 }}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="lbl">Priority</label>
          <select className="sel" value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
            <option value="normal">Normal</option>
            <option value="high">High / Important</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleSave}>
            {notice ? 'Save Changes' : 'Publish Notice'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const { currentUser, getNotices, createNotice, updateNotice, deleteNotice } = useApp();
  const notif = useNotif();
  const notices = getNotices();

  const [editingNotice, setEditingNotice] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'dept_admin';

  const handleAdd = (formData) => {
    createNotice({ ...formData, author: currentUser.id });
    notif('Notice published!', 'success');
  };

  const handleEdit = (formData) => {
    updateNotice(editingNotice.id, formData);
    notif('Notice updated!', 'success');
    setEditingNotice(null);
  };

  const handleDelete = (id) => {
    deleteNotice(id);
    notif('Notice deleted', 'info');
    setDeleteConfirm(null);
  };

  if (!canManage) {
    return <div className="card"><div style={{ color: 'var(--muted)' }}>Access restricted.</div></div>;
  }

  return (
    <>
      <div className="card">
        <div className="card-title flex aic jsb">
          <span>📢 Notices & Circulars</span>
          <button className="btn btn-accent btn-sm" onClick={() => setShowAdd(true)}>
            + Add Notice
          </button>
        </div>

        <div className="notice-list">
          {notices.length === 0 ? (
            <div className="empty-state">
              <div className="es-icon">📋</div>
              <div className="es-text">No notices yet. Add one above.</div>
            </div>
          ) : notices.map(notice => (
            <div key={notice.id} className={`notice-card priority-${notice.priority}`}>
              <div className="notice-card-header">
                <div className="notice-title">{notice.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className={`notice-priority-${notice.priority}`}>
                    {notice.priority === 'high' ? 'Important' : 'Notice'}
                  </span>
                  <span className="notice-date">{notice.date}</span>
                </div>
              </div>
              <div className="notice-content">{notice.content}</div>
              <div className="notice-actions">
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setEditingNotice(notice)}>
                  ✏️ Edit
                </button>
                <button className="btn btn-danger btn-sm"
                  onClick={() => setDeleteConfirm(notice.id)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <NoticeModal onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}
      {editingNotice && (
        <NoticeModal notice={editingNotice} onClose={() => setEditingNotice(null)} onSave={handleEdit} />
      )}
      {deleteConfirm && (
        <div className="overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Notice?</div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
