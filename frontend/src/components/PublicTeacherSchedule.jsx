'use client';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Link } from '../routing/navigation';
import { faNum, faPrice } from '../utils/fa.js';
import { IconClock, IconCalendar, IconCheck } from './icons.jsx';

const formatFullDate = (t) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(t);

const formatShortDay = (t) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    month: 'long',
    day: 'numeric',
  }).format(t);

const WEEK_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];

export default function PublicTeacherSchedule({
  teacherId,
  initialData = null,
  title = 'زمان‌های آزاد هفته‌ی آینده',
  slots = [],
  selectedSlot = null,
  onSelectSlot = null,
  selectedOccurrenceIds = [],
  onToggleOccurrence = null,
  onAvailabilityChange = null,
  sessionMinutes = 90,
}) {
  const [data, setData] = useState(initialData);
  const [week, setWeek] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    if (onAvailabilityChange) {
      onAvailabilityChange((prev) => ({ ...(prev || {}), loading: true, error: '', week }));
    }
    api(`/teachers/${teacherId}/availability?week=${week}&offset=${offset}`)
      .then((d) => {
        if (!active) return;
        setData(d);
        setLoading(false);
        if (onAvailabilityChange) {
          onAvailabilityChange({ data: d, loading: false, error: '', week });
        }
      })
      .catch((e) => {
        if (!active) return;
        const msg = e.message || 'خطا در دریافت برنامهٔ زمانی استاد';
        setError(msg);
        setLoading(false);
        if (onAvailabilityChange) {
          onAvailabilityChange({ data: null, loading: false, error: msg, week });
        }
      });
    return () => {
      active = false;
    };
  }, [teacherId, week, offset]);

  const normalizedDays = WEEK_DAYS.map((dayName, idx) => {
    const found = (Array.isArray(slots) ? slots : []).find((s) => s.day === dayName);
    const dayTimestamp = data?.from ? data.from + idx * 86400000 : null;
    return {
      day: dayName,
      dateLabel: dayTimestamp ? formatShortDay(dayTimestamp) : '',
      times: found?.times || [],
    };
  });

  const hasWeeklySlots = Array.isArray(slots) && slots.some((s) => Array.isArray(s.times) && s.times.length > 0);

  return (
    <section
      className="card"
      id="slots"
      style={{ borderRadius: 'var(--r-2xl)', padding: 30, scrollMarginTop: 112 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div>
          <h2 className="t-h3" style={{ fontSize: 22 }}>
            {title}
          </h2>
          <p className="t-small t-muted" style={{ marginTop: 4 }}>
            تاریخ شمسی و ساعت تهران؛ زمان نمونه نمایش داده نمی‌شود. انتخاب زمان و قیمت نهایی در صفحهٔ رزرو دوباره بررسی می‌شود.
          </p>
        </div>

        <div className="operations-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={week === 0}
            onClick={() => {
              setWeek((v) => Math.max(0, v - 1));
              setOffset(0);
            }}
          >
            هفتهٔ قبل
          </button>
          <span className="chip outline num" style={{ fontWeight: 800 }}>
            <IconCalendar size={14} />{' '}
            {data ? `${formatShortDay(data.from)} تا ${formatShortDay(data.to)}` : `هفتهٔ ${faNum(week + 1)} از ۱۳`}
          </span>
          <span className="t-caption t-muted num">{`${faNum(week + 1)} از ۱۳`}</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={week === 12}
            onClick={() => {
              setWeek((v) => Math.min(12, v + 1));
              setOffset(0);
            }}
          >
            هفتهٔ بعد
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="card-soft"
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: 'var(--error-50)',
            color: 'var(--error)',
            fontWeight: 700,
            fontSize: 13.5,
          }}
        >
          {error}
        </div>
      )}

      {hasWeeklySlots && (
        <div
          className="slot-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            marginTop: 16,
            marginBottom: 20,
          }}
        >
          {normalizedDays.map((d) => {
            const hasActiveInDay =
              selectedSlot && selectedSlot.day === d.day;
            return (
              <div
                key={d.day}
                className="slot-day"
                style={{
                  borderColor: hasActiveInDay ? 'var(--primary)' : undefined,
                  background: hasActiveInDay ? 'var(--secondary-50)' : undefined,
                }}
              >
                <div className="d">
                  <span>{d.day}</span>
                  {d.dateLabel && <span className="t-muted num" style={{ fontWeight: 600 }}>{d.dateLabel}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {d.times.length === 0 ? (
                    <span
                      className="time-chip is-full"
                      style={{ textAlign: 'center', textDecoration: 'none', opacity: 0.7 }}
                    >
                      پر شده
                    </span>
                  ) : (
                    d.times.map((tm) => {
                      const slotKey = `${d.day}-${tm.t}`;
                      const isSelected =
                        selectedSlot?.day === d.day && selectedSlot?.time === tm.t;
                      return (
                        <button
                          key={slotKey}
                          type="button"
                          disabled={!!tm.full}
                          aria-pressed={isSelected}
                          className={`time-chip num ${isSelected ? 'is-on' : ''} ${tm.full ? 'is-full' : ''}`}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                          onClick={() => {
                            if (onSelectSlot) {
                              onSelectSlot(
                                isSelected
                                  ? null
                                  : { day: d.day, time: tm.t, dateLabel: d.dateLabel }
                              );
                            }
                          }}
                        >
                          {isSelected && <IconCheck size={13} />}
                          <span>{tm.t}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!data && !error && (
        <p role="status" className="t-small t-muted" style={{ padding: '12px 0' }}>
          دریافت برنامهٔ واقعی…
        </p>
      )}

      {data && !data.occurrences.length && (
        <div
          className="card-soft"
          style={{
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <b style={{ fontSize: 14 }}>
              در این بازه جلسهٔ قابل نمایش برای مدرس تأییدشده منتشر نشده است.
            </b>
            <p className="t-caption t-muted" style={{ marginTop: 4 }}>
              بازهٔ بررسی‌شده: {formatFullDate(data.from)} تا {formatFullDate(data.to)}
              {selectedSlot
                ? ` · ساعت پیشنهادی انتخابی شما: ${selectedSlot.day} ساعت ${selectedSlot.time}`
                : ''}
            </p>
          </div>
          {week < 12 && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setWeek((v) => Math.min(12, v + 1));
                setOffset(0);
              }}
            >
              بررسی هفتهٔ بعد
            </button>
          )}
        </div>
      )}

      {data?.occurrences?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {data.occurrences.map((o) => {
            const isPicked = selectedOccurrenceIds.includes(o.id);
            return (
              <article
                className="nimchat-report card-soft"
                key={o.id}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  borderColor: isPicked ? 'var(--primary)' : undefined,
                  background: isPicked ? 'var(--secondary-50)' : undefined,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15.5 }}>{o.title}</h3>
                  <p className="t-small t-muted num" style={{ marginTop: 4 }}>
                    {formatFullDate(o.starts_at)} تا {formatFullDate(o.ends_at)} · {o.mode}
                  </p>
                  <p className="t-caption num" style={{ marginTop: 4 }}>
                    قیمت پایهٔ هر نفر/جلسه: {faPrice(o.price)} تومان · ظرفیت باقی‌ماندهٔ دوره: {faNum(o.seatsLeft)}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {o.rescheduling ? (
                    <span className="chip soft-orange">در انتظار توافق تغییر زمان؛ رزرو موقتاً متوقف است.</span>
                  ) : o.seatsLeft ? (
                    <>
                      {onToggleOccurrence && (
                        <button
                          type="button"
                          className={`btn btn-sm ${isPicked ? 'btn-soft-green' : 'btn-outline'}`}
                          onClick={() => onToggleOccurrence(o)}
                        >
                          {isPicked ? 'انتخاب‌شده برای رزرو ✓' : 'انتخاب این زمان'}
                        </button>
                      )}
                      <Link className="btn btn-primary btn-sm" to={`/classes/${o.class_id}`}>
                        انتخاب جلسه و رزرو
                      </Link>
                    </>
                  ) : (
                    <span className="chip">ظرفیت دوره تکمیل است.</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="operations-actions" style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {offset > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setOffset((v) => Math.max(0, v - 50))}
          >
            جلسات قبلی این بازه
          </button>
        )}
        {data?.hasMore && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setOffset((v) => v + 50)}
          >
            جلسات بیشتر این بازه
          </button>
        )}
      </div>

      <div className="field-hint" style={{ marginTop: 14 }}>
        <IconClock size={14} /> زمان‌ها به وقت تهران است. هر جلسه {faNum(sessionMinutes)} دقیقه.
      </div>
    </section>
  );
}
