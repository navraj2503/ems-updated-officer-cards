import React from 'react';

const icon = (path, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

export const ICON_MAP = {
  grid:   icon(<><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></>),
  users:  icon(<><path d="M11 14v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1"/><circle cx="6.5" cy="5" r="2.5"/><path d="M14 14v-1a3 3 0 0 0-2.3-2.9M11 2a2.5 2.5 0 0 1 0 5"/></>),
  bldg:   icon(<><rect x="2" y="7" width="12" height="8" rx="1"/><path d="M5 15v-4h6v4M1 7l7-5 7 5"/></>),
  file:   icon(<><path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-4-4z"/><path d="M9 2v4h4M6 9h4M6 12h4"/></>),
  shield: icon(<><path d="M8 2L2 5v4c0 3 2.7 5.6 6 7 3.3-1.4 6-4 6-7V5L8 2z"/></>),
  flow:   icon(<><circle cx="3" cy="8" r="2"/><circle cx="13" cy="3" r="2"/><circle cx="13" cy="13" r="2"/><path d="M5 8h4l2-3M5 8h4l2 3"/></>),
  inbox:  icon(<><rect x="2" y="4" width="12" height="10" rx="1"/><path d="M2 10h3l1 2h4l1-2h3"/><path d="M6 4V2M10 4V2"/></>),
  plus:   icon(<><path d="M8 3v10M3 8h10"/></>),
  notice: icon(<><path d="M4 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H7l-3 2v-2H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M6 6h4M6 9h2"/></>),
  edit:   icon(<><path d="M11 2l3 3-8 8H3v-3l8-8z"/></>),
  trash:  icon(<><path d="M3 4h10M5 4V3h6v1M5 4l.5 9h5L11 4"/></>),
  person: icon(<><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></>),
  check:  icon(<><path d="M3 8l3 3 7-7"/></>),
  x:      icon(<><path d="M4 4l8 8M12 4l-8 8"/></>),
  clock:  icon(<><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></>),
  bell:   icon(<><path d="M12 5a4 4 0 0 0-8 0c0 4-2 5-2 5h12s-2-1-2-5"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></>),
};
