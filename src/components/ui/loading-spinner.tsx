/**
 * Loading Spinner Component
 *
 * Reusable loading spinner with different sizes and variants
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

const variantClasses = {
  primary: 'border-blue-600',
  secondary: 'border-gray-600',
  white: 'border-white',
}

export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-transparent border-t-current',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="flex flex-col items-center space-y-2">
        <LoadingSpinner size={size} />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

interface FullPageLoadingProps {
  message?: string
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

interface SkeletonLoaderProps {
  count?: number
  className?: string
}

export function SkeletonLoader({
  count = 3,
  className,
}: SkeletonLoaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-muted animate-pulse rounded-md"
        />
      ))}
    </div>
  )
}
