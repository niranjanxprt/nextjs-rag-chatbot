/**
 * Empty State Component
 * Displays a friendly message when content is empty
 */

import React from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${
        className || ''
      }`}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} variant={action.variant || 'default'}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
