import { useEffect } from "react";
import { MagicLinkHandler } from "@/components/auth/MagicLinkHandler";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * AuthCallback Page
 *
 * Handles magic link and OAuth callbacks from email links.
 * Processes the authentication and redirects to dashboard or onboarding.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const { toast } = useToast();

  const handleSuccess = (token: string) => {
    // Token is already stored by the auth API
    // Force refresh the auth context state
    const isAuth = checkAuth();

    if (isAuth) {
      toast({
        title: "Success",
        description: "You have been successfully authenticated",
      });

      // Redirect to dashboard (or onboarding if first time)
      // The ProtectedRoute will handle checking if onboarding is needed
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } else {
      console.error("Authentication check failed after token storage");
      toast({
        title: "Authentication Error",
        description: "Failed to complete authentication. Please try again.",
        variant: "destructive",
      });
      
      // Redirect to login with return URL
      navigate("/login?returnTo=%2F", { replace: true });
    }
  };

  const handleError = (error: string) => {
    console.error("Auth callback error:", error);
    toast({
      title: "Authentication Failed",
      description: error || "An error occurred during authentication",
      variant: "destructive",
    });
    // Error handling is done by MagicLinkHandler component
  };

  return (
    <MagicLinkHandler
      onSuccess={handleSuccess}
      onError={handleError}
      redirectTo="/"
    />
  );
}
