import { delay } from "./config";
import type { ApiResponse, PaginatedResponse, ChatMessage } from "./types";
import type { ChatThread } from "@/types/chat";

// Service stubs for chat threads - to be replaced with backend integration
export const chatThreadsApi = {
  async listChats(params: {
    limit?: number;
    offset?: number;
    query?: string;
  }): Promise<PaginatedResponse<ChatThread>> {
    await delay(200);
    // TODO: Replace with actual API call
    // For now, this is handled by the context
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: params.limit || 25,
      totalPages: 0,
    };
  },

  async getChat(chatId: string): Promise<ApiResponse<ChatThread>> {
    await delay(100);
    // TODO: Replace with actual API call
    return {
      data: null as unknown as ChatThread,
      success: false,
      message: "Not implemented - using local state",
    };
  },

  async createChatFromFirstMessage(
    firstUserMessage: string
  ): Promise<ApiResponse<ChatThread>> {
    await delay(100);
    // TODO: Replace with actual API call
    // For now, thread creation is handled locally in context
    const now = new Date().toISOString();
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: firstUserMessage.substring(0, 50),
      createdAt: now,
      updatedAt: now,
      lastMessageSnippet: firstUserMessage.substring(0, 100),
      messages: [],
      projectId: null,
    };
    return { data: newThread, success: true };
  },

  async sendChatMessage(params: {
    chatId: string;
    message: string;
    attachments?: File[];
  }): Promise<ApiResponse<ChatMessage>> {
    await delay(100);
    // TODO: Replace with actual API call to /api/v1/chat
    // For now, the streaming simulation is handled in components
    return {
      data: null as unknown as ChatMessage,
      success: false,
      message: "Not implemented - using local simulation",
    };
  },

  async deleteChat(chatId: string): Promise<ApiResponse<void>> {
    await delay(200);
    // TODO: Replace with actual API call
    return { data: undefined, success: true };
  },

  async renameChat(
    chatId: string,
    title: string
  ): Promise<ApiResponse<ChatThread>> {
    await delay(100);
    // TODO: Replace with actual API call
    return {
      data: null as unknown as ChatThread,
      success: true,
    };
  },

  async moveChatToProject(
    chatId: string,
    projectId: string
  ): Promise<ApiResponse<ChatThread>> {
    await delay(200);
    // TODO: Replace with actual API call
    // For now, handled locally in context
    return {
      data: null as unknown as ChatThread,
      success: true,
      message: "Moved to project (local only)",
    };
  },

  async searchChats(query: string): Promise<ApiResponse<ChatThread[]>> {
    await delay(150);
    // TODO: Replace with actual API call with backend search
    // For now, search is handled locally in context
    return {
      data: [],
      success: true,
      message: "Search handled locally",
    };
  },
};
