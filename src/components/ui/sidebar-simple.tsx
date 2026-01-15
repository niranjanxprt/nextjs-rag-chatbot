"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple, working sidebar context
const SidebarContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: true,
  setOpen: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function Sidebar({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  const { open } = useSidebar()
  
  return (
    <div className={cn(
      "flex h-screen flex-col border-r bg-white transition-all duration-300",
      open ? "w-64" : "w-16",
      className
    )}>
      {children}
    </div>
  )
}

export function SidebarHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("border-b p-4", className)}>
      {children}
    </div>
  )
}

export function SidebarContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("flex-1 overflow-auto p-2", className)}>
      {children}
    </div>
  )
}

export function SidebarFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("border-t p-4", className)}>
      {children}
    </div>
  )
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { open, setOpen } = useSidebar()
  
  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100",
        className
      )}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}