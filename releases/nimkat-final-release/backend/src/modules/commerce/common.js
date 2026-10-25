const crypto=require('node:crypto');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const safe=fn=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
const key=v=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]{16,100}$/.test(v))fail('شناسهٔ یکتای معتبر لازم است.');return v;};
const number=(v,min=1,max=1e9)=>{if(!Number.isSafeInteger(v)||v<min||v>max)fail('عدد خارج از محدوده است.');return v;};
const text=(v,min=1,max=1000)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)fail('متن معتبر لازم است.');return v.trim();};
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const page=req=>number(Number(req.query.offset||0),0,100000);
const uuid=()=>crypto.randomUUID();
function iban(v){v=String(v||'').replace(/\s/g,'').toUpperCase();if(!/^IR\d{24}$/.test(v))fail('شبای IR با ۲۴ رقم لازم است.');let mod=0;for(const c of v.slice(4)+v.slice(0,4)){const part=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;for(const d of part)mod=(mod*10+Number(d))%97;}if(mod!==1)fail('شماره شبا معتبر نیست.');return v;}
module.exports={fail,safe,key,number,text,hash,page,uuid,iban};
