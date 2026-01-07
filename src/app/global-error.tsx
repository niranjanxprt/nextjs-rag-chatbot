'use client'

/**
 * Global Error Page
 * 
 * Catches errors that occur in the root layout and provides
 * a fallback UI for the entire application
 */

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console and monitoring service
    console.error('Global error:', error)
    
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'global_error'
      }
      
      console.error('Global Error Report:', errorReport)
      
      // TODO: Send to error monitoring service
      // sendToMonitoringService(errorReport)
    }
  }, [error])

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Application Error
              </CardTitle>
              <CardDescription>
                The application encountered a critical error and needs to be restarted.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error digest for support */}
              {error.digest && (
                <div className="text-sm text-gray-500 text-center">
                  Error ID: <code className="bg-gray-100 px-1 rounded">{error.digest}</code>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={reset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload App
                </Button>
              </div>

              <Button 
                onClick={handleGoHome}
                className="w-full"
                variant="outline"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-md">
                    <div className="text-sm space-y-2">
                      <div>
                        <strong>Message:</strong>
                        <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap">
                          {error.message}
                        </pre>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {error.digest && (
                        <div>
                          <strong>Digest:</strong>
                          <pre className="mt-1 text-xs text-gray-600">
                            {error.digest}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}