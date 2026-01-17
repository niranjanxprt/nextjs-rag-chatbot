import type { ChatMessage } from "@/services/api/types";

export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet: string;
  messages: ChatMessage[];
  projectId?: string | null; // null for central chat
}

export interface ChatThreadsState {
  threads: ChatThread[];
  activeThreadId: string | null;
}
