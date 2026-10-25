import PanelLayout from '../../../layouts/PanelLayout.jsx';
import PageAccess from '../../../components/PageAccess.jsx';
export const metadata={robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <PageAccess role="parent"><PanelLayout variant="parent">{children}</PanelLayout></PageAccess>;}
