/* Persian digit helpers */
const FA_DIGITS = Array.from({ length: 10 }, (_, i) => String.fromCharCode(0x06f0 + i)).join('');

/** Convert latin digits of any value to persian digits */
export const faNum = (value) =>
  String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** Format a number as persian money string: 1296000 -> ۱٬۲۹۶٬۰۰۰ */
export const faPrice = (n) =>
  faNum(Math.round(n).toLocaleString('en-US')).replace(/,/g, '٬');
