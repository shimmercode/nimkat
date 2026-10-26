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

export default function SchedulePicker({ classId, count, selected, onChange }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestSeqRef = useRef(0);

  const load = useCallback(() => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setError('');
    api(`/classes/${classId}/schedule`)
      .then((r) => {
        if (seq === requestSeqRef.current) {
          setRows(r.occurrences || []);
        }
      })
      .catch((e) => {
        if (seq === requestSeqRef.current) {
          setError(e.message);
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

  return (
    <fieldset className="schedule-picker">
      <legend>انتخاب زمان جلسات (تقویم شمسی · به وقت تهران)</legend>
      <p className="t-small">
        {faNum(selected.length)} از {faNum(count)} جلسه انتخاب شده · منطقه زمانی: تهران (Asia/Tehran)
      </p>
      {error ? (
        <p role="alert" style={{ color: 'var(--error)' }}>
          {error}
        </p>
      ) : loading && !rows.length ? (
        <p role="status">در حال دریافت برنامه…</p>
      ) : !rows.length ? (
        <p className="t-small">
          زمان قابل رزروی ثبت نشده است؛ تا تأیید مدرس و انتشار برنامه، رزرو نهایی ممکن نیست.
        </p>
      ) : (
        <div className="schedule-options" aria-busy={loading}>
          {rows.map((row) => {
            const durationMin = Math.max(15, Math.round((row.ends_at - row.starts_at) / 60000));
            return (
              <label key={row.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(row.id)}
                  disabled={!selected.includes(row.id) && selected.length >= count}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...selected, row.id]
                        : selected.filter((id) => id !== row.id)
                    )
                  }
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
