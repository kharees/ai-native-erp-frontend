'use client';
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { Button } from './Button';
import { cn } from './cn';
import { useAIChat } from '../../contexts/AIChatContext';

export interface PageShellProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  onAskAI?: () => void;
}

export function PageShell({ title, actions, children, className, headerClassName, onAskAI }: PageShellProps) {
  const { openChat } = useAIChat();
  const handleAskAI = onAskAI || openChat;

  return (
    <div className={cn('flex flex-col min-h-full p-4 md:p-5', className)}>
      <Breadcrumb />
      
      <header className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4', headerClassName)}>
        <h1 className="text-page-title text-neutral-900 dark:text-neutral-50 tracking-tight truncate">
          {title}
        </h1>
        
        <div className="flex items-center gap-3 shrink-0">
          {actions}
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1 hidden md:block" />
          <Button variant="secondary" size="sm" onClick={handleAskAI} leftIcon={<Sparkles size={14} className="text-accent-600 dark:text-accent-400" />}>
            Ask AI
          </Button>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}
