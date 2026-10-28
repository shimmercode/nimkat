'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from '../routing/navigation';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';
import { formatJalaliDateTime, formatTehranTime } from '../utils/persian-calendar.js';
import {
  IconCalendar,
  IconClock,
  IconRefresh,
  IconCheck,
  IconArrowLeft,
  IconSparkle,
} from './icons.jsx';

export default function PublicTeacherSchedule({
  teacherId,
  initialData = null,
  title = 'زمان‌های آزاد هفته‌ی آینده',
  slots = [],
  selectedSlot = null,
  onSelectSlot,
  selectedOccurrenceIds = [],
  onToggleOccurrence,
  onAvailabilityChange,
  onOccurrencesLoaded,
  onSelectClassId,
  activeClassesCount = null,
  sessionMinutes = 90,
}) {
  const [week, setWeek] = useState(0);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!initialData);
  const reqSeqRef = useRef(0);

  const onAvailRef = useRef(onAvailabilityChange);
  const onOccLoadedRef = useRef(onOccurrencesLoaded);
  const onSelectClassRef = useRef(onSelectClassId);
  onAvailRef.current = onAvailabilityChange;
  onOccLoadedRef.current = onOccurrencesLoaded;
  onSelectClassRef.current = onSelectClassId;

  const load = useCallback(
    (targetWeek = week) => {
      if (!teacherId) return;
      const seq = ++reqSeqRef.current;
      setLoading(true);
      setError('');
      onAvailRef.current?.({ data, loading: true, error: '', week: targetWeek });

      api(`/teachers/${teacherId}/availability?week=${targetWeek}`)
        .then((res) => {
          if (seq !== reqSeqRef.current) return;
          setData(res);
          const list = Array.isArray(res?.occurrences) ? res.occurrences : [];
          onOccLoadedRef.current?.(list);
          onAvailRef.current?.({ data: res, loading: false, error: '', week: targetWeek });
          const firstBookable = list.find((o) => o.seatsLeft > 0 && !o.rescheduling);
          if (firstBookable && onSelectClassRef.current) {
            onSelectClassRef.current((prev) => prev || firstBookable.class_id);
          }
        })
        .catch((e) => {
          if (seq !== reqSeqRef.current) return;
          const msg = e.message || 'خطا در دریافت برنامه زمانی استاد';
          setError(msg);
          onAvailRef.current?.({ data: null, loading: false, error: msg, week: targetWeek });
        })
        .finally(() => {
          if (seq === reqSeqRef.current) {
            setLoading(false);
          }
        });
    },
    [teacherId, week]
  );

  useEffect(() => {
    load(week);
    return () => {
      reqSeqRef.current += 1;
    };
  }, [teacherId, week]);

  const occurrences = Array.isArray(data?.occurrences) ? data.occurrences : [];
  const bookableOccurrences = occurrences.filter((o) => o.seatsLeft > 0 && !o.rescheduling);
  const hasNoActiveClasses = activeClassesCount !== null && Number(activeClassesCount) === 0 && occurrences.length === 0;

  const handleSlotButtonClick = (slotKey, matchingOcc = null) => {
    const nextSlot = selectedSlot === slotKey ? null : slotKey;
    onSelectSlot?.(nextSlot);
    if (!nextSlot) return;
    const targetOcc = matchingOcc || bookableOccurrences[0] || null;
    if (targetOcc) {
      if (onSelectClassId && targetOcc.class_id) {
        onSelectClassId(targetOcc.class_id);
      }
      if (
        onToggleOccurrence &&
        Array.isArray(selectedOccurrenceIds) &&
        !selectedOccurrenceIds.includes(targetOcc.id)
      ) {
        onToggleOccurrence(targetOcc);
      }
    }
  };

  const rangeLabel =
    data?.from && data?.to
      ? `${new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          timeZone: 'Asia/Tehran',
          day: 'numeric',
          month: 'long',
        }).format(data.from)} تا ${new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          timeZone: 'Asia/Tehran',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(data.to - 1000)}`
      : '';

  return (
    <section className="card nk-tp-section-card" id="slots">
      {/* Header */}
      <div className="nk-tp-sec-head">
        <div className="nk-tp-sec-head__title-wrap">
          <span className="nk-tp-sec-icon">
            <IconCalendar size={22} />
          </span>
          <div>
            <h2 className="t-h3">{title}</h2>
            <p className="t-small t-muted num" style={{ marginTop: 4 }}>
              به وقت تهران (تقویم شمسی){rangeLabel ? ` · بازه: ${rangeLabel}` : ''} · هر جلسه {faNum(sessionMinutes)} دقیقه
            </p>
          </div>
        </div>

        <div className="nk-tp-week-nav">
          <button
            className="btn btn-outline btn-sm"
            type="button"
            disabled={week <= 0 || loading}
            onClick={() => setWeek((w) => Math.max(0, w - 1))}
          >
            هفتهٔ قبل
          </button>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            disabled={week >= 8 || loading}
            onClick={() => setWeek((w) => Math.min(8, w + 1))}
          >
            هفتهٔ بعد
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => load(week)}>
            <IconRefresh size={14} /> بروزرسانی
          </button>
        </div>
      </div>

      {/* Weekly Slot Shortcuts */}
      {!error && !hasNoActiveClasses && occurrences.length > 0 && Array.isArray(slots) && slots.length > 0 && (
        <div className="nk-tp-weekly-box">
          <div className="nk-tp-weekly-box__label">
            <IconClock size={15} style={{ color: 'var(--primary)' }} />
            <span>برنامهٔ هفتگی استاد (برای انتخاب سریع زمان کلیک کنید):</span>
          </div>
          <div className="nk-tp-day-grid">
            {slots.map((s, idx) => (
              <div key={s.day || idx} className="nk-tp-day-card">
                <strong className="nk-tp-day-card__day">{s.day}</strong>
                <div className="nk-tp-day-card__times">
                  {(Array.isArray(s.times) ? s.times : []).map((rawT, ti) => {
                    const isObj = rawT && typeof rawT === 'object';
                    const timeLabel = isObj ? rawT.t : String(rawT);
                    const isFull = isObj ? Boolean(rawT.full) : bookableOccurrences.length === 0;
                    const slotKey = `${s.day} - ${timeLabel}`;
                    const isSelected = selectedSlot === slotKey;
                    return (
                      <button
                        key={timeLabel || ti}
                        type="button"
                        disabled={isFull}
                        aria-pressed={isSelected}
                        className={`nk-tp-time-chip num ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => !isFull && handleSlotButtonClick(slotKey)}
                      >
                        <IconClock size={13} />
                        <span>
                          {timeLabel} {isFull ? '(تکمیل)' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Occurrences List */}
      <div style={{ marginTop: 18 }}>
        {error ? (
          <div role="alert" className="nk-tp-state-box nk-tp-state-box--error">
            <p style={{ color: 'var(--error)', margin: 0, fontWeight: 700 }}>{error}</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => load(week)}
            >
              تلاش مجدد
            </button>
          </div>
        ) : hasNoActiveClasses ? (
          <div className="nk-tp-state-box" role="status">
            <p className="t-muted" style={{ margin: 0 }}>
              برای این استاد در حال حاضر کلاس فعالی جهت رزرو ثبت نشده است.
            </p>
          </div>
        ) : loading && !data ? (
          <div className="nk-tp-state-box" role="status">
            <p className="t-muted" style={{ margin: 0 }}>
              در حال دریافت زمان‌های واقعی…
            </p>
          </div>
        ) : !occurrences.length ? (
          <div className="nk-tp-state-box" role="status">
            <p className="t-muted" style={{ margin: 0 }}>
              در این بازهٔ هفتگی، جلسهٔ آزادی برای رزرو منتشر نشده است. می‌توانید با دکمهٔ «هفتهٔ بعد» بازه‌های بعدی را بررسی کنید.
            </p>
          </div>
        ) : (
          <div className="public-slot-list">
            <div className="nk-tp-occurrences-head">
              <span className="t-small" style={{ fontWeight: 700, color: 'var(--n700)' }}>
                جلسات زمان‌بندی‌شدهٔ قابل رزرو در این بازه ({faNum(bookableOccurrences.length)} جلسهٔ دارای ظرفیت از {faNum(occurrences.length)} جلسه):
              </span>
              <span className="pill green num">{faNum(bookableOccurrences.length)} جلسه باز</span>
            </div>

            {occurrences.map((occ) => {
              const isSelected =
                Array.isArray(selectedOccurrenceIds) && selectedOccurrenceIds.includes(occ.id);
              const isFull = occ.seatsLeft <= 0;
              const isRescheduling = Boolean(occ.rescheduling);
              const bookable = !isFull && !isRescheduling;
              return (
                <article
                  className={`public-slot-card ${isSelected ? 'is-selected' : ''} ${!bookable ? 'is-disabled' : ''}`}
                  key={occ.id}
                >
                  <div className="public-slot-card__info">
                    {onToggleOccurrence && (
                      <input
                        type="checkbox"
                        className="public-slot-card__check"
                        aria-label={`انتخاب جلسه ${occ.title} در ${formatJalaliDateTime(occ.starts_at)}`}
                        checked={isSelected}
                        disabled={!bookable}
                        onChange={() => bookable && onToggleOccurrence(occ)}
                      />
                    )}
                    <span className="public-slot-card__icon" aria-hidden="true">
                      {isSelected ? <IconCheck size={18} /> : <IconCalendar size={18} />}
                    </span>
                    <div className="public-slot-card__texts">
                      <strong className="public-slot-card__title">{occ.title}</strong>
                      <p className="public-slot-card__time num">
                        <IconClock size={13} />
                        <span>
                          {formatJalaliDateTime(occ.starts_at)} تا {formatTehranTime(occ.ends_at)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="public-slot-actions">
                    <span className={`nk-tp-seat-badge num ${bookable ? 'is-open' : 'is-closed'}`}>
                      {isRescheduling
                        ? 'در حال جابه‌جایی زمان'
                        : isFull
                          ? 'تکمیل ظرفیت'
                          : `${faNum(occ.seatsLeft)} صندلی خالی`}
                    </span>
                    {bookable ? (
                      <Link
                        className="btn btn-primary btn-sm"
                        to={`/classes/${occ.class_id}?occurrenceId=${occ.id}`}
                        onClick={() => {
                          if (onSelectClassId) onSelectClassId(occ.class_id);
                        }}
                      >
                        انتخاب جلسه و رزرو <IconArrowLeft size={14} />
                      </Link>
                    ) : (
                      <button className="btn btn-outline btn-sm" type="button" disabled>
                        {isRescheduling ? 'غیرقابل رزرو (تغییر زمان)' : 'تکمیل ظرفیت'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
