import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTrackButton } from './AddTrackButton'
import { useStore } from '../store/useStore'
import { DRUM_SOUNDS } from '../lib/constants'

beforeEach(() => {
  useStore.setState({ tracks: [], selectedTrackId: null, isPlaying: false, bpm: 120 })
})

describe('AddTrackButton', () => {
  it('renders the "+ Add Track" button', () => {
    render(<AddTrackButton />)
    expect(screen.getByText('+ Add Track')).toBeInTheDocument()
  })

  it('dropdown is closed by default', () => {
    render(<AddTrackButton />)
    expect(screen.queryByText('Drum')).not.toBeInTheDocument()
  })

  it('shows Drum and Synth options on first open', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.getByText('Drum')).toBeInTheDocument()
    expect(screen.getByText('Synth')).toBeInTheDocument()
  })

  it('shows drum sounds after clicking Drum', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    expect(screen.getByText('Kick')).toBeInTheDocument()
  })

  it('shows all drum sounds after clicking Drum', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    for (const sound of DRUM_SOUNDS) {
      expect(screen.getByText(sound.label)).toBeInTheDocument()
    }
  })

  it('shows synth sounds after clicking Synth', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Synth'))
    expect(screen.getByText('Supersaw')).toBeInTheDocument()
    expect(screen.getByText('Sine')).toBeInTheDocument()
    expect(screen.getByText('Square')).toBeInTheDocument()
    expect(screen.getByText('Triangle')).toBeInTheDocument()
  })

  it('toggles dropdown closed when button is clicked again', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.queryByText('Drum')).not.toBeInTheDocument()
  })

  it('adds a drum track when a drum sound is selected', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    await user.click(screen.getByText('Kick'))
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].sound).toBe('bd')
    expect(useStore.getState().tracks[0].type).toBe('drum')
  })

  it('adds a synth track when a synth sound is selected', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Synth'))
    await user.click(screen.getByText('Supersaw'))
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].synth).toBe('supersaw')
    expect(useStore.getState().tracks[0].type).toBe('synth')
  })

  it('closes dropdown after selecting a drum sound', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    await user.click(screen.getByText('Kick'))
    expect(screen.queryByText('Snare')).not.toBeInTheDocument()
  })

  it('closes dropdown after selecting a synth sound', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Synth'))
    await user.click(screen.getByText('Supersaw'))
    expect(screen.queryByText('Sine')).not.toBeInTheDocument()
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <AddTrackButton />
        <div data-testid="outside">outside</div>
      </div>
    )
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.getByText('Drum')).toBeInTheDocument()
    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByText('Drum')).not.toBeInTheDocument()
  })
})
