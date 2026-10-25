import PanelLayout from '../../../layouts/PanelLayout.jsx';
import PageAccess from '../../../components/PageAccess.jsx';
export const metadata = { robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PageAccess role="teacher"><PanelLayout variant="teacher">{children}</PanelLayout></PageAccess>;
}
