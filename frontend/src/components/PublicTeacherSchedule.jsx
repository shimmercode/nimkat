'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from '../routing/navigation';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';
import { formatJalaliDateTime, formatTehranTime } from '../utils/persian-calendar.js';

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
    <section className="card" id="slots" style={{ padding: 24, borderRadius: 'var(--r-2xl)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="t-h3">{title}</h2>
          <p className="t-small t-muted num" style={{ marginTop: 4 }}>
            به وقت تهران (تقویم شمسی){rangeLabel ? ` · بازه: ${rangeLabel}` : ''} · هر جلسه {faNum(sessionMinutes)} دقیقه
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            بروزرسانی
          </button>
        </div>
      </div>

      {/* Contradiction-free state rendering: only show weekly slot shortcuts when real occurrences exist in this week */}
      {!error && !hasNoActiveClasses && occurrences.length > 0 && Array.isArray(slots) && slots.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="t-small t-muted" style={{ marginBottom: 8 }}>
            برنامهٔ هفتگی استاد (برای انتخاب سریع زمان کلیک کنید):
          </div>
          <div className="slot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            {slots.map((s, idx) => (
              <div key={s.day || idx} className="card-soft" style={{ padding: 10, borderRadius: 12 }}>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{s.day}</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                        style={{ justifyContent: 'center', opacity: isFull ? 0.5 : 1 }}
                        onClick={() => !isFull && handleSlotButtonClick(slotKey)}
                      >
                        {timeLabel} {isFull ? '(تکمیل)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {error ? (
          <div role="alert" className="card-soft" style={{ padding: 16, borderColor: 'var(--error)' }}>
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
          <div className="card-soft" role="status" style={{ padding: 16 }}>
            <p className="t-muted" style={{ margin: 0 }}>
              برای این استاد در حال حاضر کلاس فعالی جهت رزرو ثبت نشده است.
            </p>
          </div>
        ) : loading && !data ? (
          <p role="status" className="t-muted">
            در حال دریافت زمان‌های واقعی…
          </p>
        ) : !occurrences.length ? (
          <div className="card-soft" role="status" style={{ padding: 16 }}>
            <p className="t-muted" style={{ margin: 0 }}>
              در این بازهٔ هفتگی، جلسهٔ آزادی برای رزرو منتشر نشده است. می‌توانید با دکمهٔ «هفتهٔ بعد» بازه‌های بعدی را بررسی کنید.
            </p>
          </div>
        ) : (
          <div className="public-slot-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="t-small t-muted" style={{ marginBottom: 4 }}>
              جلسات زمان‌بندی‌شدهٔ قابل رزرو در این بازه ({faNum(bookableOccurrences.length)} جلسهٔ دارای ظرفیت از {faNum(occurrences.length)} جلسه):
            </div>
            {occurrences.map((occ) => {
              const isSelected =
                Array.isArray(selectedOccurrenceIds) && selectedOccurrenceIds.includes(occ.id);
              const isFull = occ.seatsLeft <= 0;
              const isRescheduling = Boolean(occ.rescheduling);
              const bookable = !isFull && !isRescheduling;
              return (
                <article
                  className="public-slot-card"
                  key={occ.id}
                  style={{
                    border: isSelected ? '1.5px solid var(--primary)' : undefined,
                    background: isSelected ? 'var(--secondary-50)' : undefined,
                    opacity: bookable ? 1 : 0.68,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {onToggleOccurrence && (
                      <input
                        type="checkbox"
                        aria-label={`انتخاب جلسه ${occ.title} در ${formatJalaliDateTime(occ.starts_at)}`}
                        checked={isSelected}
                        disabled={!bookable}
                        onChange={() => bookable && onToggleOccurrence(occ)}
                      />
                    )}
                    <div>
                      <strong>{occ.title}</strong>
                      <p className="t-small t-muted num" style={{ marginTop: 4 }}>
                        {formatJalaliDateTime(occ.starts_at)} تا {formatTehranTime(occ.ends_at)}
                      </p>
                    </div>
                  </div>
                  <div className="public-slot-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="num t-small">
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
                        انتخاب جلسه و رزرو
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
