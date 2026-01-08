/**
 * Unit Tests for useKeyboardShortcuts Hook
 */

import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts, useKeyboardShortcutListener } from '@/lib/hooks/useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance
  let dispatchEventSpy: jest.SpyInstance

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
    dispatchEventSpy.mockRestore()
  })

  it('should register keyboard event listener on mount', () => {
    renderHook(() => useKeyboardShortcuts({ enabled: true }))

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })

  it('should unregister keyboard event listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts({ enabled: true }))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })

  it('should not register listener when disabled', () => {
    renderHook(() => useKeyboardShortcuts({ enabled: false }))

    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  it('should handle Cmd/Ctrl+K shortcut', () => {
    renderHook(() => useKeyboardShortcuts({ enabled: true }))

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true, // Mac
    })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'openCommandPalette',
      })
    )
  })

  it('should handle Cmd/Ctrl+/ shortcut', () => {
    renderHook(() => useKeyboardShortcuts({ enabled: true }))

    const event = new KeyboardEvent('keydown', {
      key: '/',
      metaKey: true,
    })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'openShortcutsHelp',
      })
    )
  })

  it('should handle Escape shortcut', () => {
    renderHook(() => useKeyboardShortcuts({ enabled: true }))

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
    })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'closeModals',
      })
    )
  })

  it('should support custom shortcuts', () => {
    const customCallback = jest.fn()

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        shortcuts: [
          {
            key: 'q',
            ctrl: true,
            callback: customCallback,
          },
        ],
      })
    )

    const event = new KeyboardEvent('keydown', {
      key: 'q',
      ctrlKey: true,
    })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(customCallback).toHaveBeenCalled()
  })
})

describe('useKeyboardShortcutListener', () => {
  let addEventListenerSpy: jest.SpyInstance
  let removeEventListenerSpy: jest.SpyInstance

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('should listen for custom shortcut events', () => {
    const callback = jest.fn()

    renderHook(() => useKeyboardShortcutListener('openCommandPalette', callback))

    act(() => {
      window.dispatchEvent(new CustomEvent('openCommandPalette'))
    })

    expect(callback).toHaveBeenCalled()
  })

  it('should remove listener on unmount', () => {
    const callback = jest.fn()

    const { unmount } = renderHook(() =>
      useKeyboardShortcutListener('openCommandPalette', callback)
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'openCommandPalette',
      expect.any(Function)
    )
  })

  it('should update listener when event name changes', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    const { rerender } = renderHook(
      ({ eventName, callback }: { eventName: string; callback: jest.Mock }) =>
        useKeyboardShortcutListener(eventName, callback),
      {
        initialProps: {
          eventName: 'openCommandPalette',
          callback: callback1,
        },
      }
    )

    rerender({
      eventName: 'openShortcutsHelp',
      callback: callback2,
    })

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'openCommandPalette',
      expect.any(Function)
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'openShortcutsHelp',
      expect.any(Function)
    )
  })
})
