'use client';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { faNum } from '../utils/fa.js';
import { IconStar, IconShield, IconCheck, IconChat } from './icons.jsx';

export const reviewTags = [
  'تسلط علمی',
  'بیان روان',
  'نظم و وقت‌شناسی',
  'حل تست و نمونه سوال',
  'پیگیری خارج از کلاس',
  'جزوه و منابع مفید',
];

export default function PublicTeacherReviews({ teacherId, initialData = null }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api(`/teachers/${teacherId}/reviews?page=${page}`)
      .then(setData)
      .catch((e) => setError(e.message || 'خطا در دریافت نظرات'));
  }, [teacherId, page]);

  const avgDisplay =
    data && data.summary && data.summary.average !== null
      ? faNum(Math.round(data.summary.average * 10) / 10)
      : '—';

  return (
    <section className="card nk-tp-section-card" id="public-reviews">
      {/* Section Header */}
      <div className="nk-tp-sec-head">
        <div className="nk-tp-sec-head__title-wrap">
          <span className="nk-tp-sec-icon nk-tp-sec-icon--gold">
            <IconStar size={22} />
          </span>
          <div>
            <h2 className="t-h3">رضایت‌های منتشرشدهٔ شاگردها</h2>
            <p className="t-small t-muted" style={{ marginTop: 4 }}>
              این بخش فقط بازخوردهای مثبتِ دارای رضایت انتشار و تأیید مدیر را نشان می‌دهد؛ نمایندهٔ همهٔ نظرات یا رتبه‌بندی بی‌طرفانه نیست.
            </p>
          </div>
        </div>
        <span className="chip soft-green">
          <IconShield size={14} /> تأییدشده پس از شرکت در کلاس
        </span>
      </div>

      {error && (
        <div className="nk-tp-state-box nk-tp-state-box--error" style={{ marginTop: 16 }}>
          <p role="alert" style={{ margin: 0, color: 'var(--error)', fontWeight: 700 }}>
            {error}
          </p>
        </div>
      )}

      {!data && !error && (
        <div className="nk-tp-state-box" style={{ marginTop: 16 }}>
          <p role="status" className="t-muted" style={{ margin: 0 }}>
            اطلاعات نظرات در دسترس نیست.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Summary KPI Banner */}
          <div className="nk-tp-reviews-summary">
            <div className="nk-tp-reviews-summary__score">
              <div className="nk-tp-reviews-summary__num num">{avgDisplay}</div>
              <div>
                <div className="stars" aria-hidden="true">
                  <IconStar size={15} />
                  <IconStar size={15} />
                  <IconStar size={15} />
                  <IconStar size={15} />
                  <IconStar size={15} />
                </div>
                <p className="t-small t-muted num" style={{ margin: '4px 0 0' }}>
                  {faNum(data.summary.count)} بازخورد منتشرشده · میانگین همین بازخوردها: {avgDisplay} از ۵
                </p>
              </div>
            </div>
            <div className="nk-tp-reviews-summary__badge">
              <IconCheck size={16} />
              <span>ثبت‌شده توسط شاگردان واقعی پس از برگزاری جلسه</span>
            </div>
          </div>

          {/* Empty State or Review Cards */}
          {!data.reviews.length ? (
            <div className="nk-tp-empty-card">
              <span className="nk-tp-empty-card__icon" aria-hidden="true">
                <IconChat size={26} />
              </span>
              <p className="nk-tp-empty-card__title">
                هنوز بازخورد مثبتِ تأییدشده با اجازهٔ انتشار ثبت نشده است.
              </p>
              <span className="t-small t-muted">
                پس از پایان جلسات و ثبت رضایت شاگردان، نظرات تأییدشده در این بخش نمایش داده می‌شوند.
              </span>
            </div>
          ) : (
            <div className="nk-tp-reviews-grid">
              {data.reviews.map((r) => (
                <article className="nk-tp-review-card" key={r.id}>
                  <div className="nk-tp-review-card__head">
                    <div className="nk-tp-review-card__author">
                      <span className="nk-tp-review-card__avatar" aria-hidden="true">
                        {(r.studentName || 'ش').trim().slice(0, 1)}
                      </span>
                      <div>
                        <strong className="nk-tp-review-card__name">{r.studentName}</strong>
                        <span className="nk-tp-review-card__meta">شاگرد تأییدشدهٔ نیمکت</span>
                      </div>
                    </div>
                    <span className="nk-tp-review-card__rating num">
                      <IconStar size={14} /> امتیاز {faNum(r.rating)} از ۵
                    </span>
                  </div>
                  <p className="nk-tp-review-card__body">{r.comment}</p>
                  {Array.isArray(r.tags) && r.tags.length > 0 && (
                    <div className="nk-tp-review-card__tags">
                      {r.tags.map((t) => (
                        <span key={t} className="chip soft-green">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          <div className="nk-tp-pagination">
            <button
              className="btn btn-outline btn-sm"
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              صفحهٔ قبل نظرات
            </button>
            <span className="nk-tp-pagination__info num">
              صفحهٔ {faNum(data.page)} از {faNum(data.totalPages)}
            </span>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              صفحهٔ بعد نظرات
            </button>
          </div>
        </>
      )}
    </section>
  );
}
