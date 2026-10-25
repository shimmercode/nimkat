'use client';
import { useState, useEffect, useCallback } from 'react';
import { Link } from '../../routing/navigation';
import { api } from '../../api.js';
import { faNum } from '../../utils/fa.js';
import { toast } from '../../utils/toast.js';
import { IconCheck, IconUser, IconCrown, IconArrowLeft } from '../../components/icons.jsx';

export default function ProfileSettings() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    subtitle: '',
    alias: '',
    province: '',
    city: '',
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
          setForm({
            name: d.profile.fields?.name || '',
            subtitle: d.profile.fields?.subtitle || '',
            alias: d.profile.fields?.alias || '',
            province: d.profile.fields?.province || '',
            city: d.profile.fields?.city || '',
            goal: d.profile.fields?.goal || '',
            country: d.profile.fields?.country || 'IR',
            leagueOptIn: Boolean(d.profile.fields?.leagueOptIn),
          });
        }
      })
      .catch((e) => setError(e.message || 'خطا در دریافت پروفایل'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

  if (loading) return <p role="status">در حال بارگذاری اطلاعات پروفایل…</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="p-card">
        <div className="head">
          <div>
            <h1 className="t-h2">پروفایل و تنظیمات حساب</h1>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              تکمیل اطلاعات یادگیری به پیشنهاد دقیق‌تر کلاس‌ها کمک می‌کند و در نیمکت کلاب ۱۰ سکه و ۵۰ امتیاز یک‌بارمصرف دارد.
            </p>
          </div>
          <Link to="/panel" className="btn btn-outline btn-sm">
            بازگشت به داشبورد <IconArrowLeft size={15} />
          </Link>
        </div>

        {profile && (
          <div
            className="card-soft"
            style={{
              padding: 18,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <b style={{ fontSize: 15 }}>درصد تکمیل پروفایل: {faNum(profile.percent)}٪</b>
                {profile.rewardClaimed && (
                  <span className="chip soft-green">
                    <IconCrown size={14} /> پاداش تکمیل پروفایل دریافت شده
                  </span>
                )}
              </div>
              <div className="progress green" style={{ marginTop: 10 }}>
                <i style={{ width: `${profile.percent}%` }} />
              </div>
              {profile.missing?.length > 0 && (
                <p className="t-caption t-muted" style={{ marginTop: 8 }}>
                  موارد باقی‌مانده برای دریافت پاداش: {profile.missing.join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" style={{ color: 'var(--error)', fontWeight: 700, marginBottom: 14 }}>
            {error}
          </p>
        )}
        {notice && (
          <p role="status" style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: 14 }}>
            {notice}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <label className="field-label">
            نام و نام خانوادگی
            <input
              className="input"
              required
              minLength={2}
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              style={{ marginTop: 6 }}
            />
          </label>

          <label className="field-label">
            پایه و رشتهٔ تحصیلی
            <input
              className="input"
              maxLength={120}
              placeholder="مثلاً پایه یازدهم · ریاضی فیزیک"
              value={form.subtitle}
              onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))}
              style={{ marginTop: 6 }}
            />
          </label>

          <label className="field-label">
            نام نمایشی در نیمکت کلاب
            <input
              className="input"
              required
              minLength={2}
              maxLength={60}
              placeholder="نام مستعار برای لیگ کلاب"
              value={form.alias}
              onChange={(e) => setForm((s) => ({ ...s, alias: e.target.value }))}
              style={{ marginTop: 6 }}
            />
          </label>

          <label className="field-label">
            استان
            <input
              className="input"
              required
              minLength={2}
              maxLength={80}
              placeholder="مثلاً تهران"
              value={form.province}
              onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))}
              style={{ marginTop: 6 }}
            />
          </label>

          <label className="field-label">
            شهر
            <input
              className="input"
              required
              minLength={2}
              maxLength={80}
              placeholder="مثلاً تهران"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              style={{ marginTop: 6 }}
            />
          </label>

          <label className="field-label">
            کد کشور (ISO)
            <input
              className="input"
              dir="ltr"
              required
              maxLength={2}
              value={form.country}
              onChange={(e) => setForm((s) => ({ ...s, country: e.target.value.toUpperCase() }))}
              style={{ marginTop: 6, textAlign: 'right' }}
            />
          </label>

          <label className="field-label" style={{ gridColumn: '1 / -1' }}>
            هدف یادگیری (حداقل ۱۰ نویسه)
            <textarea
              className="input"
              rows={3}
              required
              minLength={10}
              maxLength={500}
              placeholder="مثلاً آمادگی کامل برای امتحان نهایی فیزیک و ریاضی یازدهم و تسلط بر حل مسئله"
              value={form.goal}
              onChange={(e) => setForm((s) => ({ ...s, goal: e.target.value }))}
              style={{ marginTop: 6 }}
            />
          </label>

          <label
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={form.leagueOptIn}
              onChange={(e) => setForm((s) => ({ ...s, leagueOptIn: e.target.checked }))}
            />
            با نمایش نام نمایشی و امتیازم در جدول رتبه‌بندی اختیاری لیگ نیمکت کلاب موافقم.
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <IconCheck size={17} /> {busy ? 'در حال ذخیره…' : 'ذخیره اطلاعات پروفایل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
