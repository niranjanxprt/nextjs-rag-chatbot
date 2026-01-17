/**
 * Authentication API
 * 
 * Handles login and authentication token management, including passwordless authentication.
 */
import { apiFetch, login, logout, isAuthenticated, getAuthToken } from "./config";
import { supabaseAuth } from "../supabase";
import type { ApiResponse } from "./types";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  user_id: string;
  authenticated: boolean;
}

export interface TokenExchangeRequest {
  supabase_token: string;
}

export interface PasswordlessRequest {
  email: string;
  method: "magic_link" | "otp";
  redirect_url?: string;
}

export interface PasswordlessResponse {
  message: string;
  method: string;
  email: string;
}

export const authApi = {
  /**
   * Login and get JWT token
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const result = await login(credentials.username, credentials.password);
      return {
        data: {
          access_token: result.token,
          token_type: "bearer",
          expires_in: result.expiresIn,
        },
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as unknown as LoginResponse,
        success: false,
        message: error.message || "Login failed",
      };
    }
  },

  /**
   * Logout and clear token
   */
  logout(): void {
    logout();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return isAuthenticated();
  },

  /**
   * Get current user info (requires authentication)
   */
  async getCurrentUserInfo(): Promise<ApiResponse<UserInfo>> {
    try {
      const userInfo = await apiFetch<UserInfo>("/auth/me");
      return {
        data: userInfo,
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as unknown as UserInfo,
        success: false,
        message: error.message || "Failed to get user info",
      };
    }
  },

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return getAuthToken();
  },

  // Passwordless Authentication Methods

  /**
   * Exchange Supabase JWT token for internal JWT token
   */
  async exchangeSupabaseToken(supabaseToken: string): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiFetch<LoginResponse>("/auth/exchange", {
        method: "POST",
        body: JSON.stringify({ supabase_token: supabaseToken }),
        requireAuth: false // Don't require auth for token exchange
      });

      // Store the token using existing login mechanism
      if (response && response.access_token) {
        // Import setAuthToken at function scope to avoid issues
        const { setAuthToken } = await import("./config");
        setAuthToken(response.access_token, response.expires_in || 86400);

        console.log("✅ Token stored successfully in localStorage");
        console.log(`Token key: rag_auth_token, Expiry: ${response.expires_in || 86400} seconds`);
      } else {
        console.warn("⚠️ No access_token in response:", response);
      }

      return {
        data: response,
        success: true,
      };
    } catch (error: any) {
      console.error("❌ Token exchange error:", error);
      return {
        data: null as unknown as LoginResponse,
        success: false,
        message: error.message || "Token exchange failed",
      };
    }
  },

  /**
   * Initiate passwordless authentication (magic link or OTP)
   */
  async initiatePasswordlessAuth(request: PasswordlessRequest): Promise<ApiResponse<PasswordlessResponse>> {
    try {
      const response = await apiFetch<PasswordlessResponse>("/auth/passwordless", {
        method: "POST",
        body: JSON.stringify(request),
      });

      return {
        data: response,
        success: true,
      };
    } catch (error: any) {
      return {
        data: null as unknown as PasswordlessResponse,
        success: false,
        message: error.message || "Passwordless authentication failed",
      };
    }
  },

  /**
   * Send magic link to email
   */
  async sendMagicLink(email: string, redirectUrl?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // Call backend API which uses Convex auth
      const response = await this.initiatePasswordlessAuth({
        email,
        method: "magic_link",
        redirect_url: redirectUrl,
      });
      
      if (response.success) {
        return {
          data: { message: response.data.message },
          success: true,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      return {
        data: null as unknown as { message: string },
        success: false,
        message: error.message || "Failed to send magic link",
      };
    }
  },

  /**
   * Send OTP code to email
   */
  async sendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // Call backend API which uses Convex auth
      const response = await this.initiatePasswordlessAuth({
        email,
        method: "otp",
      });
      
      if (response.success) {
        return {
          data: { message: response.data.message },
          success: true,
        };
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      return {
        data: null as unknown as { message: string },
        success: false,
        message: error.message || "Failed to send OTP",
      };
    }
  },

  /**
   * Verify OTP code and complete authentication
   */
  async verifyOTP(email: string, otpCode: string): Promise<ApiResponse<LoginResponse>> {
    try {
      // Verify OTP with Supabase
      const { data: supabaseData, error: supabaseError } = await supabaseAuth.verifyOTP(email, otpCode);
      
      if (supabaseError || !supabaseData?.session?.access_token) {
        throw new Error(supabaseError?.message || "OTP verification failed");
      }

      // Exchange Supabase token for internal token
      const exchangeResult = await this.exchangeSupabaseToken(supabaseData.session.access_token);
      
      if (!exchangeResult.success) {
        throw new Error(exchangeResult.message || "Token exchange failed");
      }

      return exchangeResult;
    } catch (error: any) {
      return {
        data: null as unknown as LoginResponse,
        success: false,
        message: error.message || "OTP verification failed",
      };
    }
  },

  /**
   * Handle magic link callback (when user clicks magic link)
   */
  async handleMagicLinkCallback(): Promise<ApiResponse<LoginResponse>> {
    try {
      // Get session from Supabase (should be set after magic link click)
      const { data: sessionData, error: sessionError } = await supabaseAuth.getSession();
      
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error(sessionError?.message || "No valid session found");
      }

      // Exchange Supabase token for internal token
      const exchangeResult = await this.exchangeSupabaseToken(sessionData.session.access_token);
      
      if (!exchangeResult.success) {
        throw new Error(exchangeResult.message || "Token exchange failed");
      }

      return exchangeResult;
    } catch (error: any) {
      return {
        data: null as unknown as LoginResponse,
        success: false,
        message: error.message || "Magic link authentication failed",
      };
    }
  },

  /**
   * Check if passwordless authentication is available
   */
  isPasswordlessAvailable(): boolean {
    // Always return true since backend handles Convex auth
    return true;
  },

  /**
   * Sign out from both internal and Supabase sessions
   */
  async signOutComplete(): Promise<void> {
    // Sign out from Supabase
    await supabaseAuth.signOut();
    
    // Sign out from internal session
    this.logout();
  },
};
