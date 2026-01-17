import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promptsApi } from "@/services/api";
import type { CreatePromptRequest, UpdatePromptRequest } from "@/services/api";
import { SYSTEM_PROMPTS } from "@/constants/prompts";

export const promptKeys = {
  all: ["prompts"] as const,
  lists: () => [...promptKeys.all, "list"] as const,
  list: (filters?: { category?: string }) => [...promptKeys.lists(), filters] as const,
  details: () => [...promptKeys.all, "detail"] as const,
  detail: (id: string) => [...promptKeys.details(), id] as const,
};

export function usePrompts(hideSystem: boolean = false) {
  return useQuery({
    queryKey: [...promptKeys.lists(), { hideSystem }],
    queryFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePrompts.ts:16',message:'Calling promptsApi.getPrompts',data:{hideSystem,usingAPI:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await promptsApi.getPrompts(hideSystem);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'usePrompts.ts:18',message:'promptsApi.getPrompts response',data:{hideSystem,success:response.success,dataLength:response.data?.length||0,hasMessage:!!response.message,systemPromptCount:response.data?.filter(p=>SYSTEM_PROMPTS.includes(p.id)).length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });
}

export function usePrompt(id: string) {
  return useQuery({
    queryKey: promptKeys.detail(id),
    queryFn: async () => {
      const response = await promptsApi.getPrompt(id);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePromptRequest) => {
      const response = await promptsApi.createPrompt(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePromptRequest }) => {
      const response = await promptsApi.updatePrompt(id, data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(data.id) });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await promptsApi.deletePrompt(id);
      if (!response.success) throw new Error(response.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
  });
}
