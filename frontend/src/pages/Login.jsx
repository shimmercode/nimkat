import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { faNum } from '../utils/fa.js';
import { IconBench, IconStar, IconLock } from '../components/icons.jsx';

const DEMO = {
  student: '09120000001',
  teacher: '09120000002',
};

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const send = async (m) => {
    setError('');
    setBusy(true);
    try {
      const d = await requestOtp(m);
      setDevCode(d.devCode);
      setTimer(120);
      setStep('code');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (c, role) => {
    setError('');
    setBusy(true);
    try {
      const user = await verifyOtp(mobile, c, role);
      const next = params.get('next');
      if (next) navigate(next);
      else navigate(user.role === 'teacher' ? '/teacher' : '/panel');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const quick = async (kind) => {
    const m = DEMO[kind];
    setMobile(m);
    const d = await requestOtp(m);
    await verifyWith(m, d.devCode, kind);
  };
  const verifyWith = async (m, c, role) => {
    try {
      const user = await verifyOtp(m, c, role);
      navigate(user.role === 'teacher' ? '/teacher' : '/panel');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-side">
        <Link to="/" className="link-green" style={{ marginBottom: 24 }}>
          بازگشت به سایت
        </Link>
        <h1 className="login-title">
          یک حساب،
          <br />
          همهٔ کلاس‌ها و گزارش‌ها.
        </h1>
        <p className="login-sub">
          شاگرد، والدین یا استاد؛ با همین شماره وارد می‌شوید و نقش‌تان را بعد از
          ورود انتخاب می‌کنید.
        </p>

        {step === 'mobile' ? (
          <form
            className="login-box"
            onSubmit={(e) => {
              e.preventDefault();
              send(mobile);
            }}
          >
            <label>شماره موبایل</label>
            <input
              className="cta-input"
              type="tel"
              placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setError('');
              }}
            />
            {error && <p className="cta-msg err">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={busy}>
              ارسال کد تأیید
            </button>
            <div className="login-demo">
              <button type="button" className="chip chip-btn" onClick={() => quick('student')}>
                ورود سریع شاگرد نمونه
              </button>
              <button type="button" className="chip chip-btn" onClick={() => quick('teacher')}>
                ورود سریع استاد نمونه
              </button>
            </div>
          </form>
        ) : (
          <form
            className="login-box"
            onSubmit={(e) => {
              e.preventDefault();
              verify(code);
            }}
          >
            <label>کد تأیید</label>
            <input
              className="cta-input otp-input"
              inputMode="numeric"
              placeholder="کد ۵ رقمی"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
            />
            {devCode && (
              <p className="cta-msg ok">
                حالت توسعه: کد ارسال‌شده {faNum(devCode)} است (در حالت واقعی پیامک می‌شود)
              </p>
            )}
            <p className="login-sent">
              کد ۵ رقمی به شمارهٔ {faNum(mobile)} ارسال شد.
              <button type="button" className="link-green" onClick={() => setStep('mobile')}>
                ویرایش شماره
              </button>
            </p>
            {error && <p className="cta-msg err">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={busy}>
              تأیید و ورود
            </button>
            <button
              type="button"
              className="btn btn-outline btn-block"
              disabled={timer > 0}
              onClick={() => send(mobile)}
            >
              {timer > 0 ? `ارسال دوباره تا ${faNum(timer)} ثانیه` : 'ارسال دوبارهٔ کد'}
            </button>
            <p className="login-note">
              کد تا ۲ دقیقه معتبر است و حداکثر ۵ بار می‌توانید آن را وارد کنید. کد را
              برای هیچ‌کس، حتی پشتیبانی نیمکت، نفرستید.
            </p>
          </form>
        )}

        <p className="login-terms">
          <IconLock size={14} />
          ورود شما به معنی پذیرش حریم خصوصی و قوانین و مقررات نیمکت است.
        </p>
      </div>

      <div className="login-aside">
        <Link to="/" className="brand">
          <span className="brand-logo">
            <IconBench size={26} />
          </span>
          <span>
            <span className="brand-name" style={{ color: '#fff' }}>نیمکت</span>
            <br />
            <span className="brand-tag">پلتفرم آموزش آنلاین و حضوری</span>
          </span>
        </Link>

        <div className="login-stats">
          <span><b>۱۲٬۴۰۰</b> شاگرد فعال</span>
          <span><b>۳۸۰</b> استاد تأییدشده</span>
          <span>
            <b>۴٫۸</b> میانگین امتیاز <IconStar size={14} />
          </span>
        </div>

        <blockquote className="login-quote">
          «سه ماه قبل از امتحان نهایی شروع کردیم. گزارش هر جلسه را می‌دیدم و
          می‌دانستم دقیقاً کجای کار هستیم.»
          <footer>
            <span className="test-avatar cream">ف</span>
            <span>
              <b>فاطمه احمدی</b>
              <span>مادر هستی، پایه ششم</span>
            </span>
          </footer>
        </blockquote>

        <a className="link-green" href="#help">نیاز به کمک دارید؟</a>
      </div>
    </div>
  );
}
