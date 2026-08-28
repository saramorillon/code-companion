import { AbstractTracker } from '../../src/trackers/AbstractTracker.js'
import { AppState } from '../../src/types.js'

class TrackerImpl extends AbstractTracker {
  constructor() {
    super('test')
  }
  start = vi.fn()
  protected override _update = vi.fn()
}

describe(AbstractTracker.prototype.update, () => {
  it('should call _update with the given state', async () => {
    const tracker = new TrackerImpl()
    const state = {} as AppState
    await tracker.update(state)
    expect(tracker['_update']).toHaveBeenCalledWith(state)
  })

  it('should return the accumulated tokens', async () => {
    const tracker = new TrackerImpl()
    vi.mocked(tracker['_update']).mockImplementation(() => {
      tracker['tokens'] = 10
    })
    const result = await tracker.update({} as AppState)
    expect(result).toBe(10)
  })

  it('should reset tokens after update', async () => {
    const tracker = new TrackerImpl()
    vi.mocked(tracker['_update']).mockImplementation(() => {
      tracker['tokens'] = 10
    })
    await tracker.update({} as AppState)
    expect(tracker['tokens']).toBe(0)
  })
})
