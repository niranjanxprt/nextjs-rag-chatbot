/**
 * PROFESSIONAL SIDEBAR - EXACT REACT FRONTEND REPLICA
 * Matching the design from http://localhost:8081
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  FileText, 
  FolderOpen, 
  Library, 
  MessageSquare, 
  Plus, 
  LogOut, 
  Database, 
  Menu, 
  X,
  Home,
  Settings,
  User,
  Search,
  BookOpen,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar-simple'

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Chat',
    url: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'Documents',
    url: '/documents',
    icon: FileText,
  },
  {
    title: 'Search',
    url: '/search',
    icon: Search,
  },
  {
    title: 'Projects',
    url: '/projects',
    icon: FolderOpen,
  },
  {
    title: 'Knowledge Base',
    url: '/knowledge-base',
    icon: BookOpen,
  },
  {
    title: 'Prompts',
    url: '/prompts',
    icon: Library,
  },
  {
    title: 'Team',
    url: '/team',
    icon: Users,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { open, setOpen } = useSidebar()

  const handleNewChat = () => {
    router.push('/chat')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className={cn(
      "flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300 shadow-sm",
      open ? "w-64" : "w-16"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {open && (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">DocInsight</span>
          </Link>
        )}
        {!open && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          onClick={handleNewChat}
          className={cn(
            "bg-blue-600 hover:bg-blue-700 text-white border-0 transition-all font-medium",
            open ? "w-full justify-start gap-2" : "w-full p-2 justify-center"
          )}
        >
          <Plus className="h-4 w-4" />
          {open && "New Chat"}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-3 mb-1 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                !open && "justify-center px-3"
              )}
              title={!open ? item.title : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-blue-600" : "text-gray-500"
              )} />
              {open && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {open && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          {open && (
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <Settings className="h-4 w-4 text-gray-500" />
              <span>Settings</span>
            </Link>
          )}
          
          <button 
            onClick={handleSignOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full transition-all",
              !open && "justify-center px-3"
            )}
            title={!open ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 text-gray-500" />
            {open && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}