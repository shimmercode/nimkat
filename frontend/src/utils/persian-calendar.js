const DAY=86400000;
const formatter=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric',numberingSystem:'latn'});
const parts=t=>Object.fromEntries(formatter.formatToParts(t).filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,Number(p.value)]));
export function persianMonthBounds(offset=0,now=Date.now()){
 const p=parts(now),target=p.year*12+p.month-1+offset;
 function start(month){let lo=Math.floor(now/DAY)-Math.abs(offset)*32-800,hi=Math.floor(now/DAY)+Math.abs(offset)*32+800;while(lo<hi){const mid=Math.floor((lo+hi)/2),d=parts(mid*DAY),key=d.year*12+d.month-1;if(key<month)lo=mid+1;else hi=mid;}return lo*DAY-210*60000;}
 return {from:start(target),to:start(target+1)};
}
