'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import AgentChat from '@/components/AgentChat';
import { useState } from 'react';
import { AIChatContext } from '@/contexts/AIChatContext';
import { CommandPalette, Drawer } from '@/components/ui';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  return (
    <AuthGuard>
      <AIChatContext.Provider value={{ openChat: () => setIsAIChatOpen(true) }}>
        <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
          <Sidebar />
          <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
            {children}
          </main>
        </div>
        {/* The global assistant opened by the Sidebar's "Ask AI Assistant"
            and PageShell's "Ask AI" button (on all 49 pages). This renders
            the SAME AgentChat component the /ai-assistant route uses, so
            both entry points hit the real orchestrator via
            agentChatService -> POST /api/v1/agent/chat. It previously
            rendered AIChatPanel, which returned hardcoded canned text from
            a setTimeout and never called the backend at all. */}
        <Drawer
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          title="AI Assistant"
          width="lg"
        >
          <AgentChat variant="panel" />
        </Drawer>
        <CommandPalette />
      </AIChatContext.Provider>
    </AuthGuard>
  );
}
