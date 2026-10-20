import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageRenderer from '../render/PageRenderer.jsx';
import { api } from '../api.js';

/* Custom pages built with the page editor, published at /p/:slug */
export default function CustomPage() {
  const { slug } = useParams();
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(`/pages/${slug}`)
      .then((d) => setSchema(d.page?.schema || null))
      .catch(() => setSchema(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="container section">در حال بارگذاری…</div>;
  if (!schema) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h1 className="t-h3">صفحه پیدا نشد</h1>
        <p className="t-small t-muted" style={{ marginTop: 12 }}>این صفحه هنوز منتشر نشده است.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 18 }}>بازگشت به صفحه اصلی</Link>
      </div>
    );
  }
  return <PageRenderer schema={schema} />;
}
