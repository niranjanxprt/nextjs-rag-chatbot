/**
 * React Query Provider Component
 * 
 * Provides React Query context to the entire application with
 * development tools and error boundaries.
 */

'use client'

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './queryClient'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}

// Export the query client for use in server components and utilities
export { queryClient }