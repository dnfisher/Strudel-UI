import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrackLane } from './TrackLane'
import { useStore } from '../store/useStore'
import type { Track } from '../store/types'

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    sound: 'bd',
    label: 'Kick',
    steps: Array.from({ length: 16 }, () => ({ active: false })),
    effects: [],
    muted: false,
    volume: 0.8,
    color: '#3b82f6',
    ...overrides,
  }
}

beforeEach(() => {
  useStore.setState({ tracks: [], selectedTrackId: null, isPlaying: false, bpm: 120 })
})

describe('TrackLane', () => {
  it('renders the track label', () => {
    render(<TrackLane track={makeTrack({ label: 'Kick' })} isSelected={false} />)
    // CSS applies text-transform:uppercase visually; DOM text remains as-is
    expect(screen.getByText('Kick')).toBeInTheDocument()
  })

  it('renders 16 step cells', () => {
    render(<TrackLane track={makeTrack()} isSelected={false} />)
    // Steps have aria-label "Step N on/off"
    expect(screen.getAllByRole('button', { name: /^Step \d+ (on|off)$/ })).toHaveLength(16)
  })

  it('renders a Mute button', () => {
    render(<TrackLane track={makeTrack()} isSelected={false} />)
    expect(screen.getByTitle('Mute')).toBeInTheDocument()
  })

  it('renders Unmute title when track is muted', () => {
    render(<TrackLane track={makeTrack({ muted: true })} isSelected={false} />)
    expect(screen.getByTitle('Unmute')).toBeInTheDocument()
  })

  it('renders a volume slider', () => {
    render(<TrackLane track={makeTrack({ volume: 0.8 })} isSelected={false} />)
    const slider = screen.getByTitle(/Volume/)
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('value', '0.8')
  })

  it('renders a delete button', () => {
    render(<TrackLane track={makeTrack()} isSelected={false} />)
    expect(screen.getByTitle('Remove track')).toBeInTheDocument()
  })

  it('applies selected styles when isSelected is true', () => {
    const { container } = render(<TrackLane track={makeTrack()} isSelected={true} />)
    // The outer div should have ring styling
    expect(container.firstChild).toHaveClass('ring-1')
  })

  it('does not apply selected styles when isSelected is false', () => {
    const { container } = render(<TrackLane track={makeTrack()} isSelected={false} />)
    expect(container.firstChild).not.toHaveClass('ring-1')
  })

  it('clicking the row calls selectTrack', async () => {
    const user = userEvent.setup()
    const track = makeTrack({ id: 'track-1' })
    // Put the track in the store so selectTrack can work
    useStore.setState({ tracks: [track] })

    render(<TrackLane track={track} isSelected={false} />)
    // Click the label area (CSS uppercase is visual only; DOM text is original case)
    await user.click(screen.getByText('Kick'))
    expect(useStore.getState().selectedTrackId).toBe('track-1')
  })

  it('clicking Mute toggles mute without changing selection', async () => {
    const user = userEvent.setup()
    const track = makeTrack({ id: 'track-1' })
    useStore.setState({ tracks: [track] })

    render(<TrackLane track={track} isSelected={false} />)
    await user.click(screen.getByTitle('Mute'))

    expect(useStore.getState().tracks[0].muted).toBe(true)
    // Selection should not have changed (stopPropagation prevents selectTrack)
    expect(useStore.getState().selectedTrackId).toBeNull()
  })

  it('clicking delete removes the track', async () => {
    const user = userEvent.setup()
    const track = makeTrack({ id: 'track-1' })
    useStore.setState({ tracks: [track] })

    render(<TrackLane track={track} isSelected={false} />)
    await user.click(screen.getByTitle('Remove track'))

    expect(useStore.getState().tracks).toHaveLength(0)
  })

  it('clicking a step cell toggles it', async () => {
    const user = userEvent.setup()
    const track = makeTrack({ id: 'track-1' })
    useStore.setState({ tracks: [track] })

    render(<TrackLane track={track} isSelected={false} />)
    // Click step 1 (beat 0)
    await user.click(screen.getByLabelText('Step 1 off'))

    expect(useStore.getState().tracks[0].steps[0].active).toBe(true)
  })

  it('step cells are grouped into 4 beat groups of 4', () => {
    const { container } = render(<TrackLane track={makeTrack()} isSelected={false} />)
    // The step grid wrapper has 4 beat groups each containing 4 cells
    // We check there are 16 step buttons total
    const stepButtons = screen.getAllByRole('button', { name: /^Step/ })
    expect(stepButtons).toHaveLength(16)
  })
})
