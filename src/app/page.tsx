'use client';

/**
 * Landing Page — Batch 1 design system migration
 * ===============================================
 * Changes:
 *  - .hero CSS class → Tailwind radial bg + token-based layout
 *  - .btn / .btn-primary / .btn-secondary → Button component
 *  - .container → Tailwind max-w + padding
 *  - Inline style margin removed
 *
 * Auth logic: unchanged — isAuthenticated check identical.
 */

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-neutral-950 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-navy-900/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-600 to-accent-600 flex items-center justify-center text-white font-bold text-xl shadow-xl">
            AI
          </div>
        </div>

        <h1 className="text-page-title text-neutral-50 mb-4">
          AI Native ERP
        </h1>
        <p className="text-body text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed">
          The future of enterprise resource planning. Intelligent, scalable, and built for modern businesses.
        </p>

        <div className="flex items-center justify-center gap-4">
          {isAuthenticated ? (
            <Button variant="primary" size="lg" leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M3 12h18M13 6l6 6-6 6"/></svg>
            }>
              <Link href="/dashboard" className="contents">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button variant="primary" size="lg">
              <Link href="/login" className="contents">Sign In</Link>
            </Button>
          )}
          <Button variant="outline" size="lg">
            <Link href="/inventory" className="contents">View Inventory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
