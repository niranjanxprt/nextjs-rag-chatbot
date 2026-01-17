import { apiFetch, API_CONFIG, getAuthToken } from "./config";
import type { KnowledgeBaseDocument } from "./types";

export const knowledgeBaseApi = {
  // List all Knowledge Base documents
  // Knowledge Base documents are those without a project_id (project_id IS NULL)
  list: async (): Promise<KnowledgeBaseDocument[]> => {
    try {
      // For Knowledge Base, we want documents where project_id IS NULL
      // The backend interprets missing project_id parameter as "show Knowledge Base documents"
      // But to be explicit, we can pass project_id as empty string or omit it
      // According to backend: when project_id is None (not provided), it shows KB docs
    const response = await apiFetch<{ documents: any[] }>("/documents?limit=1000");
      
    // Map backend response to frontend format
      // Filter to ensure we only show documents without project_id (Knowledge Base docs)
      const docs = (response.documents || []).filter((doc: any) => !doc.project_id);
      
      return docs.map((doc: any) => ({
      id: doc.document_id || doc.id,
      filename: doc.filename,
      uploadedAt: doc.uploaded_at || doc.uploadedAt,
      status: doc.status,
      size: doc.size,
      errorMessage: doc.error_message || doc.errorMessage,
    }));
    } catch (error: any) {
      console.error("Error fetching Knowledge Base documents:", error);
      // Return empty array on error instead of throwing
      return [];
    }
  },

  // Upload a new document to the Knowledge Base
  upload: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeBaseDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    // Do NOT append project_id - Knowledge Base documents should have project_id = null
    // The backend will set project_id to null if not provided

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_CONFIG.BASE_URL}/documents/upload`);

      // Add authentication token
      const token = getAuthToken();
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Backend returns DocumentUploadResponse { id, filename, status, message }
            // We need to match KnowledgeBaseDocument interface { id, filename, uploadedAt, status, size }
            // The response might be minimal. We might need to fetch the doc details or construct it.
            // Let's construct a provisional one or if the backend returns details use them.
            // Reviewing documents.py: returns DocumentUploadResponse -> likely just ID and status.
            // Ideally we should return a full object.
            // Let's rely on what we have + file props.
            resolve({
              id: response.id || response.document_id,
              filename: file.name,
              uploadedAt: new Date().toISOString(),
              status: response.status || "processing",
              size: file.size,
            });
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || "Upload failed"));
          } catch (e) {
            reject(new Error(xhr.statusText));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  },

  // Delete a document from the Knowledge Base
  delete: async (id: string): Promise<void> => {
    console.log("Deleting document with ID:", id);
    try {
      await apiFetch(`/documents/${id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      console.error("Delete API error:", error);
      throw error;
    }
  },

  // Bulk delete multiple documents
  bulkDelete: async (ids: string[]): Promise<{ success: any[]; failed: any[]; success_count: number; failed_count: number }> => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'knowledgeBase.ts:94',message:'Bulk delete API call started',data:{ids_count:ids.length,ids:ids.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4,H5'})}).catch(()=>{});
    // #endregion
    
    try {
      const requestBody = { doc_ids: ids };
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'knowledgeBase.ts:98',message:'Request body prepared',data:{body:requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      
      const response = await apiFetch<{ success: any[]; failed: any[]; success_count: number; failed_count: number }>(
        "/documents/_bulk_delete",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'knowledgeBase.ts:108',message:'Bulk delete API success',data:{success_count:response?.success_count,failed_count:response?.failed_count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      
      return response;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'knowledgeBase.ts:113',message:'Bulk delete API error',data:{error_type:error?.constructor?.name,error_message:error?.message,error_status:error?.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4,H5'})}).catch(()=>{});
      // #endregion
      
      console.error("Bulk delete API error:", error);
      throw error;
    }
  },
};
