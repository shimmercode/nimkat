'use client';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '../../routing/navigation';
import { api } from '../../api.js';
import { faPrice, faNum } from '../../utils/fa.js';

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

  return (
    <section className="teaching-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="t-h2">{admin ? 'مدیریت بازپرداخت‌ها' : 'امور مالی و رزروها'}</h1>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={busy}
          onClick={() => load().catch((e) => setError(e.message))}
        >
          بروزرسانی اطلاعات مالی
        </button>
      </div>
      <p style={{ marginTop: 6 }}>
        بازپرداخت این مسیر به کیف پول واقعی است، نه واریز بانکی. بازپرداخت کاملِ خدمت شروع‌نشده رزرو را لغو می‌کند؛ بازپرداخت جزئی به‌تنهایی کلاس را لغو نمی‌کند.
      </p>
      {error && (
        <p role="alert" style={{ color: 'var(--error)', fontWeight: 700, marginTop: 10 }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 10 }}>
          {notice}
        </p>
      )}
      {!data && !error && <p role="status">دریافت اطلاعات…</p>}

      {!admin && data && (
        <>
          <div id="wallet-charge" className="p-card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 className="t-h3 num">موجودی کیف پول: {faPrice(data.wallet.balance)} تومان</h2>
              {data.gatewayStatus?.mode === 'local_dev' && (
                <span className="badge badge-accent">درگاه تست کنترل‌شده محیط توسعه فعال</span>
              )}
              {data.gatewayStatus?.mode === 'sandbox' && (
                <span className="badge badge-warn">حالت آزمایشی درگاه (Sandbox)</span>
              )}
              {data.gatewayStatus?.mode === 'live' && (
                <span className="badge badge-green">درگاه پرداخت آنلاین فعال</span>
              )}
            </div>
            <p className="t-small t-muted" style={{ marginTop: 6 }}>
              این موجودی با درآمد قابل تسویهٔ استاد متفاوت است. درخواست برداشت درآمد و ثبت واریز دستی در بخش «درآمد و برداشت» انجام می‌شود.
            </p>
            {data.gatewayStatus?.mode === 'local_dev' && (
              <div
                style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--secondary-50)',
                  color: 'var(--primary-900)',
                  fontSize: 13,
                }}
              >
                در محیط توسعه (بدون کلید زرین‌پال خارجی)، پس از کلیک روی «انتقال به درگاه» به صفحهٔ{' '}
                <b>تأیید/لغو کنترل‌شدهٔ تراکنش</b> منتقل می‌شوید تا چرخهٔ کامل Callback سمت سرور، ثبت دفتر کل و جلوگیری از شارژ تکراری را آزمایش کنید.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }} aria-label="مبالغ پیشنهادی شارژ">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`chip ${Number(normalizeNumericInput(chargeAmount)) === preset ? 'is-active' : ''}`}
                  onClick={() => {
                    setChargeAmount(String(preset));
                    setChargeError('');
                  }}
                >
                  {faPrice(preset)} تومان
                </button>
              ))}
            </div>

            <form className="teaching-slot-form" onSubmit={charge} style={{ marginTop: 12 }}>
              <label style={{ flex: 1, minWidth: 220 }}>
                مبلغ شارژ (تومان) — حداقل ۱٬۰۰۰ تومان
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
              <button type="submit" disabled={busy} className="btn btn-primary">
                {busy ? 'در حال ارتباط با درگاه…' : 'انتقال به درگاه'}
              </button>
            </form>
            {chargeError && (
              <p role="alert" style={{ color: 'var(--error)', fontSize: 13, marginTop: 8 }}>
                {chargeError}
              </p>
            )}
          </div>

          <h2 className="t-h3" style={{ marginTop: 22 }}>
            رزروهای من
          </h2>
          {!data.bookings.length && <p>هنوز رزروی ثبت نشده است.</p>}
          {data.bookings.map((b) => (
            <article className="nimchat-report" key={b.id}>
              <h3>
                {b.title} · رزرو {faNum(b.id)}
              </h3>
              <p>
                {status[b.status] || b.status} · پرداخت: {faPrice(b.total)} تومان · برگشت‌شده:{' '}
                {faPrice(b.refundedToman)} تومان
              </p>
              {b.canRequestRefund && (
                <form className="teaching-slot-form" onSubmit={(e) => action(e, b.id)}>
                  <label>
                    مبلغ درخواست بازپرداخت (تومان)
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
                  <label>
                    دلیل درخواست
                    <textarea className="input" name="reason" minLength={10} maxLength={1000} required />
                  </label>
                  <button className="btn btn-outline" disabled={busy}>
                    ثبت درخواست بازپرداخت
                  </button>
                </form>
              )}
            </article>
          ))}

          <div id="wallet-history" style={{ marginTop: 22 }}>
            <h2 className="t-h3">گردش کیف پول و تراکنش‌ها</h2>
            {!data.wallet.transactions.length ? (
              <p>تراکنشی در دفتر کل کیف پول ثبت نشده است.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {data.wallet.transactions.map((t, i) => {
                  const amountToman = Math.round(t.amount_rial / 10);
                  const isPositive = amountToman >= 0;
                  return (
                    <div
                      key={i}
                      className="p-card"
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong>{KIND_LABELS[t.kind] || t.kind}</strong>
                        <div className="t-small t-muted num">
                          {new Date(t.created_at).toLocaleDateString('fa-IR')}
                          {t.reference ? ` · مرجع: ${t.reference}` : ''}
                        </div>
                      </div>
                      <strong
                        className="num"
                        style={{ color: isPositive ? 'var(--primary)' : 'var(--error)', fontSize: 15 }}
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
              <div style={{ marginTop: 18 }}>
                <h3 className="t-h4" style={{ marginBottom: 8 }}>
                  سوابق درخواست‌های درگاه پرداخت
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-card"
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong>
                          {p.purpose === 'booking' ? `پرداخت رزرو #${faNum(p.bookingId)}` : 'شارژ کیف پول'} ·{' '}
                          {faPrice(p.amount)} تومان
                        </strong>
                        <div className="t-small t-muted num">
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
          </div>
        </>
      )}

      <h2 className="t-h3" style={{ marginTop: 22 }}>
        درخواست‌های بازپرداخت
      </h2>
      {data && !data.refunds.length && <p>درخواستی ثبت نشده است.</p>}
      {data?.refunds.map((r) => (
        <article className="nimchat-report" key={r.id}>
          <h3>
            رزرو {faNum(r.booking_id)} · {faPrice(r.amount_toman)} تومان
          </h3>
          <p>{r.reason}</p>
          <p>
            {status[r.status]} · {r.note}
          </p>
          {admin && r.status === 'pending' && (
            <form className="teaching-slot-form" onSubmit={(e) => action(e, r.id)}>
              <label>
                تصمیم
                <select name="decision" className="select">
                  <option value="credited">بازپرداخت به کیف پول</option>
                  <option value="rejected">رد درخواست</option>
                </select>
              </label>
              <label>
                توضیح بررسی
                <textarea name="note" minLength={10} maxLength={1000} className="input" required />
              </label>
              <button className="btn btn-primary" disabled={busy}>
                ثبت نتیجهٔ مالی
              </button>
            </form>
          )}
        </article>
      ))}
      {admin && (
        <div style={{ display: 'flex', gap: 12 }}>
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
  );
}
