import {test,expect} from '@playwright/test';

test('blog is SSR, semantic, searchable, responsive and exposes RSS without drafts',async({page,request})=>{
 const archive=await request.get('/blog');expect(archive.ok()).toBeTruthy();const html=await archive.text();expect(html).toContain('برنامهٔ درسی‌ای');expect(html).toContain('application/rss+xml');
 for(const width of [320,375,768,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/blog');await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
  await page.goto('/blog/weekly-study-plan');await expect(page.getByRole('heading',{level:1})).toContainText('برنامهٔ درسی');await expect(page.getByRole('navigation',{name:'فهرست مقاله'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 }
 const article=await(await request.get('/blog/weekly-study-plan')).text();expect(article).toContain('BlogPosting');expect(article).toContain('BreadcrumbList');expect(article).toContain('property="og:type" content="article"');expect(article).toContain('name="description"');
 await page.goto('/blog');await page.getByRole('textbox',{name:'جستجوی مقاله',exact:true}).fill('پرسش');await page.getByRole('button',{name:'جستجوی مقاله',exact:true}).click();await expect(page).toHaveURL(/q=/);
 const robots=await(await request.get('/robots.txt')).text();expect(robots.includes('Disallow: /admin')||/^Disallow: \/$/m.test(robots)).toBeTruthy();
 const rss=await request.get('/rss.xml');expect(rss.ok()).toBeTruthy();expect(rss.headers()['content-type']).toContain('application/rss+xml');const xml=await rss.text();expect(xml).toContain('<rss version="2.0"');expect(xml).toContain('weekly-study-plan');expect(xml).not.toContain('localhost');
 const map=await(await request.get('/sitemap.xml')).text();expect(map).toContain('/blog/weekly-study-plan');
 expect((await request.get('/blog/no-such-article')).status()).toBe(404);
});

test('phone-first chatbot accepts guests, answers, escalates and isolates the transcript',async({page,request})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/blog');await page.getByRole('button',{name:'باز کردن پشتیبانی نیمکت'}).click();const dialog=page.getByRole('dialog',{name:'دستیار هوشمند نیمکت'});await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'انتخاب کلاس مناسب ↖'}).click();await dialog.getByLabel('شماره موبایل',{exact:true}).fill('۰۹۱۲۱۲۳۴۵۶۷');await dialog.getByRole('checkbox').check();const response=page.waitForResponse(r=>r.url().endsWith('/support/guest/start'));await dialog.getByRole('button',{name:'شروع گفتگو ←'}).click();const started=await(await response).json();expect(started.token).toBeTruthy();
 await expect(dialog.locator('.support-message-list')).toContainText('صفحهٔ کلاس‌ها');await dialog.getByLabel('پیام پشتیبانی',{exact:true}).fill('این یک پیام مهمان برای کارشناس است.');await dialog.getByRole('button',{name:'ارسال پیام',exact:true}).click();await expect(dialog.locator('.support-message-list')).toContainText('این یک پیام مهمان برای کارشناس است.');
 await dialog.getByRole('button',{name:/ارجاع به کارشناس/}).click();await expect(dialog.locator('.support-conversation-meta')).toContainText('در صف کارشناس');
 expect((await request.get(`/api/support/guest/threads/${started.thread.id}`)).status()).toBe(401);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 await dialog.getByRole('button',{name:'بستن پشتیبانی'}).click();await page.getByRole('button',{name:'باز کردن پشتیبانی نیمکت'}).click();await expect(dialog.locator('.support-message-list')).toContainText('این یک پیام مهمان');
});
