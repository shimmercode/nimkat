'use client';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSearchParams, Link } from '../routing/navigation';
export default function PaymentResult() {
  const [params] = useSearchParams(), id = params.get('id');
  const [payment, setPayment] = useState(null), [error, setError] = useState('');
  const load = () => { setError(''); if (id) api(`/payments/${encodeURIComponent(id)}`).then(r => setPayment(r.payment)).catch(e => setError(e.message)); else setError('شناسه پرداخت موجود نیست.'); };
  useEffect(() => { load(); }, [id]);
  const labels = { sandbox_paid: 'پرداخت آزمایشی تأیید شد؛ پول واقعی، شارژ کیف پول یا رزرو نهایی ایجاد نشده است.', paid: 'پرداخت توسط درگاه تأیید شد', paid_unallocated: 'پرداخت تأیید شد ولی مهلت رزرو تمام شده؛ مبلغ به کیف پول واقعی شما اضافه شد.', pending: 'پرداخت هنوز تأیید نشده؛ در صورت کسر وجه با پشتیبانی پیگیری کنید.', creating: 'درخواست پرداخت در حال ایجاد است.', failed: 'ایجاد پرداخت ناموفق بود.' };
  return <main className="container section" dir="rtl"><h1 className="t-h2">نتیجه پرداخت</h1>{error ? <p role="alert">{error}</p> : <p role="status">{payment ? labels[payment.status] || payment.status : 'در حال بررسی…'}</p>}{payment && <p>مبلغ: {payment.amount.toLocaleString('fa-IR')} تومان<br />رسید: {payment.reference || 'هنوز ثبت نشده'}</p>}<div style={{ display: 'flex', gap: 16, marginTop: 24 }}><button className="btn btn-outline" onClick={load}>بررسی دوباره</button><Link className="btn btn-primary" to="/panel">پنل من</Link><Link className="btn btn-outline" to="/admin/integrations">تنظیمات مدیر</Link></div></main>;
}
