'use client';
import { useState, useEffect } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { IconCap, IconBook, IconFile, IconArrowLeft, IconCheck } from '../../components/icons.jsx';

export default function Exams() {
  const [schedule, setSchedule] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api('/schedule/mine'), api('/materials/mine')]).then(([sRes, mRes]) => {
      if (!alive) return;
      if (sRes.status === 'fulfilled' && Array.isArray(sRes.value?.occurrences)) {
        setSchedule(sRes.value.occurrences);
      }
      if (mRes.status === 'fulfilled' && Array.isArray(mRes.value?.materials)) {
        setMaterials(mRes.value.materials);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p role="status">در حال بارگذاری آزمون‌ها و تمرین‌ها…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <section className="p-card">
        <div className="head" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="t-h2">آزمون‌ها و تمرین‌های کلاسی</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              تمرین‌ها و آزمون‌های شبیه‌ساز هر کلاس از طریق منابع امن جلسه منتشر می‌شوند و نتیجهٔ ارزیابی آن‌ها در گزارش هشت‌شاخصی ثبت می‌گردد.
            </p>
          </div>
          <Link to="/panel" className="btn btn-outline btn-sm">
            بازگشت به پنل <IconArrowLeft size={15} />
          </Link>
        </div>

        <div className="p-grid-2" style={{ marginTop: 14 }}>
          <div className="card-soft" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconFile size={22} style={{ color: 'var(--primary)' }} />
              <h2 className="t-h4">برگه‌های تمرین و آزمون منتشرشده ({faNum(materials.length)})</h2>
            </div>
            <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
              فایل‌های تمرین و آزمون که توسط مدرس آپلود و از اسکن امنیتی عبور کرده‌اند در بخش فایل‌ها و منابع قابل دریافت هستند.
            </p>
            <Link to="/panel/files" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              مشاهده و دانلود برگه‌های تمرین
            </Link>
          </div>

          <div className="card-soft" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconCap size={22} style={{ color: 'var(--accent-800)' }} />
              <h2 className="t-h4">جلسات جمع‌بندی و آزمون شما ({faNum(schedule.length)})</h2>
            </div>
            <p className="t-small t-muted" style={{ marginTop: 8, lineHeight: 2 }}>
              در سرفصل استاندارد کلاس‌های نیمکت، جلسهٔ پایانی هر دوره به آزمون جامع شبیه‌ساز و رفع اشکال اختصاص دارد.
            </p>
            <Link to="/panel/reports" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
              مشاهده نمرات و گزارش تحصیلی
            </Link>
          </div>
        </div>
      </section>

      <section className="p-card">
        <h2 className="t-h3">روند ارزیابی و ثبت نمره در نیمکت</h2>
        <ul className="check-list" style={{ marginTop: 12 }}>
          <li>
            <IconCheck size={18} /> <b>دریافت تمرین پیش از جلسه:</b> فایل PDF یا تصویر تمرین‌ها پس از بررسی امنیتی در صفحهٔ «فایل‌ها و منابع» قرار می‌گیرد.
          </li>
          <li>
            <IconCheck size={18} /> <b>تحویل و رفع اشکال در کلاس و نیم‌چت:</b> پرسش‌های مربوط به هر تمرین در گروه کلاس با حضور استاد بررسی می‌شود.
          </li>
          <li>
            <IconCheck size={18} /> <b>ثبت نمره در شاخص «تکلیف» و «حل مسئله»:</b> پس از پایان جلسه، استاد نمرهٔ عملکرد را در کارنامهٔ هشت‌شاخصی شما ثبت می‌کند.
          </li>
        </ul>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Link to="/classes" className="btn btn-outline btn-sm">
            <IconBook size={16} /> جستجوی کلاس‌های حل تمرین و آمادگی امتحان
          </Link>
        </div>
      </section>
    </div>
  );
}
