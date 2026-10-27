'use client';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { faNum, faPrice } from '../utils/fa.js';
import { DsKpiCard } from '../components/ui/design-system.jsx';
import { IconChart, IconUsers, IconReceipt, IconRefresh } from '../components/icons.jsx';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/analytics')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="container section">
      <h1 className="t-h2">تحلیل خرید و بازگشت مشتری</h1>
      <p className="t-small t-muted" style={{ marginTop: 6 }}>
        فقط خرید دارای سند مالی واقعی؛ پرداخت آزمایشی، شارژ کیف پول و آمار نمونه حذف شده‌اند.
      </p>
      {error && (
        <p role="alert" className="nk-ds-alert nk-ds-alert--error">
          {error}
        </p>
      )}
      {!data && !error && (
        <div role="status" aria-busy="true" className="nk-ds-loading">
          <p className="nk-ds-loading__label" style={{ margin: 0 }}>محاسبه از اسناد واقعی…</p>
        </div>
      )}
      {data && (
        <>
          <div className="nk-ds-kpi-grid">
            <DsKpiCard
              label="رزروهای قطعی (۳۶۵ روز)"
              value={`${faNum(data.purchases.bookings)} رزرو`}
              sub="دارای سند مالی واقعی"
              tone="primary"
              icon={IconChart}
            />
            <DsKpiCard
              label="خریداران یکتا"
              value={`${faNum(data.purchases.buyers)} نفر`}
              sub="کاربران دارای خرید قطعی"
              tone="secondary"
              icon={IconUsers}
            />
            <DsKpiCard
              label="حجم کل خرید"
              value={`${faPrice(data.purchases.amountToman)} تومان`}
              sub="قبل از کسر بازپرداخت‌ها"
              tone="accent"
              icon={IconReceipt}
            />
            <DsKpiCard
              label="بازپرداخت به کیف پول"
              value={`${faPrice(data.refunds.amountToman)} تومان`}
              sub={`${faNum(data.refunds.requests)} درخواست تأییدشده`}
              tone="error"
              icon={IconRefresh}
            />
          </div>

          <section className="teaching-card">
            <h2 className="t-h3">۳۶۵ روز اخیر</h2>
            <p className="t-small" style={{ marginTop: 6 }}>
              {faNum(data.purchases.bookings)} رزرو · {faNum(data.purchases.buyers)} خریدار ·{' '}
              {faPrice(data.purchases.amountToman)} تومان مبلغ خرید قبل از بازپرداخت
            </p>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              {faNum(data.refunds.requests)} بازپرداخت به کیف پول · {faPrice(data.refunds.amountToman)} تومان؛ این ارقام درآمد یا تسویه بانکی نیستند.
            </p>
          </section>

          <div className="operations-table-wrap">
            <table className="operations-table">
              <caption>گروه‌بندی با ماه میلادی UTC؛ خط تیره یعنی هنوز دورهٔ سنجش کامل نشده است</caption>
              <thead>
                <tr>
                  <th scope="col">ماه اولین خرید</th>
                  <th scope="col">خریداران</th>
                  <th scope="col">واجد ۳۰ روز</th>
                  <th scope="col">رزرو مجدد ۳۰روزه</th>
                  <th scope="col">واجد M1</th>
                  <th scope="col">بازگشت ماه بعد</th>
                </tr>
              </thead>
              <tbody>
                {data.cohorts.map((c) => (
                  <tr key={c.month}>
                    <th scope="row" className="num">{faNum(c.month)}</th>
                    <td className="num">{faNum(c.buyers)}</td>
                    <td className="num">{faNum(c.matureBuyers)}</td>
                    <td className="num">
                      {c.rebooking30dPercent === null
                        ? '—'
                        : `${faNum(c.rebooked30d)} (${faNum(c.rebooking30dPercent)}٪)`}
                    </td>
                    <td className="num">{faNum(c.matureM1Buyers)}</td>
                    <td className="num">
                      {c.retentionM1Percent === null
                        ? '—'
                        : `${faNum(c.retainedM1)} (${faNum(c.retentionM1Percent)}٪)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.cohorts.length && (
            <p className="t-small t-muted">در بازهٔ انتخاب‌شده خریدار اولی با سند واقعی وجود ندارد.</p>
          )}

          <section className="teaching-card" style={{ marginTop: 20 }}>
            <h2 className="t-h3">تعریف دقیق شاخص‌ها</h2>
            <dl style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              {Object.entries(data.definitions).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--n50)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <dt dir="ltr" style={{ fontWeight: 800, color: 'var(--primary-900)', fontSize: 13 }}>{k}</dt>
                  <dd style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </main>
  );
}
