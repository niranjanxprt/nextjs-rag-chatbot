import { apiFetch, API_CONFIG } from "./config";
import type { SavedPrompt, ApiResponse, CreatePromptRequest, UpdatePromptRequest } from "./types";
import { langfuseApi, type LangfusePromptResponse } from "../langfuse";
import { SYSTEM_PROMPTS } from "@/constants/prompts";

// Use Langfuse API directly (Langfuse API v2 requires both public and secret keys)
// Frontend only has public key, so reads work but writes require backend secret key
const USE_LANGFUSE_DIRECT_FOR_READS = true; // Use Langfuse API directly for reads (public key only)
const USE_BACKEND_FOR_WRITES = true; // Use backend proxy for writes (requires secret key)

// Map Langfuse prompt to frontend SavedPrompt format
function mapPromptToSaved(prompt: LangfusePromptResponse): SavedPrompt {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:mapPromptToSaved:entry',message:'Mapping prompt',data:{promptName:prompt.name,promptTags:prompt.tags||[],hasTags:!!prompt.tags&&prompt.tags.length>0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // Use name as id (Langfuse uses name-based identification)
  // Derive category from labels or default to "general"
  // System prompts (with "production" label) default to "general" category
  const isSystemPrompt = prompt.labels?.includes("production") || SYSTEM_PROMPTS.includes(prompt.name);
  
  let category: SavedPrompt["category"] = "general";
  if (!isSystemPrompt) {
    // Only try to derive category from labels for non-system prompts
    const categoryLabel = prompt.labels?.find((l) => 
      ["analysis", "extraction", "summary", "comparison"].includes(l.toLowerCase())
    );
    if (categoryLabel) {
      category = categoryLabel.toLowerCase() as SavedPrompt["category"];
    }
  }
  
  // Format title: convert snake_case to Title Case, handle special cases
  let title = prompt.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  if (prompt.name === "haystack-rag-generation") {
    title = "Haystack RAG Generation";
  } else if (prompt.name === "haystack-rag-streaming") {
    title = "Haystack RAG Streaming";
  } else if (prompt.name === "general-chat") {
    title = "General Chat";
  }
  
  const mapped = {
    id: prompt.name, // Use name as ID
    userId: isSystemPrompt ? "system" : "user", // Mark system prompts
    title,
    text: prompt.prompt,
    category,
    tags: prompt.tags || [], // Include tags from Langfuse
    createdAt: new Date().toISOString(), // Not available from API, use current time
    updatedAt: new Date().toISOString(), // Not available from API, use current time
  };
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:mapPromptToSaved:exit',message:'Mapped prompt result',data:{mappedId:mapped.id,mappedTags:mapped.tags,mappedTagsLength:mapped.tags.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return mapped;
}

// Mock data
const mockPrompts: SavedPrompt[] = [
  {
    id: "prompt-1",
    userId: "user-1",
    title: "Key Terms Extraction",
    text: "Extract all key terms, definitions, and important clauses from this document. Present them in a structured format with the term name, its definition, and the page/section where it appears.",
    category: "extraction",
    createdAt: "2024-11-20T10:00:00Z",
    updatedAt: "2024-12-01T14:30:00Z",
  },
  {
    id: "prompt-2",
    userId: "user-1",
    title: "Document Summary",
    text: "Provide a comprehensive summary of this document including:\n1. Main purpose and objectives\n2. Key stakeholders mentioned\n3. Important dates and deadlines\n4. Critical action items or requirements",
    category: "summary",
    createdAt: "2024-11-22T09:00:00Z",
    updatedAt: "2024-11-22T09:00:00Z",
  },
  {
    id: "prompt-3",
    userId: "user-1",
    title: "Risk Analysis",
    text: "Analyze this document for potential risks and liabilities. Identify any clauses that could pose legal, financial, or operational risks. Rate each risk as high, medium, or low and explain the reasoning.",
    category: "analysis",
    createdAt: "2024-11-25T11:00:00Z",
    updatedAt: "2024-12-05T16:20:00Z",
  },
  {
    id: "prompt-4",
    userId: "user-1",
    title: "Contract Comparison",
    text: "Compare the terms in this document with standard industry practices. Highlight any unusual or non-standard clauses that may require additional review or negotiation.",
    category: "comparison",
    createdAt: "2024-12-01T08:00:00Z",
    updatedAt: "2024-12-01T08:00:00Z",
  },
  {
    id: "prompt-5",
    userId: "user-1",
    title: "Compliance Check",
    text: "Review this document for compliance with relevant regulations and standards. List any potential compliance issues or gaps that need to be addressed.",
    category: "analysis",
    createdAt: "2024-12-03T14:00:00Z",
    updatedAt: "2024-12-03T14:00:00Z",
  },
];

let prompts = [...mockPrompts];

export const promptsApi = {
  // Get all prompts - directly from Langfuse using backend's keys
  async getPrompts(hideSystem: boolean = false): Promise<ApiResponse<SavedPrompt[]>> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:getPrompts:entry',message:'getPrompts called',data:{hideSystem,useDirect:USE_LANGFUSE_DIRECT_FOR_READS,useBackend:!USE_LANGFUSE_DIRECT_FOR_READS},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (USE_LANGFUSE_DIRECT_FOR_READS) {
      try {
        const prompts = await langfuseApi.listPrompts();
        // Include all prompts (system prompts are protected but should be visible)
        // System prompts will be marked as non-editable/non-deletable in the UI
        const mappedPrompts = prompts.map(mapPromptToSaved);
        return { data: mappedPrompts, success: true };
      } catch (error: any) {
        return {
          data: [],
          success: false,
          message: error.message || "Failed to fetch prompts from Langfuse",
        };
      }
    }
    
    // Use backend API (prompts endpoint doesn't require auth, but apiFetch defaults to requireAuth=true)
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:getPrompts:before-apiFetch',message:'Before apiFetch call',data:{endpoint:'/prompts',hideSystem,requireAuth:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Build query params: always include include_content=true to get full prompt text
      const queryParams = new URLSearchParams();
      if (hideSystem) {
        queryParams.append("hide_system", "true");
      }
      queryParams.append("include_content", "true"); // Always fetch full prompt content
      const prompts = await apiFetch<LangfusePromptResponse[]>(`/prompts?${queryParams.toString()}`, {}, false); // Set requireAuth=false since prompts endpoint is public
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:getPrompts:after-apiFetch',message:'apiFetch response received',data:{promptsLength:prompts?.length||0,isArray:Array.isArray(prompts),firstPromptName:prompts?.[0]?.name||'none',firstPromptTags:prompts?.[0]?.tags||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Include all prompts (system prompts are protected but should be visible)
      // System prompts will be marked as non-editable/non-deletable in the UI
      const mappedPrompts = prompts.map(mapPromptToSaved);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:getPrompts:after-mapping',message:'After mapping prompts',data:{mappedLength:mappedPrompts.length,firstMappedId:mappedPrompts[0]?.id||'none',firstMappedTags:mappedPrompts[0]?.tags||[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return { data: mappedPrompts, success: true };
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:getPrompts:error',message:'Error in getPrompts',data:{errorMessage:error.message,errorName:error.name,hasError:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error("Failed to fetch prompts:", error);
      return {
        data: [],
        success: false,
        message: error.message || "Failed to fetch prompts",
      };
    }
  },

  // Get single prompt (by name, which is used as ID)
  async getPrompt(id: string): Promise<ApiResponse<SavedPrompt>> {
    if (USE_LANGFUSE_DIRECT_FOR_READS) {
      try {
        const prompt = await langfuseApi.getPrompt(id);
        const mappedPrompt = mapPromptToSaved(prompt);
        return { data: mappedPrompt, success: true };
      } catch (error: any) {
        return {
          data: null as unknown as SavedPrompt,
          success: false,
          message: error.message || "Prompt not found",
        };
      }
    }
    
    try {
      const prompt = await apiFetch<LangfusePromptResponse>(`/prompts/${id}`, {}, false); // Set requireAuth=false since prompts endpoint is public
      const mappedPrompt = mapPromptToSaved(prompt);
      return { data: mappedPrompt, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as SavedPrompt,
        success: false,
        message: error.message || "Prompt not found",
      };
    }
  },

  // Create prompt - use direct Langfuse API
  async createPrompt(data: CreatePromptRequest): Promise<ApiResponse<SavedPrompt>> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:createPrompt:entry',message:'createPrompt called',data:{title:data.title,category:data.category,useDirect:!USE_BACKEND_FOR_WRITES},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      // Convert title to name (snake_case)
      const name = data.title.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      
      // Map category to labels
      const labels = [data.category, "production"];
      
      if (!USE_BACKEND_FOR_WRITES) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:createPrompt:before-langfuse',message:'Before langfuseApi.createPrompt',data:{name,labels},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Direct Langfuse API
        const created = await langfuseApi.createPrompt({
          name,
          prompt: data.text,
          config: {},
          labels,
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:createPrompt:after-langfuse',message:'After langfuseApi.createPrompt',data:{createdName:created.name,createdVersion:created.version},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const mappedPrompt = mapPromptToSaved(created);
        return { data: mappedPrompt, success: true };
      }
      
      // Use backend API which has secret key
      const created = await apiFetch<LangfusePromptResponse>("/prompts", {
        method: "POST",
        body: JSON.stringify({
          name,
          prompt: data.text,
          config: {},
          labels,
        }),
      });
      const mappedPrompt = mapPromptToSaved(created);
      return { data: mappedPrompt, success: true };
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:createPrompt:error',message:'Error in createPrompt',data:{errorMessage:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return {
        data: null as unknown as SavedPrompt,
        success: false,
        message: error.message || "Failed to create prompt",
      };
    }
  },

  // Update prompt (by name, which is used as ID) - use backend proxy
  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<ApiResponse<SavedPrompt>> {
    try {
      const updatePayload: any = {};
      
      if (data.text) {
        updatePayload.prompt = data.text;
      }
      
      if (data.category) {
        updatePayload.labels = [data.category, "production"];
      }
      
      if (!USE_BACKEND_FOR_WRITES) {
        // Direct Langfuse API (requires secret key in frontend - not recommended)
        const updated = await langfuseApi.updatePrompt(id, updatePayload);
        const mappedPrompt = mapPromptToSaved(updated);
        return { data: mappedPrompt, success: true };
      }
      
      // Use backend API which has secret key
      const updated = await apiFetch<LangfusePromptResponse>(`/prompts/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatePayload),
      });
      const mappedPrompt = mapPromptToSaved(updated);
      return { data: mappedPrompt, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as SavedPrompt,
        success: false,
        message: error.message || "Failed to update prompt",
      };
    }
  },

  // Delete prompt - use direct Langfuse API (protected system prompts cannot be deleted)
  async deletePrompt(id: string): Promise<ApiResponse<void>> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:deletePrompt:entry',message:'deletePrompt called',data:{id,isSystemPrompt:SYSTEM_PROMPTS.includes(id),useDirect:!USE_BACKEND_FOR_WRITES},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Protect system prompts from deletion
    if (SYSTEM_PROMPTS.includes(id)) {
      return {
        data: undefined,
        success: false,
        message: "System prompts cannot be deleted. These are required for the RAG pipeline.",
      };
    }
    
    try {
      if (!USE_BACKEND_FOR_WRITES) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:deletePrompt:before-langfuse',message:'Before langfuseApi.deletePrompt',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Direct Langfuse API
        await langfuseApi.deletePrompt(id);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:deletePrompt:after-langfuse',message:'After langfuseApi.deletePrompt',data:{id,success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return { data: undefined, success: true };
      }
      
      // Use backend API which has secret key and now supports deletion
      await apiFetch<void>(`/prompts/${id}`, {
        method: "DELETE",
      });
      return { data: undefined, success: true };
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prompts.ts:deletePrompt:error',message:'Error in deletePrompt',data:{errorMessage:error.message,errorName:error.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to delete prompt",
      };
    }
  },
};
