/**
 * Magic Link Handler Component - SIMPLIFIED VERSION
 *
 * Handles magic link callback processing using Convex Auth.
 * This version is simplified to avoid connection error handling complexity.
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, ArrowRight, Home } from 'lucide-react'

export interface MagicLinkHandlerProps {
  onSuccess?: (token: string) => void
  onError?: (error: string) => void
  redirectTo?: string
  className?: string
}

export const MagicLinkHandler: React.FC<MagicLinkHandlerProps> = ({
  onSuccess,
  onError,
  redirectTo = '/dashboard',
  className = '',
}) => {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [verifying, setVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const verificationAttempted = useRef(false)

  // Handle magic link verification
  useEffect(() => {
    const code = searchParams.get('code')
    const email = searchParams.get('email')

    console.log('🔍 Magic Link Handler - URL params:', {
      code: code ? `${code.substring(0, 8)}...` : 'MISSING',
      email: email || 'MISSING',
    })

    // Only attempt verification once if we have a code and aren't already authenticated
    if (code && !isAuthenticated && !verifying && !verificationAttempted.current) {
      verificationAttempted.current = true
      setVerifying(true)

      // Get email from URL or fallback to sessionStorage
      const emailToUse = email || sessionStorage.getItem('auth_email')

      if (!emailToUse) {
        console.error('❌ No email found in URL or sessionStorage')
        setVerificationError('Email address not found. Please try signing in again.')
        setVerifying(false)
        onError?.('Email address not found')
        return
      }

      console.log('🔑 Verifying magic link code...')

      // Verify the code with Convex Auth
      const verifyCode = async () => {
        try {
          // CRITICAL: Convex Auth expects a plain object, NOT FormData!
          console.log('📤 Sending verification request...')
          console.log('   Code:', code.substring(0, 8) + '...')
          console.log('   Email:', emailToUse)

          await signIn('resend-magic-link', {
            code: code,
            email: emailToUse,
          })

          console.log('✅ Magic link verification completed')

          // Clear stored email
          sessionStorage.removeItem('auth_email')
          setVerifying(false)

          // Note: Authentication state will update via useConvexAuth hook
          // The success redirect will be handled in the next useEffect
        } catch (error: any) {
          console.error('❌ Magic link verification failed:', error)
          console.error('❌ Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
          })

          // Handle specific error cases
          if (error.message?.includes('Could not verify code')) {
            setVerificationError('This magic link is invalid, expired, or has already been used.')
            setVerifying(false)
            onError?.(error.message)
          } else if (
            error.message?.includes('Connection lost') ||
            error.message?.includes('WebSocket')
          ) {
            // For connection errors, the auth might have actually succeeded
            // The WebSocket disconnects but auth state should still update
            console.log('⚠️  Connection error detected - auth may have succeeded anyway')
            console.log('⚠️  Keeping verifying state and waiting for auth state to update...')

            // DON'T set verifying to false - keep the loading state
            // DON'T show error immediately - wait for auth state
            // The useEffect watching isAuthenticated will handle success

            // Set a timeout to show error only if auth truly fails
            setTimeout(() => {
              console.log('🔍 Final check after connection error...')
              console.log('   isAuthenticated:', isAuthenticated)
              console.log('   isLoading:', isLoading)

              // Only show error if we're not authenticated AND not loading
              if (!isAuthenticated && !isLoading) {
                console.log('❌ Authentication did not complete - showing error')
                setVerificationError('Connection issue during authentication. Please try again.')
                setVerifying(false)
                onError?.('Connection issue during authentication')
              } else if (isAuthenticated) {
                console.log('✅ Authentication succeeded despite connection error!')
                setVerifying(false)
              } else {
                console.log('⏳ Still loading, waiting more...')
              }
            }, 8000)
            return
          } else {
            setVerificationError(error.message || 'Authentication failed. Please try again.')
            setVerifying(false)
            onError?.(error.message || 'Authentication failed')
          }
        }
      }

      verifyCode()
    }
  }, [searchParams, isAuthenticated, signIn, verifying, onError, isLoading])

  // Handle successful authentication
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('✅ User is authenticated - redirecting to dashboard')
      onSuccess?.('authenticated')

      // Small delay to show success state, then redirect
      setTimeout(() => {
        navigate(redirectTo, { replace: true })
      }, 1500)
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo, onSuccess])

  const handleRetry = () => {
    navigate('/login', { replace: true })
  }

  const handleGoHome = () => {
    navigate('/', { replace: true })
  }

  // Loading/Verifying state
  if (isLoading || verifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <Card className="w-full max-w-md mx-auto border-blue-200 bg-blue-50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {verifying ? 'Verifying Magic Link...' : 'Authenticating...'}
            </CardTitle>
            <CardDescription className="text-base">
              Please wait while we verify your magic link
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>This should only take a moment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
        <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Successful</CardTitle>
            <CardDescription className="text-base">
              You have been successfully signed in. Redirecting...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Welcome back! Taking you to your dashboard...
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => navigate(redirectTo, { replace: true })}
              className="w-full"
              variant="default"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Failed</CardTitle>
          <CardDescription className="text-base">
            {verificationError || 'The magic link may be invalid or expired'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {verificationError ||
                'Unable to authenticate with the provided link. Please try again.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full" variant="default">
              <ArrowRight className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button onClick={handleGoHome} className="w-full" variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Magic links expire after 15 minutes for security reasons.</p>
            <p>Each magic link can only be used once.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MagicLinkHandler
