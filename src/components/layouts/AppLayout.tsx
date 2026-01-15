/**
 * App Layout - EXACT React Frontend Replica
 *
 * Replicating the professional design from localhost:8081
 */

'use client'

import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar-simple'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto bg-white">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}