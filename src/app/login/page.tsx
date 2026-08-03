'use client';

/**
 * Login Page — Batch 1 design system migration
 * =============================================
 * Changes from original:
 *  - Container background: radial-gradient(#1f2937, #07070e) → neutral-950 with accent glow
 *  - Card: login.module.css → Card component with design system bg/border tokens
 *  - Inputs: login.module.css .input → shared Input component (accent-600 focus ring)
 *  - Submit button: login.module.css .submitBtn → Button variant="primary" fullWidth
 *  - Error message: login.module.css .error → danger semantic color tokens
 *  - Title/subtitle: module CSS → text-page-title / text-body token classes
 *
 * Auth logic: zero changes — form state, API call, store dispatch identical.
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import apiClient, { isApiError } from '@/lib/apiClient';
import { Button, Input, Card, CardContent, Alert } from '@/components/ui';

// useSearchParams() opts the page out of static rendering unless the
// component calling it is wrapped in <Suspense> -- without this, `next
// build` fails outright ("useSearchParams() should be wrapped in a
// suspense boundary"), it's not just a lint warning. Found live: the E2E
// suite's production build step failed to start at all after
// useSearchParams() was added here for the session-expired banner.
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  // apiClient.ts's response interceptor redirects here with
  // ?reason=session_expired when a 401 survives a silent refresh attempt
  // (expired/revoked session, or every token invalidated at once by e.g.
  // a SECRET_KEY rotation) -- surfaces a clear, specific reason instead
  // of dropping the user back on a bare login form with no explanation.
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await apiClient.post('/api/v1/auth/login', {
        email,
        password,
      });

      // The refresh token is set as an httpOnly cookie by the backend, not
      // returned in the response body — see authStore.ts.
      const { access_token, user } = res.data;
      setAuth(user, access_token);

      router.push('/dashboard');
    } catch (err) {
      if (isApiError(err) && err.status === 429) {
        // Distinct from every other failure -- this isn't a bad password
        // or a broken account, it's /auth/login's own brute-force
        // throttle (5 attempts / 15 min / IP, shared across every login
        // attempt from this browser -- see app/core/rate_limit.py).
        // Worth calling out specifically so it doesn't read as "the app
        // is broken" when it's actually working as designed.
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else if (isApiError(err)) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* Page background — neutral-50 with light accent glow, or neutral-950 with dark accent glow */
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 transition-colors">
      {/* Decorative background glow — pure CSS, no JS */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent-200 dark:bg-accent-900/20 rounded-full blur-3xl transition-colors" />
      </div>

      <Card className="relative w-full max-w-sm">
        <CardContent className="p-8">
          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-accent-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-lg">
              AI
            </div>
          </div>

          {/* Title */}
          <h1 className="text-section-header text-neutral-900 dark:text-neutral-50 text-center mb-1">
            Welcome Back
          </h1>
          <p className="text-caption text-neutral-500 dark:text-neutral-400 text-center mb-8">
            Sign in to your AI-Native ERP account
          </p>

          {sessionExpired && !error && (
            <Alert variant="info" className="mb-5">
              Your session has expired. Please log in again.
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="admin@ainative.erp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-danger-light border border-danger/20 text-danger-dark text-caption"
              >
                <span className="mt-px shrink-0" aria-hidden>⚠</span>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
