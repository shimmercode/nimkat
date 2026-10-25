import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  SEGMENTS,
  HERO_SEGMENTS,
  fieldsForSegment,
  gradesForSegment,
  subjectsForSegment,
  matchesSegment,
} from '../../src/utils/curriculum.js';

const ROOT = path.resolve(__dirname, '../..');

describe('Phase 1–9 Frontend Product Recovery & Route Integrity', () => {
  it('curriculum helper updates fields, grades, and subjects coherently when segment/grade changes', () => {
    expect(HERO_SEGMENTS).toEqual(['ابتدایی', 'متوسطه اول', 'متوسطه دوم', 'کنکور']);
    expect(SEGMENTS).toEqual(['همه', 'ابتدایی', 'متوسطه اول', 'متوسطه دوم', 'کنکور']);
    expect(fieldsForSegment('ابتدایی')).toEqual(['همه', 'عمومی']);
    expect(fieldsForSegment('متوسطه دوم')).toContain('ریاضی فیزیک');
    expect(gradesForSegment('متوسطه اول')).toEqual(['همه', 'هفتم', 'هشتم', 'نهم']);
    expect(subjectsForSegment('ابتدایی', false)).toContain('ریاضی');
    expect(subjectsForSegment('ابتدایی', false)).not.toContain('فیزیک');
    expect(subjectsForSegment('متوسطه دوم', false)).toContain('فیزیک');
    expect(matchesSegment({ grade: 'یازدهم' }, 'متوسطه دوم')).toBe(true);
    expect(matchesSegment({ grade: 'یازدهم' }, 'ابتدایی')).toBe(false);
  });

  it('all restored public and student panel Next.js App Router pages exist', () => {
    const requiredPages = [
      'src/app/(public)/blog/page.tsx',
      'src/app/(public)/blog/[slug]/page.tsx',
      'src/app/(public)/faq/page.tsx',
      'src/app/(public)/privacy/page.tsx',
      'src/app/(public)/terms/page.tsx',
      'src/app/(public)/cancellation-policy/page.tsx',
      'src/app/(public)/contact/page.tsx',
      'src/app/(public)/parent-guide/page.tsx',
      'src/app/(public)/sitemap/page.tsx',
      'src/app/(student)/panel/page.tsx',
      'src/app/(student)/panel/calendar/page.tsx',
      'src/app/(student)/panel/chat/page.tsx',
      'src/app/(student)/panel/files/page.tsx',
      'src/app/(student)/panel/finance/page.tsx',
      'src/app/(student)/panel/club/page.tsx',
      'src/app/(student)/panel/profile/page.tsx',
      'src/app/(student)/panel/notifications/page.tsx',
      'src/app/(student)/panel/reports/page.tsx',
      'src/app/(student)/panel/exams/page.tsx',
      'src/app/not-found.tsx',
      'src/app/sitemap.ts',
      'src/app/rss.xml/route.ts',
    ];
    for (const rel of requiredPages) {
      expect(fs.existsSync(path.join(ROOT, rel)), `Missing route file: ${rel}`).toBe(true);
    }
  });

  it('Header, Footer, Home, Login, and PanelLayout contain zero dead href="#" or "#magazine" links', () => {
    const filesToCheck = [
      'src/components/Header.jsx',
      'src/components/Footer.jsx',
      'src/views/Home.jsx',
      'src/views/Login.jsx',
      'src/layouts/PanelLayout.jsx',
      'src/blocks/home-blocks-1.jsx',
      'src/blocks/home-blocks-2.jsx',
    ];
    for (const rel of filesToCheck) {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(content).not.toContain('href="#"');
      expect(content).not.toContain("moreHref: '#magazine'");
    }
  });

  it('ClassesSearch.jsx uses controlled selects, dynamic pagination, accessible how-we-choose modal, and teacher request form', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/views/ClassesSearch.jsx'), 'utf8');
    expect(content).not.toContain('defaultValue=');
    expect(content).not.toContain("[1, 2, 3, '…', 14]");
    expect(content).toContain('Math.ceil(sorted.length / PAGE_SIZE)');
    expect(content).toContain('howModalOpen');
    expect(content).toContain('suggestModalOpen');
    expect(content).toContain("api('/callback'");
  });

  it('Club.jsx includes explicit eligibility reasons, accessible how-we-choose modal, and claim confirmation dialog', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/views/panel/Club.jsx'), 'utf8');
    expect(content).toContain('rewardButtonLabel');
    expect(content).toContain('howClubModalOpen');
    expect(content).toContain('confirmClaimReward');
    expect(content).toContain('role="dialog"');
  });

  it('Header, Footer, PanelLayout, Home, StudentHome, and TeacherHome match the attached UI PDFs', () => {
    const header = fs.readFileSync(path.join(ROOT, 'src/components/Header.jsx'), 'utf8');
    expect(header).toContain('<header className="site-header">');
    expect(header).not.toContain('nk-header');
    for (const navLabel of ['کلاس‌ها و اساتید', 'کلاس‌های گروهی', 'نیم‌چت', 'نیمکت کلاب', 'ویژه والدین', 'مجله']) {
      expect(header).toContain(navLabel);
    }

    const footer = fs.readFileSync(path.join(ROOT, 'src/components/Footer.jsx'), 'utf8');
    expect(footer).toContain('<footer className="site-footer">');
    expect(footer).not.toContain('nk-footer');
    for (const colTitle of ['مقاطع تحصیلی', 'دسترسی سریع', 'پشتیبانی', 'مجوزها', 'نماد اعتماد', 'ساماندهی']) {
      expect(footer).toContain(colTitle);
    }

    const panelLayout = fs.readFileSync(path.join(ROOT, 'src/layouts/PanelLayout.jsx'), 'utf8');
    expect(panelLayout).toContain('<div className="panel-page">');
    expect(panelLayout).toContain('<div className="panel-top">');
    expect(panelLayout).toContain('<div className="container panel-body">');

    const home = fs.readFileSync(path.join(ROOT, 'src/views/Home.jsx'), 'utf8');
    expect(home).toContain('<section className="hero">');
    expect(home).not.toContain('<HeroFrame>');
    expect(home).not.toContain('<ActionPanel');
    for (const qlAsset of ['ql-teachers.png', 'ql-students.png', 'ql-discounts.png', 'ql-club.png', 'ql-records.png']) {
      expect(home).toContain(qlAsset);
    }

    const heroSearch = fs.readFileSync(path.join(ROOT, 'src/components/HeroSearch.jsx'), 'utf8');
    expect(heroSearch).toContain('className="hero-search"');
    expect(heroSearch).toContain('className="segmented"');
    expect(heroSearch).toContain('className="search-bar"');
    expect(heroSearch).toContain('className="sfield hero-select-field"');
    expect(heroSearch).toContain('hero-search-btn');

    const clubTeaser = fs.readFileSync(path.join(ROOT, 'src/components/ClubTeaser.jsx'), 'utf8');
    expect(clubTeaser).toContain('هر کلاس، یک قدم تا نیمکت طلایی');
    expect(clubTeaser).toContain('club-levels');
  });
});
