/**
 * Badge Component
 *
 * A badge component for displaying status and labels
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-foreground/20',
        success:
          'border-transparent bg-green-600 text-white hover:bg-green-700',
        warning:
          'border-transparent bg-yellow-600 text-white hover:bg-yellow-700',
        info: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

interface DotBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary'
  label?: string
}

const dotColors = {
  primary: 'bg-primary',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  destructive: 'bg-destructive',
  secondary: 'bg-secondary',
}

function DotBadge({ color = 'primary', label, className, ...props }: DotBadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)} {...props}>
      <div className={cn('h-2 w-2 rounded-full', dotColors[color])} />
      {label && <span className="text-xs font-medium">{label}</span>}
    </div>
  )
}

export { Badge, DotBadge, badgeVariants }
