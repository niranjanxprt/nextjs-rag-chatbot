import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services/api";
import type { UpdateUserRequest, NotificationPreferences } from "@/services/api";

export const userKeys = {
  all: ["user"] as const,
  current: () => [...userKeys.all, "current"] as const,
  preferences: () => [...userKeys.all, "preferences"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const response = await userApi.getCurrentUser();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserRequest) => {
      const response = await userApi.updateUser(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: userKeys.preferences(),
    queryFn: async () => {
      const response = await userApi.getNotificationPreferences();
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      const response = await userApi.updateNotificationPreferences(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.preferences() });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const response = await userApi.changePassword(currentPassword, newPassword);
      if (!response.success) throw new Error(response.message);
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const response = await userApi.deleteAccount();
      if (!response.success) throw new Error(response.message);
    },
  });
}
