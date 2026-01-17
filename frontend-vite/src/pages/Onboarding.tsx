import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, Loader2, CheckCircle } from "lucide-react";
import { authApi } from "@/services/api";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = "Display name must be at least 2 characters";
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = "Display name must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the profile endpoint to complete onboarding
      const response = await authApi.apiFetch("/auth/profile", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName.trim(),
          completed: true,
        }),
      });

      if (response?.status === 200 || response?.ok) {
        setIsCompleting(true);
        toast({
          title: "Success",
          description: "Profile setup completed successfully!",
        });

        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip onboarding and go to dashboard
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Welcome!
          </CardTitle>
          <CardDescription>
            Let's set up your profile to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isCompleting ? (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">All set!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleComplete} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) {
                      setErrors({ ...errors, displayName: "" });
                    }
                  }}
                  placeholder="Enter your display name"
                  disabled={isLoading}
                  autoComplete="given-name"
                  maxLength={50}
                />
                {errors.displayName && (
                  <p className="text-sm text-red-600">{errors.displayName}</p>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  This is the name that will be displayed in the application.
                  You can change it later in your profile settings.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !displayName.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSkip}
                disabled={isLoading}
              >
                Skip for Now
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
