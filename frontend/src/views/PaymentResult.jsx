'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { faPrice, faNum } from '../utils/fa.js';
import { useSearchParams, Link } from '../routing/navigation';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const queryAuthority = params.get('authority') || '';
  const cancelledFlag = params.get('cancelled') === '1';
  const verifyFailedFlag = params.get('verifyFailed') === '1';

  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devNotice, setDevNotice] = useState('');

  const load = useCallback(() => {
    setError('');
    if (!id) {
      setError('شناسه پرداخت موجود نیست.');
      return;
    }
    api(`/payments/${encodeURIComponent(id)}`)
      .then((r) => {
        setPayment(r.payment);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('nk:wallet-updated'));
        }
      })
      .catch((e) => setError(e.message || 'خطا در بررسی وضعیت پرداخت'));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const authority = payment?.authority || queryAuthority;
  const isLocalDev = payment?.mode === 'local_dev' || params.get('devGateway') === '1';

  const simulateCallback = async (statusParam) => {
    if (!id || !authority || busy) return;
    setBusy(true);
    setError('');
    setDevNotice('');
    try {
      const r = await api(
        `/payments/callback/${encodeURIComponent(id)}?Status=${encodeURIComponent(statusParam)}&Authority=${encodeURIComponent(authority)}&format=json`
      );
      if (r.payment) {
        setPayment(r.payment);
      } else {
        load();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('nk:wallet-updated'));
      }
      if (r.idempotentReplay) {
        setDevNotice('این تراکنش قبلاً تأیید شده است؛ ارسال مجدد Callback باعث شارژ یا ثبت دوباره نشد (تأیید Idempotency).');
      } else if (r.cancelled) {
        setDevNotice('تراکنش آزمایشی توسط کاربر لغو شد؛ هیچ مبلغی به کیف پول اضافه نشد.');
      } else if (r.ok) {
        setDevNotice('تراکنش آزمایشی محیط توسعه در سمت سرور تأیید و در دفتر کل ثبت شد.');
      }
    } catch (err) {
      setError(err.message || 'خطا در اجرای Callback درگاه');
    } finally {
      setBusy(false);
    }
  };

  const labels = {
    sandbox_paid: 'پرداخت آزمایشی تأیید شد؛ پول واقعی، شارژ کیف پول یا رزرو نهایی ایجاد نشده است.',
    paid: 'پرداخت توسط درگاه تأیید شد و در حساب شما ثبت گردید.',
    paid_unallocated: 'پرداخت تأیید شد ولی مهلت رزرو تمام شده؛ مبلغ به کیف پول واقعی شما اضافه شد.',
    pending: 'پرداخت هنوز تأیید نشده؛ در صورت کسر وجه با پشتیبانی پیگیری کنید.',
    creating: 'درخواست پرداخت در حال ایجاد است.',
    cancelled: 'پرداخت توسط کاربر لغو شد؛ هیچ مبلغی کسر یا اضافه نگردید.',
    failed: 'ایجاد یا تأیید پرداخت ناموفق بود؛ هیچ مبلغی به کیف پول اضافه نشد.',
  };

  const isPaid = payment?.status === 'paid' || payment?.status === 'paid_unallocated' || payment?.status === 'sandbox_paid';
  const isFailed = payment?.status === 'cancelled' || payment?.status === 'failed' || cancelledFlag || verifyFailedFlag;

  return (
    <main className="container section" dir="rtl">
      <div className="p-card" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="t-h2">نتیجه پرداخت</h1>
          <span className={`chip ${isPaid ? 'soft-green' : isFailed ? 'soft-error' : 'soft-orange'}`}>
            {isPaid ? 'تأییدشده ✓' : isFailed ? 'لغو / ناموفق' : 'در انتظار تأیید'}
          </span>
        </div>
        {error ? (
          <p role="alert" className="nk-ds-alert nk-ds-alert--error" style={{ marginTop: 12, fontWeight: 700 }}>
            {error}
          </p>
        ) : (
          <p
            role="status"
            className={`nk-ds-alert ${isPaid ? 'nk-ds-alert--success' : isFailed ? 'nk-ds-alert--error' : 'nk-ds-alert--warning'}`}
            style={{
              marginTop: 12,
              fontWeight: 700,
              color: isPaid ? 'var(--primary)' : isFailed ? 'var(--error)' : 'var(--n700)',
            }}
          >
            {payment ? labels[payment.status] || payment.status : 'در حال بررسی…'}
          </p>
        )}

        {devNotice && (
          <div
            role="status"
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              background: 'var(--secondary-50)',
              color: 'var(--primary-900)',
              fontSize: 13.5,
              fontWeight: 700,
            }}
          >
            {devNotice}
          </div>
        )}

        {payment && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 18px',
              borderRadius: 'var(--r-lg)',
              background: 'var(--n50)',
              display: 'grid',
              gap: 8,
              fontSize: 14,
            }}
          >
            <div>
              نوع تراکنش:{' '}
              <b>
                {payment.purpose === 'booking'
                  ? `رزرو کلاس (شناسه رزرو #${faNum(payment.bookingId)})`
                  : 'افزایش موجودی کیف پول'}
              </b>
            </div>
            <div className="num">
              مبلغ: <b>{faPrice(payment.amount)} تومان</b> ({faPrice(payment.amountRial)} ریال)
            </div>
            <div className="num">
              رسید: <b>{payment.reference || 'هنوز ثبت نشده'}</b>
            </div>
          </div>
        )}

        {isLocalDev && authority && (
          <section
            aria-label="درگاه تست کنترل‌شده محیط توسعه"
            style={{
              marginTop: 20,
              padding: '16px 18px',
              borderRadius: 'var(--r-lg)',
              border: '1.5px dashed var(--primary)',
              background: 'var(--secondary-50)',
            }}
          >
            <h2 className="t-h4" style={{ color: 'var(--primary-900)' }}>
              شبیه‌ساز کنترل‌شدهٔ Callback درگاه (ویژه محیط توسعه)
            </h2>
            <p className="t-small" style={{ color: 'var(--n700)', marginTop: 6 }}>
              این درخواست در محیط توسعه (بدون اتصال به درگاه بانکی واقعی شاپرک) ساخته شده است. برای آزمایش رفتار واقعی سرور در برابر تأیید، لغو یا تکرار Callback یکی از گزینه‌های زیر را اجرا کنید:
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              {payment?.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy}
                    onClick={() => simulateCallback('OK')}
                  >
                    تأیید تراکنش آزمایشی و ثبت در دفتر کل (Status=OK)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy}
                    onClick={() => simulateCallback('NOK')}
                  >
                    لغو پرداخت توسط کاربر (Status=NOK)
                  </button>
                </>
              )}
              {(payment?.status === 'paid' || payment?.status === 'paid_unallocated') && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => simulateCallback('OK')}
                >
                  ارسال مجدد Callback (تست جلوگیری از شارژ تکراری)
                </button>
              )}
            </div>
          </section>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          <button type="button" className="btn btn-outline" onClick={load}>
            بررسی دوباره
          </button>
          <Link className="btn btn-primary" to="/panel/finance">
            کیف پول و امور مالی
          </Link>
          <Link className="btn btn-outline" to="/panel">
            پنل من
          </Link>
          <Link className="btn btn-ghost" to="/admin/integrations">
            تنظیمات مدیر
          </Link>
        </div>
      </div>
    </main>
  );
}
