'use client';
import ServiceWorker from '../components/ServiceWorker';
import SupportWidget from '../components/support/SupportWidget.jsx';
import { AuthProvider } from '../auth.jsx';
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider><ServiceWorker/>{children}<SupportWidget /></AuthProvider>;
}
