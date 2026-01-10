/**
 * File Icon Component
 * Displays appropriate icon based on file type
 */

import React from 'react'
import {
  FileText,
  FileJson,
  FileCode,
  File as FilePdf,
  FileSpreadsheet,
  Presentation as FilePresentation,
  Image,
  File,
  Archive,
} from 'lucide-react'

type FileSize = 'sm' | 'md' | 'lg'

interface FileIconProps {
  filename: string
  size?: FileSize
  className?: string
}

const sizeMap: Record<FileSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

function getFileIconComponent(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || ''

  // Text files
  if (['txt', 'md', 'rst', 'log'].includes(extension)) {
    return FileText
  }

  // Code files
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go'].includes(extension)) {
    return FileCode
  }

  // JSON
  if (extension === 'json') {
    return FileJson
  }

  // PDF
  if (extension === 'pdf') {
    return FilePdf
  }

  // Spreadsheets
  if (['csv', 'xls', 'xlsx'].includes(extension)) {
    return FileSpreadsheet
  }

  // Presentations
  if (['ppt', 'pptx'].includes(extension)) {
    return FilePresentation
  }

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return Image
  }

  // Archives
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(extension)) {
    return Archive
  }

  // Default
  return File
}

export function FileIcon({ filename, size = 'md', className }: FileIconProps) {
  const IconComponent = getFileIconComponent(filename)
  const sizeClass = sizeMap[size]

  return React.createElement(IconComponent, {
    className: `${sizeClass} ${className || 'text-muted-foreground'}`,
  })
}
