'use client';
// Compatibility names only; all routing is owned by Next App Router.
import NextLink from 'next/link';
import { usePathname, useRouter, useParams as nextParams, useSearchParams as nextSearchParams } from 'next/navigation';
import { useCallback, useEffect, type ComponentProps, type ReactNode } from 'react';

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string };
export function Link({ to, ...props }: LinkProps) { return <NextLink href={to} {...props} />; }
export function NavLink({ to, end, className, children, ...props }: Omit<LinkProps, 'className' | 'children'> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
  children?: ReactNode;
}) {
  const path = usePathname() || '/';
  const target = to.split(/[?#]/)[0];
  const active = path === target || (!end && target !== '/' && path.startsWith(`${target}/`));
  return <Link to={to} aria-current={active ? 'page' : undefined} className={typeof className === 'function' ? className({ isActive: active }) : className} {...props}>{children}</Link>;
}
export function useNavigate() {
  const router = useRouter();
  return useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') { if (to < 0) router.back(); else router.forward(); return; }
    options?.replace ? router.replace(to) : router.push(to);
  }, [router]);
}
export function useParams() { return nextParams<Record<string, string>>() || {}; }
export function useLocation() {
  const pathname = usePathname() || '/';
  return { pathname, search: typeof window === 'undefined' ? '' : window.location.search };
}
export function useSearchParams() { return [nextSearchParams()] as const; }
export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => { navigate(to, { replace }); }, [navigate, to, replace]);
  return null;
}
