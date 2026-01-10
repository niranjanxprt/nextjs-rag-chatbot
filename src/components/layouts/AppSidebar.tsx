/**
 * Application Sidebar
 * Navigation sidebar with menu items and user actions
 */

'use client'

import { FileText, FolderOpen, Library, MessageSquare, Plus, LogOut, Database, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: FolderOpen,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
  },
  {
    title: "Prompts",
    url: "/prompts",
    icon: Library,
  },
  {
    title: "Search",
    url: "/search",
    icon: Database,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  onNewProject?: () => void;
}

export function AppSidebar({ onNewProject }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleNewChat = () => {
    // Navigate to new chat
    window.location.href = '/chat';
  };

  const handleLogout = () => {
    // Handle logout
    window.location.href = '/auth/login';
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg text-foreground">RAG Chatbot</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-2 py-4">
        {/* New Chat Button */}
        <div className="px-2 mb-6">
          <Button 
            className="w-full justify-start gap-2" 
            size="sm"
            onClick={handleNewChat}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + '/');
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {user && (
          <div className="mb-3 px-2">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}