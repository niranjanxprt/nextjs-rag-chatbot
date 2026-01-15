/**
 * User Management Hook
 * 
 * React Query hook for managing user data and profile operations.
 * Replaces direct Supabase calls with cached, optimized queries.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/context'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/react-query/queryClient'
import { toast } from 'react-hot-toast'

// Types
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  preferences: Record<string, any>
  last_active: string
  created_at: string
  updated_at: string
}

export interface UpdateProfileData {
  full_name?: string
  avatar_url?: string
  bio?: string
  preferences?: Record<string, any>
}

// API Functions
const userApi = {
  // Get current user profile
  async getProfile(userId: string): Promise<UserProfile> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }
    
    return data
  },

  // Update user profile
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }
    
    return data
  },

  // Update last active timestamp
  async updateLastActive(userId: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)
    
    if (error) {
      console.warn('Failed to update last active:', error.message)
    }
  },

  // Upload avatar
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`)
    }
    
    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  },

  // Delete avatar
  async deleteAvatar(avatarUrl: string): Promise<void> {
    const supabase = createClient()
    
    // Extract file path from URL
    const urlParts = avatarUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `avatars/${fileName}`
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])
    
    if (error) {
      console.warn('Failed to delete avatar:', error.message)
    }
  }
}

// Hooks
export function useUser() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: queryKeys.userProfile(user?.id || ''),
    queryFn: () => userApi.getProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (updates: UpdateProfileData) => 
      userApi.updateProfile(user!.id, updates),
    onSuccess: (data) => {
      // Update the user profile cache
      queryClient.setQueryData(
        queryKeys.userProfile(user!.id),
        data
      )
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user })
      
      toast.success('Profile updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUploadAvatar() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => userApi.uploadAvatar(user!.id, file),
    onSuccess: (avatarUrl) => {
      // Update profile with new avatar URL
      const currentProfile = queryClient.getQueryData<UserProfile>(
        queryKeys.userProfile(user!.id)
      )
      
      if (currentProfile) {
        queryClient.setQueryData(
          queryKeys.userProfile(user!.id),
          { ...currentProfile, avatar_url: avatarUrl }
        )
      }
      
      toast.success('Avatar uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteAvatar() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (avatarUrl: string) => userApi.deleteAvatar(avatarUrl),
    onSuccess: () => {
      // Remove avatar URL from profile
      const currentProfile = queryClient.getQueryData<UserProfile>(
        queryKeys.userProfile(user!.id)
      )
      
      if (currentProfile) {
        queryClient.setQueryData(
          queryKeys.userProfile(user!.id),
          { ...currentProfile, avatar_url: null }
        )
      }
      
      toast.success('Avatar removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Utility hook to update last active timestamp
export function useUpdateLastActive() {
  const { user } = useAuth()
  
  return useMutation({
    mutationFn: () => userApi.updateLastActive(user!.id),
    // Don't show notifications for this background operation
    onError: () => {
      // Silent fail - this is not critical
    },
  })
}