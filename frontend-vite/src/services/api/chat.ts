import { API_CONFIG, apiFetch } from "./config";
import type {
  ChatMessage,
  ApiResponse,
  SendMessageRequest,
  StreamingMessageCallback,
} from "./types";

/**
 * Get or create user ID from localStorage
 */
function getUserId(): string {
  const STORAGE_KEY = "rag_user_id";
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userId);
  }
  
  return userId;
}

export const chatApi = {
  // Get chat history for a project
  async getMessages(projectId: string): Promise<ApiResponse<ChatMessage[]>> {
    try {
      // Note: Backend may not support this yet, managed client-side
      return { data: [], success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: error.message || "Failed to fetch messages",
      };
    }
  },

  // Send message (non-streaming)
  async sendMessage(data: SendMessageRequest & { conversationId?: string }): Promise<ApiResponse<ChatMessage>> {
    try {
      // Use apiFetch which automatically includes Authorization header
      const response = await apiFetch<{
        answer: string;
        sources: Array<{ content: string; score: number; metadata?: any }>;
        framework: string;
        tokens_used: number;
        latency_ms: number;
        cached: boolean;
      }>("/chat/complete", {
        method: "POST",
        body: JSON.stringify({
          query: data.content,
          project_id: data.projectId || null, // Send null for Knowledge Base or General Chat
          doc_id: data.docId || null, // Add doc_id if provided, null to search all documents
          conversation_id: data.conversationId, // Add conversation_id support
          stream: false,
          use_perplexity: false, // Perplexity disabled - always false
        }),
      });

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        projectId: data.projectId,
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: response.sources?.map((s, idx) => ({
          id: s.metadata?.doc_id || `source-${idx}`,
          name: s.metadata?.source || "Document",
          snippet: s.content,
          page: s.metadata?.page,
        })),
      };

      return { data: chatMessage, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as ChatMessage,
        success: false,
        message: error.message || "Failed to send message",
      };
    }
  },

  // Send message with streaming
  async sendMessageStreaming(
    data: SendMessageRequest & { conversationId?: string; docId?: string },
    callbacks: StreamingMessageCallback
  ): Promise<void> {
    try {
      const userId = getUserId();
      // Get auth token for authentication
      const { getAuthToken } = await import("./config");
      const token = getAuthToken();
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "X-User-ID": userId, // Add X-User-ID header
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Perplexity is disabled - always set use_perplexity to false
      // useKnowledgeBase toggle now only controls whether to search indexed documents
      const usePerplexityEnhancement = false; // Perplexity disabled
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: data.content,
          project_id: data.projectId || null, // Send null for Knowledge Base or General Chat
          doc_id: data.docId || null, // Add doc_id if provided, null to search all documents
          conversation_id: data.conversationId, // Add conversation_id support
          stream: true,
          use_perplexity: false, // Perplexity disabled - always false
          use_knowledge_base: data.useKnowledgeBase ?? null, // Send knowledge base toggle state
        }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Stream failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || "Stream failed"}`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let finalSources: Array<{ id: string; name: string; snippet: string }> = [];
      let finalWebContext: string | undefined = undefined;
      let hasReceivedData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // If we haven't received any data and stream ended, there might be an issue
          if (!hasReceivedData && accumulatedContent === "") {
            throw new Error("No data received from server. The stream ended without sending any tokens.");
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("data: ")) {
            hasReceivedData = true;
            try {
              const lineData = JSON.parse(line.slice(6));
              
              if (lineData.type === "token" && lineData.content) {
                accumulatedContent += lineData.content;
                callbacks.onToken(lineData.content);
              } 
              else if (lineData.type === "done") {
                 // Capture metadata from done event
                 // Note: Sources might be in metrics or separate field
                 if (lineData.sources) {
                    finalSources = lineData.sources.map((s: any, idx: number) => ({
                        id: s.id || `source-${idx}`,
                        name: s.document?.name || s.name || "Document",
                        snippet: s.content || s.snippet || "",
                    }));
                 }
                 // Also check metrics for sources
                 if (lineData.metrics?.sources) {
                    finalSources = lineData.metrics.sources.map((s: any, idx: number) => ({
                        id: s.id || s.metadata?.doc_id || `source-${idx}`,
                        name: s.document?.name || s.name || s.metadata?.source || "Document",
                        snippet: s.content || s.snippet || "",
                    }));
                 }
                 if (lineData.web_context) {
                    finalWebContext = lineData.web_context;
                 }
                 
                 // Call onComplete with conversation_id for memory
                 callbacks.onComplete({
                   id: `msg-${Date.now()}`,
                   projectId: data.projectId,
                   role: "assistant",
                   content: accumulatedContent,
                   timestamp: new Date().toISOString(),
                   sources: finalSources,
                   conversationId: lineData.conversation_id || data.conversationId, // Return conversation_id for memory
                 } as ChatMessage & { conversationId?: string });
                 
                 // Log completion for debugging
                 console.debug("Stream completed:", { 
                   contentLength: accumulatedContent.length,
                   sourcesCount: finalSources.length,
                   hasWebContext: !!finalWebContext,
                   conversationId: lineData.conversation_id
                 });
              }
              else if (lineData.type === "error") {
                throw new Error(lineData.error || "Stream error");
              }
              else if (lineData.type === "metadata") {
                // Metadata event - just log it, don't process
                console.debug("Received metadata:", lineData);
              }
            } catch (parseError) {
              console.warn("Error parsing stream line:", parseError, "Line:", line);
              continue;
            }
          } else if (line && !line.startsWith("data: ")) {
            // Non-empty line that's not SSE format - might be an error message
            console.warn("Unexpected stream line format:", line);
          }
        }
        buffer = lines[lines.length - 1];
      }
      
      // If we received metadata but no tokens, the response might be empty
      if (hasReceivedData && accumulatedContent === "") {
        console.warn("Received stream data but no tokens. Response might be empty.");
      }

      // Ensure we have content - if not, check if we got an error
      if (accumulatedContent === "" && !hasReceivedData) {
        throw new Error("No response received from server. Please check your connection and try again.");
      }

      // If we have metadata but no content, the response might be empty
      // Only show document-related message if knowledge base is enabled
      if (accumulatedContent === "" && hasReceivedData) {
        if (data.useKnowledgeBase) {
          // Knowledge base is enabled but no documents found
          accumulatedContent = "I cannot find the answer in the provided documents. Please upload documents or enable Knowledge Base for web search.";
        } else {
          // General chat mode - show a generic message
          accumulatedContent = "I'm sorry, I couldn't generate a response. Please try again.";
        }
      }

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        projectId: data.projectId,
        role: "assistant",
        content: accumulatedContent,
        timestamp: new Date().toISOString(),
        sources: finalSources,
        // We might want to add web_context to the type if needed, or append it to content
      };

      // Always call onComplete, even if content is empty (so UI can show the message)
      callbacks.onComplete(chatMessage);
    } catch (error: any) {
      callbacks.onError(new Error(error.message || "Stream failed"));
    }
  },

  // Clear chat history
  async clearHistory(projectId: string): Promise<ApiResponse<void>> {
    try {
      return { data: undefined, success: true };
    } catch (error: any) {
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to clear history",
      };
    }
  },
};
