'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated, isRefreshing, hasBootstrapped, bootstrapAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // The access token now lives only in memory (see authStore.ts) -- it
  // never survives a hard reload on its own. Once the (non-sensitive)
  // persisted state has loaded, kick off exactly one silent refresh
  // against the httpOnly refresh cookie to obtain a real access token
  // before trusting isAuthenticated at all. bootstrapAuth no-ops if
  // already run this page load (hasBootstrapped), so mounting multiple
  // AuthGuards (nested layouts) is safe.
  useEffect(() => {
    if (hasHydrated && !hasBootstrapped) {
      bootstrapAuth();
    }
  }, [hasHydrated, hasBootstrapped, bootstrapAuth]);

  // Still checking: localStorage hasn't finished loading, or the silent
  // refresh is in flight, or it hasn't even been kicked off yet. Treated
  // as "not yet decided" rather than "unauthenticated" so an
  // already-authenticated user's hard reload never flashes /login while
  // bootstrapAuth is still resolving.
  const isCheckingAuth = !hasHydrated || !hasBootstrapped || isRefreshing;

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated) {
      router.push('/login');
    }
  }, [isCheckingAuth, isAuthenticated, router, pathname]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <p className="text-caption text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirecting to /login (see effect above)
  }

  return <>{children}</>;
}
