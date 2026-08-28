import { CompanionViewProvider } from '../../src/providers/CompanionViewProvider.js'
import { AppState } from '../../src/types.js'

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

describe(CompanionViewProvider.prototype['buildState'], () => {
  it('should return null if view is undefined', () => {
    const provider = new CompanionViewProvider()
    expect(provider['buildState'](mockAppState())).toBeNull()
  })

  it('should return null if species cannot be found', () => {
    const provider = new CompanionViewProvider()
    provider['view'] = {} as never
    const state = mockAppState()
    state.active.speciesId = 'not found'
    expect(provider['buildState'](state)).toBeNull()
  })

  it('should return companion props', () => {
    const provider = new CompanionViewProvider()
    provider['view'] = {} as never
    provider['getTilesetUri'] = vi.fn().mockReturnValue('tilesetUri')
    const state = mockAppState()
    state.active.tokens = 75000
    expect(provider['buildState'](state)).toEqual({
      tilesetUri: 'tilesetUri',
      rect: { x: 0, y: 0, width: 64, height: 64 },
      speciesName: 'Apple tree',
      category: 'tree',
      rarity: 'normal',
      progress: 0.01,
      currentStage: 0,
      totalStages: 4,
      nextStageTokens: '75M',
    })
  })
})
