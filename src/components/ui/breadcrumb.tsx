/**
 * Breadcrumb Component
 *
 * Navigation breadcrumbs for deep page navigation
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

const pathToLabel: Record<string, string> = {
  dashboard: 'Dashboard',
  documents: 'Documents',
  chat: 'Chat',
  search: 'Search',
  settings: 'Settings',
  profile: 'Profile',
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: <Home className="w-4 h-4" />,
    },
  ]

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const label = pathToLabel[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    breadcrumbs.push({
      label,
      href: currentPath,
    })
  }

  return breadcrumbs
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname)

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-gray-500', className)}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1

        return (
          <React.Fragment key={item.href}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}

            {isLast ? (
              <span className="flex items-center gap-1 text-gray-900 font-medium">
                {item.icon}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                {item.icon}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
