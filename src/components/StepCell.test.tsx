import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepCell } from './StepCell'

function renderCell(overrides: Partial<Parameters<typeof StepCell>[0]> = {}) {
  const props = {
    active: false,
    color: '#3b82f6',
    beat: 0,
    muted: false,
    onClick: vi.fn(),
    ...overrides,
  }
  return { ...render(<StepCell {...props} />), onClick: props.onClick }
}

describe('StepCell', () => {
  it('renders as a button', () => {
    renderCell()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('aria-label includes step number (1-indexed) and "off" when inactive', () => {
    renderCell({ beat: 0, active: false })
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Step 1 off')
  })

  it('aria-label includes step number (1-indexed) and "on" when active', () => {
    renderCell({ beat: 3, active: true })
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Step 4 on')
  })

  it('applies backgroundColor style when active', () => {
    renderCell({ active: true, color: '#ef4444' })
    const btn = screen.getByRole('button')
    expect(btn.style.backgroundColor).toBe('rgb(239, 68, 68)')
  })

  it('has no backgroundColor style when inactive', () => {
    renderCell({ active: false })
    const btn = screen.getByRole('button')
    expect(btn.style.backgroundColor).toBe('')
  })

  it('applies reduced opacity when muted', () => {
    renderCell({ muted: true })
    expect(screen.getByRole('button').className).toContain('opacity-40')
  })

  it('does not apply reduced opacity when not muted', () => {
    renderCell({ muted: false })
    expect(screen.getByRole('button').className).not.toContain('opacity-40')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const { onClick } = renderCell()
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies downbeat styling (extra contrast) for beats 0, 4, 8, 12', () => {
    renderCell({ beat: 0, active: false })
    // Downbeats have bg-white/[0.06] class
    expect(screen.getByRole('button').className).toContain('bg-white/[0.06]')
  })

  it('applies lighter styling for non-downbeat inactive steps', () => {
    renderCell({ beat: 1, active: false })
    expect(screen.getByRole('button').className).toContain('bg-white/[0.03]')
  })
})
