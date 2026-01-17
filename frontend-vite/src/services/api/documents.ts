import { apiFetch, API_CONFIG } from "./config";
import type { ProjectDocument, ApiResponse } from "./types";

export const documentsApi = {
  // Get documents for a project
  async getDocuments(projectId: string): Promise<ApiResponse<ProjectDocument[]>> {
    try {
      const response = await apiFetch<{ documents: ProjectDocument[] }>(
        `/documents?project_id=${projectId}`
      );
      return { data: response.documents, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: error.message || "Failed to fetch documents",
      };
    }
  },

  // Upload document
  async uploadDocument(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<ProjectDocument>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/documents/upload?project_id=${projectId}`,
        {
          method: "POST",
          body: formData,
          // Note: Do NOT set Content-Type header for FormData
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Simulate upload progress (since we don't have real progress events)
      for (let i = 0; i <= 100; i += 20) {
        onProgress?.(i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return {
        data: {
          id: data.document_id,
          projectId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: data.status,
          uploadedAt: data.uploaded_at,
          uploadedBy: "Current User",
        },
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as unknown as ProjectDocument,
        success: false,
        message: error.message || "Failed to upload document",
      };
    }
  },

  // Delete document
  async deleteDocument(
    projectId: string,
    documentId: string
  ): Promise<ApiResponse<void>> {
    try {
      await apiFetch<void>(`/documents/${documentId}`, {
        method: "DELETE",
      });
      return { data: undefined, success: true };
    } catch (error: any) {
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to delete document",
      };
    }
  },

  // Get document status
  async getDocumentStatus(
    projectId: string,
    documentId: string
  ): Promise<ApiResponse<ProjectDocument>> {
    try {
      // Fetch document from list and find it
      const response = await apiFetch<{ documents: ProjectDocument[] }>(
        `/documents?project_id=${projectId}`
      );
      const doc = response.documents.find((d) => d.id === documentId);
      if (!doc) {
        throw new Error("Document not found");
      }
      return { data: doc, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as ProjectDocument,
        success: false,
        message: "Document not found",
      };
    }
  },
};
