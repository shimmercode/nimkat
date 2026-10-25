'use client';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation } from '../routing/navigation';

/** One short route-entry transition; never delay navigation or trap focus. */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={false}
      animate={reduce ? { opacity: 1, y: 0 } : { opacity: [.8, 1], y: [8, 0] }}
      transition={{ duration: reduce ? 0 : .24, ease: [.22, 1, .36, 1] }}
      className="tw:min-w-0"
    >
      {children}
    </motion.div>
  );
}
