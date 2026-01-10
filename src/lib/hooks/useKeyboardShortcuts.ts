/**
 * Keyboard Shortcuts Hook
 * Manages global keyboard shortcuts for the application
 */

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  callback: () => void
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  shortcuts?: ShortcutConfig[]
}

/**
 * Hook for managing keyboard shortcuts
 * Built-in shortcuts:
 * - Cmd/Ctrl+K: Open command palette
 * - Cmd/Ctrl+/: Show keyboard shortcuts help
 * - Cmd/Ctrl+Shift+E: New conversation
 * - Cmd/Ctrl+,: Settings
 * - Esc: Close modals
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, shortcuts = [] } = options
  const router = useRouter()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierKey = isMac ? event.metaKey : event.ctrlKey

      // Cmd/Ctrl+K: Open command palette
      if (modifierKey && event.key === 'k') {
        event.preventDefault()
        const event_ = new CustomEvent('openCommandPalette')
        window.dispatchEvent(event_)
      }

      // Cmd/Ctrl+/: Show keyboard shortcuts help
      if (modifierKey && event.key === '/') {
        event.preventDefault()
        const event_ = new CustomEvent('openShortcutsHelp')
        window.dispatchEvent(event_)
      }

      // Cmd/Ctrl+Shift+E: New conversation
      if (modifierKey && event.shiftKey && event.key === 'e') {
        event.preventDefault()
        const event_ = new CustomEvent('newConversation')
        window.dispatchEvent(event_)
      }

      // Cmd/Ctrl+,: Settings
      if (modifierKey && event.key === ',') {
        event.preventDefault()
        router.push('/settings')
      }

      // Escape: Close modals (handled by individual components)
      if (event.key === 'Escape') {
        const event_ = new CustomEvent('closeModals')
        window.dispatchEvent(event_)
      }

      // Custom shortcuts
      shortcuts.forEach((shortcut) => {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const matchesCtrl = shortcut.ctrl ? modifierKey : !modifierKey
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey
        const matchesMeta = shortcut.meta ? event.metaKey : !event.metaKey

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
          event.preventDefault()
          shortcut.callback()
        }
      })
    },
    [enabled, shortcuts, router]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])

  return {
    handleKeyDown,
  }
}

/**
 * Hook to listen for keyboard shortcuts events
 */
export function useKeyboardShortcutListener(
  eventName: string,
  callback: () => void
) {
  useEffect(() => {
    window.addEventListener(eventName, callback)
    return () => window.removeEventListener(eventName, callback)
  }, [eventName, callback])
}

/**
 * Keyboard shortcuts help data
 */
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      {
        keys: ['Cmd/Ctrl', 'K'],
        description: 'Open command palette',
      },
      {
        keys: ['Cmd/Ctrl', ','],
        description: 'Go to settings',
      },
    ],
  },
  {
    category: 'Chat',
    shortcuts: [
      {
        keys: ['Cmd/Ctrl', 'Shift', 'E'],
        description: 'Start new conversation',
      },
      {
        keys: ['Enter'],
        description: 'Send message',
      },
      {
        keys: ['Shift', 'Enter'],
        description: 'New line',
      },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      {
        keys: ['Cmd/Ctrl', '/'],
        description: 'Show keyboard shortcuts',
      },
      {
        keys: ['Esc'],
        description: 'Close modal or cancel action',
      },
    ],
  },
]
