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
  onPatternToggle?: ReturnType<typeof vi.fn>
  onPatternChange?: ReturnType<typeof vi.fn>
}) {
  const onToggle = handlers?.onToggle ?? vi.fn()
  const onChange = handlers?.onChange ?? vi.fn()
  const onPatternToggle = handlers?.onPatternToggle ?? vi.fn()
  const onPatternChange = handlers?.onPatternChange ?? vi.fn()
  const effect = makeEffect(effectOverrides)
  render(
    <EffectSlider
      effect={effect}
      trackId="track-1"
      onToggle={onToggle}
      onChange={onChange}
      onPatternToggle={onPatternToggle}
      onPatternChange={onPatternChange}
    />
  )
  return { onToggle, onChange, onPatternToggle, onPatternChange, effect }
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
      expect(screen.getByTitle('Disable')).toHaveTextContent('✓')
    })

    it('shows nothing when disabled', () => {
      renderSlider({ enabled: false })
      expect(screen.getByTitle('Enable')).toHaveTextContent('')
    })

    it('calls onToggle with trackId and param when clicked', async () => {
      const user = userEvent.setup()
      const { onToggle } = renderSlider({ param: 'room' })
      await user.click(screen.getByTitle('Enable'))
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

describe('pattern mode', () => {
  it('renders a ~ toggle button', () => {
    renderSlider()
    expect(screen.getByTitle('Pattern mode')).toBeInTheDocument()
  })

  it('calls onPatternToggle when ~ button is clicked', async () => {
    const user = userEvent.setup()
    const onPatternToggle = vi.fn()
    const effect = makeEffect({ param: 'lpf' })
    render(
      <EffectSlider
        effect={effect}
        trackId="track-1"
        onToggle={vi.fn()}
        onChange={vi.fn()}
        onPatternToggle={onPatternToggle}
        onPatternChange={vi.fn()}
      />
    )
    await user.click(screen.getByTitle('Pattern mode'))
    expect(onPatternToggle).toHaveBeenCalledWith('track-1', 'lpf')
  })

  it('shows text input instead of slider when patternMode is true', () => {
    renderSlider({ patternMode: true, pattern: '200 800' })
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows slider when patternMode is false', () => {
    renderSlider({ patternMode: false })
    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls onPatternChange when text input changes', () => {
    const onPatternChange = vi.fn()
    const effect = makeEffect({ patternMode: true, pattern: '200' })
    render(
      <EffectSlider
        effect={effect}
        trackId="track-1"
        onToggle={vi.fn()}
        onChange={vi.fn()}
        onPatternToggle={vi.fn()}
        onPatternChange={onPatternChange}
      />
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '200 800' } })
    expect(onPatternChange).toHaveBeenCalledWith('track-1', effect.param, '200 800')
  })
})
