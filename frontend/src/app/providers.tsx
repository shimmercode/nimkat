'use client';
import { AuthProvider } from '../auth.jsx';
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
