import { apiFetch } from "./config";
import type { ApiResponse } from "./types";

// Backend API types
export interface Conversation {
  id: string;
  user_id: string;
  project_id?: string;
  title?: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  document_ids?: string[];
  framework?: string;
  model?: string;
  sources?: Array<{ content: string; score: number; metadata?: any }>;
}

export interface ConversationCreate {
  title?: string;
  project_id?: string;
  metadata?: Record<string, any>;
}

export interface MessageCreate {
  role: "user" | "assistant" | "system";
  content: string;
  document_ids?: string[];
  framework?: string;
  model?: string;
  sources?: Array<{ content: string; score: number; metadata?: any }>;
}

export const conversationsApi = {
  // List conversations
  async listConversations(params?: {
    user_id?: string;
    project_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Conversation[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.user_id) queryParams.append("user_id", params.user_id);
      if (params?.project_id) queryParams.append("project_id", params.project_id);
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.offset) queryParams.append("offset", params.offset.toString());
      
      const url = `/conversations${queryParams.toString() ? `?${queryParams}` : ""}`;
      // apiFetch now automatically includes X-User-ID header
      const conversations = await apiFetch<Conversation[]>(url);
      return { data: conversations, success: true };
    } catch (error: any) {
      console.error("Failed to fetch conversations:", error);
      return {
        data: [],
        success: false,
        message: error.message || "Failed to fetch conversations",
      };
    }
  },

  // Get conversation by ID
  async getConversation(
    conversationId: string,
    includeMessages: boolean = true
  ): Promise<ApiResponse<Conversation>> {
    try {
      const conversation = await apiFetch<Conversation>(
        `/conversations/${conversationId}?include_messages=${includeMessages}`
      );
      return { data: conversation, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as Conversation,
        success: false,
        message: error.message || "Conversation not found",
      };
    }
  },

  // Create conversation
  async createConversation(
    data: ConversationCreate
  ): Promise<ApiResponse<Conversation>> {
    try {
      const conversation = await apiFetch<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { data: conversation, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as Conversation,
        success: false,
        message: error.message || "Failed to create conversation",
      };
    }
  },

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    try {
      await apiFetch<void>(`/conversations/${conversationId}`, {
        method: "DELETE",
      });
      return { data: undefined, success: true };
    } catch (error: any) {
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to delete conversation",
      };
    }
  },

  // Add message to conversation
  async addMessage(
    conversationId: string,
    data: MessageCreate
  ): Promise<ApiResponse<Message>> {
    try {
      const message = await apiFetch<Message>(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            ...data,
            conversation_id: conversationId,
          }),
        }
      );
      return { data: message, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as Message,
        success: false,
        message: error.message || "Failed to add message",
      };
    }
  },

  // Get messages for conversation
  async getMessages(
    conversationId: string,
    limit?: number
  ): Promise<ApiResponse<Message[]>> {
    try {
      const url = `/conversations/${conversationId}/messages${
        limit ? `?limit=${limit}` : ""
      }`;
      const messages = await apiFetch<Message[]>(url);
      return { data: messages, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: error.message || "Failed to fetch messages",
      };
    }
  },
};
