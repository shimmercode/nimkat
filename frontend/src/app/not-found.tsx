import Link from 'next/link';
import SiteLayout from '../layouts/SiteLayout.jsx';

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="nk-404-section">
        <div className="container">
          <div className="nk-404-card">
            {/* Animated Graphic Stage */}
            <div className="nk-404-stage" aria-hidden="true">
              <div className="nk-404-glow nk-404-glow--emerald" />
              <div className="nk-404-glow nk-404-glow--amber" />

              <svg
                className="nk-404-svg"
                viewBox="0 0 520 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="nk404GradGreen" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0A6847" />
                    <stop offset="100%" stopColor="#21A878" />
                  </linearGradient>
                  <linearGradient id="nk404GradOrange" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F28A3D" />
                    <stop offset="100%" stopColor="#F6B37A" />
                  </linearGradient>
                  <linearGradient id="nk404Board" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#053D29" />
                    <stop offset="100%" stopColor="#0A6847" />
                  </linearGradient>
                </defs>

                {/* Orbit Rings */}
                <ellipse
                  cx="260"
                  cy="160"
                  rx="210"
                  ry="74"
                  stroke="#D9E1DE"
                  strokeWidth="1.5"
                  strokeDasharray="6 8"
                  className="nk-404-orbit"
                />
                <ellipse
                  cx="260"
                  cy="160"
                  rx="155"
                  ry="52"
                  stroke="#21A878"
                  strokeOpacity="0.35"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  className="nk-404-orbit nk-404-orbit--reverse"
                />

                {/* Blackboard in Background */}
                <g className="nk-404-float-slow">
                  <rect
                    x="145"
                    y="28"
                    width="230"
                    height="126"
                    rx="18"
                    fill="url(#nk404Board)"
                    stroke="#F28A3D"
                    strokeWidth="4"
                  />
                  <line x1="168" y1="60" x2="235" y2="60" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" />
                  <line x1="168" y1="78" x2="212" y2="78" stroke="rgba(255,255,255,0.16)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M310 56 L332 78 M332 56 L310 78" stroke="#F28A3D" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                  <text
                    x="260"
                    y="118"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="54"
                    fontWeight="900"
                    fontFamily="YekanBakh, sans-serif"
                  >
                    ۴۰۴
                  </text>
                </g>

                {/* Animated Floating Nimkat Bench */}
                <g className="nk-404-bench">
                  {/* Shadow on floor */}
                  <ellipse cx="260" cy="262" rx="92" ry="12" fill="rgba(5, 61, 41, 0.12)" className="nk-404-shadow" />
                  {/* Bench Backrest */}
                  <rect x="176" y="164" width="168" height="24" rx="8" fill="url(#nk404GradOrange)" />
                  {/* Bench Seat */}
                  <rect x="162" y="198" width="196" height="18" rx="7" fill="url(#nk404GradGreen)" />
                  {/* Bench Legs */}
                  <path d="M186 188 L178 250" stroke="#053D29" strokeWidth="7" strokeLinecap="round" />
                  <path d="M334 188 L342 250" stroke="#053D29" strokeWidth="7" strokeLinecap="round" />
                  <path d="M182 226 L338 226" stroke="#0A6847" strokeWidth="5" strokeLinecap="round" />
                  {/* Question Mark Bubble above bench */}
                  <g className="nk-404-pulse">
                    <circle cx="260" cy="154" r="18" fill="#FDEEE2" stroke="#F28A3D" strokeWidth="2.5" />
                    <text x="260" y="161" textAnchor="middle" fill="#9C4F14" fontSize="20" fontWeight="900">
                      ؟
                    </text>
                  </g>
                </g>

                {/* Floating Book Left */}
                <g className="nk-404-float-left">
                  <rect x="64" y="92" width="54" height="42" rx="8" transform="rotate(-14 64 92)" fill="#E3F4EC" stroke="#0A6847" strokeWidth="2.5" />
                  <line x1="74" y1="106" x2="104" y2="99" stroke="#0A6847" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="77" y1="116" x2="98" y2="111" stroke="#21A878" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* Floating Magnifier Right */}
                <g className="nk-404-float-right">
                  <circle cx="424" cy="112" r="24" fill="#FDEEE2" stroke="#F28A3D" strokeWidth="4" />
                  <circle cx="418" cy="106" r="7" fill="#ffffff" opacity="0.7" />
                  <line x1="441" y1="129" x2="458" y2="146" stroke="#9C4F14" strokeWidth="5.5" strokeLinecap="round" />
                </g>

                {/* Sparkles */}
                <circle cx="112" cy="195" r="5" fill="#21A878" className="nk-404-pulse" />
                <circle cx="408" cy="202" r="6" fill="#F28A3D" className="nk-404-pulse" />
                <circle cx="132" cy="52" r="4" fill="#F28A3D" className="nk-404-pulse" />
                <circle cx="392" cy="56" r="5" fill="#0A6847" className="nk-404-pulse" />
              </svg>
            </div>

            {/* Text & Actions */}
            <div className="nk-404-content">
              <span className="eyebrow orange">خطای ۴۰۴ · صفحه پیدا نشد</span>
              <h1 className="t-h1 nk-404-title">
                این نیمکت در کلاس پیدا نشد!
              </h1>
              <p className="nk-404-lead">
                نشانی واردشده در سامانهٔ آموزشی نیمکت وجود ندارد، جابه‌جا شده یا ممکن است لینک قدیمی باشد. از مسیرهای زیر می‌توانید بلافاصله به کلاس‌ها یا صفحهٔ اصلی برگردید.
              </p>

              <div className="nk-404-actions">
                <Link href="/" className="btn btn-primary btn-lg">
                  بازگشت به صفحهٔ اصلی
                </Link>
                <Link href="/classes" className="btn btn-orange btn-lg">
                  جستجوی کلاس‌ها و اساتید
                </Link>
                <Link href="/blog" className="btn btn-outline btn-lg">
                  مجله آموزشی نیمکت
                </Link>
                <Link href="/contact" className="btn btn-ghost btn-lg">
                  ارتباط با پشتیبانی
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
