// API Configuration
// Using real backend API
const getAPIBaseURL = (): string => {
  // 1. Check for explicit VITE_API_BASE_URL (Vercel production environment variable)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Check for VITE_API_URL (legacy/fallback)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 3. Production fallback: Use Vercel proxy to Railway backend
  if (import.meta.env.PROD) {
    return "/api/v1";  // Use Vercel rewrite rule to proxy to Railway
  }

  // 4. Development/local fallback
  return "http://localhost:8000/api/v1";
};

export const API_CONFIG = {
  BASE_URL: getAPIBaseURL(),
  TIMEOUT: 30000,
  USE_MOCK: false, // ✅ SWITCHED TO FALSE - Using real API
};

// Simulated network delay for mock responses
export const MOCK_DELAY = 500;

// Helper to simulate API delay
export const delay = (ms: number = MOCK_DELAY): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * JWT Token Management
 */
const TOKEN_STORAGE_KEY = "rag_auth_token";
const TOKEN_EXPIRY_KEY = "rag_auth_token_expiry";

/**
 * Get stored JWT token
 */
export function getAuthToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return null;
  }
  
  // Check if token is expired
  if (Date.now() > parseInt(expiry, 10)) {
    clearAuthToken();
    return null;
  }
  
  return token;
}

/**
 * Store JWT token
 */
export function setAuthToken(token: string, expiresIn: number): void {
  const expiry = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
}

/**
 * Clear stored JWT token
 */
export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Login and store token
 */
export async function login(username: string, password: string): Promise<{ token: string; expiresIn: number }> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || errorData.message || "Login failed",
      response.status,
      errorData.code
    );
  }

  const data = await response.json();
  setAuthToken(data.access_token, data.expires_in);
  
  return {
    token: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Logout and clear token
 */
export function logout(): void {
  clearAuthToken();
}

/**
 * Get or create user ID from localStorage (same as chat API)
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

// Generic fetch wrapper with JWT authentication
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  // Get JWT token if authentication is required
  const token = requireAuth ? getAuthToken() : null;
  
  // Get user ID for conversation tracking
  const userId = getUserId();
  
  // Build headers
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Add Authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }
  
  // Add X-User-ID header for conversation tracking
  if (userId) {
    defaultHeaders["X-User-ID"] = userId;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401 && requireAuth) {
    clearAuthToken();
    // Redirect to login or throw error
    throw new ApiError(
      "Authentication required. Please log in again.",
      response.status,
      "AUTHENTICATION_ERROR"
    );
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      const text = await response.text();
      if (text) {
        errorData = JSON.parse(text);
      }
    } catch (e) {
      // If JSON parsing fails, use status text
      errorData = { message: response.statusText || "An error occurred" };
    }
    
    throw new ApiError(
      errorData.detail || errorData.message || errorData.error || "An error occurred",
      response.status,
      errorData.code || errorData.error_code
    );
  }

  // Handle 204 No Content (DELETE operations)
  if (response.status === 204) {
    return undefined as T;
  }

  // Handle empty response body
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return undefined as T;
  }

  return response.json();
}
