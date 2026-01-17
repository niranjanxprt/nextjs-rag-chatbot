import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeBaseApi } from "@/services/api/knowledgeBase";

// Query keys for Knowledge Base
export const knowledgeBaseKeys = {
  all: ["knowledgeBase"] as const,
  documents: () => [...knowledgeBaseKeys.all, "documents"] as const,
};

// Hook to fetch Knowledge Base documents
export function useKnowledgeBaseDocuments() {
  return useQuery({
    queryKey: knowledgeBaseKeys.documents(),
    queryFn: knowledgeBaseApi.list,
  });
}

// Hook to upload a document to the Knowledge Base
export function useUploadKnowledgeBaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
    }) => knowledgeBaseApi.upload(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents() });
    },
  });
}

// Hook to delete a document from the Knowledge Base
export function useDeleteKnowledgeBaseDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: knowledgeBaseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.documents() });
    },
  });
}
