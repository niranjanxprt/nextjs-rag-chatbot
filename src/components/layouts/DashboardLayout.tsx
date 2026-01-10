/**
 * Dashboard Layout
 *
 * Layout wrapper for authenticated dashboard pages - Updated to match original design
 */

'use client'

import React from 'react'
import { SidebarLayout } from './SidebarLayout'
import { useAuth } from '@/lib/auth/context'
import { redirect } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login')
  }

  return <SidebarLayout>{children}</SidebarLayout>
}
