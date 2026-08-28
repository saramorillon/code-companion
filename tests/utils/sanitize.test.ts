import { AppState } from '../../src/types.js'
import { sanitize } from '../../src/utils/sanitize.js'

function mockAppState(): AppState {
  return {
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
  }
}

describe(sanitize, () => {
  it('should do nothing if data is not a record', () => {
    const state = mockAppState()
    sanitize(state, 'not a record')
    expect(state).toEqual(mockAppState())
  })

  it('should do nothing if data is an array', () => {
    const state = mockAppState()
    sanitize(state, [])
    expect(state).toEqual(mockAppState())
  })

  it('should do nothing if data is null', () => {
    const state = mockAppState()
    sanitize(state, null)
    expect(state).toEqual(mockAppState())
  })

  describe('fileOffsets', () => {
    it('should sanitize valid file offsets', () => {
      const state = mockAppState()
      sanitize(state, { fileOffsets: { 'file.jsonl': 10 } })
      expect(state.fileOffsets).toEqual({ 'file.jsonl': 10 })
    })

    it('should ignore non number offsets', () => {
      const state = mockAppState()
      sanitize(state, { fileOffsets: { 'file.jsonl': 'not a number' } })
      expect(state.fileOffsets).toEqual({})
    })

    it('should ignore non record fileOffsets', () => {
      const state = mockAppState()
      sanitize(state, { fileOffsets: 'not a record' })
      expect(state.fileOffsets).toEqual({})
    })
  })

  describe('tokens', () => {
    it('should sanitize valid tokens', () => {
      const state = mockAppState()
      sanitize(state, { tokens: { claude: 10 } })
      expect(state.tokens).toEqual({ claude: 10 })
    })

    it('should ignore non number tokens', () => {
      const state = mockAppState()
      sanitize(state, { tokens: { claude: 'not a number' } })
      expect(state.tokens).toEqual({})
    })

    it('should ignore non record tokens', () => {
      const state = mockAppState()
      sanitize(state, { tokens: 'not a record' })
      expect(state.tokens).toEqual({})
    })
  })

  describe('active', () => {
    it('should sanitize a valid active companion', () => {
      const state = mockAppState()
      sanitize(state, { active: { speciesId: 'pear', rarity: 'gold', tokens: 5 } })
      expect(state.active).toEqual({ speciesId: 'pear', rarity: 'gold', tokens: 5 })
    })

    it('should ignore active if speciesId is missing', () => {
      const state = mockAppState()
      sanitize(state, { active: { rarity: 'gold', tokens: 5 } })
      expect(state.active).toEqual(mockAppState().active)
    })

    it('should ignore active if rarity is invalid', () => {
      const state = mockAppState()
      sanitize(state, { active: { speciesId: 'pear', rarity: 'invalid', tokens: 5 } })
      expect(state.active).toEqual(mockAppState().active)
    })

    it('should ignore active if tokens is not a number', () => {
      const state = mockAppState()
      sanitize(state, { active: { speciesId: 'pear', rarity: 'gold', tokens: 'not a number' } })
      expect(state.active).toEqual(mockAppState().active)
    })

    it('should ignore non record active', () => {
      const state = mockAppState()
      sanitize(state, { active: 'not a record' })
      expect(state.active).toEqual(mockAppState().active)
    })
  })

  describe('harvests', () => {
    it('should sanitize valid harvests', () => {
      const state = mockAppState()
      sanitize(state, { harvests: [{ speciesId: 'pear', rarity: 'gold' }] })
      expect(state.harvests).toEqual([{ speciesId: 'pear', rarity: 'gold' }])
    })

    it('should ignore harvest entries with invalid rarity', () => {
      const state = mockAppState()
      sanitize(state, { harvests: [{ speciesId: 'pear', rarity: 'invalid' }] })
      expect(state.harvests).toEqual([])
    })

    it('should ignore harvest entries with missing speciesId', () => {
      const state = mockAppState()
      sanitize(state, { harvests: [{ rarity: 'gold' }] })
      expect(state.harvests).toEqual([])
    })

    it('should ignore non record harvest entries', () => {
      const state = mockAppState()
      sanitize(state, { harvests: ['not a record'] })
      expect(state.harvests).toEqual([])
    })

    it('should ignore non array harvests', () => {
      const state = mockAppState()
      sanitize(state, { harvests: 'not an array' })
      expect(state.harvests).toEqual([])
    })
  })

  describe('today', () => {
    it('should sanitize a valid today', () => {
      const state = mockAppState()
      sanitize(state, { today: { date: '2026-08-28', tokens: { claude: 10 } } })
      expect(state.today).toEqual({ date: '2026-08-28', tokens: { claude: 10 } })
    })

    it('should ignore non number tokens in today', () => {
      const state = mockAppState()
      sanitize(state, { today: { date: '2026-08-28', tokens: { claude: 'not a number' } } })
      expect(state.today).toEqual({ date: '2026-08-28', tokens: {} })
    })

    it('should ignore today if date is missing', () => {
      const state = mockAppState()
      sanitize(state, { today: { tokens: { claude: 10 } } })
      expect(state.today).toEqual(mockAppState().today)
    })

    it('should ignore non record today', () => {
      const state = mockAppState()
      sanitize(state, { today: 'not a record' })
      expect(state.today).toEqual(mockAppState().today)
    })
  })

  describe('weekHistory', () => {
    it('should sanitize valid history entries', () => {
      const state = mockAppState()
      sanitize(state, { weekHistory: [{ date: '2026-08-27', tokens: { claude: 10 } }] })
      expect(state.weekHistory).toEqual([{ date: '2026-08-27', tokens: { claude: 10 } }])
    })

    it('should ignore non number tokens in a history entry', () => {
      const state = mockAppState()
      sanitize(state, { weekHistory: [{ date: '2026-08-27', tokens: { claude: 'not a number' } }] })
      expect(state.weekHistory).toEqual([{ date: '2026-08-27', tokens: {} }])
    })

    it('should ignore history entries with missing date', () => {
      const state = mockAppState()
      sanitize(state, { weekHistory: [{ tokens: { claude: 10 } }] })
      expect(state.weekHistory).toEqual([])
    })

    it('should ignore non record history entries', () => {
      const state = mockAppState()
      sanitize(state, { weekHistory: ['not a record'] })
      expect(state.weekHistory).toEqual([])
    })

    it('should ignore non array weekHistory', () => {
      const state = mockAppState()
      sanitize(state, { weekHistory: 'not an array' })
      expect(state.weekHistory).toEqual([])
    })
  })

  describe('bestDay', () => {
    it('should sanitize a valid bestDay', () => {
      const state = mockAppState()
      sanitize(state, { bestDay: { date: '2026-08-27', tokens: { claude: 10 } } })
      expect(state.bestDay).toEqual({ date: '2026-08-27', tokens: { claude: 10 } })
    })

    it('should ignore non number tokens in bestDay', () => {
      const state = mockAppState()
      sanitize(state, { bestDay: { date: '2026-08-27', tokens: { claude: 'not a number' } } })
      expect(state.bestDay).toEqual({ date: '2026-08-27', tokens: {} })
    })

    it('should ignore bestDay if date is missing', () => {
      const state = mockAppState()
      sanitize(state, { bestDay: { tokens: { claude: 10 } } })
      expect(state.bestDay).toEqual(mockAppState().bestDay)
    })

    it('should ignore non record bestDay', () => {
      const state = mockAppState()
      sanitize(state, { bestDay: 'not a record' })
      expect(state.bestDay).toEqual(mockAppState().bestDay)
    })
  })
})
