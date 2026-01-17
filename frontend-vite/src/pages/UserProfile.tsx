import { useState, useEffect } from "react";
import { User, Bell, Save } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useCurrentUser,
  useUpdateUser,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useUser";
import type { User as UserType, NotificationPreferences } from "@/services/api";

export default function UserProfile() {
  const { toast } = useToast();
  const { data: user, isLoading: isLoadingUser, error: userError } = useCurrentUser();
  const { data: preferences, isLoading: isLoadingPrefs } = useNotificationPreferences();
  const updateUserMutation = useUpdateUser();
  const updatePreferencesMutation = useUpdateNotificationPreferences();

  const [profile, setProfile] = useState<Partial<UserType>>({});
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailDigest: true,
    projectUpdates: true,
    newFeatures: false,
    securityAlerts: true,
  });
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = isLoadingUser || isLoadingPrefs;

  // Update local state when data loads
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        location: user.location,
      });
    }
  }, [user]);

  useEffect(() => {
    if (preferences) {
      setNotifications(preferences);
    }
  }, [preferences]);

  // Show error toast if user fetch fails
  useEffect(() => {
    if (userError) {
      toast({
        title: "Error",
        description: "Failed to load profile. Please log in again.",
        variant: "destructive",
      });
    }
  }, [userError, toast]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!profile.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!profile.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(profile.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:8000/api/v1/user/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profile)
      // });
      // const data = await response.json();

      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:8000/api/v1/user/preferences', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notifications)
      // });
      // const data = await response.json();

      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof UserType, value: string) => {
    setProfile({ ...profile, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleNotificationChange = (field: keyof NotificationPreferences) => {
    setNotifications({ ...notifications, [field]: !notifications[field] });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">User Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={profile.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={profile.company || ""}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={profile.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={handleSaveProfile} disabled={updateUserMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotificationPrefs(!showNotificationPrefs)}
                >
                  {showNotificationPrefs ? "Hide" : "Show"} Notification Preferences
                </Button>
              </div>
            </CardHeader>
            {showNotificationPrefs && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="emailDigest" className="font-medium cursor-pointer">
                      Email Digest
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of your project activity
                    </p>
                  </div>
                  <Checkbox
                    id="emailDigest"
                    name="emailDigest"
                    checked={notifications.emailDigest}
                    onCheckedChange={() => handleNotificationChange("emailDigest")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="projectUpdates" className="font-medium cursor-pointer">
                      Project Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when documents are processed or team members join
                    </p>
                  </div>
                  <Checkbox
                    id="projectUpdates"
                    name="projectUpdates"
                    checked={notifications.projectUpdates}
                    onCheckedChange={() => handleNotificationChange("projectUpdates")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="newFeatures" className="font-medium cursor-pointer">
                      New Features
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Learn about new features and improvements
                    </p>
                  </div>
                  <Checkbox
                    id="newFeatures"
                    name="newFeatures"
                    checked={notifications.newFeatures}
                    onCheckedChange={() => handleNotificationChange("newFeatures")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="securityAlerts" className="font-medium cursor-pointer">
                      Security Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Important notifications about your account security
                    </p>
                  </div>
                  <Checkbox
                    id="securityAlerts"
                    name="securityAlerts"
                    checked={notifications.securityAlerts}
                    onCheckedChange={() => handleNotificationChange("securityAlerts")}
                  />
                </div>
                <div className="pt-2">
                  <Button onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
