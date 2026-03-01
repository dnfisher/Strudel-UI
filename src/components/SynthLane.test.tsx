import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SynthLane } from './SynthLane'
import { useStore } from '../store/useStore'
import { createSynthTrack } from '../lib/constants'

beforeEach(() => {
  useStore.setState({ tracks: [], selectedTrackId: null, isPlaying: false, bpm: 120 })
})

describe('SynthLane', () => {
  it('renders the track label', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SUPERSAW')).toBeInTheDocument()
  })

  it('renders SAW badge for supersaw', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SAW')).toBeInTheDocument()
  })

  it('renders SQ badge for square', () => {
    const track = createSynthTrack('square')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SQ')).toBeInTheDocument()
  })

  it('renders SIN badge for sine', () => {
    const track = createSynthTrack('sine')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SIN')).toBeInTheDocument()
  })

  it('renders TRI badge for triangle', () => {
    const track = createSynthTrack('triangle')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('TRI')).toBeInTheDocument()
  })

  it('renders 1344 piano roll cells (84 notes × 16 steps)', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    const cells = screen.getAllByTestId(/^synth-cell-/)
    expect(cells).toHaveLength(1344)
  })

  it('clicking a cell toggles the note in the store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    await user.click(screen.getByTestId('synth-cell-0-c4'))

    expect(useStore.getState().tracks[0].steps[0].notes).toContain('c4')
  })

  it('active cells have the track color as background', () => {
    const track = createSynthTrack('supersaw')
    track.steps[0].notes = ['c4']
    track.steps[0].active = true
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    const activeCell = screen.getByTestId('synth-cell-0-c4')
    expect(activeCell).toHaveStyle({ backgroundColor: track.color })
  })

  it('mute button toggles mute in the store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    await user.click(screen.getByTitle('Mute'))
    expect(useStore.getState().tracks[0].muted).toBe(true)
  })

  it('delete button removes the track', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    await user.click(screen.getByTitle('Remove track'))
    expect(useStore.getState().tracks).toHaveLength(0)
  })

  it('applies selected styles when isSelected is true', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    const { container } = render(<SynthLane track={track} isSelected={true} />)
    expect(container.firstChild).toHaveClass('ring-1')
  })
})
