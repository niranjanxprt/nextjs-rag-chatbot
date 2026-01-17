import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "@/services/api";
import type { InviteMemberRequest, UpdateMemberRoleRequest } from "@/services/api";

export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (projectId: string) => [...memberKeys.lists(), projectId] as const,
};

export function useMembers(projectId: string) {
  return useQuery({
    queryKey: memberKeys.list(projectId),
    queryFn: async () => {
      const response = await membersApi.getMembers(projectId);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    enabled: !!projectId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteMemberRequest) => {
      const response = await membersApi.inviteMember(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(data.projectId) });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemberRoleRequest) => {
      const response = await membersApi.updateMemberRole(data);
      if (!response.success) throw new Error(response.message);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(data.projectId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, memberId }: { projectId: string; memberId: string }) => {
      const response = await membersApi.removeMember(projectId, memberId);
      if (!response.success) throw new Error(response.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(variables.projectId) });
    },
  });
}
