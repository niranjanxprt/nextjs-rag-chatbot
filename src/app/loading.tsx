/**
 * Global Loading Component
 * 
 * Displays loading state for page transitions
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            
            {/* Loading text */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
              <p className="text-sm text-gray-500 mt-1">
                Please wait while we prepare your content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}