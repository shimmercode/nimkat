import {adminSession} from '../helpers/admin-session';
import { test, expect, request as requestFactory, type APIRequestContext } from '@playwright/test';
const baseURL=process.env.TEST_BASE_URL||'http://localhost:5173';
let admin:APIRequestContext,student:APIRequestContext,adminCookies:any[],studentCookies:any[],threadId:string,articleId:number;
const suffix=Date.now().toString().slice(-7);
const keyword=`راهنمای آزمون ${suffix}`;
const longText=`${keyword} `+'متن طولانی برای بررسی شکست خطوط و خوانایی در موبایل. '.repeat(30)+'x'.repeat(150);
async function login(mobile:string){
  if(mobile==='09120000000'){const a=await adminSession(baseURL);return {ctx:a.api,cookies:a.cookies,headers:a.headers};}
  const ctx=await requestFactory.newContext({baseURL});
  let response=await ctx.post('/api/auth/otp/request',{data:{mobile}});
  // Respect the real OTP cooldown when the editor suite logged in just before this file.
  if(response.status()===429){const seconds=Number(response.headers()['retry-after']||60);if(seconds<=60){await new Promise(r=>setTimeout(r,(seconds+1)*1000));response=await ctx.post('/api/auth/otp/request',{data:{mobile}});}}
  const otp=await response.json();
  expect(otp.devCode,'Use only a development/test database').toBeTruthy();
  expect((await ctx.post('/api/auth/otp/verify',{data:{mobile,code:otp.devCode}})).ok()).toBeTruthy();
  const cookies=(await ctx.storageState()).cookies;
  return {ctx,cookies,headers:{'X-CSRF-Token':cookies.find(c=>c.name==='nk_csrf')!.value}};
}
let adminHeaders:Record<string,string>,studentHeaders:Record<string,string>;
test.beforeAll(async()=>{
  test.setTimeout(120000);
  const a=await login('09120000000');admin=a.ctx;adminCookies=a.cookies;adminHeaders=a.headers;
  const s=await login(`0935${suffix}`);student=s.ctx;studentCookies=s.cookies;studentHeaders=s.headers;
  const article=await admin.post('/api/admin/support/articles',{headers:adminHeaders,data:{title:keyword,keywords:keyword,text:'پاسخ راهنمای منتشرشده برای آزمون پشتیبانی.'}});expect(article.ok()).toBeTruthy();articleId=(await article.json()).id;
  threadId=(await(await student.post('/api/support/threads',{headers:studentHeaders,data:{}})).json()).thread.id;
  expect((await student.post(`/api/support/threads/${threadId}/messages`,{headers:studentHeaders,data:{text:longText,clientId:`responsive_message_${suffix}`}})).ok()).toBeTruthy();
  await student.post(`/api/support/threads/${threadId}/escalate`,{headers:studentHeaders,data:{}});
});
test.afterAll(async()=>{
  if(articleId)await admin.put(`/api/admin/support/articles/${articleId}`,{headers:adminHeaders,data:{title:keyword,keywords:keyword,text:'پاسخ راهنمای منتشرشده برای آزمون پشتیبانی.',published:false,version:(await(await admin.get('/api/admin/support',{headers:adminHeaders})).json()).articles.find((a:any)=>a.id===articleId)?.version||1}});
  if(threadId)await admin.post(`/api/admin/support/${threadId}/reply`,{headers:adminHeaders,data:{text:'پایان آزمون مرورگری',close:true}});
  await admin?.dispose();await student?.dispose();
});
async function noOverflow(page:any,selector:string){
  const sizes=await page.locator(selector).evaluate((el:HTMLElement)=>({width:el.clientWidth,scroll:el.scrollWidth,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,viewport:window.innerWidth}));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);expect(sizes.left).toBeGreaterThanOrEqual(0);expect(sizes.right).toBeLessThanOrEqual(sizes.viewport+1);
}
for(const size of [{width:320,height:640},{width:375,height:812},{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900},{width:1920,height:1080},{width:844,height:390}]){
  test(`support guest responsive ${size.width}x${size.height}`,async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize(size);await page.goto('/classes');
    await page.getByRole('button',{name:'باز کردن پشتیبانی نیمکت'}).click();
    const dialog=page.getByRole('dialog',{name:'دستیار هوشمند نیمکت'});await expect(dialog).toBeVisible();
    await expect(dialog.getByText('بیایید گفتگو کنیم.')).toBeVisible();
    await expect(dialog.getByRole('button',{name:'شروع گفتگو ←'})).toBeVisible();
    await noOverflow(page,'.support-widget');
    const bounds=await dialog.boundingBox();expect(bounds!.y).toBeGreaterThanOrEqual(0);expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(size.height+1);
    await page.getByRole('button',{name:'بستن پشتیبانی'}).focus();
    await page.keyboard.press('Shift+Tab');await expect(dialog.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
    await expect(page.getByRole('button',{name:'باز کردن پشتیبانی نیمکت'})).toBeFocused();expect(errors).toEqual([]);
  });
}
test('mobile user → escalation → admin reply, knowledge editing and closed history',async({browser})=>{
  const uctx=await browser.newContext({baseURL,viewport:{width:375,height:812}}),actx=await browser.newContext({baseURL,viewport:{width:390,height:844}});
  try{
    await uctx.addCookies(studentCookies);await actx.addCookies(adminCookies);
    const user=await uctx.newPage(),staff=await actx.newPage();
    const errors:string[]=[];user.on('pageerror',e=>errors.push(e.message));staff.on('pageerror',e=>errors.push(e.message));
    await user.goto('/classes');await user.getByRole('button',{name:'باز کردن پشتیبانی نیمکت'}).click();
    await user.getByRole('button',{name:'شروع یا ادامه گفتگو'}).click();
    await expect(user.locator('.support-message-list')).toContainText(keyword);await noOverflow(user,'.support-widget');await noOverflow(user,'.support-message-list');
    await user.getByLabel('پیام پشتیبانی',{exact:true}).fill('لطفاً درخواست را بررسی کنید.');await user.getByRole('button',{name:'ارسال پیام',exact:true}).click();await expect(user.locator('.support-message-list')).toContainText('لطفاً درخواست را بررسی کنید.');
    await staff.goto('/admin/support');await expect(staff.getByRole('heading',{level:1})).toBeVisible();await noOverflow(staff,'.support-admin');
    // Find this request with the exact ID to avoid unrelated development records.
    await staff.getByRole('searchbox',{name:'جستجوی درخواست با نام یا شناسه'}).fill(threadId);
    const row=staff.locator('.support-thread-row').first();await expect(row).toBeVisible();await row.click();
    await expect(staff.locator('.support-inbox-list')).toBeHidden();await expect(staff.getByLabel('پاسخ کارشناس',{exact:true})).toBeVisible();
    await staff.getByLabel('پاسخ کارشناس',{exact:true}).fill('پاسخ کارشناس: درخواست شما بررسی شد.');
    await staff.getByLabel('بستن درخواست پس از پاسخ').check();await staff.getByRole('button',{name:'ارسال پیام',exact:true}).click();
    await expect(staff.locator('.support-conversation')).toContainText('این درخواست بسته شده');
    await user.getByRole('button',{name:'تازه‌سازی',exact:true}).click();await expect(user.locator('.support-message-list')).toContainText('پاسخ کارشناس: درخواست شما بررسی شد.');
    await expect(user.getByRole('button',{name:'درخواست جدید',exact:true})).toBeVisible();
    for(const size of [{width:320,height:640},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900},{width:1920,height:1080}]){await staff.setViewportSize(size);await noOverflow(staff,'.support-admin');await noOverflow(staff,'.support-inbox');await noOverflow(staff,'.support-message-list');if(size.width>=900)await expect(staff.locator('.support-inbox-list')).toBeVisible();}
    await staff.setViewportSize({width:375,height:812});await staff.getByRole('button',{name:'بازگشت به فهرست درخواست‌ها'}).click();await expect(staff.locator('.support-inbox-list')).toBeVisible();
    await staff.getByRole('button',{name:'دانش دستیار',exact:true}).click();await noOverflow(staff,'.support-knowledge');
    await staff.locator('.support-article-row').filter({hasText:keyword}).click();await staff.getByLabel('پاسخ تأییدشده').fill('راهنمای ویرایش‌شده توسط مدیر.');await staff.getByRole('button',{name:'ذخیره راهنما'}).click();await expect(staff.getByRole('status')).toContainText('راهنما ذخیره شد');
    expect(errors).toEqual([]);
  }finally{await uctx.close().catch(()=>{});await actx.close().catch(()=>{});}
});

test('teaching desk and reservation schedule remain usable from 320px to desktop',async({page})=>{
 await page.context().addCookies(adminCookies);
 for(const width of [320,375,768,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/admin/teaching');
  await expect(page.getByRole('heading',{name:'مدیریت مدرس و برنامه جلسات'})).toBeVisible();
  await expect(page.getByRole('button',{name:'بررسی تداخل و انتشار'})).toBeVisible();await noOverflow(page,'.teaching-page');
  await page.goto('/classes/5');await expect(page.getByText('انتخاب زمان جلسات',{exact:true})).toBeVisible();
  await noOverflow(page,'.booking-box');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 }
});

test('editor can save and publish a real article, and answer a phone guest from the inbox',async({page,request})=>{
 await page.context().addCookies(adminCookies);await page.setViewportSize({width:390,height:844});await page.goto('/admin/blog');
 page.on('dialog',d=>d.accept());const form=page.locator('.blog-editor');const slug=`browser-article-${Date.now()}`;
 await form.getByLabel('عنوان مقاله',{exact:true}).fill('یادداشت آزمایشی انتشار واقعی');await form.getByLabel('شناسه انگلیسی URL').fill(slug);await form.getByLabel('خلاصه مقاله',{exact:true}).fill('خلاصهٔ معتبر برای بررسی انتشار مقاله و نگهداری پیش‌نویس در مجله نیمکت.');
 await form.getByLabel('عنوان بخش',{exact:true}).fill('یک بخش کاربردی');await form.getByLabel('متن بخش',{exact:true}).fill('این یک متن آموزشی برای آزمون جریان واقعی ذخیره و انتشار مقاله است.');await form.getByRole('button',{name:'ذخیره پیش‌نویس',exact:true}).click();await expect(page.getByRole('status')).toContainText('پیش‌نویس ذخیره شد');expect((await request.get(`/blog/${slug}`)).status()).toBe(404);
 await form.getByRole('button',{name:'انتشار نسخه ذخیره‌شده',exact:true}).click();await expect(page.getByRole('status')).toContainText('منتشر شد');expect(await(await request.get(`/blog/${slug}`)).text()).toContain('یادداشت آزمایشی انتشار واقعی');
 await form.getByRole('button',{name:'خروج از انتشار',exact:true}).click();await expect(page.getByRole('status')).toContainText('از انتشار خارج شد');
 const guest=await(await request.post('/api/support/guest/start',{data:{phone:'09121119999',name:'مهمان آزمون پاسخ',consent:true}})).json();
 await request.post(`/api/support/guest/threads/${guest.thread.id}/escalate`,{headers:{'X-Support-Token':guest.token},data:{}});
 await page.goto('/admin/support');await page.getByRole('button',{name:'گفتگوهای مهمان با شماره',exact:true}).click();await page.getByRole('searchbox',{name:'جستجوی درخواست با نام یا شناسه'}).fill(guest.thread.id);await page.locator('.support-thread-row').first().click();await expect(page.locator('.support-detail-header')).toContainText('09121119999');
 await page.getByLabel('پاسخ کارشناس',{exact:true}).fill('پاسخ کارشناس برای مهمان ثبت شد.');await page.getByLabel('بستن درخواست پس از پاسخ').check();await page.getByRole('button',{name:'ارسال پیام',exact:true}).click();await expect(page.locator('.support-conversation')).toContainText('این درخواست بسته شده');
 const transcript=await(await request.get(`/api/support/guest/threads/${guest.thread.id}`,{headers:{'X-Support-Token':guest.token}})).json();expect(transcript.messages.at(-1).kind).toBe('agent');
});
