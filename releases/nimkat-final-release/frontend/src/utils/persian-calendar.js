const DAY = 86400000;

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
];

export const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  timeZone: 'Asia/Tehran',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  numberingSystem: 'latn',
});

const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Tehran',
  weekday: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
  timeZone: 'Asia/Tehran',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const EN_WEEKDAY_TO_SAT_INDEX = {
  Sat: 0,
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
};

const parts = (t) =>
  Object.fromEntries(
    formatter
      .formatToParts(t)
      .filter((p) => ['year', 'month', 'day'].includes(p.type))
      .map((p) => [p.type, Number(p.value)])
  );

/**
 * Returns exact UTC epoch millisecond bounds `{ from, to }` for a Persian month
 * at `offset` months from `now`, aligned to `00:00:00` Asia/Tehran (`20:30:00Z` prior day).
 */
export function persianMonthBounds(offset = 0, now = Date.now()) {
  const p = parts(now);
  const target = p.year * 12 + p.month - 1 + offset;
  function start(month) {
    let lo = Math.floor(now / DAY) - Math.abs(offset) * 32 - 800;
    let hi = Math.floor(now / DAY) + Math.abs(offset) * 32 + 800;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const d = parts(mid * DAY);
      const key = d.year * 12 + d.month - 1;
      if (key < month) lo = mid + 1;
      else hi = mid;
    }
    return lo * DAY - 210 * 60000;
  }
  return { from: start(target), to: start(target + 1) };
}

/**
 * Extracts Jalali `{ year, month, day, monthName, weekdayIndex, weekdayName, dateKey }`
 * in `Asia/Tehran` for any UTC epoch timestamp `t`.
 * `weekdayIndex` is 0 for Saturday (`شنبه`) through 6 for Friday (`جمعه`).
 */
export function toPersianDateParts(t) {
  const { year, month, day } = parts(t);
  const wdShort = weekdayFormatter.format(t);
  const weekdayIndex = EN_WEEKDAY_TO_SAT_INDEX[wdShort] ?? 0;
  const weekdayName = PERSIAN_WEEKDAYS[weekdayIndex];
  const monthName = PERSIAN_MONTH_NAMES[month - 1] || '';
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { year, month, day, monthName, weekdayIndex, weekdayName, dateKey };
}

/**
 * Builds a complete Jalali monthly calendar model for `offset` months from `now`.
 * Includes exact day bounds (`startTs`, `endTs`), `daysInMonth` (29/30/31 including leap years),
 * Saturday-first `startWeekday` (`0..6`), and `isToday` flag.
 */
export function persianMonthGrid(offset = 0, now = Date.now()) {
  const { from, to } = persianMonthBounds(offset, now);
  const todayParts = toPersianDateParts(now);
  const firstDayParts = toPersianDateParts(from + 12 * 3600000);
  const daysInMonth = Math.round((to - from) / DAY);
  const days = [];

  for (let i = 0; i < daysInMonth; i++) {
    const startTs = from + i * DAY;
    const endTs = startTs + DAY;
    const midParts = toPersianDateParts(startTs + 12 * 3600000);
    days.push({
      day: midParts.day,
      month: midParts.month,
      year: midParts.year,
      monthName: midParts.monthName,
      dateKey: midParts.dateKey,
      weekdayIndex: midParts.weekdayIndex,
      weekdayName: midParts.weekdayName,
      startTs,
      endTs,
      isToday: midParts.dateKey === todayParts.dateKey,
    });
  }

  return {
    year: firstDayParts.year,
    month: firstDayParts.month,
    monthName: firstDayParts.monthName,
    from,
    to,
    daysInMonth,
    startWeekday: firstDayParts.weekdayIndex,
    todayDateKey: todayParts.dateKey,
    days,
  };
}

/**
 * Formats a session timestamp in `Asia/Tehran` Jalali calendar with time.
 */
export function formatPersianDateTime(t) {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(t);
}

export const formatJalaliDateTime = formatPersianDateTime;

export function formatTehranTime(t) {
  return timeFormatter.format(t);
}

/**
 * Formats the time range (`HH:mm تا HH:mm`) in `Asia/Tehran` and duration in minutes.
 */
export function formatTehranTimeRange(startsAt, endsAt) {
  const startStr = timeFormatter.format(startsAt);
  const endStr = timeFormatter.format(endsAt);
  const durationMin = Math.max(1, Math.round((endsAt - startsAt) / 60000));
  return {
    startTime: startStr,
    endTime: endStr,
    durationMin,
    label: `${startStr} تا ${endStr}`,
  };
}

/**
 * Converts a local datetime input string (`YYYY-MM-DDTHH:mm`) in Asia/Tehran (+03:30)
 * to UTC epoch milliseconds.
 */
export function tehranInputToUtcMs(value) {
  if (!value || typeof value !== 'string') return NaN;
  const trimmed = value.trim();
  if (/Z$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return Date.parse(trimmed);
  }
  return Date.parse(`${trimmed}+03:30`);
}
