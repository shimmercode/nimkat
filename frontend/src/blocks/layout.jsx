'use client';
export function LayoutBlock({children}){return <>{children}</>;}
export const layoutSpec={label:'کانتینر منعطف / شبکه',category:'لایه‌بندی',container:true,defaults:{label:'کانتینر'},fields:[{key:'label',label:'نام لایه',type:'text'}]};
export function SlotBlock(){return <div className="container section"><b>محتوای پویای مجله</b><p>فهرست یا متن مقاله در سایت از تحریریه نمایش داده می‌شود؛ بلوک‌های اطراف آن قابل چیدمان هستند.</p></div>;}
export const slotSpec={label:'محتوای پویای مجله (محافظت‌شده)',category:'صفحات پویا',defaults:{},fields:[]};
