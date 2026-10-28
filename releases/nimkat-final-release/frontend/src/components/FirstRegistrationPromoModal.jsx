'use client';
import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { Link, useLocation } from '../routing/navigation';
import { IconX, IconSparkle, IconCheck, IconArrowLeft, IconGift } from './icons.jsx';
import { faNum } from '../utils/fa.js';
import { toast } from '../utils/toast.js';

export const PROMO_DISMISS_STORAGE_KEY = 'nk_first_reg_promo_dismissed_v1';

export default function FirstRegistrationPromoModal({
  promo = null,
  promotion = null,
  open = undefined,
  onClose = null,
  user = null,
  preview = false,
  suppressed = false,
}) {
  const { pathname } = useLocation();
  const titleId = useId();
  const descId = useId();
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
  const userInteractedEarlyRef = useRef(false);

  const activePromo = promo || promotion;

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(PROMO_DISMISS_STORAGE_KEY) ||
        window.sessionStorage.getItem(PROMO_DISMISS_STORAGE_KEY);
      if (saved === '1') setDismissed(true);
    } catch {}
    setHydrated(true);
  }, []);

  // Wait briefly (450ms) before popping up centered modal so automated form interactions
  // at 0ms (e.g. HeroSearch selectOption) are never interrupted mid-action.
  useEffect(() => {
    if (open === true) {
      setReadyToShow(true);
      return undefined;
    }
    const onEarlyFormInteract = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'select' || tag === 'input' || tag === 'textarea') {
        userInteractedEarlyRef.current = true;
        setDismissed(true);
      }
    };
    document.addEventListener('change', onEarlyFormInteract, true);
    document.addEventListener('input', onEarlyFormInteract, true);
    const timer = setTimeout(() => {
      if (!userInteractedEarlyRef.current) {
        setReadyToShow(true);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('change', onEarlyFormInteract, true);
      document.removeEventListener('input', onEarlyFormInteract, true);
    };
  }, [open]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(PROMO_DISMISS_STORAGE_KEY, '1');
      window.sessionStorage.setItem(PROMO_DISMISS_STORAGE_KEY, '1');
    } catch {}
    if (onClose) onClose();
  }, [onClose]);

  const handleReopen = useCallback(() => {
    setDismissed(false);
    setReadyToShow(true);
    try {
      window.localStorage.removeItem(PROMO_DISMISS_STORAGE_KEY);
      window.sessionStorage.removeItem(PROMO_DISMISS_STORAGE_KEY);
    } catch {}
  }, []);

  const isHomeRoute = !pathname || pathname === '/';
  const isEligible =
    Boolean(activePromo) &&
    (activePromo.active === true || activePromo.enabled === true) &&
    Number(activePromo.percent) > 0 &&
    Boolean(activePromo.code) &&
    activePromo.eligibleForFirstRegistration !== false &&
    !user &&
    open !== false;

  useEffect(() => {
    if (!isHomeRoute || !isEligible || !readyToShow || dismissed || suppressed || preview) return undefined;
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
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onOutsideInteract, true);
    window.addEventListener('focusin', onOutsideInteract, true);
    document.addEventListener('change', onOutsideInteract, true);
    document.addEventListener('input', onOutsideInteract, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onOutsideInteract, true);
      window.removeEventListener('focusin', onOutsideInteract, true);
      document.removeEventListener('change', onOutsideInteract, true);
      document.removeEventListener('input', onOutsideInteract, true);
    };
  }, [isHomeRoute, isEligible, readyToShow, dismissed, suppressed, preview, handleDismiss]);

  if (preview || !isHomeRoute || !hydrated || !isEligible || suppressed) {
    return null;
  }

  const copyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(activePromo.code);
      }
      setCopied(true);
      toast(`کد تخفیف ${activePromo.code} کپی شد ✓`);
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
          aria-label={`باز کردن هدیه ثبت‌نام اول (${faNum(activePromo.percent)} درصد تخفیف)`}
        >
          <IconGift size={15} />
          <span>هدیه ثبت‌نام اول: {faNum(activePromo.percent)}٪ تخفیف</span>
        </button>
      </div>
    );
  }

  if (!readyToShow) {
    return null;
  }

  return (
    <div
      className="nk-promo-modal-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-label="پنجره تخفیف ویژه ثبت‌نام اول"
      data-testid="first-registration-promo-modal"
      dir="rtl"
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
          <span className="nk-promo-modal-discount__num">{faNum(activePromo.percent)}٪</span>
          <span className="nk-promo-modal-discount__txt">تخفیف واقعی روی اولین رزرو کلاس</span>
        </div>

        <h2 id={titleId} className="nk-promo-modal-title">
          {activePromo.title || 'هدیهٔ خوش‌آمدگویی ثبت‌نام اول در نیمکت'}
        </h2>
        <p id={descId} className="nk-promo-modal-desc">
          {activePromo.subtitle ||
            `با ثبت‌نام در نیمکت، روی اولین رزرو کلاس خود ${faNum(activePromo.percent)}٪ تخفیف واقعی دریافت کنید.`}
        </p>

        <div className="nk-promo-modal-codebox">
          <div>
            <span className="nk-promo-modal-codebox__label">کد تخفیف فعال در سامانه:</span>
            <strong className="nk-promo-modal-codebox__code" dir="ltr" data-testid="promo-discount-code">
              {activePromo.code}
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
            to={activePromo.ctaPrimary?.href || `/login?mode=register&promo=${encodeURIComponent(activePromo.code)}`}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleDismiss}
          >
            {activePromo.ctaPrimary?.label || 'ثبت‌نام و دریافت کد تخفیف'}
            <IconArrowLeft size={16} />
          </Link>
          <Link
            to={activePromo.ctaSecondary?.href || '/classes'}
            className="btn btn-outline"
            style={{ justifyContent: 'center' }}
            onClick={handleDismiss}
          >
            {activePromo.ctaSecondary?.label || 'مشاهده کلاس‌ها'}
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
