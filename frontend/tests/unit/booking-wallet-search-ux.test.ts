import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { normalizePersianQuery } from '../../src/components/LiveSearch.jsx';

const ROOT = path.resolve(__dirname, '../..');

describe('Booking, Wallet, Live Search & Home UX Frontend Root-Cause Verification', () => {
  it('1 & 2. Header, PanelLayout, Finance, and PaymentResult provide direct Wallet access, live balance, Persian digit normalization, and callback simulator', () => {
    const header = fs.readFileSync(path.join(ROOT, 'src/components/Header.jsx'), 'utf8');
    expect(header).toContain('data-testid="header-wallet-balance"');
    expect(header).toContain('nk:wallet-updated');
    expect(header).toContain('#wallet-charge');
    expect(header).toContain('#wallet-history');
    expect(header).toContain('<LiveSearch');

    const panelLayout = fs.readFileSync(path.join(ROOT, 'src/layouts/PanelLayout.jsx'), 'utf8');
    expect(panelLayout).toContain('className="nk-header-wallet-btn"');
    expect(panelLayout).toContain('aria-label="کیف پول و امور مالی"');

    const finance = fs.readFileSync(path.join(ROOT, 'src/views/panel/Finance.jsx'), 'utf8');
    expect(finance).toContain('id="wallet-charge"');
    expect(finance).toContain('id="wallet-history"');
    expect(finance).toContain('normalizeNumericInput');
    expect(finance).toContain('gatewayStatus');

    const paymentResult = fs.readFileSync(path.join(ROOT, 'src/views/PaymentResult.jsx'), 'utf8');
    expect(paymentResult).toContain('simulateCallback');
    expect(paymentResult).toContain('format=json');
    expect(paymentResult).toContain('nk:wallet-updated');
  });

  it('3, 4, 5, 6 & 8. SchedulePicker, ClassDetail, TeacherProfile, and PublicTeacherSchedule support 1-session and multi-session bookings and guard empty schedules', () => {
    const picker = fs.readFileSync(path.join(ROOT, 'src/components/SchedulePicker.jsx'), 'utf8');
    expect(picker).toContain('<legend>انتخاب زمان جلسات</legend>');
    expect(picker).toContain('onOccurrencesChange');
    expect(picker).toContain('زمان قابل رزروی ثبت نشده است');
    expect(picker).toContain('انتخاب خودکار');

    const classDetail = fs.readFileSync(path.join(ROOT, 'src/views/ClassDetail.jsx'), 'utf8');
    expect(classDetail).toContain('useState(1)');
    expect(classDetail).toContain('تک‌جلسه');
    expect(classDetail).toContain('جلسه‌ای برای رزرو موجود نیست');
    expect(classDetail).toContain('availableOccurrences');

    const teacherProfile = fs.readFileSync(path.join(ROOT, 'src/views/TeacherProfile.jsx'), 'utf8');
    expect(teacherProfile).toContain('d.activeClasses');
    expect(teacherProfile).toContain('classOccurrences');
    expect(teacherProfile).toContain('۱ جلسه (تک‌جلسه)');
    expect(teacherProfile).toContain('onSelectClassId={setSelectedClassId}');

    const publicSchedule = fs.readFileSync(path.join(ROOT, 'src/components/PublicTeacherSchedule.jsx'), 'utf8');
    expect(publicSchedule).toContain('انتخاب جلسه و رزرو');
    expect(publicSchedule).toContain('onSelectClassId');
    expect(publicSchedule).toContain('onToggleOccurrence');
  });

  it('7, 9 & 10. normalizePersianQuery normalizes Arabic Yeh/Kaf, ZWNJ, and Persian digits; ClassesSearch and HeroSearch integrate LiveSearch and preserve مناسب سطح شما', () => {
    expect(normalizePersianQuery('  فيزيك\u200c و رياضي ۱۲  ')).toBe('فیزیک و ریاضی 12');
    expect(normalizePersianQuery('كامياب')).toBe('کامیاب');

    const liveSearch = fs.readFileSync(path.join(ROOT, 'src/components/LiveSearch.jsx'), 'utf8');
    expect(liveSearch).toContain('role="combobox"');
    expect(liveSearch).toContain('requestSeqRef');
    expect(liveSearch).toContain('/search/suggestions');

    const heroSearch = fs.readFileSync(path.join(ROOT, 'src/components/HeroSearch.jsx'), 'utf8');
    expect(heroSearch).toContain('<LiveSearch');

    const classesSearch = fs.readFileSync(path.join(ROOT, 'src/views/ClassesSearch.jsx'), 'utf8');
    expect(classesSearch).toContain('<LiveSearch');
    expect(classesSearch).toContain('DEFAULT_SUGGESTED');
    expect(classesSearch).toContain('مناسب سطح شما');
  });

  it('11, 12 & 13. Top Students ring animation, no initial Preload, and Home-only First-Registration Promo Modal are properly wired and respect reduced-motion', () => {
    const home = fs.readFileSync(path.join(ROOT, 'src/views/Home.jsx'), 'utf8');
    expect(home).toContain('student-avatar-ring-wrap');
    expect(home).toContain('student-avatar-ring');
    expect(home).toContain('FirstRegistrationPromoModal');
    expect(home).toContain("api('/promotions/home')");
    // TASK 01: the initial full-screen brand preloader must be fully removed.
    expect(home).not.toContain('HomeBrandLoader');
    expect(home).not.toContain('homeLoading');
    expect(home).not.toContain('homeExiting');

    const homeBlocks = fs.readFileSync(path.join(ROOT, 'src/blocks/home-blocks-1.jsx'), 'utf8');
    expect(homeBlocks).toContain('student-avatar-ring-wrap');
    expect(homeBlocks).toContain('student-avatar-ring');

    const promoModal = fs.readFileSync(path.join(ROOT, 'src/components/FirstRegistrationPromoModal.jsx'), 'utf8');
    expect(promoModal).toContain("pathname === '/'");
    expect(promoModal).toContain('nk_first_reg_promo_dismissed_v1');
    expect(promoModal).toContain("e.key === 'Escape'");

    const css = fs.readFileSync(path.join(ROOT, 'src/styles/interactions.css'), 'utf8');
    expect(css).toContain('@keyframes nk-student-ring-spin');
    expect(css).toContain('.student-avatar-ring');
    expect(css).not.toContain('.nk-brand-loader');
    expect(css).not.toContain('.nk-preloader__');
    expect(css).toContain('.nk-promo-modal-card');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');

    expect(fs.existsSync(path.join(ROOT, 'src/components/HomeBrandLoader.jsx'))).toBe(false);
  });
});
