'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from '../routing/navigation';
import { IconX, IconSparkle, IconCheck, IconArrowLeft } from './icons.jsx';
import { faNum } from '../utils/fa.js';
import { toast } from '../utils/toast.js';

export const PROMO_DISMISS_STORAGE_KEY = 'nk_first_reg_promo_dismissed_v1';

export default function FirstRegistrationPromoModal({
  promo = null,
  user = null,
  preview = false,
  suppressed = false,
}) {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROMO_DISMISS_STORAGE_KEY);
      if (saved === '1') setDismissed(true);
    } catch {}
    setHydrated(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(PROMO_DISMISS_STORAGE_KEY, '1');
    } catch {}
  }, []);

  const handleReopen = useCallback(() => {
    setDismissed(false);
    try {
      window.localStorage.removeItem(PROMO_DISMISS_STORAGE_KEY);
    } catch {}
  }, []);

  const isHomeRoute = pathname === '/';
  const isEligible =
    Boolean(promo) &&
    promo.active === true &&
    Number(promo.percent) > 0 &&
    Boolean(promo.code) &&
    promo.eligibleForFirstRegistration !== false &&
    !user;

  useEffect(() => {
    if (!isHomeRoute || !isEligible || dismissed || suppressed || preview) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    const onOutsideInteract = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onOutsideInteract, true);
    window.addEventListener('focusin', onOutsideInteract, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onOutsideInteract, true);
      window.removeEventListener('focusin', onOutsideInteract, true);
    };
  }, [isHomeRoute, isEligible, dismissed, suppressed, preview, handleDismiss]);

  if (preview || !isHomeRoute || !hydrated || !isEligible || suppressed) {
    return null;
  }

  const copyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(promo.code);
      }
      setCopied(true);
      toast(`کد تخفیف ${promo.code} کپی شد ✓`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
    }
  };

  if (dismissed) {
    return (
      <div className="nk-promo-reopen-wrap" data-testid="first-reg-promo-reopen">
        <button
          type="button"
          className="nk-promo-reopen-btn"
          onClick={handleReopen}
          aria-label={`باز کردن هدیه ثبت‌نام اول (${faNum(promo.percent)} درصد تخفیف)`}
        >
          <IconSparkle size={15} />
          <span>هدیه ثبت‌نام اول: {faNum(promo.percent)}٪ تخفیف</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="nk-promo-modal-layer"
      role="region"
      aria-label="پنجره تخفیف ویژه ثبت‌نام اول"
      data-testid="first-registration-promo-modal"
    >
      <div
        className="nk-promo-modal-backdrop"
        onClick={handleDismiss}
        aria-hidden="true"
      />
      <div ref={cardRef} className="nk-promo-modal-card">
        <button
          type="button"
          className="nk-promo-modal-close"
          onClick={handleDismiss}
          aria-label="بستن پنجره تخفیف ثبت‌نام اول"
          title="بستن (Esc)"
        >
          <IconX size={18} />
        </button>

        <div className="nk-promo-modal-badge">
          <IconSparkle size={15} />
          <span>پیشنهاد ویژهٔ ورود به نیمکت</span>
        </div>

        <div className="nk-promo-modal-discount num">
          <span className="nk-promo-modal-discount__num">{faNum(promo.percent)}٪</span>
          <span className="nk-promo-modal-discount__txt">تخفیف واقعی روی اولین رزرو کلاس</span>
        </div>

        <h2 className="nk-promo-modal-title">
          {promo.title || 'هدیهٔ خوش‌آمدگویی ثبت‌نام اول در نیمکت'}
        </h2>
        <p className="nk-promo-modal-desc">
          {promo.subtitle ||
            `با ثبت‌نام در نیمکت، روی اولین رزرو کلاس خود ${faNum(promo.percent)}٪ تخفیف واقعی دریافت کنید.`}
        </p>

        <div className="nk-promo-modal-codebox">
          <div>
            <span className="nk-promo-modal-codebox__label">کد تخفیف فعال در سامانه:</span>
            <strong className="nk-promo-modal-codebox__code" dir="ltr">
              {promo.code}
            </strong>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={copyCode}
            style={{ borderRadius: 10 }}
          >
            {copied ? (
              <>
                <IconCheck size={15} /> کپی شد
              </>
            ) : (
              'کپی کد تخفیف'
            )}
          </button>
        </div>

        <div className="nk-promo-modal-actions">
          <Link
            to={promo.ctaPrimary?.href || `/login?mode=register&promo=${encodeURIComponent(promo.code)}`}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleDismiss}
          >
            {promo.ctaPrimary?.label || 'ثبت‌نام و دریافت کد تخفیف'}
            <IconArrowLeft size={16} />
          </Link>
          <Link
            to={promo.ctaSecondary?.href || '/classes'}
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
            onClick={handleDismiss}
          >
            {promo.ctaSecondary?.label || 'مشاهده کلاس‌ها'}
          </Link>
        </div>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <button
            type="button"
            className="nk-promo-modal-later"
            onClick={handleDismiss}
          >
            فعلاً نه، بعداً یادآوری کن
          </button>
        </div>
      </div>
    </div>
  );
}
