/* extra icons used by panel pages */
const I = ({ children, size = 20, filled = false, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke={filled ? 'none' : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconHome = (p) => (
  <I {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </I>
);
export const IconChatPlaceholder = (p) => (
  <I {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" />
  </I>
);
export const IconWallet = (p) => (
  <I {...p}>
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
  </I>
);
export const IconFile = (p) => (
  <I {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </I>
);
export const IconCap2 = (p) => (
  <I {...p}>
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
  </I>
);
export const IconClub = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10" />
    <path d="M14.8 9.2a3.4 3.4 0 1 0 0 5.6" />
  </I>
);
export const IconExit = (p) => (
  <I {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </I>
);
export const IconCalendar = (p) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </I>
);
export const IconVideo = (p) => (
  <I {...p}>
    <rect x="2" y="6" width="14" height="12" rx="3" />
    <path d="M16 10.5 22 7v10l-6-3.5" />
  </I>
);
export const IconMic = (p) => (
  <I {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <path d="M12 18v4" />
  </I>
);
export const IconWifi = (p) => (
  <I {...p}>
    <path d="M2 8.5a15 15 0 0 1 20 0" />
    <path d="M5.5 12a10 10 0 0 1 13 0" />
    <path d="M9 15.5a5 5 0 0 1 6 0" />
    <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
  </I>
);
export const IconGift = (p) => (
  <I {...p}>
    <rect x="3" y="8" width="18" height="4" />
    <path d="M5 12v9h14v-9" />
    <path d="M12 8v13" />
    <path d="M12 8s-1.5-5-4.5-5S4 8 12 8zM12 8s1.5-5 4.5-5S20 8 12 8z" />
  </I>
);
export const IconSend2 = (p) => (
  <I {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </I>
);
export const IconPin2 = (p) => (
  <I {...p}>
    <path d="M12 17v5" />
    <path d="M8 3h8l-1 7 3 3H6l3-3z" />
  </I>
);
export const IconLock2 = (p) => (
  <I {...p}>
    <rect x="4" y="10" width="16" height="11" rx="3" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </I>
);
