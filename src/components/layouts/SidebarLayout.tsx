/**
 * Sidebar Layout - Matches Original React/Vite Design
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import {
  FileText,
  FolderOpen,
  Library,
  MessageSquare,
  Plus,
  Database,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: FolderOpen,
  },
  {
    title: 'Prompts Library',
    url: '/prompts',
    icon: Library,
  },
  {
    title: 'Recent Chats',
    url: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'Knowledge Base',
    url: '/documents',
    icon: Database,
  },
]

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg text-foreground">DocInsight</span>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 px-2">
          {/* New Chat Button */}
          <div className="px-2 mb-3">
            <Button asChild className="w-full justify-start gap-2" size="sm">
              <Link href="/chat">
                <Plus className="h-4 w-4" />
                New Chat
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.url
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
