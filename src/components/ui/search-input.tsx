/**
 * Search Input Component
 * Enhanced search field with clear button
 */

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  disabled?: boolean
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  disabled = false,
  className,
}: SearchInputProps) {
  const handleClear = () => {
    onChange('')
    onClear?.()
  }

  return (
    <div className={`relative w-full ${className || ''}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
