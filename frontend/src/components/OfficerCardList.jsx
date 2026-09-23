import React from 'react';
import OfficerCard from './OfficerCard';

// ===== OFFICER CARD LIST COMPONENT =====
// Renders a responsive grid of OfficerCard components.
// Receives officers array (from existing state) + optional dept name.
// Additive-only: does NOT touch any existing component or page logic.

export default function OfficerCardList({ officers, deptName }) {
  if (!officers || officers.length === 0) {
    return (
      <div className="officer-cards-empty">
        <span className="officer-cards-empty-icon">🛡️</span>
        <p>No officers assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="officer-cards-grid">
      {officers.map(officer => (
        <OfficerCard
          key={officer.id}
          name={`${officer.firstName} ${officer.lastName}`}
          designation={officer.officerRole || null}
          profileImage={officer.profileImage || null}
          department={deptName || null}
        />
      ))}
    </div>
  );
}
