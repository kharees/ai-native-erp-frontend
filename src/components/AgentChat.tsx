'use client';

import { useCallback, useState } from 'react';
import { isApiError } from '@/lib/apiClient';
import { agentChatService } from '@/services/agentChatService';
import type { AgentMessage, AgentToolCall } from '@/types/agentChat';

/**
 * components/AgentChat.tsx
 * ===========================
 * The single shared chat UI for the consolidated AI Assistant -- replaces
 * the four previously-separate copilot chat pages (finance ai-copilot/chat,
 * omnichannel-billing ai-copilot, universal-inventory intelligence copilot,
 * migration ai-copilot). Available tools are resolved server-side per
 * request by the caller's real RBAC permissions (get_tools_for_user), not
 * by which page embeds this component -- moduleContext only nudges the
 * system prompt (see backend agent_chat.py's _system_prompt), it never
 * restricts which tools the model can use.
 *
 * Stateless server-side (see backend loop.py's own docstring on this) --
 * this component is the one place that owns conversation history for the
 * lifetime of the mounted component, resending the full `messages` array
 * every turn and replacing it with whatever the server returns.
 */

interface DisplayMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

function toDisplayMessages(messages: AgentMessage[]): DisplayMessage[] {
  const out: DisplayMessage[] = [];
  for (const m of messages) {
    if (m.role === 'user' && typeof m.content === 'string') {
      out.push({ role: 'user', text: m.content });
    } else if (m.role === 'assistant') {
      if (typeof m.content === 'string' && m.content.trim()) {
        out.push({ role: 'assistant', text: m.content });
      }
      if (m.tool_calls?.length) {
        out.push({
          role: 'system',
          text: `Used: ${m.tool_calls.map((c) => c.name).join(', ')}`,
        });
      }
    }
    // tool_result turns are intentionally not rendered as chat bubbles --
    // their content already informed the assistant's next text turn.
  }
  return out;
}

/**
 * 'page'  -- standalone card on /ai-assistant (fixed 70vh + its own border/
 *            shadow chrome). Unchanged default, so that route renders
 *            exactly as before.
 * 'panel' -- embedded in the global <Drawer> opened by the Sidebar's "Ask
 *            AI Assistant" and PageShell's "Ask AI" (present on all 49
 *            pages). Fills the drawer's height and drops the card chrome,
 *            since the Drawer already supplies the surface and border.
 *
 * Conversation history lives in this component's state (see the module
 * docstring above), so closing the drawer ends that conversation -- the
 * same behavior the /ai-assistant page already has when you navigate away.
 */
type AgentChatVariant = 'page' | 'panel';

const CONTAINER_CLASSES: Record<AgentChatVariant, string> = {
  page: 'flex flex-col h-[70vh] bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700',
  panel: 'flex flex-col h-full',
};

export default function AgentChat({
  moduleContext,
  variant = 'page',
}: {
  moduleContext?: string;
  variant?: AgentChatVariant;
}) {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [pendingToolCall, setPendingToolCall] = useState<AgentToolCall | null>(null);

  const displayMessages = toDisplayMessages(history);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const nextHistory: AgentMessage[] = [...history, { role: 'user', content: input.trim() }];
    setHistory(nextHistory);
    setInput('');
    setSending(true);
    setError('');
    try {
      const result = await agentChatService.sendAgentChatMessage({
        conversation_id: conversationId,
        messages: nextHistory,
        module_context: moduleContext ?? null,
      });
      setHistory(result.messages);
      if (result.status === 'awaiting_confirmation' && result.pending_tool_call) {
        setPendingToolCall(result.pending_tool_call);
      }
    } catch (err) {
      setError(isApiError(err) ? err.message : 'The assistant could not respond.');
    } finally {
      setSending(false);
    }
  }, [input, sending, history, conversationId, moduleContext]);

  const handleConfirm = useCallback(async (confirmed: boolean) => {
    if (!pendingToolCall) return;
    setSending(true);
    setError('');
    try {
      const result = await agentChatService.confirmAgentChatToolCall({
        conversation_id: conversationId,
        messages: history,
        pending_tool_call: pendingToolCall,
        confirmed,
      });
      setHistory(result.messages);
      setPendingToolCall(result.status === 'awaiting_confirmation' ? result.pending_tool_call ?? null : null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to record your decision.');
    } finally {
      setSending(false);
    }
  }, [pendingToolCall, history, conversationId]);

  return (
    <div className={CONTAINER_CLASSES[variant]}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayMessages.length === 0 && (
          <p className="text-sm text-gray-500">
            Ask about sales, invoices, stock, migration sessions, finance insights, or security -- I have real tools for all of them, filtered to what you have permission to use.
          </p>
        )}
        {displayMessages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={
                m.role === 'user'
                  ? 'inline-block px-3 py-2 rounded-lg bg-blue-600 text-white text-sm max-w-[80%]'
                  : m.role === 'system'
                    ? 'inline-block px-3 py-1 rounded text-xs text-gray-400 italic'
                    : 'inline-block px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm max-w-[80%]'
              }
            >
              {m.text}
            </span>
          </div>
        ))}
        {sending && <p className="text-xs text-gray-400">Thinking...</p>}
      </div>

      {error && (
        <div className="mx-4 mb-2 p-2 bg-red-50 text-red-700 rounded border border-red-200 text-xs">{error}</div>
      )}

      {pendingToolCall && (
        <div className="mx-4 mb-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
          <p className="font-medium mb-1">Confirm action: {pendingToolCall.name}</p>
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-2">
            {JSON.stringify(pendingToolCall.arguments, null, 2)}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirm(true)}
              disabled={sending}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => handleConfirm(false)}
              disabled={sending}
              className="px-3 py-1.5 border rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder={pendingToolCall ? 'Resolve the pending confirmation above first...' : 'Ask the AI Assistant...'}
          disabled={sending || !!pendingToolCall}
          className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim() || !!pendingToolCall}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
