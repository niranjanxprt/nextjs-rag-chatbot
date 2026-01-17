import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi, type Conversation, type Message, type ConversationCreate, type MessageCreate } from "@/services/api/conversations";

// Query keys
const conversationsKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationsKeys.all, "list"] as const,
  list: (filters?: { user_id?: string; project_id?: string }) => [...conversationsKeys.lists(), filters] as const,
  details: () => [...conversationsKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationsKeys.details(), id] as const,
  messages: (id: string) => [...conversationsKeys.detail(id), "messages"] as const,
};

// Get user ID from localStorage
function getUserId(): string {
  const STORAGE_KEY = "rag_user_id";
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

// List conversations
export function useConversations(filters?: { project_id?: string }) {
  const user_id = getUserId();
  
  return useQuery({
    queryKey: conversationsKeys.list({ ...filters, user_id }),
    queryFn: async () => {
      const response = await conversationsApi.listConversations({
        user_id,
        ...filters,
        limit: 50,
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch conversations");
      }
      return response.data;
    },
  });
}

// Get single conversation
export function useConversation(id: string, includeMessages: boolean = true) {
  return useQuery({
    queryKey: conversationsKeys.detail(id),
    queryFn: async () => {
      const response = await conversationsApi.getConversation(id, includeMessages);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch conversation");
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Get messages for conversation
export function useConversationMessages(conversationId: string, limit?: number) {
  return useQuery({
    queryKey: conversationsKeys.messages(conversationId),
    queryFn: async () => {
      const response = await conversationsApi.getMessages(conversationId, limit);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch messages");
      }
      return response.data;
    },
    enabled: !!conversationId,
  });
}

// Create conversation mutation
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const user_id = getUserId();
  
  return useMutation({
    mutationFn: async (data: ConversationCreate) => {
      const response = await conversationsApi.createConversation(data);
      if (!response.success) {
        throw new Error(response.message || "Failed to create conversation");
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: conversationsKeys.list({ user_id }) });
    },
  });
}

// Delete conversation mutation
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const user_id = getUserId();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await conversationsApi.deleteConversation(conversationId);
      if (!response.success) {
        throw new Error(response.message || "Failed to delete conversation");
      }
    },
    onSuccess: () => {
      // Invalidate conversations list and detail
      queryClient.invalidateQueries({ queryKey: conversationsKeys.list({ user_id }) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.all });
    },
  });
}

// Add message mutation
export function useAddMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, data }: { conversationId: string; data: MessageCreate }) => {
      const response = await conversationsApi.addMessage(conversationId, data);
      if (!response.success) {
        throw new Error(response.message || "Failed to add message");
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate conversation detail and messages
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.messages(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationsKeys.all });
    },
  });
}
