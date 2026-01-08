/**
 * Suspense Wrapper Components
 *
 * Provides consistent loading states and error boundaries
 * for async components and data fetching
 */

import { Suspense, ReactNode } from 'react'
import { ErrorBoundary } from './error-boundary'
import { LoadingSpinner } from './loading-spinner'
import { Card, CardContent } from './card'
import { Skeleton } from './skeleton'

// =============================================================================
// Types
// =============================================================================

interface SuspenseWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  errorFallback?: ReactNode
  showErrorDetails?: boolean
}

interface PageSuspenseProps {
  children: ReactNode
  title?: string
  description?: string
}

interface ComponentSuspenseProps {
  children: ReactNode
  height?: string | number
  width?: string | number
  className?: string
}

// =============================================================================
// Basic Suspense Wrapper
// =============================================================================

export function SuspenseWrapper({
  children,
  fallback,
  errorFallback,
  showErrorDetails = false,
}: SuspenseWrapperProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <ErrorBoundary fallback={errorFallback} showDetails={showErrorDetails}>
      <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}

// =============================================================================
// Page-Level Suspense
// =============================================================================

export function PageSuspense({ children, title, description }: PageSuspenseProps) {
  const fallback = (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {title && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            {description && <Skeleton className="h-4 w-96" />}
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <SuspenseWrapper fallback={fallback} showErrorDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </SuspenseWrapper>
  )
}

// =============================================================================
// Component-Level Suspense
// =============================================================================

export function ComponentSuspense({
  children,
  height = '200px',
  width = '100%',
  className = '',
}: ComponentSuspenseProps) {
  const fallback = (
    <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
      <LoadingSpinner />
    </div>
  )

  return <SuspenseWrapper fallback={fallback}>{children}</SuspenseWrapper>
}

// =============================================================================
// List Suspense (for data lists)
// =============================================================================

export function ListSuspense({
  children,
  itemCount = 3,
  className = '',
}: {
  children: ReactNode
  itemCount?: number
  className?: string
}) {
  const fallback = (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return <SuspenseWrapper fallback={fallback}>{children}</SuspenseWrapper>
}

// =============================================================================
// Chat Suspense (for chat interfaces)
// =============================================================================

export function ChatSuspense({ children }: { children: ReactNode }) {
  const fallback = (
    <div className="flex flex-col h-full">
      {/* Chat header skeleton */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Chat messages skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {/* User message */}
        <div className="flex justify-end">
          <div className="bg-blue-100 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Assistant message */}
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="bg-blue-100 rounded-lg p-3 max-w-xs">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Chat input skeleton */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Skeleton className="flex-1 h-10" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )

  return <SuspenseWrapper fallback={fallback}>{children}</SuspenseWrapper>
}

// =============================================================================
// Document Suspense (for document interfaces)
// =============================================================================

export function DocumentSuspense({ children }: { children: ReactNode }) {
  const fallback = (
    <div className="space-y-6">
      {/* Upload area skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-12 mx-auto rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
              <Skeleton className="h-10 w-32 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document list skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  return <SuspenseWrapper fallback={fallback}>{children}</SuspenseWrapper>
}

// =============================================================================
// Search Suspense (for search interfaces)
// =============================================================================

export function SearchSuspense({ children }: { children: ReactNode }) {
  const fallback = (
    <div className="space-y-6">
      {/* Search input skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Search results skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )

  return <SuspenseWrapper fallback={fallback}>{children}</SuspenseWrapper>
}
