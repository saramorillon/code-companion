import { PantryViewProvider } from '../../src/providers/PantryViewProvider.js'
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

describe(PantryViewProvider.prototype['buildState'], () => {
  it('should return null if view is undefined', () => {
    const provider = new PantryViewProvider()
    expect(provider['buildState'](mockAppState())).toBeNull()
  })

  it('should skip unknown species', () => {
    const provider = new PantryViewProvider()
    provider['view'] = {} as never
    provider['getTilesetUri'] = vi.fn().mockReturnValue('tilesetUri')
    const state = mockAppState()
    state.harvests.push({ speciesId: 'not found', rarity: 'normal' })
    expect(provider['buildState'](state)).toEqual({
      tilesetUri: 'tilesetUri',
      baskets: {},
    })
  })

  it('should return pantry props', () => {
    const provider = new PantryViewProvider()
    provider['view'] = {} as never
    provider['getTilesetUri'] = vi.fn().mockReturnValue('tilesetUri')
    const state = mockAppState()
    state.harvests.push({ speciesId: 'apple', rarity: 'normal' })
    expect(provider['buildState'](state)).toEqual({
      tilesetUri: 'tilesetUri',
      baskets: {
        'apple-normal': {
          rect: { x: 0, y: 208, width: 16, height: 16 },
          speciesName: 'Apple tree',
          category: 'tree',
          rarity: 'normal',
          count: 1,
        },
      },
    })
  })
})
