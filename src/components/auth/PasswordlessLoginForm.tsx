'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuthActions } from '@/lib/auth/hooks'

export interface PasswordlessLoginFormProps {
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  onBack?: () => void
  className?: string
}

type AuthMethod = 'magic_link' | 'otp'

interface FormState {
  email: string
  method: AuthMethod
  isLoading: boolean
  message: string
  error: string
}

export const PasswordlessLoginForm: React.FC<PasswordlessLoginFormProps> = ({
  onSuccess,
  onError,
  onBack,
  className = '',
}) => {
  const [formState, setFormState] = useState<FormState>({
    email: '',
    method: 'magic_link',
    isLoading: false,
    message: '',
    error: '',
  })

  const { signInWithMagicLink, requestOTP, loading, error } = useAuthActions()

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous messages
    updateFormState({ message: '', error: '' })

    // Validate email
    if (!formState.email.trim()) {
      const errorMsg = 'Email address is required'
      updateFormState({ error: errorMsg })
      // Log error for debugging
      console.error('Validation error:', errorMsg)
      return
    }

    if (!validateEmail(formState.email)) {
      const errorMsg = 'Please enter a valid email address'
      updateFormState({ error: errorMsg })
      // Log error for debugging
      console.error('Validation error:', errorMsg)
      return
    }

    try {
      let result
      if (formState.method === 'magic_link') {
        result = await signInWithMagicLink(formState.email)
      } else {
        result = await requestOTP(formState.email)
      }

      if (result.success) {
        const message =
          formState.method === 'magic_link'
            ? 'Magic link sent! Check your email to sign in.'
            : 'Verification code sent! Check your email.'
        updateFormState({ message })
        // Log success for debugging
        console.log('Login success:', message)
      } else {
        updateFormState({ error: result.error || 'Authentication failed' })
        // Log error for debugging
        console.error('Login error:', result.error || 'Authentication failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      updateFormState({ error: errorMessage })
      // Log error for debugging
      console.error('Login error:', errorMessage)
    }
  }

  const handleMethodChange = (method: AuthMethod) => {
    updateFormState({ method, message: '', error: '' })
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormState({ email: e.target.value, message: '', error: '' })
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2" disabled={loading}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>Enter your email to receive a secure sign-in link or code</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formState.email}
                onChange={handleEmailChange}
                disabled={loading}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Authentication Method Selection */}
          <div className="space-y-3">
            <Label>Authentication Method</Label>
            <RadioGroup
              value={formState.method}
              onValueChange={handleMethodChange}
              disabled={loading}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="magic_link" id="magic_link" />
                <div className="flex-1">
                  <Label htmlFor="magic_link" className="font-medium cursor-pointer">
                    Magic Link
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a secure link in your email to sign in instantly
                  </p>
                </div>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="otp" id="otp" />
                <div className="flex-1">
                  <Label htmlFor="otp" className="font-medium cursor-pointer">
                    One-Time Code
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a 6-digit code to enter on the next screen
                  </p>
                </div>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
            </RadioGroup>
          </div>

          {/* Error Message */}
          {(formState.error || error) && (
            <Alert variant="destructive">
              <AlertDescription>{formState.error || error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {formState.message && (
            <Alert>
              <AlertDescription className="text-green-700">{formState.message}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading || !formState.email.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                {formState.method === 'magic_link' ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Send Code
                  </>
                )}
              </>
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            {formState.method === 'magic_link'
              ? "We'll send you a secure link that will sign you in automatically"
              : "We'll send you a 6-digit code to verify your identity"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default PasswordlessLoginForm
