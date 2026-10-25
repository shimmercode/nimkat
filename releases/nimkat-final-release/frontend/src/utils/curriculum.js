export const SEGMENTS = ['همه', 'ابتدایی', 'متوسطه اول', 'متوسطه دوم', 'کنکور'];

export const HERO_SEGMENTS = ['ابتدایی', 'متوسطه اول', 'متوسطه دوم', 'کنکور'];

export const SEGMENT_FIELDS = {
  'همه': ['همه', 'ریاضی فیزیک', 'علوم تجربی', 'علوم انسانی', 'عمومی'],
  'ابتدایی': ['همه', 'عمومی'],
  'متوسطه اول': ['همه', 'عمومی'],
  'متوسطه دوم': ['همه', 'ریاضی فیزیک', 'علوم تجربی', 'علوم انسانی'],
  'کنکور': ['همه', 'ریاضی فیزیک', 'علوم تجربی', 'علوم انسانی', 'زبان و هنر'],
};

export const SEGMENT_GRADES = {
  'همه': ['همه', 'چهارم', 'پنجم', 'ششم', 'هفتم', 'هشتم', 'نهم', 'دهم', 'یازدهم', 'دوازدهم', 'کنکور'],
  'ابتدایی': ['همه', 'چهارم', 'پنجم', 'ششم'],
  'متوسطه اول': ['همه', 'هفتم', 'هشتم', 'نهم'],
  'متوسطه دوم': ['همه', 'دهم', 'یازدهم', 'دوازدهم'],
  'کنکور': ['همه', 'دوازدهم', 'کنکور'],
};

export const SEGMENT_SUBJECTS = {
  'همه': ['همه', 'فیزیک', 'ریاضی', 'شیمی', 'زیست', 'ادبیات', 'زبان انگلیسی', 'عربی', 'علوم'],
  'ابتدایی': ['همه', 'ریاضی', 'علوم', 'ادبیات', 'زبان انگلیسی'],
  'متوسطه اول': ['همه', 'ریاضی', 'علوم', 'ادبیات', 'زبان انگلیسی', 'عربی'],
  'متوسطه دوم': ['همه', 'فیزیک', 'ریاضی', 'شیمی', 'زیست', 'ادبیات', 'زبان انگلیسی', 'عربی'],
  'کنکور': ['همه', 'فیزیک', 'ریاضی', 'شیمی', 'زیست', 'ادبیات', 'زبان انگلیسی', 'عربی'],
};

export function fieldsForSegment(segment) {
  return SEGMENT_FIELDS[segment] || SEGMENT_FIELDS['همه'];
}

export function gradesForSegment(segment) {
  return SEGMENT_GRADES[segment] || SEGMENT_GRADES['همه'];
}

export function subjectsForSegment(segment, includeAll = true) {
  const list = SEGMENT_SUBJECTS[segment] || SEGMENT_SUBJECTS['همه'];
  return includeAll ? list : list.filter((s) => s !== 'همه');
}

export function matchesSegment(cls, segment) {
  if (!segment || segment === 'همه') return true;
  if (cls.segment === segment) return true;
  const g = cls.grade || '';
  if (segment === 'ابتدایی') return ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'ابتدایی'].some((x) => g.includes(x));
  if (segment === 'متوسطه اول') return ['هفتم', 'هشتم', 'نهم', 'متوسطه اول'].some((x) => g.includes(x));
  if (segment === 'متوسطه دوم') return ['دهم', 'یازدهم', 'دوازدهم', 'متوسطه دوم'].some((x) => g.includes(x));
  if (segment === 'کنکور') return ['کنکور', 'دوازدهم'].some((x) => g.includes(x) || (cls.title || '').includes(x));
  return true;
}
