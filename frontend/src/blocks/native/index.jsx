/* Stateful application widgets: preserve booking/filter/club business logic.
   Only editorial content is exposed; prices, IDs, balances and capacity remain API-owned. */
import ClassesSearch from '../../views/ClassesSearch.jsx';
import TeacherProfile from '../../views/TeacherProfile.jsx';
import ClassDetail from '../../views/ClassDetail.jsx';
import Club from '../../views/panel/Club.jsx';
import specs from './specs.json';
import { useParams } from '../../routing/navigation';

const widgets = [
  ['classes-search', 'جستجو و فیلتر کلاس‌ها', ClassesSearch, specs.ClassesSearch],
  ['teacher-profile', 'پروفایل پویا و زمان‌بندی استاد', TeacherProfile, specs.TeacherProfile],
  ['class-detail', 'جزئیات کلاس و رزرو', ClassDetail, specs.ClassDetail],
  ['club-dashboard', 'باشگاه و مأموریت‌ها', Club, specs.Club],
];

export const nativeRegistry = Object.fromEntries(widgets.map(([type, label, Component, spec]) => [type, {
  ...spec, type, label, category: 'صفحات پویا',
  component: function ApplicationBlock({ node, editorPreview = false }) {
    const { slug } = useParams();
    const entityId = editorPreview && /^(teacher|class)-\d+$/.test(slug || '') ? slug.split('-')[1] : undefined;
    // Inert prevents preview from making purchases, claiming rewards or navigating away.
    // The enclosing editor selection wrapper remains interactive.
    return <div inert={editorPreview || undefined}>
      <Component content={node.props} preview={editorPreview} entityId={entityId} />
    </div>;
  },
}]));
