import {expect,it} from 'vitest';
import {loginMobile,loginDigits,otpInput} from '../../src/utils/login-input.js';
it('accepts Persian/Arabic digits and Iranian international mobile numbers',()=>{expect(loginMobile('+۹۸ ۹۱۲ ۱۲۳ ۴۵۶۷')).toBe('09121234567');expect(loginMobile('٠٠٩٨٩١٢١٢٣٤٥٦٧')).toBe('09121234567');expect(loginDigits('۱۲٣۴٥')).toBe('12345');});
it('accepts the entire SMS autofill code in a single input instead of losing four digits',()=>{expect(otpInput(['','','','',''],0,'۱۲٣۴٥')).toEqual({code:['1','2','3','4','5'],focus:4});expect(otpInput(['1','','','',''],1,'۲').code).toEqual(['1','2','','','']);});
