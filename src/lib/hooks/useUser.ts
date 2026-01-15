/**
 * User Management Hook
 * 
 * Convex hooks for managing user data and profile operations.
 */

'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { toast } from 'react-hot-toast'

// Types
export interface UserProfile {
  _id: Id<"users">
  email: string
  name?: string
  full_name?: string
  avatar_url?: string
  bio?: string
  preferences?: any
  last_active: number
  created_at: number
  updated_at: number
}

export interface UpdateProfileData {
  full_name?: string
  avatar_url?: string
  bio?: string
  preferences?: Record<string, any>
}

// Hooks
export function useUser() {
  const user = useQuery(api.queries.users.current)
  
  return {
    data: user,
    isLoading: user === undefined,
    error: null,
  }
}

export function useUpdateProfile() {
  const updateMutation = useMutation(api.mutations.users.updateProfile)
  
  return {
    mutate: async (updates: UpdateProfileData) => {
      try {
        await updateMutation({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          bio: updates.bio,
        })
        toast.success('Profile updated successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
    mutateAsync: async (updates: UpdateProfileData) => {
      await updateMutation({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url,
        bio: updates.bio,
      })
      toast.success('Profile updated successfully')
    },
  }
}

// Avatar upload still uses API route for file handling
export function useUploadAvatar() {
  return {
    mutate: async (file: File) => {
      try {
        const formData = new FormData()
        formData.append('avatar', file)
        
        const response = await fetch('/api/user/avatar', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload avatar')
        }
        
        const { avatar_url } = await response.json()
        toast.success('Avatar uploaded successfully')
        return avatar_url
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
  }
}

export function useDeleteAvatar() {
  return {
    mutate: async (avatarUrl: string) => {
      try {
        const response = await fetch('/api/user/avatar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: avatarUrl }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete avatar')
        }
        
        toast.success('Avatar removed successfully')
      } catch (error: any) {
        toast.error(error.message)
        throw error
      }
    },
  }
}
