import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordlessLoginForm } from "@/components/auth/PasswordlessLoginForm";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordless, setShowPasswordless] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({ username, password });
      
      if (response.success) {
        // Update auth context state immediately
        const isAuth = checkAuth();
        
        if (isAuth) {
          toast({
            title: "Success",
            description: "Logged in successfully",
          });
          
          // Redirect to dashboard or previous page
          const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";
          navigate(returnTo, { replace: true });
        } else {
          throw new Error("Authentication state not updated");
        }
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordlessSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  };

  const handlePasswordlessError = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  };

  if (showPasswordless) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <PasswordlessLoginForm
          onSuccess={handlePasswordlessSuccess}
          onError={handlePasswordlessError}
          onBack={() => setShowPasswordless(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <LogIn className="h-6 w-6" />
            Sign In
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) {
                    setErrors({ ...errors, username: "" });
                  }
                }}
                placeholder="Enter your username"
                disabled={isLoading}
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowPasswordless(true)}
              disabled={isLoading}
            >
              <Mail className="mr-2 h-4 w-4" />
              Sign in with Email
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
