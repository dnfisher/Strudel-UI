import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayhead } from './usePlayhead'

beforeEach(() => {
  vi.useFakeTimers()
  // Provide a stable performance.now base
  vi.spyOn(performance, 'now').mockReturnValue(0)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('usePlayhead', () => {
  it('returns null when not playing', () => {
    const { result } = renderHook(() => usePlayhead(false, 120))
    expect(result.current).toBeNull()
  })

  it('returns a number 0-15 when playing', async () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const { result } = renderHook(() => usePlayhead(true, 120))
    act(() => { vi.advanceTimersByTime(16) })
    expect(result.current).toBeGreaterThanOrEqual(0)
    expect(result.current).toBeLessThan(16)
  })

  it('returns null again after switching from playing to stopped', () => {
    const { result, rerender } = renderHook(
      ({ playing }) => usePlayhead(playing, 120),
      { initialProps: { playing: true } }
    )
    act(() => { vi.advanceTimersByTime(16) })
    rerender({ playing: false })
    expect(result.current).toBeNull()
  })

  it('computes step 0 at time 0 with 120 bpm', () => {
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const { result } = renderHook(() => usePlayhead(true, 120))
    act(() => { vi.advanceTimersByTime(16) })
    expect(result.current).toBe(0)
  })
})
