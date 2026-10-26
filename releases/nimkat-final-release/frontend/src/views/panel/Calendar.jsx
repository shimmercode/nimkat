'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { faNum } from '../../utils/fa.js';
import {
  persianMonthBounds,
  persianMonthGrid,
  toPersianDateParts,
  formatTehranTimeRange,
  tehranInputToUtcMs,
  PERSIAN_WEEKDAYS,
} from '../../utils/persian-calendar.js';
import TechnicalCheck from '../../components/TechnicalCheck.jsx';
import {
  IconWifi,
  IconX,
  IconRefresh,
  IconCalendar,
  IconClock,
  IconUsers,
  IconVideo,
  IconMapPin,
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
} from '../../components/icons.jsx';

const date = (t) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(t);

function getSessionState(o, clock) {
  if (o.status === 'cancelled') {
    return { key: 'cancelled', label: 'لغوشده', chipClass: 'soft-error', dotColor: 'var(--error)' };
  }
  if (o.pending_proposal) {
    return { key: 'rescheduling', label: 'در انتظار تغییر زمان', chipClass: 'soft-orange', dotColor: 'var(--accent)' };
  }
  if (clock >= o.starts_at - 15 * 60000 && clock <= o.ends_at + 15 * 60000) {
    return { key: 'live', label: 'در حال برگزاری / آماده ورود', chipClass: 'soft-green', dotColor: 'var(--secondary)' };
  }
  if (o.ends_at < clock) {
    return { key: 'completed', label: 'برگزارشده', chipClass: 'outline', dotColor: 'var(--n500)' };
  }
  return { key: 'scheduled', label: 'برنامه‌ریزی‌شده', chipClass: 'soft-green', dotColor: 'var(--primary)' };
}

export default function Calendar() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const [data, setData] = useState(null);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day' | 'list'
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);

  // Teacher slot management state
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const requestSeqRef = useRef(0);

  const bounds = useCallback(() => persianMonthBounds(month), [month]);
  const monthGrid = useMemo(() => persianMonthGrid(month, clock), [month, clock]);

  const load = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    const { from, to } = bounds();
    setReloading(true);
    try {
      const d = await api(`/calendar?from=${from}&to=${to}&offset=${offset}`);
      if (seq === requestSeqRef.current) {
        setData(d);
        setError('');
      }
    } catch (e) {
      if (seq === requestSeqRef.current) {
        setError(e.message);
      }
    } finally {
      if (seq === requestSeqRef.current) {
        setReloading(false);
      }
    }
  }, [bounds, offset]);

  useEffect(() => {
    const seq = ++requestSeqRef.current;
    const { from, to } = bounds();
    setReloading(true);
    api(`/calendar?from=${from}&to=${to}&offset=${offset}`)
      .then((d) => {
        if (seq === requestSeqRef.current) {
          setData(d);
          setError('');
          setReloading(false);
        }
      })
      .catch((e) => {
        if (seq === requestSeqRef.current) {
          setError(e.message);
          setReloading(false);
        }
      });
    return () => {
      if (seq === requestSeqRef.current) {
        requestSeqRef.current += 1;
      }
    };
  }, [bounds, offset]);

  useEffect(() => {
    if (!isTeacher) return undefined;
    let active = true;
    api('/teacher/schedule/classes')
      .then((res) => {
        if (active) setTeacherInfo(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isTeacher]);

  async function respond(id, decision) {
    setBusy(true);
    setError('');
    try {
      await api(`/schedule/proposals/${id}/respond`, { method: 'POST', body: { decision } });
      await load();
      setNotice('پاسخ شما به پیشنهاد تغییر زمان ثبت شد.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function join(id) {
    setBusy(true);
    setError('');
    try {
      const r = await api(`/classroom/${id}/join`, { method: 'POST', body: {} });
      window.location.assign(r.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createTeacherSlot(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const classId = Number(f.get('classId'));
    const startsAt = tehranInputToUtcMs(String(f.get('start') || ''));
    const endsAt = tehranInputToUtcMs(String(f.get('end') || ''));
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
      setError('تاریخ و ساعت شروع و پایان را به‌درستی وارد کنید.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api('/teacher/schedule/occurrences', {
        method: 'POST',
        body: { classId, startsAt, endsAt },
      });
      await load();
      setNotice('بازهٔ زمانی جدید بدون تداخل در تقویم منتشر شد.');
      setShowSlotForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelUnbookedTeacherSlot(occurrenceId) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(`/teacher/schedule/occurrences/${occurrenceId}/cancel`, {
        method: 'POST',
        body: {},
      });
      await load();
      setNotice('جلسهٔ بدون رزرو لغو شد.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const allOccurrences = useMemo(() => {
    return (data?.occurrences || []).map((o) => {
      const pParts = toPersianDateParts(o.starts_at);
      const timeRange = formatTehranTimeRange(o.starts_at, o.ends_at);
      const state = getSessionState(o, clock);
      const isOnline = !['حضوری', 'in-person'].includes(o.mode);
      return {
        ...o,
        pParts,
        timeRange,
        state,
        isOnline,
      };
    });
  }, [data, clock]);

  // Group occurrences by Jalali dateKey for calendar cells
  const occurrencesByDay = useMemo(() => {
    const map = new Map();
    for (const o of allOccurrences) {
      const key = o.pParts.dateKey;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(o);
    }
    return map;
  }, [allOccurrences]);

  // Summary metrics for the active month
  const stats = useMemo(() => {
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;
    let freeSlots = 0;
    let bookedSlots = 0;
    for (const o of allOccurrences) {
      if (o.status === 'cancelled') cancelled++;
      else if (o.ends_at < clock) completed++;
      else upcoming++;

      if (o.status === 'scheduled') {
        if ((o.booked_count || 0) > 0) bookedSlots++;
        else freeSlots++;
      }
    }
    return {
      total: allOccurrences.length,
      upcoming,
      completed,
      cancelled,
      freeSlots,
      bookedSlots,
    };
  }, [allOccurrences, clock]);

  // Active week days for 'week' view mode
  const activeWeekDays = useMemo(() => {
    const targetKey = selectedDateKey || monthGrid.todayDateKey || monthGrid.days[0]?.dateKey;
    const idx = monthGrid.days.findIndex((d) => d.dateKey === targetKey);
    const baseIdx = idx >= 0 ? idx : 0;
    const baseDay = monthGrid.days[baseIdx];
    if (!baseDay) return monthGrid.days.slice(0, 7);
    const weekStartIdx = Math.max(0, baseIdx - baseDay.weekdayIndex);
    return monthGrid.days.slice(weekStartIdx, weekStartIdx + 7);
  }, [monthGrid, selectedDateKey]);

  const occurrences = useMemo(() => {
    return allOccurrences.filter((o) => {
      if (selectedDateKey && o.pParts.dateKey !== selectedDateKey) return false;
      if (statusFilter === 'scheduled' && o.status !== 'scheduled') return false;
      if (statusFilter === 'completed' && (o.status !== 'scheduled' || o.ends_at >= clock)) return false;
      if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;
      if (statusFilter === 'booked' && (o.status !== 'scheduled' || !(o.booked_count > 0))) return false;
      if (statusFilter === 'free' && (o.status !== 'scheduled' || (o.booked_count || 0) > 0)) return false;
      if (modeFilter === 'online' && !o.isOnline) return false;
      if (modeFilter === 'in-person' && o.isOnline) return false;
      return true;
    });
  }, [allOccurrences, selectedDateKey, statusFilter, modeFilter, clock]);

  const selectedDayObj = useMemo(() => {
    if (!selectedDateKey) return null;
    return monthGrid.days.find((d) => d.dateKey === selectedDateKey) || null;
  }, [monthGrid, selectedDateKey]);

  return (
    <section className="teaching-card nk-jalali-calendar" aria-busy={reloading}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="t-h2">تقویم و کلاس‌های من</h1>
            <span className="chip soft-green">
              <IconCalendar size={14} /> {monthGrid.monthName} {faNum(monthGrid.year)}
            </span>
          </div>
          <p className="t-small t-muted" style={{ marginTop: 4 }}>
            تاریخ هجری شمسی و ساعت رسمی تهران (Asia/Tehran). ورود به اتاق فقط در بازهٔ مجاز (۱۵ دقیقه قبل تا ۱۵ دقیقه بعد از جلسه) و با عضویت قطعی فعال است.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isTeacher && teacherInfo?.account?.status === 'approved' && teacherInfo?.classes?.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              aria-expanded={showSlotForm}
              onClick={() => setShowSlotForm((v) => !v)}
            >
              + ثبت جلسه / بازه آزاد جدید
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-green btn-sm"
            aria-expanded={showTechCheck}
            onClick={() => setShowTechCheck((v) => !v)}
          >
            <IconWifi size={16} /> تست فنی قبل از کلاس
          </button>
        </div>
      </div>

      {showTechCheck && (
        <div style={{ marginTop: 16 }}>
          <TechnicalCheck />
        </div>
      )}

      {/* Teacher Slot Creation Form (when approved) */}
      {isTeacher && showSlotForm && teacherInfo?.account?.status === 'approved' && (
        <form className="card-soft" style={{ padding: 20, marginTop: 16 }} onSubmit={createTeacherSlot}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="t-h4" style={{ fontSize: 17 }}>ثبت جلسه جدید در تقویم مدرس (ساعت تهران)</h2>
            <button type="button" className="btn-icon-round" aria-label="بستن فرم" onClick={() => setShowSlotForm(false)}>
              <IconX size={16} />
            </button>
          </div>
          <p className="t-small t-muted" style={{ marginBottom: 14 }}>
            زمان واردشده بر اساس تداخل جلسات و فاصلهٔ رفت‌وآمد بررسی می‌شود و پس از ثبت، در پروفایل شما برای رزرو شاگردان قابل مشاهده خواهد بود.
          </p>
          <div className="teaching-slot-form" style={{ marginTop: 0 }}>
            <label>
              کلاس
              <select name="classId" className="select" required>
                <option value="">انتخاب کلاس</option>
                {teacherInfo.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.mode})
                  </option>
                ))}
              </select>
            </label>
            <label>
              شروع جلسه (تهران)
              <input className="input" type="datetime-local" name="start" required />
            </label>
            <label>
              پایان جلسه (تهران)
              <input className="input" type="datetime-local" name="end" required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              بررسی تداخل و ثبت در تقویم
            </button>
          </div>
        </form>
      )}

      {/* Teacher Unapproved Info Banner */}
      {isTeacher && teacherInfo && teacherInfo.account?.status !== 'approved' && (
        <div className="card-soft" style={{ padding: '14px 18px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p className="t-small">
            برای انتشار ساعات آزاد و بازه‌های قابل رزرو در تقویم، ابتدا پروندهٔ تدریس شما باید تکمیل و توسط مدیریت تأیید شود.
          </p>
          <Link to="/teacher/application" className="btn btn-outline btn-sm">
            مشاهده وضعیت پرونده تدریس
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--error)', marginTop: 12 }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: 'var(--primary)', marginTop: 12 }}>
          {notice}
        </p>
      )}

      {/* Summary KPI Bar */}
      <div className="nk-cal-summary-grid" style={{ marginTop: 18 }}>
        <div className="nk-cal-stat-card">
          <span className="l">کل جلسات این ماه</span>
          <strong className="v num">{faNum(stats.total)}</strong>
        </div>
        <div className="nk-cal-stat-card">
          <span className="l">پیش رو / برنامه‌ریزی‌شده</span>
          <strong className="v num" style={{ color: 'var(--primary)' }}>{faNum(stats.upcoming)}</strong>
        </div>
        <div className="nk-cal-stat-card">
          <span className="l">برگزارشده</span>
          <strong className="v num">{faNum(stats.completed)}</strong>
        </div>
        {isTeacher ? (
          <div className="nk-cal-stat-card">
            <span className="l">رزروشده / آزاد</span>
            <strong className="v num">
              {faNum(stats.bookedSlots)} <span className="t-muted" style={{ fontSize: 13 }}>/ {faNum(stats.freeSlots)} آزاد</span>
            </strong>
          </div>
        ) : (
          <div className="nk-cal-stat-card">
            <span className="l">لغوشده</span>
            <strong className="v num" style={{ color: stats.cancelled ? 'var(--error)' : 'inherit' }}>
              {faNum(stats.cancelled)}
            </strong>
          </div>
        )}
      </div>

      {/* Navigation & View Mode Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBlock: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setMonth((m) => m - 1);
              setOffset(0);
              setSelectedDateKey(null);
            }}
          >
            <IconArrowRight size={15} /> بازهٔ قبل
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingInline: 8 }}>
            <strong style={{ fontSize: 16 }}>
              {monthGrid.monthName} {faNum(monthGrid.year)}
            </strong>
            <span className="t-caption t-muted">
              {date(bounds().from)} تا {date(bounds().to - 1)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setMonth((m) => m + 1);
              setOffset(0);
              setSelectedDateKey(null);
            }}
          >
            بازهٔ بعد <IconArrowLeft size={15} />
          </button>
          {(month !== 0 || selectedDateKey) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setMonth(0);
                setOffset(0);
                setSelectedDateKey(null);
              }}
            >
              ماه جاری
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="segmented" role="group" aria-label="نمای تقویم">
            {[
              ['month', 'نمای ماهانه'],
              ['week', 'نمای هفتگی'],
              ['day', 'نمای روزانه'],
              ['list', 'نمای فهرست'],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={viewMode === k}
                className={viewMode === k ? 'is-active' : ''}
                onClick={() => {
                  setViewMode(k);
                  if (k === 'day' && !selectedDateKey) {
                    setSelectedDateKey(
                      monthGrid.days.find((d) => d.isToday)?.dateKey || monthGrid.days[0]?.dateKey || null
                    );
                  }
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="segmented" role="group" aria-label="فیلتر وضعیت جلسات">
          {[
            ['all', 'همه'],
            ['scheduled', 'برنامه‌ریزی‌شده'],
            ['completed', 'برگزارشده'],
            ['cancelled', 'لغوشده'],
            ...(isTeacher
              ? [
                  ['booked', 'رزروشده'],
                  ['free', 'آزاد'],
                ]
              : []),
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={statusFilter === k}
              className={statusFilter === k ? 'is-active' : ''}
              onClick={() => setStatusFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="segmented" role="group" aria-label="فیلتر نوع برگزاری">
          {[
            ['all', 'همه شیوه‌ها'],
            ['online', 'آنلاین'],
            ['in-person', 'حضوری'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={modeFilter === k}
              className={modeFilter === k ? 'is-active' : ''}
              onClick={() => setModeFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Jalali Month / Week / Day Grid */}
      {viewMode !== 'list' && (
        <div className="nk-cal-board" style={{ marginBottom: 22 }}>
          {viewMode === 'month' && (
            <>
              <div className="nk-cal-weekdays" role="row">
                {PERSIAN_WEEKDAYS.map((wd) => (
                  <div key={wd} className="nk-cal-weekday" role="columnheader">
                    {wd}
                  </div>
                ))}
              </div>
              <div className="nk-cal-grid" role="grid" aria-label={`تقویم ${monthGrid.monthName} ${faNum(monthGrid.year)}`}>
                {Array.from({ length: monthGrid.startWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} className="nk-cal-cell is-empty" aria-hidden="true" />
                ))}
                {monthGrid.days.map((d) => {
                  const dayEvents = occurrencesByDay.get(d.dateKey) || [];
                  const isSelected = selectedDateKey === d.dateKey;
                  return (
                    <button
                      key={d.dateKey}
                      type="button"
                      className={`nk-cal-cell ${d.isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${dayEvents.length ? 'has-events' : ''}`}
                      aria-pressed={isSelected}
                      aria-label={`${d.weekdayName} ${faNum(d.day)} ${d.monthName} ${faNum(d.year)}${dayEvents.length ? ` · ${faNum(dayEvents.length)} جلسه` : ''}`}
                      onClick={() => setSelectedDateKey((prev) => (prev === d.dateKey ? null : d.dateKey))}
                    >
                      <div className="nk-cal-cell-top">
                        <span className="nk-cal-day-num num">{faNum(d.day)}</span>
                        {d.isToday && <span className="nk-cal-today-pill">امروز</span>}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="nk-cal-cell-events">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <span
                              key={ev.id}
                              className={`nk-cal-event-pill is-${ev.state.key}`}
                              title={`${ev.title} (${ev.timeRange.label})`}
                            >
                              <i style={{ background: ev.state.dotColor }} />
                              <span className="num">{ev.timeRange.startTime}</span> {ev.title}
                            </span>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="nk-cal-more num">+{faNum(dayEvents.length - 2)} جلسه دیگر</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'week' && (
            <div className="nk-cal-week-grid" role="grid" aria-label="نمای هفتگی تقویم شمسی">
              {activeWeekDays.map((d) => {
                const dayEvents = occurrencesByDay.get(d.dateKey) || [];
                const isSelected = selectedDateKey === d.dateKey;
                return (
                  <button
                    key={d.dateKey}
                    type="button"
                    className={`nk-cal-cell is-week-cell ${d.isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${dayEvents.length ? 'has-events' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDateKey((prev) => (prev === d.dateKey ? null : d.dateKey))}
                  >
                    <div className="nk-cal-cell-top">
                      <strong>{d.weekdayName}</strong>
                      <span className="nk-cal-day-num num">
                        {faNum(d.day)} {d.monthName}
                      </span>
                    </div>
                    {dayEvents.length === 0 ? (
                      <span className="t-caption t-muted" style={{ marginTop: 8 }}>بدون جلسه</span>
                    ) : (
                      <div className="nk-cal-cell-events" style={{ marginTop: 8 }}>
                        {dayEvents.map((ev) => (
                          <span key={ev.id} className={`nk-cal-event-pill is-${ev.state.key}`}>
                            <i style={{ background: ev.state.dotColor }} />
                            <span className="num">{ev.timeRange.label}</span> · {ev.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === 'day' && (
            <div className="nk-cal-day-focus">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ fontSize: 16 }}>
                    {selectedDayObj
                      ? `${selectedDayObj.weekdayName} ${faNum(selectedDayObj.day)} ${selectedDayObj.monthName} ${faNum(selectedDayObj.year)}`
                      : `انتخاب روز از ${monthGrid.monthName} ${faNum(monthGrid.year)}`}
                  </strong>
                  <p className="t-caption t-muted" style={{ marginTop: 2 }}>
                    برنامهٔ ساعتی روز انتخاب‌شده به وقت تهران
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const idx = monthGrid.days.findIndex((d) => d.dateKey === selectedDateKey);
                      if (idx > 0) setSelectedDateKey(monthGrid.days[idx - 1].dateKey);
                    }}
                  >
                    روز قبل
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const idx = monthGrid.days.findIndex((d) => d.dateKey === selectedDateKey);
                      if (idx >= 0 && idx < monthGrid.days.length - 1) {
                        setSelectedDateKey(monthGrid.days[idx + 1].dateKey);
                      }
                    }}
                  >
                    روز بعد
                  </button>
                  {selectedDateKey && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedDateKey(null)}
                    >
                      نمایش کل ماه
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Legend & Selected Day Filter Pill */}
          <div className="nk-cal-legend">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>
                <i style={{ background: 'var(--primary)' }} /> پیش رو
              </span>
              <span>
                <i style={{ background: 'var(--secondary)' }} /> آماده ورود / در حال برگزاری
              </span>
              <span>
                <i style={{ background: 'var(--accent)' }} /> در انتظار تغییر زمان
              </span>
              <span>
                <i style={{ background: 'var(--n500)' }} /> برگزارشده
              </span>
              <span>
                <i style={{ background: 'var(--error)' }} /> لغوشده
              </span>
            </div>
            {selectedDayObj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="chip soft-green">
                  فیلتر روز: {selectedDayObj.weekdayName} {faNum(selectedDayObj.day)} {selectedDayObj.monthName}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedDateKey(null)}
                >
                  حذف فیلتر روز
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Reschedule Proposals */}
      {data?.changes?.map((p) => (
        <article className="nimchat-report" key={p.id}>
          <h2 className="t-h3">پیشنهاد تغییر زمان</h2>
          <p>{p.reason}</p>
          <p>
            قبلی: {date(p.old_start)}
            <br />
            جدید: {date(p.starts_at)} تا {date(p.ends_at)}
          </p>
          <p>مهلت پاسخ: {date(p.expires_at)}؛ تا پذیرش همهٔ اعضا زمان قبلی معتبر است.</p>
          {p.decision === 'pending' ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button disabled={busy} className="btn btn-primary" onClick={() => respond(p.id, 'accepted')}>
                پذیرش زمان جدید
              </button>
              <button disabled={busy} className="btn btn-outline" onClick={() => respond(p.id, 'rejected')}>
                رد پیشنهاد
              </button>
            </div>
          ) : (
            <p>پاسخ شما ثبت شده؛ در انتظار سایر اعضا.</p>
          )}
        </article>
      ))}

      {/* Loading & Empty States */}
      {!data && !error && <p role="status">دریافت برنامه…</p>}
      {data && !occurrences.length && (
        <div className="card-soft" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ fontWeight: 700 }}>
            {selectedDayObj
              ? `در روز ${selectedDayObj.weekdayName} ${faNum(selectedDayObj.day)} ${selectedDayObj.monthName} جلسه‌ای با این فیلتر ثبت نشده است.`
              : 'در این بازه جلسه‌ای ثبت نشده است.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            {selectedDateKey && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedDateKey(null)}>
                نمایش همه جلسات ماه
              </button>
            )}
            {!isTeacher && (
              <Link to="/classes" className="btn btn-primary btn-sm">
                رزرو کلاس جدید
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Session Occurrence Cards */}
      {occurrences.map((o) => (
        <article className="nimchat-report nk-cal-session-card" key={o.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 className="t-h3" style={{ fontSize: 20 }}>{o.title}</h2>
                {o.subject && <span className="chip outline">{o.subject}</span>}
                {o.booking_id && (
                  <span className="chip soft-green">رزرو #{faNum(o.booking_id)}</span>
                )}
              </div>
              <p className="t-small t-muted" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>مدرس: {o.teacher_name}</span>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {o.isOnline ? <IconVideo size={14} /> : <IconMapPin size={14} />}
                  {o.mode}
                </span>
                <span>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconClock size={14} /> {faNum(o.timeRange.durationMin)} دقیقه
                </span>
              </p>
              <p className="num" style={{ marginTop: 6, fontWeight: 700 }}>
                {date(o.starts_at)} تا {date(o.ends_at)}
              </p>
              {Array.isArray(o.students) && (
                <p className="t-small" style={{ marginTop: 6, color: 'var(--n700)' }}>
                  <IconUsers size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }} />
                  وضعیت ظرفیت: {faNum(o.booked_count || 0)} از {faNum(o.capacity || 1)} نفر
                  {o.students.length > 0 ? ` · شاگردان: ${o.students.join('، ')}` : ' · هنوز رزروی ثبت نشده است (آزاد)'}
                </p>
              )}
            </div>
            <span className={`chip ${o.state.chipClass}`}>
              {o.state.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            {o.status === 'scheduled' && o.isOnline && (
              <button
                disabled={busy || clock < o.starts_at - 15 * 60000 || clock > o.ends_at + 15 * 60000}
                className="btn btn-primary"
                onClick={() => join(o.id)}
              >
                ورود امن به کلاس
              </button>
            )}
            {o.status === 'scheduled' && o.starts_at > clock && (!isTeacher || (o.booked_count || 0) > 0) && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCancelModal(o)}
              >
                <IconRefresh size={16} /> شرایط لغو و بازپرداخت
              </button>
            )}
            {isTeacher && o.status === 'scheduled' && o.starts_at > clock && (o.booked_count || 0) === 0 && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => cancelUnbookedTeacherSlot(o.id)}
              >
                لغو این بازهٔ بدون رزرو
              </button>
            )}
            <a
              className="btn btn-outline"
              href="#support"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event('nimkat:open-support'));
              }}
            >
              پشتیبانی کلاس
            </a>
          </div>
        </article>
      ))}

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {offset > 0 && (
          <button className="btn btn-outline" onClick={() => setOffset((n) => Math.max(0, n - 100))}>
            صفحهٔ قبل
          </button>
        )}
        {data?.hasMore && (
          <button className="btn btn-outline" onClick={() => setOffset((n) => n + 100)}>
            جلسات بیشتر
          </button>
        )}
      </div>

      {/* Modal: شرایط لغو و بازپرداخت */}
      {cancelModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-session-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelModal(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23,33,30,.55)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 520, width: '100%', padding: 26, borderRadius: 'var(--r-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="cancel-session-modal-title" className="t-h3">
                لغو و بازپرداخت جلسه «{cancelModal.title}»
              </h2>
              <button type="button" className="btn-icon-round" aria-label="بستن" onClick={() => setCancelModal(null)}>
                <IconX size={18} />
              </button>
            </div>
            <p className="t-small t-muted" style={{ marginTop: 12, lineHeight: 2 }}>
              بر اساس قوانین مالی نیمکت، لغو جلسه و بازگشت وجه به کیف پول فقط از طریق ثبت درخواست رسمی بازپرداخت انجام می‌شود:
            </p>
            <ul className="check-list" style={{ marginTop: 12 }}>
              <li>لغو تا ۲۴ ساعت قبل از شروع جلسه بدون جریمه است و مبلغ پس از تأیید به کیف پول واقعی شما برمی‌گردد.</li>
              <li>بازپرداخت کاملِ خدمت شروع‌نشده، رزرو و صندلی جلسه را به‌طور خودکار آزاد می‌کند.</li>
              <li>هیچ جلسهٔ دارای رزرو فعال بدون ثبت سند مالی بازپرداخت به صورت یک‌طرفه حذف نمی‌شود.</li>
            </ul>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-outline" onClick={() => setCancelModal(null)}>
                انصراف
              </button>
              <Link
                to={isTeacher ? '/teacher/finance' : '/panel/finance'}
                className="btn btn-primary"
                onClick={() => setCancelModal(null)}
              >
                رفتن به امور مالی و ثبت بازپرداخت ({faNum(cancelModal.id)})
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
