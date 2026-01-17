import { delay, API_CONFIG } from "./config";
import type { ProjectMember, ApiResponse, InviteMemberRequest, UpdateMemberRoleRequest } from "./types";

// Mock data store
const mockMembers: Record<string, ProjectMember[]> = {
  "proj-1": [
    { id: "member-1", projectId: "proj-1", userId: "user-1", name: "John Doe", email: "john.doe@example.com", initials: "JD", role: "owner", joinedAt: "2024-11-15T09:00:00Z" },
    { id: "member-2", projectId: "proj-1", userId: "user-2", name: "Jane Smith", email: "jane.smith@example.com", initials: "JS", role: "editor", joinedAt: "2024-11-20T14:00:00Z" },
    { id: "member-3", projectId: "proj-1", userId: "user-3", name: "Mike Johnson", email: "mike.j@example.com", initials: "MJ", role: "viewer", joinedAt: "2024-12-01T10:00:00Z" },
  ],
  "proj-2": [
    { id: "member-4", projectId: "proj-2", userId: "user-1", name: "John Doe", email: "john.doe@example.com", initials: "JD", role: "owner", joinedAt: "2024-10-01T10:00:00Z" },
  ],
  "proj-3": [
    { id: "member-5", projectId: "proj-3", userId: "user-1", name: "John Doe", email: "john.doe@example.com", initials: "JD", role: "owner", joinedAt: "2024-12-01T08:30:00Z" },
  ],
};

const members = { ...mockMembers };

export const membersApi = {
  // Get members for a project
  async getMembers(projectId: string): Promise<ApiResponse<ProjectMember[]>> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      return { data: members[projectId] || [], success: true };
    }
    throw new Error("API not implemented");
  },

  // Invite member
  async inviteMember(data: InviteMemberRequest): Promise<ApiResponse<ProjectMember>> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      const emailPrefix = data.email.split("@")[0];
      const newMember: ProjectMember = {
        id: `member-${Date.now()}`,
        projectId: data.projectId,
        userId: `user-${Date.now()}`,
        name: emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
        email: data.email,
        initials: data.email.substring(0, 2).toUpperCase(),
        role: data.role,
        joinedAt: new Date().toISOString(),
      };

      if (!members[data.projectId]) {
        members[data.projectId] = [];
      }
      members[data.projectId].push(newMember);
      return { data: newMember, success: true };
    }
    throw new Error("API not implemented");
  },

  // Update member role
  async updateMemberRole(data: UpdateMemberRoleRequest): Promise<ApiResponse<ProjectMember>> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      const projectMembers = members[data.projectId];
      if (!projectMembers) {
        return { data: null as unknown as ProjectMember, success: false, message: "Project not found" };
      }

      const memberIndex = projectMembers.findIndex((m) => m.id === data.memberId);
      if (memberIndex === -1) {
        return { data: null as unknown as ProjectMember, success: false, message: "Member not found" };
      }

      projectMembers[memberIndex].role = data.role;
      return { data: projectMembers[memberIndex], success: true };
    }
    throw new Error("API not implemented");
  },

  // Remove member
  async removeMember(projectId: string, memberId: string): Promise<ApiResponse<void>> {
    if (API_CONFIG.USE_MOCK) {
      await delay();
      if (members[projectId]) {
        members[projectId] = members[projectId].filter((m) => m.id !== memberId);
      }
      return { data: undefined, success: true };
    }
    throw new Error("API not implemented");
  },
};
