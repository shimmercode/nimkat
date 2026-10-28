const TEACHER_NAME_MAP = {
  'سارا محمدی': '/images/avatars/teacher-1.svg',
  'امیر رضایی': '/images/avatars/teacher-2.svg',
  'نگار سلطانی': '/images/avatars/teacher-3.svg',
  'کاوه مرادی': '/images/avatars/teacher-4.svg',
  'رضا جعفری': '/images/avatars/teacher-5.svg',
  'حسین نوری': '/images/avatars/teacher-6.svg',
  'مریم کاظمی': '/images/avatars/teacher-7.svg',
};

const STUDENT_NAME_MAP = {
  'آرمین رستمی': '/images/avatars/student-1.svg',
  'یسنا کریمی': '/images/avatars/student-2.svg',
  'پرهام نوری': '/images/avatars/student-3.svg',
  'رعنا سلطانی': '/images/avatars/student-4.svg',
  'بردیا مهدوی': '/images/avatars/student-5.svg',
  'سارینا محمدی': '/images/avatars/student-6.svg',
  'کیانوش فرهادی': '/images/avatars/student-7.svg',
  'ملیکا حسینی': '/images/avatars/student-8.svg',
  'امیرعلی کاظمی': '/images/avatars/student-9.svg',
  'درسا احمدی': '/images/avatars/student-10.svg',
};

export const PRESET_AVATARS = [
  { id: 'student-1', label: 'آواتار ۱', url: '/images/avatars/student-1.svg' },
  { id: 'student-2', label: 'آواتار ۲', url: '/images/avatars/student-2.svg' },
  { id: 'student-3', label: 'آواتار ۳', url: '/images/avatars/student-3.svg' },
  { id: 'student-4', label: 'آواتار ۴', url: '/images/avatars/student-4.svg' },
  { id: 'student-5', label: 'آواتار ۵', url: '/images/avatars/student-5.svg' },
  { id: 'student-6', label: 'آواتار ۶', url: '/images/avatars/student-6.svg' },
  { id: 'teacher-1', label: 'آواتار ۷', url: '/images/avatars/teacher-1.svg' },
  { id: 'teacher-2', label: 'آواتار ۸', url: '/images/avatars/teacher-2.svg' },
];

export function teacherAvatarUrl(teacherOrId, name = '') {
  if (typeof teacherOrId === 'object' && teacherOrId !== null) {
    if (teacherOrId.avatar) return teacherOrId.avatar;
    const byName = TEACHER_NAME_MAP[String(teacherOrId.name || '').trim()];
    if (byName) return byName;
    const tid = Number(teacherOrId.id || teacherOrId.teacherId || teacherOrId.teacher_id || 1);
    const idx = ((tid - 1) % 7) + 1;
    return `/images/avatars/teacher-${idx}.svg`;
  }
  const byName = TEACHER_NAME_MAP[String(name || '').trim()];
  if (byName) return byName;
  const tid = Number(teacherOrId || 1);
  const idx = ((Math.max(1, tid) - 1) % 7) + 1;
  return `/images/avatars/teacher-${idx}.svg`;
}

export function studentAvatarUrl(student, index = 0) {
  if (student && typeof student === 'object') {
    if (student.avatar) return student.avatar;
    const byName = STUDENT_NAME_MAP[String(student.name || '').trim()];
    if (byName) return byName;
  }
  const idx = (index % 10) + 1;
  return `/images/avatars/student-${idx}.svg`;
}
