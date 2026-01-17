/**
 * Magic Link Handler Component
 *
 * Handles magic link callback processing and redirect logic.
 * Provides proper error handling for invalid/expired links.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ArrowRight, Home } from 'lucide-react';
import { authApi } from '@/services/api/auth';

export interface MagicLinkHandlerProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}

interface HandlerState {
  status: 'processing' | 'success' | 'error' | 'expired' | 'invalid' | 'verifying';
  message: string;
  isLoading: boolean;
  token?: string;
}

/**
 * Callback parameters from Supabase magic link or PKCE flow
 */
interface MagicLinkCallbackParams {
  type: 'email' | 'magiclink' | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  error: string | null;
}

export const MagicLinkHandler: React.FC<MagicLinkHandlerProps> = ({
  onSuccess,
  onError,
  redirectTo = '/',
  className = ''
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<HandlerState>({
    status: 'processing',
    message: 'Processing your magic link...',
    isLoading: true
  });

  const updateState = (updates: Partial<HandlerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    handleMagicLinkCallback();
    // Cleanup any PKCE state on unmount
    return () => {
      sessionStorage.removeItem('pkce_state');
    };
  }, []);

  /**
   * Clean up the hash from URL after parameters are extracted
   * Prevents sensitive token data from staying in browser history
   */
  const cleanupUrlHash = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  /**
   * Extract and parse magic link callback parameters
   * Supports two flows:
   * 1. Direct token delivery: access_token + refresh_token (type: 'email' or 'magiclink')
   * 2. PKCE flow: token_hash parameter for verification
   *
   * Note: Supabase sends parameters in URL hash (#), not query string (?)
   * Falls back to query string for other auth flows
   */
  const extractCallbackParams = (): MagicLinkCallbackParams => {
    // Debug: Log the raw URL components
    console.log("🔍 DEBUG: URL Components");
    console.log("  hash:", window.location.hash);
    console.log("  search:", window.location.search);
    console.log("  full URL:", window.location.href);

    // First, parse hash parameters (Supabase magic link default behavior)
    // Hash format: #access_token=xyz&refresh_token=abc&type=magiclink
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    // Check if hash actually has parameters by looking for specific keys
    const hashHasParams =
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('token_hash') ||
      hashParams.has('error');

    console.log("🔍 DEBUG: Hash Parameter Detection");
    console.log("  hashHasParams:", hashHasParams);
    console.log("  hash entries:", Array.from(hashParams.entries()));

    // Fall back to query string parameters if hash doesn't have auth parameters
    // Query format: ?access_token=xyz&refresh_token=abc&type=magiclink
    const params = hashHasParams ? hashParams : searchParams;

    console.log("🔍 DEBUG: Selected Parameter Source");
    console.log("  source:", hashHasParams ? "hash" : "query string");
    console.log("  all params:", Array.from(params.entries()));

    // Check for error parameters first (can be in hash or query)
    const error = params.get('error');
    if (error) {
      console.log("🔍 DEBUG: Error Parameter Found");
      console.log("  error:", error);
      return {
        type: null,
        accessToken: null,
        refreshToken: null,
        tokenHash: null,
        error
      };
    }

    // Extract all possible token parameters from whichever source has them
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const tokenHash = params.get('token_hash');
    const type = params.get('type'); // Can be 'email', 'magiclink', or other

    console.log("🔍 DEBUG: Extracted Parameters");
    console.log("  accessToken:", accessToken ? "present" : "missing");
    console.log("  refreshToken:", refreshToken ? "present" : "missing");
    console.log("  tokenHash:", tokenHash ? "present" : "missing");
    console.log("  type:", type);

    return {
      type: (type as 'email' | 'magiclink') || null,
      accessToken,
      refreshToken,
      tokenHash,
      error: null
    };
  };

  /**
   * Handle magic link callback with support for both direct and PKCE flows
   */
  const handleMagicLinkCallback = async () => {
    try {
      const params = extractCallbackParams();

      // Debug logging to track parameter extraction
      console.log("🔐 Magic link callback parameters:", {
        hasAccessToken: !!params.accessToken,
        hasRefreshToken: !!params.refreshToken,
        hasTokenHash: !!params.tokenHash,
        type: params.type,
        error: params.error
      });

      // Clean up the hash from URL to remove sensitive data
      if (params.accessToken || params.refreshToken || params.error) {
        cleanupUrlHash();
      }

      // Handle error responses
      if (params.error) {
        handleError(params.error, searchParams.get('error_description'));
        return;
      }

      // Flow 1: Direct token delivery (access_token + refresh_token)
      // Supabase sends type='email' for magic links
      if (params.accessToken && params.refreshToken) {
        // Validate that we have a valid auth callback type
        // Supabase sends 'email' type for magic links/OTP
        if (!params.type || (params.type !== 'email' && params.type !== 'magiclink')) {
          // Still proceed with token exchange if tokens are present
        }

        await processMagicLinkAuth(params.accessToken);
        return;
      }

      // Flow 2: PKCE flow with token_hash
      if (params.tokenHash) {
        updateState({
          status: 'verifying',
          message: 'Verifying your authentication...',
          isLoading: true
        });

        // In PKCE flow, verify the token_hash with Supabase
        await verifyPKCETokenHash(params.tokenHash);
        return;
      }

      // No valid tokens or token_hash found
      updateState({
        status: 'invalid',
        message: 'Invalid magic link. The link may be malformed or incomplete.',
        isLoading: false
      });
      onError?.('Invalid magic link parameters');

    } catch (error) {
      console.error('Magic link processing error:', error);
      updateState({
        status: 'error',
        message: 'An unexpected error occurred while processing your magic link.',
        isLoading: false
      });
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  /**
   * Verify PKCE token_hash parameter (Modern Supabase PKCE Flow)
   * This is used when Supabase sends a token_hash instead of direct tokens
   * PKCE flow: User gets token_hash → Frontend calls verifyOtp → Backend exchanges for session
   */
  const verifyPKCETokenHash = async (tokenHash: string) => {
    try {
      console.log("🔐 PKCE Flow: Verifying token_hash with Supabase...");

      // Import Supabase client
      const { supabaseAuth } = await import('@/services/supabase');

      // Call Supabase verifyOtp with the token_hash
      // This is the PKCE flow verification
      const { data: sessionData, error: verifyError } = await supabaseAuth.verifyOtp({
        token_hash: tokenHash,
        type: 'email', // Magic link uses 'email' type
      });

      console.log("📊 PKCE verification response:", {
        hasSession: !!sessionData?.session,
        hasError: !!verifyError,
        errorMessage: verifyError?.message
      });

      if (verifyError) {
        // Handle specific error types
        const errorMsg = verifyError.message.toLowerCase();
        if (errorMsg.includes('expired') || errorMsg.includes('no longer valid')) {
          updateState({
            status: 'expired',
            message: 'This magic link has expired. Please request a new one.',
            isLoading: false
          });
        } else {
          updateState({
            status: 'invalid',
            message: 'Invalid magic link. ' + verifyError.message,
            isLoading: false
          });
        }
        onError?.(verifyError.message || 'Token verification failed');
        return;
      }

      // Successful PKCE verification - get the Supabase token
      const supabaseToken = sessionData?.session?.access_token;
      if (!supabaseToken) {
        throw new Error('No access token returned from Supabase verification');
      }

      console.log("✅ PKCE verification successful! Exchanging token with backend...");

      // Now exchange the Supabase token for internal JWT (same as implicit flow)
      const exchangeResult = await authApi.exchangeSupabaseToken(supabaseToken);

      if (exchangeResult.success && exchangeResult.data?.access_token) {
        console.log("✅ Token exchange successful!");
        updateState({
          status: 'success',
          message: 'Successfully authenticated! Redirecting...',
          isLoading: false,
          token: exchangeResult.data.access_token
        });

        onSuccess?.(exchangeResult.data.access_token);

        // Redirect after a short delay to show success message
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 2000);
      } else {
        updateState({
          status: 'error',
          message: exchangeResult.message || 'Failed to complete authentication.',
          isLoading: false
        });
        onError?.(exchangeResult.message || 'Token exchange failed');
      }
    } catch (error) {
      console.error('PKCE verification error:', error);
      updateState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to verify your authentication. Please try again.',
        isLoading: false
      });
      onError?.(error instanceof Error ? error.message : 'PKCE verification failed');
    }
  };

  /**
   * Handle error responses from authentication flow
   * Provides specific messages for different error types
   */
  const handleError = (error: string, description?: string | null) => {
    let status: HandlerState['status'] = 'error';
    let message = 'Authentication failed.';

    switch (error) {
      case 'access_denied':
        message = 'Access was denied. You may have cancelled the authentication process.';
        break;
      case 'expired_token':
      case 'token_expired':
      case 'invalid_grant':  // PKCE token_hash may expire
        status = 'expired';
        message = 'This magic link has expired. Please request a new one.';
        break;
      case 'invalid_request':
      case 'invalid_code':   // Invalid token_hash
        status = 'invalid';
        message = 'Invalid magic link. The link may be malformed or already used.';
        break;
      case 'server_error':
        message = 'Server error occurred. Please try again later.';
        break;
      case 'configuration_error':
      case 'access_denied_code':
        status = 'invalid';
        message = 'Authentication configuration error. Please contact support.';
        break;
      default:
        message = description || `Authentication error: ${error}`;
    }

    updateState({ status, message, isLoading: false });
    onError?.(message);
  };

  const processMagicLinkAuth = async (supabaseToken: string) => {
    try {
      console.log("🔄 Exchanging Supabase token for internal JWT...");

      // Exchange Supabase token for internal token
      const result = await authApi.exchangeSupabaseToken(supabaseToken);

      console.log("📊 Exchange result:", result);

      if (result.success && result.data?.access_token) {
        console.log("✅ Token exchange successful!");
        console.log("📍 Checking localStorage...");

        // Verify token was stored
        const storedToken = localStorage.getItem('rag_auth_token');
        if (storedToken) {
          console.log("✅ Token confirmed in localStorage!");
        } else {
          console.warn("⚠️ Token not found in localStorage - attempting manual store");
          // Fallback: manually store if not already done
          const { setAuthToken } = await import('@/services/api/config');
          setAuthToken(result.data.access_token, result.data.expires_in || 86400);
        }

        updateState({
          status: 'success',
          message: 'Successfully authenticated! Redirecting...',
          isLoading: false,
          token: result.data.access_token
        });

        onSuccess?.(result.data.access_token);

        // Redirect after a short delay to show success message
        setTimeout(() => {
          console.log("🔄 Redirecting to:", redirectTo);
          navigate(redirectTo, { replace: true });
        }, 2000);

      } else {
        console.error("❌ Token exchange failed:", result.message);
        updateState({
          status: 'error',
          message: result.message || 'Failed to complete authentication.',
          isLoading: false
        });
        onError?.(result.message || 'Token exchange failed');
      }
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      updateState({
        status: 'error',
        message: 'Failed to complete authentication. Please try again.',
        isLoading: false
      });
      onError?.(error instanceof Error ? error.message : 'Token exchange failed');
    }
  };

  const handleRetry = () => {
    navigate('/auth/login', { replace: true });
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'processing':
      case 'verifying':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
      case 'expired':
      case 'invalid':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
      case 'expired':
      case 'invalid':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
      <Card className={`w-full max-w-md mx-auto ${getStatusColor()}`}>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {state.status === 'processing' && 'Processing Magic Link'}
            {state.status === 'verifying' && 'Verifying Your Authentication'}
            {state.status === 'success' && 'Authentication Successful'}
            {state.status === 'error' && 'Authentication Failed'}
            {state.status === 'expired' && 'Link Expired'}
            {state.status === 'invalid' && 'Invalid Link'}
          </CardTitle>
          <CardDescription className="text-base">
            {state.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loading State - Processing */}
          {state.status === 'processing' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Please wait while we authenticate you...</p>
            </div>
          )}

          {/* Loading State - Verifying */}
          {state.status === 'verifying' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Verifying your authentication credentials...</p>
            </div>
          )}

          {/* Success State */}
          {state.status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  You have been successfully signed in. Redirecting to your dashboard...
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleGoHome}
                className="w-full"
                variant="default"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue to Dashboard
              </Button>
            </div>
          )}

          {/* Error States */}
          {(state.status === 'error' || state.status === 'expired' || state.status === 'invalid') && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {state.message}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  onClick={handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </div>

              {/* Help Text for Different Error Types */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                {state.status === 'expired' && (
                  <p>Magic links expire after 15 minutes for security reasons.</p>
                )}
                {state.status === 'invalid' && (
                  <p>Each magic link can only be used once. Request a new one if needed.</p>
                )}
                {state.status === 'error' && (
                  <p>If the problem persists, please contact support.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkHandler;
