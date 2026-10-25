const assert=require('node:assert/strict');
const profile={fullName:'مدرس آزمون',displayName:'مدرس آزمون',province:'تهران',city:'تهران',email:'teacher@example.test',degree:'کارشناسی ارشد',university:'دانشگاه نمونه',educationField:'آموزش ریاضی',subject:'ریاضی',grades:'متوسطه دوم',languages:'فارسی',experienceYears:5,bio:'سوابق تدریس و تجربه آموزشی برای بررسی واقعی پرونده توسط مدیر.',modes:['online'],classKinds:['private','group'],timezone:'Asia/Tehran',availability:'شنبه تا چهارشنبه بعد از ساعت شانزده',equipment:'رایانه، دوربین و میکروفون برای کلاس آموزشی',connection:'اینترنت ثابت و فضای آرام برای تدریس آنلاین',videoUrl:'https://www.aparat.com/v/test123',teachingApproach:'آموزش تعاملی با مثال و تمرین و پاسخ به پرسش شاگردان',assessmentApproach:'ارزیابی مستمر و بازخورد سازنده با پیگیری تکالیف در هر جلسه',qualifications:'شرح مدارک و سوابقی که اصل آن‌ها باید توسط مدیر بررسی شوند.'};
const clauses=Array.from({length:7},(_,i)=>`بند آزمایشی ${i+1}: این متن صرفاً دادهٔ آزمون است و توافق‌نامه حقوقی واقعی نیست.`);
async function onboard(f,uid=4){
 let a=(await f.request('/admin/teaching',undefined,3)).data.agreement;
 if(!a.published){const r=await f.request('/admin/teaching/agreement',{version:a.version,title:'توافق‌نامه صرفاً آزمایشی',clauses,published:true},3,'PUT');assert.equal(r.status,200);a=r.data.agreement;}
 const d=(await f.request('/teacher/onboarding',undefined,uid)).data.draft;
 const saved=await f.request('/teacher/onboarding',{version:d.version,step:11,profile},uid,'PUT');assert.equal(saved.status,200);
 const sent=await f.request('/teacher/onboarding/submit',{version:saved.data.draft.version,agreementVersion:a.version,acceptedClauses:[0,1,2,3,4,5,6],attested:true,submissionKey:`test_onboarding_key_${uid}_${d.version}`},uid);assert.equal(sent.status,200);return sent.data;
}
module.exports={profile,clauses,onboard};
