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
    expect(screen.queryByText('Kick')).not.toBeInTheDocument()
  })

  it('opens dropdown when button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)

    await user.click(screen.getByText('+ Add Track'))
    expect(screen.getByText('Kick')).toBeInTheDocument()
  })

  it('shows all drum sounds in the dropdown', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)

    await user.click(screen.getByText('+ Add Track'))
    for (const sound of DRUM_SOUNDS) {
      expect(screen.getByText(sound.label)).toBeInTheDocument()
    }
  })

  it('shows the sound id alongside the label', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)

    await user.click(screen.getByText('+ Add Track'))
    // bd should be visible (the ID column)
    expect(screen.getByText('bd')).toBeInTheDocument()
  })

  it('toggles dropdown closed when button is clicked again', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)

    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.queryByText('Kick')).not.toBeInTheDocument()
  })

  it('adds a track when a sound is selected', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)

    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Kick'))

    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].sound).toBe('bd')
  })

  it('closes the dropdown after selecting a sound', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)

    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Kick'))

    expect(screen.queryByText('Snare')).not.toBeInTheDocument()
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
    expect(screen.getByText('Kick')).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByText('Kick')).not.toBeInTheDocument()
  })
})
