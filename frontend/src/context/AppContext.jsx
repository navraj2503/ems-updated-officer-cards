// Import React and its hooks to manage state, context, and side effects
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
// Import the pre-configured Axios instance for making API calls
import api from '../utils/api';

// Create a new Context object to share data globally across the application
const AppContext = createContext(null);

// The Provider component that wraps the entire application and manages its global state
export function AppProvider({ children }) {
  // State to store the currently logged-in user, initialized from browser localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ems_user');
    return saved ? JSON.parse(saved) : null; // Parse JSON string back to an object
  });
  
  // State to store the authentication token for API requests
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // State to control whether the landing page or the app dashboard is visible
  const [showLanding, setShowLanding] = useState(true);
  
  // Global states to store data fetched from the backend database
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [workflows, setWorkflows] = useState({}); // Maps department IDs to their officer sequence
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  
  // UI states for loading indicators and error messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // This hook runs automatically when the 'token' changes (e.g., after login)
  useEffect(() => {
    // Always fetch public announcements regardless of login status
    fetchPublicNotices();
    
    // If we have a token and user, fetch all protected data needed for the dashboard
    if (token && currentUser) {
      fetchInitialData();
    }
  }, [token]);

  // Function to fetch public notices from the backend
  const fetchPublicNotices = async () => {
    try {
      const res = await api.get('/notices'); // GET /api/notices
      setNotices(res.data.data); // Store returned array in state
    } catch (err) {
      console.error('Fetch notices error:', err);
    }
  };

  // Main function to fetch all initial data required for the logged-in user's experience
  const fetchInitialData = async () => {
    setLoading(true); // Show loading spinner
    try {
      // Determine the correct applications endpoint based on the user's role
      // Officers and admins see all department apps; employees only see their own
      const appsUrl = (currentUser.role === 'officer' || currentUser.role === 'dept_admin') 
        ? '/applications?view=department' 
        : '/applications';

      // Run multiple API calls in parallel to save time
      const [deptsRes, notifsRes, appsRes, statsRes] = await Promise.all([
        api.get('/departments'), // Fetch all departments
        api.get('/notifications'), // Fetch user's notifications
        api.get(appsUrl), // Fetch relevant applications
        api.get('/dashboard/stats'), // Fetch dashboard counts
      ]);
      
      // Update global states with the results from the backend
      const depts = deptsRes.data.data;
      setDepartments(depts);
      setNotifications(notifsRes.data.data);
      setApplications(appsRes.data.data);
      setDashboardStats(statsRes.data.data);

      // Fetch workflow steps for every single department
      const workflowPromises = depts.map(d => api.get(`/workflows/${d._id || d.id}`));
      const workflowResults = await Promise.all(workflowPromises);
      const workflowMap = {};
      
      // Build a map where keys are deptIds and values are arrays of officer IDs
      workflowResults.forEach((res, index) => {
        const deptId = depts[index]._id || depts[index].id;
        workflowMap[deptId] = res.data.data.officers.map(o => o._id || o.id || o);
      });
      setWorkflows(workflowMap);

      // Fetch all users relevant to the current user (filtered by backend)
      const usersRes = await api.get('/users');
      setUsers(usersRes.data.data);

      // Fetch password reset requests for admins
      if (currentUser.role === 'super_admin' || currentUser.role === 'dept_admin') {
        const resetRes = await api.get('/password-resets');
        setPasswordResetRequests(resetRes.data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      // Capture the error message from the backend response
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  // Function to refresh only the dashboard statistics (counts)
  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats'); // GET /api/dashboard/stats
      setDashboardStats(res.data.data); // Update state with fresh counts
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  // Function to fetch a fresh captcha from the backend
  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/auth/captcha');
      return res.data.data; // { svg, captchaToken }
    } catch (err) {
      console.error('Fetch captcha error:', err);
      return null;
    }
  };

  // Function to authenticate a user and start a session
  const login = async (email, password, captchaValue, captchaToken) => {
    try {
      const res = await api.post('/auth/login', { 
        email, 
        password, 
        captchaValue, 
        captchaToken 
      }); // POST /api/auth/login
      const { token, user } = res.data; // Destructure response
      
      // Save token and user in state and browser storage for persistence
      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('ems_user', JSON.stringify(user));
      setShowLanding(false); // Hide landing page
      return { success: true }; 
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Function to end the current user session and clear all data
  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    // Remove session data from browser storage
    localStorage.removeItem('token');
    localStorage.removeItem('ems_user');
    setShowLanding(true); // Show landing page again
    // Clear all global data from state
    setDepartments([]);
    setUsers([]);
    setApplications([]);
    setNotices([]);
    setNotifications([]);
    setWorkflows({});
  };

  // UI Navigation helpers
  const goToLogin = () => setShowLanding(false);
  const goToLanding = () => setShowLanding(true);

  // Data retrieval helpers used by components to find specific items in the global state
  const getDept    = (id)     => departments.find(d => d._id === id || d.id === id);
  const getUser    = (idOrObj) => {
    if (!idOrObj) return null;
    const id = (typeof idOrObj === 'object') ? (idOrObj._id || idOrObj.id) : idOrObj;
    const found = users.find(u => u._id === id || u.id === id);
    if (found) return found;
    // Fallback: if user is already populated in the object, return it
    if (typeof idOrObj === 'object' && (idOrObj.firstName || idOrObj.officerRole || idOrObj.role)) {
      return idOrObj;
    }
    return null;
  };
  const getDA      = (deptId) => users.find(u => u.role === 'dept_admin' && (u.deptId === deptId || u.deptId?._id === deptId || u.deptId?.id === deptId));
  const getOffs    = (deptId) => users.filter(u => u.role === 'officer'  && (u.deptId === deptId || u.deptId?._id === deptId || u.deptId?.id === deptId));
  const getEmps    = (deptId) => users.filter(u => u.role === 'employee' && (u.deptId === deptId || u.deptId?._id === deptId || u.deptId?.id === deptId));
  const getApps    = (filterFn) => applications.filter(filterFn);
  const getNotices = () => [...notices].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Function to create a new user (Admin only)
  const createUser = async (userData) => {
    try {
      const res = await api.post('/users', userData); // POST /api/users
      setUsers(prev => [...prev, res.data.data]); // Append new user to current list
      return res.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create user');
    }
  };

  // Function to remove a user (Admin only)
  const removeUser = async (uid) => {
    try {
      await api.delete(`/users/${uid}`); // DELETE /api/users/:id
      setUsers(prev => prev.filter(u => u._id !== uid && u.id !== uid)); // Remove from local state
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user');
    }
  };

  // Function to update user details
  const updateUser = async (uid, updates) => {
    try {
      const res = await api.put(`/users/${uid}`, updates); // PUT /api/users/:id
      const updatedUser = res.data.data;

      // Update the user in the local users list
      setUsers(prev => prev.map(u => (u._id === uid || u.id === uid) ? updatedUser : u));
      
      // If the updated user is the current logged-in user, update their session data
      if ((currentUser._id || currentUser.id) === uid) {
        setCurrentUser(updatedUser);
        localStorage.setItem('ems_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  // Function to specifically update an officer's designation
  const updateOfficerRole = async (userId, officerRole) => {
    return updateUser(userId, { officerRole });
  };

  // Function to create a new department (Super Admin only)
  const createDepartment = async (name) => {
    try {
      const res = await api.post('/departments', { name }); // POST /api/departments
      const newDept = res.data.data;
      setDepartments(prev => [...prev, newDept]); // Add to list
      // Initialize an empty workflow for this new department
      setWorkflows(prev => ({ ...prev, [newDept._id || newDept.id]: [] }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create department');
    }
  };

  // Function to update a department's name
  const updateDepartment = async (deptId, name) => {
    try {
      const res = await api.put(`/departments/${deptId}`, { name }); // PUT /api/departments/:id
      setDepartments(prev => prev.map(d => (d._id === deptId || d.id === deptId) ? res.data.data : d));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update department');
    }
  };

  // Function to delete a department
  const deleteDepartment = async (deptId) => {
    try {
      await api.delete(`/departments/${deptId}`); // DELETE /api/departments/:id
      setDepartments(prev => prev.filter(d => d._id !== deptId && d.id !== deptId));
      fetchInitialData(); // Refresh all data because users and apps are linked to departments
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete department');
    }
  };

  // Function to save the officer sequence for a department workflow
  const saveWorkflow = async (deptId, officerIds) => {
    try {
      await api.post('/workflows', { deptId, officers: officerIds }); // POST /api/workflows
      setWorkflows(prev => ({ ...prev, [deptId]: officerIds })); // Update local state
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save workflow');
    }
  };

  // Function to create and formally submit a new application
  const submitApplication = async (applicantId, deptId, title, description, applicationType, customApplicationType, attachments = []) => {
    try {
      // Step 1: Create a draft version of the application
      // Ensure attachments is an array and sanitized correctly
      const sanitizedFiles = Array.isArray(attachments) 
        ? attachments.map(a => ({
            name: a.name || 'Untitled',
            path: a.path || '',
            type: a.type || 'application/octet-stream'
          }))
        : [];

      const res = await api.post('/applications', { 
        title, 
        description, 
        applicationType,
        customApplicationType,
        files: sanitizedFiles 
      });
      const app = res.data.data;
      // Step 2: Formally submit the application to start the workflow
      const submitRes = await api.put(`/applications/${app._id || app.id}/submit`);
      setApplications(prev => [...prev, submitRes.data.data]); // Add to local list
      fetchStats(); // Update dashboard counts immediately
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to submit application');
    }
  };

  // Function for officers to approve, reject, or hold an application
  const reviewApplication = async (appId, officerId, decision, note = '', targetId = null) => {
    try {
      const payload = { action: decision, note };
      if (targetId) payload.targetId = targetId; // Required for 'sent_back' actions
      const res = await api.put(`/applications/${appId || appId.id}/process`, payload); // PUT /api/applications/:id/process
      // Update the application in the local list with its new status/step
      setApplications(prev => prev.map(app => (app._id === appId || app.id === appId) ? res.data.data : app));
      fetchStats(); // Update dashboard counts immediately
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process application');
    }
  };

  // Function to return an application for corrections
  const sendBackApplication = async (appId, officerId, sendBackToId, remarks) => {
    return reviewApplication(appId, officerId, 'sent_back', remarks, sendBackToId);
  };

  // Function for employees to resubmit an application after making requested corrections
  const resubmitApplication = async (appId, title, description, attachments = [], remarks = '') => {
    try {
      // Ensure attachments is an array and sanitized correctly
      const sanitizedFiles = Array.isArray(attachments)
        ? attachments.map(a => ({
            name: a.name || 'Untitled',
            path: a.path || '',
            type: a.type || 'application/octet-stream'
          }))
        : [];

      const updates = { 
        title, 
        description, 
        status: 'submitted', // Setting status to 'submitted' triggers resubmission logic on backend
        note: remarks,
        files: sanitizedFiles
      };
      
      const res = await api.put(`/applications/${appId}`, updates); // PUT /api/applications/:id
      // Update local application state
      setApplications(prev => prev.map(app => (app._id === appId || app.id === appId) ? res.data.data : app));
      
      // Refresh both notifications and stats as resubmission affects both
      const [notifsRes] = await Promise.all([
        api.get('/notifications'),
        fetchStats()
      ]);
      setNotifications(notifsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resubmit application');
    }
  };

  // Function to edit the content of a draft or returned application
  const updateApplicationContent = async (appId, title, description, attachments = null) => {
    try {
      const updates = { title, description };
      if (attachments) {
        updates.files = Array.isArray(attachments)
          ? attachments.map(a => ({
              name: a.name || 'Untitled',
              path: a.path || '',
              type: a.type || 'application/octet-stream'
            }))
          : [];
      }
      const res = await api.put(`/applications/${appId || appId.id}`, updates);
      setApplications(prev => prev.map(app => (app._id === appId || app.id === appId) ? res.data.data : app));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update application');
    }
  };

  // Function to permanently delete an application
  const deleteApplication = async (appId) => {
    try {
      await api.delete(`/applications/${appId || appId.id}`); // DELETE /api/applications/:id
      setApplications(prev => prev.filter(app => app._id !== appId && app.id !== appId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete application');
    }
  };

  // Password reset request functions
  const requestPasswordReset = async (name, email) => {
    try {
      const res = await api.post('/password-resets', { name, email });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to submit reset request');
    }
  };

  const fetchResetRequests = async () => {
    try {
      const res = await api.get('/password-resets');
      setPasswordResetRequests(res.data.data);
    } catch (err) {
      console.error('Fetch reset requests error:', err);
    }
  };

  const updateResetRequestStatus = async (requestId, status, remarks, newPassword = null) => {
    try {
      const res = await api.put(`/password-resets/${requestId}`, { status, remarks, newPassword });
      setPasswordResetRequests(prev => prev.map(r => (r._id === requestId || r.id === requestId) ? res.data.data : r));
      
      // If completed, refresh users to ensure password change is reflected if needed
      if (status === 'completed') {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data.data);
      }
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update reset request');
    }
  };

  // Notice/Announcement management functions
  const createNotice = async (noticeData) => {
    try {
      const res = await api.post('/notices', noticeData);
      setNotices(prev => [...prev, res.data.data]);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create notice');
    }
  };

  const updateNotice = async (noticeId, updates) => {
    try {
      const res = await api.put(`/notices/${noticeId || noticeId.id}`, updates);
      setNotices(prev => prev.map(n => (n._id === noticeId || n.id === noticeId) ? res.data.data : n));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update notice');
    }
  };

  const deleteNotice = async (noticeId) => {
    try {
      await api.delete(`/notices/${noticeId || noticeId.id}`);
      setNotices(prev => prev.filter(n => n._id !== noticeId && n.id !== noticeId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete notice');
    }
  };

  // Notification management functions
  const markNotifRead = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId || notifId.id}/read`); // PUT /api/notifications/:id/read
      // Mark as read in local state immediately for better UX
      setNotifications(prev => prev.map(n => (n._id === notifId || n.id === notifId) ? { ...n, isRead: true, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  // Clear notifications from local state for current session
  const clearNotifications = async (userId) => {
    setNotifications(prev => prev.filter(n => n.userId !== userId));
  };

  // Admin function to manually reset a user's password
  const adminResetPassword = async (userId, newPassword) => {
    return updateUser(userId, { password: newPassword });
  };

  // Local helper to resolve a reset request in state
  const resolveResetRequest = (requestId) => {
    setPasswordResetRequests(prev => prev.filter(r => r._id !== requestId && r.id !== requestId));
  };

  // Group all data into a single 'db' object for easy access in some components
  const db = {
    departments,
    users,
    applications,
    notices,
    workflows
  };

  // Define the set of values and functions that will be accessible to all components
  const value = {
    currentUser, showLanding, db, departments, users, applications, notices, notifications, dashboardStats, passwordResetRequests, loading, error,
    login, logout, goToLogin, goToLanding,
    getDept, getUser, getDA, getOffs, getEmps, getApps, getNotices,
    createUser, removeUser, updateUser, updateOfficerRole,
    createDepartment, updateDepartment, deleteDepartment,
    saveWorkflow, submitApplication, reviewApplication, sendBackApplication, resubmitApplication, updateApplicationContent, deleteApplication,
    createNotice, updateNotice, deleteNotice,
    requestPasswordReset, fetchResetRequests, updateResetRequestStatus, adminResetPassword, resolveResetRequest,
    clearNotifications, markNotifRead,
    fetchInitialData, fetchStats, fetchCaptcha
  };

  // Return the Provider component with the context values and the children it wraps
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to allow components to easily consume the AppContext
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
