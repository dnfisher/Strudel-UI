import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffectSlider } from './EffectSlider'
import type { Effect } from '../store/types'

function makeEffect(overrides: Partial<Effect> = {}): Effect {
  return {
    name: 'Reverb',
    param: 'room',
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    enabled: false,
    ...overrides,
  }
}

function renderSlider(effectOverrides: Partial<Effect> = {}, handlers?: {
  onToggle?: ReturnType<typeof vi.fn>
  onChange?: ReturnType<typeof vi.fn>
}) {
  const onToggle = handlers?.onToggle ?? vi.fn()
  const onChange = handlers?.onChange ?? vi.fn()
  const effect = makeEffect(effectOverrides)
  render(
    <EffectSlider
      effect={effect}
      trackId="track-1"
      onToggle={onToggle}
      onChange={onChange}
    />
  )
  return { onToggle, onChange, effect }
}

describe('EffectSlider', () => {
  it('shows the effect name', () => {
    renderSlider({ name: 'Reverb' })
    expect(screen.getByText('Reverb')).toBeInTheDocument()
  })

  it('renders a slider with correct min, max, step and value', () => {
    renderSlider({ min: 0, max: 1, step: 0.05, value: 0.5 })
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '1')
    expect(slider).toHaveAttribute('step', '0.05')
    expect(slider).toHaveAttribute('value', '0.5')
  })

  describe('toggle button', () => {
    it('shows ✓ when enabled', () => {
      renderSlider({ enabled: true })
      expect(screen.getByRole('button')).toHaveTextContent('✓')
    })

    it('shows nothing when disabled', () => {
      renderSlider({ enabled: false })
      expect(screen.getByRole('button')).toHaveTextContent('')
    })

    it('calls onToggle with trackId and param when clicked', async () => {
      const user = userEvent.setup()
      const { onToggle } = renderSlider({ param: 'room' })
      await user.click(screen.getByRole('button'))
      expect(onToggle).toHaveBeenCalledWith('track-1', 'room')
    })
  })

  describe('display value formatting', () => {
    it('shows Hz for lpf param', () => {
      renderSlider({ param: 'lpf', value: 5000 })
      expect(screen.getByText('5000 Hz')).toBeInTheDocument()
    })

    it('shows "L X%" for pan value below 0.45', () => {
      renderSlider({ param: 'pan', value: 0 })
      expect(screen.getByText('L 100%')).toBeInTheDocument()
    })

    it('shows "R X%" for pan value above 0.55', () => {
      renderSlider({ param: 'pan', value: 1 })
      expect(screen.getByText('R 100%')).toBeInTheDocument()
    })

    it('shows "Center" for pan values between 0.45 and 0.55', () => {
      renderSlider({ param: 'pan', value: 0.5 })
      expect(screen.getByText('Center')).toBeInTheDocument()
    })

    it('shows decimal for other params', () => {
      renderSlider({ param: 'room', value: 0.3 })
      expect(screen.getByText('0.30')).toBeInTheDocument()
    })

    it('shows decimal for delay param', () => {
      renderSlider({ param: 'delay', value: 0.75 })
      expect(screen.getByText('0.75')).toBeInTheDocument()
    })
  })

  describe('slider interaction', () => {
    it('calls onChange when slider value changes', () => {
      const onChange = vi.fn()
      renderSlider({ param: 'room', value: 0.5, min: 0, max: 1, step: 0.05 }, { onChange })

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0.55' } })
      expect(onChange).toHaveBeenCalledWith('track-1', 'room', 0.55)
    })
  })
})
