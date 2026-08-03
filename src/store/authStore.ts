import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  tenant_id: string | null;
  full_name: string | null;
}

export interface RefreshResult {
  accessToken: string;
  user: User;
}

let _refreshPromise: Promise<RefreshResult | null> | null = null;

export async function refreshAccessToken(): Promise<RefreshResult | null> {
  if (!_refreshPromise) {
    _refreshPromise = axios
      .post(`${BASE_URL}/api/v1/auth/refresh`, null, { withCredentials: true })
      .then((res) => ({ accessToken: res.data.access_token as string, user: res.data.user as User }))
      .catch(() => null)
      .finally(() => {
        _refreshPromise = null;
      });
  }
  return _refreshPromise;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True once zustand-persist has finished reading `auth-storage` from
   * localStorage (only `user` lives there now — see partialize below). */
  hasHydrated: boolean;
  /** True while the initial silent-refresh attempt (bootstrapAuth) is
   * in flight. AuthGuard uses this (alongside hasHydrated) to show a
   * loading state instead of either flashing /login or rendering
   * protected content before a real access token exists. */
  isRefreshing: boolean;
  /** True once a silent-refresh attempt has been kicked off (successful
   * or not) OR a real login (setAuth) has happened this page load —
   * prevents bootstrapAuth from firing more than once per load even
   * though every AuthGuard instance (nested layouts, e.g.
   * app/(main)/layout.tsx + app/(main)/inventory/layout.tsx) calls it
   * on mount. */
  hasBootstrapped: boolean;
  setAuth: (user: User, accessToken: string) => void;
  /** Updates just the access token — used by apiClient's silent-refresh-on-401
   * interceptor, which has a fresh token but no reason to touch `user`. */
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
  /** Obtains a fresh access token from the httpOnly refresh cookie via
   * POST /auth/refresh (see apiClient.ts's refreshAccessToken — the exact
   * same call, and the exact same in-flight de-duplication, the 401
   * interceptor itself uses). Call once, after hydration, before
   * rendering anything that assumes isAuthenticated is trustworthy — see
   * AuthGuard.tsx. No-ops if already bootstrapped/in-progress, and never
   * throws: a failed refresh (expired/missing/revoked cookie) just clears
   * auth state, exactly like apiClient's interceptor does when its own
   * refresh attempt fails.
   */
  bootstrapAuth: () => Promise<void>;
}

// Security model
// ----------------
// The refresh token is never held here at all — it lives only in the
// httpOnly `refresh_token` cookie the backend sets on /login and /refresh
// (see backend/app/api/v1/endpoints/auth.py), which JS cannot read.
//
// The access token lives ONLY in memory (this store's in-memory Zustand
// state) — it is deliberately excluded from `partialize` below, so
// zustand-persist never writes it to localStorage. Any XSS anywhere in
// the app can still see it for as long as the tab is open (nothing short
// of moving auth out of JS entirely prevents that), but it can no longer
// be read out of localStorage after the fact, survive a closed tab, or be
// exfiltrated by a payload that runs after the page reloads. This does
// mean the access token doesn't survive a hard reload/new tab on its
// own — see bootstrapAuth/AuthGuard: every fresh page load re-derives one
// from the httpOnly refresh cookie via a silent POST /auth/refresh before
// any protected content renders, instead of trusting a stale localStorage
// copy.
//
// `user` (non-sensitive profile info — id/email/tenant_id/full_name, no
// token) is still persisted, purely so already-logged-in UI chrome (e.g.
// a header showing the user's name) has something to paint immediately
// on reload instead of a blank state while bootstrapAuth's network call
// is still in flight. `isAuthenticated` and `accessToken` are NOT
// persisted — they must only ever reflect a real, current token, never a
// stale guess replayed from a previous page load.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      // Zustand's persist middleware rehydrates from localStorage asynchronously
      // after the initial (unauthenticated) state renders. Consumers that decide
      // whether to redirect to /login (e.g. AuthGuard) must wait for hasHydrated
      // before trusting isAuthenticated, or every hard reload of a logged-in
      // session bounces the user out before bootstrapAuth even gets a chance to
      // run.
      hasHydrated: false,
      isRefreshing: false,
      hasBootstrapped: false,
      setAuth: (user, accessToken) =>
        // A real login already has a live access token — no silent refresh
        // needed, so this also marks bootstrapping done to stop a later
        // AuthGuard mount (e.g. navigating into a nested layout) from
        // firing a redundant /auth/refresh call this same page load.
        set({ user, accessToken, isAuthenticated: true, hasBootstrapped: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, hasBootstrapped: true }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      bootstrapAuth: async () => {
        if (get().hasBootstrapped || get().isRefreshing) return;
        set({ isRefreshing: true, hasBootstrapped: true });
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          set({
            user: refreshed.user,
            accessToken: refreshed.accessToken,
            isAuthenticated: true,
            isRefreshing: false,
          });
        } else {
          // No valid refresh cookie (never logged in, expired, revoked,
          // or logged out elsewhere) — clear state rather than leaving
          // stale persisted `user` data implying a session that no
          // longer exists. AuthGuard reacts to isAuthenticated=false
          // once isRefreshing flips back to false.
          set({ user: null, accessToken: null, isAuthenticated: false, isRefreshing: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined!)),
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
