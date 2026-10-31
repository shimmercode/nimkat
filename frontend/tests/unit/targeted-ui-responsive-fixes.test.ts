import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../..');

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('Targeted UI/UX & Responsive Fixes — Acceptance Criteria', () => {
  /* ------------------------------------------------------------------ */
  /* TASK 01 — Preload fully removed                                      */
  /* ------------------------------------------------------------------ */
  describe('TASK 01 — Preload removal', () => {
    it('1.1 the home view no longer imports or renders the brand preloader', () => {
      const home = read('src/views/Home.jsx');
      expect(home).not.toContain('HomeBrandLoader');
      expect(home).not.toContain('home-brand-loader');
      expect(home).not.toContain('homeLoading');
      expect(home).not.toContain('homeExiting');
      expect(home).not.toContain('home-brand-loader');
    });

    it('1.2 the preloader component file is deleted', () => {
      expect(fs.existsSync(path.join(ROOT, 'src/components/HomeBrandLoader.jsx'))).toBe(false);
    });

    it('1.3 no preload CSS/animations remain in any stylesheet', () => {
      for (const sheet of [
        'src/styles/interactions.css',
        'src/styles/global.css',
        'src/styles/responsive.css',
        'src/styles/community.css',
        'src/styles/journal.css',
      ]) {
        const css = read(sheet);
        expect(css).not.toContain('nk-brand-loader');
        expect(css).not.toContain('nk-preloader__');
      }
    });

    it('1.4 the artificial minimum delay before showing the home content is gone', () => {
      const home = read('src/views/Home.jsx');
      expect(home).not.toContain('minTimer');
      expect(home).not.toMatch(/setTimeout\(/);
      expect(home).not.toContain('startSmoothExit');
      expect(home).not.toContain('exitTimeout');
      // The two real API calls still run in parallel — no artificial delay is added.
      expect(home).toMatch(/Promise\.all\(\[[\s\S]*?api\('\/pages\/home'\)[\s\S]*?api\('\/promotions\/home'\)/);
    });

    it('1.5 the real data-loading API calls are preserved', () => {
      const home = read('src/views/Home.jsx');
      expect(home).toContain("api('/pages/home')");
      expect(home).toContain("api('/promotions/home')");
    });

    it('1.6 the 404 page animation still works (keyframe preserved under a 404 name)', () => {
      const css = read('src/styles/interactions.css');
      expect(css).toContain('@keyframes nk-404-pulse-scale');
      expect(css).toMatch(/\.nk-404-pulse \{[^}]*animation: nk-404-pulse-scale/s);
      expect(css).not.toContain('nk-preloader-pulse');
    });
  });

  /* ------------------------------------------------------------------ */
  /* TASK 02 — Footer becomes a real responsive Grid                       */
  /* ------------------------------------------------------------------ */
  describe('TASK 02 — Footer grid', () => {
    it('2.1 the footer keeps every original column and link', () => {
      const footer = read('src/components/Footer.jsx');
      for (const label of ['مقاطع تحصیلی', 'دسترسی سریع', 'پشتیبانی', 'مجوزها']) {
        expect(footer).toContain(label);
      }
      for (const href of [
        '/classes?grade=ابتدایی',
        '/classes?grade=متوسطه اول',
        '/classes?grade=متوسطه دوم',
        '/classes?grade=کنکور',
        '/classes?q=مهارتی',
        '/panel/chat',
        '/club',
        '/blog',
        '/login?mode=teacher',
        '/faq',
        '/terms',
        '/privacy',
        '/cancellation-policy',
        '/contact',
        '/sitemap',
      ]) {
        expect(footer).toContain(href);
      }
      expect(footer).toContain('۰۲۱-۹۱۰۰۴۵۶۰');
      expect(footer).toContain('نماد اعتماد');
      expect(footer).toContain('ساماندهی');
      expect(footer).toContain('© ۱۴۰۵ نیمکت');
    });

    it('2.2 the footer uses a real CSS Grid on desktop', () => {
      const css = read('src/styles/global.css');
      expect(css).toMatch(/\.site-footer \.cols \{[^}]*display: grid;/s);
      expect(css).toMatch(/\.site-footer \.cols \{[^}]*grid-template-columns: minmax\(0, 1\.45fr\)/s);
    });

    it('2.3 the footer is a TWO-column grid on phones (never a single tall column)', () => {
      const responsive = read('src/styles/responsive.css');
      // The 480px block must keep two columns.
      const start480 = responsive.lastIndexOf('@media (max-width: 480px)');
      const block480 = responsive.slice(start480, responsive.indexOf('@media (max-width: 360px)', start480));
      expect(block480).toMatch(/\.site-footer \.cols \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/s);
      expect(block480).not.toMatch(/\.site-footer \.cols \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
    });

    it('2.4 the 400px breakpoint also keeps the 2-column footer', () => {
      const responsive = read('src/styles/responsive.css');
      const block400 = responsive.slice(responsive.indexOf('@media(max-width:400px)'));
      expect(block400).toMatch(/\.site-footer \.cols \{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
    });

    it('2.5 the brand block spans the full footer row on tablet/mobile', () => {
      const responsive = read('src/styles/responsive.css');
      const start900 = responsive.indexOf(
        '/* Tablet & Mobile Footer: real 2-column grid, brand spans the full row.'
      );
      expect(start900).toBeGreaterThan(-1);
      const block900 = responsive.slice(start900, responsive.indexOf('/* Mobile & Small Tablet', start900));
      expect(block900).toMatch(/\.site-footer \.footer-brand \{[^}]*grid-column: 1 \/ -1;/s);
    });

    it('2.6 the global footer media queries no longer force a single column', () => {
      const css = read('src/styles/global.css');
      expect(css).not.toMatch(/\.site-footer \.cols \{ grid-template-columns: 1fr; \}/);
      expect(css).not.toMatch(/\.site-footer \.cols \{ grid-template-columns: 1fr 1fr 1fr; \}/);
    });
  });

  /* ------------------------------------------------------------------ */
  /* TASK 03 — Top Students carousel (single row on every device)          */
  /* ------------------------------------------------------------------ */
  describe('TASK 03 — Top students carousel', () => {
    it('3.1 the carousel component exists and is used by both home renderers', () => {
      expect(fs.existsSync(path.join(ROOT, 'src/components/HorizontalCarousel.jsx'))).toBe(true);
      const home = read('src/views/Home.jsx');
      const blocks = read('src/blocks/home-blocks-1.jsx');
      expect(home).toContain('HorizontalCarousel');
      expect(home).toContain('nk-carousel--students');
      expect(blocks).toContain('HorizontalCarousel');
      expect(blocks).toContain('nk-carousel--students');
    });

    it('3.2 the track is a horizontal, non-wrapping scroll container', () => {
      const responsive = read('src/styles/responsive.css');
      expect(responsive).toMatch(/\.nk-carousel__track \{[^}]*display: flex;/s);
      expect(responsive).toMatch(/\.nk-carousel__track \{[^}]*flex-wrap: nowrap;/s);
      expect(responsive).toMatch(/\.nk-carousel__track \{[^}]*overflow-x: auto;/s);
      expect(responsive).toMatch(/\.nk-carousel__track \{[^}]*scroll-snap-type: x mandatory;/s);
    });

    it('3.3 no rule can turn the top-students row into a multi-row grid', () => {
      const responsive = read('src/styles/responsive.css');
      const occurrences = responsive.match(/#top-students \.row-scroll \{[^}]*\}/gs) || [];
      expect(occurrences.length).toBeGreaterThan(0);
      for (const rule of occurrences) {
        expect(rule).not.toContain('grid-template-columns');
        expect(rule).toContain('flex-wrap: nowrap');
      }
    });

    it('3.4 the carousel respects prefers-reduced-motion', () => {
      const responsive = read('src/styles/responsive.css');
      expect(responsive).toMatch(
        /@media \(prefers-reduced-motion: reduce\) \{[^}]*\.nk-carousel__track \{[^}]*scroll-behavior: auto;/s
      );
    });

    it('3.5 the carousel supports keyboard navigation', () => {
      const carousel = read('src/components/HorizontalCarousel.jsx');
      expect(carousel).toContain('onKeyDown');
      expect(carousel).toContain('ArrowLeft');
      expect(carousel).toContain('ArrowRight');
      expect(carousel).toContain('tabIndex={0}');
    });

    it('3.6 the number of top students is unchanged (10 in both renderers)', () => {
      const home = read('src/views/Home.jsx');
      const homeList = home.slice(home.indexOf('const TOP_STUDENTS = ['), home.indexOf('const TESTIMONIALS = ['));
      expect((homeList.match(/\{\s*name:/g) || []).length).toBe(10);

      const blocks = read('src/blocks/home-blocks-1.jsx');
      const blocksList = blocks.slice(
        blocks.indexOf('export const topStudentsSpec'),
        blocks.indexOf('fields: [', blocks.indexOf('export const topStudentsSpec'))
      );
      expect((blocksList.match(/\{\s*name:/g) || []).length).toBe(10);
    });

    it('3.7 the previous/next buttons still drive the carousel', () => {
      const home = read('src/views/Home.jsx');
      expect(home).toContain('.nk-carousel__track');
      expect(home).toContain("scrollBy({ left: 320, behavior: 'smooth' })");
      expect(home).toContain("scrollBy({ left: -320, behavior: 'smooth' })");
      expect(home).toContain('aria-label="نوابغ قبلی"');
      expect(home).toContain('aria-label="نوابغ بعدی"');
    });
  });

  /* ------------------------------------------------------------------ */
  /* TASK 04 — Article-first blog layout                                  */
  /* ------------------------------------------------------------------ */
  describe('TASK 04 — Article layout', () => {
    const page = () => read('src/app/(public)/blog/[slug]/page.tsx');

    it('4.1 the Table of Contents renders BEFORE the article body', () => {
      const src = page();
      const tocIdx = src.indexOf('wm-sidebar--toc');
      const bodyIdx = src.indexOf('wm-article-column');
      expect(tocIdx).toBeGreaterThan(-1);
      expect(bodyIdx).toBeGreaterThan(-1);
      expect(tocIdx).toBeLessThan(bodyIdx);
    });

    it('4.2 the related-posts section renders AFTER the article body', () => {
      const src = page();
      expect(src.indexOf('wm-article-column')).toBeLessThan(src.indexOf('wm-related-section'));
    });

    it('4.3 the remaining side widgets render AFTER the related posts', () => {
      const src = page();
      expect(src.indexOf('wm-related-section')).toBeLessThan(src.indexOf('wm-after-article-widgets'));
      expect(src.indexOf('wm-after-article-widgets')).toBeLessThan(src.indexOf('wm-sidebar--after'));
    });

    it('4.4 the article column is full width — no sidebar track narrows the prose', () => {
      // The article-first rules live in `responsive.css` because it is the LAST
      // imported stylesheet and must win over `journal.css`'s two-column rule.
      const responsive = read('src/styles/responsive.css');
      expect(responsive).toMatch(
        /\.journal-reading-layout\.wm-reading-grid--article-first \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s
      );
      // `journal.css` must not be able to override it (specificity + order).
      const interactions = read('src/styles/interactions.css');
      expect(interactions).not.toMatch(/\.wm-reading-grid--article-first \{[^}]*grid-template-columns/s);
    });

    it('4.5 the 1024px and ultra-wide breakpoints keep the article-first single column', () => {
      const responsive = read('src/styles/responsive.css');
      const start1024 = responsive.indexOf('@media (max-width: 1024px) {');
      const block1024 = responsive.slice(start1024, responsive.indexOf('@media (max-width: 820px)', start1024));
      expect(block1024).toMatch(
        /\.journal-reading-layout\.wm-reading-grid--article-first \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s
      );

      const start2560 = responsive.indexOf('@media (min-width: 2560px) {');
      const block2560 = responsive.slice(start2560, responsive.indexOf('@media (prefers-reduced-motion', start2560));
      expect(block2560).toMatch(
        /\.journal-reading-layout\.wm-reading-grid--article-first \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s
      );
    });

    it('4.6 the cover image stays in its original, prominent position', () => {
      const src = page();
      expect(src).toContain('wm-post-cover-container');
      expect(src).toContain('wm-post-cover-frame');
      expect(src).toContain('journal-article-cover');
      expect(src.indexOf('wm-post-cover-frame')).toBeLessThan(src.indexOf('wm-sidebar--toc'));
    });

    it('4.7 no article text was removed — every section and the FAQ are still rendered', () => {
      const src = page();
      expect(src).toContain('p.sections.map');
      expect(src).toContain('id={`section-${i + 1}`}');
      expect(src).toContain('id="article-faq"');
      expect(src).toContain('p.faq.map');
      expect(src).toContain('wm-article-paper');
      expect(src).toContain('wm-author-card');
      expect(src).toContain('wm-post-nav');
    });

    it('4.8 responsive.css is the LAST imported stylesheet so its rules win the cascade', () => {
      const layout = read('src/app/layout.tsx');
      const imports = [...layout.matchAll(/import '\.\.\/styles\/([a-z-]+\.css)'/g)].map((m) => m[1]);
      expect(imports.length).toBeGreaterThan(0);
      expect(imports[imports.length - 1]).toBe('responsive.css');
      // journal.css (two-column article rule) must come before it.
      expect(imports.indexOf('journal.css')).toBeLessThan(imports.indexOf('responsive.css'));
    });

    it('4.9 the TOC still links to the correct heading anchors', () => {
      const src = page();
      expect(src).toContain('href={`#section-${i + 1}`}');
      expect(src).toContain('id={`section-${i + 1}`}');
      expect(src).toContain('href="#article-faq"');
    });
  });

  /* ------------------------------------------------------------------ */
  /* TASK 05 — Related posts: image beside title                           */
  /* ------------------------------------------------------------------ */
  describe('TASK 05 — Related posts cards', () => {
    it('5.1 the related cards use the horizontal (image beside title) modifier', () => {
      const src = read('src/app/(public)/blog/[slug]/page.tsx');
      expect(src).toContain('journal-grid--related');
      expect(src).toContain('journal-card--row');
    });

    it('5.2 the horizontal card layout is kept on desktop AND mobile', () => {
      const css = read('src/styles/interactions.css');
      expect(css).toMatch(/\.journal-card--row \{[^}]*flex-direction: row;/s);
      // Mobile block must NOT flip the card to a column layout.
      const mobile = css.slice(css.indexOf('@media (max-width: 720px)'));
      const rowMobile = mobile.slice(mobile.indexOf('.journal-card--row'), mobile.indexOf('@media (max-width: 400px)'));
      expect(rowMobile).not.toContain('flex-direction: column');
    });

    it('5.3 the image has a fixed aspect and never gets stretched', () => {
      const css = read('src/styles/interactions.css');
      expect(css).toMatch(/\.journal-card--row \.journal-card-cover-wrap \{[^}]*flex: 0 0 152px;/s);
      expect(css).toMatch(/\.journal-card--row \.journal-card-cover-wrap img \{[^}]*object-fit: cover;/s);
    });

    it('5.4 the title wraps in the remaining space and is never clipped', () => {
      const css = read('src/styles/interactions.css');
      expect(css).toMatch(/\.journal-card--row \.journal-card-copy \{[^}]*min-width: 0;/s);
      expect(css).toMatch(/\.journal-card--row \.journal-card-copy h3 \{[^}]*overflow-wrap: anywhere;/s);
    });

    it('5.5 the whole card stays clickable', () => {
      const src = read('src/app/(public)/blog/[slug]/page.tsx');
      expect(src).toMatch(/<article className="journal-card journal-card--row"[\s\S]*?<Link href=\{`\/blog\/\$\{x\.slug\}`\} className="journal-card-link">/);
    });

    it('5.6 no related-post content is hidden on small screens', () => {
      const css = read('src/styles/interactions.css');
      expect(css).not.toMatch(/\.journal-card--row \.journal-card-copy > p \{[^}]*display: none;/s);
    });
  });

  /* ------------------------------------------------------------------ */
  /* TASK 06 — Discount popup hides the floating button                    */
  /* ------------------------------------------------------------------ */
  describe('TASK 06 — Discount popup / floating button', () => {
    it('6.1 the popup sets a document flag while it is open', () => {
      const modal = read('src/components/FirstRegistrationPromoModal.jsx');
      expect(modal).toContain('PROMO_OPEN_ATTRIBUTE');
      expect(modal).toContain('setAttribute(PROMO_OPEN_ATTRIBUTE');
      expect(modal).toContain('removeAttribute(PROMO_OPEN_ATTRIBUTE');
    });

    it('6.2 the floating launchers are hidden while the popup is open', () => {
      const css = read('src/styles/interactions.css');
      expect(css).toMatch(
        /html\[data-nk-promo-open='true'\] \.nk-promo-reopen-wrap,[\s\S]*?html\[data-nk-promo-open='true'\] \.support-launcher \{[^}]*display: none !important;/s
      );
    });

    it('6.3 the discount logic itself is untouched', () => {
      const modal = read('src/components/FirstRegistrationPromoModal.jsx');
      expect(modal).toContain('PROMO_DISMISS_STORAGE_KEY');
      expect(modal).toContain('nk_first_reg_promo_dismissed_v1');
      expect(modal).toContain('activePromo.percent');
      expect(modal).toContain('activePromo.code');
      expect(modal).toContain('handleDismiss');
      expect(modal).toContain('handleReopen');
      expect(modal).toContain('450');
    });

    it('6.4 no second, parallel popup-control system was introduced', () => {
      const modal = read('src/components/FirstRegistrationPromoModal.jsx');
      // Exactly one modal layer and one reopen pill in the source.
      expect((modal.match(/nk-promo-modal-layer/g) || []).length).toBe(1);
      expect((modal.match(/nk-promo-reopen-wrap/g) || []).length).toBe(1);
    });

    it('6.5 the floating reopen pill and the modal are mutually exclusive', () => {
      const modal = read('src/components/FirstRegistrationPromoModal.jsx');
      const dismissIdx = modal.indexOf('if (dismissed) {');
      const modalIdx = modal.indexOf('className="nk-promo-modal-layer"');
      expect(dismissIdx).toBeGreaterThan(-1);
      expect(modalIdx).toBeGreaterThan(dismissIdx);
      expect(modal).toContain('if (!readyToShow) {');
    });
  });

  /* ------------------------------------------------------------------ */
  /* TASK 07 — Mobile menu font size                                      */
  /* ------------------------------------------------------------------ */
  describe('TASK 07 — Mobile menu font size', () => {
    it('7.1 the mobile sheet menu items are slightly smaller', () => {
      const css = read('src/styles/community.css');
      expect(css).toMatch(/\.nk-sheet-links>a \{[^}]*font-size:16px;/s);
      expect(css).toMatch(
        /@media\(max-width:1100px\) \{[^}]*\.nk-menu-sheet \.nk-sheet-links>a \{font-size:15px;/s
      );
    });

    it('7.2 the reduction is subtle and the line-height stays readable', () => {
      const css = read('src/styles/community.css');
      expect(css).toMatch(/\.nk-menu-sheet \.nk-sheet-links>a \{font-size:15px;line-height:1\.75;\}/);
    });

    it('7.3 the desktop navigation font size is unchanged', () => {
      const global = read('src/styles/global.css');
      expect(global).toMatch(/\.main-nav a \{[^}]*font-size: 14px;/s);
      const community = read('src/styles/community.css');
      expect(community).not.toMatch(/\.main-nav a \{[^}]*font-size:/s);
    });

    it('7.4 the icon/text gap and RTL alignment are preserved', () => {
      const css = read('src/styles/community.css');
      expect(css).toMatch(/\.nk-sheet-links>a span \{display:flex;align-items:center;gap:12px;\}/);
      expect(css).toMatch(/\.nk-menu-sheet \.nk-sheet-links>a span \{gap:10px;\}/);
      expect(css).toMatch(/\.nk-sheet-links>a \{[^}]*justify-content:\s*space-between;/s);
    });
  });
});
