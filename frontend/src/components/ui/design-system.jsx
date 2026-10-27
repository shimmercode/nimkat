'use client';
import React, { useState, useId } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { IconCheck, IconInfo, IconX, IconRefresh } from '../icons.jsx';

/**
 * Nimkat Shared Design System Primitives
 * Built on existing project dependencies (@radix-ui/react-dialog, motion/react)
 * and aligned with SYSTEM DESIGN.pdf tokens (--primary #0A6847, --accent #F28A3D, YekanBakh FaNum).
 */

const VARIANT_CLASS = {
  primary: 'btn btn-primary',
  orange: 'btn btn-orange',
  outline: 'btn btn-outline',
  'outline-green': 'btn btn-outline-green',
  'outline-orange': 'btn btn-outline-orange',
  'soft-green': 'btn btn-soft-green',
  'soft-orange': 'btn btn-soft-orange',
  ghost: 'btn btn-ghost',
};

const SIZE_CLASS = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export function DsButton({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const classes = [
    VARIANT_CLASS[variant] || VARIANT_CLASS.primary,
    SIZE_CLASS[size] || '',
    block ? 'btn-block' : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="nk-btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

const BADGE_CLASS = {
  success: 'chip soft-green nk-ds-badge nk-ds-badge--success',
  warning: 'chip soft-orange nk-ds-badge nk-ds-badge--warning',
  error: 'chip soft-error nk-ds-badge nk-ds-badge--error',
  info: 'chip outline nk-ds-badge nk-ds-badge--info',
  neutral: 'chip nk-ds-badge nk-ds-badge--neutral',
  live: 'chip soft-green nk-ds-badge nk-ds-badge--live',
};

export function DsBadge({ tone = 'neutral', pulse = false, className = '', children, ...rest }) {
  const classes = [BADGE_CLASS[tone] || BADGE_CLASS.neutral, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {(pulse || tone === 'live') && <span className="nk-live-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function DsAlert({
  tone = 'info',
  role,
  title,
  children,
  onRetry,
  retryLabel = 'تلاش دوباره',
  className = '',
  ...rest
}) {
  const reduce = useReducedMotion();
  const resolvedRole = role || (tone === 'error' ? 'alert' : 'status');
  const Icon = tone === 'success' ? IconCheck : IconInfo;

  return (
    <motion.div
      role={resolvedRole}
      initial={reduce ? false : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={`nk-ds-alert nk-ds-alert--${tone} ${className}`.trim()}
      {...rest}
    >
      <span className="nk-ds-alert__icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="nk-ds-alert__body">
        {title && <strong className="nk-ds-alert__title">{title}</strong>}
        <div className="nk-ds-alert__text">{children}</div>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          <IconRefresh size={14} /> {retryLabel}
        </button>
      )}
    </motion.div>
  );
}

export function DsEmptyState({
  icon: Icon = IconInfo,
  title,
  description,
  action,
  role = 'status',
  className = '',
}) {
  return (
    <div role={role} className={`nk-ds-empty ${className}`.trim()}>
      <span className="nk-ds-empty__icon" aria-hidden="true">
        <Icon size={24} />
      </span>
      {title && <h3 className="nk-ds-empty__title">{title}</h3>}
      {description && <p className="nk-ds-empty__desc">{description}</p>}
      {action && <div className="nk-ds-empty__action">{action}</div>}
    </div>
  );
}

export function DsLoadingState({ label = 'در حال دریافت اطلاعات…', rows = 3, className = '' }) {
  return (
    <div role="status" aria-busy="true" className={`nk-ds-loading ${className}`.trim()}>
      <p className="nk-ds-loading__label">{label}</p>
      <div className="nk-ds-loading__rows" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="nk-skeleton-line"
            style={{ height: 44, width: i === rows - 1 ? '72%' : '100%', borderRadius: 'var(--r-md)' }}
          />
        ))}
      </div>
    </div>
  );
}

export function DsKpiCard({ label, value, sub, tone = 'primary', icon: Icon, className = '' }) {
  return (
    <div className={`nk-ds-kpi nk-ds-kpi--${tone} ${className}`.trim()}>
      <div className="nk-ds-kpi__top">
        <span className="nk-ds-kpi__label">{label}</span>
        {Icon && (
          <span className="nk-ds-kpi__icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}
      </div>
      <strong className="nk-ds-kpi__value num">{value}</strong>
      {sub && <span className="nk-ds-kpi__sub num">{sub}</span>}
    </div>
  );
}

export function DsDialog({ open, onOpenChange, title, description, children, maxWidth = 520 }) {
  const reduce = useReducedMotion();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="nk-ds-dialog-overlay"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <motion.div
                dir="rtl"
                className="nk-ds-dialog-content card"
                style={{ maxWidth }}
                initial={reduce ? false : { opacity: 0, scale: 0.97, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.98, y: 4 }}
                transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="nk-ds-dialog-head">
                  <div>
                    {title && (
                      <DialogPrimitive.Title className="t-h3">{title}</DialogPrimitive.Title>
                    )}
                    {description && (
                      <DialogPrimitive.Description className="t-small t-muted" style={{ marginTop: 4 }}>
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close asChild>
                    <button type="button" className="btn-icon-round" aria-label="بستن پنجره">
                      <IconX size={18} />
                    </button>
                  </DialogPrimitive.Close>
                </div>
                <div className="nk-ds-dialog-body">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export function DsTabs({ items = [], value, onChange, ariaLabel = 'بخش‌ها', className = '' }) {
  return (
    <div className={`segmented nk-ds-tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const key = Array.isArray(item) ? item[0] : item.value;
        const label = Array.isArray(item) ? item[1] : item.label;
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'is-active' : ''}
            onClick={() => onChange?.(key)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function DsTooltip({ content, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="nk-ds-tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && content && (
        <span id={id} role="tooltip" className="nk-ds-tooltip">
          {content}
        </span>
      )}
    </span>
  );
}

export function DsTable({ caption, headers = [], children, className = '' }) {
  return (
    <div className={`operations-table-wrap nk-ds-table-wrap ${className}`.trim()}>
      <table className="operations-table nk-ds-table">
        {caption && <caption>{caption}</caption>}
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
