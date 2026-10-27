import {test,expect} from '@playwright/test';

test('21st navigation: desktop main menu supports keyboard focus and real course filtering',async({page})=>{
 await page.goto('/');
 const nav=page.getByRole('navigation',{name:'منوی اصلی'});
 const classesLink=nav.getByRole('link',{name:'کلاس‌ها و اساتید',exact:true});
 await classesLink.focus();
 await expect(classesLink).toBeFocused();
 await expect(classesLink).toHaveAttribute('href','/classes');
 const groupLink=nav.getByRole('link',{name:'کلاس‌های گروهی',exact:true});
 await expect(groupLink).toHaveAttribute('href','/classes?kind=گروهی');
 await groupLink.click();
 await expect(page).toHaveURL(/classes\?kind=/);
});

test('21st mobile sheet traps focus, closes on Escape and navigates at narrow and landscape widths',async({page})=>{
 for(const size of [{width:320,height:640},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(size);await page.goto('/blog');
  const trigger=page.getByRole('button',{name:'فهرست صفحات'});await trigger.click();
  const sheet=page.getByRole('dialog',{name:'روی نیمکت، جا داری.'});await expect(sheet).toBeVisible();
  const box=await sheet.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);
  await page.getByRole('button',{name:'بستن فهرست'}).focus();await page.keyboard.press('Shift+Tab');
  await expect(sheet.locator(':focus')).toHaveCount(1);
  expect(await sheet.evaluate(e=>getComputedStyle(e).fontFamily)).toContain('YekanBakh');
  await page.keyboard.press('Escape');await expect(sheet).toBeHidden();await expect(trigger).toBeFocused();
  await trigger.click();await page.getByRole('dialog').getByRole('link',{name:'کلاس خصوصی',exact:true}).click();
  await expect(page).toHaveURL(/classes\?kind=/);await expect(page.getByRole('dialog')).toBeHidden();
 }
});

test('21st brand adaptations retain Yekan, tokens, functional CTA/footer and reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,768,1100,1280,1440,1920]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
  for(const selector of ['.site-header','.hero h1','.hero-search select','.callback h2','.site-footer h4']){
   expect(await page.locator(selector).first().evaluate(e=>getComputedStyle(e).fontFamily)).toContain('YekanBakh');
  }
  const orange=page.locator('.promo-dark .btn-orange').first();
  expect(await orange.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}))).toEqual({bg:'rgb(242, 138, 61)',color:'rgb(23, 33, 30)'});
 }
 await expect(page.getByRole('navigation',{name:'منوی اصلی'}).getByRole('link',{name:'نیم‌چت',exact:true})).toHaveAttribute('href','/login?next=/panel/chat');
 const footer=page.locator('.site-footer');
 await expect(footer.locator('a[href="#"]')).toHaveCount(0);
 await expect(footer.getByRole('link',{name:'سوالات متداول'})).toHaveAttribute('href','/faq');
 await page.getByRole('button',{name:'چت آنلاین',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'دستیار هوشمند نیمکت'})).toBeVisible();
 await page.getByRole('button',{name:'بستن پشتیبانی'}).click();
});
