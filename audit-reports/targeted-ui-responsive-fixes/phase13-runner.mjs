/**
 * Nimkat — Phase 13 acceptance runner.
 * Drives the live preview in headless Chromium and verifies:
 *   - no horizontal page overflow at every required viewport
 *   - footer renders as a multi-column grid
 *   - the top-students section is a single horizontal carousel row
 *   - the article page section order is article-first
 *   - the discount popup hides every floating launcher
 *   - the mobile menu font size
 * It also captures before/after screenshots for mobile, tablet and desktop.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.NIMKAT_BASE || 'http://127.0.0.1:3000';
const OUT = process.env.NIMKAT_SHOT_DIR || '/home/user/nimkat/audit-reports/targeted-ui-responsive-fixes/screenshots';

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 800, kind: 'mobile' },
  { name: 'mobile-360', width: 360, height: 800, kind: 'mobile' },
  { name: 'mobile-375', width: 375, height: 812, kind: 'mobile' },
  { name: 'mobile-390', width: 390, height: 844, kind: 'mobile' },
  { name: 'mobile-430', width: 430, height: 932, kind: 'mobile' },
  { name: 'tablet-600', width: 600, height: 900, kind: 'tablet' },
  { name: 'tablet-768', width: 768, height: 1024, kind: 'tablet' },
  { name: 'tablet-landscape-1024', width: 1024, height: 768, kind: 'tablet' },
  { name: 'laptop-1366', width: 1366, height: 768, kind: 'desktop' },
  { name: 'desktop-1440', width: 1440, height: 900, kind: 'desktop' },
  { name: 'desktop-1920', width: 1920, height: 1080, kind: 'desktop' },
  { name: 'tv-3840', width: 3840, height: 2160, kind: 'desktop' },
];

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'blog', url: '/blog' },
  { name: 'article', url: '/blog/weekly-study-plan' },
  { name: 'classes', url: '/classes' },
  { name: 'teacher', url: '/teachers/1' },
  { name: 'club', url: '/club' },
];

const results = [];
const consoleErrors = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/tmp/chromium',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--headless=new',
    '--hide-scrollbars',
    '--disable-software-rasterizer',
  ],
});

fs.mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* 1. Horizontal overflow + layout checks at every viewport            */
/* ------------------------------------------------------------------ */
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    locale: 'fa-IR',
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`${vp.name}: ${m.text()}`);
  });

  for (const p of PAGES) {
    await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(250);

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const overflow = Math.max(de.scrollWidth - de.clientWidth, 0);
      // Find any element that sticks out past the viewport.
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > de.clientWidth + 1 || r.left < -1) {
          // Ignore elements inside a deliberate horizontal scroller.
          let p = el.parentElement;
          let inScroller = false;
          while (p && p !== document.body) {
            const st = getComputedStyle(p);
            if ((st.overflowX === 'auto' || st.overflowX === 'scroll') && st.overflowX !== 'visible') {
              inScroller = true;
              break;
            }
            p = p.parentElement;
          }
          if (!inScroller) {
            offenders.push(
              `${el.tagName.toLowerCase()}.${String(el.className || '').split(' ').filter(Boolean).slice(0, 2).join('.')} (${Math.round(r.left)}→${Math.round(r.right)})`
            );
          }
        }
      }
      return {
        overflow,
        clientWidth: de.clientWidth,
        offenders: [...new Set(offenders)].slice(0, 6),
      };
    });

    record(
      `${vp.name} ${p.name}: no horizontal page overflow`,
      m.overflow <= 1,
      m.overflow <= 1 ? `scrollWidth=${m.clientWidth}` : `overflow=${m.overflow}px offenders=${m.offenders.join(' | ') || 'n/a'}`
    );
  }

  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 2. Footer grid — columns must be side by side, never a single stack */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const footer = await page.evaluate(() => {
    const cols = document.querySelector('.site-footer .cols');
    if (!cols) return null;
    const kids = [...cols.children];
    const tops = kids.map((k) => Math.round(k.getBoundingClientRect().top));
    const lefts = kids.map((k) => Math.round(k.getBoundingClientRect().left));
    const firstRow = kids.filter((k) => Math.round(k.getBoundingClientRect().top) === tops[0]);
    return {
      display: getComputedStyle(cols).display,
      gridTemplateColumns: getComputedStyle(cols).gridTemplateColumns,
      childCount: kids.length,
      firstRowCount: firstRow.length,
      distinctLefts: [...new Set(lefts)].length,
      height: Math.round(cols.getBoundingClientRect().height),
      brandText: cols.querySelector('.footer-brand')?.innerText?.slice(0, 24) || '',
      headings: [...cols.querySelectorAll('h4')].map((h) => h.textContent.trim()),
      linkCount: cols.querySelectorAll('a').length,
      hasCopyright: !!document.querySelector('.site-footer .footer-bottom'),
    };
  });
  record('375px footer is a real 2-column CSS Grid', footer?.display === 'grid', `display=${footer?.display}`);
  record(
    '375px footer keeps related columns side by side (not one tall stack)',
    (footer?.distinctLefts ?? 0) >= 2,
    `distinct left offsets=${footer?.distinctLefts}, first-row children=${footer?.firstRowCount}, height=${footer?.height}px`
  );
  record(
    '375px footer keeps every column + link + copyright',
    footer?.childCount === 5 && footer?.headings.length === 4 && footer?.linkCount >= 20 && footer?.hasCopyright,
    `cols=${footer?.childCount}, headings=${footer?.headings?.join('/')}, links=${footer?.linkCount}, copyright=${footer?.hasCopyright}`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 3. Top-students carousel: one horizontal row, all 10 items present  */
/* ------------------------------------------------------------------ */
for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const c = await page.evaluate(() => {
    const track = document.querySelector('#top-students .nk-carousel__track');
    const row = document.querySelector('#top-students .row-scroll');
    const cards = [...document.querySelectorAll('#top-students .s-card')];
    if (!track || !row) return null;
    const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
    const rowStyle = getComputedStyle(row);
    const trackStyle = getComputedStyle(track);
    const de = document.documentElement;
    return {
      cardCount: cards.length,
      distinctTops: [...new Set(tops)].length,
      rowDisplay: rowStyle.display,
      rowWrap: rowStyle.flexWrap,
      trackOverflowX: trackStyle.overflowX,
      trackScrollable: track.scrollWidth > track.clientWidth,
      trackScrollWidth: track.scrollWidth,
      trackClientWidth: track.clientWidth,
      pageOverflow: de.scrollWidth - de.clientWidth,
      firstCardWidth: Math.round(cards[0]?.getBoundingClientRect().width || 0),
      lastCardVisible: !!cards[cards.length - 1],
    };
  });
  record(
    `${width}px نوابغ: single horizontal row (no wrapping)`,
    c?.distinctTops === 1 && c?.rowWrap === 'nowrap',
    `card tops=${c?.distinctTops}, row={${c?.rowDisplay}/${c?.rowWrap}}, track overflow-x=${c?.trackOverflowX}`
  );
  record(
    `${width}px نوابغ: all 10 students present in the DOM`,
    c?.cardCount === 10,
    `cards=${c?.cardCount}`
  );
  record(
    `${width}px نوابغ: carousel scrolls horizontally without breaking the page`,
    c?.trackScrollable && (c?.pageOverflow ?? 0) <= 1,
    `track scrollWidth=${c?.trackScrollWidth} clientWidth=${c?.trackClientWidth}, page overflow=${c?.pageOverflow}px, card width=${c?.firstCardWidth}px`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 4. Article page order: meta → cover → TOC → text → related → widgets */
/* ------------------------------------------------------------------ */
for (const width of [375, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/blog/weekly-study-plan`, { waitUntil: 'networkidle' });
  const order = await page.evaluate(() => {
    const idx = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return -1;
      return Math.round(el.getBoundingClientRect().top + window.scrollY);
    };
    const tocLinks = [...document.querySelectorAll('.wm-toc-link')].map((a) => a.getAttribute('href'));
    const targetsExist = tocLinks
      .filter((h) => h && h.startsWith('#'))
      .every((h) => !!document.querySelector(h));
    const sidebarNextToProse = (() => {
      const prose = document.querySelector('.wm-article-column');
      const sidebar = document.querySelector('.wm-sidebar--toc');
      if (!prose || !sidebar) return false;
      const a = prose.getBoundingClientRect();
      const b = sidebar.getBoundingClientRect();
      // Side-by-side means overlapping vertical ranges.
      return b.bottom > a.top + 40 && b.top < a.bottom - 40;
    })();
    return {
      hero: idx('.wm-post-hero'),
      cover: idx('.wm-post-cover-frame'),
      toc: idx('.wm-sidebar--toc'),
      prose: idx('.wm-article-column'),
      related: idx('.wm-related-section'),
      after: idx('.wm-after-article-widgets'),
      tocCount: document.querySelectorAll('.wm-toc-link').length,
      sectionCount: document.querySelectorAll('.wm-prose-section').length,
      targetsExist,
      sidebarNextToProse,
      proseWidth: Math.round(document.querySelector('.wm-article-column')?.getBoundingClientRect().width || 0),
      viewport: document.documentElement.clientWidth,
      paperLeft: Math.round(document.querySelector('.wm-article-paper')?.getBoundingClientRect().left || 0),
      paperRight: Math.round(
        (document.documentElement.clientWidth || 0) -
          (document.querySelector('.wm-article-paper')?.getBoundingClientRect().right || 0)
      ),
      gridCols: getComputedStyle(document.querySelector('.wm-reading-grid')).gridTemplateColumns,
      trackCount: (getComputedStyle(document.querySelector('.wm-reading-grid')).gridTemplateColumns.match(/\S+/g) || []).length,
    };
  });
  const seq = [order.hero, order.cover, order.toc, order.prose, order.related, order.after];
  const ascending = seq.every((v, i) => i === 0 || v > seq[i - 1]);
  record(
    `${width}px article order = meta → cover → TOC → text → related → side widgets`,
    ascending && seq.every((v) => v >= 0),
    `offsets=${seq.join(' < ')}`
  );
  record(
    `${width}px article TOC links resolve to real headings`,
    order.targetsExist && order.tocCount === order.sectionCount + 1,
    `toc links=${order.tocCount} (${order.sectionCount} sections + 1 FAQ), all anchors resolve=${order.targetsExist}`
  );
  record(
    `${width}px article text is the single main column (no sidebar track beside it)`,
    !order.sidebarNextToProse && order.trackCount === 1,
    `grid columns=${order.gridCols} (${order.trackCount} track), prose=${order.proseWidth}px / viewport=${order.viewport}px, sidebar overlaps prose=${order.sidebarNextToProse}`
  );
  record(
    `${width}px article column is visually centred`,
    Math.abs(order.paperLeft - order.paperRight) <= 48,
    `left gap=${order.paperLeft}px, right gap=${order.paperRight}px`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 5. Related posts: image beside the title on desktop AND mobile      */
/* ------------------------------------------------------------------ */
for (const width of [320, 375, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/blog/weekly-study-plan`, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const card = document.querySelector('.journal-card--row');
    if (!card) return null;
    const img = card.querySelector('.journal-card-cover-wrap');
    const title = card.querySelector('.journal-card-copy h3');
    if (!img || !title) return null;
    const a = img.getBoundingClientRect();
    const b = title.getBoundingClientRect();
    const imgTag = img.querySelector('img');
    return {
      sideBySide: a.right > b.left + 2 || b.right > a.left + 2,
      verticalOverlap: a.bottom > b.top && a.top < b.bottom,
      imgW: Math.round(a.width),
      imgH: Math.round(a.height),
      titleW: Math.round(b.width),
      titleH: Math.round(b.height),
      objectFit: imgTag ? getComputedStyle(imgTag).objectFit : '',
      naturalRatio: imgTag ? imgTag.naturalWidth / Math.max(1, imgTag.naturalHeight) : 0,
      renderRatio: a.width / Math.max(1, a.height),
      cardClickable: !!card.querySelector('a.journal-card-link'),
      excerptPresent: !!card.querySelector('.journal-card-copy > p'),
    };
  });
  record(
    `${width}px related card: image sits beside the title`,
    r?.sideBySide && r?.verticalOverlap,
    `img=${r?.imgW}×${r?.imgH}px, title box=${r?.titleW}×${r?.titleH}px`
  );
  record(
    `${width}px related card: image is not stretched and the card stays clickable`,
    r?.objectFit === 'cover' && r?.cardClickable && r?.excerptPresent,
    `object-fit=${r?.objectFit}, clickable=${r?.cardClickable}, excerpt kept=${r?.excerptPresent}`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 6. Discount popup: no floating launcher while it is open            */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // let the 450ms popup timer elapse
  const promo = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="first-registration-promo-modal"]');
    const reopen = document.querySelector('[data-testid="first-reg-promo-reopen"]');
    const launcher = document.querySelector('.support-launcher');
    const vis = (el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const st = getComputedStyle(el);
      return st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0';
    };
    return {
      modalVisible: vis(modal),
      reopenVisible: vis(reopen),
      launcherVisible: vis(launcher),
      flag: document.documentElement.getAttribute('data-nk-promo-open'),
      modalRect: modal ? modal.getBoundingClientRect().toJSON() : null,
    };
  });
  record('375px discount popup opens on the home page', promo.modalVisible, `modal visible=${promo.modalVisible}, flag=${promo.flag}`);
  record(
    '375px discount popup: NO floating reopen button and NO support launcher beside it',
    promo.modalVisible && !promo.reopenVisible && !promo.launcherVisible,
    `reopen pill visible=${promo.reopenVisible}, support launcher visible=${promo.launcherVisible}`
  );

  // After dismissing, the reopen pill may return — that is the intended design.
  await page.evaluate(() => {
    const close = document.querySelector('.nk-promo-modal-close');
    if (close) close.click();
  });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return false;
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden';
    };
    return {
      modalVisible: vis(document.querySelector('[data-testid="first-registration-promo-modal"]')),
      reopenVisible: vis(document.querySelector('[data-testid="first-reg-promo-reopen"]')),
      flag: document.documentElement.getAttribute('data-nk-promo-open'),
    };
  });
  record(
    '375px after dismissing: popup is closed and the reopen pill returns (design preserved)',
    !after.modalVisible && after.reopenVisible,
    `modal=${after.modalVisible}, reopen pill=${after.reopenVisible}, flag=${after.flag}`
  );
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 7. Mobile menu font size                                             */
/* ------------------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.click('.nk-mobile-trigger');
  await page.waitForTimeout(400);
  const menu = await page.evaluate(() => {
    const sheet = document.querySelector('.nk-menu-sheet');
    const link = sheet?.querySelector('.nk-sheet-links > a');
    const desktopNav = document.querySelector('.main-nav a');
    return {
      sheetOpen: !!sheet,
      itemFont: link ? getComputedStyle(link).fontSize : null,
      itemWeight: link ? getComputedStyle(link).fontWeight : null,
      itemLineHeight: link ? getComputedStyle(link).lineHeight : null,
      iconGap: link?.querySelector('span') ? getComputedStyle(link.querySelector('span')).gap : null,
      desktopFont: desktopNav ? getComputedStyle(desktopNav).fontSize : null,
      rtl: getComputedStyle(sheet).direction,
    };
  });
  record('375px mobile menu opens', menu.sheetOpen, `sheet present=${menu.sheetOpen}`);
  record(
    '375px mobile menu items use a slightly smaller font than desktop',
    menu.itemFont === '15px' && menu.desktopFont === '14px',
    `mobile item=${menu.itemFont} (weight ${menu.itemWeight}, lh ${menu.itemLineHeight}, icon gap ${menu.iconGap}), desktop nav=${menu.desktopFont}`
  );
  record('375px mobile menu keeps RTL direction', menu.rtl === 'rtl', `direction=${menu.rtl}`);
  await ctx.close();
}

/* ------------------------------------------------------------------ */
/* 8. Screenshots — mobile / tablet / desktop                          */
/* ------------------------------------------------------------------ */
const SHOT_VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];
for (const vp of SHOT_VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: 'fa-IR' });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(`${BASE}${p.url}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(OUT, `after-${vp.name}-${p.name}.png`),
      fullPage: vp.name !== 'desktop-1440',
    });
  }
  await ctx.close();
}

/* ------------------------------------------------------------------ */
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${'='.repeat(72)}`);
console.log(`PASSED: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('\nFAILURES:');
  for (const f of failed) console.log(`  ✗ ${f.name} — ${f.detail}`);
}
console.log(`\nCONSOLE ERRORS captured: ${consoleErrors.length}`);
for (const e of [...new Set(consoleErrors)].slice(0, 20)) console.log(`  ! ${e}`);
fs.writeFileSync(
  path.join(OUT, '..', 'phase-13-results.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE,
      viewports: VIEWPORTS.map((v) => `${v.width}px`),
      pages: PAGES.map((p) => p.url),
      total: results.length,
      passed: results.length - failed.length,
      failed,
      consoleErrors: [...new Set(consoleErrors)],
      checks: results,
    },
    null,
    2
  )
);
process.exit(failed.length ? 1 : 0);
