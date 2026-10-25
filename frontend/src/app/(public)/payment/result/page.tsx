import { Suspense } from 'react';
import PaymentResult from '../../../../views/PaymentResult.jsx';
export const metadata = { title: 'نتیجه پرداخت | نیمکت', robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<p>در حال بررسی…</p>}><PaymentResult /></Suspense>; }
