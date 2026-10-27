'use client';
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation } from '../routing/navigation';

/**
 * Route-entry transition for Next.js App Router:
 * - Zero animation / zero jump on initial SSR & hydration mount (`initial={false}`).
 * - Subtle 180ms opacity transition only on subsequent pathname changes.
 * - Never applies ancestor transform (`y`) that would break `position: sticky` sidebars.
 * - Preserves semantic `<main>` landmark required by accessibility & E2E suites.
 * - Honors `prefers-reduced-motion: reduce`.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const initialPathRef = useRef(pathname);
  const hasNavigatedRef = useRef(false);

  if (pathname !== initialPathRef.current) {
    hasNavigatedRef.current = true;
  }

  useEffect(() => {
    initialPathRef.current = pathname;
  }, [pathname]);

  const shouldAnimate = hasNavigatedRef.current && !reduce;

  return (
    <motion.main
      key={pathname}
      initial={shouldAnimate ? { opacity: 0.92 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldAnimate ? 0.18 : 0, ease: [0.22, 1, 0.36, 1] }}
      className="tw:min-w-0 nk-page-transition"
    >
      {children}
    </motion.main>
  );
}
