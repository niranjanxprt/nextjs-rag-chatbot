/**
 * Unit Tests for SearchInput Component
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '@/components/ui/search-input'

describe('SearchInput Component', () => {
  it('should render input with placeholder', () => {
    render(
      <SearchInput
        value=""
        onChange={jest.fn()}
        placeholder="Search items..."
      />
    )

    const input = screen.getByPlaceholderText('Search items...')
    expect(input).toBeInTheDocument()
  })

  it('should use default placeholder when not provided', () => {
    render(
      <SearchInput
        value=""
        onChange={jest.fn()}
      />
    )

    const input = screen.getByPlaceholderText('Search...')
    expect(input).toBeInTheDocument()
  })

  it('should display current value in input', () => {
    render(
      <SearchInput
        value="test search"
        onChange={jest.fn()}
      />
    )

    const input = screen.getByDisplayValue('test search')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange when typing', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(
      <SearchInput
        value=""
        onChange={handleChange}
      />
    )

    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'hello')

    expect(handleChange).toHaveBeenCalledWith('h')
    expect(handleChange).toHaveBeenCalledWith('hello')
    expect(handleChange).toHaveBeenCalledTimes(5)
  })

  it('should show clear button when value is not empty', () => {
    render(
      <SearchInput
        value="search term"
        onChange={jest.fn()}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('should not show clear button when value is empty', () => {
    render(
      <SearchInput
        value=""
        onChange={jest.fn()}
      />
    )

    const clearButton = screen.queryByRole('button', { name: /clear search/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should clear value when clear button clicked', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <SearchInput
        value="search term"
        onChange={handleChange}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    expect(handleChange).toHaveBeenCalledWith('')

    // Re-render with empty value
    rerender(
      <SearchInput
        value=""
        onChange={handleChange}
      />
    )

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })

  it('should call onClear callback when clear button clicked', async () => {
    const handleChange = jest.fn()
    const handleClear = jest.fn()
    const user = userEvent.setup()

    render(
      <SearchInput
        value="search term"
        onChange={handleChange}
        onClear={handleClear}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    expect(handleChange).toHaveBeenCalledWith('')
    expect(handleClear).toHaveBeenCalled()
  })

  it('should support disabled state', () => {
    render(
      <SearchInput
        value="search"
        onChange={jest.fn()}
        disabled={true}
      />
    )

    const input = screen.getByDisplayValue('search')
    expect(input).toBeDisabled()
  })

  it('should not allow typing when disabled', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(
      <SearchInput
        value=""
        onChange={handleChange}
        disabled={true}
      />
    )

    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'test')

    // Input should not register new characters when disabled
    expect(input).not.toHaveValue('test')
  })

  it('should disable clear button when disabled', () => {
    render(
      <SearchInput
        value="search"
        onChange={jest.fn()}
        disabled={true}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeDisabled()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <SearchInput
        value=""
        onChange={jest.fn()}
        className="custom-search-class"
      />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-search-class')
  })

  it('should render search icon', () => {
    const { container } = render(
      <SearchInput
        value=""
        onChange={jest.fn()}
      />
    )

    const icon = container.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('should have proper semantic structure', () => {
    const { container } = render(
      <SearchInput
        value=""
        onChange={jest.fn()}
      />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('relative')

    const input = screen.getByPlaceholderText('Search...')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should handle rapid value changes', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <SearchInput
        value=""
        onChange={handleChange}
      />
    )

    const input = screen.getByPlaceholderText('Search...')

    // Type multiple characters rapidly
    await user.type(input, 'hello world')

    // Simulate value updates
    rerender(
      <SearchInput
        value="hello world"
        onChange={handleChange}
      />
    )

    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('hello world')
  })

  it('should handle clearing multiple times', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <SearchInput
        value="first search"
        onChange={handleChange}
      />
    )

    // Clear first time
    let clearButton = screen.getByRole('button')
    await user.click(clearButton)

    rerender(
      <SearchInput
        value=""
        onChange={handleChange}
      />
    )

    expect(handleChange).toHaveBeenCalledWith('')

    // Add new search
    const input = screen.getByPlaceholderText('Search...')
    await user.type(input, 'second search')

    rerender(
      <SearchInput
        value="second search"
        onChange={handleChange}
      />
    )

    // Clear again
    clearButton = screen.getByRole('button')
    await user.click(clearButton)

    expect(handleChange).toHaveBeenCalledWith('')
  })
})
