/**
 * app/layout.tsx
 * ==============
 * Next.js 14 App Router — Root layout.
 *
 * Provides the application shell that wraps every page in the /app directory.
 * Registers global providers:
 *  • <QueryProvider>  — TanStack Query v5 client (React Query cache + devtools)
 *
 * Font: Inter (Google Fonts via next/font) — matches the CSS system font stack
 * already used in page.module.css and the form CSS module.
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AI-Native ERP',
    template: '%s | AI-Native ERP',
  },
  description:
    'Multi-tenant AI-Native ERP — Manufacturing, Retail, and Services inventory management powered by FastAPI and Supabase.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                let sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && sysDark) || (theme === 'system' && sysDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
