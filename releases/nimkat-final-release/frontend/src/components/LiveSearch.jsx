'use client';
import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { useNavigate } from '../routing/navigation';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import { IconSearch, IconBook, IconUser, IconStar, IconArrowLeft } from './icons.jsx';

export function normalizePersianQuery(value) {
  return String(value || '')
    .replace(/[يئ]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200f\u200e\u0640\u064b-\u065f]/g, ' ')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function LiveSearch({
  initialValue = '',
  placeholder = 'جستجوی زنده نام کلاس، استاد یا درس (مثلاً: فیزیک، سارا محمدی، کنکور)…',
  onSelectQuery,
  autoFocus = false,
  compact = false,
  showSubmitButton = true,
  className = '',
  inputAriaLabel = 'جستجوی زنده کلاس، استاد و درس',
}) {
  const navigate = useNavigate();
  const listboxId = useId();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const requestSeqRef = useRef(0);

  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(Boolean(autoFocus));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState({ subjects: [], classes: [], teachers: [] });
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const fetchSuggestions = useCallback((qText) => {
    const seq = ++requestSeqRef.current;
    setLoading(true);
    setError('');
    const clean = String(qText || '').trim();
    api(`/search/suggestions?q=${encodeURIComponent(clean)}&limit=5`)
      .then((data) => {
        if (seq !== requestSeqRef.current) return;
        setResults({
          subjects: Array.isArray(data?.subjects) ? data.subjects : [],
          classes: Array.isArray(data?.classes) ? data.classes : [],
          teachers: Array.isArray(data?.teachers) ? data.teachers : [],
        });
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (seq !== requestSeqRef.current) return;
        setError(err?.message || 'خطا در دریافت پیشنهادهای جستجو');
      })
      .finally(() => {
        if (seq === requestSeqRef.current) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 160);
    return () => {
      clearTimeout(timer);
    };
  }, [query, open, fetchSuggestions]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // Flatten navigable items for ArrowUp / ArrowDown keyboard support
  const flatItems = [];
  for (const s of results.subjects) {
    flatItems.push({
      type: 'subject',
      key: `sub-${s.subject}`,
      label: `درس ${s.subject}`,
      sub: `${faNum(s.count)} کلاس فعال`,
      href: s.href || `/classes?subject=${encodeURIComponent(s.subject)}`,
      subject: s.subject,
    });
  }
  for (const c of results.classes) {
    flatItems.push({
      type: 'class',
      key: `cls-${c.id}`,
      label: c.title,
      sub: `${c.teacherName ? `استاد ${c.teacherName} · ` : ''}${c.mode || 'آنلاین'} · ${faPrice(c.price)} تومان`,
      href: c.href || `/classes/${c.id}`,
    });
  }
  for (const t of results.teachers) {
    flatItems.push({
      type: 'teacher',
      key: `tch-${t.id}`,
      label: t.name,
      sub: `${t.subject} · ${t.level || 'استاد نیمکت'} · امتیاز ${faNum(t.rating)}`,
      href: t.href || `/teachers/${t.id}`,
    });
  }

  const handleSelectOption = (item) => {
    if (!item) return;
    setOpen(false);
    if (item.type === 'subject' && onSelectQuery) {
      onSelectQuery(item.subject);
    }
    navigate(item.href);
  };

  const handleSubmitSearch = (e) => {
    if (e) e.preventDefault();
    if (activeIndex >= 0 && activeIndex < flatItems.length) {
      handleSelectOption(flatItems[activeIndex]);
      return;
    }
    const trimmed = query.trim();
    setOpen(false);
    if (onSelectQuery) {
      onSelectQuery(trimmed);
      return;
    }
    navigate(trimmed ? `/classes?q=${encodeURIComponent(trimmed)}` : '/classes');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => (flatItems.length ? (prev + 1) % flatItems.length : -1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((prev) => (flatItems.length ? (prev - 1 + flatItems.length) % flatItems.length : -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitSearch();
    }
  };

  const hasAnyResults =
    results.subjects.length > 0 || results.classes.length > 0 || results.teachers.length > 0;
  const normalizedQ = normalizePersianQuery(query);

  return (
    <div
      ref={containerRef}
      className={`nk-live-search ${compact ? 'nk-live-search--compact' : ''} ${className}`.trim()}
      dir="rtl"
    >
      <div className="nk-live-search__bar">
        <span className="nk-live-search__icon" aria-hidden="true">
          <IconSearch size={18} />
        </span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label={inputAriaLabel}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 && flatItems[activeIndex]
              ? `${listboxId}-opt-${activeIndex}`
              : undefined
          }
          className="nk-live-search__input"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (onSelectQuery) onSelectQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="nk-live-search__clear"
            aria-label="پاک کردن متن جستجو"
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
              if (onSelectQuery) onSelectQuery('');
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
        {showSubmitButton && (
          <button
            type="button"
            className="btn btn-primary btn-sm nk-live-search__submit"
            onClick={handleSubmitSearch}
          >
            جستجو
          </button>
        )}
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="پیشنهادهای جستجوی زنده"
          className="nk-live-search__dropdown"
        >
          {loading && !hasAnyResults ? (
            <div className="nk-live-search__state" role="status">
              در حال جستجوی هوشمند در کلاس‌ها و اساتید…
            </div>
          ) : error ? (
            <div className="nk-live-search__state nk-live-search__state--error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fetchSuggestions(query)}
              >
                تلاش مجدد
              </button>
            </div>
          ) : !hasAnyResults ? (
            <div className="nk-live-search__state" role="status">
              نتیجه‌ای برای «{query.trim()}» یافت نشد. واژهٔ دیگری را امتحان کنید یا همهٔ کلاس‌ها را ببینید.
            </div>
          ) : (
            <div className="nk-live-search__sections">
              {results.subjects.length > 0 && (
                <div className="nk-live-search__group">
                  <div className="nk-live-search__group-title">
                    {normalizedQ ? 'دسته‌بندی و دروس مرتبط' : 'دروس پرطرفدار نیمکت'}
                  </div>
                  <div className="nk-live-search__chips">
                    {results.subjects.map((s) => {
                      const idx = flatItems.findIndex((it) => it.key === `sub-${s.subject}`);
                      const isActive = idx === activeIndex;
                      return (
                        <button
                          key={s.subject}
                          id={`${listboxId}-opt-${idx}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`nk-live-search__chip ${isActive ? 'is-active' : ''}`}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => handleSelectOption(flatItems[idx])}
                        >
                          <span>درس {s.subject}</span>
                          <small className="num">({faNum(s.count)} کلاس)</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.classes.length > 0 && (
                <div className="nk-live-search__group">
                  <div className="nk-live-search__group-title">کلاس‌های آموزشی</div>
                  {results.classes.map((c) => {
                    const idx = flatItems.findIndex((it) => it.key === `cls-${c.id}`);
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={c.id}
                        id={`${listboxId}-opt-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`nk-live-search__item ${isActive ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleSelectOption(flatItems[idx])}
                      >
                        <span className="nk-live-search__item-ic">
                          <IconBook size={17} />
                        </span>
                        <span className="nk-live-search__item-body">
                          <strong>{c.title}</strong>
                          <small>
                            {c.teacherName ? `استاد ${c.teacherName} · ` : ''}
                            پایه {c.grade} · {c.mode || 'آنلاین'}
                          </small>
                        </span>
                        <span className="nk-live-search__item-end num">
                          {faPrice(c.price)} تومان
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {results.teachers.length > 0 && (
                <div className="nk-live-search__group">
                  <div className="nk-live-search__group-title">اساتید نیمکت</div>
                  {results.teachers.map((t) => {
                    const idx = flatItems.findIndex((it) => it.key === `tch-${t.id}`);
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={t.id}
                        id={`${listboxId}-opt-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`nk-live-search__item ${isActive ? 'is-active' : ''}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleSelectOption(flatItems[idx])}
                      >
                        <span className="nk-live-search__item-ic nk-live-search__item-ic--teacher">
                          <IconUser size={17} />
                        </span>
                        <span className="nk-live-search__item-body">
                          <strong>{t.name}</strong>
                          <small>
                            دبیر {t.subject} · {t.level}
                          </small>
                        </span>
                        <span className="nk-live-search__item-end num" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconStar size={13} /> {faNum(t.rating)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="nk-live-search__footer">
            <button
              type="button"
              className="nk-live-search__all-btn"
              onClick={handleSubmitSearch}
            >
              <span>
                {query.trim()
                  ? `مشاهده همهٔ نتایج برای «${query.trim()}» در فهرست کلاس‌ها`
                  : 'مشاهده فهرست کامل همهٔ کلاس‌ها و فیلترهای پیشرفته'}
              </span>
              <IconArrowLeft size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
