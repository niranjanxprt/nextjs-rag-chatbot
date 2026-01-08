/**
 * Unit Tests for EmptyState Component
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'

describe('EmptyState Component', () => {
  it('should render title and description', () => {
    render(
      <EmptyState
        title="No items"
        description="You haven't created any items yet"
      />
    )

    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText("You haven't created any items yet")).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    const { container } = render(
      <EmptyState
        icon={<FileText data-testid="empty-icon" />}
        title="No files"
        description="Upload some files"
      />
    )

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
  })

  it('should not render icon when not provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Create something new"
      />
    )

    const container = screen.getByText('No items').parentElement
    expect(container?.querySelector('svg')).not.toBeInTheDocument()
  })

  it('should render action button when provided', () => {
    const handleClick = jest.fn()

    render(
      <EmptyState
        title="No items"
        description="Create one now"
        action={{
          label: 'Create Item',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByText('Create Item')
    expect(button).toBeInTheDocument()
  })

  it('should call action callback when button clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()

    render(
      <EmptyState
        title="No items"
        description="Create one now"
        action={{
          label: 'Create',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByText('Create')
    await user.click(button)

    expect(handleClick).toHaveBeenCalled()
  })

  it('should not render action when not provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Nothing to do"
      />
    )

    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })

  it('should support custom className', () => {
    const { container } = render(
      <EmptyState
        title="Empty"
        description="Test"
        className="custom-class"
      />
    )

    const emptyState = container.firstChild
    expect(emptyState).toHaveClass('custom-class')
  })

  it('should support action button variants', () => {
    const { rerender } = render(
      <EmptyState
        title="Empty"
        description="Test"
        action={{
          label: 'Action',
          onClick: jest.fn(),
          variant: 'secondary',
        }}
      />
    )

    let button = screen.getByText('Action')
    expect(button).toHaveClass('bg-secondary')

    rerender(
      <EmptyState
        title="Empty"
        description="Test"
        action={{
          label: 'Action',
          onClick: jest.fn(),
          variant: 'outline',
        }}
      />
    )

    button = screen.getByText('Action')
    expect(button).toHaveClass('border')
  })

  it('should have proper accessibility attributes', () => {
    const { container } = render(
      <EmptyState
        title="No results"
        description="Try a different search"
        action={{
          label: 'Clear Search',
          onClick: jest.fn(),
        }}
      />
    )

    const heading = screen.getByText('No results')
    expect(heading.tagName).toBe('H3')

    const button = screen.getByText('Clear Search')
    expect(button).toBeVisible()
  })
})
