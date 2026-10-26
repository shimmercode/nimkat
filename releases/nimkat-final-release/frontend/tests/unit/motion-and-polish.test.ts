import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

import PageTransition from '../../src/components/PageTransition.jsx';
import PageRenderer from '../../src/render/PageRenderer.jsx';
import BlogTeasers from '../../src/components/BlogTeasers.jsx';
import Calendar from '../../src/views/panel/Calendar.jsx';
import { AuthProvider } from '../../src/auth.jsx';

const ROOT = path.resolve(__dirname, '../..');

describe('Motion Stability, Non-Nested Reveal & CSS Transition Safety', () => {
  it('PageTransition SSR / initial hydration renders <main> without vertical y-offset or opacity drop', () => {
    const html = renderToStaticMarkup(
      React.createElement(PageTransition, null, React.createElement('div', { className: 'page-child' }, 'محتوای اصلی'))
    );
    expect(html).toContain('<main');
    expect(html).toContain('محتوای اصلی');
    expect(html).not.toContain('translateY(8px)');

    const src = fs.readFileSync(path.join(ROOT, 'src/components/PageTransition.jsx'), 'utf8');
    expect(src).toContain('initial={false}');
    expect(src).toContain('useReducedMotion');
    expect(src).not.toMatch(/\by\s*:\s*\[/);
  });

  it('PageRenderer in editor mode preserves .pb-page .eb-wrap > div layout contract and stays static', () => {
    const schema = {
      version: 1,
      slug: 'test',
      title: 'تست',
      root: {
        id: 'root',
        type: 'root',
        props: {},
        style: {},
        children: [
          {
            id: 'lay1',
            type: 'layout',
            props: { columns: 2, gap: 16 },
            style: { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
            children: [
              { id: 't1', type: 'text', props: { text: 'ستون اول' }, style: {}, children: [] },
              { id: 't2', type: 'text', props: { text: 'ستون دوم' }, style: {}, children: [] },
            ],
          },
        ],
      },
    };

    const html = renderToStaticMarkup(React.createElement(PageRenderer, { schema, edit: true }));
    expect(html).toContain('class="pb-page"');
    expect(html).toContain('data-eb-id="lay1"');
    expect(html).toContain('ستون اول');
    expect(html).toContain('ستون دوم');
    expect(html).toMatch(/<div data-eb-id="lay1" class="eb-wrap[^"]*"><div class="pb-node-/);
  });

  it('PageRenderer in public mode avoids recursive whileInView, staticizes top-level app blocks, and skips resize listener', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/render/PageRenderer.jsx'), 'utf8');
    expect(src).not.toContain('whileInView');
    expect(src).toContain('depth === 0 && index > 0 && !STATIC_TOP_BLOCKS.has(node.type)');
    expect(src).toContain('if (!edit || viewport !== undefined) return undefined;');
    for (const blockType of ['hero', 'classes-search', 'teacher-profile', 'class-detail', 'club-dashboard', 'blog-feed']) {
      expect(src).toContain(`'${blockType}'`);
    }
  });

  it('BlogTeasers renders a 3-card skeleton grid during loading to prevent Home page CLS', () => {
    const html = renderToStaticMarkup(React.createElement(BlogTeasers, { limit: 3 }));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('mag-card-skeleton');
    expect(html).toContain('در حال بارگذاری مطالب...');
  });

  it('PublishedPage, Home, Calendar, Finance, Materials, and PublicTeacherSchedule prevent redundant re-render and height collapse', () => {
    const pubPage = fs.readFileSync(path.join(ROOT, 'src/render/PublishedPage.jsx'), 'utf8');
    expect(pubPage).toContain('JSON.stringify(prev.schema) === JSON.stringify(nextSchema)');

    const home = fs.readFileSync(path.join(ROOT, 'src/views/Home.jsx'), 'utf8');
    expect(home).toContain('JSON.stringify(prev) === JSON.stringify(next)');

    const calendar = fs.readFileSync(path.join(ROOT, 'src/views/panel/Calendar.jsx'), 'utf8');
    expect(calendar).not.toContain('setData(null)');

    const finance = fs.readFileSync(path.join(ROOT, 'src/views/panel/Finance.jsx'), 'utf8');
    expect(finance).not.toContain('setData(null)');

    const materials = fs.readFileSync(path.join(ROOT, 'src/views/panel/Materials.jsx'), 'utf8');
    expect(materials).not.toContain('setItems(null)');

    const schedule = fs.readFileSync(path.join(ROOT, 'src/components/PublicTeacherSchedule.jsx'), 'utf8');
    expect(schedule).not.toContain('setData(null)');
  });

  it('CSS stylesheets contain zero transition: all declarations and define unified motion tokens & reduced-motion rules', () => {
    const cssFiles = [
      'src/styles/global.css',
      'src/styles/interactions.css',
      'src/styles/responsive.css',
      'src/styles/community.css',
      'src/editor/editor.css',
    ];
    for (const rel of cssFiles) {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(content, `${rel} must not use transition: all`).not.toMatch(/transition\s*:\s*all\b/i);
    }

    const globalCss = fs.readFileSync(path.join(ROOT, 'src/styles/global.css'), 'utf8');
    expect(globalCss).toContain('--motion-fast:');
    expect(globalCss).toContain('--motion-normal:');
    expect(globalCss).toContain('--motion-slow:');
    expect(globalCss).toContain('--ease-out:');
    expect(globalCss).toContain('--ease-standard:');
    expect(globalCss).toContain('translate3d(-20px, 0, 0)');
    expect(globalCss).not.toContain('right: calc(100% - 25px)');

    const interactionsCss = fs.readFileSync(path.join(ROOT, 'src/styles/interactions.css'), 'utf8');
    expect(interactionsCss).toContain('prefers-reduced-motion: reduce');
    expect(interactionsCss).toContain(':focus-visible');
    expect(interactionsCss).toContain('.nk-skeleton-surface');
  });

  it('Calendar renders full Jalali monthly grid (Saturday-first), view switcher, KPI summary, and status legend', () => {
    const html = renderToStaticMarkup(
      React.createElement(AuthProvider, null, React.createElement(Calendar))
    );
    expect(html).toContain('تقویم و کلاس‌های من');
    expect(html).toContain('نمای ماهانه');
    expect(html).toContain('نمای هفتگی');
    expect(html).toContain('نمای روزانه');
    expect(html).toContain('نمای فهرست');
    expect(html).toContain('شنبه');
    expect(html).toContain('جمعه');
    expect(html).toContain('بازهٔ قبل');
    expect(html).toContain('بازهٔ بعد');
  });

  it('Calendar and SchedulePicker enforce monotonic requestSeqRef guards against out-of-order responses during month/schedule switches', () => {
    const calendarSrc = fs.readFileSync(path.join(ROOT, 'src/views/panel/Calendar.jsx'), 'utf8');
    expect(calendarSrc).toContain('requestSeqRef');
    expect(calendarSrc).toContain('seq === requestSeqRef.current');

    const pickerSrc = fs.readFileSync(path.join(ROOT, 'src/components/SchedulePicker.jsx'), 'utf8');
    expect(pickerSrc).toContain('requestSeqRef');
    expect(pickerSrc).toContain('seq === requestSeqRef.current');
  });
});
