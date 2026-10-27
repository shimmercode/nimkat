# Phase 10 — Multi-Viewport Screenshot Index (`SCREENSHOT_INDEX.md`)

**Directory:** `/home/user/nimkat/audit-reports/screenshots/`  
**Browser Engine:** Real Headless Chromium `153.0.8010.0` (`@sparticuz/chromium@153.0.0`)  
**Total Captures:** `78` multi-viewport route captures (`375×812`, `768×1024`, `1440×900`) + `10` E2E flow captures (`b1`–`b7`) = `88` PNG files  

---

## 1. Multi-Viewport Route Matrix (`375×812` Mobile, `768×1024` Tablet, `1440×900` Desktop)

| # | Route | Role | Mobile (`375×812`) | Tablet (`768×1024`) | Desktop (`1440×900`) | Overflow (`px`) | Status |
|---|---|---|---|---|---|---|---|
| 1 | `/` | Public | `home-mobile-375x812.png` | `home-tablet-768x1024.png` | `home-desktop-1440x900.png` | `0` | `PASS` |
| 2 | `/classes` | Public | `classes-mobile-375x812.png` | `classes-tablet-768x1024.png` | `classes-desktop-1440x900.png` | `0` | `PASS` |
| 3 | `/classes/1` | Public | `class-detail-mobile-375x812.png` | `class-detail-tablet-768x1024.png` | `class-detail-desktop-1440x900.png` | `0` | `PASS` |
| 4 | `/teachers/1` | Public | `teacher-profile-mobile-375x812.png` | `teacher-profile-tablet-768x1024.png` | `teacher-profile-desktop-1440x900.png` | `0` | `PASS` |
| 5 | `/club` | Public | `club-public-mobile-375x812.png` | `club-public-tablet-768x1024.png` | `club-public-desktop-1440x900.png` | `0` | `PASS` |
| 6 | `/blog` | Public | `blog-mobile-375x812.png` | `blog-tablet-768x1024.png` | `blog-desktop-1440x900.png` | `0` | `PASS` |
| 7 | `/blog/weekly-study-plan` | Public | `blog-article-mobile-375x812.png` | `blog-article-tablet-768x1024.png` | `blog-article-desktop-1440x900.png` | `0` | `PASS` |
| 8 | `/login` | Public | `login-mobile-375x812.png` | `login-tablet-768x1024.png` | `login-desktop-1440x900.png` | `0` | `PASS` |
| 9 | `/faq` | Public | `faq-mobile-375x812.png` | `faq-tablet-768x1024.png` | `faq-desktop-1440x900.png` | `0` | `PASS` |
| 10 | `/contact` | Public | `contact-mobile-375x812.png` | `contact-tablet-768x1024.png` | `contact-desktop-1440x900.png` | `0` | `PASS` |
| 11 | `/parent-guide` | Public | `parent-guide-mobile-375x812.png` | `parent-guide-tablet-768x1024.png` | `parent-guide-desktop-1440x900.png` | `0` | `PASS` |
| 12 | `/panel` | Student | `student-dashboard-mobile-375x812.png` | `student-dashboard-tablet-768x1024.png` | `student-dashboard-desktop-1440x900.png` | `0` | `PASS` |
| 13 | `/panel/calendar` | Student | `student-calendar-mobile-375x812.png` | `student-calendar-tablet-768x1024.png` | `student-calendar-desktop-1440x900.png` | `0` | `PASS` |
| 14 | `/panel/finance` | Student | `student-finance-mobile-375x812.png` | `student-finance-tablet-768x1024.png` | `student-finance-desktop-1440x900.png` | `0` | `PASS` |
| 15 | `/panel/club` | Student | `student-club-mobile-375x812.png` | `student-club-tablet-768x1024.png` | `student-club-desktop-1440x900.png` | `0` | `PASS` |
| 16 | `/panel/chat` | Student | `student-chat-mobile-375x812.png` | `student-chat-tablet-768x1024.png` | `student-chat-desktop-1440x900.png` | `0` | `PASS` |
| 17 | `/panel/files` | Student | `student-files-mobile-375x812.png` | `student-files-tablet-768x1024.png` | `student-files-desktop-1440x900.png` | `0` | `PASS` |
| 18 | `/teacher` | Teacher | `teacher-dashboard-mobile-375x812.png` | `teacher-dashboard-tablet-768x1024.png` | `teacher-dashboard-desktop-1440x900.png` | `0` | `PASS` |
| 19 | `/teacher/calendar` | Teacher | `teacher-calendar-mobile-375x812.png` | `teacher-calendar-tablet-768x1024.png` | `teacher-calendar-desktop-1440x900.png` | `0` | `PASS` |
| 20 | `/teacher/finance` | Teacher | `teacher-finance-mobile-375x812.png` | `teacher-finance-tablet-768x1024.png` | `teacher-finance-desktop-1440x900.png` | `0` | `PASS` |
| 21 | `/teacher/application` | Teacher | `teacher-application-mobile-375x812.png` | `teacher-application-tablet-768x1024.png` | `teacher-application-desktop-1440x900.png` | `0` | `PASS` |
| 22 | `/parent` | Parent | `parent-dashboard-mobile-375x812.png` | `parent-dashboard-tablet-768x1024.png` | `parent-dashboard-desktop-1440x900.png` | `0` | `PASS` |
| 23 | `/admin/analytics` | Admin | `admin-analytics-mobile-375x812.png` | `admin-analytics-tablet-768x1024.png` | `admin-analytics-desktop-1440x900.png` | `0` | `PASS` |
| 24 | `/admin/finance` | Admin | `admin-finance-mobile-375x812.png` | `admin-finance-tablet-768x1024.png` | `admin-finance-desktop-1440x900.png` | `0` | `PASS` |
| 25 | `/admin/teaching` | Admin | `admin-teaching-mobile-375x812.png` | `admin-teaching-tablet-768x1024.png` | `admin-teaching-desktop-1440x900.png` | `0` | `PASS` |
| 26 | `/editor/home` | Admin | `admin-editor-mobile-375x812.png` | `admin-editor-tablet-768x1024.png` | `admin-editor-desktop-1440x900.png` | `0` | `PASS` |

---

## 2. End-to-End Interactive Journey Screenshots (`final-qa-gate.spec.ts`)

| # | Filename | Journey Step Captured | Status |
|---|---|---|---|
| 1 | `b1-header-wallet-dropdown.png` | Logged-in student opening `.nk-wallet-dropdown` in Header | `PASS` |
| 2 | `b1-wallet-charged-1m.png` | Wallet balance updated to `۱,۰۰۰,۰۰۰ تومان` after mock gateway callback | `PASS` |
| 3 | `b2-payment-cancelled.png` | Cancelled payment (`Status=NOK`) preserving prior wallet balance | `PASS` |
| 4 | `b3-single-session-booked.png` | Confirmed 1-session booking on `/classes/1` | `PASS` |
| 5 | `b4-multi-session-booked.png` | Confirmed 4-session booking on `/classes/6` | `PASS` |
| 6 | `b3-b4-student-calendar.png` | Booked occurrences rendered on `/panel/calendar` | `PASS` |
| 7 | `b5-live-search-dropdown.png` | Live search combobox suggestions for `فیزیک` | `PASS` |
| 8 | `b6-level-suggestions-filtered.png` | Level suggestion persistence on `/classes` | `PASS` |
| 9 | `b7-home-first-reg-modal.png` | First-registration promo modal (`MEHR05`) on `/` | `PASS` |
| 10 | `b7-mobile-375-home.png` | Mobile `375×812` Home viewport with reduced motion | `PASS` |
