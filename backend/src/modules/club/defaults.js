// Values transcribed from Nimkat-Club-Report.html; all are editable in club admin.
const rule=(id,title,role,event,coins,points,extra={})=>({id,title,role,event,coins,points,every:1,period:'all',cap:0,enabled:true,startsAt:null,endsAt:null,...extra});
const levels=[
 ['bronze','برنزی',0,0,['مأموریت‌های روزانه','نشان برنزی','کیف سکه','راهنماهای رایگان','چالش عمومی']],
 ['silver','نقره‌ای',1000,50,['مأموریت‌های هفتگی','نشان نقره‌ای','وبینارهای منتخب']],
 ['gold','طلایی',2500,100,['نشان طلایی','مأموریت مناسبتی','واجد شرایط مزایای طلایی']],
 ['platinum','پلاتینیوم',5000,400,['نشان پلاتینیوم','واجد شرایط رویداد اختصاصی و پشتیبانی اولویت‌دار']],
 ['ambassador','سفیر نیمکت',10000,600,['نشان سفیر','واجد شرایط برنامه سفیران و مشاوره']],
].map(([id,name,minPoints,giftCoins,benefits])=>({id,name,minPoints,giftCoins,benefits}));
const rules=[
 rule('s-profile','تکمیل پروفایل','student','profile.completed',10,50,{cap:1}),
 rule('s-first','اولین کلاس موفق','student','class.completed',20,100,{cap:1}),
 rule('s-class','هر کلاس موفق','student','class.completed',10,50),
 rule('s-group','کلاس گروهی موفق','student','class.group',15,60),
 rule('s-ref-signup','ثبت‌نام معتبر دوست','student','referral.registered',30,100),
 rule('s-ref-first','اولین کلاس دوست','student','referral.first',40,100),
 rule('s-ref-three','سومین کلاس دوست','student','referral.three',120,300),
 rule('s-survey','نظرسنجی معتبر پایان کلاس','student','survey.submitted',5,10),
 rule('s-chat','مشارکت مفید نیم‌چت','student','chat.helpful',5,20,{period:'weekly',cap:3}),
 rule('s-progress','پیشرفت تحصیلی ماهانه','student','academic.progress',50,300,{period:'monthly',cap:1}),
 rule('s-medal','کسب مدال','student','medal.earned',10,200),
 rule('s-seasonal','مأموریت مناسبتی','student','seasonal.completed',10,200),
 rule('s-question','پرسش معتبر در پروفایل استاد','student','question.validated',5,5,{period:'monthly',cap:10}),
 rule('s-rating','میانگین بازخورد بیش از ۴','student','rating.positive',10,30,{period:'monthly',cap:1}),
 rule('t-profile','تکمیل پروفایل','teacher','profile.completed',20,50,{cap:1}),
 rule('t-video','ویدئوی تأییدشدهٔ پروفایل','teacher','profile.video',30,50,{cap:1}),
 rule('t-class','هر جلسه موفق','teacher','class.completed',10,50),
 rule('t-rating','میانگین نظرسنجی بیش از ۴','teacher','rating.positive',10,100,{period:'monthly',cap:1}),
 rule('t-chat','هر ۱۰ مشارکت مفید تأییدشده','teacher','chat.helpful',20,50,{every:10}),
 rule('t-webinar','وبینار آموزشی تأییدشده','teacher','webinar.completed',40,200),
 rule('t-medal','کسب مدال','teacher','medal.earned',10,100),
 rule('t-seasonal','مأموریت مناسبتی','teacher','seasonal.completed',50,200),
 rule('t-answer','پاسخ معتبر در پروفایل','teacher','question.validated',5,5,{period:'monthly',cap:10}),
 rule('t-positive','شاخص مثبت توصیفی','teacher','feedback.positive',10,10,{every:5}),
];
for(const [n,c,p] of [[5,50,150],[10,120,300],[20,250,600],[50,800,1200],[100,2000,2500]])rules.push(rule(`s-${n}`,`${n} کلاس موفق`,'student','class.completed',c,p,{every:n,cap:1}));
for(const [n,c,p] of [[5,20,100],[10,40,200],[20,100,400],[50,300,800],[100,750,1500]])rules.push(rule(`t-${n}`,`${n} کلاس موفق`,'teacher','class.completed',c,p,{every:n,cap:1}));
const medals=[];
const medal=(id,title,role,event,target,extra={})=>medals.push({id,title,role,event,target,period:'all',minAverage:0,...extra});
for(const [id,title,target] of [['punctual','وقت‌شناس',5],['mastery','مسلط به تدریس',5],['kind','خوش‌برخورد',5],['followup','پیگیر',5],['patient','باحوصله',5],['value','بهینه‌آموز',5],['innovative','نوآور',5]])medal(`t-${id}`,title,'teacher',`feedback.${id}`,target);
medal('t-popular','محبوب','teacher','survey.received',10,{minAverage:4.7});
for(const [id,title,event,target] of [['help','همیار نیمکت','chat.helpful',10],['content','همسفر نیمکت','content.published',3],['ref','مبلغ نیمکت','referral.registered',5],['answer','پاسخگو','question.validated',15],['colleague','همکار نیمکت','teacher.referred',3]])medal(`t-${id}`,title,'teacher',event,target);
for(const [id,title] of [['focus','متمرکز'],['polite','مودب'],['active','فعال'],['prepared','آماده'],['order','منظم']])medal(`s-${id}`,title,'student',`feedback.${id}`,5);
for(const [id,title,event,target] of [['stars','شاگرد پنج‌ستاره','feedback.five',5],['help','همیار نیمکتی','chat.helpful',10],['ref','همسفر نیمکت','referral.first',3],['progress','پیشرفت','academic.progress',3],['question','پرسشگر','question.validated',4]])medal(`s-${id}`,title,'student',event,target);
medal('t-committed','متعهد','teacher','commitment.verified',1);
medals.find(m=>m.id==='t-content').period='monthly';
medal('s-streak3','پرتلاش','student','streak.weeks',3);medal('s-streak8','وفاداری','student','streak.weeks',8);
const rewards=[];
const reward=(id,title,role,cost,type,valueToman=0,extra={})=>rewards.push({id,title,role,cost,type,valueToman,stock:0,perUserLimit:1,enabled:false,minPoints:0,expiresAt:null,image:'/images/blog/learning.png',description:title,conditions:'نیازمند فعال‌سازی مدیر و موجودی؛ هر دریافت در تاریخچه ثبت می‌شود.',spinWeight:0,...extra});
for(const [percent,cap,cost] of [[5,40000,200],[10,70000,380],[20,80000,600],[25,100000,750],[30,120000,900],[50,250000,1400]])reward(`s-discount-${percent}`,`${percent}٪ تخفیف؛ سقف ${cap} تومان`,'student',cost,'discount',cap,{percent});
for(const [v,c] of [[100000,900],[200000,1700],[300000,2500]])reward(`s-wallet-${v}`,`شارژ کیف پول ${v} تومان`,'student',c,'wallet',v);
reward('s-golden','نیمکت طلایی؛ یک جلسه با استاد برتر','student',3500,'manual');reward('s-card','کارت نخبگان نیمکت','student',2000,'manual');reward('s-advice','یک جلسه مشاوره تحصیلی','student',500,'manual');reward('s-pack','پک لوازم‌التحریر؛ به‌زودی','student',0,'coming');
for(const [v,c] of [[100000,500],[200000,900],[300000,1300]])reward(`t-wallet-${v}`,`شارژ کیف پول ${v} تومان`,'teacher',c,'wallet',v);
reward('t-commission1','معافیت از کمیسیون یک جلسه','teacher',800,'commission',0,{percent:100,sessionLimit:1});reward('t-commission2','معافیت از کمیسیون دو جلسه','teacher',1500,'commission',0,{percent:100,sessionLimit:2});reward('t-profile','سفارشی‌سازی پروفایل سه روز','teacher',3000,'customization',0,{durationDays:3,style:'fresh'});reward('t-pack','پک تجهیزات کلاس؛ به‌زودی','teacher',0,'coming');
const missions=[
 {id:'s-week',title:'دو قدم در هفته',role:'student',period:'weekly',requirements:[{event:'class.completed',target:2}],coins:10,points:40,enabled:true,startsAt:null,endsAt:null},
 {id:'t-week',title:'هفتهٔ آموزش',role:'teacher',period:'weekly',requirements:[{event:'class.completed',target:2}],coins:10,points:40,enabled:true,startsAt:null,endsAt:null},
 {id:'s-month',title:'ماه پربازده',role:'student',period:'monthly',requirements:[{event:'class.completed',target:4},{event:'survey.submitted',target:1},{event:'challenge.completed',target:1}],coins:40,points:200,enabled:true,startsAt:null,endsAt:null},
];
module.exports={defaults:{levels,rules,medals,rewards,missions,budgetToman:0,leaderboardEnabled:false,spinEnabled:false,studentLikes:3,teacherLikes:5,progressPercent:10,studentSpinWeeks:4,teacherSpinClasses:8,positiveRating:4,minRatings:5,committedClasses:10,referralWindowHours:24,nearLevelPercent:10,nearMissionPercent:80}};
