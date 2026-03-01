import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@strudel/web', () => ({
  initStrudel: vi.fn(),
}))

describe('strudelBridge', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Clean up any window globals set by the bridge
    const w = window as Record<string, unknown>
    delete w['evaluate']
    delete w['hush']
    delete w['samples']
  })

  it('ensureInit calls initStrudel exactly once', async () => {
    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockResolvedValue(undefined)

    const { ensureInit } = await import('./strudelBridge')
    await ensureInit()
    await ensureInit()

    expect(initStrudel).toHaveBeenCalledTimes(1)
  })

  it('ensureInit returns the same promise for concurrent calls', async () => {
    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockResolvedValue(undefined)

    const { ensureInit } = await import('./strudelBridge')
    await Promise.all([ensureInit(), ensureInit(), ensureInit()])

    expect(initStrudel).toHaveBeenCalledTimes(1)
  })

  it('ensureInit calls prebake with window.samples when available', async () => {
    const mockSamples = vi.fn().mockResolvedValue(undefined)
    ;(window as Record<string, unknown>)['samples'] = mockSamples

    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockImplementation(async (opts) => {
      // Simulate Strudel calling prebake
      await opts?.prebake?.()
    })

    const { ensureInit } = await import('./strudelBridge')
    await ensureInit()

    expect(mockSamples).toHaveBeenCalledWith('github:tidalcycles/dirt-samples')
  })

  it('ensureInit does not crash when window.samples is not a function', async () => {
    // window.samples is not set — prebake should be a no-op
    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockImplementation(async (opts) => {
      await opts?.prebake?.()
    })

    const { ensureInit } = await import('./strudelBridge')
    await expect(ensureInit()).resolves.toBeUndefined()
  })

  it('playCode calls window.hush then window.evaluate', async () => {
    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockResolvedValue(undefined)

    const mockHush = vi.fn()
    const mockEvaluate = vi.fn().mockResolvedValue(undefined)
    const w = window as Record<string, unknown>
    w['hush'] = mockHush
    w['evaluate'] = mockEvaluate

    const { playCode } = await import('./strudelBridge')
    await playCode('s("bd")')

    expect(mockHush).toHaveBeenCalledTimes(1)
    expect(mockEvaluate).toHaveBeenCalledWith('s("bd")')
  })

  it('playCode does not throw when hush/evaluate are not defined', async () => {
    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockResolvedValue(undefined)
    // window.hush and window.evaluate are not set

    const { playCode } = await import('./strudelBridge')
    await expect(playCode('s("bd")')).resolves.toBeUndefined()
  })

  it('stop is a no-op before initialization', async () => {
    const mockHush = vi.fn()
    ;(window as Record<string, unknown>)['hush'] = mockHush

    const { stop } = await import('./strudelBridge')
    await stop()

    expect(mockHush).not.toHaveBeenCalled()
  })

  it('stop calls window.hush after initialization', async () => {
    const { initStrudel } = await import('@strudel/web')
    vi.mocked(initStrudel).mockResolvedValue(undefined)

    const mockHush = vi.fn()
    const mockEvaluate = vi.fn().mockResolvedValue(undefined)
    const w = window as Record<string, unknown>
    w['hush'] = mockHush
    w['evaluate'] = mockEvaluate

    const { ensureInit, stop } = await import('./strudelBridge')
    await ensureInit()
    mockHush.mockClear()

    await stop()
    expect(mockHush).toHaveBeenCalledTimes(1)
  })
})
