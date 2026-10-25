import SiteLayout from '../../layouts/SiteLayout.jsx';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}
