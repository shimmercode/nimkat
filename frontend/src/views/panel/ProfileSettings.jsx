'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { toast } from '../../utils/toast.js';
import { PRESET_AVATARS } from '../../utils/avatars.js';
import {
  IconCheck,
  IconUser,
  IconCrown,
  IconArrowLeft,
  IconMapPin,
  IconCap,
  IconShield,
  IconSparkle,
} from '../../components/icons.jsx';

const DEGREE_OPTIONS = [
  '',
  'ابتدایی (پایه اول تا ششم)',
  'متوسطه اول (پایه هفتم تا نهم)',
  'متوسطه دوم (پایه دهم تا دوازدهم)',
  'داوطلب کنکور سراسری',
  'کاردانی / کارشناسی',
  'کارشناسی ارشد / دکتری',
  'سایر دوره‌های تخصصی و آزاد',
];

export default function ProfileSettings() {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    subtitle: '',
    alias: '',
    nationalCode: '',
    age: '',
    birthDate: '',
    educationDegree: '',
    schoolName: '',
    emergencyPhone: '',
    province: '',
    city: '',
    postalCode: '',
    address: '',
    avatar: '',
    goal: '',
    country: 'IR',
    leagueOptIn: false,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfile = useCallback(() => {
    setLoading(true);
    setError('');
    api('/profile')
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          const f = d.profile.fields || {};
          setForm({
            name: f.name || '',
            subtitle: f.subtitle || '',
            alias: f.alias || '',
            nationalCode: f.nationalCode || '',
            age: f.age || '',
            birthDate: f.birthDate || '',
            educationDegree: f.educationDegree || '',
            schoolName: f.schoolName || '',
            emergencyPhone: f.emergencyPhone || '',
            province: f.province || '',
            city: f.city || '',
            postalCode: f.postalCode || '',
            address: f.address || '',
            avatar: f.avatar || '/images/avatars/student-1.svg',
            goal: f.goal || '',
            country: f.country || 'IR',
            leagueOptIn: Boolean(f.leagueOptIn),
          });
        }
      })
      .catch((e) => setError(e.message || 'خطا در دریافت پروفایل'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 120 * 1024) {
      toast('حجم عکس پرسنلی باید کمتر از ۱۲۰ کیلوبایت باشد', 'err');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((f) => ({ ...f, avatar: reader.result }));
        toast('عکس پرسنلی انتخاب شد؛ برای ثبت نهایی دکمه ذخیره را بزنید ✓');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await api('/profile', {
        method: 'PUT',
        body: form,
      });
      if (r.profile) setProfile(r.profile);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('nk:profile-updated'));
      }
      const msg = r.rewarded
        ? 'پروفایل شما کامل شد و پاداش تکمیل پروفایل (۱۰ سکه و ۵۰ امتیاز) به کیف کلاب اضافه شد ✓'
        : 'اطلاعات پروفایل با موفقیت ذخیره شد ✓';
      setNotice(msg);
      toast(msg);
    } catch (err) {
      setError(err.message || 'خطا در ذخیره پروفایل');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-card" role="status">
        در حال بارگذاری اطلاعات پروفایل…
      </div>
    );
  }

  const currentAvatar = form.avatar || '/images/avatars/student-1.svg';

  return (
    <div className="nk-profile-page">
      {/* Hero Banner Card */}
      <section className="nk-profile-hero">
        <div className="nk-profile-hero__top">
          <div className="nk-profile-hero__identity">
            <div className="nk-profile-hero__avatar-box">
              <img
                src={currentAvatar}
                alt={form.name || 'عکس پرسنلی'}
                className="nk-profile-hero__avatar-img"
              />
              <span className="nk-profile-hero__verified" title="حساب کاربری نیمکت">
                <IconShield size={14} />
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 className="t-h2" style={{ color: '#fff', margin: 0 }}>
                  {form.name || 'پروفایل و تنظیمات حساب'}
                </h1>
                <span className="chip" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.24)' }}>
                  {profile?.fields?.mobile ? faNum(profile.fields.mobile) : 'عضو نیمکت'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: 13.5, marginTop: 6, lineHeight: 1.8 }}>
                تکمیل اطلاعات هویتی، تحصیلی و نشانی به پیشنهاد دقیق‌تر کلاس‌ها کمک می‌کند و در نیمکت کلاب{' '}
                <b style={{ color: 'var(--accent)' }}>۱۰ سکه و ۵۰ امتیاز</b> پاداش دارد.
              </p>
            </div>
          </div>
          <Link
            to="/panel"
            className="btn btn-outline btn-sm"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}
          >
            بازگشت به داشبورد <IconArrowLeft size={15} />
          </Link>
        </div>

        {profile && (
          <div className="nk-profile-hero__progress">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <b style={{ fontSize: 14.5, color: '#fff' }}>
                  درصد تکمیل پروفایل: {faNum(profile.percent)}٪
                </b>
                {profile.rewardClaimed ? (
                  <span className="chip soft-green">
                    <IconCrown size={14} /> پاداش تکمیل پروفایل دریافت شده
                  </span>
                ) : (
                  <span className="chip soft-orange">
                    <IconSparkle size={14} /> پاداش ۱۰ سکه + ۵۰ امتیاز آماده دریافت
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>
                {faNum(profile.doneCount || 0)} از {faNum(profile.totalCount || 5)} گام اصلی تکمیل شده
              </span>
            </div>
            <div className="nk-profile-hero__bar">
              <span style={{ width: `${profile.percent}%` }} />
            </div>
            {profile.missing?.length > 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', margin: '8px 0 0' }}>
                موارد باقی‌مانده برای دریافت پاداش: {profile.missing.join(' · ')}
              </p>
            )}
          </div>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="p-card"
          style={{
            padding: '14px 18px',
            background: 'var(--error-50)',
            color: 'var(--error)',
            borderColor: 'rgba(180,42,72,0.25)',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="p-card"
          style={{
            padding: '14px 18px',
            background: 'var(--secondary-50)',
            color: 'var(--primary)',
            borderColor: 'rgba(10,104,71,0.25)',
            fontWeight: 700,
          }}
        >
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="nk-profile-form-stack">
        {/* Card 1: Personal Photo & Avatar Selector */}
        <section className="p-card nk-profile-section">
          <div className="nk-profile-section__head">
            <span className="nk-profile-section__icon">
              <IconUser size={20} />
            </span>
            <div>
              <h2 className="t-h4">عکس پرسنلی و تصویر نمایه</h2>
              <p className="t-caption t-muted">
                می‌توانید عکس پرسنلی خود را بارگذاری کنید یا یکی از آواتارهای اختصاصی نیمکت را برگزینید.
              </p>
            </div>
          </div>

          <div className="nk-profile-avatar-picker">
            <div className="nk-profile-avatar-preview">
              <img src={currentAvatar} alt="پیش‌نمایش عکس پرسنلی" />
              <div>
                <b style={{ display: 'block', fontSize: 14 }}>تصویر فعلی پروفایل</b>
                <span className="t-caption t-muted" style={{ display: 'block', marginTop: 2 }}>
                  فرمت‌های مجاز: JPG، PNG، SVG (حداکثر ۱۲۰ کیلوبایت)
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    آپلود عکس پرسنلی از دستگاه
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="t-caption" style={{ fontWeight: 800, display: 'block', marginBottom: 8 }}>
                یا انتخاب سریع از آواتارهای نیمکت:
              </span>
              <div className="nk-profile-avatar-grid">
                {PRESET_AVATARS.map((item) => {
                  const selected = currentAvatar === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, avatar: item.url }))}
                      className={`nk-profile-avatar-choice ${selected ? 'is-selected' : ''}`}
                      title={item.label}
                    >
                      <img src={item.url} alt={item.label} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Identity & Education Details */}
        <section className="p-card nk-profile-section">
          <div className="nk-profile-section__head">
            <span className="nk-profile-section__icon">
              <IconCap size={20} />
            </span>
            <div>
              <h2 className="t-h4">اطلاعات هویتی و تحصیلی</h2>
              <p className="t-caption t-muted">
                مشخصات فردی، کد ملی، سن و مقطع تحصیلی جهت صدور گواهی و تطبیق کلاس‌ها
              </p>
            </div>
          </div>

          <div className="nk-profile-grid-3">
            <label className="field">
              <span className="label">نام و نام خانوادگی *</span>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: علی رضایی"
                required
              />
            </label>

            <label className="field">
              <span className="label">کد ملی (۱۰ رقمی)</span>
              <input
                className="input"
                dir="ltr"
                maxLength={10}
                value={form.nationalCode}
                onChange={(e) => setForm((f) => ({ ...f, nationalCode: e.target.value }))}
                placeholder="0012345678"
              />
            </label>

            <label className="field">
              <span className="label">سن / سال تولد</span>
              <input
                className="input"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                placeholder="مثال: ۱۷ سال (۱۳۸۸)"
              />
            </label>

            <label className="field">
              <span className="label">مدرک / مقطع تحصیلی</span>
              <select
                className="input"
                value={form.educationDegree}
                onChange={(e) => setForm((f) => ({ ...f, educationDegree: e.target.value }))}
              >
                <option value="">انتخاب مقطع یا مدرک تحصیلی…</option>
                {DEGREE_OPTIONS.filter(Boolean).map((deg) => (
                  <option key={deg} value={deg}>
                    {deg}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="label">پایه و رشتهٔ تحصیلی</span>
              <input
                className="input"
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                placeholder="مثال: پایه یازدهم · ریاضی فیزیک"
              />
            </label>

            <label className="field">
              <span className="label">نام مدرسه یا دانشگاه</span>
              <input
                className="input"
                value={form.schoolName}
                onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
                placeholder="مثال: دبیرستان البرز"
              />
            </label>
          </div>
        </section>

        {/* Card 3: Contact, Postal Code & Address */}
        <section className="p-card nk-profile-section">
          <div className="nk-profile-section__head">
            <span className="nk-profile-section__icon">
              <IconMapPin size={20} />
            </span>
            <div>
              <h2 className="t-h4">اطلاعات تماس، کد پستی و آدرس</h2>
              <p className="t-caption t-muted">
                مورد نیاز برای هماهنگی کلاس‌های حضوری و ارسال بسته‌ها و جوایز فروشگاه نیمکت کلاب
              </p>
            </div>
          </div>

          <div className="nk-profile-grid-3">
            <label className="field">
              <span className="label">استان</span>
              <input
                className="input"
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                placeholder="مثال: تهران"
              />
            </label>

            <label className="field">
              <span className="label">شهر</span>
              <input
                className="input"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="مثال: تهران"
              />
            </label>

            <label className="field">
              <span className="label">کد پستی (۱۰ رقمی)</span>
              <input
                className="input"
                dir="ltr"
                maxLength={10}
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                placeholder="1415563111"
              />
            </label>

            <label className="field">
              <span className="label">شماره تماس اضطراری / والدین</span>
              <input
                className="input"
                dir="ltr"
                maxLength={11}
                value={form.emergencyPhone}
                onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
                placeholder="09120000000"
              />
            </label>

            <label className="field">
              <span className="label">کد کشور (ISO)</span>
              <input
                className="input"
                dir="ltr"
                maxLength={2}
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
                placeholder="IR"
              />
            </label>
          </div>

          <label className="field" style={{ marginTop: 14 }}>
            <span className="label">آدرس کامل پستی</span>
            <textarea
              className="input"
              rows={2}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="خیابان اصلی، کوچه، پلاک، واحد — جهت اعزام استاد حضوری یا ارسال مرسولات کلاب"
            />
          </label>
        </section>

        {/* Card 4: Club Alias & Learning Goal */}
        <section className="p-card nk-profile-section">
          <div className="nk-profile-section__head">
            <span className="nk-profile-section__icon nk-profile-section__icon--orange">
              <IconCrown size={20} />
            </span>
            <div>
              <h2 className="t-h4">نیمکت کلاب و هدف یادگیری</h2>
              <p className="t-caption t-muted">
                نام نمایشی شما در جدول برترین‌های کلاب و برنامهٔ هدفمند آموزشی شما
              </p>
            </div>
          </div>

          <div className="nk-profile-grid-2">
            <label className="field">
              <span className="label">نام نمایشی در نیمکت کلاب</span>
              <input
                className="input"
                value={form.alias}
                onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
                placeholder="مثال: علی_ریاضی"
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
              <label className="nk-profile-checkbox">
                <input
                  type="checkbox"
                  checked={form.leagueOptIn}
                  onChange={(e) => setForm((f) => ({ ...f, leagueOptIn: e.target.checked }))}
                />
                <span>نمایش نام نمایشی من در جدول رده‌بندی نیمکت کلاب</span>
              </label>
            </div>
          </div>

          <label className="field" style={{ marginTop: 14 }}>
            <span className="label">هدف یادگیری (حداقل ۱۰ نویسه)</span>
            <textarea
              className="input"
              rows={3}
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              placeholder="مثال: آمادگی کامل برای امتحان نهایی فیزیک و کسب نمره بالای ۱۹ در نیم‌سال اول"
            />
          </label>

          <div className="nk-profile-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              <IconCheck size={18} /> {busy ? 'در حال ذخیره اطلاعات…' : 'ذخیره و ثبت کامل پروفایل'}
            </button>
            <Link to="/panel/club" className="btn btn-outline">
              مشاهده نیمکت کلاب و جوایز
            </Link>
          </div>
        </section>
      </form>
    </div>
  );
}
