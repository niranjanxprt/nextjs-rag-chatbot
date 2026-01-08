/**
 * Auth Layout
 *
 * Layout wrapper for authentication pages
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function AuthLayout({
  children,
  title = 'Welcome to RAG Chatbot',
  description = 'Sign in to access your personalized AI assistant',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RAG Chatbot</h1>
          <p className="text-gray-600">Intelligent document-based conversations</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by OpenAI, Supabase, and Qdrant</p>
        </div>
      </div>
    </div>
  )
}
