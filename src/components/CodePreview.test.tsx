import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodePreview } from './CodePreview'

describe('CodePreview', () => {
  it('renders the provided code in a pre element', () => {
    render(<CodePreview code='s("bd")' />)
    expect(screen.getByText('s("bd")')).toBeInTheDocument()
  })

  it('shows placeholder text when code is empty', () => {
    render(<CodePreview code="" />)
    expect(screen.getByText('// Add some steps to get started!')).toBeInTheDocument()
  })

  it('is open by default (code visible)', () => {
    render(<CodePreview code='s("bd")' />)
    expect(screen.getByText('s("bd")')).toBeVisible()
  })

  it('collapses (hides code) when header is clicked', async () => {
    const user = userEvent.setup()
    render(<CodePreview code='s("bd")' />)

    await user.click(screen.getByText('Generated Strudel Code'))
    expect(screen.queryByText('s("bd")')).not.toBeInTheDocument()
  })

  it('expands again when header is clicked a second time', async () => {
    const user = userEvent.setup()
    render(<CodePreview code='s("bd")' />)

    await user.click(screen.getByText('Generated Strudel Code'))
    await user.click(screen.getByText('Generated Strudel Code'))
    expect(screen.getByText('s("bd")')).toBeInTheDocument()
  })

  it('shows the Copy button when open', () => {
    render(<CodePreview code='s("bd")' />)
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('hides the Copy button when collapsed', async () => {
    const user = userEvent.setup()
    render(<CodePreview code='s("bd")' />)

    await user.click(screen.getByText('Generated Strudel Code'))
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
  })

  it('shows ▼ indicator when open', () => {
    render(<CodePreview code='s("bd")' />)
    expect(screen.getByText('▼')).toBeInTheDocument()
  })

  it('shows ▶ indicator when collapsed', async () => {
    const user = userEvent.setup()
    render(<CodePreview code='s("bd")' />)

    await user.click(screen.getByText('Generated Strudel Code'))
    expect(screen.getByText('▶')).toBeInTheDocument()
  })

  describe('copy button', () => {
    it('shows "Copied!" feedback after clicking Copy', async () => {
      const user = userEvent.setup()
      render(<CodePreview code='s("bd")' />)

      await user.click(screen.getByText('Copy'))
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    it('reverts to "Copy" text after 2 seconds', async () => {
      // Use fireEvent instead of userEvent to avoid fake-timer / async conflicts
      vi.useFakeTimers()
      try {
        render(<CodePreview code='s("bd")' />)

        await act(async () => {
          fireEvent.click(screen.getByText('Copy'))
        })
        expect(screen.getByText('Copied!')).toBeInTheDocument()

        await act(async () => {
          await vi.runAllTimersAsync()
        })
        expect(screen.getByText('Copy')).toBeInTheDocument()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
