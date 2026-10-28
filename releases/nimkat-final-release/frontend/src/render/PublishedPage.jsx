'use client';
import { useEffect, useState } from 'react';
import { useParams } from '../routing/navigation';
import { api } from '../api.js';
import PageRenderer from './PageRenderer.jsx';
import { EntityProvider } from './EntityContext.jsx';

/** Per-record override → shared page template → approved functional fallback.
 *  Never render a previous teacher/class's schema while a new request is loading,
 *  and never trigger a redundant re-render when client schema matches SSR initialSchema.
 */
/** @param {{ slug: string, recordPrefix?: string | null, fallback: import('react').ComponentType<any>, initialSchema?: import('../types/page-builder').PageSchema | null, initialKey?: string | null, initialEntity?: any }} props */
export default function PublishedPage({
  slug,
  recordPrefix = null,
  fallback: Fallback,
  initialSchema = null,
  initialKey = null,
  initialEntity = null,
}) {
  const { id } = useParams();
  const key = recordPrefix && id ? `${recordPrefix}-${id}` : slug;
  const [result, setResult] = useState({ key: initialKey ?? key, schema: initialSchema });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let data = await api(`/pages/${key}`);
        if (!data.page && key !== slug) data = await api(`/pages/${slug}`);
        const nextSchema = data.page?.schema || null;
        if (active) {
          setResult((prev) => {
            if (prev.key === key && JSON.stringify(prev.schema) === JSON.stringify(nextSchema)) {
              return prev;
            }
            return { key, schema: nextSchema };
          });
        }
      } catch {
        if (active) {
          setResult((prev) => (prev.key === key && prev.schema === null ? prev : { key, schema: null }));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [key, slug]);

  return (
    <EntityProvider value={initialEntity}>
      {result.key === key && result.schema ? (
        <PageRenderer key={key} schema={result.schema} />
      ) : (
        <Fallback key={key} />
      )}
    </EntityProvider>
  );
}
