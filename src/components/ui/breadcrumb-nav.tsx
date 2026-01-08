/**
 * Breadcrumb Navigation Component
 * Shows current location in app navigation
 */

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  className?: string
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}

          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-primary hover:underline transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={cn(
                'transition-colors',
                item.active
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
