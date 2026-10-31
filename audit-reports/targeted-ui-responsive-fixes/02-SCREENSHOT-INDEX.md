# Nimkat — Targeted UI/UX & Responsive Fixes
## Screenshot Index (Before / After)

> **مکان فایل‌ها:** `audit-reports/targeted-ui-responsive-fixes/screenshots/`
> تصاویر باینری طبق قرارداد مخزن **در Git commit نشده‌اند** و فقط در محیط کاری نگهداری می‌شوند.
> برای بازتولید: `NIMKAT_BASE=http://127.0.0.1:3000 node audit-reports/targeted-ui-responsive-fixes/phase13-runner.mjs`

---

## ۱. نمای کامل صفحه (Full Page)

| صفحه | موبایل ۳۷۵px | تبلت ۷۶۸px | دسکتاپ ۱۴۴۰px |
|---|---|---|---|
| صفحهٔ اصلی `/` | `before-mobile-375-home.png` → `after-mobile-375-home.png` | `before-tablet-768-home.png` → `after-tablet-768-home.png` | `before-desktop-1440-home.png` → `after-desktop-1440-home.png` |
| مقاله `/blog/weekly-study-plan` | `before-mobile-375-article.png` → `after-mobile-375-article.png` | `before-tablet-768-article.png` → `after-tablet-768-article.png` | `before-desktop-1440-article.png` → `after-desktop-1440-article.png` |
| مجله `/blog` | `before-mobile-375-blog.png` → `after-mobile-375-blog.png` | `before-tablet-768-blog.png` → `after-tablet-768-blog.png` | `before-desktop-1440-blog.png` → `after-desktop-1440-blog.png` |
| کلاس‌ها `/classes` | — | — | `after-desktop-1440-classes.png` |
| استاد `/teachers/1` | `after-mobile-375-teacher.png` | `after-tablet-768-teacher.png` | `after-desktop-1440-teacher.png` |
| کلاب `/club` | `after-mobile-375-club.png` | `after-tablet-768-club.png` | `after-desktop-1440-club.png` |

---

## ۲. بخش‌های کلیدی (Section Clips)

### TASK 02 — فوتر (Grid)
| دستگاه | قبل | بعد |
|---|---|---|
| موبایل ۳۷۵px | `section-before-mobile-375-footer.png` | `section-mobile-375-footer.png` |
| تبلت ۷۶۸px | `section-before-tablet-768-footer.png` | `section-tablet-768-footer.png` |
| دسکتاپ ۱۴۴۰px | `section-before-desktop-1440-footer.png` | `section-desktop-1440-footer.png` |

**تغییر قابل مشاهده:** فوتر از یک ستون کاملاً عمودی (بلند) به **Grid دو‌ستونه** تبدیل شد؛
«مقاطع تحصیلی» کنار «دسترسی سریع» و «پشتیبانی» کنار «مجوزها»، و بلوک برند تمام‌عرض در بالا.

---

### TASK 03 — نوابغ (Carousel)
| دستگاه | قبل | بعد |
|---|---|---|
| موبایل ۳۷۵px | `section-before-mobile-375-students-carousel.png` | `section-mobile-375-students-carousel.png` |
| تبلت ۷۶۸px | `section-before-tablet-768-students-carousel.png` | `section-tablet-768-students-carousel.png` |
| دسکتاپ ۱۴۴۰px | `section-before-desktop-1440-students-carousel.png` | `section-desktop-1440-students-carousel.png` |

**تغییر قابل مشاهده:** گرید **۲ ستون × ۵ ردیف** → **یک ردیف افقی** با اسکرول/اسوایپ و دکمه‌های قبلی/بعدی.
هر ۱۰ دانش‌آموز همچنان در DOM هستند و قابل دسترسی‌اند.

---

### TASK 04 — چیدمان مقاله
| دستگاه | قبل | بعد |
|---|---|---|
| موبایل ۳۷۵px | `section-before-mobile-375-article-layout.png` | `section-mobile-375-article-layout.png` |
| تبلت ۷۶۸px | `section-before-tablet-768-article-layout.png` | `section-tablet-768-article-layout.png` |
| دسکتاپ ۱۴۴۰px | `section-before-desktop-1440-article-layout.png` | `section-desktop-1440-article-layout.png` |

**تغییر قابل مشاهده:** در «قبل»، Table of Contents در یک **ستون کناری باریک** کنار متن مقاله بود و متن را محدود می‌کرد.
در «بعد»، TOC یک بلوک **تمام‌عرض بالای متن** است و متن مقاله ستون اصلی تمام‌عرض (۳۴۷px → ۸۵۲px) است.

م additionally:
- `section-mobile-375-article-toc.png` / `section-desktop-1440-article-toc.png` — نمای نزدیک TOC
- `section-mobile-375-article-body.png` — متن مقاله در موبایل (فونت ۱۵٫۵px، line-height استاندارد)

---

### TASK 05 — پیشنهاد مطالب
| دستگاه | قبل | بعد |
|---|---|---|
| موبایل ۳۷۵px | `section-before-mobile-375-related-cards.png` | `section-mobile-375-related-cards.png` |
| تبلت ۷۶۸px | `section-before-tablet-768-related-cards.png` | `section-tablet-768-related-cards.png` |
| دسکتاپ ۱۴۴۰px | `section-before-desktop-1440-related-cards.png` | `section-desktop-1440-related-cards.png` |

**تغییر قابل مشاهده:** کارت از «تصویر بالا / عنوان پایین» به **«تصویر کنار عنوان»** تغییر کرد —
و **همین الگوی افقی در موبایل هم حفظ شد** (فقط عرض تصویر کمتر: ۱۱۶px).

---

### TASK 06 — Popup تخفیف
| | تصویر |
|---|---|
| قبل | `section-before-mobile-375-promo-popup.png` |
| بعد | `section-mobile-375-promo-popup.png` |

**تغییر قابل مشاهده:** در «قبل»، دکمهٔ شناور «هدیه ثبت‌نام اول: ۵٪ تخفیف» **هم‌زمان با Popup** دیده می‌شد.
در «بعد»، **فقط خود Popup** نمایش داده می‌شود و هیچ دکمهٔ شناوری (تخفیف یا پشتیبانی) باقی نمی‌ماند.
پس از بستن Popup، دکمهٔ «بازکردن مجدد» طبق طراحی قبلی برمی‌گردد.

---

### TASK 07 — منوی موبایل
| | تصویر |
|---|---|
| بعد | `section-mobile-375-menu.png` |

فونت آیتم‌های منوی موبایل از ۱۶px به **۱۵px** کاهش یافت (ظریف)، با حفظ RTL، وزن ۷۰۰ و فاصلهٔ آیکون/متن.

---

## ۳. نتایج تست پذیرش

خروجی کامل در `phase-13-results.json`:
```json
{ "total": 115, "passed": 115, "failed": [], "consoleErrors": [] }
```

| گروه تست | تعداد | نتیجه |
|---|---|---|
| بدون سرریز افقی — ۱۲ viewport × ۶ صفحه | ۷۲ | ✅ |
| Grid فوتر | ۳ | ✅ |
| Carousel نوابغ (۶ viewport) | ۱۸ | ✅ |
| ترتیب مقاله / TOC / ستون اصلی / وسط‌چینی | ۸ | ✅ |
| کارت پیشنهاد مطالب (۴ viewport) | ۸ | ✅ |
| Popup تخفیف | ۳ | ✅ |
| فونت منوی موبایل + RTL | ۳ | ✅ |
| **مجموع** | **۱۱۵** | **✅ ۱۱۵/۱۱۵** |
