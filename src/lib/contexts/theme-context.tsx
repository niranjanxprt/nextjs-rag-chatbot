/**
 * Theme Context Provider
 *
 * Manages dark/light/system theme switching
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// =============================================================================
// Types
// =============================================================================

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

// =============================================================================
// Context & Provider
// =============================================================================

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    setMounted(true)

    // Get stored theme or default to 'system'
    const storedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    setThemeState(storedTheme)

    // Apply theme on mount
    applyTheme(storedTheme)

    // Listen for system theme changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (storedTheme === 'system') {
        applyTheme('system')
      }
    }

    darkModeQuery.addEventListener('change', handleChange)

    return () => {
      darkModeQuery.removeEventListener('change', handleChange)
    }
  }, [])

  function applyTheme(theme: Theme) {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    setResolvedTheme(isDark ? 'dark' : 'light')

    // Update DOM
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Update CSS variable for Tailwind
    root.style.colorScheme = isDark ? 'dark' : 'light'
  }

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// =============================================================================
// Hook
// =============================================================================

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
