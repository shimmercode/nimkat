// Browser autofill and Persian/Arabic keyboards must use the same canonical digits.
export const loginDigits = value => String(value ?? '').replace(/[۰-۹٠-٩]/g, d => String(d.charCodeAt(0) >= 1776 ? d.charCodeAt(0)-1776 : d.charCodeAt(0)-1632)).replace(/\D/g, '');
export function loginMobile(value) {
  let digits=loginDigits(value);
  if(digits.startsWith('0098'))digits='0'+digits.slice(4);
  else if(digits.startsWith('98'))digits='0'+digits.slice(2);
  return digits.slice(0,11);
}
export function otpInput(code,index,value){
  const digits=loginDigits(value);
  if(digits.length>=5)return {code:digits.slice(0,5).split(''),focus:4};
  const next=[...code];next[index]=digits.slice(-1);return {code:next,focus:digits?Math.min(index+1,4):index};
}
