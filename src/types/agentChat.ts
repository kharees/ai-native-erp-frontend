/**
 * types/agentChat.ts
 * ====================
 * TypeScript definitions for the unified AI Assistant chat.
 * Matches backend Pydantic schemas in backend/app/schemas/agent_chat.py
 */

export interface AgentToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface AgentMessage {
  role: string
  content: string | Record<string, unknown>[] | null
  tool_calls?: AgentToolCall[] | null
  tool_call_id?: string | null
}

export interface AgentChatRequest {
  conversation_id: string
  messages: AgentMessage[]
  module_context?: string | null
}

export type AgentChatStatus = 'done' | 'awaiting_confirmation' | 'max_iterations_reached'

export interface AgentChatResponse {
  status: AgentChatStatus
  text: string | null
  pending_tool_call: AgentToolCall | null
  messages: AgentMessage[]
}

export interface AgentChatConfirmRequest {
  conversation_id: string
  messages: AgentMessage[]
  pending_tool_call: AgentToolCall
  confirmed: boolean
}
