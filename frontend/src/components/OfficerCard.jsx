import React from 'react';

// ===== OFFICER CARD COMPONENT =====
// Displays a single officer's profile picture, name, and designation.
// DO NOT modify existing files — this is an additive-only component.

export default function OfficerCard({ name, designation, profileImage, department }) {
  return (
    <div className="officer-card">
      <div className="officer-card-avatar-wrap">
        {profileImage ? (
          <img
            src={profileImage}
            alt={name}
            className="officer-card-photo"
          />
        ) : (
          <div className="officer-card-avatar-default">
            {name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'}
          </div>
        )}
      </div>
      <div className="officer-card-info">
        <div className="officer-card-name">{name || 'Unknown Officer'}</div>
        {designation && (
          <div className="officer-card-designation">{designation}</div>
        )}
        {department && (
          <div className="officer-card-dept">{department}</div>
        )}
      </div>
    </div>
  );
}
