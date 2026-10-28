'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from '../routing/navigation';
import {
  IconChevronDown,
  IconGlobe,
  IconMapPin,
  IconSearch,
  IconCheck,
  IconBook,
  IconArrowLeft,
} from './icons.jsx';
import LiveSearch from './LiveSearch.jsx';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import { SEGMENTS, subjectsForSegment, matchesSegment } from '../utils/curriculum.js';

const KIND_MAP = { group: 'گروهی', friendly: 'دوستانه', private: 'خصوصی' };

const TYPE_OPTIONS = ['خصوصی', 'گروهی', 'نیمه‌خصوصی'];

export default function HeroSearch({
  defaults = {},
  submitLabel = 'جستجو',
  showLiveSearch = false,
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const reqSeqRef = useRef(0);

  const [mode, setMode] = useState(defaults.mode || 'آنلاین');
  const [type, setType] = useState(defaults.defaultType || 'خصوصی');
  const [grade, setGrade] = useState(defaults.defaultGrade || 'متوسطه دوم');
  const [subject, setSubject] = useState(defaults.defaultSubject || 'فیزیک');
  const [liveQuery, setLiveQuery] = useState('');

  const [openMenu, setOpenMenu] = useState(null);
  const [interacted, setInteracted] = useState(false);
  const [instantLoading, setInstantLoading] = useState(false);
  const [instantClasses, setInstantClasses] = useState([]);

  const availableSubjects = subjectsForSegment(grade, 'همه');

  const handleGradeChange = (nextGrade) => {
    setGrade(nextGrade);
    const nextList = subjectsForSegment(nextGrade, 'همه');
    if (!nextList.includes(subject)) {
      setSubject(nextList[0] || 'ریاضی');
    }
    setInteracted(true);
    setOpenMenu(null);
  };

  const buildSearchUrl = useCallback(
    (overrides = {}) => {
      const m = overrides.mode ?? mode;
      const t = overrides.type ?? type;
      const g = overrides.grade ?? grade;
      const s = overrides.subject ?? subject;
      const q = overrides.q ?? liveQuery;
      const params = new URLSearchParams({
        mode: m,
        kind: t === 'نیمه‌خصوصی' ? 'دوستانه' : t,
        grade: g,
        subject: s,
      });
      if (q && q.trim()) {
        params.set('q', q.trim());
      }
      return `/classes?${params.toString()}`;
    },
    [mode, type, grade, subject, liveQuery]
  );

  // Instant search whenever user clicks/selects a filter in HeroSearch
  useEffect(() => {
    if (!interacted) return undefined;
    const seq = ++reqSeqRef.current;
    setInstantLoading(true);
    const timer = setTimeout(() => {
      api('/classes')
        .then((res) => {
          if (seq !== reqSeqRef.current) return;
          const all = Array.isArray(res?.classes) ? res.classes : [];
          const targetKind = type === 'نیمه‌خصوصی' ? 'دوستانه' : type;
          const filtered = all.filter((c) => {
            const cKind = KIND_MAP[c.kind] || c.kind || 'گروهی';
            const cMode = c.mode || 'آنلاین';
            const cGrade = c.grade || '';
            const cSubj = c.subject || '';
            const modeOk = !mode || cMode === mode;
            const kindOk = !targetKind || cKind === targetKind;
            const gradeOk = !grade || matchesSegment(cGrade, grade);
            const subjOk = !subject || cSubj.includes(subject) || (c.title || '').includes(subject);
            return modeOk && kindOk && gradeOk && subjOk;
          });
          // Fallback to subject/mode matches if strict 4-way intersection is empty
          const fallback =
            filtered.length > 0
              ? filtered
              : all.filter((c) => {
                  const cSubj = c.subject || '';
                  const cMode = c.mode || 'آنلاین';
                  return (
                    (cSubj.includes(subject) || (c.title || '').includes(subject)) &&
                    (!mode || cMode === mode)
                  );
                });
          setInstantClasses((fallback.length > 0 ? fallback : all).slice(0, 4));
        })
        .catch(() => {
          if (seq === reqSeqRef.current) setInstantClasses([]);
        })
        .finally(() => {
          if (seq === reqSeqRef.current) setInstantLoading(false);
        });
    }, 60);
    return () => clearTimeout(timer);
  }, [interacted, mode, type, grade, subject]);

  useEffect(() => {
    if (!openMenu && !interacted) return undefined;
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.addEventListener('keydown', handleEsc);
    };
  }, [openMenu, interacted]);

  const submit = (e) => {
    e.preventDefault();
    setOpenMenu(null);
    navigate(buildSearchUrl());
  };

  const renderCustomDropdown = (fieldKey, options, currentVal, onSelect) => {
    if (openMenu !== fieldKey) return null;
    return (
      <div
        className="nk-custom-select-menu"
        role="listbox"
        aria-label={`گزینه‌های ${fieldKey}`}
      >
        {options.map((opt) => {
          const selected = opt === currentVal;
          return (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={selected}
              className={`nk-custom-select-option ${selected ? 'is-selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opt);
              }}
            >
              <span>{opt}</span>
              {selected && <IconCheck size={15} />}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <form
      ref={rootRef}
      className="hero-search"
      aria-label="جستجوی کلاس"
      onSubmit={submit}
    >
      <div className="top">
        <div className="segmented" role="group" aria-label="شیوه برگزاری">
          <button
            type="button"
            className={mode === 'آنلاین' ? 'is-active' : ''}
            onClick={() => {
              setMode('آنلاین');
              setInteracted(true);
            }}
          >
            <IconGlobe size={17} /> آنلاین
          </button>
          <button
            type="button"
            className={mode === 'حضوری' ? 'is-active' : ''}
            onClick={() => {
              setMode('حضوری');
              setInteracted(true);
            }}
          >
            <IconMapPin size={17} /> حضوری
          </button>
        </div>
        <span className="step-hint">
          <span className="dot" /> گام ۱ از ۲ · انتخاب سریع کلاس و مشاهده فوری نتایج
        </span>
      </div>

      {showLiveSearch && (
        <div style={{ marginTop: 10 }}>
          <LiveSearch
            variant="hero"
            showSubmitButton={false}
            value={liveQuery}
            onChange={setLiveQuery}
            placeholder="جستجوی سریع نام درس، استاد یا موضوع کلاس…"
          />
        </div>
      )}

      <div className="search-bar">
        <div className="sfield hero-select-field" data-open={openMenu === 'type' ? 'true' : undefined}>
          <span className="sf-label">نوع کلاس</span>
          <select
            aria-label="نوع کلاس"
            value={type}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpenMenu((prev) => (prev === 'type' ? null : 'type'));
            }}
            onChange={(e) => {
              setType(e.target.value);
              setInteracted(true);
              setOpenMenu(null);
            }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <IconChevronDown size={15} className="chev" />
          {renderCustomDropdown('type', TYPE_OPTIONS, type, (val) => {
            setType(val);
            setInteracted(true);
            setOpenMenu(null);
          })}
        </div>

        <div className="sfield hero-select-field" data-open={openMenu === 'grade' ? 'true' : undefined}>
          <span className="sf-label">مقطع</span>
          <select
            aria-label="مقطع"
            value={grade}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpenMenu((prev) => (prev === 'grade' ? null : 'grade'));
            }}
            onChange={(e) => handleGradeChange(e.target.value)}
          >
            {SEGMENTS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <IconChevronDown size={15} className="chev" />
          {renderCustomDropdown('grade', SEGMENTS, grade, handleGradeChange)}
        </div>

        <div className="sfield hero-select-field" data-open={openMenu === 'subject' ? 'true' : undefined}>
          <span className="sf-label">درس</span>
          <select
            aria-label="درس"
            value={subject}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpenMenu((prev) => (prev === 'subject' ? null : 'subject'));
            }}
            onChange={(e) => {
              setSubject(e.target.value);
              setInteracted(true);
              setOpenMenu(null);
            }}
          >
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <IconChevronDown size={15} className="chev" />
          {renderCustomDropdown('subject', availableSubjects, subject, (val) => {
            setSubject(val);
            setInteracted(true);
            setOpenMenu(null);
          })}
        </div>

        <button className="btn btn-primary hero-search-btn" type="submit">
          <IconSearch size={18} /> {submitLabel}
        </button>
      </div>

      {interacted && (
        <div
          className="nk-hero-instant-results"
          role="region"
          aria-live="polite"
          aria-label="نتایج فوری جستجوی کلاس"
        >
          <div className="nk-hero-instant-results__head">
            <div className="nk-hero-instant-results__summary">
              <span className="nk-hero-instant-results__dot" aria-hidden="true" />
              <strong>
                نتایج فوری برای «{subject} · {grade} · {mode} · {type}»
              </strong>
            </div>
            <div className="nk-hero-instant-results__actions">
              <Link to={buildSearchUrl()} className="nk-hero-instant-results__more">
                مشاهده همه در صفحه کلاس‌ها <IconArrowLeft size={14} />
              </Link>
              <button
                type="button"
                className="nk-hero-instant-results__close"
                aria-label="بستن نتایج فوری"
                onClick={() => setInteracted(false)}
              >
                ×
              </button>
            </div>
          </div>

          {instantLoading ? (
            <div className="nk-hero-instant-results__loading">
              در حال جستجوی آنی کلاس‌های منطبق…
            </div>
          ) : instantClasses.length === 0 ? (
            <div className="nk-hero-instant-results__empty">
              <span>کلاسی با این ترکیب دقیق پیدا نشد.</span>
              <Link to={buildSearchUrl()} className="nk-hero-instant-results__more">
                مشاهده همه کلاس‌های نیمکت ←
              </Link>
            </div>
          ) : (
            <div className="nk-hero-instant-results__list">
              {instantClasses.map((cls) => {
                const tName = cls.teacher?.name || 'استاد نیمکت';
                const kindLabel = KIND_MAP[cls.kind] || cls.kind || 'گروهی';
                return (
                  <Link
                    key={cls.id}
                    to={`/classes/${cls.id}`}
                    className="nk-hero-instant-item"
                  >
                    <span className="nk-hero-instant-item__ic" aria-hidden="true">
                      <IconBook size={17} />
                    </span>
                    <span className="nk-hero-instant-item__body">
                      <strong>{cls.title}</strong>
                      <small>
                        استاد {tName} · {kindLabel} · {cls.mode || 'آنلاین'} · پایه {cls.grade || grade}
                      </small>
                    </span>
                    <span className="nk-hero-instant-item__price num">
                      {faPrice(cls.price || 280000)} تومان
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
