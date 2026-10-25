import { Suspense } from 'react';
import Login from '../../../views/Login.jsx';
export const metadata = { title: 'ورود به نیمکت', robots: { index: false, follow: false } };
export default function LoginPage() { return <Suspense fallback={<div className="container section">در حال بارگذاری…</div>}><Login /></Suspense>; }
