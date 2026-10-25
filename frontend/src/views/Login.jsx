'use client';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Link, useNavigate, useSearchParams } from '../routing/navigation';
import { useAuth } from '../auth.jsx';
import { IconHeadset, IconArrowLeft, IconCheck, IconInfo, IconLock, IconStar, IconClock } from '../components/icons.jsx';
import {loginDigits,loginMobile,otpInput} from '../utils/login-input.js';
import { faNum } from '../utils/fa.js';

export default function Login() {
  const { user, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const referralCode = /^[A-Fa-f0-9]{16}$/.test(params?.get('ref') || '') ? params.get('ref').toUpperCase() : null;
  const requestedNext = params?.get('next') || '';
  const safeNext = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\') && requestedNext.split('?')[0] !== '/login' ? requestedNext : null;
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState(['', '', '', '', '']);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [role, setRole] = useState(params?.get('mode') === 'teacher' ? 'teacher' : 'student');
  const boxes = useRef([]);
  const focusOtp=useRef(false);
  // Focus only in the commit that mounts/resets OTP. A delayed timer can steal
  // focus after fast typing/autofill has already reached the final digit.
  useLayoutEffect(()=>{if(step===2&&focusOtp.current){focusOtp.current=false;boxes.current[0]?.focus({preventScroll:true});}});

  useEffect(() => {
    if (user) navigate(safeNext || (referralCode ? `${user.role === 'teacher' ? '/teacher/club' : '/panel/club'}?ref=${referralCode}` : null) || (user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin/integrations' : user.role === 'parent' ? '/parent' : '/panel'), { replace: true });
  }, [user, navigate, safeNext, referralCode]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const send = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const d = await requestOtp(mobile);
      focusOtp.current=true;
      setDevCode(d.devCode || '');
      setCode(['','','','','']);
      setTimer(d.retry_after || 120);
      setStep(2);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  };

  const setDigit = (i, v) => {
    const next=otpInput(code,i,v);setCode(current=>otpInput(current,i,v).code);boxes.current[next.focus]?.focus();
  };

  const verify = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const joined = code.join('');
      await verifyOtp(mobile, joined, role); // The user-state effect navigates only after context commits.
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  };

  const [embedded,setEmbedded]=useState(false);
  useEffect(()=>{setEmbedded(window.self!==window.top);},[]);
  const ready = code.every((c) => c);

  return (
    <div className="auth-page">{embedded && <aside className="login-browser-notice"><p>اگر مرورگر ورود داخل پیش‌نمایش را محدود می‌کند، سایت را مستقل باز کنید.</p><a className="btn btn-outline" href={typeof window!=='undefined'?window.location.href:'/login'} target="_blank" rel="noopener">باز کردن ورود در زبانهٔ مستقل</a></aside>}
      {/* left brand panel */}
      <div className="auth-side">
        <div className="brand">
          <span className="brand-logo" style={{ background: 'rgba(255,255,255,.12)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M3 13h18M4.5 13v-2.2A2.3 2.3 0 0 1 6.8 8.5h10.4a2.3 2.3 0 0 1 2.3 2.3V13M5 13v5M19 13v5M3 16.5h18" />
            </svg>
            <i className="dot" />
          </span>
          <span>
            <span style={{ fontSize: 19, fontWeight: 900, color: '#fff' }}>نیمکت</span>
            <span style={{ display: 'block', fontSize: 11, color: '#9fb0a9' }}>پلتفرم آموزش آنلاین و حضوری</span>
          </span>
        </div>

        <div style={{ margin: 'auto 0' }}>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.7 }}>
            یک حساب،
            <br />
            همه‌ی کلاس‌ها و گزارش‌ها.
          </h1>
          <p style={{ opacity: 0.85, lineHeight: 2.2, marginTop: 18, maxWidth: 420 }}>
            شاگرد، والدین یا استاد؛ با همین شماره وارد می‌شوید و نقش‌تان را بعد از ورود انتخاب می‌کنید.
          </p>

          <div className="auth-quote" style={{ maxWidth: 460 }}>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginBottom: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar key={i} size={15} style={{ color: 'var(--accent)' }} />
              ))}
            </div>
            <p style={{ lineHeight: 2.2, fontSize: 14.5, opacity: 0.92 }}>
              «سه ماه قبل از امتحان نهایی شروع کردیم. گزارش هر جلسه را می‌دیدم و می‌دانستم دقیقاً کجای کار
              هستیم.»
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
              <div className="avatar sq-40" style={{ background: 'var(--accent)', color: 'var(--n900)' }}>ف</div>
              <div>
                <b style={{ fontSize: 13.5, color: '#fff' }}>فاطمه احمدی</b>
                <div style={{ fontSize: 11.5, opacity: 0.7 }}>مادر هستی، پایه ششم</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 48, paddingTop: 30 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }} className="num">۱۲٬۴۰۰</div>
            <div style={{ fontSize: 12.5, opacity: 0.75 }}>شاگرد فعال</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }} className="num">۳۵۰</div>
            <div style={{ fontSize: 12.5, opacity: 0.75 }}>استاد تأییدشده</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }} className="num">۴٫۸</div>
            <div style={{ fontSize: 12.5, opacity: 0.75 }}>میانگین امتیاز</div>
          </div>
        </div>
      </div>

      {/* right form panel */}
      <div className="auth-form-side">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontWeight: 700, fontSize: 14 }}>
            بازگشت به سایت <IconArrowLeft size={17} />
          </Link>
          <a href="#support" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
            <IconHeadset size={19} /> نیاز به کمک دارید؟
          </a>
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
          {/* steps */}
          <div className="auth-steps">
            <div className={`auth-step ${step > 1 ? 'is-done' : step === 1 ? 'is-now' : ''}`}>
              <span className="n">{step > 1 ? <IconCheck size={15} /> : faNum(1)}</span> شماره موبایل
            </div>
            <div className={`auth-line ${step > 1 ? 'done' : ''}`} />
            <div className={`auth-step ${step > 2 ? 'is-done' : step === 2 ? 'is-now' : ''}`}>
              <span className="n">{step > 2 ? <IconCheck size={15} /> : faNum(2)}</span> کد تأیید
            </div>
            <div className={`auth-line ${step > 2 ? 'done' : ''}`} />
            <div className={`auth-step ${step === 3 ? 'is-now' : ''}`}>
              <span className="n">{faNum(3)}</span> تکمیل پروفایل
            </div>
          </div>

          {step === 1 && (
            <>
              <h1 className="t-h2">شماره موبایلت را وارد کن</h1>
              <p className="t-muted" style={{ marginTop: 10, lineHeight: 2 }}>
                کد تأیید ۵ رقمی برایت پیامک می‌شود. حساب نداری؟ همین شماره حساب می‌سازد.
              </p>

              <div className="field" style={{ marginTop: 26 }}>
                <label className="field-label" htmlFor="login-mobile">شماره موبایل</label>
                <input
                  id="login-mobile" inputMode="tel" autoComplete="tel"
                  className="input num"
                  style={{ direction: 'ltr', textAlign: 'right', fontSize: 17 }}
                  placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
                  value={mobile}
                  onChange={(e) => setMobile(loginMobile(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && mobile.length === 11 && send()}
                />
                <div className={`field-hint ${err ? 'is-error' : ''}`}>
                  {err || <><IconInfo size={14} /> شماره موبایل ۱۱ رقم است</>}
                </div>
              </div>

              <div className="field" style={{ marginTop: 18 }}>
                <label className="field-label">نقش شما</label>
                <div className="segmented" style={{ width: '100%' }}>
                  {[
                    ['student', 'شاگرد'],
                    ['parent', 'والدین'],
                    ['teacher', 'استاد'],
                  ].map(([k, l]) => (
                    <button key={k} type="button" className={role === k ? 'is-active' : ''} onClick={() => setRole(k)} style={{ flex: 1, justifyContent: 'center' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 22 }} disabled={busy || mobile.length !== 11} onClick={send}>
                ارسال کد تأیید
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="t-h2">کد تأیید را وارد کنید</h1>
              <p className="t-muted" style={{ marginTop: 10, lineHeight: 2 }}>
                کد ۵ رقمی به شماره‌ی <b className="num" style={{ color: 'var(--ink)' }}>{faNum(mobile)}</b> ارسال شد.{' '}
                <button type="button" style={{ color: 'var(--primary)', fontWeight: 800 }} onClick={() => setStep(1)}>
                  ویرایش شماره
                </button>
              </p>

              {devCode && (
                <div className="chip soft-green" style={{ marginTop: 12 }}>
                  کد آزمایشی: <b className="num">{faNum(devCode)}</b>
                </div>
              )}

              <div className="otp-boxes" style={{ marginTop: 28 }}>
                {code.map((c, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxes.current[i] = el; }}
                    value={c ? faNum(c) : ''}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={e=>{if(e.key==='Backspace'&&!code[i]&&i>0)boxes.current[i-1]?.focus();if(e.key==='Enter'&&ready)verify();}}
                    inputMode="numeric" aria-label={`رقم ${faNum(i + 1)} کد تأیید`}
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    onPaste={(e) => {
                      const digits = loginDigits(e.clipboardData.getData('text')).slice(0,5);
                      if (digits.length === 5) { e.preventDefault(); setCode(digits.split('')); boxes.current[4]?.focus(); }
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
                <span className="t-small t-muted num" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <IconClock size={15} /> ارسال دوباره تا {faNum(Math.floor(timer / 60))}:{faNum(String(timer % 60).padStart(2, '0'))}
                </span>
                <button
                  type="button"
                  style={{ color: timer > 0 ? 'var(--n500)' : 'var(--primary)', fontWeight: 800, fontSize: 13.5 }}
                  disabled={busy || timer > 0}
                  onClick={send}
                >
                  ارسال دوباره‌ی کد
                </button>
              </div>

              {err && <div role="alert" className="field-hint is-error" style={{ marginTop: 12 }}>{err}</div>}

              <button
                className={`btn btn-lg btn-block ${ready ? 'btn-primary' : 'disabled'}`}
                style={{ marginTop: 22 }}
                disabled={busy || !ready}
                onClick={verify}
              >
                تأیید و ورود
              </button>

              <div
                style={{
                  marginTop: 20, background: 'var(--accent-50)', borderRadius: 'var(--r-lg)',
                  padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <IconInfo size={19} style={{ color: 'var(--accent-800)', flex: 'none', marginTop: 2 }} />
                <p className="t-small" style={{ color: 'var(--accent-800)', lineHeight: 2 }}>
                  کد تا ۲ دقیقه معتبر است و حداکثر ۵ بار می‌توانید آن را وارد کنید. کد را برای هیچ‌کس، حتی
                  پشتیبانی نیمکت، نفرستید.
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="t-h2">تکمیل پروفایل</h1>
              <p className="t-muted" style={{ marginTop: 10, lineHeight: 2 }}>
                فقط چند قدم دیگر مانده تا اولین نیمکتت را رزرو کنی.
              </p>
              <div className="card" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label className="field-label">نام و نام خانوادگی</label>
                  <input className="input" placeholder="نام و نام خانوادگی" />
                </div>
                <div className="field">
                  <label className="field-label">پایه / مقطع</label>
                  <input className="input" placeholder="متوسطه دوم" />
                </div>
              </div>
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 22 }} onClick={() => navigate('/panel')}>
                ورود به نیمکت
              </button>
            </>
          )}

          <p className="t-small t-muted" style={{ marginTop: 30, textAlign: 'center' }}>
            ورود شما به معنی پذیرش{' '}
            <a href="#" style={{ color: 'var(--primary)', fontWeight: 700 }}>قوانین و مقررات</a> و{' '}
            <a href="#" style={{ color: 'var(--primary)', fontWeight: 700 }}>حریم خصوصی</a> نیمکت است.
          </p>
        </div>
      </div>
    </div>
  );
}
