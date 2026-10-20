/* Block registry: type -> { label, category, component, defaults, fields, container } */
import {
  SectionBlock, sectionSpec, HeadingBlock, headingSpec, TextBlock, textSpec,
  ImageBlock, imageSpec, ButtonsBlock, buttonsSpec, DividerBlock, dividerSpec,
  SpacerBlock, spacerSpec, CtaBandBlock, ctaBandSpec,
} from './generic.jsx';
import { HeroBlock, heroSpec, BookingStepsBlock, bookingStepsSpec, StatsBandBlock, statsBandSpec, TopTeachersBlock, topTeachersSpec, TopStudentsBlock, topStudentsSpec } from './home-blocks-1.jsx';
import { GroupClassesBlock, groupClassesSpec, ClubBandBlock, clubBandSpec, PromoDuoBlock, promoDuoSpec, TestimonialsBlock, testimonialsSpec, MagazineBlock, magazineSpec, FaqBlock, faqSpec, CallbackBlock, callbackSpec } from './home-blocks-2.jsx';

import { nativeRegistry } from './native/index.jsx';

export const registry = {
  ...nativeRegistry,
  hero: { ...heroSpec, component: HeroBlock },
  'booking-steps': { ...bookingStepsSpec, component: BookingStepsBlock },
  'stats-band': { ...statsBandSpec, component: StatsBandBlock },
  'top-teachers': { ...topTeachersSpec, component: TopTeachersBlock },
  'top-students': { ...topStudentsSpec, component: TopStudentsBlock },
  'group-classes': { ...groupClassesSpec, component: GroupClassesBlock },
  'club-band': { ...clubBandSpec, component: ClubBandBlock },
  'promo-duo': { ...promoDuoSpec, component: PromoDuoBlock },
  testimonials: { ...testimonialsSpec, component: TestimonialsBlock },
  magazine: { ...magazineSpec, component: MagazineBlock },
  faq: { ...faqSpec, component: FaqBlock },
  callback: { ...callbackSpec, component: CallbackBlock },
  section: { ...sectionSpec, component: SectionBlock },
  heading: { ...headingSpec, component: HeadingBlock },
  text: { ...textSpec, component: TextBlock },
  image: { ...imageSpec, component: ImageBlock },
  buttons: { ...buttonsSpec, component: ButtonsBlock },
  divider: { ...dividerSpec, component: DividerBlock },
  spacer: { ...spacerSpec, component: SpacerBlock },
  'cta-band': { ...ctaBandSpec, component: CtaBandBlock },
};

let seq = 0;
export const uid = (p = 'n') => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

export function createNode(type) {
  const spec = registry[type];
  if (!spec) throw new Error('unknown block ' + type);
  return {
    id: uid(),
    type,
    props: structuredClone(spec.defaults),
    style: { desktop: {}, tablet: {}, mobile: {} },
    children: [],
  };
}

/* deep helpers over the node tree */
export function walk(node, fn, parent = null, path = []) {
  fn(node, parent, path);
  (node.children || []).forEach((c, i) => walk(c, fn, node, [...path, i]));
}

export function findNode(root, id) {
  let found = null;
  walk(root, (n, parent, path) => { if (n.id === id) found = { node: n, parent, path }; });
  return found;
}

export function clone(n) {
  return structuredClone(n);
}

export function getIn(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setIn(obj, dotted, value) {
  const keys = dotted.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

export const categories = ['ویژه', 'لایه‌بندی', 'متن', 'رسانه', 'کاربردی', 'صفحات پویا'];
