'use client';
import { useState } from 'react';
import { useNavigate } from '../routing/navigation';
import { IconGlobe, IconMapPin, IconSearch } from './icons.jsx';
import { HERO_SEGMENTS, subjectsForSegment } from '../utils/curriculum.js';

const kinds = ['خصوصی', 'گروهی', 'دوستانه'];

export default function HeroSearch({ data = {} }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('online');
  const [kind, setKind] = useState(data.searchFields?.[0]?.value || 'خصوصی');
  const [grade, setGrade] = useState(data.searchFields?.[1]?.value || 'متوسطه دوم');
  const validSubjects = subjectsForSegment(grade, false);
  const initialSubject = data.searchFields?.[2]?.value || 'فیزیک';
  const [subject, setSubject] = useState(
    validSubjects.includes(initialSubject) ? initialSubject : validSubjects[0] || 'ریاضی'
  );

  const handleGradeChange = (nextGrade) => {
    setGrade(nextGrade);
    const nextSubjects = subjectsForSegment(nextGrade, false);
    if (!nextSubjects.includes(subject)) {
      setSubject(nextSubjects[0] || 'ریاضی');
    }
  };

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams({
      mode: mode === 'online' ? 'آنلاین' : 'حضوری',
      kind,
      grade,
      subject,
    });
    navigate(`/classes?${params.toString()}`);
  }

  return (
    <form className="search-box" onSubmit={submit}>
      <div className="search-modes">
        <button
          type="button"
          className={`mode-pill ${mode === 'online' ? 'is-active' : ''}`}
          aria-pressed={mode === 'online'}
          onClick={() => setMode('online')}
        >
          <IconGlobe size={16} /> {data.modeOnlineLabel || 'آنلاین'}
        </button>
        <button
          type="button"
          className={`mode-pill ${mode === 'inperson' ? 'is-active' : ''}`}
          aria-pressed={mode === 'inperson'}
          onClick={() => setMode('inperson')}
        >
          <IconMapPin size={16} /> {data.modeInpersonLabel || 'حضوری'}
        </button>
        <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--n500)', alignSelf: 'center' }}>
          {data.searchNote || 'گام ۱ از ۳ · شیوه‌ی برگزاری'}
        </span>
      </div>
      <div className="search-fields">
        <label className="search-field">
          <span className="lbl">{data.searchFields?.[0]?.label || 'نوع کلاس'}</span>
          <select aria-label="نوع کلاس" className="val" value={kind} onChange={(e) => setKind(e.target.value)}>
            {kinds.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="search-field">
          <span className="lbl">{data.searchFields?.[1]?.label || 'مقطع'}</span>
          <select aria-label="مقطع" className="val" value={grade} onChange={(e) => handleGradeChange(e.target.value)}>
            {HERO_SEGMENTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="search-field">
          <span className="lbl">{data.searchFields?.[2]?.label || 'درس'}</span>
          <select aria-label="درس" className="val" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {validSubjects.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" style={{ height: 52 }}>
          <IconSearch size={18} />
          {data.searchBtnLabel || 'جستجو'}
        </button>
      </div>
    </form>
  );
}
