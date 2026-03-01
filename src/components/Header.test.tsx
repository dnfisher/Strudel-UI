import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { useStore } from '../store/useStore'

vi.mock('../lib/strudelBridge', () => ({
  playCode: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
}))

import { playCode, stop } from '../lib/strudelBridge'

beforeEach(() => {
  useStore.setState({
    tracks: [],
    selectedTrackId: null,
    isPlaying: false,
    bpm: 120,
  })
  vi.clearAllMocks()
})

describe('Header', () => {
  it('renders the app title', () => {
    render(<Header />)
    expect(screen.getByText('Strudel UI')).toBeInTheDocument()
  })

  it('shows BPM label and input', () => {
    render(<Header />)
    expect(screen.getByText('BPM')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(120)
  })

  it('renders a play button when not playing', () => {
    render(<Header />)
    expect(screen.getByTitle('Play (Space)')).toBeInTheDocument()
  })

  it('renders a stop button when playing', () => {
    useStore.setState({ isPlaying: true })
    render(<Header />)
    expect(screen.getByTitle('Stop (Space)')).toBeInTheDocument()
  })

  it('clicking play button calls playCode and sets isPlaying to true', async () => {
    const user = userEvent.setup()
    // Add a track with an active step so generatePlayableCode returns non-empty code
    useStore.getState().addTrack('bd')
    useStore.getState().toggleStep(useStore.getState().tracks[0].id, 0)

    render(<Header />)
    await user.click(screen.getByTitle('Play (Space)'))

    await waitFor(() => {
      // playCode is called once from handlePlay and once from the re-evaluation effect
      expect(vi.mocked(playCode)).toHaveBeenCalled()
      expect(useStore.getState().isPlaying).toBe(true)
    })
  })

  it('clicking stop button calls stop() and sets isPlaying to false', async () => {
    const user = userEvent.setup()
    useStore.setState({ isPlaying: true })

    render(<Header />)
    await user.click(screen.getByTitle('Stop (Space)'))

    await waitFor(() => {
      expect(vi.mocked(stop)).toHaveBeenCalledTimes(1)
      expect(useStore.getState().isPlaying).toBe(false)
    })
  })

  it('does not call playCode when there are no tracks at all', async () => {
    const user = userEvent.setup()
    // No tracks → generatePlayableCode returns '' → handlePlay skips playCode

    render(<Header />)
    await user.click(screen.getByTitle('Play (Space)'))

    // Give the component time to settle
    await new Promise(r => setTimeout(r, 50))
    expect(vi.mocked(playCode)).not.toHaveBeenCalled()
    expect(useStore.getState().isPlaying).toBe(false)
  })

  it('changing BPM input fires setBpm with the new value', () => {
    render(<Header />)
    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '140' } })
    expect(useStore.getState().bpm).toBe(140)
  })

  it('spacebar on document.body triggers play', async () => {
    const user = userEvent.setup()
    useStore.getState().addTrack('bd')
    useStore.getState().toggleStep(useStore.getState().tracks[0].id, 0)

    render(<Header />)
    document.body.focus()
    await user.keyboard(' ')

    await waitFor(() => {
      expect(vi.mocked(playCode)).toHaveBeenCalled()
    })
  })

  it('spacebar on an input element does not trigger play', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Header />
        <input data-testid="other-input" />
      </div>
    )

    const input = screen.getByTestId('other-input')
    await user.click(input)
    await user.keyboard(' ')

    expect(vi.mocked(playCode)).not.toHaveBeenCalled()
  })
})
