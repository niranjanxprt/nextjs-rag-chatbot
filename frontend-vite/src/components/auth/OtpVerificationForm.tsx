/**
 * OTP Verification Form Component
 * 
 * Provides 6-digit OTP input form with validation.
 * Includes proper error handling and retry logic.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { authApi } from '@/services/api/auth';

export interface OtpVerificationFormProps {
  email: string;
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  onResend?: () => void;
  className?: string;
}

interface FormState {
  otpCode: string;
  isVerifying: boolean;
  isResending: boolean;
  error: string;
  attemptsRemaining: number;
  canResend: boolean;
  resendCooldown: number;
}

const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN = 60; // seconds

export const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({
  email,
  onSuccess,
  onError,
  onBack,
  onResend,
  className = ''
}) => {
  const [formState, setFormState] = useState<FormState>({
    otpCode: '',
    isVerifying: false,
    isResending: false,
    error: '',
    attemptsRemaining: MAX_ATTEMPTS,
    canResend: false,
    resendCooldown: RESEND_COOLDOWN
  });

  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  // Start cooldown timer
  useEffect(() => {
    if (formState.resendCooldown > 0 && !formState.canResend) {
      cooldownIntervalRef.current = setInterval(() => {
        setFormState(prev => {
          const newCooldown = prev.resendCooldown - 1;
          if (newCooldown <= 0) {
            return { ...prev, resendCooldown: 0, canResend: true };
          }
          return { ...prev, resendCooldown: newCooldown };
        });
      }, 1000);
    }

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [formState.canResend, formState.resendCooldown]);

  const validateOtpCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  const handleOtpChange = (value: string) => {
    updateFormState({ otpCode: value, error: '' });
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6 && validateOtpCode(value)) {
      handleVerifyOtp(value);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const otpCode = code || formState.otpCode;
    
    if (!validateOtpCode(otpCode)) {
      const error = 'Please enter a valid 6-digit code';
      updateFormState({ error });
      onError?.(error);
      return;
    }

    updateFormState({ isVerifying: true, error: '' });

    try {
      const result = await authApi.verifyOTP(email, otpCode);

      if (result.success) {
        onSuccess?.(result.data.access_token);
      } else {
        const newAttemptsRemaining = formState.attemptsRemaining - 1;
        
        if (newAttemptsRemaining <= 0) {
          const error = 'Too many failed attempts. Please request a new code.';
          updateFormState({ 
            error, 
            isVerifying: false, 
            attemptsRemaining: 0,
            otpCode: ''
          });
          onError?.(error);
        } else {
          const error = `${result.message || 'Invalid code'}. ${newAttemptsRemaining} attempt${newAttemptsRemaining === 1 ? '' : 's'} remaining.`;
          updateFormState({ 
            error, 
            isVerifying: false, 
            attemptsRemaining: newAttemptsRemaining,
            otpCode: ''
          });
          onError?.(error);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      updateFormState({ error: errorMessage, isVerifying: false, otpCode: '' });
      onError?.(errorMessage);
    }
  };

  const handleResendCode = async () => {
    updateFormState({ isResending: true, error: '' });

    try {
      const result = await authApi.sendOTP(email);

      if (result.success) {
        updateFormState({
          isResending: false,
          attemptsRemaining: MAX_ATTEMPTS,
          canResend: false,
          resendCooldown: RESEND_COOLDOWN,
          otpCode: ''
        });
        onResend?.();
      } else {
        const error = result.message || 'Failed to resend code';
        updateFormState({ error, isResending: false });
        onError?.(error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend code';
      updateFormState({ error: errorMessage, isResending: false });
      onError?.(errorMessage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyOtp();
  };

  const isFormDisabled = formState.isVerifying || formState.attemptsRemaining <= 0;

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Verify Code</CardTitle>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
              disabled={formState.isVerifying || formState.isResending}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Enter the 6-digit code sent to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-center block">
              Verification Code
            </Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={formState.otpCode}
                onChange={handleOtpChange}
                disabled={isFormDisabled}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {/* Error Message */}
          {formState.error && (
            <Alert variant="destructive">
              <AlertDescription>{formState.error}</AlertDescription>
            </Alert>
          )}

          {/* Attempts Remaining */}
          {formState.attemptsRemaining < MAX_ATTEMPTS && formState.attemptsRemaining > 0 && (
            <Alert>
              <AlertDescription>
                {formState.attemptsRemaining} attempt{formState.attemptsRemaining === 1 ? '' : 's'} remaining
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isFormDisabled || formState.otpCode.length !== 6}
          >
            {formState.isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Verify Code
              </>
            )}
          </Button>
        </form>

        {/* Resend Section */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          
          {formState.canResend ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendCode}
              disabled={formState.isResending}
            >
              {formState.isResending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Resend Code
                </>
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend available in {formState.resendCooldown}s
            </p>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            The code will expire in 5 minutes. Check your spam folder if you don't see it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OtpVerificationForm;