import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { AtlasManager } from '../../src/manager/AtlasManager.js'
import { DataManager } from '../../src/manager/DataManager.js'
import { sanitize } from '../../src/utils/sanitize.js'

vi.mock(import('node:fs/promises'))
vi.mock(import('../../src/manager/AtlasManager.js'))
vi.mock(import('../../src/utils/sanitize.js'))

beforeEach(() => {
  vi.useFakeTimers({ now: 0 })
})

afterEach(() => {
  vi.useRealTimers()
})

describe(DataManager, () => {
  beforeEach(() => {
    vi.mocked(AtlasManager.pickRandomSpecies).mockReturnValue({
      speciesId: 'apple',
      rarity: 'normal',
      tokens: 0,
    })
  })

  it('should initialize the filepath', () => {
    const manager = new DataManager('dir')
    expect(manager['filePath']).toBe('dir/companion-state.json')
  })

  it('should initialize the state', () => {
    const manager = new DataManager('dir')
    expect(manager.state).toEqual({
      tokens: {},
      active: {
        speciesId: 'apple',
        rarity: 'normal',
        tokens: 0,
      },
      harvests: [],
      today: {
        date: '1970-01-01',
        tokens: {},
      },
      weekHistory: [],
      bestDay: {
        date: '1970-01-01',
        tokens: {},
      },
      fileOffsets: {},
    })
  })
})

describe(DataManager.prototype.loadData, () => {
  beforeEach(() => {
    vi.mocked(readFile).mockResolvedValue('{"prop":"value"}')
    vi.mocked(writeFile).mockResolvedValue()
  })

  it('should not sanitize data if file is not found', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error())
    const manager = new DataManager('dir')
    await manager.loadData()
    expect(sanitize).not.toHaveBeenCalled()
  })

  it('should not sanitize data if file contains invalid json', async () => {
    vi.mocked(readFile).mockResolvedValue('not json')
    const manager = new DataManager('dir')
    await manager.loadData()
    expect(sanitize).not.toHaveBeenCalled()
  })

  it('should write corrupt file if file contains invalid json', async () => {
    vi.mocked(readFile).mockResolvedValue('not json')
    const manager = new DataManager('dir')
    await manager.loadData()
    expect(writeFile).toHaveBeenCalledWith('dir/companion-state.json.corrupt', 'not json', 'utf8')
  })

  it('should not throw if writing corrupt file fails', async () => {
    vi.mocked(readFile).mockResolvedValue('not json')
    vi.mocked(writeFile).mockRejectedValue(new Error())
    const manager = new DataManager('dir')
    await expect(manager.loadData()).resolves.not.toThrow()
  })

  it('should sanitize data if file contains valid json', async () => {
    const manager = new DataManager('dir')
    await manager.loadData()
    expect(sanitize).toHaveBeenCalledWith(manager.state, { prop: 'value' })
  })
})

describe(DataManager.prototype.saveData, () => {
  beforeEach(() => {
    vi.mocked(mkdir).mockResolvedValue('')
    vi.mocked(writeFile).mockResolvedValue()
  })

  it('should create saves directory', async () => {
    const manager = new DataManager('dir')
    await manager.saveData()
    expect(mkdir).toHaveBeenCalledWith('dir', { recursive: true })
  })

  it('should write data', async () => {
    const manager = new DataManager('dir')
    await manager.saveData()
    expect(writeFile).toHaveBeenCalledWith(
      'dir/companion-state.json',
      '{"tokens":{},"harvests":[],"today":{"date":"1970-01-01","tokens":{}},"weekHistory":[],"bestDay":{"date":"1970-01-01","tokens":{}},"fileOffsets":{}}',
      'utf8',
    )
  })
})

describe(DataManager.prototype.update, () => {
  function createManager() {
    const manager = new DataManager('dir')
    manager.updateToday = vi.fn()
    manager.updateHistory = vi.fn()
    manager.updateBestDay = vi.fn()
    manager.updateActive = vi.fn()
    return manager
  }

  it('should initiliaze new tokens counter', async () => {
    const manager = createManager()
    manager.update('name', 10)
    expect(manager.state.tokens).toHaveProperty('name', 10)
  })

  it('should add tokens to existing tokens counter', async () => {
    const manager = createManager()
    manager.state.tokens['name'] = 5
    manager.update('name', 10)
    expect(manager.state.tokens).toHaveProperty('name', 15)
  })

  it("should udpate today's tokens", () => {
    const manager = createManager()
    manager.update('name', 10)
    expect(manager.updateToday).toHaveBeenCalledWith('name', 10)
  })

  it('should udpate history', () => {
    const manager = createManager()
    manager.update('name', 10)
    expect(manager.updateHistory).toHaveBeenCalled()
  })

  it('should udpate best day', () => {
    const manager = createManager()
    manager.update('name', 10)
    expect(manager.updateBestDay).toHaveBeenCalled()
  })

  it('should udpate active companion', () => {
    const manager = createManager()
    manager.update('name', 10)
    expect(manager.updateActive).toHaveBeenCalledWith(10)
  })
})

describe(DataManager.prototype.updateToday, () => {
  it('should reset today state if date differs', () => {
    const manager = new DataManager('dir')
    manager.state.today = { date: '0', tokens: { name: 20 } }
    manager.updateToday('name', 10)
    expect(manager.state.today.date).toBe('1970-01-01')
    expect(manager.state.today.tokens).toHaveProperty('name', 10)
  })

  it('should initiliaze new tokens counter if date is identical', () => {
    const manager = new DataManager('dir')
    manager.updateToday('name', 10)
    expect(manager.state.today.tokens).toHaveProperty('name', 10)
  })

  it('should add tokens to existing tokens counter if date is identical', () => {
    const manager = new DataManager('dir')
    manager.state.today.tokens = { name: 5 }
    manager.updateToday('name', 10)
    expect(manager.state.today.tokens).toHaveProperty('name', 15)
  })
})

describe(DataManager.prototype.updateHistory, () => {
  it('should remove history entries older than 7 days', () => {
    const manager = new DataManager('dir')
    manager.state.weekHistory = [
      { date: '1969-12-24', tokens: { name: 5 } },
      { date: '1969-12-25', tokens: { name: 5 } },
    ]
    manager.updateHistory()
    expect(manager.state.weekHistory).toEqual([{ date: '1969-12-25', tokens: { name: 5 } }])
  })

  it('should create a new history entry for today if none exists', () => {
    const manager = new DataManager('dir')
    manager.state.today.tokens = { name: 10 }
    manager.updateHistory()
    expect(manager.state.weekHistory).toEqual([{ date: '1970-01-01', tokens: { name: 10 } }])
  })

  it("should initiliaze new tokens counter in today's history entry", () => {
    const manager = new DataManager('dir')
    manager.state.weekHistory = [{ date: '1970-01-01', tokens: { other: 5 } }]
    manager.state.today.tokens = { name: 10 }
    manager.updateHistory()
    expect(manager.state.weekHistory).toEqual([{ date: '1970-01-01', tokens: { other: 5, name: 10 } }])
  })

  it('should add tokens to existing history entry for today', () => {
    const manager = new DataManager('dir')
    manager.state.weekHistory = [{ date: '1970-01-01', tokens: { name: 5 } }]
    manager.state.today.tokens = { name: 10 }
    manager.updateHistory()
    expect(manager.state.weekHistory).toEqual([{ date: '1970-01-01', tokens: { name: 15 } }])
  })
})

describe(DataManager.prototype.updateBestDay, () => {
  it('should replace best day if today has more tokens', () => {
    const manager = new DataManager('dir')
    manager.state.bestDay = { date: '1969-12-25', tokens: { name: 5 } }
    manager.state.today = { date: '1970-01-01', tokens: { name: 10 } }
    manager.updateBestDay()
    expect(manager.state.bestDay).toEqual({ date: '1970-01-01', tokens: { name: 10 } })
  })

  it('should not replace best day if today has fewer tokens', () => {
    const manager = new DataManager('dir')
    manager.state.bestDay = { date: '1969-12-25', tokens: { name: 20 } }
    manager.state.today = { date: '1970-01-01', tokens: { name: 10 } }
    manager.updateBestDay()
    expect(manager.state.bestDay).toEqual({ date: '1969-12-25', tokens: { name: 20 } })
  })

  it('should not replace best day if today has the same amount of tokens', () => {
    const manager = new DataManager('dir')
    manager.state.bestDay = { date: '1969-12-25', tokens: { name: 10 } }
    manager.state.today = { date: '1970-01-01', tokens: { name: 10 } }
    manager.updateBestDay()
    expect(manager.state.bestDay).toEqual({ date: '1969-12-25', tokens: { name: 10 } })
  })
})

describe(DataManager.prototype.updateActive, () => {
  beforeEach(() => {
    vi.mocked(AtlasManager.getSpeciesById).mockReturnValue({ id: 'apple', category: 'crop' } as never)
    vi.mocked(AtlasManager.pickRandomSpecies).mockReturnValue({ speciesId: 'pear', rarity: 'gold', tokens: 0 })
  })

  it("should add tokens to active companion's tokens", () => {
    const manager = new DataManager('dir')
    manager.updateActive(10)
    expect(manager.state.active.tokens).toBe(10)
  })

  it('should do nothing more if species is not found', () => {
    vi.mocked(AtlasManager.getSpeciesById).mockReturnValue(undefined)
    const manager = new DataManager('dir')
    manager.updateActive(10)
    expect(manager.state.harvests).toEqual([])
  })

  it('should not harvest if tokens are below the last stage threshold', () => {
    const manager = new DataManager('dir')
    manager.state.active = { speciesId: 'apple', rarity: 'normal', tokens: 0 }
    manager.updateActive(10)
    expect(manager.state.harvests).toEqual([])
  })

  it('should harvest and pick a new active companion once the last stage threshold is reached', () => {
    const manager = new DataManager('dir')
    manager.state.active = { speciesId: 'apple', rarity: 'normal', tokens: 0 }
    manager.updateActive(300_000_000)
    expect(manager.state.harvests).toEqual([{ speciesId: 'apple', rarity: 'normal' }])
    expect(manager.state.active.speciesId).toBe('pear')
    expect(manager.state.active.rarity).toBe('gold')
  })

  it('should carry over overflow tokens to the newly picked companion', () => {
    const manager = new DataManager('dir')
    manager.state.active = { speciesId: 'apple', rarity: 'normal', tokens: 0 }
    manager.updateActive(300000005)
    expect(manager.state.active.tokens).toBe(5)
  })
})
