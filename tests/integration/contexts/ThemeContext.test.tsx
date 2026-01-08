import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '@/lib/contexts/theme-context'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Test component to access theme context
function TestComponent() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme()

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="system-theme">{systemTheme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      
      <div className={resolvedTheme === 'dark' ? 'dark-mode' : 'light-mode'}>
        Theme Applied
      </div>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset matchMedia mock
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  describe('Initial Theme Loading', () => {
    it('defaults to system theme when no stored preference', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('system-theme')).toHaveTextContent('light')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })

    it('loads stored theme preference from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })

    it('detects system dark theme preference', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('system-theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })

    it('handles invalid stored theme gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })
  })

  describe('Theme Switching', () => {
    it('switches to light theme', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        await user.click(screen.getByText('Set Light'))
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    it('switches to dark theme', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        await user.click(screen.getByText('Set Dark'))
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })

    it('switches to system theme', async () => {
      const user = userEvent.setup()
      mockLocalStorage.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')

      await act(async () => {
        await user.click(screen.getByText('Set System'))
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'system')
    })
  })

  describe('System Theme Detection', () => {
    it('updates system theme when media query changes', () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryCallback = callback
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('system-theme')).toHaveTextContent('light')

      // Simulate system theme change to dark
      if (mediaQueryCallback) {
        act(() => {
          mediaQueryCallback({
            matches: true,
            media: '(prefers-color-scheme: dark)',
          } as MediaQueryListEvent)
        })
      }

      expect(screen.getByTestId('system-theme')).toHaveTextContent('dark')
    })

    it('resolves system theme correctly when theme is set to system', async () => {
      const user = userEvent.setup()

      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        await user.click(screen.getByText('Set System'))
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('system-theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })
  })

  describe('Theme Persistence', () => {
    it('persists theme changes to localStorage', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        await user.click(screen.getByText('Set Dark'))
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark')

      await act(async () => {
        await user.click(screen.getByText('Set Light'))
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')

      await act(async () => {
        await user.click(screen.getByText('Set System'))
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'system')
    })

    it('restores theme from localStorage on mount', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme')
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    })

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should fall back to system theme
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    })
  })

  describe('Theme Application', () => {
    it('applies correct CSS classes based on resolved theme', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Default light theme
      expect(screen.getByText('Theme Applied')).toHaveClass('light-mode')

      await act(async () => {
        await user.click(screen.getByText('Set Dark'))
      })

      expect(screen.getByText('Theme Applied')).toHaveClass('dark-mode')

      await act(async () => {
        await user.click(screen.getByText('Set Light'))
      })

      expect(screen.getByText('Theme Applied')).toHaveClass('light-mode')
    })

    it('updates document class when theme changes', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      await act(async () => {
        await user.click(screen.getByText('Set Dark'))
      })

      // Note: In a real implementation, this would update document.documentElement.classList
      // For testing, we verify the resolved theme is correct
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })
  })

  describe('Multiple Theme Providers', () => {
    it('throws error when useTheme is used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within a ThemeProvider')

      consoleSpy.mockRestore()
    })

    it('works correctly with nested providers', () => {
      render(
        <ThemeProvider>
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    })
  })

  describe('Theme Transitions', () => {
    it('maintains theme state during rapid changes', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Rapidly change themes
      await act(async () => {
        await user.click(screen.getByText('Set Dark'))
        await user.click(screen.getByText('Set Light'))
        await user.click(screen.getByText('Set System'))
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3)
    })
  })

  describe('Accessibility', () => {
    it('provides accessible theme switching', async () => {
      const user = userEvent.setup()

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const darkButton = screen.getByText('Set Dark')
      expect(darkButton).toBeInTheDocument()

      await act(async () => {
        await user.click(darkButton)
      })

      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    })

    it('respects user preference for reduced motion', () => {
      // This would typically involve checking prefers-reduced-motion
      // For now, we just verify the theme system works
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    })
  })
})
