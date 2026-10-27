'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';

export const sessionTime = (value) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

export default function SchedulePicker({
  classId,
  count,
  selected,
  onChange,
  onOccurrencesChange,
}) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestSeqRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onOccurrencesChangeRef = useRef(onOccurrencesChange);
  onChangeRef.current = onChange;
  onOccurrencesChangeRef.current = onOccurrencesChange;

  const load = useCallback(() => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setError('');
    onOccurrencesChangeRef.current?.([], true);
    api(`/classes/${classId}/schedule`)
      .then((r) => {
        if (seq === requestSeqRef.current) {
          const list = Array.isArray(r.occurrences) ? r.occurrences : [];
          setRows(list);
          onOccurrencesChangeRef.current?.(list, false);
        }
      })
      .catch((e) => {
        if (seq === requestSeqRef.current) {
          setError(e.message);
          onOccurrencesChangeRef.current?.([], false);
        }
      })
      .finally(() => {
        if (seq === requestSeqRef.current) {
          setLoading(false);
        }
      });
  }, [classId]);

  useEffect(() => {
    load();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [load]);

  // Keep selected occurrences synced when rows load or when count changes
  useEffect(() => {
    if (loading) return;
    if (!rows.length) {
      if (selected.length > 0) onChangeRef.current?.([]);
      return;
    }
    const validIds = new Set(rows.map((r) => r.id));
    const filtered = selected.filter((id) => validIds.has(id));
    const targetCount = Math.min(Math.max(1, count || 1), rows.length);
    if (filtered.length === 0) {
      onChangeRef.current?.(rows.slice(0, targetCount).map((r) => r.id));
    } else if (filtered.length > targetCount) {
      onChangeRef.current?.(filtered.slice(0, targetCount));
    } else if (filtered.length !== selected.length) {
      onChangeRef.current?.(filtered);
    }
  }, [rows, count, loading, selected]);

  const handleToggle = (rowId, checked) => {
    if (count === 1) {
      onChange(checked ? [rowId] : []);
      return;
    }
    if (checked) {
      if (selected.includes(rowId)) return;
      if (selected.length >= count) {
        // Replace oldest selected item so user can smoothly change selection without getting blocked
        onChange([...selected.slice(1), rowId]);
      } else {
        onChange([...selected, rowId]);
      }
    } else {
      onChange(selected.filter((id) => id !== rowId));
    }
  };

  return (
    <fieldset className="schedule-picker">
      <legend>انتخاب زمان جلسات</legend>
      {rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <p className="t-small num" style={{ margin: 0 }}>
            {faNum(selected.length)} از {faNum(Math.min(count, rows.length))} جلسه انتخاب شده · به وقت تهران
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {count > 1 && selected.length < Math.min(count, rows.length) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onChange(rows.slice(0, Math.min(count, rows.length)).map((r) => r.id))}
              >
                انتخاب خودکار {faNum(Math.min(count, rows.length))} جلسهٔ اول
              </button>
            )}
            {selected.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onChange([])}
              >
                پاک کردن انتخاب
              </button>
            )}
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : loading && !rows.length ? (
        <p role="status">در حال دریافت برنامه…</p>
      ) : !rows.length ? (
        <p className="t-small" role="status">
          زمان قابل رزروی ثبت نشده است؛ تا تأیید مدرس و انتشار برنامه، رزرو نهایی ممکن نیست.
        </p>
      ) : (
        <div className="schedule-options" aria-busy={loading}>
          {rows.map((row) => {
            const durationMin = Math.max(15, Math.round((row.ends_at - row.starts_at) / 60000));
            const isChecked = selected.includes(row.id);
            return (
              <label key={row.id} className={isChecked ? 'is-selected' : ''}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleToggle(row.id, e.target.checked)}
                />
                <span>
                  {sessionTime(row.starts_at)}
                  <small>
                    تا{' '}
                    {new Intl.DateTimeFormat('fa-IR', {
                      timeZone: 'Asia/Tehran',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(row.ends_at)}{' '}
                    ({faNum(durationMin)} دقیقه)
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      )}
      <button className="btn btn-outline btn-sm" type="button" onClick={load}>
        تازه‌سازی برنامه
      </button>
    </fieldset>
  );
}
