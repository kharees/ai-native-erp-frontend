'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AgentChat from '@/components/AgentChat';

const MODULE_OPTIONS = [
  { value: '', label: 'General (no specific module)' },
  { value: 'billing', label: 'Billing' },
  { value: 'finance', label: 'Finance' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'migration', label: 'Migration' },
  { value: 'security', label: 'Security & Identity' },
];

export default function AIAssistantPage() {
  // useSearchParams() must be wrapped in Suspense (Next.js App Router
  // requirement) -- lets module-page "Ask AI" links (e.g. finance's CFO
  // dashboard, universal-inventory's intelligence page) deep-link
  // straight into the right module_context via /ai-assistant?module=X
  // instead of the user having to reselect it from the dropdown.
  return (
    <Suspense fallback={null}>
      <AIAssistantContent />
    </Suspense>
  );
}

function AIAssistantContent() {
  const searchParams = useSearchParams();
  const initialModule = searchParams.get('module') || '';
  const [moduleContext, setModuleContext] = useState(initialModule);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">AI Assistant</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        One assistant across billing, finance, inventory, migration, and security -- it only
        shows and uses the tools your permissions actually allow.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Focus (optional)</label>
        <select
          value={moduleContext}
          onChange={(e) => setModuleContext(e.target.value)}
          className="w-full md:w-64 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
        >
          {MODULE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          This only hints the assistant about what you&apos;re focused on -- it can still use tools from any module you have permission for.
        </p>
      </div>

      <AgentChat moduleContext={moduleContext || undefined} />
    </div>
  );
}
