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
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByText('SUPERSAW')).toBeInTheDocument()
  })

  it('renders SAW badge for supersaw', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByText('SAW')).toBeInTheDocument()
  })

  it('renders SQ badge for square', () => {
    const track = createSynthTrack('square')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByText('SQ')).toBeInTheDocument()
  })

  it('renders SIN badge for sine', () => {
    const track = createSynthTrack('sine')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByText('SIN')).toBeInTheDocument()
  })

  it('renders TRI badge for triangle', () => {
    const track = createSynthTrack('triangle')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByText('TRI')).toBeInTheDocument()
  })

  it('renders 192 piano roll cells (12 notes × 16 steps) for the current octave', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    const cells = screen.getAllByTestId(/^synth-cell-/)
    expect(cells).toHaveLength(192)
  })

  it('clicking a cell toggles the note in the store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)

    await user.click(screen.getByTestId('synth-cell-0-c3'))

    expect(useStore.getState().tracks[0].steps[0].notes).toContain('c3')
  })

  it('active cells have the track color as background', () => {
    const track = createSynthTrack('supersaw')
    track.steps[0].notes = ['c3']
    track.steps[0].active = true
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)

    const activeCell = screen.getByTestId('synth-cell-0-c3')
    expect(activeCell).toHaveStyle({ backgroundColor: track.color })
  })

  it('mute button toggles mute in the store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)

    await user.click(screen.getByTitle('Mute'))
    expect(useStore.getState().tracks[0].muted).toBe(true)
  })

  it('delete button removes the track', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)

    await user.click(screen.getByTitle('Remove track'))
    expect(useStore.getState().tracks).toHaveLength(0)
  })

  it('applies selected styles when isSelected is true', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    const { container } = render(<SynthLane track={track} isSelected={true} activeStep={null} />)
    expect(container.firstChild).toHaveClass('ring-1')
  })
})

describe('collapse', () => {
  it('renders a collapse toggle button', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByTitle('Collapse')).toBeInTheDocument()
  })

  it('hides piano roll when collapsed', () => {
    const track = createSynthTrack('supersaw')
    track.collapsed = true
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.queryAllByTestId(/^synth-cell-/)).toHaveLength(0)
  })

  it('shows mini strip when collapsed', () => {
    const track = createSynthTrack('supersaw')
    track.collapsed = true
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getByTestId('synth-mini-strip')).toBeInTheDocument()
  })
})

describe('octave picker', () => {
  it('renders the current octave label', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    expect(screen.getAllByText('C3').length).toBeGreaterThan(0)
  })

  it('clicking > increases octave in store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    await user.click(screen.getByTitle('Octave up'))
    expect(useStore.getState().tracks[0].octave).toBe(4)
  })

  it('clicking < decreases octave in store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    await user.click(screen.getByTitle('Octave down'))
    expect(useStore.getState().tracks[0].octave).toBe(2)
  })

  it('shows only 12 rows (one octave) in piano roll', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} activeStep={null} />)
    // 12 rows × 16 steps = 192 cells
    expect(screen.getAllByTestId(/^synth-cell-/)).toHaveLength(192)
  })
})
