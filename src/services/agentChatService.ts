/**
 * services/agentChatService.ts
 * ===============================
 * Async client service layer for the unified AI Assistant chat.
 *
 * Maps to backend router: `/api/v1/agent`
 * The `X-Tenant-ID` header is automatically injected by `apiClient` interceptors.
 */

import apiClient from '@/lib/apiClient'
import type {
  AgentChatRequest,
  AgentChatConfirmRequest,
  AgentChatResponse,
} from '@/types/agentChat'

const AGENT_BASE = '/api/v1/agent'

/** Maps to: `POST /api/v1/agent/chat` */
export async function sendAgentChatMessage(payload: AgentChatRequest): Promise<AgentChatResponse> {
  const response = await apiClient.post<AgentChatResponse>(`${AGENT_BASE}/chat`, payload)
  return response.data
}

/** Maps to: `POST /api/v1/agent/chat/confirm` */
export async function confirmAgentChatToolCall(payload: AgentChatConfirmRequest): Promise<AgentChatResponse> {
  const response = await apiClient.post<AgentChatResponse>(`${AGENT_BASE}/chat/confirm`, payload)
  return response.data
}

export const agentChatService = {
  sendAgentChatMessage,
  confirmAgentChatToolCall,
} as const
