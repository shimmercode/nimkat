/* Nimkat inline icon set — line icons, stroke 2, per SYSTEM DESIGN.pdf */
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

export const IconGift = (p) => (
  <I {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
  </I>
);
export const IconCrown = (p) => (
  <I {...p}>
    <path d="M3 8l4 5 5-8 5 8 4-5v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    <path d="M3 20h18" />
  </I>
);
export const IconHeart = (p) => (
  <I {...p}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
  </I>
);
export const IconStar = (p) => (
  <I filled {...p}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
  </I>
);
export const IconWallet = (p) => (
  <I {...p}>
    <rect x="2" y="6" width="20" height="14" rx="3" />
    <path d="M2 10h20" />
    <circle cx="17" cy="15" r="1.4" />
  </I>
);
export const IconClock = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 1.9" />
  </I>
);
export const IconCalendar = (p) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 3v4M16 3v4" />
  </I>
);
export const IconHome = (p) => (
  <I {...p}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-5h4v5" />
  </I>
);
export const IconChat = (p) => (
  <I {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </I>
);
export const IconBell = (p) => (
  <I {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </I>
);
export const IconUsers = (p) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.6" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16.5 4.7a3.6 3.6 0 0 1 0 6.7M21.5 20a6.5 6.5 0 0 0-4-6" />
  </I>
);
export const IconUser = (p) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1.5A5.5 5.5 0 0 1 9.5 14h5a5.5 5.5 0 0 1 5.5 5.5V21" />
  </I>
);
export const IconSearch = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.2" y2="16.2" />
  </I>
);
export const IconCoins = (p) => (
  <I {...p}>
    <circle cx="9" cy="9" r="6" />
    <path d="M15.5 5.4a6 6 0 1 1-9.6 7" />
    <path d="M9 6.5v5M7.2 8h3M7.2 10h3" strokeWidth="1.7" />
  </I>
);
export const IconGlobe = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M12 3a14.5 14.5 0 0 1 3.8 9A14.5 14.5 0 0 1 12 21a14.5 14.5 0 0 1-3.8-9A14.5 14.5 0 0 1 12 3z" />
  </I>
);
export const IconHeadset = (p) => (
  <I {...p}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <rect x="3" y="13" width="4" height="7" rx="2" />
    <rect x="17" y="13" width="4" height="7" rx="2" />
    <path d="M20 19a3 3 0 0 1-3 3h-3" />
  </I>
);
export const IconLock = (p) => (
  <I {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </I>
);
export const IconBulb = (p) => (
  <I {...p}>
    <path d="M9 18h6" />
    <path d="M10 21.5h4" />
    <path d="M12 2.5a6.8 6.8 0 0 0-4 12.3c.6.5 1 1.3 1 2.2h6c0-.9.4-1.7 1-2.2a6.8 6.8 0 0 0-4-12.3z" />
  </I>
);
export const IconSend = (p) => (
  <I {...p}>
    <path d="M21.5 3.5L2.5 10.2l7 2.8 2.8 7L21.5 3.5z" />
    <path d="M9.5 13L21.5 3.5" />
  </I>
);
export const IconFile = (p) => (
  <I {...p}>
    <path d="M13 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L13 2.5z" />
    <path d="M13 2.5v6h6" />
    <path d="M9 13h6M9 17h4" />
  </I>
);
export const IconShield = (p) => (
  <I {...p}>
    <path d="M12 2.5l8 3v6c0 5-3.4 8.7-8 10.2C7.4 20.2 4 16.5 4 11.5v-6l8-3z" />
    <path d="M8.8 11.8l2.3 2.3 4.2-4.4" />
  </I>
);
export const IconPhone = (p) => (
  <I {...p}>
    <path d="M21 16.9v2.6a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h2.6a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L6.8 9.4a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
  </I>
);
export const IconMapPin = (p) => (
  <I {...p}>
    <path d="M20 10.5c0 6-8 11.5-8 11.5S4 16.5 4 10.5a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10.2" r="2.8" />
  </I>
);
export const IconVideo = (p) => (
  <I {...p}>
    <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
    <path d="M15.5 10.5l6-3.5v10l-6-3.5" />
  </I>
);
export const IconBook = (p) => (
  <I {...p}>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17z" />
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
  </I>
);
export const IconMedal = (p) => (
  <I {...p}>
    <circle cx="12" cy="9.5" r="6" />
    <path d="M8.5 14.5L7 22.5l5-3 5 3-1.5-8" />
  </I>
);
export const IconReceipt = (p) => (
  <I {...p}>
    <path d="M5 2.5h14v19l-2.3-1.6-2.3 1.6-2.4-1.6-2.3 1.6L7.3 20 5 21.5v-19z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </I>
);
export const IconUserPlus = (p) => (
  <I {...p}>
    <circle cx="9.5" cy="8" r="3.6" />
    <path d="M2.5 20a6.6 6.6 0 0 1 12.2-3.5" />
    <path d="M18.5 13.5v6M15.5 16.5h6" />
  </I>
);
export const IconBench = (p) => (
  <I {...p}>
    <path d="M3 13h18" />
    <path d="M4.5 13v-2.2A2.3 2.3 0 0 1 6.8 8.5h10.4a2.3 2.3 0 0 1 2.3 2.3V13" />
    <path d="M5 13v5M19 13v5M3 16.5h18" />
  </I>
);
export const IconCap = (p) => (
  <I {...p}>
    <path d="M12 4L2 9l10 5 10-5-10-5z" />
    <path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5" />
    <path d="M22 9v5" />
  </I>
);

/* extra utility icons */
export const IconCheck = (p) => (
  <I {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </I>
);
export const IconX = (p) => (
  <I {...p}>
    <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
  </I>
);
export const IconPlus = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IconMinus = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
);
export const IconArrowLeft = (p) => (
  <I {...p}>
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </I>
);
export const IconArrowRight = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </I>
);
export const IconChevronDown = (p) => (
  <I {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </I>
);
export const IconChevronLeft = (p) => (
  <I {...p}>
    <path d="M14.5 6l-6 6 6 6" />
  </I>
);
export const IconChevronRight = (p) => (
  <I {...p}>
    <path d="M9.5 6l6 6-6 6" />
  </I>
);
export const IconInfo = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
  </I>
);
export const IconFilter = (p) => (
  <I {...p}>
    <path d="M3.5 5.5h17l-6.7 7.8v5.4l-3.6 2v-7.4L3.5 5.5z" />
  </I>
);
export const IconDownload = (p) => (
  <I {...p}>
    <path d="M12 3.5v11" />
    <path d="M7.5 10.5L12 15l4.5-4.5" />
    <path d="M4 19.5h16" />
  </I>
);
export const IconUpload = (p) => (
  <I {...p}>
    <path d="M12 15.5v-11" />
    <path d="M7.5 8.5L12 4l4.5 4.5" />
    <path d="M4 19.5h16" />
  </I>
);
export const IconEdit = (p) => (
  <I {...p}>
    <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" />
    <path d="M13.5 6.5l4 4" />
  </I>
);
export const IconLogout = (p) => (
  <I {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 7l5 5-5 5M21 12H9" />
  </I>
);
export const IconTarget = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </I>
);
export const IconSparkle = (p) => (
  <I {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" />
  </I>
);
export const IconWifi = (p) => (
  <I {...p}>
    <path d="M2.5 9a14.5 14.5 0 0 1 19 0" />
    <path d="M5.5 12.5a10 10 0 0 1 13 0" />
    <path d="M8.5 16a5.5 5.5 0 0 1 7 0" />
    <circle cx="12" cy="19.3" r="1" fill="currentColor" stroke="none" />
  </I>
);
export const IconMic = (p) => (
  <I {...p}>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
    <path d="M12 17.5v3.5" />
  </I>
);
export const IconCamera = (p) => (
  <I {...p}>
    <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
    <path d="M8 7l1.5-3h5L16 7" />
    <circle cx="12" cy="13.5" r="3.4" />
  </I>
);
export const IconRefresh = (p) => (
  <I {...p}>
    <path d="M21 4v6h-6" />
    <path d="M19.5 14a8 8 0 1 1-2-8.4L21 9" />
  </I>
);
export const IconTag = (p) => (
  <I {...p}>
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2.5 12.5V3.5h9l9.1 9.1a2 2 0 0 1 0 .8z" />
    <circle cx="7.5" cy="8" r="1.2" />
  </I>
);
export const IconTicket = (p) => (
  <I {...p}>
    <path d="M3 8.5a2.5 2.5 0 0 0 0 7V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3.5a2.5 2.5 0 0 1 0-7V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3.5z" />
    <path d="M13 5v2M13 11v2M13 17v2" />
  </I>
);
export const IconChart = (p) => (
  <I {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
  </I>
);
export const IconLink = (p) => (
  <I {...p}>
    <path d="M10 14a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1" />
    <path d="M14 10a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.1" />
  </I>
);
export const IconDots = (p) => (
  <I {...p}>
    <circle cx="5.5" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
  </I>
);
export const IconFlag = (p) => (
  <I {...p}>
    <path d="M5 21V4" />
    <path d="M5 4.5c3.5-2 7 2 10.5 0S21 3 21 3v10s-2 1.5-5.5.5S8 9.5 5 11.5" />
  </I>
);
export const IconClip = (p) => (
  <I {...p}>
    <path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8L9.8 17.3a1.8 1.8 0 0 1-2.5-2.5l7.8-7.8" />
  </I>
);
export const IconPlay = (p) => (
  <I {...p}>
    <path d="M7 4.5v15l12-7.5-12-7.5z" />
  </I>
);
export const IconGrid = (p) => (
  <I {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </I>
);
export const IconSun = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" />
  </I>
);
