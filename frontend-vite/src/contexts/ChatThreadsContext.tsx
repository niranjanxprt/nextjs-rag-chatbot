import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import type { ChatThread } from "@/types/chat";
import type { ChatMessage } from "@/services/api/types";
import { 
  useConversations, 
  useCreateConversation, 
  useDeleteConversation,
  useAddMessage as useAddMessageMutation
} from "@/hooks/useConversations";
import type { Conversation, Message as BackendMessage } from "@/services/api/conversations";

interface ChatThreadsContextType {
  threads: ChatThread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  createThread: (firstMessage: string) => ChatThread;
  getThread: (id: string) => ChatThread | undefined;
  updateThread: (id: string, updates: Partial<ChatThread>) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  moveToProject: (chatId: string, projectId: string) => void;
  addMessage: (threadId: string, message: ChatMessage) => void;
  updateMessage: (threadId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  getRecentChats: (limit: number) => ChatThread[];
  searchChats: (query: string) => ChatThread[];
}

const ChatThreadsContext = createContext<ChatThreadsContextType | undefined>(undefined);

// Initial mock threads for demo
const initialThreads: ChatThread[] = [
  {
    id: "thread-1",
    title: "Contract analysis questions",
    createdAt: "2024-12-10T10:00:00Z",
    updatedAt: "2024-12-10T14:30:00Z",
    lastMessageSnippet: "What are the key termination clauses?",
    messages: [
      {
        id: "msg-1",
        projectId: "",
        role: "user",
        content: "What are the key termination clauses in our vendor contracts?",
        timestamp: "2024-12-10T10:00:00Z",
      },
      {
        id: "msg-2",
        projectId: "",
        role: "assistant",
        content: "Based on my analysis, here are the key termination clauses:\n\n**1. Termination for Convenience**\nMost contracts allow either party to terminate with 30-90 days written notice.\n\n**2. Termination for Breach**\nMaterial breach allows immediate termination after a cure period.",
        timestamp: "2024-12-10T10:01:00Z",
      },
    ],
    projectId: null,
  },
  {
    id: "thread-2",
    title: "Financial report summary",
    createdAt: "2024-12-09T09:00:00Z",
    updatedAt: "2024-12-09T11:20:00Z",
    lastMessageSnippet: "Summarize the Q4 financial highlights",
    messages: [
      {
        id: "msg-3",
        projectId: "",
        role: "user",
        content: "Summarize the Q4 financial highlights",
        timestamp: "2024-12-09T09:00:00Z",
      },
      {
        id: "msg-4",
        projectId: "",
        role: "assistant",
        content: "Here are the Q4 financial highlights:\n\n- Revenue increased 15% YoY\n- Operating margin improved to 22%\n- Free cash flow of $2.3M",
        timestamp: "2024-12-09T09:02:00Z",
      },
    ],
    projectId: null,
  },
  {
    id: "thread-3",
    title: "HR policy compliance check",
    createdAt: "2024-12-08T14:00:00Z",
    updatedAt: "2024-12-08T15:45:00Z",
    lastMessageSnippet: "Check if our remote work policy is compliant",
    messages: [
      {
        id: "msg-5",
        projectId: "",
        role: "user",
        content: "Check if our remote work policy is compliant with current regulations",
        timestamp: "2024-12-08T14:00:00Z",
      },
      {
        id: "msg-6",
        projectId: "",
        role: "assistant",
        content: "I've reviewed your remote work policy. Here are my findings:\n\n**Compliant Areas:**\n- Work hours documentation\n- Equipment provisions\n\n**Areas Needing Review:**\n- Data security provisions should be updated",
        timestamp: "2024-12-08T14:03:00Z",
      },
    ],
    projectId: null,
  },
];

// Map backend Conversation to frontend ChatThread
function mapConversationToThread(conv: Conversation, projectId?: string | null): ChatThread {
  const messages: ChatMessage[] = (conv.messages || []).map((msg: BackendMessage) => ({
    id: msg.id,
    projectId: projectId || "",
    role: msg.role,
    content: msg.content,
    timestamp: msg.created_at,
    sources: msg.sources?.map((s, idx) => ({
      id: s.metadata?.doc_id || `source-${idx}`,
      name: s.metadata?.source || "Document",
      snippet: s.content,
      page: s.metadata?.page,
    })),
  }));

  const lastMessage = messages[messages.length - 1];
  const lastMessageSnippet = lastMessage?.content.substring(0, 100) || "";

  return {
    id: conv.id,
    title: conv.title || "Untitled Conversation",
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    lastMessageSnippet,
    messages,
    projectId: projectId || conv.project_id || null,
  };
}

export function ChatThreadsProvider({ children }: { children: ReactNode }) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // Fetch conversations from backend
  const { data: conversations, isLoading, refetch } = useConversations(
    projectFilter ? { project_id: projectFilter } : undefined
  );
  
  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();
  const addMessageMutation = useAddMessageMutation();

  // Map conversations to threads
  const threads: ChatThread[] = useMemo(() => {
    if (!conversations) return [];
    return conversations.map((conv) => mapConversationToThread(conv, projectFilter));
  }, [conversations, projectFilter]);

  const generateTitle = (message: string): string => {
    const maxLength = 50;
    const cleaned = message.replace(/\n/g, " ").trim();
    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength) + "..."
      : cleaned;
  };

  const createThread = useCallback(async (firstMessage: string, projectId?: string | null): Promise<ChatThread | null> => {
    try {
      const title = generateTitle(firstMessage);
      const conversation = await createConversationMutation.mutateAsync({
        title,
        project_id: projectId || undefined,
      });
      
      const thread = mapConversationToThread(conversation, projectId);
      setActiveThreadId(thread.id);
      
      // Refetch conversations to update list
      await refetch();
      
      return thread;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
  }, [createConversationMutation, refetch]);

  const getThread = useCallback(
    (id: string): ChatThread | undefined => {
      return threads.find((t) => t.id === id);
    },
    [threads]
  );

  const updateThread = useCallback(
    (id: string, updates: Partial<ChatThread>) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      );
    },
    []
  );

  const deleteThread = useCallback(async (id: string) => {
    try {
      await deleteConversationMutation.mutateAsync(id);
      if (activeThreadId === id) {
        setActiveThreadId(null);
      }
      await refetch();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  }, [deleteConversationMutation, activeThreadId, refetch]);

  const renameThread = useCallback(async (id: string, title: string) => {
    // TODO: Backend doesn't have update conversation endpoint yet
    // For now, we'll need to add it or handle it client-side
    // This is a placeholder that will work once backend supports it
    await refetch();
  }, [refetch]);

  const moveToProject = useCallback(async (chatId: string, projectId: string) => {
    // TODO: Backend doesn't have update conversation endpoint yet
    // For now, refetch conversations
    setProjectFilter(projectId);
    await refetch();
  }, [refetch]);

  const addMessage = useCallback(async (threadId: string, message: ChatMessage) => {
    try {
      // Add message to backend
      await addMessageMutation.mutateAsync({
        conversationId: threadId,
        data: {
          role: message.role,
          content: message.content,
          document_ids: message.sources?.map((s) => s.id),
        },
      });
      
      // Refetch conversation to get updated messages
      await refetch();
    } catch (error) {
      console.error("Failed to add message:", error);
      // Still update local state optimistically
    }
  }, [addMessageMutation, refetch]);

  const updateMessage = useCallback(
    (threadId: string, messageId: string, updates: Partial<ChatMessage>) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, ...updates } : m
                ),
              }
            : t
        )
      );
    },
    []
  );

  const getRecentChats = useCallback(
    (limit: number): ChatThread[] => {
      return [...threads]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, limit);
    },
    [threads]
  );

  const searchChats = useCallback(
    (query: string): ChatThread[] => {
      const lowerQuery = query.toLowerCase();
      return threads.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.messages.some((m) => m.content.toLowerCase().includes(lowerQuery))
      );
    },
    [threads]
  );

  return (
    <ChatThreadsContext.Provider
      value={{
        threads: threads || [],
        activeThreadId,
        setActiveThreadId,
        createThread,
        getThread,
        updateThread,
        deleteThread,
        renameThread,
        moveToProject,
        addMessage,
        updateMessage,
        getRecentChats,
        searchChats,
      }}
    >
      {children}
    </ChatThreadsContext.Provider>
  );
}

export function useChatThreads() {
  const context = useContext(ChatThreadsContext);
  if (context === undefined) {
    throw new Error("useChatThreads must be used within a ChatThreadsProvider");
  }
  return context;
}
