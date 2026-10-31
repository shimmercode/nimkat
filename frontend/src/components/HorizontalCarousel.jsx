'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Horizontal carousel controller (no new dependency, no content changes).
 *
 * It owns a scroll container and exposes:
 *  - `scrollByPage(direction)` for the previous/next arrow buttons
 *  - `canPrev` / `canNext` so callers can disable the buttons at the edges
 *  - native touch swipe (the browser already handles horizontal panning on a
 *    `overflow-x: auto` track, this only adds momentum-friendly snap release)
 *  - arrow-key navigation when the track (or a card inside it) has focus
 *
 * All items stay in the DOM and remain reachable — nothing is hidden or removed.
 */
export default function HorizontalCarousel({
  children,
  className = '',
  trackClassName = '',
  prevLabel = 'قبلی',
  nextLabel = 'بعدی',
  renderControls = null,
  scrollStep = 320,
}) {
  const trackRef = useRef(null);
  const [state, setState] = useState({ prev: false, next: false });

  const syncState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // RTL scroll containers can report negative offsets; normalize both directions.
    const pos = Math.abs(el.scrollLeft);
    setState({ prev: pos > 4, next: max > 4 && pos < max - 4 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    syncState();
    el.addEventListener('scroll', syncState, { passive: true });
    window.addEventListener('resize', syncState);
    return () => {
      el.removeEventListener('scroll', syncState);
      window.removeEventListener('resize', syncState);
    };
  }, [syncState, children]);

  const scrollByPage = useCallback(
    (direction) => {
      const el = trackRef.current;
      if (!el) return;
      const step = el.clientWidth * 0.85 || scrollStep;
      el.scrollBy({ left: direction * step, behavior: 'smooth' });
    },
    [scrollStep]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // RTL: ArrowLeft moves toward the next (start) item.
      const direction = e.key === 'ArrowLeft' ? 1 : -1;
      scrollByPage(direction);
    },
    [scrollByPage]
  );

  return (
    <div className={`nk-carousel ${className}`.trim()}>
      <div
        ref={trackRef}
        className={`nk-carousel__track ${trackClassName}`.trim()}
        role="group"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
      {renderControls ? (
        renderControls({ canPrev: state.prev, canNext: state.next, scrollByPage })
      ) : null}
    </div>
  );
}
