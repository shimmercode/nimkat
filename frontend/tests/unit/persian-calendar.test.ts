import { describe, expect, it } from 'vitest';
import {
  persianMonthBounds,
  persianMonthGrid,
  toPersianDateParts,
  formatTehranTimeRange,
  tehranInputToUtcMs,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAYS,
} from '../../src/utils/persian-calendar.js';

describe('Jalali (Persian) Calendar & Asia/Tehran Timezone Accuracy', () => {
  it('navigates true Persian months at Tehran midnight, including leap-year boundaries', () => {
    const format = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
    for (const offset of [-15, -1, 0, 1, 15]) {
      const { from, to } = persianMonthBounds(offset, Date.parse('2026-10-20T12:00:00Z'));
      expect(format.formatToParts(from).find((p) => p.type === 'day')?.value).toBe('1');
      expect(format.formatToParts(to).find((p) => p.type === 'day')?.value).toBe('1');
      expect([29, 30, 31]).toContain((to - from) / 86400000);
      expect(new Date(from).toISOString()).toContain('20:30:00');
    }
  });

  it('accurately computes Esfand 1403 leap year (30 days) vs Esfand 1404 non-leap year (29 days) and year rollover to Farvardin', () => {
    // 2025-03-01T12:00:00Z is in Esfand 1403 (leap year: 30 days)
    const esfand1403 = persianMonthGrid(0, Date.parse('2025-03-01T12:00:00Z'));
    expect(esfand1403.year).toBe(1403);
    expect(esfand1403.month).toBe(12);
    expect(esfand1403.monthName).toBe('اسفند');
    expect(esfand1403.daysInMonth).toBe(30);
    expect(esfand1403.days[29].day).toBe(30);

    // Next month (+1) rolls over to Farvardin 1404 (31 days)
    const farvardin1404 = persianMonthGrid(1, Date.parse('2025-03-01T12:00:00Z'));
    expect(farvardin1404.year).toBe(1404);
    expect(farvardin1404.month).toBe(1);
    expect(farvardin1404.monthName).toBe('فروردین');
    expect(farvardin1404.daysInMonth).toBe(31);

    // 2026-03-01T12:00:00Z is in Esfand 1404 (non-leap year: 29 days)
    const esfand1404 = persianMonthGrid(0, Date.parse('2026-03-01T12:00:00Z'));
    expect(esfand1404.year).toBe(1404);
    expect(esfand1404.month).toBe(12);
    expect(esfand1404.daysInMonth).toBe(29);
  });

  it('maps Saturday-first weekdays (شنبه = 0 .. جمعه = 6) and handles near-midnight Tehran sessions accurately', () => {
    expect(PERSIAN_WEEKDAYS[0]).toBe('شنبه');
    expect(PERSIAN_WEEKDAYS[6]).toBe('جمعه');
    expect(PERSIAN_MONTH_NAMES).toHaveLength(12);

    // 2026-10-23T20:29:59Z is 23:59:59 Friday in Tehran (1 Aban 1405)
    const beforeMidnight = toPersianDateParts(Date.parse('2026-10-23T20:29:59Z'));
    // 2026-10-23T20:30:01Z is 00:00:01 Saturday in Tehran (2 Aban 1405)
    const afterMidnight = toPersianDateParts(Date.parse('2026-10-23T20:30:01Z'));

    expect(beforeMidnight.weekdayName).toBe('جمعه');
    expect(beforeMidnight.weekdayIndex).toBe(6);
    expect(afterMidnight.weekdayName).toBe('شنبه');
    expect(afterMidnight.weekdayIndex).toBe(0);
    expect(afterMidnight.day).toBe(beforeMidnight.day + 1);
  });

  it('converts Tehran datetime-local inputs to UTC and formats session time ranges with duration', () => {
    const startUtc = tehranInputToUtcMs('2026-10-26T16:00');
    const endUtc = tehranInputToUtcMs('2026-10-26T17:30');
    expect(endUtc - startUtc).toBe(90 * 60000);
    // 16:00 Tehran (+03:30) == 12:30 UTC
    expect(new Date(startUtc).toISOString()).toBe('2026-10-26T12:30:00.000Z');

    const range = formatTehranTimeRange(startUtc, endUtc);
    expect(range.durationMin).toBe(90);
    expect(range.label).toContain('تا');
  });
});
