import { apiFetch } from "./config";
import type {
  User,
  ApiResponse,
  UpdateUserRequest,
  NotificationPreferences,
} from "./types";

export const userApi = {
  // Get current user (requires authentication)
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const user = await apiFetch<User>("/user/me", {}, true);
      return { data: user, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as User,
        success: false,
        message: error.message || "Failed to fetch user",
      };
    }
  },

  // Update user profile (requires authentication)
  async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      const user = await apiFetch<User>(
        "/user/me",
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        true
      );
      return { data: user, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as User,
        success: false,
        message: error.message || "Failed to update user",
      };
    }
  },

  // Get notification preferences (requires authentication)
  async getNotificationPreferences(): Promise<
    ApiResponse<NotificationPreferences>
  > {
    try {
      const prefs = await apiFetch<NotificationPreferences>(
        "/user/preferences",
        {},
        true
      );
      return { data: prefs, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as NotificationPreferences,
        success: false,
        message: error.message || "Failed to fetch preferences",
      };
    }
  },

  // Update notification preferences (requires authentication)
  async updateNotificationPreferences(
    data: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    try {
      const prefs = await apiFetch<NotificationPreferences>(
        "/user/preferences",
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
        true
      );
      return { data: prefs, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as NotificationPreferences,
        success: false,
        message: error.message || "Failed to update preferences",
      };
    }
  },

  // Change password (requires authentication)
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    try {
      await apiFetch<void>(
        "/user/change-password",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        true
      );
      return { data: undefined, success: true };
    } catch (error: any) {
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to change password",
      };
    }
  },

  // Delete account (requires authentication)
  async deleteAccount(): Promise<ApiResponse<void>> {
    try {
      await apiFetch<void>(
        "/user/account",
        {
          method: "DELETE",
        },
        true
      );
      return { data: undefined, success: true };
    } catch (error: any) {
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to delete account",
      };
    }
  },
};
