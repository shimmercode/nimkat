import { createNode } from './registry.js';

export const editablePages = [
  {slug:'blog',title:'چیدمان مجله',href:'/blog',type:'blog-feed'},
  {slug:'article-layout',title:'قالب پیرامون مقاله',href:'/blog/weekly-study-plan',type:'blog-feed'},
  { slug: 'home', title: 'صفحه اصلی', href: '/' },
  { slug: 'classes', title: 'جستجوی کلاس‌ها', href: '/classes', type: 'classes-search' },
  { slug: 'teacher-profile', title: 'قالب پروفایل استاد', href: '/teachers/1', type: 'teacher-profile' },
  { slug: 'class-detail', title: 'قالب جزئیات کلاس', href: '/classes/5', type: 'class-detail' },
  { slug: 'club', title: 'نیمکت کلاب', href: '/club', type: 'club-dashboard' },
];

export function defaultApplicationSchema(slug) {
  const page = editablePages.find((p) => p.slug === slug)
    || (/^teacher-\d+$/.test(slug) ? editablePages.find(p=>p.slug==='teacher-profile') : null)
    || (/^class-\d+$/.test(slug) ? editablePages.find(p=>p.slug==='class-detail') : null);
  return {
    root: {
      id: 'root', type: 'page', props: { title: page?.title || slug },
      style: { desktop: {}, tablet: {}, mobile: {} },
      children: page?.type ? [createNode(page.type)] : [],
    },
  };
}
