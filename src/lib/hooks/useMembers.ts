/**
 * Members Management Hook
 * 
 * React Query hook for managing project members, invitations,
 * and role-based permissions.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: {
    read: boolean
    write: boolean
    admin: boolean
  }
  invited_by: string | null
  joined_at: string
  created_at: string
  updated_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    last_active: string
  }
}

export interface ProjectInvitation {
  id: string
  project_id: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  permissions: {
    read: boolean
    write: boolean
    admin: boolean
  }
  token: string
  invited_by: string
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
  created_at: string
  projects: {
    id: string
    name: string
  }
  invited_by_profile: {
    id: string
    email: string
    full_name: string | null
  }
}

export interface InviteMemberData {
  email: string
  role: 'admin' | 'member' | 'viewer'
  permissions?: {
    read: boolean
    write: boolean
    admin: boolean
  }
}

export interface UpdateMemberData {
  role?: 'admin' | 'member' | 'viewer'
  permissions?: {
    read: boolean
    write: boolean
    admin: boolean
  }
}

// API Functions
const membersApi = {
  // Get project members
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await fetch(`/api/projects/${projectId}/members`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch project members')
    }
    
    return response.json()
  },

  // Invite member to project
  async inviteMember(projectId: string, data: InviteMemberData): Promise<ProjectInvitation> {
    const response = await fetch(`/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to invite member')
    }
    
    return response.json()
  },

  // Update member role/permissions
  async updateMember(projectId: string, memberId: string, data: UpdateMemberData): Promise<ProjectMember> {
    const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update member')
    }
    
    return response.json()
  },

  // Remove member from project
  async removeMember(projectId: string, memberId: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove member')
    }
  },

  // Get project invitations
  async getProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
    const response = await fetch(`/api/projects/${projectId}/invitations`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch invitations')
    }
    
    return response.json()
  },

  // Get user's invitations
  async getUserInvitations(): Promise<ProjectInvitation[]> {
    const response = await fetch('/api/invitations')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch user invitations')
    }
    
    return response.json()
  },

  // Accept invitation
  async acceptInvitation(token: string): Promise<{ project: any; member: ProjectMember }> {
    const response = await fetch(`/api/invitations/${token}`, {
      method: 'POST',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to accept invitation')
    }
    
    return response.json()
  },

  // Decline invitation
  async declineInvitation(token: string): Promise<void> {
    const response = await fetch(`/api/invitations/${token}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to decline invitation')
    }
  },

  // Cancel invitation
  async cancelInvitation(projectId: string, invitationId: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/invitations/${invitationId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel invitation')
    }
  },
}

// Hooks
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectMembers(projectId),
    queryFn: () => membersApi.getProjectMembers(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: InviteMemberData }) =>
      membersApi.inviteMember(projectId, data),
    onSuccess: (invitation, { projectId }) => {
      // Invalidate project invitations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projectInvitations(projectId) 
      })
      
      toast.success(`Invitation sent to ${invitation.email}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, memberId, data }: { 
      projectId: string
      memberId: string
      data: UpdateMemberData 
    }) => membersApi.updateMember(projectId, memberId, data),
    onSuccess: (updatedMember, { projectId }) => {
      // Update project members list
      queryClient.setQueryData<ProjectMember[]>(
        queryKeys.projectMembers(projectId),
        (old) => {
          if (!old) return old
          return old.map(member =>
            member.id === updatedMember.id ? updatedMember : member
          )
        }
      )
      
      toast.success('Member updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: string; memberId: string }) =>
      membersApi.removeMember(projectId, memberId),
    onSuccess: (_, { projectId, memberId }) => {
      // Remove from project members list
      queryClient.setQueryData<ProjectMember[]>(
        queryKeys.projectMembers(projectId),
        (old) => {
          if (!old) return old
          return old.filter(member => member.id !== memberId)
        }
      )
      
      toast.success('Member removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useProjectInvitations(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectInvitations(projectId),
    queryFn: () => membersApi.getProjectInvitations(projectId),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useUserInvitations() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.userInvitations(user?.id || ''),
    queryFn: membersApi.getUserInvitations,
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: membersApi.acceptInvitation,
    onSuccess: (result) => {
      // Add project to user's projects
      queryClient.setQueryData<any[]>(queryKeys.projects, (old) => {
        if (!old) return [result.project]
        return [result.project, ...old]
      })
      
      // Add member to project members
      queryClient.setQueryData<ProjectMember[]>(
        queryKeys.projectMembers(result.project.id),
        (old) => {
          if (!old) return [result.member]
          return [...old, result.member]
        }
      )
      
      // Remove from user invitations
      queryClient.setQueryData<ProjectInvitation[]>(
        queryKeys.userInvitations(user!.id),
        (old) => {
          if (!old) return old
          return old.filter(inv => inv.project_id !== result.project.id)
        }
      )
      
      toast.success(`Joined project: ${result.project.name}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: membersApi.declineInvitation,
    onSuccess: (_, token) => {
      // Remove from user invitations
      queryClient.setQueryData<ProjectInvitation[]>(
        queryKeys.userInvitations(user!.id),
        (old) => {
          if (!old) return old
          return old.filter(inv => inv.token !== token)
        }
      )
      
      toast.success('Invitation declined')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ projectId, invitationId }: { projectId: string; invitationId: string }) =>
      membersApi.cancelInvitation(projectId, invitationId),
    onSuccess: (_, { projectId, invitationId }) => {
      // Remove from project invitations
      queryClient.setQueryData<ProjectInvitation[]>(
        queryKeys.projectInvitations(projectId),
        (old) => {
          if (!old) return old
          return old.filter(inv => inv.id !== invitationId)
        }
      )
      
      toast.success('Invitation cancelled')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Utility hooks
export function useCurrentUserRole(projectId: string) {
  const { user } = useAuth()
  const { data: members } = useProjectMembers(projectId)
  
  const currentMember = members?.find(member => member.user_id === user?.id)
  
  return {
    role: currentMember?.role,
    permissions: currentMember?.permissions,
    isOwner: currentMember?.role === 'owner',
    isAdmin: currentMember?.role === 'admin' || currentMember?.role === 'owner',
    canWrite: currentMember?.permissions?.write || false,
    canAdmin: currentMember?.permissions?.admin || false,
  }
}