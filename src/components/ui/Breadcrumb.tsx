'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from './cn';

export function Breadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/') return null;
  
  // Ignore group routing folders like (main)
  const segments = pathname.split('/').filter(s => Boolean(s) && !s.startsWith('('));
  
  return (
    <nav className={cn('flex items-center text-caption text-neutral-500 mb-2', className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors flex items-center justify-center w-5 h-5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Home size={12} />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
          
          return (
            <React.Fragment key={href}>
              <ChevronRight size={12} className="text-neutral-400" />
              <li>
                {isLast ? (
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium" aria-current="page">
                    {title}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors px-1 py-0.5 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    {title}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
