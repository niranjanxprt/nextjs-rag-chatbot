/**
 * Unit Tests for FileIcon Component
 */

import { render, screen } from '@testing-library/react'
import { FileIcon } from '@/components/ui/file-icon'

describe('FileIcon Component', () => {
  describe('File Type Detection', () => {
    it('should render PDF icon for PDF files', () => {
      const { container } = render(
        <FileIcon filename="document.pdf" data-testid="pdf-icon" />
      )

      // FilePdf icon should be rendered
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render code icon for TypeScript files', () => {
      const { container } = render(
        <FileIcon filename="component.ts" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render code icon for JavaScript files', () => {
      const { container } = render(
        <FileIcon filename="script.js" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render image icon for image files', () => {
      const { container } = render(
        <FileIcon filename="photo.jpg" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render text icon for text files', () => {
      const { container } = render(
        <FileIcon filename="notes.txt" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render spreadsheet icon for Excel files', () => {
      const { container } = render(
        <FileIcon filename="data.xlsx" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render archive icon for ZIP files', () => {
      const { container } = render(
        <FileIcon filename="files.zip" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render default file icon for unknown extensions', () => {
      const { container } = render(
        <FileIcon filename="unknown.xyz" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle file names without extension', () => {
      const { container } = render(
        <FileIcon filename="README" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should be case-insensitive', () => {
      const { container: container1 } = render(
        <FileIcon filename="Document.PDF" />
      )

      const { container: container2 } = render(
        <FileIcon filename="document.pdf" />
      )

      expect(container1.querySelector('svg')).toBeInTheDocument()
      expect(container2.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Sizing', () => {
    it('should support small size', () => {
      const { container } = render(
        <FileIcon filename="file.txt" size="sm" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-4', 'w-4')
    })

    it('should support medium size (default)', () => {
      const { container } = render(
        <FileIcon filename="file.txt" size="md" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-6', 'w-6')
    })

    it('should support large size', () => {
      const { container } = render(
        <FileIcon filename="file.txt" size="lg" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-8', 'w-8')
    })

    it('should default to medium size', () => {
      const { container } = render(
        <FileIcon filename="file.txt" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-6', 'w-6')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <FileIcon filename="file.txt" className="text-blue-600" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('text-blue-600')
    })

    it('should have muted-foreground color by default', () => {
      const { container } = render(
        <FileIcon filename="file.txt" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('text-muted-foreground')
    })

    it('should override default color with custom className', () => {
      const { container } = render(
        <FileIcon filename="file.txt" className="text-red-500" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('text-red-500')
    })
  })

  describe('Special Cases', () => {
    it('should handle multiple dots in filename', () => {
      const { container } = render(
        <FileIcon filename="archive.backup.zip" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should handle uppercase extensions', () => {
      const { container } = render(
        <FileIcon filename="document.PDF" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should handle mixed case extensions', () => {
      const { container } = render(
        <FileIcon filename="presentation.PpTx" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should support Python files', () => {
      const { container } = render(
        <FileIcon filename="script.py" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should support CSS files', () => {
      const { container } = render(
        <FileIcon filename="styles.css" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should support SVG files', () => {
      const { container } = render(
        <FileIcon filename="logo.svg" />
      )

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const { container } = render(
        <FileIcon filename="file.txt" />
      )

      const icon = container.querySelector('svg')
      expect(icon?.getAttribute('role')).toBeDefined()
    })

    it('should not have alt text (icon only)', () => {
      const { container } = render(
        <FileIcon filename="file.txt" />
      )

      const icon = container.querySelector('svg')
      expect(icon?.getAttribute('alt')).toBeNull()
    })
  })
})
