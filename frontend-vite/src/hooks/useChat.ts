import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { chatApi } from "@/services/api";
import type { ChatMessage } from "@/services/api";

export const chatKeys = {
  all: ["chat"] as const,
  lists: () => [...chatKeys.all, "list"] as const,
  list: (projectId: string) => [...chatKeys.lists(), projectId] as const,
};

export function useChatMessages(projectId: string) {
  return useQuery({
    queryKey: chatKeys.list(projectId),
    queryFn: async () => {
      const response = await chatApi.getMessages(projectId);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      const response = await chatApi.sendMessage({ projectId, content });
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list(variables.projectId) });
    },
  });
}

export function useClearChatHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await chatApi.clearHistory(projectId);
      if (!response.success) throw new Error(response.message);
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list(projectId) });
    },
  });
}

// Hook for streaming chat
export function useStreamingChat(projectId: string) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const sendMessage = useCallback(
    async (content: string) => {
      setIsStreaming(true);
      setStreamingContent("");

      // Optimistically add user message
      queryClient.setQueryData<ChatMessage[]>(chatKeys.list(projectId), (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          projectId,
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        },
      ]);

      try {
        await chatApi.sendMessageStreaming(
          { projectId, content },
          {
            onToken: (token) => {
              setStreamingContent((prev) => prev + token);
            },
            onComplete: (message) => {
              setStreamingContent("");
              setIsStreaming(false);
              queryClient.invalidateQueries({ queryKey: chatKeys.list(projectId) });
            },
            onError: (error) => {
              setIsStreaming(false);
              throw error;
            },
          }
        );
      } catch (error) {
        setIsStreaming(false);
        throw error;
      }
    },
    [projectId, queryClient]
  );

  return {
    sendMessage,
    isStreaming,
    streamingContent,
  };
}
