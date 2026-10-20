import Link from 'next/link';
export default function NotFound() {
  return <div className="container section"><h1>صفحه پیدا نشد</h1><Link href="/" className="btn btn-primary">بازگشت به خانه</Link></div>;
}
