/**
 * Keyboard Shortcuts Dialog Component
 * Displays available keyboard shortcuts
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useKeyboardShortcutListener } from '@/lib/hooks/useKeyboardShortcuts'
import { KEYBOARD_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts'
import { Command } from 'lucide-react'

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  useKeyboardShortcutListener('openShortcutsHelp', () => {
    setOpen(true)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to work faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && <span className="text-xs text-muted-foreground mx-1">+</span>}
                          <Badge variant="outline" className="font-mono">
                            {key}
                          </Badge>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4">
          Press <Badge variant="outline">Cmd/Ctrl</Badge> + <Badge variant="outline">/</Badge> anytime to see this help
        </div>
      </DialogContent>
    </Dialog>
  )
}
