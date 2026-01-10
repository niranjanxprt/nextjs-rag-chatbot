'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Moon, Sun, Monitor } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

// Theme hook with error handling
function useThemeWithFallback() {
  const [themeState, setThemeState] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    setTheme: (theme: 'light' | 'dark' | 'system') => {
      setThemeState(prev => ({ ...prev, theme }))
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme)
        // Apply theme immediately
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      }
    },
    resolvedTheme: 'light' as 'light' | 'dark'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
      const isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setThemeState(prev => ({
        ...prev,
        theme: stored,
        resolvedTheme: isDark ? 'dark' : 'light'
      }))
    }
  }, [])

  return themeState
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useThemeWithFallback()
  const { user } = useAuth()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    temperature: 0.1,
    maxTokens: 1000,
    useKnowledgeBase: true,
  })
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/preferences')
        if (!response.ok) throw new Error('Failed to load preferences')
        const data = await response.json()
        const prefs = data.preferences
        setPreferences({
          temperature: prefs.chat_settings?.temperature || 0.1,
          maxTokens: prefs.chat_settings?.maxTokens || 1000,
          useKnowledgeBase: prefs.ui_settings?.useKnowledgeBase ?? true,
        })
      } catch (error) {
        console.error('Failed to load preferences:', error)
      } finally {
        setIsLoadingPreferences(false)
      }
    }

    loadPreferences()
  }, [])

  const handleSavePreferences = async () => {
    setSaveStatus('saving')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_settings: {
            temperature: preferences.temperature,
            maxTokens: preferences.maxTokens,
          },
          ui_settings: {
            useKnowledgeBase: preferences.useKnowledgeBase,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to save preferences')

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save preferences')
      setSaveStatus('error')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences and account</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto p-6">
            <Tabs defaultValue="appearance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="chat">Chat Settings</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>Choose how the app looks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={theme || 'system'} onValueChange={setTheme}>
                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="light" id="light" />
                        <Label htmlFor="light" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Light</p>
                              <p className="text-sm text-muted-foreground">Bright and clear</p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="dark" id="dark" />
                        <Label htmlFor="dark" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Dark</p>
                              <p className="text-sm text-muted-foreground">Easy on the eyes</p>
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="system" id="system" />
                        <Label htmlFor="system" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            <div>
                              <p className="font-medium">System</p>
                              <p className="text-sm text-muted-foreground">
                                Follow device settings ({resolvedTheme})
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chat Settings Tab */}
              <TabsContent value="chat" className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Chat Preferences</CardTitle>
                    <CardDescription>Configure AI model behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Temperature Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Temperature</Label>
                        <span className="text-sm text-muted-foreground">
                          {preferences.temperature.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Controls randomness: 0 = deterministic, 2 = very random
                      </p>
                      <Slider
                        value={[preferences.temperature]}
                        onValueChange={([value]) =>
                          setPreferences({ ...preferences, temperature: value })
                        }
                        min={0}
                        max={2}
                        step={0.1}
                        disabled={isLoadingPreferences}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Precise</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    {/* Max Tokens Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Max Tokens</Label>
                        <span className="text-sm text-muted-foreground">
                          {preferences.maxTokens}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum length of AI responses (100-4000)
                      </p>
                      <Slider
                        value={[preferences.maxTokens]}
                        onValueChange={([value]) =>
                          setPreferences({ ...preferences, maxTokens: value })
                        }
                        min={100}
                        max={4000}
                        step={100}
                        disabled={isLoadingPreferences}
                        className="w-full"
                      />
                    </div>

                    {/* Knowledge Base Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <Label className="text-sm font-medium">Use Knowledge Base by Default</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enable RAG mode automatically when starting new chats
                        </p>
                      </div>
                      <Switch
                        checked={preferences.useKnowledgeBase}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, useKnowledgeBase: checked })
                        }
                        disabled={isLoadingPreferences}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSavePreferences}
                        disabled={isLoadingPreferences || saveStatus === 'saving'}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                      </Button>
                      {saveStatus === 'success' && (
                        <p className="text-sm text-green-600">✓ Saved successfully</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Email Display */}
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email is used for authentication
                      </p>
                    </div>

                    {/* User ID Display */}
                    <div className="space-y-2">
                      <Label>User ID</Label>
                      <Input
                        value={user?.id || ''}
                        disabled
                        className="bg-muted font-mono text-xs"
                      />
                    </div>

                    {/* Account Created */}
                    <div className="space-y-2">
                      <Label>Account Created</Label>
                      <Input
                        value={user?.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Unknown'}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    {/* Session Info */}
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-sm font-medium">Session Status</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You are currently logged in
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
