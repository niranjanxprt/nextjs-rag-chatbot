/**
 * Dashboard Layout
 * 
 * Layout wrapper for authenticated dashboard pages
 */

'use client'

import React from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useAuth } from '@/lib/auth/context'
import { redirect } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  showBreadcrumbs?: boolean
}

export function DashboardLayout({ children, showBreadcrumbs = true }: DashboardLayoutProps) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Breadcrumb />
          </div>
        </div>
      )}
      
      <main className="py-6">
        {children}
      </main>
    </div>
  )
}