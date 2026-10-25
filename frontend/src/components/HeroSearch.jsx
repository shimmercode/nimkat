'use client';
import { useState, useMemo } from 'react';
import { useNavigate } from '../routing/navigation';
import { IconGlobe, IconMapPin, IconSearch, IconChevronDown } from './icons.jsx';
import { HERO_SEGMENTS, subjectsForSegment } from '../utils/curriculum.js';

const TYPES = ['خصوصی', 'گروهی', 'نیمه‌خصوصی'];
const GRADES = HERO_SEGMENTS;

/**
 * Interactive Hero search box — matches Home page.pdf 1:1 (.hero-search > .top + .search-bar)
 * while filtering subjects dynamically by selected educational segment (curriculum.js)
 * and navigating to /classes with query params on submit.
 */
export default function HeroSearch({ data = {} }) {
  const nav = useNavigate();
  const [mode, setMode] = useState('online');
  const [type, setType] = useState(data.searchFields?.[0]?.value || 'خصوصی');
  const [grade, setGrade] = useState(data.searchFields?.[1]?.value || 'متوسطه دوم');
  const [subject, setSubject] = useState(data.searchFields?.[2]?.value || 'فیزیک');

  const availableSubjects = useMemo(() => {
    const list = subjectsForSegment(grade, false);
    return list.length ? list : ['ریاضی', 'فیزیک', 'شیمی', 'زبان انگلیسی', 'ادبیات', 'عربی', 'علوم', 'برنامه‌نویسی'];
  }, [grade]);

  const safeSubject = availableSubjects.includes(subject) ? subject : availableSubjects[0];

  const handleGradeChange = (nextGrade) => {
    setGrade(nextGrade);
    const nextList = subjectsForSegment(nextGrade, false);
    if (nextList.length && !nextList.includes(subject)) {
      setSubject(nextList[0]);
    }
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const qs = new URLSearchParams({
      mode: mode === 'online' ? 'آنلاین' : 'حضوری',
      type,
      segment: grade,
      grade,
      subject: safeSubject,
    });
    nav(`/classes?${qs.toString()}`);
  };

  return (
    <form className="hero-search" onSubmit={submit} aria-label="جستجوی کلاس">
      <div className="top">
        <div className="segmented" role="group" aria-label="شیوه برگزاری">
          <button
            aria-pressed={mode === 'online'}
            className={mode === 'online' ? 'is-active' : ''}
            type="button"
            onClick={() => setMode('online')}
          >
            <IconGlobe size={17} /> {data.modeOnlineLabel || 'آنلاین'}
          </button>
          <button
            aria-pressed={mode === 'inperson'}
            className={mode === 'inperson' ? 'is-active' : ''}
            type="button"
            onClick={() => setMode('inperson')}
          >
            <IconMapPin size={17} /> {data.modeInpersonLabel || 'حضوری'}
          </button>
        </div>
        <span className="note">{data.searchNote || 'گام ۱ از ۲ · شیوه‌ی برگزاری'}</span>
      </div>
      <div className="search-bar">
        <label className="sfield hero-select-field">
          <span className="sf-label">نوع کلاس</span>
          <select aria-label="نوع کلاس" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <IconChevronDown size={16} className="chev" />
        </label>
        <label className="sfield hero-select-field">
          <span className="sf-label">مقطع</span>
          <select aria-label="مقطع" value={grade} onChange={(e) => handleGradeChange(e.target.value)}>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <IconChevronDown size={16} className="chev" />
        </label>
        <label className="sfield hero-select-field">
          <span className="sf-label">درس</span>
          <select aria-label="درس" value={safeSubject} onChange={(e) => setSubject(e.target.value)}>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <IconChevronDown size={16} className="chev" />
        </label>
        <button type="submit" className="btn btn-primary hero-search-btn">
          <IconSearch size={19} /> {data.searchBtnLabel || 'جستجو'}
        </button>
      </div>
    </form>
  );
}
