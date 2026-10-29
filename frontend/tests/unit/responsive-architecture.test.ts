import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

describe('Multi-Device Responsive Architecture (320px Mobile · Tablet · Desktop · 2560px Ultra-Wide · 4K TV)', () => {
  it('responsive.css and interactions.css define media queries for all device tiers (320/360/480/600/720/900/1100/1920/2560 + landscape)', () => {
    const responsiveCss = fs.readFileSync(path.join(ROOT, 'src/styles/responsive.css'), 'utf8');
    const interactionsCss = fs.readFileSync(path.join(ROOT, 'src/styles/interactions.css'), 'utf8');

    expect(responsiveCss).toContain('@media (max-width: 360px)');
    expect(responsiveCss).toContain('@media (max-width: 480px)');
    expect(responsiveCss).toContain('@media (max-width: 600px)');
    expect(responsiveCss).toContain('@media (max-width: 720px)');
    expect(responsiveCss).toContain('@media (max-width: 900px)');
    expect(responsiveCss).toContain('@media (max-width: 1100px)');
    expect(responsiveCss).toContain('@media (max-height: 520px) and (orientation: landscape)');
    expect(responsiveCss).toContain('@media (min-width: 1920px)');
    expect(responsiveCss).toContain('@media (min-width: 2560px)');

    // Safe min(100%, ...) guards for 320px viewports
    expect(interactionsCss).toContain('minmax(min(100%, 190px), 1fr)');
    expect(interactionsCss).toContain('min-width: min(100%, 260px)');
    expect(interactionsCss).toContain('min-width: min(100%, 240px)');
    expect(interactionsCss).toContain('minmax(min(100%, 260px), 1fr)');
  });

  it('BlogListClient, ClassDetail, and ClassesSearch avoid rigid 320px-overflowing inline minWidth/grid rules', () => {
    const blogList = fs.readFileSync(path.join(ROOT, 'src/components/BlogListClient.tsx'), 'utf8');
    expect(blogList).not.toContain('minWidth: 260');
    expect(blogList).toContain('minWidth: 0');

    const classDetail = fs.readFileSync(path.join(ROOT, 'src/views/ClassDetail.jsx'), 'utf8');
    expect(classDetail).toContain('cd-tier-grid');
    expect(classDetail).toContain('cd-info-grid');

    const classesSearch = fs.readFileSync(path.join(ROOT, 'src/views/ClassesSearch.jsx'), 'utf8');
    expect(classesSearch).toContain('cs-hour-grid');
  });

  it('All data tables across views are wrapped inside horizontal scroll containers (.table-scroll or .operations-table-wrap)', () => {
    const tableViews = [
      'src/views/Analytics.jsx',
      'src/views/ClubAdmin.jsx',
      'src/views/panel/AcademicReport.jsx',
      'src/views/panel/Club.jsx',
      'src/views/panel/TeacherHome.jsx',
      'src/components/AcademicComparison.jsx',
      'src/components/ui/design-system.jsx',
    ];
    for (const rel of tableViews) {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(
        content.includes('table-scroll') || content.includes('operations-table-wrap'),
        `${rel} must wrap tables in a responsive scroll container`
      ).toBe(true);
    }
  });

  it('layout.tsx imports responsive.css last and responsive.css resets sticky sidebars and p-grid-2 inline columns on mobile', () => {
    const layoutTsx = fs.readFileSync(path.join(ROOT, 'src/app/layout.tsx'), 'utf8');
    const cssImports = Array.from(layoutTsx.matchAll(/import\s+['"]\.\.\/styles\/([^'"]+)['"]/g)).map((m) => m[1]);
    expect(cssImports[cssImports.length - 1]).toBe('responsive.css');

    const responsiveCss = fs.readFileSync(path.join(ROOT, 'src/styles/responsive.css'), 'utf8');
    expect(responsiveCss).toContain('.filter-side');
    expect(responsiveCss).toContain('.p-grid-2 > [style*="grid-column"]');
    expect(responsiveCss).toContain('#top-students .row-scroll');
  });
});
