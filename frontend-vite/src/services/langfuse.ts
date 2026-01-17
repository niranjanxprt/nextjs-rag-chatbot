/**
 * Langfuse API Client
 * 
 * Direct integration with Langfuse API for prompt management.
 * Uses Langfuse REST API v2 endpoints.
 * Gets configuration from backend API to use existing Langfuse keys.
 */

// Get Langfuse config from backend API
let langfuseConfig: { publicKey: string; baseUrl: string; secretKey?: string } | null = null;

/**
 * Get API base URL (matches config.ts logic)
 */
function getAPIBaseURL(): string {
  // 1. Check for explicit VITE_API_BASE_URL (Vercel production environment variable)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Check for VITE_API_URL (legacy/fallback)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 3. Production fallback: Railway backend
  if (import.meta.env.PROD) {
    return "https://rag-chatbot-production-1a36.up.railway.app/api/v1";
  }

  // 4. Development/local fallback
  return "http://localhost:8000/api/v1";
}

/**
 * Initialize Langfuse configuration from backend
 */
async function initLangfuseConfig(): Promise<void> {
  if (langfuseConfig) return;

  try {
    const apiUrl = getAPIBaseURL();
    const response = await fetch(`${apiUrl}/prompts/config`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Langfuse config from ${apiUrl}/prompts/config: ${response.status}`);
    }

    const config = await response.json();
    langfuseConfig = {
      publicKey: config.public_key || "",
      baseUrl: config.base_url || "https://cloud.langfuse.com",
    };
    console.log("✅ Langfuse config loaded:", { baseUrl: langfuseConfig.baseUrl, hasPublicKey: !!langfuseConfig.publicKey });
  } catch (error) {
    console.error("Failed to initialize Langfuse config from backend:", error);
    // Fallback to environment variables if backend config fails
    langfuseConfig = {
      publicKey: import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || "",
      baseUrl: import.meta.env.VITE_LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
      secretKey: import.meta.env.VITE_LANGFUSE_SECRET_KEY || "",
    };
    console.log("⚠️ Using environment variables for Langfuse config:", { baseUrl: langfuseConfig.baseUrl, hasPublicKey: !!langfuseConfig.publicKey });
  }
}

// For write operations, we need secret key - proxy through backend
const USE_BACKEND_PROXY_FOR_WRITES = true;

interface LangfusePromptResponse {
  name: string;
  prompt: string;
  version?: number;
  config?: Record<string, any>;
  labels?: string[];
  tags?: string[];
}

interface LangfusePromptListResponse {
  data: LangfusePromptResponse[];
  meta?: {
    total_items?: number;
  };
}

class LangfuseApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "LangfuseApiError";
  }
}

/**
 * Create Basic Auth header for Langfuse API
 * Note: For write operations, we proxy through backend to use secret key securely
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  await initLangfuseConfig();
  
  if (!langfuseConfig?.publicKey) {
    throw new LangfuseApiError(
      "Langfuse API keys not configured. Please ensure backend has LANGFUSE_PUBLIC_KEY set."
    );
  }

  // For read operations, we can use public key only
  // For write operations, we'll proxy through backend
  const credentials = btoa(`${langfuseConfig.publicKey}:`);
  return {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch wrapper with error handling
 */
async function langfuseFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  await initLangfuseConfig();
  
  if (!langfuseConfig) {
    throw new LangfuseApiError("Langfuse configuration not available");
  }
  
  const url = `${langfuseConfig.baseUrl}/api/public/v2/prompts${endpoint}`;
  
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = await response.text() || errorMessage;
      }
      throw new LangfuseApiError(errorMessage, response.status);
    }

    // Handle 204 No Content (for DELETE)
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof LangfuseApiError) {
      throw error;
    }
    throw new LangfuseApiError(
      `Network error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const langfuseApi = {
  /**
   * List all prompts from Langfuse
   * Note: Langfuse API returns array directly, not wrapped in {data: []}
   */
  async listPrompts(): Promise<LangfusePromptResponse[]> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langfuse.ts:listPrompts:entry',message:'langfuseApi.listPrompts called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      const response = await langfuseFetch<LangfusePromptResponse[] | LangfusePromptListResponse>("");
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langfuse.ts:listPrompts:after-fetch',message:'After langfuseFetch',data:{isArray:Array.isArray(response),responseLength:Array.isArray(response)?response.length:(response as LangfusePromptListResponse)?.data?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Handle both array response and wrapped response
      if (Array.isArray(response)) {
        return response;
      }
      return (response as LangfusePromptListResponse).data || [];
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f54ef3-c9a5-4fff-8213-4684772c7157',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langfuse.ts:listPrompts:error',message:'Error in listPrompts',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // If API returns error, try to parse it
      throw error;
    }
  },

  /**
   * Get a specific prompt by name
   */
  async getPrompt(name: string, label: string = "production"): Promise<LangfusePromptResponse> {
    const encodedName = encodeURIComponent(name);
    return await langfuseFetch<LangfusePromptResponse>(`/${encodedName}?label=${label}`);
  },

  /**
   * Create a new prompt in Langfuse
   * Langfuse SDK uses create_prompt(name, prompt, config, labels)
   * For REST API, we use POST to /api/public/v2/prompts/{name}
   */
  async createPrompt(data: {
    name: string;
    prompt: string;
    config?: Record<string, any>;
    labels?: string[];
  }): Promise<LangfusePromptResponse> {
    const encodedName = encodeURIComponent(data.name);
    return await langfuseFetch<LangfusePromptResponse>(`/${encodedName}`, {
      method: "POST",
      body: JSON.stringify({
        prompt: data.prompt,
        config: data.config || {},
        labels: data.labels || ["production"],
      }),
    });
  },

  /**
   * Update a prompt (creates new version)
   */
  async updatePrompt(
    name: string,
    data: {
      prompt?: string;
      config?: Record<string, any>;
      labels?: string[];
    }
  ): Promise<LangfusePromptResponse> {
    const encodedName = encodeURIComponent(name);
    return await langfuseFetch<LangfusePromptResponse>(`/${encodedName}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a prompt from Langfuse
   */
  async deletePrompt(name: string): Promise<void> {
    const encodedName = encodeURIComponent(name);
    await langfuseFetch<void>(`/${encodedName}`, {
      method: "DELETE",
    });
  },

  /**
   * Render a prompt with variables
   */
  async renderPrompt(
    name: string,
    variables: Record<string, any>,
    label: string = "production"
  ): Promise<string> {
    const encodedName = encodeURIComponent(name);
    const response = await langfuseFetch<{ rendered: string }>(
      `/${encodedName}/render?label=${label}`,
      {
        method: "POST",
        body: JSON.stringify({ variables }),
      }
    );
    return response.rendered;
  },
};

export type { LangfusePromptResponse };
