'use client';
import { createContext, useContext } from 'react';

interface AIChatContextType {
  openChat: () => void;
}

export const AIChatContext = createContext<AIChatContextType>({
  openChat: () => {},
});

export const useAIChat = () => useContext(AIChatContext);
