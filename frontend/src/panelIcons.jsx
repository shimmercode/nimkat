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
export const IconBell = (p) => (
  <I {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </I>
);
export const IconDownload = (p) => (
  <I {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </I>
);
export const IconCoin = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v9" />
    <path d="M14.8 9.3a3.4 3.4 0 1 0 0 5.4" />
  </I>
);
export const IconMedal = (p) => (
  <I {...p}>
    <circle cx="12" cy="9" r="6" />
    <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
    <path d="M12 6.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 8.8l2-.3z" fill="currentColor" stroke="none" />
  </I>
);
export const IconHeart2 = (p) => (
  <I {...p}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </I>
);
export const IconTarget = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </I>
);
export const IconTrend = (p) => (
  <I {...p}>
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="15 7 21 7 21 13" />
  </I>
);

/* Re-export common glyphs so panel files can import everything from here */
export {
  IconBench, IconSearch, IconUsers, IconBook, IconHeadset, IconUser,
  IconStar, IconBulb, IconClock, IconCrown,
} from './components/icons.jsx';
