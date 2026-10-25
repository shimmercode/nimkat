import {test,expect} from '@playwright/test';

test('late anonymous bootstrap cannot undo a completed OTP login',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  let release!:()=>void;const hold=new Promise<void>(r=>release=r);let intercepted=false;
  await page.route('**/api/auth/me',async route=>{if(!intercepted){intercepted=true;await hold;await route.fulfill({json:{user:null}});}else await route.continue();});
  await page.goto('/login');
  const mobile=`0936${Date.now().toString().slice(-7)}`;
  await page.getByLabel('شماره موبایل',{exact:true}).fill(mobile);
  const response=page.waitForResponse(r=>r.url().includes('/auth/otp/request'));
  await page.getByRole('button',{name:'ارسال کد تأیید'}).click();
  const otp=await(await response).json();
  const boxes=page.locator('.otp-boxes input');await expect(boxes).toHaveCount(5);
  const code=otp.devCode;expect(code).toBeTruthy();
  for(let i=0;i<5;i++)await boxes.nth(i).fill(code![i]);
  await page.getByRole('button',{name:'تأیید و ورود'}).click();
  await expect(page).toHaveURL(/\/panel$/);release();
  await expect(page.getByRole('button',{name:'باز کردن پشتیبانی نیمکت'})).toBeVisible();
  await page.reload();await expect(page).toHaveURL(/\/panel$/);
  const me=await page.evaluate(async()=>await(await fetch('/api/auth/me')).json());expect(me.user?.mobile).toBe(mobile);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
for(const width of [320,375,768,1024,1440])test(`hero fields work and inherit Yekan at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/');
  const search=page.getByRole('form',{name:'جستجوی کلاس'}).first();await expect(search).toBeVisible();
  await search.getByRole('combobox',{name:'نوع کلاس',exact:true}).selectOption('گروهی');
  await search.getByRole('combobox',{name:'مقطع',exact:true}).selectOption('متوسطه دوم');
  await search.getByRole('combobox',{name:'درس',exact:true}).selectOption('ریاضی');
  await search.getByRole('button',{name:'حضوری',exact:true}).click();
  expect(await search.getByRole('combobox',{name:'درس',exact:true}).evaluate(el=>getComputedStyle(el).fontFamily)).toContain('YekanBakh');
  const bounds=await search.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width+1);
  await search.getByRole('button',{name:'جستجو',exact:true}).click();await expect(page).toHaveURL(/\/classes\?/);
  expect(new URL(page.url()).searchParams.get('subject')).toBe('ریاضی');
  await expect(page.getByRole('combobox',{name:'درس',exact:true})).toHaveValue('ریاضی');
  await expect(page.getByRole('button',{name:'حضوری',exact:true}).first()).toHaveClass(/is-active/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});

test('OTP session survives reload inside a cross-site preview iframe',async({page})=>{
 await page.route('http://127.0.0.1:5173/embedded-login-test',route=>route.fulfill({contentType:'text/html',body:'<iframe title="Preview" src="http://localhost:5173/login" style="width:100%;height:900px;border:0"></iframe>'}));
 await page.goto('http://127.0.0.1:5173/embedded-login-test');
 const frame=page.frameLocator('iframe');const mobile=`0937${Date.now().toString().slice(-7)}`;
 await frame.getByLabel('شماره موبایل',{exact:true}).fill(mobile);
 const response=page.waitForResponse(r=>r.url().includes('/auth/otp/request'));
 await frame.getByRole('button',{name:'ارسال کد تأیید'}).click();const otp=await(await response).json();expect(otp.devCode).toBeTruthy();
 for(let i=0;i<5;i++)await frame.locator('.otp-boxes input').nth(i).fill(otp.devCode[i]);
 await frame.getByRole('button',{name:'تأیید و ورود'}).click();
 await expect(frame.locator('.panel-page')).toBeVisible();
 const child=page.frames().find(f=>f.url().includes('localhost:5173/panel'))!;
 await Promise.all([child.waitForNavigation({waitUntil:'load'}),child.evaluate(()=>window.location.reload())]);await expect(frame.locator('.panel-page')).toBeVisible();
 const me=await child.evaluate(async()=>await(await fetch('/api/auth/me')).json());expect(me.user.mobile).toBe(mobile);
});

test('blocked cookies give a clear error instead of an endless panel/login bounce',async({page})=>{
 await page.route('**/api/auth/otp/verify',r=>r.fulfill({json:{ok:true,user:{id:987654,name:'Test',role:'student'}}}));
 await page.goto('/login');await page.getByLabel('شماره موبایل',{exact:true}).fill(`0939${Date.now().toString().slice(-7)}`);await page.getByRole('button',{name:'ارسال کد تأیید'}).click();await expect(page.locator('.otp-boxes input')).toHaveCount(5);
 for(let i=0;i<5;i++)await page.locator('.otp-boxes input').nth(i).fill('1');await page.getByRole('button',{name:'تأیید و ورود'}).click();await expect(page.locator('body')).toContainText('کوکی ورود را ذخیره نکرد');await expect(page).toHaveURL(/\/login$/);
});

test('SMS autofill accepts the full Arabic code and international phone number, then persists a real panel session',async({page})=>{
 await page.goto('/login');const mobile=`0934${Date.now().toString().slice(-7)}`;await page.getByLabel('شماره موبایل',{exact:true}).fill('+98'+mobile.slice(1));await expect(page.getByLabel('شماره موبایل',{exact:true})).toHaveValue(mobile);const response=page.waitForResponse(r=>r.url().includes('/auth/otp/request'));await page.getByRole('button',{name:'ارسال کد تأیید'}).click();const {devCode}=await(await response).json();expect(devCode).toBeTruthy();await page.locator('.otp-boxes input').first().fill(devCode.replace(/\d/g,(d:string)=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]));await expect(page.getByRole('button',{name:'تأیید و ورود'})).toBeEnabled();await page.getByRole('button',{name:'تأیید و ورود'}).click();await expect(page).toHaveURL(/\/panel$/);await expect(page.getByRole('heading',{name:'داشبورد شاگرد',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'داشبورد شاگرد',exact:true})).toBeVisible();await page.goto('/panel/calendar');await expect(page.getByRole('heading',{name:'تقویم و کلاس‌های من'})).toBeVisible();await page.goto('/panel/finance');await expect(page.getByRole('heading',{name:'امور مالی و رزروها'})).toBeVisible();
});
test('delayed refresh cookie clearing finishes before OTP creates the new session',async({page})=>{
 let release!:()=>void;const hold=new Promise<void>(r=>release=r);let started=false,me=0,verified=0;page.on('request',r=>{if(r.url().includes('/auth/otp/verify'))verified++;});
 await page.route('**/api/auth/me',async r=>{if(me++<2)await r.fulfill({status:401,json:{code:'ACCESS_EXPIRED'}});else await r.continue();});await page.route('**/api/auth/refresh',async r=>{started=true;await hold;await r.fulfill({status:401,headers:{'Set-Cookie':'nk_access=; Max-Age=0; Path=/api; Secure; HttpOnly; SameSite=None; Partitioned'},json:{code:'UNAUTHENTICATED'}});});
 await page.goto('/login');await expect.poll(()=>started).toBe(true);await page.getByLabel('شماره موبایل',{exact:true}).fill(`0933${Date.now().toString().slice(-7)}`);const response=page.waitForResponse(r=>r.url().includes('/auth/otp/request'));await page.getByRole('button',{name:'ارسال کد تأیید'}).click();const {devCode}=await(await response).json();await page.locator('.otp-boxes input').first().fill(devCode);await page.getByRole('button',{name:'تأیید و ورود'}).click();await expect(page.getByRole('button',{name:'تأیید و ورود'})).toBeDisabled();expect(verified).toBe(0);release();await expect(page).toHaveURL(/\/panel$/);expect(verified).toBe(1);await page.reload();await expect(page).toHaveURL(/\/panel$/);
});

test('PWA offline screen never substitutes cached personal data or a successful payment',async({page,context,request})=>{
 const manifest=await(await request.get('/manifest.webmanifest')).json();expect(manifest.display).toBe('standalone');expect(manifest.lang).toBe('fa');await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.goto('/panel/finance');await expect(page.getByRole('heading',{name:'اتصال به نیمکت برقرار نیست'})).toBeVisible();await expect(page.locator('body')).toContainText('هیچ رزرو یا پرداختی در حالت آفلاین تأیید نمی‌شود');await context.setOffline(false);
});

test('initial OTP focus never jumps back during rapid keyboard entry',async({page})=>{
 await page.goto('/login');await page.getByLabel('شماره موبایل',{exact:true}).fill(`0938${Date.now().toString().slice(-7)}`);const response=page.waitForResponse(r=>r.url().includes('/auth/otp/request'));await page.getByRole('button',{name:'ارسال کد تأیید',exact:true}).click();const otp=await(await response).json();expect(otp.devCode).toBeTruthy();await page.locator('.otp-boxes input').first().pressSequentially(otp.devCode,{delay:25});const values=await page.locator('.otp-boxes input').evaluateAll(nodes=>nodes.map(n=>(n as HTMLInputElement).value));expect(values.join('').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776))).toBe(otp.devCode);await expect(page.getByRole('button',{name:'تأیید و ورود',exact:true})).toBeEnabled();await page.getByRole('button',{name:'تأیید و ورود',exact:true}).click();await expect(page).toHaveURL(/\/panel$/);
});
