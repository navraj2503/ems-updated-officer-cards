// ===== UTILITY FUNCTIONS =====

// Helper function to generate a random alphanumeric ID with a custom prefix
export function genId(prefix) {
  // Combining the prefix with a random string generated from Math.random
  return prefix + Math.random().toString(36).substr(2, 6);
}

// Helper function to get a human-readable label for user roles
export function roleLbl(role) {
  // Mapping of role slugs to readable names
  const map = {
    super_admin: 'Super Admin',
    dept_admin:  'Dept Admin',
    officer:     'Officer',
    employee:    'Employee',
  };
  // Returning the mapped name or the original slug if not found
  return map[role] || role;
}

// Helper function to get a CSS class name based on the user's role for color coding
export function roleCls(role) {
  // Mapping of role slugs to CSS classes
  const map = {
    super_admin: 'r-super',
    dept_admin:  'r-da',
    officer:     'r-off',
    employee:    'r-emp',
  };
  // Returning the mapped class or an empty string if not found
  return map[role] || '';
}

// Helper function to get the appropriate CSS badge class for a given application status
export function badgeCls(status) {
  // Mapping of status slugs to badge CSS classes
  const map = {
    pending:               'b-pending',
    forwarded:             'b-prog',
    in_progress:           'b-prog',
    completed:             'b-done',
    approved:              'b-done',
    rejected:              'b-reject',
    hold:                  'b-hold',
    unhold:                'b-prog',
    sent_back_to_officer:  'b-sentback',
    sent_back_to_employee: 'b-sentback',
    resubmitted:           'b-resubmitted',
  };
  // Defaulting to 'b-pending' if status is unknown
  return map[status] || 'b-pending';
}

// Helper function to get the human-readable display text for an application status
export function statusTxt(status) {
  // Mapping of status slugs to readable labels
  const map = {
    pending:               'Pending',
    forwarded:             'Forwarded',
    in_progress:           'In Progress',
    completed:             'Approved',
    approved:              'Approved',
    rejected:              'Rejected',
    hold:                  'On Hold',
    unhold:                'Taken Off Hold',
    sent_back_to_officer:  'Sent Back to Officer',
    sent_back_to_employee: 'Sent Back to Employee',
    resubmitted:           'Resubmitted',
  };
  // Returning the mapped text or the original status if not found
  return map[status] || status;
}

// Helper function to determine if an application is currently active/in-progress
export function isStatusInProgress(status) {
  // Checking if the status is one of the active workflow stages
  return ['pending', 'forwarded', 'in_progress', 'hold', 'sent_back_to_officer', 'sent_back_to_employee', 'resubmitted'].includes(status);
}

// Helper function to determine if an application has been officially approved
export function isStatusApproved(status) {
  // Checking if the status is one of the final approval stages
  return ['completed', 'approved'].includes(status);
}

// Helper function to determine if an application has been officially rejected
export function isStatusRejected(status) {
  // Checking if the status matches 'rejected'
  return status === 'rejected';
}

import api from './api';

// Helper function to construct the full URL for a file attachment
export function getFileUrl(file) {
  if (!file) return '';
  // If it's a local preview (Base64 or Blob URL), return it as is
  if (file.data || file.preview) return file.data || file.preview;
  
  // Construct the base URL for static files (removes /api from the end if present)
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const baseUrl = base.replace(/\/api$/, '');
  
  // Ensure the path is relative and clean
  let filePath = file.path || '';
  
  // If the path is absolute (contains a drive letter like D:\ or C:\), 
  // try to extract just the uploads/filename part
  if (filePath.includes(':\\') || filePath.includes(':/')) {
    const parts = filePath.split(/[\\\/]uploads[\\\/]/);
    if (parts.length > 1) {
      filePath = 'uploads/' + parts[1];
    }
  }
  
  // Replace backslashes with forward slashes for URL compatibility
  const cleanPath = filePath.replace(/\\/g, '/');
  
  // Return the full URL, ensuring no double slashes
  return `${baseUrl.replace(/\/$/, '')}/${cleanPath.replace(/^\//, '')}`;
}

// Helper function to trigger a real file download via the backend download API
export async function downloadFile(file) {
  if (!file || !file.path) return;

  try {
    // Extract the filename from the path (e.g., 'uploads/file-123.pdf' -> 'file-123.pdf')
    const filename = file.path.split(/[\\\/]/).pop();
    
    // Call the dedicated download endpoint with the original name as a query param
    const res = await api.get(`/uploads/download/${filename}`, {
      params: { name: file.name },
      responseType: 'blob' // CRITICAL: Treat the response as a binary file
    });

    // Create a temporary object URL for the blob
    const url = window.URL.createObjectURL(new Blob([res.data]));
    
    // Create a hidden anchor element to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name || filename); // Use original name
    document.body.appendChild(link);
    
    // Programmatically click the link
    link.click();
    
    // Cleanup: remove the element and revoke the object URL
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download failed:', err);
    throw new Error('Could not download file. Please try again.');
  }
}

// Helper function to get the current date and time as a formatted string
export function nowStr() {
  const now = new Date();
  // Getting the YYYY-MM-DD part of the ISO string
  const date = now.toISOString().split('T')[0];
  // Getting the HH:MM part of the localized time string
  const time = now.toTimeString().split(' ')[0].substring(0, 5);
  // Combining date and time for a readable timestamp
  return `${date} ${time}`;
}

// Helper function to get today's date as a formatted string
export function todayStr() {
  // Returning the YYYY-MM-DD part of the ISO string
  return new Date().toISOString().split('T')[0];
}

/** 
 * Returns the appropriate display name for a user based on the viewer's role.
 * If the user is an officer and the viewer is an officer, returns their designation.
 * Otherwise returns their full name.
 */
export function getDisplayName(user, viewerRole) {
  // Return a placeholder if no user data is provided
  if (!user) return '—';
  // Checking if the user being displayed is an officer
  const isOfficer = user.role === 'officer';

  // If they are an officer, prioritize showing their designation/title
  if (isOfficer) {
    return user.officerRole || `${user.firstName} ${user.lastName}`;
  }
  // Otherwise, return their standard full name
  return `${user.firstName} ${user.lastName}`;
}
