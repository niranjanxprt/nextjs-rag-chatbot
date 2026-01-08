/**
 * Unit Tests for StatCard Component
 */

import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/ui/stat-card'
import { Users } from 'lucide-react'

describe('StatCard Component', () => {
  it('should render label and value', () => {
    render(
      <StatCard
        label="Total Users"
        value={42}
      />
    )

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('should render string values', () => {
    render(
      <StatCard
        label="Status"
        value="Active"
      />
    )

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    render(
      <StatCard
        label="Users"
        value={100}
        icon={<Users data-testid="stat-icon" />}
      />
    )

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument()
  })

  it('should not render icon when not provided', () => {
    const { container } = render(
      <StatCard
        label="Users"
        value={100}
      />
    )

    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('should render upward trend with correct styling', () => {
    render(
      <StatCard
        label="Revenue"
        value="$10,000"
        trend={{
          value: 15,
          direction: 'up',
          period: 'from last month',
        }}
      />
    )

    expect(screen.getByText(/\+15%/)).toBeInTheDocument()
    expect(screen.getByText(/from last month/)).toBeInTheDocument()
  })

  it('should render downward trend with correct styling', () => {
    render(
      <StatCard
        label="Errors"
        value={5}
        trend={{
          value: 10,
          direction: 'down',
          period: 'from last period',
        }}
      />
    )

    expect(screen.getByText(/-10%/)).toBeInTheDocument()
    expect(screen.getByText(/from last period/)).toBeInTheDocument()
  })

  it('should render trend without period text', () => {
    render(
      <StatCard
        label="Growth"
        value="25%"
        trend={{
          value: 5,
          direction: 'up',
        }}
      />
    )

    expect(screen.getByText(/\+5%/)).toBeInTheDocument()
    expect(screen.getByText(/from last period/)).toBeInTheDocument()
  })

  it('should not render trend when not provided', () => {
    render(
      <StatCard
        label="Total"
        value={100}
      />
    )

    expect(screen.queryByText(/from last/)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <StatCard
        label="Test"
        value={1}
        className="custom-stat-class"
      />
    )

    const cardElement = container.firstChild
    expect(cardElement).toHaveClass('custom-stat-class')
  })

  it('should apply custom value className', () => {
    const { container } = render(
      <StatCard
        label="Test"
        value={100}
        valueClassName="text-red-600"
      />
    )

    const valueElement = screen.getByText('100')
    expect(valueElement).toHaveClass('text-red-600')
  })

  it('should render within a Card component', () => {
    const { container } = render(
      <StatCard
        label="Test Stat"
        value={99}
      />
    )

    // Check for card structure
    const header = container.querySelector('[class*="CardHeader"]')
    expect(header).toBeInTheDocument()
  })

  it('should have proper semantic HTML', () => {
    render(
      <StatCard
        label="Metric"
        value={42}
      />
    )

    const label = screen.getByText('Metric')
    expect(label.tagName).toMatch(/H[1-6]/)
  })

  it('should display multiple stats without conflicts', () => {
    const { container } = render(
      <div>
        <StatCard label="Users" value={100} />
        <StatCard label="Posts" value={50} />
        <StatCard label="Comments" value={200} />
      </div>
    )

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Posts')).toBeInTheDocument()
    expect(screen.getByText('Comments')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })
})
