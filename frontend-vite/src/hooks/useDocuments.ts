import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/services/api";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (projectId: string) => [...documentKeys.lists(), projectId] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (projectId: string, docId: string) => [...documentKeys.details(), projectId, docId] as const,
};

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: documentKeys.list(projectId),
    queryFn: async () => {
      const response = await documentsApi.getDocuments(projectId);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      onProgress,
    }: {
      projectId: string;
      file: File;
      onProgress?: (progress: number) => void;
    }) => {
      const response = await documentsApi.uploadDocument(projectId, file, onProgress);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.list(data.projectId) });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, documentId }: { projectId: string; documentId: string }) => {
      const response = await documentsApi.deleteDocument(projectId, documentId);
      if (!response.success) throw new Error(response.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.list(variables.projectId) });
    },
  });
}

export function useDocumentStatus(projectId: string, documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(projectId, documentId),
    queryFn: async () => {
      const response = await documentsApi.getDocumentStatus(projectId, documentId);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!projectId && !!documentId,
    refetchInterval: (query) => {
      // Poll every 2 seconds while processing
      return query.state.data?.status === "processing" ? 2000 : false;
    },
  });
}
