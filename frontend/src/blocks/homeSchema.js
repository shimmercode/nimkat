/* Default home schema — reproduces the approved Home design 1:1 */
import { createNode } from './registry.js';

export function defaultHomeSchema() {
  return {
    root: {
      id: 'root',
      type: 'page',
      props: { title: 'صفحه اصلی نیمکت' },
      style: { desktop: {}, tablet: {}, mobile: {} },
      children: [
        'hero', 'booking-steps', 'stats-band', 'top-teachers', 'top-students',
        'group-classes', 'club-band', 'promo-duo', 'testimonials', 'magazine',
        'faq', 'callback', 'cta-band',
      ].map((t) => createNode(t)),
    },
  };
}
