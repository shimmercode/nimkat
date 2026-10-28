'use client';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '../../routing/navigation';
import { api } from '../../api.js';
import { faPrice, faNum } from '../../utils/fa.js';
import { DsKpiCard } from '../../components/ui/design-system.jsx';
import {
  IconWallet,
  IconCalendar,
  IconReceipt,
  IconCheck,
  IconInfo,
  IconArrowLeft,
  IconLock,
  IconRefresh,
  IconShield,
} from '../../components/icons.jsx';

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

function normalizeNumericInput(val) {
  return String(val ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[,٬\s]/g, '');
}

const KIND_LABELS = {
  wallet: 'شارژ کیف پول از درگاه',
  wallet_charge: 'شارژ کیف پول از درگاه',
  booking: 'کسر بابت رزرو کلاس',
  refund: 'بازگشت وجه به کیف پول',
  club_wallet: 'هدیه نقدی نیمکت کلاب',
  shop_order: 'خرید از فروشگاه نیمکت',
  shop_refund: 'مرجوعی فروشگاه نیمکت',
};

const STATUS_TONE = {
  confirmed: 'soft-green',
  credited: 'soft-green',
  paid: 'soft-green',
  paid_unallocated: 'soft-green',
  sandbox_paid: 'soft-green',
  pending: 'soft-orange',
  held: 'soft-orange',
  rejected: 'soft-error',
  failed: 'soft-error',
  cancelled: 'soft-error',
  expired: 'outline',
  refunded: 'soft-green',
};

export default function Finance({ admin = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [chargeAmount, setChargeAmount] = useState('100000');
  const [chargeError, setChargeError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const result = admin ? await api(`/admin/refunds?offset=${offset}`) : await api('/finance/mine');
    setData(result);
    if (!admin && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('nk:wallet-updated'));
    }
    return result;
  }, [admin, offset]);

  useEffect(() => {
    let active = true;
    load().catch((e) => {
      if (active) setError(e.message || 'خطا در دریافت اطلاعات مالی');
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function action(e, id) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (admin) {
        await api(`/admin/refunds/${id}/review`, {
          method: 'POST',
          body: { decision: f.get('decision'), note: f.get('note') },
        });
      } else {
        await api(`/bookings/${id}/refunds`, {
          method: 'POST',
          body: {
            amountToman: Number(normalizeNumericInput(f.get('amount'))),
            reason: f.get('reason'),
            key: crypto.randomUUID(),
          },
        });
      }
      await load();
      setNotice(admin ? 'نتیجهٔ بررسی ثبت شد.' : 'درخواست بازپرداخت برای بررسی مدیر ثبت شد.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function charge(e) {
    e.preventDefault();
    setChargeError('');
    setError('');
    setNotice('');
    const f = new FormData(e.currentTarget);
    const raw = normalizeNumericInput(f.get('amount') ?? chargeAmount);
    if (!/^\d+$/.test(raw)) {
      setChargeError('لطفاً مبلغ شارژ را به‌صورت عدد صحیح وارد کنید.');
      return;
    }
    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < 1000 || parsed > 100000000) {
      setChargeError('مبلغ شارژ باید بین ۱٬۰۰۰ تا ۱۰۰٬۰۰۰٬۰۰۰ تومان باشد.');
      return;
    }
    setBusy(true);
    try {
      const r = await api('/wallet/charge', {
        method: 'POST',
        body: { amount: parsed, idempotencyKey: crypto.randomUUID() },
      });
      const targetUrl = r.payment?.redirectUrl || r.payment?.paymentUrl;
      if (r.payment?.status === 'pending' && targetUrl) {
        if (targetUrl.startsWith('/')) {
          navigate(targetUrl);
        } else {
          window.location.assign(targetUrl);
        }
      } else {
        setNotice('درخواست پرداخت ثبت شد؛ در انتظار تأیید نهایی درگاه.');
        await load();
      }
    } catch (err) {
      setChargeError(err.message || 'خطا در ایجاد درخواست شارژ کیف پول');
      setError(err.message || 'خطا در ایجاد درخواست شارژ کیف پول');
    } finally {
      setBusy(false);
    }
  }

  const status = {
    pending: 'در انتظار بررسی',
    credited: 'بازگشت به کیف پول',
    rejected: 'رد درخواست',
    confirmed: 'قطعی',
    refunded: 'بازپرداخت کامل',
    held: 'در انتظار پرداخت',
    expired: 'منقضی',
    failed: 'ناموفق',
    cancelled: 'لغوشده توسط کاربر',
    paid: 'پرداخت موفق',
    paid_unallocated: 'واریز به کیف پول',
    sandbox_paid: 'پرداخت آزمایشی (Sandbox)',
    sandbox_complete: 'آزمایشی',
  };

  const normalizedChargeNum = Number(normalizeNumericInput(chargeAmount)) || 0;

  return (
    <div className="nk-finance-page">
      {/* Hero Financial Banner */}
      <section className="nk-finance-hero">
        <div className="nk-finance-hero__main">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className="nk-finance-hero__badge">
                <IconShield size={14} /> دفتر کل مالی نیمکت
              </span>
              {!admin && data?.gatewayStatus?.mode === 'local_dev' && (
                <span className="nk-finance-hero__badge nk-finance-hero__badge--amber">
                  درگاه تست کنترل‌شده محیط توسعه فعال
                </span>
              )}
              {!admin && data?.gatewayStatus?.mode === 'sandbox' && (
                <span className="nk-finance-hero__badge nk-finance-hero__badge--amber">
                  حالت آزمایشی درگاه (Sandbox)
                </span>
              )}
              {!admin && data?.gatewayStatus?.mode === 'live' && (
                <span className="nk-finance-hero__badge">درگاه پرداخت آنلاین فعال</span>
              )}
            </div>
            <h1 className="t-h2" style={{ color: '#fff', margin: 0 }}>
              {admin ? 'مدیریت بازپرداخت‌ها' : 'امور مالی، کیف پول و رزروها'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13.5, marginTop: 8, lineHeight: 1.85, maxWidth: 680 }}>
              بازپرداخت این مسیر به کیف پول واقعی است، نه واریز بانکی. بازپرداخت کاملِ خدمت شروع‌نشده رزرو را لغو می‌کند؛ بازپرداخت جزئی به‌تنهایی کلاس را لغو نمی‌کند.
            </p>
          </div>

          <div className="nk-finance-hero__actions">
            {!admin && data && (
              <div className="nk-finance-hero__balance-pill">
                <span>موجودی فعلی کیف پول</span>
                <strong className="num">{faPrice(data.wallet.balance)} تومان</strong>
              </div>
            )}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.28)' }}
              disabled={busy}
              onClick={() => load().catch((e) => setError(e.message))}
            >
              <IconRefresh size={15} /> بروزرسانی اطلاعات مالی
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="nk-ds-alert nk-ds-alert--error">
          <span className="nk-ds-alert__icon" aria-hidden="true">
            <IconInfo size={18} />
          </span>
          <div className="nk-ds-alert__body">
            <div className="nk-ds-alert__text">{error}</div>
          </div>
        </div>
      )}

      {notice && (
        <div role="status" className="nk-ds-alert nk-ds-alert--success">
          <span className="nk-ds-alert__icon" aria-hidden="true">
            <IconCheck size={18} />
          </span>
          <div className="nk-ds-alert__body">
            <div className="nk-ds-alert__text">{notice}</div>
          </div>
        </div>
      )}

      {!data && !error && (
        <div role="status" aria-busy="true" className="nk-ds-loading p-card">
          <p className="nk-ds-loading__label" style={{ margin: 0 }}>
            دریافت اطلاعات…
          </p>
          <div className="nk-ds-loading__rows" aria-hidden="true">
            <div className="nk-skeleton-line" style={{ height: 52, width: '100%' }} />
            <div className="nk-skeleton-line" style={{ height: 52, width: '88%' }} />
          </div>
        </div>
      )}

      {!admin && data && (
        <>
          <div className="nk-ds-kpi-grid">
            <DsKpiCard
              label="موجودی قابل استفاده کیف پول"
              value={`${faPrice(data.wallet.balance)} تومان`}
              sub="آماده پرداخت آنی رزرو کلاس‌ها"
              tone="primary"
              icon={IconWallet}
            />
            <DsKpiCard
              label="رزروهای ثبت‌شده"
              value={`${faNum(data.bookings?.length || 0)} رزرو`}
              sub="در تاریخچهٔ حساب شما"
              tone="secondary"
              icon={IconCalendar}
            />
            <DsKpiCard
              label="گردش دفتر کل"
              value={`${faNum(data.wallet?.transactions?.length || 0)} تراکنش`}
              sub="ثبت دوطرفه و تغییرناپذیر"
              tone="accent"
              icon={IconReceipt}
            />
          </div>

          {/* Wallet Charge Section */}
          <section id="wallet-charge" className="p-card nk-finance-charge-card">
            <div className="nk-finance-charge-grid">
              {/* Left/Right: Charge Form */}
              <div className="nk-finance-charge-form-col">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <span className="eyebrow" style={{ marginBottom: 4 }}>افزایش اعتبار آنی</span>
                    <h2 className="t-h3 num">موجودی کیف پول: {faPrice(data.wallet.balance)} تومان</h2>
                  </div>
                </div>
                <p className="t-small t-muted" style={{ marginTop: 6, lineHeight: 1.8 }}>
                  این موجودی با درآمد قابل تسویهٔ استاد متفاوت است. درخواست برداشت درآمد و ثبت واریز دستی در بخش «درآمد و برداشت» انجام می‌شود.
                </p>

                {data.gatewayStatus?.mode === 'local_dev' && (
                  <div className="nk-finance-dev-note">
                    <IconLock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      در محیط توسعه (بدون کلید زرین‌پال خارجی)، پس از کلیک روی «انتقال به درگاه» به صفحهٔ{' '}
                      <b>تأیید/لغو کنترل‌شدهٔ تراکنش</b> منتقل می‌شوید تا چرخهٔ کامل Callback سمت سرور، ثبت دفتر کل و جلوگیری از شارژ تکراری را آزمایش کنید.
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <span className="t-caption" style={{ fontWeight: 800, color: 'var(--n700)', display: 'block', marginBottom: 8 }}>
                    انتخاب سریع مبلغ شارژ:
                  </span>
                  <div className="nk-finance-presets" aria-label="مبالغ پیشنهادی شارژ">
                    {PRESET_AMOUNTS.map((preset) => {
                      const active = normalizedChargeNum === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          className={`nk-finance-preset-btn ${active ? 'is-active' : ''}`}
                          onClick={() => {
                            setChargeAmount(String(preset));
                            setChargeError('');
                          }}
                        >
                          <span className="num">{faPrice(preset)}</span>
                          <small>تومان</small>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form className="nk-finance-charge-input-row" onSubmit={charge}>
                  <label style={{ flex: 1, minWidth: 220 }}>
                    <span className="t-caption" style={{ fontWeight: 800, color: 'var(--n700)', display: 'block', marginBottom: 6 }}>
                      مبلغ شارژ (تومان) — حداقل ۱٬۰۰۰ تومان
                      {normalizedChargeNum >= 1000 && (
                        <small className="num" style={{ marginRight: 8, color: 'var(--primary)', fontWeight: 800 }}>
                          (معادل {faPrice(normalizedChargeNum)} تومان)
                        </small>
                      )}
                    </span>
                    <input
                      className="input"
                      type="number"
                      name="amount"
                      min="1000"
                      max="100000000"
                      step="1000"
                      required
                      value={chargeAmount}
                      onChange={(e) => {
                        setChargeAmount(e.target.value);
                        setChargeError('');
                      }}
                    />
                  </label>
                  <button type="submit" disabled={busy} aria-busy={busy || undefined} className="btn btn-primary btn-lg">
                    {busy && <span className="nk-btn-spinner" aria-hidden="true" />}
                    <IconLock size={17} />
                    {busy ? 'در حال ارتباط با درگاه…' : 'انتقال به درگاه'}
                  </button>
                </form>
                {chargeError && (
                  <p role="alert" style={{ color: 'var(--error)', fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                    {chargeError}
                  </p>
                )}
              </div>

              {/* Visual Wallet Card */}
              <div className="nk-finance-visual-card" aria-hidden="true">
                <div className="nk-finance-visual-card__top">
                  <span className="nk-finance-visual-card__brand">کیف پول اختصاصی نیمکت</span>
                  <IconWallet size={24} />
                </div>
                <div className="nk-finance-visual-card__balance">
                  <span>اعتبار فعلی</span>
                  <strong className="num">{faPrice(data.wallet.balance)} تومان</strong>
                </div>
                <div className="nk-finance-visual-card__preview">
                  <span>پس از شارژ انتخابی:</span>
                  <b className="num">
                    {faPrice((data.wallet.balance || 0) + (normalizedChargeNum >= 1000 ? normalizedChargeNum : 0))} تومان
                  </b>
                </div>
                <div className="nk-finance-visual-card__foot">
                  <span>پرداخت امن شاپرک</span>
                  <span>ضمانت بازگشت وجه نیمکت</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bookings Section */}
          <section className="p-card nk-finance-section">
            <div className="nk-finance-section__head">
              <div>
                <h2 className="t-h3">رزروهای من</h2>
                <p className="t-caption t-muted">فهرست کلاس‌های رزروشده، وضعیت پرداخت و امکان ثبت درخواست بازپرداخت</p>
              </div>
              <Link to="/classes" className="btn btn-outline btn-sm">
                رزرو کلاس جدید <IconArrowLeft size={15} />
              </Link>
            </div>

            {!data.bookings.length ? (
              <div className="nk-finance-empty">
                <IconCalendar size={28} />
                <b>هنوز رزروی ثبت نشده است.</b>
                <p className="t-caption t-muted">با انتخاب استاد یا کلاس گروهی، سوابق مالی رزروهای شما در این بخش نمایش داده می‌شود.</p>
              </div>
            ) : (
              <div className="nk-finance-list">
                {data.bookings.map((b) => (
                  <article className="nk-finance-item-card nimchat-report" key={b.id}>
                    <div className="nk-finance-item-card__head">
                      <div>
                        <h3 className="t-h4" style={{ margin: 0 }}>
                          {b.title} · رزرو {faNum(b.id)}
                        </h3>
                        <p className="t-small t-muted" style={{ marginTop: 4 }}>
                          {status[b.status] || b.status} · پرداخت: {faPrice(b.total)} تومان · برگشت‌شده:{' '}
                          {faPrice(b.refundedToman)} تومان
                        </p>
                      </div>
                      <span className={`chip ${STATUS_TONE[b.status] || 'outline'}`}>
                        {status[b.status] || b.status}
                      </span>
                    </div>

                    {b.canRequestRefund && (
                      <form className="nk-finance-refund-form teaching-slot-form" onSubmit={(e) => action(e, b.id)}>
                        <label>
                          <span>مبلغ درخواست بازپرداخت (تومان)</span>
                          <input
                            className="input"
                            name="amount"
                            type="number"
                            min="1"
                            max={b.total - b.refundedToman}
                            defaultValue={b.total - b.refundedToman}
                            required
                          />
                        </label>
                        <label style={{ flex: 2 }}>
                          <span>دلیل درخواست</span>
                          <textarea
                            className="input"
                            name="reason"
                            rows={2}
                            minLength={10}
                            maxLength={1000}
                            placeholder="علت درخواست بازپرداخت را حداقل در ۱۰ نویسه بنویسید…"
                            required
                          />
                        </label>
                        <button className="btn btn-outline" disabled={busy}>
                          ثبت درخواست بازپرداخت
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Wallet Ledger & Transactions Section */}
          <section id="wallet-history" className="p-card nk-finance-section">
            <div className="nk-finance-section__head">
              <div>
                <h2 className="t-h3">گردش کیف پول و تراکنش‌ها</h2>
                <p className="t-caption t-muted">تمامی واریزها، کسر بابت رزرو کلاس‌ها، هدایای کلاب و بازپرداخت‌ها</p>
              </div>
            </div>

            {!data.wallet.transactions.length ? (
              <div className="nk-finance-empty">
                <IconReceipt size={28} />
                <p style={{ margin: 0, fontWeight: 700 }}>تراکنشی در دفتر کل کیف پول ثبت نشده است.</p>
              </div>
            ) : (
              <div className="nk-finance-ledger">
                {data.wallet.transactions.map((t, i) => {
                  const amountToman = Math.round(t.amount_rial / 10);
                  const isPositive = amountToman >= 0;
                  return (
                    <div key={i} className="nk-finance-ledger-row">
                      <div className="nk-finance-ledger-row__right">
                        <span className={`nk-finance-ledger-row__icon ${isPositive ? 'is-in' : 'is-out'}`}>
                          {isPositive ? '+' : '−'}
                        </span>
                        <div>
                          <strong style={{ fontSize: 14, color: 'var(--ink)' }}>
                            {KIND_LABELS[t.kind] || t.kind}
                          </strong>
                          <div className="t-caption t-muted num" style={{ marginTop: 2 }}>
                            {new Date(t.created_at).toLocaleDateString('fa-IR')}
                            {t.reference ? ` · مرجع: ${t.reference}` : ''}
                          </div>
                        </div>
                      </div>
                      <strong
                        className="num"
                        style={{
                          color: isPositive ? 'var(--primary)' : 'var(--error)',
                          fontSize: 15.5,
                          background: isPositive ? 'var(--secondary-50)' : 'var(--error-50)',
                          padding: '6px 12px',
                          borderRadius: 'var(--r-full)',
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {faPrice(amountToman)} تومان
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}

            {Array.isArray(data.payments) && data.payments.length > 0 && (
              <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <h3 className="t-h4" style={{ marginBottom: 12 }}>
                  سوابق درخواست‌های درگاه پرداخت
                </h3>
                <div className="nk-finance-ledger">
                  {data.payments.map((p) => (
                    <div key={p.id} className="nk-finance-ledger-row">
                      <div>
                        <strong style={{ fontSize: 14 }}>
                          {p.purpose === 'booking' ? `پرداخت رزرو #${faNum(p.bookingId)}` : 'شارژ کیف پول'} ·{' '}
                          <span className="num">{faPrice(p.amount)} تومان</span>
                        </strong>
                        <div className="t-caption t-muted num" style={{ marginTop: 3 }}>
                          وضعیت: {status[p.status] || p.status}
                          {p.reference ? ` · رسید: ${p.reference}` : ''}
                        </div>
                      </div>
                      <Link className="btn btn-outline btn-sm" to={`/payment/result?id=${encodeURIComponent(p.id)}`}>
                        {p.status === 'pending' ? 'تکمیل / بررسی پرداخت' : 'مشاهده رسید'}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Refund Requests Section */}
      <section className="p-card nk-finance-section">
        <div className="nk-finance-section__head">
          <div>
            <h2 className="t-h3">درخواست‌های بازپرداخت</h2>
            <p className="t-caption t-muted">پیگیری وضعیت بازگشت وجه رزروها به کیف پول</p>
          </div>
        </div>
        {data && !data.refunds.length && (
          <p className="t-small t-muted" style={{ margin: 0 }}>
            درخواستی ثبت نشده است.
          </p>
        )}
        <div className="nk-finance-list">
          {data?.refunds.map((r) => (
            <article className="nk-finance-item-card nimchat-report" key={r.id}>
              <div className="nk-finance-item-card__head">
                <h3>
                  رزرو {faNum(r.booking_id)} · {faPrice(r.amount_toman)} تومان
                </h3>
                <span className={`chip ${STATUS_TONE[r.status] || 'outline'}`}>
                  {status[r.status] || r.status}
                </span>
              </div>
              <p style={{ marginTop: 6 }}>{r.reason}</p>
              <p className="t-caption t-muted" style={{ marginTop: 4 }}>
                {status[r.status]} {r.note ? `· ${r.note}` : ''}
              </p>
              {admin && r.status === 'pending' && (
                <form className="nk-finance-refund-form teaching-slot-form" onSubmit={(e) => action(e, r.id)}>
                  <label>
                    <span>تصمیم</span>
                    <select name="decision" className="select input">
                      <option value="credited">بازپرداخت به کیف پول</option>
                      <option value="rejected">رد درخواست</option>
                    </select>
                  </label>
                  <label style={{ flex: 2 }}>
                    <span>توضیح بررسی</span>
                    <textarea name="note" minLength={10} maxLength={1000} className="input" required />
                  </label>
                  <button className="btn btn-primary" disabled={busy}>
                    ثبت نتیجهٔ مالی
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
        {admin && (
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {offset > 0 && (
              <button className="btn btn-outline" onClick={() => setOffset((n) => Math.max(0, n - 100))}>
                صفحهٔ قبل
              </button>
            )}
            {data?.hasMore && (
              <button className="btn btn-outline" onClick={() => setOffset((n) => n + 100)}>
                صفحهٔ بعد
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
